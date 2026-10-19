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

test('byFeature splits sessions by feature', async () => {
  const { byFeature } = await import('../public/js/stats.js');
  const r = byFeature(S);
  assert.deepEqual(r.map((x) => x.feature), ['tutor', 'practice-mcq', 'oral']);
  assert.equal(r.find((x) => x.feature === 'oral').mistakes, 2);
  assert.equal(r.find((x) => x.feature === 'tutor').avg, 6);
});

test('t() translates known UI strings, runtime patterns, and leaves the rest alone', async () => {
  const { t } = await import('../public/js/i18n.js');
  assert.equal(t('Chấm bài'), 'Grade');
  assert.equal(t('  Hồ sơ của tôi '), '  My profile ');
  assert.equal(t('Câu 3'), 'Question 3');
  assert.equal(t('Bước 2: Chương trình giải →'), 'Step 2: Plan →');
  assert.equal(t('Một câu AI viết'), 'Một câu AI viết');
});

test('voice: unclear() flags empty or meaningless transcripts', async () => {
  const { unclear, FALLBACK } = await import('../public/js/voice.js');
  assert.equal(unclear(''), true); assert.equal(unclear(' . '), true);
  assert.equal(unclear('xác suất có điều kiện là gì'), false);
  assert.match(FALLBACK.vi, /nghe không rõ/);
});

test('md escapes % inside math so KaTeX does not treat it as a comment', () => {
  assert.equal(md('$6,1 \\text{ (%/năm)}$'), '<p>$6{,}1 \\text{ (\\%/năm)}$</p>');
  assert.equal(md('$50\\%$'), '<p>$50\\%$</p>');
});

test('md wraps a bare LaTeX line in $ but leaves prose that mentions a command', () => {
  assert.equal(md('\\overline{x} = \\frac{307,2}{50}'), '<p>$\\overline{x} = \\frac{307{,}2}{50}$</p>');
  assert.equal(md('- s = \\sqrt{0,32} \\approx 0,57 \\text{ (%/năm)}'), '<ul><li>$s = \\sqrt{0{,}32} \\approx 0{,}57 \\text{ (\\%/năm)}$</li></ul>');
  assert.equal(md('Dùng lệnh \\frac để viết phân số'), '<p>Dùng lệnh \\frac để viết phân số</p>');
});
