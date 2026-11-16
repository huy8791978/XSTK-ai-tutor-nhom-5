// Probability calculator for the course distributions: binomial, Poisson, hypergeometric, normal.
// Exact values, the course approximations next to them (with their error), and the probability drawn. No AI.
import { h, rich } from '../ui.js';
import { tr as t } from '../i18n.js';
import { barChart, densityPlot } from '../viz.js';
import { vn } from './tables.js';
import { stepRail, untouched } from '../steprail.js';
import { binomPmf, poissonPmf, hyperPmf, rangeProb, normalRange, binomNormalApprox, binomMode, normPdf } from '../statlib.js';

export const meta = { title: 'Máy tính phân phối', lede: 'Tính P(X = k) và P(a ≤ X ≤ b) cho phân phối nhị thức, Poisson, siêu bội và chuẩn, kèm kì vọng, phương sai và các xấp xỉ trong giáo trình.\nTính chính xác bằng máy, không dùng AI.' };

const DISTS = {
  binom: { name: 'Nhị thức B(n; p)', fields: [['n', 'Số phép thử n'], ['p', 'Xác suất thành công p']] },
  poisson: { name: 'Poisson P(λ)', fields: [['l', 'Tham số λ']] },
  hyper: { name: 'Siêu bội H(N; M; n)', fields: [['N', 'Tổng số phần tử N'], ['M', 'Số phần tử có tính chất M'], ['n', 'Số phần tử lấy ra n']] },
  normal: { name: 'Chuẩn N(μ; σ²)', fields: [['mu', 'Kì vọng μ'], ['sigma', 'Độ lệch chuẩn σ']] },
};
const STEPS = ['Xác định phân phối', 'Đặc trưng số', 'Công thức xác suất', 'Kết quả'];
// Step 1 and 2 of the board: the law and its moments, as in the course formula sheet.
const LAW = {
  binom: ['P(X=k)=C_n^k\\,p^k\\,q^{n-k},\\ q=1-p', 'E(X)=np,\\ \\operatorname{Var}(X)=npq'],
  poisson: ['P(X=k)=\\dfrac{e^{-\\lambda}\\lambda^k}{k!}', 'E(X)=\\operatorname{Var}(X)=\\lambda'],
  hyper: ['P(X=k)=\\dfrac{C_M^k\\,C_{N-M}^{n-k}}{C_N^n}', 'E(X)=np,\\ \\operatorname{Var}(X)=npq\\dfrac{N-n}{N-1},\\ p=\\dfrac{M}{N}'],
  normal: ['f(x)=\\dfrac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}', 'E(X)=\\mu,\\ \\operatorname{Var}(X)=\\sigma^2'],
};
const tn = (x, d) => vn(x, d).replace(/,/g, '{,}'); // a decimal comma in TeX, without the list space
const num = (v) => (String(v).trim() === '' ? NaN : Number(String(v).replace(',', '.')));
const int = (x) => Number.isInteger(x);

