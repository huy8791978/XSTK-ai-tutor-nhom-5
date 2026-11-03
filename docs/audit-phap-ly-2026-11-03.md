# Rà soát pháp lý: AI Classroom (xstk-ai.nqhuyalt.workers.dev), 03/11/2026

**Kết quả quét:** mức 1 (thu thập nhẹ), kèm 3 yếu tố làm tăng nghĩa vụ:

- Có AI: mọi câu hỏi, ảnh/PDF/Word bài làm và giọng nói đều gửi tới Google Gemini (`worker/index.js:221`, `worker/index.js:233`, `worker/live.js:9`).
- Dữ liệu xử lý ở nước ngoài: Google Gemini, và Cloudflare Workers (`wrangler.toml`, `.github/workflows/deploy.yml`).
- Có nội dung người dùng đăng công khai: Diễn đàn XSTK, lưu bài trên máy chủ (`worker/index.js`, class `Forum`).

Những gì **không** có:

- Không có giỏ hàng hay thanh toán. Script quét báo «TMĐT» là bắt nhầm: chữ `/checkout` nằm trong `actions/checkout` của tệp CI, không phải trang mua hàng.
- Không có Google Analytics, Pixel hay script theo dõi nào.
- Không có đăng kí/đăng nhập. Chỉ giảng viên nhập một mật khẩu kiểm duyệt.
- Hồ sơ học tập, ngôn ngữ, giọng đọc chỉ lưu trong `localStorage` trên trình duyệt người dùng.

**Áp dụng:**

- Bảo vệ dữ liệu cá nhân: mục A, B, C và D (chuyển dữ liệu ra nước ngoài).
- Minh bạch AI.
- An ninh mạng: chỉ mục E (nội dung do người dùng đăng).

**Không áp dụng:**

- Thương mại điện tử, bảo vệ người tiêu dùng, giao dịch điện tử: không bán hàng, không có hợp đồng.
- Quảng cáo: không có quảng cáo.
- Ứng dụng di động: đây là website.
- Mục E checklist dữ liệu cá nhân (DPIA, chỉ định nhân sự bảo vệ dữ liệu): đây là dự án nhóm sinh viên, chưa rõ có thuộc diện điều chỉnh không (xem ghi chú cuối bảng).

