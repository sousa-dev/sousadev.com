/**
 * Unit tests for the proposal endpoint. Run with `npm run test:server`.
 * No network calls: delivery is only reached when the environment is
 * configured, and these tests never configure a real provider.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { handleProposal, validate } from './proposal-handler.mjs';

const form = (fields) => {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  return body;
};

const post = (fields, { json = true, ip = '203.0.113.1' } = {}) =>
  new Request('https://sousadev.com/api/proposal', {
    method: 'POST',
    headers: {
      ...(json ? { Accept: 'application/json' } : { Accept: 'text/html' }),
      'cf-connecting-ip': ip,
    },
    body: form(fields),
  });

const valid = {
  name: 'Test Person',
  email: 'test@example.com',
  message: 'We need an internal scheduling tool built and hosted.',
  locale: 'en',
};

test('validate trims, caps and reports the failing fields', () => {
  const { data, problems } = validate({ name: '  Ana  ', email: 'nope', message: 'short', locale: 'pt' });
  assert.equal(data.name, 'Ana');
  assert.equal(data.locale, 'pt');
  assert.deepEqual(problems, ['email', 'message']);
});

test('an unknown locale falls back to English rather than being echoed', () => {
  const { data } = validate({ ...valid, locale: 'de' });
  assert.equal(data.locale, 'en');
});

test('GET is rejected', async () => {
  const response = await handleProposal(
    new Request('https://sousadev.com/api/proposal', { headers: { Accept: 'application/json' } }),
    {},
  );
  assert.equal(response.status, 405);
});

test('missing fields answer 422 and name them', async () => {
  const response = await handleProposal(post({ name: '', email: 'x', message: '' }), {});
  assert.equal(response.status, 422);
  const body = await response.json();
  assert.deepEqual(body.fields, ['name', 'email', 'message']);
});

test('a filled honeypot is rejected without being reported as sent', async () => {
  const response = await handleProposal(post({ ...valid, website: 'http://spam.example' }), {});
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, 'rejected');
  assert.notEqual(body.ok, true);
});

test('with no provider configured it answers 503 and never claims success', async () => {
  const response = await handleProposal(post(valid, { ip: '203.0.113.2' }), {});
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error, 'unconfigured');
  assert.equal(body.ok, undefined);
});

test('a partially configured provider is still treated as unconfigured', async () => {
  const response = await handleProposal(post(valid, { ip: '203.0.113.3' }), {
    RESEND_API_KEY: 'key',
  });
  assert.equal(response.status, 503);
});

test('the rate limit trips after five requests from one client', async () => {
  const ip = '203.0.113.99';
  const statuses = [];
  for (let attempt = 0; attempt < 7; attempt += 1) {
    const response = await handleProposal(post(valid, { ip }), {});
    statuses.push(response.status);
  }
  assert.equal(statuses.filter((status) => status === 429).length, 2);
  assert.equal(statuses.at(-1), 429);
});

test('a browser without JavaScript gets a localised HTML answer, not JSON', async () => {
  const response = await handleProposal(post({ ...valid, locale: 'pt' }, { json: false, ip: '203.0.113.4' }), {});
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
  const html = await response.text();
  assert.match(html, /lang="pt-PT"/);
  assert.match(html, /hello@sousadev\.com/);
  assert.match(html, /A mensagem não foi enviada/);
  assert.doesNotMatch(html, /The message was not sent/);
  assert.doesNotMatch(html, /Recebido/);
});

test('validation errors without JavaScript are localised in Portuguese', async () => {
  const response = await handleProposal(
    post({ name: '', email: 'x', message: '', locale: 'pt' }, { json: false, ip: '203.0.113.6' }),
    {},
  );
  assert.equal(response.status, 422);
  const html = await response.text();
  assert.match(html, /Verifique os campos do formulário/);
  assert.doesNotMatch(html, /Some fields need fixing/);
});

test('submitted values are escaped rather than reflected into the HTML answer', async () => {
  const response = await handleProposal(
    post({ ...valid, name: '<script>alert(1)</script>' }, { json: false, ip: '203.0.113.5' }),
    {},
  );
  const html = await response.text();
  assert.doesNotMatch(html, /<script>alert/);
});
