// Vietnamese ⇄ English. Views are written in Vietnamese; in English mode a MutationObserver swaps every
// known UI string (text, placeholder, title, aria-label) via DICT, and the AI is asked to answer in English.
// AI-written content (.rich), formulas and the formula editor are never touched.
const KEY = 'xstk.lang';
let lang = (() => { try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'vi'; } catch { return 'vi'; } })();
export const getLang = () => lang;

const DICT = {
  // shell & nav
  'Gia sư Xác suất Thống kê': 'Probability & Statistics Tutor', 'Bỏ qua tới nội dung': 'Skip to content',
  'Gia sư chấm bài': 'AI Tutor & grading', 'Chấm bài': 'Grade', 'Học lí thuyết': 'Learn concepts', 'Lí thuyết': 'Concepts',
  'Học định lí': 'Learn theorems', 'Định lí': 'Theorem', 'Bài tập tự luận': 'Essay problems', 'Tự luận': 'Essay',
  'Bài tập trắc nghiệm': 'Multiple choice', 'Trắc nghiệm': 'Quiz', 'Vấn đáp': 'Oral exam', 'Vấn đáp lí thuyết': 'Oral exam on theory',
  'Hỏi đáp giọng nói': 'Voice Q&A', 'Giọng nói': 'Voice', 'Thống kê lỗi sai': 'Mistake statistics', 'Lỗi sai': 'Mistakes',
  'Bản đồ tư duy': 'Mind map', 'Tư duy': 'Mind map', 'Diễn đàn XSTK': 'P&S forum', 'Diễn đàn': 'Forum',
  'Hồ sơ học tập': 'Learning profile', 'Hồ sơ': 'Profile', 'Hồ sơ của tôi': 'My profile', 'Lưu ý:': 'Note:',
  'Nội dung do AI tạo ra và có thể sai sót. Vui lòng đối chiếu với đề cương môn học hoặc hỏi giáo viên.': 'Content is AI-generated and may contain errors. Please check it against your course syllabus or ask your teacher.',
  'Trang cần bật JavaScript để hoạt động.': 'This site needs JavaScript.', 'Tiến trình': 'Progress',
  // page ledes
  'Tải ảnh hoặc PDF bài làm. AI gợi ý chiến lược (không lộ đáp án), chấm điểm từng bước và chỉ hiện lời giải khi bạn yêu cầu.': 'Upload a photo or PDF of your work, or write on the board. The AI suggests a strategy (never the answer), grades each step, and shows the solution only when you ask.',
  'Học một khái niệm qua 4 bước: trải nghiệm tình huống, tự rút ra dấu hiệu bản chất và định nghĩa, củng cố bằng câu hỏi nhận diện, rồi vận dụng vào bài toán thực tế.': 'Learn a concept in 4 steps: experience a situation, derive its essential features and definition, consolidate with recognition questions, then apply it to a real problem.',
  'Học một định lí qua 4 bước: trải nghiệm để dự đoán, tách giả thiết – kết luận, nắm luận cứ và cách chứng minh, củng cố rồi vận dụng.': 'Learn a theorem in 4 steps: experience and conjecture, separate hypothesis and conclusion, understand the grounds and proof, consolidate, then apply.',
  'AI tạo ngẫu nhiên 5 bài tự luận tương tự để bạn tự luyện. Mỗi bài đi qua đủ 4 bước giải toán, có chiến lược (không lộ đáp án), chấm bài và lời giải.': 'The AI generates 5 similar essay problems for self-practice. Each one goes through the 4 problem-solving steps, with a strategy (no answer), grading and a solution.',
  'AI tạo 5 câu trắc nghiệm, chấm ngay khi bạn chọn. Mỗi câu đi qua 4 bước giải toán; bấm "Hỏi AI: vì sao?" để hỏi lại đáp án.': 'The AI creates 5 multiple-choice questions, graded instantly. Each goes through the 4 problem-solving steps; press "Ask AI: why?" to question the answer.',
  'AI hỏi từng câu như thầy cô vấn đáp, chấm từng câu trả lời, rồi tổng kết lỗ hổng kiến thức và sai lầm của bạn.': 'The AI asks one question at a time like an oral examiner, grades each answer, then sums up your knowledge gaps and mistakes.',
  'Bấm micro và hỏi bằng giọng nói về Xác suất Thống kê. Bài toán nhiều công thức thì viết lên bảng (iPad). AI trả lời bằng chữ và đọc thành tiếng.': 'Press the microphone and ask about Probability & Statistics by voice. Write formula-heavy problems on the board (iPad). The AI answers on screen and out loud.',
  'Thống kê các câu sai trong vấn đáp, trắc nghiệm, tự luận và chấm bài. AI đưa ra nhận định chung về lỗi sai và hướng khắc phục.': 'Statistics of wrong answers in oral exams, quizzes, essays and grading. The AI gives an overall diagnosis and how to fix it.',
  'Bấm vào một nút để thu gọn hoặc mở rộng, kéo để di chuyển, cuộn hoặc chụm hai ngón để phóng to. AI có thể vẽ bản đồ cho bất kì chủ đề nào.': 'Click a node to fold or unfold, drag to pan, scroll or pinch to zoom. The AI can draw a map for any topic.',
  'Nơi người học trao đổi về Xác suất Thống kê: đặt câu hỏi, chia sẻ cách giải, thảo luận đề thi. Hãy lịch sự và không đăng thông tin cá nhân.': 'Where learners discuss Probability & Statistics: ask questions, share solutions, discuss exams. Be polite and do not post personal information.',
  'Mọi bài chấm, bộ luyện tập và buổi vấn đáp đều được ghi lại trên trình duyệt này. AI đọc hồ sơ để tìm lỗi lặp lại và đề xuất lộ trình.': 'Every grading, practice set and oral exam is recorded in this browser. The AI reads your profile to find recurring mistakes and propose a study plan.',
  // topics & error types
  'Biến cố & xác suất cơ bản': 'Events & basic probability', 'Xác suất có điều kiện & Bayes': 'Conditional probability & Bayes',
  'Biến ngẫu nhiên rời rạc': 'Discrete random variables', 'Biến ngẫu nhiên liên tục': 'Continuous random variables',
  'Phân phối thông dụng': 'Common distributions', 'Véc-tơ ngẫu nhiên': 'Random vectors', 'Luật số lớn & định lí giới hạn': 'Law of large numbers & limit theorems',
  'Mẫu & thống kê mô tả': 'Samples & descriptive statistics', 'Ước lượng tham số': 'Parameter estimation', 'Kiểm định giả thuyết': 'Hypothesis testing',
  'Tương quan & hồi quy': 'Correlation & regression', 'Hỏi đáp chung': 'General Q&A',
  'Hiểu sai khái niệm': 'Misunderstood concept', 'Chọn sai công thức/mô hình': 'Wrong formula/model', 'Sai tính toán': 'Calculation error',
  'Thiếu điều kiện/giả thiết': 'Missing condition/assumption', 'Đọc sai đề': 'Misread the problem', 'Lập luận/trình bày thiếu chặt chẽ': 'Loose reasoning/presentation',
  'Chọn sai đáp án trắc nghiệm': 'Wrong multiple-choice answer', 'Khác': 'Other', 'Lỗi': 'Error',
  // suggestions
  'Biến cố độc lập': 'Independent events', 'Xác suất có điều kiện': 'Conditional probability', 'Biến ngẫu nhiên': 'Random variable',
  'Kì vọng': 'Expectation', 'Phương sai': 'Variance', 'Hàm mật độ': 'Density function', 'Khoảng tin cậy': 'Confidence interval', 'Mức ý nghĩa': 'Significance level',
  'Công thức cộng xác suất': 'Addition rule', 'Công thức xác suất đầy đủ': 'Law of total probability', 'Công thức Bayes': "Bayes' theorem",
  'Công thức Bernoulli': 'Bernoulli formula', 'Bất đẳng thức Chebyshev': "Chebyshev's inequality", 'Luật số lớn': 'Law of large numbers',
  'Định lí giới hạn trung tâm': 'Central limit theorem', 'Định lí Moivre – Laplace': 'De Moivre–Laplace theorem',
  // Polya & stages
  'Tìm hiểu đề': 'Understand', 'Chương trình giải': 'Plan', 'Trình bày': 'Carry out', 'Kiểm tra': 'Look back',
  'Trải nghiệm': 'Experience', 'Hình thành': 'Formation', 'Hình thành định nghĩa': 'Form the definition', 'Hình thành định lí': 'Form the theorem',
  'Củng cố': 'Consolidate', 'Vận dụng': 'Apply', 'Bốn bước giải toán': 'Four problem-solving steps',
  // tutor
  'Đề bài': 'Problem', 'Gõ hoặc dán đề bài. Có thể bỏ trống nếu đề đã nằm trong ảnh/PDF.': 'Type or paste the problem. Leave empty if it is in the photo/PDF.',
  'Bài làm (ảnh / PDF / bảng iPad)': 'Your work (photo / PDF / iPad board)', 'Chọn ảnh hoặc PDF': 'Choose a photo or PDF', 'hoặc kéo thả vào đây': 'or drop it here',
  'Tối đa 3 tệp, mỗi tệp ≤ 10 MB. Chụp thẳng, đủ sáng để AI đọc chính xác.': 'Up to 3 files, 10 MB each. Shoot straight and well lit so the AI reads it correctly.',
  'Chọn ảnh hoặc PDF bài làm': 'Choose a photo or PDF of your work', 'Chiến lược giải': 'Solving strategy', 'Chấm điểm': 'Grade it', 'Lời giải chi tiết': 'Detailed solution',
  'Barem điểm (tuỳ chọn)': 'Marking scheme (optional)', 'Cập nhật barem điểm': 'Update marking scheme',
  'Ví dụ: Đặt biến cố 1đ; Công thức đầy đủ 2đ; Bayes 4đ; Kết luận 1đ…': 'e.g. Define events 1pt; Total probability 2pt; Bayes 4pt; Conclusion 1pt…',
  'Viết trên bảng (iPad)': 'Write on the board (iPad)', 'Trình bày trên bảng (iPad)': 'Show on the board (iPad)',
  'Mỗi viên bi rẽ trái hay phải với xác suất ½. Hàng nghìn lựa chọn ngẫu nhiên vẫn xếp thành hình chuông: đó là định lí giới hạn trung tâm. Kết quả chấm sẽ hiện ở đây.': 'Each ball goes left or right with probability ½. Thousands of random choices still stack into a bell: the central limit theorem. Your grade will appear here.',
  'Gợi ý hướng đi, không có đáp số. Tự làm rồi bấm "Chấm điểm".': 'Directions only, no answer. Solve it, then press "Grade it".',
  'Cái đã cho': 'Given', 'Cái phải tìm': 'To find', 'Điều kiện': 'Conditions', 'Kiến thức cần dùng': 'Knowledge needed', 'Sai lầm hay gặp': 'Common pitfalls',
  'Điểm': 'Score', 'Lỗi sai': 'Mistakes', 'Điểm tốt': 'Strengths', 'Lời khuyên': 'Advice', 'Bài làm AI đã đọc được (OCR)': 'Work as read by the AI (OCR)',
  'Đã lưu vào hồ sơ học tập.': 'Saved to your learning profile.', 'Trình bày lời giải': 'Write-up', 'Kiểm tra & mở rộng': 'Check & extend',
  'Bài tương tự để tự luyện': 'Similar problems to practise', 'Bấm máy CASIO fx-580VN X': 'CASIO fx-580VN X key steps', 'Lời giải': 'Solution',
  'Đang phân tích đề…': 'Analysing the problem…', 'Đang đọc bài làm và chấm điểm…': 'Reading and grading your work…', 'Đang viết lời giải…': 'Writing the solution…',
  'Hãy tải ảnh/PDF bài làm hoặc viết trên bảng để AI chấm.': 'Upload a photo/PDF or write on the board so the AI can grade it.', 'Hãy nhập đề bài hoặc tải tệp lên.': 'Enter the problem or upload a file.', 'Đã đủ 3 tệp.': '3 files is the maximum.',
  // board
  'Mực đen': 'Black ink', 'Mực xanh': 'Blue ink', 'Mực đỏ': 'Red ink', 'Tẩy': 'Eraser', 'Hoàn tác': 'Undo', 'Xoá bảng': 'Clear board', 'Bảng viết tay': 'Handwriting board', 'Công cụ bảng': 'Board tools',
  'Viết bằng bút Apple Pencil, ngón tay hoặc chuột. AI sẽ đọc chữ viết tay trên bảng.': 'Write with an Apple Pencil, finger or mouse. The AI reads the handwriting.',
  // math input & voice
  'Nhập công thức': 'Insert formula', 'Nói': 'Speak', 'Chèn vào bài': 'Insert', 'Đóng': 'Close', 'Công thức đang trống.': 'The formula is empty.', 'Ô soạn công thức': 'Formula editor',
  'Bấm một mẫu trên bàn phím (phân số, P(A|B), tổ hợp…) rồi điền giá trị vào các ô. Có thể gõ trực tiếp: 1/2 thành phân số, ^ là mũ, _ là chỉ số.': 'Press a template on the keyboard (fraction, P(A|B), combination…) then fill in the boxes. You can also type: 1/2 becomes a fraction, ^ for powers, _ for subscripts.',
  'Không tải được bộ soạn công thức. Kiểm tra mạng, hoặc gõ công thức giữa hai dấu $…$.': 'Could not load the formula editor. Check your connection, or type formulas between $…$.',
  'Kí hiệu Xác suất Thống kê': 'Probability & Statistics symbols', 'Bấm để nói': 'Press to speak', 'Đang nghe… bấm lần nữa để dừng': 'Listening… press again to stop',
  'Trình duyệt này không hỗ trợ nhận giọng nói': 'This browser does not support speech recognition', 'Hoặc nhập đề bài, đáp án hay câu trả lời của bạn': 'Or type your problem, answer or reply',
  'Gõ câu hỏi, đề bài hoặc câu trả lời…': 'Type a question, problem or answer…', 'Gửi': 'Send', 'Dừng đọc': 'Stop reading', 'Nhập bằng bàn phím': 'Type instead',
  'Gia sư đang nghĩ…': 'The tutor is thinking…', 'Hãy nhập nội dung hoặc viết trên bảng.': 'Type something or write on the board.',
  'Hãy viết đề bài hoặc lời giải lên bảng rồi bấm Gửi.': 'Write the problem or your solution on the board, then press Send.', '(bài viết trên bảng)': '(written on the board)',
  'Bấm nút Nói ở ô bên dưới và hỏi bằng giọng nói về Xác suất Thống kê. Bài toán nhiều công thức thì viết lên bảng (iPad). Gia sư trả lời bằng chữ và đọc thành tiếng.': 'Press Speak on the box below and ask about Probability & Statistics by voice. Write formula-heavy problems on the board (iPad). The tutor answers on screen and out loud.',
  'Bấm Nói ở ô bên dưới để hỏi bằng giọng nói': 'Press Speak in the box below to ask by voice', 'Trình duyệt này không nhận giọng nói. Hãy gõ câu hỏi ở ô bên dưới.': 'This browser cannot recognise speech. Type your question below.',
  'Đang dịch nội dung đã có sang tiếng Anh…': 'Translating the content on screen into English…',
  'Đang dịch nội dung đã có sang tiếng Việt…': 'Translating the content on screen into Vietnamese…',
  'Không dịch được nội dung cũ. Nội dung mới sẽ theo ngôn ngữ đã chọn.': 'Could not translate earlier content. New content will follow the chosen language.',
  'Giọng đọc': 'Voice', 'Giọng nam': 'Male voice', 'Giọng nữ': 'Female voice', 'Chọn giọng đọc': 'Choose a voice', 'Đang nghe bạn nói…': 'Listening…', 'Gia sư đang suy nghĩ…': 'The tutor is thinking…', 'Gia sư đang trả lời…': 'The tutor is answering…', 'Nghe lại': 'Play again',
  'Hỏi bằng giọng nói (nút Nói) hoặc nhập đề bài, đáp án, câu trả lời': 'Ask by voice (Speak button) or type your problem, answer or reply', 'Hỏi gia sư': 'Ask the tutor',
  // lessons
  'Khái niệm cần học': 'Concept to learn', 'Định lí / công thức cần học': 'Theorem / formula to learn', 'Ví dụ: Biến cố độc lập': 'e.g. Independent events', 'Ví dụ: Công thức Bayes': "e.g. Bayes' theorem",
  'Chủ đề': 'Topic', 'Bắt đầu học': 'Start learning', 'AI đang soạn bài học…': 'The AI is preparing the lesson…', 'Câu hỏi': 'Question', 'Xem điều rút ra': 'See the takeaway', 'Điều rút ra': 'Takeaway',
  'Suy nghĩ / dự đoán của bạn': 'Your thoughts / conjecture', 'Viết dự đoán trước khi xem gợi ý…': 'Write your conjecture before looking at the hint…',
  'Dấu hiệu bản chất': 'Essential features', 'Thuật ngữ & kí hiệu': 'Terms & notation', 'Định nghĩa': 'Definition', 'Liên hệ với khái niệm khác': 'Links to other concepts',
  'Dự đoán': 'Conjecture', 'Giả thiết': 'Hypothesis', 'Kết luận': 'Conclusion', 'Luận cứ chứng minh': 'Grounds for the proof', 'Xem chứng minh': 'Show the proof', 'Chứng minh': 'Proof', 'Cấu trúc logic': 'Logical structure',
  'Nhận diện trong những trường hợp đơn giản, đặc trưng. Chấm từng câu; kết quả được lưu vào hồ sơ.': 'Recognise it in simple, typical cases. Each question is graded and saved to your profile.',
  'Bài toán thực tế. Xem chiến lược nếu cần, tự làm, rồi bấm Chấm bài.': 'A real-world problem. Check the strategy if needed, solve it, then press Grade.',
  'Không có bài vận dụng.': 'No application problem.', 'Đã lưu kết quả củng cố vào hồ sơ.': 'Consolidation results saved to your profile.', 'AI chưa soạn được bài học. Bấm thử lại.': 'The AI could not prepare the lesson. Try again.',
  // practice
  'Mức độ': 'Level', 'Cơ bản': 'Basic', 'Trung bình': 'Intermediate', 'Nâng cao': 'Advanced', 'Tạo 5 bài tự luận': 'Create 5 essay problems', 'Tạo 5 câu trắc nghiệm': 'Create 5 MCQs',
  'Tạo bài tương tự từ một bài mẫu': 'Create similar problems from a sample', 'Bài mẫu để tạo bài tương tự (tuỳ chọn)': 'Sample problem (optional)',
  'Dán một bài bạn muốn luyện thêm, AI sẽ tạo 5 bài tương tự.': 'Paste a problem you want more of; the AI creates 5 similar ones.',
  'Chọn chủ đề và mức độ, rồi bấm tạo đề. Mỗi lần tạo là một bộ bài mới.': 'Pick a topic and level, then generate. Each set is new.', 'Đang soạn đề riêng cho bạn…': 'Writing your problem set…',
  'AI chưa tạo được bài. Bấm tạo lại.': 'The AI could not create problems. Try again.', 'Chọn câu': 'Choose question', 'Câu trước': 'Previous', 'Câu sau': 'Next', 'Tổng': 'Total',
  'Đọc kĩ đề, trả lời các câu hỏi dưới đây trước khi giải.': 'Read carefully and answer these questions before solving.', 'Gợi ý: đã cho – phải tìm': 'Hint: given – to find', 'Cái đã cho – cái phải tìm': 'Given – to find',
  'Đề cho những gì? Cần tìm gì?': 'What is given? What must be found?', 'Đặt tên các biến cố / biến ngẫu nhiên thế nào?': 'How will you name the events / random variables?', 'Có điều kiện gì cần chú ý?': 'Which conditions matter?',
  'Đưa về bài toán quen thuộc và chọn kiến thức phù hợp.': 'Reduce it to a familiar problem and choose the right tools.', 'Kiểm tra lại kết quả, rút ra phương pháp và mở rộng bài toán.': 'Check the result, extract the method and extend the problem.',
  'Kết quả có hợp lí không (xác suất trong [0; 1], tổng bằng 1…)?': 'Is the result reasonable (probabilities in [0; 1], summing to 1…)?', 'Có cách giải khác không?': 'Is there another method?',
  'Bài tương tự / khái quát hoá': 'Similar problem / generalisation', 'Xem lời giải': 'Show solution', 'Hỏi AI: vì sao?': 'Ask AI: why?', 'Câu hỏi của bạn về đáp án': 'Your question about the answer',
  'Ví dụ: Vì sao không chọn C?': 'e.g. Why not C?', 'Gửi câu hỏi': 'Send question', 'AI đang giải đáp…': 'The AI is answering…', 'Phương án': 'Options', 'Chấm bài': 'Grade', 'Hãy chọn một phương án.': 'Choose an option.',
  'Chính xác · 10/10': 'Correct · 10/10', 'Sang bước 4 để tự kiểm tra và mở rộng.': 'Go to step 4 to check and extend.', 'Sang bước 4: xem lời giải hoặc bấm "Hỏi AI: vì sao?".': 'Go to step 4: see the solution or press "Ask AI: why?".',
  'Bài làm của bạn': 'Your work', 'Trình bày lời giải theo từng bước…': 'Write your solution step by step…', 'Đính kèm ảnh/PDF': 'Attach photo/PDF', 'Đang chấm bài…': 'Grading…',
  'Hãy viết bài làm, viết trên bảng hoặc đính kèm ảnh.': 'Write your work, use the board or attach a photo.', 'Sang bước 4: Kiểm tra →': 'Go to step 4: Look back →',
  // oral
  'Chủ đề lí thuyết': 'Theory topic', 'Bắt đầu vấn đáp': 'Start oral exam', 'Câu trả lời của bạn': 'Your answer', 'Trả lời bằng lời của bạn, có thể kèm công thức…': 'Answer in your own words, with formulas if needed…',
  'Gửi câu trả lời': 'Send answer', 'Kết thúc & chấm điểm': 'Finish & grade', 'Gia sư đang đặt câu hỏi…': 'The tutor is asking…', 'Hãy viết câu trả lời.': 'Write an answer.',
  'Hãy trả lời ít nhất một câu trước khi kết thúc.': 'Answer at least one question before finishing.', 'Đang tổng kết buổi vấn đáp…': 'Summing up the oral exam…', 'Tổng kết': 'Summary',
  'Lỗ hổng kiến thức': 'Knowledge gaps', 'Sai lầm trong buổi vấn đáp': 'Mistakes in this oral exam', 'Cần làm tiếp': 'Next steps', 'Câu trước': 'Previous',
  'Chọn một chủ đề rồi bấm "Bắt đầu vấn đáp". Gia sư sẽ mở đầu bằng một tình huống thực tế, rồi hỏi sâu dần qua 4 giai đoạn.': 'Pick a topic and press "Start oral exam". The tutor opens with a real-life situation, then goes deeper through 4 stages.',
  // mind map
  'AI vẽ bản đồ': 'AI draws a map', 'Bản đồ toàn môn': 'Whole-course map', 'Mở hết': 'Expand all', 'Vừa khung': 'Fit', 'Bản đồ tư duy tương tác': 'Interactive mind map',
  'Ví dụ: Kiểm định giả thuyết về tỉ lệ': 'e.g. Hypothesis test for a proportion', 'AI đang vẽ bản đồ…': 'The AI is drawing the map…', 'Đang tải bản đồ tư duy…': 'Loading the mind map…',
  'AI chưa vẽ được bản đồ. Thử lại.': 'The AI could not draw the map. Try again.', 'Không tải được thư viện bản đồ tư duy. Kiểm tra kết nối mạng rồi tải lại trang.': 'Could not load the mind-map library. Check your connection and reload.',
  // stats & profile
  'Tổng lỗi': 'Total mistakes', 'Theo tính năng': 'By feature', 'Chưa có dữ liệu.': 'No data yet.', 'Nhận định chung & khắc phục': 'Overall diagnosis & remedies', 'AI nhận định & hướng khắc phục': 'AI diagnosis & remedies',
  'AI đang phân tích lỗi sai…': 'The AI is analysing your mistakes…', 'Loại lỗi hay gặp': 'Most common mistakes', 'Loại lỗi': 'Mistake types', 'Chưa có.': 'None yet.',
  'Điểm theo chủ đề (yếu nhất trước)': 'Score by topic (weakest first)', 'Các câu, nội dung đã sai': 'Questions and content you got wrong', 'Danh sách câu sai': 'Wrong answers',
  'Lọc theo tính năng': 'Filter by feature', 'Tất cả': 'All', 'Chưa có lỗi nào được ghi ở mục này.': 'No mistakes recorded here yet.',
  'Bấm nút để AI nhận định chung về các lỗi sai.': 'Press the button for an AI diagnosis of your mistakes.', 'Chưa có lỗi nào. Hãy làm bài tập, vấn đáp hoặc chấm một bài.': 'No mistakes yet. Do some practice, an oral exam or grade a piece of work.',
  'Tổng quan': 'Overview', 'Điểm TB': 'Average', 'Số phiên': 'Sessions', 'Lỗi đã ghi': 'Mistakes logged', 'Chấm bài, luyện tập và vấn đáp đã ghi lại': 'Gradings, practice and oral exams recorded',
  'Nhận định & lộ trình': 'Diagnosis & study plan', 'AI phân tích & đề xuất lộ trình': 'AI analysis & study plan', 'Xem thống kê lỗi sai': 'See mistake statistics', 'Nhận định của AI': 'AI diagnosis',
  'AI đang đọc hồ sơ của bạn…': 'The AI is reading your profile…', 'Diễn biến điểm': 'Score history', 'Chưa có điểm.': 'No scores yet.', 'Nhật kí học tập': 'Study log', 'Nhật kí': 'Log', 'Chưa có phiên nào.': 'No sessions yet.',
  'Mang hồ sơ sang máy khác': 'Move your profile to another device', 'Hồ sơ chỉ nằm trên trình duyệt này. Xuất tệp để sao lưu hoặc nhập trên thiết bị khác.': 'Your profile lives only in this browser. Export it to back up or import it on another device.',
  'Xuất hồ sơ': 'Export profile', 'Nhập hồ sơ': 'Import profile', 'Xoá hồ sơ': 'Delete profile', 'Quản lí hồ sơ': 'Manage profile', 'Đã nhập hồ sơ.': 'Profile imported.',
  'Xoá toàn bộ hồ sơ học tập trên trình duyệt này? Không thể hoàn tác.': 'Delete your whole learning profile in this browser? This cannot be undone.',
  'Bấm nút để AI đọc toàn bộ hồ sơ và đưa ra nhận định.': 'Press the button for the AI to read your profile and give a diagnosis.',
  'Hồ sơ còn trống. Hãy chấm một bài, làm một bộ luyện tập hoặc một buổi vấn đáp.': 'Your profile is empty. Grade some work, do a practice set or an oral exam.',
  'Lỗi lặp lại': 'Recurring mistakes', 'Ưu tiên': 'Priorities', 'Lộ trình 2 tuần': '2-week plan', 'AI chưa đưa ra nhận định. Thử lại sau.': 'No diagnosis yet. Try again later.',
  'Tệp không phải hồ sơ XSTK·AI.': 'This file is not an XSTK·AI profile.',
  // forum
  'Lọc theo chủ đề': 'Filter by topic', 'Tất cả chủ đề': 'All topics', 'Viết bài mới': 'New post', 'Tải lại': 'Reload', 'Bài viết mới': 'New post', 'Tiêu đề': 'Title',
  'Ví dụ: Khi nào dùng phân phối Poisson thay cho nhị thức?': 'e.g. When should I use Poisson instead of binomial?', 'Nội dung': 'Content', 'Trình bày câu hỏi hoặc chia sẻ của bạn…': 'Write your question or share your idea…',
  'Tên hiển thị': 'Display name', 'Ẩn danh': 'Anonymous', 'Đăng bài': 'Post', 'Đang đăng…': 'Posting…', 'Đang tải diễn đàn…': 'Loading the forum…', 'Chưa có bài viết nào. Hãy mở đầu cuộc thảo luận!': 'No posts yet. Start the discussion!',
  '← Tất cả bài viết': '← All posts', 'Trả lời': 'Reply', 'Viết câu trả lời của bạn…': 'Write your reply…', 'Gửi trả lời': 'Send reply', 'Đang gửi…': 'Sending…', 'Đang tải bài viết…': 'Loading the post…',
  'Xoá': 'Delete', 'Xoá bài này?': 'Delete this post?', 'Đã xoá.': 'Deleted.', 'Mất kết nối mạng. Thử lại sau.': 'Network lost. Try again later.',
  // errors
  'AI đang suy nghĩ…': 'The AI is thinking…', 'Đã có lỗi xảy ra. Vui lòng thử lại.': 'Something went wrong. Please try again.', 'Mất kết nối mạng. Kiểm tra Internet rồi thử lại.': 'Network lost. Check your connection and try again.',
  'AI trả về dữ liệu trống. Bấm thử lại.': 'The AI returned nothing. Try again.', 'Không đọc được tệp.': 'Could not read the file.', 'Không có lời giải.': 'No solution available.',
  'Biểu đồ cột': 'Bar chart', 'Biểu đồ Venn': 'Venn diagram', 'Cách bấm máy CASIO fx-580VN X': 'CASIO fx-580VN X key steps',
  'Bảng Galton: các viên bi rơi ngẫu nhiên tạo thành phân phối gần chuẩn': 'Galton board: random balls form a near-normal distribution',
};

