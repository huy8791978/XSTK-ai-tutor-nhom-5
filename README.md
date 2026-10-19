# XSTK·AI — Gia sư AI môn Xác suất Thống kê

Web tĩnh (HTML/CSS/JS, không cần build) chạy trên **Cloudflare Workers (miễn phí)**. Worker làm proxy tới **Gemini `gemini-3.5-flash-lite`**: API key chỉ nằm ở server (lấy từ GitHub Secret), trình duyệt không bao giờ thấy key.

## Tính năng

| Mục trên menu | Nội dung |
|---|---|
| **Gia sư chấm bài** | Bài làm bằng ảnh, PDF hoặc **viết tay trên bảng (iPad / Apple Pencil)**. Nút **Cập nhật barem điểm** để AI chấm đúng barem của giáo viên. Nút **Chiến lược giải** (không lộ đáp án), **Chấm điểm**, **Lời giải chi tiết**. |
| **Học lí thuyết** | Một khái niệm qua 4 bước: Trải nghiệm → Hình thành định nghĩa → Củng cố (có chấm) → Vận dụng. |
| **Học định lí** | Trải nghiệm để dự đoán → Hình thành định lí (giả thiết, kết luận, luận cứ, chứng minh, cấu trúc logic) → Củng cố → Vận dụng. |
| **Bài tập tự luận** | Tạo ngẫu nhiên 5 bài (hoặc 5 bài tương tự một bài mẫu). Mỗi bài có **4 nút bước giải toán**: Tìm hiểu đề → Chương trình giải → Trình bày (chấm bài, viết bảng) → Kiểm tra & nghiên cứu (lời giải, bài tương tự). |
| **Bài tập trắc nghiệm** | 5 câu, chấm ngay. Cũng đi qua 4 bước giải toán; nút **Hỏi AI: vì sao?** để hỏi lại đáp án. |
| **Vấn đáp** | Hỏi lí thuyết theo 4 giai đoạn, chấm từng câu, tổng kết lỗ hổng kiến thức và sai lầm. |
| **Hỏi đáp giọng nói** | Bấm micro, hỏi bằng giọng nói; AI trả lời bằng chữ và đọc thành tiếng. Bài nhiều công thức thì viết lên bảng. Nếu không nghe rõ / chưa hiểu, AI nói và hiện: *"Vì tôi nghe không rõ, nghe được hoặc chưa hiểu rõ ý của bạn, bạn hãy nhập đề bài hoặc đáp án hoặc câu trả lời của bạn dưới đây."* rồi đưa bạn tới ô nhập. Mọi ô nhập khác cũng có nút **Nói** để đọc chính tả. |
| **Thống kê lỗi sai** | Thống kê câu sai theo vấn đáp, trắc nghiệm, tự luận, chấm bài…; lọc theo từng mục; AI nhận định chung và hướng khắc phục. |
| **Bản đồ tư duy** | Bản đồ toàn môn + AI vẽ theo chủ đề; thu/mở nhánh, kéo, phóng to. |
| **Diễn đàn XSTK** | Đăng câu hỏi, trả lời, lọc theo chủ đề, gõ công thức; người viết xoá được bài của mình. Lưu trên server (Durable Object, miễn phí). |
| **Hồ sơ học tập** | Điểm, nhật kí, AI đề xuất lộ trình 2 tuần; xuất/nhập hồ sơ. |

Nút **EN / VI** ở góc trên đổi toàn bộ giao diện sang tiếng Anh, và AI trả lời bằng tiếng Anh.

Mọi ô nhập văn bản đều có nút **Nhập công thức**: mở bàn phím toán (MathLive) với trang **XSTK** gồm các mẫu P(A|B), E(X), D(X), tổ hợp, chỉnh hợp, phân số, mũ, căn, tổng, tích phân, x̄, chữ Hy Lạp…; bấm mẫu rồi chỉ cần điền giá trị vào các ô, bấm **Chèn vào bài**. Lời giải có thêm khung **Bấm máy CASIO fx-580VN X** từng bước. Chân trang luôn nhắc: nội dung do AI tạo, cần đối chiếu đề cương hoặc hỏi giáo viên. Các ví dụ có **biểu đồ minh hoạ** (nhị thức, Poisson, chuẩn có tô vùng, Venn, biểu đồ cột) và **bảng Galton** động.

## Triển khai (khoảng 10 phút)

