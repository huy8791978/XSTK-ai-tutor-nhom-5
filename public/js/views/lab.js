// Phòng thí nghiệm: hands-on simulations that run in the browser (no AI, no quota):
// binomial → normal with sliders (and heard as sound), confidence intervals, coin/dice tossed by shaking the phone,
// ordering the steps of a solution, and sorting variables from nature (plus the student's own data, read by the AI).
import { h, rich, run, toast } from '../ui.js';
import { ai } from '../api.js';
import { chart } from '../viz.js';
import { useLens } from '../profile.js';

export const meta = { title: 'Phòng thí nghiệm', lede: 'Tự tay kéo, tung, lắc, sắp xếp và nghe để thấy xác suất hoạt động.\nMọi mô phỏng chạy ngay trên máy, không tốn lượt AI.' };

const vn = (x, d = 3) => String(+(+x).toFixed(d)).replace('.', ',');
const once = (id) => { const seen = new Set(); return () => { if (!seen.has(id)) { seen.add(id); useLens(id); } }; };

// ---- pure helpers (tested in tests/client.test.mjs)
function lnFact(n) { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; }
/** P(X = k), k = 0..n, for X ~ B(n; p). */
export function binomPmf(n, p) {
  return [...Array(n + 1).keys()].map((k) => (p <= 0 ? +(k === 0) : p >= 1 ? +(k === n) : Math.exp(lnFact(n) - lnFact(k) - lnFact(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p))));
}
export const Z = { 90: 1.645, 95: 1.96, 99: 2.576 };
const gauss = (rand) => { let u = 0; while (!u) u = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand()); };
/** `count` samples of size n from N(mu; sigma²), each with its interval x̄ ± z·σ/√n (σ known). */
export function ciSim({ n, level = 95, count = 50, mu = 50, sigma = 10, rand = Math.random }) {
  const eps = (Z[level] * sigma) / Math.sqrt(n);
  return Array.from({ length: count }, () => {
    let s = 0; for (let i = 0; i < n; i++) s += mu + sigma * gauss(rand);
    const m = s / n;
    return { lo: m - eps, hi: m + eps, hit: m - eps <= mu && mu <= m + eps };
  });
}
/** How many steps sit at their right place (order holds the original indexes). */
export const placed = (order) => order.filter((v, i) => v === i).length;
/** Numbers typed the Vietnamese way: separated by spaces, new lines or «;», decimal comma or point. Others stay text. */
export function parseValues(text) {
  return String(text || '').split(/[\s;]+/).map((t) => t.trim()).filter(Boolean)
    .map((t) => (/^-?\d+(?:[.,]\d+)?$/.test(t) ? Number(t.replace(',', '.')) : t));
}
/** Descriptive statistics for numbers, or a frequency table for labels. */
export function describe(values) {
  if (!values.length) return null;
  if (values.every((v) => typeof v === 'number')) {
    const n = values.length, mean = values.reduce((a, v) => a + v, 0) / n, sorted = [...values].sort((a, b) => a - b);
    const s = n > 1 ? Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1)) : 0;
    const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    return { numeric: true, n, mean, s, median, min: sorted[0], max: sorted[n - 1] };
  }
  const f = new Map(); for (const v of values) f.set(String(v), (f.get(String(v)) || 0) + 1);
  return { numeric: false, n: values.length, freq: [...f].sort((a, b) => b[1] - a[1]) };
}

// ---- sound: each bar a note, higher bar = higher and louder note
let audio;
export function sonify(values, ms = 140) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return toast('Trình duyệt này không phát được âm thanh.');
  audio ||= new AC();
  audio.resume?.();
  const max = Math.max(...values, 1e-9), t0 = audio.currentTime + 0.05;
  values.forEach((v, i) => {
    const r = v / max, o = audio.createOscillator(), g = audio.createGain();
    o.type = 'triangle'; o.frequency.value = 220 + 660 * r;
    g.gain.setValueAtTime(0.0001, t0 + (i * ms) / 1000);
    g.gain.exponentialRampToValueAtTime(0.02 + 0.25 * r, t0 + (i * ms + 15) / 1000);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + ((i + 1) * ms) / 1000);
    o.connect(g).connect(audio.destination); o.start(t0 + (i * ms) / 1000); o.stop(t0 + ((i + 1) * ms) / 1000 + 0.02);
  });
}

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (w, hh, inner, label) => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', `0 0 ${w} ${hh}`); s.setAttribute('role', 'img'); s.setAttribute('aria-label', label); s.innerHTML = inner; return s; };
const slider = (label, attrs) => {
  const input = h('input', { type: 'range', ...attrs }), val = h('output', {}, String(attrs.value));
  return { input, val, el: h('label.field.lab-slider', {}, h('span', {}, label, ' ', val), input) };
};

