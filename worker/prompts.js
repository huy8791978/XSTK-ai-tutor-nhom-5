// Task-based prompts: the browser never sends a raw prompt, so the key can't be used as a general chatbot.

import { TOPICS, ERROR_TYPES } from '../public/js/topics.js';

export { TOPICS, ERROR_TYPES };
const LIMITS = { text: 8000, files: 7, fileBytes: 14_000_000, history: 24 }; // files: 3 for the problem + 3 for the work + the iPad board
const MIMES = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];

const SYSTEM = `Bạn là gia sư môn Xác suất Thống kê (XSTK) cho sinh viên đại học Việt Nam. Luôn trả lời bằng tiếng Việt có dấu.
Viết công thức bằng LaTeX: $...$ trong dòng, $$...$$ riêng dòng; MỌI công thức phải nằm trong cặp dấu $. Phần trăm trong công thức viết \\%.
Trong chuỗi JSON, mỗi dấu \\ của LaTeX phải nhân đôi (ví dụ "\\\\frac{1}{2}", "\\\\sqrt{x}"). Trong nội dung không dùng dấu ngoặc kép, hãy dùng « » hoặc ' ' (ví dụ «giỏi»). Trong chữ và công thức hiển thị dùng dấu phẩy thập phân kiểu Việt Nam (0,25); nhưng giá trị SỐ của JSON (pA, n, p, lambda, mu, sigma, values, score, points, max, answer…) bắt buộc dùng dấu chấm: 0.25.
Sư phạm bắt buộc:
- Giải toán theo 4 bước Polya: (1) Tìm hiểu đề: cái đã cho, cái phải tìm, điều kiện, kí hiệu; (2) Xây dựng chương trình giải: đưa về bài toán quen thuộc, chọn kiến thức, dự đoán; (3) Trình bày lời giải; (4) Kiểm tra & nghiên cứu: kiểm tra kết quả, rút ra phương pháp, cách khác, bài tương tự/khái quát.
- Dạy khái niệm và định lí theo: Trải nghiệm → Hình thành → Củng cố → Vận dụng.
Chủ đề hợp lệ: ${TOPICS.join('; ')}.
Loại lỗi hợp lệ: ${ERROR_TYPES.join('; ')}.
Khi có ví dụ minh hoạ được bằng biểu đồ, thêm trường "viz" theo một trong các dạng:
{"type":"binomial","n":10,"p":0.3,"caption":"..."} | {"type":"poisson","lambda":3,"caption":"..."} |
{"type":"normal","mu":0,"sigma":1,"a":-1,"b":1,"caption":"..."} (a,b tuỳ chọn để tô vùng) |
{"type":"bars","labels":["..."],"values":[...],"caption":"..."} | {"type":"venn","pA":0.5,"pB":0.4,"pAB":0.2,"caption":"..."}.
Nếu không phù hợp thì đặt "viz": null.
Khi lời giải có phép tính, thêm trường "casio": hướng dẫn bấm máy tính CASIO fx-580VN X từng bước, dạng
[{"keys": ["MENU","7"], "note": "Vào chế độ Phân phối"}, {"keys": ["SHIFT","÷"], "note": "nCr"}].
Mỗi phần tử "keys" là tên phím in trên máy (MENU, SHIFT, ALPHA, OPTN, CALC, SOLVE, =, AC, DEL, ▲, ▼, ◀, ▶, x², √, ÷, ×, +, −, (, ), x10ˣ, Ans, chữ số…) hoặc ô nhập giá trị. Dùng đúng chế độ của fx-580VN X (Tính toán, Thống kê, Phân phối, Bảng, Phương trình…), ghi kết quả máy hiện ở "note" của bước cuối. Mỗi phần tử "keys" chỉ là MỘT phím (không gộp kiểu "SHIFT+÷"). Trong "note", mọi kí hiệu toán viết LaTeX trong $...$ (ví dụ $\\\\bar{x}$, $s_x$, $t_{\\\\alpha/2}(n-1)$, $\\\\sigma$), không viết dạng chữ như x_bar, alpha, t_alpha/2. Không dùng máy tính thì "casio": [].
Chỉ trả về JSON hợp lệ đúng cấu trúc được yêu cầu.`;

