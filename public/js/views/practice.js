// Practice: 5 MCQ or 5 essay problems, one per frame. Strategy / grade / solution per question.
import { h, icon, rich, list, run, toast, casio } from '../ui.js';
import { ai } from '../api.js';
import { readFiles } from '../files.js';
import { mathField } from '../mathinput.js';
import { chart, odometer } from '../viz.js';
import { addSession } from '../profile.js';
import { mistakes } from './tutor.js';
import { TOPICS } from '../topics.js';

export const meta = { title: 'Luyện tập', lede: 'AI soạn riêng cho bạn 5 câu trắc nghiệm hoặc 5 câu tự luận. Mỗi câu có gợi ý chiến lược, chấm bài và lời giải.' };

export function render(root) {
  const topic = h('select', { id: 'p-topic' }, TOPICS.map((t) => h('option', {}, t)));
  const level = h('select', { id: 'p-level' }, ['Cơ bản', 'Trung bình', 'Nâng cao'].map((t) => h('option', { selected: t === 'Trung bình' }, t)));
  const bMcq = h('button.btn.btn-primary', { type: 'button' }, 'Tạo 5 câu trắc nghiệm');
  const bEssay = h('button.btn', { type: 'button' }, 'Tạo 5 câu tự luận');
  const out = h('div', {}, h('div.panel.empty', {}, h('p', {}, 'Chọn chủ đề và mức độ, rồi bấm tạo đề. Mỗi lần tạo là một bộ câu hỏi mới.')));

  const make = (kind, btn) => run(btn, out, async () => {
    const d = await ai('practice', { kind, topic: topic.value, level: level.value });
    const qs = (d.questions || []).filter((q) => q?.prompt).slice(0, 5);
    if (!qs.length) throw new Error('AI chưa tạo được câu hỏi. Bấm tạo lại.');
    return pager(kind, qs, topic.value);
  }, 'Đang soạn đề riêng cho bạn…');
  bMcq.onclick = () => make('mcq', bMcq);
  bEssay.onclick = () => make('essay', bEssay);

  root.append(h('div.toolbar', {},
    h('label.field', { for: 'p-topic' }, h('span', {}, 'Chủ đề'), topic),
    h('label.field', { for: 'p-level', style: 'max-width:200px' }, h('span', {}, 'Mức độ'), level),
    h('div.btn-row', {}, bMcq, bEssay)), out);
}

function pager(kind, qs, topic) {
  const results = new Array(qs.length).fill(null); // {score, mistakes}
  let logged = false, cur = 0;
  const dots = h('div.dots', { role: 'tablist', 'aria-label': 'Chọn câu' });
  const track = h('div.track');
  const summary = h('div');
  const go = (i) => { cur = Math.max(0, Math.min(qs.length - 1, i)); track.children[cur].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' }); paintDots(); };
  const paintDots = () => dots.replaceChildren(...qs.map((_, i) => h('button', {
    type: 'button', role: 'tab', 'aria-current': String(i === cur), 'aria-label': `Câu ${i + 1}`,
    class: results[i] ? (results[i].score >= 5 ? 'ok' : 'bad') : '', onclick: () => go(i),
  }, String(i + 1))));

  const done = (i, r) => {
    results[i] = r; paintDots();
    if (!logged && results.every(Boolean)) {
      logged = true;
      const score = results.reduce((a, x) => a + x.score, 0) / results.length;
      addSession({ feature: kind === 'mcq' ? 'practice-mcq' : 'practice-essay', topic, score, mistakes: results.flatMap((x) => x.mistakes) });
      summary.replaceChildren(h('div.panel.ticket', { style: 'margin-top:20px' },
        h('div.board', {}, h('div.row.top-tier', {}, h('b', {}, 'Tổng'), h('span', {}, `Bộ ${qs.length} câu ${kind === 'mcq' ? 'trắc nghiệm' : 'tự luận'} · ${topic}. Đã lưu vào hồ sơ.`), odometer(score)))));
    }
  };

  qs.forEach((q, i) => track.append(kind === 'mcq' ? mcq(q, i, (r) => done(i, r)) : essay(q, i, (r) => done(i, r))));
  let t;
  track.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => { const i = Math.round(track.scrollLeft / track.clientWidth); if (i !== cur) { cur = i; paintDots(); } }, 90); });
  paintDots();

  return h('div', {},
    h('div.pager-head', {}, dots, h('div.btn-row', {},
      h('button.btn.btn-ghost', { type: 'button', 'aria-label': 'Câu trước', onclick: () => go(cur - 1) }, icon('left')),
      h('button.btn.btn-ghost', { type: 'button', 'aria-label': 'Câu sau', onclick: () => go(cur + 1) }, icon('right')))),
    track, summary);
}

function shell(q, i, body, actions, reveal) {
  return h('article.q.panel', { 'aria-label': `Câu ${i + 1}` },
    h('div.q-head', {}, h('span.q-num', {}, String(i + 1).padStart(2, '0')), q.topic ? h('span.tag.topic', {}, q.topic) : null),
    rich(q.prompt), chart(q.viz), body, h('div.btn-row', { style: 'margin-top:16px' }, actions), reveal);
}

