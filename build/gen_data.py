# -*- coding: utf-8 -*-
"""Sinh ../data.js (DEFAULT_NODES + DEFAULT_EDGES) từ mạng đường OSM
(build/osm_roads.json) và ghép với metadata (build/meta.js).

- Dựng đồ thị lối đi bộ từ hình học đường OSM (gộp đỉnh chung theo osm node id),
  giữ thành phần liên thông lớn nhất.
- Snap từng điểm đến (DEST) vào node đường gần nhất + thêm cạnh nối.
- START = cổng chính (nơi Đường số 1 nối ra QL1A / Đỗ Mười, góc Tây Nam).

Cập nhật osm_roads.json bằng truy vấn Overpass trong build/overpass/roads.ql.
Chạy:  python build/gen_data.py  ->  ghi ../data.js
"""
import json, math, io, os, heapq
from collections import defaultdict, deque

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

d = json.load(open(os.path.join(HERE, 'osm_roads.json'), encoding='utf-8'))
ways = [e for e in d['elements'] if e['type'] == 'way']

# --- Xây node/edge từ hình học đường (dùng osm node id để gộp đỉnh chung) ---
coord = {}      # osmid -> (lon,lat)
edges = set()
for w in ways:
    nds = w.get('nodes', [])
    geo = w.get('geometry', [])
    if len(nds) != len(geo):
        continue
    for nid, g in zip(nds, geo):
        coord[nid] = (round(g['lon'], 6), round(g['lat'], 6))
    for a, b in zip(nds, nds[1:]):
        if a != b:
            edges.add((min(a, b), max(a, b)))

# --- Thành phần liên thông lớn nhất ---
adj = defaultdict(set)
for a, b in edges:
    adj[a].add(b); adj[b].add(a)

def component(start):
    seen = {start}; q = deque([start])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if v not in seen:
                seen.add(v); q.append(v)
    return seen

best = set(); unvis = set(coord)
while unvis:
    comp = component(next(iter(unvis)))
    unvis -= comp
    if len(comp) > len(best):
        best = comp

keep = best
kedges = [(a, b) for (a, b) in edges if a in keep and b in keep]
print('road nodes (largest comp):', len(keep), 'edges:', len(kedges))

def hav(a, b):
    R = 6371000
    dlat = math.radians(b[1] - a[1]); dlng = math.radians(b[0] - a[0])
    la1 = math.radians(a[1]); la2 = math.radians(b[1])
    h = math.sin(dlat / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin(dlng / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))

def nearest(pt):
    bid, bd = None, 1e18
    for nid in keep:
        dd = hav(pt, coord[nid])
        if dd < bd:
            bd, bid = dd, nid
    return bid, bd

# --- Điểm đến (lon, lat) ---
DEST = {
    # Giảng đường (toạ độ footprint OSM)
    'TL': (106.791748, 10.871296), 'RD': (106.792247, 10.870580), 'PV': (106.792612, 10.871964),
    'C': (106.791388, 10.873433), 'CT': (106.791999, 10.873303), 'TV': (106.791995, 10.873607),
    'HD': (106.791988, 10.873936),
    # Toạ độ thật từ NLU.docx (Plus Code -> lat/lng)
    'LIB': (106.791766, 10.870687), 'CNTT': (106.791463, 10.870802), 'NN': (106.789141, 10.871337),
    'TIN': (106.788062, 10.868937), 'MT': (106.787797, 10.871987), 'CK': (106.790562, 10.873437),
    'VIENCNSH': (106.793672, 10.874437), 'LAMNGHIEP': (106.793891, 10.873862),
    'DIACHINH': (106.787937, 10.872312), 'CGKHCN': (106.788141, 10.872138), 'PTNHOA': (106.788047, 10.872238),
    'DUOCTY': (106.786859, 10.875712), 'YTE': (106.791109, 10.870912), 'THUYY': (106.785687, 10.866938),
    'CXA': (106.791109, 10.871337), 'CXB': (106.789953, 10.871337), 'CXC': (106.789578, 10.871288),
    'CXD': (106.789187, 10.870563), 'CXE': (106.790188, 10.870437), 'COMAY': (106.790141, 10.870038),
    'HOIQUAN': (106.788641, 10.869813), 'ATM': (106.789016, 10.871837),
    'NTD': (106.790016, 10.868313), 'SANBONG': (106.791187, 10.869438),
    'VUONUOM': (106.786047, 10.876663), 'THUYSANM': (106.787328, 10.876088),
    'BAIXE1': (106.790813, 10.870687), 'BAIXE2': (106.789187, 10.870938), 'BAIXE3': (106.790797, 10.874063),
    # Giữ toạ độ OSM (docx không có)
    'CXF': (106.787339, 10.871688), 'CANTIN': (106.790561, 10.871116),
    'BX': (106.787707, 10.868005), 'VH': (106.788549, 10.872013), 'NONGHOC': (106.788008, 10.872679),
    'THITCA': (106.791368, 10.873984), 'THUYSAN': (106.788099, 10.876033), 'CLBDL': (106.793268, 10.871390),
    'HEARTLAKE': (106.792005, 10.874534), 'SANDAMON': (106.789201, 10.870281), 'SANKTX': (106.790243, 10.871231),
    'SANMINI': (106.790253, 10.868919),
    'BAIOTO': (106.792364, 10.872563),
    # CHƯA có toạ độ thật: ƯỚC LƯỢNG (approx trong meta.js)
    'CNTY': (106.78840, 10.87230), 'OTOCK': (106.79070, 10.87370), 'UOMTAO': (106.79360, 10.87310),
}

