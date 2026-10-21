// Read images/PDFs as base64 for Gemini (multimodal OCR). Large photos are downscaled to save tokens and upload time.
// Word files are turned into text here (Gemini does not take .docx): those entries carry `text` instead of `data`.
import { docxText } from './docx.js';

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const OK = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_SIDE = 2000;

const toBase64 = (blob) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result).split(',')[1]);
  r.onerror = () => rej(new Error('Không đọc được tệp.'));
  r.readAsDataURL(blob);
});

async function shrink(file) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return file;
  const img = await createImageBitmap(file).catch(() => null);
  if (!img) return file;
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob((b) => res(b || file), 'image/jpeg', 0.86));
}

/** Returns [{ name, mimeType, data, url }] (images/PDF) or [{ name, text }] (Word), or throws a Vietnamese Error. */
export async function readFiles(list) {
  const out = [];
  for (const f of list) {
    const type = f.type || (/\.pdf$/i.test(f.name) ? 'application/pdf' : /\.hei[cf]$/i.test(f.name) ? 'image/heic' : '');
    if (f.size > MAX_BYTES) throw new Error(`"${f.name}" lớn hơn 10 MB.`);
    if (type === DOCX || /\.docx$/i.test(f.name)) { out.push({ name: f.name, text: await docxText(f) }); continue; }
    if (/\.doc$/i.test(f.name) || f.type === 'application/msword') throw new Error(`"${f.name}" là Word đời cũ (.doc). Hãy mở bằng Word, chọn Lưu thành .docx rồi tải lại.`);
    if (!OK.includes(type)) throw new Error(`"${f.name}" không phải ảnh (PNG, JPG, WEBP, HEIC), PDF hoặc Word (.docx).`);
    const blob = type === 'application/pdf' ? f : await shrink(f);
    out.push({
      name: f.name,
      mimeType: blob === f ? type : 'image/jpeg',
      data: await toBase64(blob),
      url: type.startsWith('image/') && !/hei[cf]/.test(type) ? URL.createObjectURL(blob) : null,
    });
  }
  return out;
}
