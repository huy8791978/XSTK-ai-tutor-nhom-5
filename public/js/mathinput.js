// Text field + visual formula editor (MathLive): press a template (fraction, P(A|B), Cₙᵏ…), then just type the values into its boxes.
import { md, typeset } from './md.js';
import { h, icon, toast } from './ui.js';
import { listen, fallbackText } from './voice.js';

const ML = 'https://cdn.jsdelivr.net/npm/mathlive@0.109.2';

/** XSTK keyboard page: every key is a template whose ■ boxes the student fills in. */
const XSTK_LAYOUT = {
  label: 'XSTK', tooltip: 'Kí hiệu Xác suất Thống kê',
  rows: [
    [{ latex: 'P(#?)' }, { latex: 'P(#?\\mid #?)' }, { latex: 'E(#?)' }, { latex: 'D(#?)' }, { latex: '\\mathrm{C}_{#?}^{#?}' }, { latex: '\\mathrm{A}_{#?}^{#?}' }, { latex: '#@!' }, { latex: '\\Phi(#?)' }],
    ['\\cap', '\\cup', { latex: '\\overline{#@}' }, '\\varnothing', '\\Omega', '\\in', '\\subset', '\\mid'],
    [{ latex: '\\bar{#@}' }, { latex: '\\hat{#@}' }, '\\mu', '\\sigma', { latex: '\\sigma^2' }, '\\lambda', '\\alpha', { latex: '\\chi^2' }],
    [{ latex: '\\frac{#@}{#?}' }, { latex: '#@^{#?}' }, { latex: '#@_{#?}' }, { latex: '\\sqrt{#@}' }, { latex: '\\sum_{#?}^{#?}' }, { latex: '\\int_{#?}^{#?}' }, '\\le', '\\ge'],
    ['\\ne', '\\approx', '\\infty', '\\pm', '\\times', '\\cdot', { latex: '\\left(#?\\right)' }, '[backspace]'],
  ],
};

let ready;
/** Load MathLive once, on first use (keeps the first page load light). */
function loadMathLive() {
  return (ready ??= import(`${ML}/+esm`).then(({ MathfieldElement }) => {
    MathfieldElement.fontsDirectory = `${ML}/fonts/`;
    MathfieldElement.soundsDirectory = null;
    const kb = window.mathVirtualKeyboard;
    kb.layouts = [XSTK_LAYOUT, 'numeric', 'symbols', 'greek', 'alphabetic'];
    // Keep page content reachable above the on-screen keyboard.
    kb.addEventListener('geometrychange', () => { document.body.style.paddingBottom = kb.visible ? `${kb.boundingRect.height}px` : ''; });
    return MathfieldElement;
  }).catch((e) => { ready = null; throw e; }));
}

/**
 * Insert LaTeX at the selection, wrapped in $…$ unless the caret is already inside math.
 * Returns the new value and the caret position after the insert.
 */
export function insertLatex(value, start, end, latex) {
  const before = value.slice(0, start), after = value.slice(end);
  const inMath = ((before.match(/(?<!\\)\$/g) || []).length % 2) === 1;
  const body = inMath ? latex : `$${latex}$`;
  const pad = !inMath && before && !/\s$/.test(before) ? ' ' : '';
  return { value: before + pad + body + after, cursor: start + pad.length + body.length };
}

const hasMath = (s) => /\$|\\\(|\\\[/.test(s);

/** Build a labelled textarea with a "Nhập công thức" editor. The textarea is `.querySelector('textarea')`. */
export function mathField({ label, name, placeholder = '', rows = 4, value = '' }) {
  const id = `f-${name}-${Math.random().toString(36).slice(2, 7)}`;
  const ta = h('textarea', { id, name, rows, spellcheck: 'false', placeholder });
  ta.value = value;
  const pv = h('div.preview.rich', { 'aria-live': 'polite', hidden: true });
  const pad = h('div.mathpad', { hidden: true });
  const open = h('button.btn.btn-ghost.math-open', { type: 'button', 'aria-expanded': 'false' }, icon('sigma'), 'Nhập công thức');
  const mic = micButton(ta);
  let sel = [0, 0], mf;

  const close = () => { pad.hidden = true; open.setAttribute('aria-expanded', 'false'); window.mathVirtualKeyboard?.hide(); ta.focus(); };
  const insert = () => {
    const latex = mf.getValue('latex').trim();
    if (!latex) return toast('Công thức đang trống.');
    const r = insertLatex(ta.value, sel[0], sel[1], latex);
    ta.value = r.value; mf.value = '';
    close(); ta.setSelectionRange(r.cursor, r.cursor);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  };

  open.addEventListener('click', async () => {
    if (!pad.hidden) return close();
    sel = [ta.selectionStart, ta.selectionEnd];
    try {
      open.setAttribute('aria-busy', 'true');
      const MathfieldElement = await loadMathLive().finally(() => open.removeAttribute('aria-busy'));
      if (!mf) {
        mf = new MathfieldElement();
        mf.mathVirtualKeyboardPolicy = 'manual';
        mf.setAttribute('aria-label', 'Ô soạn công thức');
        mf.addEventListener('focusin', () => window.mathVirtualKeyboard.show());
        mf.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); insert(); } if (e.key === 'Escape') close(); });
        pad.append(
          h('p.mathpad-hint', {}, 'Bấm một mẫu trên bàn phím (phân số, P(A|B), tổ hợp…) rồi điền giá trị vào các ô. Có thể gõ trực tiếp: 1/2 thành phân số, ^ là mũ, _ là chỉ số.'),
          mf,
          h('div.btn-row', {}, h('button.btn.btn-primary', { type: 'button', onclick: insert }, 'Chèn vào bài'), h('button.btn.btn-ghost', { type: 'button', onclick: close }, 'Đóng')));
      }
      pad.hidden = false; open.setAttribute('aria-expanded', 'true');
      mf.focus(); window.mathVirtualKeyboard.show();
      setTimeout(() => { // keep the editor above the on-screen keyboard
        const over = pad.getBoundingClientRect().bottom - (innerHeight - window.mathVirtualKeyboard.boundingRect.height) + 16;
        if (over > 0) scrollBy({ top: over, behavior: 'smooth' });
      }, 300);
    } catch {
      toast('Không tải được bộ soạn công thức. Kiểm tra mạng, hoặc gõ công thức giữa hai dấu $…$.');
    }
  });

  let t;
  ta.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const show = hasMath(ta.value);
      pv.hidden = !show;
      if (show) { pv.innerHTML = md(ta.value); typeset(pv); }
    }, 180);
  });

  return h('div.field', {},
    h('div.field-head', {}, h('label.label', { for: id }, label), h('div.btn-row', {}, mic, open)),
    ta, pad, pv);
}

/** Dictation into a textarea: tap, speak, the words are appended. Unclear or unsupported → ask to type instead. */
export function micButton(ta) {
  const b = h('button.btn.btn-ghost.math-open', { type: 'button', 'aria-pressed': 'false' }, icon('mic'), 'Nói');
  let rec;
  b.onclick = async () => {
    if (rec) return rec.stop();
    b.setAttribute('aria-pressed', 'true');
    try {
      rec = listen();
      const text = await rec;
      if (!text) throw { code: 'no-speech' };
      ta.value = `${ta.value}${ta.value && !/\s$/.test(ta.value) ? ' ' : ''}${text}`;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    } catch {
      toast(fallbackText()); ta.focus();
    } finally {
      rec = null; b.setAttribute('aria-pressed', 'false');
    }
  };
  return b;
}
