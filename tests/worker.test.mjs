import { test } from 'node:test';
import assert from 'node:assert/strict';
import { admit, settle, estimateTokens, pacificDay } from '../worker/limits.js';
import { buildRequest, extractJson } from '../worker/prompts.js';

const empty = { window: [], day: '', dayCount: 0 };
const L = { rpm: 3, tpm: 1000, rpd: 5 };
const T0 = Date.UTC(2026, 9, 19, 12, 0, 0);

test('admits until RPM is full, then reports retryAfter', () => {
  let s = empty;
  for (let i = 0; i < 3; i++) {
    const r = admit(s, { ...L, now: T0 + i * 1000, tokens: 10 });
    assert.equal(r.ok, true); s = r.state;
  }
  const r = admit(s, { ...L, now: T0 + 5000, tokens: 10 });
  assert.equal(r.ok, false); assert.equal(r.reason, 'rpm');
  assert.equal(r.retryAfter, 55); // oldest entry expires at T0+60s
  assert.equal(admit(r.state, { ...L, now: T0 + 60_001, tokens: 10 }).ok, true);
});

test('blocks when tokens would exceed TPM', () => {
  const s = admit(empty, { ...L, now: T0, tokens: 900 }).state;
  const r = admit(s, { ...L, now: T0 + 1000, tokens: 200 });
  assert.equal(r.ok, false); assert.equal(r.reason, 'tpm');
  assert.equal(admit(s, { ...L, now: T0 + 1000, tokens: 100 }).ok, true);
});

test('RPD caps the day and resets on a new Pacific day', () => {
  let s = { window: [], day: pacificDay(T0), dayCount: 5 };
  const r = admit(s, { ...L, now: T0, tokens: 1 });
  assert.equal(r.ok, false); assert.equal(r.reason, 'rpd'); assert.ok(r.retryAfter > 0);
  assert.equal(admit(s, { ...L, now: T0 + 86_400_000, tokens: 1 }).ok, true);
});

test('settle replaces the estimate with the actual count', () => {
  const s = admit(empty, { ...L, now: T0, tokens: 900 }).state;
  const s2 = settle(s, { t: T0, actual: 100 });
  assert.equal(admit(s2, { ...L, now: T0 + 1, tokens: 800 }).ok, true);
});

test('estimateTokens counts text, files and output budget', () => {
  assert.equal(estimateTokens(6, 1, 100), 2 + 1500 + 100);
});

test('buildRequest rejects unknown tasks, bad files and too many files', () => {
  assert.throws(() => buildRequest('chat', {}), /không hợp lệ/);
  assert.throws(() => buildRequest('grade', { files: [{ mimeType: 'text/html', data: 'x' }] }), /Chỉ nhận/);
  const f = { mimeType: 'image/png', data: 'x' };
  assert.throws(() => buildRequest('grade', { files: [f, f, f, f] }), /Tối đa/);
});

test('buildRequest puts Word text in the prompt and counts it toward the file limit', () => {
  const doc = { name: 'mau.docx', text: 'Bài 1. Tính $P(A)$.' };
  const { body } = buildRequest('practice', { kind: 'essay', topic: 'Khác', docs: [doc] });
  const text = body.contents[0].parts[0].text;
  assert.ok(text.includes('BÀI MẪU trong tệp Word') && text.includes('Bài 1. Tính $P(A)$.'));
  assert.ok(text.includes('TƯƠNG TỰ bài mẫu đó'));
  assert.equal(body.contents[0].parts.length, 1);
  const f = { mimeType: 'image/png', data: 'x' };
  assert.throws(() => buildRequest('grade', { files: [f, f], docs: [doc, doc] }), /Tối đa/);
  assert.throws(() => buildRequest('grade', { docs: [{ name: 'x' }] }), /Word không hợp lệ/);
});

test('ocr copies the file as written, even in English mode', () => {
  const f = { mimeType: 'image/png', data: 'x' };
  const { body } = buildRequest('ocr', { files: [f], lang: 'en' });
  const text = body.contents[0].parts[0].text;
  assert.ok(text.includes('TOÀN BỘ') && !text.includes('LANGUAGE:') && !text.includes('NGÔN NGỮ:'));
  assert.ok(!body.systemInstruction.parts[0].text.includes('LANGUAGE OVERRIDE'));
  assert.equal(body.generationConfig.temperature, 0);
  assert.throws(() => buildRequest('ocr', {}), /ảnh hoặc PDF/);
});

