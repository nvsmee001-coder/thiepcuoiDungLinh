---
version: alpha
name: Thiệp cưới — Nhật ký hành trình
description: Thiệp cưới điện tử dạng "nhật ký du lịch" — mỗi mốc trong chuyện tình yêu là một trang dán ảnh polaroid, đóng dấu bưu điện, đám cưới là điểm đến cuối hành trình (vé mời, vé máy bay, bưu thiếp RSVP).
colors:
  paper: "#ece2cb"
  paper-card: "#f8f3e6"
  paper-edge: "#d8c79e"
  ink: "#2a2420"
  ink-soft: "#6e6253"
  stamp: "#a8402a"
  airmail: "#2e4a5c"
typography:
  display:
    fontFamily: "Caveat"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Lora"
    fontWeight: 400
    lineHeight: 1.65
spacing:
  card-padding: "30px"
  section-gap: "50px"
rounded:
  card: "4px"
omitted:
  - components: "Chưa có hệ thống component tái dùng theo nghĩa app UI — mỗi phần là một 'vật thể giấy' (vé, ghi chú, vé máy bay, bưu thiếp) tự định nghĩa layout riêng theo đúng vật thật nó mô phỏng."
---

## Overview

Không phải một trang web thiệp cưới thông thường — toàn bộ thiệp được trình bày
như một **cuốn nhật ký hành trình** của hai người, vì ảnh thật của họ đều là ảnh
đi du lịch cùng nhau. Đám cưới là **điểm đến cuối cùng** của hành trình đó. Mọi
chi tiết hình ảnh (tem, vé, dấu bưu điện, băng keo washi) đều bám theo đúng ẩn dụ
này, không trang trí ngẫu nhiên.

## Colors

- **paper**: nền giấy kraft ấm xuyên suốt toàn trang — không dùng trắng/đen, giữ
  cảm giác giấy thật, hơi ngả vàng chứ không phải cream hồng nhạt.
- **paper-card**: giấy của từng "vật thể" (vé, ghi chú, vé máy bay, bưu thiếp) —
  sáng hơn `paper` một chút để các thẻ nổi lên khỏi nền.
- **ink / ink-soft**: chữ chính và chữ phụ — ấm, không dùng đen tuyền.
- **stamp**: màu mực đỏ gạch của con dấu bưu điện — điểm nhấn CHÍNH, chỉ dùng cho
  thứ thật sự mang nghĩa "con dấu/điểm nhấn" (dấu mốc, heading quan trọng, doodle
  tay), không dùng tràn lan.
- **airmail**: xanh navy mực tem hàng không — vai trò phụ, dùng cho đường bay/route
  và các nhãn mốc chuyện tình, tách biệt khỏi `stamp` để hai vai trò không lẫn nhau.

## Typography

- **display (Caveat)**: chỉ dùng cho tên hai người, tiêu đề các "vật thể" (vé, ghi
  chú...), và nhãn mốc — nơi cần cảm giác viết tay thật.
- **body (Lora)**: mọi đoạn văn, nhãn nhỏ, chi tiết — serif ấm, dễ đọc, hỗ trợ
  tiếng Việt có dấu đầy đủ. Đổi từ Cormorant Garamond sang Lora vì Lora đọc chắc
  tay hơn ở các khối văn bản dài kiểu "ký sự" này.

Không dùng chữ hoa toàn bộ (ALL CAPS) cho nhãn — dùng chữ thường/letter-spacing
nhẹ để giữ cảm giác ấm, như chữ viết tay trong sổ chứ không phải UI app.

## Layout

Mỗi phần chính là một **vật thể giấy cụ thể**, không phải section chung chung:
- Bìa = tấm vé mời
- Lời ngỏ = mẩu ghi chú dán băng keo
- Hành trình = 3 "trang nhật ký" (ảnh polaroid + dấu bưu điện), trình bày kiểu
  màn hình đứng yên (`position: sticky`) — ảnh/chữ đổi theo đúng tốc độ cuộn thay
  vì cuộn trôi qua, và khớp đúng ẩn dụ "giữ nguyên cuốn sổ, lật từng trang"
- Lễ cưới = tấm vé máy bay (Từ "câu chuyện hai người" → Đến "lễ thành hôn")
- Cảm ơn/RSVP = tấm bưu thiếp thật (có tem, dấu bưu điện, mặt sau viết tay)

## Elevation & Depth

Không dùng shadow kiểu SaaS đồng loạt. Chiều sâu đến từ vật lý giấy thật:
- Góc giấy gấp xoăn (`.paper-fold`, dog-ear) ở mọi thẻ
- Băng keo washi dán đè lên ảnh (xuất hiện sau khi ảnh đã "đặt" xong — mô phỏng
  thao tác dán ảnh thật, không phải mọi thứ hiện cùng lúc)
- Mỗi thẻ hơi xoay lệch (1–7°), không thẻ nào thẳng tuyệt đối

## Shapes

Bo góc rất nhẹ (4px) cho các thẻ lớn — đây là giấy chứ không phải app card. Tem
và ảnh polaroid gần như vuông thành (chỉ bo 2px), giữ cảm giác in ấn.

## Components

- **Tem/dấu bưu điện** (`.postmark`): vòng tròn viền đỏ gạch kép, chữ Caveat —
  dùng cho địa điểm + thời gian của mỗi mốc.
- **Tem trang trí** (`.deco-stamp`): tái dùng ảnh dư, đính vào góc một "vật thể"
  khác (không thả trôi ngoài lề trang) — để luôn hiển thị ở mọi kích thước màn
  hình, kể cả điện thoại.
- **Đường bay chấm chấm**: nối các điểm — dùng cho route trong vé và lề trang
  (chỉ hiện ở màn hình rộng, nơi có đủ lề).
- **Vòng tem mờ nền** (`.jcover-ring`): lấp khoảng trống phía trên vé mời trên
  điện thoại, nơi không có lề để đặt đường bay.

## Do's and Don'ts

- Do: mọi hiệu ứng chuyển cảnh phải khớp với vật thể thật — vé máy bay "in ra",
  bưu thiếp "bay xiên vào rồi ổn định", không dùng chung 1 kiểu fade cho tất cả.
- Do: khi thêm trang trí, luôn tự hỏi "trên điện thoại có thấy không?" — đừng
  trang trí chỉ xuất hiện ở màn hình rộng rồi bỏ mặc bản mobile trống trải.
- Do: tái dùng ảnh dư làm trang trí (tem, sticker) thay vì để trống khi thiếu ảnh.
- Don't: để phần trang trí đè lên chữ — luôn kiểm tra va chạm ở cả mobile lẫn
  desktop trước khi chốt vị trí một sticker/tem.
- Don't: thêm shadow/card bo tròn kiểu SaaS — phá vỡ cảm giác giấy thật.
- Don't: dùng `stamp` (đỏ) và `airmail` (xanh) lẫn lộn vai trò — đỏ là dấu/điểm
  nhấn, xanh là đường đi/nhãn mốc.
