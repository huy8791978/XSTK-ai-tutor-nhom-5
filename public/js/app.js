// Hash router + shell wiring.
import { rosette } from './viz.js';
import { load } from './profile.js';
import * as tutor from './views/tutor.js';
import * as practice from './views/practice.js';
import * as oral from './views/oral.js';
import * as mindmap from './views/mindmap.js';
import * as profile from './views/profile.js';

const ROUTES = { 'cham-bai': tutor, 'luyen-tap': practice, 'van-dap': oral, 'ban-do': mindmap, 'ho-so': profile };
const ORDER = Object.keys(ROUTES);
const view = document.querySelector('[data-view]');
const title = document.querySelector('[data-title]');
const lede = document.querySelector('[data-lede]');
const serial = document.querySelector('[data-serial]');
const ros = rosette(document.querySelector('.rosette'));

function go() {
  const key = ROUTES[location.hash.slice(1)] ? location.hash.slice(1) : 'cham-bai';
  const mod = ROUTES[key];
  document.querySelectorAll('[data-route]').forEach((a) => (a.dataset.route === key ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  document.querySelector('.profile-btn').hidden = key === 'ho-so';
  title.textContent = mod.meta.title; lede.textContent = mod.meta.lede;
  document.title = `${mod.meta.title} · XSTK·AI`;
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
go();
