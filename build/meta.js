
/* ===== Metadata (toạ độ toà nhà & lối đi lấy từ OpenStreetMap, khu campus NLU) ===== */
const CAMPUS_CENTER = [106.79105, 10.87200];

// Nhãn cho vài node đặc biệt (node đường 'r...' không cần nhãn)
const NODE_LABEL = { START: 'Cổng chính (QL1A – Đỗ Mười)' };

const BUILDINGS = {
  /* --- 7 toà có chỉ dẫn trong nhà (tầng/phòng) --- */
  TL: {
    name: 'Nhà điều hành (Thiên Lý)', prefix: 'TL', color: '#1f9d55',
    info: 'Nhà điều hành ĐH Nông Lâm TP.HCM – tập trung phòng chức năng của Trường (Đào tạo, Hành chính, CTSV, VP Hiệu trưởng, VP Trường, KHCN – Đối ngoại…).',
    rooms: [
      { code: 'G01', floor: 0, name: 'Phòng Đào tạo' },
      { code: 'G03', floor: 0, name: 'Phòng Đào tạo' },
      { code: 'G02', floor: 0, name: 'Phòng Hành chính' },
      { code: 'G05', floor: 0, name: 'Phòng Công tác Sinh viên' },
      { code: '105', floor: 1, name: 'Văn phòng Hiệu trưởng' },
      { code: '202', floor: 2, name: 'Văn phòng Trường' },
      { code: '203', floor: 2, name: 'Văn phòng Trường' },
      { code: '204', floor: 2, name: 'Văn phòng Trường' },
      { code: '208', floor: 2, name: 'Phòng Quản lý Đào tạo' },
      { code: '303', floor: 3, name: 'Phòng họp / Hội trường học thuật' },
      { code: '305', floor: 3, name: 'Phòng Phát triển Tổ chức – Nhân sự' },
      { code: '401', floor: 4, name: 'Văn phòng Trường' },
      { code: '402', floor: 4, name: 'Phòng KHCN – Đối ngoại (QL NCKH)' }
    ]
  },
  RD: { name: 'Giảng đường Rạng Đông', prefix: 'RD', color: '#e05a3a', floors: 4, roomsPerFloor: 8,
    info: 'Thư viện, phòng máy CNTT (R306/R406), TT NC Biến đổi khí hậu (P304B). VP Đoàn – Hội SV kế RĐ200. Bộ môn Công nghệ Hoá học.' },
  PV: { name: 'Giảng đường Phượng Vỹ', prefix: 'PV', color: '#c9962b', floors: 4, roomsPerFloor: 8,
    info: 'Phòng học lý thuyết & VP các khoa: Khoa học, Kinh tế, Nông học, CNTY, QLĐĐ&BĐS, Thuỷ sản.' },
  C: { name: 'Giảng đường Cẩm Tú', prefix: 'C', color: '#2f7ec2', floors: 4, roomsPerFloor: 8,
    info: 'Khoa CNTT, Khoa Công nghệ Thực phẩm. TT Đào tạo Quốc tế. Phòng máy K.CNTT: P1, P2.' },
  CT: { name: 'Giảng đường Cát Tường', prefix: 'CT', color: '#7a4fb0', floors: 3, roomsPerFloor: 8,
    info: 'Phòng học lý thuyết.' },
  TV: { name: 'Giảng đường Tường Vy', prefix: 'TV', color: '#d24b8a', floors: 3, roomsPerFloor: 8,
    info: 'Phòng học lý thuyết.' },
  HD: { name: 'Giảng đường Hướng Dương', prefix: 'HD', color: '#d98a2b', floors: 3, roomsPerFloor: 8,
    info: 'Phòng học lý thuyết.' },

  /* --- POI: điểm đến ngoài trời / chưa số hoá phòng bên trong --- */
  LIB:    { name: 'Thư viện Trường ĐH Nông Lâm', color: '#4e7a97', poi: true, cat: 'Thư viện', info: 'Thư viện trung tâm của Trường.' },
  NN:     { name: 'Trung tâm Ngoại ngữ (Khoa Ngoại ngữ – SP)', color: '#3a7ca5', poi: true, cat: 'Trung tâm', info: 'Khoa Ngoại ngữ – Sư phạm.' },
  TIN:    { name: 'Trung tâm Tin học ứng dụng', color: '#3a7ca5', poi: true, cat: 'Trung tâm', info: 'Đào tạo & thi tin học ứng dụng.' },
  MT:     { name: 'Khoa Môi trường & Tài nguyên', color: '#0f9b8e', poi: true, cat: 'Khoa', info: 'Khoa Môi trường và Tài nguyên.' },
  CK:     { name: 'Khoa Cơ khí Công nghệ', color: '#0f9b8e', poi: true, cat: 'Khoa', info: 'Khoa Cơ khí Công nghệ – xưởng thực tập.' },
  NTD:    { name: 'Nhà thi đấu', color: '#4a9d4a', poi: true, cat: 'Thể thao', info: 'Khu thể thao – nhà thi đấu.' },
  MIMOSA: { name: 'Nhà hàng Mimosa', color: '#e07b39', poi: true, cat: 'Ăn uống', info: 'Nhà hàng trong khuôn viên trường.' },
  CANTIN: { name: 'Căn tin Ký túc xá', color: '#e07b39', poi: true, cat: 'Ăn uống', info: 'Căn tin khu KTX.' },
  BX:     { name: 'Bến xe ĐH Nông Lâm', color: '#777777', poi: true, cat: 'Giao thông', info: 'Bến xe buýt – cổng ra vào chính.' },
  VH:     { name: 'Vườn hoa Nguyễn Thái Bình', color: '#6bbf59', poi: true, cat: 'Cảnh quan', info: 'Vườn hoa – không gian sinh hoạt.' },
  NONGHOC:{ name: 'Trại thực nghiệm Khoa Nông học', color: '#9a7b4f', poi: true, cat: 'Thực nghiệm', info: 'Khu trại thực nghiệm.' },
  THITCA: { name: 'Xưởng chế biến thịt cá', color: '#9a7b4f', poi: true, cat: 'Thực nghiệm', info: 'Xưởng thực hành chế biến.' },
  CXA:    { name: 'Cư xá A', color: '#8a6d3b', poi: true, cat: 'Ký túc xá', info: 'Khu nội trú sinh viên.' },
  CXB:    { name: 'Cư xá B', color: '#8a6d3b', poi: true, cat: 'Ký túc xá', info: 'Khu nội trú sinh viên.' },
  CXC:    { name: 'Cư xá C', color: '#8a6d3b', poi: true, cat: 'Ký túc xá', info: 'Khu nội trú sinh viên.' },
  CXD:    { name: 'Cư xá D', color: '#8a6d3b', poi: true, cat: 'Ký túc xá', info: 'Khu nội trú sinh viên.' },
  CXE:    { name: 'Cư xá E', color: '#8a6d3b', poi: true, cat: 'Ký túc xá', info: 'Khu nội trú sinh viên.' },
  CXF:    { name: 'Cư xá F', color: '#8a6d3b', poi: true, cat: 'Ký túc xá', info: 'Khu nội trú sinh viên.' },
  COMAY:  { name: 'KTX Cỏ May', color: '#8a6d3b', poi: true, cat: 'Ký túc xá', info: 'Ký túc xá Cỏ May.' },
  T12:    { name: 'Giảng đường T1 – T2', color: '#b08968', poi: true, cat: 'Giảng đường', approx: true, info: '⚠ Vị trí ước lượng (chưa có trong OSM) – hãy tinh chỉnh bằng Chế độ hiệu chỉnh.' },

  /* --- Bổ sung phủ toàn campus (đều lấy toạ độ từ OSM) --- */
  VIENCNSH:{ name: 'Viện NC CNSH & MT (Khu hành chính A1)', color: '#1f9d55', poi: true, cat: 'Hành chính',
    info: 'Khu hành chính: Phòng Hành chính, Kế hoạch – Tài chính, Đào tạo Sau đại học. Bộ môn Công nghệ Sinh học.' },
  THUYSAN:{ name: 'Trại thực nghiệm Thuỷ sản', color: '#9a7b4f', poi: true, cat: 'Thực nghiệm', info: 'Khoa Thuỷ sản – khu thực nghiệm.' },
  CLBDL:  { name: 'CLB Du lịch sinh thái', color: '#6bbf59', poi: true, cat: 'Sinh hoạt', info: 'Câu lạc bộ sinh viên.' },
  HEARTLAKE:{ name: 'Hồ Heart Lake', color: '#4e9bd0', poi: true, cat: 'Cảnh quan', info: 'Hồ cảnh quan trong khuôn viên.' },
  SANDAMON:{ name: 'Sân đa môn', color: '#4a9d4a', poi: true, cat: 'Thể thao', info: 'Sân thể thao đa môn.' },
  SANBONG:{ name: 'Sân bóng ngoài trời', color: '#4a9d4a', poi: true, cat: 'Thể thao', info: 'Sân bóng ngoài trời.' },
  SANKTX: { name: 'Sân thể thao (khu KTX)', color: '#4a9d4a', poi: true, cat: 'Thể thao', info: 'Cụm sân bóng chuyền khu ký túc xá.' },
  SANMINI:{ name: 'Sân bóng mini (khu Nam)', color: '#4a9d4a', poi: true, cat: 'Thể thao', info: 'Cụm sân bóng mini phía Nam.' },
  CAFE1:  { name: 'Feel Coffee & Tea Express', color: '#e07b39', poi: true, cat: 'Ăn uống', info: 'Quán cà phê trong trường.' },
  CAFE2:  { name: 'An Tea & Coffee', color: '#e07b39', poi: true, cat: 'Ăn uống', info: 'Quán trà – cà phê trong trường.' },
  BAIXE1: { name: 'Bãi giữ xe máy (khu Thiên Lý)', color: '#777777', poi: true, cat: 'Bãi xe', info: 'Bãi giữ xe máy.' },
  BAIXE2: { name: 'Bãi giữ xe máy (khu Bắc)', color: '#777777', poi: true, cat: 'Bãi xe', info: 'Bãi giữ xe máy khu giảng đường Bắc.' },
  BAIOTO: { name: 'Bãi đỗ ô tô', color: '#777777', poi: true, cat: 'Bãi xe', info: 'Bãi đỗ ô tô.' },

  /* --- (g) Hạng mục theo sơ đồ 2014, CHƯA có trong OSM: vị trí ƯỚC LƯỢNG --- */
  YTE:      { name: 'Trạm y tế', color: '#c0504d', poi: true, cat: 'Y tế', approx: true, info: 'Trạm y tế chăm sóc sức khoẻ sinh viên.' },
  THUYY:    { name: 'Bệnh xá Thú Y', color: '#c0504d', poi: true, cat: 'Y tế', approx: true, info: 'Bệnh xá Thú Y – Khoa Chăn nuôi Thú y.' },
  LAMNGHIEP:{ name: 'VP Khoa Lâm nghiệp / Nhà khách ĐHNL', color: '#0f9b8e', poi: true, cat: 'Khoa', approx: true, info: 'Văn phòng Khoa Lâm nghiệp; Nhà khách Trường.' },
  CNTY:     { name: 'Trại thực nghiệm Chăn nuôi – Thú y', color: '#9a7b4f', poi: true, cat: 'Thực nghiệm', approx: true, info: 'Khu trại thực nghiệm Khoa Chăn nuôi Thú y.' },
  NANGLUONG:{ name: 'TT Năng lượng & Máy Nông nghiệp', color: '#3a7ca5', poi: true, cat: 'Trung tâm', approx: true, info: 'Trung tâm Năng lượng và Máy Nông nghiệp.' },
  OTOCK:    { name: 'Xưởng thực tập Cơ khí Ô tô – Công thôn', color: '#9a7b4f', poi: true, cat: 'Thực nghiệm', approx: true, info: 'Bộ môn Ô tô – Công thôn, xưởng thực tập.' },
  UOMTAO:   { name: 'TT Ươm tạo Doanh nghiệp Công nghệ', color: '#3a7ca5', poi: true, cat: 'Trung tâm', approx: true, info: 'Trung tâm ươm tạo doanh nghiệp công nghệ.' },
  BOIDUONG: { name: 'TT Bồi dưỡng kiến thức', color: '#3a7ca5', poi: true, cat: 'Trung tâm', approx: true, info: 'Trung tâm bồi dưỡng kiến thức.' }
};

