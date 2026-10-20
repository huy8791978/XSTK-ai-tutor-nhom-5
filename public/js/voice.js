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

/** Read text aloud. onStart/onEnd fire when the voice actually starts and stops (also on error/cancel). */
export function speak(text, { onStart, onEnd } = {}) {
  if (!('speechSynthesis' in window) || !text) { onEnd?.(); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(text).replace(/\$+/g, '').replace(/\\[a-z]+/gi, ' '));
  u.lang = locale(); u.rate = 1;
  const v = currentVoice();
  if (v) u.voice = v;
  u.pitch = pitchFor(v?.name, getGender());
  u.onstart = () => onStart?.();
  u.onend = u.onerror = () => onEnd?.();
  speechSynthesis.speak(u);
}
export const stopSpeaking = () => window.speechSynthesis?.cancel();

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
/** Pitch: many devices have only a female Vietnamese voice, so "male" without a male voice is read lower. */
export const pitchFor = (voiceName, gender) => (gender === 'male' && voiceGender(voiceName) !== 'male' ? 0.55 : 1);
/** Run cb now and whenever the browser finishes loading its voice list (Chrome loads it asynchronously). */
export function onVoices(cb) {
  if (!('speechSynthesis' in window)) return cb();
  speechSynthesis.addEventListener('voiceschanged', cb);
  cb();
}
