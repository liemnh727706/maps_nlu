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
    'TL': (106.791748, 10.871296), 'RD': (106.792247, 10.870580), 'PV': (106.792612, 10.871964),
    'C': (106.791388, 10.873433), 'CT': (106.791999, 10.873303), 'TV': (106.791995, 10.873607),
    'HD': (106.791988, 10.873936),
    'LIB': (106.791746, 10.870722), 'NN': (106.789204, 10.871300), 'TIN': (106.788101, 10.868953),
    'MT': (106.787876, 10.872081), 'CK': (106.790705, 10.873428), 'NTD': (106.790292, 10.868331),
    'MIMOSA': (106.790594, 10.872450), 'CANTIN': (106.790561, 10.871116), 'BX': (106.787707, 10.868005),
    'VH': (106.788549, 10.872013), 'NONGHOC': (106.788008, 10.872679), 'THITCA': (106.791368, 10.873984),
    'CXA': (106.791104, 10.871312), 'CXB': (106.789957, 10.871304), 'CXC': (106.789580, 10.871298),
    'CXD': (106.789134, 10.870537), 'CXE': (106.790265, 10.870429), 'CXF': (106.787339, 10.871688),
    'COMAY': (106.790191, 10.870071),
    'T12': (106.79235, 10.87145),
    'CAFE1': (106.787679, 10.869146), 'CAFE2': (106.787683, 10.869183),
    'THUYSAN': (106.788099, 10.876033),
    'SANDAMON': (106.789201, 10.870281), 'SANBONG': (106.791149, 10.869504),
    'SANKTX': (106.790243, 10.871231), 'SANMINI': (106.790253, 10.868919),
    'CLBDL': (106.793268, 10.871390), 'HEARTLAKE': (106.792005, 10.874534),
    'VIENCNSH': (106.793996, 10.873976),
    'BAIXE1': (106.791087, 10.870506), 'BAIXE2': (106.790902, 10.874381), 'BAIOTO': (106.792364, 10.872563),
    # Hạng mục theo sơ đồ 2014 KHÔNG có trong OSM: toạ độ ƯỚC LƯỢNG (approx trong meta.js)
    'YTE': (106.79025, 10.87090), 'LAMNGHIEP': (106.78955, 10.87070), 'BOIDUONG': (106.79010, 10.86880),
    'CNTY': (106.78840, 10.87230), 'NANGLUONG': (106.79030, 10.87290), 'OTOCK': (106.79070, 10.87370),
    'UOMTAO': (106.79360, 10.87310), 'THUYY': (106.78980, 10.87520),
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

# --- Xuất ../data.js ---
def js_nodes(nd):
    return '{\n' + ',\n'.join('  %s: [%s, %s]' % (json.dumps(k), v[0], v[1]) for k, v in nd.items()) + '\n}'

def js_edges(ed):
    return '[\n' + ',\n'.join('  ["%s","%s"]' % (a, b) for a, b in ed) + '\n]'

header = '/* Dữ liệu campus NLU – toạ độ node đường & toà nhà lấy từ OpenStreetMap (ODbL) */\n'
gen = ('const DEFAULT_NODES = ' + js_nodes(nodes_out) + ';\n\n'
       + 'const DEFAULT_EDGES = ' + js_edges(edges_out) + ';\n')
meta = open(os.path.join(HERE, 'meta.js'), encoding='utf-8').read()

dst = os.path.join(ROOT, 'data.js')
io.open(dst, 'w', encoding='utf-8').write(header + gen + '\n' + meta)
print('Wrote', dst)
