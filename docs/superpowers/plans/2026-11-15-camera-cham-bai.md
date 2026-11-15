# Chụp bài bằng camera — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every uploader gets a «Chụp bằng camera» button that opens an in-page capture dialog (live view, camera picker, multi-shot, 4-corner flatten) and hands the photos to the existing `add(files)` flow.

**Architecture:** Pure math (homography, slots left) in `public/js/camera-math.js`, tested in node. The dialog in `public/js/camera.js` uses `getUserMedia` + canvas and returns `File[]`. `uploader.js` adds the button and falls back to `<input type="file" accept="image/*" capture="environment">` when the camera is unavailable or refused.

**Tech Stack:** Vanilla ES modules, no build step, no new dependencies; `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-15-camera-cham-bai-design.md`

## Global Constraints

- No new dependency, no OpenCV.js; no auto edge detection.
- Max 3 files per uploader stays: the dialog only allows `3 - count()` shots.
- Camera tracks stop (`track.stop()`) on close, on `hashchange`, and on `visibilitychange` to hidden.
- Keys: Space/Enter capture, Esc close. Every control ≥ 44px. Honour `prefers-reduced-motion`.
- DESIGN.md: four inks, 4px radius, 1px hairlines, tokens only (works in light and dark).
- Every Vietnamese UI string has an English entry in `DICT` (`public/js/i18n.js`).
- Trial branch `thu-nghiem/tinh-nang-moi`: **do not commit** until the user asks; "Commit" steps below become "stage nothing, move on".

## Review Focus

- Camera permission refused or no camera at all → the button opens the native file/camera picker instead; no crash, one toast.
- Uploader already holds 3 files → button disabled with title «Đã đủ 3 tệp.»
- Dragged corners crossed or collapsed (non-convex quad) → «Dùng ảnh» stays allowed but falls back to the uncropped frame, never throws.
- Leaving the page with the dialog open → camera light turns off (tracks stopped).
- Portrait phone camera (height > width) → flattened output keeps the paper's aspect, not forced landscape.

---

### Task 1: Perspective math

**Files:**
- Create: `public/js/camera-math.js`
- Test: `tests/camera-math.test.mjs`

**Interfaces:**
- Produces:
  - `homography(src: [x,y][4], dst: [x,y][4]) -> number[9] | null`: 3×3 row-major matrix mapping src to dst; `null` when degenerate.
  - `apply(H: number[9], [x,y]) -> [x,y]`.
  - `isConvex(quad: [x,y][4]) -> boolean` (corners in order TL, TR, BR, BL).
  - `outSize(quad) -> {w, h}`: mean opposite edge lengths, rounded, each capped at 2000.
  - `slotsLeft(count: number, max = 3) -> number`: `Math.max(0, max - count)`.

- [ ] **Step 1: Write the failing tests**

```js
import { homography, apply, isConvex, outSize, slotsLeft } from '../public/js/camera-math.js';
const near = (a, b) => assert.ok(Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6, `${a} ≉ ${b}`);
test('homography maps each corner onto the rectangle', () => {
  const src = [[10, 20], [300, 5], [320, 410], [0, 400]], dst = [[0, 0], [200, 0], [200, 300], [0, 300]];
  const H = homography(src, dst); src.forEach((p, i) => near(apply(H, p), dst[i]));
});
test('identity quad gives the identity map', () => { const q = [[0,0],[1,0],[1,1],[0,1]]; near(apply(homography(q, q), [0.3, 0.7]), [0.3, 0.7]); });
test('degenerate quad gives null', () => assert.equal(homography([[0,0],[0,0],[0,0],[0,0]], [[0,0],[1,0],[1,1],[0,1]]), null));
test('isConvex', () => { assert.ok(isConvex([[0,0],[10,0],[10,10],[0,10]])); assert.ok(!isConvex([[0,0],[10,10],[10,0],[0,10]])); });
test('outSize keeps portrait paper portrait', () => assert.deepEqual(outSize([[0,0],[210,0],[210,297],[0,297]]), { w: 210, h: 297 }));
test('outSize caps at 2000', () => assert.deepEqual(outSize([[0,0],[4000,0],[4000,1000],[0,1000]]), { w: 2000, h: 1000 }));
test('slotsLeft', () => { assert.equal(slotsLeft(0), 3); assert.equal(slotsLeft(3), 0); assert.equal(slotsLeft(5), 0); });
```

- [ ] **Step 2:** `node --test tests/camera-math.test.mjs` → FAIL (module not found).
- [ ] **Step 3: Implement.** `homography` solves the 8×8 linear system by Gaussian elimination with partial pivoting (|pivot| < 1e-12 → `null`); h₃₃ = 1. Each cap in `outSize` is applied on its own; aspect is not preserved when capping.
- [ ] **Step 4:** `node --test tests/camera-math.test.mjs` → PASS; `npm test` → all pass.

### Task 2: Capture dialog

**Files:**
- Create: `public/js/camera.js`
- Modify: `public/css/app.css` (append a `/* ---- Camera capture ---- */` block), `public/index.html` (add `<symbol id="i-camera">` next to `i-upload`, 24×24 stroke icon), `public/sw.js` (add `js/camera.js`, `js/camera-math.js` to `SHELL`), `public/js/i18n.js` (DICT entries), `tests/i18n-new.test.mjs` (add `'camera.js'` to `FILES`)

