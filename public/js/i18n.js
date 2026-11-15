// Vietnamese ⇄ English. Views are written in Vietnamese; in English mode a MutationObserver swaps every
// known UI string (text, placeholder, title, aria-label) via DICT, and the AI is asked to answer in English.
// AI-written content (.rich), formulas and the formula editor are never touched.
const KEY = 'xstk.lang';
let lang = (() => { try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'vi'; } catch { return 'vi'; } })();
export const getLang = () => lang;

const DICT = {
  // voice commands
  'Ra lệnh bằng giọng nói (Alt+V). Giữ để nói, thả ra để chạy lệnh.': 'Voice command (Alt+V). Hold to talk, release to run it.', 'Ra lệnh bằng giọng nói': 'Voice command',
  'Nghe liên tục: chỉ chạy lệnh bắt đầu bằng «Trợ lý ơi»': 'Always listening: only commands starting with «Assistant» run', 'Nghe liên tục': 'Always listen',
  'Các lệnh giọng nói': 'Voice commands', 'Lệnh giọng nói': 'Voice commands',
  '«Sang trắc nghiệm», «mở bản đồ tư duy», «về trang chủ»': '«Go to quiz», «open mind map», «home»',
  '«Bấm tạo 5 bài», «xem gợi ý», «chấm bài»': '«Press create 5 problems», «show hint», «grade»',
  '«Điền chủ đề là khoảng tin cậy»': '«Fill topic with confidence interval»',
  '«Quay lại» / «hoàn tác», «tiến tới»': '«Back» / «undo», «forward»',
  '«Cuộn xuống», «cuộn lên», «đầu trang», «cuối trang»': '«Scroll down», «scroll up», «top», «bottom»',
  '«Dừng» (ngừng đọc), «tiếng Anh» / «tiếng Việt»': '«Stop» (stop reading), «English» / «Vietnamese»',
  '«Tắt nghe» (tắt nghe liên tục)': '«Stop listening» (turn off always listen)',
  'Nghe liên tục: nói «Trợ lý ơi» trước mỗi lệnh, ví dụ «Trợ lý ơi, sang trắc nghiệm». Lời giảng bình thường không bị coi là lệnh. Không dùng AI, không tốn lượt.': 'Always listen: say «Assistant» before each command, e.g. «Assistant, go to quiz». Normal lecturing is never taken as a command. No AI, no quota used.',
  'Đang chờ lệnh…': 'Waiting for a command…', 'Đang nghe lệnh…': 'Listening for a command…', 'Không nghe thấy lệnh.': 'No command heard.',
  'Đã huỷ.': 'Cancelled.', '✓ Đã dừng': '✓ Stopped', '✓ Quay lại': '✓ Back', '✓ Tiến tới': '✓ Forward', '✓ Đã cuộn': '✓ Scrolled', '✓ Đang ở trang này': '✓ Already here',
  'Trình duyệt chưa cho dùng micro.': 'The browser has not allowed the microphone.', 'Micro đang bận hoặc lỗi.': 'The microphone is busy or failed.',
  'Nghe liên tục: nói «Trợ lý ơi» rồi ra lệnh.': 'Always listening: say «Assistant», then the command.', 'Đã tắt nghe liên tục.': 'Always listen is off.',
  // ways of learning: menu groups, step medal, profile stamps
  'Học': 'Learn', 'Luyện': 'Practice', 'Hỏi': 'Ask', 'Theo dõi': 'Track', 'Âm thanh khi xong một bước': 'Sound when a step is done',
  'Thành tích': 'Achievements', 'phiên đã ghi': 'sessions logged', 'ngày học liên tiếp': 'days in a row',
  'chủ đề đã thạo': 'topics mastered', 'Nhìn lại': 'Looking back',
  // consent & data policy
  'Gửi nội dung cho AI': 'Sending your content to the AI', 'Không đồng ý': 'Do not agree', 'Đồng ý': 'Agree',
  'Để AI trả lời, chấm bài và đọc tệp, những gì bạn gõ, ảnh/PDF/Word bạn tải lên, chữ viết trên bảng và giọng nói của bạn sẽ được gửi tới Google Gemini, có máy chủ ở nước ngoài.': 'So the AI can answer, grade and read files, what you type, the photos/PDF/Word files you upload, what you write on the board and your voice are sent to Google Gemini, whose servers are abroad.',
  'Đừng đưa họ tên, mã số sinh viên, số điện thoại vào bài làm hay ảnh chụp.': 'Do not put your name, student ID or phone number in your work or photos.',
  'Đọc Chính sách dữ liệu': 'Read the data policy', 'Chính sách dữ liệu': 'Data policy', 'Bài đăng công khai.': 'Posts are public.', 'Điều khoản sử dụng': 'Terms of use',
  'Bạn chưa đồng ý gửi nội dung cho AI, nên chức năng này chưa chạy. Bấm lại để xem lời đề nghị.': 'You have not agreed to send content to the AI, so this feature did not run. Press again to see the request.',
  'Đang dịch bản đồ tư duy…': 'Translating the mind map…', 'Chưa dịch được bản đồ. Đổi ngôn ngữ lại để thử lần nữa.': 'Could not translate the map. Switch the language again to retry.',
  // home page
  'Trang chủ': 'Home', 'Xác suất Thống kê,': 'Probability & Statistics,', 'có gia sư kèm': 'with a tutor beside you', 'từng bước': 'step by step',
  'Chụp hoặc tải bài làm lên, gia sư AI chấm theo 4 bước giải toán của Polya, chỉ ra từng lỗi sai và ghi nhớ chúng để gợi ý lộ trình ôn thi. Luôn gợi ý cách nghĩ trước, lời giải chỉ hiện khi bạn hỏi.': 'Snap or upload your work: the AI tutor grades it through Polya’s 4 problem-solving steps, points out every mistake and remembers them to suggest a revision plan. It always hints at how to think first; the solution appears only when you ask.',
  'Chấm bài đầu tiên': 'Grade your first problem', 'Mỗi bài đi qua 4 bước': 'Every problem goes through 4 steps', 'Bấm vào bước nào cũng xem lại được.': 'Tap any step to see it again.',
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
  'Bấm vào một nút để thu gọn hoặc mở rộng, kéo để di chuyển, cuộn hoặc chụm hai ngón để phóng to. Bấm «Xem 3D» để xoay bản đồ trong không gian. AI có thể vẽ bản đồ cho bất kì chủ đề nào.': 'Click a node to fold or unfold, drag to pan, scroll or pinch to zoom. Press «3D view» to turn the map around in space. The AI can draw a map for any topic.',
  'Xem 3D': '3D view', 'Xem 2D': '2D view', 'Bản đồ tư duy 3D. Kéo để xoay, cuộn hoặc chụm hai ngón để phóng to, bấm vào một nút để mở hoặc thu gọn nhánh.': '3D mind map. Drag to turn it, scroll or pinch to zoom, tap a node to open or close its branch.',
  'Có ảnh đã sao chép? Bấm vào trang rồi dán (Ctrl+V).': 'Copied an image? Click the page and paste (Ctrl+V).', 'Đã dán tệp từ bộ nhớ tạm.': 'Pasted from the clipboard.',
  'Chưa đọc được chữ trên bảng. Hãy viết to, rõ hơn rồi thử lại.': 'Could not read the board. Write larger and clearer, then try again.', 'Công thức viết trên bảng:': 'Formula written on the board:',
  'Đọc đầy đủ các công thức trên bảng': 'Read every formula on the board in full', 'Đang đọc bảng…': 'Reading the board…', 'Hãy nhập, đọc hoặc viết một công thức trên bảng.': 'Type, say or write a formula on the board.', 'Bảng viết tay': 'Handwriting board',
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
  'Tìm hiểu nội dung đề bài': 'Understand the problem', 'Tìm cách giải': 'Find a way to solve it', 'Đang tìm cách giải…': 'Finding a way to solve it…', 'Nghiên cứu sâu lời giải': 'Study the solution in depth',
  'Tìm hiểu đề bài': 'Understand the problem', 'Bước này cần làm gì': 'What this step asks of you', 'Cách giải': 'Solution path', 'Xem gợi ý cách giải': 'See hints on how to solve it',
  'Phát biểu đề bài dưới những dạng thức khác nhau để hiểu rõ nội dung bài toán.': 'Restate the problem in different forms to understand it clearly.',
  'Phân biệt cái đã cho và cái phải tìm, phải chứng minh.': 'Tell apart what is given and what must be found or proved.',
  'Có thể dùng công thức, kí hiệu, hình vẽ để hỗ trợ cho việc diễn tả đề bài.': 'Use formulas, notation or drawings to help express the problem.',
  'Tìm tòi, phát hiện cách giải nhờ những suy nghĩ có tính chất tìm đoán: biến đổi cái đã cho, biến đổi cái phải tìm hay phải chứng minh, liên hệ cái đã cho hoặc cái phải tìm với những tri thức đã biết, liên hệ bài toán cần giải với một bài toán cũ tương tự, một trường hợp riêng, một bài toán tổng quát hơn hay một bài toán nào đó có liên quan, sử dụng những phương pháp đặc thù với từng dạng toán như chứng minh phản chứng, quy nạp toán học, toán dựng hình, toán quỹ tích v.v.': 'Search for a solution through heuristic thinking: transform what is given, transform what must be found or proved, relate them to what you already know, relate the problem to a similar earlier problem, a special case, a more general problem or any related problem, and use methods specific to the type of problem such as proof by contradiction, mathematical induction, constructions, loci, etc.',
  'Kiểm tra lời giải bằng cách xem lại kĩ từng bước thực hiện hoặc đặc biệt hoá kết quả tìm được hoặc đối chiếu kết quả với một số tri thức có liên quan.': 'Check the solution by reviewing each step carefully, specialising the result, or comparing it with related knowledge.',
  'Tìm tòi những cách giải khác, so sánh chúng để chọn được cách giải hợp lí nhất.': 'Look for other solutions and compare them to choose the most sensible one.',
  'Từ cách giải đã được phát hiện, sắp xếp các việc phải làm thành một chương trình gồm các bước theo một trình tự thích hợp và thực hiện các bước đó.': 'From the solution path you found, arrange the work into a programme of steps in a suitable order, then carry out those steps.',
  'Nghiên cứu khả năng ứng dụng kết quả của lời giải.': 'Study how the result of the solution can be applied.',
  'Nghiên cứu giải những bài toán tương tự, mở rộng hay lật ngược lại vấn đề.': 'Study similar problems, extend the problem, or turn it around.',
  'Nhập đề ở khung Đề bài rồi bấm «Tìm hiểu đề bài».': 'Enter the problem in the Problem box, then press «Understand the problem».',
  'Bấm nút dưới để xem gợi ý cách giải (không có đáp số).': 'Press the button below for hints on how to solve it (no answer).',
  'Xem lời giải đầy đủ, cách bấm máy CASIO, ứng dụng của kết quả và bài tương tự.': 'See the full solution, the CASIO key steps, how the result applies and similar problems.',
  'Trả lời các câu hỏi dưới đây trước khi giải.': 'Answer the questions below before solving.', 'Câu hỏi gợi mở để tự tìm cách giải.': 'Guiding questions to find the solution yourself.',
  'Câu hỏi để nghiên cứu sâu lời giải.': 'Questions to study the solution in depth.', 'Bài tương tự / mở rộng / lật ngược vấn đề': 'Similar problem / extension / reverse problem',
  'Kết quả này dùng được vào những tình huống thực tế nào?': 'Which real situations can this result be used in?',
  'Nếu đổi dữ kiện, hỏi ngược lại hoặc mở rộng bài toán thì giải thế nào?': 'How would you solve it with other data, the question reversed, or the problem extended?',
  'Sang bước 4: Nghiên cứu sâu lời giải →': 'Go to step 4: Study the solution in depth →',
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
  'Mỗi viên bi rẽ trái hay phải với xác suất ½. Hàng nghìn lựa chọn ngẫu nhiên vẫn xếp thành hình chuông: đó là định lí giới hạn trung tâm.': 'Each ball goes left or right with probability ½. Thousands of random choices still stack into a bell: the central limit theorem.',
  'Chọn một định lí gợi ý hoặc tự gõ tên, rồi bấm "Bắt đầu học".': 'Pick a suggested theorem or type its name, then press "Start learning".',
  'Chọn một khái niệm gợi ý hoặc tự gõ tên, rồi bấm "Bắt đầu học".': 'Pick a suggested concept or type its name, then press "Start learning".',
  'Chưa có phiên nào được chấm.': 'No graded sessions yet.', 'Chưa có lỗi nào': 'No mistakes yet',
  'Mỗi viên bi rẽ trái hay phải với xác suất ½. Hàng nghìn lựa chọn ngẫu nhiên vẫn xếp thành hình chuông: đó là định lí giới hạn trung tâm. Kết quả chấm sẽ hiện ở đây.': 'Each ball goes left or right with probability ½. Thousands of random choices still stack into a bell: the central limit theorem. Your grade will appear here.',
  'Gợi ý hướng đi, không có đáp số. Tự làm rồi bấm "Chấm điểm".': 'Directions only, no answer. Solve it, then press "Grade it".',
  'Cái đã cho': 'Given', 'Cái phải tìm': 'To find', 'Điều kiện': 'Conditions', 'Kiến thức cần dùng': 'Knowledge needed', 'Sai lầm hay gặp': 'Common pitfalls',
  'Điểm': 'Score', 'Lỗi sai': 'Mistakes', 'Điểm tốt': 'Strengths', 'Lời khuyên': 'Advice', 'Bài làm AI đã đọc được (OCR)': 'Work as read by the AI (OCR)',
  'Đã lưu vào hồ sơ học tập.': 'Saved to your learning profile.', 'Trình bày lời giải': 'Present the solution', 'Kiểm tra & mở rộng': 'Check & extend',
  'Bài tương tự để tự luyện': 'Similar problems to practise', 'Bấm máy CASIO fx-580VN X': 'CASIO fx-580VN X key steps', 'Lời giải': 'Solution',
  'Đang phân tích đề…': 'Analysing the problem…', 'Đang đọc bài làm và chấm điểm…': 'Reading and grading your work…', 'Đang viết lời giải…': 'Writing the solution…',
  'Hãy tải ảnh/PDF bài làm hoặc viết trên bảng để AI chấm.': 'Upload a photo/PDF or write on the board so the AI can grade it.', 'Hãy nhập đề bài hoặc tải tệp lên.': 'Enter the problem or upload a file.', 'Đã đủ 3 tệp.': '3 files is the maximum.',
  // board
  'Mực đen': 'Black ink', 'Mực xanh': 'Blue ink', 'Mực đỏ': 'Red ink', 'Tẩy': 'Eraser', 'Hoàn tác': 'Undo', 'Xoá bảng': 'Clear board', 'Bảng viết tay': 'Handwriting board', 'Công cụ bảng': 'Board tools',
  'Viết bằng bút Apple Pencil, ngón tay hoặc chuột. AI sẽ đọc chữ viết tay trên bảng.': 'Write with an Apple Pencil, finger or mouse. The AI reads the handwriting.',
  // math input & voice
  'Nhập công thức': 'Insert formula', 'Nói': 'Speak', 'Dừng': 'Stop', 'Chèn vào bài': 'Insert', 'Đóng': 'Close', 'Công thức đang trống.': 'The formula is empty.', 'Ô soạn công thức': 'Formula editor',
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
  'Gia sư đang chuẩn bị giọng đọc…': 'The tutor is getting ready to speak…', 'Giọng đọc': 'Voice', 'Giọng nam': 'Male voice', 'Giọng nữ': 'Female voice', 'Chọn giọng đọc': 'Choose a voice', 'Đang nghe bạn nói…': 'Listening…', 'Gia sư đang suy nghĩ…': 'The tutor is thinking…', 'Gia sư đang trả lời…': 'The tutor is answering…', 'Nghe lại': 'Play again',
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
  'Bài làm (ảnh / PDF / Word / bảng iPad)': 'Your work (photo / PDF / Word / iPad board)', 'Chọn ảnh, PDF hoặc Word': 'Choose a photo, PDF or Word file',
  'Chọn ảnh, PDF hoặc Word bài làm': 'Choose a photo, PDF or Word file of your work', 'Hoặc tải bài mẫu: ảnh, PDF, Word': 'Or upload a sample: photo, PDF, Word',
  'AI đọc chữ trong tệp (kể cả ảnh chụp) rồi tạo bài cùng dạng. Tối đa 3 tệp, mỗi tệp ≤ 10 MB.': 'The AI reads the file (photos too) and creates problems of the same type. Up to 3 files, 10 MB each.',
  'Tải ảnh, PDF hoặc Word bài mẫu': 'Upload a photo, PDF or Word sample', 'Đọc to': 'Read aloud', 'Dừng đọc': 'Stop reading', 'Đọc to bài làm': 'Read the work aloud',
  'Xem chữ đã đọc từ tệp': 'Show the text read from the file', 'Đính kèm ảnh/PDF/Word': 'Attach photo/PDF/Word',
  'Hãy tải ảnh/PDF/Word bài làm hoặc viết trên bảng để AI chấm.': 'Upload a photo/PDF/Word file or write on the board so the AI can grade it.',
  'Nhập đề bài, bấm «Tìm hiểu đề bài» rồi đi qua 4 bước giải toán; bấm vào bước nào cũng xem lại được. AI gợi ý chiến lược (không lộ đáp án), chấm bài ở bước Trình bày lời giải và chỉ hiện lời giải khi bạn yêu cầu.': 'Enter the problem, press «Understand the problem», then go through the 4 problem-solving steps; click any step to see it again. The AI suggests a strategy (never the answer), grades your work in the Present the solution step, and shows the solution only when you ask.',
  // real-time voice + formula Q&A
  'Bắt đầu trò chuyện': 'Start talking', 'Kết thúc trò chuyện': 'End conversation', 'Ngắt lời': 'Interrupt', 'Kết thúc': 'End',
  'Đang kết nối với gia sư…': 'Connecting to the tutor…', 'Gia sư đang nghe. Bạn cứ nói tự nhiên, hoặc gõ ở ô bên dưới.': 'The tutor is listening. Just speak, or type below.',
  'Bấm Bắt đầu trò chuyện để nói chuyện trực tiếp với gia sư.': 'Press Start talking to talk with the tutor in real time.',
  'Trò chuyện trực tiếp đang bận nên đã chuyển sang hỏi đáp thường: bấm Nói ở ô bên dưới.': 'Real-time voice is busy, so this switched to the ordinary mode: press Speak in the box below.',
  'Hỏi bằng giọng nói hoặc nhập đề bài, đáp án, câu trả lời': 'Ask by voice or type the problem, answer or reply',
  'Bấm Bắt đầu trò chuyện rồi cứ nói tự nhiên: gia sư trả lời bằng giọng ngay, lời nói hiện thành chữ, công thức hiện ngay bên dưới. Bài toán nhiều công thức thì viết lên bảng (iPad), hoặc gõ ở ô bên dưới.': 'Press Start talking and just speak: the tutor answers aloud right away, its words appear as text and formulas show underneath. Write formula-heavy problems on the board (iPad), or type below.',
  'Không dùng được micro. Bạn vẫn gõ câu hỏi được, gia sư trả lời bằng giọng.': 'The microphone is unavailable. You can still type; the tutor answers aloud.',
  'Hỏi đáp công thức': 'Formula Q&A', 'Công thức': 'Formulas', 'Nói công thức': 'Say a formula', 'Đọc công thức': 'Read the formula',
  'Đọc một công thức bằng lời, gia sư viết nó ra đầy đủ và đọc lại rõ từng kí hiệu. Hoặc gửi file Word, PDF, ảnh có công thức để nghe đọc đầy đủ mọi công thức trong đó.': 'Say a formula in words: the tutor writes it out in full and reads it back symbol by symbol. Or send a Word file, PDF or photo with formulas to hear every formula in it read in full.',
  'Bấm Nói công thức rồi đọc công thức bằng lời, hoặc gõ / gửi tệp bên dưới.': 'Press Say a formula and say it in words, or type / send a file below.',
  'Gõ công thức hoặc gửi tệp bên dưới; bấm Nói ở ô nhập để đọc bằng giọng.': 'Type a formula or send a file below; press Speak in the box to say it.',
  'Gia sư đang nghe công thức của bạn…': 'The tutor is listening to your formula…', 'Gia sư đang viết công thức…': 'The tutor is writing the formula…', 'Gia sư đang đọc công thức…': 'The tutor is reading the formula…',
  'Giọng nói trực tiếp đang bận nên đã chuyển sang chế độ thường: bấm Nói ở ô nhập, hoặc gõ / gửi tệp.': 'Real-time voice is busy, so this switched to the ordinary mode: press Speak in the box, or type / send a file.',
  'Gõ, dán hoặc đọc (nút Nói) một công thức': 'Type, paste or say (Speak button) a formula', 'Ví dụ: P của A hợp B bằng P A cộng P B trừ P A giao B': 'Example: P of A union B equals P A plus P B minus P A intersect B',
  'Hãy nhập hoặc đọc một công thức.': 'Enter or say a formula.', 'Chưa nghe rõ. Hãy đọc lại hoặc gõ công thức.': 'Did not catch that. Say it again or type the formula.',
  'Gửi tệp có công thức: Word, PDF, ảnh': 'Send a file with formulas: Word, PDF, photo', 'Tải file Word, PDF hoặc ảnh có công thức': 'Upload a Word file, PDF or photo with formulas',
  'Tối đa 3 tệp, mỗi tệp ≤ 10 MB. Gia sư đọc đầy đủ mọi công thức trong tệp.': 'Up to 3 files, 10 MB each. The tutor reads every formula in them.',
  'Đọc công thức trong tệp': 'Read the formulas in the file', 'Hãy chọn tệp trước.': 'Choose a file first.', 'Văn bản đọc được từ tệp:': 'Text read from the file:',
  'Không thấy chữ hay công thức nào trong tệp.': 'No text or formula found in the file.', 'Đọc đầy đủ các công thức trong tệp': 'Read every formula in the file',
  'Đang viết công thức…': 'Writing the formula…', 'Không dùng được micro. Bạn vẫn gõ hoặc gửi tệp được, gia sư đọc bằng giọng.': 'The microphone is unavailable. You can still type or send a file; the tutor reads aloud.',
  // mini-game
  'Mini-game trắc nghiệm': 'Quiz mini-game', 'Mini-game': 'Mini-game', 'Độ khó': 'Difficulty', 'Dễ': 'Easy', 'Khó': 'Hard',
  'Bắt đầu chơi': 'Start playing', 'Hoàn thành': 'Done', 'Chọn một phương án.': 'Pick an option.', 'Hết giờ.': 'Time is up.',
  'Đã chốt đáp án.': 'Answer locked.', 'Câu tiếp →': 'Next question →', 'Xem kết quả': 'See results', 'Chính xác': 'Correct',
  'Kết quả': 'Result', 'Xem lại từng câu': 'Review each question', 'Đúng': 'Correct', 'Sai': 'Wrong', 'Bỏ trống': 'Blank',
  'Bạn chọn:': 'You picked:', 'Đáp án:': 'Answer:', 'không chọn': 'none', 'Chơi bộ câu hỏi mới': 'Play a new set',
  'Bài tập': 'Exercise', 'Thực tiễn': 'Real life', 'giây': 'sec', 'Thời gian còn lại': 'Time left',
  'AI chưa tạo đủ câu hỏi. Bấm Bắt đầu chơi để thử lại.': 'The AI did not create enough questions. Press Start playing to try again.',
  'Chọn độ khó rồi bấm Bắt đầu chơi: bộ 20 câu từ lí thuyết, bài tập đến liên hệ thực tiễn. Mỗi câu có 30 giây; đáp án hiện khi hết giờ, hoặc ngay khi bạn bấm Hoàn thành.': 'Pick a difficulty and press Start playing: a set of 20 questions from theory and exercises to real life. Each question has 30 seconds; the answer appears when time runs out, or as soon as you press Done.',
  // forum roles
  'Vai trò': 'Role', 'Vai trò: Sinh viên': 'Role: Student', 'Vai trò: Giảng viên kiểm duyệt': 'Role: Lecturer (moderator)',
  'Đổi sang giảng viên kiểm duyệt': 'Switch to lecturer moderator', 'Về vai trò sinh viên': 'Back to student',
  'Mật khẩu kiểm duyệt': 'Moderator password', 'Mật khẩu giảng viên': 'Lecturer password', 'Xác nhận': 'Confirm', 'Huỷ': 'Cancel',
  'Đang kiểm tra…': 'Checking…', 'Bạn có thể xoá mọi bài viết và trả lời vi phạm.': 'You can delete any post or reply that breaks the rules.',
  'Xoá (kiểm duyệt)': 'Delete (moderator)', 'Đã chuyển sang vai trò giảng viên kiểm duyệt.': 'Switched to the lecturer moderator role.',
  'Đã về vai trò sinh viên.': 'Back to the student role.', 'Mật khẩu không đúng.': 'Wrong password.',
  'Phiên giảng viên đã hết hạn. Hãy nhập lại mật khẩu.': 'Your moderator session expired. Enter the password again.',
  'Tệp đề bài / bài làm': 'Problem / work file', 'Bài làm của bạn': 'Your work',
  'Tạo bài tương tự': 'Create a similar problem', 'Cùng chương, cùng dạng, chỉ khác số liệu.': 'Same chapter and type, only the numbers change.',
  'Đang tạo bài tương tự…': 'Creating a similar problem…', 'AI chưa tạo được bài tương tự. Bấm thử lại.': 'The AI could not create a similar problem. Press again.',
  'Bài toán này thuộc dạng quen thuộc nào?': 'Which familiar type of problem is this?', 'Cần dùng công thức, định lí hay phân phối nào?': 'Which formula, theorem or distribution is needed?',
  'Gõ hoặc dán đề bài. Có thể bỏ trống nếu đề nằm trong tệp bên dưới.': 'Type or paste the problem. Leave it empty if the problem is in the file below.',
  'Tải đề bài: ảnh, PDF hoặc Word': 'Upload the problem: photo, PDF or Word', 'Tải ảnh, PDF hoặc Word đề bài': 'Upload a photo, PDF or Word file of the problem',
  'Gõ lời giải, đáp án của bạn… hoặc tải tệp / viết trên bảng bên dưới.': 'Type your solution or answer… or upload a file / use the board below.',
  'Tải bài làm: ảnh, PDF hoặc Word': 'Upload your work: photo, PDF or Word', 'Tải ảnh, PDF hoặc Word bài làm': 'Upload a photo, PDF or Word file of your work',
  'Chụp thẳng, đủ sáng để AI đọc chính xác. Tối đa 3 tệp.': 'Shoot straight and well lit so the AI reads it correctly. Up to 3 files.',
  'Tự trình bày lời giải: gõ vào ô dưới, tải ảnh/PDF/Word hoặc viết trên bảng, rồi bấm «Chấm điểm».': 'Write your solution: type it below, upload a photo/PDF/Word file or use the board, then press «Grade it».',
  'Hãy nhập đề bài hoặc tải tệp đề bài lên.': 'Enter the problem or upload a problem file.',
  'Hãy gõ bài làm, tải tệp bài làm hoặc viết trên bảng để AI chấm.': 'Type your work, upload a file or use the board so the AI can grade it.', 'Đề bài hoặc bài làm. Tối đa 3 tệp, mỗi tệp ≤ 10 MB.': 'Problem or your work. Up to 3 files, 10 MB each.',
  'Đề cho gì, cần tìm gì, có điều kiện gì. Nhập đề ở khung Đề bài rồi bấm «Tìm hiểu đề».': 'What is given, what to find, which conditions. Enter the problem and press «Understand».',
  'Hướng đi và kiến thức cần dùng, không có đáp số.': 'The way forward and the knowledge to use, without the answer.',
  'Tự trình bày lời giải, tải ảnh/PDF/Word hoặc viết trên bảng ở khung Đề bài, rồi bấm «Chấm điểm».': 'Write your solution, upload a photo/PDF/Word file or use the board, then press «Grade it».',
  'Kiểm tra lại kết quả, xem lời giải đầy đủ, cách bấm máy CASIO và bài tương tự.': 'Check your result, see the full solution, the CASIO key steps and similar problems.',
  'Xem chương trình giải': 'See the plan', 'Xem lời giải chi tiết': 'See the detailed solution', 'Barem điểm': 'Marking scheme',
  'Đang xây dựng chương trình giải…': 'Building the plan…', 'Đề bài và bài làm': 'Problem and work', 'Bốn bước giải toán': 'Four problem-solving steps',
  'Trình duyệt này không có giọng đọc.': 'This browser has no speech voice.', 'Đang đọc tệp…': 'Reading the file…',
  'Tệp không có chữ để đọc.': 'The file has no text to read.', 'Không đọc được tệp.': 'Could not read the file.',
  'Đính kèm ảnh, PDF hoặc Word bài làm': 'Attach a photo, PDF or Word file of your work', 'Tối đa 3 tệp, mỗi tệp ≤ 10 MB.': 'Up to 3 files, 10 MB each.',
  'Tải ảnh, PDF hoặc file Word bài làm. AI gợi ý chiến lược (không lộ đáp án), chấm điểm từng bước và chỉ hiện lời giải khi bạn yêu cầu.': 'Upload a photo, PDF or Word file of your work, or write on the board. The AI suggests a strategy (never the answer), grades each step, and shows the solution only when you ask.',
  'Tạo bài tương tự từ một bài mẫu':'Create similar problems from a sample', 'Bài mẫu để tạo bài tương tự (tuỳ chọn)': 'Sample problem (optional)',
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
  'Tệp không phải hồ sơ AI Classroom.': 'This file is not an AI Classroom profile.',
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
// Tools, simulations, spaced review, forum reports.
Object.assign(DICT, {
  'Phòng mô phỏng': 'Simulation lab', 'Mô phỏng': 'Simulate', 'Bảng tra phân phối': 'Distribution tables', 'Bảng tra': 'Tables',
  'Kiểm định giả thuyết': 'Hypothesis testing', 'Kiểm định': 'Testing',
  'Thống kê mô tả': 'Descriptive statistics', 'Số liệu': 'Data', 'Ôn tập ngắt quãng': 'Spaced review', 'Ôn tập': 'Review',
  'Tra hàm Laplace Φ(x), phân vị Student, χ² và Fisher như bảng in cuối giáo trình, nhưng thấy được diện tích trên đồ thị. Kết quả tính chính xác bằng máy, không dùng AI.': 'Look up the Laplace function Φ(x) and Student, χ² and Fisher quantiles like the tables at the back of the textbook, and see the area on the curve. Computed exactly, no AI.',
  'Nhập số liệu đề cho, chọn đối thiết và mức ý nghĩa: trang đi qua đủ 4 bước như slide bài giảng và vẽ miền bác bỏ. Tính chính xác bằng máy, không dùng AI, để bạn đối chiếu bài tự làm.': 'Enter the data from the problem, pick the alternative and the significance level: the page goes through the 4 steps of the lecture slides and draws the rejection region. Computed exactly, no AI, so you can check your own work.',
  'Nhập từng giá trị (và tần số nếu có) để có ngay x̄, ŝ², s², trung vị, tứ phân vị, biểu đồ tần số và biểu đồ hộp. Tính chính xác bằng máy, không dùng AI.': 'Enter each value (and its frequency, if any) to get x̄, ŝ², s², median, quartiles, a frequency chart and a box plot. Computed exactly, no AI.',
  'Tự tay tung đồng xu, lấy mẫu, dựng khoảng tin cậy và xem sai lầm khi kiểm định. Mỗi thí nghiệm chạy ngẫu nhiên ngay trên máy của bạn, mỗi lần một khác.': 'Flip coins, draw samples, build confidence intervals and watch testing errors yourself. Every experiment runs randomly on your device, different each time.',
  'Chủ đề nào bạn từng làm sai sẽ quay lại sau 1, 3, 7, 14, 30 ngày, bằng bài mới nhắm đúng lỗi cũ. Ôn đạt từ 8/10 thì lần sau giãn ra; chưa đạt thì ôn lại từ đầu.': 'Every topic you got wrong comes back after 1, 3, 7, 14, 30 days, with new problems aimed at those mistakes. Score 8/10 or more and the next review is further away; otherwise it starts over.',
  // tables
  'Chọn phân phối': 'Choose a distribution', 'Cách tra': 'Lookup', 'Hàm Laplace Φ(x)': 'Laplace function Φ(x)', 'Khi bình phương χ²(k)': 'Chi-square χ²(k)',
  'Từ α tìm phân vị': 'From α to quantile', 'Từ x tìm xác suất': 'From x to probability', 'Bậc tự do k (k₁)': 'Degrees of freedom k (k₁)', 'Bậc tự do k₂': 'Degrees of freedom k₂',
  'Giá trị x': 'Value x', 'Mức α (diện tích bên phải)': 'Level α (area to the right)', 'Bậc tự do phải là số nguyên từ 1 đến 500.': 'Degrees of freedom must be a whole number from 1 to 500.',
  'α phải nằm trong (0; 1), ví dụ 0,05.': 'α must be in (0; 1), e.g. 0.05.', 'Hãy nhập một số, ví dụ 1,96.': 'Enter a number, e.g. 1.96.',
  'phần tô đỏ là diện tích bên phải x, bằng': 'the red area right of x equals', 'Phân vị trên mức': 'Upper quantile at', 'Giá trị đã nhập': 'Value entered',
  'Diện tích bên trái': 'Area to the left', 'Diện tích bên phải (α)': 'Area to the right (α)', 'Các phân vị hay dùng': 'Common quantiles', 'Hàng bảng tra': 'Table row',
  'Bảng phân vị': 'Quantile table', 'Kết quả tra bảng': 'Lookup result', 'Nhập': 'Input',
  'Giáo trình làm tròn: z₀,₀₅ ≈ 1,65; z₀,₀₂₅ ≈ 1,96; z₀,₀₀₅ ≈ 2,58.': 'The textbook rounds: z₀.₀₅ ≈ 1.65; z₀.₀₂₅ ≈ 1.96; z₀.₀₀₅ ≈ 2.58.',
  // hypothesis tests
  'Loại kiểm định': 'Test type', 'Trung bình μ': 'Mean μ', 'Tỉ lệ p': 'Proportion p', 'Phương sai σ²': 'Variance σ²', 'So sánh 2 trung bình': 'Compare 2 means',
  'So sánh 2 tỉ lệ': 'Compare 2 proportions', 'So sánh 2 phương sai': 'Compare 2 variances', 'Cỡ mẫu n': 'Sample size n', 'Trung bình mẫu x̄': 'Sample mean x̄',
  'Độ lệch chuẩn mẫu s': 'Sample standard deviation s', 'σ đã biết (bỏ trống nếu chưa biết)': 'Known σ (leave empty if unknown)', 'Giá trị kiểm định μ₀': 'Tested value μ₀',
  'Số phần tử có tính chất k': 'Number with the property k', 'Tỉ lệ kiểm định p₀': 'Tested proportion p₀', 'Phương sai mẫu hiệu chỉnh s²': 'Corrected sample variance s²',
  'Giá trị kiểm định σ₀²': 'Tested value σ₀²', 'Cỡ mẫu X: n': 'Sample X size: n', 'Cỡ mẫu Y: m': 'Sample Y size: m',
  'Hai phía (≠)': 'Two-sided (≠)', 'Lớn hơn (>)': 'Greater (>)', 'Bé hơn (<)': 'Less (<)', 'Đối thiết H₁': 'Alternative H₁', 'Mức ý nghĩa α': 'Significance level α',
  'Số liệu đề cho': 'Given data', 'Tính n, x̄, s từ số liệu thô': 'Compute n, x̄, s from raw data', 'Số liệu mẫu': 'Sample data', 'Điền vào ô': 'Fill in the fields',
  'Lập giả thiết': 'Hypotheses', 'Miền bác bỏ W': 'Rejection region W', 'Giá trị quan sát': 'Observed value', 'Kết luận': 'Conclusion', 'Bước': 'Step',
  'với mức ý nghĩa': 'at significance level', 'Bác bỏ H₀': 'Reject H₀', 'Chấp nhận H₀': 'Accept H₀', 'Bốn bước kiểm định': 'Four steps of the test',
  'Giá trị quan sát thuộc W: bác bỏ H₀, chấp nhận H₁': 'The observed value is in W: reject H₀, accept H₁',
  'Giá trị quan sát không thuộc W: chưa đủ cơ sở bác bỏ H₀': 'The observed value is not in W: not enough evidence to reject H₀',
  'Phần tô đỏ là miền bác bỏ W; vạch đứng là giá trị quan sát.': 'The red area is the rejection region W; the vertical line is the observed value.',
  'đã đổi chỗ: mẫu Y có phương sai lớn hơn': 'swapped: sample Y has the larger variance',
  'σ đã biết: dùng phân phối chuẩn.': 'σ known: use the normal distribution.', 'n ≥ 30: dùng phân phối chuẩn, thay σ bằng s.': 'n ≥ 30: use the normal distribution, with s for σ.',
  'n < 30, σ chưa biết: dùng phân phối Student bậc n − 1.': 'n < 30, σ unknown: use Student with n − 1 degrees of freedom.', 'Kiểm định tỉ lệ: f = k/n, q₀ = 1 − p₀.': 'Proportion test: f = k/n, q₀ = 1 − p₀.',
  'μ chưa biết: dùng phân phối χ² bậc n − 1.': 'μ unknown: use χ² with n − 1 degrees of freedom.', 'Hai mẫu lớn (n, m ≥ 30): dùng phân phối chuẩn, σ² xấp xỉ bằng s².': 'Two large samples (n, m ≥ 30): normal distribution, σ² ≈ s².',
  'Mẫu nhỏ: dùng phân phối Student bậc n + m − 2 với phương sai gộp.': 'Small samples: Student with n + m − 2 degrees of freedom and pooled variance.', 'So sánh hai tỉ lệ với tỉ lệ gộp f.': 'Compare two proportions with the pooled proportion f.',
  'Luôn đặt phương sai mẫu lớn hơn lên tử số: phân phối Fisher.': 'Always put the larger sample variance on top: Fisher distribution.',
  'Mức ý nghĩa α phải nằm trong (0; 1).': 'The significance level α must be in (0; 1).', 'Cỡ mẫu n phải là số nguyên ≥ 2.': 'Sample size n must be a whole number ≥ 2.', 'Cỡ mẫu m phải là số nguyên ≥ 2.': 'Sample size m must be a whole number ≥ 2.',
  'Cần độ lệch chuẩn mẫu s > 0 (hoặc σ đã biết).': 'Needs a sample standard deviation s > 0 (or a known σ).', 'Số phần tử có tính chất k phải là số nguyên trong [0; n].': 'k must be a whole number in [0; n].',
  'Tỉ lệ p₀ phải nằm trong (0; 1).': 'p₀ must be in (0; 1).', 'Cần s² ≥ 0 và σ₀² > 0.': 'Needs s² ≥ 0 and σ₀² > 0.', 'Cần độ lệch chuẩn s₁, s₂ > 0.': 'Needs standard deviations s₁, s₂ > 0.',
  'k₁, k₂ phải là số nguyên trong [0; n] và [0; m].': 'k₁, k₂ must be whole numbers in [0; n] and [0; m].', 'Tỉ lệ gộp f bằng 0 hoặc 1: không kiểm định được.': 'The pooled proportion is 0 or 1: the test cannot run.',
  'Chưa có số liệu.': 'No data yet.', 'Số tần số phải bằng số giá trị, mỗi tần số là số nguyên ≥ 0.': 'There must be one frequency per value, each a whole number ≥ 0.',
  // descriptive statistics
  'Giá trị xᵢ': 'Value xᵢ', 'Tần số nᵢ': 'Frequency nᵢ', '+ Thêm dòng': '+ Add row', 'Dán nhiều số một lúc': 'Paste many numbers at once', 'Dãy số': 'Numbers',
  'Tách thành từng dòng': 'Split into rows', 'Ví dụ: 12,5 13 11,8 14,2 (cách nhau bằng dấu cách, dấu ; hoặc xuống dòng)': 'E.g. 12.5 13 11.8 14.2 (separated by spaces, ; or new lines)',
  'Mỗi dòng một giá trị. Bấm Enter để sang dòng mới; dán cả dãy số vào một ô thì tự tách thành từng dòng.': 'One value per row. Press Enter for a new row; paste a whole list into a cell and it splits into rows.',
  'Nhập số liệu vào các ô bên trái, kết quả hiện ngay.': 'Enter data in the cells on the left; results appear at once.', 'Bản xem trước cục bộ không có AI.': 'The local preview has no AI.',
  'Trung bình mẫu': 'Sample mean', 'Phương sai mẫu (chia n)': 'Sample variance (divide by n)',
  'Phương sai mẫu hiệu chỉnh (chia n − 1)': 'Corrected sample variance (divide by n − 1)', 'Độ lệch chuẩn mẫu hiệu chỉnh': 'Corrected sample standard deviation',
  'Giá trị nhỏ nhất': 'Minimum', 'Tứ phân vị thứ nhất': 'First quartile', 'Trung vị': 'Median', 'Tứ phân vị thứ ba': 'Third quartile', 'Giá trị lớn nhất': 'Maximum',
  'Tứ phân vị nội suy tuyến tính (như QUARTILE.INC của Excel); giáo trình khác có thể làm tròn khác.': 'Quartiles use linear interpolation (like Excel QUARTILE.INC); other textbooks may round differently.',
  'Tần số theo từng giá trị': 'Frequency of each value', 'Tần số theo 10 khoảng bằng nhau': 'Frequency in 10 equal classes', 'Biểu đồ hộp': 'Box plot',
  'Biểu đồ hộp: Min, Q1, trung vị, Q3, Max; chấm đỏ là x̄': 'Box plot: Min, Q1, median, Q3, Max; the red dot is x̄', 'Các số đặc trưng mẫu': 'Sample statistics',
  // simulations
  'Thí nghiệm': 'Experiment', 'Luật số lớn': 'Law of large numbers', 'Định lí giới hạn trung tâm': 'Central limit theorem', 'Khoảng tin cậy': 'Confidence intervals',
  'Sai lầm loại I và II': 'Type I and II errors', 'Xác suất mặt ngửa p': 'Probability of heads p', 'Tung': 'Flip', 'Làm lại': 'Reset', 'thang log': 'log scale',
  'Tần suất mặt ngửa theo số lần tung': 'Frequency of heads by number of flips', 'Tần suất fₙ = số lần ngửa / n dao động mạnh lúc đầu rồi tiến về p.': 'The frequency fₙ = heads / n swings at first, then settles at p.',
  'Tần suất mặt ngửa': 'Frequency of heads', 'Số lần đã tung': 'Flips so far', 'Độ lệch so với p': 'Distance from p',
  'Tổng thể': 'Population', 'Lệch phải (mũ, μ = 1)': 'Right-skewed (exponential, μ = 1)', 'Đều trên [0; 1]': 'Uniform on [0; 1]', 'Bernoulli p = 0,2': 'Bernoulli p = 0.2',
  'Lấy 1 mẫu': 'Draw 1 sample', 'Lấy 500 mẫu': 'Draw 500 samples', 'Phân phối của trung bình mẫu': 'Distribution of the sample mean',
  'Cột xanh: các trung bình mẫu đã lấy. Đường đỏ: N(μ; σ²/n) theo định lí giới hạn trung tâm.': 'Blue bars: the sample means drawn. Red curve: N(μ; σ²/n) from the central limit theorem.',
  'Số mẫu': 'Samples', 'Số trung bình mẫu đã lấy': 'Sample means drawn', 'Trung bình của các x̄ (gần μ)': 'Mean of the x̄ (close to μ)', 'Độ lệch': 'Spread',
  'Độ lệch chuẩn của các x̄': 'Standard deviation of the x̄', 'Lí thuyết dự đoán': 'Theory predicts',
  'Tổng thể N(50; 10²), σ đã biết: mỗi mẫu cho khoảng x̄ ± ε với ε = z(α/2)·σ/√n, như Bài 5.': 'Population N(50; 10²), σ known: each sample gives x̄ ± ε with ε = z(α/2)·σ/√n, as in Lesson 5.',
  'Độ tin cậy': 'Confidence', 'Dựng 1 khoảng': 'Build 1 interval', 'Dựng 100 khoảng': 'Build 100 intervals', 'Các khoảng tin cậy': 'Confidence intervals',
  '50 khoảng gần nhất. Khoảng đỏ không chứa μ.': 'The latest 50 intervals. Red ones miss μ.', 'Tỉ lệ chứa μ': 'Hit rate', 'Số khoảng chứa μ / số khoảng đã dựng': 'Intervals containing μ / intervals built',
  'Đã dựng': 'Built', 'Số khoảng': 'Intervals', 'Trung bình thật μ₁': 'True mean μ₁', 'ngưỡng': 'cut-off', 'Sai lầm loại I và loại II': 'Type I and type II errors',
  'Đường xanh: x̄ khi H₀ đúng. Đường xám nét đứt: x̄ khi μ = μ₁. Đỏ: α (bác bỏ nhầm H₀). Vàng: β (bỏ sót H₁).': 'Blue: x̄ when H₀ is true. Grey dashed: x̄ when μ = μ₁. Red: α (wrongly rejecting H₀). Gold: β (missing H₁).',
  'Lực kiểm định: phát hiện được μ₁': 'Power: detecting μ₁', 'Sai lầm loại I: bác bỏ H₀ khi H₀ đúng': 'Type I error: rejecting a true H₀', 'Sai lầm loại II: chấp nhận H₀ khi H₁ đúng': 'Type II error: accepting H₀ when H₁ holds',
  'H₀: μ = 0, H₁: μ > 0, σ = 1. Kéo thanh trượt: tăng n hoặc μ₁ làm β nhỏ lại; giảm α làm β lớn lên.': 'H₀: μ = 0, H₁: μ > 0, σ = 1. Drag the sliders: a larger n or μ₁ shrinks β; a smaller α makes β grow.',
  // spaced review
  'Lịch ôn tập': 'Review schedule', 'Lịch ôn': 'Schedule', 'Hôm nay': 'Today', 'Đến hạn': 'Due', 'Ngày mai': 'Tomorrow', 'Sau': 'In', 'ngày': 'days', 'lỗi': 'mistakes', 'hộp': 'box',
  'Chủ đề đến hạn ôn. Mỗi lần ôn là 5 câu trắc nghiệm mới, nhắm vào đúng lỗi bạn từng mắc.': 'Topics due for review. Each review is 5 new multiple-choice questions aimed at your past mistakes.',
  'Chưa có chủ đề nào đến hạn. Hẹn bạn hôm sau!': 'Nothing is due yet. See you another day!', 'Lỗi đã mắc': 'Past mistakes', 'Ôn ngay': 'Review now', 'Ôn sớm': 'Review early',
  'Chưa có lỗi nào được ghi. Làm bài tập, vấn đáp hoặc chấm bài; chủ đề làm sai sẽ tự vào lịch ôn.': 'No mistakes logged yet. Practise, take an oral exam or get work graded; topics you get wrong join the schedule.',
  'Làm bài trắc nghiệm': 'Do a quiz', 'Đang soạn bài ôn theo đúng lỗi của bạn…': 'Writing a review aimed at your mistakes…',
  'AI chưa tạo được bài ôn. Bấm thử lại.': 'The AI could not write the review. Press again.',
  'Đã nhớ: chủ đề được giãn sang hộp tiếp theo.': 'Remembered: the topic moves to the next box.', 'Chưa đạt: chủ đề sẽ quay lại vào ngày mai.': 'Not yet: the topic comes back tomorrow.',
  // forum reports
  'Báo cáo bài vi phạm': 'Report this post', 'Lí do': 'Reason', 'Ghi chú': 'Note', 'Ghi chú thêm (tuỳ chọn)': 'Extra note (optional)', 'Gửi báo cáo': 'Send report',
  'Thông tin cá nhân': 'Personal information', 'Quấy rối, xúc phạm': 'Harassment or insults', 'Quảng cáo, spam': 'Advertising or spam', 'Nội dung sai lệch, vi phạm pháp luật': 'False or unlawful content', 'Lí do khác': 'Other reason',
  'Đã gửi báo cáo tới giảng viên kiểm duyệt. Cảm ơn bạn.': 'Report sent to the moderating lecturer. Thank you.', 'Đã gửi báo cáo.': 'Report sent.',
  'Báo cáo vi phạm đang chờ': 'Open reports', 'Báo cáo vi phạm': 'Reports', 'Xử lí trong 24 giờ (6 giờ nếu khẩn cấp). Xoá bài sẽ đóng mọi báo cáo về bài đó.': 'Handle within 24 hours (6 if urgent). Deleting a post closes every report about it.',
  'Không có báo cáo nào đang chờ xử lí.': 'No open reports.', 'Đang tải báo cáo…': 'Loading reports…', 'Bỏ qua': 'Dismiss', 'Đã bỏ qua báo cáo.': 'Report dismissed.', 'Bài viết': 'Post', 'Trả lời': 'Reply',
  'Hãy chọn một lí do báo cáo.': 'Choose a reason for the report.', 'Bài viết không còn tồn tại.': 'The post no longer exists.',
  // interval estimation
  'Ước lượng khoảng': 'Interval estimation', 'Ước lượng': 'Estimate', 'Loại ước lượng': 'Estimate type', 'Các bước ước lượng': 'Estimation steps',
  'Khoảng tin cậy cho trung bình, tỉ lệ, phương sai và cỡ mẫu cần thiết, đi từng bước như slide Bài 5. Tính chính xác bằng máy, không dùng AI, để bạn đối chiếu bài tự làm.': 'Confidence intervals for a mean, a proportion, a variance and the sample size needed, step by step as in the Lesson 5 slides. Computed exactly, no AI, so you can check your own work.',
  'Cỡ mẫu cho trung bình': 'Sample size for a mean', 'Cỡ mẫu cho tỉ lệ': 'Sample size for a proportion', 'Cỡ mẫu tối thiểu (làm tròn lên)': 'Smallest sample size (rounded up)',
  'Tra bảng': 'Table lookup', 'Tỉ lệ f (bỏ trống nếu chưa biết)': 'Proportion f (leave empty if unknown)', 'Tỉ lệ mẫu f = k/n, n ≥ 30: dùng phân phối chuẩn.': 'Sample proportion f = k/n, n ≥ 30: use the normal distribution.',
  'Vùng tin cậy': 'Confidence region', 'Phần tô xanh có diện tích bằng độ tin cậy': 'The blue area equals the confidence level', 'bậc': 'degrees of freedom',
  'chưa biết f nên lấy f = 0,5 (cỡ mẫu lớn nhất)': 'f unknown, so f = 0.5 (the largest sample size)', 'Độ chính xác ε': 'Precision ε', 'Độ tin cậy 1 − α': 'Confidence level 1 − α', 'độ tin cậy': 'confidence',
  'z(α/2) lấy theo bảng giáo trình: 90% → 1,65; 95% → 1,96; 99% → 2,58.': 'z(α/2) follows the textbook table: 90% → 1.65; 95% → 1.96; 99% → 2.58.', 'σ (hoặc s)': 'σ (or s)',
  'Độ tin cậy phải nằm trong (0; 1), ví dụ 0,95.': 'The confidence level must be in (0; 1), e.g. 0.95.', 'Độ chính xác ε phải lớn hơn 0.': 'The precision ε must be greater than 0.',
  'Cần σ (hoặc s) > 0.': 'Needs σ (or s) > 0.', 'Tỉ lệ f phải nằm trong [0; 1].': 'f must be in [0; 1].', 'Cần s² ≥ 0.': 'Needs s² ≥ 0.',
  // distribution calculator
  'Máy tính phân phối': 'Distribution calculator', 'Phân phối': 'Distributions', 'Xác suất cần tính': 'Probability to compute', 'Tham số': 'Parameters',
  'Tính P(X = k) và P(a ≤ X ≤ b) cho phân phối nhị thức, Poisson, siêu bội và chuẩn, kèm kì vọng, phương sai và các xấp xỉ trong giáo trình. Tính chính xác bằng máy, không dùng AI.': 'Compute P(X = k) and P(a ≤ X ≤ b) for the binomial, Poisson, hypergeometric and normal distributions, with mean, variance and the textbook approximations. Computed exactly, no AI.',
  'Nhị thức B(n; p)': 'Binomial B(n; p)', 'Siêu bội H(N; M; n)': 'Hypergeometric H(N; M; n)', 'Chuẩn N(μ; σ²)': 'Normal N(μ; σ²)',
  'Số phép thử n': 'Number of trials n', 'Xác suất thành công p': 'Success probability p', 'Tham số λ': 'Parameter λ', 'Tổng số phần tử N': 'Population size N',
  'Số phần tử có tính chất M': 'Successes in the population M', 'Số phần tử lấy ra n': 'Draws n', 'Kì vọng μ': 'Mean μ', 'Độ lệch chuẩn σ': 'Standard deviation σ',
  'Giá trị k': 'Value k', 'Cận dưới a (bỏ trống: −∞)': 'Lower bound a (empty: −∞)', 'Cận trên b (bỏ trống: +∞)': 'Upper bound b (empty: +∞)',
  'Mốt': 'Mode', 'Giá trị có xác suất lớn nhất (np − q ≤ k₀ ≤ np − q + 1)': 'Most likely value (np − q ≤ k₀ ≤ np − q + 1)', 'Độ lệch chuẩn': 'Standard deviation',
  'Xấp xỉ Poisson': 'Poisson approximation', 'Xấp xỉ chuẩn': 'Normal approximation', 'Xấp xỉ nhị thức': 'Binomial approximation', 'sai lệch': 'error',
  'không hiệu chỉnh ±0,5 như slide': 'no ±0.5 correction, as in the slides', 'cột đỏ là các giá trị được tính': 'red bars are the values computed', 'phần tô xanh là xác suất cần tính': 'the blue area is the probability',
  'Cần a ≤ b.': 'Needs a ≤ b.', 'Hãy nhập số cho a và b, hoặc bỏ trống.': 'Enter numbers for a and b, or leave them empty.', 'Hãy nhập μ.': 'Enter μ.', 'k phải là số nguyên.': 'k must be a whole number.',
  'M phải là số nguyên trong [0; N].': 'M must be a whole number in [0; N].', 'N phải là số nguyên từ 1 đến 100 000.': 'N must be a whole number from 1 to 100,000.',
  'n phải là số nguyên trong [1; N].': 'n must be a whole number in [1; N].', 'n phải là số nguyên từ 1 đến 100 000.': 'n must be a whole number from 1 to 100,000.',
  'p phải nằm trong [0; 1].': 'p must be in [0; 1].', 'λ phải lớn hơn 0 (tối đa 1000).': 'λ must be greater than 0 (at most 1000).', 'σ phải lớn hơn 0.': 'σ must be greater than 0.',
  // theme
  'Chuyển sang giao diện tối': 'Switch to dark mode', 'Chuyển sang giao diện sáng': 'Switch to light mode',
  // formula export
  'Tải công thức về máy': 'Download the formulas', 'Tải Word (.doc)': 'Download Word (.doc)', 'Xuất PDF': 'Export PDF',
  'Tải về mọi công thức gia sư đã viết ở trên. PDF: chọn «Lưu thành PDF» trong hộp thoại in.': 'Download every formula the tutor wrote above. PDF: choose «Save as PDF» in the print dialog.',
  'Công thức đã đọc · AI Classroom': 'Formulas read · AI Classroom', 'Chưa có công thức nào để xuất.': 'There are no formulas to export yet.',
  'Trình duyệt đã chặn cửa sổ mới. Hãy cho phép cửa sổ bật lên rồi bấm lại.': 'The browser blocked the new window. Allow pop-ups, then press again.',
  // camera capture
  'Chụp bằng camera': 'Take a photo', 'Không mở được camera trong trang. Bấm lại nút để mở ứng dụng camera của máy.': 'Couldn\'t open the camera in the page. Press the button again to open your device\'s camera app.', 'Không mở được camera trong trang, chuyển sang ứng dụng camera của máy.': 'Couldn\'t open the camera in the page; switching to your device\'s camera app.', 'Chụp': 'Capture', 'Chụp lại': 'Retake', 'Dùng ảnh': 'Use photo', 'Xong': 'Done',
  'Kéo 4 góc vào mép tờ giấy để làm phẳng ảnh.': "Drag the 4 corners to the paper's edges to flatten the photo.", 'Chọn camera': 'Choose camera',
  'Hình từ camera': 'Camera view', 'Bật lại': 'Turn on again', 'Camera đã tắt khi bạn rời tab. Bấm Bật lại.': 'The camera turned off when you left the tab. Press Turn on again.',
  'Góc trên trái': 'Top-left corner', 'Góc trên phải': 'Top-right corner', 'Góc dưới phải': 'Bottom-right corner', 'Góc dưới trái': 'Bottom-left corner',
  'Bỏ ảnh này': 'Remove this photo', 'Không bật được camera này.': "Couldn't turn on this camera.",
});

const RULES = [
  [/^Dòng (\d+): «(.+)» không phải là số\.$/, 'Row $1: «$2» is not a number.'], [/^Dòng (\d+): chưa có giá trị\.$/, 'Row $1: no value yet.'],
  [/^Dòng (\d+): tần số phải là số nguyên ≥ 0\.$/, 'Row $1: the frequency must be a whole number ≥ 0.'], [/^«(.+)» không phải là số\.$/, '«$1» is not a number.'],
  [/^Giá trị dòng (\d+)$/, 'Value, row $1'], [/^Tần số dòng (\d+)$/, 'Frequency, row $1'], [/^Giảm tần số dòng (\d+)$/, 'Lower frequency, row $1'],
  [/^Tăng tần số dòng (\d+)$/, 'Raise frequency, row $1'], [/^Xoá dòng (\d+)$/, 'Delete row $1'],
  [/^Xong bước (\d+)!$/, 'Step $1 done!'], [/^Tiếp theo: (.+)$/, (m, x) => `Next: ${DICT[x] || x}`], [/^Thạo cả (\d+) chủ đề$/, 'All $1 topics mastered'],
  [/^Đang mở (\d+) nhánh con · bấm lần nữa để thu gọn$/, '$1 branches open · tap again to close'], [/^Có (\d+) nhánh con · bấm để mở$/, '$1 branches · tap to open'],
  [/^Máy chủ lỗi \((\d+)\)\.$/,'Server error ($1).'],
  [/^Bước (\d+)\. (.+)$/, (m, n, x) => `Step ${n}. ${DICT[x] || x}`], [/^← Bước (\d+): (.+)$/, (m, n, x) => `← Step ${n}: ${DICT[x] || x}`],
  [/^(\d+) phiên đã ghi · (\d+) phiên dưới 5 điểm$/, '$1 sessions recorded · $2 below 5 points'],
  [/^(\d+) phiên · (\d+) phiên dưới 5 điểm · điểm TB (.+)$/, '$1 sessions · $2 below 5 points · average $3'],
  [/^Trung bình của (\d+) phiên có chấm điểm\.$/, 'Average of $1 graded sessions.'], [/^Nhiều nhất: (.+)$/, (m, x) => `Most frequent: ${DICT[x] || x}`],
  [/^Đã chụp (\d+)\/(\d+)$/, 'Taken $1/$2'],
  [/^Câu (\d+)$/, 'Question $1'], [/^Bước (\d+)$/, 'Step $1'], [/^← Bước (\d+)$/, '← Step $1'], [/^Thử lại sau (\d+)s$/, 'Retry in $1s'],
  [/^Bước (\d+): (.+) →$/, (m, n, s) => `Step ${n}: ${DICT[s] || s} →`], [/^Tiếp: (.+) →$/, (m, s) => `Next: ${DICT[s] || s} →`], [/^← (.+)$/, (m, s) => (DICT[s] ? `← ${DICT[s]}` : m)],
  [/^Chưa đúng · đáp án ([A-D?])$/, 'Wrong · answer $1'], [/^(\d+) trả lời$/, '$1 replies'], [/^MÃ HỒ SƠ (.+)$/, 'PROFILE $1'],
  [/^Đúng (\d+)\/(\d+) · (.+)$/, (m, a, b, s) => `Correct ${a}/${b} · ${DICT[s] || s}`],
  [/^Đã chọn ([A-D])\. Bạn vẫn đổi được cho đến khi hết giờ\.$/, 'You picked $1. You can still change it until time runs out.'],
  [/^Còn 10 giây\. (.+)$/, (m, s) => `10 seconds left. ${t(s)}`], [/^Chưa chọn · đáp án ([A-D])$/, 'Not answered · answer $1'],
  [/^(\d+)\/(\d+) câu đúng · Độ khó (.+)\. Đã lưu vào hồ sơ\.$/, (m, a, b, s) => `${a}/${b} correct · ${DICT[s] || s}. Saved to your profile.`],
  [/^Bạn trả lời đúng (\d+)\/(\d+) câu\.$/, 'You answered $1/$2 correctly.'], [/^Đang soạn bộ (\d+) câu hỏi và lời giải…$/, 'Writing a set of $1 questions and explanations…'],
  [/^(\d+) câu · (\d+) giây mỗi câu\. Trong lúc đếm ngược bạn có thể đổi đáp án\.$/, '$1 questions · $2 seconds each. You can change your answer while the clock runs.'],
  [/^Nhập sai quá nhiều lần\. Thử lại sau (\d+) phút\.$/, 'Too many wrong tries. Try again in $1 minutes.'],
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