test('buildRequest attaches files and asks for JSON', () => {
  const { body, fileCount } = buildRequest('grade', { problem: 'Tính P(A)', files: [{ mimeType: 'application/pdf', data: 'QUJD' }] });
  assert.equal(fileCount, 1);
  assert.equal(body.contents[0].parts[1].inlineData.mimeType, 'application/pdf');
  assert.equal(body.generationConfig.responseMimeType, 'application/json');
});

test('strategy prompt forbids the final answer', () => {
  assert.match(buildRequest('strategy', { problem: 'x' }).body.contents[0].parts[0].text, /KHÔNG đưa đáp số/);
});

test('extractJson tolerates fences and prose', () => {
  assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJson('Đây: {"b":[1,2]} xong'), { b: [1, 2] });
  assert.throws(() => extractJson('không có json'), /định dạng/);
});

test('lesson prompt follows the concept and theorem workflows', () => {
  const c = buildRequest('lesson', { kind: 'concept', name: 'Biến cố độc lập', topic: 'x' }).body.contents[0].parts[0].text;
  assert.match(c, /Hình thành định nghĩa khái niệm/);
  assert.match(c, /"signs"/);
  const t = buildRequest('lesson', { kind: 'theorem', name: 'Bayes', topic: 'x' }).body.contents[0].parts[0].text;
  assert.match(t, /"hypothesis"/);
  assert.match(t, /"proof"/);
});

test('solutions ask for CASIO fx-580VN X key steps', () => {
  assert.match(buildRequest('solve', { problem: 'x' }).body.contents[0].parts[0].text, /"casio"/);
  assert.match(buildRequest('solve', { problem: 'x' }).body.systemInstruction.parts[0].text, /fx-580VN X/);
});

test('grade prompt uses the teacher barem when given', () => {
  assert.match(buildRequest('grade', { barem: 'Bước 1: 2 điểm' }).body.contents[0].parts[0].text, /BAREM ĐIỂM[\s\S]*Bước 1: 2 điểm/);
});

test('practice questions carry the 4 Polya steps', () => {
  assert.match(buildRequest('practice', { kind: 'essay', topic: 'x' }).body.contents[0].parts[0].text, /"polya"/);
});

test('voice prompt asks whether the student was understood', () => {
  assert.match(buildRequest('voice', { text: 'xin chào' }).body.contents[0].parts[0].text, /"understood"/);
});

test('English mode switches the answer language', () => {
  assert.match(buildRequest('solve', { problem: 'x', lang: 'en' }).body.systemInstruction.parts[0].text, /in English/);
  assert.doesNotMatch(buildRequest('solve', { problem: 'x' }).body.systemInstruction.parts[0].text, /in English/);
});

test('validatePost cleans and checks forum input', async () => {
  const { validatePost, FORUM_TOPICS } = await import('../worker/forum.js');
  assert.throws(() => validatePost({ title: 'ab', body: 'nội dung' }), /Tiêu đề/);
  assert.throws(() => validatePost({ title: 'Câu hỏi', body: 'x'.repeat(4001) }), /tối đa/);
  const v = validatePost({ title: '  Hỏi về Bayes ', body: 'Vì sao?', topic: 'không có' });
  assert.equal(v.title, 'Hỏi về Bayes'); assert.equal(v.author, 'Ẩn danh'); assert.equal(v.topic, FORUM_TOPICS[0]);
  assert.equal(validatePost({ body: 'trả lời' }, { reply: true }).body, 'trả lời');
});

// Gemini often writes LaTeX with single backslashes inside JSON strings.
const BS = String.fromCharCode(92);
test('extractJson repairs invalid LaTeX escapes (\sqrt, \overline, \cdot)', () => {
  const raw = `{"a": "$${BS}sqrt{2}$ và $${BS}overline{x}$ = $a${BS}cdot b$"}`;
  assert.equal(extractJson(raw).a, `$${BS}sqrt{2}$ và $${BS}overline{x}$ = $a${BS}cdot b$`);
});

test('extractJson keeps LaTeX commands that look like JSON escapes (\frac, \text, \beta, \right, \nu)', () => {
  const raw = `{"a": "${BS}frac{1}{2} ${BS}text{x} ${BS}beta ${BS}left( ${BS}right) ${BS}nu ${BS}neq ${BS}times ${BS}underline{u}", "b": "dòng 1${BS}ndòng 2"}`;
  const d = extractJson(raw);
  assert.equal(d.a, `${BS}frac{1}{2} ${BS}text{x} ${BS}beta ${BS}left( ${BS}right) ${BS}nu ${BS}neq ${BS}times ${BS}underline{u}`);
  assert.equal(d.b, 'dòng 1\ndòng 2'); // a real newline escape survives
});

