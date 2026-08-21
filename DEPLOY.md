# Triển khai NLU Wayfinder chạy chung một tên miền (Oracle Cloud + nginx)

Ứng dụng là **web tĩnh** (HTML/JS/CSS, không backend, không CSDL). Cách gọn nhất để "chạy
chung" với một website sẵn có là phục vụ nó như **thư mục con** `/maps/` của chính tên miền đó
— dùng lại HTTPS sẵn có, **không cần mở cổng mới, không cần DNS/chứng chỉ mới**.

> Tài liệu này ghi lại đúng quy trình đã triển khai thành công tại
> **https://el-nnth.hcmuaf.edu.vn/maps/** (Ubuntu + **nginx** đứng trước Moodle proxy `127.0.0.1:8080`).

## 1. Tải mã nguồn lên máy chủ
```bash
sudo git clone https://github.com/liemnh727706/maps_nlu.git /var/www/maps_nlu
```
Quyền mặc định của git (thư mục `755`, file `644`, owner `root`) là đủ để web server đọc. Nếu gặp
**403**: `sudo chown -R root:www-data /var/www/maps_nlu`.

## 2. Khối cấu hình nginx (dán vào bên trong `server { … }` phục vụ tên miền, khối `listen 443`)
```nginx
location ^~ /maps/ {
    alias /var/www/maps_nlu/;
    try_files $uri $uri/index.html =404;

    # --- Bảo mật (add_header ở location THAY THẾ toàn bộ header kế thừa -> khai báo đủ) ---
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://tile.openstreetmap.org https://server.arcgisonline.com; connect-src 'self' https://tile.openstreetmap.org https://server.arcgisonline.com; worker-src 'self' blob:; manifest-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(self), camera=(), microphone=()" always;   # GPS cho /maps, tắt camera/mic
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cache-Control "public, max-age=600" always;                                  # SW lo cache chính; ?v busting

    # --- Hiệu năng: nén (giảm ~4x cho JS) ---
    gzip on;
    gzip_types text/css application/javascript application/json application/manifest+json image/svg+xml;
    gzip_min_length 1024;
}
```
Kiểm tra & nạp lại:
```bash
sudo nginx -t && sudo systemctl reload nginx
curl -sI https://<TÊN_MIỀN>/maps/ | grep -iE "HTTP|permissions-policy"   # mong đợi: 200 + geolocation=(self)
```

### Ba điểm mấu chốt (nếu bỏ qua sẽ hỏng)
1. **`^~` là bắt buộc.** Site Moodle có các `location ~* \.(svg|css|png|…)$ { proxy_pass … }`.
   Nếu dùng `location /maps/` thường, request như `/maps/icon.svg` sẽ khớp regex đó và bị đẩy
   sang Moodle (hỏng logo/favicon). `^~` bảo nginx phục vụ **tĩnh** mọi thứ dưới `/maps/`, bỏ qua regex.
2. **`add_header Permissions-Policy "geolocation=(self)"`.** Nhiều site đặt ở cấp `server`
   `add_header Permissions-Policy "… geolocation=()" always;` — tức **tắt GPS toàn site**. Phải
   ghi đè riêng cho `/maps/` để app định vị được. (nginx: có `add_header` ở `location` sẽ thay thế
   toàn bộ `add_header` kế thừa của khối cha — chấp nhận được với thư mục tĩnh.)
3. **`try_files $uri $uri/index.html =404;` thay cho `index index.html;`.** Kết hợp `alias` + `index`
   của nginx có lỗi kinh điển: URL thư mục trần `/maps/` trả **404**. Dùng `try_files` như trên để
   `/maps/` phục vụ đúng `index.html`.

## 3. Kiểm tra
```bash
curl -sI https://<TÊN_MIỀN>/maps/                         # 200
curl -sI https://<TÊN_MIỀN>/maps/icon.svg | grep -i type  # content-type: image/svg+xml (không bị proxy)
```
Mở trên điện thoại: `https://<TÊN_MIỀN>/maps/` → bấm 📍 → *Cho phép* Vị trí. GPS/la bàn/điều hướng
cần HTTPS (đã có sẵn theo tên miền).

## 4. Cập nhật về sau
```bash
cd /var/www/maps_nlu && sudo git pull
```
Không cần đụng lại nginx. Bản web đã version-hoá tài nguyên `?v=N` để tránh cache cũ.

