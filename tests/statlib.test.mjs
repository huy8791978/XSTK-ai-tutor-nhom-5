import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  laplace, zUpper, tUpper, chiUpper, fUpper, tCdf, chi2Cdf, fCdf,
  parseNumbers, describe, testMean, testProp, testVar, testTwoMeans, testTwoProps, testTwoVars,
} from '../public/js/statlib.js';

const near = (a, b, eps = 1e-3) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test('Laplace function Φ(x) = P{0 ≤ Z ≤ x}, odd', () => {
  near(laplace(1), 0.3413, 1e-4);
  near(laplace(1.96), 0.4750, 1e-4);
  near(laplace(-1), -0.3413, 1e-4);
  near(laplace(6), 0.5, 1e-6);
});

test('upper quantiles match the printed tables', () => {
  near(zUpper(0.025), 1.95996);
  near(zUpper(0.05), 1.64485);
  near(tUpper(0.025, 10), 2.2281);
  near(tUpper(0.05, 24), 1.7109);
  near(chiUpper(0.05, 10), 18.307);
  near(chiUpper(0.95, 10), 3.9403);
  near(fUpper(0.05, 5, 10), 3.3258);
  near(fUpper(0.025, 9, 12), 3.4358);
});

test('CDFs are consistent with their quantiles', () => {
  near(tCdf(2.2281, 10), 0.975);
  near(tCdf(-2.2281, 10), 0.025);
  near(chi2Cdf(18.307, 10), 0.95);
  near(fCdf(3.3258, 5, 10), 0.95);
});

test('parseNumbers: comma is a decimal mark when spaces or semicolons separate the values', () => {
  assert.deepEqual(parseNumbers('1,5 2 3,25'), [1.5, 2, 3.25]);
  assert.deepEqual(parseNumbers('1,5; 2;3'), [1.5, 2, 3]);
  assert.deepEqual(parseNumbers('1,2,3'), [1, 2, 3]);
  assert.deepEqual(parseNumbers('4\n5.5\n-6'), [4, 5.5, -6]);
  assert.deepEqual(parseNumbers('  '), []);
});

test('parseNumbers rejects what is not a number', () => {
  assert.throws(() => parseNumbers('1 2 abc'), /abc/);
});

test('describe: raw data, sample variance s² with n−1 and ŝ² with n', () => {
  const d = describe([2, 4, 4, 4, 5, 5, 7, 9]);
  assert.equal(d.n, 8);
  near(d.mean, 5);
  near(d.varN, 4);
  near(d.s2, 32 / 7);
  near(d.s, Math.sqrt(32 / 7));
  assert.equal(d.min, 2); assert.equal(d.max, 9);
  near(d.median, 4.5);
  near(d.q1, 4); near(d.q3, 5.5);
});

test('describe: value/frequency table equals the expanded data', () => {
  const a = describe([10, 20, 30], [2, 5, 3]);
  const b = describe([10, 10, 20, 20, 20, 20, 20, 30, 30, 30]);
  for (const k of ['n', 'mean', 's2', 'median', 'q1', 'q3']) near(a[k], b[k]);
});

test('describe refuses bad input', () => {
  assert.throws(() => describe([]), /Chưa có số liệu/);
  assert.throws(() => describe([1, 2], [1]), /tần số/);
  assert.throws(() => describe([1, 2], [1, -1]), /tần số/);
});

test('testMean uses Z when n ≥ 30 (s replaces σ), T(n−1) when n < 30 and σ unknown', () => {
  const z = testMean({ n: 36, xbar: 52, s: 6, mu0: 50, alpha: 0.05, tail: 'two' });
  assert.equal(z.dist, 'z');
  near(z.stat, 2);
  near(z.crit, 1.95996);
  assert.equal(z.reject, true);
  const t = testMean({ n: 16, xbar: 52, s: 6, mu0: 50, alpha: 0.05, tail: 'gt' });
  assert.equal(t.dist, 't'); assert.equal(t.df, 15);
  near(t.stat, 4 / 3);
  near(t.crit, 1.7531);
  assert.equal(t.reject, false);
  const known = testMean({ n: 16, xbar: 48, s: 6, sigma: 4, mu0: 50, alpha: 0.05, tail: 'lt' });
  assert.equal(known.dist, 'z');
  near(known.stat, -2);
  assert.equal(known.reject, true);
});

