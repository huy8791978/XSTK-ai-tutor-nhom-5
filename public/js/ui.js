// Small DOM + async helpers shared by every view.
import { md, typeset } from './md.js';
import { getLang } from './i18n.js';

/** h('div.class', {attrs}, ...children) */
export function h(sel, attrs = {}, ...kids) {
  const [tag, ...cls] = sel.split('.');
  const el = document.createElement(tag || 'div');
  if (cls.length) el.className = cls.join(' ');
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...nodes(kids));
  return el;
}

export const icon = (id) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.innerHTML = `<use href="#i-${id}"/>`; s.setAttribute('aria-hidden', 'true'); s.setAttribute('class', 'ic'); return s; };

/** Rich AI text block with markdown + KaTeX. */
export function rich(text, tag = 'div') {
  const el = h(`${tag}.rich`, { html: md(text) });
  // Remember the source text per language, so the EN/VI switch can translate it and switch back for free.
  el._tr = { [getLang()]: String(text ?? '') };
  queueMicrotask(() => typeset(el));
  return el;
}

/** Show a .rich block in another language (text already translated). */
export function rerich(el, text) { el.innerHTML = md(text); typeset(el); }
export const list = (items = [], ordered = false) => rich((items || []).map((x, i) => `${ordered ? `${i + 1}.` : '-'} ${x}`).join('\n'));

export function loading(text = 'AI đang suy nghĩ…') {
  const digits = '0123456789'.split('').map((d) => `${d}<br>`).join('') + '0';
  return h('div.loading', { role: 'status' },
    h('span.spin', { 'aria-hidden': 'true', html: `<i><span>${digits}</span></i><i><span>${digits}</span></i><i><span>${digits}</span></i>` }),
    h('span', {}, text));
}

