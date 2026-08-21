/* =========================================================================
   NLU Wayfinder – app logic
   Dữ liệu campus nằm ở data.js (load trước file này).
   ========================================================================= */
const LS_KEY = 'nlu_campus_override_v1';

/* ---------- Hình học ------------------------------------------------- */
function toRad(d) { return d * Math.PI / 180; }
function haversine(a, b) {
  const R = 6371000;
  const dLat = toRad(b[1] - a[1]), dLng = toRad(b[0] - a[0]);
  const la1 = toRad(a[1]), la2 = toRad(b[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function bearing(a, b) {
  const y = Math.sin(toRad(b[0] - a[0])) * Math.cos(toRad(b[1]));
  const x = Math.cos(toRad(a[1])) * Math.sin(toRad(b[1])) -
            Math.sin(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.cos(toRad(b[0] - a[0]));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
function compassVi(deg) {
  const d = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
  return d[Math.round(deg / 45) % 8];
}

/* ---------- Trạng thái đồ thị (có thể chỉnh sửa) --------------------- */
let NODES = {}, EDGES = [], ADJ = {}, nodeCounter = 0;

function loadCampus() {
  NODES = {}; for (const k in DEFAULT_NODES) NODES[k] = DEFAULT_NODES[k].slice();
  EDGES = DEFAULT_EDGES.map(e => e.slice());
  try {
    const ov = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (ov) {
      if (ov.nodes) for (const k in ov.nodes) NODES[k] = ov.nodes[k].slice();
      if (ov.buildings) for (const k in ov.buildings) NODES[k] = ov.buildings[k].slice();
      if (ov.edges) EDGES = ov.edges.map(e => e.slice());
    }
  } catch (e) { /* bỏ qua override hỏng */ }
  nodeCounter = Object.keys(NODES).filter(k => /^N\d+$/.test(k))
    .reduce((m, k) => Math.max(m, +k.slice(1)), 0);
  rebuildGraph();
}
function rebuildGraph() {
  ADJ = {}; for (const id in NODES) ADJ[id] = [];
  for (const [a, b] of EDGES) {
    if (!(a in NODES) || !(b in NODES)) continue;
    const w = haversine(NODES[a], NODES[b]);
    ADJ[a].push({ to: b, w }); ADJ[b].push({ to: a, w });
  }
}
function saveCampus() {
  const buildings = {}, nodes = {};
  for (const id in NODES) (id in BUILDINGS ? buildings : nodes)[id] = NODES[id];
  localStorage.setItem(LS_KEY, JSON.stringify({ buildings, nodes, edges: EDGES }));
}
function isBuilding(id) { return id in BUILDINGS; }

function dijkstra(start, goal) {
  if (!(start in NODES) || !(goal in NODES)) return null;
  const dist = {}, prev = {}, done = {};
  for (const id in NODES) dist[id] = Infinity;
  dist[start] = 0;
  while (true) {
    let u = null, best = Infinity;
    for (const id in NODES) if (!done[id] && dist[id] < best) { best = dist[id]; u = id; }
    if (u === null || u === goal) break;
    done[u] = true;
    for (const e of ADJ[u]) if (dist[u] + e.w < dist[e.to]) { dist[e.to] = dist[u] + e.w; prev[e.to] = u; }
  }
  if (dist[goal] === Infinity) return null;
  const path = []; let cur = goal;
  while (cur !== undefined) { path.unshift(cur); if (cur === start) break; cur = prev[cur]; }
  return { path, distance: dist[goal] };
}

/* ---------- Parse mã phòng + tìm kiếm -------------------------------- */
function stripAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}
function norm(s) { return stripAccents((s || '').toLowerCase()).replace(/\s+/g, ' ').trim(); }
// Mở rộng viết tắt phổ biến để tìm kiếm dễ hơn (vp -> van phong, gd -> giang duong...)
function expandAbbrev(s) {
  return s
    .replace(/\bvp\b/g, 'van phong').replace(/\bgd\b/g, 'giang duong')
    .replace(/\btt\b/g, 'trung tam').replace(/\bbm\b/g, 'bo mon')
    .replace(/\bp\b/g, 'phong').replace(/\bsv\b/g, 'sinh vien')
    .replace(/\bql\b/g, 'quan ly').replace(/\bkhcn\b/g, 'khoa hoc cong nghe');
}
function fuzzyMatch(target, nq, nq2) {
  const t = norm(target);
  return t.includes(nq) || nq.includes(t) || (nq2 !== nq && (t.includes(nq2) || nq2.includes(t)));
}
function isDetailed(bk) { const B = BUILDINGS[bk]; return !!(B && (B.rooms || B.floors)); }
function isRoadNode(id) { return /^r\d/.test(id); }

function parseRoomCode(raw) {
  let s = raw.toUpperCase().replace(/[\s.]/g, '');
  // Nhà điều hành Thiên Lý: G0x hoặc 3 chữ số (cho phép gõ kèm "TL")
  const stl = s.replace(/^TL/, '');
  const tl = BUILDINGS.TL.rooms.find(r => r.code.toUpperCase() === stl);
  if (tl) return { b: 'TL', floor: tl.floor, room: tl.code, label: tl.code + ' – ' + tl.name };
  // Rạng Đông đặc biệt: R306/R406, P304B
  if (/^R\d{3}$/.test(s)) return { b: 'RD', floor: +s[1], room: s, label: s + ' (phòng máy CNTT)' };
  if (/^P\d{3}[A-Z]?$/.test(s)) return { b: 'RD', floor: +s[1], room: s, label: s };
  // Giảng đường có prefix chữ cái
  for (const p of PREFIXES) {
    if (s.startsWith(p)) {
      const rest = s.slice(p.length);
      if (/^\d{2,3}[A-Z]?$/.test(rest)) {
        const floor = +rest[0];
        if (BUILDINGS[p] && floor >= 1 && floor <= BUILDINGS[p].floors) {
          return { b: p, floor, room: p + rest, label: p + rest };
        }
      }
    }
  }
  return null;
}

function search(query) {
  const out = [];
  const q = query.trim();
  if (!q) { for (const bk in BUILDINGS) if (isDetailed(bk)) out.push({ b: bk, label: BUILDINGS[bk].name, kind: 'building' }); return out; }
  const parsed = parseRoomCode(q);
  if (parsed) out.push({ ...parsed, kind: 'room', label: parsed.label + ' – ' + BUILDINGS[parsed.b].name });
  const nq = norm(q), nq2 = expandAbbrev(nq);
  for (const bk in BUILDINGS) {
    if (fuzzyMatch(BUILDINGS[bk].name, nq, nq2) || norm(bk).includes(nq))
      out.push({ b: bk, label: BUILDINGS[bk].name, kind: 'building' });
  }
  for (const bk in BUILDINGS) {
    const B = BUILDINGS[bk]; if (!B.rooms) continue;
    for (const r of B.rooms) {
      if (norm(r.code).includes(nq) || fuzzyMatch(r.name, nq, nq2))
        out.push({ b: bk, floor: r.floor, room: r.code, kind: 'room', label: r.code + ' – ' + r.name + ' · ' + B.name });
    }
  }
  for (const a of ALIASES) {
    if (fuzzyMatch(a.q, nq, nq2))
      out.push({ ...a, kind: 'alias', label: a.label + ' – ' + BUILDINGS[a.b].name });
  }
  const seen = new Set();
  return out.filter(o => (seen.has(o.label) ? false : (seen.add(o.label), true))).slice(0, 10);
}

/* ---------- Tầng & floor-plan --------------------------------------- */
function floorLabel(idx) { return idx === 0 ? 'Trệt (G)' : String(idx); }
function floorName(bk, idx) { return idx === 0 ? 'Tầng trệt (G)' : 'Tầng ' + idx; }
function floorList(bk) {
  const B = BUILDINGS[bk];
  if (B.rooms) {
    const set = [...new Set(B.rooms.map(r => r.floor))].sort((a, b) => a - b);
    return set.map(idx => ({ idx, label: floorLabel(idx) }));
  }
  const arr = []; for (let f = 1; f <= B.floors; f++) arr.push({ idx: f, label: String(f) });
  return arr;
}

function floorPlanSVG(bk, floorIdx, targetCode) {
  const B = BUILDINGS[bk];
  let rooms;
  if (B.rooms) rooms = B.rooms.filter(r => r.floor === floorIdx).map(r => ({ code: r.code, name: r.name }));
  else {
    rooms = [];
    for (let k = 0; k < B.roomsPerFloor; k++) rooms.push({ code: (B.prefix || bk) + (floorIdx * 100 + (k + 1)), name: '' });
  }
  if (!rooms.length) return `<div class="fp-note">Chưa có dữ liệu phòng cho ${floorName(bk, floorIdx).toLowerCase()}.</div>`;

  const n = rooms.length, perRow = Math.ceil(n / 2);
  const W = 360, roomW = (W - 40) / perRow, roomH = 56, corridorY = 96;
  let cells = '', target = null;
  rooms.forEach((r, k) => {
    const topRow = k < perRow, col = topRow ? k : k - perRow;
    const x = 20 + col * roomW, y = topRow ? 20 : corridorY + 34;
    const hit = targetCode && norm(r.code) === norm(targetCode);
    if (hit) target = { x: x + roomW / 2, y: y + roomH / 2, code: r.code, name: r.name, side: topRow ? 'trái (dãy A)' : 'phải (dãy B)', idx: col + 1 };
    const nm = r.name ? `<text x="${x + roomW / 2}" y="${y + roomH - 8}" font-size="8" text-anchor="middle" fill="#456">${r.name.slice(0, 20)}</text>` : '';
    cells += `<rect x="${x + 2}" y="${y}" width="${roomW - 4}" height="${roomH}" rx="4"
      fill="${hit ? '#ffd54a' : '#eef4ee'}" stroke="${hit ? '#e05a3a' : '#b9cdbc'}" stroke-width="${hit ? 3 : 1}"/>
      <text x="${x + roomW / 2}" y="${y + 20}" font-size="12" text-anchor="middle" fill="#234" font-weight="${hit ? 700 : 600}">${r.code}</text>${nm}`;
  });
  const corridor = `<rect x="20" y="${corridorY}" width="${W - 40}" height="30" fill="#dfe8df"/>
    <text x="${W / 2}" y="${corridorY + 19}" font-size="10" text-anchor="middle" fill="#789">Hành lang</text>`;
  const stair = `<rect x="4" y="${corridorY - 12}" width="14" height="24" fill="#8aa"/>
    <text x="11" y="${corridorY + 30}" font-size="9" text-anchor="middle" fill="#456">${floorIdx === 0 ? 'Sảnh' : 'Cầu thang'}</text>`;
  const entry = `<polygon points="${W / 2 - 8},${corridorY + 118} ${W / 2 + 8},${corridorY + 118} ${W / 2},${corridorY + 132}" fill="#1f7a3d"/>
    <text x="${W / 2}" y="${corridorY + 148}" font-size="10" text-anchor="middle" fill="#1f7a3d">Cửa chính ▲</text>`;
  const pin = target ? `<circle cx="${target.x}" cy="${target.y}" r="7" fill="#e05a3a" stroke="#fff" stroke-width="2"/>` : '';
  const svg = `<svg viewBox="0 0 ${W} ${corridorY + 160}" width="100%" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="16" width="${W - 36}" height="${corridorY + 76}" fill="none" stroke="#9bb" stroke-dasharray="4 3"/>
    ${corridor}${cells}${stair}${entry}${pin}</svg>`;

  const floorTxt = floorIdx === 0 ? 'ở <b>tầng trệt (G)</b>' : 'lên <b>tầng ' + floorIdx + '</b>';
  let guide;
  if (target)
    guide = `Vào <b>cửa chính</b> ${B.name}, ${floorTxt}. Phòng <b>${target.code}${target.name ? ' – ' + target.name : ''}</b> ` +
            `nằm ở <b>dãy ${target.side}</b>, vị trí thứ <b>${target.idx}</b> tính từ ${floorIdx === 0 ? 'sảnh' : 'cầu thang'}.`;
  else
    guide = `Vào <b>cửa chính</b> ${B.name}, ${floorTxt}. Xem sơ đồ tầng để tìm phòng.`;
  return `<div class="fp-svg">${svg}</div><div class="fp-guide">${guide}</div>`;
}

/* ---------- Bản đồ -------------------------------------------------- */
let map, mapReady = false, userMarker = null;
let currentDest = null, currentStart = 'START', startLabel = 'Cổng chính (QL1A – Đỗ Mười)', pickStart = false;
let gpsActive = false, gpsWatch = null, firstFix = false, followMode = false, gpsLast = null;
let navMode = false, navDest = null, navMute = false, lastNavSpoken = null;
function setStartNode(id, label) { currentStart = id; startLabel = label; if (mapReady) setUserMarker(NODES[id]); if (currentDest) selectDestination(currentDest); }
function setPickStart(on) { pickStart = on; const b = document.getElementById('pickBtn'); if (b) b.classList.toggle('on', on); if (map) map.getCanvas().style.cursor = on ? 'crosshair' : ''; }
const buildingMarkers = {}, nodeHandles = {};

const SAT_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

function initMap() {
  map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      sources: {
        osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap' },
        sat: { type: 'raster', tiles: [SAT_TILES], tileSize: 256, attribution: 'Imagery © Esri, Maxar' }
      },
      layers: [
        { id: 'osm', type: 'raster', source: 'osm' },
        { id: 'sat', type: 'raster', source: 'sat', layout: { visibility: 'none' } }
      ]
    },
    center: CAMPUS_CENTER, zoom: 15.4
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

  map.on('load', () => {
    map.addSource('paths', { type: 'geojson', data: pathsGeoJSON() });
    map.addLayer({ id: 'paths', type: 'line', source: 'paths', paint: { 'line-color': '#7fae8a', 'line-width': 3, 'line-dasharray': [2, 2] } });
    map.addSource('gpsacc', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'gpsacc', type: 'fill', source: 'gpsacc', paint: { 'fill-color': '#2f7ec2', 'fill-opacity': 0.15 } });
    map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'route', type: 'line', source: 'route', paint: { 'line-color': '#e05a3a', 'line-width': 6, 'line-opacity': 0.9 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
    for (const bk in BUILDINGS) createBuildingMarker(bk);
    setUserMarker(NODES[currentStart]);
    mapReady = true;
    if (currentDest) selectDestination(currentDest);
  });

  map.on('click', (e) => {
    if (pickStart) { const p = [e.lngLat.lng, e.lngLat.lat]; let best = null, bd = Infinity; for (const id in NODES) { const d = haversine(p, NODES[id]); if (d < bd) { bd = d; best = id; } } if (gpsActive) stopGPS(); setStartNode(best, 'Vị trí bạn chọn'); setPickStart(false); return; }
    if (editMode && currentTool === 'addnode') addNode([e.lngLat.lng, e.lngLat.lat]);
  });
  map.on('dragstart', (e) => { if (e.originalEvent) followMode = false; });
  map.on('zoomstart', (e) => { if (e.originalEvent) followMode = false; });
}

function pathsGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: EDGES.filter(([a, b]) => a in NODES && b in NODES)
      .map(([a, b]) => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: [NODES[a], NODES[b]] } }))
  };
}
function refreshPaths() { if (mapReady && map.getSource('paths')) map.getSource('paths').setData(pathsGeoJSON()); }