/** Check the parameters; returns { pmf, lo, hi, mean, varX, label } or throws a Vietnamese message. */
function model(d, p) {
  if (d === 'binom') {
    if (!(int(p.n) && p.n >= 1 && p.n <= 100000)) throw new Error('n phải là số nguyên từ 1 đến 100 000.');
    if (!(p.p >= 0 && p.p <= 1)) throw new Error('p phải nằm trong [0; 1].');
    return { pmf: (k) => binomPmf(p.n, p.p, k), lo: 0, hi: p.n, mean: p.n * p.p, varX: p.n * p.p * (1 - p.p), label: `B(${p.n}; ${vn(p.p)})` };
  }
  if (d === 'poisson') {
    if (!(p.l > 0 && p.l <= 1000)) throw new Error('λ phải lớn hơn 0 (tối đa 1000).');
    return { pmf: (k) => poissonPmf(p.l, k), lo: 0, hi: Infinity, mean: p.l, varX: p.l, label: `P(${vn(p.l)})` };
  }
  if (d === 'hyper') {
    if (!(int(p.N) && p.N >= 1 && p.N <= 100000)) throw new Error('N phải là số nguyên từ 1 đến 100 000.');
    if (!(int(p.M) && p.M >= 0 && p.M <= p.N)) throw new Error('M phải là số nguyên trong [0; N].');
    if (!(int(p.n) && p.n >= 1 && p.n <= p.N)) throw new Error('n phải là số nguyên trong [1; N].');
    const q = p.M / p.N;
    return { pmf: (k) => hyperPmf(p.N, p.M, p.n, k), lo: Math.max(0, p.n - (p.N - p.M)), hi: Math.min(p.n, p.M), mean: p.n * q,
      varX: p.N > 1 ? p.n * q * (1 - q) * ((p.N - p.n) / (p.N - 1)) : 0, label: `H(${p.N}; ${p.M}; ${p.n})` };
  }
  if (!Number.isFinite(p.mu)) throw new Error('Hãy nhập μ.');
  if (!(p.sigma > 0)) throw new Error('σ phải lớn hơn 0.');
  return { mean: p.mu, varX: p.sigma ** 2, label: `N(${vn(p.mu)}; ${vn(p.sigma)}²)` };
}

