// Exact statistics for the course (no AI): distribution functions, upper quantiles as the printed tables use them
// (z_α, t_α(k), χ²_α(k), F_α(k1;k2) leave α to their RIGHT), descriptive statistics and the hypothesis tests of
// Bài 6–7 written exactly as in the lecturer's slides. Pure and unit-tested (tests/statlib.test.mjs).

// ---- Special functions
const G = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
export function lnGamma(x) {
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  x -= 1;
  let a = 0.99999999999980993;
  const t = x + 7.5;
  G.forEach((g, i) => { a += g / (x + i + 1); });
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Regularized lower incomplete gamma P(a, x). */
function gammaP(a, x) {
  if (x <= 0) return 0;
  if (x < a + 1) {
    let sum = 1 / a, term = sum;
    for (let n = 1; n < 500; n++) { term *= x / (a + n); sum += term; if (Math.abs(term) < Math.abs(sum) * 1e-15) break; }
    return sum * Math.exp(-x + a * Math.log(x) - lnGamma(a));
  }
  // continued fraction for Q(a, x)
  let b = x + 1 - a, c = 1e300, d = 1 / b, hh = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a); b += 2;
    d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d; const del = d * c; hh *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - lnGamma(a)) * hh;
}

function betacf(a, b, x) {
  let c = 1, d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < 1e-300) d = 1e-300;
  d = 1 / d; let hh = d;
  for (let m = 1; m < 500; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; hh *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d;
    const del = d * c; hh *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return hh;
}
/** Regularized incomplete beta I_x(a, b). */
function betaI(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}

// ---- Distributions
export const normPdf = (x, m = 0, s = 1) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
export const normCdf = (x) => (x < 0 ? 1 - normCdf(-x) : 0.5 + 0.5 * gammaP(0.5, (x * x) / 2));
/** The course's Laplace function Φ(x) = P{0 ≤ Z ≤ x}; Φ(−x) = −Φ(x). */
export const laplace = (x) => normCdf(x) - 0.5;
export const tCdf = (t, k) => { const ib = 0.5 * betaI(k / (k + t * t), k / 2, 0.5); return t >= 0 ? 1 - ib : ib; };
export const chi2Cdf = (x, k) => (x <= 0 ? 0 : gammaP(k / 2, x / 2));
export const fCdf = (x, d1, d2) => (x <= 0 ? 0 : betaI((d1 * x) / (d1 * x + d2), d1 / 2, d2 / 2));
export const tPdf = (t, k) => Math.exp(lnGamma((k + 1) / 2) - lnGamma(k / 2) - 0.5 * Math.log(k * Math.PI) - ((k + 1) / 2) * Math.log(1 + (t * t) / k));
export const chi2Pdf = (x, k) => (x <= 0 ? 0 : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - lnGamma(k / 2)));
export const fPdf = (x, a, b) => (x <= 0 ? 0 : Math.exp(0.5 * (a * Math.log(a * x) + b * Math.log(b) - (a + b) * Math.log(a * x + b)) - Math.log(x) - (lnGamma(a / 2) + lnGamma(b / 2) - lnGamma((a + b) / 2))));

