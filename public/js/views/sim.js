// Simulation lab («Show probability, don't just state it»): law of large numbers, central limit theorem,
// confidence-interval coverage, type I/II errors. Random draws in the browser; no AI.
import { h } from '../ui.js';
import { tr as t } from '../i18n.js';
import { densityPlot } from '../viz.js';
import { vn } from './tables.js';
import { normPdf, normCdf, zUpper } from '../statlib.js';

export const meta = { title: 'Phòng mô phỏng', lede: 'Tự tay tung đồng xu, lấy mẫu, dựng khoảng tin cậy và xem sai lầm khi kiểm định.\nMỗi thí nghiệm chạy ngẫu nhiên ngay trên máy của bạn, mỗi lần một khác.' };

const NS = 'http://www.w3.org/2000/svg';
const gauss = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); };
const svgEl = (W, H, inner, label) => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', `0 0 ${W} ${H}`); s.setAttribute('role', 'img'); s.setAttribute('aria-label', label); s.innerHTML = inner; return s; };
const slider = (id, label, min, max, step, value, fmt = (v) => vn(+v, 2)) => {
  const input = h('input', { type: 'range', id, min, max, step, value });
  const out = h('output', { for: id }, fmt(value));
  input.addEventListener('input', () => { out.textContent = fmt(input.value); });
  return { input, el: h('label.field.range', { for: id }, h('span', {}, label, ' ', out), input) };
};
const result = (rows) => h('div.board', {}, rows.map(([b, s, e], i) => h(i ? 'div.row' : 'div.row.top-tier', {}, h('b', {}, b), h('span', {}, t(s)), h('em', {}, e))));

// ---- 1. Law of large numbers: the running frequency of heads settles at p.
function lln() {
  const p = slider('lln-p', 'Xác suất mặt ngửa p', 0.05, 0.95, 0.05, 0.5);
  let flips = [];
  const fig = h('figure.viz'), board = h('div');
  const draw = () => {
    const W = 560, H = 220, P = 30, n = flips.length, pv = +p.input.value;
    let heads = 0;
    const pts = flips.map((f, i) => { heads += f; return [i + 1, heads / (i + 1)]; });
    const X = (i) => P + (Math.log10(i) / Math.log10(Math.max(10, n))) * (W - 2 * P), Y = (y) => H - P - y * (H - 2 * P);
    const step = Math.max(1, Math.floor(n / 400));
    const path = pts.filter((_, i) => i % step === 0 || i === n - 1).map(([i, f]) => `${X(i).toFixed(1)},${Y(f).toFixed(1)}`).join(' L');
    fig.replaceChildren(svgEl(W, H, `<line class="axis" x1="${P}" x2="${W - P}" y1="${H - P}" y2="${H - P}"/><line class="axis" x1="${P}" x2="${P}" y1="${P - 10}" y2="${H - P}"/>
      <line class="ref" x1="${P}" x2="${W - P}" y1="${Y(pv)}" y2="${Y(pv)}"/><text x="${W - P}" y="${Y(pv) - 6}" text-anchor="end">p = ${vn(pv, 2)}</text>
      <text x="${P - 6}" y="${Y(1) + 4}" text-anchor="end">1</text><text x="${P - 6}" y="${Y(0) + 4}" text-anchor="end">0</text>
      <text x="${W - P}" y="${H - 8}" text-anchor="end">n = ${n} (${t('thang log')})</text>${n ? `<path class="trace" d="M${path}"/>` : ''}`, t('Tần suất mặt ngửa theo số lần tung')),
    h('figcaption', {}, t('Tần suất fₙ = số lần ngửa / n dao động mạnh lúc đầu rồi tiến về p.')));
    const f = n ? heads / n : NaN;
    board.replaceChildren(result([['fₙ', 'Tần suất mặt ngửa', vn(f, 3)], ['n', 'Số lần đã tung', String(n)], ['|fₙ − p|', 'Độ lệch so với p', vn(Math.abs(f - pv), 3)]]));
  };
  const flip = (k) => { const pv = +p.input.value; for (let i = 0; i < k && flips.length < 100000; i++) flips.push(Math.random() < pv ? 1 : 0); draw(); };
  p.input.addEventListener('change', () => { flips = []; draw(); });
  draw();
  return { name: 'Luật số lớn', draw, el: [h('div.toolbar', {}, p.el, h('div.btn-row', {}, ...[1, 10, 100, 1000].map((k) => h(k === 100 ? 'button.btn.btn-primary' : 'button.btn', { type: 'button', onclick: () => flip(k) }, 'Tung', ` ${k}`)),
    h('button.btn.btn-ghost', { type: 'button', onclick: () => { flips = []; draw(); } }, 'Làm lại'))), h('div.work', {}, fig, board)] };
}

