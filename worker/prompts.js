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
Nếu không phù hợp thì đặt "viz": null. Chỉ trả về JSON hợp lệ đúng cấu trúc được yêu cầu.`;

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
Chỉ chấm và nhận xét bài làm; KHÔNG viết lời giải đúng hoàn chỉnh, KHÔNG nêu đáp số đúng.
Trả JSON: {"transcript": "<bài làm đã nhận dạng, dùng LaTeX>", "score": <0-10>, "summary": "...", "rubric": [{"step": "...", "points": <số>, "max": <số>, "comment": "..."}], "strengths": ["..."], "mistakes": [${MISTAKE}], "advice": ["..."]}`,
  }),
  solve: (p) => ({
    text: `Đề bài (có thể kèm ảnh/PDF):\n${p.problem || '(xem tệp đính kèm)'}\n
Viết lời giải chi tiết đủ 4 bước Polya.
Trả JSON: {"topic": "<chủ đề>", "understand": "<bước 1, markdown>", "plan": "<bước 2>", "solution": "<bước 3, lời giải chi tiết từng dòng>", "check": "<bước 4: kiểm tra, phương pháp rút ra, cách khác>", "similar": ["2 bài tương tự/khái quát hoá"], "viz": <viz hoặc null>}`,
  }),
  practice: (p) => ({
    text: `Tạo đúng 5 bài ${p.kind === 'mcq' ? 'TRẮC NGHIỆM 4 phương án (chỉ 1 đúng)' : 'TỰ LUẬN'} mới, khác nhau, về chủ đề "${p.topic}", mức độ ${p.level || 'trung bình'}, gắn với tình huống thực tế Việt Nam khi có thể.
Trả JSON: {"questions": [{"prompt": "...", ${p.kind === 'mcq' ? '"options": ["A","B","C","D"], "answer": <chỉ số 0-3>, ' : ''}"topic": "<chủ đề>", "strategy": ["gợi ý dẫn dắt, KHÔNG lộ đáp án"], "solution": "<lời giải chi tiết 4 bước Polya, markdown>", "viz": <viz hoặc null>}]}`,
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
      systemInstruction: { parts: [{ text: SYSTEM }] },
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
