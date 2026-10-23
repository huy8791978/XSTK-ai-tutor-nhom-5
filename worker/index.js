import { DurableObject } from 'cloudflare:workers';
import { admit, settle, estimateTokens } from './limits.js';
import { buildRequest, extractJson, wrongLanguage, LANGUAGE_RETRY } from './prompts.js';
import { validatePost, FORUM_TOPICS, signMod, verifyMod, sameText, MOD_TTL } from './forum.js';
import { buildTts, ttsAudio } from './tts.js';
import { modelList, benchFor, usable, AI_MODELS, TTS_MODELS } from './models.js';

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

    let req, task, lang;
    try {
      const body = await request.json();
      task = body.task; lang = body.payload?.lang === 'en' ? 'en' : 'vi';
      req = buildRequest(task, body.payload);
    } catch (e) {
      return json({ error: e.message || 'Yêu cầu không hợp lệ.' }, 400);
    }

    // Reserve a typical reply size, not the maximum; settle() corrects it with Gemini's real count.
    const tokens = estimateTokens(req.promptChars, req.fileCount, 3000);
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    // Per-visitor speed limit only; the shared quota is counted per model, so one exhausted model never blocks the others.
    const mine = await env.LIMITER.get(env.LIMITER.idFromName('global')).acquire(ip, 0, false, { rpm: 1e9, tpm: 1e15, rpd: 1e9 });
    if (!mine.ok) return json({ error: `Bạn gửi quá nhanh. Vui lòng thử lại sau ${mine.retryAfter} giây.`, retryAfter: mine.retryAfter, reason: 'ip' }, 429, { 'retry-after': String(mine.retryAfter) });

    // One automatic retry for an unreadable/cut-off reply or a reply in the wrong language.
    let failure, firstData;
    for (let attempt = 0; attempt < 2; attempt++) {
      const got = await callModels(env, ctx, req.body, tokens);
      if (!got.ok) { failure = got.response; break; }
      const cand = got.data.candidates?.[0];
      const text = (cand?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
      try {
        const data = extractJson(text);
        // Wrong language (e.g. Vietnamese history pulled an English-mode reply back to Vietnamese): ask once more,
        // with a blunt reminder appended. The second answer is returned whatever it is.
        if (attempt === 0 && task !== 'translate' && task !== 'ocr' && wrongLanguage(data, lang)) {
          console.error('wrong-language', task, lang);
          req.body.contents[0].parts[0].text += LANGUAGE_RETRY[lang];
          firstData = data;
          continue;
        }
        return json({ data });
      } catch (e) {
        // Log the parser's reason and the text around the failing position, not just the start of the reply.
        const pos = Number(/position (\d+)/.exec(e.detail || '')?.[1]);
        const around = Number.isFinite(pos) ? (e.text || text).slice(Math.max(0, pos - 150), pos + 150) : text.slice(-300);
        console.error('unparsable', got.model, task, cand?.finishReason, e.detail, `len=${text.length}`, `…${around}…`);
        failure = json({ error: 'AI trả về nội dung không đọc được. Bấm thử lại.' }, 502);
      }
    }
    if (firstData) return json({ data: firstData }); // retry for language failed: the first answer beats an error
    return failure || json({ error: 'AI tạm thời không phản hồi được. Thử lại sau.' }, 502);
  },
};

/**
 * Ask the strongest model that can answer now. A model that is out of quota (ours or Google's), unavailable or
 * erroring is skipped silently and the next, weaker one answers instead; the student only sees an error when
 * every model has failed. Returns { ok, data, model } or { ok: false, response }.
 */
