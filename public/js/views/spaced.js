// Spaced review: every topic where the student made mistakes comes back after 1, 3, 7, 14, 30 days.
// A review is 5 new multiple-choice problems aimed at those exact mistakes; ≥ 8/10 moves the topic up one box.
import { h, rich, run } from '../ui.js';
import { tr as t } from '../i18n.js';
import { ai } from '../api.js';
import { load } from '../profile.js';
import { reviewQueue, advance, INTERVALS, PASS } from '../review.js';
import { pager } from './practice.js';

export const meta = { title: 'Ôn tập ngắt quãng', lede: `Chủ đề nào bạn từng làm sai sẽ quay lại sau ${INTERVALS.join(', ')} ngày, bằng bài mới nhắm đúng lỗi cũ.\nÔn đạt từ ${PASS}/10 thì lần sau giãn ra; chưa đạt thì ôn lại từ đầu.` };

const KEY = 'xstk.review.v1', DAY = 86400_000;
const getState = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const setState = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: schedule lasts this visit */ } };

function dueText(due, now = Date.now()) {
  const d = Math.ceil((due - now) / DAY);
  return d <= 0 ? t('Đến hạn') : d === 1 ? t('Ngày mai') : `${t('Sau')} ${d} ${t('ngày')}`;
}

export function render(root) {
  const stage = h('div', { style: 'margin-top:24px' });
  const list = h('section.panel.ticket', { 'aria-label': 'Lịch ôn tập' });
  const paint = () => {
    const q = reviewQueue(load().sessions, getState());
    const due = q.filter((x) => x.isDue);
    if (!q.length) {
      list.replaceChildren(h('div.board', {}, h('div.row.top-tier', {}, h('b', {}, 'Lịch ôn'), h('span', {}, t('Chưa có lỗi nào được ghi. Làm bài tập, vấn đáp hoặc chấm bài; chủ đề làm sai sẽ tự vào lịch ôn.')), h('em', {}, '0'))),
        h('div.btn-row', { style: 'margin-top:14px' }, h('a.btn.btn-primary', { href: '#trac-nghiem' }, 'Làm bài trắc nghiệm')));
      return;
    }
    list.replaceChildren(h('div.board', {},
      h('div.row.top-tier', {}, h('b', {}, 'Hôm nay'), h('span', {}, due.length ? t('Chủ đề đến hạn ôn. Mỗi lần ôn là 5 câu trắc nghiệm mới, nhắm vào đúng lỗi bạn từng mắc.') : t('Chưa có chủ đề nào đến hạn. Hẹn bạn hôm sau!')), h('em', {}, String(due.length))),
      ...q.map((x) => h('div.row.review-row', { 'data-due': x.isDue ? '' : null },
        h('b', {}, dueText(x.due)),
        h('span', {}, h('strong', {}, x.topic), h('small.muted', {}, ` · ${x.count} ${t('lỗi')} · ${t('hộp')} ${x.box + 1}/${INTERVALS.length}`),
          h('details.more', {}, h('summary', {}, 'Lỗi đã mắc'), h('ul', {}, x.details.map((d) => h('li', {}, rich(d, 'span')))))),
        h('span', {}, h(`button.btn${x.isDue ? '.btn-primary' : ''}`, { type: 'button', onclick: (e) => start(x, e.currentTarget) }, x.isDue ? 'Ôn ngay' : 'Ôn sớm'))))));
  };

  function start(item, btn) {
    run(btn, stage, async () => {
      const d = await ai('practice', { kind: 'mcq', topic: item.topic, level: 'Trung bình', focus: item.details });
      const qs = (d.questions || []).filter((x) => x?.prompt && Array.isArray(x.options) && x.options.length >= 2).slice(0, 5);
      if (!qs.length) throw new Error('AI chưa tạo được bài ôn. Bấm thử lại.');
      return [h('h2.review-title', {}, 'Ôn tập', `: ${item.topic}`), pager('mcq', qs, item.topic, (score) => {
        setState(advance(getState(), item.topic, score, Date.now(), item.box));
        paint();
        stage.prepend(h('p', { class: `tag ${score >= PASS ? 'ok' : ''}`, style: 'margin-bottom:14px' },
          score >= PASS ? 'Đã nhớ: chủ đề được giãn sang hộp tiếp theo.' : 'Chưa đạt: chủ đề sẽ quay lại vào ngày mai.'));
      })];
    }, 'Đang soạn bài ôn theo đúng lỗi của bạn…');
  }

  addEventListener('profile-change', paint);
  addEventListener('langchange', paint); // due dates and counts are built with tr()
  paint();
  root.append(list, stage);
}
