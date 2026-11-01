// Learning profile: statistics over every graded session + AI diagnosis of recurring mistakes and a study plan.
import { h, rich, list, run, toast } from '../ui.js';
import { ai } from '../api.js';
import { load, setInsight, exportFile, importFile, reset } from '../profile.js';
import { summarize, insightPayload, fmtScore, FEATURES, calibration } from '../stats.js';
import { chart, odometer, radar } from '../viz.js';
import { LENSES } from '../lenses.js';

export const meta = { title: 'Hồ sơ học tập', lede: 'Mọi bài chấm, bộ luyện tập và buổi vấn đáp đều được ghi lại trên trình duyệt này.\nAI đọc hồ sơ để tìm lỗi lặp lại và đề xuất lộ trình.' };

const date = (t) => new Date(t).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

export function render(root) {
  const p = load(), s = summarize(p.sessions);
  const insightOut = h('div', {}, p.insight ? insightView(p.insight.data, p.insight.at) : h('p.muted', {}, s.n ? 'Bấm nút để AI đọc toàn bộ hồ sơ và đưa ra nhận định.' : 'Hồ sơ còn trống. Hãy chấm một bài, làm một bộ luyện tập hoặc một buổi vấn đáp.'));
  const bInsight = h('button.btn.btn-primary', { type: 'button', disabled: !s.n }, 'AI phân tích & đề xuất lộ trình');
  bInsight.onclick = () => run(bInsight, insightOut, async () => {
    const d = await ai('profile', { stats: insightPayload(p.sessions) });
    setInsight(d); return insightView(d, Date.now());
  }, 'AI đang đọc hồ sơ của bạn…');

  const fileIn = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  fileIn.onchange = async () => { try { await importFile(fileIn.files[0]); toast('Đã nhập hồ sơ.'); rerender(); } catch (e) { toast(e.message); } };
  const rerender = () => { root.replaceChildren(); render(root); };

  root.append(
    h('section.panel.ticket', { style: 'margin-bottom:24px', 'aria-label': 'Tổng quan' },
      h('span.ticket-serial', {}, `MÃ HỒ SƠ ${p.id}`),
      h('div.board', {},
        h('div.row.top-tier', {}, h('b', {}, 'Điểm TB'), h('span', {}, s.n ? `Trung bình của ${s.n} phiên có chấm điểm.` : 'Chưa có phiên nào được chấm.'), s.avg == null ? h('em', {}, '—') : odometer(s.avg)),
        h('div.row', {}, h('b', {}, 'Số phiên'), h('span', {}, 'Chấm bài, luyện tập và vấn đáp đã ghi lại'), h('em', {}, String(s.n))),
        h('div.row', {}, h('b', {}, 'Lỗi đã ghi'), h('span', {}, s.errorTypes[0] ? `Nhiều nhất: ${s.errorTypes[0].name}` : 'Chưa có lỗi nào'), h('em', {}, String(s.mistakeCount))))),
    h('div.work', {},
      h('div.stack', {},
        h('section.panel', { 'aria-label': 'Nhận định của AI' }, h('h2', {}, 'Nhận định & lộ trình'), h('div.btn-row', { style: 'margin:14px 0 6px' }, bInsight, h('a.btn', { href: '#thong-ke' }, 'Xem thống kê lỗi sai')), insightOut)),
      h('div.stack', {},
        badges(p), selfCheck(p.sessions),
        h('section.panel', { 'aria-label': 'Diễn biến điểm' }, h('h2', {}, 'Diễn biến điểm'),
          s.trend.length ? chart({ type: 'bars', labels: s.trend.map((x) => date(x.at)), values: s.trend.map((x) => x.score), caption: `${s.trend.length} phiên gần nhất` }) : h('p.muted', { style: 'margin-top:10px' }, 'Chưa có điểm.')),
        h('section.panel', { 'aria-label': 'Nhật kí' }, h('h2', {}, 'Nhật kí học tập'),
          p.sessions.length ? h('div.log', { style: 'margin-top:8px' }, ...p.sessions.slice(-12).reverse().map((x) => h('div.row', {},
            h('b', {}, x.serial), h('span', {}, `${FEATURES[x.feature] || x.feature} · ${x.topic} · ${date(x.at)}`), h('em', {}, fmtScore(x.score))))) : h('p.muted', { style: 'margin-top:10px' }, 'Chưa có phiên nào.')),
        h('section.panel', { 'aria-label': 'Quản lí hồ sơ' }, h('h2', {}, 'Mang hồ sơ sang máy khác'),
          h('p.muted', { style: 'margin:8px 0 14px' }, 'Hồ sơ chỉ nằm trên trình duyệt này. Xuất tệp để sao lưu hoặc nhập trên thiết bị khác.'),
          h('div.btn-row', {},
            h('button.btn', { type: 'button', onclick: exportFile }, 'Xuất hồ sơ'),
            h('button.btn', { type: 'button', onclick: () => fileIn.click() }, 'Nhập hồ sơ'), fileIn,
            h('button.btn.btn-danger', { type: 'button', onclick: () => { if (confirm('Xoá toàn bộ hồ sơ học tập trên trình duyệt này? Không thể hoàn tác.')) { reset(); rerender(); } } }, 'Xoá hồ sơ'))))));
}


