// Practice: 5 essay or 5 MCQ problems, one per frame. Every problem is worked through Polya's 4 steps,
// each step a visible button: Tìm hiểu nội dung đề bài → Tìm cách giải → Trình bày lời giải (+ chấm) → Nghiên cứu sâu lời giải.
import { h, icon, rich, list, run, toast, casio, POLYA, polyaGuide, nodes } from '../ui.js';
import { tr as t } from '../i18n.js';
import { ai } from '../api.js';
import { uploader } from '../uploader.js';
import { mathField } from '../mathinput.js';
import { boardToggle } from '../board.js';
import { chart, odometer } from '../viz.js';
import { addSession } from '../profile.js';
import { mistakes } from './tutor.js';
import { TOPICS } from '../topics.js';

const KINDS = {
  essay: { title: 'Bài tập tự luận', lede: 'AI tạo ngẫu nhiên 5 bài tự luận tương tự để bạn tự luyện.\nMỗi bài đi qua đủ 4 bước giải toán, có chiến lược (không lộ đáp án), chấm bài và lời giải.', button: 'Tạo 5 bài tự luận', feature: 'practice-essay' },
  mcq: { title: 'Bài tập trắc nghiệm', lede: 'AI tạo 5 câu trắc nghiệm, chấm ngay khi bạn chọn.\nMỗi câu đi qua 4 bước giải toán; bấm "Hỏi AI: vì sao?" để hỏi lại đáp án.', button: 'Tạo 5 câu trắc nghiệm', feature: 'practice-mcq' },
};

function make(kind) {
  const K = KINDS[kind];
  return {
    meta: { title: K.title, lede: K.lede },
    render(root) {
      const topic = h('select', { id: `p-topic-${kind}` }, TOPICS.map((t) => h('option', {}, t)));
      const level = h('select', { id: `p-level-${kind}` }, ['Cơ bản', 'Trung bình', 'Nâng cao'].map((t) => h('option', { selected: t === 'Trung bình' }, t)));
      const similar = mathField({ label: 'Bài mẫu để tạo bài tương tự (tuỳ chọn)', name: `seed-${kind}`, rows: 2, placeholder: 'Dán một bài bạn muốn luyện thêm, AI sẽ tạo 5 bài tương tự.' });
      const up = uploader({ compact: true, title: 'Hoặc tải bài mẫu: ảnh, PDF, Word', hint: 'AI đọc chữ trong tệp (kể cả ảnh chụp) rồi tạo bài cùng dạng. Tối đa 3 tệp, mỗi tệp ≤ 10 MB.', label: 'Tải ảnh, PDF hoặc Word bài mẫu' });
      const btn = h('button.btn.btn-primary', { type: 'button' }, K.button);
      const out = h('div', {}, h('div.panel.empty', {}, h('p', {}, 'Chọn chủ đề và mức độ, rồi bấm tạo đề. Mỗi lần tạo là một bộ bài mới.')));
      btn.onclick = () => run(btn, out, async () => {
        const d = await ai('practice', { kind, topic: topic.value, level: level.value, sample: similar.querySelector('textarea').value.trim(), files: up.files(), docs: up.docs() });
        const qs = (d.questions || []).filter((q) => q?.prompt).slice(0, 5);
        if (!qs.length) throw new Error('AI chưa tạo được bài. Bấm tạo lại.');
        return pager(kind, qs, topic.value);
      }, 'Đang soạn đề riêng cho bạn…');
      root.append(h('div.toolbar', {},
        h('label.field', { for: topic.id }, h('span', {}, 'Chủ đề'), topic),
        h('label.field', { for: level.id, style: 'max-width:200px' }, h('span', {}, 'Mức độ'), level),
        h('div.btn-row', {}, btn)),
      h('details.more', { style: 'margin:-6px 0 22px' }, h('summary', {}, 'Tạo bài tương tự từ một bài mẫu', icon('down')), similar, h('div', { style: 'margin-top:12px' }, up.el)),
      out);
    },
  };
}
export const essayPage = make('essay');
export const mcqPage = make('mcq');

