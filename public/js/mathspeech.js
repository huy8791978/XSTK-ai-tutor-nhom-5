// LaTeX → the words a teacher says, for the browser's own voice (which would otherwise skip or spell out
// "\frac{1}{n-1}\sum_{i=1}^{n}(X_i-\overline{X}_n)^2"). Vietnamese and English; covers the course's notation:
// fractions, roots, powers, indices, sums/products/integrals/limits, bars and hats, Greek letters, P(A/B), C_n^k…
import { delimit, MATH_RE } from './md.js';

const W = {
  vi: {
    eq: 'bằng', ne: 'khác', lt: 'nhỏ hơn', gt: 'lớn hơn', le: 'nhỏ hơn hoặc bằng', ge: 'lớn hơn hoặc bằng', approx: 'xấp xỉ',
    plus: 'cộng', minus: 'trừ', neg: 'âm', pm: 'cộng trừ', times: 'nhân', div: 'chia', slash: 'trên', given: 'với điều kiện', fact: 'giai thừa',
    over: 'trên', frac: 'phân số', fracOver: 'trên', sqrt: 'căn bậc hai của', root: (n) => `căn bậc ${n} của`, of: 'của',
    sq: 'bình phương', cube: 'lập phương', pow: 'mũ', all: 'tất cả', sub: 'chỉ số', prime: 'phẩy', star: 'sao', transp: 'chuyển vị',
    sum: 'tổng', prod: 'tích', int: 'tích phân', lim: 'giới hạn khi', from: 'từ', to: 'đến', tends: 'tiến tới', max: 'max', min: 'min',
    bar: 'ngang', hat: 'mũ', tilde: 'ngã', vec: 'véc tơ', abs: 'giá trị tuyệt đối của', endAbs: '', choose: (n, k) => `tổ hợp chập ${k} của ${n}`,
    arrange: (n, k) => `chỉnh hợp chập ${k} của ${n}`, percent: 'phần trăm', dots: 'vân vân', inf: 'vô cùng', sim: 'tuân theo phân phối',
    cup: 'hợp', cap: 'giao', in: 'thuộc', notin: 'không thuộc', subset: 'là con của', empty: 'rỗng', implies: 'suy ra', iff: 'tương đương',
    forall: 'với mọi', exists: 'tồn tại', colon: 'hai chấm',
    greek: { alpha: 'an pha', beta: 'bê ta', gamma: 'gam ma', Gamma: 'gam ma', delta: 'đen ta', Delta: 'đen ta', epsilon: 'ép xi lon', varepsilon: 'ép xi lon', theta: 'tê ta', lambda: 'lam đa', mu: 'muy', nu: 'nuy', xi: 'xi', pi: 'pi', rho: 'rô', sigma: 'xích ma', Sigma: 'xích ma', tau: 'tô', phi: 'phi', varphi: 'phi', Phi: 'phi', chi: 'khi', psi: 'psi', omega: 'ô mê ga', Omega: 'ô mê ga' },
  },
  en: {
    eq: 'equals', ne: 'is not equal to', lt: 'is less than', gt: 'is greater than', le: 'is less than or equal to', ge: 'is greater than or equal to', approx: 'is approximately',
    plus: 'plus', minus: 'minus', neg: 'minus', pm: 'plus or minus', times: 'times', div: 'divided by', slash: 'over', given: 'given', fact: 'factorial',
    over: 'over', frac: 'the fraction', fracOver: 'over', sqrt: 'the square root of', root: (n) => `the ${n}th root of`, of: 'of',
    sq: 'squared', cube: 'cubed', pow: 'to the power', all: 'all', sub: 'sub', prime: 'prime', star: 'star', transp: 'transpose',
    sum: 'the sum', prod: 'the product', int: 'the integral', lim: 'the limit as', from: 'from', to: 'to', tends: 'tends to', max: 'the maximum', min: 'the minimum',
    bar: 'bar', hat: 'hat', tilde: 'tilde', vec: 'vector', abs: 'the absolute value of', endAbs: '', choose: (n, k) => `${n} choose ${k}`,
    arrange: (n, k) => `the number of arrangements of ${k} from ${n}`, percent: 'percent', dots: 'and so on', inf: 'infinity', sim: 'follows',
    cup: 'union', cap: 'intersect', in: 'in', notin: 'not in', subset: 'is a subset of', empty: 'the empty set', implies: 'implies', iff: 'if and only if',
    forall: 'for all', exists: 'there exists', colon: 'colon',
    greek: { alpha: 'alpha', beta: 'beta', gamma: 'gamma', Gamma: 'gamma', delta: 'delta', Delta: 'delta', epsilon: 'epsilon', varepsilon: 'epsilon', theta: 'theta', lambda: 'lambda', mu: 'mu', nu: 'nu', xi: 'xi', pi: 'pi', rho: 'rho', sigma: 'sigma', Sigma: 'sigma', tau: 'tau', phi: 'phi', varphi: 'phi', Phi: 'phi', chi: 'chi', psi: 'psi', omega: 'omega', Omega: 'omega' },
  },
};
// \command → a key of W (operators and symbols)
const CMD = {
  le: 'le', leq: 'le', leqslant: 'le', ge: 'ge', geq: 'ge', geqslant: 'ge', ne: 'ne', neq: 'ne', approx: 'approx', simeq: 'approx', pm: 'pm',
  cdot: 'times', times: 'times', div: 'div', mid: 'given', cup: 'cup', cap: 'cap', in: 'in', notin: 'notin', subset: 'subset', subseteq: 'subset',
  emptyset: 'empty', varnothing: 'empty', infty: 'inf', to: 'tends', rightarrow: 'tends', Rightarrow: 'implies', implies: 'implies', Leftrightarrow: 'iff', iff: 'iff',
  forall: 'forall', exists: 'exists', sim: 'sim', ldots: 'dots', cdots: 'dots', dots: 'dots', '%': 'percent',
};
const OPKEYS = new Set(['eq', 'ne', 'lt', 'gt', 'le', 'ge', 'approx', 'plus', 'minus', 'pm', 'times', 'div', 'given', 'cup', 'cap', 'in', 'notin', 'subset', 'tends', 'implies', 'iff', 'sim']);
const SKIP = new Set(['left', 'right', 'big', 'Big', 'bigg', 'Bigg', 'bigl', 'bigr', 'Bigl', 'Bigr', 'displaystyle', 'textstyle', 'limits', 'nolimits', ',', ';', ':', '!', ' ', 'quad', 'qquad', 'mathbb', 'boldsymbol']);
const TEXT = new Set(['text', 'textrm', 'mathrm', 'mathbf', 'mathit', 'textbf', 'textit', 'operatorname', 'mbox']);
const ACCENT = { overline: 'bar', bar: 'bar', hat: 'hat', widehat: 'hat', tilde: 'tilde', widetilde: 'tilde', vec: 'vec', overrightarrow: 'vec' };
const BIG = { sum: 'sum', prod: 'prod', int: 'int', iint: 'int', lim: 'lim', max: 'max', min: 'min', sup: 'max', inf: 'min' };
// Letter runs read as one name (else letters are read one by one: "np" → "n p")
const NAMES = ['Var', 'Cov', 'Corr', 'var', 'cov', 'Mod', 'Med', 'ln', 'log', 'exp', 'sin', 'cos', 'tan', 'max', 'min', 'lim', 'det'];
const FUNCS = new Set(['N', 'B', 'U', 'H', 'G', 'T', 'L', 'M', 'P', 'E', 'F', 'f', 'g', 'h', 'D', 'V', 'Var', 'Cov', 'Corr', 'var', 'cov', 'Mod', 'Med', 'ln', 'log', 'exp', 'sin', 'cos', 'tan', 'phi', 'varphi', 'Phi', 'det']);
const CONTEXT = new Set(['P', 'E', 'Var', 'D', 'V', 'Cov']); // inside P(…), "/" and "|" mean "given"

