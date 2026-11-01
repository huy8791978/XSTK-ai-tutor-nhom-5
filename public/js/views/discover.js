// «Khám phá cách học của em»: 18 short statements → a radar of the nine ways of learning and three to try first.
// No AI, nothing leaves the browser. Framed as preferences, never as ability.
import { h, toast } from '../ui.js';
import { radar } from '../viz.js';
import { load, setMI } from '../profile.js';
import { LENSES, DISCOVER, DISCOVER_SCALE, miScores, topLenses, lensById } from '../lenses.js';

export const meta = { title: 'Khám phá cách học của em', lede: 'Trả lời 18 câu ngắn (khoảng 2 phút) để biết em thích vào bài theo những cách nào.\nĐây là sở thích, không phải năng lực: ai cũng học được theo mọi cách.' };

// Where each way of learning is practised on this site.
const WHERE = {
  logic: [['#trac-nghiem', 'Bài tập trắc nghiệm'], ['#cham-bai', 'Gia sư chấm bài']],
  linguistic: [['#van-dap', 'Vấn đáp'], ['#ly-thuyet', 'Học lí thuyết → Giảng lại cho AI']],
  spatial: [['#phong-thi-nghiem', 'Phòng thí nghiệm'], ['#ban-do', 'Bản đồ tư duy']],
  musical: [['#ly-thuyet', 'Học lí thuyết → Vè công thức'], ['#phong-thi-nghiem', 'Nghe phân phối']],
  bodily: [['#phong-thi-nghiem', 'Tung xúc xắc, sắp xếp bước giải'], ['#cham-bai', 'Viết trên bảng iPad']],
  interpersonal: [['#thach-dau', 'Thách đấu bạn'], ['#dien-dan', 'Diễn đàn']],
  intrapersonal: [['#ho-so', 'Hồ sơ học tập'], ['#thong-ke', 'Thống kê lỗi sai']],
  naturalist: [['#phong-thi-nghiem', 'Phân loại dữ liệu tự nhiên'], ['#ly-thuyet', 'Học lí thuyết → Thiên nhiên']],
  existential: [['#cuoc-doi', 'Xác suất và cuộc đời'], ['#ly-thuyet', 'Học lí thuyết → Ý nghĩa']],
};

export function render(root) {
  const answers = new Array(DISCOVER.length).fill(null);
  const out = h('div');
  const items = DISCOVER.map(([, text], i) => {
    const chips = DISCOVER_SCALE.map((label, v) => h('button.chip', { type: 'button', 'aria-pressed': 'false', onclick: () => {
      answers[i] = v; chips.forEach((c, k) => c.setAttribute('aria-pressed', String(k === v)));
    } }, label));
    return h('li.disc-item', {}, h('p', {}, text), h('div.chips', { role: 'group', 'aria-label': text }, chips));
  });
  const bDone = h('button.btn.btn-primary', { type: 'button' }, 'Xem kết quả');
  bDone.onclick = () => {
    const left = answers.filter((a) => a == null).length;
    if (left > 4) return toast(`Còn ${left} câu chưa trả lời.`);
    const scores = miScores(answers);
    setMI(scores);
    out.replaceChildren(result(scores));
    out.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };
  const saved = load().mi;
  root.append(
    h('section.panel', { 'aria-label': 'Câu hỏi' },
      h('p.muted', { style: 'margin-bottom:14px' }, 'Chọn mức đúng với em nhất cho từng câu. Không có câu trả lời đúng hay sai.'),
      h('ol.disc', {}, items),
      h('div.btn-row', { style: 'margin-top:18px' }, bDone)),
    out);
  if (saved?.scores) out.append(result(saved.scores, saved.at));
}

export function result(scores, at) {
  const top = topLenses(scores);
  return h('section.panel', { style: 'margin-top:24px', 'aria-label': 'Kết quả' },
    h('h2', {}, 'Cách học em thích'),
    at ? h('p.muted', { style: 'font-size:13px' }, `Lần làm gần nhất: ${new Date(at).toLocaleDateString('vi-VN')}`) : null,
    h('div.disc-result', {},
      radar(scores, LENSES),
      h('div', {},
        h('h3', { style: 'margin-top:0' }, 'Ba cách nên thử trước'),
        h('ol.plan', {}, top.map((id) => { const L = lensById(id); return h('li', {}, h('b', {}, `${L.icon} `, L.mi), h('span', {}, ...WHERE[id].flatMap(([href, label], k) => [k ? ' · ' : '', h('a', { href }, label)]))); })),
        h('p.muted', { style: 'margin-top:14px' }, 'Ở mỗi bài học và bài tập có thanh «Học theo cách khác» với đủ 9 cách. Hãy thử cả những cách điểm thấp: đổi cách vào bài giúp nhớ lâu hơn.'))));
}
