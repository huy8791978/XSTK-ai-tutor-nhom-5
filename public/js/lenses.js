// Gardner's multiple intelligences as nine ways into the same lesson. Shared by the browser and the Worker
// (worker/prompts.js imports this file), so the button list and the AI instructions never drift apart.
// These are preferences to try, never labels: research does not show that matching teaching to a "type" helps.

export const LENSES = [
  { id: 'logic', icon: '🧩', name: 'Phản ví dụ', mi: 'Logic – toán',
    ask: 'Viết MỘT lập luận nghe rất hợp lí về nội dung này nhưng có đúng một chỗ sai tinh vi (sai lầm sinh viên hay mắc). "body": lập luận đó, đánh số từng dòng. "ask": yêu cầu sinh viên tìm dòng sai và giải thích. "reveal": dòng sai, vì sao sai, cách sửa đúng.' },
  { id: 'linguistic', icon: '📖', name: 'Kể chuyện', mi: 'Ngôn ngữ',
    ask: 'Giải thích bằng một câu chuyện ngắn có nhân vật, bối cảnh Việt Nam, và một phép so sánh/ẩn dụ đời thường dễ nhớ. Cuối chuyện chốt lại ý chính bằng một câu. "ask": mời sinh viên tự kể lại bằng lời của mình trong 2–3 câu. "reveal": một bản kể lại mẫu.' },
  { id: 'spatial', icon: '👁', name: 'Hình ảnh', mi: 'Không gian – thị giác',
    ask: 'Giải thích bằng hình ảnh: mô tả một hình vẽ/sơ đồ sinh viên có thể tự vẽ ra giấy (vẽ gì, ở đâu, tô màu gì), và BẮT BUỘC kèm "viz" phù hợp nếu có thể. "ask": yêu cầu sinh viên vẽ lại và đánh dấu một chi tiết. "reveal": hình vẽ đúng trông thế nào.' },
  { id: 'musical', icon: '🎵', name: 'Vè công thức', mi: 'Âm nhạc',
    ask: 'Viết một bài vè hoặc thơ lục bát 4–8 câu có vần, nhịp đều, giúp nhớ công thức/ý chính; ngay sau bài vè, ghi các công thức được nhắc ở dạng LaTeX. "ask": mời sinh viên đọc to theo nhịp và tự viết thêm 2 câu. "reveal": 2 câu viết thêm mẫu. Trong "body", MỖI câu thơ một dòng riêng, không đánh số.' },
  { id: 'bodily', icon: '🤸', name: 'Thử tay', mi: 'Vận động',
    ask: 'Thiết kế MỘT hoạt động tự tay làm ngay trong 5 phút với đồ vật có sẵn (đồng xu, xúc xắc, bộ bài, hạt đậu, giấy): các bước làm, ghi kết quả vào bảng nào, rồi so sánh với lí thuyết. "ask": câu hỏi sau khi làm xong. "reveal": kết quả lí thuyết mong đợi và vì sao số thực nghiệm lệch một chút.' },
  { id: 'interpersonal', icon: '👥', name: 'Học nhóm', mi: 'Giao tiếp',
    ask: 'Viết một đoạn hội thoại ngắn (6–10 lượt) giữa hai sinh viên An và Bình đang tranh luận về nội dung này, một người hiểu sai rồi được bạn giúp sửa. Sau đó nêu 3 câu hỏi thảo luận cho nhóm 3–4 người. "ask": câu hỏi thảo luận khó nhất. "reveal": gợi ý trả lời.' },
  { id: 'intrapersonal', icon: '🪞', name: 'Tự soi', mi: 'Nội tâm',
    ask: 'Giúp sinh viên tự soi mức hiểu của mình: một danh sách 5 câu «Em có làm được… không?» từ dễ đến khó, và 3 hiểu lầm hay gặp kèm dấu hiệu nhận ra mình đang mắc. "ask": hỏi sinh viên câu nào trong danh sách mình chưa chắc nhất và vì sao. "reveal": cách tự luyện cho câu khó nhất.' },
  { id: 'naturalist', icon: '🌿', name: 'Thiên nhiên', mi: 'Thiên nhiên',
    ask: 'Giải thích qua ví dụ trong tự nhiên và đời sống quan sát được (cây cối, thời tiết, động vật, sông nước, nông nghiệp): chỉ ra đâu là biến ngẫu nhiên, nó là loại biến gì, phân phối nào phù hợp. Nêu một việc quan sát/đo đạc sinh viên tự làm được. "ask": yêu cầu phân loại một ví dụ tự nhiên khác. "reveal": đáp án phân loại và lí do.' },
  { id: 'existential', icon: '🌌', name: 'Ý nghĩa', mi: 'Hiện sinh',
    ask: 'Nêu vì sao nội dung này quan trọng với những quyết định lớn trong đời (sức khoẻ, tiền bạc, công bằng, rủi ro, niềm tin vào bằng chứng), kèm một nghịch lí hoặc câu hỏi triết lí liên quan. Không sa đà, vẫn bám kiến thức môn học. "ask": một câu hỏi để sinh viên tự suy ngẫm. "reveal": vài hướng suy nghĩ, không có đáp án duy nhất.' },
];
export const LENS_IDS = LENSES.map((l) => l.id);
export const lensById = (id) => LENSES.find((l) => l.id === id);