test('extractJson leaves correctly escaped JSON alone', () => {
  const ok = JSON.stringify({ a: `${BS}frac{a}{b} ${BS}sqrt{x}`, q: 'say "hi"' });
  assert.deepEqual(extractJson(ok), { a: `${BS}frac{a}{b} ${BS}sqrt{x}`, q: 'say "hi"' });
});

test('extractJson closes a reply cut off at the token limit', () => {
  const d = extractJson('{"questions": [{"prompt": "Câu 1", "answer": 0}, {"prompt": "Câu 2 bị cắ');
  assert.equal(d.questions[0].prompt, 'Câu 1');
});

test('extractJson repairs unescaped quotes inside Vietnamese text', () => {
  const raw = '{"name": "Xác suất", "situation": "Có 60% sinh viên đạt loại "giỏi" môn XSTK.", "n": 1}';
  const d = extractJson(raw);
  assert.equal(d.situation, 'Có 60% sinh viên đạt loại "giỏi" môn XSTK.');
  assert.equal(d.n, 1);
});

test('extractJson repairs raw newlines and tabs inside strings', () => {
  const d = extractJson('{"a": "dòng 1\ndòng 2\tcột", "b": [1]}');
  assert.equal(d.a, 'dòng 1\ndòng 2\tcột');
});

test('extractJson error carries the parse position for logging', () => {
  let err;
  try { extractJson('{"a": 1 "b": 2}'); } catch (e) { err = e; }
  assert.match(String(err?.detail), /position|JSON|Unexpected|Expected/i);
});

test('extractJson fixes Vietnamese decimal commas in JSON numbers but not in text or arrays', () => {
  const d = extractJson('{"viz": {"type": "venn", "pA": 0,5, "pB": 0,6, "pAB": 0,3}, "score": 7,5, "t": "P = 0,5", "v": [1,2,3]}');
  assert.deepEqual(d.viz, { type: 'venn', pA: 0.5, pB: 0.6, pAB: 0.3 });
  assert.equal(d.score, 7.5);
  assert.equal(d.t, 'P = 0,5');
  assert.deepEqual(d.v, [1, 2, 3]);
});

test('voice reply is spoken in the page language', () => {
  assert.match(buildRequest('voice', { text: 'hi', lang: 'en' }).body.contents[0].parts[0].text, /"speech": "<[^"]*English/);
  assert.match(buildRequest('voice', { text: 'xin chào' }).body.contents[0].parts[0].text, /"speech": "<[^"]*tiếng Việt/);
});

