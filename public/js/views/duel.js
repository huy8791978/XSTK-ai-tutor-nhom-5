// «Thách đấu bạn»: the AI writes 5 questions; the student plays them, then sends a friend a link that carries the
// questions and the score (compressed into the URL, no server, no account). The friend plays the same set and can
// send their result back. The answers travel in the link: this is a friendly game, not an exam.
import { h, rich, run, toast } from '../ui.js';
import { ai } from '../api.js';
import { addSession, useLens } from '../profile.js';
import { TOPICS, QUIZ_LEVELS } from '../topics.js';

export const meta = { title: 'Thách đấu bạn', lede: 'AI soạn 5 câu trắc nghiệm, em làm trước rồi gửi link cho bạn.\nBạn làm cùng bộ câu hỏi, hai người so điểm và thời gian.' };

// ---- link codec (tested): JSON → deflate-raw → base64url, prefixed «z»; «j» when the browser cannot compress.
const b64u = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const through = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

export async function pack(obj) {
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  return typeof CompressionStream === 'undefined' ? `j${b64u(raw)}` : `z${b64u(await through(raw, new CompressionStream('deflate-raw')))}`;
}
/** Decode and validate a challenge from a link (untrusted). Returns null when it is not a valid challenge. */
export async function unpack(s) {
  try {
    if (typeof s !== 'string' || s.length > 60000) return null;
    let bytes = unb64u(s.slice(1));
    if (s[0] === 'z') bytes = await through(bytes, new DecompressionStream('deflate-raw'));
    else if (s[0] !== 'j') return null;
    return valid(JSON.parse(new TextDecoder().decode(bytes)));
  } catch { return null; }
}
const str = (x, n) => (typeof x === 'string' ? x.slice(0, n) : '');
const player = (p) => (p && typeof p === 'object' && Number.isInteger(p.score) && Number.isFinite(p.ms)
  ? { name: str(p.name, 30), score: Math.max(0, Math.min(5, p.score)), ms: Math.max(0, Math.round(p.ms)) } : null);
function valid(c) {
  if (!c || c.v !== 1 || !Array.isArray(c.qs) || c.qs.length < 1 || c.qs.length > 10) return null;
  const qs = c.qs.map((q) => ({ p: str(q?.p, 1200), o: Array.isArray(q?.o) ? q.o.slice(0, 4).map((o) => str(o, 300)) : [], a: Number(q?.a), e: str(q?.e, 800), t: str(q?.t, 80) }));
  if (qs.some((q) => !q.p || q.o.length !== 4 || !Number.isInteger(q.a) || q.a < 0 || q.a > 3)) return null;
  return { v: 1, topic: str(c.topic, 80), level: str(c.level, 20), qs, from: player(c.from), to: player(c.to) };
}

const secs = (ms) => `${String(Math.round(ms / 100) / 10).replace('.', ',')} giây`;
const link = (code) => `${location.origin}${location.pathname}#thach-dau?c=${code}`;

