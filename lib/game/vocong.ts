import { ITEMS } from './data';
import type { Character } from './types';

/**
 * Võ công theo binh khí: mỗi đòn đánh hiện tên chiêu thức.
 * Tên lấy từ truyện kiếm hiệp Kim Dung, Cổ Long, Lương Vũ Sinh, Hoàn Châu Lâu Chủ, Thủy Hử, Tam Quốc,
 * pha thêm vài tên tự đặt theo đúng lối Hán Việt để danh sách không lặp.
 */
export type WeaponKind =
  | 'kiem' | 'song' | 'dao' | 'thuong' | 'truong' | 'cung' | 'tieu' | 'sao' | 'quat' | 'but'
  | 'chuy' | 'roi' | 'can' | 'liem' | 'phattran' | 'cuoc' | 'lodan' | 'quyen';

export const VO_CONG: Record<WeaponKind, string[]> = {
  // Kiếm: Tiếu Ngạo, Thần Điêu, Ỷ Thiên, Bích Huyết Kiếm, Việt Nữ Kiếm, Cổ Long, Thục Sơn
  kiem: [
    'Độc Cô Cửu Kiếm', 'Tịch Tà Kiếm Pháp', 'Thái Cực Kiếm', 'Ngọc Nữ Kiếm Pháp', 'Toàn Chân Kiếm Pháp',
    'Hoa Sơn Kiếm Pháp', 'Thái Nhạc Tam Thanh Phong', 'Hồi Phong Phất Liễu Kiếm', 'Kim Xà Kiếm Pháp', 'Việt Nữ Kiếm',
    'Thiên Ngoại Phi Tiên', 'Đoạt Mệnh Thập Tam Kiếm', 'Vạn Kiếm Quy Tông', 'Nhất Kiếm Đông Lai',
  ],
  // Song kiếm: Thần Điêu (Ngọc Nữ - Toàn Chân hợp bích), Ỷ Thiên (Lưỡng Nghi), truyền thuyết Can Tương - Mạc Tà
  song: ['Song Kiếm Hợp Bích', 'Lưỡng Nghi Kiếm Pháp', 'Thư Hùng Song Kiếm', 'Âm Dương Song Sát', 'Uyên Ương Song Phi', 'Nhật Nguyệt Đồng Huy'],
  // Đao: Phi Hồ (Hồ gia đao), Liên Thành Quyết (Huyết đao), Uyên Ương Đao, Tiếu Ngạo (khoái đao Điền Bá Quang), Cổ Long
  dao: ['Hồ Gia Đao Pháp', 'Huyết Đao Đao Pháp', 'Uyên Ương Đao', 'Cuồng Phong Khoái Đao', 'Bát Quái Đao', 'Phách Quải Đao', 'Thiên Nhai Nhất Đao', 'Lực Phách Hoa Sơn', 'Hoành Tảo Thiên Quân'],
  // Thương: Dương gia tướng, Xạ Điêu (Dương Thiết Tâm), Nhạc Phi, Tam Quốc (Triệu Vân)
  thuong: ['Dương Gia Thương Pháp', 'Lê Hoa Thương', 'Nhạc Gia Thương Pháp', 'Bách Điểu Triều Phụng', 'Bá Vương Thương', 'Hồi Mã Thương', 'Độc Long Xuất Động', 'Thất Tinh Thương Pháp'],
  // Côn, gậy, trượng: Cái Bang, Thiếu Lâm, Tây Du
  truong: ['Đả Cẩu Bổng Pháp', 'Tề Mi Côn', 'La Hán Côn', 'Phục Ma Trượng Pháp', 'Như Ý Côn Pháp', 'Bát Quái Côn', 'Thiên Hạ Vô Cẩu', 'Phong Ma Trượng Pháp'],
  // Cung: Xạ Điêu (Quách Tĩnh bắn điêu), Hậu Nghệ, Dưỡng Do Cơ (bách bộ xuyên dương)
  cung: ['Xạ Điêu Thần Tiễn', 'Liên Châu Tiễn', 'Hậu Nghệ Xạ Nhật', 'Bách Bộ Xuyên Dương', 'Truy Tinh Tiễn', 'Phá Vân Tiễn'],
  // Ám khí: Cổ Long (Tiểu Lý phi đao, Bạo Vũ Lê Hoa Châm), Đường Môn, Thần Điêu (Ngọc Phong Châm, Băng Phách Ngân Châm), Thủy Hử
  tieu: ['Tiểu Lý Phi Đao', 'Bạo Vũ Lê Hoa Châm', 'Mãn Thiên Hoa Vũ', 'Băng Phách Ngân Châm', 'Ngọc Phong Châm', 'Đạn Chỉ Thần Thông', 'Phi Hoàng Thạch', 'Hàm Sa Xạ Ảnh'],
  // Sáo, tiêu: Xạ Điêu (Hoàng Dược Sư thổi Bích Hải Triều Sinh Khúc), Tiếu Ngạo
  sao: ['Bích Hải Triều Sinh Khúc', 'Ngọc Tiêu Kiếm Pháp', 'Tiếu Ngạo Giang Hồ Khúc', 'Thiên Ma Cầm Âm', 'Lạc Anh Tân Phân'],
  // Quạt
  quat: ['Phiến Ảnh Điểm Huyệt', 'Khổng Tước Khai Bình', 'Bát Phong Phiến Pháp', 'Thanh Phong Từ Lai', 'Thiết Phiến Đoạn Hồn', 'Phong Quyển Tàn Vân'],
  // Bút: Phán quan bút, Tiếu Ngạo (Ngốc Bút Ông viết thư pháp thành võ), Xạ Điêu (Chu Tử Liễu)
  but: ['Phán Quan Điểm Huyệt', 'Bùi Tướng Quân Thiếp', 'Nhất Dương Thư Chỉ', 'Thạch Cổ Đả Huyệt', 'Long Phi Phượng Vũ', 'Thiết Họa Ngân Câu'],
  // Chùy, xử: Thần Điêu (Kim cương xử của Mật tông), Tùy Đường (Lý Nguyên Bá)
  chuy: ['Lưu Tinh Chùy Pháp', 'Kim Cương Xử Pháp', 'Bát Lăng Chùy', 'Lôi Công Chùy', 'Khai Sơn Phá Thạch', 'Thái Sơn Áp Đỉnh'],
  // Roi: Thần Điêu (Ngân Tác Kim Linh của Cổ Mộ phái)
  roi: ['Ngân Tác Kim Linh', 'Câu Hồn Tiên Pháp', 'Ngũ Độc Tiên', 'Linh Xà Tiên Pháp', 'Cửu Tiết Tiên', 'Thị Huyết Tiên Pháp'],
  // Cần câu: Xạ Điêu (Ngư Tiều Canh Độc), Khương Tử Nha
  can: ['Ngư Ông Điếu Nguyệt', 'Thái Công Điếu Ngư', 'Nguyện Giả Thượng Câu', 'Độc Điếu Hàn Giang'],
  // Liềm, búa: Thủy Hử (song phủ Lý Quỳ), Tùy Đường (tam bản phủ Trình Giảo Kim), Bàn Cổ khai thiên
  liem: ['Bàn Cổ Khai Thiên', 'Tam Bản Phủ', 'Khai Sơn Phủ Pháp', 'Huyết Liêm Đoạt Hồn', 'Toàn Phong Song Phủ', 'Thu Hồn Liêm Pháp'],
  // Phất trần: Thần Điêu (Lý Mạc Sầu, Toàn Chân), đạo môn
  phattran: ['Phất Trần Công', 'Thái Ất Phất Trần', 'Hồi Phong Phất Liễu', 'Tam Thanh Phất Vân', 'Thiên Tơ Vạn Lũ'],
  // Cuốc, xẻng: nông cụ
  cuoc: ['Thần Nông Khai Hoang', 'Lão Nông Phạt Thổ', 'Khai Cương Phá Thổ', 'Xuân Canh Thu Hoạch'],
  // Lò đan: Tây Du (lò bát quái của Thái Thượng Lão Quân)
  lodan: ['Bát Quái Lô Hỏa', 'Đan Hỏa Phần Thiên', 'Tam Muội Chân Hỏa', 'Cửu Chuyển Kim Đan'],
  // Quyền, chưởng, trảo (thủ sáo hoặc tay không): Thiên Long, Xạ Điêu, Thần Điêu, Ỷ Thiên, Hoàng Phi Hồng
  quyen: [
    'Hàng Long Thập Bát Chưởng', 'Kháng Long Hữu Hối', 'Thần Long Bãi Vĩ', 'Thất Thương Quyền', 'Không Minh Quyền',
    'Thái Tổ Trường Quyền', 'Cửu Âm Bạch Cốt Trảo', 'Hổ Trảo Công', 'Ưng Trảo Công', 'Thiên Sơn Lục Dương Chưởng',
    'Ảm Nhiên Tiêu Hồn Chưởng', 'Bàn Nhược Chưởng', 'Hàm Mô Công', 'Phật Sơn Vô Ảnh Cước', 'La Hán Quyền',
  ],
};

