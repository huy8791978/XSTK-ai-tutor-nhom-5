// Forum: students discuss XSTK. Threads + replies stored on the server (Durable Object); math via the formula editor.
import { h, rich, run, toast } from '../ui.js';
import { mathField } from '../mathinput.js';

export const meta = { title: 'Diễn đàn XSTK', lede: 'Nơi người học trao đổi về Xác suất Thống kê: đặt câu hỏi, chia sẻ cách giải, thảo luận đề thi. Hãy lịch sự và không đăng thông tin cá nhân.' };

const NAME_KEY = 'xstk.forum.name', TOKENS_KEY = 'xstk.forum.tokens';
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};
const when = (t) => new Date(t).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

async function api(path, body) {
  let res;
  try {
    res = await fetch(`/api/forum${path}`, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
  } catch { throw new Error('Mất kết nối mạng. Thử lại sau.'); }
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error || `Máy chủ lỗi (${res.status}).`);
  return d;
}
// The server returns a delete token per post; keep it so the author can remove their own posts.
const keep = (kind, id, token) => store.set(TOKENS_KEY, { ...store.get(TOKENS_KEY, {}), [`${kind}:${id}`]: token });
const tokenOf = (kind, id) => store.get(TOKENS_KEY, {})[`${kind}:${id}`];

export function render(root) {
  const id = new URLSearchParams(location.hash.split('?')[1] || '').get('id');
  return id ? thread(root, id) : index(root);
}

function nameField() {
  const input = h('input', { type: 'text', id: `fn-${Math.random().toString(36).slice(2, 6)}`, maxlength: 40, placeholder: 'Ẩn danh', value: store.get(NAME_KEY, '') });
  input.addEventListener('change', () => store.set(NAME_KEY, input.value.trim()));
  return { input, el: h('label.field', { for: input.id, style: 'max-width:260px' }, h('span', {}, 'Tên hiển thị'), input) };
}

function index(root) {
  const filter = h('select', { id: 'f-topic' }, h('option', { value: '' }, 'Tất cả chủ đề'));
  const listBox = h('div');
  const load = (btn) => run(btn || bReload, listBox, async () => {
    const d = await api(`?topic=${encodeURIComponent(filter.value)}`);
    if (filter.options.length === 1) d.topics.forEach((t) => filter.append(h('option', {}, t)));
    if (!d.threads.length) return h('div.panel.empty', {}, h('p', {}, 'Chưa có bài viết nào. Hãy mở đầu cuộc thảo luận!'));
    return h('div.panel', {}, h('div.board', {}, d.threads.map((t) => h('a.row.thread-row', { href: `#dien-dan?id=${t.id}` },
      h('b', {}, t.topic), h('span', {}, h('strong', {}, t.title), h('small.muted', {}, ` · ${t.author} · ${when(t.last)}`)), h('em', {}, `${t.replies}`)))));
  }, 'Đang tải diễn đàn…');
  const bReload = h('button.btn.btn-ghost', { type: 'button', onclick: () => load() }, 'Tải lại');
  filter.onchange = () => load();

  // New thread form
  const title = h('input', { type: 'text', id: 'f-title', maxlength: 150, placeholder: 'Ví dụ: Khi nào dùng phân phối Poisson thay cho nhị thức?' });
  const topic = h('select', { id: 'f-new-topic' });
  const body = mathField({ label: 'Nội dung', name: 'fbody', rows: 5, placeholder: 'Trình bày câu hỏi hoặc chia sẻ của bạn…' });
  const name = nameField();
  const msg = h('div');
  const bPost = h('button.btn.btn-primary', { type: 'button' }, 'Đăng bài');
  const form = h('section.panel.stack', { hidden: true, 'aria-label': 'Bài viết mới' },
    h('h2', {}, 'Bài viết mới'),
    h('label.field', { for: title.id }, h('span', {}, 'Tiêu đề'), title),
    h('div.toolbar', { style: 'margin:0' }, h('label.field', { for: topic.id }, h('span', {}, 'Chủ đề'), topic), name.el),
    body, h('div.btn-row', {}, bPost), msg);
  const bNew = h('button.btn.btn-primary', { type: 'button', onclick: () => {
    form.hidden = !form.hidden;
    if (!topic.options.length) [...filter.options].slice(1).forEach((o) => topic.append(h('option', {}, o.value)));
    if (!form.hidden) title.focus();
  } }, 'Viết bài mới');
  bPost.onclick = () => run(bPost, msg, async () => {
    store.set(NAME_KEY, name.input.value.trim());
    const r = await api('', { title: title.value, topic: topic.value, body: body.querySelector('textarea').value, author: name.input.value });
    keep('thread', r.id, r.token);
    location.hash = `dien-dan?id=${r.id}`;
    return [];
  }, 'Đang đăng…');

  root.append(h('div.toolbar', {}, h('label.field', { for: filter.id }, h('span', {}, 'Lọc theo chủ đề'), filter), h('div.btn-row', {}, bNew, bReload)), form, h('div', { style: 'margin-top:20px' }, listBox));
  load();
}

