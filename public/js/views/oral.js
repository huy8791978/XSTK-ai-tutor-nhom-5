// Oral exam (vấn đáp) on theory: Trải nghiệm → Hình thành → Củng cố → Vận dụng, graded per answer and summarised at the end.
import { h, rich, list, run, toast, detents, STAGES } from '../ui.js';
import { ai } from '../api.js';
import { mathField } from '../mathinput.js';
import { chart, odometer } from '../viz.js';
import { addSession } from '../profile.js';
import { mistakes as mistakeList } from './tutor.js';
import { TOPICS } from '../topics.js';

export const meta = { title: 'Vấn đáp lí thuyết', lede: 'AI hỏi từng câu như thầy cô vấn đáp, chấm từng câu trả lời, rồi tổng kết lỗ hổng kiến thức và sai lầm của bạn.' };

export function render(root) {
  const topic = h('select', { id: 'o-topic' }, TOPICS.map((t) => h('option', {}, t)));
  const bStart = h('button.btn.btn-primary', { type: 'button' }, 'Bắt đầu vấn đáp');
  const rail = h('div', {}, detents(STAGES, ['current']));
  const thread = h('div.thread', { 'aria-live': 'polite' }, h('div.panel.empty', {}, h('p', {}, 'Chọn một chủ đề rồi bấm "Bắt đầu vấn đáp". Gia sư sẽ mở đầu bằng một tình huống thực tế, rồi hỏi sâu dần qua 4 giai đoạn.')));
  const field = mathField({ label: 'Câu trả lời của bạn', name: 'oral', rows: 3, placeholder: 'Trả lời bằng lời của bạn, có thể kèm công thức…' });
  const bSend = h('button.btn.btn-primary', { type: 'button' }, 'Gửi câu trả lời');
  const bEnd = h('button.btn.btn-danger', { type: 'button' }, 'Kết thúc & chấm điểm');
  const compose = h('div.compose', { hidden: true }, field, h('div.btn-row', {}, bSend, bEnd));
  let history = [], collected = [], scores = [], active = '';

  const stageOf = (s) => Math.max(0, STAGES.findIndex((x) => s && s.startsWith(x)));
  const ask = async (btn) => {
    const slot = h('div'); thread.append(slot);
    await run(btn, slot, async () => {
      const answered = history.some((m) => m.role === 'user');
      const d = await ai('oral', { topic: active, history, action: 'next' });
      if (!answered) d.score = null; // the opening question grades nothing
      if (typeof d.score === 'number') scores.push(d.score);
      collected.push(...(d.mistakes || []));
      history.push({ role: 'ai', text: d.question || '' });
      const k = stageOf(d.stage);
      rail.replaceChildren(detents(STAGES, STAGES.map((_, i) => (i < k ? 'done' : i === k ? 'current' : 'todo'))));
      return h('div.msg.ai', {},
        h('div.msg-meta', {}, h('span.tag.gold', {}, d.stage || STAGES[k])),
        typeof d.score === 'number' ? h('div.board', {}, h('div.row', {}, h('b', {}, 'Câu trước'), d.feedback ? rich(d.feedback, 'span') : h('span'), odometer(d.score, 10, true))) : null,
        d.feedback && typeof d.score !== 'number' ? h('div.feedback', {}, rich(d.feedback)) : null,
        d.mistakes?.length ? mistakeList(d.mistakes) : null,
        rich(d.question || ''), chart(d.viz));
    }, 'Gia sư đang đặt câu hỏi…');
    compose.hidden = !history.some((m) => m.role === 'ai');
    field.querySelector('textarea').focus({ preventScroll: true });
  };

  bStart.onclick = () => {
    active = topic.value; history = []; collected = []; scores = [];
    thread.replaceChildren(); ask(bStart);
  };
  bSend.onclick = () => {
    const ta = field.querySelector('textarea'), text = ta.value.trim();
    if (!text) return toast('Hãy viết câu trả lời.');
    history.push({ role: 'user', text });
    thread.append(h('div.msg.me', {}, rich(text)));
    ta.value = ''; ta.dispatchEvent(new Event('input'));
    ask(bSend);
  };
  bEnd.onclick = () => {
    if (!history.some((m) => m.role === 'user')) return toast('Hãy trả lời ít nhất một câu trước khi kết thúc.');
    const slot = h('div'); thread.append(slot);
    run(bEnd, slot, async () => {
      const d = await ai('oral', { topic: active, history, action: 'finish' });
      const all = [...collected, ...(d.mistakes || [])];
      addSession({ feature: 'oral', topic: active, score: d.score, mistakes: all });
      compose.hidden = true;
      rail.replaceChildren(detents(STAGES, STAGES.map(() => 'done')));
      return h('div.panel', {},
        h('div.board', {}, h('div.row.top-tier', {}, h('b', {}, 'Tổng kết'), h('span', {}, rich(d.summary || '', 'span')), odometer(+d.score || 0))),
        d.gaps?.length ? [h('h3', {}, 'Lỗ hổng kiến thức'), list(d.gaps)] : null,
        all.length ? [h('h3', {}, 'Sai lầm trong buổi vấn đáp'), mistakeList(all)] : null,
        d.advice?.length ? [h('h3', {}, 'Cần làm tiếp'), list(d.advice)] : null,
        h('p.muted', { style: 'margin-top:12px;font-size:13.5px' }, 'Đã lưu vào hồ sơ học tập.'));
    }, 'Đang tổng kết buổi vấn đáp…');
  };

  root.append(
    h('div.toolbar', {}, h('label.field', { for: 'o-topic' }, h('span', {}, 'Chủ đề lí thuyết'), topic), h('div.btn-row', {}, bStart)),
    rail,
    h('div', { style: 'max-width:900px' }, thread, compose));
}

