// AI Tutor in Polya's 4 steps: understand the problem → plan → present & grade → check with the full solution.
// The problem and the work (image/PDF/Word, OCR by Gemini) are entered once on the left; each step keeps its result.
import { h, icon, rich, list, run, POLYA, toast, casio } from '../ui.js';
import { ai } from '../api.js';
import { uploader, readButton } from '../uploader.js';
import { mathField } from '../mathinput.js';
import { chart, odometer, galton } from '../viz.js';
import { addSession } from '../profile.js';
import { boardToggle } from '../board.js';

export const meta = { title: 'Gia sư chấm bài', lede: 'Nhập đề bài, bấm «Tìm hiểu đề» rồi đi qua 4 bước giải toán; bấm vào bước nào cũng xem lại được.\nAI gợi ý chiến lược (không lộ đáp án), chấm bài ở bước Trình bày và chỉ hiện lời giải khi bạn yêu cầu.' };

export function render(root) {
  // ---- Left: the problem and the work. One main action: "Tìm hiểu đề".
  const problem = mathField({ label: 'Đề bài', name: 'problem', rows: 4, placeholder: 'Gõ hoặc dán đề bài. Có thể bỏ trống nếu đề đã nằm trong ảnh/PDF.' });
  const up = uploader({ label: 'Chọn ảnh, PDF hoặc Word', hint: 'Đề bài hoặc bài làm. Tối đa 3 tệp, mỗi tệp ≤ 10 MB.' });
  const board = boardToggle();
  const bStart = h('button.btn.btn-primary.btn-block', { type: 'button' }, 'Tìm hiểu đề');

  const payload = () => ({
    problem: problem.querySelector('textarea').value.trim(),
    barem: barem.querySelector('textarea').value.trim(),
    files: [...up.files(), ...(board.board.isEmpty() ? [] : [board.board.toFile()]).map(({ mimeType, data }) => ({ mimeType, data }))],
    docs: up.docs(),
  });
  const need = (p, wantFiles) => {
    if (wantFiles && !p.files.length && !p.docs.length) { toast('Hãy tải ảnh/PDF/Word bài làm hoặc viết trên bảng để AI chấm.'); return false; }
    if (!p.problem && !p.files.length && !p.docs.length) { toast('Hãy nhập đề bài hoặc tải tệp lên.'); return false; }
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
  const bPlan = h('button.btn', { type: 'button' }, 'Xem chương trình giải');
  const bGrade = h('button.btn.btn-primary', { type: 'button' }, 'Chấm điểm');
  const bSolve = h('button.btn.btn-primary', { type: 'button' }, 'Xem lời giải chi tiết');

  out[0].append(empty());
  out[1].append(h('div.btn-row', {}, bPlan));
  const steps = [
    [h('p.muted', {}, 'Đề cho gì, cần tìm gì, có điều kiện gì. Nhập đề ở khung Đề bài rồi bấm «Tìm hiểu đề».'), out[0]],
    [h('p.muted', {}, 'Hướng đi và kiến thức cần dùng, không có đáp số.'), out[1]],
    [h('p.muted', {}, 'Tự trình bày lời giải, tải ảnh/PDF/Word hoặc viết trên bảng ở khung Đề bài, rồi bấm «Chấm điểm».'),
      h('div.btn-row', {}, bGrade, bBarem), baremBox, out[2]],
    [h('p.muted', {}, 'Kiểm tra lại kết quả, xem lời giải đầy đủ, cách bấm máy CASIO và bài tương tự.'), h('div.btn-row', {}, bSolve), out[3]],
  ].map((kids, i) => h('div.step-pane', { hidden: i !== 0 }, h('h2', {}, `Bước ${i + 1}. ${POLYA[i]}`), ...kids, nav(i)));

  function go(i, reveal = false) {
    cur = i;
    tabs.replaceChildren(...POLYA.map((label, j) => h('li', { 'data-state': j === cur ? 'current' : has[j] ? 'done' : 'todo' },
      h('button', { type: 'button', 'aria-current': j === cur ? 'step' : null, onclick: () => go(j, true) }, h('b', {}, String(j + 1)), label))));
    steps.forEach((s, j) => { s.hidden = j !== cur; });
    // On a phone the step sits below the problem form: bring it into view when the student picks a step.
    const top = steps[cur].getBoundingClientRect().top;
    if (reveal && (top < 0 || top > innerHeight * 0.6)) steps[cur].scrollIntoView({ block: 'start' });
  }

  // One strategy call fills steps 1 and 2.
  const understand = (btn) => { const p = payload(); if (!need(p)) return; go(0); run(btn, out[0], async () => {
    const d = await ai('strategy', p);
    has[0] = has[1] = true;
    out[1].replaceChildren(planView(d));
    go(0);
    return understandView(d);
  }, 'Đang phân tích đề…'); };
  bStart.onclick = () => understand(bStart);
  bPlan.onclick = () => { const p = payload(); if (!need(p)) return; run(bPlan, out[1], async () => {
    const d = await ai('strategy', p);
    has[0] = has[1] = true;
    out[0].replaceChildren(understandView(d));
    go(1);
    return planView(d);
  }, 'Đang xây dựng chương trình giải…'); };
  bGrade.onclick = () => { const p = payload(); if (!need(p, true)) return; run(bGrade, out[2], async () => {
    const d = await ai('grade', p);
    const serial = addSession({ feature: 'tutor', topic: d.mistakes?.[0]?.topic || 'Khác', score: d.score, mistakes: d.mistakes });
    has[2] = true; go(2);
    return gradeView(d, serial);
  }, 'Đang đọc bài làm và chấm điểm…'); };
  bSolve.onclick = () => { const p = payload(); if (!need(p)) return; run(bSolve, out[3], async () => {
    const d = await ai('solve', p);
    has[3] = true; go(3);
    return solveView(d);
  }, 'Đang viết lời giải…'); };

  go(0);
  root.append(tabs, h('div.work.tutor', {},
    h('section.panel.stack', { 'aria-label': 'Đề bài và bài làm' },
      problem,
      h('div.field', {}, h('span', {}, 'Tệp đề bài / bài làm'), up.el),
      h('div.btn-row', {}, board.btn), board.wrap,
      bStart),
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
    ...section('Chương trình giải', list(d.plan, true)),
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
  const steps = [['1', 'Tìm hiểu đề', d.understand], ['2', 'Chương trình giải', d.plan], ['3', 'Trình bày lời giải', d.solution], ['4', 'Kiểm tra & mở rộng', d.check]];
  return h('div', {},
    h('h2', { style: 'margin-bottom:14px' }, 'Lời giải chi tiết'),
    ...steps.filter((s) => s[2]).map(([n, t, body]) => h('div.step', {}, h('div.step-h', {}, h('span.n', {}, n), h('h3', {}, t)), rich(body))),
    chart(d.viz),
    casio(d.casio),
    d.similar?.length ? [h('h3', {}, 'Bài tương tự để tự luyện'), list(d.similar, true)] : null);
}

export const mistakes = (ms) => h('div', {}, ...ms.map((m) => h('div.mistake', {}, h('div.tags', {}, h('span.tag', {}, m.type || 'Lỗi'), m.topic ? h('span.tag.topic', {}, m.topic) : null), rich(m.detail))));
const fmt = (x) => String(x ?? '—').replace('.', ',');
