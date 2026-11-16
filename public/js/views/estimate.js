// Interval estimation (Bài 5) and the sample size needed for a precision ε, step by step as in the slides,
// computed exactly in the browser (statlib.js). No AI.
import { h, rich } from '../ui.js';
import { tr as t } from '../i18n.js';
import { densityPlot } from '../viz.js';
import { dataRows } from '../datarows.js';
import { vn } from './tables.js';
import { stepRail, untouched } from '../steprail.js';
import { describe, normPdf, tPdf, chi2Pdf, ciMean, ciProp, ciVar, sizeMean, sizeProp } from '../statlib.js';

export const meta = { title: 'Ước lượng khoảng', lede: 'Khoảng tin cậy cho trung bình, tỉ lệ, phương sai và cỡ mẫu cần thiết, đi từng bước như slide Bài 5.\nTính chính xác bằng máy, không dùng AI, để bạn đối chiếu bài tự làm.' };

const KINDS = {
  mean: { name: 'Trung bình μ', fields: [['n', 'Cỡ mẫu n'], ['xbar', 'Trung bình mẫu x̄'], ['s', 'Độ lệch chuẩn mẫu s'], ['sigma', 'σ đã biết (bỏ trống nếu chưa biết)']], data: true },
  prop: { name: 'Tỉ lệ p', fields: [['n', 'Cỡ mẫu n'], ['k', 'Số phần tử có tính chất k']] },
  var: { name: 'Phương sai σ²', fields: [['n', 'Cỡ mẫu n'], ['s2', 'Phương sai mẫu hiệu chỉnh s²']], data: true },
  nmean: { name: 'Cỡ mẫu cho trung bình', fields: [['sigma', 'σ (hoặc s)'], ['eps', 'Độ chính xác ε']] },
  nprop: { name: 'Cỡ mẫu cho tỉ lệ', fields: [['f', 'Tỉ lệ f (bỏ trống nếu chưa biết)'], ['eps', 'Độ chính xác ε']] },
};
// Step names of the rail: a confidence interval, the variance interval, and the sample size.
const STEPS_CI = ['Chọn công thức', 'Tra bảng', 'Độ chính xác ε', 'Khoảng tin cậy'];
const STEPS_VAR = ['Chọn công thức', 'Tra bảng', 'Thay số', 'Khoảng tin cậy'];
const STEPS_N = ['Chọn công thức', 'Tra bảng', 'Thay số', 'Cỡ mẫu tối thiểu'];
const num = (v) => (String(v).trim() === '' ? NaN : Number(String(v).replace(',', '.')));

