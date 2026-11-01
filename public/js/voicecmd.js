// The voice-command button (bottom right) and what each command does on the page. Parsing lives in command.js.
import { parseCommand, bestMatch, needsConfirm } from './command.js';
import { listen, canListen, micBusy, isSpeaking, stopSpeaking } from './voice.js';
import { getLang, setLang, tr } from './i18n.js';
import { h, icon } from './ui.js';

const Rec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
const KEY = 'xstk.cmd.always';

export function initVoiceCommands() {
  if (!canListen()) return;
  const bubble = h('div.vc-bubble', { role: 'status', 'aria-live': 'polite', hidden: true });
  const mic = h('button.vc-mic', { type: 'button', title: 'Ra lệnh bằng giọng nói (Alt+V). Giữ để nói, thả ra để chạy lệnh.', 'aria-label': 'Ra lệnh bằng giọng nói' }, icon('mic'));
  const always = h('button.vc-always', { type: 'button', 'aria-pressed': 'false', title: 'Nghe liên tục: chỉ chạy lệnh bắt đầu bằng «Trợ lý ơi»' }, h('span.vc-dot'), h('span', {}, 'Nghe liên tục'));
  const help = h('button.vc-help', { type: 'button', 'aria-label': 'Các lệnh giọng nói', title: 'Các lệnh giọng nói' }, '?');
  const panel = h('div.vc-panel', { hidden: true },
    h('strong', {}, 'Lệnh giọng nói'),
    h('ul', {},
      h('li', {}, '«Sang trắc nghiệm», «mở bản đồ tư duy», «về trang chủ»'),
      h('li', {}, '«Bấm tạo 5 bài», «xem gợi ý», «chấm bài»'),
      h('li', {}, '«Điền chủ đề là khoảng tin cậy»'),
      h('li', {}, '«Quay lại» / «hoàn tác», «tiến tới»'),
      h('li', {}, '«Cuộn xuống», «cuộn lên», «đầu trang», «cuối trang»'),
      h('li', {}, '«Dừng» (ngừng đọc), «tiếng Anh» / «tiếng Việt»'),
      h('li', {}, '«Tắt nghe» (tắt nghe liên tục)')),
    h('p.muted', {}, 'Nghe liên tục: nói «Trợ lý ơi» trước mỗi lệnh, ví dụ «Trợ lý ơi, sang trắc nghiệm». Lời giảng bình thường không bị coi là lệnh. Không dùng AI, không tốn lượt.'));
  const box = h('div.vc', {}, bubble, panel, h('div.vc-row', {}, help, always, mic));
  document.body.append(box);

  let hideT, pending = null, armedUntil = 0;
  const say = (text, kind = '') => {
    bubble.textContent = tr(text); bubble.className = `vc-bubble ${kind}`; bubble.hidden = false;
    clearTimeout(hideT); hideT = setTimeout(() => { bubble.hidden = true; }, 3500);
  };

  // ---- What a command does.
  const visible = (el) => el.getClientRects().length > 0 && !el.closest('[hidden], .vc') && getComputedStyle(el).visibility !== 'hidden';
  const clickables = () => [...document.querySelectorAll('main button, main a[href], main summary, main [role="button"], main input[type="submit"], header button, header a.btn')]
    .filter((el) => !el.disabled && visible(el));
  const labelOf = (el) => (el.getAttribute('aria-label') || el.textContent || el.value || el.title || '').replace(/\s+/g, ' ').trim();
  const flash = (el) => { el.classList.add('vc-flash'); setTimeout(() => el.classList.remove('vc-flash'), 900); };
  const press = (el) => { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); flash(el); el.click(); say(`✓ ${labelOf(el)}`, 'ok'); };

  function fields() {
    return [...document.querySelectorAll('main input:not([type=hidden]):not([type=file]):not([type=checkbox]):not([type=radio]), main textarea, main select')].filter(visible).map((el) => {
      const box = el.closest('label') || (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.closest('.field');
      const lab = box ? box.textContent.replace(el.textContent, '').slice(0, 80) : ''; // a <select> inside its label: drop the option texts
      return { el, label: `${lab} ${el.placeholder || ''} ${el.getAttribute('aria-label') || ''} ${el.name || ''}`.trim() };
    });
  }

  function run(text, { wake = false } = {}) {
    let a = parseCommand(text, { wake });
    if (wake && a?.type === 'none') {
      if (Date.now() < armedUntil) { armedUntil = 0; a = parseCommand(text); } // «Trợ lý ơi» … (pause) … «sang trắc nghiệm»
      else return;
    }
    if (!a) return;
    if (a.type === 'wake') { armedUntil = Date.now() + 6000; say('Đang chờ lệnh…'); return; }
    if (pending && a.type !== 'confirm') { pending = null; if (a.type === 'cancel') { say('Đã huỷ.'); return; } }
    switch (a.type) {
      case 'hush': stopSpeaking(); document.querySelectorAll('audio').forEach((x) => x.pause()); say('✓ Đã dừng', 'ok'); return;
      case 'back': history.back(); say('✓ Quay lại', 'ok'); return;
      case 'forward': history.forward(); say('✓ Tiến tới', 'ok'); return;
      case 'scroll':
        if (a.to === 'top') scrollTo({ top: 0, behavior: 'smooth' });
        else if (a.to === 'bottom') scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
        else scrollBy({ top: a.dir * innerHeight * 0.7, behavior: 'smooth' });
        say('✓ Đã cuộn', 'ok'); return;
      case 'lang': setLang(a.lang); say(a.lang === 'en' ? '✓ English' : '✓ Tiếng Việt', 'ok'); return;
      case 'listen': setAlways(a.on); return;
      case 'help': panel.hidden = false; return;
      case 'confirm': if (pending) { const el = pending; pending = null; press(el); } return;
      case 'cancel': return;
      case 'nav': {
        if (location.hash.slice(1).split('?')[0] === a.route) { say('✓ Đang ở trang này', 'ok'); return; }
        location.hash = a.route;
        const link = document.querySelector(`[data-route="${a.route}"]`);
        say(`✓ ${link ? labelOf(link.querySelector('.full') || link) : a.route}`, 'ok'); return;
      }
      case 'fill': {
        const list = fields(), i = bestMatch(a.field, list.map((f) => f.label));
        if (i < 0) { say(`Không thấy ô «${a.field}» trên trang này.`, 'err'); return; }
        const el = list[i].el;
        el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.focus();
        if (el.tagName === 'SELECT') {
          const o = [...el.options], j = bestMatch(a.value, o.map((x) => x.textContent));
          if (j < 0) { say(`Không có lựa chọn «${a.value}».`, 'err'); return; }
          el.value = o[j].value;
        } else el.value = a.value;
        el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
        flash(el); say(`✓ ${a.value}`, 'ok'); return;
      }
      case 'click': {
        const list = clickables(), i = bestMatch(a.label, list.map(labelOf), { bare: a.bare && wake });
        if (i < 0) { if (!a.bare || !wake) say(`Chưa hiểu lệnh «${text}».`, 'err'); return; }
        const el = list[i];
        if (needsConfirm(labelOf(el))) { pending = el; flash(el); say(`«${labelOf(el)}»: nói «xác nhận» để làm, «huỷ» để thôi.`, 'warn'); return; }
        press(el); return;
      }
    }
  }

  // ---- One command: tap (ends on silence) or hold (ends on release). Alt+V does the same as a tap.
  let one = null, downAt = 0;
  function startOne() {
    if (one) { one.stop(); return; }
    stopBackground();
    mic.classList.add('on'); say('Đang nghe lệnh…');
    one = listen({ continuous: true, silenceMs: 1400, maxMs: 15000, onInterim: (t) => say(`«${t}»`) });
    one.then((t) => { if (t) run(t); else say('Không nghe thấy lệnh.', 'err'); })
      .catch((e) => say(e?.code === 'not-allowed' ? 'Trình duyệt chưa cho dùng micro.' : 'Micro đang bận hoặc lỗi.', 'err'))
      .finally(() => { one = null; mic.classList.remove('on'); resumeBackground(); });
  }
  mic.addEventListener('pointerdown', (e) => { if (e.button) return; downAt = Date.now(); startOne(); });
  mic.addEventListener('pointerup', () => { if (one && Date.now() - downAt > 500) one.stop(); });
  mic.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startOne(); } });
  addEventListener('keydown', (e) => { if (e.altKey && !e.ctrlKey && (e.key === 'v' || e.key === 'V' || e.code === 'KeyV')) { e.preventDefault(); startOne(); } });
  help.onclick = () => { panel.hidden = !panel.hidden; };

  // ---- Continuous listening (wake word). Paused while a feature uses the mic or the page speaks.
  let bg = null, wanted = false, restartT;
  function setAlways(on) {
    wanted = on;
    always.setAttribute('aria-pressed', String(on)); always.classList.toggle('on', on);
    try { sessionStorage.setItem(KEY, on ? '1' : ''); } catch { /* private mode */ }
    if (on) { resumeBackground(); say('Nghe liên tục: nói «Trợ lý ơi» rồi ra lệnh.', 'ok'); } else { stopBackground(); say('Đã tắt nghe liên tục.'); }
  }
  function stopBackground() { clearTimeout(restartT); if (bg) { const r = bg; bg = null; r.onend = null; try { r.abort(); } catch { /* ended */ } } }
  function resumeBackground() {
    clearTimeout(restartT);
    if (!wanted || bg || one || micBusy() || !Rec) return;
    const r = new Rec();
    r.lang = getLang() === 'en' ? 'en-US' : 'vi-VN'; r.continuous = true; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => {
      if (isSpeaking()) return; // the page's own voice
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) run(e.results[i][0].transcript, { wake: true });
    };
    r.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { setAlways(false); say('Trình duyệt chưa cho dùng micro.', 'err'); } };
    r.onend = () => { if (bg === r) { bg = null; restartT = setTimeout(resumeBackground, 400); } };
    bg = r;
    try { r.start(); } catch { bg = null; restartT = setTimeout(resumeBackground, 1500); }
  }
  always.onclick = () => setAlways(!wanted);
  addEventListener('mic', (e) => { if (e.detail > 0) { if (!one) stopBackground(); } else resumeBackground(); });
  addEventListener('langchange', () => { if (bg) { stopBackground(); resumeBackground(); } });
  try { if (sessionStorage.getItem(KEY)) setAlways(true); } catch { /* */ }
}

