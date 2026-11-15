// Formula Q&A export: the formulas read so far, as a Word file (MathML that Word turns into real equations) or a
// print-ready page for «Save as PDF». Everything is made in the browser; nothing is sent anywhere.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KATEX_CSS = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';

/**
 * The document: title, date, then each formula numbered, drawn by `render(tex)` (MathML for Word, KaTeX HTML for
 * the PDF page) with its LaTeX source underneath. `word` adds the Office namespaces Word expects in a .doc.
 */
export function formulaDoc(items, { title, date, render, word = false }) {
  if (!items.length) throw new Error('Chưa có công thức nào để xuất.');
  const head = word
    ? '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
    : '<!doctype html><html>';
  return `${head}<head><meta charset="utf-8"><title>${esc(title)}</title>${word ? '' : `<link rel="stylesheet" href="${KATEX_CSS}">`}
<style>body{font-family:"Be Vietnam Pro","Segoe UI",Arial,sans-serif;color:#141833;margin:24px}h1{font-size:22pt;margin:0 0 4px}.date{color:#5A6185;margin:0 0 18px}
.f{margin:14px 0;page-break-inside:avoid;break-inside:avoid}.n{font-weight:700;color:#1B2A8C}.src{font-family:Consolas,monospace;font-size:9pt;color:#5A6185;margin:2px 0 0}
.katex-display{margin:6px 0}</style></head><body>
<h1>${esc(title)}</h1><p class="date">${esc(date)}</p>
${items.map((tex, i) => `<div class="f"><p class="n">${i + 1}.</p>${render(tex)}<p class="src">${esc(tex)}</p></div>`).join('\n')}
</body></html>`;
}

export const fileName = (ext, d = new Date()) => `cong-thuc-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.${ext}`;

/** LaTeX of every formula the tutor showed in `thread`, in order, without repeats in a row. */
export function collectFormulas(thread) {
  const out = [];
  for (const a of thread.querySelectorAll('.msg.ai .katex-mathml annotation[encoding="application/x-tex"]')) {
    const tex = a.textContent.trim();
    if (tex && out.at(-1) !== tex) out.push(tex);
  }
  return out;
}

const today = () => new Date().toLocaleDateString('vi-VN');
const mathml = (tex) => window.katex.renderToString(tex, { output: 'mathml', displayMode: true, throwOnError: false }).replace(/^<span class="katex">|<\/span>$/g, '');

/** Word: an HTML .doc; Word converts the MathML into editable equations. */
export function downloadWord(items, title) {
  const html = formulaDoc(items, { title, date: today(), render: mathml, word: true });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob(['﻿', html], { type: 'application/msword' })), download: fileName('doc') });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** PDF: a clean page with the formulas, opened in a new tab with the print dialog (choose «Save as PDF»). */
export function printPdf(items, title) {
  const html = formulaDoc(items, { title, date: today(), render: (tex) => window.katex.renderToString(tex, { displayMode: true, throwOnError: false }) });
  const w = window.open('', '_blank');
  if (!w) throw new Error('Trình duyệt đã chặn cửa sổ mới. Hãy cho phép cửa sổ bật lên rồi bấm lại.');
  w.document.open(); w.document.write(html); w.document.close();
  // Print once the formula fonts are in, so the PDF does not catch half-drawn symbols.
  const go = () => { w.focus(); w.print(); };
  w.addEventListener('load', () => (w.document.fonts?.ready ?? Promise.resolve()).then(go));
}