// Prefix mã phòng có chữ cái (khớp DÀI trước)
const PREFIXES = ['CT', 'PV', 'RD', 'TV', 'HD', 'C'];

const ALIASES = [
  { q: 'phòng đào tạo', b: 'TL', floor: 0, room: 'G01', label: 'Phòng Đào tạo (G01/G03)' },
  { q: 'phòng hành chính', b: 'TL', floor: 0, room: 'G02', label: 'Phòng Hành chính (G02)' },
  { q: 'phòng công tác sinh viên', b: 'TL', floor: 0, room: 'G05', label: 'Phòng CTSV (G05)' },
  { q: 'ctsv', b: 'TL', floor: 0, room: 'G05', label: 'Phòng CTSV (G05)' },
  { q: 'văn phòng hiệu trưởng', b: 'TL', floor: 1, room: '105', label: 'VP Hiệu trưởng (105)' },
  { q: 'ban giám hiệu', b: 'TL', floor: 1, room: '105', label: 'VP Hiệu trưởng (105)' },
  { q: 'văn phòng trường', b: 'TL', floor: 2, room: '202', label: 'Văn phòng Trường (202–204)' },
  { q: 'phòng quản lý đào tạo', b: 'TL', floor: 2, room: '208', label: 'P. Quản lý Đào tạo (208)' },
  { q: 'phòng họp', b: 'TL', floor: 3, room: '303', label: 'Phòng họp / Hội trường (303)' },
  { q: 'hội trường', b: 'TL', floor: 3, room: '303', label: 'Phòng họp / Hội trường (303)' },
  { q: 'phát triển tổ chức nhân sự', b: 'TL', floor: 3, room: '305', label: 'P. Phát triển TC–NS (305)' },
  { q: 'khoa học công nghệ đối ngoại', b: 'TL', floor: 4, room: '402', label: 'P. KHCN – Đối ngoại (402)' },
  { q: 'quản lý nghiên cứu khoa học', b: 'TL', floor: 4, room: '402', label: 'P. QL NCKH (402)' },
  { q: 'nhà điều hành', b: 'TL', label: 'Nhà điều hành (Thiên Lý)' },
  { q: 'thiên lý', b: 'TL', label: 'Nhà điều hành (Thiên Lý)' },
  { q: 'khoa công nghệ thông tin', b: 'C', label: 'Khoa CNTT' },
  { q: 'khoa cntt', b: 'C', label: 'Khoa CNTT' },
  { q: 'khoa công nghệ thực phẩm', b: 'C', label: 'Khoa CNTP' },
  { q: 'trung tâm đào tạo quốc tế', b: 'C', label: 'TT Đào tạo Quốc tế' },
  { q: 'văn phòng đoàn hội', b: 'RD', label: 'VP Đoàn – Hội SV (kế RĐ200)' },
  { q: 'hội sinh viên', b: 'RD', label: 'VP Đoàn – Hội SV (kế RĐ200)' },
  { q: 'biến đổi khí hậu', b: 'RD', floor: 3, room: 'P304B', label: 'TT NC Biến đổi khí hậu (P304B)' },
  { q: 'đào tạo sau đại học', b: 'VIENCNSH', label: 'Đào tạo Sau đại học (Khu hành chính A1)' },
  { q: 'kế hoạch tài chính', b: 'VIENCNSH', label: 'P. Kế hoạch – Tài chính (A1)' },
  { q: 'bộ môn công nghệ sinh học', b: 'VIENCNSH', label: 'BM Công nghệ Sinh học (A1)' },
  { q: 'giữ xe', b: 'BAIXE1', label: 'Bãi giữ xe máy' },
  { q: 'cà phê', b: 'CAFE1', label: 'Quán cà phê trong trường' },
  { q: 'trạm y tế', b: 'YTE', label: 'Trạm y tế' },
  { q: 'khoa lâm nghiệp', b: 'LAMNGHIEP', label: 'VP Khoa Lâm nghiệp' },
  { q: 'nhà khách', b: 'LAMNGHIEP', label: 'Nhà khách ĐHNL' },
  { q: 'chăn nuôi thú y', b: 'CNTY', label: 'Trại TN Chăn nuôi – Thú y' },
  { q: 'năng lượng máy nông nghiệp', b: 'NANGLUONG', label: 'TT Năng lượng & Máy NN' },
  { q: 'ô tô công thôn', b: 'OTOCK', label: 'Xưởng Cơ khí Ô tô – Công thôn' },
  { q: 'ươm tạo doanh nghiệp', b: 'UOMTAO', label: 'TT Ươm tạo Doanh nghiệp CN' }
];
