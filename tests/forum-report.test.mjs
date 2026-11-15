import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateReport, REPORT_REASONS } from '../worker/forum.js';

test('validateReport accepts a known reason for a thread or a reply', () => {
  assert.deepEqual(validateReport({ kind: 'reply', id: '12', reason: REPORT_REASONS[0] }), { kind: 'reply', id: 12, reason: REPORT_REASONS[0], note: '' });
  assert.equal(validateReport({ kind: 'thread', id: 3, reason: REPORT_REASONS[1], note: '  spam  ' }).note, 'spam');
});

test('validateReport rejects unknown kinds, ids and reasons', () => {
  assert.throws(() => validateReport({ kind: 'user', id: 1, reason: REPORT_REASONS[0] }), /loại/);
  assert.throws(() => validateReport({ kind: 'thread', id: 'x', reason: REPORT_REASONS[0] }), /bài/);
  assert.throws(() => validateReport({ kind: 'thread', id: 1, reason: 'tôi ghét' }), /lí do/);
});

test('validateReport caps the note', () => {
  assert.throws(() => validateReport({ kind: 'thread', id: 1, reason: REPORT_REASONS[0], note: 'x'.repeat(301) }), /300/);
});
