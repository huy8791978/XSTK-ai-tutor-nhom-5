// Learning profile, stored only in this browser (localStorage). Export/import moves it between devices.
import { newSerial } from './stats.js';

const KEY = 'xstk.profile.v1';
let cache;

export function load() {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY)); } catch { cache = null; }
  if (!cache || !Array.isArray(cache.sessions)) cache = { id: newSerial(), created: Date.now(), sessions: [], insight: null };
  return cache;
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* private mode / full: keep in memory */ }
  dispatchEvent(new Event('profile-change'));
}

/** Log a graded activity; returns its serial. */
export function addSession({ feature, topic, score, mistakes = [] }) {
  const p = load();
  const serial = newSerial();
  p.sessions.push({
    serial, at: Date.now(), feature, topic: topic || 'Khác',
    score: Number.isFinite(+score) ? Math.max(0, Math.min(10, +score)) : null,
    mistakes: (mistakes || []).filter((m) => m && (m.detail || m.type)).slice(0, 12),
  });
  if (p.sessions.length > 400) p.sessions.splice(0, p.sessions.length - 400);
  save();
  return serial;
}

export function setInsight(data) { load().insight = { at: Date.now(), data }; save(); }

export function exportFile() {
  const blob = new Blob([JSON.stringify(load(), null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `ho-so-xstk-${load().id.replace(/\W/g, '')}.json` });
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function importFile(file) {
  const data = JSON.parse(await file.text());
  if (!data || !Array.isArray(data.sessions)) throw new Error('Tệp không phải hồ sơ XSTK·AI.');
  cache = { id: String(data.id || newSerial()), created: data.created || Date.now(), sessions: data.sessions, insight: data.insight || null };
  save();
}

export function reset() { cache = { id: newSerial(), created: Date.now(), sessions: [], insight: null }; save(); }
