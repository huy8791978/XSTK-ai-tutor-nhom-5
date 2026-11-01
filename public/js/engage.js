// Small touches for different ways of learning (multiple intelligences), all display-only:
// topic tags coloured by chapter, a progress bar under every step rail, a medal (and an optional "ting")
// when a step is newly done, and swiping between the 4 problem-solving steps on touch screens.
import { TOPICS, TOPIC_COLOR } from './topics.js';
import { t, tr } from './i18n.js';

const SOUND = 'xstk.sound';
let soundOn = (() => { try { return localStorage.getItem(SOUND) === '1'; } catch { return false; } })();

/** Colour family of a topic name in either language, or 0 when it is not one of TOPICS. */
const colorOf = (name) => {
  const k = name.trim();
  const i = TOPICS.findIndex((x) => x === k || t(x) === k);
  return i < 0 ? 0 : TOPIC_COLOR[i];
};

// A rail is rebuilt on every repaint (or replaced whole in lessons), so remember its done count by a stable key.
const lastDone = new WeakMap();
const railKey = (ol) => (ol.classList.contains('steps') ? ol : ol.parentElement || ol);

function paintRail(ol) {
  const items = [...ol.children].filter((li) => li.tagName === 'LI');
  if (!items.length) return;
  const isDone = (li) => li.dataset.state === 'done' || li.hasAttribute('data-done');
  const done = items.filter(isDone).length;
  ol.style.setProperty('--p', String(done / items.length));
  const key = railKey(ol), was = lastDone.get(key);
  lastDone.set(key, done);
  if (was == null || done <= was) return;
  const k = items.findLastIndex(isDone);
  const next = items.find((li) => !isDone(li));
  cheer(k + 1, next?.textContent.replace(/^\d+/, '').trim());
}

let cheerTimer;
function cheer(n, next) {
  let el = document.querySelector('.cheer');
  if (!el) { el = document.createElement('div'); el.className = 'cheer'; el.setAttribute('role', 'status'); document.body.append(el); }
  const medal = Object.assign(document.createElement('span'), { className: 'medal', textContent: String(n) });
  const msg = document.createElement('span');
  msg.append(tr(`Xong bước ${n}!`), next ? document.createElement('br') : '', next ? tr(`Tiếp theo: ${next}`) : '');
  el.replaceChildren(medal, msg);
  el.hidden = false;
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  clearTimeout(cheerTimer); cheerTimer = setTimeout(() => { el.hidden = true; }, 3200);
  if (soundOn) ting();
}

let audio;
function ting() {
  try {
    audio ||= new AudioContext();
    const t0 = audio.currentTime;
    [[1318.5, 0], [1760, 0.09]].forEach(([f, d]) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + d);
      g.gain.exponentialRampToValueAtTime(0.12, t0 + d + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.45);
      o.connect(g).connect(audio.destination); o.start(t0 + d); o.stop(t0 + d + 0.5);
    });
  } catch { /* no Web Audio: stay silent */ }
}

function scan(root) {
  if (root.nodeType !== 1) return;
  for (const el of [root, ...root.querySelectorAll('.tag.topic, .detents')]) {
    if (el.matches('.tag.topic') && !el.dataset.c) { const c = colorOf(el.textContent); if (c) el.dataset.c = c; }
    if (el.matches('.detents')) paintRail(el);
  }
}

// Swipe left / right on a step pane (phone, tablet) = the next / previous step tab. Not on fields, the board,
// canvases or anything that scrolls sideways, so writing and scrolling a formula still work.
const NO_SWIPE = 'textarea, input, select, canvas, math-field, .wboard, .katex-display, .table-wrap, .mm-wrap, .opt';
function swipe() {
  let x0, y0, pane;
  addEventListener('touchstart', (e) => {
    pane = null;
    if (e.touches.length !== 1) return;
    const el = e.target.closest?.('.step-pane');
    if (!el || e.target.closest(NO_SWIPE)) return;
    for (let n = e.target; n && n !== el; n = n.parentElement) if (n.scrollWidth > n.clientWidth + 2 && getComputedStyle(n).overflowX !== 'visible') return;
    pane = el; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  addEventListener('touchend', (e) => {
    if (!pane) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    const box = pane.closest('.q, .pane');
    pane = null;
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
    const tabs = [...(box?.querySelector('.detents.steps')?.querySelectorAll('button') || [])];
    const cur = tabs.findIndex((b) => b.getAttribute('aria-current') === 'step');
    tabs[cur + (dx < 0 ? 1 : -1)]?.click();
  }, { passive: true });
}

function soundButton() {
  const b = document.querySelector('[data-sound]');
  if (!b) return;
  const paint = () => b.setAttribute('aria-pressed', String(soundOn));
  paint();
  b.addEventListener('click', () => {
    soundOn = !soundOn;
    try { localStorage.setItem(SOUND, soundOn ? '1' : '0'); } catch { /* private mode: this visit only */ }
    paint();
    if (soundOn) ting();
  });
}

export function initEngage() {
  scan(document.body);
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'attributes') { const ol = m.target.closest('.detents'); if (ol) paintRail(ol); continue; }
      m.addedNodes.forEach(scan);
      const ol = m.target.closest?.('.detents');
      if (ol && m.removedNodes.length) paintRail(ol);
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state'] });
  swipe();
  soundButton();
}
