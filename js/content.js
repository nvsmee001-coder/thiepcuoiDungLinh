/**
 * ============================================================================
 * WEDDING MINI-DB & CONTENT STORE (DŨNG & LINH — 07.12.2026)
 * ============================================================================
 * Hệ thống cơ sở dữ liệu nhẹ đa tầng (IndexedDB Dung Lượng Lớn + LocalStorage + API):
 * 1. Nạp ảnh mới hàng loạt (30 - 50+ ảnh cùng lúc) không giới hạn dung lượng nhờ IndexedDB,
 *    không cần đặt tên hay gắn tag cho ảnh.
 * 2. Chỉnh sửa toàn bộ thông tin quan trọng của thiệp:
 *    - Tên Dâu Rể, lời mời, câu trích dẫn, ảnh nền Tab 1 & Tab 2, 2 khung ảnh Baroque
 *    - Ngày giờ dương lịch, âm lịch, đồng hồ đếm ngược
 *    - Địa điểm & Bản đồ Google Maps 2 nhà (Nhà Trai & Nhà Gái)
 *    - Thực đơn tiệc cưới (Menu)
 *    - Lịch trình hôn lễ (Timeline)
 * 3. Tự động đồng bộ tức thì giữa bộ lưu trữ và giao diện thiệp.
 * ============================================================================
 */