function tokenize(tex) {
  const out = [];
  for (let i = 0; i < tex.length;) {
    const c = tex[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '\\') {
      const m = /^\\([A-Za-z]+|.)/.exec(tex.slice(i));
      if (!m) { i++; continue; }
      out.push({ t: 'cmd', v: m[1] }); i += m[0].length; continue;
    }
    if (/\d/.test(c)) {
      const m = /^\d+(?:[.,]\d+)*/.exec(tex.slice(i));
      out.push({ t: 'num', v: m[0] }); i += m[0].length; continue;
    }
    if (/[A-Za-z]/.test(c)) {
      const run = /^[A-Za-z]+/.exec(tex.slice(i))[0];
      const name = NAMES.find((n) => run.startsWith(n));
      if (name) { out.push({ t: 'name', v: name }); i += name.length; continue; }
      out.push({ t: 'ch', v: c }); i++; continue;
    }
    out.push({ t: 'ch', v: c }); i++;
  }
  return out;
}

/** Tokens → a tree: {k:'seq', items}, 'ch', 'num', 'name', 'sym', 'frac', 'sqrt', 'acc', 'text', 'big', 'scr', 'par', 'abs', 'binom'. */
function parse(tokens) {
  let i = 0;
  const peek = () => tokens[i];
  const isCh = (tok, v) => tok && tok.t === 'ch' && tok.v === v;
  function group() { // after "{"
    const items = seq((t) => isCh(t, '}'));
    if (isCh(peek(), '}')) i++;
    return { k: 'seq', items };
  }
  function arg() {
    const t = peek();
    if (!t) return { k: 'seq', items: [] };
    if (isCh(t, '{')) { i++; return group(); }
    return atom() || { k: 'seq', items: [] };
  }
  function rawText() { // \text{…}: the words as written
    if (!isCh(peek(), '{')) return '';
    i++;
    let depth = 1, s = '';
    while (i < tokens.length) {
      const t = tokens[i++];
      if (isCh(t, '{')) depth++;
      else if (isCh(t, '}') && --depth === 0) break;
      s += t.t === 'cmd' ? (t.v.length === 1 ? t.v : ` ${t.v} `) : t.v;
    }
    return s;
  }
  function atom() {
    const t = tokens[i++];
    if (!t) return null;
    if (t.t === 'num' || t.t === 'name') return { k: t.t, v: t.v };
    if (t.t === 'ch') {
      if (t.v === '{') return group();
      return { k: 'ch', v: t.v };
    }
    const v = t.v;
    if (SKIP.has(v)) return { k: 'skip' };
    if (v === 'frac' || v === 'dfrac' || v === 'tfrac' || v === 'cfrac') return { k: 'frac', a: arg(), b: arg() };
    if (v === 'binom' || v === 'dbinom') return { k: 'binom', n: arg(), r: arg() };
    if (v === 'sqrt') {
      let n = null;
      if (isCh(peek(), '[')) { i++; n = { k: 'seq', items: seq((x) => isCh(x, ']')) }; if (isCh(peek(), ']')) i++; }
      return { k: 'sqrt', n, x: arg() };
    }
    if (ACCENT[v]) return { k: 'acc', kind: ACCENT[v], x: arg() };
    if (TEXT.has(v)) return { k: 'text', s: rawText() };
    if (BIG[v]) return { k: 'big', op: BIG[v] };
    if (v === '{' || v === '}') return { k: 'skip' };
    if (v === '|' || v === 'vert' || v === 'lvert' || v === 'rvert') return { k: 'ch', v: '|' };
    return { k: 'sym', v };
  }
  function seq(stop) {
    const items = [];
    while (i < tokens.length && !stop(peek())) {
      const t = peek();
      let node;
      if (isCh(t, '(') || isCh(t, '[')) {
        const close = t.v === '(' ? ')' : ']';
        i++;
        node = { k: 'par', body: { k: 'seq', items: seq((x) => isCh(x, close) || isCh(x, '}')) } };
        if (isCh(peek(), close)) i++;
      } else if (isCh(t, '|') && (!items.length || isOp(items.at(-1)))) {
        i++;
        node = { k: 'abs', body: { k: 'seq', items: seq((x) => isCh(x, '|') || (x?.t === 'cmd' && /^(vert|rvert)$/.test(x.v)) || isCh(x, '}')) } };
        if (peek() && (isCh(peek(), '|') || peek().t === 'cmd')) i++;
      } else node = atom();
      if (!node) break;
      if (node.k === 'skip') continue;
      // indices and powers (either order), primes
      for (;;) {
        const n = peek();
        if (isCh(n, '_') || isCh(n, '^')) {
          i++;
          const a = arg();
          if (node.k !== 'scr') node = { k: 'scr', base: node, sub: null, sup: null };
          if (n.v === '_') node.sub = a; else node.sup = a;
        } else if (isCh(n, "'")) { i++; node = { k: 'scr', base: node, sub: node.sub ?? null, sup: { k: 'ch', v: "'" } }; } else break;
      }
      items.push(node);
    }
    return items;
  }
  return { k: 'seq', items: seq(() => false) };
}

