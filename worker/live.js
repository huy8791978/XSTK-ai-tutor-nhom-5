// Gemini Live (real-time voice) relay: the browser talks to us over a WebSocket, we talk to Google's Live API
// (the key never leaves the server). Models are tried strongest → weakest; when one fails to start, runs out of
// quota or drops mid-conversation, the next one takes over silently with the conversation so far.
// No Cloudflare APIs here: connect() is injected, so the relay is unit-tested with fake sockets.
import { TTS_VOICES } from './tts.js';
import { SPOKEN_MATH } from './spoken.js';

export const LIVE_MODELS = 'gemini-3.8-live,gemini-3.8-live-extended-thinking,gemini-3-flash-live,gemini-2.5-flash-native-audio-dialog,gemini-2.5-flash-native-audio-preview-12-2025,gemini-2.5-flash-native-audio-preview-09-2025,gemini-live-2.5-flash-preview';
export const LIVE_URL = 'https://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

/**
 * Configured order first (only names Google really serves, when the list of served models is known), then any
 * other served Live model, newest version first. Translate/transcribe-only models are never used for dialogue.
 */
export function orderLive(configured, served) {
  if (!served?.length) return configured;
  const ok = served.filter((m) => !/translate|transcribe/i.test(m));
  const ver = (m) => Number(/(\d+(?:\.\d+)?)/.exec(m)?.[1] || 0);
  const rest = ok.filter((m) => !configured.includes(m)).sort((a, b) => ver(b) - ver(a) || /thinking/i.test(a) - /thinking/i.test(b));
  return [...configured.filter((m) => ok.includes(m)), ...rest];
}

export const SHOW_MATH = {
  name: 'show_math',
  description: 'Hiện công thức toán ở dạng viết (LaTeX) trên màn hình cho sinh viên. Gọi mỗi khi bạn đọc hoặc nhắc tới một công thức, đúng lúc nói tới nó.',
  parameters: {
    type: 'OBJECT',
    properties: {
      latex: { type: 'STRING', description: 'Công thức bằng LaTeX, không có dấu $ bao quanh. Ví dụ: P(A+B)=P(A)+P(B)-P(AB)' },
      caption: { type: 'STRING', description: 'Tên ngắn của công thức, ví dụ «Công thức cộng». Có thể bỏ trống.' },
    },
    required: ['latex'],
  },
};