1. **Đưa code lên GitHub**: tạo repo mới, rồi chạy:
   ```bash
   git init && git add . && git commit -m "XSTK AI" && git branch -M main && git remote add origin https://github.com/<ban>/<repo>.git && git push -u origin main
   ```
2. **Tạo tài khoản Cloudflare** (miễn phí) tại https://dash.cloudflare.com.
   - *My Profile → API Tokens → Create Token →* mẫu **Edit Cloudflare Workers** → tạo và chép token.
   - Chép **Account ID** (trang Workers & Pages, cột phải).
3. **Lấy Gemini API key** tại https://aistudio.google.com/apikey.
4. **Thêm 3 secret** ở GitHub repo → *Settings → Secrets and variables → Actions → New repository secret*:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `GEMINI_API_KEY`
5. Vào tab **Actions** → chạy workflow *Test & Deploy* (hoặc push lên `main`). Workflow chạy test, deploy, và đẩy `GEMINI_API_KEY` vào Worker dưới dạng secret mã hoá.
6. Trang chạy tại `https://xstk-ai.<subdomain>.workers.dev`.

### Đổi tên miền
- **Tên miền riêng**: Cloudflare → *Workers & Pages → xstk-ai → Settings → Domains & Routes → Add → Custom domain*. Tên miền phải dùng DNS của Cloudflare (thêm site miễn phí, đổi nameserver ở nhà đăng kí).
- **Đổi đuôi workers.dev**: sửa `name = "xstk-ai"` trong `wrangler.toml` rồi push.

## Giới hạn tần suất (nhiều người dùng cùng lúc)

Mọi yêu cầu đi qua **một Durable Object toàn cục**, nên các giới hạn là chính xác cho cả hệ thống:

| Biến (`wrangler.toml` → `[vars]`) | Mặc định | Ý nghĩa |
|---|---|---|
| `LIMIT_RPM` | 14 | Yêu cầu/phút cho toàn hệ thống |
| `LIMIT_TPM` | 225000 | Token/phút (ước tính trước, hiệu chỉnh theo số token thật Gemini trả về) |
| `LIMIT_RPD` | 900 | Yêu cầu/ngày (đặt lại lúc 0h giờ Thái Bình Dương, giống Google) |
| `LIMIT_PER_IP_RPM` | 6 | Yêu cầu/phút cho mỗi người (IP), để một người không chiếm hết lượt |
| `FORUM_PER_IP_RPM` | 5 | Số bài/trả lời mỗi người được đăng mỗi phút trên diễn đàn |

Khi vượt giới hạn, người dùng thấy thông báo tiếng Việt và nút tự đếm ngược tới lúc thử lại. Đặt các số này thấp hơn khoảng 10% so với hạn mức của dự án trong Google AI Studio (*Usage & limits*), vì hạn mức free tier thay đổi theo model và theo thời gian. Đổi model bằng biến `GEMINI_MODEL`.

## Bảo mật

- Key chỉ tồn tại trong GitHub Secret và Worker secret; không có trong mã nguồn hay trình duyệt.
- Trình duyệt chỉ gửi **tên tác vụ + dữ liệu**; prompt được dựng ở server, nên không thể dùng key như chatbot tuỳ ý.
- Proxy từ chối yêu cầu từ trang khác (kiểm tra `Origin`), giới hạn kích thước tệp (ảnh/PDF ≤ 10 MB, tối đa 3 tệp).
- Hồ sơ học tập chỉ lưu trong trình duyệt (localStorage) của người dùng.

## Phát triển cục bộ

```bash
npm install
```
```bash
echo GEMINI_API_KEY=your-key > .dev.vars
```
```bash
npx wrangler dev
```
Chạy test: `npm test` (Node 20+). Không có Node: phục vụ thư mục gốc bằng bất kì web server tĩnh nào và mở `/tests/browser.html`.

## Cấu trúc

```
public/            giao diện (index.html, css/, js/, js/views/)
worker/index.js    proxy Gemini + Durable Object giới hạn tần suất
worker/limits.js   logic RPM/TPM/RPD (thuần, có test)
worker/prompts.js  prompt theo quy trình sư phạm (Polya; Trải nghiệm → Vận dụng)
tests/             test node:test (+ trình chạy trên trình duyệt)
.github/workflows/deploy.yml   test + deploy khi push main
```
