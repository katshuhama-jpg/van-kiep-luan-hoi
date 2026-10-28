import type { Character } from './types';
import { clamp, dao, giveItem, money, stat } from './helpers';
import { tr } from '../i18n';

/** Thiên phú rút ngẫu nhiên lúc đầu thai. rare: 0 phàm, 1 lam, 2 tím, 3 cam, 4 đỏ */
export interface Gift {
  id: string;
  name: string;
  desc: string;
  rare: 0 | 1 | 2 | 3 | 4;
  bad?: boolean; // có mặt trái
  apply?: (c: Character) => void;
}

export const RARE_NAME = [tr('Phàm', "Mortal"), tr('Linh', "Spirit"), tr('Huyền', "Mystic"), tr('Địa', "Earth"), tr('Thiên', "Heaven")];
export const RARE_W = [58, 28, 11, 2.9, 0.1];

export const GIFTS: Gift[] = [
  // ---- Phàm ----
  { id: 'g_trau', name: tr('Khỏe như trâu', "Strong as an ox"), desc: tr('Sức khỏe +12', "Health +12"), rare: 0, apply: (c) => stat(c, 'sucKhoe', 12) },
  { id: 'g_lanh', name: tr('Lanh lợi', "Quick-witted"), desc: tr('Ngộ tính +6', "Insight +6"), rare: 0, apply: (c) => stat(c, 'ngoTinh', 6) },
  { id: 'g_mom', name: tr('Mồm mép tép nhảy', "Silver tongue"), desc: tr('+40 linh thạch, nói gì cũng lọt tai', "+40 spirit stones, and everything you say goes down smooth"), rare: 0, apply: (c) => money(c, 40) },
  {
    id: 'g_mun',
    name: tr('Mặt đầy mụn', "Pimple face"),
    desc: tr('Khí vận -3, nhưng tâm chẳng vướng bụi hồng: tâm cảnh +8', "Luck -3, but no romance to cloud your heart: Mind +8"),
    rare: 0,
    bad: true,
    apply: (c) => {
      stat(c, 'khiVan', -3);
      stat(c, 'tamCanh', 8);
    },
  },
  { id: 'g_an', name: tr('Ham ăn', "Glutton"), desc: tr('Sức khỏe +6, mỗi năm tốn thêm tiền ăn', "Health +6, costs extra food money every year"), rare: 0, bad: true, apply: (c) => stat(c, 'sucKhoe', 6) },
  {
    id: 'g_ngu',
    name: tr('Ngủ nhiều', "Sleepyhead"),
    desc: tr('Tâm ma -5, ngộ tính -3', "Heart demon -5, Insight -3"),
    rare: 0,
    apply: (c) => {
      stat(c, 'tamMa', -5);
      stat(c, 'ngoTinh', -3);
    },
  },
  {
    id: 'g_ngheo',
    name: tr('Nhà nghèo chí lớn', "Poor but ambitious"),
    desc: tr('Mất hết của cải ban đầu, khí vận +8', "Lose all starting wealth, Luck +8"),
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
    name: tr('Sao chổi giáng thế', "Born a jinx"),
    desc: tr('Khí vận -15, ngộ tính +15', "Luck -15, Insight +15"),
    rare: 1,
    bad: true,
    apply: (c) => {
      stat(c, 'khiVan', -15);
      stat(c, 'ngoTinh', 15);
    },
  },
  { id: 'g_tham', name: tr('Tham lam', "Greedy"), desc: tr('Nhà bỗng giàu to (+400). Nhưng tham thì thâm...', "Sudden fortune (+400). But greed brings grief..."), rare: 1, bad: true, apply: (c) => money(c, 400) },
  { id: 'g_dao_hoa', name: tr('Mệnh đào hoa', "Peach-blossom fate"), desc: tr('Dễ gặp đạo lữ gấp 3, tâm cảnh +5', "3x more likely to meet a Dao companion, Mind +5"), rare: 1, apply: (c) => stat(c, 'tamCanh', 5) },
  { id: 'g_menh_cung', name: tr('Mệnh cứng', "Hard to kill"), desc: tr('Khó chết hơn 30% trong mọi hiểm cảnh', "30% less likely to die in any danger"), rare: 1 },
  { id: 'g_than_luc', name: tr('Trời sinh thần lực', "Born with divine strength"), desc: tr('Công khi trừ yêu +25%', "Attack +25% when hunting demons"), rare: 1 },
  {
    id: 'g_tram_uat',
    name: tr('Trời sinh u uất', "Born melancholy"),
    desc: tr('Tâm ma +20, ngộ tính +12', "Heart demon +20, Insight +12"),
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
    name: tr('Thiên sinh kiếm cốt', "Born with sword bones"),
    desc: tr('Sinh ra cầm kiếm, du ngoạn và trừ yêu mạnh hơn', "Born holding a sword - stronger when wandering and hunting demons"),
    rare: 2,
    apply: (c) => {
      giveItem(c, 'moc_kiem');
      stat(c, 'sucKhoe', 8);
    },
  },
  { id: 'g_ngoc', name: tr('Ngậm ngọc mà sinh', "Born with jade in mouth"), desc: tr('Chào đời đã đeo Ngọc bội hộ thân', "Enters the world wearing a protective jade pendant"), rare: 2, apply: (c) => giveItem(c, 'ngoc_boi') },
  { id: 'g_don_ngo', name: tr('Đốn ngộ', "Sudden enlightenment"), desc: tr('Ngộ tính +25', "Insight +25"), rare: 2, apply: (c) => stat(c, 'ngoTinh', 25) },
  {
    id: 'g_thanh_the',
    name: tr('Thánh thể', "Saint body"),
    desc: tr('Sức khỏe +20, thọ nguyên +10%', "Health +20, lifespan +10%"),
    rare: 2,
    apply: (c) => {
      stat(c, 'sucKhoe', 20);
      c.lifeMul = (c.lifeMul ?? 1) * 1.1;
      c.lifespan = Math.round(c.lifespan * 1.1);
    },
  },
  {
    id: 'g_doan_menh',
    name: tr('Thiên đố anh tài', "Heaven envies genius"),
    desc: tr('Thọ nguyên -30%, ngộ tính +30, tu luyện nhanh hơn', "Lifespan -30%, Insight +30, faster cultivation"),
    rare: 2,
    bad: true,
    apply: (c) => {
      c.lifeMul = (c.lifeMul ?? 1) * 0.7;
      c.lifespan = Math.round(c.lifespan * 0.7);
      stat(c, 'ngoTinh', 30);
    },
  },
  { id: 'g_co_tinh', name: tr('Thiên sát cô tinh', "Lone heavenly star"), desc: tr('Khí vận +20, nhưng khắc cha mẹ từ nhỏ, người thân cận khó bền', "Luck +20, but you bring doom to your parents and those close to you rarely last"), rare: 2, bad: true, apply: (c) => stat(c, 'khiVan', 20) },
  // ---- Địa ----
  { id: 'g_hop', name: tr('Chiếc hộp bí ẩn', "Mysterious box"), desc: tr('Một chiếc hộp không mở được. Bà mụ dặn: đến năm 80 tuổi hãy mở.', "A box that won't open. The midwife says: open it when you turn 80."), rare: 3 },
  { id: 'g_he_thong', name: tr('Hệ Thống', "The System"), desc: tr('Đinh! Một giọng nói lạ vang lên trong đầu bạn...', "Ding! A strange voice rings out in your head..."), rare: 3 },
  {
    id: 'g_trung_sinh',
    name: tr('Trùng sinh giả', "Reincarnator"),
    desc: tr('Nhớ rõ kiếp trước. Ngộ tính +15, khởi đầu có tu vi', "Remembers the past life clearly. Insight +15, starts with some cultivation"),
    rare: 3,
    apply: (c) => {
      stat(c, 'ngoTinh', 15);
      c.cultivation += 30;
    },
  },
  // ---- Thiên ----
  {
    id: 'g_thien_menh',
    name: tr('Thiên mệnh chi tử', "Child of Destiny"),
    desc: tr('Khí vận tối đa, linh căn biến dị, đột phá dễ hơn', "Maxed Luck, mutated spiritual root, easier breakthroughs"),
    rare: 4,
    apply: (c) => {
      c.stats.khiVan = 100;
      c.linhCanMul = Math.max(c.linhCanMul, 1.6);
      c.linhCan = tr('Hỗn Độn linh căn', "Chaos Spiritual Root");
    },
  },
  {
    id: 'g_chan_tien',
    name: tr('Chân tiên chuyển thế', "Reincarnated True Immortal"),
    desc: tr('Một vị tiên nhân đầu thai. Tu luyện gấp đôi, thọ +20%', "An immortal reborn. Double cultivation speed, lifespan +20%"),
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
