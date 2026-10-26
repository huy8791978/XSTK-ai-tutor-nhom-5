import { test } from 'node:test';
import assert from 'node:assert/strict';
import { speakMath, speakText } from '../public/js/mathspeech.js';
import { mdTree } from '../public/js/mindmap3d.js';

test('speakMath reads the sample variance in full (no skipped index, bar or power)', () => {
  assert.equal(speakMath(String.raw`S^2 = \frac{1}{n-1}\sum_{i=1}^{n}(X_i-\overline{X}_n)^2`),
    'S bình phương bằng 1 trên n trừ 1, tổng từ i bằng 1 đến n của X i trừ X ngang n, tất cả bình phương');
});

test('speakMath: conditional probability, combinations, Greek, roots', () => {
  assert.equal(speakMath(String.raw`P(A/B)=\frac{P(A.B)}{P(B)}`), 'P của A với điều kiện B, bằng phân số P của A nhân B, trên P của B');
  assert.equal(speakMath(String.raw`C_n^k`), 'tổ hợp chập k của n');
  assert.equal(speakMath(String.raw`X\sim N(\mu,\sigma^2)`), 'X tuân theo phân phối N của muy, xích ma bình phương');
  assert.equal(speakMath(String.raw`\frac{s}{\sqrt{n}}`), 's trên căn bậc hai của n');
  assert.equal(speakMath(String.raw`n! = n(n-1)!`), 'n giai thừa bằng n nhân n trừ 1, giai thừa');
  assert.equal(speakMath(String.raw`t_{\alpha/2}(n-1)`), 't chỉ số an pha trên 2, của n trừ 1');
});

test('speakMath in English, with decimal points', () => {
  assert.equal(speakMath(String.raw`P(A|B)`, 'en'), 'P of A given B');
  assert.equal(speakMath(String.raw`\Phi(1,96)=0,475`, 'en'), 'phi of 1.96, equals 0.475');
  assert.equal(speakMath('x^2', 'en'), 'x squared');
});

test('speakText reads formulas inside a sentence and drops markdown marks', () => {
  const s = speakText('**Phương sai mẫu**: $S^2=\\frac{1}{n-1}\\sum (X_i-\\overline{X})^2$');
  assert.ok(s.startsWith('Phương sai mẫu: S bình phương bằng 1 trên n trừ 1'), s);
  assert.ok(!/[$\\{}*]/.test(s), s);
  assert.ok(speakText('Bare \\frac{a}{b} here').includes('a trên b'));
});

test('speakMath never throws and never leaves LaTeX behind', () => {
  for (const t of ['\\frac{', '}{', '\\sqrt', 'x^', '\\left( a \\right.', '\\text{nếu } x>0', '|x|', '']) {
    const s = speakMath(t);
    assert.equal(typeof s, 'string');
    assert.ok(!/\\[a-z]/i.test(s), `${t} → ${s}`);
  }
});

test('mdTree turns headings and nested lists into one tree', () => {
  const t = mdTree('# Gốc\n## A\n- a1\n  - a11\n## B\n- b1');
  assert.equal(t.label, 'Gốc');
  assert.deepEqual(t.children.map((c) => c.label), ['A', 'B']);
  assert.equal(t.children[0].children[0].children[0].label, 'a11');
  const two = mdTree('# X\n# Y', 'Bản đồ');
  assert.equal(two.label, 'Bản đồ');
  assert.equal(two.children.length, 2);
});