const DEFAULT_WEDDING_DB = {
  "couple": {
    "groomName": "Lê Dũng",
    "brideName": "Khánh Linh",
    "eyebrow": "CÙNG VỚI GIA ĐÌNH HAI BÊN • LỄ THÀNH HÔN",
    "invitationText": "Trân trọng kính mời quý khách đến chung vui cùng gia đình chúng mình",
    "signatureQuote": "“Một hành trình mới • Trọn vẹn yêu thương”",
    "heroBackdrop": "img/08-trang-an-hero.jpg",
    "heroBackdrops": [
      "img/08-trang-an-hero.jpg",
      "img/07-trang-an-b.jpg",
      "img/01-trang-an-a.jpg"
    ],
    "detailsBackdrop": "img/album/cropped-detailsBackdrop-1793335929516-01.jpg",
    "detailsBackdrops": [
      "img/album/cropped-detailsBackdrop-1793335929516-01.jpg",
      "img/07-trang-an-b.jpg",
      "img/09-wuzhen-moi.jpg"
    ],
    "leftFramePhoto": "img/wedding-photo-card-left.jpg",
    "leftFramePlaque": "LÊ DŨNG • KHÁNH LINH",
    "rightFramePhoto": "img/wedding-photo-card-right.jpg",
    "rightFramePlaque": "27 & 28 . 11 . 2026",
    "coverPhoto": "/thiep-cuoi-khanh-linh-le-dung/assets/cover-khanh-linh-le-dung.jpg",
    "interludePhoto": "/thiep-cuoi-khanh-linh-le-dung/assets/hero.jpg"
  },
  "invitationCard": {
    "monogram": "L&D",
    "subTitle": "THE WEDDING INVITATION",
    "kinhMoiTitle": "Kính mời",
    "defaultGuestName": "Quý khách và gia đình",
    "introGroom": "Gia đình nhà trai trân trọng kính mời quý khách<br>đến dự lễ thành hôn của hai con chúng tôi",
    "introBride": "Gia đình nhà gái trân trọng kính mời quý khách<br>đến dự lễ thành hôn của hai con chúng tôi",
    "bottomMessage": "",
    "skipIntroDefault": true
  },
  "date": {
    "isoTarget": "2026-11-27T11:00:00+07:00",
    "dayOfWeek": "THỨ SÁU",
    "dayNumber": "27",
    "monthLabel": "THÁNG 11",
    "yearLabel": "2026",
    "eventLabel": "THÀNH HÔN",
    "lunarDate": "(Tức ngày 19 tháng 10 năm Bính Ngọ)",
    "shortDatePill": "Thứ Sáu • 27.11.2026",
    "shortLunarPill": "(19.10 Bính Ngọ)"
  },
  "venues": {
    "groom": {
      "badgeCover": "HÔN LỄ NHÀ TRAI",
      "badgeMap": "HÔN LỄ NHÀ TRAI • 11:00 TRƯA (28.11.2026)",
      "nameShort": "Đại Hoàng Sơn Palace",
      "nameFull": "Trung tâm Đại Hoàng Sơn Palace",
      "cityShort": "Bắc Giang • Bắc Ninh",
      "timeCover": "11:00 Trưa • Thứ Bảy 28.11.2026",
      "date": "2026-11-28T11:00:00+07:00",
      "lunar": "(Tức ngày 20 tháng 10 năm Bính Ngọ)",
      "parents": "Ông Nguyễn Văn Uy   Bà Lê Thị Hảo",
      "address": "45 Hùng Vương - Bắc Giang - Bắc Ninh",
      "mapLink": "https://www.google.com/maps/search/?api=1&query=Trung+t%C3%A2m+%C4%90%E1%BA%A1i+Ho%C3%A0ng+S%C6%A1n+Palace,+45+H%C3%B9ng+V%C6%B0%C6%A1ng+-+B%E1%BA%AFc+Giang",
      "mapEmbed": "https://maps.google.com/maps?q=45+H%C3%B9ng+V%C6%B0%C6%A1ng,+B%E1%BA%AFc+Giang&t=&z=15&ie=UTF8&iwloc=&output=embed",
      "father": "Ông Nguyễn Văn Uy",
      "mother": "Bà Lê Thị Hảo"
    },
    "bride": {
      "badgeCover": "VU QUY NHÀ GÁI",
      "badgeMap": "VU QUY NHÀ GÁI • 11:00 TRƯA (27.11.2026)",
      "nameShort": "Trống Đồng Palace",
      "nameFull": "Trung tâm Trống Đồng Palace",
      "cityShort": "Quán Sứ • Hoàn Kiếm • Hà Nội",
      "timeCover": "11:00 Trưa • Thứ Sáu 27.11.2026",
      "date": "2026-11-27T11:00:00+07:00",
      "lunar": "(Tức ngày 19 tháng 10 năm Bính Ngọ)",
      "parents": "Ông Phạm Ngọc Hùng   Bà Nguyễn Tuyết Nhung",
      "address": "65 Quán Sứ - Cửa Nam - Hà Nội",
      "mapLink": "https://www.google.com/maps/search/?api=1&query=Trung+t%C3%A2m+Tr%E1%BB%91ng+%C4%90%E1%BB%93ng+Palace,+65+Qu%C3%A1n+S%E1%BB%A9+-+C%E1%BB%ADa+Nam+-+H%C3%A0+N%E1%BB%99i",
      "mapEmbed": "https://maps.google.com/maps?q=65+Qu%C3%A1n+S%E1%BB%A9,+Ho%C3%A0n+Ki%E1%BA%BFm,+H%C3%A0+N%E1%BB%99i&t=&z=15&ie=UTF8&iwloc=&output=embed",
      "father": "Ông Phạm Ngọc Hùng",
      "mother": "Bà Nguyễn Tuyết Nhung"
    }
  },
  "checklist": [
    {
      "text": "Chọn ngày 07.12",
      "done": true
    },
    {
      "text": "09:00 Lễ Ăn Hỏi",
      "done": true
    },
    {
      "text": "11:00 Tiệc Cưới",
      "done": true
    },
    {
      "text": "Đón dâu & Bản đồ",
      "done": false
    }
  ],
  "menu": {
    "eyebrow": "ROYAL BANQUET • ẨM THỰC ĐÃI TIỆC",
    "heading": "Thực Đơn Tiệc Cưới",
    "subNote": "Hương vị tinh tuyển chiêu đãi quan viên hai họ & quý khách",
    "courses": [
      {
        "name": "Khai Vị Tam Hợp Hoàng Kim",
        "category": "Khai Vị",
        "tag": "Khai Vị",
        "desc": "Súp Bào Ngư Vi Cá • Gỏi Ngó Sen Tôm Thịt • Chả Giò Hải Sản"
      },
      {
        "name": "Tôm Hùm Bỏ Lò Phô Mai Pháp",
        "category": "Món Chính",
        "tag": "Hải Sản",
        "desc": "Tôm hùm tươi đút lò béo ngậy dùng kèm bánh mì bơ tỏi"
      },
      {
        "name": "Bò Mỹ Áp Chảo Sốt Nấm Truffle",
        "category": "Món Chính",
        "tag": "Món Chính",
        "desc": "Thăn ngoại bò Mỹ mềm mọng dùng kèm măng tây & khoai nghiền"
      },
      {
        "name": "Cá Song Hấp Xì Dầu Hồng Kông",
        "category": "Món Chính",
        "tag": "Món Chính",
        "desc": "Cá song biển tươi hấp gừng hành & nước tương thượng hạng"
      },
      {
        "name": "Gà Đông Tảo Hầm Hạt Sen & Táo Đỏ",
        "category": "Món Chính",
        "tag": "Món Tần",
        "desc": "Món tần bổ dưỡng thanh ngọt hầm cùng nấm hương rừng"
      },
      {
        "name": "Lẩu Thái Hải Sản & Cơm Chiên",
        "category": "Món Chính",
        "tag": "Món Nóng",
        "desc": "Cơm chiên Dương Châu dùng kèm lẩu hải sản & rau nấm theo mùa"
      },
      {
        "name": "Chè Hạt Sen Long Nhãn & Đồ Uống",
        "category": "Tráng Miệng",
        "tag": "Tráng Miệng",
        "desc": "Trái cây nhiệt đới • Rượu Vang Đỏ, Bia tươi & Nước ngọt suốt tiệc"
      }
    ]
  },
  "faq": [
    {
      "q": "Mình nên đến vào lúc nào?",
      "a": "Bạn có thể đến từ 11:00 để chụp ảnh, trò chuyện cùng cô dâu chú rể và tìm chỗ ngồi trước khi buổi lễ bắt đầu lúc 11:30."
    },
    {
      "q": "Mình có thể đi cùng người thân không?",
      "a": "Vui lòng ghi rõ số người đi cùng trong phần xác nhận tham dự để chúng mình chuẩn bị chu đáo nhất nhé."
    },
    {
      "q": "Nếu mình ăn chay hoặc có yêu cầu đặc biệt?",
      "a": "Bạn hãy để lại yêu cầu trong phần lời nhắn của thiệp xác nhận. Chúng mình sẽ lưu ý để chuẩn bị thực đơn phù hợp."
    }
  ],
  "schedule": {
    "eyebrow": "WEDDING PROGRAM • NGÀY CHUNG ĐÔI",
    "heading": "Lịch Trình & Chi Tiết",
    "events": [
      {
        "time": "11:00",
        "title": "Đón Khách & Chụp Hình",
        "desc": "Chào đón quý khách đến chung vui cùng gia đình tại Đại Hoàng Sơn Palace",
        "highlight": true
      },
      {
        "time": "11:30",
        "title": "Lễ Thành Hôn",
        "desc": "Nghi thức trao nhẫn cưới & nhận lời chúc phúc của hai bên gia đình",
        "highlight": true
      },
      {
        "time": "12:00",
        "title": "Khai Tiệc Mừng",
        "desc": "Nâng ly chúc phúc và cùng thưởng thức bữa tiệc thân mật",
        "highlight": false
      },
      {
        "time": "13:30",
        "title": "Tiễn Khách & Cảm Tạ",
        "desc": "Lưu lại những tấm hình kỷ niệm đẹp cùng cô dâu & chú rể",
        "highlight": false
      }
    ]
  },
  "introPhotos": [
    "img/08-trang-an-hero.jpg",
    "img/wedding-photo-card-left.jpg",
    "img/02-disney-phao-hoa.jpg",
    "img/03-disney-cau-hon.jpg",
    "img/wedding-photo-card-right.jpg"
  ],
  "albumPhotos": [],
  "music": [
    {
      "title": "River Flows in You — Yiruma",
      "src": "assets/river-flows-in-you.mp3#t=10"
    },
    {
      "title": "Giai Điệu Tình Yêu (Bản Giao Hưởng)",
      "src": "https://assets.mixkit.co/music/preview/mixkit-romantic-wedding-love-643.mp3"
    },
    {
      "title": "Giấc Mơ Hạnh Phúc (Piano Lãng Mạn)",
      "src": "https://assets.mixkit.co/music/preview/mixkit-beautiful-dream-493.mp3"
    },
    {
      "title": "Bình Yên Bên Nhau (Acoustic)",
      "src": "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3"
    }
  ],
  "introScenes": [
    {
      "backdrop": "/thiep-cuoi-khanh-linh-le-dung/assets/memory-01-garden.jpg",
      "verse": "“Có những cuộc gặp gỡ ngỡ như tình cờ,\nnhưng lại là sự an bài đẹp nhất của duyên số.”"
    },
    {
      "backdrop": "/thiep-cuoi-khanh-linh-le-dung/assets/memory-02-castle.jpg",
      "verse": "“Cùng nhau đi qua năm tháng, cùng sẻ chia từng nụ cười,\nmỗi khoảnh khắc có nhau đều trở thành kỷ niệm vô giá.”"
    },
    {
      "backdrop": "/thiep-cuoi-khanh-linh-le-dung/assets/memory-03-piano.jpg",
      "verse": "“Từ hai người xa lạ, ta tìm thấy bình yên nơi ánh mắt,\nvà nhận ra rằng: đối phương chính là bến đỗ trọn đời.”"
    }
  ]
};