// «Khám phá cách học của em»: two statements per intelligence, answered 0–3 (không đúng … rất đúng).
export const DISCOVER = [
  ['logic', 'Em thích tìm ra quy luật, hỏi «vì sao» và tự kiểm tra từng bước lập luận.'],
  ['logic', 'Gặp một con số lạ, em muốn tính lại cho chắc.'],
  ['linguistic', 'Em nhớ bài tốt hơn khi được đọc, viết lại hoặc giảng lại cho người khác.'],
  ['linguistic', 'Em thích chơi chữ, đọc truyện và kể chuyện.'],
  ['spatial', 'Em hiểu nhanh hơn khi nhìn hình vẽ, sơ đồ hay biểu đồ.'],
  ['spatial', 'Em hay vẽ nguệch ngoạc hoặc tô màu khi ghi chép.'],
  ['musical', 'Em dễ thuộc lời bài hát và nhận ra nhịp điệu.'],
  ['musical', 'Có nhạc hoặc vần điệu thì em nhớ công thức lâu hơn.'],
  ['bodily', 'Em học tốt khi được tự tay làm, cầm nắm, thử nghiệm.'],
  ['bodily', 'Ngồi yên lâu là em khó tập trung, em thích vừa học vừa vận động.'],
  ['interpersonal', 'Em thích học nhóm, thảo luận và tranh luận với bạn.'],
  ['interpersonal', 'Bạn bè hay nhờ em giải thích hoặc hoà giải.'],
  ['intrapersonal', 'Em thích tự đặt mục tiêu và tự đánh giá mình tiến bộ đến đâu.'],
  ['intrapersonal', 'Em hay suy ngẫm về cảm xúc và cách học của bản thân.'],
  ['naturalist', 'Em thích quan sát thiên nhiên, cây cối, con vật, thời tiết.'],
  ['naturalist', 'Em giỏi phân loại, sắp xếp đồ vật thành từng nhóm.'],
  ['existential', 'Em hay tự hỏi những câu lớn: vì sao mọi thứ như vậy, ý nghĩa của nó là gì.'],
  ['existential', 'Em muốn biết kiến thức mình học giúp gì cho những quyết định trong đời.'],
];
export const DISCOVER_SCALE = ['Không đúng', 'Hơi đúng', 'Khá đúng', 'Rất đúng'];

/** answers[i] ∈ 0..3 (or null) per DISCOVER statement → { lensId: 0..100 }; unanswered statements count as 0. */
export function miScores(answers = []) {
  const sum = {}, max = {};
  DISCOVER.forEach(([id], i) => {
    const a = Number(answers[i]);
    sum[id] = (sum[id] || 0) + (Number.isInteger(a) && a >= 0 && a <= 3 ? a : 0);
    max[id] = (max[id] || 0) + 3;
  });
  return Object.fromEntries(LENS_IDS.map((id) => [id, Math.round((100 * sum[id]) / max[id])]));
}

/** The three highest lenses (ties keep the LENSES order). */
export const topLenses = (scores, k = 3) => [...LENS_IDS].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0)).slice(0, k);