function pager(kind, qs, topic) {
  const results = new Array(qs.length).fill(null);
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
      addSession({ feature: KINDS[kind].feature, topic, score, mistakes: results.flatMap((x) => x.mistakes) });
      summary.replaceChildren(h('div.panel.ticket', { style: 'margin-top:20px' },
        h('div.board', {}, h('div.row.top-tier', {}, h('b', {}, 'Tổng'), h('span', {}, `Bộ ${qs.length} câu ${kind === 'mcq' ? 'trắc nghiệm' : 'tự luận'} · ${topic}. Đã lưu vào hồ sơ.`), odometer(score)))));
    }
  };

  qs.forEach((q, i) => track.append(h('div.q-slide', {}, problemBlock(kind, q, i, topic, (r) => done(i, r)))));
  let t;
  track.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => { const i = Math.round(track.scrollLeft / track.clientWidth); if (i !== cur) { cur = i; paintDots(); } }, 90); });
  paintDots();

  return h('div', {},
    h('div.pager-head', {}, dots, h('div.btn-row', {},
      h('button.btn.btn-ghost', { type: 'button', 'aria-label': 'Câu trước', onclick: () => go(cur - 1) }, icon('left')),
      h('button.btn.btn-ghost', { type: 'button', 'aria-label': 'Câu sau', onclick: () => go(cur + 1) }, icon('right')))),
    track, summary);
}

/**
 * A problem plus, once it has been graded, a «Tạo bài tương tự» button under it. Each click asks the AI for one
 * new problem of the same chapter and type with different numbers, shown right below (and itself extendable).
 * Similar problems are saved to the profile one by one; they do not change the score of the 5-problem set.
 */
function problemBlock(kind, q, i, topic, onResult) {
  const num = typeof i === 'number' ? String(i + 1).padStart(2, '0') : String(i);
  let made = 0;
  const more = h('div.similar-list');
  const bSimilar = h('button.btn', { type: 'button' }, 'Tạo bài tương tự');
  const bar = h('div.similar-bar', { hidden: true }, bSimilar, h('span.muted', {}, 'Cùng chương, cùng dạng, chỉ khác số liệu.'));
  const card = (kind === 'mcq' ? mcq : essay)(q, i, (r) => { onResult(r); bar.hidden = false; });
  bSimilar.onclick = () => {
    const slot = h('div');
    more.append(slot);
    run(bSimilar, slot, async () => {
      const d = await ai('similar', { kind, question: q.prompt, options: kind === 'mcq' ? q.options : undefined, topic: q.topic || topic, solution: q.solution || '' });
      const next = (d.questions || []).find((x) => x?.prompt && (kind !== 'mcq' || (Array.isArray(x.options) && x.options.length >= 2)));
      if (!next) throw new Error('AI chưa tạo được bài tương tự. Bấm thử lại.');
      made += 1;
      let saved = false; // an essay can be graded again: save it to the profile once
      return problemBlock(kind, { ...next, topic: next.topic || q.topic }, `${num}.${made}`, topic, (r) => {
        if (!saved) { saved = true; addSession({ feature: KINDS[kind].feature, topic: next.topic || q.topic || topic, score: r.score, mistakes: r.mistakes }); }
      });
    }, 'Đang tạo bài tương tự…');
  };
  return h('div.q-block', {}, card, bar, more);
}

/**
 * One problem worked through Polya's 4 steps. `work` is the step-3 answer area, `actions` its buttons.
 * `i` is the problem's index (shown as 01…05) or, for a generated similar problem, its label ("01.1").
 * A step is ticked only once the student has used that step's own buttons (hint, strategy, grading, solution):
 * merely opening a step does not tick it. Every step keeps what it revealed, so going back shows it again.
 * Returns { el, goto(step), mark(step) }: grading marks step 3 and can move the student on to step 4.
 */
