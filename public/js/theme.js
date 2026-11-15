// Light / dark theme. index.html sets data-theme on <html> before the first paint (the student's choice, else the
// system's); this wires the header button, keeps the browser bar colour in step and tells canvases to repaint.
const KEY = 'xstk.theme';
const BAR = { light: '#1B2A8C', dark: '#141C5E' }; // the rail colour (--rail) of each theme

export const getTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

export function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(KEY, t); } catch { /* private mode: this visit only */ }
  paint();
  dispatchEvent(new Event('themechange')); // canvases and the mind map read their inks from CSS again
}

function paint() {
  const dark = getTheme() === 'dark';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[getTheme()]);
  const b = document.querySelector('[data-theme-toggle]');
  if (!b) return;
  b.setAttribute('aria-pressed', String(dark));
  b.setAttribute('aria-label', dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối');
  b.title = b.getAttribute('aria-label');
}

export function initTheme() {
  paint();
  document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => setTheme(getTheme() === 'dark' ? 'light' : 'dark'));
  // Follow the system while the student has not picked a theme.
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', (e) => {
    let picked = null;
    try { picked = localStorage.getItem(KEY); } catch { /* ignore */ }
    if (!picked) { document.documentElement.dataset.theme = e.matches ? 'dark' : 'light'; paint(); dispatchEvent(new Event('themechange')); }
  });
}