const CASIO = '"casio": [{"keys": ["..."], "note": "..."}]';
const POLYA_Q = '"polya": {"understand": ["câu hỏi dẫn dắt bước 1: cái đã cho, cái phải tìm, điều kiện, kí hiệu"], "given": ["cái đã cho"], "find": ["cái phải tìm"], "plan": ["câu hỏi dẫn dắt bước 2: đưa về bài toán quen thuộc, chọn công thức"], "present": "<gợi ý cách trình bày bước 3, không có đáp số>", "check": ["câu hỏi tự kiểm tra bước 4"], "extend": "<bài tương tự hoặc khái quát hoá>"}';

// Where the student's work is: the typed answer, the images/PDFs after the problem's own files, Word files marked [Bài làm].
function workSource(p) {
  const n = Number.isInteger(p.problemFiles) && p.problemFiles > 0 ? p.problemFiles : 0;
  const parts = [];
  if (p.answer) parts.push(`Bài làm sinh viên gõ:\n${p.answer}`);
  if (n) parts.push(`Trong các tệp ảnh/PDF đính kèm: ${n} tệp đầu là ĐỀ BÀI, các tệp còn lại là BÀI LÀM của sinh viên.`);
  else parts.push('Các tệp ảnh/PDF đính kèm (nếu có) là BÀI LÀM của sinh viên.');
  parts.push('Tệp Word (nếu có) ở cuối, nhãn [Đề bài] hoặc [Bài làm] ở tên tệp.');
  return parts.join('\n');
}

const MISTAKE =`{"topic": "<chủ đề hợp lệ>", "type": "<loại lỗi hợp lệ>", "detail": "<mô tả ngắn>"}`;