export function render(root) {
  const code = new URLSearchParams(location.hash.split('?')[1] || '').get('c');
  if (code) {
    const box = h('div', {}, h('p.muted', {}, 'Đang mở thử thách…'));
    root.append(box);
    unpack(code).then((c) => box.replaceChildren(c ? received(c) : h('div.error', { role: 'alert' }, 'Link thách đấu không hợp lệ hoặc bị cắt mất một đoạn. Nhờ bạn gửi lại link đầy đủ.'), h('p', { style: 'margin-top:16px' }, h('a.btn.btn-ghost', { href: '#thach-dau' }, 'Tạo thử thách mới'))));
    return;
  }
  const name = h('input', { type: 'text', id: 'duel-name', maxlength: 30, placeholder: 'Tên hiển thị cho bạn của em' });
  const topic = h('select', { id: 'duel-topic' }, TOPICS.map((t) => h('option', {}, t)));
  const level = h('select', { id: 'duel-level' }, QUIZ_LEVELS.map((t) => h('option', { selected: t === 'Trung bình' }, t)));
  const btn = h('button.btn.btn-primary', { type: 'button' }, 'Tạo bộ 5 câu');
  const out = h('div', {}, h('div.panel.empty', {}, h('p', {}, 'Chọn chủ đề, làm 5 câu, rồi gửi link cho bạn. Ai đúng nhiều hơn thắng; bằng điểm thì ai nhanh hơn thắng.')));
  btn.onclick = () => run(btn, out, async () => {
    const d = await ai('duel', { topic: topic.value, level: level.value });
    const qs = (d.questions || []).filter((q) => q?.prompt && Array.isArray(q.options) && q.options.length === 4).slice(0, 5)
      .map((q) => ({ p: q.prompt, o: q.options.map(String), a: Number(q.answer), e: q.explain || '', t: q.topic || topic.value }));
    if (!qs.length) throw new Error('AI chưa soạn được câu hỏi. Bấm thử lại.');
    const c = { v: 1, topic: topic.value, level: level.value, qs };
    return play(c, async (me) => {
      const shared = await pack({ ...c, from: { ...me, name: name.value.trim() } });
      return sharePanel(link(shared), 'Gửi link này cho bạn. Bạn mở ra sẽ làm đúng 5 câu này và thấy điểm của em.');
    });
  }, 'AI đang soạn thử thách…');
  root.append(h('div.toolbar', {},
    h('label.field', { for: name.id, style: 'max-width:240px' }, h('span', {}, 'Tên của em (tuỳ chọn)'), name),
    h('label.field', { for: topic.id }, h('span', {}, 'Chủ đề'), topic),
    h('label.field', { for: level.id, style: 'max-width:180px' }, h('span', {}, 'Mức độ'), level),
    h('div.btn-row', {}, btn)), out);
}

function received(c) {
  const who = (p, me) => p.name || (me ? 'Em' : 'Bạn em');
  if (c.from && c.to) return h('div', {}, board(c, who(c.from), who(c.to)), h('p.muted', { style: 'margin-top:14px' }, 'Đây là kết quả hai người đã chơi. Muốn đấu tiếp thì tạo thử thách mới.'));
  const name = h('input', { type: 'text', id: 'duel-name2', maxlength: 30, placeholder: 'Tên của em (tuỳ chọn)' });
  const area = h('div');
  const bStart = h('button.btn.btn-primary', { type: 'button', onclick: () => {
    bStart.disabled = true;
    area.replaceChildren(play(c, async (me) => {
      const to = { ...me, name: name.value.trim() };
      const shared = await pack({ ...c, to });
      return h('div', {}, board({ ...c, to }, who(c.from), who(to, true)), sharePanel(link(shared), 'Gửi lại link này để bạn thấy kết quả của em.'));
    }));
  } }, 'Nhận thử thách');
  return h('section.panel', {},
    h('h2', {}, c.from?.name ? h('span', {}, c.from.name) : 'Bạn em', ' ', 'thách em!'),
    h('p', { style: 'margin:8px 0 14px' }, `${c.qs.length} câu · ${c.topic} · ${c.level}.`, ' ', c.from ? `Đối thủ đúng ${c.from.score}/${c.qs.length} trong ${secs(c.from.ms)}.` : ''),
    h('div.toolbar', {}, h('label.field', { for: name.id, style: 'max-width:260px' }, h('span', {}, 'Tên của em'), name), h('div.btn-row', {}, bStart)),
    area);
}