export function render(root) {
  let dist = 'binom', mode = 'range';
  const chips = h('div.chips', { role: 'group', 'aria-label': 'Chọn phân phối' });
  const modes = h('div.chips', { role: 'group', 'aria-label': 'Xác suất cần tính' });
  const fields = h('div.hyp-fields');
  const kIn = h('input', { type: 'text', inputmode: 'decimal', id: 'pp-k' });
  const aIn = h('input', { type: 'text', inputmode: 'decimal', id: 'pp-a' });
  const bIn = h('input', { type: 'text', inputmode: 'decimal', id: 'pp-b' });
  const fk = h('label.field', { for: kIn.id }, h('span', {}, 'Giá trị k'), kIn);
  const fa = h('label.field', { for: aIn.id }, h('span', {}, 'Cận dưới a (bỏ trống: −∞)'), aIn);
  const fb = h('label.field', { for: bIn.id }, h('span', {}, 'Cận trên b (bỏ trống: +∞)'), bIn);
  const out = h('div', { 'aria-live': 'polite' });
  const plot = h('div');
  const steps = stepRail('Các bước tính xác suất');

  const build = () => {
    chips.replaceChildren(...Object.entries(DISTS).map(([k, v]) => h('button.chip', { type: 'button', 'aria-pressed': String(k === dist), onclick: () => { dist = k; if (k === 'normal') mode = 'range'; build(); paint(); } }, v.name)));
    fields.replaceChildren(...DISTS[dist].fields.map(([k, label]) => {
      const input = h('input', { type: 'text', inputmode: 'decimal', id: `pp-${k}`, name: k, oninput: paint });
      return h('label.field', { for: input.id }, h('span', {}, label), input);
    }));
  };
  const paintModes = () => modes.replaceChildren(...[['one', 'P(X = k)'], ['range', dist === 'normal' ? 'P(a < X < b)' : 'P(a ≤ X ≤ b)']]
    .filter(([k]) => !(dist === 'normal' && k === 'one'))
    .map(([k, label]) => h('button.chip', { type: 'button', 'aria-pressed': String(k === mode), onclick: () => { mode = k; paint(); } }, label)));

  const row = (label, body, value = '') => h('div.row', {}, h('b', {}, label), body, h('em', {}, value));
  const tex = (x) => rich(`$\\displaystyle ${x}$`, 'span', true);

  function paint() {
    paintModes();
    fk.hidden = mode !== 'one'; fa.hidden = fb.hidden = mode !== 'range';
    const p = {};
    for (const [k] of DISTS[dist].fields) p[k] = num(fields.querySelector(`[name="${k}"]`).value);
    if (untouched(p, DISTS[dist].fields.map(([k]) => k))) {
      steps.paint(STEPS, false); plot.replaceChildren();
      return out.replaceChildren(h('p.muted', {}, t('Nhập số liệu vào các ô bên trái, kết quả hiện ngay.')));
    }
    try {
      const m = model(dist, p);
      const sd = Math.sqrt(m.varX);
      // Bounds: empty means −∞ / +∞. Discrete: P(a ≤ X ≤ b) over integers.
      const a = String(aIn.value).trim() === '' ? -Infinity : num(aIn.value), b = String(bIn.value).trim() === '' ? Infinity : num(bIn.value);
      const k = num(kIn.value);
      if (mode === 'one' && !int(k)) throw new Error('k phải là số nguyên.');
      if (mode === 'range' && (Number.isNaN(a) || Number.isNaN(b))) throw new Error('Hãy nhập số cho a và b, hoặc bỏ trống.');
      if (mode === 'range' && a > b) throw new Error('Cần a ≤ b.');
      const rows = [];
      let prob, what, how;
      if (dist === 'normal') {
        prob = normalRange(p.mu, p.sigma, a, b);
        what = `P(${a === -Infinity ? '−∞' : vn(a)} < X < ${b === Infinity ? '+∞' : vn(b)})`;
        const z = (x) => (x === Infinity ? '+\\infty' : x === -Infinity ? '-\\infty' : tn((x - p.mu) / p.sigma));
        how = `\\Phi\\left(\\frac{b-\\mu}{\\sigma}\\right)-\\Phi\\left(\\frac{a-\\mu}{\\sigma}\\right)=\\Phi(${z(b)})-\\Phi(${z(a)})`;
        const lo = p.mu - 4 * p.sigma, hi = p.mu + 4 * p.sigma, f = (x) => normPdf(x, p.mu, p.sigma);
        plot.replaceChildren(h('figure.viz', {}, densityPlot({ lo, hi, curves: [{ pdf: f }], shade: [{ a: Math.max(lo, a), b: Math.min(hi, b), pdf: f, cls: 'ci' }],
          ticks: [-3, -2, -1, 0, 1, 2, 3].map((z) => ({ x: p.mu + z * p.sigma, label: vn(p.mu + z * p.sigma, 2) })), label: m.label }),
        h('figcaption', {}, `${m.label}: ${t('phần tô xanh là xác suất cần tính')}`)));
      } else {
        const lo = mode === 'one' ? k : Math.max(m.lo, Math.ceil(a)), hi = mode === 'one' ? k : Math.min(m.hi, Math.floor(b));
        prob = mode === 'one' ? m.pmf(k) : rangeProb(m.pmf, lo, Math.min(hi, Math.ceil(m.mean + 40 * sd + 50))) /* beyond μ + 40σ the tail is far below the 6 digits shown */;
        what = mode === 'one' ? `P(X = ${k})` : `P(${a === -Infinity ? '−∞' : vn(a)} ≤ X ≤ ${b === Infinity ? '+∞' : vn(b)})`;
        // No value of X in the asked set (k outside the support, or a > b after rounding): the probability is 0.
        how = lo > hi || (mode === 'one' && (k < m.lo || k > m.hi)) ? '0'
          : mode === 'range' ? `\\sum_{k=${lo}}^{${hi === Infinity ? '\\infty' : hi}} P(X=k)`
          : dist === 'binom' ? `C_{${p.n}}^{${k}}\\,(${tn(p.p)})^{${k}}\\,(${tn(1 - p.p)})^{${p.n - k}}`
          : dist === 'poisson' ? `\\dfrac{e^{-${tn(p.l)}}\\,${tn(p.l)}^{${k}}}{${k}!}`
          : `\\dfrac{C_{${p.M}}^{${k}}\\,C_{${p.N - p.M}}^{${p.n - k}}}{C_{${p.N}}^{${p.n}}}`;
        if (dist === 'binom') {
          rows.push(row(t('Mốt'), h('span', {}, t('Giá trị có xác suất lớn nhất (np − q ≤ k₀ ≤ np − q + 1)')), binomMode(p.n, p.p).join('; ')));
          // Course approximations, shown with their error so students see when they are good.
          const pois = mode === 'one' ? poissonPmf(p.n * p.p, k) : rangeProb((j) => poissonPmf(p.n * p.p, j), Math.max(0, lo), hi);
          rows.push(row(t('Xấp xỉ Poisson'), h('span', {}, `λ = np = ${vn(p.n * p.p)} · ${t('sai lệch')} ${vn(Math.abs(pois - prob), 5)}`), vn(pois, 5)));
          if (mode === 'range' && p.p > 0 && p.p < 1) {
            const na = binomNormalApprox(p.n, p.p, Math.max(lo, 0), Math.min(hi, p.n));
            rows.push(row(t('Xấp xỉ chuẩn'), h('span', {}, `${t('không hiệu chỉnh ±0,5 như slide')} · ${t('sai lệch')} ${vn(Math.abs(na - prob), 5)}`), vn(na, 5)));
          }
        }
        if (dist === 'hyper') {
          const q = p.M / p.N, bi = mode === 'one' ? binomPmf(p.n, q, k) : rangeProb((j) => binomPmf(p.n, q, j), Math.max(0, lo), Math.min(hi, p.n));
          rows.push(row(t('Xấp xỉ nhị thức'), h('span', {}, `B(n; M/N) = B(${p.n}; ${vn(q)}) · ${t('sai lệch')} ${vn(Math.abs(bi - prob), 5)}`), vn(bi, 5)));
        }
        // Bars from the mean ± 4σ (at most 61 bars), the asked values in red.
        const from = Math.max(m.lo, Math.floor(m.mean - 4 * sd) - 1), to = Math.min(m.hi, Math.max(from + 10, Math.ceil(m.mean + 4 * sd) + 1), from + 60);
        const ks = []; for (let j = from; j <= to; j++) ks.push(j);
        plot.replaceChildren(h('figure.viz', {}, barChart(ks.map(String), ks.map((j) => m.pmf(j)), { hl: ks.map((j, i) => (j >= lo && j <= hi ? i : -1)).filter((i) => i >= 0) }),
          h('figcaption', {}, `${m.label}: ${t('cột đỏ là các giá trị được tính')}`)));
      }
      how = `${what.replace(/,/g, '{,}').replace(/≤/g, '\\le ').replace(/−∞/g, '-\\infty').replace(/\+∞/g, '+\\infty')}=${how}`;
      steps.paint(STEPS, true);
      out.replaceChildren(h('div.board', {},
        steps.row(0, row(`${t('Bước')} 1`, tex(`X\\sim ${m.label.replace(/,/g, '{,}')}:\\ ${LAW[dist][0]}`))),
        steps.row(1, row(`${t('Bước')} 2`, h('span', {}, tex(LAW[dist][1]), h('br'), `E(X) = ${vn(m.mean)} · Var(X) = ${vn(m.varX)} · σ(X) = ${vn(sd)}`))),
        steps.row(2, row(`${t('Bước')} 3`, tex(how))),
        steps.row(3, h('div.row.top-tier', {}, h('b', {}, `${t('Bước')} 4`), h('span', {}, `${m.label} · ${what}`), h('em', {}, vn(prob, 6)))),
        ...rows));
    } catch (e) { steps.paint(STEPS, false); out.replaceChildren(h('div.error', { role: 'alert' }, t(e.message))); plot.replaceChildren(); }
  }
  [kIn, aIn, bIn].forEach((el) => el.addEventListener('input', paint));
  build(); paint();
  addEventListener('langchange', paint); // the result board is built with tr()

  root.append(
    h('div.stack', { style: 'margin-bottom:22px' }, chips, modes),
    h('div.work', {},
      h('section.panel.stack', { 'aria-label': 'Tham số' }, h('h2', {}, 'Tham số'), fields, h('div.hyp-fields', {}, fk, fa, fb), plot),
      h('section.panel.ticket.sticky-col.tool', { 'aria-label': 'Kết quả' }, steps.el, out)));
}
