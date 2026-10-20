import { DurableObject } from 'cloudflare:workers';
import { admit, settle, estimateTokens } from './limits.js';
import { buildRequest, extractJson } from './prompts.js';
import { validatePost, FORUM_TOPICS } from './forum.js';
import { buildTts, ttsAudio } from './tts.js';

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    // Only our own pages may call the API.
    const origin = request.headers.get('origin');
    if (origin && new URL(origin).host !== url.host) return json({ error: 'Nguồn không hợp lệ.' }, 403);
    if (url.pathname.startsWith('/api/forum')) return forum(request, env, url);
    if (url.pathname === '/api/tts' && request.method === 'POST') return tts(request, env);
    if (url.pathname !== '/api/ai') return json({ error: 'Không tìm thấy.' }, 404);
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    if (!env.GEMINI_API_KEY) return json({ error: 'Máy chủ chưa cấu hình GEMINI_API_KEY.' }, 500);
    if (Number(request.headers.get('content-length') || 0) > 16_000_000) return json({ error: 'Dữ liệu gửi lên quá lớn.' }, 413);

    let req, task;
    try {
      const body = await request.json();
      task = body.task;
      req = buildRequest(task, body.payload);
    } catch (e) {
      return json({ error: e.message || 'Yêu cầu không hợp lệ.' }, 400);
    }

    // Reserve a typical reply size, not the maximum; settle() corrects it with Gemini's real count.
    const tokens = estimateTokens(req.promptChars, req.fileCount, 3000);
    const limiter = env.LIMITER.get(env.LIMITER.idFromName('global'));
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const model = env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

    // One automatic retry for a transient Gemini error or an unreadable/cut-off reply.
    let failure;
    for (let attempt = 0; attempt < 2; attempt++) {
      const slot = await limiter.acquire(ip, tokens, attempt > 0);
      if (!slot.ok) {
        if (attempt > 0) break;
        const msg = { ip: 'Bạn gửi quá nhanh', rpm: 'Hệ thống đang nhiều người dùng', tpm: 'Hệ thống đang xử lí nhiều dữ liệu', rpd: 'Đã hết lượt dùng AI hôm nay' }[slot.reason];
        return json({ error: `${msg}. Vui lòng thử lại sau ${slot.retryAfter} giây.`, retryAfter: slot.retryAfter, reason: slot.reason }, 429, { 'retry-after': String(slot.retryAfter) });
      }
      // The call to Google goes out from a Durable Object pinned to North America: visitors in Vietnam are often
      // served from Cloudflare's Hong Kong edge, and Gemini rejects requests from there ("User location is not supported").
      const res = await gateway(env).generate(model, req.body);
      if (res.status === 0) {
        failure = json({ error: 'Không kết nối được tới Gemini. Thử lại sau.' }, 502);
        continue;
      }
      const data = res.data;
      const actual = data.usageMetadata?.totalTokenCount;
      if (actual) ctx.waitUntil(limiter.settle(slot.t, actual));

      if (res.status === 429) return json({ error: 'Gemini đang quá tải. Vui lòng thử lại sau 30 giây.', retryAfter: 30, reason: 'upstream' }, 429);
      if (res.status < 200 || res.status >= 300) {
        console.error('gemini', res.status, data.error?.message);
        failure = json({ error: 'AI tạm thời không phản hồi được. Thử lại sau.' }, 502);
        if (res.status >= 500) continue;
        return failure;
      }
      const cand = data.candidates?.[0];
      const text = (cand?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
      try {
        return json({ data: extractJson(text) });
      } catch (e) {
        // Log the parser's reason and the text around the failing position, not just the start of the reply.
        const pos = Number(/position (\d+)/.exec(e.detail || '')?.[1]);
        const around = Number.isFinite(pos) ? (e.text || text).slice(Math.max(0, pos - 150), pos + 150) : text.slice(-300);
        console.error('unparsable', task, cand?.finishReason, e.detail, `len=${text.length}`, `…${around}…`);
        failure = json({ error: 'AI trả về nội dung không đọc được. Bấm thử lại.' }, 502);
      }
    }
    return failure || json({ error: 'AI tạm thời không phản hồi được. Thử lại sau.' }, 502);
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

  /** limits overrides { perIp, rpm, tpm, rpd } (the TTS counter uses its own, smaller quota). */
  async acquire(ip, tokens, retry = false, limits = {}) {
    const now = Date.now();
    const perIp = Number(limits.perIp ?? this.env.LIMIT_PER_IP_RPM ?? 6);
    const mine = (this.ips.get(ip) || []).filter((t) => now - t < 60_000);
    if (!retry && mine.length >= perIp) return { ok: false, reason: 'ip', retryAfter: Math.ceil((mine[0] + 60_000 - now) / 1000) };

    const r = admit(this.s, {
      now, tokens,
      rpm: Number(limits.rpm ?? this.env.LIMIT_RPM ?? 15), tpm: Number(limits.tpm ?? this.env.LIMIT_TPM ?? 250000), rpd: Number(limits.rpd ?? this.env.LIMIT_RPD ?? 1000),
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

  /** Gemini call made from wherever this instance lives (the "gateway" instance is pinned to North America). */
  async generate(model, body) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': this.env.GEMINI_API_KEY },
        body: JSON.stringify(body),
      });
      return { status: res.status, data: await res.json().catch(() => ({})) };
    } catch {
      return { status: 0, data: {} };
    }
  }
}

