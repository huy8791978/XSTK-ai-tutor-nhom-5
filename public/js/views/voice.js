// Voice Q&A: talk with the tutor about XSTK. «Bắt đầu trò chuyện» opens a real-time conversation (Gemini Live):
// just speak, the tutor answers aloud at once and its words appear as it speaks; formulas, CASIO keys and charts
// are written underneath. When real-time voice is unavailable the page carries on with the ordinary mode: the
// "Nói" button on the text box below dictates a question, answered in text and read aloud.
import { h, icon, rich, run, toast, casio, loading } from '../ui.js';
import { ai } from '../api.js';
import { mathField } from '../mathinput.js';
import { boardToggle } from '../board.js';
import { chart } from '../viz.js';
import { speak, stopSpeaking, unclear, canListen, fallbackText, getGender, setGender, matchPronoun } from '../voice.js';
import { getLang } from '../i18n.js';
import { teacher } from '../teacher.js';
import { liveSession, canLive } from '../live.js';
import { liveThread } from '../livethread.js';

export const meta = { title: 'Hỏi đáp giọng nói', lede: 'Bấm Bắt đầu trò chuyện rồi cứ nói tự nhiên: gia sư trả lời bằng giọng ngay, lời nói hiện thành chữ, công thức hiện ngay bên dưới.\nBài toán nhiều công thức thì viết lên bảng (iPad), hoặc gõ ở ô bên dưới.' };

const LABEL = {
  idle: canListen() ? 'Bấm Nói ở ô bên dưới để hỏi bằng giọng nói' : 'Trình duyệt này không nhận giọng nói. Hãy gõ câu hỏi ở ô bên dưới.',
  listening: 'Đang nghe bạn nói…',
  thinking: 'Gia sư đang suy nghĩ…',
  speaking: 'Gia sư đang trả lời…',
  connecting: 'Đang kết nối với gia sư…',
  live: 'Gia sư đang nghe. Bạn cứ nói tự nhiên, hoặc gõ ở ô bên dưới.',
  liveIdle: 'Bấm Bắt đầu trò chuyện để nói chuyện trực tiếp với gia sư.',
  fallback: 'Trò chuyện trực tiếp đang bận nên đã chuyển sang hỏi đáp thường: bấm Nói ở ô bên dưới.',
};

/** Formulas, CASIO keys and a chart written under a spoken answer, when it is about numbers or formulas. */
export function notesFor(t, { force = false } = {}) {
  if (!t.bubble || !(force || t.math.length || /\d/.test(t.user + t.ai))) return;
  const box = h('div');
  t.bubble.append(box);
  ai('mathNotes', { kind: 'turn', question: t.user, reply: t.ai })
    .then((d) => box.replaceChildren(...[t.math.length ? null : (d.math ? rich(d.math) : null), casio(d.casio), chart(d.viz)].filter(Boolean)))
    .catch(() => box.remove()); // extras only: the spoken answer is already there
}