## Lỗi thường gặp
| Triệu chứng | Nguyên nhân & xử lý |
|---|---|
| `bash: syntax error near unexpected token '}'` | Đã gõ dòng cấu hình nginx **thẳng vào shell**. Cấu hình phải nằm **trong file** `.conf`, không phải lệnh bash. |
| `/maps/` → 404 nhưng `/maps/index.html` → 200 | Lỗi `alias` + `index`. Thay bằng `try_files $uri $uri/index.html =404;`. |
| `/maps/` trả header `geolocation=()` → GPS bị chặn | Site đặt Permissions-Policy tắt geolocation. Thêm `add_header Permissions-Policy "geolocation=(self)" always;` trong `location /maps/`. |
| `/maps/icon.svg` (hoặc .css) bị đẩy sang app khác / 404 | Thiếu `^~`. Đổi `location /maps/` → `location ^~ /maps/`. |
| 403 Forbidden | Quyền file, hoặc **SELinux** (Oracle Linux/RHEL): `sudo semanage fcontext -a -t httpd_sys_content_t "/var/www/maps_nlu(/.*)?" && sudo restorecon -Rv /var/www/maps_nlu`. (Ubuntu không cần.) |
| `nginx -t` OK nhưng không đổi | `nginx -t` chỉ kiểm tra; phải `sudo systemctl reload nginx` để áp dụng. |

## Bảo mật & hiệu năng
Ứng dụng là **web tĩnh, không backend/CSDL/đăng nhập** nên bề mặt tấn công nhỏ. Đã hardening:
- **Không phụ thuộc CDN bên thứ ba**: MapLibre được **self-host** (`vendor/`) — loại rủi ro chuỗi
  cung ứng (unpkg bị chiếm), tải nhanh & chạy cả khi CDN lỗi. CSP `script-src 'self'` (chỉ chạy JS nội bộ).
- **CSP + security headers**: đặt ở meta trong `index.html` và **bắt buộc ở HTTP header nginx**
  (`frame-ancestors` chỉ có tác dụng qua header). Chỉ cho kết nối tới host cần thiết
  (tile OSM/Esri), chặn khung nhúng (clickjacking), `nosniff`, `Referrer-Policy`, tắt camera/mic.
- **Bản artifact/APK** offline có CSP riêng **không cho phép mọi nguồn ngoài** (`connect-src 'self'`).
- **HTTPS bắt buộc** (đã có theo tên miền) → GPS/la bàn hoạt động; nên bật **HSTS ở cấp server**
  cho cả `el-nnth.hcmuaf.edu.vn` (nếu chưa): `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;` (đặt ở khối server, không chỉ /maps).
- **Hiệu năng**: Service Worker cache-first cho tài nguyên tĩnh (lần 2 tải tức thì), network-first
  cho `index.html`; bật `gzip`; tài nguyên version-hoá `?v=` để cache dài mà vẫn cập nhật đúng.
- **Bảo trì**: thỉnh thoảng cập nhật MapLibre (`vendor/`) lên bản vá mới; theo dõi cảnh báo bảo mật
  của Capacitor (`npm audit` trong `android-app/`).

## Về Oracle Cloud
Vì dùng lại cổng **443** của site sẵn có: **không** cần đổi Security List/NSG của VCN, **không** cần
đổi firewall OS, **không** cần chứng chỉ hay bản ghi DNS mới.

## Apache (nếu site dùng Apache thay vì nginx)
```apache
Alias /maps /var/www/maps_nlu
<Directory /var/www/maps_nlu>
    Require all granted
    Options -Indexes +FollowSymLinks
    DirectoryIndex index.html
    Header always set Permissions-Policy "geolocation=(self)"
</Directory>
```
`sudo a2enmod alias headers && sudo apache2ctl configtest && sudo systemctl reload apache2`

## Phương án B — tên miền con riêng (tuỳ chọn)
Nếu muốn `maps.<domain>` thay vì `/maps`: thêm bản ghi DNS `A` → cùng IP, tạo `server` block mới với
`root /var/www/maps_nlu;`, cấp chứng chỉ `sudo certbot --nginx -d maps.<domain>`. Nhiều việc hơn;
chỉ chọn khi cần địa chỉ riêng.
