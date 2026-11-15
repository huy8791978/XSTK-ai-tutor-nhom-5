import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewQueue, advance, INTERVALS } from '../public/js/review.js';

const DAY = 86400_000, T0 = Date.UTC(2026, 10, 1, 3);
const s = (at, topic, n = 1, feature = 'practice-mcq') => ({ at, topic, feature, mistakes: Array.from({ length: n }, (_, i) => ({ topic, type: 'Sai tính toán', detail: `lỗi ${i}` })) });

test('a topic with a mistake becomes due one day after the mistake', () => {
  const q = reviewQueue([s(T0, 'Kiểm định giả thuyết')], {}, T0 + DAY / 2);
  assert.equal(q.length, 1);
  assert.equal(q[0].topic, 'Kiểm định giả thuyết');
  assert.equal(q[0].due, T0 + DAY);
  assert.equal(q[0].isDue, false);
  assert.equal(reviewQueue([s(T0, 'A')], {}, T0 + DAY).at(0).isDue, true);
});

test('sessions without mistakes add nothing; mistakes group per topic, due first, then most mistakes', () => {
  const sessions = [s(T0, 'A', 1), s(T0, 'B', 3), s(T0 + 5 * DAY, 'C', 2), { at: T0, topic: 'D', mistakes: [] }];
  const q = reviewQueue(sessions, {}, T0 + 2 * DAY);
  assert.deepEqual(q.map((x) => x.topic), ['B', 'A', 'C']);
  assert.equal(q[0].count, 3);
  assert.equal(q[0].details.length, 3);
});

test('the topic of each mistake wins over the session topic', () => {
  const q = reviewQueue([{ at: T0, topic: 'Khác', mistakes: [{ topic: 'Bayes', detail: 'x' }] }], {}, T0);
  assert.equal(q[0].topic, 'Bayes');
});

test('advance: a good review moves up one box, a poor one goes back to box 0', () => {
  let st = advance({}, 'A', 9, T0);
  assert.deepEqual(st.A, { box: 1, due: T0 + INTERVALS[1] * DAY, last: T0 });
  st = advance(st, 'A', 8, T0 + 10 * DAY);
  assert.equal(st.A.box, 2);
  st = advance(st, 'A', 4, T0 + 20 * DAY);
  assert.deepEqual(st.A, { box: 0, due: T0 + 20 * DAY + INTERVALS[0] * DAY, last: T0 + 20 * DAY });
});

test('the box never passes the last interval', () => {
  let st = {};
  for (let i = 0; i < 10; i++) st = advance(st, 'A', 10, T0 + i);
  assert.equal(st.A.box, INTERVALS.length - 1);
});

test('the review schedule decides the due date until a newer mistake resets it', () => {
  const st = advance({}, 'A', 10, T0 + DAY);
  const q = reviewQueue([s(T0, 'A')], st, T0 + 2 * DAY);
  assert.equal(q[0].due, st.A.due);
  assert.equal(q[0].box, 1);
  const again = reviewQueue([s(T0, 'A'), s(T0 + 3 * DAY, 'A')], st, T0 + 3 * DAY);
  assert.equal(again[0].box, 0);
  assert.equal(again[0].due, T0 + 4 * DAY);
});
