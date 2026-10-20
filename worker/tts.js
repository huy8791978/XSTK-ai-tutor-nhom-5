// Text-to-speech through Gemini: real female/male voices on every device (Windows Chrome only ships a male
// Vietnamese voice). Pure helpers so they can be unit-tested; index.js does the network call.

export const TTS_VOICES = { female: 'Kore', male: 'Charon' };
const MAX_CHARS = 1200;
export const TTS_STYLE = {
  vi: 'Đọc văn bản người dùng gửi bằng giọng giáo viên: rõ ràng, ấm áp, thân thiện, tốc độ vừa phải. Chỉ đọc đúng văn bản đó, không đọc chỉ dẫn này.',
  en: 'Read the user text in a teacher voice: clear, warm, friendly, at a moderate pace. Read only that text, never this instruction.',
};

/** Validate { text, gender, lang } and build a generateContent body that returns audio. Throws a Vietnamese Error. */
export function buildTts({ text, gender, lang } = {}) {
  const t = String(text ?? '').replace(/\$+/g, '').replace(/\\[a-zA-Z]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) throw new Error('Không có nội dung để đọc.');
  if (t.length > MAX_CHARS) throw new Error('Nội dung quá dài để đọc.');
  const voice = TTS_VOICES[gender === 'male' ? 'male' : 'female'];
  return {
    // The reading style goes in systemInstruction, which the model follows but does not speak; the text holds
    // only the words to read (an instruction placed there gets read aloud).
    systemInstruction: { parts: [{ text: TTS_STYLE[lang === 'en' ? 'en' : 'vi'] }] },
    contents: [{ role: 'user', parts: [{ text: t }] }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
  };
}

/** Pull the audio out of a generateContent reply: { mime, data (base64) } or null. */
export function ttsAudio(reply) {
  const part = (reply?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data);
  return part ? { mime: part.inlineData.mimeType || 'audio/L16;rate=24000', data: part.inlineData.data } : null;
}
