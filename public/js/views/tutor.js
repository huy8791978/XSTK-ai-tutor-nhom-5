// AI Tutor: upload work (image/PDF, OCR by Gemini) → strategy / grade / detailed solution.
import { h, icon, rich, list, run, detents, POLYA, toast, casio } from '../ui.js';
import { ai } from '../api.js';
import { readFiles } from '../files.js';
import { mathField } from '../mathinput.js';
import { chart, odometer, galton } from '../viz.js';
import { addSession } from '../profile.js';
import { boardToggle } from '../board.js';

export const meta = { title: 'Gia sư chấm bài', lede: 'Tải ảnh hoặc PDF bài làm. AI gợi ý chiến lược (không lộ đáp án), chấm điểm từng bước và chỉ hiện lời giải khi bạn yêu cầu.' };

export function render(root) {
  let files = [];
  const rail = h('div', {}, detents(POLYA, ['current']));
  const problem = mathField({ label: 'Đề bài', name: 'problem', rows: 4, placeholder: 'Gõ hoặc dán đề bài. Có thể bỏ trống nếu đề đã nằm trong ảnh/PDF.' });
  const input = h('input', { type: 'file', accept: 'image/*,application/pdf', multiple: true, 'aria-label': 'Chọn ảnh hoặc PDF bài làm' });
  const drop = h('label.drop', {}, icon('upload'), h('span', {}, h('strong', {}, 'Chọn ảnh hoặc PDF'), ' hoặc kéo thả vào đây'), h('small.muted', {}, 'Tối đa 3 tệp, mỗi tệp ≤ 10 MB. Chụp thẳng, đủ sáng để AI đọc chính xác.'), input);
  const thumbs = h('div.files');
  const board = boardToggle();
  const barem = mathField({ label: 'Barem điểm (tuỳ chọn)', name: 'barem', rows: 3, placeholder: 'Ví dụ: Đặt biến cố 1đ; Công thức đầy đủ 2đ; Bayes 4đ; Kết luận 1đ…' });
  const baremBox = h('div', { hidden: true }, barem);
  const bBarem = h('button.btn.btn-ghost', { type: 'button', 'aria-expanded': 'false', onclick: () => { baremBox.hidden = !baremBox.hidden; bBarem.setAttribute('aria-expanded', String(!baremBox.hidden)); } }, 'Cập nhật barem điểm');
  const out = h('div', {}, empty());

  const bStrat = h('button.btn', { type: 'button' }, 'Chiến lược giải');
  const bGrade = h('button.btn.btn-primary', { type: 'button' }, 'Chấm điểm');
  const bSolve = h('button.btn', { type: 'button' }, 'Lời giải chi tiết');

  const paint = () => thumbs.replaceChildren(...files.map((f, i) => h('div.file', {},
    f.url ? h('img', { src: f.url, alt: f.name }) : h('div.doc', {}, icon('file')),
    h('span', { title: f.name }, f.name),
    h('button', { type: 'button', 'aria-label': `Bỏ ${f.name}`, onclick: () => { files.splice(i, 1); paint(); } }, icon('x')))));

  async function add(list) {
    try {
      const next = await readFiles([...list]);
      files = [...files, ...next].slice(0, 3);
      if (files.length === 3 && next.length) toast('Đã đủ 3 tệp.');
      paint();
    } catch (e) { toast(e.message); }
    input.value = '';
  }
  input.addEventListener('change', () => add(input.files));
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); add(e.dataTransfer.files); });

  const payload = () => ({
    problem: problem.querySelector('textarea').value.trim(),
    barem: barem.querySelector('textarea').value.trim(),
    files: [...files, ...(board.board.isEmpty() ? [] : [board.board.toFile()])].map(({ mimeType, data }) => ({ mimeType, data })),
  });
  const need = (p, wantFiles) => {
    if (wantFiles && !p.files.length) { toast('Hãy tải ảnh/PDF bài làm hoặc viết trên bảng để AI chấm.'); return false; }
    if (!p.problem && !p.files.length) { toast('Hãy nhập đề bài hoặc tải tệp lên.'); return false; }
    return true;
  };
  const setRail = (states) => rail.replaceChildren(detents(POLYA, states));

  bStrat.onclick = () => { const p = payload(); if (!need(p)) return; run(bStrat, out, async () => {
    const d = await ai('strategy', p); setRail(['done', 'current']); return strategyView(d);
  }, 'Đang phân tích đề…'); };
  bGrade.onclick = () => { const p = payload(); if (!need(p, true)) return; run(bGrade, out, async () => {
    const d = await ai('grade', p);
    const serial = addSession({ feature: 'tutor', topic: d.mistakes?.[0]?.topic || 'Khác', score: d.score, mistakes: d.mistakes });
    setRail(['done', 'done', 'done', 'current']); return gradeView(d, serial);
  }, 'Đang đọc bài làm và chấm điểm…'); };
  bSolve.onclick = () => { const p = payload(); if (!need(p)) return; run(bSolve, out, async () => {
    const d = await ai('solve', p); setRail(['done', 'done', 'done', 'done']); return solveView(d);
  }, 'Đang viết lời giải…'); };

  root.append(rail, h('div.work', {},
    h('section.panel.stack', { 'aria-label': 'Bài làm' }, problem, h('div.field', {}, h('span', {}, 'Bài làm (ảnh / PDF / bảng iPad)'), drop), thumbs,
      h('div.btn-row', {}, board.btn, bBarem), board.wrap, baremBox,
      h('div.btn-row', {}, bStrat, bGrade, bSolve)),
    h('section.panel.sticky-col', { 'aria-label': 'Kết quả' }, out)));
}

function empty() {
  const c = h('canvas', { role: 'img', 'aria-label': 'Bảng Galton: các viên bi rơi ngẫu nhiên tạo thành phân phối gần chuẩn' });
  const box = h('div.empty', {}, c, h('p', {}, 'Mỗi viên bi rẽ trái hay phải với xác suất ½. Hàng nghìn lựa chọn ngẫu nhiên vẫn xếp thành hình chuông: đó là định lí giới hạn trung tâm. Kết quả chấm sẽ hiện ở đây.'));
  requestAnimationFrame(() => c.isConnected && galton(c));
  return box;
}

function section(title, ...kids) { return [h('h3', {}, title), ...kids]; }

export function strategyView(d) {
  return h('div', {},
    h('h2', {}, 'Chiến lược giải'),
    h('p.muted', {}, 'Gợi ý hướng đi, không có đáp số. Tự làm rồi bấm "Chấm điểm".'),
    d.topic ? h('div.tags', { style: 'margin-top:10px' }, h('span.tag.topic', {}, d.topic)) : null,
    ...section('Cái đã cho', list(d.given)), ...section('Cái phải tìm', list(d.find)),
    d.conditions?.length ? section('Điều kiện', list(d.conditions)) : [],
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
    d.transcript ? h('details.more', { style: 'margin-top:18px' }, h('summary', {}, 'Bài làm AI đã đọc được (OCR)', icon('down')), rich(d.transcript)) : null,
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
