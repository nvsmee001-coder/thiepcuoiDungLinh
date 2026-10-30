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
    "groomName": "Dũng",
    "brideName": "Linh",
    "eyebrow": "✦ CÙNG VỚI GIA ĐÌNH HAI BÊN • LỄ THÀNH HÔN ✦",
    "invitationText": "Trân trọng kính mời quý khách đến chung vui cùng gia đình chúng mình",
    "signatureQuote": "“Một hành trình mới • Trọn vẹn yêu thương”",
    "heroBackdrop": "img/08-trang-an-hero.jpg",
    "detailsBackdrop": "img/album/cropped-detailsBackdrop-1793335929516-01.jpg",
    "leftFramePhoto": "img/wedding-photo-card-left.jpg",
    "leftFramePlaque": "✦ DŨNG • LINH ✦",
    "rightFramePhoto": "img/wedding-photo-card-right.jpg",
    "rightFramePlaque": "✦ 07 . 12 . 2026 ✦"
  },
  "date": {
    "isoTarget": "2026-12-07T11:00:00+07:00",
    "dayOfWeek": "CHỦ NHẬT",
    "dayNumber": "07",
    "monthLabel": "THÁNG 12",
    "yearLabel": "2026",
    "eventLabel": "THÀNH HÔN",
    "lunarDate": "(Nhằm ngày 29 tháng 10 năm Bính Ngọ)",
    "shortDatePill": "Chủ Nhật • 07.12.2026",
    "shortLunarPill": "(29.10 Bính Ngọ)"
  },
  "venues": {
    "groom": {
      "badgeCover": "❖ HÔN LỄ NHÀ TRAI",
      "badgeMap": "❖ HÔN LỄ NHÀ TRAI • 11:00 TRƯA (07.12.2026)",
      "nameShort": "Trống Đồng Palace",
      "nameFull": "Trống Đồng Palace — Hà Nội",
      "cityShort": "Cầu Giấy • Hà Nội",
      "timeCover": "11:00 Trưa • 07.12.2026",
      "parents": "Ông Nguyễn Văn A & Bà Trần Thị B",
      "address": "Số 65 Quán Sứ / Cầu Giấy, TP. Hà Nội",
      "mapLink": "https://maps.google.com/?q=65+Quán+Sứ,+Hoàn+Kiếm,+Hà+Nội",
      "mapEmbed": "https://maps.google.com/maps?q=65+Qu%C3%A1n+S%E1%BB%A9,+Ho%C3%A0n+Ki%E1%BA%BFm,+H%C3%A0+N%E1%BB%99i&t=&z=15&ie=UTF8&iwloc=&output=embed"
    },
    "bride": {
      "badgeCover": "❖ VU QUY NHÀ GÁI",
      "badgeMap": "❖ VU QUY NHÀ GÁI • 18:00 TỐI (07.12.2026)",
      "nameShort": "White Palace",
      "nameFull": "White Palace — TP. Hồ Chí Minh",
      "cityShort": "Hoàng Văn Thụ • TP. HCM",
      "timeCover": "18:00 Tối • 07.12.2026",
      "parents": "Ông Trần Văn C & Bà Lê Thị D",
      "address": "194 Hoàng Văn Thụ, Phường 9, Q. Phú Nhuận, TP. HCM",
      "mapLink": "https://maps.google.com/?q=194+Hoàng+Văn+Thụ,+Phú+Nhuận,+Hồ+Chí+Minh",
      "mapEmbed": "https://maps.google.com/maps?q=194+Ho%C3%A0ng+V%C4%83n+Th%E1%BB%A5,+Ph%C3%BA+Nhu%E1%BA%ADn,+H%E1%BB%93+Ch%C3%AD+Minh&t=&z=15&ie=UTF8&iwloc=&output=embed"
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
        "tag": "Khai Vị",
        "desc": "Súp Bào Ngư Vi Cá • Gỏi Ngó Sen Tôm Thịt • Chả Giò Hải Sản"
      },
      {
        "name": "Tôm Hùm Bỏ Lò Phô Mai Pháp",
        "tag": "Hải Sản",
        "desc": "Tôm hùm tươi đút lò béo ngậy dùng kèm bánh mì bơ tỏi"
      },
      {
        "name": "Bò Mỹ Áp Chảo Sốt Nấm Truffle",
        "tag": "Món Chính",
        "desc": "Thăn ngoại bò Mỹ mềm mọng dùng kèm măng tây & khoai nghiền"
      },
      {
        "name": "Cá Song Hấp Xì Dầu Hồng Kông",
        "tag": "Món Chính",
        "desc": "Cá song biển tươi hấp gừng hành & nước tương thượng hạng"
      },
      {
        "name": "Gà Đông Tảo Hầm Hạt Sen & Táo Đỏ",
        "tag": "Món Tần",
        "desc": "Món tần bổ dưỡng thanh ngọt hầm cùng nấm hương rừng"
      },
      {
        "name": "Lẩu Thái Hải Sản & Cơm Chiên",
        "tag": "Món Nóng",
        "desc": "Cơm chiên Dương Châu dùng kèm lẩu hải sản & rau nấm theo mùa"
      },
      {
        "name": "Chè Hạt Sen Long Nhãn & Đồ Uống",
        "tag": "Tráng Miệng",
        "desc": "Trái cây nhiệt đới • Rượu Vang Đỏ, Bia tươi & Nước ngọt suốt tiệc"
      }
    ]
  },
  "schedule": {
    "eyebrow": "WEDDING PROGRAM • NGÀY CHUNG ĐÔI",
    "heading": "Lịch Trình & Chi Tiết",
    "events": [
      {
        "time": "07:30",
        "title": "Lễ Ăn Hỏi & Nghi Thức Rước Dâu",
        "desc": "Họ nhà trai trao tráp sính lễ và đón dâu trang trọng tại tư gia nhà gái.",
        "highlight": false
      },
      {
        "time": "09:30",
        "title": "Lễ Thành Hôn Gia Tiên (Nhà Trai)",
        "desc": "Nghi lễ dâng hương tổ tiên, trao nhẫn cưới và nhận lời chúc phúc hai họ.",
        "highlight": false
      },
      {
        "time": "11:00",
        "title": "Đón Khách & Chụp Hình (Tiệc Nhà Trai)",
        "desc": "Chào đón quý khách tại sảnh Trống Đồng Palace — Cầu Giấy, Hà Nội.",
        "highlight": true
      },
      {
        "time": "11:30",
        "title": "Khai Tiệc Mừng Hôn Lễ Nhà Trai",
        "desc": "Nghi thức cắt bánh, rót rượu Champagne mừng hạnh phúc và dùng tiệc trưa.",
        "highlight": true
      },
      {
        "time": "17:30",
        "title": "Đón Khách & Chụp Hình (Tiệc Nhà Gái)",
        "desc": "Chào đón quý khách tại sảnh White Palace — Phú Nhuận, TP. HCM.",
        "highlight": true
      },
      {
        "time": "18:30",
        "title": "Khai Tiệc Mừng Vu Quy Nhà Gái",
        "desc": "Cùng nâng ly chúc phúc trăm năm và thưởng thức bữa tiệc tối ấm cúng.",
        "highlight": true
      }
    ]
  },
  "albumPhotos": [
    "img/wedding-photo-card-left.jpg",
    "img/wedding-photo-card-right.jpg",
    "img/02-disney-phao-hoa.jpg",
    "img/03-disney-cau-hon.jpg",
    "img/08-trang-an-hero.jpg",
    "img/07-trang-an-b.jpg",
    "img/01-trang-an-a.jpg",
    "img/06-shanghai-dem.jpg",
    "img/04-shanghai-mua.jpg",
    "img/09-wuzhen-moi.jpg",
    "img/05-wuzhen-ma.jpg"
  ],
  "music": [
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
  ]
};

