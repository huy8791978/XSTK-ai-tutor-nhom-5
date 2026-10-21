// Speech in and out (Web Speech API). Recognition: Chrome, Edge, Safari 14.5+ (Firefox has none → typed fallback).
import { getLang } from './i18n.js';

export const FALLBACK = {
  vi: 'Vì tôi nghe không rõ, nghe được hoặc chưa hiểu rõ ý của bạn, bạn hãy nhập đề bài hoặc đáp án hoặc câu trả lời của bạn dưới đây.',
  en: "Sorry, I couldn't hear you clearly or didn't fully understand. Please type your problem, answer or reply in the box below.",
};
export const fallbackText = () => FALLBACK[getLang()];

const Rec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const canListen = () => Boolean(Rec);
const locale = () => (getLang() === 'en' ? 'en-US' : 'vi-VN');

/**
 * Listen once. onInterim(text) streams partial text. Resolves with the final transcript ('' if nothing heard).
 * Rejects with { code } for 'unsupported', 'not-allowed', 'audio-capture', 'network'….
 */
export function listen({ onInterim } = {}) {
  if (!Rec) return Promise.reject({ code: 'unsupported' });
  const r = new Rec();
  r.lang = locale(); r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
  let text = '';
  const p = new Promise((resolve, reject) => {
    r.onresult = (e) => {
      text = [...e.results].map((x) => x[0].transcript).join(' ').trim();
      onInterim?.(text);
    };
    r.onerror = (e) => (e.error === 'no-speech' || e.error === 'aborted' ? resolve('') : reject({ code: e.error }));
    r.onend = () => resolve(text);
  });
  r.start();
  return Object.assign(p, { stop: () => r.stop() });
}

/** True when the transcript is too thin to act on. */
export function unclear(text) {
  const t = String(text || '').trim();
  return t.length < 3 || !/[\p{L}\p{N}]{2}/u.test(t);
}

/** Built-in browser voice (fallback). onStart/onEnd fire when it actually starts and stops (also on error/cancel). */
function browserSpeak(text, { onStart, onEnd } = {}, retried = false) {
  if (!('speechSynthesis' in window) || !text) { onEnd?.(); return; }
  speechSynthesis.cancel();
  // Chrome loads its voice list late; speaking before that uses the default voice whatever gender was picked.
  if (!retried && !voices().length) {
    let done = false;
    const go = () => { if (!done) { done = true; browserSpeak(text, { onStart, onEnd }, true); } };
    speechSynthesis.addEventListener('voiceschanged', go, { once: true });
    setTimeout(go, 800);
    return;
  }
  const u = new SpeechSynthesisUtterance(String(text).replace(/\$+/g, '').replace(/\\[a-z]+/gi, ' '));
  u.lang = locale(); u.rate = 1;
  const v = currentVoice();
  if (v) u.voice = v;
  u.pitch = pitchFor(v?.name, getGender());
  u.onstart = () => onStart?.();
  u.onend = u.onerror = () => onEnd?.();
  speechSynthesis.speak(u);
}

/**
 * Read a document aloud with the browser's own voice (no AI, no quota). Long text is queued sentence by sentence:
 * Chrome stops a single long utterance after ~15 s. Starts right away so iOS keeps the tap as the user gesture.
 */
export function readAloud(text, { onEnd } = {}) {
  if (!('speechSynthesis' in window)) { onEnd?.(); return false; }
  speechSynthesis.cancel();
  const plain = String(text).replace(/\$+/g, ' ').replace(/\\(frac|dfrac)\{([^{}]*)\}\{([^{}]*)\}/g, '$2 trên $3').replace(/\\[a-z]+/gi, ' ').replace(/[{}_^]/g, ' ');
  const parts = plain.match(/[^.!?;\n]+[.!?;]*|\n/g)?.map((s) => s.trim()).filter(Boolean) || [];
  const chunks = [];
  for (const s of parts) { if (chunks.length && (chunks.at(-1) + ' ' + s).length < 220) chunks[chunks.length - 1] += ' ' + s; else chunks.push(s); }
  if (!chunks.length) { onEnd?.(); return false; }
  const v = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(plain) ? 'vi-VN' : locale();
  const voice = voices().find((x) => x.lang?.toLowerCase().startsWith(v.slice(0, 2)));
  chunks.forEach((c, i) => {
    const u = new SpeechSynthesisUtterance(c);
    u.lang = v; if (voice) u.voice = voice;
    if (i === chunks.length - 1) u.onend = u.onerror = () => onEnd?.();
    speechSynthesis.speak(u);
  });
  return true;
}

// ---- Voice choice. Browsers expose no gender, so it is guessed from the voice name (e.g. "Microsoft An" and
// "NamMinh" are male Vietnamese voices; "HoaiMy" and "Google Tiếng Việt" are female). Unknown → female.
const MALE = /\b(an|nam\s?minh|namminh|minh|male|nam|david|mark|guy|andrew|brian|christopher|eric|ryan|daniel|thomas|george|james|roger|steffan|davis|tony|jason)\b/i;
const FEMALE = /\b(hoai\s?my|hoaimy|linh|mai|lan|female|zira|aria|jenny|samantha|susan|hazel|emma|ava|michelle|sonia|libby|google)\b/i;
export function voiceGender(name = '') {
  const n = String(name).replace(/[()\-–,]/g, ' ');
  if (FEMALE.test(n)) return 'female';
  if (MALE.test(n)) return 'male';
  return 'female';
}