// ---- 2. Central limit theorem: means of n draws from a skewed population look normal.
const POPS = {
  exp: { name: 'Lệch phải (mũ, μ = 1)', draw: () => -Math.log(1 - Math.random()), mu: 1, sd: 1, lo: 0, hi: 5 },
  uni: { name: 'Đều trên [0; 1]', draw: Math.random, mu: 0.5, sd: Math.sqrt(1 / 12), lo: 0, hi: 1 },
  ber: { name: 'Bernoulli p = 0,2', draw: () => (Math.random() < 0.2 ? 1 : 0), mu: 0.2, sd: 0.4, lo: 0, hi: 1 },
};
function clt() {
  const n = slider('clt-n', 'Cỡ mẫu n', 1, 60, 1, 5, (v) => String(v));
  const pop = h('select', { id: 'clt-pop' }, Object.entries(POPS).map(([k, v]) => h('option', { value: k }, v.name)));
  let means = [];
  const fig = h('figure.viz'), board = h('div');
  const draw = () => {
    const P0 = POPS[pop.value], k = +n.input.value, W = 560, H = 220, P = 26, bins = 30;
    const se = P0.sd / Math.sqrt(k), lo = Math.max(P0.lo, P0.mu - 4 * se), hi = Math.min(P0.hi, P0.mu + 4 * se), w = (hi - lo) / bins;
    const counts = new Array(bins).fill(0);
    for (const m of means) { const i = Math.floor((m - lo) / w); if (i >= 0 && i < bins) counts[i] += 1; }
    const dens = counts.map((c) => (means.length ? c / (means.length * w) : 0));
    const top = Math.max(...dens, normPdf(P0.mu, P0.mu, se));
    const X = (x) => P + ((x - lo) / (hi - lo)) * (W - 2 * P), Y = (y) => H - P - (y / top) * (H - 2 * P - 6);
    let g = dens.map((d, i) => `<rect class="bar" x="${X(lo + i * w) + 0.5}" y="${Y(d)}" width="${Math.max(0.5, X(lo + w) - X(lo) - 1)}" height="${H - P - Y(d)}"/>`).join('');
    const curve = [...Array(121).keys()].map((i) => { const x = lo + (i / 120) * (hi - lo); return `${X(x).toFixed(1)},${Y(normPdf(x, P0.mu, se)).toFixed(1)}`; }).join(' L');
    g += `<path class="trace red" d="M${curve}"/><line class="axis" x1="${P}" x2="${W - P}" y1="${H - P}" y2="${H - P}"/><text x="${X(P0.mu)}" y="${H - 8}" text-anchor="middle">μ = ${vn(P0.mu, 2)}</text>`;
    fig.replaceChildren(svgEl(W, H, g, t('Phân phối của trung bình mẫu')), h('figcaption', {}, t('Cột xanh: các trung bình mẫu đã lấy. Đường đỏ: N(μ; σ²/n) theo định lí giới hạn trung tâm.')));
    const mean = means.reduce((a, b) => a + b, 0) / (means.length || NaN);
    const sd = Math.sqrt(means.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, means.length - 1));
    board.replaceChildren(result([['Số mẫu', 'Số trung bình mẫu đã lấy', String(means.length)], ['TB', 'Trung bình của các x̄ (gần μ)', vn(mean, 3)], ['Độ lệch', 'Độ lệch chuẩn của các x̄', vn(sd, 3)], ['σ/√n', 'Lí thuyết dự đoán', vn(se, 3)]]));
  };
  const sample = (times) => { const P0 = POPS[pop.value], k = +n.input.value; for (let j = 0; j < times; j++) { let s = 0; for (let i = 0; i < k; i++) s += P0.draw(); means.push(s / k); } draw(); };
  const reset = () => { means = []; draw(); };
  n.input.addEventListener('change', reset); pop.addEventListener('change', reset);
  draw();
  return { name: 'Định lí giới hạn trung tâm', draw, el: [h('div.toolbar', {}, h('label.field', { for: pop.id }, h('span', {}, 'Tổng thể'), pop), n.el,
    h('div.btn-row', {}, h('button.btn', { type: 'button', onclick: () => sample(1) }, 'Lấy 1 mẫu'), h('button.btn.btn-primary', { type: 'button', onclick: () => sample(500) }, 'Lấy 500 mẫu'), h('button.btn.btn-ghost', { type: 'button', onclick: reset }, 'Làm lại'))),
  h('div.work', {}, fig, board)] };
}

