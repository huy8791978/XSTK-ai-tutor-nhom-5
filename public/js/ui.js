// Small DOM + async helpers shared by every view.
import { md, typeset } from './md.js';

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
  queueMicrotask(() => typeset(el));
  return el;
}
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
export const POLYA = ['Tìm hiểu đề', 'Chương trình giải', 'Trình bày', 'Kiểm tra'];
export const STAGES = ['Trải nghiệm', 'Hình thành', 'Củng cố', 'Vận dụng'];

/** CASIO fx-580VN X key sequence: steps = [{ keys: ['MENU', '7'], note }]. Returns null when there is nothing to press. */
export function casio(steps) {
  const ok = (steps || []).filter((s) => s && (s.keys?.length || s.note));
  if (!ok.length) return null;
  const cls = (k) => (k === 'SHIFT' ? 'key.shift' : k === 'ALPHA' ? 'key.alpha' : 'key');
  return h('section.casio', { 'aria-label': 'Cách bấm máy CASIO fx-580VN X' },
    h('h3', {}, 'Bấm máy CASIO fx-580VN X'),
    h('ol', {}, ok.map((s) => h('li', {},
      h('span.keys', {}, (s.keys || []).map((k) => h(`kbd.${cls(String(k))}`, {}, String(k)))),
      s.note ? rich(s.note, 'span') : null))));
}

/** Flatten view content and drop empty slots (null/undefined/false), so an absent AI field never prints "null". */
export const nodes = (x) => [x].flat(Infinity).filter((k) => k != null && k !== false);