async function callModels(env, ctx, body, tokens) {
  let wait = Infinity, lastStatus = 0;
  for (const model of usable(modelList(env.GEMINI_MODELS, AI_MODELS), aiBenched, Date.now())) {
    const limiter = env.LIMITER.get(env.LIMITER.idFromName(`model:${model}`));
    const slot = await limiter.acquire('-', tokens, true);
    if (!slot.ok) { wait = Math.min(wait, slot.retryAfter); continue; } // our cap for this model: try the next one
    // The call to Google goes out from a Durable Object pinned to North America: visitors in Vietnam are often
    // served from Cloudflare's Hong Kong edge, and Gemini rejects requests from there ("User location is not supported").
    const res = await gateway(env).generate(model, body);
    const actual = res.data?.usageMetadata?.totalTokenCount;
    if (actual) ctx.waitUntil(limiter.settle(slot.t, actual));
    if (res.status >= 200 && res.status < 300) return { ok: true, data: res.data, model };
    console.error('gemini', model, res.status, res.data?.error?.message);
    lastStatus = res.status || 599; // 0 = network error
    const bench = benchFor(res.status);
    if (bench) aiBenched.set(model, Date.now() + bench);
  }
  if (lastStatus === 400) return { ok: false, response: json({ error: 'AI không xử lí được yêu cầu này (tệp hoặc nội dung không hợp lệ).' }, 400) };
  if (Number.isFinite(wait) && !lastStatus) {
    return { ok: false, response: json({ error: `Hệ thống đang nhiều người dùng. Vui lòng thử lại sau ${wait} giây.`, retryAfter: wait, reason: 'busy' }, 429, { 'retry-after': String(wait) }) };
  }
  return { ok: false, response: json({ error: 'AI tạm thời không phản hồi được. Vui lòng thử lại sau ít phút.', retryAfter: 30, reason: 'upstream' }, 503) };
}
const aiBenched = new Map(); // model → time it may be tried again (per Worker isolate; best effort)

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
  for (const model of modelList(env.GEMINI_TTS_MODELS, TTS_MODELS)) {
    if ((ttsBenched.get(model) || 0) > now) continue;
    let res = await gateway(env).generate(model, body);
    // A model that rejects systemInstruction (400) still reads fine without the style hint.
    if (res.status === 400 && body.systemInstruction) {
      const { systemInstruction, ...plain } = body;
      res = await gateway(env).generate(model, plain);
    }
    const audio = res.status === 200 ? ttsAudio(res.data) : null;
    if (audio) return json({ ...audio, model });
    console.error('tts', model, res.status, res.data?.error?.message);
    // Skip a model that is out of quota or unavailable for a while, so we don't pay a round trip each time.
    // A 400 here (even without the style hint) means the model cannot read aloud at all.
    const bench = res.status === 400 ? 10 * 60_000 : benchFor(res.status);
    if (bench) ttsBenched.set(model, now + bench);
  }
  return json({ error: 'Không tạo được giọng đọc.' }, 502);
}

const ttsBenched = new Map(); // model → time it may be tried again (per Worker isolate; best effort)

/** /api/forum routes:
 *  GET  /api/forum?topic=&before=   list threads     GET  /api/forum/:id          thread + replies
 *  POST /api/forum                  new thread       POST /api/forum/:id/reply    reply
  *  POST /api/forum/delete {kind,id,token|mod}        author deletes own post; a moderator deletes any post
 *  POST /api/forum/mod {password}                    moderator login → {token, exp} */
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
    if (id === 'mod') {
      if (!env.MODERATOR_PASSWORD) return json({ error: 'Máy chủ chưa đặt mật khẩu giảng viên (MODERATOR_PASSWORD).' }, 503);
      await db.guardLogin(ip); // throws after too many wrong passwords from this IP
      if (!sameText(await sha(String(body.password ?? '')), await sha(env.MODERATOR_PASSWORD))) return json({ error: 'Mật khẩu không đúng.' }, 403);
      await db.loginOk(ip);
      const exp = Date.now() + MOD_TTL;
      return json({ token: await signMod(env.MODERATOR_PASSWORD, exp), exp });
    }
    if (id === 'delete') {
      const mod = body.mod ? await verifyMod(env.MODERATOR_PASSWORD, body.mod) : false;
      if (body.mod && !mod) return json({ error: 'Phiên giảng viên đã hết hạn. Hãy nhập lại mật khẩu.', modExpired: true }, 403);
      return json(await db.remove(body.kind, body.id, body.token, mod));
    }
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

  // Wrong moderator passwords: 5 tries per IP per 15 minutes, then wait (stops guessing the password).
  guardLogin(ip) {
    const now = Date.now(), tries = (this.logins?.get(ip) || []).filter((t) => now - t < 15 * 60_000);
    if (tries.length >= 5) throw new Error(`Nhập sai quá nhiều lần. Thử lại sau ${Math.ceil((tries[0] + 15 * 60_000 - now) / 60_000)} phút.`);
    (this.logins ??= new Map()).set(ip, [...tries, now]);
    if (this.logins.size > 5000) this.logins.clear();
  }

  loginOk(ip) { this.logins?.delete(ip); }

  /** The author deletes with their token; a verified moderator (mod = true) deletes any post. */
  async remove(kind, id, token, mod = false) {
    const table = kind === 'reply' ? 'replies' : 'threads', hash = await sha(String(token || ''));
    const [row] = this.sql.exec(`SELECT id, ${kind === 'reply' ? 'thread' : 'id AS thread'} FROM ${table} WHERE id = ?${mod ? '' : ' AND token = ?'}`, ...(mod ? [Number(id)] : [Number(id), hash])).toArray();
    if (!row) throw new Error(mod ? 'Bài viết không còn tồn tại.' : 'Bạn chỉ xoá được bài của chính mình.');
    this.sql.exec(`DELETE FROM ${table} WHERE id = ?`, Number(id));
    if (kind === 'reply') this.sql.exec('UPDATE threads SET replies = replies - 1 WHERE id = ?', row.thread);
    else this.sql.exec('DELETE FROM replies WHERE thread = ?', Number(id));
    return { ok: true };
  }
}
