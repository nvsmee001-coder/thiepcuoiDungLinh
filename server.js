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
const RSVP_JSON_PATH = path.join(ROOT_DIR, "data", "wedding-rsvps.json");
const CONTENT_JS_PATH = path.join(ROOT_DIR, "js", "content.js");
const IMG_DIR = path.join(ROOT_DIR, "img");
const ALBUM_UPLOAD_DIR = path.join(IMG_DIR, "album");
const AUDIO_UPLOAD_DIR = path.join(ROOT_DIR, "audio");

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
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listAllImages(fullPath, out);
    } else if (/\.(jpe?g|png|webp|gif)$/i.test(entry.name)) {
      const rel = path.relative(ROOT_DIR, fullPath).replace(/\\/g, "/");
      out.push(rel);
    }
  }
  return out;
}

ensureDirs();

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = decodeURIComponent(parsedUrl.pathname || "/");

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
      const raw = fs.readFileSync(DB_JSON_PATH, "utf8");
      return sendJson(res, 200, JSON.parse(raw));
    } catch (e) {
      return sendJson(res, 404, { ok: false, error: e.message });
    }
  }

  // 2. API: GET /api/images
  if (req.method === "GET" && pathname === "/api/images") {
    return sendJson(res, 200, { ok: true, images: listAllImages(IMG_DIR) });
  }

  // 3. API: POST /api/db
  if (req.method === "POST" && pathname === "/api/db") {
    try {
      const bodyStr = await readRequestBody(req);
      const data = JSON.parse(bodyStr);
      fs.writeFileSync(DB_JSON_PATH, JSON.stringify(data, null, 2), "utf8");
      syncContentJs(data);
      return sendJson(res, 200, { ok: true, saved: "data/wedding-db.json + js/content.js" });
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
          savedPaths.push(`audio/${outName}`);
        } else {
          const outFull = path.join(ALBUM_UPLOAD_DIR, outName);
          fs.writeFileSync(outFull, buf);
          savedPaths.push(`img/album/${outName}`);
        }
      });

      return sendJson(res, 200, { ok: true, paths: savedPaths });
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

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Wedding Mini-DB Server running at http://localhost:${PORT}/stationery.html`);
  console.log(`Admin Studio available at       http://localhost:${PORT}/admin.html`);
});