function toggles(q, reveal) {
  const show = (title, node) => { reveal.replaceChildren(h('div.reveal', {}, h('h3', {}, title), node)); };
  return [
    h('button.btn', { type: 'button', onclick: () => show('Chiến lược giải', list(q.strategy?.length ? q.strategy : ['Xác định cái đã cho, cái cần tìm và mô hình xác suất phù hợp.'], true)) }, 'Chiến lược'),
    h('button.btn.btn-ghost', { type: 'button', onclick: () => show('Lời giải', h('div', {}, rich(q.solution || 'Không có lời giải.'), casio(q.casio))) }, 'Xem lời giải'),
  ];
}

export function mcq(q, i, onDone) {
  const name = `q${i}-${Math.random().toString(36).slice(2, 6)}`;
  const opts = (q.options || []).slice(0, 4).map((o, k) => h('label.opt', {},
    h('input', { type: 'radio', name, value: k }), h('span.k', {}, 'ABCD'[k]), rich(String(o).replace(/^[A-D][.)]\s*/, ''), 'span')));
  const reveal = h('div');
  const bGrade = h('button.btn.btn-primary', { type: 'button' }, 'Chấm bài');
  bGrade.onclick = () => {
    const picked = opts.findIndex((o) => o.querySelector('input').checked);
    if (picked < 0) return toast('Hãy chọn một phương án.');
    const ans = Number(q.answer);
    const ok = picked === ans;
    opts.forEach((o, k) => { o.classList.toggle('right', k === ans); o.classList.toggle('wrong', k === picked && !ok); o.querySelector('input').disabled = true; });
    bGrade.disabled = true;
    reveal.replaceChildren(h('div.reveal', {}, h('div.tags', {}, h(`span.tag${ok ? '.ok' : ''}`, {}, ok ? 'Chính xác' : `Chưa đúng — đáp án ${'ABCD'[ans] ?? '?'}`)),
      ok ? null : h('p.muted', { style: 'margin-top:8px' }, 'Bấm "Xem lời giải" để hiểu vì sao.')));
    onDone({ score: ok ? 10 : 0, mistakes: ok ? [] : [{ topic: q.topic, type: 'Chọn sai đáp án trắc nghiệm', detail: String(q.prompt).slice(0, 160) }] });
  };
  return shell(q, i, h('div.options', { role: 'radiogroup', 'aria-label': 'Phương án' }, opts), [bGrade, ...toggles(q, reveal)], reveal);
}

export function essay(q, i, onDone) {
  const field = mathField({ label: 'Bài làm của bạn', name: `a${i}`, rows: 6, placeholder: 'Trình bày lời giải theo từng bước…' });
  let files = [];
  const pick = h('input', { type: 'file', accept: 'image/*,application/pdf', hidden: true });
  const fileNote = h('span.muted', { style: 'font-size:13.5px' });
  pick.addEventListener('change', async () => {
    try { files = await readFiles([...pick.files].slice(0, 2)); fileNote.textContent = files.map((f) => f.name).join(', '); } catch (e) { toast(e.message); }
  });
  const attach = h('button.btn.btn-ghost', { type: 'button', onclick: () => pick.click() }, icon('upload'), 'Đính kèm ảnh bài làm');
  const reveal = h('div');
  const result = h('div');
  const bGrade = h('button.btn.btn-primary', { type: 'button' }, 'Chấm bài');
  bGrade.onclick = () => {
    const answer = field.querySelector('textarea').value.trim();
    if (!answer && !files.length) return toast('Hãy viết bài làm hoặc đính kèm ảnh.');
    run(bGrade, result, async () => {
      const d = await ai('practiceGrade', { question: q.prompt, reference: q.solution || '', answer, files: files.map(({ mimeType, data }) => ({ mimeType, data })) });
      onDone({ score: +d.score || 0, mistakes: d.mistakes || [] });
      return h('div.reveal.ticket', {}, h('div.board', {}, h('div.row.top-tier', {}, h('b', {}, 'Điểm'), h('span', {}, d.summary || ''), odometer(+d.score || 0)),
        ...(d.rubric || []).map((r, k) => h('div.row', {}, h('b', {}, `Bước ${k + 1}`), h('span', {}, h('strong', {}, r.step), ' ', rich(r.comment, 'span')), h('em', {}, `${r.points ?? '—'}/${r.max ?? '—'}`)))),
        d.mistakes?.length ? [h('h3', {}, 'Lỗi sai'), mistakes(d.mistakes)] : null,
        d.advice?.length ? [h('h3', {}, 'Lời khuyên'), list(d.advice)] : null);
    }, 'Đang chấm bài…');
  };
  return shell(q, i, h('div', { style: 'margin-top:16px' }, field, h('div.btn-row', { style: 'margin-top:10px;align-items:center' }, attach, fileNote, pick)),
    [bGrade, ...toggles(q, reveal)], h('div', {}, result, reveal));
}

