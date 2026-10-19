import { test } from 'node:test';
import assert from 'node:assert/strict';
import { md, esc } from '../public/js/md.js';
import { summarize, fmtScore, newSerial, insightPayload } from '../public/js/stats.js';
import { insertLatex } from '../public/js/mathinput.js';

test('md escapes HTML and keeps math untouched', () => {
  const out = md('<img src=x onerror=alert(1)> và $a*b*c$ **đậm**');
  assert.ok(!out.includes('<img'));
  assert.ok(out.includes('$a*b*c$'));
  assert.ok(out.includes('<strong>đậm</strong>'));
});

test('md builds lists, headings and paragraphs', () => {
  assert.equal(md('# Tiêu đề\n- một\n- hai\n\nđoạn'), '<h4>Tiêu đề</h4><ul><li>một</li><li>hai</li></ul><p>đoạn</p>');
  assert.equal(md('1. a\n2. b'), '<ol><li>a</li><li>b</li></ol>');
});

test('esc handles null', () => assert.equal(esc(null), ''));

test('insertLatex wraps in $ outside math, with a space before', () => {
  const r = insertLatex('Tính', 4, 4, '\\frac{1}{2}');
  assert.equal(r.value, 'Tính $\\frac{1}{2}$');
  assert.equal(r.cursor, r.value.length);
});

test('insertLatex inside math adds no $ and replaces the selection', () => {
  const r = insertLatex('$x + y$', 1, 2, '\\sqrt{x}');
  assert.equal(r.value, '$\\sqrt{x} + y$');
  assert.equal(r.cursor, 1 + '\\sqrt{x}'.length);
});

const S = [
  { serial: 'XS·1', feature: 'tutor', topic: 'Bayes', score: 6, mistakes: [{ topic: 'Bayes', type: 'Sai tính toán', detail: 'a' }] },
  { serial: 'XS·2', feature: 'oral', topic: 'Bayes', score: 8, mistakes: [{ topic: 'Bayes', type: 'Sai tính toán', detail: 'b' }, { topic: 'Ước lượng', type: 'Đọc sai đề', detail: 'c' }] },
  { serial: 'XS·3', feature: 'practice-mcq', topic: 'Ước lượng', score: 10, mistakes: [] },
];

test('summarize aggregates scores, error types and weakest topics', () => {
  const s = summarize(S);
  assert.equal(s.n, 3);
  assert.equal(s.avg, 8);
  assert.equal(s.mistakeCount, 3);
  assert.deepEqual(s.errorTypes[0], { name: 'Sai tính toán', count: 2 });
  assert.equal(s.topics[0].name, 'Bayes'); // weakest first
  assert.equal(s.recent[0].detail, 'c');
});

test('summarize handles an empty profile', () => {
  const s = summarize([]);
  assert.equal(s.avg, null); assert.equal(s.n, 0);
});

test('fmtScore uses Vietnamese decimals', () => {
  assert.equal(fmtScore(7.5), '7,5'); assert.equal(fmtScore(10), '10'); assert.equal(fmtScore(null), '—');
});

test('newSerial is zero-padded', () => assert.equal(newSerial(() => 0.000042), 'XS·000042'));

test('insightPayload is compact JSON', () => {
  const p = JSON.parse(insightPayload(S));
  assert.equal(p.soPhien, 3); assert.equal(p.loiGanDay.length, 3);
});

test('md protects Vietnamese decimal commas inside math', () => {
  assert.equal(md('$0,25 + 1,5$'), '<p>$0{,}25 + 1{,}5$</p>');
});