| Mức | Mục | Phát hiện | Căn cứ | Đề xuất |
|---|---|---|---|---|
| 🔴 | DLCN-A. Chính sách | Không có trang chính sách bảo vệ dữ liệu cá nhân. Người dùng không được biết những điều sau: ảnh bài làm, giọng nói và câu hỏi được gửi tới Google; bài diễn đàn được lưu trên máy chủ; thời gian lưu; quyền của họ; liên hệ ai để thực hiện quyền. | Luật 91/2025/QH15 (Điều 4 khoản 1 về quyền chủ thể dữ liệu), NĐ 356/2025/NĐ-CP (Điều 5 về thời hạn phản hồi) | Thêm trang «Chính sách dữ liệu», đặt link ở footer. Trang cần nêu: loại dữ liệu, mục đích, bên nhận (Google, Cloudflare), thời gian lưu, quyền xem/xoá, email liên hệ. |
| 🔴 | DLCN-D. Chuyển ra nước ngoài | Toàn bộ nội dung học tập gửi tới Google Gemini, là «dùng nền tảng ở nước ngoài để xử lý dữ liệu». Ảnh bài làm có thể chứa họ tên, MSSV, chữ viết tay. Ghi âm giọng nói cũng được gửi đi. Bài diễn đàn lưu trên Cloudflare. Chưa có hồ sơ đánh giá tác động chuyển dữ liệu xuyên biên giới. | Luật 91/2025/QH15 (Điều 20 khoản 2, hồ sơ trong 60 ngày kể từ lần chuyển đầu tiên; khoản 6 về các trường hợp miễn), NĐ 356/2025/NĐ-CP (Điều 18, Mẫu 09) | Hỏi luật sư hoặc giảng viên xem dự án có thuộc diện phải lập hồ sơ không, hay được miễn theo khoản 6 Điều 20. Trong lúc chờ, giảm dữ liệu gửi đi: nhắc người dùng che họ tên/MSSV trước khi chụp bài. |
| 🔴 | DLCN-D. Điều khoản Gemini | Chưa xác định được khoá Gemini là gói miễn phí hay trả phí. Với gói miễn phí, theo điều khoản của Google (cần kiểm tra lại), Google có thể dùng nội dung gửi vào để cải thiện sản phẩm, và người của Google có thể đọc. Dữ liệu của sinh viên khi đó được dùng cho mục đích ngoài việc chấm bài. | Luật 91/2025/QH15 (Điều 9: đồng ý theo từng mục đích) | Kiểm tra gói dịch vụ trong Google AI Studio. Nếu là gói miễn phí: chuyển sang gói trả phí, hoặc ghi rõ việc này trong chính sách và xin đồng ý. |
| 🟡 | DLCN-B. Đồng ý | Không có thông báo hay xin đồng ý trước khi gửi ảnh, tệp hay giọng nói. Trình duyệt chỉ xin quyền micro, không nói dữ liệu đi đâu. | Luật 91/2025/QH15 (Điều 9; khoản 4 điểm d: im lặng không phải là đồng ý) | Lần đầu tải tệp hoặc bật micro, hiện một hộp ngắn: «Nội dung sẽ được gửi tới Google Gemini để AI xử lý», kèm nút Đồng ý / Không. Ô không được tích sẵn. Lưu lựa chọn và thời điểm vào `localStorage`. |
| 🟡 | DLCN-A. Quyền xoá dữ liệu | Diễn đàn: tác giả chỉ xoá được bài khi còn mã xoá trong đúng trình duyệt đã đăng. Đổi máy là mất quyền xoá, và trang không có kênh nào để xin xoá. | NĐ 356/2025/NĐ-CP (Điều 5 khoản 4: xoá trong 20 ngày) | Ghi trong chính sách một email nhận yêu cầu xoá bài. Giảng viên kiểm duyệt đã xoá được mọi bài. |
| 🟡 | DLCN. Nhật kí máy chủ | `wrangler.toml` bật lưu nhật kí (`persist = true`). Khi AI trả kết quả không đọc được, `worker/index.js:71` ghi một đoạn kết quả đó vào nhật kí. Đoạn này có thể chứa chữ đọc từ ảnh bài làm của sinh viên. | Luật 91/2025/QH15 (Điều 9: không xử lý vượt mục đích) | Bỏ đoạn văn bản khỏi nhật kí, chỉ giữ độ dài và mã lỗi. Nêu trong chính sách rằng nhật kí lưu trên Cloudflare và lưu bao lâu. |
| 🟡 | ANM-E. Nội dung diễn đàn | Đã có giảng viên kiểm duyệt xoá được bài, giới hạn số bài mỗi IP, và lời nhắc không đăng thông tin cá nhân. Nhưng người dùng không có cách báo cáo bài vi phạm, và chưa có quy trình gỡ bài trong 24 giờ khi có yêu cầu (06 giờ nếu khẩn cấp). | Luật 116/2025/QH15 (Điều 7, Điều 25 khoản 2 điểm b) | Thêm nút «Báo cáo» trên mỗi bài, gửi về giảng viên. Ghi email liên hệ gỡ bài trong chính sách. |
| 🟢 | DLCN-C. Theo dõi | Không có cookie theo dõi hay script analytics. `localStorage` chỉ lưu cài đặt và hồ sơ trên máy người dùng. | Luật 91/2025/QH15 | Giữ như hiện tại. Nếu sau này gắn analytics thì phải thêm banner xin đồng ý. |
| 🟢 | DLCN-A. Hồ sơ học tập | Hồ sơ chỉ nằm trên trình duyệt. Người dùng tự xuất, nhập và xoá được (`public/js/views/profile.js`). | Luật 91/2025/QH15 (Điều 4) | Nêu điều này trong chính sách: đây là điểm cộng. |
| 🟢 | AI-B, C. Minh bạch AI | Tên trang và tên các chức năng đều ghi «AI». Footer cảnh báo nội dung do AI tạo và có thể sai. Robot là hình hoạt hình, không giả làm người thật. | Luật 134/2025/QH15 (Điều 11 khoản 1, 3) | Giữ cảnh báo ở footer. Nên ghi thêm «Trợ lý AI» ở khung trò chuyện giọng nói. |
| 🟡 | AI-A, E. Vai trò và thời hạn | Trang gọi API Gemini, nên nếu thuộc diện điều chỉnh thì đóng vai «bên triển khai». Đây là sản phẩm giáo dục: nếu thuộc diện điều chỉnh thì có 18 tháng chuyển tiếp từ 01/03/2026, tức đến khoảng 01/09/2027. Nếu chỉ là bài tập phi thương mại thì có thể không thuộc diện điều chỉnh. Tiêu chí phân loại rủi ro: CHƯA XÁC MINH. | Luật 134/2025/QH15 (Điều 9, Điều 35), NĐ 142/2026/NĐ-CP (Điều 18) | Hỏi giảng viên hoặc luật sư về tư cách của dự án. AI chấm điểm cho sinh viên có thể bị xem xét kĩ hơn nếu kết quả dùng để đánh giá chính thức. |

