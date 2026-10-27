// Drop zone + file chips shared by every page that takes files (Chấm bài, bài mẫu and bài làm of Tự luận/Trắc nghiệm).
// Each file gets a "Đọc to" button that reads its whole text with the browser's own voice (no AI voice, no quota).
// Word files are read in the browser; images/PDFs are first turned into text by Gemini OCR (once, then cached).
import { h, icon, toast, rich } from './ui.js';
import { readFiles } from './files.js';
import { readAloud, stopSpeaking } from './voice.js';
import { ai } from './api.js';

export const ACCEPT = 'image/*,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** A "Đọc to / Dừng đọc" toggle. getText returns the text, or a Promise of it (OCR). */
export function readButton(getText, label = 'Đọc to') {
  const b = h('button.btn.btn-ghost.btn-sm', { type: 'button', 'aria-pressed': 'false' }, icon('speaker'), h('span', {}, label));
  const say = (s) => { b.lastChild.textContent = s; };
  const reset = () => { b.setAttribute('aria-pressed', 'false'); b.disabled = false; say(label); };
  b.onclick = async () => {
    if (b.getAttribute('aria-pressed') === 'true') { stopSpeaking(); reset(); return; }
    document.querySelectorAll('button[aria-pressed="true"][data-read]').forEach((o) => o.click()); // one reader at a time
    if (!('speechSynthesis' in window)) return toast('Trình duyệt này không có giọng đọc.');
    // iOS only lets a page speak inside a tap: start (silently) now, so speaking after the OCR wait is allowed.
    speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    let text = getText();
    if (text instanceof Promise) {
      b.disabled = true; say('Đang đọc tệp…');
      try { text = await text; } catch (e) { reset(); return toast(e.message || 'Không đọc được tệp.'); }
      b.disabled = false;
    }
    if (!readAloud(text, { onEnd: reset })) { reset(); return toast('Tệp không có chữ để đọc.'); }
    b.setAttribute('aria-pressed', 'true'); say('Dừng đọc');
  };
  b.dataset.read = '';
  return b;
}

/** Text of one uploaded file: Word text as read, image/PDF text from Gemini OCR (cached on the item). */
function fileText(f, chip) {
  if (f.text != null) return f.text;
  if (f.ocr != null) return f.ocr;
  return ai('ocr', { files: [{ mimeType: f.mimeType, data: f.data }] }).then((d) => {
    f.ocr = String(d.text || '').trim();
    if (!f.ocr) throw new Error(`Không thấy chữ trong "${f.name}".`);
    chip.append(preview(f.ocr));
    return f.ocr;
  });
}
const preview = (text) => h('details.doc-text', {}, h('summary', {}, 'Xem chữ đã đọc từ tệp'), rich(text));

// Paste (Ctrl+V / ⌘V, or Paste on a phone) puts a copied image or file into an uploader without saving it first.
// It goes to the uploader of the part of the page the student is working in: each uploader has a `scope` (the
// panel around it, e.g. the problem form or the step-3 pane). The scope holding the focus wins, then the one the
// student last clicked in; else, among the uploaders on screen, the one with the highest `pastePriority` (on the
// tutor page the work uploader of step 3 beats the problem uploader once step 3 is open).
const live = new Set();
let lastTarget = null;
const pastedFiles = (e) => {
  const d = e.clipboardData;
  if (!d) return [];
  const files = [...(d.files || [])];
  if (files.length) return files;
  return [...(d.items || [])].filter((i) => i.kind === 'file').map((i) => i.getAsFile()).filter(Boolean);
};
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', (e) => { lastTarget = e.target; }, { capture: true, passive: true });
  document.addEventListener('paste', (e) => {
    const files = pastedFiles(e);
    if (!files.length) return; // plain text: let the field have it
    const open = [...live].filter((u) => u.el.isConnected && u.el.offsetParent !== null);
    const inside = (node) => node && open.find((u) => u.scope().contains(node));
    const target = inside(document.activeElement !== document.body ? document.activeElement : null) || inside(lastTarget)
      || open.reduce((best, u) => (!best || u.priority > best.priority ? u : best), null);
    if (!target) return;
    e.preventDefault();
    const stamp = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
    // Clipboard images are all called "image.png": give each its own name so the chips can be told apart.
    target.add(files.map((f, k) => (/^image\.\w+$/i.test(f.name) || !f.name ? new File([f], `anh-dan-${stamp}${k ? `-${k + 1}` : ''}.${(f.type.split('/')[1] || 'png').replace('jpeg', 'jpg')}`, { type: f.type }) : f))
    ).then((ok) => { if (ok) toast('Đã dán tệp từ bộ nhớ tạm.'); });
  });
}

/**
 * @returns {{ el: HTMLElement, files: () => {mimeType,data}[], docs: () => {name,text}[], count: () => number, clear: () => void }}
 */
export function uploader({ title = 'Chọn ảnh, PDF hoặc Word', hint = 'Tối đa 3 tệp, mỗi tệp ≤ 10 MB. Chụp thẳng, đủ sáng để AI đọc chính xác.', label = 'Chọn ảnh, PDF hoặc Word', compact = false, scope = null, pastePriority = 0 } = {}) {
  let items = [];
  const input = h('input', { type: 'file', accept: ACCEPT, multiple: true, 'aria-label': label });
  const drop = h(compact ? 'label.drop.drop-compact' : 'label.drop', {}, icon('upload'), h('span', {}, h('strong', {}, title), ' hoặc kéo thả vào đây'), h('small.muted', {}, hint), h('small.muted', {}, 'Có ảnh đã sao chép? Bấm vào trang rồi dán (Ctrl+V).'), input);
  const chips = h('div.files');
  const chip = (f, i) => {
    const el = h('div.file.file-doc', {},
      f.url ? h('img', { src: f.url, alt: f.name }) : h('div.doc', {}, icon('file')),
      h('span', { title: f.name }, f.name));
    el.append(readButton(() => fileText(f, el)),
      h('button', { type: 'button', 'aria-label': `Bỏ ${f.name}`, onclick: () => { stopSpeaking(); items.splice(i, 1); paint(); } }, icon('x')));
    const known = f.text ?? f.ocr;
    if (known) el.append(preview(known));
    return el;
  };
  const paint = () => chips.replaceChildren(...items.map(chip));
  async function add(list) {
    try {
      const next = await readFiles([...list]);
      items = [...items, ...next].slice(0, 3);
      if (items.length === 3 && next.length) toast('Đã đủ 3 tệp.');
      paint();
      return true;
    } catch (e) { toast(e.message); return false; } finally { input.value = ''; }
  }
  input.addEventListener('change', () => add(input.files));
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); add(e.dataTransfer.files); });
  const el = h('div', {}, drop, chips);
  const me = { el, add, priority: pastePriority, scope: () => (typeof scope === 'function' ? scope() : scope) || el };
  live.add(me);
  return {
    el,
    files: () => items.filter((f) => f.data).map(({ mimeType, data }) => ({ mimeType, data })),
    docs: () => items.filter((f) => f.text != null).map(({ name, text }) => ({ name, text })),
    count: () => items.length,
    clear: () => { items = []; paint(); },
  };
}
