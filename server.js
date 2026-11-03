/**
 * ============================================================================
 * LIGHTWEIGHT WEDDING MINI-DB SERVER (Node.js Zero-Dependency — Port 8000)
 * ============================================================================
 * - Phục vụ tĩnh toàn bộ thư mục d:\Thiep-cuoi (stationery.html, admin.html, img/, css/, js/)
 * - GET  /api/db      -> Đọc dữ liệu từ data/wedding-db.json
 * - POST /api/db      -> Lưu dữ liệu vào data/wedding-db.json VÀ đồng bộ trực tiếp vào js/content.js
 * - POST /api/upload  -> Nạp hàng loạt ảnh mới (30-50+ ảnh) vào thư mục img/album/
 * - GET  /api/images  -> Liệt kê toàn bộ ảnh trong thư mục img/
 * ============================================================================
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const { execSync } = require("child_process");

const PORT = Number(process.env.PORT) || 8000;
const MAX_BODY_BYTES = 50 * 1024 * 1024; // Giới hạn 50MB/request bảo vệ RAM & ổ cứng VPS

// Tự động giải phóng cổng trên Windows nếu có tiến trình cũ bị treo
if (process.platform === "win32") {
  try {
    const netstatOut = execSync(`netstat -ano | findstr :${PORT}`, { encoding: "utf8" });
    const lines = netstatOut.split(/\r?\n/).filter((l) => l.includes("LISTENING"));
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && Number(pid) > 0 && Number(pid) !== process.pid) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        } catch (e) {}
      }
    }
  } catch (e) {}
}
const ROOT_DIR = __dirname;
const DB_JSON_PATH = path.join(ROOT_DIR, "data", "wedding-db.json");
const DB_CUSTOM_PATH = path.join(ROOT_DIR, "data", "wedding-db.custom.json");
const RSVP_JSON_PATH = path.join(ROOT_DIR, "data", "wedding-rsvps.json");
const CONTENT_JS_PATH = path.join(ROOT_DIR, "js", "content.js");
const IMG_DIR = path.join(ROOT_DIR, "img");
const ALBUM_UPLOAD_DIR = path.join(IMG_DIR, "album");
const AUDIO_UPLOAD_DIR = path.join(ROOT_DIR, "audio");

function getEffectiveDbPath() {
  if (fs.existsSync(DB_CUSTOM_PATH)) {
    return DB_CUSTOM_PATH;
  }
  return DB_JSON_PATH;
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg"
};

function ensureDirs() {
  fs.mkdirSync(path.dirname(DB_JSON_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(RSVP_JSON_PATH), { recursive: true });
  fs.mkdirSync(ALBUM_UPLOAD_DIR, { recursive: true });
  fs.mkdirSync(AUDIO_UPLOAD_DIR, { recursive: true });
  ensureSymlinks();
}

function ensureSymlinks() {
  if (process.platform === "win32") return;
  const sub = path.join(ROOT_DIR, "thiep-cuoi-khanh-linh-le-dung");
  const links = [
    { target: path.join(sub, "assets"), link: path.join(ROOT_DIR, "assets") },
    { target: path.join(ROOT_DIR, "img"), link: path.join(sub, "img") },
    { target: path.join(ROOT_DIR, "data"), link: path.join(sub, "data") },
    { target: path.join(ROOT_DIR, "audio"), link: path.join(sub, "audio") },
    { target: path.join(ROOT_DIR, "js"), link: path.join(sub, "js") },
    { target: path.join(ROOT_DIR, "css"), link: path.join(sub, "css") }
  ];
  links.forEach(({ target, link }) => {
    try {
      if (!fs.existsSync(target)) return;
      try {
        const stat = fs.lstatSync(link);
        if (stat.isSymbolicLink()) {
          try {
            if (fs.realpathSync(link) === fs.realpathSync(target)) return;
          } catch (_) {}
          fs.unlinkSync(link);
        }
      } catch (_) {}
      if (!fs.existsSync(link)) {
        fs.symlinkSync(target, link, "dir");
      }
    } catch (_) {}
  });
}

function sanitizeFilename(name) {
  const parsed = path.parse(path.basename(name || "file.jpg"));
  let ext = (parsed.ext || ".jpg").toLowerCase();
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp3", ".m4a", ".wav", ".ogg"];
  if (!allowed.includes(ext)) {
    ext = ".jpg";
  }
  const isAudio = [".mp3", ".m4a", ".wav", ".ogg"].includes(ext);
  let cleanBase = parsed.name.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!cleanBase) cleanBase = isAudio ? "wedding-music" : "wedding-photo";
  return { base: cleanBase.slice(0, 50), ext, isAudio };
}

function syncContentJs(dbData) {
  if (!fs.existsSync(CONTENT_JS_PATH)) return;
  try {
    const jsCode = fs.readFileSync(CONTENT_JS_PATH, "utf8");
    const prettyJson = JSON.stringify(dbData, null, 2);
    const pattern = /const\s+DEFAULT_WEDDING_DB\s*=\s*\{[\s\S]*?\n\};/;
    if (pattern.test(jsCode)) {
      const updated = jsCode.replace(pattern, () => `const DEFAULT_WEDDING_DB = ${prettyJson};`);
      fs.writeFileSync(CONTENT_JS_PATH, updated, "utf8");
    }
  } catch (err) {
    console.warn("Could not sync js/content.js:", err.message);
  }
}

function sendJson(res, statusCode, payload) {
  const body = Buffer.from(JSON.stringify(payload, null, 2), "utf8");
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": body.length,
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(body);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    req.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_BODY_BYTES) {
        req.destroy();
        return reject(new Error("Payload too large (exceeds 50MB limit)"));
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function listAllImages(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "_originals") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listAllImages(fullPath, out);
    } else if (/\.(jpe?g|png|webp|gif)$/i.test(entry.name)) {
      const rel = "/" + path.relative(ROOT_DIR, fullPath).replace(/\\/g, "/").replace(/^\/+/, "");
      out.push(rel);
    }
  }
  return out;
}

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

ensureDirs();

const DEFAULT_COVER_PHOTO = "/thiep-cuoi-khanh-linh-le-dung/assets/cover-khanh-linh-le-dung.jpg";
const DEFAULT_INTERLUDE_PHOTO = "/thiep-cuoi-khanh-linh-le-dung/assets/hero.jpg";

const DEFAULT_SCHEDULE_EVENTS = [
  {
    time: "11:00",
    title: "Đón Khách & Chụp Hình",
    desc: "Chào đón quý khách đến chung vui cùng gia đình tại Đại Hoàng Sơn Palace",
    highlight: true
  },
  {
    time: "11:30",
    title: "Lễ Thành Hôn",
    desc: "Nghi thức trao nhẫn cưới & nhận lời chúc phúc của hai bên gia đình",
    highlight: true
  },
  {
    time: "12:00",
    title: "Khai Tiệc Mừng",
    desc: "Nâng ly chúc phúc và cùng thưởng thức bữa tiệc thân mật",
    highlight: false
  },
  {
    time: "13:30",
    title: "Tiễn Khách & Cảm Tạ",
    desc: "Lưu lại những tấm hình kỷ niệm đẹp cùng cô dâu & chú rể",
    highlight: false
  }
];

function sanitizeAndHealDb(dbData) {
  if (!dbData || typeof dbData !== "object") return dbData;
  let changed = false;

  function fileExists(relPath) {
    if (!relPath || typeof relPath !== "string") return false;
    if (/^(https?:|data:|blob:)/i.test(relPath)) return true;
    const clean = relPath.trim().replace(/^\/+/, "").replace(/\\/g, "/");
    return fs.existsSync(path.join(ROOT_DIR, clean));
  }

  // 1. Tự động loại bỏ ảnh chết không tồn tại trên ổ cứng để chống lỗi 404
  if (Array.isArray(dbData.albumPhotos)) {
    const initialCount = dbData.albumPhotos.length;
    const validPhotos = dbData.albumPhotos.filter(p => fileExists(p));
    if (validPhotos.length !== initialCount) {
      console.log(`[Self-Healing] Removed ${initialCount - validPhotos.length} non-existent photos from albumPhotos`);
      dbData.albumPhotos = validPhotos;
      changed = true;
    }
  }

  // 2. Tự động nạp 4 mốc lịch trình chuẩn nếu trống hoặc chưa cấu hình
  if (!dbData.schedule || typeof dbData.schedule !== "object") {
    dbData.schedule = {
      eyebrow: "WEDDING PROGRAM • NGÀY CHUNG ĐÔI",
      heading: "Lịch Trình & Chi Tiết",
      events: DEFAULT_SCHEDULE_EVENTS
    };
    changed = true;
  } else {
    if (!dbData.schedule.eyebrow) {
      dbData.schedule.eyebrow = "WEDDING PROGRAM • NGÀY CHUNG ĐÔI";
      changed = true;
    }
    if (!dbData.schedule.heading) {
      dbData.schedule.heading = "Lịch Trình & Chi Tiết";
      changed = true;
    }
    if (!Array.isArray(dbData.schedule.events) || dbData.schedule.events.length === 0) {
      dbData.schedule.events = DEFAULT_SCHEDULE_EVENTS;
      changed = true;
    }
  }

  if (dbData.couple) {
    if (dbData.couple.coverPhoto && !fileExists(dbData.couple.coverPhoto)) {
      console.log(`[Self-Healing] Missing coverPhoto: ${dbData.couple.coverPhoto} -> Reset to ${DEFAULT_COVER_PHOTO}`);
      dbData.couple.coverPhoto = DEFAULT_COVER_PHOTO;
      changed = true;
    }
    if (dbData.couple.coverPhotoMobile && !fileExists(dbData.couple.coverPhotoMobile)) {
      dbData.couple.coverPhotoMobile = "";
      changed = true;
    }
    if (dbData.couple.interludePhoto && !fileExists(dbData.couple.interludePhoto)) {
      console.log(`[Self-Healing] Missing interludePhoto: ${dbData.couple.interludePhoto} -> Reset to ${DEFAULT_INTERLUDE_PHOTO}`);
      dbData.couple.interludePhoto = DEFAULT_INTERLUDE_PHOTO;
      changed = true;
    }
    if (dbData.couple.interludePhotoMobile && !fileExists(dbData.couple.interludePhotoMobile)) {
      dbData.couple.interludePhotoMobile = "";
      changed = true;
    }
    if (dbData.couple.heroBackdrop && !fileExists(dbData.couple.heroBackdrop)) {
      dbData.couple.heroBackdrop = "img/08-trang-an-hero.jpg";
      changed = true;
    }
  }

  if (dbData.venues) {
    ["groom", "bride"].forEach(k => {
      const v = dbData.venues[k];
      if (v) {
        if (!v.father || !v.mother) {
          const rawP = String(v.parents || "").trim();
          if (rawP.includes("&")) {
            const parts = rawP.split("&");
            if (!v.father) v.father = parts[0].trim();
            if (!v.mother) v.mother = parts.slice(1).join("&").trim();
            changed = true;
          }
        }
      }
    });
  }

  if (changed) {
    try {
      fs.writeFileSync(DB_CUSTOM_PATH, JSON.stringify(dbData, null, 2), "utf8");
    } catch (_) {}
  }
  return dbData;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = decodeURIComponent(parsedUrl.pathname || "/");
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  if (req.method === "OPTIONS") {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    return res.end();
  }

  // 1. API: GET /api/db
  if (req.method === "GET" && pathname === "/api/db") {
    try {
      const dbPath = getEffectiveDbPath();
      const raw = fs.readFileSync(dbPath, "utf8");
      const dbData = sanitizeAndHealDb(JSON.parse(raw));
      return sendJson(res, 200, dbData);
    } catch (e) {
      return sendJson(res, 404, { ok: false, error: e.message });
    }
  }

  // 2. API: GET /api/images
  if (req.method === "GET" && pathname === "/api/images") {
    const all = listAllImages(IMG_DIR);
    all.sort((a, b) => {
      const aAlbum = a.startsWith("/img/album/") || a.startsWith("img/album/");
      const bAlbum = b.startsWith("/img/album/") || b.startsWith("img/album/");
      if (aAlbum && !bAlbum) return -1;
      if (!aAlbum && bAlbum) return 1;
      return 0;
    });
    return sendJson(res, 200, { ok: true, images: all });
  }

  // 3. API: POST /api/db
  if (req.method === "POST" && pathname === "/api/db") {
    try {
      const bodyStr = await readRequestBody(req);
      let data = JSON.parse(bodyStr);
      // Chuẩn hóa đường dẫn ảnh album luôn bắt đầu bằng /
      if (Array.isArray(data.albumPhotos)) {
        data.albumPhotos = data.albumPhotos.map(p => {
          if (!p || typeof p !== "string") return p;
          if (/^(https?:|data:|blob:|\/)/.test(p)) return p;
          return "/" + p.trim().replace(/\\/g, "/").replace(/^\/+/, "");
        }).filter(Boolean);
      }
      // Tự động làm sạch mapEmbed & mapLink nếu người dùng dán thẻ iframe
      if (data && data.venues) {
        ["groom", "bride"].forEach(k => {
          if (data.venues[k]) {
            const v = data.venues[k];
            const fallback = v.address || v.nameFull || "";
            if (v.mapEmbed) v.mapEmbed = cleanMapEmbedUrl(v.mapEmbed, fallback);
            if (v.mapLink) v.mapLink = cleanMapLinkUrl(v.mapLink, fallback);
          }
        });
      }
      // Chạy qua Self-Healing trước khi lưu
      data = sanitizeAndHealDb(data);

      // Luôn ghi vào wedding-db.custom.json (được .gitignore bảo vệ khỏi git pull)
      fs.writeFileSync(DB_CUSTOM_PATH, JSON.stringify(data, null, 2), "utf8");
      try {
        fs.writeFileSync(DB_JSON_PATH, JSON.stringify(data, null, 2), "utf8");
      } catch (_) {}
      try {
        syncContentJs(data);
      } catch (_) {}
      return sendJson(res, 200, { ok: true, saved: "data/wedding-db.custom.json" });
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: e.message });
    }
  }

  // 4. API: POST /api/upload
  if (req.method === "POST" && pathname === "/api/upload") {
    try {
      ensureDirs();
      const bodyStr = await readRequestBody(req);
      const payload = JSON.parse(bodyStr);
      const files = Array.isArray(payload.files) ? payload.files : [];
      const savedPaths = [];
      const ts = Date.now();

      files.forEach((item, idx) => {
        if (!item || !item.dataUrl) return;
        const parts = String(item.dataUrl).split(",");
        const b64 = parts.length > 1 ? parts[1] : parts[0];
        const buf = Buffer.from(b64, "base64");
        const { base, ext, isAudio } = sanitizeFilename(item.name || `photo-${idx + 1}.jpg`);
        const num = idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`;
        const outName = `${base}-${ts}-${num}${ext}`;
        if (isAudio) {
          const outFull = path.join(AUDIO_UPLOAD_DIR, outName);
          fs.writeFileSync(outFull, buf);
          savedPaths.push(`/audio/${outName}`);
        } else {
          const outFull = path.join(ALBUM_UPLOAD_DIR, outName);
          fs.writeFileSync(outFull, buf);
          savedPaths.push(`/img/album/${outName}`);
        }
      });

      return sendJson(res, 200, { ok: true, paths: savedPaths });
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: e.message });
    }
  }

  // 5. API: POST /api/delete-images & DELETE /api/images (Xóa vĩnh viễn ảnh khỏi ổ cứng máy chủ VPS)
  if ((req.method === "POST" && pathname === "/api/delete-images") ||
      (req.method === "DELETE" && pathname === "/api/images")) {
    try {
      const bodyStr = await readRequestBody(req);
      let payload = {};
      try { payload = JSON.parse(bodyStr || "{}"); } catch (_) {}
      const pathsToDelete = Array.isArray(payload.paths)
        ? payload.paths
        : (payload.path ? [payload.path] : []);

      const deleted = [];
      const failed = [];

      for (const relPath of pathsToDelete) {
        if (!relPath || typeof relPath !== "string") continue;
        let clean = relPath.replace(/^https?:\/\/[^\/]+/i, "").replace(/^\/+/, "").replace(/\\/g, "/");
        clean = clean.split("?")[0].split("#")[0].trim();

        // Bảo mật: Chỉ cho phép xóa trong img/ và audio/
        if (!clean.startsWith("img/") && !clean.startsWith("audio/")) {
          failed.push({ path: relPath, reason: "Đường dẫn không hợp lệ" });
          continue;
        }

        const fullPath = path.join(ROOT_DIR, clean);
        const imgBase = path.join(ROOT_DIR, "img");
        const audioBase = path.join(ROOT_DIR, "audio");

        // Ngăn chặn Path Traversal
        if (!fullPath.startsWith(imgBase) && !fullPath.startsWith(audioBase)) {
          failed.push({ path: relPath, reason: "Phát hiện đường dẫn bất thường" });
          continue;
        }

        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
            deleted.push(relPath);
          } catch (err) {
            failed.push({ path: relPath, reason: err.message });
          }
        } else {
          deleted.push(relPath);
        }
      }

      // Tự động dọn dẹp các ảnh vừa xóa khỏi DB wedding-db.custom.json và wedding-db.json
      if (deleted.length > 0) {
        const deletedSet = new Set();
        deleted.forEach(p => {
          const raw = String(p).trim();
          deletedSet.add(raw);
          deletedSet.add(raw.replace(/^\/+/, ""));
          deletedSet.add("/" + raw.replace(/^\/+/, ""));
        });

        const dbPath = getEffectiveDbPath();
        if (fs.existsSync(dbPath)) {
          try {
            const dbData = JSON.parse(fs.readFileSync(dbPath, "utf8"));
            if (Array.isArray(dbData.albumPhotos)) {
              dbData.albumPhotos = dbData.albumPhotos.filter(p => {
                const s = typeof p === "string" ? p.trim() : (p && p.src ? p.src : "");
                return !deletedSet.has(s);
              });
            }
            if (dbData.couple) {
              if (deletedSet.has(dbData.couple.coverPhoto)) dbData.couple.coverPhoto = DEFAULT_COVER_PHOTO;
              if (deletedSet.has(dbData.couple.coverPhotoMobile)) dbData.couple.coverPhotoMobile = "";
              if (deletedSet.has(dbData.couple.interludePhoto)) dbData.couple.interludePhoto = DEFAULT_INTERLUDE_PHOTO;
              if (deletedSet.has(dbData.couple.interludePhotoMobile)) dbData.couple.interludePhotoMobile = "";
            }
            fs.writeFileSync(DB_CUSTOM_PATH, JSON.stringify(dbData, null, 2), "utf8");
            try { fs.writeFileSync(DB_JSON_PATH, JSON.stringify(dbData, null, 2), "utf8"); } catch (_) {}
          } catch (_) {}
        }
      }

      return sendJson(res, 200, { ok: true, deleted, failed });
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: e.message });
    }
  }

  // 5. API: GET /api/rsvp (Lấy danh sách khách mời phản hồi)
  if (req.method === "GET" && pathname === "/api/rsvp") {
    try {
      if (!fs.existsSync(RSVP_JSON_PATH)) {
        return sendJson(res, 200, { ok: true, rsvps: [] });
      }
      const raw = fs.readFileSync(RSVP_JSON_PATH, "utf8");
      return sendJson(res, 200, { ok: true, rsvps: JSON.parse(raw) });
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: e.message });
    }
  }

  // 6. API: POST /api/rsvp (Khách mời gửi xác nhận tham dự)
  if (req.method === "POST" && pathname === "/api/rsvp") {
    try {
      const bodyStr = await readRequestBody(req);
      const entry = JSON.parse(bodyStr);
      let list = [];
      if (fs.existsSync(RSVP_JSON_PATH)) {
        try {
          list = JSON.parse(fs.readFileSync(RSVP_JSON_PATH, "utf8"));
          if (!Array.isArray(list)) list = [];
        } catch (_) { list = []; }
      }
      const newRecord = {
        id: "rsvp_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        name: String(entry.name || "").trim().slice(0, 100),
        phone: String(entry.phone || "").trim().slice(0, 30),
        attending: entry.attending === "no" ? "no" : "yes",
        family: entry.family === "bride" ? "bride" : "groom",
        guests: entry.attending === "no" ? 0 : Math.max(1, Number(entry.guests) || 1),
        message: String(entry.message || "").trim().slice(0, 1000),
        eventDate: entry.eventDate || "",
        createdAt: new Date().toISOString()
      };
      list.unshift(newRecord);
      fs.writeFileSync(RSVP_JSON_PATH, JSON.stringify(list, null, 2), "utf8");
      return sendJson(res, 200, { ok: true, saved: newRecord, total: list.length });
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: e.message });
    }
  }

  // 7. API: DELETE /api/rsvp (Xóa phản hồi rsvp)
  if (req.method === "DELETE" && pathname === "/api/rsvp") {
    try {
      const parsedQuery = parsedUrl.query || "";
      const id = new URLSearchParams(parsedQuery).get("id");
      if (fs.existsSync(RSVP_JSON_PATH)) {
        let list = JSON.parse(fs.readFileSync(RSVP_JSON_PATH, "utf8"));
        if (Array.isArray(list)) {
          list = list.filter((r) => r.id !== id);
          fs.writeFileSync(RSVP_JSON_PATH, JSON.stringify(list, null, 2), "utf8");
        }
      }
      return sendJson(res, 200, { ok: true });
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: e.message });
    }
  }

  // 8. STATIC FILES & CLEAN URLS
  if (pathname === "/" || pathname === "/index.html") {
    res.writeHead(302, { Location: "/thiep-cuoi-khanh-linh-le-dung/" });
    return res.end();
  }
  if (pathname === "/thiep-cuoi-khanh-linh-le-dung") {
    res.writeHead(301, { Location: "/thiep-cuoi-khanh-linh-le-dung/" });
    return res.end();
  }
  if (pathname === "/stationery" || pathname === "/stationery/") {
    pathname = "/stationery.html";
  } else if (pathname === "/admin" || pathname === "/admin/" || pathname === "/admin/index.html") {
    pathname = "/admin.html";
  } else if (pathname === "/guest-list" || pathname === "/guest-list/" || pathname === "/guest-list/index.html") {
    pathname = "/guest-list.html";
  } else if (pathname === "/minimal" || pathname === "/minimal/") {
    pathname = "/minimal.html";
  } else if (pathname === "/album" || pathname === "/album/" || pathname === "/album.html") {
    pathname = "/thiep-cuoi-khanh-linh-le-dung/album.html";
  }

  // Rewrite sub-folder relative asset requests to root
  const subPrefix = "/thiep-cuoi-khanh-linh-le-dung";
  if (pathname.startsWith(subPrefix + "/img/")) {
    pathname = pathname.slice(subPrefix.length);
  } else if (pathname.startsWith(subPrefix + "/data/")) {
    pathname = pathname.slice(subPrefix.length);
  } else if (pathname.startsWith(subPrefix + "/audio/")) {
    pathname = pathname.slice(subPrefix.length);
  } else if (pathname.startsWith(subPrefix + "/js/")) {
    pathname = pathname.slice(subPrefix.length);
  } else if (pathname.startsWith(subPrefix + "/css/")) {
    pathname = pathname.slice(subPrefix.length);
  } else if (pathname.startsWith("/assets/")) {
    pathname = subPrefix + pathname;
  }

  // Phục vụ dữ liệu tùy chỉnh custom.json nếu có
  if (pathname === "/data/wedding-db.json" && fs.existsSync(DB_CUSTOM_PATH)) {
    const raw = fs.readFileSync(DB_CUSTOM_PATH);
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": raw.length,
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*"
    });
    return res.end(raw);
  }
  const normalizedRel = pathname.replace(/^[/\\]+/, "");
  const segments = normalizedRel.split(/[/\\]+/);
  const blockedFiles = ["server.js", "server.py", "process_envelope.py", "gemini.md", "setup-vps.sh"];
  if (
    segments.some((seg) => seg.startsWith(".") || seg === "..") ||
    blockedFiles.includes(normalizedRel.toLowerCase())
  ) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("403 Forbidden");
  }

  const safePath = path.resolve(ROOT_DIR, normalizedRel);
  if (safePath !== ROOT_DIR && !safePath.startsWith(ROOT_DIR + path.sep)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("403 Forbidden");
  }

  fs.stat(safePath, (err, stat) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("404 Not Found");
    }

    let filePath = safePath;
    if (stat.isDirectory()) {
      filePath = path.join(safePath, "index.html");
      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        return res.end("404 Not Found");
      }
    } else if (!stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("404 Not Found");
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || "application/octet-stream";
    const headers = { "Content-Type": mime };
    if (ext === ".html" || ext === ".js" || ext === ".json" || ext === ".css") {
      headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0";
    }
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
});

ensureDirs();
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Wedding Mini-DB Server running at http://localhost:${PORT}/stationery.html`);
  console.log(`Admin Studio available at       http://localhost:${PORT}/admin.html`);
});

