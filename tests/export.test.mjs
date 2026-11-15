import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formulaDoc, fileName } from '../public/js/export.js';

const fake = (tex) => `<math data-tex="${tex}"></math>`; // stands in for KaTeX MathML in node

test('formulaDoc numbers each formula and embeds its MathML for Word', () => {
  const html = formulaDoc(['P(A)=1', '\\bar{x}'], { title: 'Công thức', date: '15/11/2026', render: fake, word: true });
  assert.ok(html.includes('xmlns:w="urn:schemas-microsoft-com:office:word"'));
  assert.ok(html.includes('<meta charset="utf-8">'));
  assert.ok(html.includes('<math data-tex="P(A)=1"></math>') && html.includes('<math data-tex="\\bar{x}"></math>'));
  assert.ok(/1\.[\s\S]*P\(A\)=1[\s\S]*2\.[\s\S]*\\bar\{x\}/.test(html));
  assert.ok(html.includes('15/11/2026'));
});

test('formulaDoc escapes the title and keeps the LaTeX source as plain text', () => {
  const html = formulaDoc(['a<b'], { title: '<script>x</script>', date: 'd', render: fake, word: false });
  assert.ok(!html.includes('<script>x</script>') && html.includes('&lt;script&gt;'));
  assert.ok(html.includes('a&lt;b'));
  assert.ok(!html.includes('urn:schemas-microsoft-com:office:word')); // the PDF page is plain HTML
});

test('formulaDoc refuses an empty list', () => {
  assert.throws(() => formulaDoc([], { title: 't', date: 'd', render: fake }), /công thức/);
});

test('fileName is dated and safe', () => {
  assert.equal(fileName('doc', new Date(2026, 10, 15)), 'cong-thuc-2026-11-15.doc');
});
