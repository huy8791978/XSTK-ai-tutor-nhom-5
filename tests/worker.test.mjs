import { test } from 'node:test';
import assert from 'node:assert/strict';
import { admit, settle, estimateTokens, pacificDay } from '../worker/limits.js';
import { buildRequest, extractJson } from '../worker/prompts.js';

const empty = { window: [], day: '', dayCount: 0 };
const L = { rpm: 3, tpm: 1000, rpd: 5 };
const T0 = Date.UTC(2026, 9, 19, 12, 0, 0);

test('admits until RPM is full, then reports retryAfter', () => {
  let s = empty;
  for (let i = 0; i < 3; i++) {
    const r = admit(s, { ...L, now: T0 + i * 1000, tokens: 10 });
    assert.equal(r.ok, true); s = r.state;
  }
  const r = admit(s, { ...L, now: T0 + 5000, tokens: 10 });
  assert.equal(r.ok, false); assert.equal(r.reason, 'rpm');
  assert.equal(r.retryAfter, 55); // oldest entry expires at T0+60s
  assert.equal(admit(r.state, { ...L, now: T0 + 60_001, tokens: 10 }).ok, true);
});

test('blocks when tokens would exceed TPM', () => {
  const s = admit(empty, { ...L, now: T0, tokens: 900 }).state;
  const r = admit(s, { ...L, now: T0 + 1000, tokens: 200 });
  assert.equal(r.ok, false); assert.equal(r.reason, 'tpm');
  assert.equal(admit(s, { ...L, now: T0 + 1000, tokens: 100 }).ok, true);
});

test('RPD caps the day and resets on a new Pacific day', () => {
  let s = { window: [], day: pacificDay(T0), dayCount: 5 };
  const r = admit(s, { ...L, now: T0, tokens: 1 });
  assert.equal(r.ok, false); assert.equal(r.reason, 'rpd'); assert.ok(r.retryAfter > 0);
  assert.equal(admit(s, { ...L, now: T0 + 86_400_000, tokens: 1 }).ok, true);
});

test('settle replaces the estimate with the actual count', () => {
  const s = admit(empty, { ...L, now: T0, tokens: 900 }).state;
  const s2 = settle(s, { t: T0, actual: 100 });
  assert.equal(admit(s2, { ...L, now: T0 + 1, tokens: 800 }).ok, true);
});

test('estimateTokens counts text, files and output budget', () => {
  assert.equal(estimateTokens(6, 1, 100), 2 + 1500 + 100);
});

test('buildRequest rejects unknown tasks, bad files and too many files', () => {
  assert.throws(() => buildRequest('chat', {}), /không hợp lệ/);
  assert.throws(() => buildRequest('grade', { files: [{ mimeType: 'text/html', data: 'x' }] }), /Chỉ nhận/);
  const f = { mimeType: 'image/png', data: 'x' };
  assert.throws(() => buildRequest('grade', { files: [f, f, f, f] }), /Tối đa/);
});

test('buildRequest attaches files and asks for JSON', () => {
  const { body, fileCount } = buildRequest('grade', { problem: 'Tính P(A)', files: [{ mimeType: 'application/pdf', data: 'QUJD' }] });
  assert.equal(fileCount, 1);
  assert.equal(body.contents[0].parts[1].inlineData.mimeType, 'application/pdf');
  assert.equal(body.generationConfig.responseMimeType, 'application/json');
});

test('strategy prompt forbids the final answer', () => {
  assert.match(buildRequest('strategy', { problem: 'x' }).body.contents[0].parts[0].text, /KHÔNG đưa đáp số/);
});

test('extractJson tolerates fences and prose', () => {
  assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJson('Đây: {"b":[1,2]} xong'), { b: [1, 2] });
  assert.throws(() => extractJson('không có json'), /định dạng/);
});