export function render(root) {
  let kind = 'mean';
  const chips = h('div.chips', { role: 'group', 'aria-label': 'Loại ước lượng' });
  const fields = h('div.hyp-fields');
  const conf = h('select', { id: 'ul-conf' }, [0.9, 0.95, 0.99].map((c) => h('option', { value: c, selected: c === 0.95 }, `${Math.round(c * 100)}%`)));
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
  const out = h('div', { 'aria-live': 'polite' });
  const steps = stepRail('Các bước ước lượng');

  const buildFields = () => {
    chips.replaceChildren(...Object.entries(KINDS).map(([k, v]) => h('button.chip', { type: 'button', 'aria-pressed': String(k === kind), onclick: () => { kind = k; buildFields(); paint(); } }, v.name)));
    fields.replaceChildren(...KINDS[kind].fields.map(([k, label]) => {
      const input = h('input', { type: 'text', inputmode: 'decimal', id: `ul-${k}`, name: k, oninput: paint });
      return h('label.field', { for: input.id }, h('span', {}, label), input);
    }));
    dataBox.hidden = !KINDS[kind].data;
  };

  const row = (label, body, value = '') => h('div.row', {}, h('b', {}, label), body, h('em', {}, value));
  const tn = (x, d) => vn(x, d).replace(/,/g, '{,}'); // a decimal comma in TeX, without the list space
  const tex = (s) => rich(`$\\displaystyle ${s}$`, 'span', true);

  function paint() {
    const c = Number(conf.value), p = { conf: c };
    for (const [k] of KINDS[kind].fields) p[k] = num(fields.querySelector(`[name="${k}"]`).value);
    for (const k of ['n', 'k']) if (k in p) p[k] = Math.round(p[k]);
    const pct = `${Math.round(c * 100)}%`;
    const stepNames = kind === 'nmean' || kind === 'nprop' ? STEPS_N : kind === 'var' ? STEPS_VAR : STEPS_CI;
    if (untouched(p, KINDS[kind].fields.map(([k]) => k))) {
      steps.paint(stepNames, false);
      return out.replaceChildren(h('p.muted', {}, t('Nhập số liệu vào các ô bên trái, kết quả hiện ngay.')));
    }
    try {
      if (kind === 'nmean' || kind === 'nprop') {
        const n = kind === 'nmean' ? sizeMean(p) : sizeProp({ ...p, f: Number.isFinite(p.f) ? p.f : undefined });
        const zv = c === 0.9 ? 1.65 : c === 0.95 ? 1.96 : 2.58, z = vn(zv, 2);
        const fUsed = Number.isFinite(p.f) ? p.f : 0.5;
        const raw = kind === 'nmean' ? ((zv * p.sigma) / p.eps) ** 2 : (zv ** 2 * fUsed * (1 - fUsed)) / p.eps ** 2;
        steps.paint(stepNames, true);
        return out.replaceChildren(h('div.board', {},
          steps.row(0, row(`${t('Bước')} 1`, tex(kind === 'nmean' ? 'n\\ge\\left(\\frac{z_{\\alpha/2}\\,\\sigma}{\\varepsilon}\\right)^2' : 'n\\ge\\frac{z_{\\alpha/2}^2\\,f(1-f)}{\\varepsilon^2}'))),
          steps.row(1, row(`${t('Bước')} 2`, h('span', {}, `${t('Tra bảng')}: z(α/2) = ${z} (${t('độ tin cậy')} ${pct})`, kind === 'nprop' && !Number.isFinite(p.f) ? h('span.muted', {}, ` · ${t('chưa biết f nên lấy f = 0,5 (cỡ mẫu lớn nhất)')}`) : null), z)),
          steps.row(2, row(`${t('Bước')} 3`, tex(kind === 'nmean'
            ? `\\left(\\frac{${tn(zv, 2)}\\cdot ${tn(p.sigma)}}{${tn(p.eps)}}\\right)^2=${tn(raw)}`
            : `\\frac{${tn(zv, 2)}^2\\cdot ${tn(fUsed)}\\cdot(1-${tn(fUsed)})}{${tn(p.eps)}^2}=${tn(raw)}`), vn(raw))),
          steps.row(3, h('div.row.top-tier', {}, h('b', {}, `${t('Bước')} 4`), h('span', {}, t('Cỡ mẫu tối thiểu (làm tròn lên)')), h('em', {}, `n = ${n}`)))));
      }
      const r = kind === 'mean' ? ciMean(p) : kind === 'prop' ? ciProp(p) : ciVar(p);
      const center = kind === 'mean' ? p.xbar : kind === 'prop' ? r.f : null;
      const formula = kind === 'mean' ? (r.dist === 't' ? '\\varepsilon=t_{\\alpha/2}(n-1)\\frac{s}{\\sqrt{n}}' : `\\varepsilon=z_{\\alpha/2}\\frac{${r.known ? '\\sigma' : 's'}}{\\sqrt{n}}`)
        : kind === 'prop' ? '\\varepsilon=z_{\\alpha/2}\\sqrt{\\frac{f(1-f)}{n}}' : '\\left(\\frac{(n-1)s^2}{\\chi^2_{\\alpha/2}(n-1)};\\ \\frac{(n-1)s^2}{\\chi^2_{1-\\alpha/2}(n-1)}\\right)';
      const lookup = kind === 'var' ? `χ²(α/2) = ${vn(r.chiHi)}, χ²(1 − α/2) = ${vn(r.chiLo)} (${t('bậc')} ${r.df})`
        : r.dist === 't' ? `t(α/2; ${r.df}) = ${vn(r.crit)}` : `z(α/2) = ${vn(r.crit, 2)}`;
      // The statistic's curve with the middle 1 − α shaded: Student / normal for μ and p, χ²(n − 1) for σ².
      const [pdf, lo, hi, a, b] = kind === 'var' ? [(x) => chi2Pdf(x, r.df), 0, r.chiHi * 1.3, r.chiLo, r.chiHi]
        : r.dist === 't' ? [(x) => tPdf(x, r.df), -4.5, 4.5, -r.crit, r.crit] : [(x) => normPdf(x), -4, 4, -r.crit, r.crit];
      steps.paint(stepNames, true);
      out.replaceChildren(
        h('div.board', {},
          steps.row(0, row(`${t('Bước')} 1`, h('span', {}, kind === 'var' ? h('span.muted', {}, t('μ chưa biết: dùng phân phối χ² bậc n − 1.')) : h('span.muted', {}, t(r.why || 'Tỉ lệ mẫu f = k/n, n ≥ 30: dùng phân phối chuẩn.')), ' ', tex(formula)))),
          steps.row(1, row(`${t('Bước')} 2`, h('span', {}, `${t('Tra bảng')}: ${lookup}`))),
          steps.row(2, kind === 'var'
            ? row(`${t('Bước')} 3`, tex(`(n-1)s^2=${r.df}\\cdot ${tn(p.s2)}=${tn(r.df * p.s2)};\\quad \\frac{${tn(r.df * p.s2)}}{${tn(r.chiHi)}};\\ \\frac{${tn(r.df * p.s2)}}{${tn(r.chiLo)}}`))
            : row(`${t('Bước')} 3`, h('span', {}, t('Độ chính xác ε')), vn(r.eps))),
          steps.row(3, h('div.row.top-tier', {}, h('b', {}, `${t('Bước')} 4`), h('span', {}, `${t('Khoảng tin cậy')} ${pct}${center != null ? ` (${kind === 'prop' ? 'f' : 'x̄'} = ${vn(center)})` : ''}`), h('em', {}, `(${vn(r.lo)}; ${vn(r.hi)})`)))),
        h('figure.viz', {}, densityPlot({ lo, hi, curves: [{ pdf }], shade: [{ a, b, pdf, cls: 'ci' }], marks: [{ x: a, label: vn(a, 3) }, { x: b, label: vn(b, 3) }], label: t('Vùng tin cậy') }),
          h('figcaption', {}, `${t('Phần tô xanh có diện tích bằng độ tin cậy')} ${pct}.`)));
    } catch (e) { steps.paint(stepNames, false); out.replaceChildren(h('div.error', { role: 'alert' }, t(e.message))); }
  }
  conf.onchange = paint;
  buildFields(); paint();
  addEventListener('langchange', paint); // the steps are built with tr()

  root.append(
    h('div', { style: 'margin-bottom:22px' }, chips),
    h('div.work', {},
      h('section.panel.stack', { 'aria-label': 'Số liệu đề cho' }, h('h2', {}, 'Số liệu đề cho'), fields,
        h('div.toolbar', { style: 'margin:0' }, h('label.field', { for: conf.id }, h('span', {}, 'Độ tin cậy 1 − α'), conf)),
        h('p.muted', {}, 'z(α/2) lấy theo bảng giáo trình: 90% → 1,65; 95% → 1,96; 99% → 2,58.'), dataBox),
      h('section.panel.ticket.sticky-col.tool', { 'aria-label': 'Các bước ước lượng' }, steps.el, out)));
}
