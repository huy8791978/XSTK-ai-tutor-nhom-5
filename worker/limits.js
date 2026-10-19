// Pure rate-limit logic (no Cloudflare APIs) so it can be unit-tested with `node --test`.

/** Gemini RPD resets at midnight Pacific time. */
export function pacificDay(now) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(now);
}

/**
 * Decide whether a request fits the global budget.
 * state: { window: [{t, tokens}], day: 'YYYY-MM-DD', dayCount }
 * Returns { ok, retryAfter (s), state } — state is a new object; caller persists it.
 */
export function admit(state, { now, tokens, rpm, tpm, rpd }) {
  const day = pacificDay(now);
  const window = state.window.filter((e) => now - e.t < 60_000);
  const dayCount = state.day === day ? state.dayCount : 0;
  const base = { window, day, dayCount };

  if (dayCount >= rpd) return { ok: false, retryAfter: secondsToPacificMidnight(now), reason: 'rpd', state: base };
  const used = window.reduce((s, e) => s + e.tokens, 0);
  if (window.length >= rpm || used + tokens > tpm) {
    // Wait until enough of the oldest entries expire.
    let freedTokens = 0, retryAt = now + 60_000;
    for (let i = 0; i < window.length; i++) {
      freedTokens += window[i].tokens;
      if (window.length - (i + 1) < rpm && used - freedTokens + tokens <= tpm) { retryAt = window[i].t + 60_000; break; }
    }
    return { ok: false, retryAfter: Math.max(1, Math.ceil((retryAt - now) / 1000)), reason: window.length >= rpm ? 'rpm' : 'tpm', state: base };
  }
  return { ok: true, retryAfter: 0, state: { window: [...window, { t: now, tokens }], day, dayCount: dayCount + 1 } };
}

/** Replace the reserved estimate with the real token count reported by Gemini. */
export function settle(state, { t, actual }) {
  return { ...state, window: state.window.map((e) => (e.t === t ? { ...e, tokens: actual } : e)) };
}

function secondsToPacificMidnight(now) {
  const p = new Date(new Date(now).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const midnight = new Date(p); midnight.setHours(24, 0, 0, 0);
  return Math.ceil((midnight - p) / 1000);
}

/** Rough token estimate: ~3 chars/token for Vietnamese text, flat cost per attached file. */
export function estimateTokens(chars, files, maxOutput) {
  return Math.ceil(chars / 3) + files * 1500 + maxOutput;
}
