// Hypothesis-test assistant: the 4 steps of the lecturer's slides (H0/H1 → miền bác bỏ W → Z_qs → kết luận),
// computed exactly in the browser (statlib.js), with the rejection region drawn on the curve. No AI.
import { h, smooth, rich } from '../ui.js';
import { dataRows } from '../datarows.js';
import { tr as t } from '../i18n.js';
import { densityPlot } from '../viz.js';
import { vn } from './tables.js';
import { describe, normPdf, tPdf, chi2Pdf, fPdf, testMean, testProp, testVar, testTwoMeans, testTwoProps, testTwoVars } from '../statlib.js';

export const meta = { title: 'Kiểm định giả thuyết', lede: 'Nhập số liệu đề cho, chọn đối thiết và mức ý nghĩa: trang đi qua đủ 4 bước như slide bài giảng và vẽ miền bác bỏ.\nTính chính xác bằng máy, không dùng AI, để bạn đối chiếu bài tự làm.' };

const STEPS = ['Lập giả thiết', 'Miền bác bỏ W', 'Giá trị quan sát', 'Kết luận'];
// Each test: parameter symbol, the fields it needs ([key, label, default]), and the function.
const TESTS = {
  mean: { name: 'Trung bình μ', theta: '\\mu', zero: '\\mu_0', fields: [['n', 'Cỡ mẫu n', 36], ['xbar', 'Trung bình mẫu x̄', 52], ['s', 'Độ lệch chuẩn mẫu s', 6], ['sigma', 'σ đã biết (bỏ trống nếu chưa biết)', ''], ['mu0', 'Giá trị kiểm định μ₀', 50]], run: testMean, data: true },
  prop: { name: 'Tỉ lệ p', theta: 'p', zero: 'p_0', fields: [['n', 'Cỡ mẫu n', 400], ['k', 'Số phần tử có tính chất k', 220], ['p0', 'Tỉ lệ kiểm định p₀', 0.5]], run: testProp },
  var: { name: 'Phương sai σ²', theta: '\\sigma^2', zero: '\\sigma_0^2', fields: [['n', 'Cỡ mẫu n', 11], ['s2', 'Phương sai mẫu hiệu chỉnh s²', 9], ['sigma02', 'Giá trị kiểm định σ₀²', 4]], run: testVar, data: true },
  mean2: { name: 'So sánh 2 trung bình', theta: '\\mu_1', zero: '\\mu_2', fields: [['n', 'Cỡ mẫu X: n', 50], ['xbar', 'x̄', 20], ['s1', 's₁', 4], ['m', 'Cỡ mẫu Y: m', 50], ['ybar', 'ȳ', 18], ['s2', 's₂', 3]], run: testTwoMeans },
  prop2: { name: 'So sánh 2 tỉ lệ', theta: 'p_1', zero: 'p_2', fields: [['n', 'Cỡ mẫu X: n', 200], ['k1', 'k₁', 60], ['m', 'Cỡ mẫu Y: m', 300], ['k2', 'k₂', 60]], run: testTwoProps },
  var2: { name: 'So sánh 2 phương sai', theta: '\\sigma_1^2', zero: '\\sigma_2^2', fields: [['n', 'Cỡ mẫu X: n', 10], ['s1', 's₁', 2], ['m', 'Cỡ mẫu Y: m', 13], ['s2', 's₂', 3]], run: testTwoVars, noLt: true },
};
const TAILS = [['two', '\\ne', 'Hai phía (≠)'], ['gt', '>', 'Lớn hơn (>)'], ['lt', '<', 'Bé hơn (<)']];
const num = (v) => (String(v).trim() === '' ? NaN : Number(String(v).replace(',', '.')));

