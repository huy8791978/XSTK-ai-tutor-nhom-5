# Chụp bài bằng camera — thiết kế ngắn

## Mục đích
Học sinh chụp bài viết tay ngay trên trang (Chấm bài, Tự luận, Trắc nghiệm, Hỏi đáp công thức) thay vì chụp bằng ứng dụng khác rồi tải tệp lên. Dùng được với webcam laptop, camera không dây mà máy nhận là webcam (Bluetooth, DroidCam, Camo) và camera sau của điện thoại. Không cần Face ID hay LiDAR.

## Mục tiêu
- Nút «Chụp bằng camera» trong mọi ô tải tệp (`uploader()` ở `public/js/uploader.js`), cạnh vùng kéo thả.
- Hộp chụp: xem trực tiếp, chọn camera khi máy có nhiều camera, chụp liên tiếp nhiều trang, xem lại và xoá từng ảnh, bấm «Dùng các ảnh này».
- Sau mỗi lần chụp, kéo 4 góc tờ giấy để làm phẳng ảnh chụp nghiêng (biến đổi phối cảnh trên canvas). Mặc định chọn cả khung hình, nên ai không cần thì bấm qua.
- Ảnh đi vào luồng hiện có qua `add(files)`: thu nhỏ, OCR, chấm điểm không đổi.

## Không làm
- Không tự nhận diện mép giấy (cần OpenCV.js khoảng 8 MB, quá nặng cho điện thoại yếu). Có thể làm sau.
- Không đọc camera IP hoặc RTSP.
- Không lưu ảnh lên máy chủ ngoài lần gửi chấm như hiện nay.
- Không làm điểm danh (để làm riêng sau).

## Cách làm đã cân nhắc
1. **Thẻ `<input capture="environment">`:** điện thoại mở ứng dụng camera có sẵn. Rất ít mã, nhưng máy tính bỏ qua thẻ này nên webcam và camera không dây không dùng được, mỗi lần chỉ chụp 1 ảnh, và không có bước làm phẳng.
2. **Hộp chụp trong trang (`getUserMedia`) — đã chọn.** Chạy trên mọi camera mà trình duyệt thấy, có chọn camera, chụp nhiều trang và làm phẳng ảnh. Nhiều mã hơn (một module mới), cần HTTPS (Cloudflare đã có) và quyền truy cập camera.
3. **OpenCV.js tự cắt giấy:** đẹp nhất nhưng nặng, chậm trên máy yếu. Bỏ.

Trình duyệt không có `getUserMedia` hoặc người dùng từ chối quyền thì quay về cách 1.

## Ràng buộc
- Giữ giới hạn 3 tệp mỗi ô: hộp chụp chỉ cho chụp số ảnh còn trống. **Người dựng tự quyết:** nếu cần nhiều trang hơn, ghép thành một PDF là việc khác.
- Tắt camera (`track.stop()`) khi đóng hộp, khi đổi trang và khi tab bị ẩn.
- Phím tắt: Space hoặc Enter để chụp, Esc để đóng. Nút cao tối thiểu 44px. Có văn bản thay thế cho xem trực tiếp. Tôn trọng chế độ giảm chuyển động. Theo DESIGN.md (4 màu mực, góc 4px, đường kẻ mảnh) ở cả chế độ sáng lẫn tối.
- Chuỗi EN/VI thêm vào i18n.
- Chính sách dữ liệu thêm 1 dòng: ảnh camera chỉ nằm trên máy cho tới khi bấm chấm.

## Phần để người dựng quyết
Bố cục hộp chụp, cách vẽ tay nắm 4 góc, chất lượng JPEG (theo `shrink()` hiện có).

## Kiểm thử
- Test node cho phần tính toán: phép biến đổi phối cảnh (4 góc thành hình chữ nhật, kiểm tra điểm ánh xạ đúng) và tính số ảnh còn được chụp.
- Kiểm tra bằng trình duyệt: xin quyền, chọn camera, chụp, làm phẳng, chấm. Dùng camera giả của trình duyệt.
