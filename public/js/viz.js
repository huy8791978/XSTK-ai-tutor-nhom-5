// Illustrations: distribution charts from AI "viz" specs, the guilloche rosette, the score odometer, a Galton board.
import { h } from './ui.js';
import { fmtScore } from './stats.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';
const num = (x, d) => (Number.isFinite(+x) ? +x : d);
const vn = (x, p = 3) => String(+(+x).toFixed(p)).replace('.', ',');

function lnFact(n) { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; }
const binom = (n, p, k) => Math.exp(lnFact(n) - lnFact(k) - lnFact(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
const poisson = (l, k) => Math.exp(-l + k * Math.log(l) - lnFact(k));
const normPdf = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));

function svg(w, hgt, inner) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', `0 0 ${w} ${hgt}`); s.setAttribute('role', 'img'); s.innerHTML = inner;
  return s;
}

function barChart(labels, values, { hl = [] } = {}) {
  const W = 560, H = 220, P = 28, n = values.length, max = Math.max(...values, 1e-9);
  const bw = (W - P * 2) / n;
  const step = Math.ceil(n / 14);
  let g = `<line class="axis" x1="${P}" x2="${W - P}" y1="${H - P}" y2="${H - P}"/>`;
  values.forEach((v, i) => {
    const bh = (v / max) * (H - P * 2), x = P + i * bw;
    g += `<rect class="bar${hl.includes(i) ? ' hl' : ''}" style="animation-delay:${i * 18}ms" x="${x + bw * 0.12}" y="${H - P - bh}" width="${bw * 0.76}" height="${Math.max(bh, 0.5)}" rx="1.5"><title>${labels[i]}: ${vn(v, 4)}</title></rect>`;
    if (i % step === 0) g += `<text x="${x + bw / 2}" y="${H - P + 16}" text-anchor="middle">${labels[i]}</text>`;
    if (n <= 12) g += `<text x="${x + bw / 2}" y="${H - P - bh - 6}" text-anchor="middle" style="fill:#141833">${vn(v, v < 1 ? 3 : 1)}</text>`;
  });
  return svg(W, H, g);
}

/** Render an AI viz spec, or null when the spec is missing/invalid. */
export function chart(spec) {
  if (!spec || typeof spec !== 'object') return null;
  let node, alt;
  try {
    switch (spec.type) {
      case 'binomial': {
        const n = Math.round(Math.min(60, Math.max(1, num(spec.n, 10)))), p = Math.min(0.999, Math.max(0.001, num(spec.p, 0.5)));
        const ks = [...Array(n + 1).keys()];
        node = barChart(ks.map(String), ks.map((k) => binom(n, p, k)), { hl: [Math.floor((n + 1) * p)] });
        alt = `Phân phối nhị thức B(${n}; ${vn(p)})`; break;
      }
      case 'poisson': {
        const l = Math.min(30, Math.max(0.05, num(spec.lambda, 3)));
        const K = Math.min(45, Math.ceil(l + 4 * Math.sqrt(l) + 2));
        const ks = [...Array(K + 1).keys()];
        node = barChart(ks.map(String), ks.map((k) => poisson(l, k)), { hl: [Math.floor(l)] });
        alt = `Phân phối Poisson λ = ${vn(l)}`; break;
      }
      case 'bars': {
        const labels = (spec.labels || []).slice(0, 24).map(String), values = (spec.values || []).slice(0, 24).map((v) => num(v, 0));
        if (!labels.length || labels.length !== values.length) return null;
        node = barChart(labels, values); alt = 'Biểu đồ cột'; break;
      }
      case 'normal': {
        const m = num(spec.mu, 0), s = Math.max(1e-6, num(spec.sigma, 1));
        const W = 560, H = 220, P = 28, lo = m - 4 * s, hi = m + 4 * s;
        const X = (x) => P + ((x - lo) / (hi - lo)) * (W - 2 * P), Y = (y) => H - P - (y / normPdf(m, m, s)) * (H - 2 * P - 6);
        const pts = []; for (let i = 0; i <= 160; i++) { const x = lo + (i / 160) * (hi - lo); pts.push([X(x), Y(normPdf(x, m, s))]); }
        let shade = '';
        const a = spec.a == null ? null : Math.max(lo, num(spec.a, lo)), b = spec.b == null ? null : Math.min(hi, num(spec.b, hi));
        if (a != null || b != null) {
          const A = a ?? lo, B = b ?? hi, sp = [];
          for (let i = 0; i <= 80; i++) { const x = A + (i / 80) * (B - A); sp.push(`${X(x)},${Y(normPdf(x, m, s))}`); }
          shade = `<path d="M${X(A)},${H - P} L${sp.join(' L')} L${X(B)},${H - P} Z" fill="rgba(215,38,61,.22)" stroke="none"/>`;
        }
        let ticks = '';
        for (let k = -3; k <= 3; k++) ticks += `<line class="axis" x1="${X(m + k * s)}" x2="${X(m + k * s)}" y1="${H - P}" y2="${H - P + 4}"/><text x="${X(m + k * s)}" y="${H - P + 17}" text-anchor="middle">${k === 0 ? 'μ' : `${k > 0 ? '+' : '−'}${Math.abs(k)}σ`}</text>`;
        node = svg(W, H, `${shade}<line class="axis" x1="${P}" x2="${W - P}" y1="${H - P}" y2="${H - P}"/>${ticks}
          <path d="M${pts.map((p) => p.join(',')).join(' L')}" fill="none" stroke="#1B2A8C" stroke-width="2.4" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:${reduced() ? 0 : 1};animation:draw 1.2s cubic-bezier(.16,1,.3,1) forwards"/>
          <style>@keyframes draw{to{stroke-dashoffset:0}}</style>`);
        alt = `Phân phối chuẩn N(${vn(m)}; ${vn(s)}²)`; break;
      }
      case 'venn': {
        const pA = num(spec.pA, 0.5), pB = num(spec.pB, 0.4), pAB = num(spec.pAB, 0.2);
        node = svg(560, 220, `<rect x="40" y="10" width="480" height="200" rx="8" fill="#F4F6FB" stroke="#C2C9E6"/>
          <text x="54" y="32">Ω</text>
          <circle cx="235" cy="110" r="78" fill="rgba(27,42,140,.18)" stroke="#1B2A8C" stroke-width="1.6"/>
          <circle cx="325" cy="110" r="78" fill="rgba(215,38,61,.16)" stroke="#D7263D" stroke-width="1.6"/>
          <text x="190" y="114" text-anchor="middle" style="font-size:13px;fill:#1B2A8C">A: ${vn(pA)}</text>
          <text x="370" y="114" text-anchor="middle" style="font-size:13px;fill:#AE1B2F">B: ${vn(pB)}</text>
          <text x="280" y="114" text-anchor="middle" style="font-size:12px;fill:#141833">A∩B: ${vn(pAB)}</text>`);
        alt = 'Biểu đồ Venn'; break;
      }
      default: return null;
    }
  } catch { return null; }
  node.setAttribute('aria-label', alt);
  return h('figure.viz', {}, node, h('figcaption', {}, spec.caption ? `${alt} — ${spec.caption}` : alt));
}

