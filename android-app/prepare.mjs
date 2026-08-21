// Tạo www/index.html cho APK = bản artifact tự chứa (offline) + đoạn xin quyền Vị trí trong WebView.
// Chạy: node prepare.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const src = join(repoRoot, 'NLU-Wayfinder-Campus.html');
const outDir = join(here, 'www');
mkdirSync(outDir, { recursive: true });

let html = readFileSync(src, 'utf8');

// Khi chạy trong Capacitor (WebView), xin quyền Vị trí để navigator.geolocation hoạt động.
const prelude =
  '\n<script>document.addEventListener("DOMContentLoaded",function(){try{' +
  'var G=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Geolocation;' +
  'if(G&&G.requestPermissions)G.requestPermissions().catch(function(){});' +
  '}catch(e){}});</script>';

if (/<meta charset=["']utf-8["']>/i.test(html)) {
  html = html.replace(/(<meta charset=["']utf-8["']>)/i, '$1' + prelude);
} else {
  html = prelude + html;
}

writeFileSync(join(outDir, 'index.html'), html, 'utf8');
console.log('Wrote', join(outDir, 'index.html'), '(' + html.length + ' bytes)');
