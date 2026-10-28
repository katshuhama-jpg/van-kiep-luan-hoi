import { ITEMS } from './data';
import type { Character } from './types';
import { tr } from '../i18n';

/**
 * Võ công theo binh khí: mỗi đòn đánh hiện tên chiêu thức.
 * Tên lấy từ truyện kiếm hiệp Kim Dung, Cổ Long, Lương Vũ Sinh, Hoàn Châu Lâu Chủ, Thủy Hử, Tam Quốc,
 * pha thêm vài tên tự đặt theo đúng lối Hán Việt để danh sách không lặp.
 */
export type WeaponKind = 'kiem' | 'song' | 'dao' | 'thuong' | 'truong' | 'cung' | 'tieu' | 'sao' | 'quat' | 'but' | 'chuy' | 'roi' | 'can' | 'liem' | 'phattran' | 'cuoc' | 'lodan' | 'quyen';

export const VO_CONG: Record<WeaponKind, string[]> = {
  // Kiếm: Tiếu Ngạo, Thần Điêu, Ỷ Thiên, Bích Huyết Kiếm, Việt Nữ Kiếm, Cổ Long, Thục Sơn
  kiem: [
    tr('Độc Cô Cửu Kiếm', "Dugu Nine Swords"),
    tr('Tịch Tà Kiếm Pháp', "Evil-Warding Sword Art"),
    tr('Thái Cực Kiếm', "Taiji Sword"),
    tr('Ngọc Nữ Kiếm Pháp', "Jade Maiden Sword Art"),
    tr('Toàn Chân Kiếm Pháp', "Quanzhen Sword Art"),
    tr('Hoa Sơn Kiếm Pháp', "Hua Shan Sword Art"),
    tr('Thái Nhạc Tam Thanh Phong', "Three Clear Peaks of Mount Tai"),
    tr('Hồi Phong Phất Liễu Kiếm', "Willow-Brushing Whirlwind Sword"),
    tr('Kim Xà Kiếm Pháp', "Golden Serpent Sword Art"),
    tr('Việt Nữ Kiếm', "Yue Maiden Sword"),
    tr('Thiên Ngoại Phi Tiên', "Immortal Flying from Beyond the Sky"),
    tr('Đoạt Mệnh Thập Tam Kiếm', "Thirteen Life-Taking Swords"),
    tr('Vạn Kiếm Quy Tông', "Ten Thousand Swords Return to the Source"),
    tr('Nhất Kiếm Đông Lai', "One Sword from the East"),
  ],
  // Song kiếm: Thần Điêu (Ngọc Nữ - Toàn Chân hợp bích), Ỷ Thiên (Lưỡng Nghi), truyền thuyết Can Tương - Mạc Tà
  song: [tr('Song Kiếm Hợp Bích', "Twin Swords in Unison"), tr('Lưỡng Nghi Kiếm Pháp', "Two Forms Sword Art"), tr('Thư Hùng Song Kiếm', "Male and Female Twin Swords"), tr('Âm Dương Song Sát', "Yin-Yang Twin Fiends"), tr('Uyên Ương Song Phi', "Mandarin Ducks Fly Together"), tr('Nhật Nguyệt Đồng Huy', "Sun and Moon Shine as One")],
  // Đao: Phi Hồ (Hồ gia đao), Liên Thành Quyết (Huyết đao), Uyên Ương Đao, Tiếu Ngạo (khoái đao Điền Bá Quang), Cổ Long
  dao: [tr('Hồ Gia Đao Pháp', "Hu Family Saber Art"), tr('Huyết Đao Đao Pháp', "Blood Saber Art"), tr('Uyên Ương Đao', "Mandarin Duck Saber"), tr('Cuồng Phong Khoái Đao', "Gale Swift Saber"), tr('Bát Quái Đao', "Eight Trigrams Saber"), tr('Phách Quải Đao', "Chopping Hook Saber"), tr('Thiên Nhai Nhất Đao', "One Saber at the World's End"), tr('Lực Phách Hoa Sơn', "Mighty Chop Splits Hua Shan"), tr('Hoành Tảo Thiên Quân', "Sweep a Thousand Armies")],
  // Thương: Dương gia tướng, Xạ Điêu (Dương Thiết Tâm), Nhạc Phi, Tam Quốc (Triệu Vân)
  thuong: [tr('Dương Gia Thương Pháp', "Yang Family Spear Art"), tr('Lê Hoa Thương', "Pear Blossom Spear"), tr('Nhạc Gia Thương Pháp', "Yue Family Spear Art"), tr('Bách Điểu Triều Phụng', "Hundred Birds Pay Homage to the Phoenix"), tr('Bá Vương Thương', "Overlord's Spear"), tr('Hồi Mã Thương', "Horse-Turning Spear"), tr('Độc Long Xuất Động', "Lone Dragon Leaves Its Cave"), tr('Thất Tinh Thương Pháp', "Seven Stars Spear Art")],
  // Côn, gậy, trượng: Cái Bang, Thiếu Lâm, Tây Du
  truong: [tr('Đả Cẩu Bổng Pháp', "Dog-Beating Staff Art"), tr('Tề Mi Côn', "Brow-Height Staff"), tr('La Hán Côn', "Arhat Staff"), tr('Phục Ma Trượng Pháp', "Demon-Subduing Staff Art"), tr('Như Ý Côn Pháp', "Ruyi Staff Art"), tr('Bát Quái Côn', "Eight Trigrams Staff"), tr('Thiên Hạ Vô Cẩu', "No Dogs Under Heaven"), tr('Phong Ma Trượng Pháp', "Mad Demon Staff Art")],
  // Cung: Xạ Điêu (Quách Tĩnh bắn điêu), Hậu Nghệ, Dưỡng Do Cơ (bách bộ xuyên dương)
  cung: [tr('Xạ Điêu Thần Tiễn', "Divine Eagle-Shooting Arrow"), tr('Liên Châu Tiễn', "Chain Pearl Arrows"), tr('Hậu Nghệ Xạ Nhật', "Houyi Shoots the Suns"), tr('Bách Bộ Xuyên Dương', "Pierce the Willow at a Hundred Paces"), tr('Truy Tinh Tiễn', "Star-Chasing Arrow"), tr('Phá Vân Tiễn', "Cloud-Piercing Arrow")],
  // Ám khí: Cổ Long (Tiểu Lý phi đao, Bạo Vũ Lê Hoa Châm), Đường Môn, Thần Điêu (Ngọc Phong Châm, Băng Phách Ngân Châm), Thủy Hử
  tieu: [tr('Tiểu Lý Phi Đao', "Little Li's Flying Dagger"), tr('Bạo Vũ Lê Hoa Châm', "Storm of Pear Blossom Needles"), tr('Mãn Thiên Hoa Vũ', "Petals Raining Across the Sky"), tr('Băng Phách Ngân Châm', "Frost Soul Silver Needles"), tr('Ngọc Phong Châm', "Jade Bee Needles"), tr('Đạn Chỉ Thần Thông', "Divine Finger Flick"), tr('Phi Hoàng Thạch', "Flying Locust Stones"), tr('Hàm Sa Xạ Ảnh', "Sand-Spitting Shadow Strike")],
  // Sáo, tiêu: Xạ Điêu (Hoàng Dược Sư thổi Bích Hải Triều Sinh Khúc), Tiếu Ngạo
  sao: [tr('Bích Hải Triều Sinh Khúc', "Tide Rising on the Azure Sea"), tr('Ngọc Tiêu Kiếm Pháp', "Jade Flute Sword Art"), tr('Tiếu Ngạo Giang Hồ Khúc', "Song of the Proud Jianghu"), tr('Thiên Ma Cầm Âm', "Heavenly Demon Zither"), tr('Lạc Anh Tân Phân', "Falling Petals in Flurries")],
  // Quạt
  quat: [tr('Phiến Ảnh Điểm Huyệt', "Fan Shadow Acupoint Strike"), tr('Khổng Tước Khai Bình', "Peacock Spreads Its Tail"), tr('Bát Phong Phiến Pháp', "Eight Winds Fan Art"), tr('Thanh Phong Từ Lai', "Clear Breeze Comes Gently"), tr('Thiết Phiến Đoạn Hồn', "Iron Fan Soul Severer"), tr('Phong Quyển Tàn Vân', "Wind Sweeps the Last Clouds")],
  // Bút: Phán quan bút, Tiếu Ngạo (Ngốc Bút Ông viết thư pháp thành võ), Xạ Điêu (Chu Tử Liễu)
  but: [tr('Phán Quan Điểm Huyệt', "Judge's Acupoint Strike"), tr('Bùi Tướng Quân Thiếp', "General Pei's Calligraphy"), tr('Nhất Dương Thư Chỉ', "One Yang Brush Finger"), tr('Thạch Cổ Đả Huyệt', "Stone Drum Acupoint Strike"), tr('Long Phi Phượng Vũ', "Dragon Flies, Phoenix Dances"), tr('Thiết Họa Ngân Câu', "Iron Strokes, Silver Hooks")],
  // Chùy, xử: Thần Điêu (Kim cương xử của Mật tông), Tùy Đường (Lý Nguyên Bá)
  chuy: [tr('Lưu Tinh Chùy Pháp', "Meteor Hammer Art"), tr('Kim Cương Xử Pháp', "Vajra Pestle Art"), tr('Bát Lăng Chùy', "Eight-Edged Mace"), tr('Lôi Công Chùy', "Thunder God Hammer"), tr('Khai Sơn Phá Thạch', "Split Mountains, Shatter Stone"), tr('Thái Sơn Áp Đỉnh', "Mount Tai Crushes the Summit")],
  // Roi: Thần Điêu (Ngân Tác Kim Linh của Cổ Mộ phái)
  roi: [tr('Ngân Tác Kim Linh', "Silver Rope, Golden Bell"), tr('Câu Hồn Tiên Pháp', "Soul-Hooking Whip Art"), tr('Ngũ Độc Tiên', "Five Poisons Whip"), tr('Linh Xà Tiên Pháp', "Spirit Serpent Whip Art"), tr('Cửu Tiết Tiên', "Nine-Section Whip"), tr('Thị Huyết Tiên Pháp', "Bloodthirsty Whip Art")],
  // Cần câu: Xạ Điêu (Ngư Tiều Canh Độc), Khương Tử Nha
  can: [tr('Ngư Ông Điếu Nguyệt', "Old Fisherman Angles for the Moon"), tr('Thái Công Điếu Ngư', "Taigong Goes Fishing"), tr('Nguyện Giả Thượng Câu', "The Willing Take the Hook"), tr('Độc Điếu Hàn Giang', "Lone Angler on the Cold River")],
  // Liềm, búa: Thủy Hử (song phủ Lý Quỳ), Tùy Đường (tam bản phủ Trình Giảo Kim), Bàn Cổ khai thiên
  liem: [tr('Bàn Cổ Khai Thiên', "Pangu Splits the Heavens"), tr('Tam Bản Phủ', "Three-Move Axe"), tr('Khai Sơn Phủ Pháp', "Mountain-Splitting Axe Art"), tr('Huyết Liêm Đoạt Hồn', "Blood Scythe Soul-Hooking Envoy"), tr('Toàn Phong Song Phủ', "Whirlwind Twin Axes"), tr('Thu Hồn Liêm Pháp', "Soul-Reaping Scythe Art")],
  // Phất trần: Thần Điêu (Lý Mạc Sầu, Toàn Chân), đạo môn
  phattran: [tr('Phất Trần Công', "Horsetail Whisk Art"), tr('Thái Ất Phất Trần', "Taiyi Whisk"), tr('Hồi Phong Phất Liễu', "Whirlwind Willow Brush"), tr('Tam Thanh Phất Vân', "Three Pure Ones Sweep the Clouds"), tr('Thiên Tơ Vạn Lũ', "A Thousand Threads, Ten Thousand Strands")],
  // Cuốc, xẻng: nông cụ
  cuoc: [tr('Thần Nông Khai Hoang', "Shennong Clears the Wilds"), tr('Lão Nông Phạt Thổ', "Old Farmer Tills the Earth"), tr('Khai Cương Phá Thổ', "Break New Ground"), tr('Xuân Canh Thu Hoạch', "Spring Plowing, Autumn Harvest")],
  // Lò đan: Tây Du (lò bát quái của Thái Thượng Lão Quân)
  lodan: [tr('Bát Quái Lô Hỏa', "Eight Trigrams Furnace Fire"), tr('Đan Hỏa Phần Thiên', "Pill Fire Burns the Heavens"), tr('Tam Muội Chân Hỏa', "Samadhi True Fire"), tr('Cửu Chuyển Kim Đan', "Nine-Turn Golden Pill")],
  // Quyền, chưởng, trảo (thủ sáo hoặc tay không): Thiên Long, Xạ Điêu, Thần Điêu, Ỷ Thiên, Hoàng Phi Hồng
  quyen: [
    tr('Hàng Long Thập Bát Chưởng', "Eighteen Dragon-Subduing Palms"),
    tr('Kháng Long Hữu Hối', "Arrogant Dragon Regrets"),
    tr('Thần Long Bãi Vĩ', "Divine Dragon Swings Its Tail"),
    tr('Thất Thương Quyền', "Seven Injuries Fist"),
    tr('Không Minh Quyền', "Empty Bright Fist"),
    tr('Thái Tổ Trường Quyền', "Grand Ancestor Long Fist"),
    tr('Cửu Âm Bạch Cốt Trảo', "Nine Yin White Bone Claw"),
    tr('Hổ Trảo Công', "Tiger Claw Art"),
    tr('Ưng Trảo Công', "Eagle Claw Art"),
    tr('Thiên Sơn Lục Dương Chưởng', "Tianshan Six Yang Palm"),
    tr('Ảm Nhiên Tiêu Hồn Chưởng', "Melancholic Soul-Dispersing Palm"),
    tr('Bàn Nhược Chưởng', "Prajna Palm"),
    tr('Hàm Mô Công', "Toad Art"),
    tr('Phật Sơn Vô Ảnh Cước', "Foshan Shadowless Kick"),
    tr('La Hán Quyền', "Arhat Fist"),
  ],
};

