# XSTK·AI — Gia sư AI môn Xác suất Thống kê

Web tĩnh (HTML/CSS/JS, không cần build) chạy trên **Cloudflare Workers (miễn phí)**. Worker làm proxy tới **Gemini `gemini-3.5-flash-lite`**: API key chỉ nằm ở server (lấy từ GitHub Secret), trình duyệt không bao giờ thấy key.

## Tính năng

| Màn hình | Nội dung |
|---|---|
| **Gia sư chấm bài** | Tải ảnh/PDF bài làm (Gemini đọc chữ – OCR). Nút **Chiến lược giải** (không lộ đáp án), **Chấm điểm** (chỉ chấm bài của bạn, theo từng bước), **Lời giải chi tiết** (4 bước Polya). |
| **Luyện tập** | Nút **Tạo 5 câu trắc nghiệm** / **Tạo 5 câu tự luận** theo chủ đề và mức độ. Mỗi câu có **Chiến lược**, **Chấm bài**, **Xem lời giải**. |
| **Vấn đáp** | AI hỏi lí thuyết theo Trải nghiệm → Hình thành → Củng cố → Vận dụng, chấm từng câu trả lời, tổng kết lỗ hổng kiến thức và sai lầm. |
| **Bản đồ tư duy** | Bản đồ toàn môn có sẵn + AI vẽ bản đồ theo chủ đề. Bấm nút để thu/mở nhánh, kéo, phóng to. Hiển thị đầy đủ dấu tiếng Việt và công thức. |
| **Hồ sơ học tập** | Nút **Hồ sơ của tôi** ở mọi trang. Thống kê điểm, loại lỗi, chủ đề yếu; AI phân tích lỗi lặp lại và đề xuất lộ trình 2 tuần. Xuất/nhập hồ sơ để mang sang máy khác. |

Mọi ô nhập văn bản đều có **thanh kí hiệu toán học** (phân số, tổ hợp, $P(A\mid B)$, $\bar x$, chữ Hy Lạp…) và xem trước công thức bằng KaTeX. Các ví dụ có **biểu đồ minh hoạ** (nhị thức, Poisson, chuẩn có tô vùng, Venn, biểu đồ cột) và **bảng Galton** động.

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
