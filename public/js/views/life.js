// «Xác suất và cuộc đời»: paradoxes played by hand (Monty Hall, the birthday problem), lottery odds,
// and big questions about chance and decisions answered by the AI with the course's tools.
import { h, rich, list, run, toast } from '../ui.js';
import { ai } from '../api.js';
import { chart } from '../viz.js';
import { useLens } from '../profile.js';

export const meta = { title: 'Xác suất và cuộc đời', lede: 'Những nghịch lí làm trực giác vấp ngã, và những câu hỏi lớn về rủi ro, may mắn, bằng chứng.\nChơi thử, đoán trước, rồi để con số trả lời.' };

const vn = (x, d = 3) => String(+(+x).toFixed(d)).replace('.', ',');
const big = (x) => Math.round(x).toLocaleString('vi-VN');
let marked = false;
const mark = () => { if (!marked) { marked = true; useLens('existential'); } };

/** P(at least two of n people share a birthday), 365 equally likely days. */
export function birthday(n) { let q = 1; for (let i = 0; i < n; i++) q *= (365 - i) / 365; return 1 - q; }
/** C(n, k) as an exact integer for small n. */
export function comb(n, k) { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); }
/** One Monty Hall game: true when the strategy wins the car. */
export function monty(switchDoor, rand = Math.random) { const car = Math.floor(rand() * 3), pick = Math.floor(rand() * 3); return switchDoor ? pick !== car : pick === car; }

export function render(root) {
  root.append(h('div.stack', {},
    h('section.panel', { 'aria-label': 'Monty Hall' }, h('h2', {}, 'Ba cánh cửa (Monty Hall)'), montyGame()),
    h('section.panel', { 'aria-label': 'Nghịch lí ngày sinh' }, h('h2', {}, 'Nghịch lí ngày sinh'), birthdayLab()),
    h('section.panel', { 'aria-label': 'Xổ số' }, h('h2', {}, 'Chọn 6 số trong 45 số'), lottery()),
    h('section.panel', { 'aria-label': 'Câu hỏi lớn' }, h('h2', {}, 'Hỏi một câu lớn'), bigQuestion())));
}

function montyGame() {
  let car, pick, opened, phase = 'pick';
  const tally = { stay: [0, 0], swap: [0, 0] }; // [wins, games]
  const doors = h('div.doors'), msg = h('p'), stats = h('div');
  const reset = () => { car = Math.floor(Math.random() * 3); pick = opened = null; phase = 'pick'; msg.textContent = 'Chọn một cánh cửa. Sau một cửa là ô tô, hai cửa còn lại là dê.'; paint(); };
  const paint = () => doors.replaceChildren(...[0, 1, 2].map((d) => h('button.door', {
    type: 'button', disabled: phase === 'done' || d === opened, 'aria-label': `Cửa ${d + 1}`, 'aria-pressed': String(d === pick),
    onclick: () => choose(d),
  }, h('b', {}, String(d + 1)), h('span', {}, phase === 'done' || d === opened ? (d === car ? '🚗' : '🐐') : '🚪'))));
  const choose = (d) => {
    mark();
    if (phase === 'pick') {
      pick = d;
      const goats = [0, 1, 2].filter((x) => x !== pick && x !== car);
      opened = goats[Math.floor(Math.random() * goats.length)];
      phase = 'decide';
      msg.replaceChildren(`Người dẫn mở cửa ${opened + 1}: là dê. `, 'Em giữ cửa đã chọn hay đổi sang cửa còn lại? Bấm vào cửa em chốt.');
    } else if (phase === 'decide') {
      const swapped = d !== pick; pick = d; phase = 'done';
      const win = pick === car, k = swapped ? 'swap' : 'stay';
      tally[k][1] += 1; tally[k][0] += win;
      msg.replaceChildren(win ? '🎉 Em được ô tô! ' : '🐐 Em được dê. ', swapped ? 'Em đã đổi cửa.' : 'Em đã giữ cửa.');
      showStats();
    }
    paint();
  };
  const showStats = () => stats.replaceChildren(h('p.muted', {}, `Giữ cửa: thắng ${tally.stay[0]}/${tally.stay[1]} · Đổi cửa: thắng ${tally.swap[0]}/${tally.swap[1]}`));
  const sim = h('div');
  const bSim = h('button.btn', { type: 'button', onclick: () => {
    mark();
    let s = 0, w = 0; for (let i = 0; i < 1000; i++) { s += monty(false); w += monty(true); }
    sim.replaceChildren(chart({ type: 'bars', labels: ['Giữ cửa', 'Đổi cửa'], values: [s / 1000, w / 1000], caption: 'Tỉ lệ thắng sau 1000 lần chơi mỗi cách' }),
      rich('Giữ cửa thắng khi lần đầu chọn trúng: $P = \\frac{1}{3}$. Đổi cửa thắng khi lần đầu chọn trượt: $P = \\frac{2}{3}$. Người dẫn **biết** ô tô ở đâu nên việc mở cửa cho em thêm thông tin: đây là xác suất có điều kiện.'));
  } }, 'Mô phỏng 1000 lần');
  reset();
  return [doors, msg, h('div.btn-row', {}, h('button.btn.btn-ghost', { type: 'button', onclick: reset }, 'Chơi ván mới'), bSim), stats, sim];
}