const PERSONA = {
  voice: {
    vi: (g) => `Bạn là ${g === 'male' ? 'THẦY giáo (xưng «thầy»)' : 'CÔ giáo (xưng «cô»)'} dạy môn Xác suất Thống kê, đang trò chuyện bằng giọng nói với một sinh viên (gọi là «em»). Nói tiếng Việt tự nhiên, ngắn gọn (tối đa 4 câu mỗi lượt), rõ ràng, ấm áp.
Với bài toán: dẫn dắt theo 4 bước Polya (tìm hiểu đề, xây dựng chương trình giải, trình bày, kiểm tra), không đưa ngay đáp số trừ khi sinh viên đã tự làm.
Đọc công thức bằng lời đầy đủ (ví dụ «P của A hợp B bằng P của A cộng P của B trừ P của A giao B») và gọi công cụ show_math để công thức TRỌN VẸN hiện lên màn hình. Khi sinh viên đọc một công thức bằng lời, hiểu và viết nó theo hướng dẫn sau.
${SPOKEN_MATH.vi}
Nếu không nghe rõ hoặc câu nói không liên quan môn học, nói ngắn gọn rằng chưa nghe rõ và mời sinh viên nói lại hoặc gõ vào ô bên dưới.`,
    en: (g) => `You are a ${g === 'male' ? 'male' : 'female'} Probability & Statistics teacher talking with a student by voice. Speak natural English only (never Vietnamese), briefly (at most 4 sentences per turn), clearly and warmly.
For problems, guide through Polya's 4 steps (understand, plan, carry out, look back); do not give the final answer unless the student has tried.
Read formulas fully in words and call the show_math tool so the WHOLE formula appears on screen. When the student says a formula aloud, understand and write it as follows.
${SPOKEN_MATH.en}
If you did not hear clearly or the remark is off-topic, say so briefly and ask the student to repeat or type in the box below.`,
  },
  formula: {
    vi: (g) => `Bạn là ${g === 'male' ? 'thầy' : 'cô'} trợ giảng chuyên về CÔNG THỨC toán môn Xác suất Thống kê, trò chuyện bằng giọng nói với sinh viên (gọi là «em»), nói tiếng Việt.
Khi sinh viên đọc một công thức bằng lời: (1) gọi công cụ show_math với LaTeX chính xác của công thức đó; (2) đọc lại đầy đủ công thức bằng lời, rõ từng kí hiệu (ví dụ «P của A với điều kiện B bằng P của A giao B chia cho P của B»); (3) nói một câu ngắn về ý nghĩa hoặc khi nào dùng. Nếu lời nói có chỗ mơ hồ, chọn cách hiểu hợp lí nhất trong môn học và hỏi lại một câu ngắn.
Công thức gửi qua show_math phải TRỌN VẸN mọi vế, kể cả khi sinh viên chỉ đọc một phần của một công thức đã biết: khi đó viết đủ cả công thức và nói rõ phần nào cô/thầy bổ sung.
Khi được gửi một văn bản có công thức: đọc lần lượt TOÀN BỘ các công thức trong đó theo thứ tự, đầy đủ bằng lời, không bỏ sót, và gọi show_math cho từng công thức.
${SPOKEN_MATH.vi}`,
    en: (g) => `You are a ${g === 'male' ? 'male' : 'female'} teaching assistant for Probability & Statistics FORMULAS, talking with a student by voice in English only.
When the student says a formula in words: (1) call show_math with the exact LaTeX; (2) read the formula back fully in words, symbol by symbol; (3) add one short sentence on what it means or when to use it. If something is ambiguous, pick the most sensible reading for the course and ask one short question.
The LaTeX sent to show_math must be the WHOLE formula, every side, even when the student said only part of a known formula: then write it in full and say which part you added.
When given a text with formulas: read ALL its formulas in order, fully in words, without skipping, calling show_math for each.
${SPOKEN_MATH.en}`,
  },
};

const MAX_HISTORY = 10;
/** Conversation so far, for a new model taking over mid-conversation (system instruction is accepted by all Live models). */
export function historyText(history, lang) {
  const turns = history.slice(-MAX_HISTORY).map((t) => `${lang === 'en' ? 'Student' : 'Sinh viên'}: ${t.user || '(im lặng)'}\n${lang === 'en' ? 'Teacher' : 'Gia sư'}: ${t.ai || '(chưa trả lời)'}`);
  const text = turns.join('\n').slice(-4000);
  return text ? (lang === 'en' ? `\n\nConversation so far (continue it, do not greet again):\n${text}` : `\n\nHội thoại trước đó (tiếp tục, không chào lại):\n${text}`) : '';
}

/** The first message of a Live session. */
export function liveSetup(model, { mode = 'voice', gender = 'female', lang = 'vi', history = [], tools = true } = {}) {
  const persona = (PERSONA[mode] || PERSONA.voice)[lang === 'en' ? 'en' : 'vi'](gender);
  return {
    setup: {
      model: `models/${model}`,
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: TTS_VOICES[gender === 'male' ? 'male' : 'female'] } } },
      },
      systemInstruction: { parts: [{ text: persona + historyText(history, lang) }] },
      ...(tools ? { tools: [{ functionDeclarations: [SHOW_MATH] }] } : {}),
      // A formula is read with pauses: wait longer before deciding the student has finished (formula page most).
      realtimeInputConfig: { automaticActivityDetection: { endOfSpeechSensitivity: 'END_SENSITIVITY_LOW', silenceDurationMs: mode === 'formula' ? 2000 : 1200 } },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
  };
}

const parse = (data) => { try { return JSON.parse(typeof data === 'string' ? data : new TextDecoder().decode(data)); } catch { return null; } };

