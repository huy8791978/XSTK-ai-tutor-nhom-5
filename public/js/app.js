// Hash router + shell wiring.
import { rosette } from './viz.js';
import { load } from './profile.js';
import { initI18n, tr } from './i18n.js';
import * as tutor from './views/tutor.js';
import { concept, theorem } from './views/lesson.js';
import { essayPage, mcqPage } from './views/practice.js';
import * as voice from './views/voice.js';
import * as mistakes from './views/mistakes.js';
import * as forum from './views/forum.js';
import * as oral from './views/oral.js';
import * as mindmap from './views/mindmap.js';
import * as profile from './views/profile.js';

const ROUTES = {
  'cham-bai': tutor, 'ly-thuyet': concept, 'dinh-li': theorem, 'tu-luan': essayPage, 'trac-nghiem': mcqPage, 'van-dap': oral,
  'giong-noi': voice, 'thong-ke': mistakes, 'ban-do': mindmap, 'dien-dan': forum, 'ho-so': profile,
};
const routeKey = () => location.hash.slice(1).split('?')[0];
const ORDER = Object.keys(ROUTES);
const view = document.querySelector('[data-view]');
const title = document.querySelector('[data-title]');
const lede = document.querySelector('[data-lede]');
const serial = document.querySelector('[data-serial]');
const ros = rosette(document.querySelector('.rosette'));

function go() {
  const key = ROUTES[routeKey()] ? routeKey() : 'cham-bai';
  const mod = ROUTES[key];
  document.querySelectorAll('[data-route]').forEach((a) => (a.dataset.route === key ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  document.querySelector('.profile-btn').hidden = key === 'ho-so';
  title.textContent = mod.meta.title; lede.textContent = mod.meta.lede;
  document.title = `${tr(mod.meta.title)} · XSTK·AI`;
  document.querySelector('.nav [aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  view.replaceChildren();
  mod.render(view);
  ros.reseed(ORDER.indexOf(key));
  if (document.activeElement?.closest?.('.nav')) document.getElementById('main').focus({ preventScroll: true });
  scrollTo({ top: 0 });
}

const paintSerial = () => { serial.textContent = `SERI ${load().id}`; };
addEventListener('hashchange', go);
addEventListener('profile-change', paintSerial);
paintSerial();
initI18n();
go();
