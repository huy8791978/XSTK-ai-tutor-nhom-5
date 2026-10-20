// Text-to-speech through Gemini: real female/male voices on every device (Windows Chrome only ships a male
// Vietnamese voice). Pure helpers so they can be unit-tested; index.js does the network call.

export const TTS_VOICES = { female: 'Kore', male: 'Charon' };
const MAX_CHARS = 1200;

/** Validate { text, gender, lang } and build a generateContent body that returns audio. Throws a Vietnamese Error. */
export function buildTts({ text, gender, lang } = {}) {
  const t = String(text ?? '').replace(/\$+/g, '').replace(/\\[a-zA-Z]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) throw new Error('Không có nội dung để đọc.');
  if (t.length > MAX_CHARS) throw new Error('Nội dung quá dài để đọc.');
  const voice = TTS_VOICES[gender === 'male' ? 'male' : 'female'];
  const style = lang === 'en' ? 'Read this clearly and warmly, like a friendly teacher:' : 'Đọc rõ ràng, ấm áp như một giáo viên thân thiện:';
  return {
    contents: [{ role: 'user', parts: [{ text: `${style} ${t}` }] }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
  };
}

/** Pull the audio out of a generateContent reply: { mime, data (base64) } or null. */
export function ttsAudio(reply) {
  const part = (reply?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data);
  return part ? { mime: part.inlineData.mimeType || 'audio/L16;rate=24000', data: part.inlineData.data } : null;
}
