// Home: the introduction shown on the first visit and behind the AI Classroom logo. Nothing here calls the AI.
// The hero is a lottery ticket being issued: the body prints out, the headline rises word by word, the stub with
// the 4 steps tears in and its numbers roll like the draw cage. A foil gloss follows the pointer on a computer.
import { h } from '../ui.js';
import { rosette } from '../viz.js';
import { tr } from '../i18n.js';

export const meta = { title: 'Trang chủ', lede: '' };

const STEPS = ['Tìm hiểu nội dung đề bài', 'Tìm cách giải', 'Trình bày lời giải', 'Nghiên cứu sâu lời giải'];
const HEAD = [['Xác suất Thống kê,'], ['có gia sư kèm', 'gold'], ['từng bước']];

/** Headline parts → one masked span per word, numbered for the stagger. */
function headline() {
  let i = 0;
  const words = (text, cls) => text.split(' ').map((w) => h(`span.w${cls ? `.${cls}` : ''}`, {}, h('span', { style: `--i:${i++}` }, w)));
  return h('h2', { id: 'home-title', 'aria-label': HEAD.map(([t]) => tr(t)).join(' ') },
    ...HEAD.flatMap(([t, cls]) => words(tr(t), cls).flatMap((w) => [w, ' '])));
}

/** A step number as a 0…n digit column that rolls to n. */
const roll = (n, i) => h('b', { 'aria-hidden': 'true' }, h('span.roll', { style: `--n:${n};--i:${i}` }, ...Array.from({ length: n + 1 }, (_, k) => h('span', {}, String(k)))));

export function render(root) {
  const c = h('canvas.ha-rosette', { 'aria-hidden': 'true' });
  const sec = h('section.hero.hero-a', { 'aria-labelledby': 'home-title' }, c,
    h('div.ha-main', {},
      headline(),
      h('p.hero-lede', {}, 'Chụp hoặc tải bài làm lên, gia sư AI chấm theo 4 bước giải toán của Polya, chỉ ra từng lỗi sai và ghi nhớ chúng để gợi ý lộ trình ôn thi. Luôn gợi ý cách nghĩ trước, lời giải chỉ hiện khi bạn hỏi.'),
      h('div.btn-row', {},
        h('a.btn.btn-primary.btn-cta', { href: '#cham-bai' }, 'Chấm bài đầu tiên'),
        h('a.btn.btn-alt', { href: '#ly-thuyet' }, 'Học lí thuyết'))),
    h('div.ha-stub', {}, h('h3', {}, 'Mỗi bài đi qua 4 bước'),
      h('ol', {}, ...STEPS.map((s, i) => h('li', {}, roll(i + 1, i), s))),
      h('p', {}, 'Bấm vào bước nào cũng xem lại được.')));
  root.append(sec);
  requestAnimationFrame(() => c.isConnected && rosette(c).reseed(3));

  // The headline is split into words, which the page translator cannot match: rebuild it in the new language.
  addEventListener('langchange', () => sec.querySelector('h2').replaceWith(headline()));

  // The ticket is issued every time the home page is opened. When the whole sequence has finished, .issue is
  // removed so no clipped or masked layer is left behind (they made the text and stub drop out while repainting).
  let run = 0;
  const issue = () => {
    const mine = ++run;
    sec.classList.remove('issue'); void sec.offsetWidth; sec.classList.add('issue');
    Promise.all(sec.getAnimations({ subtree: true }).map((a) => a.finished))
      .then(() => { if (mine === run) sec.classList.remove('issue'); })
      .catch(() => { /* replayed meanwhile: the newer run cleans up */ });
  };
  issue();
  addEventListener('hashchange', () => { if (location.hash === '#trang-chu') issue(); });

  // Foil gloss under the pointer on the blue part (fine pointers only; the CSS hides it under reduced motion).
  const main = sec.querySelector('.ha-main');
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let raf = 0;
    main.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = main.getBoundingClientRect();
        main.style.setProperty('--mx', `${e.clientX - r.left}px`);
        main.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }
}
