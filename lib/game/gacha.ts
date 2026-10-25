import type { Character } from './types';
import { clamp, dao, giveItem, money, stat } from './helpers';

/** Thiên phú rút ngẫu nhiên lúc đầu thai. rare: 0 phàm, 1 lam, 2 tím, 3 cam, 4 đỏ */
export interface Gift {
  id: string;
  name: string;
  desc: string;
  rare: 0 | 1 | 2 | 3 | 4;
  bad?: boolean; // có mặt trái
  apply?: (c: Character) => void;
}

export const RARE_NAME = ['Phàm', 'Linh', 'Huyền', 'Địa', 'Thiên'];
export const RARE_W = [58, 28, 11, 2.9, 0.1];

export const GIFTS: Gift[] = [
  // ---- Phàm ----
  { id: 'g_trau', name: 'Khỏe như trâu', desc: 'Sức khỏe +12', rare: 0, apply: (c) => stat(c, 'sucKhoe', 12) },
  { id: 'g_lanh', name: 'Lanh lợi', desc: 'Ngộ tính +6', rare: 0, apply: (c) => stat(c, 'ngoTinh', 6) },
  { id: 'g_mom', name: 'Mồm mép tép nhảy', desc: '+40 linh thạch, nói gì cũng lọt tai', rare: 0, apply: (c) => money(c, 40) },
  {
    id: 'g_mun',
    name: 'Mặt đầy mụn',
    desc: 'Khí vận -3, nhưng tâm chẳng vướng bụi hồng: tâm cảnh +8',
    rare: 0,
    bad: true,
    apply: (c) => {
      stat(c, 'khiVan', -3);
      stat(c, 'tamCanh', 8);
    },
  },
  { id: 'g_an', name: 'Ham ăn', desc: 'Sức khỏe +6, mỗi năm tốn thêm tiền ăn', rare: 0, bad: true, apply: (c) => stat(c, 'sucKhoe', 6) },
  {
    id: 'g_ngu',
    name: 'Ngủ nhiều',
    desc: 'Tâm ma -5, ngộ tính -3',
    rare: 0,
    apply: (c) => {
      stat(c, 'tamMa', -5);
      stat(c, 'ngoTinh', -3);
    },
  },
  {
    id: 'g_ngheo',
    name: 'Nhà nghèo chí lớn',
    desc: 'Mất hết của cải ban đầu, khí vận +8',
    rare: 0,
    bad: true,
    apply: (c) => {
      c.linhThach = 0;
      stat(c, 'khiVan', 8);
    },
  },
  // ---- Linh ----
  {
    id: 'g_sao_choi',
    name: 'Sao chổi giáng thế',
    desc: 'Khí vận -15, ngộ tính +15',
    rare: 1,
    bad: true,
    apply: (c) => {
      stat(c, 'khiVan', -15);
      stat(c, 'ngoTinh', 15);
    },
  },
  { id: 'g_tham', name: 'Tham lam', desc: 'Nhà bỗng giàu to (+400). Nhưng tham thì thâm...', rare: 1, bad: true, apply: (c) => money(c, 400) },
  { id: 'g_dao_hoa', name: 'Mệnh đào hoa', desc: 'Dễ gặp đạo lữ gấp 3, tâm cảnh +5', rare: 1, apply: (c) => stat(c, 'tamCanh', 5) },
  { id: 'g_menh_cung', name: 'Mệnh cứng', desc: 'Khó chết hơn 30% trong mọi hiểm cảnh', rare: 1 },
  { id: 'g_than_luc', name: 'Trời sinh thần lực', desc: 'Công khi trừ yêu +25%', rare: 1 },
  {
    id: 'g_tram_uat',
    name: 'Trời sinh u uất',
    desc: 'Tâm ma +20, ngộ tính +12',
    rare: 1,
    bad: true,
    apply: (c) => {
      stat(c, 'tamMa', 20);
      stat(c, 'ngoTinh', 12);
    },
  },
  // ---- Huyền ----
  {
    id: 'g_kiem_cot',
    name: 'Thiên sinh kiếm cốt',
    desc: 'Sinh ra cầm kiếm, du ngoạn và trừ yêu mạnh hơn',
    rare: 2,
    apply: (c) => {
      giveItem(c, 'moc_kiem');
      stat(c, 'sucKhoe', 8);
    },
  },
  { id: 'g_ngoc', name: 'Ngậm ngọc mà sinh', desc: 'Chào đời đã đeo Ngọc bội hộ thân', rare: 2, apply: (c) => giveItem(c, 'ngoc_boi') },
  { id: 'g_don_ngo', name: 'Đốn ngộ', desc: 'Ngộ tính +25', rare: 2, apply: (c) => stat(c, 'ngoTinh', 25) },
  {
    id: 'g_thanh_the',
    name: 'Thánh thể',
    desc: 'Sức khỏe +20, thọ nguyên +10%',
    rare: 2,
    apply: (c) => {
      stat(c, 'sucKhoe', 20);
      c.lifeMul = (c.lifeMul ?? 1) * 1.1;
      c.lifespan = Math.round(c.lifespan * 1.1);
    },
  },
  {
    id: 'g_doan_menh',
    name: 'Thiên đố anh tài',
    desc: 'Thọ nguyên -30%, ngộ tính +30, tu luyện nhanh hơn',
    rare: 2,
    bad: true,
    apply: (c) => {
      c.lifeMul = (c.lifeMul ?? 1) * 0.7;
      c.lifespan = Math.round(c.lifespan * 0.7);
      stat(c, 'ngoTinh', 30);
    },
  },
  { id: 'g_co_tinh', name: 'Thiên sát cô tinh', desc: 'Khí vận +20, nhưng người thân cận khó bền', rare: 2, bad: true, apply: (c) => stat(c, 'khiVan', 20) },
  // ---- Địa ----
  { id: 'g_hop', name: 'Chiếc hộp bí ẩn', desc: 'Một chiếc hộp không mở được. Bà mụ dặn: đến năm 80 tuổi hãy mở.', rare: 3 },
  { id: 'g_he_thong', name: 'Hệ Thống', desc: 'Đinh! Một giọng nói lạ vang lên trong đầu bạn...', rare: 3 },
  {
    id: 'g_trung_sinh',
    name: 'Trùng sinh giả',
    desc: 'Nhớ rõ kiếp trước. Ngộ tính +15, khởi đầu có tu vi',
    rare: 3,
    apply: (c) => {
      stat(c, 'ngoTinh', 15);
      c.cultivation += 30;
    },
  },
  // ---- Thiên ----
  {
    id: 'g_thien_menh',
    name: 'Thiên mệnh chi tử',
    desc: 'Khí vận tối đa, linh căn biến dị, đột phá dễ hơn',
    rare: 4,
    apply: (c) => {
      c.stats.khiVan = 100;
      c.linhCanMul = Math.max(c.linhCanMul, 1.6);
      c.linhCan = 'Hỗn Độn linh căn';
    },
  },
  {
    id: 'g_chan_tien',
    name: 'Chân tiên chuyển thế',
    desc: 'Một vị tiên nhân đầu thai. Tu luyện gấp đôi, thọ +20%',
    rare: 4,
    apply: (c) => {
      c.linhCanMul *= 2;
      c.lifeMul = (c.lifeMul ?? 1) * 1.2;
      c.lifespan = Math.round(c.lifespan * 1.2);
      dao(c, 10);
    },
  },
];

export const giftOf = (id: string) => GIFTS.find((g) => g.id === id);

/** Rút n thiên phú, không trùng */
export function drawGifts(n: number, rnd: () => number = Math.random): string[] {
  const out: string[] = [];
  let guard = 0;
  while (out.length < n && guard++ < 200) {
    let r = rnd() * 100;
    let rare = 0;
    for (let i = 0; i < RARE_W.length; i++) {
      r -= RARE_W[i];
      if (r <= 0) {
        rare = i;
        break;
      }
    }
    const pool = GIFTS.filter((g) => g.rare === rare && !out.includes(g.id));
    if (!pool.length) continue;
    out.push(pool[Math.floor(rnd() * pool.length)].id);
  }
  return out;
}

export function applyGifts(c: Character, ids: string[]) {
  c.gifts = ids;
  for (const id of ids) giftOf(id)?.apply?.(c);
  for (const k of Object.keys(c.stats) as (keyof typeof c.stats)[]) c.stats[k] = clamp(c.stats[k], 0, 100);
}

export const hasGift = (c: Character, id: string) => !!c.gifts?.includes(id);
