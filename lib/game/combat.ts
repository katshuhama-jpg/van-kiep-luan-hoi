import { REALMS } from './data';
import { addCult, addPill, clamp, fatal, money, needFor, stat } from './helpers';
import type { Character, EffectCtx } from './types';

/** Dáng quái dùng để vẽ pixel */
export type MonsterShape = 'thu' | 'ran' | 'nguoi' | 'chim' | 'rong' | 'bo';

export interface Monster {
  id: string;
  name: string;
  lv: number;
  place: string;
  shape: MonsterShape;
  body: string;
  accent: string;
  eye: string;
  desc: string;
  boss?: 'chinh' | 'ta';
}

/** 15 loại quái, xếp theo cấp. Cấp người chơi: Luyện Khí 1-9, Trúc Cơ 10-12, Kim Đan 13-15... */
export const MONSTERS: Monster[] = [
  { id: 'tho_yeu', name: 'Thỏ Yêu', lv: 1, place: 'Bãi cỏ đầu làng', shape: 'thu', body: '#f2f2f6', accent: '#ffb3c6', eye: '#e0202e', desc: 'Thỏ mới khai linh trí, cắn hơi đau.' },
  { id: 'soi_xam', name: 'Sói Xám Thành Tinh', lv: 2, place: 'Rừng Thanh Tùng', shape: 'thu', body: '#7d8590', accent: '#4a4f58', eye: '#ffd36b', desc: 'Đi theo bầy, đêm trăng rất hung.' },
  { id: 'ran_hoa', name: 'Hoa Văn Mãng', lv: 3, place: 'Đầm Lầy Xanh', shape: 'ran', body: '#5fbf6a', accent: '#ffd36b', eye: '#e0202e', desc: 'Rắn lớn hoa văn, có độc nhẹ.' },
  { id: 'khi_ac', name: 'Ác Hầu', lv: 5, place: 'Hoa Quả Sơn', shape: 'nguoi', body: '#a0704a', accent: '#e0b48a', eye: '#ffd36b', desc: 'Khỉ yêu tinh ranh, thích cướp đồ.' },
  { id: 'heo_rung', name: 'Thiết Nha Trư', lv: 7, place: 'Rừng Hắc Mộc', shape: 'thu', body: '#5a4a44', accent: '#e6e6ee', eye: '#ff6a2a', desc: 'Heo rừng nanh sắt, da dày như giáp.' },
  { id: 'bo_cap', name: 'Huyết Hạt Vương', lv: 9, place: 'Sa Mạc Hoàng Sa', shape: 'bo', body: '#b8302a', accent: '#5a1a1a', eye: '#ffd36b', desc: 'Bọ cạp đỏ, đuôi chứa kịch độc.' },
  { id: 'ho_yeu', name: 'Cửu Vĩ Hồ Yêu', lv: 11, place: 'Thanh Khâu', shape: 'thu', body: '#ff9a4a', accent: '#fff4e0', eye: '#9a3ad0', desc: 'Hồ ly mê hoặc lòng người.' },
  { id: 'cuong_thi', name: 'Thiết Giáp Cương Thi', lv: 13, place: 'Nghĩa Trang Cổ', shape: 'nguoi', body: '#6a8a7a', accent: '#2a3a4a', eye: '#9ff0c8', desc: 'Xác chết ngàn năm, đao kiếm khó chém.' },
  { id: 'hac_hung', name: 'Hắc Hùng Tinh', lv: 15, place: 'Hắc Phong Sơn', shape: 'thu', body: '#2a2228', accent: '#7a5a3a', eye: '#ffd36b', desc: 'Gấu đen tu luyện ngàn năm, sức mạnh vô song.' },
  { id: 'ngan_giac', name: 'Ngân Giác Mãng', lv: 17, place: 'Vạn Xà Cốc', shape: 'ran', body: '#9aa6c0', accent: '#e6eaf6', eye: '#e0202e', desc: 'Mãng xà có sừng bạc, sắp hóa giao.' },
  { id: 'dai_bang', name: 'Kim Sí Đại Bằng', lv: 19, place: 'Đỉnh Vân Tiêu', shape: 'chim', body: '#e0a030', accent: '#ffe27a', eye: '#e0202e', desc: 'Chim thần cánh vàng, một cái vỗ cánh chín vạn dặm.' },
  { id: 'huyet_ma', name: 'Huyết Ma', lv: 21, place: 'Huyết Hải', shape: 'nguoi', body: '#7a0a1e', accent: '#1e1a24', eye: '#ff2a3a', desc: 'Ma đầu sinh ra từ biển máu.' },
  { id: 'bang_giao', name: 'Băng Giao', lv: 23, place: 'Bắc Hải Băng Nguyên', shape: 'rong', body: '#7fc8ff', accent: '#eaf6ff', eye: '#2a3a6a', desc: 'Giao long băng giá, hơi thở đóng băng vạn vật.' },
  { id: 'ky_lan', name: 'Hỏa Kỳ Lân', lv: 25, place: 'Hỏa Diệm Sơn', shape: 'thu', body: '#e0502a', accent: '#ffd36b', eye: '#ffffff', desc: 'Thần thú lửa, giẫm đâu cháy đó.' },
  { id: 'hac_long', name: 'Thượng Cổ Hắc Long', lv: 27, place: 'Vực Vô Tận', shape: 'rong', body: '#1e1a2e', accent: '#9a3ad0', eye: '#ffd36b', desc: 'Long tộc thượng cổ. Phi thăng giả cũng phải dè chừng.' },
  // Boss: không thể thắng
  { id: 'boss_ta', name: 'Huyết Ma Lão Tổ', lv: 40, place: 'Tổng đàn Huyết Sát Môn', shape: 'nguoi', body: '#e8d0c0', accent: '#5a0a14', eye: '#ff2a3a', desc: 'Ma đầu sống qua ba lần thiên kiếp, giết người như ngóe.', boss: 'ta' },
  { id: 'boss_chinh', name: 'Thái Thượng Kiếm Tôn', lv: 40, place: 'Đỉnh Thanh Vân', shape: 'nguoi', body: '#f2e6d0', accent: '#eef2ff', eye: '#3d6fb0', desc: 'Đệ nhất kiếm tiên chính đạo, một kiếm phá vạn pháp.', boss: 'chinh' },
];