// ---- 3. Confidence intervals: about (1 − α)·100% of them contain μ.
function ci() {
  const n = slider('ci-n', 'Cỡ mẫu n', 5, 100, 1, 30, (v) => String(v));
  const conf = h('select', { id: 'ci-conf' }, [0.9, 0.95, 0.99].map((c) => h('option', { value: c, selected: c === 0.95 }, `${Math.round(c * 100)}%`)));
  const MU = 50, SIG = 10;
  let ivs = [], hit = 0, total = 0;
  const fig = h('figure.viz'), board = h('div');
  const draw = () => {
    const W = 560, H = 260, P = 20, lo = MU - 12, hi = MU + 12, X = (x) => P + ((Math.max(lo, Math.min(hi, x)) - lo) / (hi - lo)) * (W - 2 * P);
    const rows = ivs.slice(-50), gap = (H - 30) / 50;
    let g = `<line class="ref" x1="${X(MU)}" x2="${X(MU)}" y1="6" y2="${H - 22}"/><text x="${X(MU)}" y="${H - 6}" text-anchor="middle">μ = ${MU}</text>`;
    rows.forEach(([a, b], i) => { const miss = MU < a || MU > b, y = 10 + i * gap; g += `<line class="iv${miss ? ' miss' : ''}" x1="${X(a)}" x2="${X(b)}" y1="${y}" y2="${y}"/>`; });
    fig.replaceChildren(svgEl(W, H, g, t('Các khoảng tin cậy')), h('figcaption', {}, t('50 khoảng gần nhất. Khoảng đỏ không chứa μ.')));
    board.replaceChildren(result([['Tỉ lệ chứa μ', 'Số khoảng chứa μ / số khoảng đã dựng', total ? `${vn((100 * hit) / total, 1)}%` : '—'], ['Đã dựng', 'Số khoảng', String(total)], ['Độ tin cậy', 'Lí thuyết dự đoán', `${Math.round(+conf.value * 100)}%`]]));
  };
  // σ known: ε = z_{α/2}·σ/√n, as in Bài 5.
  const make = (k) => {
    const nn = +n.input.value, z = zUpper((1 - +conf.value) / 2), eps = (z * SIG) / Math.sqrt(nn);
    for (let j = 0; j < k; j++) { let s = 0; for (let i = 0; i < nn; i++) s += MU + SIG * gauss(); const xb = s / nn; ivs.push([xb - eps, xb + eps]); total += 1; if (Math.abs(xb - MU) <= eps) hit += 1; }
    if (ivs.length > 200) ivs = ivs.slice(-50);
    draw();
  };
  const reset = () => { ivs = []; hit = 0; total = 0; draw(); };
  n.input.addEventListener('change', reset); conf.addEventListener('change', reset);
  draw();
  return { name: 'Khoảng tin cậy', draw, el: [h('p.muted', { style: 'margin-bottom:14px' }, 'Tổng thể N(50; 10²), σ đã biết: mỗi mẫu cho khoảng x̄ ± ε với ε = z(α/2)·σ/√n, như Bài 5.'),
    h('div.toolbar', {}, n.el, h('label.field', { for: conf.id }, h('span', {}, 'Độ tin cậy'), conf),
      h('div.btn-row', {}, h('button.btn', { type: 'button', onclick: () => make(1) }, 'Dựng 1 khoảng'), h('button.btn.btn-primary', { type: 'button', onclick: () => make(100) }, 'Dựng 100 khoảng'), h('button.btn.btn-ghost', { type: 'button', onclick: reset }, 'Làm lại'))),
    h('div.work', {}, fig, board)] };
}

