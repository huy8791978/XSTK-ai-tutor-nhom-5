// AI Tutor in Polya's 4 steps: understand the problem → plan → present & grade → check with the full solution.
// The problem and the work (image/PDF/Word, OCR by Gemini) are entered once on the left; each step keeps its result.
import { h, icon, rich, list, run, POLYA, polyaGuide, toast, casio } from '../ui.js';
import { ai } from '../api.js';
import { uploader, readButton } from '../uploader.js';
import { mathField } from '../mathinput.js';
import { chart, odometer, galton } from '../viz.js';
import { addSession } from '../profile.js';
import { boardToggle } from '../board.js';

export const meta = { title: 'Gia sư chấm bài', lede: 'Nhập đề bài, bấm «Tìm hiểu đề bài» rồi đi qua 4 bước giải toán; bấm vào bước nào cũng xem lại được.\nAI gợi ý chiến lược (không lộ đáp án), chấm bài ở bước Trình bày lời giải và chỉ hiện lời giải khi bạn yêu cầu.' };

export function render(root) {
  // ---- Left: only the problem. One main action: "Tìm hiểu đề". The student's work is handed in at step 3.
  const problem = mathField({ label: 'Đề bài', name: 'problem', rows: 5, placeholder: 'Gõ hoặc dán đề bài. Có thể bỏ trống nếu đề nằm trong tệp bên dưới.' });
  const upProblem = uploader({ compact: true, title: 'Tải đề bài: ảnh, PDF hoặc Word', label: 'Tải ảnh, PDF hoặc Word đề bài', hint: 'Tối đa 3 tệp, mỗi tệp ≤ 10 MB.', scope: () => problemPanel });
  const bStart = h('button.btn.btn-primary.btn-block', { type: 'button' }, 'Tìm hiểu đề bài');

  // ---- Step 3: the student's work: typed answer, files, or the iPad board.
  const answer = mathField({ label: 'Bài làm của bạn', name: 'answer', rows: 5, placeholder: 'Gõ lời giải, đáp án của bạn… hoặc tải tệp / viết trên bảng bên dưới.' });
  const upWork = uploader({ compact: true, title: 'Tải bài làm: ảnh, PDF hoặc Word', label: 'Tải ảnh, PDF hoặc Word bài làm', hint: 'Chụp thẳng, đủ sáng để AI đọc chính xác. Tối đa 3 tệp.', scope: () => steps[2], pastePriority: 1 });
  const board = boardToggle();

  const tag = (role) => (d) => ({ ...d, name: `[${role}] ${d.name}` });
  const problemPart = () => ({
    problem: problem.querySelector('textarea').value.trim(),
    files: upProblem.files(),
    docs: upProblem.docs().map(tag('Đề bài')),
  });
  const workPart = () => {
    const p = problemPart();
    const work = [...upWork.files(), ...(board.board.isEmpty() ? [] : [board.board.toFile()]).map(({ mimeType, data }) => ({ mimeType, data }))];
    // Problem files come first; the server is told how many, so the AI knows which images are the problem.
    return { ...p, answer: answer.querySelector('textarea').value.trim(), barem: barem.querySelector('textarea').value.trim(),
      problemFiles: p.files.length, workFiles: work.length, files: [...p.files, ...work], docs: [...p.docs, ...upWork.docs().map(tag('Bài làm'))] };
  };
  const needProblem = (p) => {
    if (!p.problem && !p.files.length && !p.docs.length) { toast('Hãy nhập đề bài hoặc tải tệp đề bài lên.'); return false; }
    return true;
  };
  const needWork = (p) => {
    if (!needProblem(p)) return false;
    if (!p.answer && !p.workFiles && !p.docs.some((d) => d.name.startsWith('[Bài làm]'))) { toast('Hãy gõ bài làm, tải tệp bài làm hoặc viết trên bảng để AI chấm.'); return false; }
    return true;
  };

  // ---- Right: the 4 Polya steps. Every step keeps its own content, and every tab stays clickable,
  // so the student can go back to any earlier step and read it again.
  const has = [false, false, false, false];
  let cur = 0;
  const tabs = h('ol.detents.steps.tutor-steps', { 'aria-label': 'Bốn bước giải toán' });
  const out = POLYA.map(() => h('div'));
  const nav = (i) => h('div.stage-nav', {},
    i > 0 ? h('button.btn.btn-ghost', { type: 'button', onclick: () => go(i - 1, true) }, `← Bước ${i}: ${POLYA[i - 1]}`) : h('span'),
    i < 3 ? h('button.btn.btn-ghost', { type: 'button', onclick: () => go(i + 1, true) }, `Bước ${i + 2}: ${POLYA[i + 1]} →`) : null);

  const barem = mathField({ label: 'Barem điểm (tuỳ chọn)', name: 'barem', rows: 3, placeholder: 'Ví dụ: Đặt biến cố 1đ; Công thức đầy đủ 2đ; Bayes 4đ; Kết luận 1đ…' });
  const baremBox = h('div', { hidden: true }, barem);
  const bBarem = h('button.btn.btn-ghost', { type: 'button', 'aria-expanded': 'false', onclick: () => { baremBox.hidden = !baremBox.hidden; bBarem.setAttribute('aria-expanded', String(!baremBox.hidden)); } }, 'Barem điểm');
  const bPlan = h('button.btn', { type: 'button' }, 'Xem gợi ý cách giải');
  const bGrade = h('button.btn.btn-primary', { type: 'button' }, 'Chấm điểm');
  const bSolve = h('button.btn.btn-primary', { type: 'button' }, 'Xem lời giải chi tiết');

  out[0].append(empty());
  out[1].append(h('div.btn-row', {}, bPlan));
  const steps = [
    [h('p.muted', {}, 'Nhập đề ở khung Đề bài rồi bấm «Tìm hiểu đề bài».'), out[0]],
    [h('p.muted', {}, 'Bấm nút dưới để xem gợi ý cách giải (không có đáp số).'), out[1]],
    [h('p.muted', {}, 'Tự trình bày lời giải: gõ vào ô dưới, tải ảnh/PDF/Word hoặc viết trên bảng, rồi bấm «Chấm điểm».'),
      h('div.stack.work-box', {}, answer, upWork.el, h('div.btn-row', {}, board.btn, bBarem), board.wrap, baremBox),
      h('div.btn-row', {}, bGrade), out[2]],
    [h('p.muted', {}, 'Xem lời giải đầy đủ, cách bấm máy CASIO, ứng dụng của kết quả và bài tương tự.'), h('div.btn-row', {}, bSolve), out[3]],
  ].map((kids, i) => h('div.step-pane', { hidden: i !== 0 }, h('h2', {}, `Bước ${i + 1}. ${POLYA[i]}`), polyaGuide(i), ...kids, nav(i)));

  function go(i, reveal = false) {
    cur = i;
    tabs.replaceChildren(...POLYA.map((label, j) => h('li', { 'data-state': j === cur ? 'current' : has[j] ? 'done' : 'todo' },
      h('button', { type: 'button', 'aria-current': j === cur ? 'step' : null, onclick: () => go(j, true) }, h('b', {}, String(j + 1)), label))));
    steps.forEach((s, j) => { s.hidden = j !== cur; });
    // On a phone the step sits below the problem form: bring it into view when the student picks a step.
    const top = steps[cur].getBoundingClientRect().top;
    if (reveal && (top < 0 || top > innerHeight * 0.6)) steps[cur].scrollIntoView({ block: 'start' });
  }

  // One strategy call answers steps 1 and 2, but each step is shown (and ticked) only when the student asks for it:
  // «Tìm hiểu đề bài» fills step 1 only; step 2 waits for «Xem gợi ý cách giải», which reuses the same answer
  // while the problem has not changed.
  let cache = null; // { key, d }
  const keyOf = (p) => JSON.stringify([p.problem, p.files.map((f) => f.data.length + f.data.slice(0, 64)), p.docs.map((d) => d.text)]);
  const strategy = async (p) => {
    const key = keyOf(p);
    if (cache?.key !== key) {
      const d = await ai('strategy', p);
      if (cache?.key !== key) { has[1] = false; out[1].replaceChildren(h('div.btn-row', {}, bPlan)); } // a new problem: step 2 starts over
      cache = { key, d };
    }
    return cache.d;
  };
  bStart.onclick = () => { const p = problemPart(); if (!needProblem(p)) return; go(0); run(bStart, out[0], async () => {
    const d = await strategy(p);
    has[0] = true; go(0);
    return understandView(d);
  }, 'Đang phân tích đề…'); };
  bPlan.onclick = () => { const p = problemPart(); if (!needProblem(p)) return; run(bPlan, out[1], async () => {
    const d = await strategy(p);
    if (!has[0]) { has[0] = true; out[0].replaceChildren(understandView(d)); }
    has[1] = true; go(1);
    return planView(d);
  }, 'Đang tìm cách giải…'); };
  bGrade.onclick = () => { const p = workPart(); if (!needWork(p)) return; run(bGrade, out[2], async () => {
    const d = await ai('grade', p);
    const serial = addSession({ feature: 'tutor', topic: d.mistakes?.[0]?.topic || 'Khác', score: d.score, mistakes: d.mistakes });
    has[2] = true; go(2);
    return gradeView(d, serial);
  }, 'Đang đọc bài làm và chấm điểm…'); };
  bSolve.onclick = () => { const p = problemPart(); if (!needProblem(p)) return; run(bSolve, out[3], async () => {
    const d = await ai('solve', p);
    has[3] = true; go(3);
    return solveView(d);
  }, 'Đang viết lời giải…'); };

  go(0);
  const problemPanel = h('section.panel.stack', { 'aria-label': 'Đề bài' }, problem, upProblem.el, bStart);
  root.append(tabs, h('div.work.tutor', {},
    problemPanel,
    h('section.panel.sticky-col', { 'aria-label': 'Bước đang xem' }, ...steps)));
}