/** Score that rolls into place like a draw-cage odometer. */
export function odometer(score, max = 10, small = false) {
  const text = fmtScore(score);
  const el = h(small ? 'div.odo.sm' : 'div.odo', { role: 'img', 'aria-label': `Điểm ${text} trên ${max}` });
  const cols = [];
  for (const ch of text) {
    if (/\d/.test(ch)) {
      const strip = h('span', {}, ...[...Array(10).keys()].map((d) => h('i', {}, String(d))));
      el.append(h('span.d', { 'aria-hidden': 'true' }, strip));
      cols.push([strip, +ch]);
    } else el.append(h('span.sep', { 'aria-hidden': 'true' }, ch));
  }
  el.append(h('small', { 'aria-hidden': 'true' }, `/${max}`));
  const settle = () => cols.forEach(([s, d], i) => { s.style.transitionDelay = `${i * 120}ms`; s.style.transform = `translateY(-${d}em)`; });
  if (reduced()) settle(); else requestAnimationFrame(() => requestAnimationFrame(settle));
  return el;
}

/** Guilloche rosette: layered hypotrochoids, the security pattern of a lottery ticket. */
export function rosette(canvas) {
  const ctx = canvas.getContext('2d');
  let seed = 3, t0 = performance.now(), raf = 0;
  const draw = (t) => {
    const dpr = Math.min(2, devicePixelRatio || 1), w = canvas.clientWidth, hh = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== hh * dpr) { canvas.width = w * dpr; canvas.height = hh * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, hh);
    const wide = w > hh;
    // Tall rail: rosette sits low, clear of the nav; wide bottom bar: off to the right.
    const cx = wide ? w * 0.82 : w * 0.72, cy = wide ? hh * 0.5 : hh * 0.82, S = wide ? hh * 0.9 : Math.min(w * 0.9, 220);
    const phase = (t - t0) / 26000;
    ctx.lineWidth = 0.7;
    for (let j = 0; j < 5; j++) {
      const R = 1, r = (seed + j) / (7 * seed + 11 + j * 2), d = 0.55 + j * 0.07;
      ctx.strokeStyle = j % 2 ? 'rgba(174,185,242,.32)' : 'rgba(242,183,5,.22)';
      ctx.beginPath();
      for (let i = 0; i <= 1400; i++) {
        const a = (i / 1400) * Math.PI * 2 * 12 + phase * (j % 2 ? 1 : -1);
        const x = (R - r) * Math.cos(a) + d * Math.cos(((R - r) / r) * a), y = (R - r) * Math.sin(a) - d * Math.sin(((R - r) / r) * a);
        const k = S / (2.6 + j * 0.12);
        i ? ctx.lineTo(cx + x * k, cy + y * k) : ctx.moveTo(cx + x * k, cy + y * k);
      }
      ctx.stroke();
    }
    if (!reduced() && !document.hidden) raf = requestAnimationFrame(draw);
  };
  const start = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
  document.addEventListener('visibilitychange', () => !document.hidden && start());
  addEventListener('resize', start);
  start();
  return { reseed(n) { seed = 3 + (n % 5); start(); } };
}

