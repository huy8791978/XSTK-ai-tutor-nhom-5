// In-page camera capture: live view, shoot, drag 4 corners to flatten the page, keep up to `max` JPEG files.
import { h, icon } from './ui.js';
import { homography, apply, isConvex, outSize } from './camera-math.js';

export const canCamera = () => !!navigator.mediaDevices?.getUserMedia && isSecureContext;

const CORNERS = ['Góc trên trái', 'Góc trên phải', 'Góc dưới phải', 'Góc dưới trái']; // order TL, TR, BR, BL is fixed
const two = (n) => String(n).padStart(2, '0');

/** Warp quad q of canvas src to a flat rectangle; the raw frame when q is not convex or degenerate. */
function flatten(src, q) {
  if (!isConvex(q)) return src;
  const { w, h: ht } = outSize(q);
  if (w < 2 || ht < 2) return src;
  const full = [[0, 0], [src.width, 0], [src.width, src.height], [0, src.height]];
  if (q.every((p, i) => Math.abs(p[0] - full[i][0]) <= 0.5 && Math.abs(p[1] - full[i][1]) <= 0.5)) return src; // untouched corners: skip the warp
  const H = homography([[0, 0], [w, 0], [w, ht], [0, ht]], q); // output -> source
  if (!H) return src;
  const sw = src.width, sh = src.height;
  const s = src.getContext('2d').getImageData(0, 0, sw, sh).data;
  const out = h('canvas', { width: w, height: ht });
  const ctx = out.getContext('2d'), img = ctx.createImageData(w, ht), d = img.data;
  for (let y = 0; y < ht; y++) for (let x = 0; x < w; x++) {
    const [u, v] = apply(H, [x + 0.5, y + 0.5]);
    const i = (Math.min(sh - 1, Math.max(0, Math.floor(v))) * sw + Math.min(sw - 1, Math.max(0, Math.floor(u)))) * 4, o = (y * w + x) * 4;
    d[o] = s[i]; d[o + 1] = s[i + 1]; d[o + 2] = s[i + 2]; d[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

/** Resolves the kept photos as File[] ([] on cancel); rejects with the getUserMedia error name when the camera cannot start. */
export function captureDialog({ max = 3 } = {}) {
  return new Promise((resolve, reject) => {
    const files = [], urls = [];
    let stream = null, deviceId = '', quad = null, done = false, shots = 0, seq = 0, busy = false;

    const video = h('video', { playsinline: true, muted: true, autoplay: true, 'aria-label': 'Hình từ camera' });
    video.muted = true;
    const frozen = h('canvas', { hidden: true });
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const outline = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    outline.setAttribute('class', 'cam-outline'); outline.setAttribute('preserveAspectRatio', 'none'); outline.append(poly);
    const handles = CORNERS.map((label, i) => h('button.cam-handle', {
      type: 'button', 'aria-label': label,
      onpointerdown: (e) => { e.preventDefault(); handles[i].setPointerCapture(e.pointerId); handles[i].focus(); },
      onpointermove: (e) => { if (!handles[i].hasPointerCapture(e.pointerId)) return; const r = frame.getBoundingClientRect(); move(i, (e.clientX - r.left) / r.width * frozen.width, (e.clientY - r.top) / r.height * frozen.height); },
      onkeydown: (e) => {
        const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
        if (!k) return;
        e.preventDefault();
        const r = frame.getBoundingClientRect(), step = e.shiftKey ? 20 : 4; // screen pixels
        move(i, quad[i][0] + k[0] * step * frozen.width / r.width, quad[i][1] + k[1] * step * frozen.height / r.height);
      },
    }));
    const frame = h('div.cam-frame', {}, video, frozen, outline, ...handles);
    const hint = h('p.cam-hint', { hidden: true }, 'Kéo 4 góc vào mép tờ giấy để làm phẳng ảnh.');
    const pick = h('select', { 'aria-label': 'Chọn camera', hidden: true, onchange: () => { deviceId = pick.value; start().catch(failed); } });
    const noticeText = h('p');
    const again = h('button.btn', { type: 'button', onclick: () => start().catch(failed) }, 'Bật lại');
    const notice = h('div.cam-notice', { hidden: true }, noticeText, again);
    const count = h('span.cam-count', { 'aria-live': 'polite' });
    const thumbs = h('div.files.cam-thumbs');
    const shootBtn = h('button.btn.btn-primary', { type: 'button', onclick: shoot }, icon('camera'), 'Chụp');
    const live = h('div.btn-row', {}, h('button.btn.btn-ghost', { type: 'button', onclick: () => finish([]) }, 'Huỷ'), shootBtn,
      h('button.btn', { type: 'button', onclick: () => finish(files.slice()) }, 'Xong'));
    const crop = h('div.btn-row', { hidden: true }, h('button.btn.btn-ghost', { type: 'button', onclick: liveMode }, 'Chụp lại'),
      h('button.btn.btn-primary', { type: 'button', onclick: keep }, 'Dùng ảnh'));
    const dlg = h('dialog.camera', { 'aria-label': 'Chụp bằng camera',
      oncancel: (e) => { e.preventDefault(); crop.hidden ? finish([]) : liveMode(); }, // Esc/back while cropping drops only this shot
      onkeydown: (e) => { if ((e.key === ' ' || e.key === 'Enter') && crop.hidden && !e.target.closest('button, select')) { e.preventDefault(); shoot(); } },
    }, h('h2', {}, 'Chụp bằng camera'), pick, frame, hint, notice, h('div.cam-bar', {}, count, live, crop), thumbs);

    const stop = () => { stream?.getTracks().forEach((t) => t.stop()); stream = null; };
    function off(msg) { stop(); noticeText.textContent = msg; notice.hidden = false; paint(); }
    const failed = () => off('Không bật được camera này.');
    const onHash = () => finish([]);
    const onVis = () => { if (document.visibilityState === 'hidden' && stream) off('Camera đã tắt khi bạn rời tab. Bấm Bật lại.'); };

    function finish(result) {
      if (done) return;
      done = true; stop();
      removeEventListener('hashchange', onHash); document.removeEventListener('visibilitychange', onVis);
      urls.forEach((u) => URL.revokeObjectURL(u));
      if (dlg.open) dlg.close();
      dlg.remove();
      result instanceof Error ? reject(result) : resolve(result);
    }

    // Only the latest start() may own the stream: an older one that resolves later stops its tracks, and its error is dropped.
    async function start() {
      const my = ++seq;
      stop(); again.disabled = true;
      let s;
      try {
        s = await navigator.mediaDevices.getUserMedia({ audio: false,
          video: deviceId ? { deviceId: { exact: deviceId }, width: { ideal: 1920 } } : { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } } });
      } catch (e) {
        if (my === seq) { again.disabled = false; throw e; }
        return;
      }
      if (done || my !== seq) { s.getTracks().forEach((t) => t.stop()); return; }
      again.disabled = false;
      stream = s; video.srcObject = s; notice.hidden = true;
      s.getVideoTracks()[0].onended = () => { if (stream === s) failed(); };
      await video.play().catch(() => {});
      paint();
    }

    function paint() {
      count.textContent = `Đã chụp ${files.length}/${max}`;
      shootBtn.disabled = files.length >= max || !stream;
    }

    function fit(w, ht) { frame.style.aspectRatio = `${w} / ${ht}`; frame.style.width = `min(100%, calc(56dvh * ${w / ht}))`; }
    video.addEventListener('loadedmetadata', () => fit(video.videoWidth, video.videoHeight));

    function move(i, x, y) {
      quad[i] = [Math.min(frozen.width, Math.max(0, x)), Math.min(frozen.height, Math.max(0, y))];
      drawQuad();
    }
    function drawQuad() {
      poly.setAttribute('points', quad.map((p) => p.join(',')).join(' '));
      quad.forEach(([x, y], i) => { handles[i].style.left = `${x / frozen.width * 100}%`; handles[i].style.top = `${y / frozen.height * 100}%`; });
    }

    function shoot() {
      if (shootBtn.disabled || !video.videoWidth) return;
      const w = video.videoWidth, ht = video.videoHeight;
      frozen.width = w; frozen.height = ht;
      frozen.getContext('2d', { willReadFrequently: true }).drawImage(video, 0, 0, w, ht);
      outline.setAttribute('viewBox', `0 0 ${w} ${ht}`);
      quad = [[0, 0], [w, 0], [w, ht], [0, ht]];
      fit(w, ht); drawQuad();
      frame.classList.add('cropping'); video.hidden = true; frozen.hidden = false; hint.hidden = false;
      live.hidden = true; crop.hidden = false;
      handles[0].focus();
    }

    function liveMode() {
      frame.classList.remove('cropping'); video.hidden = false; frozen.hidden = true; hint.hidden = true;
      live.hidden = false; crop.hidden = true;
      paint(); (shootBtn.disabled ? live.lastChild : shootBtn).focus();
    }

    const lock = (on) => { busy = on; crop.querySelectorAll('button').forEach((b) => { b.disabled = on; }); };
    function keep() {
      if (busy) return;
      lock(true);
      flatten(frozen, quad).toBlob((blob) => {
        lock(false);
        if (!blob || done || files.length >= max) return;
        const t = new Date(), k = ++shots; // a removal never reuses a name
        const file = new File([blob], `camera-${two(t.getHours())}${two(t.getMinutes())}${two(t.getSeconds())}-${k}.jpg`, { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        files.push(file); urls.push(url);
        const card = h('div.file', {}, h('img', { src: url, alt: '' }),
          h('button', { type: 'button', 'aria-label': 'Bỏ ảnh này', onclick: () => { files.splice(files.indexOf(file), 1); card.remove(); paint(); (shootBtn.disabled ? live.lastChild : shootBtn).focus(); } }, icon('x')));
        thumbs.append(card);
        liveMode();
      }, 'image/jpeg', 0.86);
    }

    addEventListener('hashchange', onHash);
    document.addEventListener('visibilitychange', onVis);
    document.body.append(dlg);
    dlg.showModal();
    paint();
    start().then(async () => {
      shootBtn.focus();
      const cams = (await navigator.mediaDevices.enumerateDevices().catch(() => [])).filter((d) => d.kind === 'videoinput');
      if (cams.length < 2 || done) return;
      deviceId = stream?.getVideoTracks()[0]?.getSettings().deviceId || '';
      pick.replaceChildren(...cams.map((c, i) => h('option', { value: c.deviceId }, c.label || 'Camera ' + (i + 1))));
      pick.value = deviceId; pick.hidden = false;
    }, (e) => finish(Object.assign(new Error(e?.message || 'camera'), { name: e?.name || 'Error' })));
  });
}
