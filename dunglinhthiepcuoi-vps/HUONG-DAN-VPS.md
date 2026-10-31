# Thiệp cưới Dũng & Linh — triển khai VPS

Gói này chứa bản website mới nhất, gồm ảnh cưới hai người thay vị trí cô gái, các cảnh thành phố, trang phục và chú thích mở ảnh.

## Các thư mục

- `dist/`: bản đã build, có thể chạy ngay bằng Nginx hoặc Apache. Giữ đầy đủ mọi tệp và thư mục con.
- `source/`: mã nguồn React/Vite, tài nguyên và package-lock để chỉnh sửa/build lại.
- `nginx.conf`: cấu hình HTTP mẫu cho Nginx trên Ubuntu/Debian.
- `BUILD-INFO.txt`: phiên bản mã nguồn và thông tin đóng gói.
- `LICENSE.md`: giấy phép mã nguồn gốc; phần ghi nguồn nằm trong `source/README.md`.

## Chạy ngay bằng Nginx

Website là bản tĩnh: không cần Node.js, PM2, cơ sở dữ liệu hay tài khoản Sites trên VPS để chạy thư mục `dist/`.

1. Upload ZIP lên VPS bằng SCP hoặc SFTP, rồi giải nén. Ví dụ:

```sh
unzip dunglinhthiepcuoi-vps.zip -d /tmp/dunglinhthiepcuoi-package
sudo mkdir -p /var/www/dunglinhthiepcuoi
sudo cp -a /tmp/dunglinhthiepcuoi-package/dist/. /var/www/dunglinhthiepcuoi/
```

Sau bước này, `index.html` phải ở `/var/www/dunglinhthiepcuoi/index.html`, không phải trong một thư mục `dist` lồng bên dưới.

2. Nếu VPS đã cài Nginx, chép cấu hình mẫu và sửa `server_name` thành tên miền hoặc IP của bạn:

```sh
sudo cp /tmp/dunglinhthiepcuoi-package/nginx.conf /etc/nginx/sites-available/dunglinhthiepcuoi
sudo nano /etc/nginx/sites-available/dunglinhthiepcuoi
sudo ln -s /etc/nginx/sites-available/dunglinhthiepcuoi /etc/nginx/sites-enabled/dunglinhthiepcuoi
sudo nginx -t
```

Chỉ khi `nginx -t` báo thành công, tải lại Nginx:

```sh
sudo systemctl reload nginx
```

Nếu dùng aaPanel, cPanel hoặc một website Nginx đã có sẵn, chỉ cần đặt thư mục gốc website vào nơi chứa nội dung `dist/` và áp dụng các `location` thích hợp trong cấu hình hiện tại. Không cần tạo thêm website trùng tên miền.

3. Trỏ DNS tên miền của bạn về VPS và bật HTTPS bằng chức năng SSL của panel hoặc cấu hình chứng chỉ trên Nginx. WebGPU cần ngữ cảnh bảo mật HTTPS (localhost là ngoại lệ).

## Lưu ý đường dẫn

- Triển khai ở gốc tên miền, ví dụ `https://ten-mien-cua-ban.vn/`. Mã hiện tại dùng đường dẫn tài nguyên bắt đầu bằng `/`, nên không đặt dưới `/thiep-cuoi/` mà chưa sửa mã nguồn.
- Phục vụ đầy đủ `models/`, `textures/`, `media/`, `fonts/`, `scenery/`, `wardrobe/`, `basis/`, `draco/` và `assets/` có trong `dist/`.
- Tệp `.wasm` phải được trả về đúng nội dung và MIME `application/wasm`. Cấu hình mẫu đã có phần này; không chuyển các yêu cầu tài nguyên thiếu thành trang `index.html`.
- Địa chỉ `*.chatgpt.site` do nền tảng Sites quản lý. Đưa tệp lên VPS không tự chuyển địa chỉ đó về VPS; hãy dùng tên miền hoặc IP của VPS.

## Chỉnh sửa và build lại

Bản này đã build thành công bằng Node.js `v22.22.1`.

```sh
cd source
npm ci
npm run dev
```

Để tạo bản triển khai mới:

```sh
npm run build
```

Kết quả nằm trong `source/dist/`. Chép nội dung thư mục này vào thư mục gốc website trên VPS và tải lại trang. Node.js chỉ dùng cho bước phát triển/build, không dùng để phục vụ bản tĩnh.

## Kiểm tra đã thực hiện

- `npm run build` thành công.
- Kiểm tra đủ tệp build, font, ảnh, mô hình và bộ giải mã cục bộ.
- Kiểm tra CRC toàn bộ tệp trong ZIP.

Chưa cài hay chạy trên VPS của bạn; cấu hình Nginx cần được kiểm tra bằng `nginx -t` trên chính máy chủ trước khi áp dụng.