// A Durable Object is created where its location hint says and stays there. The global limiter was created
// near its first visitor (possibly Asia), so Gemini calls use a separate instance created in eastern North America.
const gateway = (env) => env.LIMITER.get(env.LIMITER.idFromName('gemini-gateway-enam'), { locationHint: 'enam' });

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const sha = async (s) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));

/** POST /api/tts { text, gender, lang } → { mime, data } audio from Gemini TTS. Own quota, so reading answers aloud
 *  never eats into the AI-answer limits; any failure tells the browser to fall back to its built-in voice. */
async function tts(request, env) {
  if (!env.GEMINI_API_KEY) return json({ error: 'Máy chủ chưa cấu hình GEMINI_API_KEY.' }, 500);
  if (Number(request.headers.get('content-length') || 0) > 20_000) return json({ error: 'Nội dung quá dài để đọc.' }, 413);
  let body;
  try { body = buildTts(await request.json()); } catch (e) { return json({ error: e.message }, 400); }

  const counter = env.LIMITER.get(env.LIMITER.idFromName('tts'));
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const slot = await counter.acquire(ip, 1, false, {
    perIp: env.LIMIT_TTS_PER_IP_RPM ?? 6, rpm: env.LIMIT_TTS_RPM ?? 10, rpd: env.LIMIT_TTS_RPD ?? 100, tpm: 1e9,
  });
  if (!slot.ok) return json({ error: 'Hết lượt đọc giọng AI, dùng giọng của máy.', retryAfter: slot.retryAfter }, 429);

  // Newest model first; each has its own Google quota. A model that is out of quota (429) or unavailable
  // (400/403/404) is skipped and the next, older one is tried.
  const now = Date.now();
  for (const model of ttsModels(env)) {
    if ((ttsBenched.get(model) || 0) > now) continue;
    const res = await gateway(env).generate(model, body);
    const audio = res.status === 200 ? ttsAudio(res.data) : null;
    if (audio) return json({ ...audio, model });
    console.error('tts', model, res.status, res.data?.error?.message);
    // Out of quota: skip this model for a minute (per-minute limits) so we don't pay a round trip each time.
    if (res.status === 429) ttsBenched.set(model, now + 60_000);
    else if ([400, 403, 404].includes(res.status)) ttsBenched.set(model, now + 10 * 60_000);
  }
  return json({ error: 'Không tạo được giọng đọc.' }, 502);
}

// Comma-separated in wrangler.toml so models can be added or reordered without code changes.
const ttsModels = (env) => String(env.GEMINI_TTS_MODELS || 'gemini-3.8-flash-tts,gemini-3.8-flash-lite-tts,gemini-3.1-flash-tts-preview,gemini-2.5-flash-preview-tts')
  .split(',').map((s) => s.trim()).filter(Boolean);
const ttsBenched = new Map(); // model → time it may be tried again (per Worker isolate; best effort)

/** /api/forum routes:
 *  GET  /api/forum?topic=&before=   list threads     GET  /api/forum/:id          thread + replies
 *  POST /api/forum                  new thread       POST /api/forum/:id/reply    reply
 *  POST /api/forum/delete {kind,id,token}            author deletes own post */
