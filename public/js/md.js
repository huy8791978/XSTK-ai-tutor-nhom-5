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

export function md(src) {
  src = literalBreaks(String(src ?? '')).split('\n').map((l) => (bareMath(l) ? l.replace(/^(\s*(?:[-*•]|\d+[.)])?\s*)(.*?)\s*$/, '$1$$$2$$') : l)).join('\n');
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
}