/** Chưởng pháp theo con đường tu luyện (vận khí xuất chưởng, không cần binh khí) */
export const CHUONG_PATH: Record<string, string[]> = {
  kiem: ['Kiếm Khí Chưởng', 'Lục Mạch Thần Kiếm', 'Lạc Anh Thần Kiếm Chưởng'],
  dan: ['Liệt Hỏa Chưởng', 'Đan Hỏa Chưởng', 'Thiết Sa Chưởng'],
  tran: ['Bát Quái Chưởng', 'Cửu Cung Chưởng', 'Thái Cực Quyền'],
  phat: ['Như Lai Thần Chưởng', 'Đại Lực Kim Cang Chỉ', 'Bàn Nhược Chưởng', 'Nhất Dương Chỉ'],
  ma: ['Huyền Minh Thần Chưởng', 'Hóa Cốt Miên Chưởng', 'Huyết Ảnh Chưởng', 'Hấp Tinh Đại Pháp', 'Bắc Minh Thần Công'],
  yeu: ['Yêu Lang Trảo', 'Hồ Vĩ Chưởng', 'Vạn Yêu Chưởng'],
  _: ['Thiết Sa Chưởng', 'Bát Quái Chưởng', 'Miên Chưởng', 'Phách Không Chưởng', 'Hàng Long Chưởng', 'Thái Cực Chưởng'],
};

