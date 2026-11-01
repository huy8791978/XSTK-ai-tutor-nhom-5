// «Học theo cách khác»: nine buttons under a lesson or a problem, each asking the AI to explain the same content
// through one of Gardner's intelligences, plus «Giảng lại cho AI» (the student teaches a curious classmate).
// Every use lights a badge on the profile. Also the «Em chắc mấy phần?» self-assessment used before grading.
import { h, rich, list, run, toast } from './ui.js';
import { ai } from './api.js';
import { chart, odometer } from './viz.js';
import { mathField } from './mathinput.js';
import { readAloud } from './voice.js';
import { addSession, useLens } from './profile.js';
import { LENSES } from './lenses.js';

// Pages where a lens can go on by hand, without the AI.
const TRY = {
  spatial: ['#phong-thi-nghiem', 'Xem mô phỏng trong Phòng thí nghiệm'],
  bodily: ['#phong-thi-nghiem', 'Tung xúc xắc, sắp xếp bước giải'],
  interpersonal: ['#thach-dau', 'Thách đấu một người bạn'],
  existential: ['#cuoc-doi', 'Mở Xác suất và cuộc đời'],
  naturalist: ['#phong-thi-nghiem', 'Phân loại dữ liệu tự nhiên'],
};

/** text: what is on screen (a concept name and definition, or a problem). concept: a short name for «Giảng lại». */
export function lensBar({ text, topic, concept }) {
  const out = h('div.lens-out', { 'aria-live': 'polite' });
  const cache = new Map();
  const chips = LENSES.map((L) => h('button.chip', { type: 'button', 'aria-pressed': 'false', title: L.mi }, `${L.icon} `, L.name));
  const teach = h('button.chip', { type: 'button', 'aria-pressed': 'false', title: 'Ngôn ngữ' }, '💬 ', 'Giảng lại cho AI');
  const press = (b) => [...chips, teach].forEach((c) => c.setAttribute('aria-pressed', String(c === b)));

  LENSES.forEach((L, i) => {
    chips[i].onclick = () => {
      press(chips[i]);
      if (cache.has(L.id)) return out.replaceChildren(cache.get(L.id));
      run(chips[i], out, async () => {
        const d = await ai('lens', { lens: L.id, text: String(text || '').slice(0, 4000), topic });
        if (!d.body) throw new Error('AI chưa soạn được. Bấm thử lại.');
        useLens(L.id);
        const card = lensCard(L, d);
        cache.set(L.id, card);
        return card;
      }, `AI đang soạn theo cách «${L.name}»…`);
    };
  });
  teach.onclick = () => { press(teach); out.replaceChildren(cache.get('teach') || cache.set('teach', teachBack({ topic, concept: concept || text })).get('teach')); };

  return h('section.lens', { 'aria-label': 'Học theo cách khác' },
    h('div.lens-head', {}, h('b', {}, 'Học theo cách khác'), h('span.muted', {}, 'Cùng kiến thức, chọn cách em thích. Mỗi cách thử được ghi thành huy hiệu.')),
    h('div.chips', {}, chips, teach), out);
}

function lensCard(L, d) {
  const reveal = h('div');
  const go = TRY[L.id];
  return h('div.reveal.lens-card', {},
    h('h3', {}, `${L.icon} `, d.title ? h('span', {}, d.title) : L.name),
    rich(d.body), chart(d.viz),
    L.id === 'musical' ? h('div.btn-row', { style: 'margin-top:10px' }, h('button.btn', { type: 'button', onclick: () => { if (!readAloud(d.body)) toast('Trình duyệt này không đọc được thành tiếng.'); } }, '🔊 ', 'Đọc vè')) : null,
    d.ask ? h('div.definition', { style: 'background:var(--gold-wash);border-color:var(--gold);margin-top:14px' }, h('b', { style: 'color:var(--gold-ink)' }, 'Em thử'), rich(d.ask),
      d.reveal ? h('div.btn-row', { style: 'margin-top:8px' }, h('button.btn.btn-ghost', { type: 'button', onclick: () => reveal.replaceChildren(rich(d.reveal)) }, 'Xem gợi ý')) : null, reveal) : null,
    go ? h('p', { style: 'margin-top:12px' }, h('a.btn.btn-ghost', { href: go[0] }, go[1], ' →')) : null);
}

/** The student explains in their own words; Bin, a curious classmate, scores it and asks back. */
export function teachBack({ topic, concept }) {
  const field = mathField({ label: 'Giảng lại cho Bin bằng lời của em', name: `teach-${Math.random().toString(36).slice(2, 6)}`, rows: 5, placeholder: 'Ví dụ: Xác suất có điều kiện là… Em hình dung nó như…' });
  const result = h('div');
  const bSend = h('button.btn.btn-primary', { type: 'button' }, 'Gửi cho Bin');
  bSend.onclick = () => {
    const explanation = field.querySelector('textarea').value.trim();
    if (explanation.length < 10) return toast('Hãy giảng dài hơn một chút.');
    run(bSend, result, async () => {
      const d = await ai('teachBack', { explanation, topic, concept: String(concept || '').slice(0, 300) });
      useLens('linguistic');
      addSession({ feature: 'teach', topic: d.mistakes?.[0]?.topic || topic, score: d.score, mistakes: d.mistakes });
      return h('div.reveal.ticket', {},
        h('div.board', {}, h('div.row.top-tier', {}, h('b', {}, 'Bin chấm'), rich(d.summary || '', 'span'), odometer(+d.score || 0))),
        d.clear?.length ? [h('h3', {}, 'Chỗ em giảng rõ'), list(d.clear)] : null,
        d.gaps?.length ? [h('h3', {}, 'Chỗ còn thiếu hoặc sai'), list(d.gaps)] : null,
        d.questions?.length ? [h('h3', {}, 'Bin hỏi lại'), list(d.questions)] : null,
        h('p.muted', { style: 'margin-top:12px;font-size:13.5px' }, 'Sửa lời giảng rồi gửi lại để Bin chấm lần nữa. Đã lưu vào hồ sơ.'));
    }, 'Bin đang nghe em giảng…');
  };
  return h('div.reveal', {},
    h('p.muted', { style: 'margin-bottom:10px' }, 'Giảng được cho người khác hiểu là hiểu thật. Bin là bạn học tò mò, chưa biết gì về nội dung này.'),
    field, h('div.btn-row', { style: 'margin-top:10px' }, bSend), result);
}

const CONF = [0, 25, 50, 75, 100];
/** «Em chắc mấy phần?» before grading. value() → 0–100 or undefined when skipped. */
export function confidence() {
  let v;
  const chips = CONF.map((c) => h('button.chip', { type: 'button', 'aria-pressed': 'false' }, `${c}%`));
  chips.forEach((b, i) => { b.onclick = () => {
    if (v === undefined) useLens('intrapersonal');
    v = CONF[i]; chips.forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
  }; });
  const el = h('div.conf', { role: 'group', 'aria-label': 'Em chắc mấy phần?' }, h('span', {}, 'Trước khi chấm: em chắc mấy phần?'), h('div.chips', {}, chips));
  return { el, value: () => v };
}
