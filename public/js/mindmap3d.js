// 3D view of the mind map: the same markdown laid out on nested shells around the course title, drawn on a canvas
// (no library, so it runs the same on iPhone). Drag to turn it (it keeps spinning a little when let go), scroll or
// pinch to zoom, tap a node to open or close its branch and see its full text (with formulas) in the panel.
import { h, rich } from './ui.js';
import { plainMath } from './md.js';

const COLORS = ['#1B2A8C', '#D7263D', '#0E9F6E', '#7A5A00', '#6B3FA0', '#0B7A8F', '#B4541A'];
const R = 190; // distance between shells
const D = 1100; // camera distance for the perspective
const MAX_LABEL = 38;

/** Markdown headings and list items → { label, children }. Several top headings get a shared root. */
export function mdTree(md, rootLabel = 'Bản đồ tư duy') {
  const top = { label: rootLabel, children: [], level: 0 };
  const stack = [top];
  let headLevel = 0;
  for (const line of String(md ?? '').replace(/\r/g, '').split('\n')) {
    let m, level, label;
    if ((m = line.match(/^(#{1,6})\s+(.*\S)\s*$/))) { level = m[1].length; headLevel = level; label = m[2]; } else if ((m = line.match(/^(\s*)(?:[-*+•]|\d+[.)])\s+(.*\S)\s*$/))) {
      level = headLevel + 1 + Math.floor(m[1].replace(/\t/g, '  ').length / 2); label = m[2];
    } else continue;
    const node = { label, children: [], level };
    while (stack.length > 1 && stack.at(-1).level >= level) stack.pop();
    stack.at(-1).children.push(node);
    stack.push(node);
  }
  return top.children.length === 1 ? top.children[0] : top;
}

const shortLabel = (s) => {
  const t = plainMath(s).replace(/\*\*|__|`/g, '').replace(/\s+/g, ' ').trim();
  return t.length > MAX_LABEL ? `${t.slice(0, MAX_LABEL - 1)}…` : t;
};

export function mindmap3d() {
  const canvas = h('canvas.mm3d-canvas', { tabindex: '0', role: 'img', 'aria-label': 'Bản đồ tư duy 3D. Kéo để xoay, cuộn hoặc chụm hai ngón để phóng to, bấm vào một nút để mở hoặc thu gọn nhánh.' });
  const info = h('div.mm-info', { 'aria-live': 'polite', hidden: true });
  const el = h('div.mm3d', {}, canvas, info);
  const ctx = canvas.getContext('2d');
  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let nodes = [], root = null, W = 0, H = 0, dpr = 1;
  let yaw = 0.6, pitch = -0.32, zoom = 1, vYaw = 0, vPitch = 0, idleAt = 0, selected = null, hover = null, running = false;
  let ink = '#141833', paper = '#FFFFFF';
  const pointers = new Map();
  let drag = null, pinch = null;

  // ---- tree, folding and layout
  function build(tree) {
    nodes = [];
    const walk = (t, parent, depth, branch) => {
      const n = { label: t.label, text: shortLabel(t.label), parent, depth, branch, kids: [], open: false, x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, a: 0, ta: 1, sx: 0, sy: 0, sz: 0, f: 1 };
      nodes.push(n);
      t.children.forEach((c, i) => n.kids.push(walk(c, n, depth + 1, depth === 0 ? i : branch)));
      return n;
    };
    root = walk(tree, null, 0, 0);
    // Open the first two levels when that stays readable, else just the first (the whole course has 7 lessons × many parts).
    const firstTwo = 1 + root.kids.length + root.kids.reduce((n, k) => n + k.kids.length, 0);
    root.open = true;
    if (firstTwo <= 24) root.kids.forEach((k) => { k.open = true; });
    layout(true);
  }
  const shown = (n) => { for (let p = n.parent; p; p = p.parent) if (!p.open) return false; return true; };
  const leaves = (n) => (n.open && n.kids.length ? n.kids.reduce((s, k) => s + leaves(k), 0) : 1);
  function layout(snap = false) {
    // Each branch gets a patch of the sphere sized by its leaves; odd depths split it by longitude, even depths
    // by latitude, so branches spread over the whole sphere instead of a flat ring.
    const place = (n, az0, az1, el0, el1, tilt = 0) => {
      const az = (az0 + az1) / 2, el = (el0 + el1) / 2 + tilt, r = R * n.depth ** 0.8; // outer shells closer together, so a fully open map still fits
      n.tx = r * Math.cos(el) * Math.cos(az); n.ty = r * Math.sin(el); n.tz = r * Math.cos(el) * Math.sin(az);
      if (!n.open || !n.kids.length) return;
      const total = leaves(n);
      let at = 0;
      n.kids.forEach((k, i) => {
        const share = leaves(k) / total;
        // the main branches go up and down in turn, so they stand around the title instead of lying in a ring
        const t = n.depth === 0 && n.kids.length > 2 ? [0, 0.5, -0.5][i % 3] : 0;
        if (n.depth % 2 === 0) place(k, az0 + (az1 - az0) * at, az0 + (az1 - az0) * (at + share), el0, el1, t);
        else place(k, az0, az1, el0 + (el1 - el0) * at, el0 + (el1 - el0) * (at + share));
        at += share;
      });
    };
    place(root, 0, Math.PI * 2, -1.05, 1.05);
    for (const n of nodes) {
      const vis = shown(n);
      if (vis && n.a === 0 && n.parent) { n.x = n.parent.x; n.y = n.parent.y; n.z = n.parent.z; } // grow out of the parent
      n.ta = vis ? 1 : 0;
      if (!vis) { let p = n.parent; while (!shown(p)) p = p.parent; n.tx = p.tx; n.ty = p.ty; n.tz = p.tz; } // folds back into the branch it belongs to
      if (snap || still) { n.x = n.tx; n.y = n.ty; n.z = n.tz; n.a = n.ta; }
    }
    kick();
  }

  // ---- drawing
  function project(n) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x1 = n.x * cy - n.z * sy, z1 = n.x * sy + n.z * cy;
    const y2 = n.y * cp - z1 * sp, z2 = n.y * sp + z1 * cp;
    const f = D / (D + z2);
    // a little left of centre: labels run to the right
    n.sx = W * 0.44 + x1 * f * zoom; n.sy = H / 2 + y2 * f * zoom; n.sz = z2; n.f = f;
  }
  function frame() {
    let moving = false;
    const k = still ? 1 : 0.14;
    for (const n of nodes) {
      const dx = n.tx - n.x, dy = n.ty - n.y, dz = n.tz - n.z, da = n.ta - n.a;
      if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 0.3 || Math.abs(da) > 0.01) moving = true;
      n.x += dx * k; n.y += dy * k; n.z += dz * k; n.a = Math.abs(da) < 0.01 ? n.ta : n.a + da * 0.18;
    }
    if (!drag) {
      yaw += vYaw; pitch = clampPitch(pitch + vPitch); vYaw *= 0.93; vPitch *= 0.93;
      if (Math.abs(vYaw) + Math.abs(vPitch) > 0.0004) moving = true;
      else if (!still && performance.now() > idleAt) { yaw += 0.0016; moving = true; } // a slow turn while left alone
    }
    draw();
    return moving || Boolean(drag);
  }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const live = nodes.filter((n) => n.a > 0.01);
    for (const n of nodes) n.lw = 0;
    live.forEach(project);
    const fog = (n) => Math.max(0.28, Math.min(1, 0.3 + (n.f - 0.78) * 2.2)) * n.a;
    ctx.lineWidth = 1.2;
    for (const n of live) {
      if (!n.parent) continue;
      ctx.globalAlpha = Math.min(fog(n), fog(n.parent)) * 0.8;
      ctx.strokeStyle = COLORS[n.branch % COLORS.length];
      ctx.beginPath(); ctx.moveTo(n.parent.sx, n.parent.sy); ctx.lineTo(n.sx, n.sy); ctx.stroke();
    }
    live.sort((a, b) => b.sz - a.sz); // far first
    const dot = (n) => Math.max(2, (n.depth === 0 ? 9 : n.depth === 1 ? 6.5 : 4.5) * n.f * Math.sqrt(zoom));
    for (const n of live) {
      const c = n.depth ? COLORS[n.branch % COLORS.length] : ink, r = dot(n);
      ctx.globalAlpha = fog(n);
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(n.sx, n.sy, r, 0, Math.PI * 2); ctx.fill();
      if (n.kids.length && !n.open) { ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(n.sx, n.sy, r + 3, 0, Math.PI * 2); ctx.stroke(); }
      if (n === selected || n === hover) { ctx.strokeStyle = '#F2B705'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(n.sx, n.sy, r + 5, 0, Math.PI * 2); ctx.stroke(); }
    }
    // Labels: the node in focus and its branch first, then by level and nearness; a label that would cover one
    // already drawn is left out (its dot stays, tap or zoom in to read it), so the map never turns into a smudge.
    const rank = (n) => (n === selected || n === hover ? -2 : n.parent === selected || n.parent === hover ? -1 : n.depth) * 1e4 + n.sz;
    const taken = [];
    ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    for (const n of [...live].sort((a, b) => rank(a) - rank(b))) {
      if (n.a < 0.35) continue;
      const size = Math.max(10, Math.min(24, (n.depth === 0 ? 19 : n.depth === 1 ? 15 : 13) * n.f * Math.sqrt(zoom)));
      ctx.font = `${n.depth < 2 ? 700 : 500} ${size}px "Be Vietnam Pro", system-ui, sans-serif`;
      const x = n.sx + dot(n) + 6, w = ctx.measureText(n.text).width, box = [x - 2, n.sy - size * 0.62, x + w + 2, n.sy + size * 0.62];
      if (taken.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
      taken.push(box);
      n.lw = w;
      ctx.globalAlpha = fog(n);
      ctx.lineWidth = 4; ctx.strokeStyle = paper; ctx.strokeText(n.text, x, n.sy);
      ctx.fillStyle = n.depth ? ink : COLORS[0]; ctx.fillText(n.text, x, n.sy);
    }
    ctx.globalAlpha = 1;
  }
  function loop() {
    if (!canvas.isConnected || canvas.offsetParent === null) { running = false; return; } // hidden: wake on the next kick
    if (frame()) requestAnimationFrame(loop); else running = false;
  }
  function kick() {
    if (running) return;
    running = true;
    requestAnimationFrame(loop);
  }

  // ---- interaction
  const clampPitch = (p) => Math.max(-1.45, Math.min(1.45, p));
  const rest = () => { idleAt = performance.now() + 4000; };
  const at = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  // The node under the finger: its dot or its label; when several overlap, the one nearest the camera.
  function hit(p) {
    let best = null;
    for (const n of nodes) {
      if (n.a < 0.5) continue;
      const size = Math.max(10, Math.min(24, (n.depth === 0 ? 19 : n.depth === 1 ? 15 : 13) * n.f * Math.sqrt(zoom)));
      const onDot = Math.hypot(n.sx - p.x, n.sy - p.y) < 16;
      const onLabel = n.lw > 0 && p.x > n.sx && p.x < n.sx + 14 + n.lw && Math.abs(p.y - n.sy) < size * 0.7;
      if ((onDot || onLabel) && (!best || n.sz < best.sz)) best = n;
    }
    return best;
  }
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault(); // no text selection while turning the map
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, at(e));
    rest(); vYaw = vPitch = 0;
    if (pointers.size === 1) drag = { start: at(e), last: at(e), moved: 0, t: performance.now() };
    else if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom }; drag = null; }
    kick();
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = at(e);
    if (!pointers.has(e.pointerId)) { const n = hit(p); if (n !== hover) { hover = n; canvas.style.cursor = n ? 'pointer' : 'grab'; kick(); } return; }
    pointers.set(e.pointerId, p);
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      zoom = clampZoom(pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y) / (pinch.d || 1));
    } else if (drag) {
      const dx = p.x - drag.last.x, dy = p.y - drag.last.y;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      yaw += dx * 0.0065; pitch = clampPitch(pitch + dy * 0.0065);
      vYaw = dx * 0.0065; vPitch = dy * 0.0065;
      drag.last = p;
    }
    rest(); kick();
  });
  const up = (e) => {
    const p = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (drag && p && drag.moved < 6 && e.type === 'pointerup') { vYaw = vPitch = 0; tap(hit(p)); }
    if (!pointers.size) drag = null;
    rest(); kick();
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', () => { if (hover) { hover = null; kick(); } });
  const clampZoom = (z) => Math.max(0.25, Math.min(4, z));
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); zoom = clampZoom(zoom * Math.exp(-e.deltaY * 0.0015)); rest(); kick(); }, { passive: false });
  canvas.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.12], ArrowDown: [0, 0.12] }[e.key];
    if (step) { yaw += step[0]; pitch = clampPitch(pitch + step[1]); } else if (e.key === '+' || e.key === '=') zoom = clampZoom(zoom * 1.15);
    else if (e.key === '-') zoom = clampZoom(zoom / 1.15);
    else return;
    e.preventDefault(); rest(); kick();
  });
  function tap(n) {
    selected = n;
    if (!n) { info.hidden = true; kick(); return; }
    if (n.kids.length) { n.open = !n.open; if (!n.open) n.kids.forEach(function close(k) { k.open = false; k.kids.forEach(close); }); layout(); }
    const path = [];
    for (let p = n.parent; p; p = p.parent) path.unshift(shortLabel(p.label));
    info.replaceChildren(
      path.length ? h('small.muted', {}, path.join(' › ')) : '',
      rich(n.label),
      n.kids.length ? h('small.muted', {}, n.open ? `Đang mở ${n.kids.length} nhánh con · bấm lần nữa để thu gọn` : `Có ${n.kids.length} nhánh con · bấm để mở`) : '');
    info.hidden = false;
    kick();
  }

  function size() {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ink = getComputedStyle(canvas).getPropertyValue('--ink').trim() || ink;
    // Labels get a halo of the panel's own colour so they stay readable over the lines behind them.
    for (let e = canvas; e; e = e.parentElement) { const bg = getComputedStyle(e).backgroundColor; if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) { paper = bg; break; } }
    kick();
  }
  new ResizeObserver(size).observe(canvas);

  return {
    el,
    show(md, rootLabel) { selected = hover = null; info.hidden = true; build(mdTree(md, rootLabel)); this.fit(); },
    /** Turn back to the starting angle and zoom so the open branches fill the frame. */
    fit() {
      const far = Math.max(R, ...nodes.filter((n) => n.ta > 0).map((n) => Math.hypot(n.tx, n.ty, n.tz)));
      zoom = clampZoom(Math.min((W || 600) * 0.34, (H || 420) * 0.42) / far);
      yaw = 0.6; pitch = -0.32; vYaw = vPitch = 0; rest(); kick();
    },
    expandAll() { nodes.forEach((n) => { n.open = true; }); layout(); this.fit(); },
    wake() { size(); this.fit(); },
  };
}
