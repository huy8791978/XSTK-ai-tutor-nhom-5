// Forum rules: pure validation, unit-tested. The Durable Object lives in index.js.
import { TOPICS } from '../public/js/topics.js';

export const FORUM_TOPICS = ['Hỏi đáp chung', ...TOPICS];
const MAX = { title: 150, body: 4000, author: 40 };
const clean = (s) => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();

/** Validate a new thread or reply. Returns the cleaned fields or throws an Error with a Vietnamese message. */
export function validatePost(p = {}, { reply = false } = {}) {
  const out = { body: clean(p.body), author: clean(p.author) || 'Ẩn danh' };
  if (out.body.length < 2) throw new Error('Nội dung quá ngắn.');
  if (out.body.length > MAX.body) throw new Error(`Nội dung tối đa ${MAX.body} kí tự.`);
  if (out.author.length > MAX.author) throw new Error(`Tên tối đa ${MAX.author} kí tự.`);
  if (reply) return out;
  out.title = clean(p.title);
  if (out.title.length < 4) throw new Error('Tiêu đề quá ngắn.');
  if (out.title.length > MAX.title) throw new Error(`Tiêu đề tối đa ${MAX.title} kí tự.`);
  out.topic = FORUM_TOPICS.includes(p.topic) ? p.topic : FORUM_TOPICS[0];
  return out;
}


// ---- Moderator (giảng viên kiểm duyệt). The password is the MODERATOR_PASSWORD secret; a correct password
// returns a signed token "expiry.signature" (HMAC keyed by the password, so changing it logs every moderator out).
export const MOD_TTL = 12 * 3600_000;
const enc = new TextEncoder();
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const hmac = async (secret, msg) => toHex(await crypto.subtle.sign('HMAC',
  await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), enc.encode(msg)));
/** Compare without leaking where the strings differ. */
export function sameText(a, b) {
  const x = enc.encode(String(a)), y = enc.encode(String(b));
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return d === 0;
}
export async function signMod(secret, exp) { return `${exp}.${await hmac(secret, `mod:${exp}`)}`; }
export async function verifyMod(secret, token, now = Date.now()) {
  const [exp, sig] = String(token || '').split('.');
  if (!secret || !sig || !(Number(exp) > now) || Number(exp) > now + MOD_TTL) return false;
  return sameText(sig, await hmac(secret, `mod:${exp}`));
}
