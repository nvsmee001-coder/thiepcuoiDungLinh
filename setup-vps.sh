#!/usr/bin/env bash
# ==============================================================================
# AUTO-SETUP NGINX REVERSE PROXY CHO API THIỆP CƯỚI (PORT 8000) TRÊN VPS
# Chạy lệnh: sudo bash setup-vps.sh
# ==============================================================================
set -e

echo "🔗 Đang thiết lập các đường dẫn liên kết (Symlinks) để Nginx không bao giờ 404 file tĩnh..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
mkdir -p img/album audio data thiep-cuoi-khanh-linh-le-dung/assets
ln -sfn thiep-cuoi-khanh-linh-le-dung/assets assets
ln -sfn ../img thiep-cuoi-khanh-linh-le-dung/img
ln -sfn ../data thiep-cuoi-khanh-linh-le-dung/data
ln -sfn ../audio thiep-cuoi-khanh-linh-le-dung/audio
ln -sfn ../js thiep-cuoi-khanh-linh-le-dung/js
ln -sfn ../css thiep-cuoi-khanh-linh-le-dung/css

echo "🔍 Đang tìm file cấu hình Nginx cho dunglinhthiepcuoi.online / thiepcuoiDungLinh..."

NGINX_CONF=$(grep -rlE "dunglinhthiepcuoi\.online|thiepcuoiDungLinh" /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ /etc/nginx/sites-available/ 2>/dev/null | head -n 1 || true)

if [ -z "$NGINX_CONF" ]; then
  echo "⚠️ Không tìm thấy file cấu hình riêng trong /etc/nginx/sites-enabled hoặc conf.d."
  echo "👉 Hãy thêm đoạn sau vào trong khối server { ... } của domain dunglinhthiepcuoi.online:"
  cat << 'EOF'
    client_max_body_size 100M;
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
EOF
  exit 0
fi

echo "✅ Tìm thấy file cấu hình Nginx: $NGINX_CONF"

if grep -q "location /api/" "$NGINX_CONF"; then
  echo "✅ Cấu hình location /api/ đã có sẵn trong $NGINX_CONF!"
else
  cp "$NGINX_CONF" "${NGINX_CONF}.bak.$(date +%s)"
  python3 - "$NGINX_CONF" << 'PYEOF'
import sys, re

conf_path = sys.argv[1]
with open(conf_path, "r", encoding="utf-8") as f:
    content = f.read()

snippet = """
    client_max_body_size 100M;
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
"""

# Chèn ngay trước dòng location / { đầu tiên hoặc sau dòng server_name
if "location / {" in content:
    content = content.replace("location / {", snippet + "\n    location / {", 1)
elif "server_name" in content:
    content = re.sub(r"(server_name\s+[^;]+;)", r"\1\n" + snippet, content, count=1)

with open(conf_path, "w", encoding="utf-8") as f:
    f.write(content)
print("✅ Đã tự động chèn cấu hình proxy /api/ -> http://127.0.0.1:8000 vào", conf_path)
PYEOF
fi

echo "🔄 Đang kiểm tra và tải lại Nginx..."
nginx -t && systemctl reload nginx
echo "🎉 Hoàn tất! Giờ trang https://dunglinhthiepcuoi.online/admin đã kết nối thông suốt với API lưu ảnh & DB (Port 8000)!"