function createBuildingMarker(bk) {
  const B = BUILDINGS[bk];
  const el = document.createElement('div');
  if (isDetailed(bk)) { el.className = 'bmarker'; el.textContent = bk; }
  else { el.className = 'pmarker' + (B.approx ? ' approx' : ''); }
  el.style.background = B.color; el.title = B.name;
  const m = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(NODES[bk]).addTo(map);
  el.addEventListener('click', (ev) => { ev.stopPropagation(); if (editMode) onEditClick(bk); else selectDestination({ b: bk }); });
  m.on('dragend', () => { const l = m.getLngLat(); NODES[bk] = [l.lng, l.lat]; onGeometryEdited(); });
  buildingMarkers[bk] = m;
}
function setUserMarker(lnglat) {
  if (!userMarker) { const el = document.createElement('div'); el.className = 'umarker'; userMarker = new maplibregl.Marker({ element: el }).setLngLat(lnglat).addTo(map); }
  else userMarker.setLngLat(lnglat);
}

/* ---------- Chọn điểm đến + vẽ tuyến -------------------------------- */
function selectDestination(dest) {
  currentDest = dest;
  const B = BUILDINGS[dest.b];
  const r = dijkstra(currentStart, dest.b);
  document.getElementById('results').innerHTML = '';
  document.getElementById('q').value = '';
  if (!r) { document.getElementById('panel').innerHTML = '<div class="placeholder">Không tìm được đường tới toà nhà này (kiểm tra lối đi trong Chế độ hiệu chỉnh).</div>'; return; }

  if (mapReady && map.getSource('route')) {
    map.getSource('route').setData({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: r.path.map(id => NODES[id]) } }] });
    if (!(gpsActive && followMode)) { const b = new maplibregl.LngLatBounds(); r.path.forEach(id => b.extend(NODES[id])); map.fitBounds(b, { padding: 70, maxZoom: 18 }); }
  }

  const { steps, total } = buildSteps(r.path);
  const mins = Math.max(1, Math.round(total / 1.35 / 60));
  let stepsHTML = steps.map((s, i) => `<li><span class="stepnum">${i + 1}</span><span>${s.instr} <b>~${Math.round(s.dist)} m</b></span></li>`).join('');
  stepsHTML += `<li class="arrive"><span class="stepnum">🏁</span><span>Đến <b>${B.name}</b></span></li>`;
  const sub = (dest.room ? 'Phòng ' + dest.room + ' · ' : '') + (dest.floor != null ? floorName(dest.b, dest.floor) + ' · ' : '') + (B.cat ? B.cat : B.name);
  const indoorBtn = isDetailed(dest.b)
    ? `<button id="indoorBtn" class="btn ghost">🏢 Chỉ dẫn trong nhà →</button>`
    : `<div class="fp-note">📍 Điểm đến ngoài trời — chưa số hoá phòng bên trong.${B.approx ? ' <b>Vị trí ước lượng</b>, hãy tinh chỉnh bằng Chế độ hiệu chỉnh.' : ''}</div>`;
  const navBtn = navMode ? '' : `<button id="navBtn" class="btn primary">▶ Bắt đầu đi (định vị GPS)</button>`;

  document.getElementById('panel').innerHTML = `
    <div class="dest-head" style="border-color:${B.color}">
      <div class="dest-code" style="background:${B.color}">${dest.b}</div>
      <div><div class="dest-name">${dest.label || B.name}</div><div class="dest-sub">${sub}</div></div>
    </div>
    <div class="dest-info">${B.info}</div>
    <div class="route-meta">🚶 <b>${Math.round(total)} m</b> · ~<b>${mins} phút</b> đi bộ · từ ${startLabel}</div>
    <ol class="steps">${stepsHTML}</ol><div class="destbtns">${navBtn}${indoorBtn}</div>`;
  const nb = document.getElementById('navBtn'); if (nb) nb.addEventListener('click', startNav);
  const ib = document.getElementById('indoorBtn');
  if (ib) ib.addEventListener('click', () => openIndoor(dest));
}

