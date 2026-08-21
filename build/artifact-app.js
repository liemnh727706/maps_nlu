/* NLU Wayfinder – artifact (self-contained, bản đồ SVG từ toạ độ OSM thật) */

/* ---- Đồ thị ---- */
let NODES = {}, EDGES = DEFAULT_EDGES, ADJ = {};
for (const k in DEFAULT_NODES) NODES[k] = DEFAULT_NODES[k];
function buildADJ() {
  ADJ = {}; for (const id in NODES) ADJ[id] = [];
  for (const [a, b] of EDGES) { if (!(a in NODES) || !(b in NODES)) continue; const w = hav(NODES[a], NODES[b]); ADJ[a].push([b, w]); ADJ[b].push([a, w]); }
}
function toRad(d) { return d * Math.PI / 180; }
function hav(a, b) { const R = 6371000, dLat = toRad(b[1] - a[1]), dLng = toRad(b[0] - a[0]), la1 = toRad(a[1]), la2 = toRad(b[1]); const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
function bearing(a, b) { const y = Math.sin(toRad(b[0] - a[0])) * Math.cos(toRad(b[1])); const x = Math.cos(toRad(a[1])) * Math.sin(toRad(b[1])) - Math.sin(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.cos(toRad(b[0] - a[0])); return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360; }
function compassVi(deg) { return ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'][Math.round(deg / 45) % 8]; }
function dijkstra(s, t) {
  if (!(s in NODES) || !(t in NODES)) return null;
  const dist = {}, prev = {}, done = {}; for (const id in NODES) dist[id] = Infinity; dist[s] = 0;
  while (true) { let u = null, best = Infinity; for (const id in NODES) if (!done[id] && dist[id] < best) { best = dist[id]; u = id; } if (u === null || u === t) break; done[u] = true; for (const [v, w] of ADJ[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; } }
  if (dist[t] === Infinity) return null;
  const path = []; let c = t; while (c !== undefined) { path.unshift(c); if (c === s) break; c = prev[c]; } return { path, distance: dist[t] };
}

/* ---- Tìm kiếm ---- */
function stripAccents(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D'); }
function norm(s) { return stripAccents((s || '').toLowerCase()).replace(/\s+/g, ' ').trim(); }
function expandAbbrev(s) { return s.replace(/\bvp\b/g, 'van phong').replace(/\bgd\b/g, 'giang duong').replace(/\btt\b/g, 'trung tam').replace(/\bbm\b/g, 'bo mon').replace(/\bp\b/g, 'phong').replace(/\bsv\b/g, 'sinh vien').replace(/\bql\b/g, 'quan ly').replace(/\bkhcn\b/g, 'khoa hoc cong nghe'); }
function fuzzy(t, nq, nq2) { t = norm(t); return t.includes(nq) || nq.includes(t) || (nq2 !== nq && (t.includes(nq2) || nq2.includes(t))); }
function isDetailed(bk) { const B = BUILDINGS[bk]; return !!(B && (B.rooms || B.floors)); }
function parseRoomCode(raw) {
  let s = raw.toUpperCase().replace(/[\s.]/g, '');
  const tl = BUILDINGS.TL.rooms.find(r => r.code.toUpperCase() === s.replace(/^TL/, ''));
  if (tl) return { b: 'TL', floor: tl.floor, room: tl.code, label: tl.code + ' – ' + tl.name };
  if (/^R\d{3}$/.test(s)) return { b: 'RD', floor: +s[1], room: s, label: s + ' (phòng máy CNTT)' };
  if (/^P\d{3}[A-Z]?$/.test(s)) return { b: 'RD', floor: +s[1], room: s, label: s };
  for (const p of PREFIXES) if (s.startsWith(p)) { const rest = s.slice(p.length); if (/^\d{2,3}[A-Z]?$/.test(rest)) { const f = +rest[0]; if (BUILDINGS[p] && f >= 1 && f <= BUILDINGS[p].floors) return { b: p, floor: f, room: p + rest, label: p + rest }; } }
  return null;
}
function search(q) {
  const out = []; q = q.trim();
  if (!q) { for (const bk in BUILDINGS) if (isDetailed(bk)) out.push({ b: bk, label: BUILDINGS[bk].name, kind: 'building' }); return out; }
  const p = parseRoomCode(q); if (p) out.push({ ...p, kind: 'room', label: p.label + ' – ' + BUILDINGS[p.b].name });
  const nq = norm(q), nq2 = expandAbbrev(nq);
  for (const bk in BUILDINGS) if (fuzzy(BUILDINGS[bk].name, nq, nq2) || norm(bk).includes(nq)) out.push({ b: bk, label: BUILDINGS[bk].name, kind: 'building' });
  for (const bk in BUILDINGS) { const B = BUILDINGS[bk]; if (!B.rooms) continue; for (const r of B.rooms) if (norm(r.code).includes(nq) || fuzzy(r.name, nq, nq2)) out.push({ b: bk, floor: r.floor, room: r.code, kind: 'room', label: r.code + ' – ' + r.name + ' · ' + B.name }); }
  for (const a of ALIASES) if (fuzzy(a.q, nq, nq2)) out.push({ ...a, kind: 'alias', label: a.label + ' – ' + BUILDINGS[a.b].name });
  const seen = new Set(); return out.filter(o => (seen.has(o.label) ? false : (seen.add(o.label), true))).slice(0, 10);
}

/* ---- Các bước chỉ đường ---- */
function buildSteps(path) {
  const segs = []; let total = 0;
  for (let i = 0; i < path.length - 1; i++) { const d = hav(NODES[path[i]], NODES[path[i + 1]]); total += d; segs.push({ d, brg: bearing(NODES[path[i]], NODES[path[i + 1]]) }); }
  if (!segs.length) return { steps: [{ instr: 'Bạn đang ở điểm đến', dist: 0 }], total: 0 };
  const legs = [{ dist: segs[0].d, brg: segs[0].brg, turn: 'start' }];
  for (let i = 1; i < segs.length; i++) { const diff = ((segs[i].brg - segs[i - 1].brg + 540) % 360) - 180; if (Math.abs(diff) > 30) legs.push({ dist: segs[i].d, brg: segs[i].brg, turn: diff > 0 ? 'right' : 'left' }); else legs[legs.length - 1].dist += segs[i].d; }
  const merged = []; for (const lg of legs) { if (merged.length && lg.dist < 15) merged[merged.length - 1].dist += lg.dist; else merged.push(lg); }
  const steps = merged.map((lg, i) => ({ instr: i === 0 ? `Xuất phát tại <b>${startLabel}</b>, đi về hướng <b>${compassVi(lg.brg)}</b>` : `${lg.turn === 'right' ? 'Rẽ phải' : 'Rẽ trái'}, đi tiếp về hướng <b>${compassVi(lg.brg)}</b>`, dist: lg.dist }));
  return { steps, total };
}

/* ---- Tầng & sơ đồ phòng ---- */
function floorLabel(i) { return i === 0 ? 'Trệt (G)' : String(i); }
function floorName(bk, i) { return i === 0 ? 'Tầng trệt (G)' : 'Tầng ' + i; }
function floorList(bk) { const B = BUILDINGS[bk]; if (B.rooms) return [...new Set(B.rooms.map(r => r.floor))].sort((a, b) => a - b).map(i => ({ idx: i, label: floorLabel(i) })); const a = []; for (let f = 1; f <= B.floors; f++) a.push({ idx: f, label: String(f) }); return a; }
function floorPlanSVG(bk, fi, target) {
  const B = BUILDINGS[bk]; let rooms;
  if (B.rooms) rooms = B.rooms.filter(r => r.floor === fi).map(r => ({ code: r.code, name: r.name }));
  else { rooms = []; for (let k = 0; k < B.roomsPerFloor; k++) rooms.push({ code: (B.prefix || bk) + (fi * 100 + (k + 1)), name: '' }); }
  if (!rooms.length) return `<div class="fp-note">Chưa có dữ liệu phòng cho ${floorName(bk, fi).toLowerCase()}.</div>`;
  const n = rooms.length, per = Math.ceil(n / 2), W = 360, rw = (W - 40) / per, rh = 56, cy = 96;
  let cells = '', tg = null;
  rooms.forEach((r, k) => { const top = k < per, col = top ? k : k - per, x = 20 + col * rw, y = top ? 20 : cy + 34; const hit = target && norm(r.code) === norm(target); if (hit) tg = { x: x + rw / 2, y: y + rh / 2, code: r.code, name: r.name, side: top ? 'trái (dãy A)' : 'phải (dãy B)', idx: col + 1 }; const nm = r.name ? `<text x="${x + rw / 2}" y="${y + rh - 8}" font-size="8" text-anchor="middle" fill="#5b6b5e">${r.name.slice(0, 20)}</text>` : ''; cells += `<rect x="${x + 2}" y="${y}" width="${rw - 4}" height="${rh}" rx="4" fill="${hit ? '#f7d774' : 'var(--fp-room)'}" stroke="${hit ? '#e0592f' : 'var(--fp-line)'}" stroke-width="${hit ? 3 : 1}"/><text x="${x + rw / 2}" y="${y + 20}" font-size="12" text-anchor="middle" fill="var(--fp-ink)" font-weight="${hit ? 700 : 600}">${r.code}</text>${nm}`; });
  const cor = `<rect x="20" y="${cy}" width="${W - 40}" height="30" fill="var(--fp-hall)"/><text x="${W / 2}" y="${cy + 19}" font-size="10" text-anchor="middle" fill="#8a9a8c">Hành lang</text>`;
  const stair = `<rect x="4" y="${cy - 12}" width="14" height="24" fill="#8aa"/><text x="11" y="${cy + 30}" font-size="9" text-anchor="middle" fill="#6a7a6c">${fi === 0 ? 'Sảnh' : 'Cầu thang'}</text>`;
  const entry = `<polygon points="${W / 2 - 8},${cy + 118} ${W / 2 + 8},${cy + 118} ${W / 2},${cy + 132}" fill="#1f7a3d"/><text x="${W / 2}" y="${cy + 148}" font-size="10" text-anchor="middle" fill="#1f7a3d">Cửa chính ▲</text>`;
  const pin = tg ? `<circle cx="${tg.x}" cy="${tg.y}" r="7" fill="#e0592f" stroke="#fff" stroke-width="2"/>` : '';
  const svg = `<svg viewBox="0 0 ${W} ${cy + 160}" width="100%" xmlns="http://www.w3.org/2000/svg"><rect x="18" y="16" width="${W - 36}" height="${cy + 76}" fill="none" stroke="var(--fp-line)" stroke-dasharray="4 3"/>${cor}${cells}${stair}${entry}${pin}</svg>`;
  const ft = fi === 0 ? 'ở <b>tầng trệt (G)</b>' : 'lên <b>tầng ' + fi + '</b>';
  const guide = tg ? `Vào <b>cửa chính</b> ${B.name}, ${ft}. Phòng <b>${tg.code}${tg.name ? ' – ' + tg.name : ''}</b> nằm ở <b>dãy ${tg.side}</b>, vị trí thứ <b>${tg.idx}</b> tính từ ${fi === 0 ? 'sảnh' : 'cầu thang'}.` : `Vào <b>cửa chính</b> ${B.name}, ${ft}. Xem sơ đồ tầng để tìm phòng.`;
  return `<div class="fp-svg">${svg}</div><div class="fp-guide">${guide}</div>`;
}
function openIndoor(dest) {
  const B = BUILDINGS[dest.b], fl = floorList(dest.b), active = dest.floor != null ? dest.floor : fl[0].idx, modal = document.getElementById('indoor');
  const tabs = fl.map(f => `<button class="ftab ${f.idx === active ? 'on' : ''}" data-f="${f.idx}">Tầng ${f.label}</button>`).join('');
  modal.innerHTML = `<div class="indoor-card"><div class="indoor-head" style="background:${B.color}"><span>${B.name}${dest.room ? ' · ' + dest.room : ''}</span><button id="closeIndoor" aria-label="Đóng">✕</button></div><div class="ftabs">${tabs}</div><div id="fpwrap">${floorPlanSVG(dest.b, active, dest.room)}</div></div>`;
  modal.classList.add('show');
  modal.querySelector('#closeIndoor').onclick = () => modal.classList.remove('show');
  modal.onclick = e => { if (e.target === modal) modal.classList.remove('show'); };
  modal.querySelectorAll('.ftab').forEach(t => t.onclick = () => { modal.querySelectorAll('.ftab').forEach(x => x.classList.remove('on')); t.classList.add('on'); const f = +t.dataset.f; document.getElementById('fpwrap').innerHTML = floorPlanSVG(dest.b, f, (dest.room && f === dest.floor) ? dest.room : null); });
}

/* ---- Bản đồ SVG (chiếu toạ độ thật sang lưới mét) ---- */
let PROJ, WORLD, VB, svgEl, markers = {}, currentDest = null, currentStart = 'START';
let placeLabels = {}, streetEls = [], lastLabelScale = -1;
function shortLabel(s) {
  return s.replace('Giảng đường', 'GĐ').replace('Trung tâm', 'TT').replace('Ký túc xá', 'KTX')
    .replace('Bãi giữ xe', 'Bãi xe').replace('Văn phòng', 'VP').replace('Nhà điều hành', 'Nhà ĐH')
    .replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}
let startLabel = NODE_LABEL.START, pickStart = false, tapMoved = false;
let gpsActive = false, gpsWatch = null, gpsPos = null, firstFix = false;
let gpsHeading = null, headingHandler = null, gpsXY = null, followMode = false;
let navMode = false, navDest = null, navMute = false, lastNavSpoken = null;
function setStartNode(id, label) { currentStart = id; startLabel = label; setUser(id); if (currentDest) selectDest(currentDest); }
function setPick(on) { pickStart = on; const b = document.getElementById('pickBtn'); if (b) b.classList.toggle('on', on); svgEl.classList.toggle('picking', on); }
function setupProjection() {
  let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
  for (const id in NODES) { const [lo, la] = NODES[id]; a = Math.min(a, lo); b = Math.max(b, lo); c = Math.min(c, la); d = Math.max(d, la); }
  const lat0 = (c + d) / 2, kx = 111320 * Math.cos(lat0 * Math.PI / 180), ky = 110540;
  PROJ = { minLon: a, maxLat: d, kx, ky };
  WORLD = { w: (b - a) * kx, h: (d - c) * ky };
}
function P(ll) { return [(ll[0] - PROJ.minLon) * PROJ.kx, (PROJ.maxLat - ll[1]) * PROJ.ky]; }
function svgPx() { const r = svgEl.getBoundingClientRect(); return { w: r.width || 800, h: r.height || 600 }; }
function setVB() { svgEl.setAttribute('viewBox', `${VB.x} ${VB.y} ${VB.w} ${VB.h}`); restyle(); }
function fullView() { const pad = 40, px = svgPx(); const ar = px.w / px.h; let w = WORLD.w + pad * 2, h = WORLD.h + pad * 2; if (w / h < ar) w = h * ar; else h = w / ar; VB = { x: -pad - (w - WORLD.w - pad * 2) / 2, y: -pad - (h - WORLD.h - pad * 2) / 2, w, h }; setVB(); }
function restyle() {
  const px = svgPx(); const scale = px.w / VB.w; // px per metre
  for (const bk in markers) { const m = markers[bk], det = isDetailed(bk); const r = (det ? 8.5 : 4.5) / scale; m.c.setAttribute('r', r); m.c.setAttribute('stroke-width', 2 / scale); if (m.t) { m.t.setAttribute('font-size', (11 / scale) + 'px'); m.t.setAttribute('y', P(NODES[bk])[1] + (3.5 / scale)); } }
  const u = document.getElementById('usermk'); if (u) { u.setAttribute('r', 6 / scale); u.setAttribute('stroke-width', 2.5 / scale); }
  const gd = document.getElementById('gpsdot'); if (gd) { gd.setAttribute('r', 6.5 / scale); gd.setAttribute('stroke-width', 3 / scale); }
  placeGpsMarker();
  if (Math.abs(scale - lastLabelScale) > 1e-9) { lastLabelScale = scale; styleLabels(scale); }
}
function renderBase() {
  let ed = '';
  for (const [a, b] of EDGES) { if (!(a in NODES) || !(b in NODES)) continue; const p1 = P(NODES[a]), p2 = P(NODES[b]); ed += `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`; }
  document.getElementById('edges').setAttribute('d', ed);
  const g = document.getElementById('markers'); g.innerHTML = '';
  const order = Object.keys(BUILDINGS).sort((a, b) => (isDetailed(a) ? 1 : 0) - (isDetailed(b) ? 1 : 0)); // POI dưới, giảng đường trên
  for (const bk of order) {
    const B = BUILDINGS[bk], [x, y] = P(NODES[bk]), det = isDetailed(bk);
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('fill', B.color); c.setAttribute('stroke', 'var(--mk-ring)'); c.setAttribute('class', 'mk' + (det ? ' det' : '') + (B.approx ? ' approx' : ''));
    c.addEventListener('click', e => { e.stopPropagation(); selectDest({ b: bk }); });
    const ti = document.createElementNS('http://www.w3.org/2000/svg', 'title'); ti.textContent = B.name; c.appendChild(ti);
    g.appendChild(c); let t = null;
    if (det) { t = document.createElementNS('http://www.w3.org/2000/svg', 'text'); t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('text-anchor', 'middle'); t.setAttribute('class', 'mklab'); t.textContent = bk; t.addEventListener('click', e => { e.stopPropagation(); selectDest({ b: bk }); }); g.appendChild(t); }
    markers[bk] = { c, t };
  }
  // Nhãn tên địa điểm (dưới marker)
  const gl = document.getElementById('g-labels'); gl.innerHTML = ''; placeLabels = {};
  for (const bk of order) {
    const tx = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tx.setAttribute('class', 'mklab2'); tx.textContent = shortLabel(BUILDINGS[bk].name);
    tx.addEventListener('click', e => { e.stopPropagation(); selectDest({ b: bk }); });
    gl.appendChild(tx); placeLabels[bk] = tx;
  }
  // Nhãn tên đường
  const gs = document.getElementById('g-streets'); gs.innerHTML = ''; streetEls = [];
  if (typeof STREETS !== 'undefined') for (const s of STREETS) {
    const tx = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tx.setAttribute('class', 'stlab'); tx.textContent = s.n;
    gs.appendChild(tx); streetEls.push({ el: tx, a: s.a, b: s.b });
  }
  lastLabelScale = -1;
}
function styleLabels(scale) {
  const fs = 12 / scale;
  const showPOI = scale >= 1.5, showStreet = scale >= 1.15;
  for (const bk in placeLabels) {
    const L = placeLabels[bk], [x, y] = P(NODES[bk]);
    L.setAttribute('x', x); L.setAttribute('y', y + (isDetailed(bk) ? 10 : 7) / scale);
    L.setAttribute('font-size', fs + 'px');
    const on = isDetailed(bk) || showPOI || (currentDest && currentDest.b === bk);
    L.style.display = on ? '' : 'none';
  }
  for (const s of streetEls) {
    const [ax, ay] = P(s.a), [bx, by] = P(s.b); let ang = Math.atan2(by - ay, bx - ax) * 180 / Math.PI;
    if (ang > 90) ang -= 180; else if (ang < -90) ang += 180;
    s.el.setAttribute('font-size', (11 / scale) + 'px');
    s.el.setAttribute('transform', `translate(${(ax + bx) / 2} ${(ay + by) / 2}) rotate(${ang})`);
    s.el.style.display = showStreet ? '' : 'none';
  }
}
function setUser(id) { if (gpsActive) { document.getElementById('usermk').setAttribute('opacity', 0); return; } const [x, y] = P(NODES[id]); const u = document.getElementById('usermk'); u.setAttribute('cx', x); u.setAttribute('cy', y); u.setAttribute('opacity', 1); }
function drawRoute(path) { let d = ''; path.forEach((id, i) => { const [x, y] = P(NODES[id]); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }); document.getElementById('route').setAttribute('d', d); }
function fitRoute(path) {
  let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const id of path) { const [x, y] = P(NODES[id]); a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, y); d = Math.max(d, y); }
  const px = svgPx(), ar = px.w / px.h, pad = 60; let w = (b - a) + pad * 2, h = (d - c) + pad * 2; if (w / h < ar) w = h * ar; else h = w / ar; VB = { x: a - (w - (b - a)) / 2, y: c - (h - (d - c)) / 2, w, h }; setVB();
}

/* ---- Chọn điểm đến ---- */
function selectDest(dest) {
  currentDest = dest; const B = BUILDINGS[dest.b], r = dijkstra(currentStart, dest.b);
  document.getElementById('results').innerHTML = ''; document.getElementById('q').value = '';
  for (const bk in markers) markers[bk].c.classList.toggle('sel', bk === dest.b);
  for (const bk in placeLabels) { placeLabels[bk].classList.toggle('sel', bk === dest.b); if (bk === dest.b) placeLabels[bk].style.display = ''; }
  if (!r) { document.getElementById('panel').innerHTML = '<div class="ph">Không tìm được đường tới điểm này.</div>'; return; }
  drawRoute(r.path); setUser(currentStart); if (!(gpsActive && followMode)) fitRoute(r.path);
  const { steps, total } = buildSteps(r.path), mins = Math.max(1, Math.round(total / 1.35 / 60));
  let sH = steps.map((s, i) => `<li><span class="sn">${i + 1}</span><span>${s.instr} <b>~${Math.round(s.dist)} m</b></span></li>`).join('');
  sH += `<li class="arr"><span class="sn">🏁</span><span>Đến <b>${B.name}</b></span></li>`;
  const sub = (dest.room ? 'Phòng ' + dest.room + ' · ' : '') + (dest.floor != null ? floorName(dest.b, dest.floor) + ' · ' : '') + (B.cat || B.name);
  const indoorBtn = isDetailed(dest.b) ? `<button id="indoorBtn" class="btn ghost">🏢 Chỉ dẫn trong nhà →</button>` : `<div class="fp-note">📍 Điểm đến ngoài trời — chưa số hoá phòng bên trong.${B.approx ? ' <b>⚠ Vị trí ước lượng</b> (chưa có trong OSM).' : ''}</div>`;
  const navBtn = navMode ? '' : `<button id="navBtn" class="btn primary">▶ Bắt đầu đi (định vị GPS)</button>`;
  document.getElementById('panel').innerHTML = `<div class="dh" style="border-color:${B.color}"><div class="dc" style="background:${B.color}">${dest.b.length > 3 ? '📍' : dest.b}</div><div><div class="dn">${dest.label || B.name}</div><div class="ds">${sub}</div></div></div><div class="di">${B.info}</div><div class="rm">🚶 <b>${Math.round(total)} m</b> · ~<b>${mins} phút</b> đi bộ · từ ${startLabel}</div><ol class="steps">${sH}</ol><div class="destbtns">${navBtn}${indoorBtn}</div>`;
  const nb = document.getElementById('navBtn'); if (nb) nb.onclick = startNav;
  const ib = document.getElementById('indoorBtn'); if (ib) ib.onclick = () => openIndoor(dest);
  if (window.innerWidth <= 780) document.getElementById('map').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---- Tìm kiếm UI + GPS ---- */
function renderResults(list) {
  const box = document.getElementById('results');
  if (!list.length) { box.innerHTML = '<div class="nr">Không tìm thấy. Thử: CT101, TV203, G01, 208, "Phòng Đào tạo", "Thư viện", "Cư xá A"…</div>'; return; }
  box.innerHTML = list.map((o, i) => `<div class="res" data-i="${i}"><span class="tag ${o.kind}">${o.kind === 'room' ? o.room : (o.b.length > 3 ? '📍' : o.b)}</span><span>${o.label}</span></div>`).join('');
  box.querySelectorAll('.res').forEach(el => el.onclick = () => selectDest(list[+el.dataset.i]));
}
/* Định vị GPS thời gian thực (theo dõi vị trí đang đứng) */
function setGpsStatus(txt) { const el = document.getElementById('gpsStatus'); el.textContent = txt; el.style.display = txt ? 'block' : 'none'; }
function hideGps() { for (const id of ['gpsdot', 'gpsacc', 'gpshead']) document.getElementById(id).setAttribute('opacity', 0); document.getElementById('gpsacc').classList.remove('live'); gpsXY = null; }
function placeGpsMarker() {
  if (!gpsXY) return;
  const s = VB.w / svgPx().w; // mét trên mỗi pixel
  const gd = document.getElementById('gpsdot'); gd.setAttribute('cx', gpsXY[0]); gd.setAttribute('cy', gpsXY[1]); gd.setAttribute('opacity', 1);
  const gh = document.getElementById('gpshead');
  if (gpsHeading != null) { gh.setAttribute('transform', `translate(${gpsXY[0]} ${gpsXY[1]}) rotate(${gpsHeading}) scale(${s})`); gh.setAttribute('opacity', 1); }
  else gh.setAttribute('opacity', 0);
}
function startHeading() {
  const h = e => {
    let deg = null;
    if (e.webkitCompassHeading != null) deg = e.webkitCompassHeading;      // iOS: 0=Bắc, thuận chiều kim đồng hồ
    else if (e.absolute && e.alpha != null) deg = 360 - e.alpha;           // Android absolute
    else if (e.alpha != null) deg = 360 - e.alpha;
    if (deg != null) { gpsHeading = (deg % 360 + 360) % 360; placeGpsMarker(); }
  };
  headingHandler = h;
  const add = () => { window.addEventListener('deviceorientationabsolute', h, true); window.addEventListener('deviceorientation', h, true); };
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function')
    DeviceOrientationEvent.requestPermission().then(r => { if (r === 'granted') add(); }).catch(() => {});
  else add();
}
function stopHeading() { if (headingHandler) { window.removeEventListener('deviceorientationabsolute', headingHandler, true); window.removeEventListener('deviceorientation', headingHandler, true); } headingHandler = null; gpsHeading = null; const gh = document.getElementById('gpshead'); if (gh) gh.setAttribute('opacity', 0); }
function centerOnGps() { if (!gpsPos) return; const [x, y] = P(gpsPos); const w = Math.min(VB.w, WORLD.w * 0.32), h = w * (VB.h / VB.w); VB = { x: x - w / 2, y: y - h / 2, w, h }; clampVB(); setVB(); }
function centerOnGpsKeep() { if (!gpsXY) return; VB.x = gpsXY[0] - VB.w / 2; VB.y = gpsXY[1] - VB.h / 2; clampVB(); setVB(); }
function recenter() { if (!gpsActive) { startGPS(); return; } followMode = true; centerOnGps(); }
function startGPS() {
  if (!navigator.geolocation) { alert('Thiết bị/trình duyệt không hỗ trợ định vị GPS.'); return; }
  if (window.isSecureContext === false) { alert('Định vị GPS cần kết nối bảo mật (HTTPS). Hãy mở ứng dụng qua địa chỉ https://…'); return; }
  gpsActive = true; firstFix = true; followMode = true;
  document.getElementById('gpsBtn').classList.add('on');
  setGpsStatus('Đang định vị… (cho phép quyền Vị trí nếu được hỏi)');
  const opt = { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 };
  navigator.geolocation.getCurrentPosition(onGPS, () => {}, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }); // định vị nhanh lần đầu
  gpsWatch = navigator.geolocation.watchPosition(onGPS, onGPSErr, opt);
  startHeading();
}
function stopGPS() { gpsActive = false; if (gpsWatch != null) navigator.geolocation.clearWatch(gpsWatch); gpsWatch = null; document.getElementById('gpsBtn').classList.remove('on'); stopHeading(); hideGps(); setGpsStatus(''); }
function onGPS(pos) {
  const lng = pos.coords.longitude, lat = pos.coords.latitude, acc = pos.coords.accuracy || 30;
  gpsPos = [lng, lat];
  const [x, y] = P([lng, lat]); gpsXY = [x, y];
  const ga = document.getElementById('gpsacc');
  ga.setAttribute('cx', x); ga.setAttribute('cy', y); ga.setAttribute('r', Math.min(Math.max(acc, 4), 150)); ga.setAttribute('opacity', 1); ga.classList.add('live');
  placeGpsMarker(); restyle();
  let best = null, bd = Infinity; for (const id in NODES) { const d = hav([lng, lat], NODES[id]); if (d < bd) { bd = d; best = id; } }
  if (bd > 900) { setGpsStatus('⚠ Bạn đang ở ngoài campus (~' + Math.round(bd) + ' m).'); if (firstFix) { firstFix = false; centerOnGps(); } return; }
  setGpsStatus('📍 Vị trí của bạn · độ chính xác ±' + Math.round(acc) + ' m' + (currentDest ? '' : ' — hãy chọn điểm đến'));
  if (best !== currentStart || startLabel !== 'Vị trí của bạn (GPS)') { currentStart = best; startLabel = 'Vị trí của bạn (GPS)'; if (currentDest) selectDest(currentDest); }
  if (navMode) updateNav();
  if (firstFix) { firstFix = false; centerOnGps(); }
  else if (followMode) centerOnGpsKeep();
}
function onGPSErr(e) {
  let msg = 'Không lấy được vị trí GPS.';
  if (e && e.code === 1) msg = 'Bạn đã từ chối quyền Vị trí. Hãy bật lại quyền Vị trí cho trang này trong trình duyệt rồi thử lại.';
  else if (e && e.code === 2) msg = 'Không xác định được vị trí (tín hiệu GPS yếu). Hãy ra chỗ thoáng rồi thử lại.';
  else if (e && e.code === 3) msg = 'Hết thời gian định vị. Kiểm tra đã bật GPS/Vị trí trên điện thoại rồi thử lại.';
  alert(msg); stopGPS();
}
function toggleGPS() { if (gpsActive) { stopGPS(); setStartNode('START', NODE_LABEL.START); } else startGPS(); }

/* (q) Chế độ "Bắt đầu đi" – điều hướng thời gian thực + báo khi tới nơi */
function plain(s) { return s.replace(/<[^>]+>/g, ''); }
function speak(t) { if (navMute || !('speechSynthesis' in window)) return; try { const u = new SpeechSynthesisUtterance(t.replace(/[🎉📍↰↱•]/g, '')); u.lang = 'vi-VN'; u.rate = 1; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { } }
function showNavbar(on) { document.getElementById('navbar').classList.toggle('show', on); }
function startNav() {
  if (!currentDest) return;
  navDest = currentDest; navMode = true; lastNavSpoken = null;
  setGpsStatus(''); showNavbar(true);
  document.getElementById('navRemain').textContent = '…'; document.getElementById('navNext').textContent = 'Đang định vị vị trí của bạn…';
  if (!gpsActive) startGPS(); else { followMode = true; if (gpsXY) centerOnGps(); updateNav(); }
}
function stopNav() { navMode = false; navDest = null; showNavbar(false); if (gpsActive) followMode = true; }
function updateNav() {
  if (!navMode || !navDest) return;
  const r = dijkstra(currentStart, navDest.b);
  const B = BUILDINGS[navDest.b];
  if (!r) { document.getElementById('navNext').textContent = 'Không tìm được đường tới đích.'; return; }
  const remain = r.distance, distToDest = gpsPos ? hav(gpsPos, NODES[navDest.b]) : remain;
  if (distToDest < 25 || remain < 18) { arriveNav(); return; }
  const mins = Math.max(1, Math.round(remain / 1.35 / 60));
  const { steps } = buildSteps(r.path);
  const nextTxt = steps.length > 1 ? `Trong ~${Math.round(steps[0].dist)} m: ${plain(steps[1].instr)}` : `Đi thẳng ~${Math.round(remain)} m tới ${B.name}`;
  document.getElementById('navRemain').textContent = Math.round(remain) + ' m';
  document.getElementById('navEta').textContent = '· ~' + mins + ' phút';
  document.getElementById('navDestName').textContent = '→ ' + B.name;
  document.getElementById('navNext').textContent = nextTxt;
  if (nextTxt !== lastNavSpoken) { speak(nextTxt); lastNavSpoken = nextTxt; }
}
function arriveNav() {
  const dest = navDest, B = BUILDINGS[dest.b];
  document.getElementById('navRemain').textContent = 'Đã tới!'; document.getElementById('navEta').textContent = '';
  document.getElementById('navDestName').textContent = '';
  document.getElementById('navNext').textContent = '🎉 Bạn đã tới ' + B.name + (isDetailed(dest.b) ? ' — mở chỉ dẫn trong nhà…' : '');
  speak('Bạn đã tới ' + B.name);
  navMode = false;
  setTimeout(() => { showNavbar(false); if (isDetailed(dest.b)) openIndoor(dest); }, 2600);
}

/* (m) Chia sẻ + mã QR (thư viện qrcode-generator nhúng sẵn, không cần mạng) */
function openShare() {
  const url = location.href;
  let qrHTML;
  try { const qr = qrcode(0, 'M'); qr.addData(url); qr.make(); qrHTML = `<div class="qrbox"><img class="qr" alt="Mã QR mở NLU Wayfinder" src="${qr.createDataURL(6, 4)}"></div>`; }
  catch (e) { qrHTML = '<div class="fp-note">Không tạo được mã QR cho địa chỉ này.</div>'; }
  const modal = document.getElementById('share');
  modal.innerHTML = `<div class="share-card">
    <div class="share-head">Chia sẻ NLU Wayfinder<button id="closeShare" aria-label="Đóng">✕</button></div>
    <div class="share-body">
      <p>Quét mã QR để mở ứng dụng trên điện thoại khác:</p>
      ${qrHTML}
      <div class="share-url" id="shareUrl">${url}</div>
      <div class="share-actions">
        <button id="doShare" class="btn primary">📤 Chia sẻ liên kết</button>
        <button id="doCopy" class="btn ghost">📋 Sao chép</button>
      </div>
    </div></div>`;
  modal.classList.add('show');
  modal.querySelector('#closeShare').onclick = () => modal.classList.remove('show');
  modal.onclick = e => { if (e.target === modal) modal.classList.remove('show'); };
  modal.querySelector('#doShare').onclick = () => {
    if (navigator.share) navigator.share({ title: 'NLU Wayfinder', text: 'Chỉ đường campus ĐH Nông Lâm TP.HCM', url }).catch(() => {});
    else copyShare();
  };
  modal.querySelector('#doCopy').onclick = copyShare;
  function copyShare() { const t = 'Đã sao chép liên kết'; if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => flash(t)).catch(() => flash('Không sao chép được')); else flash('Trình duyệt không hỗ trợ sao chép'); }
  function flash(m) { const u = document.getElementById('shareUrl'); const old = u.textContent; u.textContent = '✓ ' + m; setTimeout(() => { u.textContent = old; }, 1500); }
}

/* ---- Pan / Zoom ---- */
function initPanZoom() {
  const pts = new Map(); let mode = null, panLast = null, pinch = null;
  svgEl.addEventListener('pointerdown', e => {
    svgEl.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) { mode = 'pan'; panLast = [e.clientX, e.clientY]; tapMoved = false; }
    else if (pts.size === 2) { mode = 'pinch'; const v = [...pts.values()]; pinch = { dist: Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]) || 1, mid: [(v[0][0] + v[1][0]) / 2, (v[0][1] + v[1][1]) / 2], vb: { ...VB } }; }
  });
  svgEl.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]); const px = svgPx();
    if (mode === 'pan' && pts.size === 1) {
      const dx = (e.clientX - panLast[0]) * VB.w / px.w, dy = (e.clientY - panLast[1]) * VB.h / px.h;
      if (Math.abs(e.clientX - panLast[0]) + Math.abs(e.clientY - panLast[1]) > 2) { tapMoved = true; followMode = false; }
      VB.x -= dx; VB.y -= dy; panLast = [e.clientX, e.clientY]; clampVB(); setVB();
    } else if (mode === 'pinch' && pts.size >= 2) {
      followMode = false;
      const v = [...pts.values()], dist = Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]) || 1, f = pinch.dist / dist;
      const w = pinch.vb.w * f, h = pinch.vb.h * f, mx = pinch.mid[0] / px.w, my = pinch.mid[1] / px.h;
      VB = { w, h, x: pinch.vb.x + (pinch.vb.w - w) * mx, y: pinch.vb.y + (pinch.vb.h - h) * my }; clampVB(); setVB();
    }
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size === 1) { mode = 'pan'; panLast = [...pts.values()][0]; } else if (pts.size === 0) mode = null; };
  svgEl.addEventListener('pointerup', up); svgEl.addEventListener('pointercancel', up);
  svgEl.addEventListener('wheel', e => { e.preventDefault(); followMode = false; const px = svgPx(), f = e.deltaY > 0 ? 1.15 : 1 / 1.15, mx = e.offsetX / px.w, my = e.offsetY / px.h, w = VB.w * f, h = VB.h * f; VB = { w, h, x: VB.x + (VB.w - w) * mx, y: VB.y + (VB.h - h) * my }; clampVB(); setVB(); }, { passive: false });
  // (h) chạm để đặt điểm xuất phát
  svgEl.addEventListener('click', e => {
    if (!pickStart || tapMoved) return;
    const px = svgPx(), wx = VB.x + (e.offsetX / px.w) * VB.w, wy = VB.y + (e.offsetY / px.h) * VB.h;
    let best = null, bd = Infinity; for (const id in NODES) { const [x, y] = P(NODES[id]); const dd = (x - wx) ** 2 + (y - wy) ** 2; if (dd < bd) { bd = dd; best = id; } }
    if (gpsActive) stopGPS();
    setStartNode(best, 'Vị trí bạn chọn'); setPick(false);
  });
}
function clampVB() { const maxW = WORLD.w * 2.2, minW = 35; if (VB.w > maxW) { const k = maxW / VB.w; VB.w *= k; VB.h *= k; } else if (VB.w < minW) { const k = minW / VB.w; VB.w *= k; VB.h *= k; } }
function zoomBy(f) { const w = VB.w * f, h = VB.h * f; VB = { w, h, x: VB.x + (VB.w - w) / 2, y: VB.y + (VB.h - h) / 2 }; clampVB(); setVB(); }

