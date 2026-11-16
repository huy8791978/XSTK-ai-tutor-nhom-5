// Offline support. Same-origin files: network first (a deploy is seen at once), the cache when offline.
// Versioned CDN files (KaTeX, MathLive, fonts): cache first. /api/* (AI, forum, voice) is never cached.
const CACHE = 'xstk-v1';
// tests/sw.test.mjs checks this lists every module, so a new page cannot be forgotten.
const SHELL = [
  "./",
  "index.html",
  "css/app.css",
  "favicon.svg",
  "manifest.webmanifest",
  "chinh-sach.html",
  "dieu-khoan.html",
  "js/api.js",
  "js/app.js",
  "js/board.js",
  "js/camera-math.js",
  "js/camera.js",
  "js/command.js",
  "js/consent.js",
  "js/course-map.js",
  "js/datarows.js",
  "js/theme.js",
  "js/docx.js",
  "js/export.js",
  "js/engage.js",
  "js/files.js",
  "js/i18n.js",
  "js/live.js",
  "js/livethread.js",
  "js/mathinput.js",
  "js/mathspeech.js",
  "js/md.js",
  "js/mindmap3d.js",
  "js/profile.js",
  "js/quiz.js",
  "js/review.js",
  "js/role.js",
  "js/statlib.js",
  "js/steprail.js",
  "js/stats.js",
  "js/teacher.js",
  "js/topics.js",
  "js/ui.js",
  "js/uploader.js",
  "js/views/data.js",
  "js/views/dist.js",
  "js/views/estimate.js",
  "js/views/formula.js",
  "js/views/forum.js",
  "js/views/home.js",
  "js/views/hypothesis.js",
  "js/views/lesson.js",
  "js/views/mindmap.js",
  "js/views/mistakes.js",
  "js/views/oral.js",
  "js/views/practice.js",
  "js/views/profile.js",
  "js/views/quiz.js",
  "js/views/sim.js",
  "js/views/spaced.js",
  "js/views/tables.js",
  "js/views/tutor.js",
  "js/views/voice.js",
  "js/viz.js",
  "js/voice.js",
  "js/voicecmd.js"
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'))));
    return;
  }
  if (/^(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })));
  }
});
