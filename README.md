# NLU Wayfinder — Chỉ đường đi bộ Campus ĐH Nông Lâm TP.HCM

Ứng dụng chỉ đường đi bộ trong khuôn viên **Trường ĐH Nông Lâm TP.HCM (HCMUAF)**: sinh viên
tìm phòng học / phòng chức năng theo **mã phòng** hoặc **tên**, xem **lối đi thật** và được
**chỉ dẫn vào tận tầng/phòng**. Có **định vị GPS thời gian thực**, la bàn hướng đi và chế độ
**"Bắt đầu đi"** (điều hướng + giọng nói + báo khi tới nơi).

> Toạ độ toà nhà và mạng lối đi được lấy từ **OpenStreetMap** (giấy phép ODbL). Một số hạng mục
> theo sơ đồ 2014 chưa có trong OSM được đặt ở **vị trí ước lượng** (đánh dấu `approx`) — cần
> tinh chỉnh bằng Chế độ hiệu chỉnh.

## Hai bản

| Bản | File | Mô tả |
|---|---|---|
| **Web app** | `index.html` + `app.js` + `data.js` | Dùng **MapLibre GL** + nền OpenStreetMap / vệ tinh Esri. Có **Chế độ hiệu chỉnh** để kéo-thả đặt toạ độ thật + số hoá lối đi và **Xuất JSON**. |
| **Artifact (điện thoại)** | `NLU-Wayfinder-Campus.html` | Một file HTML **tự chứa, chạy offline**. Bản đồ vẽ bằng **SVG từ toạ độ OSM thật** (không cần tile ngoài). Có chia sẻ **mã QR**. |

## Tính năng
- Tìm theo **mã phòng** (`CT101`, `TV203`, `G01`, `208`, `402`, `R306`…), **tên** hoặc **viết tắt** (`vp hiệu trưởng`, `khoa cntt`…).
- Định tuyến **Dijkstra** trên mạng lối đi bộ nội bộ (không phụ thuộc Google trong campus), chỉ đường **từng bước**.
- **Chỉ dẫn trong nhà**: sơ đồ tầng + chấm đỏ vị trí phòng cho 7 giảng đường (gồm Nhà điều hành Thiên Lý tầng G→4).
- **Định vị GPS thời gian thực** + **la bàn hướng đi**, **bám theo** khi di chuyển; chọn **điểm xuất phát bất kỳ**.
- Chế độ **"Bắt đầu đi"**: khoảng cách/thời gian còn lại, chỉ dẫn bước kế tiếp, **giọng nói tiếng Việt**, **tự mở chỉ dẫn trong nhà** khi tới giảng đường.
- **Chia sẻ QR**, giao diện **sáng/tối**, responsive, PWA (web app có Service Worker).

## Chạy thử

Web app (cần một web server tĩnh vì có Service Worker / fetch):
```bash
python -m http.server 5599
# mở http://localhost:5599/index.html
```
Artifact: mở thẳng `NLU-Wayfinder-Campus.html` bằng trình duyệt (hoặc qua HTTPS để dùng GPS/la bàn).

> **GitHub Pages**: bật Pages cho repo (nhánh `main`, thư mục gốc) là có ngay bản web tại
> `https://<user>.github.io/maps_nlu/`. GPS/la bàn cần HTTPS — Pages đáp ứng.

> **Chạy chung một tên miền sẵn có** (vd `/maps` của một site nginx/Apache trên Oracle Cloud):
> xem hướng dẫn chi tiết trong [`DEPLOY.md`](DEPLOY.md).

## Cấu trúc
```
index.html app.js data.js sw.js manifest.webmanifest icon.svg   # web app (MapLibre)
NLU-Wayfinder-Campus.html                                       # artifact self-contained
build/
  artifact-body.html artifact-app.js qrlib.js                   # nguồn của artifact
  build_artifact.py                                             # ghép -> ../NLU-Wayfinder-Campus.html
  gen_data.py meta.js osm_roads.json overpass/*.ql              # sinh ../data.js từ OSM
docs/NLU_SoDo_2014.pdf                                          # sơ đồ nguồn 2014
```

