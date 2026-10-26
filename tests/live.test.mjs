import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LiveRelay, orderLive, liveSetup, historyText } from '../worker/live.js';

// A WebSocket-like fake: records what is sent, lets the test push messages or close it.
function fakeSocket() {
  const ls = { message: [], close: [], error: [] };
  return {
    sent: [], closed: null,
    send(s) { if (this.closed) throw new Error('closed'); this.sent.push(JSON.parse(s)); },
    close(code = 1000, reason = '') { if (this.closed) return; this.closed = { code, reason }; ls.close.forEach((f) => f({ code, reason })); },
    addEventListener(t, f) { ls[t].push(f); },
    removeEventListener(t, f) { ls[t] = ls[t].filter((g) => g !== f); },
    push(msg) { ls.message.forEach((f) => f({ data: JSON.stringify(msg) })); },
    drop(code, reason = '') { this.closed = { code, reason }; ls.close.forEach((f) => f({ code, reason })); },
  };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
const fromClient = (c) => c.sent.map((m) => m.t);

/** Upstream behaviour per model: 'ok' answers setupComplete, 'dead' closes at once, 'quota' closes with a quota reason. */
function world(behaviour) {
  const ups = {};
  const connect = async (model) => {
    const ws = fakeSocket();
    (ups[model] ??= []).push(ws);
    const b = behaviour[model] || 'dead';
    const origSend = ws.send.bind(ws);
    ws.send = (s) => {
      origSend(s);
      const m = JSON.parse(s);
      if (!m.setup) return;
      if (b === 'ok') queueMicrotask(() => ws.push({ setupComplete: {} }));
      else if (b === 'quota') queueMicrotask(() => ws.drop(1011, 'RESOURCE_EXHAUSTED: quota'));
      else if (b === 'notools' && m.setup.tools) queueMicrotask(() => ws.drop(1007, 'invalid argument'));
      else if (b === 'notools') queueMicrotask(() => ws.push({ setupComplete: {} }));
      else queueMicrotask(() => ws.drop(1008, 'not found'));
    };
    return ws;
  };
  return { ups, connect };
}

test('orderLive: configured order, only served models, then other served ones newest first', () => {
  assert.deepEqual(orderLive(['a', 'b'], []), ['a', 'b']);
  assert.deepEqual(orderLive(['gemini-3.8-live', 'nope'], ['gemini-2.5-x-live', 'gemini-3.8-live', 'gemini-3.5-live-translate', 'gemini-3-flash-live']),
    ['gemini-3.8-live', 'gemini-3-flash-live', 'gemini-2.5-x-live']);
});

test('liveSetup carries voice, persona, transcription, tool and earlier conversation', () => {
  const s = liveSetup('gemini-3.8-live', { mode: 'formula', gender: 'male', lang: 'vi', history: [{ user: 'P(A)?', ai: 'Xác suất của A' }] }).setup;
  assert.equal(s.model, 'models/gemini-3.8-live');
  assert.equal(s.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Charon');
  assert.ok(s.systemInstruction.parts[0].text.includes('CÔNG THỨC') && s.systemInstruction.parts[0].text.includes('Sinh viên: P(A)?'));
  assert.equal(s.tools[0].functionDeclarations[0].name, 'show_math');
  assert.deepEqual([s.inputAudioTranscription, s.outputAudioTranscription], [{}, {}]);
  assert.equal(liveSetup('m', { tools: false }).setup.tools, undefined);
  assert.ok(!liveSetup('m', { lang: 'en' }).setup.systemInstruction.parts[0].text.includes('cô giáo'));
  assert.equal(historyText([], 'vi'), '');
});

test('relay starts on the first model that works, skipping dead and out-of-quota ones', async () => {
  const w = world({ a: 'dead', b: 'quota', c: 'ok' });
  const benched = new Map();
  const client = fakeSocket();
  const r = new LiveRelay(client, { models: ['a', 'b', 'c'], benched, connect: w.connect, mode: 'voice', gender: 'female', lang: 'vi' });
  assert.equal(await r.start(), true);
  assert.deepEqual(fromClient(client), ['ready']);
  assert.equal(client.sent[0].model, 'c');
  assert.ok(benched.get('a') > Date.now() && benched.get('b') > Date.now());
  r.end();
});

test('relay retries a model without the tool when it rejects the tool', async () => {
  const w = world({ a: 'notools' });
  const client = fakeSocket();
  const r = new LiveRelay(client, { models: ['a'], benched: new Map(), connect: w.connect, mode: 'voice', gender: 'female', lang: 'vi' });
  assert.equal(await r.start(), true);
  assert.equal(w.ups.a.length, 2);
  assert.equal(w.ups.a[1].sent[0].setup.tools, undefined);
  r.end();
});

test('relay forwards audio, transcripts and formulas, and answers tool calls itself', async () => {
  const w = world({ a: 'ok' });
  const client = fakeSocket();
  const r = new LiveRelay(client, { models: ['a'], benched: new Map(), connect: w.connect, mode: 'voice', gender: 'female', lang: 'vi' });
  await r.start();
  const up = w.ups.a[0];
  client.push({ t: 'audio', d: 'AAAA' });
  client.push({ t: 'text', text: 'Công thức cộng là gì?' });
  client.push({ t: 'image', mime: 'image/png', d: 'QUJD' });
  client.push({ t: 'image', mime: 'text/html', d: 'x' }); // ignored
  assert.deepEqual(up.sent.slice(1).map((m) => Object.keys(m.realtimeInput)[0]), ['audio', 'text', 'video']);
  up.push({ toolCall: { functionCalls: [{ id: '7', name: 'show_math', args: { latex: 'P(A+B)', caption: 'Cộng' } }] } });
  assert.deepEqual(up.sent.at(-1), { toolResponse: { functionResponses: [{ id: '7', name: 'show_math', response: { result: 'đã hiện trên màn hình' } }] } });
  up.push({ serverContent: { modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: 'UUU=' } }] }, outputTranscription: { text: 'Xin chào' } } });
  up.push({ serverContent: { turnComplete: true } });
  assert.deepEqual(fromClient(client), ['ready', 'math', 'audio', 'out', 'turn']);
  assert.deepEqual(r.history, [{ user: 'Công thức cộng là gì?', ai: 'Xin chào' }]);
  r.end();
  assert.ok(up.closed && client.closed);
});

