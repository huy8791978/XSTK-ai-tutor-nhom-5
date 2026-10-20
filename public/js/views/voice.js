// Voice Q&A: talk with the tutor about XSTK. The "Nói" button on the text box below is the microphone; the
// tutor character above shows what is happening: listening, thinking, speaking. Math that is hard to say goes
// on the handwriting board. Missing/unclear speech → the tutor says so (aloud and on screen) and asks to type.
import { h, icon, rich, run, toast, casio } from '../ui.js';
import { ai } from '../api.js';
import { mathField } from '../mathinput.js';
import { boardToggle } from '../board.js';
import { chart } from '../viz.js';
import { speak, stopSpeaking, unclear, canListen, fallbackText, voices, currentVoice, setVoice, voiceGender, onVoices } from '../voice.js';
import { teacher } from '../teacher.js';


export const meta = { title: 'Hỏi đáp giọng nói', lede: 'Bấm nút Nói ở ô bên dưới và hỏi bằng giọng nói về Xác suất Thống kê.\nBài toán nhiều công thức thì viết lên bảng (iPad). Gia sư trả lời bằng chữ và đọc thành tiếng.' };

const LABEL = {
  idle: canListen() ? 'Bấm Nói ở ô bên dưới để hỏi bằng giọng nói' : 'Trình duyệt này không nhận giọng nói. Hãy gõ câu hỏi ở ô bên dưới.',
  listening: 'Đang nghe bạn nói…',
  thinking: 'Gia sư đang suy nghĩ…',
  speaking: 'Gia sư đang trả lời…',
};

export function render(root) {
  const history = [];
  let lastSpeech = '';
  const thread = h('div.thread', { 'aria-live': 'polite' });
  const face = teacher(voiceGender(currentVoice()?.name));
  // Voice picker: the teacher is a man for a male voice and a woman for a female one.
  const voiceSel = h('select', { id: 'voice-pick', 'aria-label': 'Giọng đọc' });
  const voiceBox = h('label.voice-select', { for: 'voice-pick', hidden: true }, 'Giọng đọc', voiceSel);
  onVoices(() => {
    const list = voices(), cur = currentVoice();
    voiceBox.hidden = list.length < 2;
    const short = (n) => n.replace(/^(Microsoft|Google)\s+/, '').replace(/\s*[-–(].*$/, '');
    voiceSel.replaceChildren(...list.map((v) => h('option', { value: v.name, selected: v.name === cur?.name }, `${short(v.name)} · ${voiceGender(v.name) === 'male' ? 'giọng nam' : 'giọng nữ'}`)));
    face.dataset.gender = voiceGender(cur?.name);
  });
  voiceSel.onchange = () => { setVoice(voiceSel.value); face.dataset.gender = voiceGender(voiceSel.value); if (lastSpeech) say(lastSpeech); };
  const status = h('p.tutor-status', { role: 'status' }, LABEL.idle);
  const setState = (s) => { face.dataset.state = s; status.textContent = LABEL[s]; bReplay.disabled = !lastSpeech || s === 'speaking'; };
  const say = (text) => {
    lastSpeech = text;
    speak(text, { onStart: () => setState('speaking'), onEnd: () => setState('idle') });
    if (!('speechSynthesis' in window)) setState('idle');
  };
  const bReplay = h('button.btn.btn-ghost', { type: 'button', disabled: true, onclick: () => lastSpeech && say(lastSpeech) }, icon('speaker'), 'Nghe lại');
  const bMute = h('button.btn.btn-ghost', { type: 'button', onclick: () => { stopSpeaking(); setState('idle'); } }, 'Dừng đọc');

  const field = mathField({ label: 'Hỏi bằng giọng nói (nút Nói) hoặc nhập đề bài, đáp án, câu trả lời', name: 'voice', rows: 3, placeholder: 'Gõ câu hỏi, đề bài hoặc câu trả lời…' });
  const ta = field.querySelector('textarea');
  const board = boardToggle('Trình bày trên bảng (iPad)');
  const bSend = h('button.btn.btn-primary', { type: 'button' }, 'Gửi');
  const compose = h('section.panel.compose-box', { 'aria-label': 'Hỏi gia sư' }, field, h('div.btn-row', { style: 'margin-top:10px' }, bSend, board.btn), board.wrap);

  // Didn't hear / didn't understand: say it, show it, and hand over to typing.
  const askToType = () => {
    const msg = fallbackText();
    // Don't stack the same reminder twice in a row.
    if (!thread.lastElementChild?.matches('.fallback')) thread.append(h('div.msg.ai.fallback', {}, h('p', {}, msg)));
    say(msg);
    compose.classList.add('attention');
    ta.focus({ preventScroll: true });
    compose.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  async function send(text, { typed = false } = {}) {
    const files = board.board.isEmpty() ? [] : [board.board.toFile()];
    if (unclear(text) && !files.length) return askToType();
    compose.classList.remove('attention');
    stopSpeaking();
    thread.append(h('div.msg.me', {}, rich(text || '(bài viết trên bảng)')));
    const slot = h('div'); thread.append(slot);
    setState('thinking');
    let reply = '';
    await run(bSend, slot, async () => {
      const d = await ai('voice', { text, typed, history, files: files.map(({ mimeType, data }) => ({ mimeType, data })) });
      history.push({ role: 'user', text }, { role: 'ai', text: d.reply || '' });
      if (d.understood === false) return [];
      reply = d.speech || d.reply || '';
      if (d.board) { board.open(); toast('Hãy viết đề bài hoặc lời giải lên bảng rồi bấm Gửi.'); }
      if (files.length) board.board.clear();
      return h('div.msg.ai', {}, rich(d.reply || ''), chart(d.viz), casio(d.casio));
    }, 'Gia sư đang nghĩ…');
    if (!slot.childElementCount) slot.remove(); // AI did not understand: no empty bubble
    if (reply) say(reply);
    else if (slot.querySelector('.error')) setState('idle');
    else askToType(); // understood === false
  }

  // The field's "Nói" button is the microphone: dictated text is sent right away.
  ta.addEventListener('dictation', (e) => {
    const { phase, text } = e.detail;
    if (phase === 'start') { stopSpeaking(); setState('listening'); }
    if (phase === 'fail') { e.preventDefault(); setState('idle'); askToType(); }
    if (phase === 'done') { ta.value = ''; ta.dispatchEvent(new Event('input')); send(text); }
  });
  bSend.onclick = () => {
    const text = ta.value.trim();
    if (!text && board.board.isEmpty()) return toast('Hãy nhập nội dung hoặc viết trên bảng.');
    ta.value = ''; ta.dispatchEvent(new Event('input'));
    send(text, { typed: true });
  };

  root.append(
    h('section.panel.voice-stage', {}, face, status, h('div.btn-row', { style: 'justify-content:center;align-items:center' }, bReplay, bMute, voiceBox)),
    h('div', { style: 'max-width:900px;margin-top:20px' }, thread, compose));
}