// Strings built at runtime.
const RULES = [
  [/^Câu (\d+)$/, 'Question $1'], [/^Bước (\d+)$/, 'Step $1'], [/^← Bước (\d+)$/, '← Step $1'], [/^Thử lại sau (\d+)s$/, 'Retry in $1s'],
  [/^Bước (\d+): (.+) →$/, (m, n, s) => `Step ${n}: ${DICT[s] || s} →`], [/^Tiếp: (.+) →$/, (m, s) => `Next: ${DICT[s] || s} →`], [/^← (.+)$/, (m, s) => (DICT[s] ? `← ${DICT[s]}` : m)],
  [/^Chưa đúng · đáp án ([A-D?])$/, 'Wrong · answer $1'], [/^(\d+) trả lời$/, '$1 replies'], [/^MÃ HỒ SƠ (.+)$/, 'PROFILE $1'],
  [/^Cập nhật (.+)$/, 'Updated $1'], [/^(.+)\. Vui lòng thử lại sau (\d+) giây\.$/, (m, a, n) => `${a}. Please retry in ${n} seconds.`],
];

export function t(s) {
  const k = String(s).trim();
  if (!k) return s;
  if (DICT[k]) return s.replace(k, DICT[k]);
  const flat = k.replace(/\s*\n\s*/g, ' '); // page ledes carry a line break; the dictionary keys do not
  if (DICT[flat]) return DICT[flat];
  for (const [re, to] of RULES) if (re.test(k)) return s.replace(k, k.replace(re, to));
  return s;
}