const TASKS = {
  // Re-render content already on screen in the other language after the EN/VI switch.
  // Read every word in uploaded images/PDFs so the browser can read the document aloud.
  ocr: (p) => {
    if (!p.files?.length) throw new Error('Hãy chọn ảnh hoặc PDF cần đọc.');
    return { text: `Nhận dạng chữ (OCR) TOÀN BỘ nội dung tệp đính kèm, đúng thứ tự từ trên xuống, giữ nguyên ngôn ngữ gốc. Không dịch, không tóm tắt, không sửa lỗi, không giải bài. Công thức viết LaTeX trong $...$. Giữ xuống dòng giữa các đoạn. Chữ không đọc được ghi [không rõ].
Trả JSON: {"text": "<toàn bộ chữ trong tệp>"}` };
  },
  translate: (p) => {
    const items = p.items;
    if (!Array.isArray(items) || !items.length || items.length > 40 || items.some((s) => typeof s !== 'string')) throw new Error('Danh sách cần dịch không hợp lệ.');
    if (items.reduce((n, s) => n + s.length, 0) > 12000) throw new Error('Nội dung cần dịch quá dài.');
    return {
      text: `Dịch từng mục trong mảng JSON sau sang ${p.to === 'en' ? 'English' : 'tiếng Việt'}. Giữ NGUYÊN công thức LaTeX ($...$, $$...$$), định dạng markdown, số liệu và xuống dòng; chỉ dịch chữ. Không thêm, không bớt, không gộp mục.
${JSON.stringify(items)}
Trả JSON: {"items": ["bản dịch mục 1", "..."]} với đúng ${items.length} mục, cùng thứ tự.`,
    };
  },
  strategy: (p) => ({
    text: `Đề bài (có thể kèm ảnh/PDF):\n${p.problem || '(xem tệp đính kèm)'}\n
Nhiệm vụ: CHỈ đưa ra chiến lược giải (bước 1 và 2 Polya). TUYỆT ĐỐI KHÔNG đưa đáp số, KHÔNG thay số tính ra kết quả cuối, KHÔNG viết lời giải hoàn chỉnh.
Trả JSON: {"topic": "<chủ đề>", "given": ["..."], "find": ["..."], "conditions": ["..."], "plan": ["bước gợi ý dạng câu hỏi dẫn dắt..."], "knowledge": ["công thức/định lí cần dùng"], "pitfalls": ["sai lầm hay gặp"], "viz": null}`,
  }),
  grade: (p) => ({
    text: `Đề bài: ${p.problem || '(nếu đề nằm trong tệp, hãy tự nhận dạng)'}\n
${workSource(p)} Hãy nhận dạng chữ (OCR) bài làm rồi CHẤM ĐIỂM thang 10 theo từng bước.
${p.barem ? `BAREM ĐIỂM của giáo viên (chấm đúng theo barem này, mỗi mục barem là một dòng rubric):\n${p.barem}\n` : 'Chưa có barem: tự lập barem hợp lí theo 4 bước Polya.\n'}Bài làm có thể là ảnh chụp, PDF hoặc ảnh viết tay trên bảng (iPad).
Chỉ chấm và nhận xét bài làm; KHÔNG viết lời giải đúng hoàn chỉnh, KHÔNG nêu đáp số đúng.
Trả JSON: {"transcript": "<bài làm đã nhận dạng, dùng LaTeX>", "score": <0-10>, "summary": "...", "rubric": [{"step": "...", "points": <số>, "max": <số>, "comment": "..."}], "strengths": ["..."], "mistakes": [${MISTAKE}], "advice": ["..."]}`,
  }),
  solve: (p) => ({
    text: `Đề bài (có thể kèm ảnh/PDF):\n${p.problem || '(xem tệp đính kèm)'}\n
Viết lời giải chi tiết đủ 4 bước Polya.
Trả JSON: {"topic": "<chủ đề>", "understand": "<bước 1, markdown>", "plan": "<bước 2>", "solution": "<bước 3, lời giải chi tiết từng dòng>", "check": "<bước 4: kiểm tra, phương pháp rút ra, cách khác>", "similar": ["2 bài tương tự/khái quát hoá"], ${CASIO}, "viz": <viz hoặc null>}`,
  }),
  practice: (p) => ({
    text: `Tạo đúng 5 bài ${p.kind === 'mcq' ? 'TRẮC NGHIỆM 4 phương án (chỉ 1 đúng)' : 'TỰ LUẬN'} mới, khác nhau, về chủ đề "${p.topic}", mức độ ${p.level || 'trung bình'}, gắn với tình huống thực tế Việt Nam khi có thể.${p.sample ? `
Các bài phải TƯƠNG TỰ bài mẫu sau (cùng dạng, đổi số liệu và bối cảnh): ${p.sample}` : ''}${p.files?.length || p.docs?.length ? `
Bài mẫu nằm trong tệp đính kèm (ảnh/PDF: hãy nhận dạng chữ OCR; Word: văn bản ở cuối). Các bài phải TƯƠNG TỰ bài mẫu đó (cùng dạng, đổi số liệu và bối cảnh); nếu tệp có nhiều bài, lấy đủ các dạng. Chủ đề khi đó theo bài mẫu.` : ''}
Trả JSON: {"questions": [{"prompt": "...", ${p.kind === 'mcq' ? '"options": ["A","B","C","D"], "answer": <chỉ số 0-3>, ' : ''}"topic": "<chủ đề>", ${POLYA_Q}, "solution": "<lời giải chi tiết 4 bước Polya, markdown>", ${CASIO}, "viz": <viz hoặc null>}]}
Mỗi câu đi kèm đủ 4 bước giải toán Polya để sinh viên tự củng cố. Bước 1, 2 và 4 là câu hỏi dẫn dắt, TUYỆT ĐỐI không lộ đáp số.`,
  }),
  explain: (p) => ({
    text: `Câu trắc nghiệm: ${p.question}\nCác phương án: ${(p.options || []).map((o, i) => `${'ABCD'[i]}. ${o}`).join(' | ')}\nĐáp án đúng: ${'ABCD'[p.answer] ?? '?'}. Sinh viên đã chọn: ${'ABCD'[p.picked] ?? '(chưa chọn)'}.
Câu hỏi của sinh viên: ${p.ask || 'Vì sao đáp án đúng là như vậy?'}
Giải đáp ngắn gọn, đúng trọng tâm câu hỏi: vì sao đáp án đúng, vì sao phương án sinh viên chọn sai (nếu sai), sai lầm thường gặp.
Trả JSON: {"answer": "<markdown, LaTeX>", ${CASIO}, "viz": <viz hoặc null>}`,
  }),
  voice: (p) => ({
    text: `Hội thoại bằng GIỌNG NÓI với sinh viên về môn XSTK. ${p.lang === 'en' ? `You are a ${p.gender === 'male' ? 'male' : 'female'} teacher speaking English with the student: use "I" and "you", never Vietnamese pronouns or greetings, in both "reply" and "speech".` : `Bạn là ${p.gender === 'male' ? 'THẦY giáo: xưng là «thầy», KHÔNG xưng «cô»' : 'CÔ giáo: xưng là «cô», KHÔNG xưng «thầy»'} (gọi sinh viên là «em»), ở cả "reply" lẫn "speech", kể cả khi lịch sử bên dưới xưng khác.`} Câu nói của sinh viên được nhận dạng tự động nên có thể sai chính tả hoặc thiếu ý. Lịch sử:\n${history(p.history) || '(chưa có)'}\n
Sinh viên vừa nói: "${p.text || ''}"${p.typed ? ' (gõ bằng bàn phím)' : ''}. ${p.files?.length ? 'Kèm ảnh bài viết trên bảng (iPad).' : ''}
- Nếu câu nói rỗng, vô nghĩa, không liên quan XSTK hoặc bạn KHÔNG chắc đã hiểu đúng ý, đặt "understood": false.
- Nếu là bài toán có nhiều công thức, khó trình bày bằng lời, đặt "board": true để mời sinh viên viết đề/lời giải lên bảng.
- Bài toán: dẫn dắt theo 4 bước Polya, không đưa ngay đáp số trừ khi sinh viên đã tự làm.
Trả JSON: {"understood": true|false, "reply": "<câu trả lời hiển thị, markdown + LaTeX>", "speech": "<bản để đọc thành tiếng: ${p.lang === 'en' ? 'in plain spoken English' : 'tiếng Việt thuần'}, KHÔNG LaTeX, đọc công thức bằng lời, tối đa 4 câu>", "board": true|false, ${CASIO}, "viz": <viz hoặc null>}`,
  }),
  practiceGrade: (p) => ({
    text: `Đề: ${p.question}\nLời giải tham khảo (để chấm, KHÔNG chép lại cho sinh viên): ${p.reference}\nBài làm sinh viên: ${p.answer || '(xem tệp đính kèm)'}\n
Chấm thang 10 theo từng bước, chỉ nhận xét bài làm.
Trả JSON: {"score": <0-10>, "summary": "...", "rubric": [{"step": "...", "points": <số>, "max": <số>, "comment": "..."}], "mistakes": [${MISTAKE}], "advice": ["..."]}`,
  }),
  oral: (p) => p.action === 'finish' ? ({
    text: `Phiên vấn đáp lí thuyết chủ đề "${p.topic}". Lịch sử:\n${history(p.history)}\n
Tổng kết phiên. Trả JSON: {"score": <0-10>, "summary": "...", "gaps": ["lỗ hổng kiến thức"], "mistakes": [${MISTAKE}], "advice": ["..."]}`,
  }) : ({
    text: `Phiên vấn đáp lí thuyết chủ đề "${p.topic}" theo tiến trình Trải nghiệm → Hình thành → Củng cố → Vận dụng. Lịch sử:\n${history(p.history) || '(chưa có)'}\n
${p.history?.length ? 'Đánh giá câu trả lời gần nhất của sinh viên (chấm 0-10, chỉ ra sai lầm), rồi hỏi câu tiếp theo sâu hơn.' : 'Mở đầu bằng một tình huống trải nghiệm ngắn và câu hỏi đầu tiên.'}
Mỗi lần chỉ hỏi MỘT câu, không tự trả lời hộ.
Trả JSON: {"stage": "Trải nghiệm|Hình thành|Củng cố|Vận dụng", "feedback": "<nhận xét câu trả lời trước hoặc rỗng>", "score": <0-10 hoặc null>, "mistakes": [${MISTAKE}], "question": "...", "viz": <viz hoặc null>}`,
  }),
  lesson: (p) => {
    const theorem = p.kind === 'theorem';
    const formation = theorem
      ? `"formation": {"prediction": "<câu hỏi gợi ý sinh viên tự dự đoán định lí>", "statement": "<phát biểu định lí, LaTeX>", "hypothesis": ["giả thiết"], "conclusion": ["kết luận"], "grounds": ["luận cứ: định nghĩa/tiên đề/định lí đã biết làm cơ sở chứng minh"], "proof": "<cách chứng minh, từng bước, markdown>", "logic": "<cấu trúc logic: dạng 'nếu… thì…', mệnh đề đảo có đúng không, điều kiện cần/đủ>"}`
      : `"formation": {"signs": ["dấu hiệu bản chất rút ra nhờ phân tích, so sánh, trừu tượng hoá, khái quát hoá"], "terms": [{"term": "thuật ngữ", "symbol": "<kí hiệu LaTeX>"}], "definition": "<phát biểu định nghĩa chính xác, LaTeX>", "related": ["liên hệ logic với khái niệm khác"]}`;
    return {
      text: `Soạn bài học ${theorem ? 'ĐỊNH LÍ' : 'KHÁI NIỆM'} "${p.name}" (chủ đề "${p.topic}") theo đúng 4 bước: Trải nghiệm → ${theorem ? 'Hình thành định lí' : 'Hình thành định nghĩa khái niệm'} → Củng cố → Vận dụng.
- Trải nghiệm: tình huống thực tiễn hoặc nội bộ môn toán gần gũi với sinh viên Việt Nam, ${theorem ? 'cho sinh viên tiếp cận giả thiết và kết luận, khơi gợi nhu cầu chứng minh/kiểm chứng' : 'giúp cảm nhận dấu hiệu bản chất của khái niệm'}; kết thúc bằng một câu hỏi để sinh viên suy nghĩ.
- Củng cố: 3 câu trắc nghiệm nhận diện/vận dụng trực tiếp trong trường hợp đơn giản, đặc trưng${theorem ? '' : ', và thể hiện khái niệm trong ngữ cảnh khác'}.
- Vận dụng: 1 bài toán thực tiễn/phức hợp hơn, có chiến lược (không lộ đáp án) và lời giải 4 bước Polya.
Trả JSON: {"name": "...", "topic": "<chủ đề>",
"experience": {"situation": "<tình huống, markdown>", "question": "<câu hỏi cho sinh viên>", "insight": "<điều rút ra sau trải nghiệm>", "viz": <viz hoặc null>},
${formation},
"consolidate": [{"prompt": "...", "options": ["A","B","C","D"], "answer": <0-3>, "topic": "<chủ đề>", "strategy": ["gợi ý"], "solution": "<giải thích>", "viz": null}],
"apply": {"prompt": "...", "topic": "<chủ đề>", "strategy": ["gợi ý, KHÔNG lộ đáp án"], "solution": "<lời giải 4 bước Polya>", ${CASIO}, "viz": <viz hoặc null>}}`,
    };
  },
  mindmap: (p) => ({
    text: `Lập bản đồ tư duy cho chủ đề "${p.topic}" trong môn XSTK. Dạng markdown: một dòng "# tiêu đề", các nhánh "## ...", "### ...", lá là "- ...". 3-4 tầng, 5-7 nhánh chính, mỗi nút ngắn gọn, có công thức LaTeX khi cần.
Trả JSON: {"markdown": "..."}`,
  }),
  profile: (p) => ({
    text: `Dữ liệu hồ sơ học tập của sinh viên (JSON):\n${p.stats}\n
Phân tích các lỗi sai lặp lại xuyên suốt quá trình học, nhận định nguyên nhân, đề xuất kế hoạch cải thiện cụ thể trong 2 tuần.
Trả JSON: {"assessment": "...", "patterns": [{"title": "...", "detail": "..."}], "priorities": ["chủ đề cần ưu tiên"], "plan": [{"when": "Ngày 1-2", "task": "..."}]}`,
  }),
};

