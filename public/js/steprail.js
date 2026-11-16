// The 4-step rail of the tool pages (Kiểm định, Ước lượng, Máy tính phân phối), like the Polya steps: a click
// shows that step's row in the result board. All steps are computed together, so the picked one is done too
// (data-done): engage.js fills the progress bar by done steps.
import { h, smooth } from './ui.js';
import { tr as t } from './i18n.js';

/** @returns {{ el: HTMLElement, paint: (labels: string[], ok: boolean) => void, row: (k: number, node: HTMLElement) => HTMLElement }} */
export function stepRail(label) {
  const el = h('div');
  const rows = [];
  let pick = 3, last = [];
  const paint = (labels, ok) => {
    last = labels;
    el.replaceChildren(h('ol.detents.steps.hyp-rail', { 'aria-label': t(label) },
      labels.map((name, k) => h('li', { 'data-state': !ok ? (k ? 'todo' : 'current') : k === pick ? 'current' : 'done', 'data-done': ok && k === pick ? '' : null },
        h('button', { type: 'button', disabled: !ok, 'aria-current': ok && k === pick ? 'step' : null, onclick: () => {
          pick = k; paint(last, true);
          rows[k]?.scrollIntoView({ behavior: smooth(), block: 'center' });
          rows.forEach((r, j) => r?.toggleAttribute('data-picked', j === k));
        } }, h('b', {}, String(k + 1)), t(name))))));
  };
  /** Registers the result row of step k (0-based) and marks it if that step is picked. */
  const row = (k, node) => { rows[k] = node; node.toggleAttribute('data-picked', k === pick); return node; };
  return { el, paint, row };
}

/** True when the student has not typed any of these values yet (NaN = empty field). */
export const untouched = (p, keys) => keys.every((k) => Number.isNaN(p[k]));