const SKIP = '.rich, .katex, math-field, script, style, .ML__keyboard, .markmap';
const ATTRS = ['placeholder', 'title', 'aria-label'];
// What each node said before we translated it, so switching back restores the exact Vietnamese text.
const TEXT = new WeakMap();  // text node → { vi, en }
const ATTR = new WeakMap();  // element  → { [attr]: { vi, en } }

const swapText = (n) => {
  const was = TEXT.get(n);
  if (lang === 'en') {
    if (was && n.nodeValue === was.en) return;
    const en = t(n.nodeValue);
    if (en !== n.nodeValue) { TEXT.set(n, { vi: n.nodeValue, en }); n.nodeValue = en; }
  } else if (was && n.nodeValue === was.en) n.nodeValue = was.vi;
};
const swapAttr = (el, a) => {
  const v = el.getAttribute(a), all = ATTR.get(el) || {}, was = all[a];
  if (lang === 'en') {
    if (was && v === was.en) return;
    const en = t(v);
    if (en !== v) { all[a] = { vi: v, en }; ATTR.set(el, all); el.setAttribute(a, en); }
  } else if (was && v === was.en) el.setAttribute(a, was.vi);
};

function translate(root) {
  if (root.nodeType === 3) { if (!root.parentElement?.closest(SKIP)) swapText(root); return; }
  if (root.nodeType !== 1 || root.closest(SKIP)) return;
  for (const el of [root, ...root.querySelectorAll('*')]) {
    if (el.closest(SKIP)) continue;
    // Keep Vietnamese option values (topics are matched server-side) while showing English text.
    if (el.tagName === 'OPTION' && !el.hasAttribute('value')) el.setAttribute('value', el.textContent);
    for (const a of ATTRS) if (el.hasAttribute(a)) swapAttr(el, a);
    for (const n of el.childNodes) if (n.nodeType === 3) swapText(n);
  }
}

