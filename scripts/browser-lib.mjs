/**
 * Shared browser bootstrap for the check scripts. It uses the Chromium that is
 * already in the Playwright cache on this machine; set CHROMIUM_PATH to point at
 * a different binary.
 */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const cache = path.join(os.homedir(), '.cache', 'ms-playwright');
  if (!existsSync(cache)) return undefined;
  const candidates = readdirSync(cache)
    .filter((entry) => entry.startsWith('chromium-'))
    .map((entry) => path.join(cache, entry, 'chrome-linux64', 'chrome'))
    .filter((file) => existsSync(file));
  return candidates[0];
}

export async function launch(options = {}) {
  const executablePath = chromiumPath();
  // Escape hatch for machines where Chromium's shared libraries are not
  // installed system wide: point EXTRA_LIB_PATH at a directory holding them.
  const env = process.env.EXTRA_LIB_PATH
    ? {
        ...process.env,
        LD_LIBRARY_PATH: [process.env.EXTRA_LIB_PATH, process.env.LD_LIBRARY_PATH]
          .filter(Boolean)
          .join(':'),
      }
    : undefined;
  return chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    ...(env ? { env } : {}),
    ...options,
  });
}

/**
 * Serves dist/ so checks run against the real build output. Text responses are
 * compressed and static assets get a long cache header, so a local performance
 * measurement is not skewed by transfer characteristics no real host has.
 */
export async function serveDist(port = 4321) {
  const { createServer } = await import('node:http');
  const { readFile, stat } = await import('node:fs/promises');
  const { gzipSync, brotliCompressSync } = await import('node:zlib');
  const dist = path.join(process.cwd(), 'dist');
  const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.woff2': 'font/woff2',
    '.ico': 'image/x-icon',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
  };

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    let filePath = path.join(dist, decodeURIComponent(url.pathname));
    try {
      const info = await stat(filePath).catch(() => undefined);
      if (!info || info.isDirectory()) filePath = path.join(filePath, 'index.html');
      let body = await readFile(filePath);
      const extension = path.extname(filePath);
      const contentType = TYPES[extension] ?? 'application/octet-stream';
      const headers = {
        'Content-Type': contentType,
        'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      };
      const compressible = /^(text\/|application\/(json|xml|manifest\+json)|image\/svg)/.test(contentType);
      const accepted = String(request.headers['accept-encoding'] ?? '');
      if (compressible && accepted.includes('br')) {
        body = brotliCompressSync(body);
        headers['Content-Encoding'] = 'br';
      } else if (compressible && accepted.includes('gzip')) {
        body = gzipSync(body);
        headers['Content-Encoding'] = 'gzip';
      }
      headers['Content-Length'] = body.length;
      response.writeHead(200, headers);
      response.end(body);
    } catch {
      try {
        const body = await readFile(path.join(dist, '404.html'));
        response.writeHead(404, { 'Content-Type': TYPES['.html'] });
        response.end(body);
      } catch {
        // Always answer with a valid document. A bare text body would be
        // wrapped in <pre> by the browser and could show up as a spurious
        // landmark violation in the accessibility scan.
        console.warn(`serveDist: could not read ${filePath}`);
        response.writeHead(404, { 'Content-Type': TYPES['.html'] });
        response.end('<!doctype html><html lang="en"><body><main>Not found</main></body></html>');
      }
    }
  });

  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(() => resolve(undefined))),
  };
}