/** Five questions at once; the clock starts when they appear. done(result) → node shown under the score. */
function play(c, done) {
  const t0 = Date.now(), picks = Array(c.qs.length).fill(-1);
  const cards = c.qs.map((q, i) => {
    const nm = `duel${i}-${Math.random().toString(36).slice(2, 6)}`;
    const opts = q.o.map((o, k) => h('label.opt', {}, h('input', { type: 'radio', name: nm, value: k, onchange: () => { picks[i] = k; } }), h('span.k', {}, 'ABCD'[k]), rich(String(o).replace(/^[A-D][.)]\s*/, ''), 'span', true)));
    return { opts, el: h('article.q.panel', {}, h('div.q-head', {}, h('span.q-num', {}, String(i + 1).padStart(2, '0')), q.t ? h('span.tag.topic', {}, q.t) : null), rich(q.p, 'div', true), h('div.options', { role: 'radiogroup', 'aria-label': 'Phương án' }, opts), h('div.duel-explain')) };
  });
  const result = h('div');
  const bDone = h('button.btn.btn-primary', { type: 'button' }, 'Nộp bài');
  bDone.onclick = async () => {
    if (picks.includes(-1) && !confirm('Còn câu chưa chọn. Vẫn nộp bài?')) return;
    const ms = Date.now() - t0;
    bDone.disabled = true;
    let score = 0;
    c.qs.forEach((q, i) => {
      const ok = picks[i] === q.a; score += ok;
      cards[i].opts.forEach((o, k) => { o.classList.toggle('right', k === q.a); o.classList.toggle('wrong', k === picks[i] && !ok); o.querySelector('input').disabled = true; });
      if (q.e) cards[i].el.querySelector('.duel-explain').replaceChildren(h('div.reveal', {}, rich(q.e, 'div', true)));
    });
    useLens('interpersonal');
    addSession({ feature: 'duel', topic: c.topic, score: (10 * score) / c.qs.length, mistakes: c.qs.filter((q, i) => picks[i] !== q.a).map((q) => ({ topic: q.t, type: 'Chọn sai đáp án trắc nghiệm', detail: q.p.slice(0, 160) })) });
    result.replaceChildren(h('div.panel.ticket', {}, h('div.board', {}, h('div.row.top-tier', {}, h('b', {}, 'Kết quả'), h('span', {}, `Đúng ${score}/${c.qs.length} trong ${secs(ms)}. Đã lưu vào hồ sơ.`)))));
    try { result.append(await done({ score, ms })); } catch { toast('Không tạo được link. Thử trình duyệt khác.'); }
    result.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  };
  return h('div.stack', {}, ...cards.map((x) => x.el), h('div.btn-row', {}, bDone), result);
}

function board(c, a, b) {
  const n = c.qs.length, A = c.from, B = c.to;
  const win = A.score !== B.score ? (A.score > B.score ? 'A' : 'B') : A.ms === B.ms ? '' : A.ms < B.ms ? 'A' : 'B';
  const row = (who, p, me) => h('div.row', {}, h('b', {}, win === me ? '🏆' : ''), h('span', {}, h('strong', {}, who)), h('em', {}, `${p.score}/${n} · ${secs(p.ms)}`));
  return h('div.panel.ticket', { style: 'margin-top:16px' }, h('div.board', {}, row(a, A, 'A'), row(b, B, 'B')),
    h('p', { style: 'margin-top:10px' }, win ? h('span', {}, win === 'A' ? a : b, ' ', 'thắng!') : 'Hoà!'));
}

function sharePanel(url, hint) {
  const field = h('input', { type: 'text', readonly: true, value: url, id: `duel-link-${Math.random().toString(36).slice(2, 6)}`, onfocus: (e) => e.target.select() });
  const copy = async () => { try { await navigator.clipboard.writeText(url); toast('Đã chép link.'); } catch { field.select(); toast('Hãy chép link trong ô.'); } };
  return h('section.panel', { style: 'margin-top:16px' }, h('h3', { style: 'margin-top:0' }, 'Link thách đấu'), h('p.muted', { style: 'margin:6px 0 10px' }, hint),
    h('label.field', { for: field.id }, h('span', {}, 'Link'), field),
    h('div.btn-row', { style: 'margin-top:10px' }, h('button.btn.btn-primary', { type: 'button', onclick: copy }, 'Chép link'),
      navigator.share ? h('button.btn', { type: 'button', onclick: () => navigator.share({ title: 'Thách đấu XSTK', url }).catch(() => {}) }, 'Chia sẻ…') : null));
}
