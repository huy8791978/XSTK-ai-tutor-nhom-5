// Mini-game: a set of 20 multiple-choice questions (theory → exercises → real life), generated in one call before
// play starts. Each question gives 30 seconds; the answer stays hidden until time runs out (the student may change
// their choice meanwhile) or until they press «Hoàn thành».
import { h, rich, run, toast } from '../ui.js';
import { ai } from '../api.js';
import { odometer } from '../viz.js';
import { addSession } from '../profile.js';
import { QUIZ_LEVELS, QUIZ_SIZE } from '../topics.js';
import { cleanQuestions, scoreGame, QUIZ_SECONDS } from '../quiz.js';

export const meta = { title: 'Mini-game trắc nghiệm', lede: `Chọn độ khó rồi bấm Bắt đầu chơi: bộ ${QUIZ_SIZE} câu từ lí thuyết, bài tập đến liên hệ thực tiễn.\nMỗi câu có ${QUIZ_SECONDS} giây; đáp án hiện khi hết giờ, hoặc ngay khi bạn bấm Hoàn thành.` };

/** Ask for a full set; one top-up call if the AI returned fewer usable questions than needed. */
async function makeSet(level) {
  let qs = [];
  for (let call = 0; call < 2 && qs.length < QUIZ_SIZE; call++) {
    const d = await ai('quiz', { level });
    const known = new Set(qs.map((q) => q.prompt.toLowerCase()));
    qs = [...qs, ...cleanQuestions(d.questions).filter((q) => !known.has(q.prompt.toLowerCase()))];
  }
  if (qs.length < 10) throw new Error('AI chưa tạo đủ câu hỏi. Bấm Bắt đầu chơi để thử lại.');
  return qs.slice(0, QUIZ_SIZE);
}

export function render(root) {
  const level = h('select', { id: 'quiz-level' }, QUIZ_LEVELS.map((l) => h('option', { selected: l === 'Trung bình' }, l)));
  const bStart = h('button.btn.btn-primary', { type: 'button' }, 'Bắt đầu chơi');
  const stage = h('div', {}, h('div.panel.empty', {}, h('p', {}, `${QUIZ_SIZE} câu · ${QUIZ_SECONDS} giây mỗi câu. Trong lúc đếm ngược bạn có thể đổi đáp án.`)));
  const start = () => run(bStart, stage, async () => game(await makeSet(level.value), level.value, start), `Đang soạn bộ ${QUIZ_SIZE} câu hỏi và lời giải…`);
  bStart.onclick = start;
  root.append(h('div.toolbar', {},
    h('label.field', { for: level.id, style: 'max-width:220px' }, h('span', {}, 'Độ khó'), level),
    h('div.btn-row', {}, bStart)), stage);
}

