// Voice commands: move around the site and press buttons by voice. Everything runs in the browser
// (speech recognition + keyword matching): no AI call, no quota.
// Two ways to give a command:
//  - tap or hold the mic button (hold = push-to-talk), say the command;
//  - «Nghe liên tục»: the page listens all the time but only acts on what follows the wake word
//    «Trợ lý ơi …» / «Assistant …», so a lecture is never taken for a command.
// Commands act at once; «quay lại» / «hoàn tác» goes back. Only buttons that delete something wait for «xác nhận».

/** Lowercase, no accents (đ → d), punctuation → spaces. Keeps the word count of tokens(). */
export const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
const words = (s) => (norm(s) ? norm(s).split(' ') : []);
/** The spoken words with their accents (for values typed into a field), aligned with words(). */
const rawWords = (s) => String(s || '').replace(/[^\p{L}\p{N}\p{M}\s]/gu, ' ').split(/\s+/).filter(Boolean);

export const ROUTE_WORDS = {
  'cham-bai': ['gia su cham bai', 'cham bai', 'gia su', 'trang chu', 'tutor', 'grading', 'home'],
  'ly-thuyet': ['hoc ly thuyet', 'hoc li thuyet', 'ly thuyet', 'li thuyet', 'khai niem', 'learn concepts', 'concepts', 'concept', 'theory'],
  'dinh-li': ['hoc dinh li', 'hoc dinh ly', 'dinh li', 'dinh ly', 'learn theorems', 'theorems', 'theorem'],
  'tu-luan': ['bai tap tu luan', 'tu luan', 'essay problems', 'essay'],
  'trac-nghiem': ['bai tap trac nghiem', 'trac nghiem', 'multiple choice', 'quiz'],
  'mini-game': ['mini game trac nghiem', 'mini game', 'minigame', 'tro choi', 'game'],
  'van-dap': ['van dap ly thuyet', 'van dap li thuyet', 'van dap', 'oral exam', 'oral'],
  'giong-noi': ['hoi dap giong noi', 'giong noi', 'voice q a', 'voice'],
  'cong-thuc': ['hoi dap cong thuc', 'cong thuc', 'formula q a', 'formulas', 'formula'],
  'thong-ke': ['thong ke loi sai', 'thong ke', 'loi sai', 'mistake statistics', 'mistakes', 'statistics'],
  'ban-do': ['ban do tu duy', 'ban do', 'tu duy', 'so do tu duy', 'mind map', 'mindmap'],
  'dien-dan': ['dien dan xstk', 'dien dan', 'forum'],
  'kham-pha': ['kham pha cach hoc', 'kham pha', 'cach hoc', 'discover', 'learning styles'],
  'phong-thi-nghiem': ['phong thi nghiem', 'thi nghiem', 'lab', 'simulation'],
  'thach-dau': ['thach dau ban', 'thach dau', 'doi khang', 'challenge', 'duel'],
  'cuoc-doi': ['xac suat va cuoc doi', 'cuoc doi', 'nghich li', 'life', 'paradoxes'],
  'ho-so': ['ho so hoc tap', 'ho so cua toi', 'ho so', 'learning profile', 'my profile', 'profile'],
};
const NAV_VERBS = ['chuyen sang', 'chuyen qua', 'chuyen den', 'chuyen toi', 'di toi', 'di den', 'quay ve', 've', 'mo', 'sang', 'qua', 'vao', 'toi', 'den', 'chuyen',
  'go to', 'switch to', 'open', 'show', 'go'];
const FILLER = ['trang', 'muc', 'chuc nang', 'phan', 'tab', 'the', 'page', 'cho toi', 'giup toi', 'di', 'nhe', 'nha', 'a', 'please'];
const CLICK_VERBS = ['bam vao', 'bam nut', 'nhan vao', 'nhan nut', 'cham vao', 'bam', 'nhan', 'chon', 'click', 'press', 'tap', 'hit'];
const FILL_VERBS = ['dien', 'nhap', 'ghi', 'go', 'chon', 'dat', 'type', 'fill in', 'fill', 'enter', 'set', 'choose', 'select'];
const FILL_SEP = ['la', 'bang', 'thanh', 'is', 'with', 'as'];
const WAKE = [['tro', 'ly', 'oi'], ['tro', 'li', 'oi'], ['tro', 'ly'], ['tro', 'li'], ['hey', 'assistant'], ['assistant']];