export function render(root) {
  const parts = [
    ['nhi-thuc', 'Nhị thức → Chuẩn', binomialLab],
    ['khoang-tin-cay', 'Khoảng tin cậy', ciLab],
    ['tung', 'Tung đồng xu, xúc xắc', tossLab],
    ['sap-xep', 'Sắp xếp bước giải', orderLab],
    ['thien-nhien', 'Dữ liệu tự nhiên', natureLab],
  ];
  root.append(
    h('nav.chips', { style: 'margin-bottom:22px', 'aria-label': 'Các thí nghiệm' }, parts.map(([id, name]) => h('button.chip', { type: 'button', onclick: () => document.getElementById(`lab-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, name))),
    h('div.stack', {}, parts.map(([id, name, make]) => h('section.panel.lab', { id: `lab-${id}`, 'aria-label': name }, h('h2', {}, name), make()))));
}

function binomialLab() {
  const n = slider('n =', { min: 1, max: 100, value: 20 }), p = slider('p =', { min: 1, max: 99, value: 30 });
  const fig = h('figure.viz'), note = h('p.muted');
  const seen = once('spatial'), heard = once('musical');
  const paint = () => {
    const N = +n.input.value, P = +p.input.value / 100, q = 1 - P, pmf = binomPmf(N, P);
    n.val.textContent = String(N); p.val.textContent = vn(P, 2);
    const W = 560, H = 220, PAD = 28, max = Math.max(...pmf), bw = (W - PAD * 2) / (N + 1), mu = N * P, sd = Math.sqrt(N * P * q);
    const X = (k) => PAD + (k + 0.5) * bw, Y = (y) => H - PAD - (y / max) * (H - PAD * 2);
    let g = `<line class="axis" x1="${PAD}" x2="${W - PAD}" y1="${H - PAD}" y2="${H - PAD}"/>`;
    pmf.forEach((v, k) => { g += `<rect class="bar" x="${X(k) - bw * 0.38}" y="${Y(v)}" width="${bw * 0.76}" height="${Math.max(0.5, H - PAD - Y(v))}"><title>P(X=${k}) = ${vn(v, 4)}</title></rect>`; });
    const step = Math.ceil((N + 1) / 12);
    for (let k = 0; k <= N; k += step) g += `<text x="${X(k)}" y="${H - PAD + 16}" text-anchor="middle">${k}</text>`;
    if (sd > 0) {
      const pts = []; for (let i = 0; i <= 160; i++) { const x = -0.5 + (i / 160) * (N + 1); pts.push(`${X(x)},${Y(Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI)))}`); }
      g += `<path d="M${pts.join(' L')}" fill="none" stroke="#D7263D" stroke-width="2.2"/>`;
    }
    fig.replaceChildren(svgEl(W, H, g, `B(${N}; ${vn(P, 2)}) và đường chuẩn N(${vn(mu, 2)}; ${vn(sd, 2)}²)`),
      h('figcaption', {}, 'Cột xanh: nhị thức B(n; p). Đường đỏ: phân phối chuẩn cùng kì vọng và phương sai.'));
    const good = mu >= 5 && N * q >= 5;
    note.replaceChildren(rich(`$np = ${vn(mu, 2)}$, $nq = ${vn(N * q, 2)}$, $\\sqrt{npq} = ${vn(sd, 2)}$. ${good ? '✓' : '✗'}`, 'span'), ' ',
      good ? 'np ≥ 5 và nq ≥ 5: xấp xỉ chuẩn khá tốt.' : 'Chưa đủ np ≥ 5 và nq ≥ 5: đường chuẩn còn lệch so với cột.');
  };
  n.input.oninput = p.input.oninput = () => { seen(); paint(); };
  paint();
  const bListen = h('button.btn', { type: 'button', onclick: () => { heard(); sonify(binomPmf(+n.input.value, +p.input.value / 100)); } }, '🔊 ', 'Nghe phân phối');
  return [h('p.muted', {}, 'Kéo n tăng dần: các cột nhị thức tiến dần về hình chuông của phân phối chuẩn (định lí Moivre – Laplace).'),
    h('div.toolbar', {}, n.el, p.el), fig, note,
    h('div.btn-row', { style: 'margin-top:10px' }, bListen, h('span.muted', {}, 'Cột cao kêu cao và to hơn: phân phối lệch nghe lệch nhịp.'))];
}

function ciLab() {
  const n = slider('Cỡ mẫu n =', { min: 4, max: 200, value: 25 });
  const level = h('select', { id: 'lab-ci-level' }, [90, 95, 99].map((v) => h('option', { value: v, selected: v === 95 }, `${v}%`)));
  const fig = h('div'), seen = once('spatial');
  const draw = () => {
    seen();
    const L = +level.value, N = +n.input.value, rs = ciSim({ n: N, level: L });
    const W = 560, H = 260, PAD = 20, lo = 50 - 3 * 10 / Math.sqrt(4), hi = 50 + 3 * 10 / Math.sqrt(4);
    const X = (x) => PAD + ((Math.min(hi, Math.max(lo, x)) - lo) / (hi - lo)) * (W - 2 * PAD);
    let g = `<line x1="${X(50)}" x2="${X(50)}" y1="4" y2="${H - 4}" stroke="#141833" stroke-dasharray="4 3"/><text x="${X(50) + 4}" y="14">μ = 50</text>`;
    rs.forEach((r, i) => { const y = 22 + i * ((H - 30) / rs.length); g += `<line x1="${X(r.lo)}" x2="${X(r.hi)}" y1="${y}" y2="${y}" stroke="${r.hit ? '#1B2A8C' : '#D7263D'}" stroke-width="3" stroke-linecap="round"/>`; });
    const hits = rs.filter((r) => r.hit).length;
    fig.replaceChildren(h('figure.viz', {}, svgEl(W, H, g, `${hits}/50 khoảng chứa μ`), h('figcaption', {}, `${hits}/50 khoảng chứa μ`)),
      h('p.muted', {}, 'Độ tin cậy là tỉ lệ khoảng chứa μ khi lặp lại rất nhiều lần, không phải xác suất μ nằm trong một khoảng đã tính. n lớn: khoảng hẹp lại nhưng tỉ lệ chứa μ vẫn quanh mức đã chọn.'));
  };
  n.input.oninput = () => { n.val.textContent = n.input.value; };
  return [h('p.muted', {}, 'Tổng thể N(50; 10²), σ đã biết. Mỗi lần bấm, máy lấy 50 mẫu cỡ n và vẽ 50 khoảng tin cậy x̄ ± u·σ/√n. Khoảng đỏ là khoảng trượt μ.'),
    h('div.toolbar', {}, n.el, h('label.field', { for: level.id, style: 'max-width:160px' }, h('span', {}, 'Độ tin cậy'), level),
      h('div.btn-row', {}, h('button.btn.btn-primary', { type: 'button', onclick: draw }, 'Lấy 50 mẫu'))), fig];
}

function tossLab() {
  let faces = 6, counts = Array(6).fill(0);
  const fig = h('div'), total = h('b'), touched = once('bodily');
  const kind = h('div.chips', { role: 'group', 'aria-label': 'Vật để tung' });
  const pick = (f) => { faces = f; counts = Array(f).fill(0); kind.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.f === f))); paint(); };
  kind.append(h('button.chip', { type: 'button', 'data-f': 2, 'aria-pressed': 'false', onclick: () => pick(2) }, '🪙 ', 'Đồng xu'), h('button.chip', { type: 'button', 'data-f': 6, 'aria-pressed': 'true', onclick: () => pick(6) }, '🎲 ', 'Xúc xắc'));
  const toss = (k) => { touched(); for (let i = 0; i < k; i++) counts[Math.floor(Math.random() * faces)] += 1; paint(); };
  const paint = () => {
    const N = counts.reduce((a, c) => a + c, 0);
    total.textContent = String(N);
    const labels = faces === 2 ? ['Sấp', 'Ngửa'] : ['1', '2', '3', '4', '5', '6'];
    fig.replaceChildren(N ? chart({ type: 'bars', labels, values: counts.map((c) => c / N), caption: `Tần suất sau ${N} lần · lí thuyết ${faces === 2 ? '0,5' : '1/6 ≈ 0,167'}` }) : h('p.muted', {}, 'Chưa tung lần nào.'));
  };
  // Shaking the phone: a jolt above ~2 g tosses 10 more (iOS asks for permission once, on the button tap).
  let last = 0, shaking = false;
  const onMotion = (e) => { const a = e.accelerationIncludingGravity; if (!a) return; const g = Math.hypot(a.x || 0, a.y || 0, a.z || 0); if (g > 20 && Date.now() - last > 350) { last = Date.now(); toss(10); navigator.vibrate?.(20); } };
  const bShake = h('button.btn', { type: 'button' }, '📳 ', 'Lắc máy để tung');
  bShake.onclick = async () => {
    if (shaking) { removeEventListener('devicemotion', onMotion); shaking = false; bShake.replaceChildren('📳 ', 'Lắc máy để tung'); return; }
    if (typeof DeviceMotionEvent === 'undefined') return toast('Máy này không có cảm biến chuyển động. Hãy bấm Tung.');
    try { if (DeviceMotionEvent.requestPermission && await DeviceMotionEvent.requestPermission() !== 'granted') return toast('Chưa được phép dùng cảm biến chuyển động.'); } catch { return toast('Chưa được phép dùng cảm biến chuyển động.'); }
    addEventListener('devicemotion', onMotion); shaking = true; bShake.replaceChildren('⏹ ', 'Dừng lắc');
    toast('Lắc mạnh điện thoại: mỗi cú lắc tung thêm 10 lần.');
  };
  paint();
  return [h('p.muted', {}, 'Luật số lớn: tung càng nhiều, tần suất mỗi mặt càng gần xác suất lí thuyết.'), kind,
    h('div.btn-row', { style: 'margin:12px 0' }, h('button.btn.btn-primary', { type: 'button', onclick: () => toss(1) }, 'Tung 1 lần'),
      h('button.btn', { type: 'button', onclick: () => toss(10) }, 'Tung 10 lần'), h('button.btn', { type: 'button', onclick: () => toss(100) }, 'Tung 100 lần'),
      bShake, h('button.btn.btn-ghost', { type: 'button', onclick: () => pick(faces) }, 'Làm lại')),
    h('p', {}, 'Tổng số lần tung: ', total), fig];
}

// Steps in the right order; shown shuffled. Plain text (no LaTeX) so the EN/VI switch can translate them.
export const ORDER_TASKS = [
  { title: 'Tung 3 đồng xu cân đối. Tính xác suất có đúng 2 mặt sấp.', steps: [
    'Gọi X là số mặt sấp, X có phân phối nhị thức B(3; 0,5).',
    'Viết công thức Bernoulli: P(X = k) = C(n, k)·pᵏ·qⁿ⁻ᵏ.',
    'Thay n = 3, k = 2, p = q = 0,5: P(X = 2) = C(3, 2)·0,5²·0,5.',
    'Tính được P(X = 2) = 3/8 = 0,375.',
    'Kiểm tra: P(X = 0) + P(X = 1) + P(X = 2) + P(X = 3) = 1.'] },
  { title: 'Mẫu n = 36 có x̄ = 50, σ = 6 đã biết. Tìm khoảng tin cậy 95% cho trung bình μ.', steps: [
    'Nhận ra σ đã biết nên dùng phân phối chuẩn.',
    'Với độ tin cậy 95%, tra được u = 1,96.',
    'Tính độ chính xác ε = 1,96·6/√36 = 1,96.',
    'Khoảng tin cậy: (50 − 1,96; 50 + 1,96) = (48,04; 51,96).',
    'Kết luận bằng lời: với độ tin cậy 95%, μ nằm trong khoảng (48,04; 51,96).'] },
  { title: 'Bệnh có tỉ lệ 1%. Xét nghiệm dương tính đúng 95% ở người bệnh, sai 5% ở người khoẻ. Một người dương tính, tính xác suất người đó bị bệnh.', steps: [
    'Đặt B là biến cố bị bệnh, A là biến cố xét nghiệm dương tính.',
    'Ghi dữ kiện: P(B) = 0,01; P(A|B) = 0,95; P(A|B̄) = 0,05.',
    'Tính P(A) bằng công thức xác suất đầy đủ: 0,01·0,95 + 0,99·0,05 = 0,059.',
    'Áp dụng công thức Bayes: P(B|A) = 0,0095/0,059 ≈ 0,161.',
    'Nhận xét: dù xét nghiệm khá chính xác, người dương tính chỉ khoảng 16% bị bệnh vì bệnh hiếm.'] },
];
const shuffled = (n) => { let a; do { a = [...Array(n).keys()].sort(() => Math.random() - 0.5); } while (placed(a) === n); return a; };

function orderLab() {
  let t = 0, order = shuffled(ORDER_TASKS[0].steps.length), dragged = null;
  const box = h('div'), verdict = h('div'), touched = once('bodily');
  const move = (i, j) => { if (j < 0 || j >= order.length) return; touched(); const [x] = order.splice(i, 1); order.splice(j, 0, x); verdict.replaceChildren(); paint(); };
  const paint = () => {
    const T = ORDER_TASKS[t];
    box.replaceChildren(h('p', {}, h('b', {}, 'Đề: '), T.title),
      h('ol.sort-list', {}, order.map((s, i) => h('li', {
        draggable: 'true',
        ondragstart: () => { dragged = i; }, ondragover: (e) => e.preventDefault(), ondrop: (e) => { e.preventDefault(); if (dragged != null) move(dragged, i); dragged = null; },
      }, h('span.grip', { 'aria-hidden': 'true' }, '⠿'), h('span', {}, T.steps[s]),
      h('span.sort-btns', {}, h('button.btn.btn-ghost', { type: 'button', 'aria-label': 'Lên', onclick: () => move(i, i - 1) }, '↑'), h('button.btn.btn-ghost', { type: 'button', 'aria-label': 'Xuống', onclick: () => move(i, i + 1) }, '↓'))))));
  };
  const check = () => {
    const k = placed(order), n = order.length;
    verdict.replaceChildren(h('div.reveal', {}, h('div.tags', {}, h(`span.tag${k === n ? '.ok' : ''}`, {}, `${k}/${n} bước đúng chỗ`)),
      h('p.muted', { style: 'margin-top:8px' }, k === n ? 'Chính xác! Đây đúng là bước 3 «Trình bày lời giải» của Polya: sắp các việc thành chương trình theo trình tự hợp lí.' : 'Chưa đúng hết. Hỏi: bước nào cần kết quả của bước nào?')));
  };
  const next = () => { t = (t + 1) % ORDER_TASKS.length; order = shuffled(ORDER_TASKS[t].steps.length); verdict.replaceChildren(); paint(); };
  paint();
  return [h('p.muted', {}, 'Kéo thả (hoặc bấm ↑ ↓) để xếp các bước theo đúng trình tự, rồi bấm Kiểm tra thứ tự.'), box,
    h('div.btn-row', { style: 'margin-top:12px' }, h('button.btn.btn-primary', { type: 'button', onclick: check }, 'Kiểm tra thứ tự'), h('button.btn', { type: 'button', onclick: next }, 'Bài khác')), verdict];
}

// Variables observed in nature: what kind each one is, and a distribution often used for it.
export const NATURE = [
  { text: 'Loài chim đang đậu trên cây (sẻ, chào mào, bồ câu…)', type: 'qual', note: 'Định tính: chỉ phân loại, không đo đếm. Thống kê bằng tần suất mỗi loài.' },
  { text: 'Số con chim đậu xuống một cây trong 10 phút', type: 'disc', note: 'Định lượng rời rạc: đếm số lần xảy ra trong một khoảng thời gian, thường dùng phân phối Poisson.' },
  { text: 'Chiều cao của cây keo 3 năm tuổi trong một khu rừng', type: 'cont', note: 'Định lượng liên tục: đo được mọi giá trị trong một khoảng, thường xấp xỉ phân phối chuẩn.' },
  { text: 'Số hạt nảy mầm khi gieo 20 hạt đậu', type: 'disc', note: 'Định lượng rời rạc: 20 phép thử độc lập, mỗi hạt nảy mầm hay không, phân phối nhị thức.' },
  { text: 'Hôm nay có mưa hay không', type: 'qual', note: 'Định tính hai giá trị: mã hoá 0/1 thì có phân phối Bernoulli.' },
  { text: 'Lượng mưa trong một ngày (mm)', type: 'cont', note: 'Định lượng liên tục: đo bằng mm, không âm và thường lệch phải.' },
  { text: 'Màu hoa của cây (đỏ, trắng, vàng)', type: 'qual', note: 'Định tính: các nhóm không có thứ tự.' },
  { text: 'Số cánh hoa của một bông hoa', type: 'disc', note: 'Định lượng rời rạc: chỉ nhận giá trị nguyên.' },
];
const TYPES = [['qual', 'Định tính'], ['disc', 'Định lượng rời rạc'], ['cont', 'Định lượng liên tục']];

function natureLab() {
  const touched = once('naturalist');
  const rows = NATURE.map((it) => {
    const res = h('div');
    const btns = TYPES.map(([id, label]) => h('button.chip', { type: 'button', 'aria-pressed': 'false', onclick: () => {
      touched(); btns.forEach((b) => { b.disabled = true; });
      res.replaceChildren(h('p', { style: 'margin-top:6px' }, h(`span.tag${id === it.type ? '.ok' : ''}`, {}, id === it.type ? 'Đúng' : 'Chưa đúng'), ' ', it.note));
    } }, label));
    return h('li.disc-item', {}, h('p', {}, it.text), h('div.chips', { role: 'group', 'aria-label': it.text }, btns), res);
  });

  const data = h('textarea', { id: 'lab-data', rows: 3, placeholder: 'Ví dụ: 12 15 9 14 11 13 (cách nhau bằng dấu cách, xuống dòng hoặc dấu chấm phẩy)' });
  const context = h('input', { type: 'text', id: 'lab-ctx', maxlength: 200, placeholder: 'Ví dụ: chiều cao (cm) của 12 cây cải sau 3 tuần' });
  const stats = h('div'), aiOut = h('div');
  const bStats = h('button.btn', { type: 'button' }, 'Tính thống kê');
  const bAi = h('button.btn.btn-primary', { type: 'button' }, 'Hỏi AI: biến gì, phân phối nào?');
  const read = () => { const v = parseValues(data.value); if (!v.length) { data.focus(); toast('Hãy nhập dữ liệu.'); return null; } return v; };
  const summaryText = (d) => (d.numeric ? `n = ${d.n}; trung bình = ${vn(d.mean)}; độ lệch chuẩn mẫu s = ${vn(d.s)}; trung vị = ${vn(d.median)}; nhỏ nhất = ${vn(d.min)}; lớn nhất = ${vn(d.max)}` : `n = ${d.n}; tần số: ${d.freq.map(([k, c]) => `${k}: ${c}`).join(', ')}`);
  const showStats = (v) => {
    const d = describe(v);
    touched();
    let viz = null;
    if (d.numeric && d.max > d.min) {
      const k = Math.min(10, Math.max(3, Math.ceil(Math.sqrt(d.n)))), w = (d.max - d.min) / k, bins = Array(k).fill(0);
      v.forEach((x) => { bins[Math.min(k - 1, Math.floor((x - d.min) / w))] += 1; });
      viz = chart({ type: 'bars', labels: bins.map((_, i) => vn(d.min + i * w, 1)), values: bins, caption: 'Biểu đồ tần số (cột tính từ cận dưới)' });
    } else if (!d.numeric) viz = chart({ type: 'bars', labels: d.freq.slice(0, 24).map(([k]) => k), values: d.freq.slice(0, 24).map(([, c]) => c), caption: 'Tần số mỗi nhóm' });
    stats.replaceChildren(h('p', {}, summaryText(d)), viz);
    return d;
  };
  bStats.onclick = () => { const v = read(); if (v) showStats(v); };
  bAi.onclick = () => { const v = read(); if (!v) return; const d = showStats(v); run(bAi, aiOut, async () => {
    const r = await ai('classify', { values: v, context: context.value.trim(), summary: summaryText(d) });
    return h('div.reveal', {}, h('h3', {}, 'Loại biến'), rich(`**${r.variable || '—'}**. ${r.why || ''}`), h('h3', {}, 'Phân phối có thể phù hợp'), rich(r.distribution || '—'),
      r.check ? [h('h3', {}, 'Cần kiểm tra'), rich(r.check)] : null, r.next ? [h('h3', {}, 'Em thử tiếp'), rich(r.next)] : null, chart(r.viz));
  }, 'AI đang đọc dữ liệu của em…'); };

  return [h('p.muted', {}, 'Mỗi đại lượng quan sát được trong tự nhiên là loại biến gì?'), h('ol.disc', {}, rows),
    h('h3', {}, 'Dữ liệu của em'),
    h('p.muted', {}, 'Tự đo hoặc đếm (chiều cao cây, số chim, nhiệt độ mỗi trưa…), nhập vào đây. Máy tính thống kê mô tả; AI gợi ý loại biến và phân phối.'),
    h('label.field', { for: context.id }, h('span', {}, 'Em đo gì?'), context),
    h('label.field', { for: data.id, style: 'margin-top:10px' }, h('span', {}, 'Dữ liệu'), data),
    h('div.btn-row', { style: 'margin-top:10px' }, bStats, bAi), stats, aiOut];
}