function polyaCard(q, i, work, actions, extra4) {
  const P = q.polya || {};
  const num = typeof i === 'number' ? String(i + 1).padStart(2, '0') : String(i);
  const used = [false, false, false, false];
  const reveals = POLYA.map(() => h('div'));
  const show = (k, title, node) => { reveals[k].replaceChildren(h('div.reveal', {}, h('h3', {}, title), node)); mark(k); };
  const strategy = q.strategy?.length ? q.strategy : P.plan;
  const bodies = [
    [h('p.muted', {}, 'Trả lời các câu hỏi dưới đây trước khi giải.'),
      list(P.understand?.length ? P.understand : ['Đề cho những gì? Cần tìm gì?', 'Đặt tên các biến cố / biến ngẫu nhiên thế nào?', 'Có điều kiện gì cần chú ý?'].map(t)),
      h('div.btn-row', { style: 'margin-top:12px' }, h('button.btn', { type: 'button', onclick: () => show(0, 'Cái đã cho – cái phải tìm', h('div', {}, h('h3', {}, 'Cái đã cho'), list(P.given), h('h3', {}, 'Cái phải tìm'), list(P.find))) }, 'Gợi ý: đã cho – phải tìm'))],
    [h('p.muted', {}, 'Câu hỏi gợi mở để tự tìm cách giải.'),
      list(P.plan?.length ? P.plan : ['Bài toán này thuộc dạng quen thuộc nào?', 'Cần dùng công thức, định lí hay phân phối nào?'].map(t), true),
      strategy?.length ? h('div.btn-row', { style: 'margin-top:12px' }, h('button.btn', { type: 'button', onclick: () => show(1, 'Chiến lược giải', list(strategy, true)) }, 'Chiến lược giải')) : null],
    [P.present ? h('p.muted', {}, rich(P.present, 'span')) : null, work, h('div.btn-row', { style: 'margin-top:16px' }, actions)],
    [h('p.muted', {}, 'Câu hỏi để nghiên cứu sâu lời giải.'),
      list(P.check?.length ? P.check : ['Kết quả này dùng được vào những tình huống thực tế nào?', 'Nếu đổi dữ kiện, hỏi ngược lại hoặc mở rộng bài toán thì giải thế nào?'].map(t)),
      P.extend ? [h('h3', {}, 'Bài tương tự / mở rộng / lật ngược vấn đề'), rich(P.extend)] : null,
      h('div.btn-row', { style: 'margin-top:12px' },
        h('button.btn', { type: 'button', onclick: () => show(3, 'Lời giải', h('div', {}, rich(q.solution || 'Không có lời giải.'), casio(q.casio))) }, 'Xem lời giải'),
        extra4?.button),
      extra4?.panel],
  ];
  extra4?.button?.addEventListener('click', () => mark(3));
  // Built once and only hidden/shown, so the answer area and everything revealed survive tab switches.
  const panes = bodies.map((kids, k) => h('div.step-pane', { hidden: k !== 0 }, polyaGuide(k), ...nodes(kids), reveals[k],
    h('div.stage-nav', {},
      k > 0 ? h('button.btn.btn-ghost', { type: 'button', onclick: () => goto(k - 1) }, `← Bước ${k}`) : h('span'),
      k < 3 ? h('button.btn.btn-ghost', { type: 'button', onclick: () => goto(k + 1) }, `Bước ${k + 2}: ${POLYA[k + 1]} →`) : null)));
  const tabs = h('ol.detents.steps', { 'aria-label': 'Bốn bước giải toán' });
  let cur = 0;
  const paint = () => tabs.replaceChildren(...POLYA.map((label, j) => h('li', { 'data-state': j === cur ? 'current' : used[j] ? 'done' : 'todo' },
    h('button', { type: 'button', 'aria-current': j === cur ? 'step' : null, onclick: () => goto(j) }, h('b', {}, String(j + 1)), label))));
  function goto(k) { cur = k; panes.forEach((p, j) => { p.hidden = j !== k; }); paint(); }
  function mark(k) { if (!used[k]) { used[k] = true; paint(); } }
  paint();
  const el = h('article.q.panel', { 'aria-label': `Câu ${num}` },
    h('div.q-head', {}, h('span.q-num', {}, num), q.topic ? h('span.tag.topic', {}, q.topic) : null),
    rich(q.prompt), chart(q.viz), tabs, h('div.step-body', {}, panes));
  return { el, goto, mark };
}