const SIMPLE = [
  [['dung doc', 'dung noi', 'dung lai', 'dung', 'im lang', 'im', 'thoi', 'stop talking', 'stop', 'be quiet', 'quiet'], { type: 'hush' }],
  [['quay lai', 'tro lai', 'lui lai', 'hoan tac', 'quay ve truoc', 'go back', 'back', 'undo'], { type: 'back' }],
  [['tien toi', 'di tiep', 'tien len', 'forward', 'redo'], { type: 'forward' }],
  [['cuon xuong', 'keo xuong', 'xuong', 'xuong duoi', 'scroll down', 'down'], { type: 'scroll', dir: 1 }],
  [['cuon len', 'keo len', 'len', 'len tren', 'scroll up', 'up'], { type: 'scroll', dir: -1 }],
  [['len dau trang', 'dau trang', 'len dau', 'top', 'to the top', 'scroll to top'], { type: 'scroll', to: 'top' }],
  [['xuong cuoi trang', 'cuoi trang', 'xuong cuoi', 'bottom', 'to the bottom', 'scroll to bottom'], { type: 'scroll', to: 'bottom' }],
  [['tieng anh', 'chuyen sang tieng anh', 'english', 'switch to english'], { type: 'lang', lang: 'en' }],
  [['tieng viet', 'chuyen sang tieng viet', 'vietnamese', 'switch to vietnamese'], { type: 'lang', lang: 'vi' }],
  [['tat nghe', 'ngung nghe', 'tat nghe lien tuc', 'stop listening'], { type: 'listen', on: false }],
  [['xac nhan', 'dong y', 'confirm', 'yes'], { type: 'confirm' }],
  [['huy', 'khong', 'cancel', 'no'], { type: 'cancel' }],
  [['giup', 'tro giup', 'huong dan', 'cac lenh', 'danh sach lenh', 'help', 'commands'], { type: 'help' }],
];

/** Index of the last wake word in a word list, and its length; null when absent. */
export function findWake(w) {
  let best = null;
  for (let i = 0; i < w.length; i++) {
    for (const p of WAKE) {
      if (p.every((x, k) => w[i + k] === x) && (!best || i > best.i || (i === best.i && p.length > best.n))) best = { i, n: p.length };
    }
  }
  return best;
}

const startsWith = (w, phrase) => { const p = phrase.split(' '); return p.every((x, k) => w[k] === x) ? p.length : 0; };
const strip = (w, list) => { for (const ph of [...list].sort((a, b) => b.length - a.length)) { const n = startsWith(w, ph); if (n) return { w: w.slice(n), n }; } return { w, n: 0 }; };
const dropFiller = (w) => { let out = w; for (;;) { const a = strip(out, FILLER); const b = { w: a.w.filter((x, i) => !(i === a.w.length - 1 && FILLER.includes(x))) }; if (b.w.length === out.length) return out; out = b.w; } };

/**
 * Turn one utterance into an action, or null when it is not a command. Pure: no DOM.
 * `{ wake: true }` (continuous listening): only words after «trợ lý ơi» count; none → { type: 'none' }.
 * Returns e.g. { type: 'nav', route }, { type: 'click', label }, { type: 'fill', field, value }, { type: 'back' }…
 */
