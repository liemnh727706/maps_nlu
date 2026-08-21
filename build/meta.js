
/* ===== Metadata campus NLU =====
   Toạ độ node đường: OpenStreetMap. Toạ độ nhiều địa điểm & sơ đồ VP khoa/phòng
   chức năng: cập nhật từ NLU.docx (Plus Code của Google → lat/lng). ===== */
const CAMPUS_CENTER = [106.79105, 10.87200];

const NODE_LABEL = { START: 'Cổng chính (QL1A – Đỗ Mười)' };

const BUILDINGS = {
  /* --- Giảng đường có chỉ dẫn trong nhà (tầng/phòng) --- */
  TL: {
    name: 'Nhà điều hành (Thiên Lý)', prefix: 'TL', color: '#1f9d55',
    info: 'Nhà điều hành – tập trung phòng chức năng của Trường: Phòng Quản lý Đào tạo, Phòng Hỗ trợ Người học, Phòng Kiểm soát & Đảm bảo Chất lượng, Phòng NCKH & Đối ngoại, Văn phòng Trường, Tài chính & KH-ĐT, VP Đoàn – Hội Sinh viên.',
    rooms: [
      { code: 'G01', floor: 0, name: 'Phòng Đào tạo' },
      { code: 'G03', floor: 0, name: 'Phòng Đào tạo' },
      { code: 'G02', floor: 0, name: 'Phòng Hành chính' },
      { code: 'G05', floor: 0, name: 'Phòng Hỗ trợ Người học / CTSV' },
      { code: '105', floor: 1, name: 'Văn phòng Hiệu trưởng' },
      { code: '202', floor: 2, name: 'Văn phòng Trường' },
      { code: '203', floor: 2, name: 'Văn phòng Trường' },
      { code: '204', floor: 2, name: 'Văn phòng Trường' },
      { code: '208', floor: 2, name: 'Phòng Quản lý Đào tạo' },
      { code: '303', floor: 3, name: 'Phòng họp / Hội trường học thuật' },
      { code: '305', floor: 3, name: 'Phòng Phát triển Tổ chức – Nhân sự' },
      { code: '401', floor: 4, name: 'Văn phòng Trường' },
      { code: '402', floor: 4, name: 'Phòng NCKH & Đối ngoại (QL NCKH)' }
    ]
  },
  RD: { name: 'Giảng đường Rạng Đông', prefix: 'RD', color: '#e05a3a', floors: 4, roomsPerFloor: 8,
    info: 'Phòng học lý thuyết. TT NC Biến đổi khí hậu (P304B). Bộ môn Công nghệ Hoá học.' },
  PV: { name: 'Giảng đường Phượng Vỹ', prefix: 'PV', color: '#c9962b', floors: 4, roomsPerFloor: 8,
    info: 'Phòng học lý thuyết & VP các Khoa: Khoa học, Kinh tế, Nông học, Chăn nuôi Thú y, Quản lý Đất đai & BĐS, Thuỷ sản.' },
  C: { name: 'Giảng đường Cẩm Tú', prefix: 'C', color: '#2f7ec2', floors: 4, roomsPerFloor: 8,
    info: 'Phòng học lý thuyết. VP Khoa Công nghệ Thực phẩm & Hoá học. TT Đào tạo Quốc tế.' },
  CT: { name: 'Giảng đường Cát Tường', prefix: 'CT', color: '#7a4fb0', floors: 3, roomsPerFloor: 8, info: 'Phòng học lý thuyết.' },
  TV: { name: 'Giảng đường Tường Vy', prefix: 'TV', color: '#d24b8a', floors: 3, roomsPerFloor: 8, info: 'Phòng học lý thuyết.' },
  HD: { name: 'Giảng đường Hướng Dương', prefix: 'HD', color: '#d98a2b', floors: 3, roomsPerFloor: 8, info: 'Phòng học lý thuyết.' },

  /* --- Thư viện, khoa, trung tâm (toạ độ thật từ NLU.docx) --- */
  LIB:  { name: 'Thư viện Trường ĐH Nông Lâm', color: '#4e7a97', poi: true, cat: 'Thư viện', info: 'Thư viện trung tâm; VP Khoa Công nghệ Thông tin; phòng máy K.CNTT (P1, P2).' },
  CNTT: { name: 'Khoa Công nghệ Thông tin', color: '#0f9b8e', poi: true, cat: 'Khoa', info: 'VP Khoa CNTT (khu Thư viện). Phòng máy P1, P2.' },
  NN:   { name: 'Trung tâm Ngoại ngữ (Khoa Ngoại ngữ – SP)', color: '#3a7ca5', poi: true, cat: 'Trung tâm', info: 'Khoa Ngoại ngữ – Sư phạm. Mã phòng NN.xxx.' },
  TIN:  { name: 'Trung tâm Tin học Ứng dụng', color: '#3a7ca5', poi: true, cat: 'Trung tâm', info: 'TT Tin học Ứng dụng. Mã phòng TH.P0x.' },
  MT:   { name: 'Khoa Môi trường & Tài nguyên', color: '#0f9b8e', poi: true, cat: 'Khoa', info: 'Khoa Môi trường và Tài nguyên; Trung tâm Môi trường.' },
  CK:   { name: 'Khoa Cơ khí Công nghệ', color: '#0f9b8e', poi: true, cat: 'Khoa', info: 'VP Khoa Cơ khí Công nghệ – xưởng thực tập.' },
  VIENCNSH:{ name: 'Viện NC CNSH & MT (Khu hành chính A1)', color: '#1f9d55', poi: true, cat: 'Hành chính',
    info: 'Viện NC CNSH & MT (A1): VP Khoa Công nghệ Sinh học, Khoa Lâm nghiệp, Trung tâm Môi trường. Phòng Hành chính, KH–TC, Đào tạo Sau đại học.' },
  LAMNGHIEP:{ name: 'VP Khoa Lâm nghiệp', color: '#0f9b8e', poi: true, cat: 'Khoa', info: 'Văn phòng Khoa Lâm nghiệp (thuộc Viện NC CNSH & MT A1).' },
  DIACHINH:{ name: 'TT NC & Ứng dụng Công nghệ Địa chính', color: '#3a7ca5', poi: true, cat: 'Trung tâm', info: 'Trung tâm Nghiên cứu & Ứng dụng Công nghệ Địa chính.' },
  CGKHCN:{ name: 'TT NC & Chuyển giao KHCN', color: '#3a7ca5', poi: true, cat: 'Trung tâm', info: 'Trung tâm Nghiên cứu & Chuyển giao Khoa học Công nghệ.' },
  PTNHOA:{ name: 'PTN Hoá đại cương', color: '#9a7b4f', poi: true, cat: 'Thực nghiệm', info: 'Phòng thí nghiệm Hoá đại cương.' },
  DUOCTY:{ name: 'Xưởng Dược Thú Y', color: '#9a7b4f', poi: true, cat: 'Thực nghiệm', info: 'Xưởng Dược Thú Y (khu Bắc).' },

  /* --- Y tế --- */
  YTE:   { name: 'Trạm y tế', color: '#c0504d', poi: true, cat: 'Y tế', info: 'Trạm y tế – chăm sóc sức khoẻ sinh viên.' },
  THUYY: { name: 'Bệnh viện Thú Y NLU', color: '#c0504d', poi: true, cat: 'Y tế', info: 'Bệnh viện Thú Y – Khoa Chăn nuôi Thú y (khu Tây Nam, gần cổng).' },

  /* --- Ký túc xá --- */
  CXA:   { name: 'Cư xá A', color: '#8a6d3b', poi: true, cat: 'Ký túc xá', info: 'Khu nội trú sinh viên.' },
  CXB:   { name: 'Cư xá B', color: '#8a6d3b', poi: true, cat: 'Ký túc xá', info: 'Khu nội trú sinh viên.' },
  CXC:   { name: 'Cư xá C', color: '#8a6d3b', poi: true, cat: 'Ký túc xá', info: 'Khu nội trú sinh viên.' },
  CXD:   { name: 'Cư xá D', color: '#8a6d3b', poi: true, cat: 'Ký túc xá', info: 'Khu nội trú sinh viên.' },
  CXE:   { name: 'Cư xá E', color: '#8a6d3b', poi: true, cat: 'Ký túc xá', info: 'Khu nội trú sinh viên.' },
  CXF:   { name: 'Cư xá F', color: '#8a6d3b', poi: true, cat: 'Ký túc xá', info: 'Khu nội trú sinh viên.' },
  COMAY: { name: 'KTX Cỏ May', color: '#8a6d3b', poi: true, cat: 'Ký túc xá', info: 'Ký túc xá Cỏ May.' },

  /* --- Ăn uống / tiện ích --- */
  CANTIN:{ name: 'Căn tin Ký túc xá', color: '#e07b39', poi: true, cat: 'Ăn uống', info: 'Căn tin khu KTX.' },
  HOIQUAN:{ name: 'Hội Quán Nông Lâm', color: '#e07b39', poi: true, cat: 'Ăn uống', info: 'Hội quán – khu ẩm thực / sinh hoạt.' },
  ATM:   { name: 'ATM BIDV', color: '#5a6b7a', poi: true, cat: 'Tiện ích', info: 'Máy ATM BIDV trong trường.' },

  /* --- Thể thao / cảnh quan --- */
  NTD:   { name: 'Nhà thi đấu', color: '#4a9d4a', poi: true, cat: 'Thể thao', info: 'Khu thể thao – nhà thi đấu.' },
  SANBONG:{ name: 'Sân bóng đá', color: '#4a9d4a', poi: true, cat: 'Thể thao', info: 'Sân bóng đá ngoài trời.' },
  SANDAMON:{ name: 'Sân đa môn', color: '#4a9d4a', poi: true, cat: 'Thể thao', info: 'Sân thể thao đa môn.' },
  SANKTX:{ name: 'Sân thể thao (khu KTX)', color: '#4a9d4a', poi: true, cat: 'Thể thao', info: 'Cụm sân bóng chuyền khu ký túc xá.' },
  SANMINI:{ name: 'Sân bóng mini (khu Nam)', color: '#4a9d4a', poi: true, cat: 'Thể thao', info: 'Cụm sân bóng mini phía Nam.' },
  VH:    { name: 'Vườn hoa Nguyễn Thái Bình', color: '#6bbf59', poi: true, cat: 'Cảnh quan', info: 'Vườn hoa – không gian sinh hoạt.' },
  HEARTLAKE:{ name: 'Hồ Heart Lake', color: '#4e9bd0', poi: true, cat: 'Cảnh quan', info: 'Hồ cảnh quan trong khuôn viên.' },
  CLBDL: { name: 'CLB Du lịch sinh thái', color: '#6bbf59', poi: true, cat: 'Sinh hoạt', info: 'Câu lạc bộ sinh viên.' },
  VUONUOM:{ name: 'Vườn ươm BM Cảnh quan & KT Hoa viên', color: '#6bbf59', poi: true, cat: 'Cảnh quan', info: 'Vườn ươm Bộ môn Cảnh quan & Kỹ thuật Hoa viên.' },

  /* --- Thực nghiệm --- */
  NONGHOC:{ name: 'Trại thực nghiệm Khoa Nông học', color: '#9a7b4f', poi: true, cat: 'Thực nghiệm', info: 'Khu trại thực nghiệm.' },
  THITCA:{ name: 'Xưởng chế biến thịt cá', color: '#9a7b4f', poi: true, cat: 'Thực nghiệm', info: 'Xưởng thực hành chế biến.' },
  THUYSAN:{ name: 'Trại thực nghiệm Thuỷ sản', color: '#9a7b4f', poi: true, cat: 'Thực nghiệm', info: 'Khoa Thuỷ sản – khu thực nghiệm.' },
  THUYSANM:{ name: 'Trại TN Thuỷ sản (mới)', color: '#9a7b4f', poi: true, cat: 'Thực nghiệm', info: 'Trại thực nghiệm thuỷ sản mới.' },

  /* --- Giao thông / bãi xe --- */
  BX:    { name: 'Bến xe ĐH Nông Lâm', color: '#777777', poi: true, cat: 'Giao thông', info: 'Bến xe buýt – cổng ra vào chính.' },
  BAIXE1:{ name: 'Bãi giữ xe SV số 1', color: '#777777', poi: true, cat: 'Bãi xe', info: 'Bãi giữ xe sinh viên số 1.' },
  BAIXE2:{ name: 'Bãi giữ xe SV số 2', color: '#777777', poi: true, cat: 'Bãi xe', info: 'Bãi giữ xe sinh viên số 2.' },
  BAIXE3:{ name: 'Bãi giữ xe SV số 3', color: '#777777', poi: true, cat: 'Bãi xe', info: 'Bãi giữ xe sinh viên số 3 (khu Bắc/Đông).' },
  BAIOTO:{ name: 'Bãi đỗ ô tô', color: '#777777', poi: true, cat: 'Bãi xe', info: 'Bãi đỗ ô tô.' },

  /* --- Hạng mục CHƯA có toạ độ thật (vị trí ƯỚC LƯỢNG, cần tinh chỉnh) --- */
  CNTY:     { name: 'Trại thực nghiệm Chăn nuôi – Thú y', color: '#b08968', poi: true, cat: 'Thực nghiệm', approx: true, info: '⚠ Vị trí ước lượng.' },
  OTOCK:    { name: 'Xưởng thực tập Cơ khí Ô tô – Công thôn', color: '#b08968', poi: true, cat: 'Thực nghiệm', approx: true, info: '⚠ Vị trí ước lượng.' },
  UOMTAO:   { name: 'TT Ươm tạo Doanh nghiệp Công nghệ', color: '#b08968', poi: true, cat: 'Trung tâm', approx: true, info: '⚠ Vị trí ước lượng.' }
};