/**
 * One browser conversation. client: the browser socket. opts: { models, benched (Map), connect(model) → socket,
 * mode, gender, lang, now?, setupTimeout?, idleMs?, onEnd? }. Sockets are WebSocket-like: send, close, addEventListener.
 */
export class LiveRelay {
  constructor(client, opts) {
    this.client = client;
    this.o = { now: Date.now, setupTimeout: 10_000, idleMs: 5 * 60_000, ...opts };
    this.cfg = { mode: opts.mode, gender: opts.gender, lang: opts.lang };
    this.history = [];
    this.turn = { user: '', ai: '', done: true };
    this.up = null;
    this.ended = false;
    this.ready = false;
    this.queue = []; // non-audio messages that arrive while (re)connecting
    this.tools = new Map(); // model → false when it refused the show_math tool
  }

  toClient(msg) { try { this.client.send(JSON.stringify(msg)); } catch { /* browser gone */ } }

  async start() {
    this.client.addEventListener('message', (e) => this.fromClient(e.data));
    this.client.addEventListener('close', () => this.end());
    this.client.addEventListener('error', () => this.end());
    this.touch();
    return this.open('start');
  }

  touch() {
    clearTimeout(this.idle);
    this.idle = setTimeout(() => { this.toClient({ t: 'idle' }); this.end(4000, 'idle'); }, this.o.idleMs);
  }

  /** Connect the first model that starts, skipping models that recently failed. */
  async open(why) {
    const now = this.o.now();
    const fresh = this.o.models.filter((m) => (this.o.benched.get(m) || 0) <= now);
    for (const model of fresh.length ? fresh : this.o.models) {
      if (this.ended) return false;
      let up = await this.handshake(model, this.tools.get(model) !== false);
      if (up === 'no-tools') { this.tools.set(model, false); up = await this.handshake(model, false); }
      if (up && typeof up === 'object') {
        this.attach(up, model);
        if (why !== 'start') this.toClient({ t: 'switch', model });
        this.toClient({ t: 'ready', model });
        // Re-ask a question that was cut off by the failure, so the new model answers it.
        if (why === 'failover' && !this.turn.done && this.turn.user) this.send({ realtimeInput: { text: this.turn.user } });
        this.turn.ai = '';
        for (const m of this.queue.splice(0)) this.fromClient(m);
        return true;
      }
      this.o.benched.set(model, now + (up === 'quota' ? 60_000 : 2 * 60_000));
    }
    this.toClient({ t: 'unavailable' });
    this.end(1011, 'unavailable');
    return false;
  }

  /** Resolves with the open socket, or 'quota' | 'no-tools' | false when the model did not start. */
  async handshake(model, tools) {
    let ws;
    try { ws = await this.o.connect(model); } catch { return false; }
    if (!ws) return false;
    return new Promise((resolve) => {
      let settled = false;
      const done = (v) => { if (settled) return; settled = true; clearTimeout(timer); ws.removeEventListener?.('message', onMsg); ws.removeEventListener?.('close', onClose); if (v !== ws) { try { ws.close(1000); } catch { /* */ } } resolve(v); };
      const onMsg = (e) => { const m = parse(e.data); if (m?.setupComplete) done(ws); };
      const onClose = (e) => done(/quota|exhaust|rate|limit/i.test(e?.reason || '') || e?.code === 1013 ? 'quota' : tools && e?.code === 1007 ? 'no-tools' : false);
      const timer = setTimeout(() => done(false), this.o.setupTimeout);
      ws.addEventListener('message', onMsg);
      ws.addEventListener('close', onClose);
      ws.addEventListener('error', () => done(false));
      try { ws.send(JSON.stringify(liveSetup(model, { ...this.cfg, history: this.history, tools }))); } catch { done(false); }
    });
  }

  attach(ws, model) {
    this.up = ws;
    this.model = model;
    this.ready = true;
    this.goAway = false;
    ws.addEventListener('message', (e) => this.fromGoogle(e.data));
    ws.addEventListener('close', (e) => this.lost(ws, e));
    ws.addEventListener('error', () => this.lost(ws, {}));
  }

  send(msg) { try { this.up?.send(JSON.stringify(msg)); } catch { /* handled by close */ } }

