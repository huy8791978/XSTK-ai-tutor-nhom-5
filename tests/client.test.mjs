import { test } from 'node:test';
import assert from 'node:assert/strict';
import { md, esc, plainMath } from '../public/js/md.js';
import { summarize, fmtScore, newSerial, insightPayload } from '../public/js/stats.js';
import { insertLatex } from '../public/js/mathinput.js';

test('md escapes HTML and keeps math untouched', () => {
  const out = md('<img src=x onerror=alert(1)> và $a*b*c$ **đậm**');
  assert.ok(!out.includes('<img'));
  assert.ok(out.includes('$a*b*c$'));
  assert.ok(out.includes('<strong>đậm</strong>'));
});

test('md builds lists, headings and paragraphs', () => {
  assert.equal(md('# Tiêu đề\n- một\n- hai\n\nđoạn'), '<h4>Tiêu đề</h4><ul><li>một</li><li>hai</li></ul><p>đoạn</p>');
  assert.equal(md('1. a\n2. b'), '<ol><li>a</li><li>b</li></ol>');
});

test('esc handles null', () => assert.equal(esc(null), ''));

test('course map keeps the formulas the lecturer approved', async () => {
  const { COURSE } = await import('../public/js/course-map.js');
  const has = (s) => assert.ok(COURSE.includes(s), `missing: ${s}`);
  assert.equal(COURSE.match(/^## Bài \d/gm).length, 7);
  has('np-q\\le k_0\\le np-q+1'); // Mod of the binomial (Bài 3, slide p.8)
  has('\\lambda=np\\le 5');
  has('\\Phi\\left(\\frac{k_2-np}{\\sqrt{npq}}\\right)-\\Phi\\left(\\frac{k_1-np}{\\sqrt{npq}}\\right)'); // no ±0,5 (lecturer)
  has('$E(X)=p$, $Var(X)=\\frac{pq}{n}$'); // kept as in the lecturer's map
  has('\\frac{(n-1)s^2}{\\chi^2_{\\alpha/2}(n-1)};\\ \\frac{(n-1)s^2}{\\chi^2_{1-\\alpha/2}(n-1)}');
  has('\\sqrt{f(1-f)\\left(\\frac{1}{n}+\\frac{1}{m}\\right)}');
  has('$\\sigma_1^2<\\sigma_2^2$: $W=(-\\infty;F_\\alpha(n-1;m-1))$'); // kept as in the lecturer's map
  assert.ok(!COURSE.includes('Tương quan') && !COURSE.includes('Chebyshev'));
});

test('plainMath turns course notation into Unicode text', () => {
  const B = String.fromCharCode(92); // a backslash, kept out of the source so editors and shells can't eat it
  const t = (s) => plainMath(s.replaceAll('~', B));
  assert.equal(t('Hợp $A~cup B$, giao $A~cap B$'), 'Hợp A ∪ B, giao A ∩ B');
  assert.equal(t('$P(A)=~frac{|A|}{|~Omega|}$'), 'P(A)=|A|/|Ω|');
  assert.equal(t('$D(X)=E(X^2)-[E(X)]^2$'), 'D(X)=E(X²)-[E(X)]²');
  assert.equal(t('$H_0$, $~chi^2$, $N(~mu;~sigma^2)$'), 'H₀, χ², N(μ;σ²)');
  assert.equal(t('$~bar{x}$ và $~overline{A}$'), 'x̄ và Ā');
  assert.equal(t('$P(B~mid A)$'), 'P(B | A)');
});

test('insertLatex wraps in $ outside math, with a space before', () => {
  const r = insertLatex('Tính', 4, 4, '\\frac{1}{2}');
  assert.equal(r.value, 'Tính $\\frac{1}{2}$');
  assert.equal(r.cursor, r.value.length);
});

test('insertLatex inside math adds no $ and replaces the selection', () => {
  const r = insertLatex('$x + y$', 1, 2, '\\sqrt{x}');
  assert.equal(r.value, '$\\sqrt{x} + y$');
  assert.equal(r.cursor, 1 + '\\sqrt{x}'.length);
});

const S = [
  { serial: 'XS·1', feature: 'tutor', topic: 'Bayes', score: 6, mistakes: [{ topic: 'Bayes', type: 'Sai tính toán', detail: 'a' }] },
  { serial: 'XS·2', feature: 'oral', topic: 'Bayes', score: 8, mistakes: [{ topic: 'Bayes', type: 'Sai tính toán', detail: 'b' }, { topic: 'Ước lượng', type: 'Đọc sai đề', detail: 'c' }] },
  { serial: 'XS·3', feature: 'practice-mcq', topic: 'Ước lượng', score: 10, mistakes: [] },
];

test('summarize aggregates scores, error types and weakest topics', () => {
  const s = summarize(S);
  assert.equal(s.n, 3);
  assert.equal(s.avg, 8);
  assert.equal(s.mistakeCount, 3);
  assert.deepEqual(s.errorTypes[0], { name: 'Sai tính toán', count: 2 });
  assert.equal(s.topics[0].name, 'Bayes'); // weakest first
  assert.equal(s.recent[0].detail, 'c');
});

test('summarize handles an empty profile', () => {
  const s = summarize([]);
  assert.equal(s.avg, null); assert.equal(s.n, 0);
});

test('fmtScore uses Vietnamese decimals', () => {
  assert.equal(fmtScore(7.5), '7,5'); assert.equal(fmtScore(10), '10'); assert.equal(fmtScore(null), '—');
});

test('newSerial is zero-padded', () => assert.equal(newSerial(() => 0.000042), 'XS·000042'));

test('insightPayload is compact JSON', () => {
  const p = JSON.parse(insightPayload(S));
  assert.equal(p.soPhien, 3); assert.equal(p.loiGanDay.length, 3);
});

test('md protects Vietnamese decimal commas inside math', () => {
  assert.equal(md('$0,25 + 1,5$'), '<p>$0{,}25 + 1{,}5$</p>');
});

test('byFeature splits sessions by feature', async () => {
  const { byFeature } = await import('../public/js/stats.js');
  const r = byFeature(S);
  assert.deepEqual(r.map((x) => x.feature), ['tutor', 'practice-mcq', 'oral']);
  assert.equal(r.find((x) => x.feature === 'oral').mistakes, 2);
  assert.equal(r.find((x) => x.feature === 'tutor').avg, 6);
});

test('t() translates known UI strings, runtime patterns, and leaves the rest alone', async () => {
  const { t } = await import('../public/js/i18n.js');
  assert.equal(t('Chấm bài'), 'Grade');
  assert.equal(t('  Hồ sơ của tôi '), '  My profile ');
  assert.equal(t('Câu 3'), 'Question 3');
  assert.equal(t('Bước 2: Chương trình giải →'), 'Step 2: Plan →');
  assert.equal(t('Một câu AI viết'), 'Một câu AI viết');
});

test('voice: unclear() flags empty or meaningless transcripts', async () => {
  const { unclear, FALLBACK } = await import('../public/js/voice.js');
  assert.equal(unclear(''), true); assert.equal(unclear(' . '), true);
  assert.equal(unclear('xác suất có điều kiện là gì'), false);
  assert.match(FALLBACK.vi, /nghe không rõ/);
});

test('md escapes % inside math so KaTeX does not treat it as a comment', () => {
  assert.equal(md('$6,1 \\text{ (%/năm)}$'), '<p>$6{,}1 \\text{ (\\%/năm)}$</p>');
  assert.equal(md('$50\\%$'), '<p>$50\\%$</p>');
});

test('md wraps a bare LaTeX line in $ but leaves prose that mentions a command', () => {
  assert.equal(md('\\overline{x} = \\frac{307,2}{50}'), '<p>$\\overline{x} = \\frac{307{,}2}{50}$</p>');
  assert.equal(md('- s = \\sqrt{0,32} \\approx 0,57 \\text{ (%/năm)}'), '<ul><li>$s = \\sqrt{0{,}32} \\approx 0{,}57 \\text{ (\\%/năm)}$</li></ul>');
  assert.equal(md('Dùng lệnh \\frac để viết phân số'), '<p>Dùng lệnh \\frac để viết phân số</p>');
});

test('nodes() drops empty slots so absent AI fields never render as "null"/"undefined"', async () => {
  const { nodes } = await import('../public/js/ui.js');
  assert.deepEqual(nodes(['a', null, [undefined, 'b', [false, 'c']]]), ['a', 'b', 'c']);
  assert.deepEqual(nodes(null), []);
});

test('md repairs broken math delimiters so formulas always render', () => {
  const B = String.fromCharCode(92);
  const t = (s) => md(s.replaceAll('~', B));
  // The bug from the screenshot: a formula opened with $ and never closed.
  assert.equal(t('- Công thức: $(~bar{x} - t_{~alpha/2}(n-1)~frac{s}{~sqrt{n}})'), `<ul><li>Công thức: $(${B}bar{x} - t_{${B}alpha/2}(n-1)${B}frac{s}{${B}sqrt{n}})$</li></ul>`);
  assert.equal(t('Giá 5$ một vé'), '<p>Giá 5 một vé</p>');
  assert.equal(t('Có $a$ và $b$'), '<p>Có $a$ và $b$</p>');
  // LaTeX typed into a sentence with no $ at all.
  assert.equal(t('Tra bảng t_{~alpha/2}(n-1) ứng với độ tin cậy.'), `<p>Tra bảng $t_{${B}alpha/2}(n-1)$ ứng với độ tin cậy.</p>`);
  assert.equal(t('dạng ~bar{x} - ~varepsilon < ~mu, rồi kết luận'), `<p>dạng $${B}bar{x} - ${B}varepsilon &lt; ${B}mu$, rồi kết luận</p>`);
});

test('CASIO steps survive the shapes the AI sends and turn text math into LaTeX', async () => {
  const { casioSteps, noteMath } = await import('../public/js/ui.js');
  const B = String.fromCharCode(92);
  assert.equal(noteMath('Xem các giá trị thống kê mẫu x_bar và sx'), `Xem các giá trị thống kê mẫu $${B}bar{x}$ và sx`);
  assert.equal(noteMath('hoặc tra bảng giá trị tới hạn t_alpha/2(n-1))'), `hoặc tra bảng giá trị tới hạn $t_{${B}alpha/2}(n-1)$)`);
  assert.equal(noteMath('mức ý nghĩa alpha = 0.05, s_x và x^2'), `mức ý nghĩa $${B}alpha$ = 0.05, $s_{x}$ và $x^{2}$`);
  assert.equal(noteMath('Đã có $s_x$ nên giữ nguyên x_bar'), 'Đã có $s_x$ nên giữ nguyên x_bar');
  const s = casioSteps([{ keys: 'MENU 6', note: 'Thống kê' }, { keys: ['SHIFT+÷'] }, { keys: [{ key: 'shift' }, `${B}sqrt{}`, '0.95'] }, 'Đọc kết quả', null, { keys: [] }]);
  assert.deepEqual(s.map((x) => x.keys), [['MENU', '6'], ['SHIFT', '÷'], ['SHIFT', '√', '0.95'], []]);
  assert.equal(s[3].note, 'Đọc kết quả');
  assert.deepEqual(casioSteps('không phải mảng'), []);
  assert.deepEqual(casioSteps(null), []);
});

// String.fromCharCode(92) is a backslash; the shell would eat a literal one in this file.
test('md turns literal backslash-n into line breaks outside math only', () => {
  const B = String.fromCharCode(92);
  assert.equal(md(`Mở đầu${B}n1. **Tìm hiểu đề**${B}n2. Lập kế hoạch`), '<p>Mở đầu</p><ol><li><strong>Tìm hiểu đề</strong></li><li>Lập kế hoạch</li></ol>');
  assert.equal(md(`$a ${B}neq b$`), `<p>$a ${B}neq b$</p>`);
});

test('voiceGender guesses from common voice names', async () => {
  const { voiceGender } = await import('../public/js/voice.js');
  assert.equal(voiceGender('Microsoft An - Vietnamese (Vietnam)'), 'male');
  assert.equal(voiceGender('Microsoft NamMinh Online (Natural) - Vietnamese (Vietnam)'), 'male');
  assert.equal(voiceGender('Microsoft HoaiMy Online (Natural) - Vietnamese (Vietnam)'), 'female');
  assert.equal(voiceGender('Google Tiếng Việt'), 'female');
  assert.equal(voiceGender('Microsoft David - English (United States)'), 'male');
  assert.equal(voiceGender('Unknown voice'), 'female');
});

test('pitchFor lowers a female-only voice when the male teacher is picked', async () => {
  const { pitchFor } = await import('../public/js/voice.js');
  assert.equal(pitchFor('Google Tiếng Việt', 'male') < 1, true);
  assert.equal(pitchFor('Microsoft An - Vietnamese', 'male'), 1);
  assert.equal(pitchFor('Google Tiếng Việt', 'female'), 1);
});

test('pitchFor raises a male-only voice when the female teacher is picked', async () => {
  const { pitchFor } = await import('../public/js/voice.js');
  assert.equal(pitchFor('Microsoft An - Vietnamese (Vietnam)', 'female') > 1, true);
  assert.equal(pitchFor('Microsoft HoaiMy Online (Natural)', 'female'), 1);
});

test('pcmToWav writes a 44-byte RIFF/WAVE header for 24 kHz mono 16-bit audio', async () => {
  const { pcmToWav } = await import('../public/js/voice.js');
  const w = pcmToWav(new Uint8Array([1, 2, 3, 4]), 24000);
  const v = new DataView(w.buffer);
  assert.equal(String.fromCharCode(...w.slice(0, 4)), 'RIFF');
  assert.equal(String.fromCharCode(...w.slice(8, 12)), 'WAVE');
  assert.equal(v.getUint32(24, true), 24000);
  assert.equal(v.getUint32(40, true), 4);
  assert.equal(w.length, 48);
});

test('matchPronoun makes the spoken self-reference match the picked voice', async () => {
  const { matchPronoun } = await import('../public/js/voice.js');
  assert.equal(matchPronoun('Em hãy cùng cô xem ví dụ. Cô tin em làm được.', 'male'), 'Em hãy cùng thầy xem ví dụ. Thầy tin em làm được.');
  assert.equal(matchPronoun('Thầy sẽ giải thích, thầy hỏi em nhé.', 'female'), 'Cô sẽ giải thích, cô hỏi em nhé.');
  assert.equal(matchPronoun('Bài cố định cốt lõi, thầy thuốc', 'male'), 'Bài cố định cốt lõi, thầy thuốc');
});

test('md keeps the number of an ordered list that resumes after bullets', () => {
  assert.equal(md('1. Tìm hiểu đề\n- Đã cho\n2. Lập kế hoạch\n- Công thức'),
    '<ol><li>Tìm hiểu đề</li></ol><ul><li>Đã cho</li></ul><ol start="2"><li>Lập kế hoạch</li></ol><ul><li>Công thức</li></ul>');
});
