// Task-based prompts: the browser never sends a raw prompt, so the key can't be used as a general chatbot.

import { TOPICS, ERROR_TYPES } from '../public/js/topics.js';

export { TOPICS, ERROR_TYPES };
const LIMITS = { text: 8000, files: 3, fileBytes: 14_000_000, history: 24 };
const MIMES = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];

const SYSTEM = `Bạn là gia sư môn Xác suất Thống kê (XSTK) cho sinh viên đại học Việt Nam. Luôn trả lời bằng tiếng Việt có dấu.
Viết công thức bằng LaTeX: $...$ trong dòng, $$...$$ riêng dòng. Dùng dấu phẩy thập phân kiểu Việt Nam (0,25).
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
Mỗi phần tử "keys" là tên phím in trên máy (MENU, SHIFT, ALPHA, OPTN, CALC, SOLVE, =, AC, DEL, ▲, ▼, ◀, ▶, x², √, ÷, ×, +, −, (, ), x10ˣ, Ans, chữ số…) hoặc ô nhập giá trị. Dùng đúng chế độ của fx-580VN X (Tính toán, Thống kê, Phân phối, Bảng, Phương trình…), ghi kết quả máy hiện ở "note" của bước cuối. Không dùng máy tính thì "casio": [].
Chỉ trả về JSON hợp lệ đúng cấu trúc được yêu cầu.`;

const CASIO = '"casio": [{"keys": ["..."], "note": "..."}]';
const POLYA_Q = '"polya": {"understand": ["câu hỏi dẫn dắt bước 1: cái đã cho, cái phải tìm, điều kiện, kí hiệu"], "given": ["cái đã cho"], "find": ["cái phải tìm"], "plan": ["câu hỏi dẫn dắt bước 2: đưa về bài toán quen thuộc, chọn công thức"], "present": "<gợi ý cách trình bày bước 3, không có đáp số>", "check": ["câu hỏi tự kiểm tra bước 4"], "extend": "<bài tương tự hoặc khái quát hoá>"}';

const MISTAKE = `{"topic": "<chủ đề hợp lệ>", "type": "<loại lỗi hợp lệ>", "detail": "<mô tả ngắn>"}`;

const TASKS = {
  strategy: (p) => ({
    text: `Đề bài (có thể kèm ảnh/PDF):\n${p.problem || '(xem tệp đính kèm)'}\n
Nhiệm vụ: CHỈ đưa ra chiến lược giải (bước 1 và 2 Polya). TUYỆT ĐỐI KHÔNG đưa đáp số, KHÔNG thay số tính ra kết quả cuối, KHÔNG viết lời giải hoàn chỉnh.
Trả JSON: {"topic": "<chủ đề>", "given": ["..."], "find": ["..."], "conditions": ["..."], "plan": ["bước gợi ý dạng câu hỏi dẫn dắt..."], "knowledge": ["công thức/định lí cần dùng"], "pitfalls": ["sai lầm hay gặp"], "viz": null}`,
  }),
  grade: (p) => ({
    text: `Đề bài: ${p.problem || '(nếu đề nằm trong tệp, hãy tự nhận dạng)'}\n
Tệp đính kèm là BÀI LÀM của sinh viên (ảnh hoặc PDF). Hãy nhận dạng chữ (OCR) bài làm rồi CHẤM ĐIỂM thang 10 theo từng bước.
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
Các bài phải TƯƠNG TỰ bài mẫu sau (cùng dạng, đổi số liệu và bối cảnh): ${p.sample}` : ''}
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
    text: `Hội thoại bằng GIỌNG NÓI với sinh viên về môn XSTK. Câu nói của sinh viên được nhận dạng tự động nên có thể sai chính tả hoặc thiếu ý. Lịch sử:\n${history(p.history) || '(chưa có)'}\n
Sinh viên vừa nói: "${p.text || ''}"${p.typed ? ' (gõ bằng bàn phím)' : ''}. ${p.files?.length ? 'Kèm ảnh bài viết trên bảng (iPad).' : ''}
- Nếu câu nói rỗng, vô nghĩa, không liên quan XSTK hoặc bạn KHÔNG chắc đã hiểu đúng ý, đặt "understood": false.
- Nếu là bài toán có nhiều công thức, khó trình bày bằng lời, đặt "board": true để mời sinh viên viết đề/lời giải lên bảng.
- Bài toán: dẫn dắt theo 4 bước Polya, không đưa ngay đáp số trừ khi sinh viên đã tự làm.
Trả JSON: {"understood": true|false, "reply": "<câu trả lời hiển thị, markdown + LaTeX>", "speech": "<bản để đọc thành tiếng: tiếng Việt thuần, KHÔNG LaTeX, đọc công thức bằng lời, tối đa 4 câu>", "board": true|false, ${CASIO}, "viz": <viz hoặc null>}`,
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

  const { text } = TASKS[task](p);
  return {
    body: {
      // English UI: same pedagogy and JSON keys, but every text value in English.
      systemInstruction: { parts: [{ text: p.lang === 'en' ? `${SYSTEM}
LANGUAGE OVERRIDE: write every text value of the JSON in English (keep JSON keys as specified; use dot decimals; keep the topic and error-type values exactly as listed in Vietnamese).` : SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text }, ...files.map((f) => ({ inlineData: { mimeType: f.mimeType, data: f.data } }))] }],
      generationConfig: { responseMimeType: 'application/json', temperature: task === 'practice' ? 0.9 : 0.4, maxOutputTokens: 8192 },
    },
    promptChars: SYSTEM.length + text.length,
    fileCount: files.length,
  };
}

/** Parse model JSON, tolerating ``` fences or leading prose. */
export function extractJson(raw) {
  const s = String(raw).trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(s); } catch { /* fall through */ }
  const start = s.search(/[{[]/), end = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
  if (start >= 0 && end > start) return JSON.parse(s.slice(start, end + 1));
  throw new Error('Phản hồi AI không đúng định dạng.');
}