test('buildTts picks a female or male Gemini voice and strips LaTeX', async () => {
  const { buildTts, ttsAudio, TTS_VOICES } = await import('../worker/tts.js');
  const B = String.fromCharCode(92);
  const f = buildTts({ text: `Xác suất $P(A${B}mid B)$`, gender: 'female' });
  assert.equal(f.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, TTS_VOICES.female);
  assert.deepEqual(f.generationConfig.responseModalities, ['AUDIO']);
  assert.ok(!f.contents[0].parts[0].text.includes('$'));
  assert.equal(buildTts({ text: 'hi', gender: 'male', lang: 'en' }).generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, TTS_VOICES.male);
  assert.throws(() => buildTts({ text: '' }), /Không có nội dung/);
  assert.throws(() => buildTts({ text: 'x'.repeat(1300) }), /quá dài/);
  assert.deepEqual(ttsAudio({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;rate=24000', data: 'AAA' } }] } }] }), { mime: 'audio/L16;rate=24000', data: 'AAA' });
  assert.equal(ttsAudio({}), null);
});

test('voice tutor refers to itself as cô or thầy to match the picked voice', () => {
  const f = buildRequest('voice', { text: 'Bayes là gì', gender: 'female' }).body.contents[0].parts[0].text;
  assert.match(f, /xưng là «cô»/);
  assert.match(f, /KHÔNG xưng «thầy»/);
  const m = buildRequest('voice', { text: 'Bayes là gì', gender: 'male' }).body.contents[0].parts[0].text;
  assert.match(m, /xưng là «thầy»/);
});

test('buildTts sends only the words to read, no spoken instruction', async () => {
  const { buildTts } = await import('../worker/tts.js');
  assert.equal(buildTts({ text: 'Xin chào em', gender: 'female', lang: 'vi' }).contents[0].parts[0].text, 'Xin chào em');
  assert.equal(buildTts({ text: 'Hello', gender: 'male', lang: 'en' }).contents[0].parts[0].text, 'Hello');
});

test('buildTts puts the reading style in systemInstruction, never in the spoken text', async () => {
  const { buildTts, TTS_STYLE } = await import('../worker/tts.js');
  const b = buildTts({ text: 'Xin chào em', gender: 'female', lang: 'vi' });
  assert.equal(b.systemInstruction.parts[0].text, TTS_STYLE.vi);
  assert.equal(b.contents[0].parts[0].text, 'Xin chào em');
  assert.equal(buildTts({ text: 'Hi', lang: 'en' }).systemInstruction.parts[0].text, TTS_STYLE.en);
});

test('English mode also tells every task, in the user turn, to answer in English even for Vietnamese input', () => {
  for (const task of ['voice', 'grade', 'practice', 'oral', 'lesson', 'mindmap', 'explain']) {
    const t = buildRequest(task, { text: 'định lí bayes là gì', problem: 'x', topic: 'x', name: 'x', lang: 'en' }).body.contents[0].parts[0].text;
    assert.match(t, /Answer ONLY in English/, task);
  }
  assert.doesNotMatch(buildRequest('voice', { text: 'xin chào' }).body.contents[0].parts[0].text, /Answer ONLY in English/);
});

test('translate task keeps item count/order and validates size', () => {
  const t = buildRequest('translate', { items: ['Xác suất $P(A)$', 'Lời giải'], to: 'en' }).body.contents[0].parts[0].text;
  assert.match(t, /English/);
  assert.match(t, /"items"/);
  assert.ok(t.includes('Xác suất $P(A)$'));
  assert.throws(() => buildRequest('translate', { items: 'x', to: 'en' }), /Danh sách/);
  assert.throws(() => buildRequest('translate', { items: ['x'.repeat(13000)], to: 'en' }), /quá dài/);
});

test('English mode forbids Vietnamese words and Vietnamese teacher pronouns', () => {
  const t = buildRequest('voice', { text: 'bayes', gender: 'female', lang: 'en' }).body.contents[0].parts[0].text;
  assert.match(t, /female teacher/);
  assert.doesNotMatch(t, /xưng là «cô»/);
  assert.match(t, /No Vietnamese words/);
  assert.match(t, /Understand the problem/);
});

test('Vietnamese mode answers in Vietnamese even after an English conversation', () => {
  const t = buildRequest('voice', { text: 'bayes', history: [{ role: 'ai', text: 'Hello! Bayes theorem…' }] }).body.contents[0].parts[0].text;
  assert.match(t, /HOÀN TOÀN bằng tiếng Việt/);
  for (const task of ['grade', 'practice', 'oral', 'lesson', 'explain']) {
    assert.match(buildRequest(task, { problem: 'x', topic: 'x', name: 'x' }).body.contents[0].parts[0].text, /HOÀN TOÀN bằng tiếng Việt/, task);
  }
  assert.doesNotMatch(buildRequest('voice', { text: 'hi', lang: 'en' }).body.contents[0].parts[0].text, /HOÀN TOÀN bằng tiếng Việt/);
});

test('wrongLanguage spots a Vietnamese reply in English mode and an English reply in Vietnamese mode', async () => {
  const { wrongLanguage } = await import('../worker/prompts.js');
  const vi = { reply: 'Chào em, định lí Bayes giúp cập nhật xác suất khi có thêm thông tin mới. Chúng ta hãy cùng khám phá.', topic: 'Xác suất có điều kiện & Bayes' };
  const en = { reply: 'Bayes theorem lets us update a probability when new information arrives. Let us explore it together with a real example from medicine and spam filters.', topic: 'Xác suất có điều kiện & Bayes' };
  assert.equal(wrongLanguage(vi, 'en'), true);
  assert.equal(wrongLanguage(en, 'en'), false); // the Vietnamese topic label is ignored
  assert.equal(wrongLanguage(en, 'vi'), true);
  assert.equal(wrongLanguage(vi, 'vi'), false);
  assert.equal(wrongLanguage({ score: 7, reply: 'OK' }, 'vi'), false); // too short to judge
});