const LOOK_KIND: Record<string, WeaponKind> = { mockiem: 'kiem', kiem: 'kiem', dao: 'dao', phattran: 'phattran', lodan: 'lodan' };

/** Loại binh khí đang cầm; tay không thì là quyền chưởng */
export function weaponKind(c: Pick<Character, 'equipped'>): WeaponKind {
  const id = c.equipped.vu_khi;
  if (!id) return 'quyen';
  const it = ITEMS.find((i) => i.id === id);
  if (!it) return 'quyen';
  const k = (it as { wpn?: { k: string } }).wpn?.k ?? LOOK_KIND[it.look] ?? 'kiem';
  // "tiêu" vừa là phi tiêu vừa là ống sáo: ngọc tiêu, sáo là nhạc khí
  if (k === 'tieu' && /ngọc tiêu|sáo|địch/i.test(it.name)) return 'sao';
  return (k in VO_CONG ? k : 'kiem') as WeaponKind;
}

/**
 * Chiêu thức của đòn này. palm = vận khí xuất chưởng (có luồng chưởng lực bay ra).
 * Tay không: luôn là quyền chưởng. Có binh khí: chủ yếu dùng võ công của binh khí,
 * từ Luyện Khí thỉnh thoảng (25%) xuất chưởng theo con đường tu luyện.
 */
export function artOf(c: Pick<Character, 'equipped' | 'realm' | 'path'>, rnd: () => number): { name: string; palm: boolean } {
  const k = weaponKind(c);
  const pick = (l: string[]) => l[Math.floor(rnd() * l.length)];
  if (k === 'quyen') {
    const l = [...VO_CONG.quyen, ...(c.realm >= 1 ? (CHUONG_PATH[c.path ?? ''] ?? CHUONG_PATH._) : [])];
    return { name: pick(l), palm: true };
  }
  if (c.realm >= 1 && rnd() < 0.25) return { name: pick([...(CHUONG_PATH[c.path ?? ''] ?? []), ...CHUONG_PATH._]), palm: true };
  return { name: pick(VO_CONG[k]), palm: false };
}
