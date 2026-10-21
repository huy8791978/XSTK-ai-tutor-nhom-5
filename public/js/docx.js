// Word (.docx) → plain text in the browser, no library: a .docx is a zip; word/document.xml holds the text.
// Equations (OMML) become linear LaTeX-ish text inside $…$ so the AI (and the reader) can follow them.

/** Return the uncompressed bytes of one zip entry, or null when the entry is missing. */
export async function unzipEntry(buf, wanted) {
  const v = new DataView(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('not a zip');
  let p = v.getUint32(eocd + 16, true);
  const count = v.getUint16(eocd + 10, true);
  const dec = new TextDecoder();
  for (let n = 0; n < count && v.getUint32(p, true) === 0x02014b50; n++) {
    const method = v.getUint16(p + 10, true), size = v.getUint32(p + 20, true);
    const nameLen = v.getUint16(p + 28, true), extra = v.getUint16(p + 30, true), comment = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const name = dec.decode(new Uint8Array(buf, p + 46, nameLen));
    if (name === wanted) {
      const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
      const raw = new Uint8Array(buf, start, size);
      if (method === 0) return raw;
      if (method !== 8) throw new Error('unsupported zip method');
      const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    }
    p += 46 + nameLen + extra + comment;
  }
  return null;
}

// OMML → linear math. Only the common structures; anything else falls back to its plain text.
const kids = (el) => [...el.children];
const part = (el, name) => kids(el).find((c) => c.localName === name);
function math(el) {
  const sub = (name) => { const c = part(el, name); return c ? math(c) : ''; };
  switch (el.localName) {
    case 't': return el.textContent;
    case 'f': return `\\frac{${sub('num')}}{${sub('den')}}`;
    case 'sSup': return `${sub('e')}^{${sub('sup')}}`;
    case 'sSub': return `${sub('e')}_{${sub('sub')}}`;
    case 'sSubSup': return `${sub('e')}_{${sub('sub')}}^{${sub('sup')}}`;
    case 'rad': { const d = sub('deg'); return d ? `\\sqrt[${d}]{${sub('e')}}` : `\\sqrt{${sub('e')}}`; }
    case 'd': return `(${kids(el).filter((c) => c.localName === 'e').map(math).join(', ')})`;
    case 'nary': { const op = part(el, 'naryPr')?.getElementsByTagName('m:chr')[0]?.getAttribute('m:val') || '∫'; return `${op}_{${sub('sub')}}^{${sub('sup')}} ${sub('e')}`; }
    case 'rPr': case 'ctrlPr': case 'fPr': case 'sSupPr': case 'sSubPr': case 'radPr': case 'dPr': case 'naryPr': return '';
    default: return kids(el).map(math).join('');
  }
}

/** Paragraph text: runs, tabs, breaks and inline equations, in document order. */
function para(p) {
  let s = '';
  const walk = (el) => {
    for (const c of kids(el)) {
      if (c.localName === 'oMath') s += `$${math(c)}$`;
      else if (c.localName === 't' && c.namespaceURI?.includes('wordprocessingml')) s += c.textContent;
      else if (c.localName === 'tab') s += '\t';
      else if (c.localName === 'br' || c.localName === 'cr') s += '\n';
      else if (c.localName !== 'rPr' && c.localName !== 'pPr') walk(c);
    }
  };
  walk(p);
  return s;
}

/** Plain text of a .docx File/Blob. Throws a Vietnamese Error when it can't be read. */
export async function docxText(file) {
  let xml;
  try { xml = await unzipEntry(await file.arrayBuffer(), 'word/document.xml'); } catch { xml = null; }
  if (!xml) throw new Error(`Không đọc được "${file.name}". Hãy lưu lại dưới dạng .docx rồi tải lên.`);
  const doc = new DOMParser().parseFromString(new TextDecoder().decode(xml), 'application/xml');
  const body = doc.getElementsByTagName('w:body')[0];
  if (!body) throw new Error(`Không đọc được "${file.name}".`);
  const lines = [];
  for (const p of body.getElementsByTagName('w:p')) {
    // Nested paragraphs (text boxes) are read as their own lines; skip the outer copy of their text.
    if (p.getElementsByTagName('w:p').length) continue;
    lines.push(para(p).trimEnd());
  }
  const text = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!text) throw new Error(`"${file.name}" không có chữ để đọc.`);
  return text;
}
