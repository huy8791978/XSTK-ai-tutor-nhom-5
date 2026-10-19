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

export function md(src) {
  const math = [];
  // Protect math so * and _ inside formulas are not treated as markdown.
  let s = String(src ?? '').replace(/\r/g, '').replace(MATH, (m) => `\u0000${math.push(m) - 1}\u0000`);
  s = esc(s);

  const out = [];
  let list = null, para = [];
  const flushPara = () => { if (para.length) out.push(`<p>${para.map(inline).join('<br>')}</p>`); para = []; };
  const flushList = () => { if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`); list = null; };

  for (const line of s.split('\n')) {
    const t = line.trim();
    let m;
    if (!t) { flushPara(); flushList(); continue; }
    if ((m = t.match(/^#{1,6}\s+(.*)$/))) { flushPara(); flushList(); out.push(`<h4>${inline(m[1])}</h4>`); continue; }
    if ((m = t.match(/^(?:[-*•]|(\d+)[.)])\s+(.*)$/))) {
      flushPara();
      const tag = m[1] ? 'ol' : 'ul';
      if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
      list.items.push(m[2]);
      continue;
    }
    flushList();
    para.push(t);
  }
  flushPara(); flushList();
  // Vietnamese decimal comma: 0,25 inside math must be 0{,}25 or KaTeX spaces it like punctuation.
  return out.join('').replace(/\u0000(\d+)\u0000/g, (_, i) => esc(math[i].replace(/(\d),(?=\d)/g, '$1{,}')));
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
