// Pure profile analytics (unit-tested). Sessions: { serial, at, feature, topic, score (0-10|null), mistakes: [{topic,type,detail}] }

export const FEATURES = {
  tutor: 'Chấm bài', 'practice-mcq': 'Trắc nghiệm', 'practice-essay': 'Tự luận', oral: 'Vấn đáp',
};

const round1 = (x) => Math.round(x * 10) / 10;

/** Vietnamese decimal: 7.5 → "7,5", 10 → "10". */
export const fmtScore = (x) => (x == null || Number.isNaN(x) ? '—' : String(round1(x)).replace('.', ','));

export const newSerial = (rand = Math.random) => `XS·${String(Math.floor(rand() * 1e6)).padStart(6, '0')}`;

function tally(items, key) {
  const m = new Map();
  for (const it of items) { const k = (it[key] || 'Khác').trim(); m.set(k, (m.get(k) || 0) + 1); }
  return [...m].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'));
}

export function summarize(sessions = []) {
  const scored = sessions.filter((s) => typeof s.score === 'number' && Number.isFinite(s.score));
  const mistakes = sessions.flatMap((s) => (s.mistakes || []).map((m) => ({ ...m, serial: s.serial, at: s.at })));

  const topicMap = new Map();
  for (const s of scored) {
    const t = topicMap.get(s.topic) || { name: s.topic || 'Khác', total: 0, n: 0 };
    t.total += s.score; t.n += 1; topicMap.set(s.topic, t);
  }
  const topics = [...topicMap.values()].map((t) => ({ name: t.name, n: t.n, avg: round1(t.total / t.n) })).sort((a, b) => a.avg - b.avg);

  return {
    n: sessions.length,
    avg: scored.length ? round1(scored.reduce((a, s) => a + s.score, 0) / scored.length) : null,
    mistakeCount: mistakes.length,
    errorTypes: tally(mistakes, 'type'),
    errorTopics: tally(mistakes, 'topic'),
    topics,
    trend: scored.slice(-12).map((s) => ({ serial: s.serial, at: s.at, score: s.score, feature: s.feature })),
    recent: mistakes.slice(-10).reverse(),
  };
}

/** Compact payload for the AI profile analysis (keeps tokens low). */
export function insightPayload(sessions) {
  const s = summarize(sessions);
  return JSON.stringify({
    soPhien: s.n, diemTB: s.avg, loaiLoi: s.errorTypes, chuDeLoi: s.errorTopics, diemTheoChuDe: s.topics,
    loiGanDay: sessions.flatMap((x) => (x.mistakes || []).map((m) => `${m.topic} | ${m.type} | ${m.detail}`)).slice(-40),
  });
}
