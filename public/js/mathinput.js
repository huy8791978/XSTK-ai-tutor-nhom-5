// Math symbol toolbar + live KaTeX preview for any textarea.
import { md, typeset } from './md.js';

const GROUPS = [
  ['Cơ bản', [
    ['a⁄b', '\\frac{▢}{▢}', 'Phân số'], ['xⁿ', '^{▢}', 'Lũy thừa'], ['xᵢ', '_{▢}', 'Chỉ số dưới'], ['√', '\\sqrt{▢}', 'Căn bậc hai'],
    ['±', '\\pm ', 'Cộng trừ'], ['×', '\\times ', 'Nhân'], ['·', '\\cdot ', 'Chấm nhân'], ['≤', '\\le ', 'Nhỏ hơn hoặc bằng'],
    ['≥', '\\ge ', 'Lớn hơn hoặc bằng'], ['≠', '\\ne ', 'Khác'], ['≈', '\\approx ', 'Xấp xỉ'], ['∞', '\\infty ', 'Vô cùng'],
  ]],
  ['Xác suất', [
    ['P(A)', 'P(▢)', 'Xác suất'], ['P(A|B)', 'P(▢ \\mid ▢)', 'Xác suất có điều kiện'], ['E(X)', 'E(▢)', 'Kì vọng'],
    ['D(X)', 'D(▢)', 'Phương sai'], ['Cₙᵏ', 'C_{▢}^{▢}', 'Tổ hợp'], ['Aₙᵏ', 'A_{▢}^{▢}', 'Chỉnh hợp'], ['n!', '▢!', 'Giai thừa'],
    ['x̄', '\\bar{▢}', 'Trung bình mẫu'], ['p̂', '\\hat{▢}', 'Ước lượng'], ['∑', '\\sum_{i=1}^{n} ', 'Tổng'],
    ['∫', '\\int_{▢}^{▢} ', 'Tích phân'], ['Φ', '\\Phi(▢)', 'Hàm Laplace / phân phối chuẩn'],
  ]],
  ['Tập hợp', [
    ['∩', '\\cap ', 'Giao'], ['∪', '\\cup ', 'Hợp'], ['Ā', '\\overline{▢}', 'Biến cố đối'], ['∅', '\\varnothing ', 'Rỗng'],
    ['Ω', '\\Omega ', 'Không gian mẫu'], ['∈', '\\in ', 'Thuộc'], ['⊂', '\\subset ', 'Tập con'],
  ]],
  ['Hy Lạp', [
    ['α', '\\alpha ', 'alpha'], ['β', '\\beta ', 'beta'], ['λ', '\\lambda ', 'lambda'], ['μ', '\\mu ', 'mu'], ['σ', '\\sigma ', 'sigma'],
    ['σ²', '\\sigma^2 ', 'sigma bình phương'], ['θ', '\\theta ', 'theta'], ['ρ', '\\rho ', 'rho'], ['χ²', '\\chi^2 ', 'khi bình phương'], ['ε', '\\varepsilon ', 'epsilon'],
  ]],
];

/**
 * Insert a LaTeX snippet at the selection. "▢" marks slots: the selection fills the first slot,
 * the caret lands on the next empty one. Wraps in $…$ unless the caret is already inside math.
 */
export function insertSnippet(value, start, end, snippet) {
  const before = value.slice(0, start), sel = value.slice(start, end), after = value.slice(end);
  const inMath = ((before.match(/(?<!\\)\$/g) || []).length % 2) === 1;
  let body = sel ? snippet.replace('▢', sel) : snippet;
  if (!inMath) body = `$${body.trimEnd()}$`;
  const slot = body.indexOf('▢');
  const clean = body.replace(/▢/g, '');
  return { value: before + clean + after, cursor: start + (slot >= 0 ? slot : clean.length) };
}

const hasMath = (s) => /\$|\\\(|\\\[/.test(s);

/** Build a labelled math-enabled textarea. Returns the wrapper; the textarea is `.querySelector('textarea')`. */
export function mathField({ label, name, placeholder = '', rows = 4, value = '' }) {
  const id = `f-${name}-${Math.random().toString(36).slice(2, 7)}`;
  const wrap = document.createElement('div');
  wrap.className = 'field';
  wrap.innerHTML = `<label class="label" for="${id}">${label}</label>
    <div class="mathbox"><div class="mathbar" role="toolbar" aria-label="Chèn kí hiệu toán học"></div>
    <textarea id="${id}" name="${name}" rows="${rows}" spellcheck="false"></textarea></div>
    <div class="preview rich" aria-live="polite" hidden></div>
    <p class="mathhint">Gõ công thức giữa hai dấu $…$ (ví dụ $P(A\\mid B)$) hoặc bấm các nút kí hiệu.</p>`;
  const bar = wrap.querySelector('.mathbar'), ta = wrap.querySelector('textarea'), pv = wrap.querySelector('.preview');
  ta.placeholder = placeholder; ta.value = value;

  for (const [g, items] of GROUPS) {
    const lab = document.createElement('span'); lab.className = 'grp'; lab.textContent = g; bar.append(lab);
    for (const [text, snip, aria] of items) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = text; b.title = aria; b.setAttribute('aria-label', aria); b.dataset.snip = snip;
      bar.append(b);
    }
  }
  bar.addEventListener('mousedown', (e) => e.preventDefault()); // keep textarea selection on desktop
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const r = insertSnippet(ta.value, ta.selectionStart, ta.selectionEnd, b.dataset.snip);
    ta.value = r.value; ta.focus(); ta.setSelectionRange(r.cursor, r.cursor);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
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
  return wrap;
}
