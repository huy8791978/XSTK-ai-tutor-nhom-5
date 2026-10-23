// A real-time conversation shown in a thread: the student's words, the tutor's words as they are spoken, and the
// formulas the tutor puts on screen (show_math). onTurn(turn) runs when a turn ends, for written extras.
import { h, rich } from './ui.js';

export function liveThread(thread, { onTurn } = {}) {
  let cur = null;
  const fresh = () => ({ user: '', ai: '', me: null, bubble: null, said: null, math: [], closed: false });
  const open = () => (cur && !cur.closed ? cur : (cur = fresh()));
  const bubble = (t) => {
    if (!t.bubble) { t.said = h('p'); t.bubble = h('div.msg.ai', {}, t.said); thread.append(t.bubble); }
    return t.bubble;
  };
  const meBubble = (t, node) => {
    if (!t.me) { t.me = h('div.msg.me'); (t.bubble ? t.bubble.before(t.me) : thread.append(t.me)); }
    t.me.replaceChildren(node);
  };
  const close = () => {
    if (!cur || cur.closed) return;
    cur.closed = true;
    if (cur.user || cur.ai || cur.math.length) onTurn?.(cur);
  };
  return {
    /** The student typed or sent something; shown is what the bubble says (defaults to the text). */
    typed(text, shown = text) { close(); const t = open(); t.user += text; meBubble(t, rich(shown)); },
    user(text) {
      // New speech after the tutor already answered starts a new turn (the student cut in).
      if (cur && !cur.closed && cur.ai) close();
      const t = open(); t.user += text; meBubble(t, h('p', {}, t.user.trim()));
    },
    ai(text) { const t = open(); t.ai += text; bubble(t); t.said.textContent = t.ai.trim(); },
    math({ latex, caption }) {
      const t = open(), tex = String(latex).trim().replace(/^\$+|\$+$/g, '');
      if (!tex) return;
      t.math.push(tex);
      bubble(t).append(rich(`${caption ? `**${caption}**\n` : ''}$$${tex}$$`));
    },
    end: close,
    /** Another model takes over and answers again: drop what the old one had said in this turn. */
    restart() { if (cur && !cur.closed && cur.bubble) { cur.bubble.remove(); cur.bubble = null; cur.ai = ''; cur.math = []; } },
    get current() { return cur; },
  };
}