  /** The model's socket closed by itself: carry on with the next model (or the same one after a planned goAway). */
  lost(ws, e) {
    if (ws !== this.up || this.ended) return;
    this.up = null;
    this.ready = false;
    if (!this.goAway) this.o.benched.set(this.model, this.o.now() + (/quota|exhaust|rate|limit/i.test(e?.reason || '') ? 60_000 : 2 * 60_000));
    this.open(this.goAway ? 'renew' : 'failover');
  }

  fromGoogle(data) {
    const m = parse(data);
    if (!m) return;
    if (m.goAway) this.goAway = true;
    for (const call of m.toolCall?.functionCalls || []) {
      if (call.name === 'show_math' && call.args?.latex) this.toClient({ t: 'math', latex: String(call.args.latex), caption: String(call.args.caption || '') });
      this.send({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response: { result: 'đã hiện trên màn hình' } }] } });
    }
    const sc = m.serverContent;
    if (!sc) return;
    if (sc.inputTranscription?.text) { this.newTurn(); this.turn.user += sc.inputTranscription.text; this.toClient({ t: 'in', text: sc.inputTranscription.text }); }
    for (const p of sc.modelTurn?.parts || []) {
      if (p.inlineData?.data && /audio/.test(p.inlineData.mimeType || 'audio/pcm')) this.toClient({ t: 'audio', d: p.inlineData.data, rate: Number(/rate=(\d+)/.exec(p.inlineData.mimeType || '')?.[1] || 24000) });
    }
    if (sc.outputTranscription?.text) { this.turn.ai += sc.outputTranscription.text; this.toClient({ t: 'out', text: sc.outputTranscription.text }); }
    if (sc.interrupted) { this.closeTurn('…'); this.toClient({ t: 'interrupted' }); }
    if (sc.turnComplete) { this.closeTurn(''); this.toClient({ t: 'turn' }); }
  }

  newTurn() { if (this.turn.done) this.turn = { user: '', ai: '', done: false }; }

  closeTurn(tail) {
    if (!this.turn.done && (this.turn.user || this.turn.ai)) this.history.push({ user: this.turn.user.trim(), ai: (this.turn.ai + tail).trim() });
    if (this.history.length > MAX_HISTORY) this.history.splice(0, this.history.length - MAX_HISTORY);
    this.turn = { user: '', ai: '', done: true };
  }

  fromClient(data) {
    const m = parse(data);
    if (!m || this.ended) return;
    this.touch();
    if (m.t === 'config') {
      this.cfg = { ...this.cfg, ...(m.gender ? { gender: m.gender === 'male' ? 'male' : 'female' } : {}), ...(m.lang ? { lang: m.lang === 'en' ? 'en' : 'vi' } : {}) };
      // A new voice or language needs a new session; the conversation goes along.
      if (this.up) { const old = this.up; this.up = null; this.ready = false; try { old.close(1000); } catch { /* */ } this.closeTurn('…'); this.open('renew'); }
      return;
    }
    if (!this.ready) { if (m.t !== 'audio') this.queue.push(data); return; }
    if (m.t === 'audio' && typeof m.d === 'string') this.send({ realtimeInput: { audio: { data: m.d, mimeType: 'audio/pcm;rate=16000' } } });
    else if (m.t === 'pause') this.send({ realtimeInput: { audioStreamEnd: true } });
    else if (m.t === 'text' && typeof m.text === 'string' && m.text.trim()) {
      const text = m.text.slice(0, 8000);
      this.newTurn(); this.turn.user += text;
      this.send({ realtimeInput: { text } });
    } else if (m.t === 'image' && typeof m.d === 'string' && /^image\/(jpeg|png|webp)$/.test(m.mime)) {
      this.send({ realtimeInput: { video: { data: m.d, mimeType: m.mime } } });
    }
  }

  end(code = 1000, reason = '') {
    if (this.ended) return;
    this.ended = true;
    clearTimeout(this.idle);
    try { this.up?.close(1000); } catch { /* */ }
    try { this.client.close(code, reason); } catch { /* */ }
    this.o.onEnd?.();
  }
}
