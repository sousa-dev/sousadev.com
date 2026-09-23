/**
 * Plain Node adapter for the proposal endpoint, used when the site is
 * self-hosted: Caddy serves dist/ and proxies /api/proposal here
 * (deploy/Caddyfile, deploy/sousadev-proposal.service). No dependencies.
 *
 * It listens on loopback only and trusts the X-Real-IP header, which Caddy
 * sets from the connecting address. Configuration comes from the environment:
 *   PORT, HOST       listen address, default 127.0.0.1:8787
 *   RESEND_API_KEY, PROPOSAL_TO, PROPOSAL_FROM   see proposal-handler.mjs
 */
import http from 'node:http';
import { handleProposal } from './proposal-handler.mjs';

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? '127.0.0.1';
const MAX_BODY = 64 * 1024;

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('body too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function toRequest(req, body) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    headers.set(name, Array.isArray(value) ? value.join(', ') : value);
  }
  // Not behind Cloudflare: never let a client choose its own rate-limit key.
  headers.delete('cf-connecting-ip');
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  return new Request(url, { method: req.method, headers, body: hasBody ? body : undefined });
}

async function send(res, response) {
  res.statusCode = response.status;
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}

const server = http.createServer(async (req, res) => {
  const pathname = (req.url ?? '/').split('?')[0];
  if (pathname !== '/api/proposal') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found\n');
    return;
  }
  try {
    const body = await readBody(req);
    await send(res, await handleProposal(toRequest(req, body), process.env));
  } catch (error) {
    // The client (or Caddy's body limit) hung up mid-request: nobody to answer.
    if (error?.code === 'ECONNRESET') return;
    const status = error?.status ?? 500;
    if (status === 500) console.error('proposal server error:', error?.message ?? error);
    if (!res.headersSent) res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(status === 413 ? 'Payload too large\n' : 'Server error\n');
  }
});

server.requestTimeout = 15_000;
server.listen(PORT, HOST, () => console.log(`proposal endpoint listening on ${HOST}:${PORT}`));

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
