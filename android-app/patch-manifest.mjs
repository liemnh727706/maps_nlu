// Thêm quyền Vị trí vào AndroidManifest.xml (Capacitor 6 không tự thêm).
// Chạy sau `npx cap add/sync android`, trước khi build Gradle.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const p = 'android/app/src/main/AndroidManifest.xml';
if (!existsSync(p)) { console.error('Không thấy manifest:', p); process.exit(1); }

let m = readFileSync(p, 'utf8');
const anchor = '<uses-permission android:name="android.permission.INTERNET" />';
const perms = [
  '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
  '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />'
];
const added = [];
for (const perm of perms) {
  if (!m.includes(perm)) { m = m.replace(anchor, anchor + '\n    ' + perm); added.push(perm); }
}
writeFileSync(p, m);
console.log('Patched manifest — thêm:', added.length ? added.join(', ') : '(đã có sẵn)');
