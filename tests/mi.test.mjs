// Multiple intelligences features: discover scoring, self-assessment, lab maths, challenge links, paradoxes, prompts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LENSES, DISCOVER, miScores, topLenses } from '../public/js/lenses.js';
import { calibration } from '../public/js/stats.js';
import { buildRequest } from '../worker/prompts.js';
import { parseCommand } from '../public/js/command.js';

const seeded = (a) => () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

test('discover: two statements per way, scores 0–100, top 3 in order', () => {
  assert.equal(LENSES.length, 9);
  for (const L of LENSES) assert.equal(DISCOVER.filter(([id]) => id === L.id).length, 2, L.id);
  const ans = DISCOVER.map(([id]) => (id === 'musical' ? 3 : id === 'spatial' ? 2 : id === 'logic' ? 1 : 0));
  const s = miScores(ans);
  assert.equal(s.musical, 100); assert.equal(s.spatial, 67); assert.equal(s.logic, 33); assert.equal(s.naturalist, 0);
  assert.deepEqual(topLenses(s), ['musical', 'spatial', 'logic']);
  assert.equal(miScores([null, 'x', 9]).logic, 0); // junk answers count as 0
});

test('calibration compares confidence with the real score', () => {
  assert.equal(calibration([{ score: 5 }]).n, 0);
  const over = calibration([{ score: 4, conf: 100 }, { score: 6, conf: 75 }]);
  assert.deepEqual(over, { n: 2, conf: 88, actual: 50, gap: 38, verdict: 'over' });
  assert.equal(calibration([{ score: 9, conf: 50 }]).verdict, 'under');
  assert.equal(calibration([{ score: 7, conf: 75 }]).verdict, 'ok');
});

test('lab: binomial sums to 1, intervals cover μ about as often as the level says, data parsing', async () => {
  const { binomPmf, ciSim, placed, parseValues, describe } = await import('../public/js/views/lab.js');
  for (const [n, p] of [[1, 0.5], [20, 0.3], [100, 0.99]]) assert.ok(Math.abs(binomPmf(n, p).reduce((a, x) => a + x, 0) - 1) < 1e-9);
  assert.ok(Math.abs(binomPmf(3, 0.5)[2] - 0.375) < 1e-12);
  const rs = ciSim({ n: 25, level: 95, count: 2000, rand: seeded(7) });
  const rate = rs.filter((r) => r.hit).length / rs.length;
  assert.ok(rate > 0.93 && rate < 0.97, `coverage ${rate}`);
  assert.ok(Math.abs(rs[0].hi - rs[0].lo - 2 * 1.96 * 2) < 1e-9); // 2·u·σ/√n with σ = 10, n = 25
  assert.equal(placed([0, 2, 1, 3]), 2);
  assert.deepEqual(parseValues('1,5 2.5;3\n-4  sẻ'), [1.5, 2.5, 3, -4, 'sẻ']);
  const d = describe([2, 4, 4, 4, 5, 5, 7, 9]);
  assert.equal(d.mean, 5); assert.equal(d.median, 4.5); assert.ok(Math.abs(d.s - Math.sqrt(32 / 7)) < 1e-12);
  assert.deepEqual(describe(['sẻ', 'sẻ', 'chào mào']).freq, [['sẻ', 2], ['chào mào', 1]]);
});

test('duel links round-trip and reject tampered or malformed data', async () => {
  const { pack, unpack } = await import('../public/js/views/duel.js');
  const c = { v: 1, topic: 'Phân phối thông dụng', level: 'Dễ', qs: [{ p: 'Tính $P(X=2)$?', o: ['0,1', '0,2', '0,3', '0,4'], a: 2, e: 'Vì…', t: 'Phân phối thông dụng' }], from: { name: 'An', score: 1, ms: 12345 } };
  const code = await pack(c);
  assert.match(code, /^[zj][A-Za-z0-9_-]+$/);
  const back = await unpack(code);
  assert.equal(back.qs[0].p, c.qs[0].p); assert.equal(back.from.name, 'An'); assert.equal(back.to, null);
  assert.equal(await unpack(`${code.slice(0, 20)}`), null);
  assert.equal(await unpack('xabc'), null);
  const bad = await pack({ ...c, qs: [{ ...c.qs[0], a: 7 }] });
  assert.equal(await unpack(bad), null); // answer outside A–D
  const big = await unpack(await pack({ ...c, from: { name: 'x'.repeat(99), score: 99, ms: -5 } }));
  assert.equal(big.from.name.length, 30); assert.equal(big.from.score, 5); assert.equal(big.from.ms, 0);
});

test('paradoxes: birthday passes 50% at 23, lottery odds, Monty Hall favours switching', async () => {
  const { birthday, comb, monty } = await import('../public/js/views/life.js');
  assert.ok(birthday(22) < 0.5 && birthday(23) > 0.5);
  assert.equal(comb(45, 6), 8145060);
  const r = seeded(3); let s = 0, w = 0;
  for (let i = 0; i < 3000; i++) { s += monty(false, r); w += monty(true, r); }
  assert.ok(Math.abs(s / 3000 - 1 / 3) < 0.04 && Math.abs(w / 3000 - 2 / 3) < 0.04);
});

test('new AI tasks build valid requests and refuse bad input', () => {
  const lens = buildRequest('lens', { lens: 'musical', text: 'Công thức Bayes', topic: 'Xác suất có điều kiện & Bayes' });
  assert.match(lens.body.contents[0].parts[0].text, /vè|lục bát/);
  assert.throws(() => buildRequest('lens', { lens: 'magic', text: 'x' }), /Cách học/);
  assert.throws(() => buildRequest('lens', { lens: 'logic', text: ' ' }), /Thiếu nội dung/);
  assert.match(buildRequest('teachBack', { explanation: 'Bayes là đổi chiều xác suất có điều kiện' }).body.contents[0].parts[0].text, /Bin/);
  assert.throws(() => buildRequest('teachBack', { explanation: 'ngắn' }), /dài hơn/);
  assert.match(buildRequest('duel', { topic: 'Ước lượng tham số', level: 'Khó' }).body.contents[0].parts[0].text, /đúng 5 câu.*«Khó»/s);
  assert.throws(() => buildRequest('life', {}), /câu hỏi/);
  assert.match(buildRequest('classify', { values: [1, 2, 3], context: 'số chim' }).body.contents[0].parts[0].text, /3 giá trị/);
  assert.throws(() => buildRequest('classify', { values: [] }), /dữ liệu/);
  assert.match(buildRequest('lens', { lens: 'logic', text: 'Kì vọng', lang: 'en' }).body.contents[0].parts[0].text, /Answer ONLY in English/);
});

test('voice commands reach the new pages', () => {
  assert.equal(parseCommand('mở phòng thí nghiệm').route, 'phong-thi-nghiem');
  assert.equal(parseCommand('sang thách đấu').route, 'thach-dau');
  assert.equal(parseCommand('khám phá cách học').route, 'kham-pha');
  assert.equal(parseCommand('go to the lab').route, 'phong-thi-nghiem');
  assert.equal(parseCommand('xác suất và cuộc đời').route, 'cuoc-doi');
});
