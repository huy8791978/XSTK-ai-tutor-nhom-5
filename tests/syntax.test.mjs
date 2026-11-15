import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// A syntax error in any page module stops the whole app from loading (they are all imported by app.js).
test('every browser module parses', () => {
  const dir = fileURLToPath(new URL('../public/', import.meta.url));
  const files = ['sw.js', ...readdirSync(`${dir}js`).filter((f) => f.endsWith('.js')).map((f) => `js/${f}`),
    ...readdirSync(`${dir}js/views`).filter((f) => f.endsWith('.js')).map((f) => `js/views/${f}`)];
  const bad = files.filter((f) => spawnSync(process.execPath, ['--check', `${dir}${f}`]).status !== 0);
  assert.deepEqual(bad, []);
});