const REALM_BASE = [0, 0, 9, 12, 15, 18, 21, 24];

/** Cấp chiến đấu của nhân vật: Phàm 0, Luyện Khí 1-9, Trúc Cơ 10-12, Kim Đan 13-15, ... Độ Kiếp 25-27 */
export function combatLevel(c: Character): number {
  if (c.realm === 0) return 0;
  return (REALM_BASE[c.realm] ?? 24) + c.layer;
}

const GROW = 1.15;

export interface Fighter {
  hp: number;
  atk: number;
  def: number;
}

export function playerStats(c: Character): Fighter {
  const L = combatLevel(c) + (c.cultivation / needFor(c)) * 0.6;
  const s = Math.pow(GROW, L);
  let atk = 15 * s;
  let def = 4 * s;
  let hp = 125 * s * (0.6 + c.stats.sucKhoe / 250);
  if (c.path === 'kiem') atk *= 1.3;
  if (c.path === 'ma') atk *= 1.25;
  if (c.path === 'yeu') hp *= 1.25;
  if (c.path === 'tran') def *= 1.4;
  if (c.path === 'phat') (hp *= 1.15), (def *= 1.15);
  const w = c.equipped.vu_khi;
  if (w === 'moc_kiem') atk *= 1.05;
  if (w === 'thanh_phong') atk *= 1.2;
  if (w === 'huyet_dao') atk *= 1.3;
  if (w === 'phat_tran') def *= 1.15;
  if (c.equipped.phu_kien === 'kiem_bay') atk *= 1.25;
  if (c.equipped.ao === 'tu_kim_bao' || c.equipped.ao === 'bach_y') def *= 1.2;
  if (c.equipped.ao === 'huyet_bao') atk *= 1.1;
  // tuổi già sức yếu
  if (c.age / c.lifespan > 0.85) (atk *= 0.85), (hp *= 0.85);
  return { hp: Math.round(hp), atk: Math.round(atk), def: Math.round(def) };
}

export function monsterStats(m: Monster): Fighter {
  if (m.boss) return { hp: 9e15, atk: 9e12, def: 9e12 };
  const s = Math.pow(GROW, m.lv);
  return { hp: Math.round(110 * s), atk: Math.round(13 * s), def: Math.round(4 * s) };
}

export type Danger = 'de' | 'vua' | 'nguy' | 'tu';

export function dangerOf(c: Character, m: Monster): Danger {
  if (m.boss) return 'tu';
  const d = m.lv - combatLevel(c);
  if (d <= -3) return 'de';
  if (d <= 0) return 'vua';
  if (d <= 2) return 'nguy';
  return 'tu';
}

export const DANGER_TEXT: Record<Danger, string> = { de: 'Dễ', vua: 'Vừa sức', nguy: 'Nguy hiểm', tu: 'Tử địa' };

