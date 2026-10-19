// Browser → Worker proxy. The Gemini key never exists in the browser.
export class AIError extends Error {
  constructor(message, retryAfter) { super(message); this.retryAfter = retryAfter; }
}

export async function ai(task, payload = {}) {
  let res;
  try {
    res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task, payload }),
    });
  } catch {
    throw new AIError('Mất kết nối mạng. Kiểm tra Internet rồi thử lại.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new AIError(body.error || `Máy chủ lỗi (${res.status}). Thử lại sau.`, body.retryAfter);
  if (!body.data || typeof body.data !== 'object') throw new AIError('AI trả về dữ liệu trống. Bấm thử lại.');
  return body.data;
}