## Build lại dữ liệu / artifact
```bash
python build/gen_data.py        # sinh lại data.js từ build/osm_roads.json + build/meta.js
python build/build_artifact.py  # ghép lại NLU-Wayfinder-Campus.html
```
Cập nhật mạng đường: chạy truy vấn trong `build/overpass/roads.ql` trên Overpass API rồi lưu
kết quả vào `build/osm_roads.json`.

## Đóng gói APK Android
App được bọc bằng **Capacitor** (WebView) từ **bản artifact offline** (`NLU-Wayfinder-Campus.html`),
nên APK **chạy hoàn toàn offline**: bản đồ SVG, định vị GPS, la bàn, điều hướng "Bắt đầu đi" đều hoạt động.

**Cách lấy APK (không cần cài Android SDK):**
1. Lên GitHub → tab **Actions** → workflow **Build Android APK** → **Run workflow** (hoặc mỗi lần push `main` sẽ tự build).
2. Mở lần chạy vừa xong → mục **Artifacts** → tải **`NLU-Wayfinder-apk`** (file `NLU-Wayfinder.apk`).
   - Khi bấm **Run workflow** thủ công, APK còn được đính vào **Release** `apk-latest`.
3. Trên điện thoại Android: bật *Cài đặt từ nguồn không xác định* rồi mở file `.apk` để cài.

Lần đầu mở app sẽ hỏi **quyền Vị trí** → chọn *Cho phép* để dùng GPS/la bàn.

**Build tại máy (nếu có Android SDK):**
```bash
cd android-app
npm install
node prepare.mjs          # tạo www/index.html từ artifact
npx cap add android
npx cap sync android
node patch-manifest.mjs    # thêm quyền Vị trí
cd android && ./gradlew assembleDebug
# APK: android-app/android/app/build/outputs/apk/debug/app-debug.apk
```
### Ký số bản RELEASE để phát rộng
Workflow tự động build **release đã ký** khi repo có đủ keystore trong **GitHub Secrets** (nếu chưa có thì build debug).

**B1. Tạo keystore** (chạy ở máy bạn — tự đặt & GHI NHỚ mật khẩu, KHÔNG chia sẻ):
```bash
keytool -genkeypair -v -keystore nlu-release.keystore -alias nlu \
  -keyalg RSA -keysize 2048 -validity 10000
```
> Giữ file `nlu-release.keystore` an toàn: **mất nó = không cập nhật app được nữa**; lộ nó = người khác ký giả app.

**B2. Mã hoá base64 để đưa vào Secret:**
```bash
base64 -w0 nlu-release.keystore > keystore.b64      # Linux/Git-Bash
# Windows PowerShell: [Convert]::ToBase64String([IO.File]::ReadAllBytes("nlu-release.keystore")) > keystore.b64
```

**B3. Thêm 4 Secrets** trong GitHub: repo → *Settings → Secrets and variables → Actions → New repository secret*:
| Secret | Giá trị |
|---|---|
| `KEYSTORE_BASE64` | nội dung file `keystore.b64` |
| `KEYSTORE_PASSWORD` | mật khẩu **store** đã đặt ở B1 |
| `KEY_ALIAS` | `nlu` (alias ở B1) |
| `KEY_PASSWORD` | mật khẩu **key** (thường trùng store) |

**B4.** Vào **Actions → Build Android APK → Run workflow**. Có secrets → ra **APK release đã ký** trong Artifacts/Release.

> ⚠️ Chỉ đặt keystore/mật khẩu trong **GitHub Secrets** (mã hoá, không lộ trong log). **Không** commit keystore vào repo. Muốn đưa lên Google Play, cân nhắc bật **Play App Signing**.

## Giấy phép & ghi công
- **Dữ liệu bản đồ:** © OpenStreetMap contributors, giấy phép **ODbL**.
- Thư viện QR nhúng sẵn: `qrcode-generator` (MIT).
- Mã nguồn dự án: **MIT** (xem `LICENSE`).
