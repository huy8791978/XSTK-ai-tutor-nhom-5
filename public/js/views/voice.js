// Voice Q&A: talk with the tutor about XSTK. Math that is hard to say goes on the handwriting board.
// When speech is missing or unclear, the tutor says so (aloud and on screen) and points to the text box below.
import { h, icon, rich, run, toast, casio } from '../ui.js';
import { ai } from '../api.js';
import { mathField } from '../mathinput.js';
import { boardToggle } from '../board.js';
import { chart } from '../viz.js';
import { listen, speak, stopSpeaking, unclear, canListen, fallbackText } from '../voice.js';

export const meta = { title: 'Hỏi đáp giọng nói', lede: 'Bấm micro và hỏi bằng giọng nói về Xác suất Thống kê.\nBài toán nhiều công thức thì viết lên bảng (iPad). AI trả lời bằng chữ và đọc thành tiếng.' };

export function render(root) {
  const history = [];
  const thread = h('div.thread', { 'aria-live': 'polite' });
  const live = h('p.live-text', { 'aria-live': 'polite' });
  const mic = h('button.mic', { type: 'button', 'aria-pressed': 'false', 'aria-label': 'Bấm để nói' }, icon('mic'));
  const micLabel = h('span.mic-label', {}, canListen() ? 'Bấm để nói' : 'Trình duyệt này không hỗ trợ nhận giọng nói');
  const field = mathField({ label: 'Hoặc nhập đề bài, đáp án hay câu trả lời của bạn', name: 'voice', rows: 3, placeholder: 'Gõ câu hỏi, đề bài hoặc câu trả lời…' });
  const ta = field.querySelector('textarea');
  const board = boardToggle('Trình bày trên bảng (iPad)');
  const bSend = h('button.btn.btn-primary', { type: 'button' }, 'Gửi');
  const bMute = h('button.btn.btn-ghost', { type: 'button', onclick: stopSpeaking }, 'Dừng đọc');
  const compose = h('section.panel.compose-box', { 'aria-label': 'Nhập bằng bàn phím' }, field, h('div.btn-row', { style: 'margin-top:10px' }, bSend, board.btn, bMute), board.wrap);

  // Didn't hear / didn't understand: say it, show it, and hand over to typing.
  const askToType = () => {
    const msg = fallbackText();
    thread.append(h('div.msg.ai.fallback', {}, h('p', {}, msg)));
    speak(msg);
    compose.classList.add('attention');
    ta.focus({ preventScroll: true });
    compose.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  async function send(text, { typed = false } = {}) {
    const files = board.board.isEmpty() ? [] : [board.board.toFile()];
    if (unclear(text) && !files.length) return askToType();
    compose.classList.remove('attention');
    thread.append(h('div.msg.me', {}, rich(text || '(bài viết trên bảng)')));
    const slot = h('div'); thread.append(slot);
    await run(typed ? bSend : mic, slot, async () => {
      const d = await ai('voice', { text, typed, history, files: files.map(({ mimeType, data }) => ({ mimeType, data })) });
      history.push({ role: 'user', text }, { role: 'ai', text: d.reply || '' });
      if (d.understood === false) { askToType(); return []; }
      speak(d.speech || d.reply);
      if (d.board) { board.open(); toast('Hãy viết đề bài hoặc lời giải lên bảng rồi bấm Gửi.'); }
      if (files.length) board.board.clear();
      return h('div.msg.ai', {}, rich(d.reply || ''), chart(d.viz), casio(d.casio));
    }, 'Gia sư đang nghĩ…');
  }

  let rec = null;
  mic.onclick = async () => {
    if (rec) return rec.stop();
    stopSpeaking();
    mic.setAttribute('aria-pressed', 'true'); micLabel.textContent = 'Đang nghe… bấm lần nữa để dừng';
    try {
      rec = listen({ onInterim: (t) => { live.textContent = t; } });
      const text = await rec;
      live.textContent = '';
      await send(text);
    } catch {
      live.textContent = '';
      askToType();
    } finally {
      rec = null; mic.setAttribute('aria-pressed', 'false'); micLabel.textContent = 'Bấm để nói';
    }
  };
  bSend.onclick = () => {
    const text = ta.value.trim();
    if (!text && board.board.isEmpty()) return toast('Hãy nhập nội dung hoặc viết trên bảng.');
    ta.value = ''; ta.dispatchEvent(new Event('input'));
    send(text, { typed: true });
  };

  root.append(
    h('section.panel.voice-stage', {}, mic, micLabel, live),
    h('div', { style: 'max-width:900px;margin-top:20px' }, thread, compose));
}