function history(h = []) {
  return h.slice(-LIMITS.history).map((m) => `${m.role === 'user' ? 'Sinh viên' : 'Gia sư'}: ${clip(m.text)}`).join('\n');
}
const clip = (s) => String(s ?? '').slice(0, LIMITS.text);

/** Validate the browser payload and build a Gemini request body. Throws Error with a Vietnamese message. */
export function buildRequest(task, payload = {}) {
  if (!Object.hasOwn(TASKS, task)) throw new Error('Tác vụ không hợp lệ.');
  const p = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, typeof v === 'string' ? clip(v) : v]));
  const files = Array.isArray(p.files) ? p.files : [];
  if (files.length > LIMITS.files) throw new Error(`Tối đa ${LIMITS.files} tệp.`);
  let bytes = 0;
  for (const f of files) {
    if (!MIMES.includes(f?.mimeType) || typeof f.data !== 'string') throw new Error('Chỉ nhận ảnh (PNG, JPG, WEBP, HEIC) hoặc PDF.');
    bytes += f.data.length;
  }
  if (bytes > LIMITS.fileBytes) throw new Error('Tệp quá lớn (tối đa khoảng 10 MB).');

  // Word files arrive as text (read in the browser); they count toward the same 3-file limit.
  const docs = Array.isArray(p.docs) ? p.docs : [];
  if (files.length + docs.length > LIMITS.files) throw new Error(`Tối đa ${LIMITS.files} tệp.`);
  if (docs.some((d) => typeof d?.text !== 'string' || typeof (d.name ?? '') !== 'string')) throw new Error('Tệp Word không hợp lệ.');

  let { text } = TASKS[task](p);
  if (docs.length) {
    const what = { grade: 'Đề bài và BÀI LÀM của sinh viên (xem nhãn ở tên tệp)', practiceGrade: 'BÀI LÀM của sinh viên', practice: 'BÀI MẪU' }[task] || 'Đề bài hoặc bài làm';
    text += `\n\n${what} trong tệp Word (đã chuyển thành văn bản, công thức đặt trong $...$):\n`
      + docs.map((d) => `--- ${String(d.name || 'tệp').slice(0, 120)} ---\n${clip(d.text)}`).join('\n');
  }
  // The task wording and the student's input are often Vietnamese, which pulls the model back to Vietnamese;
  // repeat the language rule last, in the user turn, where it wins.
  // The opposite rule matters too: after an English conversation the history pulls replies to English.
  // OCR copies the file as written: no language rule, or English mode would translate the document.
  const verbatim = task === 'ocr';
  if (verbatim) { /* keep the file's own language */ } else if (p.lang === 'en') {
    text += '\n\nLANGUAGE: Answer ONLY in English (every text value of the JSON), even if the student or the history uses Vietnamese.'
      + ' No Vietnamese words at all: no greetings like "Chào", no pronouns like "em", "cô", "thầy", no Vietnamese step names.'
      + ' Call Polya\'s steps: Understand the problem, Devise a plan, Carry out the plan, Look back.'
      + ' Only the "topic" and error "type" values stay exactly as listed in Vietnamese.';
  } else if (task !== 'translate') {
    text += '\n\nNGÔN NGỮ: Trả lời HOÀN TOÀN bằng tiếng Việt (mọi chuỗi trong JSON), kể cả khi câu hỏi hoặc lịch sử hội thoại bằng tiếng Anh. Không chèn tiếng Anh, trừ thuật ngữ thật cần thiết đặt trong ngoặc.';
  }
  return {
    body: {
      // English UI: same pedagogy and JSON keys, but every text value in English.
      systemInstruction: { parts: [{ text: p.lang === 'en' && !verbatim ? `${SYSTEM}
LANGUAGE OVERRIDE: write every text value of the JSON in English (keep JSON keys as specified; use dot decimals; keep the topic and error-type values exactly as listed in Vietnamese).` : SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text }, ...files.map((f) => ({ inlineData: { mimeType: f.mimeType, data: f.data } }))] }],
      generationConfig: { responseMimeType: 'application/json', temperature: task === 'practice' ? 0.9 : verbatim ? 0 : 0.4, maxOutputTokens: 16384 },
    },
    promptChars: SYSTEM.length + text.length,
    fileCount: files.length,
  };
}