const OPCH = { '=': 'eq', '<': 'lt', '>': 'gt', '+': 'plus', '-': 'minus', '*': 'times', '/': 'div', '|': 'given', ':': 'colon' };
function isOp(n) {
  if (!n) return true;
  if (n.k === 'ch') return Boolean(OPCH[n.v]) || n.v === ',';
  if (n.k === 'sym') return OPKEYS.has(CMD[n.v]);
  return false;
}

function speakTree(root, lang) {
  const L = W[lang] || W.vi;
  const num = (v) => (lang === 'en' ? v.replace(/,(?=\d)/g, '.') : v.replace(/\.(?=\d)/g, ','));
  const flat = (n) => (n?.k === 'seq' && n.items.length === 1 ? flat(n.items[0]) : n);
  // A short piece (one letter, number or Greek letter, with at most an index) needs no pause around it.
  const simple = (n) => {
    n = flat(n);
    if (!n) return true;
    if (['ch', 'num', 'name'].includes(n.k)) return true;
    if (n.k === 'sym') return Boolean(L.greek[n.v]);
    if (n.k === 'acc') return simple(n.x);
    if (n.k === 'scr') return simple(n.base) && !n.sup && (!n.sub || simple(n.sub));
    return false;
  };
  const text = (n, ctx = {}) => {
    if (!n) return '';
    switch (n.k) {
      case 'seq': return seqText(n.items, ctx);
      case 'num': return num(n.v);
      case 'name': return n.v === 'max' ? L.max : n.v === 'min' ? L.min : n.v === 'lim' ? L.lim : n.v;
      case 'text': return n.s.trim();
      case 'ch': {
        const k = OPCH[n.v];
        if (n.v === '/' || n.v === '|') return ctx.given ? L.given : n.v === '/' ? L.slash : L.given;
        if (n.v === '!') return L.fact;
        if (n.v === '.') return L.times;
        if (n.v === ',') return ',';
        if (n.v === ';') return ';';
        if (n.v === "'") return L.prime;
        if (k) return L[k];
        if (/[A-Za-z]/.test(n.v)) return n.v;
        return '';
      }
      case 'sym': {
        if (L.greek[n.v]) return L.greek[n.v];
        const k = CMD[n.v];
        if (k === 'given' && ctx.given) return L.given;
        return k ? L[k] : '';
      }
      case 'frac': {
        const a = text(n.a, ctx), b = text(n.b, ctx);
        if (simple(n.a)) return simple(n.b) ? `${a} ${L.over} ${b}` : `${a} ${L.over} ${b},`;
        return `${L.frac} ${a}, ${L.fracOver} ${b},`;
      }
      case 'binom': return `${L.choose(text(n.n, ctx), text(n.r, ctx))},`;
      case 'sqrt': {
        const x = text(n.x, ctx), head = n.n ? L.root(text(n.n, ctx)) : L.sqrt;
        return simple(n.x) ? `${head} ${x}` : `${head} ${x},`;
      }
      case 'acc': {
        const x = text(n.x, ctx);
        if (n.kind === 'vec') return `${L.vec} ${x}`;
        return simple(n.x) ? `${x} ${L[n.kind]}` : `${x}, ${L[n.kind]},`;
      }
      case 'abs': return `${L.abs} ${text(n.body, ctx)},`;
      case 'par': return text(n.body, ctx);
      case 'big': return L[n.op];
      case 'scr': return scrText(n, ctx);
      default: return '';
    }
  };
  function powText(sup, ctx) {
    const s = flat(sup);
    const raw = s?.k === 'num' || s?.k === 'ch' ? s.v : null;
    if (raw === '2') return L.sq;
    if (raw === '3') return L.cube;
    if (raw === "'") return L.prime;
    if (raw === '*') return L.star;
    if (raw === 'T') return L.transp;
    const t = text(sup, ctx);
    return simple(sup) ? `${L.pow} ${t}` : `${L.pow} ${t},`;
  }
  function scrText(n, ctx) {
    const b = flat(n.base);
    // C_n^k, A_n^k: combinations and arrangements
    if (b?.k === 'ch' && (b.v === 'C' || b.v === 'A') && n.sub && n.sup) {
      const f = b.v === 'C' ? L.choose : L.arrange;
      return `${f(text(n.sub, ctx), text(n.sup, ctx))},`;
    }
    if (b?.k === 'big' || (b?.k === 'name' && /^(lim|max|min)$/.test(b.v))) {
      const op = b.k === 'big' ? b.op : b.v;
      const lo = n.sub ? text(n.sub, ctx) : '', hi = n.sup ? text(n.sup, ctx) : '';
      if (op === 'lim') return `${L.lim} ${lo},`;
      if (op === 'max' || op === 'min') return `${L[op]} ${lo ? `${lang === 'en' ? 'over' : 'theo'} ${lo}` : ''},`;
      return `${L[op]}${lo ? ` ${L.from} ${lo}` : ''}${hi ? ` ${L.to} ${hi}` : ''} ${L.of}`;
    }
    let s = text(n.base, ctx);
    if (n.sub) s += simple(n.sub) ? ` ${text(n.sub, ctx)}` : ` ${L.sub} ${text(n.sub, ctx)},`;
    if (n.sup) {
      const whole = b?.k === 'par' || b?.k === 'abs' || (!simple(n.base) && b?.k !== 'sym');
      s += whole ? `, ${L.all} ${powText(n.sup, ctx)}` : ` ${powText(n.sup, ctx)}`;
    }
    return s;
  }
  function seqText(items, ctx) {
    const out = [];
    items.forEach((n, j) => {
      const prev = items[j - 1];
      if (n.k === 'par') {
        const f = prev && (prev.k === 'ch' || prev.k === 'name' || prev.k === 'sym') ? (prev.v) : prev?.k === 'scr' && flat(prev.base)?.k === 'ch' ? flat(prev.base).v : null;
        const isFunc = (f && FUNCS.has(f)) || prev?.k === 'text' || (prev?.k === 'scr' && prev.sub && !prev.sup); // t_{α/2}(n-1)
        const inner = text(n.body, { ...ctx, given: ctx.given || CONTEXT.has(f) });
        if (isFunc) out.push(`${L.of} ${inner},`);
        else if (prev && !isOp(prev) && prev.k !== 'big') out.push(`${L.times} ${inner},`);
        else out.push(simple(n.body) ? inner : `${inner},`);
        return;
      }
      if (n.k === 'ch' && n.v === '-' && (!prev || isOp(prev))) { out.push(L.neg); return; }
      if (n.k === 'ch' && n.v === '.' && prev?.k === 'num') return; // a full stop after a number
      out.push(text(n, ctx));
    });
    return out.join(' ');
  }
  return text(root, {});
}