const WEDDING_DB_STORAGE_KEY = "THIEP_CUOI_MINI_DB_V2";
const IDB_NAME = "THIEP_CUOI_IDB_V2";
const IDB_STORE = "wedding_store";
const IDB_KEY = "main_db";

const liveChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("THIEP_CUOI_LIVE_SYNC") : null;

function deepMergeDB(base, override) {
  if (!override || typeof override !== "object") return JSON.parse(JSON.stringify(base));
  const out = JSON.parse(JSON.stringify(base));
  if (override.couple) Object.assign(out.couple, override.couple);
  if (override.date) Object.assign(out.date, override.date);
  if (override.venues) {
    if (override.venues.groom) Object.assign(out.venues.groom, override.venues.groom);
    if (override.venues.bride) Object.assign(out.venues.bride, override.venues.bride);
  }
  if (Array.isArray(override.checklist)) out.checklist = override.checklist;
  if (override.menu) {
    Object.assign(out.menu, override.menu);
    if (Array.isArray(override.menu.courses)) out.menu.courses = override.menu.courses;
  }
  if (override.schedule) {
    Object.assign(out.schedule, override.schedule);
    if (Array.isArray(override.schedule.events)) out.schedule.events = override.schedule.events;
  }
  if (Array.isArray(override.albumPhotos) && override.albumPhotos.length > 0) {
    out.albumPhotos = override.albumPhotos
      .map(function (item) {
        return typeof item === "string" ? item : (item && item.src ? item.src : "");
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

  // 4. Đồng bộ xuống file thật thông qua server.py / server.js (nếu có)
  try {
    const res = await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(merged)
    });
    if (res.ok) {
      return { ok: true, mode: "server+idb", data: merged };
    }
  } catch (err) {}

  return { ok: true, mode: "idb", data: merged };
}

async function fetchWeddingDBFromServer() {
  // 1. Ưu tiên đọc từ Server (/api/db hoặc data/wedding-db.json) để trên VPS mọi thiết bị đều nhận dữ liệu mới nhất
  const endpoints = ["/api/db?t=" + Date.now(), "data/wedding-db.json?t=" + Date.now()];
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