/** Parse model JSON, tolerating ``` fences or leading prose. */
// LaTeX commands that start with a letter JSON also uses as an escape (\b \f \n \r \t \u). A model that writes
// "\frac" with one backslash would otherwise get a form-feed + "rac"; these are always meant as LaTeX.
const LATEX_LIKE = new RegExp(String.raw`(?<!\\)((?:\\\\)*)\\(?=(?:${[
  'beta', 'bar', 'binom', 'begin', 'bigg', 'big', 'boldsymbol', 'bullet', 'bot', 'boxed', 'bmod', 'backslash',
  'frac', 'forall', 'nu', 'neq', 'ne', 'notin', 'not', 'nabla', 'ni', 'neg', 'nmid', 'newline',
  'rightarrow', 'right', 'rho', 'rangle', 'rceil', 'rfloor', 'rm',
  'textbf', 'textit', 'text', 'times', 'theta', 'tau', 'tilde', 'tfrac', 'therefore', 'triangle', 'top', 'to',
  'underline', 'underbrace', 'uparrow', 'upsilon',
].join('|')})(?![a-zA-Z]))`, 'g');
// Any other backslash not starting a valid JSON escape (\s, \o, \c, \l, \m, \u without 4 hex digits…).
const INVALID_ESCAPE = /(?<!\\)((?:\\\\)*)\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g;

