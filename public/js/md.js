// Minimal, safe markdown for AI output: everything is HTML-escaped first; math is left for KaTeX.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

const MATH = /\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$/g;

function inline(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

// A line of LaTeX the model forgot to put in $…$ (commands present, no ordinary words outside \text{}).
const LIST_HEAD = /^(\s*(?:[-*•]|\d+[.)])?\s*)/;
function bareMath(line) {
  if (line.includes('$') || !/\\[a-zA-Z]+/.test(line)) return false;
  const rest = line.replace(LIST_HEAD, '').replace(/\\text\{[^}]*\}/g, '').replace(/\\[a-zA-Z]+/g, '');
  return !/[A-Za-zÀ-ỹ]{3,}/.test(rest);
}

// The model sometimes double-escapes line breaks, so the text holds a literal backslash-n. Outside $…$ that is
// never LaTeX, so turn it into a real line break; inside math (\neq, \nu…) leave it alone.
const literalBreaks = (s) => s.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/).map((part, i) => (i % 2 ? part : part.replace(/\\n/g, '\n'))).join('');

// An odd number of $ on a line means the model opened a formula and never closed it (or left a stray $):
// close it at the end of the line when what follows is LaTeX, else drop the stray $.
function balance(line) {
  return line.split(/(\$\$.*?\$\$)/).map((p, k) => {
    if (k % 2) return p;
    const at = [...p.matchAll(/(?<!\\)\$/g)].map((m) => m.index);
    if (at.length % 2 === 0) return p;
    const last = at.at(-1), after = p.slice(last + 1);
    if (!/\\[a-zA-Z]|[_^{]/.test(after)) return p.slice(0, last) + after;
    const [, body, tail] = after.match(/^(.*?)([.,;:!?]*\s*)$/s);
    return `${p.slice(0, last + 1)}${body}$${tail}`;
  }).join('');
}

// LaTeX typed straight into a sentence without $ ("tra bảng t_{\alpha/2}(n-1) ứng với…"): wrap each run of
// formula tokens in $…$, leaving the words around it alone.
// A formula token: x_{…}, x^2, a command with its argument (\frac{…}, \bar{x}) or a known symbol (\alpha, \le).
// A bare "\frac" mentioned in prose is not a formula.
const ARGCMD = 'frac|dfrac|tfrac|sqrt|bar|overline|hat|widehat|tilde|vec|text|mathrm|mathbf|binom|operatorname';
const SYMCMD = 'alpha|beta|gamma|delta|epsilon|varepsilon|theta|lambda|mu|nu|pi|rho|sigma|tau|phi|varphi|chi|psi|omega|Omega|Delta|Sigma|Phi|Gamma|cup|cap|mid|le|leq|ge|geq|ne|neq|sim|cdot|times|infty|sum|prod|int|pm|to|in|notin|approx|subset|emptyset|varnothing|ldots|cdots';
const STRONG = new RegExp(`\\\\(?:${ARGCMD})\\s*[{[]|\\\\(?:${SYMCMD})(?![a-zA-Z])|[_^]\\{|[A-Za-z0-9)}][_^][A-Za-z0-9({\\\\]`);
const GLUE =/^(?:[-+=<>≤≥×·*/|,:]|\(?[0-9A-Za-z]{1,2}\)?|\d+(?:[.,]\d+)?)$/;
function wrapBare(line) {
  if (line.includes('$') || !STRONG.test(line)) return line;
  const tok = line.split(/(\s+)/);
  const strong = tok.map((t) => STRONG.test(t));
  for (let i = 0; i < tok.length; i++) {
    if (!strong[i]) continue;
    let j = i;
    for (let k = i + 1; k < tok.length; k++) {
      if (strong[k]) j = k;
      else if (!/^\s+$/.test(tok[k]) && !GLUE.test(tok[k])) break;
    }
    const [, core, punct] = tok[j].match(/^(.*?)([.,;:!?]*)$/s);
    if (i === j) tok[i] = `$${core}$${punct}`;
    else { tok[i] = `$${tok[i]}`; tok[j] = `${core}$${punct}`; }
    i = j;
  }
  return tok.join('');
}

export function md(src) {
  src = literalBreaks(String(src ?? '')).split('\n')
    .map((l) => (bareMath(l) ? l.replace(/^(\s*(?:[-*•]|\d+[.)])?\s*)(.*?)\s*$/, '$1$$$2$$') : wrapBare(balance(l)))).join('\n');
  const math = [];
  // Protect math so * and _ inside formulas are not treated as markdown.
  let s = String(src ?? '').replace(/\r/g, '').replace(MATH, (m) => `\u0000${math.push(m) - 1}\u0000`);
  s = esc(s);

  const out = [];
  let list = null, para = [];
  const flushPara = () => { if (para.length) out.push(`<p>${para.map(inline).join('<br>')}</p>`); para = []; };
  // An ordered list keeps its first number, so "3. Trình bày" after a bullet list is not renumbered "1.".
  const flushList = () => { if (list) out.push(`<${list.tag}${list.start > 1 ? ` start="${list.start}"` : ''}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`); list = null; };

  for (const line of s.split('\n')) {
    const t = line.trim();
    let m;
    if (!t) { flushPara(); flushList(); continue; }
    if ((m = t.match(/^#{1,6}\s+(.*)$/))) { flushPara(); flushList(); out.push(`<h4>${inline(m[1])}</h4>`); continue; }
    if ((m = t.match(/^(?:[-*•]|(\d+)[.)])\s+(.*)$/))) {
      flushPara();
      const tag = m[1] ? 'ol' : 'ul';
      if (!list || list.tag !== tag) { flushList(); list = { tag, items: [], start: Number(m[1]) || 1 }; }
      list.items.push(m[2]);
      continue;
    }
    flushList();
    para.push(t);
  }
  flushPara(); flushList();
  // Inside math: 0,25 must be 0{,}25 (else KaTeX spaces it like punctuation), and a bare % starts a LaTeX comment.
  const fixMath = (m) => m.replace(/(\d),(?=\d)/g, '$1{,}').replace(/(?<!\\)%/g, '\\%');
  return out.join('').replace(/\u0000(\d+)\u0000/g, (_, i) => esc(fixMath(math[i])));
}

/** Render KaTeX inside an element (no-op if the CDN failed; raw LaTeX stays readable). */
export function typeset(el) {
  if (typeof window === 'undefined' || !window.renderMathInElement) return;
  window.renderMathInElement(el, {
    delimiters: [
      { left: '$$', right: '$$', display: true }, { left: '\\[', right: '\\]', display: true },
      { left: '$', right: '$', display: false }, { left: '\\(', right: '\\)', display: false },
    ],
    throwOnError: false,
  });
  // Last line of defence: LaTeX that still was not rendered (broken delimiters, KaTeX error) is shown as
  // readable Unicode text instead of raw "\frac{s}{\sqrt{n}}".
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (/\\[a-zA-Z]{2,}/.test(n.nodeValue) && !n.parentElement?.closest('.katex, code, kbd, math-field, textarea') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const left = [];
  while (walk.nextNode()) left.push(walk.currentNode);
  for (const n of left) n.nodeValue = n.nodeValue.replace(/\$+/g, '').replace(/\\[a-zA-Z]+(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})*|[A-Za-z0-9)][_^](?:\{[^{}]*\}|\w)/g, (m) => texToText(m));
  el.querySelectorAll('.katex-error').forEach((e) => { e.replaceWith(document.createTextNode(texToText(e.textContent))); });
}


// ---- LaTeX → readable Unicode, for places where KaTeX can't be laid out (Safari mis-places KaTeX inside SVG
// foreignObject, so the mind map shows plain-text math there). Covers the notation used in this course.
const SYM = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', theta: 'θ', lambda: 'λ', mu: 'μ', nu: 'ν', pi: 'π',
  rho: 'ρ', sigma: 'σ', tau: 'τ', varphi: 'φ', phi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω', Omega: 'Ω', Delta: 'Δ', Sigma: 'Σ', Phi: 'Φ', Gamma: 'Γ',
  cup: '∪', cap: '∩', mid: '|', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', sim: '~', cdot: '·', times: '×', infty: '∞',
  sum: 'Σ', prod: 'Π', int: '∫', pm: '±', to: '→', in: '∈', notin: '∉', approx: '≈', subset: '⊂', emptyset: '∅', varnothing: '∅',
  ldots: '…', cdots: '…', dots: '…', quad: ' ', qquad: '  ', ',': ' ', ';': ' ', ' ': ' ', '%': '%', '{': '\u0001', '}': '\u0002', lvert: '|', rvert: '|',
  forall: '∀', exists: '∃', Leftrightarrow: '⇔', Rightarrow: '⇒', iff: '⇔', implies: '⇒', max: 'max', min: 'min',
};
const OPS = new Set(['cup', 'cap', 'mid', 'le', 'leq', 'ge', 'geq', 'ne', 'neq', 'times', 'approx', 'in', 'notin', 'subset', 'to', 'pm', 'Leftrightarrow', 'Rightarrow', 'iff', 'implies']);
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻', '(': '⁽', ')': '⁾', n: 'ⁿ', i: 'ⁱ', '*': '*' };
const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', '+': '₊', '-': '₋', a: 'ₐ', e: 'ₑ', o: 'ₒ', x: 'ₓ', i: 'ᵢ', j: 'ⱼ', n: 'ₙ', k: 'ₖ', m: 'ₘ', p: 'ₚ', t: 'ₜ' };
const script = (s, map, mark) => ([...s].every((c) => map[c]) ? [...s].map((c) => map[c]).join('') : /^[A-Za-z0-9]+$/.test(s) ? `${mark}${s}` : `${mark}(${s})`);
const ARG = '\\{((?:[^{}]|\\{[^{}]*\\})*)\\}'; // one brace group, one level of nesting
const wrap = (a) => (/^(\w+|\|[^|]+\|)$/.test(a) ? a : `(${a})`);
function texToText(t) {
  let s = t.replace(/\\mathbb\{R\}/g, 'ℝ').replace(/\\(left|right|bigl|bigr|big|Big|displaystyle|text|mathrm|mathbf|mathbb|operatorname)\b/g, '');
  for (let k = 0; k < 4; k++) { // inner groups first
    s = s.replace(new RegExp(`\\\\d?frac${ARG}${ARG}`, 'g'), (_, a, b) => `${wrap(a)}/${wrap(b)}`)
      .replace(new RegExp(`\\\\sqrt${ARG}`, 'g'), (_, a) => `√${wrap(a)}`)
      .replace(new RegExp(`\\\\(overline|bar|hat|widehat)${ARG}`, 'g'), (_, cmd, a) => [...a].map((c) => c + (/hat/.test(cmd) ? '̂' : '̄')).join(''))
      .replace(/\\(?:bar|overline)\s*(\w)/g, (_, a) => `${a}̄`);
  }
  s = s.replace(/\\([A-Za-z]+|[,;%{} ])/g, (_, c) => (OPS.has(c) ? ` ${SYM[c]} ` : SYM[c] ?? c))
    .replace(new RegExp(`\\^${ARG}|\\^(\\S)`, 'g'), (_, a, b) => script(a ?? b, SUP, '^'))
    .replace(new RegExp(`_${ARG}|_(\\S)`, 'g'), (_, a, b) => script(a ?? b, SUB, '_'))
    .replace(/[{}]/g, '').replace(/\u0001/g, '{').replace(/\u0002/g, '}'); // \{ \} are literal braces
  return s.replace(/\s+/g, ' ').trim();
}
/** Replace every $…$ / $$…$$ in markdown by plain Unicode text. */
export const plainMath = (src) => String(src ?? '').replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (_, a, b) => texToText(a ?? b));
