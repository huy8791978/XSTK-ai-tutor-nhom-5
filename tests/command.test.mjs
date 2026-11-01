import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand, bestMatch, needsConfirm, findWake, norm } from '../public/js/command.js';

test('navigation: with or without a verb, vi and en', () => {
  assert.deepEqual(parseCommand('Sang trắc nghiệm'), { type: 'nav', route: 'trac-nghiem', verb: true });
  assert.equal(parseCommand('mở trang bản đồ tư duy').route, 'ban-do');
  assert.equal(parseCommand('Mini game').route, 'mini-game');
  assert.equal(parseCommand('về trang chủ').route, 'cham-bai');
  assert.equal(parseCommand('hỏi đáp công thức').route, 'cong-thuc');
  assert.equal(parseCommand('go to the forum').route, 'dien-dan');
  assert.equal(parseCommand('open mind map').route, 'ban-do');
});

test('fixed commands', () => {
  assert.equal(parseCommand('Quay lại').type, 'back');
  assert.equal(parseCommand('hoàn tác đi').type, 'back');
  assert.equal(parseCommand('cuộn xuống').dir, 1);
  assert.equal(parseCommand('đầu trang').to, 'top');
  assert.equal(parseCommand('Dừng').type, 'hush');
  assert.equal(parseCommand('chuyển sang tiếng Anh').lang, 'en');
  assert.equal(parseCommand('tắt nghe').type, 'listen');
  assert.equal(parseCommand('xác nhận').type, 'confirm');
});

test('click and fill keep what was said', () => {
  assert.deepEqual(parseCommand('Bấm tạo 5 bài'), { type: 'click', label: 'tao 5 bai' });
  assert.deepEqual(parseCommand('Điền chủ đề là khoảng tin cậy'), { type: 'fill', field: 'chu de', value: 'khoảng tin cậy' });
  assert.equal(parseCommand('xem gợi ý').bare, true);
  assert.deepEqual(parseCommand('chọn mức độ là nâng cao'), { type: 'fill', field: 'muc do', value: 'nâng cao' });
  assert.equal(parseCommand('chọn chấm bài').type, 'click');
});

test('wake word: lecture ignored, command after «trợ lý ơi» kept', () => {
  assert.equal(parseCommand('bây giờ các em mở trắc nghiệm ra làm', { wake: true }).type, 'none');
  assert.equal(parseCommand('các em chú ý nhé trợ lý ơi sang trắc nghiệm', { wake: true }).route, 'trac-nghiem');
  assert.equal(parseCommand('Trợ lý ơi', { wake: true }).type, 'wake');
  assert.equal(parseCommand('assistant go back', { wake: true }).type, 'back');
  assert.deepEqual(findWake(['a', 'tro', 'ly', 'oi', 'b']), { i: 1, n: 3 });
});

test('bestMatch: close labels only when said without «bấm»', () => {
  const labels = ['Tạo 5 bài tự luận', 'Xem gợi ý cách giải', 'Chấm bài', 'Xoá hồ sơ'];
  assert.equal(bestMatch('tao 5 bai', labels), 0);
  assert.equal(bestMatch('cham bai', labels), 2);
  assert.equal(bestMatch('goi y', labels), 1);
  assert.equal(bestMatch('xem goi y', labels, { bare: true }), -1); // too far from the label to press unasked
  assert.equal(bestMatch('xem goi y cach giai', labels, { bare: true }), 1);
  assert.equal(bestMatch('hom nay cac em hoc bai moi', labels, { bare: true }), -1);
  assert.ok(needsConfirm('Xoá hồ sơ'));
  assert.ok(!needsConfirm('Chấm bài'));
  assert.equal(norm('Đường – Ổn!'), 'duong on');
});