**Ghi chú về quy mô chủ site:** đây có vẻ là dự án nhóm sinh viên (repo `XSTK-ai-tutor-nhom-5`).

- Điều 38 Luật 91/2025 miễn một số nghĩa vụ cho hộ kinh doanh và doanh nghiệp siêu nhỏ, nhưng không nói tới cá nhân. Site cá nhân có thuộc diện điều chỉnh hay không: CHƯA XÁC MINH.
- Kể cả được miễn, nghĩa vụ ở mục D (chuyển dữ liệu ra nước ngoài, khoản 2 Điều 20) vẫn không được miễn.
- Mục E (DPIA, chỉ định nhân sự bảo vệ dữ liệu) chỉ áp dụng nếu dự án không thuộc diện miễn trừ ở khoản 3 Điều 38.

**Mức phạt tham khảo (cho các mục 🔴):** theo Điều 8 Luật 91/2025, vi phạm về chuyển dữ liệu xuyên biên giới bị phạt tối đa 5% doanh thu năm liền trước; các vi phạm khác tối đa 3 tỷ đồng (mức áp dụng cho tổ chức). Nghị định xử phạt chi tiết là NĐ 330/2026/NĐ-CP. Đây là mức tối đa theo quy định tham khảo được, không phải mức dự án sẽ bị phạt.

**Việc nên làm trước (rẻ nhất, giảm rủi ro nhiều nhất):**
1. Kiểm tra gói khoá Gemini (miễn phí hay trả phí).
2. Thêm trang «Chính sách dữ liệu» và link ở footer.
3. Thêm hộp thông báo một lần trước khi gửi ảnh hoặc giọng nói.
4. Bỏ đoạn văn bản AI khỏi nhật kí ở `worker/index.js:71`.

## Cập nhật sau khi sửa (03/11/2026)

Chủ site xác nhận: dự án hoàn toàn phi lợi nhuận. Khoá Gemini hiện là khoá cá nhân của người vận hành; việc giữ khoá này hay cho người dùng tự nhập khoá sẽ quyết định khi công khai rộng.