export function render(root) {
  let kind = 'mean';
  const chips = h('div.chips', { role: 'group', 'aria-label': 'Loại kiểm định' });
  const fields = h('div.hyp-fields');
  const tail = h('select', { id: 'hy-tail' });
  const alpha = h('select', { id: 'hy-alpha' }, [0.1, 0.05, 0.01].map((a) => h('option', { value: a, selected: a === 0.05 }, vn(a, 2))));
  const table = dataRows({ freq: true, start: 3 });
  const dataMsg = h('div');
  const dataBox = h('details.more', {}, h('summary', {}, 'Tính n, x̄, s từ số liệu thô'), h('div', { style: 'margin-top:10px' }, table.el),
    h('div.btn-row', { style: 'margin-top:10px' }, h('button.btn', { type: 'button', onclick: () => {
      try {
        const { xs, ns } = table.data();
        const d = describe(xs, ns);
        const set = (k, v) => {
          const el = fields.querySelector(`[name="${k}"]`);
          if (!el) return;
          el.value = String(+v.toFixed(6)).replace('.', ',');
          el.classList.add('filled'); setTimeout(() => el.classList.remove('filled'), 1200); // show which fields changed
        };
        set('n', d.n); set('xbar', d.mean); set('s', d.s); set('s2', d.s2);
        dataMsg.replaceChildren(h('p.muted', { style: 'margin-top:8px' }, `n = ${d.n}, x̄ = ${vn(d.mean)}, s = ${vn(d.s)}, s² = ${vn(d.s2)}`));
        paint();
      } catch (e) { dataMsg.replaceChildren(h('div.error', { role: 'alert' }, e.message)); } // plain text: the EN/VI switch flips it
    } }, 'Điền vào ô')), dataMsg);
  const steps = h('div');
  const rows = []; // the 4 result rows, so a step in the rail can jump to its row
  let pick = 3;
  // Step rail as buttons (like the Polya steps): a click shows that step's row in the result.
  // All 4 steps are computed together, so the picked one is done too (data-done): engage.js fills the bar by done steps.
  const rail = (ok) => steps.replaceChildren(h('ol.detents.steps.hyp-rail', { 'aria-label': t('Bốn bước kiểm định') },
    STEPS.map((label, k) => h('li', { 'data-state': !ok ? (k ? 'todo' : 'current') : k === pick ? 'current' : 'done', 'data-done': ok && k === pick ? '' : null },
      h('button', { type: 'button', disabled: !ok, 'aria-current': ok && k === pick ? 'step' : null, onclick: () => {
        pick = k; rail(true);
        rows[k]?.scrollIntoView({ behavior: smooth(), block: 'center' });
        rows.forEach((r, j) => r.toggleAttribute('data-picked', j === k));
      } }, h('b', {}, String(k + 1)), t(label))))));
  const out = h('div', { 'aria-live': 'polite' });

  const buildFields = () => {
    const T = TESTS[kind];
    chips.replaceChildren(...Object.entries(TESTS).map(([k, v]) => h('button.chip', { type: 'button', 'aria-pressed': String(k === kind), onclick: () => { kind = k; buildFields(); paint(); } }, v.name)));
    fields.replaceChildren(...T.fields.map(([k, label, def]) => {
      const input = h('input', { type: 'text', inputmode: 'decimal', id: `hy-${k}`, name: k, value: String(def).replace('.', ','), oninput: paint });
      return h('label.field', { for: input.id }, h('span', {}, label), input);
    }));
    tail.replaceChildren(...TAILS.filter(([k]) => !(T.noLt && k === 'lt')).map(([k, , label]) => h('option', { value: k }, label)));
    dataBox.hidden = !T.data;
  };

  function paint() {
    const T = TESTS[kind], a = Number(alpha.value), side = tail.value, op = TAILS.find(([k]) => k === side)[1];
    const p = { alpha: a, tail: side };
    for (const [k] of T.fields) p[k] = num(fields.querySelector(`[name="${k}"]`).value);
    for (const k of ['n', 'm', 'k', 'k1', 'k2']) if (k in p) p[k] = Math.round(p[k]);
    let r;
    try { r = T.run(p); } catch (e) {
      rail(false);
      return out.replaceChildren(h('div.error', { role: 'alert' }, t(e.message)));
    }
    rail(true);
    const H = kind === 'var2' && r.swapped ? `H_0:\\ \\sigma_1^2=\\sigma_2^2;\\quad H_1:\\ \\sigma_{Y}^2 ${op}\\ \\sigma_{X}^2` : `H_0:\\ ${T.theta}=${T.zero};\\quad H_1:\\ ${T.theta} ${op} ${T.zero}`;
    const statName = r.dist === 't' && kind === 'mean' ? 'T' : 'Z_{qs}';
    const decision = r.reject ? t('Giá trị quan sát thuộc W: bác bỏ H₀, chấp nhận H₁') : t('Giá trị quan sát không thuộc W: chưa đủ cơ sở bác bỏ H₀');
    // The curve of the statistic under H0, with W in red and Z_qs marked.
    const curve = { z: [(x) => normPdf(x), -4, 4], t: [(x) => tPdf(x, r.df), -4.5, 4.5], chi2: [(x) => chi2Pdf(x, r.df), 0, Math.max(r.hi || 0, r.stat) * 1.25], f: [(x) => fPdf(x, r.df1, r.df2), 0, Math.max(r.hi || 0, r.stat) * 1.25] }[r.dist];
    const [pdf, lo0, hi0] = curve, lo = Math.min(lo0, r.stat - 0.5), hi = Math.max(hi0, r.stat + 0.5);
    const crit = r.crit ?? null;
    const shade = r.dist === 'z' || r.dist === 't'
      ? (side === 'two' ? [{ a: lo, b: -crit, pdf }, { a: crit, b: hi, pdf }] : side === 'gt' ? [{ a: crit, b: hi, pdf }] : [{ a: lo, b: -crit, pdf }])
      : [r.lo != null ? { a: lo, b: r.lo, pdf } : null, r.hi != null ? { a: r.hi, b: hi, pdf } : null].filter(Boolean);
    out.replaceChildren(
      h('div.board', {},
        rows[0] = h('div.row', { 'data-picked': pick === 0 ? '' : null }, h('b', {}, `${t('Bước')} 1`), rich(`$${H}$ ${t('với mức ý nghĩa')} $\\alpha=${vn(a, 2)}$.`, 'span', true), h('em', {}, '')),
        rows[1] = h('div.row', { 'data-picked': pick === 1 ? '' : null }, h('b', {}, `${t('Bước')} 2`), h('span', {}, h('span.muted', {}, t(r.why)), ' ', rich(`$W=${r.W}$`, 'span', true)), h('em', {}, '')),
        rows[2] = h('div.row', { 'data-picked': pick === 2 ? '' : null }, h('b', {}, `${t('Bước')} 3`), rich(`$\\displaystyle ${r.formula}$${r.dist === 'f' && r.swapped ? ` (${t('đã đổi chỗ: mẫu Y có phương sai lớn hơn')})` : ''}`, 'span', true), h('em', {}, vn(r.stat))),
        rows[3] = h('div.row.top-tier', { 'data-picked': pick === 3 ? '' : null }, h('b', {}, `${t('Bước')} 4`), h('span', {}, decision), h('span', { class: `tag ${r.reject ? '' : 'ok'}` }, r.reject ? t('Bác bỏ H₀') : t('Chấp nhận H₀')))),
      h('figure.viz', {}, densityPlot({ lo, hi, curves: [{ pdf }], shade: shade.map((s) => ({ ...s, cls: 'w' })), marks: [{ x: r.stat, label: `${statName.replace('_{qs}', 'qs')} = ${vn(r.stat, 3)}` }], label: t('Miền bác bỏ W') }),
        h('figcaption', {}, t('Phần tô đỏ là miền bác bỏ W; vạch đứng là giá trị quan sát.'))));
  }
  tail.onchange = paint; alpha.onchange = paint;
  buildFields(); paint();
  addEventListener('langchange', paint); // the 4 steps are built with tr()

  root.append(
    h('div', { style: 'margin-bottom:22px' }, chips),
    h('div.work', {},
      h('section.panel.stack', { 'aria-label': 'Số liệu đề cho' }, h('h2', {}, 'Số liệu đề cho'), fields,
        h('div.toolbar', { style: 'margin:0' }, h('label.field', { for: tail.id }, h('span', {}, 'Đối thiết H₁'), tail), h('label.field', { for: alpha.id }, h('span', {}, 'Mức ý nghĩa α'), alpha)), dataBox),
      h('section.panel.ticket.sticky-col', { 'aria-label': 'Bốn bước kiểm định' }, steps, out)));
}