/** Close a reply cut off at the token limit: drop the unfinished trailing item, then close open brackets. */
function closeTruncated(s) {
  const stack = []; let inStr = false, esc = false, cut = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{' || c === '[') stack.push(c === '{' ? '}' : ']');
    else if (c === '}' || c === ']') stack.pop();
    else if (c === ',') cut = { at: i, closers: [...stack].reverse().join('') };
  }
  return cut ? s.slice(0, cut.at) + cut.closers : s;
}

/**
 * Fix string contents the model left invalid: raw newlines/tabs become escapes, and a quote that does not
 * end the string (the next non-space char is not , } ] :) is an inner quote, e.g. loại "giỏi", so escape it.
 */
function sanitizeStrings(s) {
  let out = '', inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (!inStr) {
      if (c === '"') inStr = true;
      // "pA": 0,5,  → 0.5 : a decimal comma in a number that is a property value (never inside arrays,
      // where [1,2] is a real list).
      else if (c === ',' && /:\s*-?\d+$/.test(out) && /^\d+\s*[,}\]]/.test(s.slice(i + 1, i + 30))) { out += '.'; continue; }
      out += c; continue;
    }
    if (c === '\\') { out += c + (s[i + 1] ?? ''); i++; continue; }
    if (c === '"') {
      const next = /^\s*(\S)/.exec(s.slice(i + 1, i + 40))?.[1];
      if (next === undefined || ',}]:'.includes(next)) { inStr = false; out += c; } else out += '\\"';
      continue;
    }
    out += c === '\n' ? '\\n' : c === '\r' ? '\\r' : c === '\t' ? '\\t' : c;
  }
  return out;
}