export function mcq(q, i, onDone) {
  const name = `q${i}-${Math.random().toString(36).slice(2, 6)}`;
  const opts = (q.options || []).slice(0, 4).map((o, k) => h('label.opt', {},
    h('input', { type: 'radio', name, value: k }), h('span.k', {}, 'ABCD'[k]), rich(String(o).replace(/^[A-D][.)]\s*/, ''), 'span')));
  const verdict = h('div');
  const work = h('div', {}, h('div.options', { role: 'radiogroup', 'aria-label': 'Phương án' }, opts), verdict);
  const picked = () => opts.findIndex((o) => o.querySelector('input').checked);

  // "Hỏi AI: vì sao?" — the student asks about the answer in their own words.
  const askField = mathField({ label: 'Câu hỏi của bạn về đáp án', name: `ask${i}`, rows: 2, placeholder: 'Ví dụ: Vì sao không chọn C?' });
  const askOut = h('div');
  const bAsk = h('button.btn.btn-primary', { type: 'button' }, 'Gửi câu hỏi');
  bAsk.onclick = () => run(bAsk, askOut, async () => {
    const d = await ai('explain', { question: q.prompt, options: q.options, answer: Number(q.answer), picked: picked(), ask: askField.querySelector('textarea').value.trim() });
    return h('div.reveal', {}, rich(d.answer || ''), casio(d.casio), chart(d.viz));
  }, 'AI đang giải đáp…');
  const askPanel = h('div', { hidden: true, style: 'margin-top:14px' }, askField, h('div.btn-row', { style: 'margin-top:10px' }, bAsk), askOut);
  const askBtn = h('button.btn', { type: 'button', onclick: () => { askPanel.hidden = !askPanel.hidden; } }, 'Hỏi AI: vì sao?');

  const bGrade = h('button.btn.btn-primary', { type: 'button' }, 'Chấm bài');
  const card = polyaCard(q, i, work, [bGrade, h('button.btn', { type: 'button', onclick: () => { card.goto(3); askPanel.hidden = false; card.mark(3); } }, 'Hỏi AI: vì sao?')], { button: askBtn, panel: askPanel });
  bGrade.onclick = () => {
    const p = picked();
    if (p < 0) return toast('Hãy chọn một phương án.');
    const ans = Number(q.answer), ok = p === ans;
    opts.forEach((o, k) => { o.classList.toggle('right', k === ans); o.classList.toggle('wrong', k === p && !ok); o.querySelector('input').disabled = true; });
    bGrade.disabled = true;
    card.mark(2);
    verdict.replaceChildren(h('div.reveal', {}, h('div.tags', {}, h(`span.tag${ok ? '.ok' : ''}`, {}, ok ? 'Chính xác · 10/10' : `Chưa đúng · đáp án ${'ABCD'[ans] ?? '?'}`)),
      h('p.muted', { style: 'margin-top:8px' }, ok ? 'Sang bước 4 để tự kiểm tra và mở rộng.' : 'Sang bước 4: xem lời giải hoặc bấm "Hỏi AI: vì sao?".')));
    onDone({ score: ok ? 10 : 0, mistakes: ok ? [] : [{ topic: q.topic, type: 'Chọn sai đáp án trắc nghiệm', detail: String(q.prompt).slice(0, 160) }] });
  };
  return card.el;
}

export function essay(q, i, onDone) {
  const field = mathField({ label: 'Bài làm của bạn', name: `a${i}`, rows: 6, placeholder: 'Trình bày lời giải theo từng bước…' });
  const board = boardToggle();
  const up = uploader({ compact: true, title: 'Đính kèm ảnh, PDF hoặc Word bài làm', hint: 'Tối đa 3 tệp, mỗi tệp ≤ 10 MB.', label: 'Đính kèm ảnh, PDF hoặc Word bài làm' });
  const result = h('div');
  const bGrade = h('button.btn.btn-primary', { type: 'button' }, 'Chấm bài');
  const work = h('div', {}, field, h('div.btn-row', { style: 'margin-top:10px;align-items:center' }, board.btn), board.wrap, h('div', { style: 'margin-top:10px' }, up.el), result);
  const card = polyaCard(q, i, work, [bGrade]);
  bGrade.onclick = () => {
    const answer = field.querySelector('textarea').value.trim();
    const all = [...up.files(), ...(board.board.isEmpty() ? [] : [board.board.toFile()])];
    const docs = up.docs();
    if (!answer && !all.length && !docs.length) return toast('Hãy viết bài làm, viết trên bảng hoặc đính kèm ảnh.');
    run(bGrade, result, async () => {
      const d = await ai('practiceGrade', { question: q.prompt, reference: q.solution || '', answer, docs, files: all.map(({ mimeType, data }) => ({ mimeType, data })) });
      card.mark(2);
      onDone({ score: +d.score || 0, mistakes: d.mistakes || [] });
      return h('div.reveal.ticket', {}, h('div.board', {}, h('div.row.top-tier', {}, h('b', {}, 'Điểm'), h('span', {}, d.summary || ''), odometer(+d.score || 0)),
        ...(d.rubric || []).map((r, k) => h('div.row', {}, h('b', {}, `Bước ${k + 1}`), h('span', {}, h('strong', {}, r.step), ' ', rich(r.comment, 'span')), h('em', {}, `${r.points ?? '—'}/${r.max ?? '—'}`)))),
        d.mistakes?.length ? [h('h3', {}, 'Lỗi sai'), mistakes(d.mistakes)] : null,
        d.advice?.length ? [h('h3', {}, 'Lời khuyên'), list(d.advice)] : null,
        h('div.btn-row', { style: 'margin-top:12px' }, h('button.btn', { type: 'button', onclick: () => card.goto(3) }, 'Sang bước 4: Nghiên cứu sâu lời giải →')));
    }, 'Đang chấm bài…');
  };
  return card.el;
}