const GENDER_KEY = 'xstk.voiceGender';
/** Voices for the current language (all voices if the device has none for it). */
export function voices() {
  if (!('speechSynthesis' in window)) return [];
  const all = speechSynthesis.getVoices(), mine = all.filter((x) => x.lang?.toLowerCase().startsWith(locale().slice(0, 2)));
  return mine.length ? mine : all;
}
/** The gender the student picked with the Nam/Nữ toggle (default: female). */
export function getGender() {
  try { return localStorage.getItem(GENDER_KEY) === 'male' ? 'male' : 'female'; } catch { return 'female'; }
}
export function setGender(g) { try { localStorage.setItem(GENDER_KEY, g); } catch { /* private mode: this page only */ } }
/** A voice matching the picked gender, else the first voice for the language. */
export function currentVoice() {
  const list = voices(), g = getGender();
  return list.find((v) => voiceGender(v.name) === g) || list[0] || null;
}
// Many devices have one voice per language: Windows ships only the male "Microsoft An" for Vietnamese, phones
// often only a female one. When the picked gender has no voice, shift the pitch of the one we have.
export function pitchFor(voiceName, gender) {
  const actual = voiceGender(voiceName);
  if (gender === 'male' && actual !== 'male') return 0.55;
  if (gender === 'female' && actual === 'male') return 1.7;
  return 1;
}
/** Run cb now and whenever the browser finishes loading its voice list (Chrome loads it asynchronously). */
export function onVoices(cb) {
  if (!('speechSynthesis' in window)) return cb();
  speechSynthesis.addEventListener('voiceschanged', cb);
  cb();
}

// ---- Gemini voices via /api/tts: a real female or male voice on every device. Falls back to the browser voice.
/** Wrap raw 16-bit mono PCM (what Gemini TTS returns) in a WAV header so an <audio> element can play it. */
export function pcmToWav(pcm, rate = 24000) {
  const out = new Uint8Array(44 + pcm.length), v = new DataView(out.buffer);
  const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + pcm.length, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, pcm.length, true); out.set(pcm, 44);
  return out;
}

const ttsCache = new Map(); // "gender|lang|text" → object URL, so "Nghe lại" costs nothing
async function ttsUrl(text) {
  const key = `${getGender()}|${getLang()}|${text}`;
  if (ttsCache.has(key)) return ttsCache.get(key);
  const res = await fetch('/api/tts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, gender: getGender(), lang: getLang() }) });
  if (!res.ok) throw new Error('tts');
  const { mime, data } = await res.json();
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  const blob = /wav/i.test(mime) ? new Blob([bytes], { type: 'audio/wav' }) : new Blob([pcmToWav(bytes, Number(/rate=(\d+)/i.exec(mime)?.[1] || 24000))], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  if (ttsCache.size > 20) { const [k, u] = ttsCache.entries().next().value; URL.revokeObjectURL(u); ttsCache.delete(k); }
  ttsCache.set(key, url);
  return url;
}

// Phones (iOS Safari above all) only let a page start sound inside a tap. The answer's voice arrives seconds after
// the tap (AI reply + TTS download), so a fresh `new Audio().play()` was blocked and stayed silent until the user
// tapped "Nghe lại". Fix: one <audio> element for the whole page, unlocked by playing silence on the first tap;
// an element that has played once may play again later without a tap. The browser voice is unlocked the same way.
let player = null, unlocked = false, speakId = 0, silence = '';
const getPlayer = () => (player ??= Object.assign(new Audio(), { preload: 'auto' }));
export function unlockAudio() {
  if (unlocked || typeof window === 'undefined') return;
  unlocked = true;
  const p = getPlayer();
  p.src = silence ||= URL.createObjectURL(new Blob([pcmToWav(new Uint8Array(4800))], { type: 'audio/wav' })); // 0.1 s of silence
  p.play().catch((e) => { if (e?.name === 'NotAllowedError') unlocked = false; }); // not a real tap: retry on the next
  if ('speechSynthesis' in window) speechSynthesis.speak(new SpeechSynthesisUtterance(''));
}
if (typeof document !== 'undefined') {
  for (const ev of ['touchend', 'click', 'keydown']) document.addEventListener(ev, unlockAudio, { capture: true, passive: true });
}

/** Read text aloud with the picked teacher's voice. onStart/onEnd fire when sound really starts and stops. */
export function speak(text, { onStart, onEnd } = {}) {
  stopSpeaking();
  if (!text) { onEnd?.(); return; }
  const id = ++speakId;
  ttsUrl(text).then((url) => {
    if (id !== speakId) return; // a newer request or "Dừng đọc" won
    const a = getPlayer();
    a.onplaying = () => { if (id === speakId) onStart?.(); };
    a.onended = () => { if (id === speakId) onEnd?.(); };
    a.src = url;
    return a.play();
  }).catch(() => { if (id === speakId) browserSpeak(text, { onStart, onEnd }); });
}
export function stopSpeaking() {
  speakId++;
  // Let the unlocking silence finish: cut short before it starts, iOS may not count it.
  if (player) { player.onplaying = player.onended = null; if (player.src !== silence) player.pause(); }
  window.speechSynthesis?.cancel();
}

/**
 * Replies written while the other voice was picked say «cô»/«thầy» for the wrong teacher. Before reading aloud,
 * swap the standalone word to match the voice now picked (case kept; «cố», «cốt», «thầy thuốc» untouched).
 */
export function matchPronoun(text, gender) {
  const [from, to] = gender === 'male' ? ['cô', 'thầy'] : ['thầy', 'cô'];
  const re = new RegExp(`(?<![\p{L}\p{M}])(${from}|${from[0].toUpperCase()}${from.slice(1)})(?![\p{L}\p{M}])(?!\s+thuốc)`, 'gu');
  return String(text).normalize('NFC').replace(re, (w) => (w[0] === w[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to));
}