/** Parse model JSON, tolerating ``` fences, leading prose, single-backslash LaTeX, stray quotes/newlines and truncation. */
export function extractJson(raw) {
  let s = String(raw).trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  const start = s.search(/[{[]/);
  if (start > 0) s = s.slice(start);
  s = s.replace(LATEX_LIKE, '$1\\\\');
  const escaped = s.replace(INVALID_ESCAPE, '$1\\\\');
  const fixed = sanitizeStrings(escaped), end = Math.max(fixed.lastIndexOf('}'), fixed.lastIndexOf(']'));
  const attempts = [s, escaped, fixed];
  if (end > 0) attempts.push(fixed.slice(0, end + 1)); // trailing prose after the JSON
  attempts.push(closeTruncated(fixed));
  let last;
  for (const a of attempts) { try { return JSON.parse(a); } catch (e) { last = e; } }
  // detail + text let the Worker log exactly where the reply broke.
  throw Object.assign(new Error('Phản hồi AI không đúng định dạng.'), { detail: last?.message, text: fixed });
}

// ---- Language guard: a reply in the wrong language gets one retry (see index.js).
const VI_MARKS = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/giu;
function texts(v, key, out) {
  if (typeof v === 'string') { if (key !== 'topic' && key !== 'type') out.push(v); }
  else if (Array.isArray(v)) v.forEach((x) => texts(x, key, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) texts(x, k, out);
  return out;
}
/** True when the reply's prose is clearly not in `lang` (Vietnamese diacritics share of all letters). */
export function wrongLanguage(data, lang) {
  const s = texts(data, '', []).join(' ').replace(/\$[^$]*\$/g, ' ');
  const letters = (s.match(/\p{L}/gu) || []).length, marks = (s.match(VI_MARKS) || []).length;
  if (lang === 'en') return letters > 40 && marks / letters > 0.03;
  return letters > 120 && marks / letters < 0.01;
}
export const LANGUAGE_RETRY = {
  en: '\n\nYOUR PREVIOUS ANSWER WAS NOT IN ENGLISH. Rewrite everything in English only.',
  vi: '\n\nCÂU TRẢ LỜI TRƯỚC KHÔNG PHẢI TIẾNG VIỆT. Viết lại toàn bộ bằng tiếng Việt.',
};