**Interfaces:**
- Consumes: Task 1 exports; `h`, `icon`, `toast` from `ui.js`.
- Produces:
  - `canCamera() -> boolean`: `!!navigator.mediaDevices?.getUserMedia && isSecureContext`.
  - `captureDialog({ max: number }) -> Promise<File[]>`: resolves `[]` on cancel; rejects with `Error` whose `name` is the `getUserMedia` error name (`NotAllowedError`, `NotFoundError`, …) when the camera cannot start.

- [ ] **Step 1:** Add `'camera.js'` to `FILES` in `tests/i18n-new.test.mjs`; create `camera.js` with only the two exported stubs; `npm test` → syntax and SW tests FAIL until `SHELL` updated, i18n passes trivially.
- [ ] **Step 2: Implement the dialog** as a `<dialog>` (`showModal`), following DESIGN.md:
  - Live `<video playsinline muted autoplay aria-label="Hình từ camera">` with `facingMode: { ideal: 'environment' }`, `width: { ideal: 1920 }`.
  - Camera `<select>` (shown only when `enumerateDevices()` finds more than one `videoinput`); changing it restarts the stream with `deviceId: { exact }`.
  - Buttons: «Chụp» (primary; Space/Enter), «Xong» → resolves files, «Huỷ» / Esc → resolves `[]`. Counter text `Đã chụp ${n}/${max}`; «Chụp» disabled at `max`.
  - After each shot: freeze frame on a canvas with 4 draggable 44px corner handles (pointer events, keyboard: Tab between handles, arrow keys move 4px, Shift+arrow 20px), defaulting to the full frame; buttons «Dùng ảnh» and «Chụp lại». «Dùng ảnh» warps via inverse homography sampled per output pixel (nearest neighbour is fine) into `outSize`; non-convex quad or `homography` null → use the raw frame.
  - Each kept shot becomes `new File([blob], 'camera-HHMMSS-k.jpg', { type: 'image/jpeg' })` (`toBlob` quality 0.86); thumbnails strip with a 44px remove button each.
  - Stop all tracks on resolve/reject, on `hashchange`, on `visibilitychange` → hidden (show «Camera đã tắt khi bạn rời tab. Bấm Bật lại.» with a «Bật lại» button).
  - Strings in DICT (EN): «Chụp bằng camera»→"Take a photo", «Chụp»→"Capture", «Chụp lại»→"Retake", «Dùng ảnh»→"Use photo", «Xong»→"Done", «Huỷ»→"Cancel", «Kéo 4 góc vào mép tờ giấy để làm phẳng ảnh.»→"Drag the 4 corners to the paper's edges to flatten the photo.", «Chọn camera»→"Choose camera", «Hình từ camera»→"Camera view", «Bật lại»→"Turn on again", «Camera đã tắt khi bạn rời tab. Bấm Bật lại.»→"The camera turned off when you left the tab. Press Turn on again.", plus a RULE for `Đã chụp n/m`→`Taken n/m`.
- [ ] **Step 3:** Add both files to `SHELL`; `npm test` → all pass.
- [ ] **Step 4: Browser check** (`preview_start` the local server; Chrome fake camera is enough): open dialog, take 2 shots, drag a corner, Done → `captureDialog` resolves 2 JPEG files; Esc → `[]` and camera light off; dark theme and 375px width look right.

### Task 3: Wire into every uploader + fallback

**Files:**
- Modify: `public/js/uploader.js` (inside `uploader()`), `public/js/i18n.js`, `public/chinh-sach.html` (VI and EN tables: append «, ảnh chụp bằng camera» / ", photos taken with the camera" to the first-column cell of the uploads row; add sentence «Ảnh chụp bằng camera chỉ nằm trên máy bạn cho tới khi bạn bấm chấm hoặc gửi.» and its EN twin under that table)

**Interfaces:**
- Consumes: `canCamera`, `captureDialog` (Task 2); `slotsLeft` (Task 1); existing `add(list)`.
- Produces: no new exports; uploader DOM gains `button.btn.btn-outline.cam-btn`.

- [ ] **Step 1: Add the button** after the drop zone in `el`: `icon('camera')` + «Chụp bằng camera». Disabled with `title` «Đã đủ 3 tệp.» when `slotsLeft(items.length) === 0` (re-check in `paint()`).
- [ ] **Step 2: Click handler:** if `canCamera()`, `await captureDialog({ max: slotsLeft(items.length) })` then `add(files)` when non-empty; on rejection or when `!canCamera()`, click a hidden `<input type="file" accept="image/*" capture="environment">` wired to `add`, and toast «Không mở được camera trong trang, chuyển sang ứng dụng camera của máy.» only on rejection with `NotAllowedError`/`NotFoundError`. EN: "Couldn't open the camera in the page; switching to your device's camera app."
- [ ] **Step 3:** `npm test` → all pass.
- [ ] **Step 4: Browser check** on `#cham-bai`, a practice problem's step 3, and `#cong-thuc`: shots appear as chips, OCR «Đọc to» works, grading request carries the images; with camera permission blocked in the preview the fallback input opens; with 3 files the button is disabled; EN mode shows English labels; policy page shows the new line in VI and EN.
- [ ] **Step 5:** Run the impeccable detector on `public/css/app.css public/js/camera.js public/js/uploader.js`; fix findings that are not pre-existing.
