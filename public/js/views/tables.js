// Interactive distribution tables: the Laplace function Φ(x), Student t, χ² and Fisher F, read both ways
// (value → probability, α → upper quantile), the area drawn on the curve, and the printed table row for the chosen df.
import { h } from '../ui.js';
import { tr as t } from '../i18n.js';
import { densityPlot } from '../viz.js';
import { laplace, normPdf, zUpper, tUpper, chiUpper, fUpper, tCdf, chi2Cdf, fCdf, tPdf, chi2Pdf, fPdf } from '../statlib.js';

export const meta = { title: 'Bảng tra phân phối', lede: 'Tra hàm Laplace Φ(x), phân vị Student, χ² và Fisher như bảng in cuối giáo trình, nhưng thấy được diện tích trên đồ thị.\nKết quả tính chính xác bằng máy, không dùng AI.' };

export const vn = (x, d = 4) => (Number.isFinite(x) ? String(+x.toFixed(d)).replace('.', ',').replace('-', '−') : '—');
const num = (el) => Number(String(el.value).replace(',', '.'));
const ALPHAS = [0.1, 0.05, 0.025, 0.01, 0.005];

const DISTS = {
  z: { name: 'Hàm Laplace Φ(x)', dfs: 0, pdf: () => (x) => normPdf(x), cdf: () => (x) => laplace(x) + 0.5, q: (a) => zUpper(a), sym: () => 'z_α', range: () => [-4, 4] },
  t: { name: 'Student t(k)', dfs: 1, pdf: ([k]) => (x) => tPdf(x, k), cdf: ([k]) => (x) => tCdf(x, k), q: (a, [k]) => tUpper(a, k), sym: ([k]) => `t_α(${k})`, range: ([k]) => { const r = Math.max(4, tUpper(0.005, k) * 1.15); return [-r, r]; } },
  chi: { name: 'Khi bình phương χ²(k)', dfs: 1, pdf: ([k]) => (x) => chi2Pdf(x, k), cdf: ([k]) => (x) => chi2Cdf(x, k), q: (a, [k]) => chiUpper(a, k), sym: ([k]) => `χ²_α(${k})`, range: ([k]) => [0, chiUpper(0.001, k)] },
  f: { name: 'Fisher F(k₁; k₂)', dfs: 2, pdf: ([a, b]) => (x) => fPdf(x, a, b), cdf: ([a, b]) => (x) => fCdf(x, a, b), q: (al, [a, b]) => fUpper(al, a, b), sym: ([a, b]) => `F_α(${a};${b})`, range: ([a, b]) => [0, Math.min(12, fUpper(0.005, a, b) * 1.1)] },
};