// ---- 4. Type I and II errors for H0: μ = 0 against H1: μ > 0 (σ = 1).
function errors() {
  const mu1 = slider('er-mu', 'Trung bình thật μ₁', 0.1, 1.5, 0.05, 0.5);
  const n = slider('er-n', 'Cỡ mẫu n', 4, 100, 1, 16, (v) => String(v));
  const alpha = h('select', { id: 'er-a' }, [0.1, 0.05, 0.01].map((a) => h('option', { value: a, selected: a === 0.05 }, vn(a, 2))));
  const fig = h('figure.viz'), board = h('div');
  const draw = () => {
    const m = +mu1.input.value, k = +n.input.value, a = +alpha.value, se = 1 / Math.sqrt(k), c = zUpper(a) * se;
    const beta = normCdf((c - m) / se);
    const f0 = (x) => normPdf(x, 0, se), f1 = (x) => normPdf(x, m, se), lo = -4 * se, hi = m + 4 * se;
    fig.replaceChildren(densityPlot({ lo, hi, curves: [{ pdf: f0, cls: 'h0' }, { pdf: f1, cls: 'h1' }], shade: [{ a: c, b: hi, pdf: f0, cls: 'w' }, { a: lo, b: c, pdf: f1, cls: 'beta' }],
      marks: [{ x: c, label: `${t('ngưỡng')} ${vn(c, 3)}` }], ticks: [{ x: 0, label: 'μ₀ = 0' }, { x: m, label: `μ₁ = ${vn(m, 2)}` }], label: t('Sai lầm loại I và loại II') }),
    h('figcaption', {}, t('Đường xanh: x̄ khi H₀ đúng. Đường xám nét đứt: x̄ khi μ = μ₁. Đỏ: α (bác bỏ nhầm H₀). Vàng: β (bỏ sót H₁).')));
    board.replaceChildren(result([['1 − β', 'Lực kiểm định: phát hiện được μ₁', vn(1 - beta, 3)], ['α', 'Sai lầm loại I: bác bỏ H₀ khi H₀ đúng', vn(a, 3)], ['β', 'Sai lầm loại II: chấp nhận H₀ khi H₁ đúng', vn(beta, 3)]]));
  };
  [mu1.input, n.input].forEach((el) => el.addEventListener('input', draw)); alpha.addEventListener('change', draw);
  draw();
  return { name: 'Sai lầm loại I và II', draw, el: [h('p.muted', { style: 'margin-bottom:14px' }, 'H₀: μ = 0, H₁: μ > 0, σ = 1. Kéo thanh trượt: tăng n hoặc μ₁ làm β nhỏ lại; giảm α làm β lớn lên.'),
    h('div.toolbar', {}, mu1.el, n.el, h('label.field', { for: alpha.id }, h('span', {}, 'Mức ý nghĩa α'), alpha)), h('div.work', {}, fig, board)] };
}

export function render(root) {
  const labs = [lln(), clt(), ci(), errors()];
  // Charts and result boards are drawn with tr(): redraw them in the new language (static labels flip by themselves).
  addEventListener('langchange', () => labs.forEach((l) => l.draw()));
  let cur = 0;
  const tabs = h('div.chips', { role: 'group', 'aria-label': 'Thí nghiệm' });
  const panes = labs.map((l, i) => h('section.panel.sim.tool', { hidden: i !== 0, 'aria-label': l.name }, h('h2', {}, l.name), ...l.el));
  const paint = () => {
    tabs.replaceChildren(...labs.map((l, i) => h('button.chip', { type: 'button', 'aria-pressed': String(i === cur), onclick: () => { cur = i; paint(); } }, l.name)));
    panes.forEach((p, i) => { p.hidden = i !== cur; });
  };
  paint();
  root.append(h('div', { style: 'margin-bottom:22px' }, tabs), ...panes);
}