- Phi lợi nhuận **không** miễn nghĩa vụ theo Luật 91/2025: luật áp dụng cho mọi bên xử lý dữ liệu cá nhân, không phân biệt có thu tiền hay không. Mục D (chuyển dữ liệu ra nước ngoài) vẫn giữ nguyên.
- Luật 134/2025 loại trừ việc dùng AI «cho mục đích cá nhân, phi thương mại». Trang này phi thương mại nhưng phục vụ người khác, nên có thuộc trường hợp loại trừ hay không: CHƯA XÁC MINH, cần hỏi người làm luật.
- Nếu sau này người dùng tự nhập khoá Gemini: dữ liệu khi đó do người dùng tự gửi cho Google bằng tài khoản của họ, nhưng trang vẫn chuyển tiếp qua máy chủ, nên chính sách phải viết lại. Tăng `POLICY_VERSION` trong `public/js/consent.js` để trang tự hỏi lại sự đồng ý.

| Trạng thái | Mục | Đã làm |
|---|---|---|
| 🟢 (bản nháp) | DLCN-A. Chính sách | `public/chinh-sach.html`: dữ liệu, bên nhận (Google Gemini, Cloudflare, Google Fonts, jsDelivr), nơi lưu, quyền và thời hạn theo NĐ 356/2025, cookie/localStorage. Còn chỗ [ĐIỀN]/[KIỂM TRA]. |
| 🟢 | DLCN-B. Đồng ý | `public/js/consent.js`: hỏi một lần trước khi gửi gì cho AI, hai nút như nhau, lưu phiên bản và thời điểm, rút lại được. |
| 🟢 | DLCN. Nhật kí | `worker/index.js` không còn ghi nội dung trả lời của AI. |
| 🟢 (bản nháp) | Điều khoản sử dụng | `public/dieu-khoan.html`: phi lợi nhuận, không hoàn tiền vì miễn phí, AI có thể sai, quy tắc diễn đàn, tài nguyên và bản quyền. |
| 🟢 | Tiếp cận (a11y) | Sửa 2 chỗ màu chưa đủ tương phản (số bước chưa làm 1,64:1 → 6,03:1; dấu «Đã xong» 3,39:1 → 6,11:1). Ảnh đều có `alt`; hộp đồng ý dùng `<dialog>`, dùng được bằng bàn phím. |
| 🟢 | Đánh giá giả, khẳng định không có căn cứ | Không thấy. |
| 🔴 còn lại | DLCN-D. Hồ sơ chuyển dữ liệu ra nước ngoài | Chưa lập, cần hỏi người làm luật. |
| 🟢 | Gói khoá Gemini | Gói trả phí: Google không dùng nội dung để cải thiện sản phẩm, chỉ lưu nhật kí có thời hạn để chống lạm dụng. Đã ghi vào chính sách. Nhật kí Cloudflare gói Free lưu 3 ngày. Mốc gỡ bài 24 giờ / 6 giờ khẩn cấp đã ghi vào chính sách và điều khoản. |
| 🟡 còn lại | ANM-E. Báo cáo bài vi phạm | Hiện chỉ qua email; chưa có nút báo cáo. |

## Giới hạn & khuyến nghị

> Báo cáo này do AI tạo dựa trên bộ checklist tổng hợp từ văn bản pháp luật công khai, **không phải ý kiến tư vấn pháp lý chính thức**. Khung pháp lý Việt Nam về dữ liệu cá nhân, thương mại điện tử và an ninh mạng vừa thay đổi lớn trong 2025-2026. Số điều trích dẫn lấy từ nguồn thứ cấp, chưa đối chiếu với Công báo. Trước khi quyết định, hãy xác minh lại từng văn bản tại thuvienphapluat.vn hoặc vbpl.vn, và tham vấn luật sư, nhất là với các mục 🔴.
>
> Những điểm chưa kiểm tra được:
> - Gói dịch vụ thực tế của khoá Gemini.
> - Thời gian Cloudflare lưu nhật kí.
> - Máy chủ Gemini và Cloudflare xử lý dữ liệu ở quốc gia nào.
> - Tư cách pháp lý của nhóm chủ site.
