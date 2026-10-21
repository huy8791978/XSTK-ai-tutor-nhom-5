// Drop zone + file chips shared by the tutor and the practice pages. Images/PDFs go to Gemini for OCR; Word files are
// read in the browser and get a "Đọc to" button that reads the text with the browser's own voice (no AI).
import { h, icon, toast, rich } from './ui.js';
import { readFiles } from './files.js';
import { readAloud, stopSpeaking } from './voice.js';

export const ACCEPT = 'image/*,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** A "Đọc to / Dừng đọc" toggle for a piece of text. */
export function readButton(getText, label = 'Đọc to') {
  const b = h('button.btn.btn-ghost.btn-sm', { type: 'button', 'aria-pressed': 'false' }, icon('speaker'), h('span', {}, label));
  const reset = () => { b.setAttribute('aria-pressed', 'false'); b.lastChild.textContent = label; };
  b.onclick = () => {
    if (b.getAttribute('aria-pressed') === 'true') { stopSpeaking(); reset(); return; }
    document.querySelectorAll('button[aria-pressed="true"][data-read]').forEach((o) => o.click()); // one reader at a time
    if (!readAloud(getText(), { onEnd: reset })) return toast('Trình duyệt này không có giọng đọc.');
    b.setAttribute('aria-pressed', 'true'); b.lastChild.textContent = 'Dừng đọc';
  };
  b.dataset.read = '';
  return b;
}

/**
 * @returns {{ el: HTMLElement, files: () => {mimeType,data}[], docs: () => {name,text}[], count: () => number, clear: () => void }}
 */
export function uploader({ title = 'Chọn ảnh, PDF hoặc Word', hint = 'Tối đa 3 tệp, mỗi tệp ≤ 10 MB. Chụp thẳng, đủ sáng để AI đọc chính xác.', label = 'Chọn ảnh, PDF hoặc Word', compact = false } = {}) {
  let items = [];
  const input = h('input', { type: 'file', accept: ACCEPT, multiple: true, 'aria-label': label });
  const drop = h(compact ? 'label.drop.drop-compact' : 'label.drop', {}, icon('upload'), h('span', {}, h('strong', {}, title), ' hoặc kéo thả vào đây'), h('small.muted', {}, hint), input);
  const chips = h('div.files');
  const paint = () => chips.replaceChildren(...items.map((f, i) => h(f.text != null ? 'div.file.file-doc' : 'div.file', {},
    f.url ? h('img', { src: f.url, alt: f.name }) : h('div.doc', {}, icon('file')),
    h('span', { title: f.name }, f.name),
    f.text != null ? readButton(() => f.text) : null,
    h('button', { type: 'button', 'aria-label': `Bỏ ${f.name}`, onclick: () => { stopSpeaking(); items.splice(i, 1); paint(); } }, icon('x')),
    f.text != null ? h('details.doc-text', {}, h('summary', {}, 'Xem chữ đã đọc từ tệp'), rich(f.text)) : null)));
  async function add(list) {
    try {
      const next = await readFiles([...list]);
      items = [...items, ...next].slice(0, 3);
      if (items.length === 3 && next.length) toast('Đã đủ 3 tệp.');
      paint();
    } catch (e) { toast(e.message); }
    input.value = '';
  }
  input.addEventListener('change', () => add(input.files));
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); add(e.dataTransfer.files); });
  return {
    el: h('div', {}, drop, chips),
    files: () => items.filter((f) => f.data).map(({ mimeType, data }) => ({ mimeType, data })),
    docs: () => items.filter((f) => f.text != null).map(({ name, text }) => ({ name, text })),
    count: () => items.length,
    clear: () => { items = []; paint(); },
  };
}