export function errorBox(err) {
  return h('div.error', { role: 'alert' }, err?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
}

let toastTimer;
export function toast(msg) {
  const t = document.querySelector('.toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 4200);
}

/**
 * Run an AI call: disables the button, shows a loader in `out`, renders the result or error.
 * On 429 the button stays locked with a countdown until retryAfter.
 */
export async function run(btn, out, fn, loadingText) {
  const label = btn.textContent;
  btn.disabled = true; btn.setAttribute('aria-busy', 'true');
  out.replaceChildren(loading(loadingText));
  out.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  try {
    const node = await fn();
    out.replaceChildren(...nodes(node));
  } catch (e) {
    out.replaceChildren(errorBox(e));
    if (e.retryAfter) return countdown(btn, label, e.retryAfter);
  } finally {
    btn.removeAttribute('aria-busy');
  }
  btn.disabled = false;
}

function countdown(btn, label, secs) {
  const tick = () => {
    if (secs <= 0) { btn.textContent = label; btn.disabled = false; return; }
    btn.textContent = `Thử lại sau ${secs}s`; secs -= 1; setTimeout(tick, 1000);
  };
  tick();
}

/** Polya / learning-stage detent rail. states: array of 'done'|'current'|'todo'. */
export function detents(labels, states) {
  return h('ol.detents', { 'aria-label': 'Tiến trình' },
    labels.map((l, i) => h('li', { 'data-state': states[i] || 'todo', 'aria-current': states[i] === 'current' ? 'step' : null }, h('b', {}, String(i + 1)), l)));
}
export const POLYA = ['Tìm hiểu nội dung đề bài', 'Tìm cách giải', 'Trình bày lời giải', 'Nghiên cứu sâu lời giải'];
// What each of Polya's 4 steps asks of the student (the lecturer's wording), shown at the top of each step.
export const POLYA_GUIDE = [
  ['Phát biểu đề bài dưới những dạng thức khác nhau để hiểu rõ nội dung bài toán.',
    'Phân biệt cái đã cho và cái phải tìm, phải chứng minh.',
    'Có thể dùng công thức, kí hiệu, hình vẽ để hỗ trợ cho việc diễn tả đề bài.'],
  ['Tìm tòi, phát hiện cách giải nhờ những suy nghĩ có tính chất tìm đoán: biến đổi cái đã cho, biến đổi cái phải tìm hay phải chứng minh, liên hệ cái đã cho hoặc cái phải tìm với những tri thức đã biết, liên hệ bài toán cần giải với một bài toán cũ tương tự, một trường hợp riêng, một bài toán tổng quát hơn hay một bài toán nào đó có liên quan, sử dụng những phương pháp đặc thù với từng dạng toán như chứng minh phản chứng, quy nạp toán học, toán dựng hình, toán quỹ tích v.v.',
    'Kiểm tra lời giải bằng cách xem lại kĩ từng bước thực hiện hoặc đặc biệt hoá kết quả tìm được hoặc đối chiếu kết quả với một số tri thức có liên quan.',
    'Tìm tòi những cách giải khác, so sánh chúng để chọn được cách giải hợp lí nhất.'],
  ['Từ cách giải đã được phát hiện, sắp xếp các việc phải làm thành một chương trình gồm các bước theo một trình tự thích hợp và thực hiện các bước đó.'],
  ['Nghiên cứu khả năng ứng dụng kết quả của lời giải.',
    'Nghiên cứu giải những bài toán tương tự, mở rộng hay lật ngược lại vấn đề.'],
];
/** The step's guide as a box the student can fold away. */
export const polyaGuide = (k) => h('details.polya-guide', { open: true }, h('summary', {}, 'Bước này cần làm gì'), h('ul', {}, POLYA_GUIDE[k].map((t) => h('li', {}, t)))); // plain text: the EN/VI switch translates it
export const STAGES = ['Trải nghiệm', 'Hình thành', 'Củng cố', 'Vận dụng'];

/** CASIO fx-580VN X key sequence: steps = [{ keys: ['MENU', '7'], note }]. Returns null when there is nothing to press. */
export function casio(steps) {
  const ok = casioSteps(steps);
  if (!ok.length) return null;
  const cls = (k) => (k === 'SHIFT' ? 'key.shift' : k === 'ALPHA' ? 'key.alpha' : NAMED.has(k) || [...k].length <= 3 ? 'key' : 'key.val');
  return h('section.casio', { 'aria-label': 'Cách bấm máy CASIO fx-580VN X' },
    h('h3', {}, 'Bấm máy CASIO fx-580VN X'),
    h('ol', {}, ok.map((s) => h('li', {},
      s.keys.length ? h('span.keys', {}, s.keys.map((k) => h(`kbd.${cls(k)}`, {}, k))) : null,
      s.note ? rich(s.note, 'span') : null))));
}

// ---- CASIO steps as the AI really sends them: keys as an array, a string ("MENU 6", "SHIFT+÷"), or objects;
// steps as an array of objects or of plain strings; notes with math typed as text ("x_bar", "t_alpha/2(n-1)").
const NAMED = new Set(['MENU', 'SHIFT', 'ALPHA', 'OPTN', 'CALC', 'SOLVE', 'AC', 'DEL', 'ON', 'Ans', 'ENG', 'S⇔D', 'RCL', 'STO', 'x10ˣ', 'M+', 'M−', 'CATALOG', 'SETUP', 'OK', 'EXE']);
const KEY_TEX = [[/\\div/g, '÷'], [/\\times|\\cdot/g, '×'], [/\\sqrt\{?\}?/g, '√'], [/\\pi/g, 'π'], [/\^\{?2\}?/g, '²'], [/\^\{?-1\}?/g, '⁻¹'],
  [/\\(?:leftarrow|gets)/g, '◀'], [/\\(?:rightarrow|to)/g, '▶'], [/\\uparrow/g, '▲'], [/\\downarrow/g, '▼'], [/\\(?:frac|dfrac)\{?\}?\{?\}?/g, '▭/▭'], [/\\left|\\right|[{}$\\]/g, '']];
const CASE = { menu: 'MENU', shift: 'SHIFT', alpha: 'ALPHA', optn: 'OPTN', option: 'OPTN', calc: 'CALC', solve: 'SOLVE', ac: 'AC', del: 'DEL', on: 'ON', ans: 'Ans', exe: '=', enter: '=', up: '▲', down: '▼', left: '◀', right: '▶', '-': '−', '*': '×', '/': '÷' };
function oneKey(k) {
  let s = typeof k === 'object' && k ? (k.key ?? k.label ?? k.name ?? k.value ?? '') : k;
  s = String(s ?? '').trim().replace(/^\[(.*)\]$/, '$1');
  for (const [re, to] of KEY_TEX) s = s.replace(re, to);
  return CASE[s.toLowerCase()] ?? s.trim();
}
function keyList(keys) {
  const raw = Array.isArray(keys) ? keys : typeof keys === 'string' ? keys.split(/\s*(?:,|→|->|>|\s)\s*/) : keys ? [keys] : [];
  // "SHIFT+÷" / "SHIFT ÷" in one item = two keys; a value like "0.95" stays one key.
  return raw.flatMap((k) => (typeof k === 'string' ? k.split(/(?<=^(?:SHIFT|ALPHA|Shift|Alpha))\s*\+?\s*(?=\S)/) : [k])).map(oneKey).filter(Boolean);
}
const GREEK = 'alpha|beta|gamma|delta|epsilon|theta|lambda|mu|sigma|chi|rho|pi';
/** Math typed as plain text by the AI → $…$ LaTeX, only in notes that have no $ of their own. */
export function noteMath(note) {
  const s = String(note ?? '');
  if (s.includes('$')) return s;
  const tex = (w) => (new RegExp(`^(?:${GREEK})$`, 'i').test(w) ? `\\${w.toLowerCase()}` : w);
  return s
    .replace(/\b([A-Za-z])_bar\b|\b([A-Za-z])bar\b(?=\s|$|[.,;)])/g, (_, a, b) => `$\\bar{${a || b}}$`)
    .replace(new RegExp(`\\b([A-Za-z])_\\{?((?:${GREEK}|[A-Za-z0-9])+(?:\\/\\d+)?)\\}?(\\([^()\\s]*\\))?`, 'g'),
      (_, base, sub, arg) => `$${base}_{${sub.replace(new RegExp(GREEK, 'gi'), (g) => tex(g))}}${arg || ''}$`)
    .replace(/\b([A-Za-z])\^(\d+|\{[^}]+\})/g, (_, b, e) => `$${b}^{${e.replace(/[{}]/g, '')}}$`)
    .replace(new RegExp(`(^|[\\s(])(${GREEK})(?=$|[\\s),.;=])`, 'gi'), (_, pre, g) => `${pre}$${tex(g)}$`);
}
export function casioSteps(steps) {
  const list = Array.isArray(steps) ? steps : steps && typeof steps === 'object' ? (steps.steps || [steps]) : [];
  return list.map((s) => (typeof s === 'string' ? { keys: [], note: s } : s && typeof s === 'object' ? { keys: keyList(s.keys ?? s.key), note: s.note ?? s.desc ?? s.description ?? '' } : null))
    .filter((s) => s && (s.keys.length || s.note))
    .map((s) => ({ keys: s.keys, note: noteMath(s.note) }));
}

/** Flatten view content and drop empty slots (null/undefined/false), so an absent AI field never prints "null". */
export const nodes = (x) => [x].flat(Infinity).filter((k) => k != null && k !== false);