function game(qs, level, again) {
  const picks = new Array(qs.length).fill(null);
  const el = h('section.panel.quiz', { 'aria-label': 'Mini-game trắc nghiệm' });
  let i = 0;

  function ask() {
    let left = QUIZ_SECONDS * 1000, last = performance.now(), done = false, warned = false;
    const q = qs[i], name = `quiz-${i}-${Math.random().toString(36).slice(2, 6)}`;
    const secs = h('span.quiz-secs', {}, String(QUIZ_SECONDS));
    const bar = h('span.quiz-bar', {}, h('i'));
    const clock = h('div.quiz-clock', { role: 'timer', 'aria-label': 'Thời gian còn lại' }, secs, h('small', {}, 'giây'), bar);
    const status = h('p.quiz-status', { 'aria-live': 'polite' }, 'Chọn một phương án.');
    const opts = q.options.map((o, k) => h('label.opt', {}, h('input', { type: 'radio', name, value: k }), h('span.k', {}, 'ABCD'[k]), rich(o, 'span')));
    const after = h('div');
    const bDone = h('button.btn.btn-primary', { type: 'button', onclick: () => reveal('done') }, 'Hoàn thành');
    opts.forEach((o, k) => o.querySelector('input').addEventListener('change', () => {
      picks[i] = k;
      status.textContent = `Đã chọn ${'ABCD'[k]}. Bạn vẫn đổi được cho đến khi hết giờ.`;
    }));

    function reveal(why) {
      if (done) return;
      done = true;
      clearInterval(tick);
      const pick = picks[i], ok = pick === q.answer;
      opts.forEach((o, k) => { o.classList.toggle('right', k === q.answer); o.classList.toggle('wrong', k === pick && !ok); o.querySelector('input').disabled = true; });
      bDone.hidden = true;
      clock.classList.add('stopped');
      status.textContent = why === 'time' ? 'Hết giờ.' : 'Đã chốt đáp án.';
      const isLast = i === qs.length - 1;
      const bNext = h('button.btn.btn-primary', { type: 'button', onclick: () => { i += 1; isLast ? finish() : ask(); } }, isLast ? 'Xem kết quả' : 'Câu tiếp →');
      after.replaceChildren(h('div.reveal', {},
        h('div.tags', {}, h(`span.tag${ok ? '.ok' : ''}`, {}, ok ? 'Chính xác' : pick == null ? `Chưa chọn · đáp án ${'ABCD'[q.answer]}` : `Chưa đúng · đáp án ${'ABCD'[q.answer]}`)),
        q.explain ? rich(q.explain) : null),
        h('div.btn-row', { style: 'margin-top:16px' }, bNext));
      bNext.focus({ preventScroll: true });
      after.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    // The clock pauses while the page is hidden (another tab, or another feature of this app).
    const tick = setInterval(() => {
      const now = performance.now(), away = document.hidden || el.closest('.pane')?.hidden || !el.isConnected;
      if (!away) left -= now - last;
      last = now;
      if (!el.isConnected) return clearInterval(tick);
      const s = Math.max(0, Math.ceil(left / 1000));
      secs.textContent = String(s);
      bar.firstChild.style.transform = `scaleX(${Math.max(0, left) / (QUIZ_SECONDS * 1000)})`;
      clock.classList.toggle('low', s <= 10);
      if (s <= 10 && !warned) { warned = true; status.textContent = `Còn 10 giây. ${status.textContent}`; }
      if (left <= 0) reveal('time');
    }, 200);

    const right = scoreGame(qs.slice(0, i), picks).correct;
    el.replaceChildren(
      h('div.quiz-head', {},
        h('div.quiz-count', {}, h('b', {}, `Câu ${String(i + 1).padStart(2, '0')}`), h('span', {}, `/${qs.length}`)),
        h('div.tags', {}, h('span.tag.gold', {}, q.kind), q.topic ? h('span.tag.topic', {}, q.topic) : null, h('span.muted', {}, `Đúng ${right}/${i} · ${level}`)),
        clock),
      rich(q.prompt),
      h('div.options', { role: 'radiogroup', 'aria-label': 'Phương án' }, opts),
      h('div.quiz-foot', {}, status, bDone),
      after);
    el.scrollIntoView({ block: 'nearest' });
  }

  function finish() {
    const r = scoreGame(qs, picks);
    const wrong = qs.filter((q, k) => picks[k] !== q.answer);
    addSession({
      feature: 'quiz', topic: wrong[0]?.topic || qs[0]?.topic || 'Hỏi đáp chung', score: r.score,
      mistakes: wrong.map((q) => ({ topic: q.topic, type: 'Chọn sai đáp án trắc nghiệm', detail: q.prompt.slice(0, 160) })),
    });
    el.replaceChildren(
      h('div.board', {}, h('div.row.top-tier', {}, h('b', {}, 'Kết quả'), h('span', {}, `${r.correct}/${r.total} câu đúng · Độ khó ${level}. Đã lưu vào hồ sơ.`), odometer(r.score))),
      h('h3', {}, 'Xem lại từng câu'),
      h('div.quiz-review', {}, qs.map((q, k) => {
        const p = picks[k], ok = p === q.answer;
        return h('details.quiz-item', {},
          h('summary', {}, h('b', {}, `Câu ${k + 1}`), h(`span.tag${ok ? '.ok' : ''}`, {}, ok ? 'Đúng' : p == null ? 'Bỏ trống' : 'Sai'), h('span.quiz-sum', {}, q.prompt.replace(/\$[^$]*\$/g, '…').slice(0, 90))),
          rich(q.prompt),
          h('p', {}, h('strong', {}, 'Bạn chọn: '), p == null ? 'không chọn' : 'ABCD'[p], ' · ', h('strong', {}, 'Đáp án: '), 'ABCD'[q.answer], '. ', rich(q.options[q.answer], 'span')),
          q.explain ? rich(q.explain) : null);
      })),
      h('div.btn-row', { style: 'margin-top:18px' }, h('button.btn.btn-primary', { type: 'button', onclick: again }, 'Chơi bộ câu hỏi mới')));
    toast(`Bạn trả lời đúng ${r.correct}/${r.total} câu.`);
  }

  ask();
  return el;
}