export function render(root) {
  let dist = 'z', mode = 'q';
  const chips = h('div.chips', { role: 'group', 'aria-label': 'Chọn phân phối' });
  const modes = h('div.chips', { role: 'group', 'aria-label': 'Cách tra' });
  const k1 = h('input', { type: 'number', id: 'bt-k1', min: 1, max: 500, step: 1, value: 10, inputmode: 'numeric' });
  const k2 = h('input', { type: 'number', id: 'bt-k2', min: 1, max: 500, step: 1, value: 12, inputmode: 'numeric' });
  const xIn = h('input', { type: 'text', id: 'bt-x', value: '1,96', inputmode: 'decimal' });
  const aIn = h('input', { type: 'text', id: 'bt-a', value: '0,05', inputmode: 'decimal' });
  const f1 = h('label.field', { for: k1.id }, h('span', {}, 'Bậc tự do k (k₁)'), k1);
  const f2 = h('label.field', { for: k2.id }, h('span', {}, 'Bậc tự do k₂'), k2);
  const fx = h('label.field', { for: xIn.id }, h('span', {}, 'Giá trị x'), xIn);
  const fa = h('label.field', { for: aIn.id }, h('span', {}, 'Mức α (diện tích bên phải)'), aIn);
  const plot = h('figure.viz');
  const board = h('div.board');
  const table = h('div');

  const paint = () => {
    chips.replaceChildren(...Object.entries(DISTS).map(([k, d]) => h('button.chip', { type: 'button', 'aria-pressed': String(k === dist), onclick: () => { dist = k; paint(); } }, d.name)));
    modes.replaceChildren(...[['q', 'Từ α tìm phân vị'], ['p', 'Từ x tìm xác suất']].map(([k, label]) => h('button.chip', { type: 'button', 'aria-pressed': String(k === mode), onclick: () => { mode = k; paint(); } }, label)));
    const D = DISTS[dist];
    f1.hidden = D.dfs < 1; f2.hidden = D.dfs < 2; fx.hidden = mode !== 'p'; fa.hidden = mode !== 'q';
    const dfs = [Math.round(num(k1)), Math.round(num(k2))].slice(0, D.dfs);
    if (dfs.some((k) => !(k >= 1 && k <= 500))) return show(t('Bậc tự do phải là số nguyên từ 1 đến 500.'));
    const pdf = D.pdf(dfs), cdf = D.cdf(dfs), [lo, hi] = D.range(dfs);
    let x, right;
    if (mode === 'q') {
      right = num(aIn);
      if (!(right > 0 && right < 1)) return show(t('α phải nằm trong (0; 1), ví dụ 0,05.'));
      x = D.q(right, dfs);
    } else {
      x = num(xIn);
      if (!Number.isFinite(x)) return show(t('Hãy nhập một số, ví dụ 1,96.'));
      right = 1 - cdf(x);
    }
    plot.replaceChildren(densityPlot({ lo, hi, curves: [{ pdf }], shade: [{ a: x, b: hi, pdf, cls: 'w' }],
      marks: [{ x, label: `x = ${vn(x)}` }], ticks: dist === 'z' ? [-3, -2, -1, 0, 1, 2, 3].map((v) => ({ x: v, label: vn(v) })) : [], label: D.name }),
    h('figcaption', {}, `${t(D.name)}: ${t('phần tô đỏ là diện tích bên phải x, bằng')} ${vn(right)}`));
    const rows = dist === 'z'
      ? [['Φ(x)', 'P{0 ≤ Z ≤ x}', laplace(x)], ['P(Z < x)', '0,5 + Φ(x)', 0.5 + laplace(x)], ['P(Z > x)', '0,5 − Φ(x)', right]]
      : [['P(X < x)', 'Diện tích bên trái', 1 - right], ['P(X > x)', 'Diện tích bên phải (α)', right]];
    board.replaceChildren(
      h('div.row.top-tier', {}, h('b', {}, mode === 'q' ? D.sym(dfs) : 'x'), h('span', {}, mode === 'q' ? `${t('Phân vị trên mức')} α = ${vn(right)}` : t('Giá trị đã nhập')), h('em', {}, vn(x))),
      ...rows.map(([a, b, v]) => h('div.row', {}, h('b', {}, a), h('span', {}, t(b)), h('em', {}, vn(v)))));
    // The printed table: the row of upper quantiles for this df.
    table.replaceChildren(h('h3', {}, dist === 'z' ? t('Các phân vị hay dùng') : `${t('Hàng bảng tra')} ${D.sym(dfs).replace('_α', '')}`),
      h('div.qtable', { role: 'table', 'aria-label': 'Bảng phân vị' },
        h('div.qt-row', { role: 'row' }, h('span', { role: 'columnheader' }, 'α'), ...ALPHAS.map((a) => h('span', { role: 'columnheader' }, vn(a, 3)))),
        h('div.qt-row', { role: 'row' }, h('span', { role: 'rowheader' }, D.sym(dfs)), ...ALPHAS.map((a) => h('span', { role: 'cell', 'data-hl': mode === 'q' && Math.abs(a - right) < 1e-9 ? '' : null }, vn(D.q(a, dfs), 3))))),
      dist === 'z' ? h('p.muted', { style: 'margin-top:8px' }, t('Giáo trình làm tròn: z₀,₀₅ ≈ 1,65; z₀,₀₂₅ ≈ 1,96; z₀,₀₀₅ ≈ 2,58.')) : null);
  };
  const show = (msg) => { board.replaceChildren(h('div.error', { role: 'alert' }, msg)); plot.replaceChildren(); table.replaceChildren(); };
  [k1, k2, xIn, aIn].forEach((el) => el.addEventListener('input', paint));
  paint();
  addEventListener('langchange', paint); // the result board and captions are built with tr()

  root.append(
    h('div.stack', { style: 'margin-bottom:22px' }, chips, modes),
    h('div.work', {},
      h('section.panel.stack', { 'aria-label': 'Nhập' }, h('div.toolbar', { style: 'margin:0' }, f1, f2, fx, fa), plot),
      h('section.panel.ticket.tool', { 'aria-label': 'Kết quả tra bảng', 'aria-live': 'polite' }, board, table)));
}
