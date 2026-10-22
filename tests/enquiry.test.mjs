import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { validate, buildMessage, buildConfirmation } from '../api/enquiry.js';

const good = { submissionId: 'abc-123', test: 'mens', name: 'A Person', email: 'a@example.com', phone: '07700 900123', clinic: 'Fulham', date: '2027-01-05', notes: 'Mornings', consent: true, website: '' };
const ENV = { RESEND_API_KEY: 'k', ENQUIRY_TO: 'team@example.com', ENQUIRY_FROM: 'Site <site@example.com>' };

function call(method, body, env = {}) {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  for (const k of ['RESEND_API_KEY', 'ENQUIRY_TO', 'ENQUIRY_FROM', 'RESEND_API_URL']) if (!(k in env)) delete process.env[k];
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b ? JSON.parse(b) : null; } };
  return handler({ method, body }, res).then(() => { process.env = saved; return res; });
}

test('validate accepts a complete enquiry and carries no date of birth', () => {
  const { data, fields } = validate({ ...good, dob: '1980-01-01', dateOfBirth: '1980-01-01' });
  assert.deepEqual(fields, {});
  assert.equal('dob' in data, false);
  assert.equal('dateOfBirth' in data, false);
  assert.equal(JSON.stringify(buildMessage(data, ENV)).includes('1980'), false);
});

test('validate reports each missing field', () => {
  const { fields } = validate({ test: 'x', name: '', email: 'nope', phone: '1', consent: false });
  assert.deepEqual(Object.keys(fields).sort(), ['consent', 'email', 'name', 'phone', 'test']);
});

test('GET is rejected', async () => {
  const r = await call('GET');
  assert.equal(r.statusCode, 405);
});

test('invalid enquiry returns 422 with field messages', async () => {
  const r = await call('POST', { ...good, email: 'bad' }, ENV);
  assert.equal(r.statusCode, 422);
  assert.ok(r.body.fields.email);
});

test('missing delivery configuration returns 503 and never reports success', async () => {
  const r = await call('POST', good, {});
  assert.equal(r.statusCode, 503);
  assert.notEqual(r.body.ok, true);
});

test('honeypot is acknowledged without contacting the provider', async () => {
  let called = false;
  const orig = globalThis.fetch; globalThis.fetch = async () => { called = true; return new Response('{}'); };
  const r = await call('POST', { ...good, website: 'http://spam' }, ENV);
  globalThis.fetch = orig;
  assert.equal(r.statusCode, 200); assert.equal(called, false);
});

test('success only when the provider accepts; idempotency key and reply-to are sent', async () => {
  let seen;
  const orig = globalThis.fetch;
  globalThis.fetch = async (url, init) => { seen = seen || { url, init }; return new Response('{"id":"1"}', { status: 200 }); };
  const r = await call('POST', good, ENV);
  globalThis.fetch = orig;
  assert.equal(r.statusCode, 200); assert.equal(r.body.ok, true);
  assert.equal(seen.init.headers['Idempotency-Key'], 'enquiry-abc-123');
  const sent = JSON.parse(seen.init.body);
  assert.equal(sent.reply_to, 'a@example.com');
  assert.equal(sent.to[0], 'team@example.com');
  assert.match(sent.subject, /Men’s Health Check/);
});

test('provider rejection or network failure returns 502, not success', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => new Response('no', { status: 401 });
  let r = await call('POST', good, ENV);
  assert.equal(r.statusCode, 502);
  globalThis.fetch = async () => { throw new Error('network'); };
  r = await call('POST', good, ENV);
  globalThis.fetch = orig;
  assert.equal(r.statusCode, 502);
});

test('html in fields is escaped in the email body', () => {
  const m = buildMessage({ ...good, name: '<b>x</b>', notes: '<script>1</script>' }, ENV);
  assert.equal(m.html.includes('<script>'), false);
  assert.ok(m.html.includes('&lt;b&gt;'));
});

test('phone numbers with letters are rejected', () => {
  const { fields } = validate({ ...good, phone: 'call me maybe 123' });
  assert.ok(fields.phone);
});

test('customer acknowledgement is short, personal, escaped and never implies a booking', () => {
  const m = buildConfirmation({ ...good, name: 'Jane <b>Smith' }, ENV);
  assert.equal(m.to[0], good.email);
  assert.equal(m.reply_to, ENV.ENQUIRY_TO);
  assert.match(m.text, /^Thanks, Jane\./);
  assert.match(m.text, /isn’t a confirmed booking/);
  assert.equal(m.html.includes('<b>'), false);
  assert.equal(/--|—|–/.test(m.text), false);
  assert.ok(m.text.length < 700);
});

test('a failed acknowledgement does not fail an enquiry the team already has', async () => {
  const orig = globalThis.fetch; let n = 0;
  globalThis.fetch = async () => { n += 1; if (n === 2) throw new Error('boom'); return new Response('{"id":"1"}'); };
  process.env.RESEND_API_KEY = 'k'; process.env.ENQUIRY_TO = 't@example.com'; process.env.ENQUIRY_FROM = 'f@example.com';
  const res = { setHeader() {}, end(b) { this.body = b; } };
  await handler({ method: 'POST', body: good }, res);
  globalThis.fetch = orig;
  assert.equal(res.statusCode, 200);
  assert.equal(n, 2);
});

test('both emails carry the logo from an absolute https URL, the NHS and 999 line, and a plain text version', () => {
  const env = { ...ENV, PUBLIC_SITE_URL: 'https://example.test/' };
  for (const m of [buildMessage(good, env), buildConfirmation(good, env)]) {
    assert.match(m.html, /<img src="https:\/\/example\.test\/brand\/email-logo\.png"[^>]*alt="Quantum BioTesting"/);
    assert.match(m.html, /not a substitute for NHS services\. In a medical emergency, call 999\./);
    assert.ok(m.text.length > 100);
    assert.equal(/<[a-z]/i.test(m.text), false);
  }
});

test('team email has a reply button, uses the accent colour of the chosen check and escapes the reply address', () => {
  const w = buildMessage({ ...good, test: 'womens', email: 'a"b@example.com' }, ENV);
  assert.match(w.html, /Reply to A/);
  assert.ok(w.html.includes('#d58aa9'));
  assert.equal(w.html.includes('mailto:a"b'), false);
  assert.ok(buildMessage(good, ENV).html.includes('#5b86c9'));
});
