// Formula Q&A: say a formula in words and get it back written out in full and read aloud; or give a Word file,
// PDF or photo and hear every formula in it read in full. Real-time voice (Gemini Live) when available; otherwise
// a text model writes the formulas and their reading, and the reading is played with the TTS voice.
import { h, icon, rich, run, toast } from '../ui.js';
import { ai } from '../api.js';
import { mathField } from '../mathinput.js';
import { uploader } from '../uploader.js';
import { speak, stopSpeaking } from '../voice.js';
import { getLang } from '../i18n.js';
import { liveSession, canLive } from '../live.js';
import { liveThread } from '../livethread.js';

export const meta = { title: 'Hỏi đáp công thức', lede: 'Đọc một công thức bằng lời, gia sư viết nó ra đầy đủ và đọc lại rõ từng kí hiệu.\nHoặc gửi file Word, PDF, ảnh có công thức để nghe đọc đầy đủ mọi công thức trong đó.' };

const LABEL = {
  idle: canLive() ? 'Bấm Nói công thức rồi đọc công thức bằng lời, hoặc gõ / gửi tệp bên dưới.' : 'Gõ công thức hoặc gửi tệp bên dưới; bấm Nói ở ô nhập để đọc bằng giọng.',
  connecting: 'Đang kết nối với gia sư…', listening: 'Gia sư đang nghe công thức của bạn…', thinking: 'Gia sư đang viết công thức…', speaking: 'Gia sư đang đọc công thức…',
  fallback: 'Giọng nói trực tiếp đang bận nên đã chuyển sang chế độ thường: bấm Nói ở ô nhập, hoặc gõ / gửi tệp.',
};
const MAX_TEXT = 6000; // longer files are read up to here

/** Read a long text aloud in pieces the TTS accepts, one after another. */
function speakAll(text, { onStart, onEnd } = {}) {
  const parts = [];
  for (const s of String(text).match(/[^.!?;\n]+[.!?;]*\s*/g) || []) {
    if (parts.length && (parts.at(-1) + s).length < 900) parts[parts.length - 1] += s; else parts.push(s);
  }
  let i = 0, started = false;
  const next = () => {
    if (i >= parts.length) { onEnd?.(); return; }
    speak(parts[i++], { onStart: () => { if (!started) { started = true; onStart?.(); } }, onEnd: next });
  };
  next();
  return () => { i = parts.length; stopSpeaking(); };
}

