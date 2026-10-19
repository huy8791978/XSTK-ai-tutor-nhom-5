import { DurableObject } from 'cloudflare:workers';
import { admit, settle, estimateTokens } from './limits.js';
import { buildRequest, extractJson } from './prompts.js';

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/ai') return env.ASSETS.fetch(request);
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    // Only our own pages may call the proxy.
    const origin = request.headers.get('origin');
    if (origin && new URL(origin).host !== url.host) return json({ error: 'Nguồn không hợp lệ.' }, 403);
    if (!env.GEMINI_API_KEY) return json({ error: 'Máy chủ chưa cấu hình GEMINI_API_KEY.' }, 500);
    if (Number(request.headers.get('content-length') || 0) > 16_000_000) return json({ error: 'Dữ liệu gửi lên quá lớn.' }, 413);

    let req;
    try {
      const { task, payload } = await request.json();
      req = buildRequest(task, payload);
    } catch (e) {
      return json({ error: e.message || 'Yêu cầu không hợp lệ.' }, 400);
    }

    const tokens = estimateTokens(req.promptChars, req.fileCount, req.body.generationConfig.maxOutputTokens);
    const limiter = env.LIMITER.get(env.LIMITER.idFromName('global'));
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const slot = await limiter.acquire(ip, tokens);
    if (!slot.ok) {
      const msg = { ip: 'Bạn gửi quá nhanh', rpm: 'Hệ thống đang nhiều người dùng', tpm: 'Hệ thống đang xử lí nhiều dữ liệu', rpd: 'Đã hết lượt dùng AI hôm nay' }[slot.reason];
      return json({ error: `${msg}. Vui lòng thử lại sau ${slot.retryAfter} giây.`, retryAfter: slot.retryAfter, reason: slot.reason }, 429, { 'retry-after': String(slot.retryAfter) });
    }

    const model = env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    let res;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify(req.body),
      });
    } catch {
      return json({ error: 'Không kết nối được tới Gemini. Thử lại sau.' }, 502);
    }
    const data = await res.json().catch(() => ({}));
    const actual = data.usageMetadata?.totalTokenCount;
    if (actual) ctx.waitUntil(limiter.settle(slot.t, actual));

    if (res.status === 429) return json({ error: 'Gemini đang quá tải. Vui lòng thử lại sau 30 giây.', retryAfter: 30, reason: 'upstream' }, 429);
    if (!res.ok) {
      console.error('gemini', res.status, data.error?.message);
      return json({ error: 'AI tạm thời không phản hồi được. Thử lại sau.' }, 502);
    }
    const text = (data.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
    try {
      return json({ data: extractJson(text) });
    } catch {
      return json({ error: 'AI trả về nội dung không đọc được. Bấm thử lại.' }, 502);
    }
  },
};

/** One global instance: every request across all visitors passes through it, so RPM/TPM/RPD are exact. */
export class Limiter extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ips = new Map();
    ctx.blockConcurrencyWhile(async () => {
      this.s = (await ctx.storage.get('s')) ?? { window: [], day: '', dayCount: 0 };
    });
  }

  async acquire(ip, tokens) {
    const now = Date.now();
    const perIp = Number(this.env.LIMIT_PER_IP_RPM || 6);
    const mine = (this.ips.get(ip) || []).filter((t) => now - t < 60_000);
    if (mine.length >= perIp) return { ok: false, reason: 'ip', retryAfter: Math.ceil((mine[0] + 60_000 - now) / 1000) };

    const r = admit(this.s, {
      now, tokens,
      rpm: Number(this.env.LIMIT_RPM || 15), tpm: Number(this.env.LIMIT_TPM || 250000), rpd: Number(this.env.LIMIT_RPD || 1000),
    });
    this.s = r.state;
    if (!r.ok) return { ok: false, reason: r.reason, retryAfter: r.retryAfter };

    if (this.ips.size > 5000) this.ips.clear(); // bound memory; per-IP windows are only 60s anyway
    this.ips.set(ip, [...mine, now]);
    await this.ctx.storage.put('s', this.s);
    return { ok: true, t: now };
  }

  async settle(t, actual) {
    this.s = settle(this.s, { t, actual });
    await this.ctx.storage.put('s', this.s);
  }
}