async function forum(request, env, url) {
  const db = env.FORUM.get(env.FORUM.idFromName('global'));
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const [, , , id, action] = url.pathname.split('/');
  try {
    if (request.method === 'GET') {
      if (id) return json(await db.get(id));
      return json({ threads: await db.list({ topic: url.searchParams.get('topic'), before: url.searchParams.get('before') }), topics: FORUM_TOPICS });
    }
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    if (Number(request.headers.get('content-length') || 0) > 32_000) return json({ error: 'Bài viết quá dài.' }, 413);
    const body = await request.json();
    if (id === 'delete') return json(await db.remove(body.kind, body.id, body.token));
    if (id && action === 'reply') return json(await db.reply(id, body, ip));
    if (!id) return json(await db.create(body, ip));
    return json({ error: 'Không tìm thấy.' }, 404);
  } catch (e) {
    // Errors thrown inside the Durable Object arrive here with their Vietnamese message intact.
    return json({ error: e.message || 'Lỗi diễn đàn.' }, 400);
  }
}

/** One global forum instance; SQLite storage (free plan). The author keeps a random token to delete their own post. */
export class Forum extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.ips = new Map();
    this.sql.exec(`CREATE TABLE IF NOT EXISTS threads (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, body TEXT, author TEXT, topic TEXT, created INTEGER, last INTEGER, replies INTEGER DEFAULT 0, token TEXT);
      CREATE TABLE IF NOT EXISTS replies (id INTEGER PRIMARY KEY AUTOINCREMENT, thread INTEGER, body TEXT, author TEXT, created INTEGER, token TEXT);
      CREATE INDEX IF NOT EXISTS replies_thread ON replies(thread);`);
  }

  throttle(ip) {
    const now = Date.now(), mine = (this.ips.get(ip) || []).filter((t) => now - t < 60_000);
    if (mine.length >= Number(this.env.FORUM_PER_IP_RPM || 5)) throw new Error('Bạn đăng quá nhanh. Đợi một phút rồi thử lại.');
    if (this.ips.size > 5000) this.ips.clear();
    this.ips.set(ip, [...mine, now]);
  }

  list({ topic, before } = {}) {
    const args = [], where = [];
    if (FORUM_TOPICS.includes(topic)) { where.push('topic = ?'); args.push(topic); }
    if (Number(before) > 0) { where.push('last < ?'); args.push(Number(before)); }
    return this.sql.exec(`SELECT id, title, substr(body, 1, 200) AS preview, author, topic, created, last, replies FROM threads
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY last DESC LIMIT 30`, ...args).toArray();
  }

  get(id) {
    const [thread] = this.sql.exec('SELECT id, title, body, author, topic, created, replies FROM threads WHERE id = ?', Number(id)).toArray();
    if (!thread) throw new Error('Không tìm thấy bài viết.');
    return { thread, replies: this.sql.exec('SELECT id, body, author, created FROM replies WHERE thread = ? ORDER BY id LIMIT 500', thread.id).toArray() };
  }

  async create(p, ip) {
    const v = validatePost(p);
    this.throttle(ip);
    const token = crypto.randomUUID(), now = Date.now();
    const [{ id }] = this.sql.exec('INSERT INTO threads (title, body, author, topic, created, last, token) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
      v.title, v.body, v.author, v.topic, now, now, await sha(token)).toArray();
    return { id, token };
  }

  async reply(id, p, ip) {
    const v = validatePost(p, { reply: true });
    this.get(id);
    this.throttle(ip);
    const token = crypto.randomUUID(), now = Date.now();
    const [{ id: rid }] = this.sql.exec('INSERT INTO replies (thread, body, author, created, token) VALUES (?, ?, ?, ?, ?) RETURNING id', Number(id), v.body, v.author, now, await sha(token)).toArray();
    this.sql.exec('UPDATE threads SET replies = replies + 1, last = ? WHERE id = ?', now, Number(id));
    return { id: rid, token };
  }

  async remove(kind, id, token) {
    const table = kind === 'reply' ? 'replies' : 'threads', hash = await sha(String(token || ''));
    const [row] = this.sql.exec(`SELECT id, ${kind === 'reply' ? 'thread' : 'id AS thread'} FROM ${table} WHERE id = ? AND token = ?`, Number(id), hash).toArray();
    if (!row) throw new Error('Bạn chỉ xoá được bài của chính mình.');
    this.sql.exec(`DELETE FROM ${table} WHERE id = ?`, Number(id));
    if (kind === 'reply') this.sql.exec('UPDATE threads SET replies = replies - 1 WHERE id = ?', row.thread);
    else this.sql.exec('DELETE FROM replies WHERE thread = ?', Number(id));
    return { ok: true };
  }
}