/** Chưởng pháp theo con đường tu luyện (vận khí xuất chưởng, không cần binh khí) */
export const CHUONG_PATH: Record<string, string[]> = {
  kiem: [tr('Kiếm Khí Chưởng', "Sword Qi Palm"), tr('Lục Mạch Thần Kiếm', "Six Meridians Divine Sword"), tr('Lạc Anh Thần Kiếm Chưởng', "Falling Petals Divine Sword Palm")],
  dan: [tr('Liệt Hỏa Chưởng', "Blazing Fire Palm"), tr('Đan Hỏa Chưởng', "Pill Fire Palm"), tr('Thiết Sa Chưởng', "Iron Sand Palm")],
  tran: [tr('Bát Quái Chưởng', "Eight Trigrams Palm"), tr('Cửu Cung Chưởng', "Nine Palaces Palm"), tr('Thái Cực Quyền', "Taiji Fist")],
  phat: [tr('Như Lai Thần Chưởng', "Buddha's Divine Palm"), tr('Đại Lực Kim Cang Chỉ', "Great Strength Vajra Finger"), tr('Bàn Nhược Chưởng', "Prajna Palm"), tr('Nhất Dương Chỉ', "One Yang Finger")],
  ma: [tr('Huyền Minh Thần Chưởng', "Mystic Dark Divine Palm"), tr('Hóa Cốt Miên Chưởng', "Bone-Melting Cotton Palm"), tr('Huyết Ảnh Chưởng', "Blood Shadow Palm"), tr('Hấp Tinh Đại Pháp', "Star-Absorbing Great Art"), tr('Bắc Minh Thần Công', "Northern Abyss Divine Art")],
  yeu: [tr('Yêu Lang Trảo', "Demon Wolf Claw"), tr('Hồ Vĩ Chưởng', "Fox Tail Palm"), tr('Vạn Yêu Chưởng', "Myriad Yao Palm")],
  _: [tr('Thiết Sa Chưởng', "Iron Sand Palm"), tr('Bát Quái Chưởng', "Eight Trigrams Palm"), tr('Miên Chưởng', "Cotton Palm"), tr('Phách Không Chưởng', "Void-Splitting Palm"), tr('Hàng Long Chưởng', "Dragon-Subduing Palm"), tr('Thái Cực Chưởng', "Taiji Palm")],
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
  if (k === 'tieu' && /ngọc tiêu|sáo|địch|flute|xiao/i.test(it.name)) return 'sao';
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