/** Galton board: balls bounce through pegs and pile into a binomial ≈ normal histogram. */
export function galton(canvas) {
  const ctx = canvas.getContext('2d'), ROWS = 11, bins = new Array(ROWS + 1).fill(0);
  let balls = [], raf = 0, running = false, total = 0;
  const size = () => {
    const dpr = Math.min(2, devicePixelRatio || 1), w = canvas.clientWidth, hh = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = hh * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return [w, hh];
  };
  let [W, H] = size();
  const geo = () => ({ gap: W / (ROWS + 3), top: 18, rowH: (H * 0.5) / ROWS });
  const frame = () => {
    const { gap, top, rowH } = geo(), cx = W / 2;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#C2C9E6';
    for (let r = 0; r < ROWS; r++) for (let i = 0; i <= r; i++) { ctx.beginPath(); ctx.arc(cx + (i - r / 2) * gap, top + 14 + r * rowH, 2.2, 0, 7); ctx.fill(); }
    const baseY = H - 22, maxBin = Math.max(...bins, 12), binTop = top + 20 + ROWS * rowH;
    bins.forEach((b, i) => {
      const x = cx + (i - ROWS / 2) * gap, bh = (b / maxBin) * (baseY - binTop);
      ctx.fillStyle = '#1B2A8C'; ctx.fillRect(x - gap * 0.36, baseY - bh, gap * 0.72, bh);
    });
    ctx.strokeStyle = '#D7263D'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const k = (i / 80) * ROWS, y = normPdf(k, ROWS / 2, Math.sqrt(ROWS) / 2) / normPdf(ROWS / 2, ROWS / 2, Math.sqrt(ROWS) / 2);
      const X = cx + (k - ROWS / 2) * gap, Y = baseY - y * (total ? (Math.max(...bins) / maxBin) : 0.9) * (baseY - binTop);
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.stroke();
    ctx.fillStyle = '#D7263D';
    for (const b of balls) { ctx.beginPath(); ctx.arc(cx + b.x * gap, b.y, 3.4, 0, 7); ctx.fill(); }
    ctx.strokeStyle = '#C2C9E6'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(8, baseY + 0.5); ctx.lineTo(W - 8, baseY + 0.5); ctx.stroke();
  };
  const step = () => {
    const { top, rowH } = geo();
    if (balls.length < 14 && Math.random() < 0.35) balls.push({ x: 0, y: top, row: 0, rights: 0 });
    for (const b of balls) {
      b.y += rowH / 7;
      const row = Math.floor((b.y - top - 14) / rowH);
      if (row >= 0 && row < ROWS && row >= b.row) { b.row = row + 1; const right = Math.random() < 0.5; b.rights += right; b.x += right ? 0.5 : -0.5; }
    }
    balls = balls.filter((b) => {
      if (b.row >= ROWS && b.y > top + 14 + ROWS * rowH) { bins[b.rights] += 1; total += 1; return false; }
      return true;
    });
    if (Math.max(...bins) > 60) { bins.fill(0); total = 0; }
    frame();
    if (running) raf = requestAnimationFrame(step);
  };
  if (reduced()) {
    for (let k = 0; k <= ROWS; k++) bins[k] = Math.round(binomPmf(ROWS, k) * 400);
    total = 1; frame();
    return { stop() {} };
  }
  const io = new IntersectionObserver(([e]) => {
    running = e.isIntersecting && !document.hidden;
    cancelAnimationFrame(raf); if (running) raf = requestAnimationFrame(step);
  });
  io.observe(canvas);
  const onResize = () => { [W, H] = size(); frame(); };
  addEventListener('resize', onResize);
  return { stop() { running = false; cancelAnimationFrame(raf); io.disconnect(); removeEventListener('resize', onResize); } };
}
const binomPmf = (n, k) => binom(n, 0.5, k);
