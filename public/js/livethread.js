// A real-time conversation shown in a thread: the student's words, the tutor's words as they are spoken, and the
// formulas the tutor puts on screen (show_math). onTurn(turn) runs when a turn ends, for written extras.
import { h, rich } from './ui.js';

// formulasOnly (formula page): each formula sits on one line after its lead-in (the show_math caption), and the
// transcript of the spoken reading is hidden once formulas are on screen, so the turn reads as one written message.
export function liveThread(thread, { onTurn, formulasOnly = false } = {}) {
  let cur = null;
  const fresh = () => ({ user: '', ai: '', me: null, bubble: null, said: null, math: [], closed: false });
  const open = () => (cur && !cur.closed ? cur : (cur = fresh()));
  // Formula page: after show_math the model may go on talking in a new turn with no formula of its own; that is
  // the same answer, so it joins the turn that already shows the formulas instead of making a second message.
  const answer = () => { if (formulasOnly && cur?.closed && cur.math.length) cur.closed = false; return open(); };
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
    ai(text) {
      const t = answer(); t.ai += text; bubble(t);
      if (formulasOnly) t.said.replaceChildren(rich(t.ai.trim())); // any $...$ it says still shows as a formula
      else t.said.textContent = t.ai.trim();
    },
    math({ latex, caption }) {
      const t = answer(), tex = String(latex).trim().replace(/^\$+|\$+$/g, '');
      if (!tex || t.locked) return; // locked: the page already wrote this answer's whole chain
      t.math.push(tex);
      if (formulasOnly) { bubble(t); t.said.hidden = true; }
      bubble(t).append(rich(formulasOnly && caption ? `${caption} $\\displaystyle ${tex}$` : `${caption ? `**${caption}**\n` : ''}$$${tex}$$`));
    },
    end: close,
    /** Another model takes over and answers again: drop what the old one had said in this turn. */
    restart() { if (cur && !cur.closed && cur.bubble) { cur.bubble.remove(); cur.bubble = null; cur.ai = ''; cur.math = []; } },
    get current() { return cur; },
  };
}
