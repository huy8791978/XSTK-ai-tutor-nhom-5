// Model fallback shared by the AI answers and the TTS voice: models are tried strongest → weakest; one that is
// out of quota or unavailable is skipped for a while, so the next request goes straight to a model that works.

/** Comma-separated list from wrangler.toml (so models can be added or reordered without code changes). */
export const modelList = (value, fallback) => String(value || fallback).split(',').map((s) => s.trim()).filter(Boolean);

/** How long to skip a model after this HTTP status (ms), or 0 to try it again next time. */
export function benchFor(status) {
  if (status === 429) return 60_000; // quota is per minute (or per day: it simply gets benched again)
  if (status === 403 || status === 404) return 10 * 60_000; // no access / model does not exist
  return 0; // 5xx, network (0) and 400 depend on the request or are transient
}

/** Models to try now: benched ones are skipped, unless every model is benched (then try them all anyway). */
export function usable(models, benched, now) {
  const ok = models.filter((m) => (benched.get(m) || 0) <= now);
  return ok.length ? ok : models;
}

export const AI_MODELS = 'gemini-3.8-flash,gemini-3.8-flash-lite,gemini-3.5-flash,gemini-3.5-flash-lite,gemini-2.5-flash,gemini-2.5-flash-lite';
export const TTS_MODELS = 'gemini-3.8-flash-tts,gemini-3.8-flash-lite-tts,gemini-3.1-flash-tts-preview,gemini-2.5-flash-preview-tts';