/** One badge per way of learning, lit once used; the «Khám phá» radar when the quiz was taken. */
function badges(p) {
  const used = p.lenses || {}, lit = LENSES.filter((L) => used[L.id]).length;
  return h('section.panel', { 'aria-label': 'Huy hiệu 9 cách học' }, h('h2', {}, 'Huy hiệu 9 cách học'),
    h('p.muted', { style: 'margin:6px 0 12px' }, `Đã thử ${lit}/9 cách. Mở thanh «Học theo cách khác» ở bài học, bài tập, hoặc vào Phòng thí nghiệm.`),
    h('ul.badges', {}, LENSES.map((L) => h('li', { 'data-lit': String(Boolean(used[L.id])), title: L.mi }, h('span.b-ic', { 'aria-hidden': 'true' }, L.icon), h('b', {}, L.name), h('small', {}, used[L.id] ? `${used[L.id]} lần` : 'Chưa thử')))),
    p.mi?.scores ? [h('h3', {}, 'Cách học em thích'), radar(p.mi.scores, LENSES)] : null,
    h('p', { style: 'margin-top:10px' }, h('a.btn.btn-ghost', { href: '#kham-pha' }, p.mi ? 'Làm lại bài khám phá →' : 'Khám phá cách học của em →')));
}

/** «Em chắc mấy phần?» against the real score. */
function selfCheck(sessions) {
  const c = calibration(sessions);
  if (!c.n) return null;
  const say = { over: 'Em thường tự tin hơn kết quả thật: trước khi nộp, thử tự kiểm tra lại từng bước.', under: 'Em làm tốt hơn em nghĩ: hãy tin vào cách giải của mình hơn.', ok: 'Em đoán khá đúng sức mình: một kĩ năng tự học rất quý.' }[c.verdict];
  return h('section.panel', { 'aria-label': 'Tự đánh giá' }, h('h2', {}, 'Tự đánh giá so với điểm thật'),
    h('div.board', { style: 'margin-top:10px' },
      h('div.row', {}, h('b', {}, 'Em nghĩ'), h('span', {}, 'Độ chắc chắn trung bình trước khi chấm'), h('em', {}, `${c.conf}%`)),
      h('div.row', {}, h('b', {}, 'Thực tế'), h('span', {}, 'Điểm trung bình quy ra phần trăm'), h('em', {}, `${c.actual}%`))),
    h('p', { style: 'margin-top:10px' }, say), h('p.muted', { style: 'font-size:13px' }, `Tính trên ${c.n} lần có chọn «Em chắc mấy phần?».`));
}

export function hbar(name, label, max, value = label, cls = '') {
  return h(`div.hbar${cls ? `.${cls}` : ''}`, {}, h('span', {}, name), h('span.t', {}, h('i', { style: `width:${Math.max(3, (value / max) * 100)}%` })), h('em', {}, String(label)));
}

export function insightView(d, at) {
  return h('div', {},
    h('p.muted', { style: 'font-size:13px' }, `Cập nhật ${new Date(at).toLocaleString('vi-VN')}`),
    d.assessment ? rich(d.assessment) : null,
    d.patterns?.length ? [h('h3', {}, 'Lỗi lặp lại'), ...d.patterns.map((x) => h('div.mistake', {}, rich(`**${x.title}**`), rich(x.detail)))] : null,
    d.priorities?.length ? [h('h3', {}, 'Ưu tiên'), h('div.tags', {}, ...d.priorities.map((t) => h('span.tag.topic', {}, t)))] : null,
    d.plan?.length ? [h('h3', {}, 'Lộ trình 2 tuần'), h('ol.plan', {}, ...d.plan.map((x) => h('li', {}, h('b', {}, x.when), rich(x.task, 'span'))))] : null,
    !d.assessment && !d.patterns?.length ? list(['AI chưa đưa ra nhận định. Thử lại sau.']) : null);
}