export function parseCommand(text, { wake = false } = {}) {
  let w = words(text), raw = rawWords(text);
  if (raw.length !== w.length) raw = w; // alignment lost (rare symbols): type the unaccented words
  const hit = findWake(w);
  if (wake && !hit) return { type: 'none' };
  if (hit) { w = w.slice(hit.i + hit.n); raw = raw.slice(hit.i + hit.n); }
  if (!w.length) return hit ? { type: 'wake' } : null;
  const flat = w.join(' ');
  // 1. Short fixed commands (the whole utterance, a filler word allowed: «quay lại đi»).
  const core = dropFiller(w).join(' ');
  for (const [phrases, action] of SIMPLE) if (phrases.includes(flat) || phrases.includes(core)) return { ...action };
  // 2. «Điền chủ đề là khoảng tin cậy»: field name, then the value as spoken (accents kept).
  const fv = strip(w, FILL_VERBS);
  if (fv.n) {
    const sep = fv.w.findIndex((x, i) => i > 0 && FILL_SEP.includes(x));
    if (sep > 0 && sep < fv.w.length - 1) {
      return { type: 'fill', field: fv.w.slice(fv.w[0] === 'o' || fv.w[0] === 'the' ? 1 : 0, sep).join(' '), value: raw.slice(fv.n + sep + 1).join(' ') };
    }
  }
  // 3. «Bấm tạo 5 bài»: press the button with that label.
  const cv = strip(w, CLICK_VERBS);
  if (cv.n && cv.w.length) return { type: 'click', label: dropFiller(cv.w).join(' ') || cv.w.join(' ') };
  // 4. «Sang trắc nghiệm», «mở trang bản đồ tư duy», or just «trắc nghiệm»: the whole rest must be a page name.
  const nv = strip(w, NAV_VERBS);
  const rest = [nv.w.join(' '), dropFiller(nv.w).join(' ')];
  for (const [route, names] of Object.entries(ROUTE_WORDS)) if (rest.some((r) => names.includes(r))) return { type: 'nav', route, verb: nv.n > 0 };
  // 5. Anything else may be a button label said without «bấm» («tạo 5 bài tự luận», «xem gợi ý»).
  return { type: 'click', label: core || flat, bare: true };
}

const QUICK_TYPES = ['nav', 'hush', 'back', 'forward', 'scroll', 'lang', 'listen', 'help', 'confirm'];
const KNOWN = [...SIMPLE.flatMap(([p]) => p), ...Object.values(ROUTE_WORDS).flat()].map((p) => p.split(' '));
const same = (a, b) => a?.type === b?.type && a.route === b.route && a.dir === b.dir && a.to === b.to && a.lang === b.lang && a.on === b.on;

/**
 * The command to run right now, from text still being spoken (interim), or null to keep listening.
 * Only page changes and fixed commands qualify, and only when no longer command starts the same way
 * («xuống» waits: it may become «xuống cuối trang»). Button labels and field values wait for the pause.
 */
export function quickCommand(text, { wake = false } = {}) {
  const a = parseCommand(text, { wake });
  if (!a || a.type === 'wake') return a;
  if (!QUICK_TYPES.includes(a.type)) return null;
  const w = words(text);
  for (const p of KNOWN) {
    for (let k = Math.min(p.length - 1, w.length); k >= 1; k--) {
      if (!p.slice(0, k).every((x, i) => w[w.length - k + i] === x)) continue;
      const b = parseCommand([...w, ...p.slice(k)].join(' '), { wake }); // what it would mean with more words
      if (QUICK_TYPES.includes(b?.type) && !same(b, a)) return null;
    }
  }
  return a;
}

/**
 * Best label for what was said, among on-screen labels. Returns the index or -1.
 * `bare` (no «bấm»): the label must match closely, so a stray sentence never presses anything.
 */
export function bestMatch(said, labels, { bare = false } = {}) {
  const s = words(said);
  if (!s.length) return -1;
  let best = -1, score = 0;
  labels.forEach((label, i) => {
    const l = words(label);
    if (!l.length || l.length > 12) return;
    let sc = 0;
    if (l.join(' ') === s.join(' ')) sc = 100;
    else {
      const inL = s.filter((x) => l.includes(x)).length / s.length; // what was said, found in the label
      const inS = l.filter((x) => s.includes(x)).length / l.length; // the label, found in what was said
      if (bare) { if (inL === 1 && inS >= 0.75) sc = 50 + 40 * inS; }
      else if (inL >= 0.8 && inS >= 0.5) sc = 40 * inL + 40 * inS;
      else if (inL === 1 && s.length >= 2) sc = 30 + 20 * inS; // «bấm gợi ý» → «Xem gợi ý cách giải»
    }
    if (sc > score) { score = sc; best = i; }
  });
  return best;
}

const DANGER = /\b(xoa|delete|remove|reset|dat lai|clear)\b/;
export const needsConfirm = (label) => DANGER.test(norm(label));
