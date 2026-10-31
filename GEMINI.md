# Workspace Guidelines: Thiep-cuoi

## Autonomous Execution & Direct Code Editing
- **Tự động áp dụng chỉnh sửa:** Khi người dùng yêu cầu sửa đổi, tối ưu hay thêm tính năng mới cho HTML, CSS, JS trong dự án này, Agent luôn **chủ động chỉnh sửa trực tiếp** vào mã nguồn (`edit_file`, `write_file`), không hỏi lại hay dừng lại chờ xác nhận ở từng bước nhỏ.
- **Hoàn thành trọn vẹn:** Tự động thực hiện toàn bộ quy trình từ kiểm tra, chỉnh sửa đến hoàn tất, sau đó tóm tắt ngắn gọn những gì đã thay đổi để người dùng chuyển tab về là có thể refresh (`F5`) xem ngay kết quả trên trình duyệt.
- **Không tự ý push Git:** Mọi chỉnh sửa chỉ thực hiện cục bộ trong thư mục làm việc để người dùng xem trước và kiểm tra qua trình duyệt (localhost). Tuyệt đối **KHÔNG tự ý `git commit` hoặc `git push`** lên remote/VPS trừ khi người dùng yêu cầu rõ ràng.
- **Phạm vi áp dụng:** Quy tắc này chỉ có hiệu lực cục bộ trong thư mục `d:\Thiep-cuoi`, không làm ảnh hưởng đến các dự án khác của người dùng.

