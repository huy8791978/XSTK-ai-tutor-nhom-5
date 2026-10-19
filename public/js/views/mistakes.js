// Mistake statistics across vấn đáp, trắc nghiệm, tự luận, chấm bài…; AI gives an overall diagnosis and remedies.
import { h, rich, run } from '../ui.js';
import { ai } from '../api.js';
import { load, setInsight } from '../profile.js';
import { summarize, byFeature, insightPayload, fmtScore, FEATURES } from '../stats.js';
import { insightView, hbar } from './profile.js';

export const meta = { title: 'Thống kê lỗi sai', lede: 'Thống kê các câu sai trong vấn đáp, trắc nghiệm, tự luận và chấm bài. AI đưa ra nhận định chung về lỗi sai và hướng khắc phục.' };

export function render(root) {
  const p = load(), s = summarize(p.sessions), rows = byFeature(p.sessions);
  let filter = 'all';
  const list = h('div');
  const chips = h('div.chips', { role: 'group', 'aria-label': 'Lọc theo tính năng' });
  const paint = () => {
    chips.replaceChildren(...[['all', 'Tất cả'], ...rows.map((r) => [r.feature, r.name])].map(([f, name]) =>
      h('button.chip', { type: 'button', 'aria-pressed': String(filter === f), onclick: () => { filter = f; paint(); } }, name)));
    const ms = p.sessions.flatMap((x) => (x.mistakes || []).map((m) => ({ ...m, serial: x.serial, feature: x.feature })))
      .filter((m) => filter === 'all' || m.feature === filter).reverse().slice(0, 40);
    list.replaceChildren(...(ms.length ? ms.map((m) => h('div.mistake', {},
      h('div.tags', {}, h('span.tag.gold', {}, FEATURES[m.feature] || m.feature), h('span.tag', {}, m.type || 'Lỗi'), m.topic ? h('span.tag.topic', {}, m.topic) : null, h('span.serialtag', {}, m.serial)),
      rich(m.detail || ''))) : [h('p.muted', {}, 'Chưa có lỗi nào được ghi ở mục này.')]));
  };
  paint();

  const out = h('div', {}, p.insight ? insightView(p.insight.data, p.insight.at) : h('p.muted', {}, s.mistakeCount ? 'Bấm nút để AI nhận định chung về các lỗi sai.' : 'Chưa có lỗi nào. Hãy làm bài tập, vấn đáp hoặc chấm một bài.'));
  const bAI = h('button.btn.btn-primary', { type: 'button', disabled: !s.n }, 'AI nhận định & hướng khắc phục');
  bAI.onclick = () => run(bAI, out, async () => {
    const d = await ai('profile', { stats: insightPayload(p.sessions) });
    setInsight(d); return insightView(d, Date.now());
  }, 'AI đang phân tích lỗi sai…');

  const maxErr = Math.max(1, ...s.errorTypes.map((e) => e.count));
  root.append(
    h('section.panel.ticket', { style: 'margin-bottom:24px', 'aria-label': 'Theo tính năng' },
      h('div.board', {},
        h('div.row.top-tier', {}, h('b', {}, 'Tổng lỗi'), h('span', {}, `${s.n} phiên đã ghi · ${p.sessions.filter((x) => x.score < 5).length} phiên dưới 5 điểm`), h('em', { style: 'font-size:48px;color:var(--red)' }, String(s.mistakeCount))),
        ...(rows.length ? rows.map((r) => h('div.row', {}, h('b', {}, r.name), h('span', {}, `${r.n} phiên · ${r.low} phiên dưới 5 điểm · điểm TB ${fmtScore(r.avg)}`), h('em', {}, String(r.mistakes))))
          : [h('div.row', {}, h('b', {}, '—'), h('span', {}, 'Chưa có dữ liệu.'), h('em', {}, '0'))]))),
    h('div.work', {},
      h('div.stack', {},
        h('section.panel', { 'aria-label': 'Nhận định của AI' }, h('h2', {}, 'Nhận định chung & khắc phục'), h('div.btn-row', { style: 'margin:14px 0 6px' }, bAI), out),
        h('section.panel', { 'aria-label': 'Loại lỗi' }, h('h2', {}, 'Loại lỗi hay gặp'),
          s.errorTypes.length ? h('div', { style: 'margin-top:12px' }, ...s.errorTypes.map((e) => hbar(e.name, e.count, maxErr))) : h('p.muted', { style: 'margin-top:10px' }, 'Chưa có.'),
          s.topics.length ? [h('h3', {}, 'Điểm theo chủ đề (yếu nhất trước)'), ...s.topics.map((t) => hbar(t.name, fmtScore(t.avg), 10, t.avg, 'topic'))] : null)),
      h('section.panel', { 'aria-label': 'Danh sách câu sai' }, h('h2', {}, 'Các câu, nội dung đã sai'), h('div', { style: 'margin:12px 0' }, chips), list)));
}
