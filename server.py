#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Lightweight Wedding Mini-DB Server (Port 8000)
- Phục vụ tĩnh toàn bộ thư mục d:\\Thiep-cuoi
- GET  /api/db      -> Đọc dữ liệu thiệp từ data/wedding-db.json
- POST /api/db      -> Lưu dữ liệu vào data/wedding-db.json VÀ đồng bộ trực tiếp vào js/content.js
- POST /api/upload  -> Nạp hàng loạt ảnh mới (30-50+ ảnh) vào thư mục img/album/
- GET  /api/images  -> Liệt kê toàn bộ ảnh hiện có trong thư mục img/
"""

import base64
import json
import os
import re
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_JSON_PATH = os.path.join(ROOT_DIR, "data", "wedding-db.json")
DB_CUSTOM_PATH = os.path.join(ROOT_DIR, "data", "wedding-db.custom.json")
CONTENT_JS_PATH = os.path.join(ROOT_DIR, "js", "content.js")
IMG_DIR = os.path.join(ROOT_DIR, "img")
ALBUM_UPLOAD_DIR = os.path.join(IMG_DIR, "album")
AUDIO_UPLOAD_DIR = os.path.join(ROOT_DIR, "audio")
MAX_BODY_BYTES = 50 * 1024 * 1024

DEFAULT_COVER_PHOTO = "/thiep-cuoi-khanh-linh-le-dung/assets/cover-khanh-linh-le-dung.jpg"
DEFAULT_INTERLUDE_PHOTO = "/thiep-cuoi-khanh-linh-le-dung/assets/hero.jpg"


def get_effective_db_path():
    if os.path.exists(DB_CUSTOM_PATH):
        return DB_CUSTOM_PATH
    return DB_JSON_PATH


def sanitize_and_heal_db(data):
    if not isinstance(data, dict):
        return data
    changed = False

    def file_exists(rel_p):
        if not rel_p or not isinstance(rel_p, str):
            return False
        if re.match(r"^(https?:|data:|blob:)", rel_p, re.I):
            return True
        clean = rel_p.strip().lstrip("/\\").replace("\\", "/")
        return os.path.exists(os.path.join(ROOT_DIR, clean))

    couple = data.get("couple")
    if isinstance(couple, dict):
        cov = couple.get("coverPhoto")
        if cov and not file_exists(cov):
            print(f"[Self-Healing] Missing coverPhoto: {cov} -> Reset to {DEFAULT_COVER_PHOTO}")
            couple["coverPhoto"] = DEFAULT_COVER_PHOTO
            changed = True
        cov_mob = couple.get("coverPhotoMobile")
        if cov_mob and not file_exists(cov_mob):
            couple["coverPhotoMobile"] = ""
            changed = True
        inter = couple.get("interludePhoto")
        if inter and not file_exists(inter):
            print(f"[Self-Healing] Missing interludePhoto: {inter} -> Reset to {DEFAULT_INTERLUDE_PHOTO}")
            couple["interludePhoto"] = DEFAULT_INTERLUDE_PHOTO
            changed = True
        inter_mob = couple.get("interludePhotoMobile")
        if inter_mob and not file_exists(inter_mob):
            couple["interludePhotoMobile"] = ""
            changed = True

    venues = data.get("venues")
    if isinstance(venues, dict):
        for k in ("groom", "bride"):
            v = venues.get(k)
            if isinstance(v, dict):
                raw_p = str(v.get("parents") or "").strip()
                if "&" in raw_p and (not v.get("father") or not v.get("mother")):
                    parts = raw_p.split("&")
                    if not v.get("father"):
                        v["father"] = parts[0].strip()
                    if not v.get("mother"):
                        v["mother"] = parts[1].strip()
                    changed = True

    if changed:
        try:
            with open(DB_CUSTOM_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception:
            pass
    return data


def ensure_dirs():
    os.makedirs(os.path.dirname(DB_JSON_PATH), exist_ok=True)
    os.makedirs(ALBUM_UPLOAD_DIR, exist_ok=True)
    os.makedirs(AUDIO_UPLOAD_DIR, exist_ok=True)


def sanitize_filename(name):
    base, ext = os.path.splitext(os.path.basename(name or "photo.jpg"))
    ext = ext.lower()
    allowed = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp3", ".m4a", ".wav", ".ogg")
    if ext not in allowed:
        ext = ".jpg"
    is_audio = ext in (".mp3", ".m4a", ".wav", ".ogg")
    clean_base = re.sub(r"[^a-zA-Z0-9_-]+", "-", base).strip("-")
    if not clean_base:
        clean_base = "wedding-music" if is_audio else "wedding-photo"
    return clean_base[:50], ext, is_audio


def sync_content_js(db_data):
    """Đồng bộ DEFAULT_WEDDING_DB trong js/content.js để thiệp chạy tĩnh cũng có dữ liệu mới nhất."""
    if not os.path.exists(CONTENT_JS_PATH):
        return
    try:
        with open(CONTENT_JS_PATH, "r", encoding="utf-8") as f:
            js_code = f.read()

        pretty_json = json.dumps(db_data, ensure_ascii=False, indent=2)
        pattern = r"const\s+DEFAULT_WEDDING_DB\s*=\s*\{[\s\S]*?\n\};"
        replacement = f"const DEFAULT_WEDDING_DB = {pretty_json};"
        if re.search(pattern, js_code):
            new_js = re.sub(pattern, lambda _: replacement, js_code, count=1)
            with open(CONTENT_JS_PATH, "w", encoding="utf-8") as f:
                f.write(new_js)
    except Exception as e:
        print("Warning: Could not sync js/content.js:", e)


class WeddingDBHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        if self.path.startswith("/api/") or self.path.endswith(".js") or self.path.endswith(".json"):
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def _send_json(self, status_code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/db":
            ensure_dirs()
            db_path = get_effective_db_path()
            if os.path.exists(db_path):
                try:
                    with open(db_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    data = sanitize_and_heal_db(data)
                    return self._send_json(200, data)
                except Exception as e:
                    return self._send_json(500, {"ok": False, "error": str(e)})
            return self._send_json(404, {"ok": False, "error": "DB not initialized"})

        if parsed.path == "/api/images":
            ensure_dirs()
            images = []
            for root, dirs, files in os.walk(IMG_DIR):
                dirs[:] = [d for d in dirs if not d.startswith(".") and d != "_originals"]
                for file in sorted(files):
                    if file.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".gif")):
                        full_p = os.path.join(root, file)
                        rel_p = "/" + os.path.relpath(full_p, ROOT_DIR).replace("\\", "/").lstrip("/")
                        images.append(rel_p)
            images.sort(key=lambda p: (0 if "img/album/" in p else 1, p))
            return self._send_json(200, {"ok": True, "images": images})

        if parsed.path in ("/", "/index.html", "/stationery", "/stationery/"):
            self.path = "/stationery.html"
        elif parsed.path in ("/admin", "/admin/", "/admin/index.html"):
            self.path = "/admin.html"

        rel_check = parsed.path.lstrip("/\\")
        segments = re.split(r"[/\\]+", rel_check)
        if any(s.startswith(".") or s == ".." for s in segments) or rel_check.lower() in (
            "server.js",
            "server.py",
            "process_envelope.py",
            "gemini.md",
        ):
            self.send_error(403, "Forbidden")
            return

        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        content_len = int(self.headers.get("Content-Length", 0))
        if content_len > MAX_BODY_BYTES:
            return self._send_json(413, {"ok": False, "error": "Payload too large (exceeds 50MB limit)"})
        raw_body = self.rfile.read(content_len) if content_len > 0 else b"{}"

        if parsed.path == "/api/db":
            ensure_dirs()
            try:
                data = json.loads(raw_body.decode("utf-8"))
                with open(DB_CUSTOM_PATH, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                try:
                    with open(DB_JSON_PATH, "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                except Exception:
                    pass
                sync_content_js(data)
                return self._send_json(200, {"ok": True, "saved": "data/wedding-db.custom.json + js/content.js"})
            except Exception as e:
                return self._send_json(400, {"ok": False, "error": str(e)})

        if parsed.path == "/api/upload":
            ensure_dirs()
            try:
                payload = json.loads(raw_body.decode("utf-8"))
                files = payload.get("files", [])
                saved_paths = []
                ts = int(time.time() * 1000)

                for idx, item in enumerate(files):
                    orig_name = item.get("name", f"photo-{idx}.jpg")
                    data_url = item.get("dataUrl", "")
                    if not data_url:
                        continue
                    if "," in data_url:
                        _, b64_part = data_url.split(",", 1)
                    else:
                        b64_part = data_url

                    binary_data = base64.b64decode(b64_part)
                    clean_base, ext, is_audio = sanitize_filename(orig_name)
                    out_name = f"{clean_base}-{ts}-{idx + 1:02d}{ext}"
                    if is_audio:
                        out_full = os.path.join(AUDIO_UPLOAD_DIR, out_name)
                        rel_path = f"/audio/{out_name}"
                    else:
                        out_full = os.path.join(ALBUM_UPLOAD_DIR, out_name)
                        rel_path = f"/img/album/{out_name}"

                    with open(out_full, "wb") as out_f:
                        out_f.write(binary_data)

                    saved_paths.append(rel_path)

                return self._send_json(200, {"ok": True, "paths": saved_paths})
            except Exception as e:
                return self._send_json(400, {"ok": False, "error": str(e)})

        if parsed.path in ("/api/delete-images", "/api/images"):
            ensure_dirs()
            try:
                payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
                paths_to_delete = payload.get("paths", [])
                if not paths_to_delete and payload.get("path"):
                    paths_to_delete = [payload.get("path")]
                deleted = []
                failed = []
                for p in paths_to_delete:
                    if not p or not isinstance(p, str):
                        continue
                    clean = re.sub(r"^https?://[^/]+", "", p).lstrip("/\\").replace("\\", "/")
                    clean = clean.split("?")[0].split("#")[0].strip()
                    if not (clean.startswith("img/") or clean.startswith("audio/")):
                        failed.append({"path": p, "reason": "Invalid path"})
                        continue
                    full_p = os.path.abspath(os.path.join(ROOT_DIR, clean))
                    if not (full_p.startswith(os.path.abspath(IMG_DIR)) or full_p.startswith(os.path.abspath(AUDIO_UPLOAD_DIR))):
                        failed.append({"path": p, "reason": "Path traversal"})
                        continue
                    if os.path.exists(full_p):
                        try:
                            os.remove(full_p)
                            deleted.append(p)
                        except Exception as e:
                            failed.append({"path": p, "reason": str(e)})
                    else:
                        deleted.append(p)

                if deleted:
                    del_set = set()
                    for d in deleted:
                        raw_s = str(d).strip()
                        del_set.add(raw_s)
                        del_set.add(raw_s.lstrip("/\\"))
                        del_set.add("/" + raw_s.lstrip("/\\"))

                    db_p = get_effective_db_path()
                    if os.path.exists(db_p):
                        try:
                            with open(db_p, "r", encoding="utf-8") as f:
                                db_data = json.load(f)
                            if isinstance(db_data.get("albumPhotos"), list):
                                db_data["albumPhotos"] = [
                                    item for item in db_data["albumPhotos"]
                                    if (item if isinstance(item, str) else (item.get("src") if isinstance(item, dict) else "")) not in del_set
                                ]
                            cp = db_data.get("couple")
                            if isinstance(cp, dict):
                                if cp.get("coverPhoto") in del_set:
                                    cp["coverPhoto"] = DEFAULT_COVER_PHOTO
                                if cp.get("coverPhotoMobile") in del_set:
                                    cp["coverPhotoMobile"] = ""
                                if cp.get("interludePhoto") in del_set:
                                    cp["interludePhoto"] = DEFAULT_INTERLUDE_PHOTO
                                if cp.get("interludePhotoMobile") in del_set:
                                    cp["interludePhotoMobile"] = ""
                            with open(DB_CUSTOM_PATH, "w", encoding="utf-8") as f:
                                json.dump(db_data, f, ensure_ascii=False, indent=2)
                            try:
                                with open(DB_JSON_PATH, "w", encoding="utf-8") as f:
                                    json.dump(db_data, f, ensure_ascii=False, indent=2)
                            except Exception:
                                pass
                        except Exception:
                            pass

                return self._send_json(200, {"ok": True, "deleted": deleted, "failed": failed})
            except Exception as e:
                return self._send_json(400, {"ok": False, "error": str(e)})

        return self._send_json(404, {"ok": False, "error": "Unknown API endpoint"})


if __name__ == "__main__":
    ensure_dirs()
    port = 8000
    server = ThreadingHTTPServer(("0.0.0.0", port), WeddingDBHandler)
    print(f"Wedding Mini-DB Server running at http://localhost:{port}/stationery.html")
    print(f"Admin Studio available at       http://localhost:{port}/admin.html")
    server.serve_forever()

