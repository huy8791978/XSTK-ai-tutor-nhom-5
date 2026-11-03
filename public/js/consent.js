// Consent before anything typed, uploaded, written on the board or said is sent to the AI (Google Gemini, abroad).
// Asked once, the first time a feature needs the AI; the answer, its time and the policy version are kept in this
// browser (Luật 91/2025/QH15 Điều 9: consent must be explicit and verifiable). Declining keeps the rest of the site.
// shortcut: proof of consent lives only in this browser, upgrade to a server record if the site gets accounts.
export const POLICY_VERSION = '1.0';
const KEY = 'xstk.consent';

const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
export const hasConsent = () => read()?.v === POLICY_VERSION;

let pending = null;
/** Resolves once the user has agreed (now or before); rejects with a readable Error if they decline. */
export function ensureConsent() {
  if (hasConsent()) return Promise.resolve();
  return (pending ??= ask().finally(() => { pending = null; }));
}

function ask() {
  return new Promise((resolve, reject) => {
    const dlg = document.createElement('dialog');
    dlg.className = 'consent';
    dlg.setAttribute('aria-labelledby', 'consent-h');
    dlg.innerHTML = `
      <h2 id="consent-h">Gửi nội dung cho AI</h2>
      <p>Để AI trả lời, chấm bài và đọc tệp, những gì bạn gõ, ảnh/PDF/Word bạn tải lên, chữ viết trên bảng và giọng nói của bạn sẽ được gửi tới Google Gemini, có máy chủ ở nước ngoài.</p>
      <p>Đừng đưa họ tên, mã số sinh viên, số điện thoại vào bài làm hay ảnh chụp.</p>
      <p><a href="chinh-sach.html" target="_blank" rel="noopener">Đọc Chính sách dữ liệu</a></p>
      <div class="btn-row"><button type="button" class="btn" data-no>Không đồng ý</button><button type="button" class="btn" data-yes>Đồng ý</button></div>`;
    const close = (ok) => {
      dlg.close(); dlg.remove();
      if (ok) {
        try { localStorage.setItem(KEY, JSON.stringify({ v: POLICY_VERSION, at: new Date().toISOString() })); } catch { /* private mode: asked again next visit */ }
        resolve();
      } else reject(new Error('Bạn chưa đồng ý gửi nội dung cho AI, nên chức năng này chưa chạy. Bấm lại để xem lời đề nghị.'));
    };
    dlg.querySelector('[data-yes]').onclick = () => close(true);
    dlg.querySelector('[data-no]').onclick = () => close(false);
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(false); }); // Esc = decline
    document.body.append(dlg);
    dlg.showModal();
  });
}
