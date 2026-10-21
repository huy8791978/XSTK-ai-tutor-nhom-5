// Interactive mind map (markmap): click a node to fold/unfold, drag to pan, pinch/scroll to zoom. KaTeX inside nodes.
import { h, run, loading } from '../ui.js';
import { ai } from '../api.js';
import { plainMath } from '../md.js';
import { COURSE } from '../course-map.js';

// Safari (and every iPhone browser, all WebKit) draws KaTeX inside the map's SVG foreignObject at the wrong place:
// the formulas pile up in the corner. There the map shows math as Unicode text instead.
const WEBKIT = typeof navigator !== 'undefined' && /AppleWebKit/.test(navigator.userAgent) && !/Chrome\/|Chromium|Edg\//.test(navigator.userAgent);
const forMap = (md) => (WEBKIT ? plainMath(md) : md);

export const meta = { title: 'Bản đồ tư duy', lede: 'Bấm vào một nút để thu gọn hoặc mở rộng, kéo để di chuyển, cuộn hoặc chụm hai ngón để phóng to.\nAI có thể vẽ bản đồ cho bất kì chủ đề nào.' };


let lib; // markmap modules, loaded once on first visit
const loadLib = () => (lib ??= Promise.all([
  import('https://cdn.jsdelivr.net/npm/markmap-lib@0.18.12/+esm'),
  import('https://cdn.jsdelivr.net/npm/markmap-view@0.18.12/+esm'),
]).catch((e) => { lib = null; throw e; }));

export function render(root) {
  const input = h('input', { type: 'text', id: 'mm-topic', placeholder: 'Ví dụ: Kiểm định giả thuyết về tỉ lệ', maxlength: 120 });
  const bMake = h('button.btn.btn-primary', { type: 'button' }, 'AI vẽ bản đồ');
  const bCourse = h('button.btn', { type: 'button' }, 'Bản đồ toàn môn');
  const status = h('div');
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.setAttribute('class', 'markmap'); svgEl.setAttribute('role', 'img'); svgEl.setAttribute('aria-label', 'Bản đồ tư duy');
  const bFit = h('button.btn.btn-ghost', { type: 'button' }, 'Vừa khung');
  const bWide = h('button.btn.btn-ghost', { type: 'button' }, 'Mở hết');
  const stage = h('section.panel.mm-wrap', { 'aria-label': 'Bản đồ tư duy tương tác' }, h('div.mm-tools', {}, bWide, bFit), svgEl);
  let mm, transformer, lastMd = COURSE;

  async function show(markdown) {
    lastMd = markdown;
    const [{ Transformer }, { Markmap, deriveOptions }] = await loadLib();
    transformer ??= new Transformer();
    const { root: tree } = transformer.transform(forMap(markdown));
    const opts = deriveOptions({ colorFreezeLevel: 2, initialExpandLevel: 2, maxWidth: 460, spacingVertical: 12, spacingHorizontal: 90, duration: 450, maxInitialScale: 1 });
    opts.color = (node) => ['#1B2A8C', '#D7263D', '#0E9F6E', '#7A5A00'][(node.state?.path?.split('.')[1] ?? 0) % 4];
    if (!mm) mm = Markmap.create(svgEl, opts, tree);
    else { mm.setOptions(opts); mm.setData(tree).then(() => mm.fit()); return; } // d3 transitions wait on frames; do not block the caller
    mm.fit();
  }

  const showSafe = (markdown) => { if (!mm) status.replaceChildren(loading('Đang tải bản đồ tư duy…')); return show(markdown).then(() => status.replaceChildren()).catch(() => status.replaceChildren(h('div.error', { role: 'alert' }, 'Không tải được thư viện bản đồ tư duy. Kiểm tra kết nối mạng rồi tải lại trang.'))); };
  bCourse.onclick = () => { status.replaceChildren(); showSafe(COURSE); };
  bFit.onclick = () => mm?.fit();
  bWide.onclick = async () => {
    const [{ Transformer }] = await loadLib();
    const { root: tree } = new Transformer().transform(forMap(lastMd));
    mm?.setOptions({ initialExpandLevel: -1 }); await mm?.setData(tree); mm?.fit();
  };
  bMake.onclick = () => {
    const t = input.value.trim();
    if (!t) { input.focus(); return; }
    run(bMake, status, async () => {
      const d = await ai('mindmap', { topic: t });
      if (!d.markdown) throw new Error('AI chưa vẽ được bản đồ. Thử lại.');
      await show(d.markdown);
      return [];
    }, 'AI đang vẽ bản đồ…');
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') bMake.click(); });

  root.append(
    h('div.toolbar', {}, h('label.field', { for: 'mm-topic', style: 'max-width:520px;flex-basis:360px' }, h('span', {}, 'Chủ đề'), input), h('div.btn-row', {}, bMake, bCourse)),
    status, stage);
  setTimeout(() => showSafe(COURSE)); // not rAF: a background tab would never paint the map
}
