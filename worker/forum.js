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

