// Handwriting board for iPad / tablet / mouse: Apple Pencil pressure, eraser, undo. Exports a PNG the AI reads like a photo.
import { h, icon } from './ui.js';

const INKS = [['#141833', 'Mực đen'], ['#1B2A8C', 'Mực xanh'], ['#D7263D', 'Mực đỏ']];

/** Returns { el, isEmpty(), toFile() } — toFile() gives { name, mimeType, data } like files.js. */
export function whiteboard({ height = 380 } = {}) {
  const canvas = h('canvas.board-canvas', { role: 'img', 'aria-label': 'Bảng viết tay' });
  const strokes = [];
  let ink = INKS[0][0], eraser = false, cur = null;

  const ctx = canvas.getContext('2d');
  const size = () => {
    const dpr = Math.min(2, devicePixelRatio || 1), w = canvas.clientWidth;
    if (!w) return;
    canvas.width = w * dpr; canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); redraw();
  };
  const line = (s, a, b) => {
    ctx.strokeStyle = s.erase ? '#FFFFFF' : s.ink;
    ctx.lineWidth = s.erase ? 22 : 1.2 + 2.6 * (b.p || 0.5);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  };
  function redraw() {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const s of strokes) for (let i = 1; i < s.pts.length; i++) line(s, s.pts[i - 1], s.pts[i]);
  }
  const pt = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pointerType === 'pen' ? e.pressure : 0.5 }; };

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    cur = { ink, erase: eraser || e.button === 5, pts: [pt(e)] };
    strokes.push(cur); line(cur, cur.pts[0], cur.pts[0]);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!cur) return;
    for (const ev of e.getCoalescedEvents?.() || [e]) { const p = pt(ev); line(cur, cur.pts.at(-1), p); cur.pts.push(p); }
  });
  const end = () => { cur = null; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

  const tools = h('div.board-tools', { role: 'toolbar', 'aria-label': 'Công cụ bảng' });
  const paintTools = () => tools.replaceChildren(
    ...INKS.map(([c, name]) => h('button.swatch', { type: 'button', title: name, 'aria-label': name, 'aria-pressed': String(!eraser && ink === c), style: `--c:${c}`, onclick: () => { ink = c; eraser = false; paintTools(); } })),
    h('button.btn.btn-ghost', { type: 'button', 'aria-pressed': String(eraser), onclick: () => { eraser = !eraser; paintTools(); } }, 'Tẩy'),
    h('button.btn.btn-ghost', { type: 'button', onclick: () => { strokes.pop(); redraw(); } }, 'Hoàn tác'),
    h('button.btn.btn-ghost', { type: 'button', onclick: () => { strokes.length = 0; redraw(); } }, icon('x'), 'Xoá bảng'));
  paintTools();

  const el = h('div.wboard', {}, tools, canvas, h('p.muted.board-hint', {}, 'Viết bằng bút Apple Pencil, ngón tay hoặc chuột. AI sẽ đọc chữ viết tay trên bảng.'));
  canvas.style.height = `${height}px`;
  new ResizeObserver(size).observe(canvas);

  return {
    el,
    isEmpty: () => !strokes.some((s) => !s.erase),
    toFile: () => ({ name: 'bang-viet-tay.png', mimeType: 'image/png', data: canvas.toDataURL('image/png').split(',')[1] }),
    clear: () => { strokes.length = 0; redraw(); },
  };
}

/** A "Viết trên bảng (iPad)" toggle button + collapsible board. Returns { el, board } — board.isEmpty() is true while hidden. */
export function boardToggle(label = 'Viết trên bảng (iPad)') {
  const board = whiteboard();
  const wrap = h('div', { hidden: true }, board.el);
  const btn = h('button.btn.btn-ghost', { type: 'button', 'aria-expanded': 'false' }, icon('pen'), label);
  btn.onclick = () => { wrap.hidden = !wrap.hidden; btn.setAttribute('aria-expanded', String(!wrap.hidden)); };
  return {
    btn, wrap, open: () => { if (wrap.hidden) btn.click(); },
    board: { ...board, isEmpty: () => wrap.hidden || board.isEmpty() },
  };
}
