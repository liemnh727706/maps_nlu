// Chèn signingConfig (ký release) vào android/app/build.gradle — đọc từ biến môi trường (GitHub Secrets).
// Chạy sau `npx cap add/sync android`, trước `gradlew assembleRelease`.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const p = 'android/app/build.gradle';
if (!existsSync(p)) { console.error('Không thấy', p); process.exit(1); }
let g = readFileSync(p, 'utf8');

if (g.includes('signingConfigs')) { console.log('signingConfigs đã có — bỏ qua.'); process.exit(0); }

const signing = `
    signingConfigs {
        release {
            def kf = System.getenv("RELEASE_STORE_FILE")
            if (kf != null && !kf.isEmpty()) { storeFile file(kf) }
            storePassword System.getenv("RELEASE_STORE_PASSWORD")
            keyAlias System.getenv("RELEASE_KEY_ALIAS")
            keyPassword System.getenv("RELEASE_KEY_PASSWORD")
        }
    }`;

// chèn khối signingConfigs ngay sau 'android {'
if (!/android\s*\{/.test(g)) { console.error('Không thấy khối android {'); process.exit(1); }
g = g.replace(/android\s*\{/, (m) => m + signing);

// gán signingConfig cho buildTypes.release
const bt = /(buildTypes\s*\{\s*release\s*\{)/;
if (!bt.test(g)) { console.error('Không thấy buildTypes.release'); process.exit(1); }
g = g.replace(bt, '$1\n            signingConfig signingConfigs.release');

writeFileSync(p, g);
console.log('Đã chèn signingConfig release vào build.gradle.');