const WEDDING_DB_STORAGE_KEY = "THIEP_CUOI_MINI_DB_V2";
const IDB_NAME = "THIEP_CUOI_IDB_V2";
const IDB_STORE = "wedding_store";
const IDB_KEY = "main_db";

const liveChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("THIEP_CUOI_LIVE_SYNC") : null;

function cleanMapEmbedUrl(raw, fallbackQuery) {
  if (!raw || typeof raw !== "string") {
    if (fallbackQuery) return "https://maps.google.com/maps?q=" + encodeURIComponent(fallbackQuery) + "&t=&z=15&ie=UTF8&iwloc=&output=embed";
    return "";
  }
  let str = raw.trim();
  if (/<iframe/i.test(str)) {
    const srcMatch = str.match(/src\s*=\s*["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) str = srcMatch[1].trim();
  }
  str = str.replace(/&amp;/g, "&").replace(/^["']+|["']+$/g, "").trim();
  if (str.includes("/maps/embed") || str.includes("output=embed")) return str;
  if (str.includes("google.com/maps") || str.includes("maps.google.com")) {
    try {
      const u = new URL(str);
      const q = u.searchParams.get("q") || u.searchParams.get("query");
      if (q) return "https://maps.google.com/maps?q=" + encodeURIComponent(q) + "&t=&z=15&ie=UTF8&iwloc=&output=embed";
    } catch (_) {}
  }
  if (str.includes("maps.app.goo.gl") || str.includes("goo.gl/maps")) {
    if (fallbackQuery) return "https://maps.google.com/maps?q=" + encodeURIComponent(fallbackQuery) + "&t=&z=15&ie=UTF8&iwloc=&output=embed";
  }
  if (/^https?:\/\//i.test(str)) return str;
  if (fallbackQuery) return "https://maps.google.com/maps?q=" + encodeURIComponent(fallbackQuery) + "&t=&z=15&ie=UTF8&iwloc=&output=embed";
  return "";
}

function cleanMapLinkUrl(raw, fallbackQuery) {
  if (!raw || typeof raw !== "string") {
    if (fallbackQuery) return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(fallbackQuery);
    return "";
  }
  let str = raw.trim();
  if (/<iframe/i.test(str)) {
    const srcMatch = str.match(/src\s*=\s*["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) str = srcMatch[1].trim();
  } else if (/<a/i.test(str)) {
    const hrefMatch = str.match(/href\s*=\s*["']([^"']+)["']/i);
    if (hrefMatch && hrefMatch[1]) str = hrefMatch[1].trim();
  }
  str = str.replace(/&amp;/g, "&").replace(/^["']+|["']+$/g, "").trim();
  if (/^https?:\/\//i.test(str)) return str;
  if (fallbackQuery) return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(fallbackQuery);
  return str;
}

if (typeof window !== "undefined") {
  window.cleanMapEmbedUrl = cleanMapEmbedUrl;
  window.cleanMapLinkUrl = cleanMapLinkUrl;
}

function deepMergeDB(base, override) {
  if (!override || typeof override !== "object") return JSON.parse(JSON.stringify(base));
  const out = JSON.parse(JSON.stringify(base));
  if (override.couple) {
    Object.assign(out.couple, override.couple);
    if (Array.isArray(override.couple.heroBackdrops) && override.couple.heroBackdrops.length > 0) {
      out.couple.heroBackdrops = override.couple.heroBackdrops.filter(Boolean);
      out.couple.heroBackdrop = out.couple.heroBackdrops[0];
    } else if (out.couple.heroBackdrop) {
      out.couple.heroBackdrops = [out.couple.heroBackdrop];
    }
    if (Array.isArray(override.couple.detailsBackdrops) && override.couple.detailsBackdrops.length > 0) {
      out.couple.detailsBackdrops = override.couple.detailsBackdrops.filter(Boolean);
      out.couple.detailsBackdrop = out.couple.detailsBackdrops[0];
    } else if (out.couple.detailsBackdrop) {
      out.couple.detailsBackdrops = [out.couple.detailsBackdrop];
    }
  }
  if (override.date) Object.assign(out.date, override.date);
  if (override.venues) {
    if (override.venues.groom) {
      Object.assign(out.venues.groom, override.venues.groom);
      const fg = out.venues.groom.address || out.venues.groom.nameFull || "";
      if (out.venues.groom.mapEmbed) out.venues.groom.mapEmbed = cleanMapEmbedUrl(out.venues.groom.mapEmbed, fg);
      if (out.venues.groom.mapLink) out.venues.groom.mapLink = cleanMapLinkUrl(out.venues.groom.mapLink, fg);
    }
    if (override.venues.bride) {
      Object.assign(out.venues.bride, override.venues.bride);
      const fb = out.venues.bride.address || out.venues.bride.nameFull || "";
      if (out.venues.bride.mapEmbed) out.venues.bride.mapEmbed = cleanMapEmbedUrl(out.venues.bride.mapEmbed, fb);
      if (out.venues.bride.mapLink) out.venues.bride.mapLink = cleanMapLinkUrl(out.venues.bride.mapLink, fb);
    }
  }
  if (Array.isArray(override.checklist)) out.checklist = override.checklist;
  if (override.menu) {
    Object.assign(out.menu, override.menu);
    if (Array.isArray(override.menu.courses)) out.menu.courses = override.menu.courses;
  }
  if (override.schedule) {
    Object.assign(out.schedule, override.schedule);
    if (Array.isArray(override.schedule.events) && override.schedule.events.length > 0) {
      out.schedule.events = override.schedule.events;
    }
  }
  if (Array.isArray(override.introPhotos) && override.introPhotos.length > 0) {
    out.introPhotos = override.introPhotos
      .map(function (item) {
        return typeof item === "string" ? item : (item && item.src ? item.src : "");
      })
      .filter(Boolean);
  }
  if (Array.isArray(override.albumPhotos)) {
    out.albumPhotos = override.albumPhotos
      .map(function (item) {
        var s = typeof item === "string" ? item : (item && item.src ? item.src : "");
        if (!s) return "";
        if (/^(https?:|data:|blob:)/.test(s)) return s;
        return "/" + s.trim().replace(/\\/g, "/").replace(/^\/+/, "");
      })
      .filter(Boolean);
  }
  if (Array.isArray(override.music) && override.music.length > 0) {
    out.music = override.music
      .filter(function (m) { return m && m.src; })
      .slice(0, 5)
      .map(function (m, i) {
        return {
          title: m.title || ("Bài nhạc cưới #" + (i + 1)),
          src: m.src
        };
      });
  }
  return out;
}

// --- INDEXED-DB ENGINE (LƯU TRỮ 30-50+ ẢNH DUNG LƯỢNG LỚN KHÔNG GIỚI HẠN) ---
function openWeddingIDB() {
  return new Promise(function (resolve, reject) {
    if (typeof indexedDB === "undefined") return reject(new Error("No IndexedDB"));
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = function (e) {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = function (e) { resolve(e.target.result); };
    req.onerror = function (e) { reject(e.target.error); };
  });
}

async function idbGet() {
  try {
    const db = await openWeddingIDB();
    return await new Promise(function (resolve, reject) {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = function () { resolve(req.result || null); };
      req.onerror = function () { reject(req.error); };
    });
  } catch (e) {
    return null;
  }
}

async function idbSet(val) {
  try {
    const db = await openWeddingIDB();
    await new Promise(function (resolve, reject) {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(val, IDB_KEY);
      req.onsuccess = function () { resolve(true); };
      req.onerror = function () { reject(req.error); };
    });
    return true;
  } catch (e) {
    return false;
  }
}

async function idbClear() {
  try {
    const db = await openWeddingIDB();
    await new Promise(function (resolve, reject) {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      const req = store.delete(IDB_KEY);
      req.onsuccess = function () { resolve(true); };
      req.onerror = function () { reject(req.error); };
    });
  } catch (e) {}
}

function loadWeddingDB() {
  try {
    const saved = localStorage.getItem(WEDDING_DB_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return deepMergeDB(DEFAULT_WEDDING_DB, parsed);
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_WEDDING_DB));
}

async function saveWeddingDB(newDbData) {
  const merged = deepMergeDB(DEFAULT_WEDDING_DB, newDbData);
  window.WEDDING_DB = merged;

  // 1. Lưu toàn bộ (kể cả 30-50+ ảnh) vào IndexedDB
  await idbSet(merged);

  // 2. Lưu bản nhẹ vào localStorage (để lần tải trang tiếp theo đọc tức thì)
  try {
    localStorage.setItem(WEDDING_DB_STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    // Nếu ảnh base64 quá lớn (>5MB), lưu metadata vào localStorage, còn ảnh nằm trong IndexedDB
    try {
      const lightCopy = JSON.parse(JSON.stringify(merged));
      delete lightCopy.albumPhotos;
      localStorage.setItem(WEDDING_DB_STORAGE_KEY, JSON.stringify(lightCopy));
    } catch (e2) {}
  }

  // 3. Phát tín hiệu cập nhật trực tiếp sang tab stationery.html nếu đang mở
  if (liveChannel) {
    try { liveChannel.postMessage({ type: "DB_UPDATED" }); } catch (e) {}
  }

  // 4. Đồng bộ xuống file thật thông qua server.js / server.py
  let serverSaved = false;
  let serverError = null;
  try {
    const res = await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(merged)
    });
    if (res.ok) {
      serverSaved = true;
    } else {
      serverError = "HTTP " + res.status;
    }
  } catch (err) {
    serverError = (err && err.message) || "Network Error";
  }

  if (serverSaved) {
    return { ok: true, mode: "server+idb", data: merged };
  }
  return { ok: false, mode: "idb_only", error: serverError, data: merged };
}

async function fetchWeddingDBFromServer() {
  // 1. Ưu tiên /api/db trước (trả về wedding-db.custom.json bảo vệ dữ liệu người dùng khi git pull), sau đó fallback sang /data/wedding-db.json
  const endpoints = ["/api/db?t=" + Date.now(), "/data/wedding-db.json?t=" + Date.now()];
  for (let i = 0; i < endpoints.length; i++) {
    try {
      const res = await fetch(endpoints[i], { cache: "no-store" });
      if (res.ok) {
        const fileData = await res.json();
        const merged = deepMergeDB(DEFAULT_WEDDING_DB, fileData);
        window.WEDDING_DB = merged;
        await idbSet(merged);
        return merged;
      }
    } catch (e) {}
  }

  // 2. Fallback: Nếu mở offline không qua server, đọc từ IndexedDB của trình duyệt
  const idbData = await idbGet();
  if (idbData) {
    window.WEDDING_DB = deepMergeDB(DEFAULT_WEDDING_DB, idbData);
    return window.WEDDING_DB;
  }

  return window.WEDDING_DB;
}

async function resetWeddingDB() {
  await idbClear();
  try {
    localStorage.removeItem(WEDDING_DB_STORAGE_KEY);
    localStorage.removeItem("THIEP_CUOI_MINI_DB_V1");
  } catch (e) {}
  window.WEDDING_DB = JSON.parse(JSON.stringify(DEFAULT_WEDDING_DB));
  if (liveChannel) {
    try { liveChannel.postMessage({ type: "DB_UPDATED" }); } catch (e) {}
  }
  try {
    await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(window.WEDDING_DB)
    });
  } catch (e) {}
  return window.WEDDING_DB;
}

if (typeof window !== "undefined") {
  window.DEFAULT_WEDDING_DB = DEFAULT_WEDDING_DB;
  window.WEDDING_DB = loadWeddingDB();
  window.saveWeddingDB = saveWeddingDB;
  window.resetWeddingDB = resetWeddingDB;
  window.fetchWeddingDBFromServer = fetchWeddingDBFromServer;
  window.WEDDING_LIVE_CHANNEL = liveChannel;
}