export function render(root) {
  const history = [];
  let lastSpeech = '', live = null;
  const thread = h('div.thread', { 'aria-live': 'polite' });
  // Nam / Nữ toggle: switches both the reading voice and the teacher on screen.
  const face = teacher(getGender());
  const genderBtns = ['female', 'male'].map((g) => h('button', { type: 'button', 'data-g': g, 'aria-pressed': String(getGender() === g) }, g === 'male' ? 'Giọng nam' : 'Giọng nữ'));
  const genderToggle = h('div.gender-toggle', { role: 'group', 'aria-label': 'Chọn giọng đọc' }, genderBtns);
  genderToggle.addEventListener('click', (e) => {
    const g = e.target.closest('button')?.dataset.g;
    if (!g || g === getGender()) return;
    setGender(g); face.dataset.gender = g;
    genderBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.g === g)));
    if (live?.active) { live.configure({ gender: g }); return; } // the conversation goes on in the new voice
    // Switching is silent; only a sentence being read right now continues in the new voice.
    if (face.dataset.state === 'speaking' && lastSpeech) say(lastSpeech);
  });
  const status = h('p.tutor-status', { role: 'status' }, canLive() ? LABEL.liveIdle : LABEL.idle);
  const setState = (s) => {
    face.dataset.state = s === 'connecting' ? 'thinking' : s;
    status.textContent = live?.active ? (s === 'listening' ? LABEL.live : LABEL[s] || LABEL.live) : LABEL[s];
    bReplay.disabled = !lastSpeech || s === 'speaking';
  };
  /** Read text aloud; onShow runs once when the voice starts (or when it ends/fails without starting). */
  const say = (text, onShow) => {
    lastSpeech = text;
    let shown = false;
    const show = () => { if (!shown) { shown = true; onShow?.(); } };
    // Speak with the pronoun of the teacher now on screen, even for a reply written under the other voice.
    speak(getLang() === 'en' ? text : matchPronoun(text, getGender()), { onStart: () => { show(); setState('speaking'); }, onEnd: () => { show(); setState('idle'); } });
    setTimeout(show, 12000); // never keep the answer hidden for long
    if (!('speechSynthesis' in window) && !('Audio' in window)) { show(); setState('idle'); }
  };
  const bReplay = h('button.btn.btn-ghost', { type: 'button', disabled: true, onclick: () => lastSpeech && say(lastSpeech) }, icon('speaker'), 'Nghe lại');
  // Stopping while the voice is still being prepared must not leave the answer hidden.
  const revealAll = () => { thread.querySelectorAll('.loading').forEach((l) => l.remove()); thread.querySelectorAll('.msg.ai[hidden]').forEach((m) => { m.hidden = false; }); };
  const bMute = h('button.btn.btn-ghost', { type: 'button', onclick: () => {
    if (live?.active) { live.interrupt(); return; }
    stopSpeaking(); revealAll(); setState('idle');
  } }, 'Dừng đọc');

  const field = mathField({ label: 'Hỏi bằng giọng nói hoặc nhập đề bài, đáp án, câu trả lời', name: 'voice', rows: 3, placeholder: 'Gõ câu hỏi, đề bài hoặc câu trả lời…' });
  const ta = field.querySelector('textarea');
  const dictate = field.querySelector('.field-head .btn[aria-pressed]'); // the "Nói" dictation button
  const board = boardToggle('Trình bày trên bảng (iPad)');
  const bSend = h('button.btn.btn-primary', { type: 'button' }, 'Gửi');
  const compose = h('section.panel.compose-box', { 'aria-label': 'Hỏi gia sư' }, field, h('div.btn-row', { style: 'margin-top:10px' }, bSend, board.btn), board.wrap);

  // ---- Real-time conversation
  const view = liveThread(thread, { onTurn: (t) => { history.push({ role: 'user', text: t.user }, { role: 'ai', text: t.ai }); notesFor(t); } });
  const bLive = h('button.btn.btn-primary', { type: 'button', hidden: !canLive() }, icon('mic'), h('span', {}, 'Bắt đầu trò chuyện'));
  const setLive = (on) => {
    bLive.lastChild.textContent = on ? 'Kết thúc trò chuyện' : 'Bắt đầu trò chuyện';
    bLive.classList.toggle('btn-primary', !on); bLive.classList.toggle('btn-danger', on);
    if (dictate) dictate.hidden = on;
    bMute.textContent = on ? 'Ngắt lời' : 'Dừng đọc';
  };
  function startLive() {
    stopSpeaking();
    live = liveSession({ mode: 'voice', on: (e, d) => {
      if (e === 'state') setState(d === 'idle' ? 'idle' : d);
      else if (e === 'user') view.user(d);
      else if (e === 'ai') view.ai(d);
      else if (e === 'math') view.math(d);
      else if (e === 'turn' || e === 'interrupted') view.end();
      else if (e === 'switch') view.restart();
      else if (e === 'nomic') toast('Không dùng được micro. Bạn vẫn gõ câu hỏi được, gia sư trả lời bằng giọng.');
      else if (e === 'end') { setLive(false); view.end(); live = null; setState('idle'); status.textContent = LABEL.liveIdle; }
      else if (e === 'unavailable') fallBack();
    } });
    setLive(true);
    live.start().catch(() => fallBack());
  }
  /** No real-time voice now: carry on with the ordinary mode, and answer the question that was left hanging. */
  function fallBack() {
    const t = view.current, pending = t && !t.closed && t.user && !t.ai ? t.user : '';
    view.end();
    live?.stop(true);
    live = null;
    setLive(false);
    setState('idle');
    status.textContent = LABEL.fallback;
    if (pending) send(pending, { typed: true, shown: false });
  }
  bLive.onclick = () => (live?.active ? live.stop() : startLive());
  addEventListener('langchange', () => live?.active && live.configure({ lang: getLang() }));
  addEventListener('hashchange', () => { if (!location.hash.startsWith('#giong-noi')) live?.stop(); });

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

  async function send(text, { typed = false, shown = true } = {}) {
    const files = board.board.isEmpty() ? [] : [board.board.toFile()];
    if (unclear(text) && !files.length) return askToType();
    compose.classList.remove('attention');
    stopSpeaking();
    if (shown) thread.append(h('div.msg.me', {}, rich(text || '(bài viết trên bảng)')));
    const slot = h('div'); thread.append(slot);
    setState('thinking');
    let reply = '';
    await run(bSend, slot, async () => {
      const d = await ai('voice', { text, typed, history, gender: getGender(), files: files.map(({ mimeType, data }) => ({ mimeType, data })) });
      history.push({ role: 'user', text }, { role: 'ai', text: d.reply || '' });
      if (d.understood === false) return [];
      reply = d.speech || d.reply || '';
      if (d.board) { board.open(); toast('Hãy viết đề bài hoặc lời giải lên bảng rồi bấm Gửi.'); }
      if (files.length) board.board.clear();
      // The answer stays hidden, with the tutor still thinking, until the voice starts: text and voice arrive together.
      return [loading('Gia sư đang chuẩn bị giọng đọc…'), h('div.msg.ai', { hidden: true }, rich(d.reply || ''), chart(d.viz), casio(d.casio))];
    }, 'Gia sư đang nghĩ…');
    if (!slot.childElementCount) slot.remove(); // AI did not understand: no empty bubble
    if (reply) {
      setState('thinking');
      say(reply, () => { slot.querySelector('.loading')?.remove(); const m = slot.querySelector('.msg.ai'); if (m) m.hidden = false; });
    }
    else if (slot.querySelector('.error')) setState('idle');
    else askToType(); // understood === false
  }

  /** Typed text or the board, into the real-time conversation. */
  function sendLive(text) {
    const img = board.board.isEmpty() ? null : board.board.toFile();
    if (img) { live.sendImage(img.mimeType, img.data); board.board.clear(); }
    const say = text || (getLang() === 'en' ? 'I just wrote on the board, please look at it.' : 'Em vừa viết lên bảng, nhờ gia sư xem giúp.');
    view.typed(say, text || '(bài viết trên bảng)');
    live.sendText(say);
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
    if (live?.active) sendLive(text);
    else send(text, { typed: true });
  };

  root.append(
    h('section.panel.voice-stage', {}, genderToggle, face, status, h('div.btn-row', { style: 'justify-content:center' }, bLive, bReplay, bMute)),
    h('div', { style: 'max-width:900px;margin-top:20px' }, thread, compose));
}