test('a model that drops mid-answer is replaced silently and the question is asked again', async () => {
  const w = world({ a: 'ok', b: 'ok' });
  const benched = new Map();
  const client = fakeSocket();
  const r = new LiveRelay(client, { models: ['a', 'b'], benched, connect: w.connect, mode: 'voice', gender: 'female', lang: 'vi' });
  await r.start();
  w.ups.a[0].push({ serverContent: { inputTranscription: { text: 'Kì vọng là gì' } } });
  w.ups.a[0].drop(1011, 'quota exceeded');
  await tick(); await tick();
  assert.deepEqual(fromClient(client), ['ready', 'in', 'switch', 'ready']);
  assert.ok(benched.get('a') > Date.now());
  assert.deepEqual(w.ups.b[0].sent.at(-1), { realtimeInput: { text: 'Kì vọng là gì' } });
  r.end();
});

test('after a planned goAway the same model continues; when every model fails the browser is told', async () => {
  const w = world({ a: 'ok' });
  const client = fakeSocket();
  const r = new LiveRelay(client, { models: ['a'], benched: new Map(), connect: w.connect, mode: 'voice', gender: 'female', lang: 'vi' });
  await r.start();
  w.ups.a[0].push({ goAway: { timeLeft: '10s' } });
  w.ups.a[0].drop(1000);
  await tick(); await tick();
  assert.equal(w.ups.a.length, 2);
  assert.equal(fromClient(client).at(-1), 'ready');

  const dead = world({});
  const c2 = fakeSocket();
  const r2 = new LiveRelay(c2, { models: ['x', 'y'], benched: new Map(), connect: dead.connect, mode: 'voice', gender: 'female', lang: 'vi' });
  assert.equal(await r2.start(), false);
  assert.deepEqual(fromClient(c2), ['unavailable']);
  assert.ok(c2.closed);
  r.end();
});

test('changing the voice opens a new session with the conversation kept', async () => {
  const w = world({ a: 'ok' });
  const client = fakeSocket();
  const r = new LiveRelay(client, { models: ['a'], benched: new Map(), connect: w.connect, mode: 'voice', gender: 'female', lang: 'vi' });
  await r.start();
  r.history.push({ user: 'chào', ai: 'chào em' });
  client.push({ t: 'config', gender: 'male' });
  await tick(); await tick();
  const s = w.ups.a[1].sent[0].setup;
  assert.equal(s.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Charon');
  assert.ok(s.systemInstruction.parts[0].text.includes('chào em'));
  r.end();
});

test('Live personas carry the spoken-formula guide and ask for the whole formula on screen', () => {
  const sys = (mode, lang) => liveSetup('m', { mode, lang }).setup.systemInstruction.parts[0].text;
  assert.ok(sys('formula', 'vi').includes('ép/phờ = F') && sys('formula', 'vi').includes('TRỌN VẸN'));
  assert.ok(sys('voice', 'vi').includes('NHÓM ĐÚNG'));
  assert.ok(sys('formula', 'en').includes('WHOLE formula') && sys('formula', 'en').includes('standard normal'));
  assert.ok(!sys('formula', 'en').includes('cô giáo'));
});

test('Live waits longer for the end of speech on the formula page', () => {
  const vad = (mode) => liveSetup('m', { mode }).setup.realtimeInputConfig.automaticActivityDetection;
  assert.equal(vad('formula').silenceDurationMs, 2000);
  assert.equal(vad('voice').silenceDurationMs, 1200);
  assert.equal(vad('formula').endOfSpeechSensitivity, 'END_SENSITIVITY_LOW');
});