function empty() {
  const c = h('canvas', { role: 'img', 'aria-label': 'Bảng Galton: các viên bi rơi ngẫu nhiên tạo thành phân phối gần chuẩn' });
  const box = h('div.empty', {}, c, h('p', {}, 'Mỗi viên bi rẽ trái hay phải với xác suất ½. Hàng nghìn lựa chọn ngẫu nhiên vẫn xếp thành hình chuông: đó là định lí giới hạn trung tâm.'));
  requestAnimationFrame(() => c.isConnected && galton(c));
  return box;
}

function section(title, ...kids) { return [h('h3', {}, title), ...kids]; }

/** Step 1: what is given, what to find, conditions. */
export function understandView(d) {
  return h('div', {},
    d.topic ? h('div.tags', {}, h('span.tag.topic', {}, d.topic)) : null,
    ...section('Cái đã cho', list(d.given)), ...section('Cái phải tìm', list(d.find)),
    d.conditions?.length ? section('Điều kiện', list(d.conditions)) : []);
}

/** Step 2: the plan as guiding questions, the knowledge to use, common traps. No answer. */
export function planView(d) {
  return h('div', {},
    ...section('Cách giải', list(d.plan, true)),
    ...section('Kiến thức cần dùng', list(d.knowledge)),
    d.pitfalls?.length ? section('Sai lầm hay gặp', list(d.pitfalls)) : [],
    chart(d.viz));
}