export function render(root) {
  let live = null, stopReading = null;
  const thread = h('div.thread', { 'aria-live': 'polite' });
  const status = h('p.tutor-status', { role: 'status' }, LABEL.idle);
  const setState = (s) => { status.textContent = LABEL[s] || LABEL.idle; stage.dataset.state = s; };

  // Written formula for a spoken one, when the model did not put it on screen itself.
  const view = liveThread(thread, { onTurn: (t) => {
    if (t.math.length || !t.user || !t.bubble || t.fromFile) return;
    const box = h('div'); t.bubble.append(box);
    ai('mathNotes', { kind: 'spoken', text: t.text || t.user }).then((d) => (d.math ? box.replaceChildren(rich(d.math)) : box.remove())).catch(() => box.remove());
  } });

  const bLive = h('button.btn.btn-primary', { type: 'button', hidden: !canLive() }, icon('mic'), h('span', {}, 'Nói công thức'));
  const bStop = h('button.btn.btn-ghost', { type: 'button', onclick: () => { live?.interrupt(); stopReading?.(); stopReading = null; if (!live?.active) setState('idle'); } }, 'Dừng đọc');
  const setLive = (on) => { bLive.lastChild.textContent = on ? 'Kết thúc' : 'Nói công thức'; bLive.classList.toggle('btn-primary', !on); bLive.classList.toggle('btn-danger', on); };

  function startLive() {
    stopReading?.();
    live = liveSession({ mode: 'formula', on: (e, d) => {
      if (e === 'state') setState(d);
      else if (e === 'user') view.user(d);
      else if (e === 'ai') view.ai(d);
      else if (e === 'math') view.math(d);
      else if (e === 'turn' || e === 'interrupted') view.end();
      else if (e === 'switch') view.restart();
      else if (e === 'nomic') toast('Không dùng được micro. Bạn vẫn gõ hoặc gửi tệp được, gia sư đọc bằng giọng.');
      else if (e === 'end') { setLive(false); view.end(); live = null; setState('idle'); }
      else if (e === 'unavailable') fallBack();
    } });
    setLive(true);
    live.start().catch(() => fallBack());
  }
  /** Real-time voice gone: finish the pending request the ordinary way. */
  function fallBack() {
    const t = view.current, pending = t && !t.closed && !t.ai ? t : null;
    view.end();
    live?.stop(true); live = null;
    setLive(false);
    setState('idle'); status.textContent = LABEL.fallback;
    if (pending?.user) classic(pending.fromFile ? 'document' : 'spoken', pending.text || pending.user, false);
  }
  bLive.onclick = () => (live?.active ? live.stop() : startLive());
  addEventListener('hashchange', () => { if (!location.hash.startsWith('#cong-thuc')) { live?.stop(); stopReading?.(); } });

  /** Without real-time voice: the text model writes the formulas and their reading; the TTS reads it. */
  function classic(kind, text, show = true, label = text) {
    if (show) thread.append(h('div.msg.me', {}, rich(label)));
    const slot = h('div'); thread.append(slot);
    setState('thinking');
    run(bRead, slot, async () => {
      const d = await ai('mathNotes', { kind, text: text.slice(0, MAX_TEXT) });
      const msg = h('div.msg.ai', {}, d.math ? rich(d.math) : null, d.speech ? h('p.muted', {}, d.speech) : null);
      if (d.speech) stopReading = speakAll(d.speech, { onStart: () => setState('speaking'), onEnd: () => { stopReading = null; setState('idle'); } });
      else setState('idle');
      return msg;
    }, 'Đang viết công thức…').then(() => { if (slot.querySelector('.error')) setState('idle'); });
  }

  /** Send text to be read: into the live conversation when it is on, else the ordinary way. */
  function read(kind, text, label) {
    stopReading?.(); stopReading = null;
    if (live?.active) {
      const ask = kind === 'document'
        ? `${getLang() === 'en' ? 'Read aloud, fully and in order, every formula in this text, and show each one on screen:' : 'Đọc to đầy đủ, theo thứ tự, mọi công thức trong văn bản sau và hiện từng công thức lên màn hình:'}\n${text.slice(0, MAX_TEXT)}`
        : `${getLang() === 'en' ? 'Write out and read aloud in full this formula:' : 'Viết ra và đọc to đầy đủ công thức sau:'} ${text}`;
      view.typed(ask, label);
      Object.assign(view.current, { fromFile: kind === 'document', text });
      live.sendText(ask);
    } else classic(kind, text, true, label);
  }

  // Typed (or dictated) formula
  const field = mathField({ label: 'Gõ, dán hoặc đọc (nút Nói) một công thức', name: 'formula', rows: 3, placeholder: 'Ví dụ: P của A hợp B bằng P A cộng P B trừ P A giao B' });
  const ta = field.querySelector('textarea');
  const bRead = h('button.btn.btn-primary', { type: 'button' }, 'Đọc công thức');
  const sendTyped = (text) => {
    if (!text.trim()) return toast('Hãy nhập hoặc đọc một công thức.');
    ta.value = ''; ta.dispatchEvent(new Event('input'));
    read('spoken', text.trim(), text.trim());
  };
  bRead.onclick = () => sendTyped(ta.value);
  ta.addEventListener('dictation', (e) => {
    const { phase, text } = e.detail;
    if (phase === 'start') { stopReading?.(); setState('listening'); }
    if (phase === 'fail') { e.preventDefault(); setState('idle'); toast('Chưa nghe rõ. Hãy đọc lại hoặc gõ công thức.'); }
    if (phase === 'done') sendTyped(text);
  });

  // Files: Word is read here; photos and PDFs are turned into text (with LaTeX) by OCR first.
  const up = uploader({ compact: true, title: 'Gửi tệp có công thức: Word, PDF, ảnh', label: 'Tải file Word, PDF hoặc ảnh có công thức', hint: 'Tối đa 3 tệp, mỗi tệp ≤ 10 MB. Gia sư đọc đầy đủ mọi công thức trong tệp.' });
  const bFile = h('button.btn.btn-primary', { type: 'button' }, 'Đọc công thức trong tệp');
  const fileOut = h('div');
  bFile.onclick = () => {
    const files = up.files(), docs = up.docs();
    if (!files.length && !docs.length) return toast('Hãy chọn tệp trước.');
    run(bFile, fileOut, async () => {
      const texts = docs.map((d) => d.text);
      for (const f of files) texts.push(String((await ai('ocr', { files: [f] })).text || ''));
      const text = texts.filter((t) => t.trim()).join('\n\n');
      if (!text.trim()) throw new Error('Không thấy chữ hay công thức nào trong tệp.');
      thread.append(h('div.msg.me', {}, h('p', {}, h('strong', {}, 'Văn bản đọc được từ tệp:')), rich(text.slice(0, MAX_TEXT))));
      read('document', text, 'Đọc đầy đủ các công thức trong tệp');
      return [];
    }, 'Đang đọc tệp…');
  };

  const stage = h('section.panel.voice-stage.formula-stage', {}, status, h('div.btn-row', { style: 'justify-content:center' }, bLive, bStop));
  root.append(stage,
    h('div', { style: 'max-width:900px;margin-top:20px' }, thread,
      h('section.panel.compose-box', { 'aria-label': 'Công thức' }, field, h('div.btn-row', { style: 'margin-top:10px' }, bRead)),
      h('section.panel.compose-box.stack', { 'aria-label': 'Tệp có công thức' }, up.el, h('div.btn-row', {}, bFile), fileOut)));
}
