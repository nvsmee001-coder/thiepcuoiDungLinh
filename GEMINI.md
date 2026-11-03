# Workspace Guidelines: Thiep-cuoi

## Autonomous Execution & Direct Code Editing
- **Tự động áp dụng chỉnh sửa:** Khi người dùng yêu cầu sửa đổi, tối ưu hay thêm tính năng mới cho HTML, CSS, JS trong dự án này, Agent luôn **chủ động chỉnh sửa trực tiếp** vào mã nguồn (`edit_file`, `write_file`), không hỏi lại hay dừng lại chờ xác nhận ở từng bước nhỏ.
- **Hoàn thành trọn vẹn:** Tự động thực hiện toàn bộ quy trình từ kiểm tra, chỉnh sửa đến hoàn tất, sau đó tóm tắt ngắn gọn những gì đã thay đổi để người dùng chuyển tab về là có thể refresh (`F5`) xem ngay kết quả trên trình duyệt.
- **Không tự ý push Git:** Mọi chỉnh sửa chỉ thực hiện cục bộ trong thư mục làm việc để người dùng xem trước và kiểm tra qua trình duyệt (localhost). Tuyệt đối **KHÔNG tự ý `git commit` hoặc `git push`** lên remote/VPS trừ khi người dùng yêu cầu rõ ràng.
- **Phạm vi áp dụng:** Quy tắc này chỉ có hiệu lực cục bộ trong thư mục `d:\Thiep-cuoi`, không làm ảnh hưởng đến các dự án khác của người dùng.

## Human-Crafted UI (Loại Bỏ Dấu Vết & Rác Trang Trí Của AI)
- **Tuyệt đối không chèn ký tự trang trí Unicode:** Không dùng các icon `❖`, `✦`, `✧`, `⚡`, `✨`, con rô, ngôi sao vào nhãn nút bấm, thẻ hay tiêu đề.
- **Không tự ý thêm mũi tên chéo `↗` hoặc `→`:** Loại bỏ mũi tên chéo ở các nút như "Xác nhận tham dự", "Mở thiệp mời", v.v. Chỉ dùng typography, font weight và màu sắc.
- **Không đánh số máy móc:** Không tự động thêm số thứ tự `01`, `02` vào các thẻ chọn hay nút (như `01 Nhà Trai`, `02 Nhà Gái`).
- **Không thêm watermark/badge mẫu:** Không hiển thị "THIỆP MỜI MẪU", "DEMO",...
- **Danh xưng ấm áp, truyền thống:** Khi không có tên khách đích danh, luôn dùng danh xưng tự nhiên, lịch thiệp như "Quý khách và gia đình", tuyệt đối không để trống hay dùng dấu chấm chấm `.....`.