test('testProp: Z = (f − p0)/√(p0q0/n)', () => {
  const r = testProp({ n: 400, k: 220, p0: 0.5, alpha: 0.05, tail: 'gt' });
  near(r.stat, 2);
  near(r.crit, 1.64485);
  assert.equal(r.reject, true);
  assert.throws(() => testProp({ n: 10, k: 11, p0: 0.5, alpha: 0.05, tail: 'two' }), /k/);
});

test('testVar: (n−1)s²/σ0² against χ²(n−1), lower and upper quantiles', () => {
  const r = testVar({ n: 11, s2: 9, sigma02: 4, alpha: 0.05, tail: 'two' });
  near(r.stat, 22.5);
  near(r.lo, 3.2470); near(r.hi, 20.4832);
  assert.equal(r.reject, true);
  const lt = testVar({ n: 11, s2: 2, sigma02: 4, alpha: 0.05, tail: 'lt' });
  near(lt.lo, 3.9403);
  assert.equal(lt.reject, false); // 5 > 3.94
});

test('testTwoMeans: Z for large samples, pooled T(n+m−2) for small', () => {
  const z = testTwoMeans({ n: 50, xbar: 20, s1: 4, m: 50, ybar: 18, s2: 3, alpha: 0.05, tail: 'two' });
  assert.equal(z.dist, 'z');
  near(z.stat, 2 / Math.sqrt(16 / 50 + 9 / 50));
  const t = testTwoMeans({ n: 10, xbar: 20, s1: 4, m: 12, ybar: 18, s2: 3, alpha: 0.05, tail: 'two' });
  assert.equal(t.dist, 't'); assert.equal(t.df, 20);
  const sp2 = (9 * 16 + 11 * 9) / 20;
  near(t.stat, 2 / Math.sqrt(sp2 * (1 / 10 + 1 / 12)));
});

test('testTwoProps pools f = (k1+k2)/(n+m)', () => {
  const r = testTwoProps({ n: 200, k1: 60, m: 300, k2: 60, alpha: 0.05, tail: 'two' });
  const f = 120 / 500;
  near(r.stat, (0.3 - 0.2) / Math.sqrt(f * (1 - f) * (1 / 200 + 1 / 300)));
  assert.equal(r.reject, true);
});

test('testTwoVars puts the larger variance on top and uses F(n−1; m−1)', () => {
  const r = testTwoVars({ n: 10, s1: 2, m: 13, s2: 3, alpha: 0.05, tail: 'two' });
  near(r.stat, 9 / 4);
  assert.equal(r.df1, 12); assert.equal(r.df2, 9);
  near(r.hi, fUpper(0.025, 12, 9));
  assert.equal(r.swapped, true);
});

test('alpha and sizes are validated', () => {
  assert.throws(() => testMean({ n: 1, xbar: 1, s: 1, mu0: 0, alpha: 0.05, tail: 'two' }), /n/);
  assert.throws(() => testMean({ n: 30, xbar: 1, s: 1, mu0: 0, alpha: 1.5, tail: 'two' }), /α/);
});

test('collectRows: one value per row, empty rows skipped, frequency 1 when left empty', async () => {
  const { collectRows } = await import('../public/js/statlib.js');
  assert.deepEqual(collectRows([{ x: '12,5', n: '2' }, { x: '', n: '' }, { x: ' 13 ', n: '' }, { x: '-1.5', n: '0' }]), { xs: [12.5, 13, -1.5], ns: [2, 1, 0] });
  assert.deepEqual(collectRows([]), { xs: [], ns: [] });
});

test('collectRows names the row that is wrong', async () => {
  const { collectRows } = await import('../public/js/statlib.js');
  assert.throws(() => collectRows([{ x: '1' }, { x: 'abc' }]), /Dòng 2.*abc/);
  assert.throws(() => collectRows([{ x: '1', n: '2,5' }]), /Dòng 1.*tần số/);
  assert.throws(() => collectRows([{ x: '1', n: '-1' }]), /Dòng 1.*tần số/);
  assert.throws(() => collectRows([{ x: '', n: '3' }]), /Dòng 1.*giá trị/);
});

// ---- Bài 5: interval estimation and sample size (z from the course table for 90/95/99%)
test('zConf uses the course table values for 90, 95, 99% and exact quantiles otherwise', async () => {
  const { zConf } = await import('../public/js/statlib.js');
  assert.equal(zConf(0.9), 1.65); assert.equal(zConf(0.95), 1.96); assert.equal(zConf(0.99), 2.58);
  near(zConf(0.98), 2.3263);
  assert.throws(() => zConf(1), /độ tin cậy/i);
});

