// Theory lessons: concepts and theorems, each taught Trải nghiệm → Hình thành → Củng cố → Vận dụng.
import { h, rich, list, run, toast, detents, STAGES } from '../ui.js';
import { ai } from '../api.js';
import { mathField } from '../mathinput.js';
import { chart } from '../viz.js';
import { addSession } from '../profile.js';
import { mcq, essay } from './practice.js';
import { TOPICS } from '../topics.js';

const KINDS = {
  concept: {
    meta: { title: 'Học lí thuyết', lede: 'Học một khái niệm qua 4 bước: trải nghiệm tình huống, tự rút ra dấu hiệu bản chất và định nghĩa,\ncủng cố bằng câu hỏi nhận diện, rồi vận dụng vào bài toán thực tế.' },
    label: 'Khái niệm cần học', placeholder: 'Ví dụ: Biến cố độc lập',
    stages: ['Trải nghiệm', 'Hình thành định nghĩa', 'Củng cố', 'Vận dụng'],
    examples: ['Biến cố độc lập', 'Xác suất có điều kiện', 'Biến ngẫu nhiên', 'Kì vọng', 'Phương sai', 'Hàm mật độ', 'Khoảng tin cậy', 'Mức ý nghĩa'],
  },
  theorem: {
    meta: { title: 'Học định lí', lede: 'Học một định lí qua 4 bước: trải nghiệm để dự đoán, tách giả thiết – kết luận,\nnắm luận cứ và cách chứng minh, củng cố rồi vận dụng.' },
    label: 'Định lí / công thức cần học', placeholder: 'Ví dụ: Công thức Bayes',
    stages: ['Trải nghiệm', 'Hình thành định lí', 'Củng cố', 'Vận dụng'],
    examples: ['Công thức cộng xác suất', 'Công thức xác suất đầy đủ', 'Công thức Bayes', 'Công thức Bernoulli', 'Bất đẳng thức Chebyshev', 'Luật số lớn', 'Định lí giới hạn trung tâm', 'Định lí Moivre – Laplace'],
  },
};

function make(kind) {
  const K = KINDS[kind];
  return {
    meta: K.meta,
    render(root) {
      const name = h('input', { type: 'text', id: `l-${kind}`, placeholder: K.placeholder, maxlength: 120 });
      const topic = h('select', { id: `lt-${kind}` }, TOPICS.map((t) => h('option', {}, t)));
      const bStart = h('button.btn.btn-primary', { type: 'button' }, 'Bắt đầu học');
      const out = h('div', {}, h('div.panel.empty', {}, h('p', {}, `Chọn một ${kind === 'theorem' ? 'định lí' : 'khái niệm'} gợi ý hoặc tự gõ tên, rồi bấm "Bắt đầu học".`)));
      const start = () => {
        if (!name.value.trim()) { name.focus(); return toast(`Hãy nhập tên ${kind === 'theorem' ? 'định lí' : 'khái niệm'}.`); }
        run(bStart, out, async () => {
          const d = await ai('lesson', { kind, name: name.value.trim(), topic: topic.value });
          if (!d.experience || !d.formation) throw new Error('AI chưa soạn được bài học. Bấm thử lại.');
          return lesson(kind, K, d, topic.value);
        }, 'AI đang soạn bài học…');
      };
      bStart.onclick = start;
      name.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
      root.append(
        h('div.toolbar', {},
          h('label.field', { for: name.id, style: 'max-width:420px;flex-basis:300px' }, h('span', {}, K.label), name),
          h('label.field', { for: topic.id }, h('span', {}, 'Chủ đề'), topic),
          h('div.btn-row', {}, bStart)),
        h('div.chips', { style: 'margin:-8px 0 22px', 'aria-label': 'Gợi ý' }, K.examples.map((x) => h('button.chip', { type: 'button', onclick: () => { name.value = x; start(); } }, x))),
        out);
    },
  };
}

