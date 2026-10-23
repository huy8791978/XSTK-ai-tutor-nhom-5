// Mini-game rules (pure, unit-tested): clean the AI's question set and score a finished game.
export const QUIZ_SECONDS = 30;
const KINDS = ['Lí thuyết', 'Bài tập', 'Thực tiễn'];

/** Keep only well-formed questions: a prompt, 4 non-empty options, an answer 0–3 (or A–D). */
export function cleanQuestions(list) {
  const seen = new Set();
  return (Array.isArray(list) ? list : []).flatMap((q) => {
    if (!q || typeof q.prompt !== 'string' || !q.prompt.trim()) return [];
    const options = (Array.isArray(q.options) ? q.options : []).map((o) => String(o ?? '').replace(/^\s*[A-D][.):]\s+/, '').trim());
    if (options.length !== 4 || options.some((o) => !o)) return [];
    const a = typeof q.answer === 'string' && /^[A-D]$/i.test(q.answer.trim()) ? 'ABCD'.indexOf(q.answer.trim().toUpperCase()) : Number(q.answer);
    if (!Number.isInteger(a) || a < 0 || a > 3) return [];
    const key = q.prompt.trim().toLowerCase();
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ kind: KINDS.includes(q.kind) ? q.kind : 'Bài tập', topic: typeof q.topic === 'string' ? q.topic : '', prompt: q.prompt.trim(), options, answer: a, explain: String(q.explain ?? '').trim() }];
  });
}

/** picks[i] = chosen option index, or null when time ran out with nothing chosen. Score is out of 10. */
export function scoreGame(questions, picks) {
  const correct = questions.filter((q, i) => picks[i] === q.answer).length;
  return { correct, total: questions.length, score: questions.length ? Math.round((correct / questions.length) * 100) / 10 : 0 };
}