function birthdayLab() {
  const n = h('input', { type: 'range', min: 2, max: 80, value: 23, id: 'life-bd' }), out = h('div');
  const paint = () => {
    const N = +n.value, P = birthday(N);
    out.replaceChildren(h('p', { style: 'font-size:20px;margin:8px 0' }, h('b', {}, `${N} người`), ' → ', h('b', {}, `${vn(P * 100, 1)}%`)),
      chart({ type: 'bars', labels: [10, 20, 23, 30, 40, 50, 60, 70].map(String), values: [10, 20, 23, 30, 40, 50, 60, 70].map(birthday), caption: 'Xác suất có ít nhất 2 người trùng ngày sinh' }));
  };
  n.oninput = () => { mark(); paint(); };
  paint();
  return [h('p.muted', {}, 'Một lớp cần bao nhiêu người để khả năng có hai bạn trùng ngày sinh vượt 50%? Đoán trước rồi kéo thanh.'),
    h('label.field.lab-slider', { for: n.id }, h('span', {}, 'Số người trong lớp'), n), out,
    rich('$P = 1 - \\frac{365 \\cdot 364 \\cdots (365-n+1)}{365^n}$. Chỉ 23 người đã vượt 50%, vì số **cặp** người là $C_{23}^2 = 253$, nhiều hơn ta tưởng.')];
}

function lottery() {
  const total = comb(45, 6), years = total / 365;
  return [rich(`Số cách chọn 6 số trong 45 số: $C_{45}^{6} = ${big(total)}$. Một vé trúng giải đặc biệt với xác suất $\\frac{1}{${big(total)}}$.`),
    h('p', { style: 'margin-top:10px' }, `Mua mỗi ngày một vé, trung bình khoảng ${big(years)} năm mới trúng một lần (kì vọng của phân phối hình học).`),
    h('p.muted', { style: 'margin-top:8px' }, 'Đây chỉ là cách nhìn bằng xác suất, không phải lời khuyên tài chính.')];
}

const EXAMPLES = ['Vì sao người ta vẫn mua vé số dù biết khó trúng?', 'Xét nghiệm dương tính có nghĩa là chắc chắn bị bệnh không?', 'Một chuỗi 5 lần đỏ thì lần sau đen dễ ra hơn không?', 'Làm sao biết một thuốc mới thật sự có tác dụng?'];
function bigQuestion() {
  const q = h('textarea', { id: 'life-q', rows: 3, maxlength: 600, placeholder: 'Ví dụ: Có nên tin một khảo sát chỉ hỏi 100 người không?' });
  const out = h('div');
  const bAsk = h('button.btn.btn-primary', { type: 'button' }, 'Hỏi AI');
  const ask = () => {
    if (!q.value.trim()) { q.focus(); return toast('Hãy nhập câu hỏi.'); }
    run(bAsk, out, async () => {
      const d = await ai('life', { question: q.value.trim() });
      mark();
      return h('div.reveal', {}, rich(d.answer || ''), chart(d.viz), d.think?.length ? [h('h3', {}, 'Suy ngẫm tiếp'), list(d.think)] : null);
    }, 'AI đang suy ngẫm…');
  };
  bAsk.onclick = ask;
  return [h('p.muted', {}, 'Câu hỏi về may rủi, rủi ro, bằng chứng, công bằng… AI trả lời bằng công cụ của môn học.'),
    h('div.chips', { style: 'margin:8px 0 12px' }, EXAMPLES.map((x) => h('button.chip', { type: 'button', onclick: () => { q.value = x; ask(); } }, x))),
    h('label.field', { for: q.id }, h('span', {}, 'Câu hỏi của em'), q), h('div.btn-row', { style: 'margin-top:10px' }, bAsk), out];
}