test('ciMean: z with s for σ when n ≥ 30, Student when n < 30 and σ unknown, z when σ known', async () => {
  const { ciMean } = await import('../public/js/statlib.js');
  const z = ciMean({ n: 36, xbar: 50, s: 6, conf: 0.95 });
  assert.equal(z.dist, 'z'); near(z.eps, 1.96); near(z.lo, 48.04); near(z.hi, 51.96);
  const t = ciMean({ n: 16, xbar: 50, s: 4, conf: 0.95 });
  assert.equal(t.dist, 't'); assert.equal(t.df, 15); near(t.crit, 2.1314); near(t.eps, 2.1314);
  const k = ciMean({ n: 16, xbar: 50, s: 4, sigma: 2, conf: 0.95 });
  assert.equal(k.dist, 'z'); near(k.eps, 0.98);
});

test('ciProp: ε = z·√(f(1−f)/n)', async () => {
  const { ciProp } = await import('../public/js/statlib.js');
  const r = ciProp({ n: 400, k: 80, conf: 0.95 });
  near(r.f, 0.2); near(r.eps, 1.96 * Math.sqrt(0.16 / 400)); near(r.lo, 0.2 - r.eps); near(r.hi, 0.2 + r.eps);
});

test('ciVar: ((n−1)s²/χ²_{α/2}(n−1); (n−1)s²/χ²_{1−α/2}(n−1))', async () => {
  const { ciVar } = await import('../public/js/statlib.js');
  const r = ciVar({ n: 11, s2: 4, conf: 0.95 });
  near(r.chiHi, 20.4832); near(r.chiLo, 3.2470); near(r.lo, 40 / 20.4832); near(r.hi, 40 / 3.2470);
});

test('sample size rounds up: n ≥ (zσ/ε)² for a mean, n ≥ z²f(1−f)/ε² for a proportion', async () => {
  const { sizeMean, sizeProp } = await import('../public/js/statlib.js');
  assert.equal(sizeMean({ sigma: 10, eps: 2, conf: 0.95 }), 97); // (1,96·10/2)² = 96,04
  assert.equal(sizeProp({ f: 0.5, eps: 0.05, conf: 0.95 }), 385); // 384,16
  assert.equal(sizeProp({ eps: 0.05, conf: 0.95 }), 385); // f unknown → 0,5
  assert.throws(() => sizeMean({ sigma: 10, eps: 0, conf: 0.95 }), /ε/);
});

// ---- Distribution calculator
test('binomial, Poisson and hypergeometric probabilities are exact', async () => {
  const { binomPmf, poissonPmf, hyperPmf, rangeProb } = await import('../public/js/statlib.js');
  near(binomPmf(10, 0.5, 5), 0.24609375, 1e-9);
  near(rangeProb((k) => binomPmf(10, 0.5, k), 3, 7), 0.890625, 1e-9);
  near(poissonPmf(2, 0), Math.exp(-2), 1e-12);
  near(rangeProb((k) => poissonPmf(2, k), 0, 2), 5 * Math.exp(-2), 1e-12);
  near(hyperPmf(10, 4, 3, 1), 0.5, 1e-12);
  assert.equal(hyperPmf(10, 4, 3, 4), 0);
  near(binomPmf(2000, 0.001, 1), 2000 * 0.001 * 0.999 ** 1999, 1e-12); // large n stays finite
});

test('normal range uses the Laplace function, and the course normal approximation has no ±0,5', async () => {
  const { normalRange, binomNormalApprox, binomMode } = await import('../public/js/statlib.js');
  near(normalRange(0, 1, -1.96, 1.96), 0.95, 1e-4);
  near(normalRange(10, 2, -Infinity, 10), 0.5, 1e-9);
  // B(100; 0,5): P(45 ≤ X ≤ 55) ≈ Φ(1) − Φ(−1) = 0,6827
  near(binomNormalApprox(100, 0.5, 45, 55), 0.6827, 1e-4);
  assert.deepEqual(binomMode(10, 0.3), [3]); // np − q = 2,3 ≤ k₀ ≤ 3,3
  assert.deepEqual(binomMode(9, 0.5), [4, 5]); // np − q = 4 is an integer: two modes
});