const tidy = (s) => s.replace(/\s+/g, ' ').replace(/\s+([,;.])/g, '$1').replace(/([,;])(?:\s*[,;])+/g, '$1').replace(/^[,;\s]+|[,;\s]+$/g, '');

/** One formula (LaTeX, no $) → words. */
export function speakMath(tex, lang = 'vi') {
  try { return tidy(speakTree(parse(tokenize(String(tex))), lang)); } catch { return String(tex).replace(/\\[A-Za-z]+/g, ' ').replace(/[{}_^$\\]/g, ' '); }
}

/**
 * Text with formulas (markdown from the AI, OCR of a file) → text to hand a speech engine: every formula
 * (in $…$, \(…\), \[…\] or bare LaTeX) read out in words, markdown marks dropped, lines kept as sentences.
 */
export function speakText(text, lang = 'vi') {
  const s = delimit(String(text ?? '')).replace(MATH_RE, (m) => {
    const tex = m.replace(/^\$\$|\$\$$/g, '').replace(/^\\\[|\\\]$/g, '').replace(/^\\\(|\\\)$/g, '').replace(/^\$|\$$/g, '');
    return ` ${speakMath(tex, lang)} `;
  });
  return s.split('\n')
    .map((l) => l.replace(/^\s*(?:#{1,6}\s+|[-*•]\s+|>\s*)/, '').replace(/\*\*|__|`/g, '').replace(/(^|\s)\*(\S)/g, '$1$2').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((l) => (/[.!?:;,]$/.test(l) ? l : `${l}.`))
    .join('\n')
    .replace(/\$/g, '').replace(/ +([.,;:!?])/g, '$1');
}