function lesson(kind, K, d, topicName) {
  let cur = 0;
  const rail = h('div');
  const stage = h('section.panel', { 'aria-live': 'polite' });
  const results = new Array((d.consolidate || []).length).fill(null);
  let logged = false;
  const topic = d.topic || topicName;

  const log = () => {
    if (logged || !results.length || !results.every(Boolean)) return;
    logged = true;
    addSession({ feature: kind, topic, score: results.reduce((a, r) => a + r.score, 0) / results.length, mistakes: results.flatMap((r) => r.mistakes) });
    toast('Đã lưu kết quả củng cố vào hồ sơ.');
  };

  const views = [
    () => {
      const e = d.experience, insight = h('div');
      return [h('h2', {}, 'Trải nghiệm'), rich(e.situation), chart(e.viz),
        h('div.definition', { style: 'background:var(--gold-wash);border-color:var(--gold)' }, h('b', { style: 'color:var(--gold-ink)' }, 'Câu hỏi'), rich(e.question)),
        h('div', { style: 'margin-top:16px' }, mathField({ label: 'Suy nghĩ / dự đoán của bạn', name: `exp-${kind}`, rows: 3, placeholder: 'Viết dự đoán trước khi xem gợi ý…' })),
        h('div.btn-row', { style: 'margin-top:12px' }, h('button.btn', { type: 'button', onclick: () => insight.replaceChildren(h('div.reveal', {}, h('h3', {}, 'Điều rút ra'), rich(e.insight || ''))) }, 'Xem điều rút ra')),
        insight];
    },
    () => (kind === 'theorem' ? theoremFormation(d.formation) : conceptFormation(d.formation)),
    () => [h('h2', {}, 'Củng cố'), h('p.muted', { style: 'margin:6px 0 16px' }, 'Nhận diện trong những trường hợp đơn giản, đặc trưng. Chấm từng câu; kết quả được lưu vào hồ sơ.'),
      h('div.lesson-list', {}, (d.consolidate || []).map((q, i) => mcq({ topic, ...q }, i, (r) => { results[i] = r; log(); })))],
    () => [h('h2', {}, 'Vận dụng'), h('p.muted', { style: 'margin:6px 0 16px' }, 'Bài toán thực tế. Xem chiến lược nếu cần, tự làm, rồi bấm Chấm bài.'),
      d.apply?.prompt ? essay({ topic, ...d.apply }, 0, (r) => addSession({ feature: kind, topic, score: r.score, mistakes: r.mistakes })) : h('p.muted', {}, 'Không có bài vận dụng.')],
  ];

  const go = (i) => {
    cur = i;
    rail.replaceChildren(detents(K.stages, K.stages.map((_, k) => (k < cur ? 'done' : k === cur ? 'current' : 'todo'))));
    stage.replaceChildren(...[].concat(views[cur]()).flat(),
      h('div.stage-nav', {},
        cur > 0 ? h('button.btn.btn-ghost', { type: 'button', onclick: () => go(cur - 1) }, `← ${K.stages[cur - 1]}`) : h('span'),
        cur < 3 ? h('button.btn.btn-primary', { type: 'button', onclick: () => go(cur + 1) }, `Tiếp: ${K.stages[cur + 1]} →`) : null));
    rail.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  };
  go(0);
  return h('div', {}, h('h2', { style: 'font:800 32px/1.05 var(--display);margin-bottom:14px' }, d.name || ''), rail, stage);
}

function conceptFormation(f) {
  return [h('h2', {}, 'Hình thành định nghĩa'),
    h('h3', {}, 'Dấu hiệu bản chất'), list(f.signs),
    f.terms?.length ? [h('h3', {}, 'Thuật ngữ & kí hiệu'), h('dl.terms', {}, f.terms.flatMap((t) => [h('dt', {}, t.term), h('dd', {}, rich(t.symbol || '', 'span'))]))] : null,
    h('div.definition', {}, h('b', {}, 'Định nghĩa'), rich(f.definition)),
    f.related?.length ? [h('h3', {}, 'Liên hệ với khái niệm khác'), list(f.related)] : null];
}

function theoremFormation(f) {
  const proof = h('div');
  return [h('h2', {}, 'Hình thành định lí'),
    f.prediction ? [h('h3', {}, 'Dự đoán'), rich(f.prediction)] : null,
    h('div.definition', {}, h('b', {}, 'Định lí'), rich(f.statement)),
    h('div.split', { style: 'margin-top:16px' },
      h('div', {}, h('h3', { style: 'margin-top:0' }, 'Giả thiết'), list(f.hypothesis)),
      h('div', {}, h('h3', { style: 'margin-top:0' }, 'Kết luận'), list(f.conclusion))),
    f.grounds?.length ? [h('h3', {}, 'Luận cứ chứng minh'), list(f.grounds)] : null,
    h('div.btn-row', { style: 'margin-top:14px' }, h('button.btn', { type: 'button', onclick: () => proof.replaceChildren(h('div.reveal', {}, h('h3', {}, 'Chứng minh'), rich(f.proof || ''))) }, 'Xem chứng minh')),
    proof,
    f.logic ? [h('h3', {}, 'Cấu trúc logic'), rich(f.logic)] : null];
}

export const concept = make('concept');
export const theorem = make('theorem');