export function gradeView(d, serial) {
  return h('div.ticket', {},
    serial ? h('span.ticket-serial', {}, serial) : null,
    h('div.board', {},
      h('div.row.top-tier', {}, h('b', {}, 'Điểm'), h('span', {}, d.summary || ''), odometer(+d.score || 0)),
      ...(d.rubric || []).map((r, i) => h('div.row', {}, h('b', {}, `Bước ${i + 1}`), h('span', {}, h('strong', {}, r.step), ' ', rich(r.comment, 'span')), h('em', {}, `${fmt(r.points)}/${fmt(r.max)}`)))),
    d.mistakes?.length ? [h('h3', {}, 'Lỗi sai'), mistakes(d.mistakes)] : null,
    d.strengths?.length ? [h('h3', {}, 'Điểm tốt'), list(d.strengths)] : null,
    d.advice?.length ? [h('h3', {}, 'Lời khuyên'), list(d.advice)] : null,
    d.transcript ? h('details.more', { style: 'margin-top:18px' }, h('summary', {}, 'Bài làm AI đã đọc được (OCR)', icon('down')), h('div.btn-row', { style: 'margin:8px 0' }, readButton(() => d.transcript, 'Đọc to bài làm')), rich(d.transcript)) : null,
    h('p.muted', { style: 'margin-top:14px;font-size:13.5px' }, 'Đã lưu vào hồ sơ học tập.'));
}

export function solveView(d) {
  const steps = POLYA.map((t, k) => [String(k + 1), t, [d.understand, d.plan, d.solution, d.check][k]]);
  return h('div', {},
    h('h2', { style: 'margin-bottom:14px' }, 'Lời giải chi tiết'),
    ...steps.filter((s) => s[2]).map(([n, t, body]) => h('div.step', {}, h('div.step-h', {}, h('span.n', {}, n), h('h3', {}, t)), rich(body))),
    chart(d.viz),
    casio(d.casio),
    d.similar?.length ? [h('h3', {}, 'Bài tương tự để tự luyện'), list(d.similar, true)] : null);
}

export const mistakes = (ms) => h('div', {}, ...ms.map((m) => h('div.mistake', {}, h('div.tags', {}, h('span.tag', {}, m.type || 'Lỗi'), m.topic ? h('span.tag.topic', {}, m.topic) : null), rich(m.detail))));
const fmt = (x) => String(x ?? '—').replace('.', ',');