/* ---- Khởi động ---- */
window.addEventListener('DOMContentLoaded', () => {
  buildADJ(); setupProjection(); svgEl = document.getElementById('map');
  renderBase(); fullView(); initPanZoom();
  document.getElementById('usermk') && setUser('START');
  const q = document.getElementById('q');
  q.addEventListener('input', () => renderResults(search(q.value)));
  q.addEventListener('focus', () => renderResults(search(q.value)));
  document.getElementById('gpsBtn').onclick = toggleGPS;
  document.getElementById('fitBtn').onclick = fullView;
  document.getElementById('zin').onclick = () => zoomBy(1 / 1.4);
  document.getElementById('zout').onclick = () => zoomBy(1.4);
  document.getElementById('shareBtn').onclick = openShare;
  document.getElementById('navStop').onclick = stopNav;
  document.getElementById('navMute').onclick = function () { navMute = !navMute; this.textContent = navMute ? '🔇' : '🔊'; if (navMute && 'speechSynthesis' in window) speechSynthesis.cancel(); };
  document.getElementById('pickBtn').onclick = () => setPick(!pickStart);
  document.getElementById('recenterBtn').onclick = recenter;
  document.getElementById('homeBtn').onclick = () => { if (gpsActive) stopGPS(); setStartNode('START', NODE_LABEL.START); };
  const chips = document.getElementById('chips');
  chips.innerHTML = Object.keys(BUILDINGS).filter(isDetailed).map(bk => `<button class="chip" data-b="${bk}" style="border-color:${BUILDINGS[bk].color}">${BUILDINGS[bk].name.replace('Giảng đường ', 'GĐ ')}</button>`).join('');
  chips.querySelectorAll('.chip').forEach(c => c.onclick = () => selectDest({ b: c.dataset.b }));
  window.addEventListener('resize', () => { if (!VB || isNaN(VB.x) || isNaN(VB.w)) fullView(); else setVB(); });
});