// Prefix mã phòng có chữ cái (khớp DÀI trước)
const PREFIXES = ['CT', 'PV', 'RD', 'TV', 'HD', 'C'];

const ALIASES = [
  /* Phòng chức năng — Nhà điều hành (Thiên Lý) */
  { q: 'phòng đào tạo', b: 'TL', floor: 0, room: 'G01', label: 'Phòng Đào tạo (G01/G03)' },
  { q: 'phòng quản lý đào tạo', b: 'TL', floor: 2, room: '208', label: 'P. Quản lý Đào tạo (208)' },
  { q: 'phòng hành chính', b: 'TL', floor: 0, room: 'G02', label: 'Phòng Hành chính (G02)' },
  { q: 'phòng hỗ trợ người học', b: 'TL', floor: 0, room: 'G05', label: 'P. Hỗ trợ Người học (G05)' },
  { q: 'phòng công tác sinh viên', b: 'TL', floor: 0, room: 'G05', label: 'P. Hỗ trợ Người học / CTSV (G05)' },
  { q: 'ctsv', b: 'TL', floor: 0, room: 'G05', label: 'P. Hỗ trợ Người học / CTSV (G05)' },
  { q: 'phòng kiểm soát đảm bảo chất lượng', b: 'TL', label: 'P. Kiểm soát & Đảm bảo Chất lượng' },
  { q: 'khảo thí', b: 'TL', label: 'P. Kiểm soát & Đảm bảo Chất lượng' },
  { q: 'phòng nghiên cứu khoa học đối ngoại', b: 'TL', floor: 4, room: '402', label: 'P. NCKH & Đối ngoại (402)' },
  { q: 'khoa học công nghệ đối ngoại', b: 'TL', floor: 4, room: '402', label: 'P. NCKH & Đối ngoại (402)' },
  { q: 'văn phòng trường', b: 'TL', floor: 2, room: '202', label: 'Văn phòng Trường (202–204)' },
  { q: 'tài chính kế hoạch', b: 'TL', label: 'Tài chính & Kế hoạch Đào tạo (Thiên Lý)' },
  { q: 'văn phòng đoàn hội', b: 'TL', label: 'VP Đoàn – Hội Sinh viên (Thiên Lý)' },
  { q: 'hội sinh viên', b: 'TL', label: 'VP Đoàn – Hội Sinh viên (Thiên Lý)' },
  { q: 'văn phòng hiệu trưởng', b: 'TL', floor: 1, room: '105', label: 'VP Hiệu trưởng (105)' },
  { q: 'ban giám hiệu', b: 'TL', floor: 1, room: '105', label: 'VP Hiệu trưởng (105)' },
  { q: 'phòng họp', b: 'TL', floor: 3, room: '303', label: 'Phòng họp / Hội trường (303)' },
  { q: 'hội trường', b: 'TL', floor: 3, room: '303', label: 'Phòng họp / Hội trường (303)' },
  { q: 'phát triển tổ chức nhân sự', b: 'TL', floor: 3, room: '305', label: 'P. Phát triển TC–NS (305)' },
  { q: 'nhà điều hành', b: 'TL', label: 'Nhà điều hành (Thiên Lý)' },
  { q: 'thiên lý', b: 'TL', label: 'Nhà điều hành (Thiên Lý)' },

  /* VP Khoa/Bộ môn — theo NLU.docx */
  { q: 'khoa khoa học', b: 'PV', label: 'Khoa Khoa học (Phượng Vỹ)' },
  { q: 'khoa kinh tế', b: 'PV', label: 'Khoa Kinh tế (Phượng Vỹ)' },
  { q: 'khoa nông học', b: 'PV', label: 'Khoa Nông học (Phượng Vỹ)' },
  { q: 'khoa chăn nuôi thú y', b: 'PV', label: 'Khoa Chăn nuôi Thú y (Phượng Vỹ)' },
  { q: 'khoa quản lý đất đai', b: 'PV', label: 'Khoa QLĐĐ & BĐS (Phượng Vỹ)' },
  { q: 'bất động sản', b: 'PV', label: 'Khoa QLĐĐ & BĐS (Phượng Vỹ)' },
  { q: 'khoa thủy sản', b: 'PV', label: 'Khoa Thuỷ sản (Phượng Vỹ)' },
  { q: 'khoa công nghệ thực phẩm', b: 'C', label: 'Khoa CNTP & Hoá học (Cẩm Tú)' },
  { q: 'khoa hóa học', b: 'C', label: 'Khoa CNTP & Hoá học (Cẩm Tú)' },
  { q: 'trung tâm đào tạo quốc tế', b: 'C', label: 'TT Đào tạo Quốc tế (Cẩm Tú)' },
  { q: 'khoa ngoại ngữ sư phạm', b: 'NN', label: 'Khoa Ngoại ngữ – Sư phạm' },
  { q: 'khoa công nghệ sinh học', b: 'VIENCNSH', label: 'Khoa CNSH (Viện A1)' },
  { q: 'trung tâm môi trường', b: 'VIENCNSH', label: 'Trung tâm Môi trường (Viện A1)' },
  { q: 'đào tạo sau đại học', b: 'VIENCNSH', label: 'Đào tạo Sau đại học (Viện A1)' },
  { q: 'khoa lâm nghiệp', b: 'LAMNGHIEP', label: 'VP Khoa Lâm nghiệp' },
  { q: 'khoa môi trường tài nguyên', b: 'MT', label: 'Khoa Môi trường & Tài nguyên' },
  { q: 'khoa cơ khí công nghệ', b: 'CK', label: 'Khoa Cơ khí Công nghệ' },
  { q: 'khoa công nghệ thông tin', b: 'CNTT', label: 'Khoa Công nghệ Thông tin' },
  { q: 'khoa cntt', b: 'CNTT', label: 'Khoa Công nghệ Thông tin' },

  /* Khác */
  { q: 'biến đổi khí hậu', b: 'RD', floor: 3, room: 'P304B', label: 'TT NC Biến đổi khí hậu (P304B)' },
  { q: 'trạm y tế', b: 'YTE', label: 'Trạm y tế' },
  { q: 'bệnh viện thú y', b: 'THUYY', label: 'Bệnh viện Thú Y NLU' },
  { q: 'giữ xe', b: 'BAIXE1', label: 'Bãi giữ xe sinh viên' }
];
