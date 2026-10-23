// Role: everyone starts as a student, no choice needed. A lecturer enters the moderator password once to become
// "giảng viên kiểm duyệt"; the server returns a signed token valid 12 hours, kept in this browser only.
const KEY = 'xstk.mod';
let mem = null; // private mode (no localStorage): the role lasts until the page is closed
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || mem; } catch { return mem; } };

/** The moderator token while it is valid, else null. */
export function modToken() {
  const m = read();
  if (m?.token && m.exp > Date.now()) return m.token;
  if (m) clearMod();
  return null;
}
export const isMod = () => Boolean(modToken());
export function setMod(token, exp) {
  mem = { token, exp };
  try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch { /* private mode: kept in memory */ }
}
export function clearMod() {
  mem = null;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