nodes_out = {}
edges_out = []
for nid in keep:
    nodes_out['r%d' % nid] = list(coord[nid])
for a, b in kedges:
    edges_out.append(['r%d' % a, 'r%d' % b])

for k, pt in DEST.items():
    nid, _ = nearest(pt)
    nodes_out[k] = [round(pt[0], 6), round(pt[1], 6)]
    edges_out.append([k, 'r%d' % nid])

start_nid, _ = nearest((106.788166, 10.867206))
nodes_out['START'] = list(coord[start_nid])
edges_out.append(['START', 'r%d' % start_nid])
print('total nodes:', len(nodes_out), 'total edges:', len(edges_out))

# --- Kiểm tra định tuyến nhanh ---
G = defaultdict(list)
for a, b in edges_out:
    wt = hav(nodes_out[a], nodes_out[b]); G[a].append((b, wt)); G[b].append((a, wt))

def dij(s, t):
    dist = {s: 0}; pq = [(0, s)]
    while pq:
        dd, u = heapq.heappop(pq)
        if u == t:
            return dd
        if dd > dist.get(u, 1e18):
            continue
        for v, w in G[u]:
            nd = dd + w
            if nd < dist.get(v, 1e18):
                dist[v] = nd; heapq.heappush(pq, (nd, v))
    return None

for t in ['PV', 'TL', 'HD', 'CT']:
    r = dij('START', t)
    print('START ->', t, ':', None if r is None else round(r), 'm')

# --- Nhãn tên đường (từ OSM) — chọn đoạn giữa của con đường gần campus nhất mỗi tên ---
CENTER = (106.79105, 10.87200)
sw = defaultdict(list)
for w in ways:
    nm = w.get('tags', {}).get('name')
    if nm:
        sw[nm].append(w)
streets = []
for nm, wl in sw.items():
    best, bd = None, 1e18
    for w in wl:
        g = w.get('geometry', [])
        if len(g) < 2:
            continue
        mid = g[len(g) // 2]
        dd = hav((mid['lon'], mid['lat']), CENTER)
        if dd < bd:
            bd, best = dd, w
    if not best:
        continue
    g = best['geometry']; i = len(g) // 2
    a, b = g[max(0, i - 1)], g[i]
    if a['lon'] == b['lon'] and a['lat'] == b['lat']:
        a, b = g[0], g[-1]
    streets.append((nm, round(a['lon'], 6), round(a['lat'], 6), round(b['lon'], 6), round(b['lat'], 6)))
print('street labels:', len(streets))

# --- Xuất ../data.js ---
def js_nodes(nd):
    return '{\n' + ',\n'.join('  %s: [%s, %s]' % (json.dumps(k), v[0], v[1]) for k, v in nd.items()) + '\n}'

def js_edges(ed):
    return '[\n' + ',\n'.join('  ["%s","%s"]' % (a, b) for a, b in ed) + '\n]'

def js_streets(st):
    return '[\n' + ',\n'.join('  {n: %s, a: [%s, %s], b: [%s, %s]}' % (json.dumps(n, ensure_ascii=False), ax, ay, bx, by) for (n, ax, ay, bx, by) in st) + '\n]'

header = '/* Dữ liệu campus NLU – toạ độ node đường & toà nhà lấy từ OpenStreetMap (ODbL) */\n'
gen = ('const DEFAULT_NODES = ' + js_nodes(nodes_out) + ';\n\n'
       + 'const DEFAULT_EDGES = ' + js_edges(edges_out) + ';\n\n'
       + 'const STREETS = ' + js_streets(streets) + ';\n')
meta = open(os.path.join(HERE, 'meta.js'), encoding='utf-8').read()

dst = os.path.join(ROOT, 'data.js')
io.open(dst, 'w', encoding='utf-8').write(header + gen + '\n' + meta)
print('Wrote', dst)
