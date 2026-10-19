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

export function speak(text) {
  if (!('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(text).replace(/\$+/g, '').replace(/\\[a-z]+/gi, ' '));
  u.lang = locale(); u.rate = 1;
  const v = speechSynthesis.getVoices().find((x) => x.lang?.toLowerCase().startsWith(locale().slice(0, 2)));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
export const stopSpeaking = () => window.speechSynthesis?.cancel();
