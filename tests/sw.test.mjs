import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const root = new URL('../public/', import.meta.url);
const shell = () => JSON.parse(readFileSync(new URL('sw.js', root), 'utf8').match(/const SHELL = (\[[\s\S]*?\]);/)[1]);

test('the offline shell lists every page module, the stylesheet and the entry page', () => {
  const list = shell();
  const js = [...readdirSync(new URL('js/', root)).filter((f) => f.endsWith('.js')).map((f) => `js/${f}`),
    ...readdirSync(new URL('js/views/', root)).filter((f) => f.endsWith('.js')).map((f) => `js/views/${f}`)];
  for (const f of [...js, 'index.html', 'css/app.css', 'favicon.svg', 'manifest.webmanifest']) assert.ok(list.includes(f), `sw.js SHELL is missing ${f}`);
  for (const f of list.filter((x) => x !== './')) assert.ok(existsSync(new URL(f, root)), `sw.js SHELL lists a file that does not exist: ${f}`);
});

test('the manifest names the app and starts on the home page', () => {
  const m = JSON.parse(readFileSync(new URL('manifest.webmanifest', root), 'utf8'));
  assert.equal(m.start_url, './#trang-chu');
  assert.equal(m.display, 'standalone');
  assert.ok(m.icons.length);
});