function buildSteps(path) {
  // Gom các đoạn nhỏ (đỉnh OSM) thành "chặng" – chỉ tách khi thật sự rẽ.
  const segs = [];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const A = NODES[path[i]], B = NODES[path[i + 1]];
    const d = haversine(A, B); total += d;
    segs.push({ d, brg: bearing(A, B) });
  }
  if (!segs.length) return { steps: [{ instr: 'Bạn đang ở điểm đến', dist: 0 }], total: 0 };

  const TURN = 30;
  const legs = [{ dist: segs[0].d, brg: segs[0].brg, turn: 'start' }];
  for (let i = 1; i < segs.length; i++) {
    const diff = ((segs[i].brg - segs[i - 1].brg + 540) % 360) - 180;
    if (Math.abs(diff) > TURN) legs.push({ dist: segs[i].d, brg: segs[i].brg, turn: diff > 0 ? 'right' : 'left' });
    else legs[legs.length - 1].dist += segs[i].d;
  }
  // gộp chặng quá ngắn (<15 m) vào chặng trước
  const merged = [];
  for (const lg of legs) {
    if (merged.length && lg.dist < 15) merged[merged.length - 1].dist += lg.dist;
    else merged.push(lg);
  }
  const steps = merged.map((lg, i) => {
    let instr;
    if (i === 0) instr = `Xuất phát tại <b>${startLabel}</b>, đi về hướng <b>${compassVi(lg.brg)}</b>`;
    else instr = `${lg.turn === 'right' ? 'Rẽ phải' : 'Rẽ trái'}, đi tiếp về hướng <b>${compassVi(lg.brg)}</b>`;
    return { instr, dist: lg.dist };
  });
  return { steps, total };
}

