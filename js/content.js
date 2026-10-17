// ============================================================
// NỘI DUNG THIỆP — sửa các giá trị bên dưới, không cần đụng vào
// các file khác (main.js, style.css) để thay đổi nội dung.
// ============================================================

const WEDDING_CONTENT = {
  groom: "Dũng",
  bride: "Linh",

  // Định dạng tự do, hiển thị nguyên văn trên bìa
  dateDisplay: "07 . 12 . 2026",

  // Ảnh dùng cho trang bìa (kiểu vé/hộ chiếu)
  coverPhoto: "img/08-trang-an-hero.jpg",

  opening: {
    body: [
      "Tình yêu là khi hai người xa lạ chọn cùng nhau viết tiếp những trang còn lại của cuộc đời mình.",
      "Chúng tôi trân trọng kính mời bạn đến chung vui và chứng kiến khoảnh khắc hai gia đình chính thức trở thành một trong ngày trọng đại này.",
    ],
  },

  // Mỗi mốc là một "điểm dừng" trên hành trình — có ảnh, địa điểm,
  // thời gian (ước lệ) và một đoạn ký sự ngắn.
  story: {
    heading: "Những chặng đường đã qua",
    milestones: [
      {
        label: "Gặp gỡ",
        place: "Thượng Hải",
        when: "Mùa thu, 2023",
        photo: "img/04-shanghai-mua.jpg",
        text: "Một ngày rất bình thường, ở một nơi rất bình thường — vậy mà lại trở thành khởi đầu của một điều không hề bình thường chút nào.",
      },
      {
        label: "Thương nhau",
        place: "Thượng Hải",
        when: "Đông, 2023",
        photo: "img/06-shanghai-dem.jpg",
        text: "Qua từng cuộc trò chuyện, từng chuyến đi, từng bữa cơm giản dị, hai người nhận ra mình đã trở thành thói quen không thể thiếu của nhau.",
      },
      {
        label: "Hẹn ước",
        place: "Shanghai Disneyland",
        when: "Hè, 2025",
        photo: "img/03-disney-cau-hon.jpg",
        text: "Và rồi, giữa muôn vàn ngã rẽ, cả hai cùng chọn một con đường để đi tiếp — con đường có tên là gia đình.",
      },
    ],
  },

  ceremony: {
    heading: "Lễ thành hôn",
    time: "11:00",
    date: "Chủ nhật, ngày 07 tháng 12 năm 2026",
    note: "Sự hiện diện của bạn là niềm vinh hạnh lớn lao cho gia đình chúng tôi.",

    // Hai nhà dùng chung 1 khung bản đồ — bấm nút đổi nhà sẽ nạp lat/lng
    // tương ứng. Toạ độ dưới đây là ƯỚC LỆ (trung tâm Hà Nội / TP.HCM),
    // thay bằng toạ độ thật của từng nhà (bấm chuột phải vị trí đó trên
    // Google Maps > chọn dòng toạ độ để copy).
    groomHome: {
      label: "Nhà trai",
      address: "Số 00, đường ABC, phường/xã XYZ, Hà Nội",
      lat: 21.0278,
      lng: 105.8342,
    },
    brideHome: {
      label: "Nhà gái",
      address: "Số 00, đường DEF, phường/xã UVW, TP. Hồ Chí Minh",
      lat: 10.7769,
      lng: 106.7009,
    },
  },

  thanks: {
    heading: "Lời cảm ơn",
    body: "Dù bạn có thể thu xếp đến chung vui hay không, tấm lòng của bạn dành cho chúng tôi đều là món quà quý giá nhất. Rất mong được đón tiếp bạn.",
    rsvpLabel: "Xác nhận tham dự",
    rsvpContact: "Zalo / SĐT: 090 000 0000",
  },

  backCover: {
    line1: "Trân trọng kính mời",
    line2: "Gia đình hai họ",
  },

  // Toàn bộ ảnh sẽ hiện trong nút "Xem album" ở trang cuối — cứ thêm bớt
  // đường dẫn ảnh trong mảng này, không cần sửa ở đâu khác.
  album: [
    "img/08-trang-an-hero.jpg",
    "img/01-trang-an-a.jpg",
    "img/07-trang-an-b.jpg",
    "img/04-shanghai-mua.jpg",
    "img/06-shanghai-dem.jpg",
    "img/03-disney-cau-hon.jpg",
    "img/02-disney-phao-hoa.jpg",
    "img/05-wuzhen-ma.jpg",
    "img/09-wuzhen-moi.jpg",
  ],
};

if (typeof window !== "undefined") {
  window.WEDDING_CONTENT = WEDDING_CONTENT;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = WEDDING_CONTENT;
}

