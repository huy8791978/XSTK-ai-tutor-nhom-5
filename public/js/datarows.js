// Sample data typed one value per row: xᵢ in its own cell, nᵢ with − / + buttons. Enter goes to the next row,
// pasting several numbers into a cell splits them into rows. Used by «Thống kê mô tả» and «Kiểm định giả thuyết».
import { h, icon } from './ui.js';
import { parseNumbers, collectRows } from './statlib.js';

const show = (v) => String(v).replace('.', ',');

/** { el, data() → { xs, ns } (throws «Dòng k: …»), clear() }. onChange runs after every edit. */
export function dataRows({ freq = true, start = 3, onChange = () => {} } = {}) {
  const list = h('div.drows-list');
  const msg = h('div');
  const changed = () => { renumber(); onChange(); };

  function row(x = '', n = '') {
    const xi = h('input.dx', { type: 'text', inputmode: 'decimal', autocomplete: 'off', value: show(x) });
    const ni = h('input.dn', { type: 'text', inputmode: 'numeric', autocomplete: 'off', value: n === '' ? '' : String(n), placeholder: '1' });
    const step = (d) => { const k = Math.max(0, (ni.value.trim() === '' ? 1 : Math.round(Number(ni.value) || 0)) + d); ni.value = String(k); changed(); };
    const el = h('div.drow', {},
      h('span.drow-i', { 'aria-hidden': 'true' }),
      xi,
      freq ? h('span.stepper', {},
        h('button.btn.btn-ghost', { type: 'button', 'data-dec': '', onclick: () => step(-1) }, '−'), ni,
        h('button.btn.btn-ghost', { type: 'button', 'data-inc': '', onclick: () => step(1) }, '+')) : null,
      h('button.btn.btn-ghost.drow-del', { type: 'button', onclick: () => {
        if (list.children.length > 1) { const next = el.nextElementSibling || el.previousElementSibling; el.remove(); next?.querySelector('.dx').focus(); } else { xi.value = ''; ni.value = ''; }
        changed();
      } }, icon('x')));
    xi.addEventListener('input', changed); ni.addEventListener('input', changed);
    xi.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const next = el.nextElementSibling || (list.append(row()), list.lastElementChild);
      renumber(); next.querySelector('.dx').focus();
    });
    // Several numbers pasted into one cell: one row each, starting here.
    xi.addEventListener('paste', (e) => {
      const text = e.clipboardData?.getData('text') || '';
      let nums;
      try { nums = parseNumbers(text); } catch { return; }
      if (nums.length < 2) return;
      e.preventDefault();
      fill(nums, el);
    });
    return el;
  }

  function renumber() {
    [...list.children].forEach((el, i) => {
      el.querySelector('.drow-i').textContent = String(i + 1);
      el.querySelector('.dx').setAttribute('aria-label', `Giá trị dòng ${i + 1}`);
      el.querySelector('.dn')?.setAttribute('aria-label', `Tần số dòng ${i + 1}`);
      el.querySelector('[data-dec]')?.setAttribute('aria-label', `Giảm tần số dòng ${i + 1}`);
      el.querySelector('[data-inc]')?.setAttribute('aria-label', `Tăng tần số dòng ${i + 1}`);
      el.querySelector('.drow-del').setAttribute('aria-label', `Xoá dòng ${i + 1}`);
    });
  }

  /** Put numbers into rows from `at` on (reusing that row), adding rows as needed. */
  function fill(nums, at) {
    let el = at;
    nums.forEach((v, i) => {
      if (i) { const nr = row(); el.after(nr); el = nr; }
      el.querySelector('.dx').value = show(v);
    });
    changed();
  }

  for (let i = 0; i < start; i++) list.append(row());
  renumber();

  const paste = h('textarea', { rows: 2, id: `dp-${Math.random().toString(36).slice(2, 7)}`, placeholder: 'Ví dụ: 12,5 13 11,8 14,2 (cách nhau bằng dấu cách, dấu ; hoặc xuống dòng)' });
  const bulk = h('details.more.drows-paste', {}, h('summary', {}, 'Dán nhiều số một lúc'),
    h('label.field', { for: paste.id }, h('span', {}, 'Dãy số'), paste),
    h('div.btn-row', { style: 'margin-top:10px' }, h('button.btn', { type: 'button', onclick: () => {
      try {
        const nums = parseNumbers(paste.value);
        if (!nums.length) return;
        const empty = [...list.children].every((el) => !el.querySelector('.dx').value.trim());
        if (empty) list.replaceChildren(row());
        else list.append(row());
        fill(nums, list.lastElementChild);
        paste.value = ''; msg.replaceChildren(); bulk.open = false;
      } catch (e) { msg.replaceChildren(h('div.error', { role: 'alert' }, e.message)); }
    } }, 'Tách thành từng dòng')), msg);

  const el = h('div.drows', {},
    h('div.drow.drow-head', { 'aria-hidden': 'true' }, h('span', {}, '#'), h('span', {}, 'Giá trị xᵢ'), freq ? h('span', {}, 'Tần số nᵢ') : null, h('span')),
    list,
    h('div.btn-row', { style: 'margin-top:10px' }, h('button.btn', { type: 'button', onclick: () => { list.append(row()); renumber(); list.lastElementChild.querySelector('.dx').focus(); } }, '+ Thêm dòng')),
    bulk);

  return {
    el,
    data: () => collectRows([...list.children].map((r) => ({ x: r.querySelector('.dx').value, n: r.querySelector('.dn')?.value ?? '' }))),
    clear: () => { list.replaceChildren(...Array.from({ length: start }, () => row())); changed(); },
  };
}