function thread(root, id) {
  const out = h('div');
  const replyBody = mathField({ label: 'Trả lời', name: 'freply', rows: 4, placeholder: 'Viết câu trả lời của bạn…' });
  const name = nameField();
  const msg = h('div');
  const bReply = h('button.btn.btn-primary', { type: 'button' }, 'Gửi trả lời');
  const del = (kind, pid) => h('button.btn.btn-danger', { type: 'button', onclick: async () => {
    if (!confirm('Xoá bài này?')) return;
    try { await api('/delete', { kind, id: pid, token: tokenOf(kind, pid) }); toast('Đã xoá.'); kind === 'thread' ? (location.hash = 'dien-dan') : show(); } catch (e) { toast(e.message); }
  } }, 'Xoá');
  const show = () => run(bReply, out, async () => {
    const { thread: t, replies } = await api(`/${encodeURIComponent(id)}`);
    return h('div.stack', {},
      h('article.panel', {},
        h('div.tags', {}, h('span.tag.topic', {}, t.topic)),
        h('h2', { style: 'margin:10px 0 4px;font-size:30px' }, t.title),
        h('p.muted', { style: 'font-size:13.5px;margin-bottom:12px' }, `${t.author} · ${when(t.created)}`),
        rich(t.body), tokenOf('thread', t.id) ? h('div.btn-row', { style: 'margin-top:12px' }, del('thread', t.id)) : null),
      h('h3', {}, `${replies.length} trả lời`),
      ...replies.map((r) => h('article.panel.reply', {},
        h('p.muted', { style: 'font-size:13.5px;margin-bottom:6px' }, `${r.author} · ${when(r.created)}`), rich(r.body),
        tokenOf('reply', r.id) ? h('div.btn-row', { style: 'margin-top:8px' }, del('reply', r.id)) : null)));
  }, 'Đang tải bài viết…');
  bReply.onclick = () => run(bReply, msg, async () => {
    store.set(NAME_KEY, name.input.value.trim());
    const ta = replyBody.querySelector('textarea');
    const r = await api(`/${encodeURIComponent(id)}/reply`, { body: ta.value, author: name.input.value });
    keep('reply', r.id, r.token);
    ta.value = ''; ta.dispatchEvent(new Event('input'));
    show();
    return [];
  }, 'Đang gửi…');

  root.append(h('div.btn-row', { style: 'margin-bottom:18px' }, h('a.btn.btn-ghost', { href: '#dien-dan' }, '← Tất cả bài viết')), out,
    h('section.panel.stack', { style: 'margin-top:20px', 'aria-label': 'Trả lời' }, name.el, replyBody, h('div.btn-row', {}, bReply), msg));
  show();
}
