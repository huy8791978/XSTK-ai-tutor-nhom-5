// Real-time voice with Gemini Live, through /api/live. The microphone streams 16 kHz PCM; the tutor's voice comes
// back as 24 kHz PCM and plays as it arrives, with the transcript of what it says. While the tutor speaks the
// microphone is not sent (so speakers never interrupt the tutor); «Ngắt lời» stops the voice and gives the floor back.
import { getLang } from './i18n.js';
import { getGender } from './voice.js';

export const canLive = () => typeof WebSocket !== 'undefined' && typeof AudioWorkletNode !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

// Average each group of input samples down to 16 kHz, send 100 ms chunks of 16-bit PCM.
const WORKLET = `class XstkMic extends AudioWorkletProcessor {
  constructor() { super(); this.step = sampleRate / 16000; this.pos = 0; this.acc = 0; this.n = 0; this.out = []; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.acc += ch[i]; this.n++; this.pos++;
      if (this.pos >= this.step) { this.pos -= this.step; const v = Math.max(-1, Math.min(1, this.acc / this.n)); this.out.push(v * 32767); this.acc = 0; this.n = 0; }
    }
    if (this.out.length >= 1600) { const a = Int16Array.from(this.out); this.out = []; this.port.postMessage(a.buffer, [a.buffer]); }
    return true;
  }
}
registerProcessor('xstk-mic', XstkMic);`;

export function toBase64(buf) {
  const b = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}
export function pcmFloats(b64) {
  const bin = atob(b64), n = bin.length >> 1, out = new Float32Array(n);
  for (let i = 0; i < n; i++) { const v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8); out[i] = (v >= 0x8000 ? v - 0x10000 : v) / 32768; }
  return out;
}

/**
 * on(event, data): 'state' (connecting|listening|thinking|speaking|idle), 'user' text, 'ai' text, 'math' {latex,caption},
 * 'turn', 'switch', 'interrupted', 'unavailable', 'nomic', 'end'. Call start() inside a tap (iOS needs it for sound).
 */
export function liveSession({ mode = 'voice', mic = true, on }) {
  let ws, ctx, stream, node, begun = false, ready = false, stopped = false, nextAt = 0, muted = false, state = 'idle', poll;
  const sources = new Set();
  const emit = (e, d) => { try { on(e, d); } catch (err) { console.error(err); } };
  const setState = (s) => { if (s !== state) { state = s; emit('state', s); } };
  const speaking = () => ctx && nextAt > ctx.currentTime + 0.03;
  const early = []; // typed text or a file sent while the socket is still opening
  const send = (m) => { if (ws?.readyState === 1) ws.send(JSON.stringify(m)); else if ((!ws || ws.readyState === 0) && !stopped && m.t !== 'audio') early.push(m); };

  function play(b64, rate) {
    if (muted || !ctx) return;
    const f = pcmFloats(b64);
    if (!f.length) return;
    const buf = ctx.createBuffer(1, f.length, rate || 24000);
    buf.copyToChannel(f, 0);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    nextAt = Math.max(nextAt, ctx.currentTime + 0.04);
    src.start(nextAt);
    nextAt += buf.duration;
    sources.add(src);
    src.onended = () => sources.delete(src);
    setState('speaking');
  }
  function silence() {
    for (const s of sources) { try { s.stop(); } catch { /* already ended */ } }
    sources.clear();
    nextAt = 0;
  }

  async function start() {
    stopped = false;
    begun = true;
    setState('connecting');
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    await ctx.resume().catch(() => {});
    if (mic) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
        const url = URL.createObjectURL(new Blob([WORKLET], { type: 'text/javascript' }));
        await ctx.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);
        node = new AudioWorkletNode(ctx, 'xstk-mic');
        node.port.onmessage = (e) => { if (ready && !speaking()) send({ t: 'audio', d: toBase64(e.data) }); };
        const sink = ctx.createGain(); sink.gain.value = 0; // keep the worklet running without hearing yourself
        ctx.createMediaStreamSource(stream).connect(node).connect(sink).connect(ctx.destination);
      } catch {
        emit('nomic');
      }
    }
    if (stopped) return;
    const q = new URLSearchParams({ mode, gender: getGender(), lang: getLang() });
    ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/live?${q}`);
    ws.onopen = () => { for (const m of early.splice(0)) send(m); };
    ws.onmessage = (e) => {
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      if (m.t === 'ready') { ready = true; if (!speaking()) setState('listening'); }
      else if (m.t === 'audio') play(m.d, m.rate);
      else if (m.t === 'in') { emit('user', m.text); if (!speaking()) setState('thinking'); }
      else if (m.t === 'out') emit('ai', m.text);
      else if (m.t === 'math') emit('math', { latex: m.latex, caption: m.caption });
      else if (m.t === 'turn') { muted = false; emit('turn'); }
      else if (m.t === 'interrupted') { muted = false; silence(); emit('interrupted'); }
      else if (m.t === 'switch') { ready = false; silence(); emit('switch'); }
      else if (m.t === 'unavailable') { emit('unavailable', m.reason); stop(true); }
      else if (m.t === 'idle') stop();
    };
    ws.onclose = () => { if (!stopped) { emit('unavailable', 'closed'); stop(true); } };
    poll = setInterval(() => { if (ready && state === 'speaking' && !speaking()) setState('listening'); }, 120);
  }

  function stop(silent) {
    if (stopped) return;
    stopped = true;
    ready = false;
    clearInterval(poll);
    silence();
    try { ws?.close(1000); } catch { /* */ }
    stream?.getTracks().forEach((t) => t.stop());
    try { node?.disconnect(); } catch { /* */ }
    ctx?.close().catch(() => {});
    setState('idle');
    if (!silent) emit('end');
  }

  return {
    start, stop,
    get active() { return begun && !stopped; },
    get ready() { return ready; },
    sendText: (text) => { send({ t: 'text', text }); setState('thinking'); },
    sendImage: (mime, d) => send({ t: 'image', mime, d }),
    configure: (cfg) => { ready = false; silence(); send({ t: 'config', ...cfg }); },
    /** Stop the tutor's voice now and drop the rest of this answer's audio; the microphone is live again. */
    interrupt: () => { if (speaking()) { muted = true; silence(); setState('listening'); } },
  };
}
