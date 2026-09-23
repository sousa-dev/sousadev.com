/**
 * Proposal form delivery. Runtime-agnostic: it takes a standard Request and
 * returns a standard Response, so the same code runs behind a Cloudflare Pages
 * function (functions/api/proposal.js) or a Vercel function (api/proposal.mjs).
 * It is deliberately outside the Astro static build: the site itself renders to
 * plain HTML with no server runtime.
 *
 * Rules this file exists to enforce:
 *   - server-side validation of the same contract the browser validates;
 *   - a honeypot field and a rate limit;
 *   - no credentials in client code, and no message bodies in logs;
 *   - when no delivery provider is configured it answers 503 and says nothing
 *     was sent. It never reports success it cannot prove.
 *
 * Required environment variables for real delivery:
 *   RESEND_API_KEY   API key, server side only
 *   PROPOSAL_TO      recipient, hello@sousadev.com
 *   PROPOSAL_FROM    verified sender for the domain
 */

const MAX = { name: 120, email: 200, company: 120, message: 4000 };
const MIN_MESSAGE = 10;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
/**
 * Best-effort in-memory limiter. It is per isolate, so it slows a single
 * client but is not a cluster-wide guarantee. Before launch, back this with the
 * platform's KV or a durable counter (see docs/brand-revamp/LAUNCH.md).
 */
const hits = new Map();

function rateLimited(key, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((time) => now - time < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT.max;
}

function clientKey(request) {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

async function readFields(request) {
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    const body = await request.json();
    return body && typeof body === 'object' ? body : {};
  }
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

function clean(value, limit) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

export function validate(fields) {
  const data = {
    name: clean(fields.name, MAX.name),
    email: clean(fields.email, MAX.email),
    company: clean(fields.company, MAX.company),
    message: clean(fields.message, MAX.message),
    locale: fields.locale === 'pt' ? 'pt' : 'en',
  };
  const problems = [];
  if (!data.name) problems.push('name');
  if (!EMAIL.test(data.email)) problems.push('email');
  if (data.message.length < MIN_MESSAGE) problems.push('message');
  return { data, problems };
}

const COPY = {
  en: {
    lang: 'en',
    okTitle: 'Received.',
    okBody: 'It went straight to the lead engineer.',
    errTitle: 'That did not send.',
    back: 'Back to the site',
    backHref: '/contact',
    errors: {
      malformed: 'The submission could not be read.',
      rejected: 'The submission was rejected.',
      throttled: 'Too many messages. Please try again shortly.',
      invalid: 'Some fields need fixing.',
      undelivered: 'The message was not sent. Please email hello@sousadev.com directly.',
    },
  },
  pt: {
    lang: 'pt-PT',
    okTitle: 'Mensagem recebida.',
    okBody: 'A sua mensagem foi enviada diretamente ao engenheiro principal.',
    errTitle: 'Não foi possível enviar.',
    back: 'Voltar ao site',
    backHref: '/pt/contact',
    errors: {
      malformed: 'Não foi possível ler os dados enviados.',
      rejected: 'O envio foi recusado.',
      throttled: 'Recebemos demasiadas tentativas de envio. Aguarde um pouco e tente novamente.',
      invalid: 'Verifique os campos do formulário.',
      undelivered: 'A mensagem não foi enviada. Escreva-nos diretamente para hello@sousadev.com.',
    },
  },
};

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );

/** Plain HTML answer for a browser that posted the form without JavaScript. */
function htmlResponse({ status, locale, ok, detail }) {
  const copy = COPY[locale] ?? COPY.en;
  const heading = ok ? copy.okTitle : copy.errTitle;
  const body = ok ? copy.okBody : detail;
  const page = `<!doctype html>
<html lang="${copy.lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(heading)}</title>
<style>
  body{margin:0;background:#0A1014;color:#F6F8F7;font:17px/1.6 system-ui,sans-serif;
       display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}
  main{max-width:520px;display:flex;flex-direction:column;gap:12px}
  h1{font-size:32px;margin:0;letter-spacing:-.025em}
  p{margin:0;color:#AFBDBE}
  a{color:#37D97A}
</style>
</head>
<body><main>
<h1>${escapeHtml(heading)}</h1>
<p>${escapeHtml(body)}</p>
<p><a href="${copy.backHref}">${escapeHtml(copy.back)}</a></p>
</main></body>
</html>
`;
  return new Response(page, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function deliver(data, env) {
  const key = env.RESEND_API_KEY;
  const to = env.PROPOSAL_TO;
  const from = env.PROPOSAL_FROM;
  if (!key || !to || !from) return { ok: false, reason: 'unconfigured' };

  const lines = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.company ? `Company: ${data.company}` : null,
    `Language: ${data.locale}`,
    '',
    data.message,
  ].filter((line) => line !== null);

  let response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: data.email,
        subject: `Proposal request: ${data.name}`,
        text: lines.join('\n'),
      }),
    });
  } catch {
    return { ok: false, reason: 'provider-unreachable' };
  }
  if (!response.ok) return { ok: false, reason: `provider-${response.status}` };
  return { ok: true };
}

export async function handleProposal(request, env = {}) {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  const fail = (status, code, locale, detailKey = code) =>
    wantsJson
      ? jsonResponse(status, { error: code })
      : htmlResponse({ status, locale, ok: false, detail: COPY[locale]?.errors[detailKey] ?? COPY.en.errors.undelivered });

  if (request.method !== 'POST') {
    return wantsJson
      ? jsonResponse(405, { error: 'method-not-allowed' })
      : htmlResponse({ status: 405, locale: 'en', ok: false, detail: 'Method not allowed.' });
  }

  let fields;
  try {
    fields = await readFields(request);
  } catch {
    return fail(400, 'malformed', 'en');
  }

  const { data, problems } = validate(fields);

  // Honeypot: only automated clients fill a field no human can see.
  if (clean(fields.website, 200)) {
    console.log('proposal rejected: honeypot');
    return fail(400, 'rejected', data.locale);
  }

  if (rateLimited(clientKey(request))) {
    console.log('proposal rejected: rate limit');
    return fail(429, 'rate-limited', data.locale, 'throttled');
  }

  if (problems.length > 0) {
    // Field names only. The message body is never logged.
    console.log(`proposal invalid: ${problems.join(',')}`);
    return wantsJson
      ? jsonResponse(422, { error: 'invalid', fields: problems })
      : htmlResponse({ status: 422, locale: data.locale, ok: false, detail: COPY[data.locale].errors.invalid });
  }

  const result = await deliver(data, env);
  if (!result.ok) {
    console.log(`proposal not delivered: ${result.reason}`);
    const status = result.reason === 'unconfigured' ? 503 : 502;
    return fail(status, result.reason, data.locale, 'undelivered');
  }

  console.log('proposal delivered');
  return wantsJson
    ? jsonResponse(200, { ok: true })
    : htmlResponse({ status: 200, locale: data.locale, ok: true });
}