const btn = () => document.querySelector('[data-lang-toggle]');
function paintButton() {
  const b = btn();
  if (!b) return;
  b.textContent = lang === 'en' ? 'VI' : 'EN';
  b.setAttribute('lang', lang === 'en' ? 'vi' : 'en');
  b.setAttribute('aria-label', lang === 'en' ? 'Chuyển sang tiếng Việt' : 'Switch to English');
}

/**
 * Switch language in place: no reload, so everything on screen stays. Interface text flips both ways here;
 * listeners of "langchange" (app.js) re-render page titles and translate the AI-written content.
 */
export function setLang(l) {
  if (l === lang) return;
  try { localStorage.setItem(KEY, l); } catch { /* private mode: this page only */ }
  lang = l;
  document.documentElement.lang = l;
  paintButton();
  translate(document.body);
  dispatchEvent(new CustomEvent('langchange', { detail: l }));
}

/** Wire the EN/VI button and keep newly rendered UI in the current language. */
export function initI18n() {
  paintButton();
  btn()?.addEventListener('click', () => setLang(lang === 'en' ? 'vi' : 'en'));
  document.documentElement.lang = lang;
  if (lang === 'en') translate(document.body);
  new MutationObserver((list) => {
    if (lang !== 'en') return;
    for (const m of list) {
      if (m.type === 'childList') m.addedNodes.forEach(translate);
      else translate(m.target);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

/** t() only in English mode; use for strings set outside the observed DOM (document.title) or rendered as .rich. */
export const tr = (s) => (lang === 'en' ? t(s) : s);
