// Descriptive statistics of a sample the student pastes: raw values or a value/frequency table (Bài 4),
// with a frequency chart and a box plot. Exact, in the browser, no AI.
import { h } from '../ui.js';
import { dataRows } from '../datarows.js';
import { tr as t } from '../i18n.js';
import { barChart } from '../viz.js';
import { vn } from './tables.js';
import { describe } from '../statlib.js';

export const meta = { title: 'Thống kê mô tả', lede: 'Nhập từng giá trị (và tần số nếu có) để có ngay x̄, ŝ², s², trung vị, tứ phân vị, biểu đồ tần số và biểu đồ hộp.\nTính chính xác bằng máy, không dùng AI.' };

function boxPlot(d) {
  const W = 560, H = 120, P = 28, span = d.max - d.min || 1;
  const X = (x) => P + ((x - d.min) / span) * (W - 2 * P);
  const y = 50, bh = 36, lab = (x, v, dy = 0) => `<text x="${X(x)}" y="${y + bh / 2 + 26 + dy}" text-anchor="middle">${vn(v, 2)}</text>`;
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', `0 0 ${W} ${H}`); s.setAttribute('role', 'img'); s.setAttribute('aria-label', t('Biểu đồ hộp'));
  s.innerHTML = `<line class="axis" x1="${X(d.min)}" x2="${X(d.q1)}" y1="${y}" y2="${y}"/><line class="axis" x1="${X(d.q3)}" x2="${X(d.max)}" y1="${y}" y2="${y}"/>
    <line class="axis" x1="${X(d.min)}" x2="${X(d.min)}" y1="${y - 10}" y2="${y + 10}"/><line class="axis" x1="${X(d.max)}" x2="${X(d.max)}" y1="${y - 10}" y2="${y + 10}"/>
    <rect class="box" x="${X(d.q1)}" y="${y - bh / 2}" width="${Math.max(1, X(d.q3) - X(d.q1))}" height="${bh}"/>
    <line class="med" x1="${X(d.median)}" x2="${X(d.median)}" y1="${y - bh / 2}" y2="${y + bh / 2}"/>
    <circle class="mean" cx="${X(d.mean)}" cy="${y}" r="4"><title>x̄ = ${vn(d.mean)}</title></circle>
    ${lab(d.min, d.min)}${lab(d.q1, d.q1, 14)}${lab(d.median, d.median)}${lab(d.q3, d.q3, 14)}${lab(d.max, d.max)}`;
  return s;
}

export function render(root) {
  // One value per row; frequency 1 unless changed with − / + (a value/frequency table, or raw data).
  const table = dataRows({ freq: true, start: 4, onChange: () => paint() });
  const out = h('div', { 'aria-live': 'polite' });
  const charts = h('div');
  const paint = () => {
    let d;
    try {
      const { xs, ns } = table.data();
      if (!xs.length) { out.replaceChildren(h('p.muted', {}, t('Nhập số liệu vào các ô bên trái, kết quả hiện ngay.'))); charts.replaceChildren(); return; }
      d = describe(xs, ns);
    } catch (e) { out.replaceChildren(h('div.error', { role: 'alert' }, t(e.message))); charts.replaceChildren(); return; }
    const row = (a, b, v) => h('div.row', {}, h('b', {}, a), h('span', {}, t(b)), h('em', {}, vn(v)));
    out.replaceChildren(h('div.board', {},
      h('div.row.top-tier', {}, h('b', {}, 'x̄'), h('span', {}, `${t('Trung bình mẫu')}, n = ${d.n}`), h('em', {}, vn(d.mean))),
      row('ŝ²', 'Phương sai mẫu (chia n)', d.varN), row('s²', 'Phương sai mẫu hiệu chỉnh (chia n − 1)', d.s2), row('s', 'Độ lệch chuẩn mẫu hiệu chỉnh', d.s),
      row('Min', 'Giá trị nhỏ nhất', d.min), row('Q1', 'Tứ phân vị thứ nhất', d.q1), row('Me', 'Trung vị', d.median), row('Q3', 'Tứ phân vị thứ ba', d.q3), row('Max', 'Giá trị lớn nhất', d.max)),
    h('p.muted', { style: 'margin-top:10px' }, t('Tứ phân vị nội suy tuyến tính (như QUARTILE.INC của Excel); giáo trình khác có thể làm tròn khác.')));
    // Frequency chart: one bar per distinct value when there are few, else 10 equal classes.
    const uniq = [...new Set(d.sorted)];
    let labels, values;
    if (uniq.length <= 16) { labels = uniq.map((v) => vn(v, 2)); values = uniq.map((u) => d.sorted.filter((v) => v === u).length); } else {
      const k = 10, w = (d.max - d.min) / k;
      labels = [...Array(k).keys()].map((i) => vn(d.min + (i + 0.5) * w, 1));
      values = [...Array(k).keys()].map((i) => d.sorted.filter((v) => Math.min(k - 1, Math.floor((v - d.min) / w)) === i).length);
    }
    charts.replaceChildren(
      h('figure.viz', {}, barChart(labels, values), h('figcaption', {}, uniq.length <= 16 ? t('Tần số theo từng giá trị') : t('Tần số theo 10 khoảng bằng nhau'))),
      h('figure.viz', {}, boxPlot(d), h('figcaption', {}, t('Biểu đồ hộp: Min, Q1, trung vị, Q3, Max; chấm đỏ là x̄'))));
  };
  paint();
  addEventListener('langchange', paint); // the result board is built with tr()
  root.append(h('div.work', {},
    h('section.panel.stack', { 'aria-label': 'Số liệu' },
      h('h2', {}, 'Số liệu mẫu'), h('p.muted', {}, 'Mỗi dòng một giá trị. Bấm Enter để sang dòng mới; dán cả dãy số vào một ô thì tự tách thành từng dòng.'), table.el, charts),
    h('section.panel.ticket.sticky-col.tool', { 'aria-label': 'Các số đặc trưng mẫu' }, out)));
}
