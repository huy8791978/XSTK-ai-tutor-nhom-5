// Spaced review (Leitner boxes) of the topics where the student made mistakes. Pure and unit-tested
// (tests/review.test.mjs); the page keeps the schedule in localStorage, next to the learning profile.
const DAY = 86400_000;
/** Days until the next review, per box: a good review moves the topic one box up, a poor one back to box 0. */
export const INTERVALS = [1, 3, 7, 14, 30];
export const PASS = 8; // review score (0-10) that counts as remembered

/**
 * One row per topic with mistakes: { topic, count, details, last (latest mistake), box, due, isDue }.
 * The schedule (state[topic] = { box, due, last }) decides the due date until a newer mistake resets the topic to box 0.
 * Due topics first, then the topics with most mistakes.
 */
export function reviewQueue(sessions = [], state = {}, now = Date.now()) {
  const map = new Map();
  for (const s of sessions) {
    for (const m of s.mistakes || []) {
      const topic = (m.topic || s.topic || 'Khác').trim();
      const t = map.get(topic) || { topic, count: 0, details: [], last: 0 };
      t.count += 1; t.last = Math.max(t.last, s.at || 0);
      if (m.detail) t.details.push(m.detail);
      map.set(topic, t);
    }
  }
  return [...map.values()].map((t) => {
    const st = state[t.topic];
    const fresh = !st || t.last > st.last;
    const box = fresh ? 0 : st.box, due = fresh ? t.last + INTERVALS[0] * DAY : st.due;
    return { ...t, details: t.details.slice(-6), box, due, isDue: due <= now };
  }).sort((a, b) => (b.isDue - a.isDue) || (b.count - a.count) || (a.due - b.due));
}

/** New schedule after reviewing `topic` with `score` (0-10). `from`: the box shown in the queue (a newer mistake resets it). */
export function advance(state, topic, score, now = Date.now(), from = state[topic]?.box ?? 0) {
  const box = score >= PASS ? Math.min(INTERVALS.length - 1, from + 1) : 0;
  return { ...state, [topic]: { box, due: now + INTERVALS[box] * DAY, last: now } };
}