/* ---------- View trong nhà ------------------------------------------ */
function openIndoor(dest) {
  const B = BUILDINGS[dest.b];
  const fl = floorList(dest.b);
  const active = dest.floor != null ? dest.floor : fl[0].idx;
  const modal = document.getElementById('indoor');
  const tabs = fl.map(f => `<button class="ftab ${f.idx === active ? 'on' : ''}" data-f="${f.idx}">Tầng ${f.label}</button>`).join('');
  modal.innerHTML = `
    <div class="indoor-card">
      <div class="indoor-head" style="background:${B.color}">
        <span>${B.name}${dest.room ? ' · ' + dest.room : ''}</span>
        <button id="closeIndoor" aria-label="Đóng">✕</button>
      </div>
      <div class="ftabs">${tabs}</div>
      <div id="fpwrap">${floorPlanSVG(dest.b, active, dest.room)}</div>
    </div>`;
  modal.classList.add('show');
  modal.querySelector('#closeIndoor').addEventListener('click', () => modal.classList.remove('show'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
  modal.querySelectorAll('.ftab').forEach(t => t.addEventListener('click', () => {
    modal.querySelectorAll('.ftab').forEach(x => x.classList.remove('on')); t.classList.add('on');
    const f = +t.dataset.f;
    const room = (dest.room && f === dest.floor) ? dest.room : null;
    document.getElementById('fpwrap').innerHTML = floorPlanSVG(dest.b, f, room);
  }));
}

/* ---------- CHẾ ĐỘ HIỆU CHỈNH (số hoá toạ độ + lối đi) --------------- */
let editMode = false, currentTool = 'move', edgeFirst = null;

function setBasemap(kind) {
  if (!mapReady) return;
  map.setLayoutProperty('sat', 'visibility', kind === 'sat' ? 'visible' : 'none');
}
function onGeometryEdited() { rebuildGraph(); refreshPaths(); saveCampus(); if (currentDest) selectDestination(currentDest); updateEditStats(); }

function toggleEdit() {
  editMode = !editMode;
  document.getElementById('editPanel').style.display = editMode ? 'block' : 'none';
  document.getElementById('editToggle').classList.toggle('on', editMode);
  setBasemap(editMode ? 'sat' : 'osm');
  if (editMode) { for (const id in NODES) if (!isBuilding(id) && !isRoadNode(id)) createHandle(id); }
  else { for (const id in nodeHandles) { nodeHandles[id].remove(); delete nodeHandles[id]; } edgeFirst = null; }
  applyDraggable(); updateEditStats();
}
function applyDraggable() {
  const drag = editMode && currentTool === 'move';
  for (const bk in buildingMarkers) buildingMarkers[bk].setDraggable(drag);
  for (const id in nodeHandles) nodeHandles[id].setDraggable(drag);
}
function setTool(t) {
  currentTool = t; edgeFirst = null;
  document.querySelectorAll('.tool').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
  document.querySelectorAll('.nhandle').forEach(h => h.classList.remove('sel'));
  document.getElementById('editHint').textContent = TOOL_HINT[t];
  applyDraggable();
}
const TOOL_HINT = {
  move: 'Kéo marker toà nhà (chữ) và node lối đi (chấm) về đúng vị trí trên ảnh vệ tinh.',
  addnode: 'Bấm lên bản đồ để THÊM node lối đi mới.',
  edge: 'Bấm 2 điểm (node hoặc toà nhà) để NỐI thành đoạn đường.',
  delnode: 'Bấm 1 node lối đi để XOÁ (kèm các đoạn nối). Không xoá được toà nhà.'
};

function createHandle(id) {
  const el = document.createElement('div'); el.className = 'nhandle'; el.dataset.id = id; el.title = id;
  const m = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(NODES[id]).addTo(map);
  el.addEventListener('click', (ev) => { ev.stopPropagation(); onEditClick(id); });
  m.on('dragend', () => { const l = m.getLngLat(); NODES[id] = [l.lng, l.lat]; onGeometryEdited(); });
  nodeHandles[id] = m; return m;
}
function onEditClick(id) {
  if (currentTool === 'edge') {
    if (!edgeFirst) { edgeFirst = id; markSel(id, true); }
    else if (edgeFirst !== id) { addEdge(edgeFirst, id); markSel(edgeFirst, false); edgeFirst = null; }
  } else if (currentTool === 'delnode') {
    if (isBuilding(id)) { alert('Không xoá được node toà nhà.'); return; }
    deleteNode(id);
  }
}
function markSel(id, on) {
  const el = isBuilding(id) ? buildingMarkers[id].getElement() : (nodeHandles[id] && nodeHandles[id].getElement());
  if (el) el.classList.toggle('sel', on);
}
function addNode(lnglat) {
  const id = 'N' + (++nodeCounter); NODES[id] = [lnglat[0], lnglat[1]];
  createHandle(id); applyDraggable(); onGeometryEdited();
}
function addEdge(a, b) {
  if (!EDGES.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) { EDGES.push([a, b]); onGeometryEdited(); }
}
function deleteNode(id) {
  delete NODES[id]; EDGES = EDGES.filter(e => e[0] !== id && e[1] !== id);
  if (nodeHandles[id]) { nodeHandles[id].remove(); delete nodeHandles[id]; }
  onGeometryEdited();
}
function updateEditStats() {
  const el = document.getElementById('editStats'); if (!el) return;
  const pathNodes = Object.keys(NODES).filter(k => !isBuilding(k)).length;
  el.textContent = `${Object.keys(BUILDINGS).length} toà · ${pathNodes} node lối đi · ${EDGES.length} đoạn`;
}
function resetCampus() {
  if (!confirm('Khôi phục toạ độ & lối đi về mặc định? Mọi chỉnh sửa đã lưu sẽ mất.')) return;
  localStorage.removeItem(LS_KEY); location.reload();
}
function exportJSON() {
  const buildings = {}, nodes = {};
  for (const id in NODES) {
    const v = [ +NODES[id][0].toFixed(6), +NODES[id][1].toFixed(6) ];
    (isBuilding(id) ? buildings : nodes)[id] = v;
  }
  const data = { buildings, nodes, edges: EDGES };
  const txt = JSON.stringify(data, null, 2);
  const m = document.getElementById('indoor');
  m.innerHTML = `<div class="indoor-card">
    <div class="indoor-head" style="background:#1f7a3d"><span>Xuất dữ liệu toạ độ & lối đi</span><button id="ce" aria-label="Đóng">✕</button></div>
    <div style="padding:12px 14px">
      <p style="font-size:12.5px;color:#456;margin:0 0 8px">Dán JSON này vào <b>DEFAULT_NODES / DEFAULT_EDGES</b> trong <code>data.js</code>, hoặc lưu file để nạp lại sau.</p>
      <textarea id="expArea" style="width:100%;height:230px;font:12px monospace;border:1px solid #c4d6c6;border-radius:8px;padding:8px" readonly>${txt.replace(/</g, '&lt;')}</textarea>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button id="copyExp" class="btn primary" style="flex:1">📋 Copy</button>
        <button id="dlExp" class="btn" style="flex:1;background:#eef5ef">⬇ Tải campus-data.json</button>
      </div>
    </div></div>`;
  m.classList.add('show');
  m.querySelector('#ce').onclick = () => m.classList.remove('show');
  m.querySelector('#copyExp').onclick = () => { navigator.clipboard.writeText(txt).then(() => alert('Đã copy JSON.')); };
  m.querySelector('#dlExp').onclick = () => {
    const blob = new Blob([txt], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'campus-data.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
}

/* ---------- Tìm kiếm UI + GPS --------------------------------------- */
function renderResults(list) {
  const box = document.getElementById('results');
  if (!list.length) { box.innerHTML = '<div class="noresult">Không tìm thấy. Thử: CT101, TV203, C102, RD200, G01, 208, "Phòng Đào tạo", "Khoa CNTT"…</div>'; return; }
  box.innerHTML = list.map((o, i) => `<div class="result" data-i="${i}"><span class="rtag ${o.kind}">${o.kind === 'room' ? o.room : o.b}</span><span>${o.label}</span></div>`).join('');
  box.querySelectorAll('.result').forEach(el => el.addEventListener('click', () => selectDestination(list[+el.dataset.i])));
}
function circlePolygon(center, radiusM, pts = 48) {
  const coords = [], R = 6378137, lat = center[1] * Math.PI / 180;
  for (let i = 0; i <= pts; i++) { const a = (i / pts) * 2 * Math.PI; const dx = radiusM * Math.cos(a), dy = radiusM * Math.sin(a); coords.push([center[0] + (dx / (R * Math.cos(lat))) * 180 / Math.PI, center[1] + (dy / R) * 180 / Math.PI]); }
  return { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } }] };
}
function setGpsStatus(txt) { const el = document.getElementById('gpsStatus'); if (!el) return; el.textContent = txt; el.style.display = txt ? 'block' : 'none'; }
function stopGPS() {
  gpsActive = false; if (gpsWatch != null) navigator.geolocation.clearWatch(gpsWatch); gpsWatch = null;
  document.getElementById('gpsBtn').classList.remove('on'); setGpsStatus('');
  if (mapReady && map.getSource('gpsacc')) map.getSource('gpsacc').setData({ type: 'FeatureCollection', features: [] });
  if (userMarker) userMarker.getElement().classList.remove('live');
}
function gpsErrMsg(e) {
  if (e && e.code === 1) return 'Bạn đã từ chối quyền Vị trí. Hãy bật lại quyền Vị trí cho trang này rồi thử lại.';
  if (e && e.code === 2) return 'Không xác định được vị trí (tín hiệu GPS yếu). Hãy ra chỗ thoáng rồi thử lại.';
  if (e && e.code === 3) return 'Hết thời gian định vị. Kiểm tra đã bật GPS/Vị trí trên thiết bị rồi thử lại.';
  return 'Không lấy được vị trí GPS.';
}
function toggleGPS() {
  if (gpsActive) { stopGPS(); setStartNode('START', 'Cổng chính (QL1A – Đỗ Mười)'); return; }
  if (!navigator.geolocation) { alert('Thiết bị/trình duyệt không hỗ trợ định vị GPS.'); return; }
  if (window.isSecureContext === false) { alert('Định vị GPS cần kết nối bảo mật (HTTPS).'); return; }
  gpsActive = true; firstFix = true; followMode = true;
  document.getElementById('gpsBtn').classList.add('on'); setGpsStatus('Đang định vị… (cho phép quyền Vị trí nếu được hỏi)');
  navigator.geolocation.getCurrentPosition(onGPS, () => {}, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
  gpsWatch = navigator.geolocation.watchPosition(onGPS, e => { alert(gpsErrMsg(e)); stopGPS(); }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 });
}
function recenterGPS() { if (!gpsActive) { toggleGPS(); return; } followMode = true; if (mapReady && gpsLast) map.easeTo({ center: gpsLast, zoom: 16.6 }); }
function onGPS(pos) {
  const lng = pos.coords.longitude, lat = pos.coords.latitude, acc = pos.coords.accuracy || 30, p = [lng, lat];
  gpsLast = p;
  if (mapReady) { setUserMarker(p); userMarker.getElement().classList.add('live'); if (map.getSource('gpsacc')) map.getSource('gpsacc').setData(circlePolygon(p, Math.min(Math.max(acc, 4), 150))); }
  let best = null, bd = Infinity; for (const id in NODES) { const d = haversine(p, NODES[id]); if (d < bd) { bd = d; best = id; } }
  if (mapReady) { if (firstFix) map.easeTo({ center: p, zoom: 16.6 }); else if (followMode) map.easeTo({ center: p }); }
  if (bd > 900) { setGpsStatus('⚠ Bạn đang ở ngoài campus (~' + Math.round(bd) + ' m).'); firstFix = false; return; }
  setGpsStatus('📍 Vị trí của bạn · ±' + Math.round(acc) + ' m' + (currentDest ? '' : ' — hãy chọn điểm đến'));
  if (best !== currentStart || startLabel !== 'Vị trí của bạn (GPS)') { currentStart = best; startLabel = 'Vị trí của bạn (GPS)'; if (currentDest) selectDestination(currentDest); }
  if (navMode) updateNav();
  firstFix = false;
}

/* (r) Chế độ "Bắt đầu đi" – điều hướng thời gian thực + báo khi tới nơi (bản web) */
function navPlain(s) { return s.replace(/<[^>]+>/g, ''); }
function navSpeak(t) { if (navMute || !('speechSynthesis' in window)) return; try { const u = new SpeechSynthesisUtterance(t.replace(/[🎉📍↰↱•]/g, '')); u.lang = 'vi-VN'; u.rate = 1; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { } }
function showNavbar(on) { document.getElementById('navbar').classList.toggle('show', on); }
function startNav() {
  if (!currentDest) return;
  navDest = currentDest; navMode = true; lastNavSpoken = null;
  setGpsStatus(''); showNavbar(true);
  document.getElementById('navRemain').textContent = '…'; document.getElementById('navNext').textContent = 'Đang định vị vị trí của bạn…';
  if (!gpsActive) toggleGPS(); else { followMode = true; updateNav(); }
}
function stopNav() { navMode = false; navDest = null; showNavbar(false); if (gpsActive) followMode = true; }
function updateNav() {
  if (!navMode || !navDest) return;
  const r = dijkstra(currentStart, navDest.b), B = BUILDINGS[navDest.b];
  if (!r) { document.getElementById('navNext').textContent = 'Không tìm được đường tới đích.'; return; }
  const remain = r.distance, distToDest = gpsLast ? haversine(gpsLast, NODES[navDest.b]) : remain;
  if (distToDest < 25 || remain < 18) { arriveNav(); return; }
  const mins = Math.max(1, Math.round(remain / 1.35 / 60)), { steps } = buildSteps(r.path);
  const nextTxt = steps.length > 1 ? `Trong ~${Math.round(steps[0].dist)} m: ${navPlain(steps[1].instr)}` : `Đi thẳng ~${Math.round(remain)} m tới ${B.name}`;
  document.getElementById('navRemain').textContent = Math.round(remain) + ' m';
  document.getElementById('navEta').textContent = '· ~' + mins + ' phút';
  document.getElementById('navDestName').textContent = '→ ' + B.name;
  document.getElementById('navNext').textContent = nextTxt;
  if (nextTxt !== lastNavSpoken) { navSpeak(nextTxt); lastNavSpoken = nextTxt; }
}
function arriveNav() {
  const dest = navDest, B = BUILDINGS[dest.b];
  document.getElementById('navRemain').textContent = 'Đã tới!'; document.getElementById('navEta').textContent = ''; document.getElementById('navDestName').textContent = '';
  document.getElementById('navNext').textContent = '🎉 Bạn đã tới ' + B.name + (isDetailed(dest.b) ? ' — mở chỉ dẫn trong nhà…' : '');
  navSpeak('Bạn đã tới ' + B.name);
  navMode = false;
  setTimeout(() => { showNavbar(false); if (isDetailed(dest.b)) openIndoor(dest); }, 2600);
}

/* ---------- Khởi động ---------------------------------------------- */
window.addEventListener('DOMContentLoaded', () => {
  loadCampus();
  initMap();
  const q = document.getElementById('q');
  q.addEventListener('input', () => renderResults(search(q.value)));
  q.addEventListener('focus', () => renderResults(search(q.value)));
  document.getElementById('gpsBtn').addEventListener('click', toggleGPS);
  document.getElementById('recenterBtn').addEventListener('click', recenterGPS);
  document.getElementById('navStop').addEventListener('click', stopNav);
  document.getElementById('navMute').addEventListener('click', function () { navMute = !navMute; this.textContent = navMute ? '🔇' : '🔊'; if (navMute && 'speechSynthesis' in window) speechSynthesis.cancel(); });
  document.getElementById('pickBtn').addEventListener('click', () => setPickStart(!pickStart));
  document.getElementById('homeBtn').addEventListener('click', () => { if (gpsActive) stopGPS(); setStartNode('START', 'Cổng chính (QL1A – Đỗ Mười)'); });
  document.getElementById('satBtn').addEventListener('click', function () {
    this.classList.toggle('on');
    setBasemap(this.classList.contains('on') ? 'sat' : 'osm');
  });

  const chips = document.getElementById('chips');
  chips.innerHTML = Object.keys(BUILDINGS).filter(isDetailed).map(bk => `<button class="chip" data-b="${bk}" style="border-color:${BUILDINGS[bk].color}">${BUILDINGS[bk].name.replace('Giảng đường ', 'GĐ ')}</button>`).join('');
  chips.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => selectDestination({ b: c.dataset.b })));

  // Editor wiring
  document.getElementById('editToggle').addEventListener('click', toggleEdit);
  document.querySelectorAll('.tool').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
  document.getElementById('exportBtn').addEventListener('click', exportJSON);
  document.getElementById('resetBtn').addEventListener('click', resetCampus);

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
});