/** Solve cdf(x) = p on [lo, hi] by bisection (cdf increasing). */
function invert(cdf, p, lo, hi) {
  while (cdf(hi) < p) hi *= 2;
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (cdf(mid) < p) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
const checkAlpha = (a) => { if (!(a > 0 && a < 1)) throw new Error('Mức ý nghĩa α phải nằm trong (0; 1).'); };
/** Upper quantiles: P(X > q) = α. */
export const zUpper = (a) => { checkAlpha(a); return a > 0.5 ? -zUpper(1 - a) : invert(normCdf, 1 - a, 0, 10); };
export const tUpper = (a, k) => { checkAlpha(a); return a > 0.5 ? -tUpper(1 - a, k) : invert((x) => tCdf(x, k), 1 - a, 0, 50); };
export const chiUpper = (a, k) => { checkAlpha(a); return invert((x) => chi2Cdf(x, k), 1 - a, 0, Math.max(10, 4 * k)); };
export const fUpper = (a, d1, d2) => { checkAlpha(a); return invert((x) => fCdf(x, d1, d2), 1 - a, 0, 20); };

// ---- Data
/**
 * Numbers typed or pasted by a student. Values are separated by spaces, new lines, tabs or «;» — then a comma is the
 * Vietnamese decimal mark («1,5») — or, when nothing else separates them, by commas («1,2,3»).
 */
export function parseNumbers(text) {
  const s = String(text ?? '').trim();
  if (!s) return [];
  const parts = /[\s;]/.test(s) ? s.split(/[\s;]+/).map((x) => x.replace(',', '.')) : s.split(',');
  return parts.filter(Boolean).map((x) => {
    const v = Number(x.trim());
    if (!Number.isFinite(v)) throw new Error(`«${x.trim()}» không phải là số.`);
    return v;
  });
}

/**
 * Values typed one per row ({ x, n } strings, comma or dot decimals) → { xs, ns }. Fully empty rows are skipped;
 * an empty frequency counts 1. Throws naming the row («Dòng 2: …») so the student can find it.
 */
export function collectRows(rows = []) {
  const xs = [], ns = [];
  rows.forEach((r, i) => {
    const x = String(r.x ?? '').trim().replace(',', '.'), n = String(r.n ?? '').trim().replace(',', '.');
    if (!x && !n) return;
    if (!x) throw new Error(`Dòng ${i + 1}: chưa có giá trị.`);
    const v = Number(x);
    if (!Number.isFinite(v)) throw new Error(`Dòng ${i + 1}: «${String(r.x).trim()}» không phải là số.`);
    const k = n ? Number(n) : 1;
    if (!(Number.isInteger(k) && k >= 0)) throw new Error(`Dòng ${i + 1}: tần số phải là số nguyên ≥ 0.`);
    xs.push(v); ns.push(k);
  });
  return { xs, ns };
}

/** Weighted quantile, linear interpolation at position (n−1)p of the sorted data (like Excel QUARTILE.INC). */
function quantile(sorted, p) {
  const pos = (sorted.length - 1) * p, i = Math.floor(pos);
  return i + 1 < sorted.length ? sorted[i] + (pos - i) * (sorted[i + 1] - sorted[i]) : sorted[i];
}

/** Sample statistics of raw data, or of a value/frequency table (xs with counts ns). */
export function describe(xs, ns) {
  if (!xs?.length) throw new Error('Chưa có số liệu.');
  if (ns && (ns.length !== xs.length || ns.some((k) => !(Number.isInteger(k) && k >= 0)))) throw new Error('Số tần số phải bằng số giá trị, mỗi tần số là số nguyên ≥ 0.');
  const w = ns || xs.map(() => 1);
  const n = w.reduce((a, b) => a + b, 0);
  if (n < 1) throw new Error('Chưa có số liệu.');
  const mean = xs.reduce((a, x, i) => a + w[i] * x, 0) / n;
  const ss = xs.reduce((a, x, i) => a + w[i] * (x - mean) ** 2, 0);
  const sorted = xs.flatMap((x, i) => Array(w[i]).fill(x)).sort((a, b) => a - b);
  const s2 = n > 1 ? ss / (n - 1) : NaN;
  return {
    n, mean, varN: ss / n, s2, s: Math.sqrt(s2),
    min: sorted[0], max: sorted.at(-1), median: quantile(sorted, 0.5), q1: quantile(sorted, 0.25), q3: quantile(sorted, 0.75), sorted,
  };
}

// ---- Hypothesis tests (Bài 6–7). tail: 'two' (≠), 'gt' (>), 'lt' (<).
// Each returns { dist, df?, stat, crit (or lo/hi), reject, W (text of the rejection region), formula (LaTeX) }.
const needN = (n, name = 'n') => { if (!(Number.isInteger(n) && n >= 2)) throw new Error(`Cỡ mẫu ${name} phải là số nguyên ≥ 2.`); };
const sym = (dist, df) => ({ z: (a) => `z_{${a}}`, t: (a) => `t_{${a}}(${df})` }[dist]);

/** Symmetric (Z or T) decision as in the slides. */
function symmetric(dist, stat, alpha, tail, df) {
  const q = (a) => (dist === 'z' ? zUpper(a) : tUpper(a, df)), S = sym(dist, df);
  const fmt = (x) => String(+x.toFixed(4)).replace('.', ',');
  if (tail === 'two') {
    const crit = q(alpha / 2);
    return { crit, reject: Math.abs(stat) > crit, W: `(-\\infty;-${S('\\alpha/2')})\\cup(${S('\\alpha/2')};+\\infty)=(-\\infty;-${fmt(crit)})\\cup(${fmt(crit)};+\\infty)` };
  }
  const crit = q(alpha);
  return tail === 'gt'
    ? { crit, reject: stat > crit, W: `(${S('\\alpha')};+\\infty)=(${fmt(crit)};+\\infty)` }
    : { crit, reject: stat < -crit, W: `(-\\infty;-${S('\\alpha')})=(-\\infty;-${fmt(crit)})` };
}

export function testMean({ n, xbar, s, sigma, mu0, alpha, tail }) {
  needN(n); checkAlpha(alpha);
  const known = Number.isFinite(sigma) && sigma > 0;
  if (!known && !(s > 0)) throw new Error('Cần độ lệch chuẩn mẫu s > 0 (hoặc σ đã biết).');
  const dist = known || n >= 30 ? 'z' : 't', df = dist === 't' ? n - 1 : undefined, sd = known ? sigma : s;
  const stat = (xbar - mu0) / (sd / Math.sqrt(n));
  return {
    dist, df, stat, ...symmetric(dist, stat, alpha, tail, df),
    formula: `${dist === 'z' ? 'Z_{qs}' : 'T'}=\\frac{\\bar{x}-\\mu_0}{${known ? '\\sigma' : 's'}/\\sqrt{n}}`,
    why: known ? 'σ đã biết: dùng phân phối chuẩn.' : n >= 30 ? 'n ≥ 30: dùng phân phối chuẩn, thay σ bằng s.' : 'n < 30, σ chưa biết: dùng phân phối Student bậc n − 1.',
  };
}

export function testProp({ n, k, p0, alpha, tail }) {
  needN(n); checkAlpha(alpha);
  if (!(Number.isInteger(k) && k >= 0 && k <= n)) throw new Error('Số phần tử có tính chất k phải là số nguyên trong [0; n].');
  if (!(p0 > 0 && p0 < 1)) throw new Error('Tỉ lệ p₀ phải nằm trong (0; 1).');
  const f = k / n, stat = (f - p0) / Math.sqrt((p0 * (1 - p0)) / n);
  return { dist: 'z', stat, f, ...symmetric('z', stat, alpha, tail), formula: 'Z_{qs}=\\frac{f-p_0}{\\sqrt{p_0q_0/n}}', why: 'Kiểm định tỉ lệ: f = k/n, q₀ = 1 − p₀.' };
}

/** χ² test (μ unknown) or F test: lo/hi are the lower/upper critical values. */
function oneSidedPair(stat, tail, loQ, hiQ, alpha, names) {
  const fmt = (x) => String(+x.toFixed(4)).replace('.', ',');
  if (tail === 'two') {
    const lo = loQ(1 - alpha / 2), hi = hiQ(alpha / 2);
    return { lo, hi, reject: stat < lo || stat > hi, W: `(-\\infty;${names(`1-\\alpha/2`)})\\cup(${names('\\alpha/2')};+\\infty)=(-\\infty;${fmt(lo)})\\cup(${fmt(hi)};+\\infty)` };
  }
  if (tail === 'gt') { const hi = hiQ(alpha); return { hi, reject: stat > hi, W: `(${names('\\alpha')};+\\infty)=(${fmt(hi)};+\\infty)` }; }
  const lo = loQ(1 - alpha);
  return { lo, reject: stat < lo, W: `(-\\infty;${names('1-\\alpha')})=(-\\infty;${fmt(lo)})` };
}

export function testVar({ n, s2, sigma02, alpha, tail }) {
  needN(n); checkAlpha(alpha);
  if (!(s2 >= 0) || !(sigma02 > 0)) throw new Error('Cần s² ≥ 0 và σ₀² > 0.');
  const df = n - 1, stat = (df * s2) / sigma02, q = (a) => chiUpper(a, df);
  return { dist: 'chi2', df, stat, ...oneSidedPair(stat, tail, q, q, alpha, (a) => `\\chi^2_{${a}}(${df})`), formula: 'Z_{qs}=\\frac{(n-1)s^2}{\\sigma_0^2}', why: 'μ chưa biết: dùng phân phối χ² bậc n − 1.' };
}

export function testTwoMeans({ n, xbar, s1, m, ybar, s2, alpha, tail }) {
  needN(n); needN(m, 'm'); checkAlpha(alpha);
  if (!(s1 > 0 && s2 > 0)) throw new Error('Cần độ lệch chuẩn s₁, s₂ > 0.');
  if (n >= 30 && m >= 30) {
    const stat = (xbar - ybar) / Math.sqrt((s1 * s1) / n + (s2 * s2) / m);
    return { dist: 'z', stat, ...symmetric('z', stat, alpha, tail), formula: 'Z_{qs}=\\frac{\\bar{x}-\\bar{y}}{\\sqrt{\\frac{s_1^2}{n}+\\frac{s_2^2}{m}}}', why: 'Hai mẫu lớn (n, m ≥ 30): dùng phân phối chuẩn, σ² xấp xỉ bằng s².' };
  }
  const df = n + m - 2, sp2 = ((n - 1) * s1 * s1 + (m - 1) * s2 * s2) / df;
  const stat = (xbar - ybar) / Math.sqrt(sp2 * (1 / n + 1 / m));
  return { dist: 't', df, sp2, stat, ...symmetric('t', stat, alpha, tail, df), formula: 'Z_{qs}=\\frac{\\bar{x}-\\bar{y}}{\\sqrt{s^2\\left(\\frac{1}{n}+\\frac{1}{m}\\right)}},\\ s^2=\\frac{(n-1)s_1^2+(m-1)s_2^2}{n+m-2}', why: 'Mẫu nhỏ: dùng phân phối Student bậc n + m − 2 với phương sai gộp.' };
}

export function testTwoProps({ n, k1, m, k2, alpha, tail }) {
  needN(n); needN(m, 'm'); checkAlpha(alpha);
  if (!(Number.isInteger(k1) && k1 >= 0 && k1 <= n && Number.isInteger(k2) && k2 >= 0 && k2 <= m)) throw new Error('k₁, k₂ phải là số nguyên trong [0; n] và [0; m].');
  const f1 = k1 / n, f2 = k2 / m, f = (k1 + k2) / (n + m);
  if (f === 0 || f === 1) throw new Error('Tỉ lệ gộp f bằng 0 hoặc 1: không kiểm định được.');
  const stat = (f1 - f2) / Math.sqrt(f * (1 - f) * (1 / n + 1 / m));
  return { dist: 'z', stat, f, f1, f2, ...symmetric('z', stat, alpha, tail), formula: 'Z_{qs}=\\frac{f_1-f_2}{\\sqrt{f(1-f)\\left(\\frac{1}{n}+\\frac{1}{m}\\right)}},\\ f=\\frac{k_1+k_2}{n+m}', why: 'So sánh hai tỉ lệ với tỉ lệ gộp f.' };
}

/** F test as in the slides: the larger sample variance always goes on top, so Z_qs ≥ 1. */
export function testTwoVars({ n, s1, m, s2, alpha, tail }) {
  needN(n); needN(m, 'm'); checkAlpha(alpha);
  if (!(s1 > 0 && s2 > 0)) throw new Error('Cần độ lệch chuẩn s₁, s₂ > 0.');
  const swapped = s2 > s1;
  const [a, na, b, nb] = swapped ? [s2, m, s1, n] : [s1, n, s2, m];
  const df1 = na - 1, df2 = nb - 1, stat = (a * a) / (b * b), q = (x) => fUpper(x, df1, df2);
  const side = tail === 'lt' ? 'gt' : tail; // with the larger variance on top only ≠ and > make sense
  return { dist: 'f', df1, df2, stat, swapped, ...oneSidedPair(stat, side, q, q, alpha, (x) => `F_{${x}}(${df1};${df2})`), formula: 'Z_{qs}=\\frac{s_{max}^2}{s_{min}^2}\\ge 1', why: 'Luôn đặt phương sai mẫu lớn hơn lên tử số: phân phối Fisher.' };
}

// ---- Bài 5: interval estimation (as in the slides) and the sample size needed for a precision ε.
const COURSE_Z = { 0.9: 1.65, 0.95: 1.96, 0.99: 2.58 };
/** z_{α/2} for confidence 1 − α: the course table values for 90/95/99%, the exact quantile otherwise. */
export function zConf(conf) {
  if (!(conf > 0 && conf < 1)) throw new Error('Độ tin cậy phải nằm trong (0; 1), ví dụ 0,95.');
  return COURSE_Z[conf] ?? zUpper((1 - conf) / 2);
}

export function ciMean({ n, xbar, s, sigma, conf }) {
  needN(n);
  const known = Number.isFinite(sigma) && sigma > 0;
  if (!known && !(s > 0)) throw new Error('Cần độ lệch chuẩn mẫu s > 0 (hoặc σ đã biết).');
  const dist = known || n >= 30 ? 'z' : 't', df = dist === 't' ? n - 1 : undefined;
  const crit = dist === 'z' ? zConf(conf) : tUpper((1 - conf) / 2, df), eps = (crit * (known ? sigma : s)) / Math.sqrt(n);
  return { dist, df, crit, eps, lo: xbar - eps, hi: xbar + eps, known,
    why: known ? 'σ đã biết: dùng phân phối chuẩn.' : n >= 30 ? 'n ≥ 30: dùng phân phối chuẩn, thay σ bằng s.' : 'n < 30, σ chưa biết: dùng phân phối Student bậc n − 1.' };
}

export function ciProp({ n, k, conf }) {
  needN(n);
  if (!(Number.isInteger(k) && k >= 0 && k <= n)) throw new Error('Số phần tử có tính chất k phải là số nguyên trong [0; n].');
  const f = k / n, crit = zConf(conf), eps = crit * Math.sqrt((f * (1 - f)) / n);
  return { dist: 'z', f, crit, eps, lo: f - eps, hi: f + eps };
}

export function ciVar({ n, s2, conf }) {
  needN(n);
  if (!(s2 >= 0)) throw new Error('Cần s² ≥ 0.');
  if (!(conf > 0 && conf < 1)) throw new Error('Độ tin cậy phải nằm trong (0; 1), ví dụ 0,95.');
  const a = 1 - conf, df = n - 1, chiHi = chiUpper(a / 2, df), chiLo = chiUpper(1 - a / 2, df);
  return { dist: 'chi2', df, chiHi, chiLo, lo: (df * s2) / chiHi, hi: (df * s2) / chiLo };
}

const needEps = (eps) => { if (!(eps > 0)) throw new Error('Độ chính xác ε phải lớn hơn 0.'); };
/** Smallest n with z·σ/√n ≤ ε. */
export function sizeMean({ sigma, eps, conf }) {
  needEps(eps);
  if (!(sigma > 0)) throw new Error('Cần σ (hoặc s) > 0.');
  return Math.ceil(((zConf(conf) * sigma) / eps) ** 2 - 1e-9);
}
/** Smallest n with z·√(f(1−f)/n) ≤ ε; f unknown → 0,5 (the largest n). */
export function sizeProp({ f = 0.5, eps, conf }) {
  needEps(eps);
  if (!(f >= 0 && f <= 1)) throw new Error('Tỉ lệ f phải nằm trong [0; 1].');
  return Math.ceil((zConf(conf) ** 2 * f * (1 - f)) / eps ** 2 - 1e-9);
}

// ---- Distribution calculator (exact, on log scale so large n stays finite)
const lnFact = (n) => lnGamma(n + 1);
const lnC = (n, k) => lnFact(n) - lnFact(k) - lnFact(n - k);
export function binomPmf(n, p, k) {
  if (k < 0 || k > n || !Number.isInteger(k)) return 0;
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  return Math.exp(lnC(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
}
export const poissonPmf = (l, k) => (k < 0 || !Number.isInteger(k) ? 0 : Math.exp(-l + k * Math.log(l) - lnFact(k)));
/** Population N with M successes, n draws without replacement: P(X = k). */
export function hyperPmf(N, M, n, k) {
  if (!Number.isInteger(k) || k < Math.max(0, n - (N - M)) || k > Math.min(n, M)) return 0;
  return Math.exp(lnC(M, k) + lnC(N - M, n - k) - lnC(N, n));
}
/** Σ pmf(k) for integers a ≤ k ≤ b. */
export function rangeProb(pmf, a, b) {
  let s = 0;
  for (let k = Math.ceil(a); k <= Math.floor(b); k++) s += pmf(k);
  return Math.min(1, s);
}
/** P(a < X < b) for X ~ N(μ; σ²) = Φ((b−μ)/σ) − Φ((a−μ)/σ), Φ the Laplace function. */
export const normalRange = (mu, sigma, a, b) => (b === Infinity ? 0.5 : laplace((b - mu) / sigma)) - (a === -Infinity ? -0.5 : laplace((a - mu) / sigma));
/** The course's normal approximation of B(n; p), without the ±0,5 correction (lecturer's slides). */
export const binomNormalApprox = (n, p, a, b) => { const m = n * p, sd = Math.sqrt(n * p * (1 - p)); return laplace((b - m) / sd) - laplace((a - m) / sd); };
/** Most likely value(s) of B(n; p): np − q ≤ k₀ ≤ np − q + 1. */
export function binomMode(n, p) {
  const lo = n * p - (1 - p), k = Math.ceil(lo - 1e-9);
  return Math.abs(lo - Math.round(lo)) < 1e-9 ? [Math.round(lo), Math.round(lo) + 1] : [k];
}
