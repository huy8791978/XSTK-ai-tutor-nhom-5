import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { t } from '../public/js/i18n.js';

// Every Vietnamese UI string in the new tool pages must have an English version, so the EN/VI switch never
// leaves a page half in the other language.
const FILES = ['views/tables.js', 'views/hypothesis.js', 'views/data.js', 'views/sim.js', 'views/spaced.js', 'datarows.js', 'statlib.js', 'views/estimate.js', 'views/dist.js', 'theme.js', 'export.js', 'camera.js', 'steprail.js'];
const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
// Not UI text: storage keys, LaTeX/notation, and messages built from a template (checked by the rules test below).
const SKIP = (s) => !VI.test(s) || s.includes('${') || s.includes('\\') || /^xstk\./.test(s);

test('every Vietnamese string in the new pages translates to English', () => {
  const missing = [];
  for (const f of FILES) {
    const src = readFileSync(new URL(`../public/js/${f}`, import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, '').replace(/\/\*\*[\s\S]*?\*\//g, '');
    for (const [, s] of src.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)) {
      const str = s.replace(/\\n/g, '\n');
      if (SKIP(str)) continue;
      if (t(str) === str) missing.push(`${f}: ${str}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('row-numbered messages and labels translate', () => {
  assert.equal(t('Dòng 2: «abc» không phải là số.'), 'Row 2: «abc» is not a number.');
  assert.equal(t('Dòng 1: chưa có giá trị.'), 'Row 1: no value yet.');
  assert.equal(t('Dòng 3: tần số phải là số nguyên ≥ 0.'), 'Row 3: the frequency must be a whole number ≥ 0.');
  assert.equal(t('«x» không phải là số.'), '«x» is not a number.');
  assert.equal(t('Đã chụp 2/3'), 'Taken 2/3');
});