/** Sát thương một đòn */
export function hit(atk: number, def: number, rnd: () => number): { dmg: number; crit: boolean } {
  if (rnd() < 0.12) return { dmg: 0, crit: false }; // né được
  const crit = rnd() < 0.15;
  const raw = atk * (0.7 + rnd() * 0.6) * (crit ? 2 : 1);
  return { dmg: Math.max(1, Math.round(raw - def * 0.5)), crit };
}

/** Ước tính tu vi nhận được khi thắng (để hiện ở bảng chọn quái) */
export function killExp(c: Character, m: Monster): number {
  if (m.boss) return 0;
  const d = m.lv - combatLevel(c);
  const base = (REALMS[c.realm]?.need ?? 60) * 0.055;
  const factor = d <= -4 ? 0.15 : clamp(1 + 0.35 * d, 0.3, 2.4);
  return Math.max(1, Math.round(base * factor * c.linhCanMul));
}

export function killReward(c: Character, m: Monster, ctx: EffectCtx): string[] {
  const notes: string[] = [];
  addCult(c, killExp(c, m));
  money(c, Math.round((2 + m.lv * 3) * (0.7 + ctx.rnd() * 0.6)));
  c.kills = c.kills ?? {};
  const n = (c.kills[m.id] = (c.kills[m.id] ?? 0) + 1);
  if (n === 1) notes.push(`Lần đầu hạ được ${m.name} ở ${m.place}.`);
  if (n === 100) notes.push(`Đã trảm 100 con ${m.name}. Giang hồ gọi bạn là khắc tinh của chúng.`);
  const r = ctx.rnd();
  if (r < 0.03) {
    addCult(c, killExp(c, m) * 8);
    ctx.fx('layer', 'Yêu đan!');
    notes.push(`${m.name} rơi ra một viên yêu đan, nuốt vào tu vi tăng vọt.`);
  } else if (r < 0.1) {
    const pill = m.lv >= 13 && ctx.rnd() < 0.3 ? 'truc_co' : ctx.rnd() < 0.5 ? 'tu_khi' : 'hoi_xuan';
    addPill(c, pill);
    ctx.fx('buy', pill === 'truc_co' ? '+Trúc Cơ Đan' : pill === 'tu_khi' ? '+Tụ Khí Đan' : '+Hồi Xuân Đan');
  }
  if (m.lv >= 11 && ctx.rnd() < 0.02) stat(c, 'khiVan', 1);
  return notes;
}

/** Thua trận: có thể chết. Trả về câu mô tả. */
export function loseFight(c: Character, m: Monster, ctx: EffectCtx): string {
  if (m.boss) {
    // đánh boss chắc chắn thua: hên thì trọng thương, xui thì chết
    if (m.boss === 'chinh') stat(c, 'tamMa', 5);
    const cause =
      m.boss === 'ta'
        ? `Huyết Ma Lão Tổ chỉ khẽ búng tay. Máu trong người bạn sôi lên rồi nổ tung. Bạn chết ở tổng đàn Huyết Sát Môn.`
        : `Thái Thượng Kiếm Tôn không rút kiếm, chỉ một đạo kiếm ý đã chém bạn làm đôi. Bạn chết dưới chân đỉnh Thanh Vân.`;
    const f = fatal(c, ctx, 0.5, cause);
    if (c.dead) return `Bạn không biết lượng sức.${f}`;
    stat(c, 'sucKhoe', -60);
    c.cultivation = Math.round(c.cultivation * 0.6);
    return m.boss === 'ta'
      ? `Huyết Ma Lão Tổ cười khẩy, hút đi một phần tu vi rồi ném bạn ra khỏi tổng đàn. Bạn trọng thương, may còn giữ được mạng.${f ?? ''}`
      : `Kiếm Tôn thu kiếm: "Còn trẻ, đừng phí mạng." Kiếm khí phế mất một phần tu vi của bạn. Bạn trọng thương trở về.${f ?? ''}`;
  }
  const f = fatal(c, ctx, 0.85, `Bạn bị ${m.name} giết chết ở ${m.place}, thi thể không còn nguyên vẹn.`);
  if (c.dead) return `Trừ yêu thất bại.${f}`;
  stat(c, 'sucKhoe', -35);
  return `Bạn thua ${m.name}, lết được về nhà, trọng thương.${f ?? ''}`;
}

export function fleeChance(c: Character, m: Monster): number {
  if (m.boss) return 0.05;
  const d = m.lv - combatLevel(c);
  return clamp(0.85 - Math.max(0, d) * 0.12, 0.25, 0.9);
}
