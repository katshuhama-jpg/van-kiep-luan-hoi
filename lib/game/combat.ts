import { ITEMS, REALMS, fxText, gearFx } from './data';
import { addCult, addPill, clamp, fatal, giveItem, money, needFor, stat } from './helpers';
import type { Character, EffectCtx } from './types';

/** Dáng quái dùng để vẽ pixel */
export type MonsterShape = 'thu' | 'ran' | 'nguoi' | 'chim' | 'rong' | 'bo' | 'vo_lam';

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
  human?: { weapon: 'kiem' | 'dao' | 'quyen' | 'quat'; hat?: boolean; mask?: boolean };
}

/** 15 loại quái, xếp theo cấp. Cấp người chơi: Luyện Khí 1-9, Trúc Cơ 10-12, Kim Đan 13-15... */
export const MONSTERS: Monster[] = [
  { id: 'tho_yeu', name: 'Thỏ Yêu', lv: 1, place: 'Bãi cỏ đầu làng', shape: 'thu', body: '#f2f2f6', accent: '#ffb3c6', eye: '#e0202e', desc: 'Thỏ mới khai linh trí, cắn hơi đau.' },
  { id: 'soi_xam', name: 'Sói Xám Thành Tinh', lv: 2, place: 'Rừng Thanh Tùng', shape: 'thu', body: '#7d8590', accent: '#4a4f58', eye: '#ffd36b', desc: 'Đi theo bầy, đêm trăng rất hung.' },
  { id: 'ran_hoa', name: 'Hoa Văn Mãng', lv: 3, place: 'Đầm Lầy Xanh', shape: 'ran', body: '#5fbf6a', accent: '#ffd36b', eye: '#e0202e', desc: 'Rắn lớn hoa văn, có độc nhẹ.' },
  { id: 'khi_ac', name: 'Ác Hầu', lv: 5, place: 'Hoa Quả Sơn', shape: 'nguoi', body: '#a0704a', accent: '#e0b48a', eye: '#ffd36b', desc: 'Khỉ yêu tinh ranh, thích cướp đồ.' },
  { id: 'heo_rung', name: 'Thiết Nha Trư', lv: 7, place: 'Rừng Hắc Mộc', shape: 'thu', body: '#5a4a44', accent: '#e6e6ee', eye: '#ff6a2a', desc: 'Heo rừng nanh sắt, da dày như giáp.' },
  { id: 'son_tac', name: 'Sơn Tặc Đầu Lĩnh', lv: 4, place: 'Hắc Phong Trại', shape: 'vo_lam', body: '#5a4a3a', accent: '#8a2a1e', eye: '#1a1a1a', desc: 'Trùm cướp núi, đao pháp thô bạo.', human: { weapon: 'dao' } },
  { id: 'thich_khach', name: 'Hắc Y Thích Khách', lv: 8, place: 'Ám Ảnh Lâu', shape: 'vo_lam', body: '#1e1e2a', accent: '#3a3a4a', eye: '#e0202e', desc: 'Sát thủ đến không tiếng, đi không dấu.', human: { weapon: 'kiem', mask: true } },
  { id: 'bo_cap', name: 'Huyết Phong Vương', lv: 9, place: 'Sa Mạc Hoàng Sa', shape: 'bo', body: '#b8302a', accent: '#5a1a1a', eye: '#ffd36b', desc: 'Ong chúa khổng lồ, kim chích chứa kịch độc.' },
  { id: 'ho_yeu', name: 'Cửu Vĩ Hồ Yêu', lv: 11, place: 'Thanh Khâu', shape: 'thu', body: '#ff9a4a', accent: '#fff4e0', eye: '#9a3ad0', desc: 'Hồ ly mê hoặc lòng người.' },
  { id: 'thiet_chuong', name: 'Thiết Chưởng Bang Chủ', lv: 12, place: 'Thiết Chưởng Bang', shape: 'vo_lam', body: '#7a5a2a', accent: '#3a2a1a', eye: '#1a1a1a', desc: 'Một chưởng đánh vỡ tảng đá ngàn cân.', human: { weapon: 'quyen' } },
  { id: 'cuong_thi', name: 'Thiết Giáp Cương Thi', lv: 13, place: 'Nghĩa Trang Cổ', shape: 'nguoi', body: '#6a8a7a', accent: '#2a3a4a', eye: '#9ff0c8', desc: 'Xác chết ngàn năm, đao kiếm khó chém.' },
  { id: 'hac_hung', name: 'Hắc Hùng Tinh', lv: 15, place: 'Hắc Phong Sơn', shape: 'thu', body: '#2a2228', accent: '#7a5a3a', eye: '#ffd36b', desc: 'Gấu đen tu luyện ngàn năm, sức mạnh vô song.' },
  { id: 'doc_vuong', name: 'Độc Thủ Dược Vương', lv: 16, place: 'Vạn Độc Cốc', shape: 'vo_lam', body: '#3a6a3a', accent: '#9a3ad0', eye: '#9ff0c8', desc: 'Phẩy quạt là độc bay mười dặm.', human: { weapon: 'quat', hat: true } },
  { id: 'ngan_giac', name: 'Ngân Giác Mãng', lv: 17, place: 'Vạn Xà Cốc', shape: 'ran', body: '#9aa6c0', accent: '#e6eaf6', eye: '#e0202e', desc: 'Mãng xà có sừng bạc, sắp hóa giao.' },
  { id: 'dai_bang', name: 'Kim Sí Đại Bằng', lv: 19, place: 'Đỉnh Vân Tiêu', shape: 'chim', body: '#e0a030', accent: '#ffe27a', eye: '#e0202e', desc: 'Chim thần cánh vàng, một cái vỗ cánh chín vạn dặm.' },
  { id: 'cuong_dao', name: 'Cuồng Đao Khách', lv: 20, place: 'Đoạn Hồn Nhai', shape: 'vo_lam', body: '#8a1a24', accent: '#1a1a1a', eye: '#ffd36b', desc: 'Đao chưa ra khỏi vỏ đã có người chết.', human: { weapon: 'dao', hat: true } },
  { id: 'huyet_ma', name: 'Huyết Ma', lv: 21, place: 'Huyết Hải', shape: 'nguoi', body: '#7a0a1e', accent: '#1e1a24', eye: '#ff2a3a', desc: 'Ma đầu sinh ra từ biển máu.' },
  { id: 'bang_giao', name: 'Băng Giao', lv: 23, place: 'Bắc Hải Băng Nguyên', shape: 'rong', body: '#7fc8ff', accent: '#eaf6ff', eye: '#2a3a6a', desc: 'Giao long băng giá, hơi thở đóng băng vạn vật.' },
  { id: 'kiem_si', name: 'Kiếm Si Vô Danh', lv: 24, place: 'Kiếm Trủng', shape: 'vo_lam', body: '#e6e6ee', accent: '#3d6fb0', eye: '#1a1a1a', desc: 'Cả đời chỉ luyện một kiếm. Một kiếm ấy chưa từng thua.', human: { weapon: 'kiem', hat: true } },
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

// ---------- Quái trưởng thành ----------
/** Mỗi lần bị giết, cả loài quái đó mạnh lên (nhanh hơn bạn lên cấp). Lâu không bị săn thì hồi lại. */
export const GROW_PER_KILL = 0.4;
export const MAX_GROWTH = 12;

export function growth(c: Character, m: Monster): number {
  return Math.floor(c.monLv?.[m.id] ?? 0);
}

export function effLv(c: Character, m: Monster): number {
  return m.lv + growth(c, m);
}

/** Bậc tiến hóa theo cấp tăng thêm: 0 thường, 1 tinh anh, 2 vương, 3 thánh */
export function tierOf(c: Character, m: Monster): number {
  const g = growth(c, m);
  return g >= 10 ? 3 : g >= 6 ? 2 : g >= 3 ? 1 : 0;
}

const TIER_YEU = ['', 'Tinh Anh ', 'Yêu Vương ', 'Yêu Thánh '];
const TIER_NHAN = ['', 'Cao Thủ ', 'Tông Sư ', 'Đại Tông Sư '];
export function monsterName(c: Character, m: Monster): string {
  const t = tierOf(c, m);
  if (!t || m.boss) return m.name;
  return (m.human ? TIER_NHAN : TIER_YEU)[t] + m.name;
}

export function growMonster(c: Character, m: Monster): boolean {
  if (m.boss) return false;
  c.monLv = c.monLv ?? {};
  const before = tierOf(c, m);
  const beforeLv = growth(c, m);
  c.monLv[m.id] = Math.min(MAX_GROWTH, (c.monLv[m.id] ?? 0) + GROW_PER_KILL);
  return tierOf(c, m) !== before || growth(c, m) !== beforeLv;
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
  if (c.gifts?.includes('g_than_luc')) atk *= 1.25;
  if (c.gifts?.includes('g_kiem_cot')) atk *= 1.1;
  if (c.mount === 'rong') (atk *= 1.2), (hp *= 1.2);
  // trang bị
  const g = gearFx(c.equipped);
  atk *= 1 + g.atk / 100;
  def *= 1 + g.def / 100;
  hp *= 1 + g.hp / 100;
  // tuổi già sức yếu
  if (c.age / c.lifespan > 0.85) (atk *= 0.85), (hp *= 0.85);
  return { hp: Math.round(hp), atk: Math.round(atk), def: Math.round(def) };
}

export function monsterStats(m: Monster, lv: number = m.lv): Fighter {
  if (m.boss) return { hp: 9e15, atk: 9e12, def: 9e12 };
  const s = Math.pow(GROW, lv);
  return { hp: Math.round(115 * s), atk: Math.round(13.8 * s), def: Math.round(4 * s) };
}

export type Danger = 'de' | 'vua' | 'nguy' | 'tu';

export function dangerOf(c: Character, m: Monster): Danger {
  if (m.boss) return 'tu';
  const d = effLv(c, m) - combatLevel(c);
  if (d <= -3) return 'de';
  if (d <= 0) return 'vua';
  if (d <= 2) return 'nguy';
  return 'tu';
}

export const DANGER_TEXT: Record<Danger, string> = { de: 'Dễ', vua: 'Vừa sức', nguy: 'Nguy hiểm', tu: 'Tử địa' };

/** Sát thương một đòn */
export function hit(atk: number, def: number, rnd: () => number, critRate = 0.15): { dmg: number; crit: boolean } {
  if (rnd() < 0.12) return { dmg: 0, crit: false }; // né được
  const crit = rnd() < critRate;
  const raw = atk * (0.7 + rnd() * 0.6) * (crit ? 2 : 1);
  return { dmg: Math.max(1, Math.round(raw - def * 0.5)), crit };
}

/** Ước tính tu vi nhận được khi thắng (để hiện ở bảng chọn quái) */
export function killExp(c: Character, m: Monster): number {
  if (m.boss) return 0;
  const d = effLv(c, m) - combatLevel(c);
  // mỗi con quái vừa sức cho khoảng 1/3 năm tu luyện, một năm trảm 4-6 con nên nhanh gấp 2-3 lần ngồi thiền
  const yearly = ([6, 30, 30, 34, 38, 42, 46, 50][c.realm] ?? 50) * (0.6 + c.stats.ngoTinh / 100);
  const base = Math.max((REALMS[c.realm]?.need ?? 60) * 0.03, yearly * 0.35);
  const factor = d <= -4 ? 0.15 : clamp(1 + 0.35 * d, 0.3, 2.4);
  // quái tiến hóa cho nhiều tu vi hơn
  const tierBonus = 1 + tierOf(c, m) * 0.25;
  return Math.max(1, Math.round(base * factor * tierBonus * c.linhCanMul * (1 + gearFx(c.equipped).exp / 100)));
}

export function killReward(c: Character, m: Monster, ctx: EffectCtx, lootChance = 0.12): string[] {
  const notes: string[] = [];
  addCult(c, killExp(c, m));
  money(c, Math.round((2 + m.lv * 3) * (0.7 + ctx.rnd() * 0.6)));
  c.kills = c.kills ?? {};
  const n = (c.kills[m.id] = (c.kills[m.id] ?? 0) + 1);
  if (n === 1) {
    // lần đầu trảm: thưởng lớn
    const bonus = killExp(c, m) * 2;
    addCult(c, bonus);
    notes.push(`Lần đầu hạ được ${m.name} ở ${m.place}. Lĩnh ngộ được cách đánh của nó (+${bonus} tu vi).`);
  }
  if (n === 10 || n === 50) {
    const bonus = killExp(c, m) * (n === 10 ? 5 : 12);
    addCult(c, bonus);
    money(c, m.lv * (n === 10 ? 20 : 60));
    ctx.fx('layer', `Trảm ${n}`);
    notes.push(`Đã trảm ${n} ${m.name}. Chiến kỹ tinh thông hơn (+${bonus} tu vi).`);
  }
  // rơi đồ độc quyền của loài quái
  const drops = ITEMS.filter((i) => i.from?.includes(m.id));
  if (drops.length) {
    const g = gearFx(c.equipped);
    const p = (0.05 + (c.stats.khiVan - 50) / 2500) * (1 + tierOf(c, m) * 0.5) * (1 + g.drop / 100);
    if (ctx.rnd() < p) {
      const it = drops[Math.floor(ctx.rnd() * drops.length)];
      if (c.inventory.includes(it.id)) {
        const sell = 60 + m.lv * 25;
        money(c, sell);
        notes.push(`${m.name} rơi ra thêm một ${it.name}. Bạn đã có rồi nên bán được ${sell} linh thạch.`);
      } else {
        giveItem(c, it.id, false);
        ctx.fx('buy', it.name);
        notes.push(`${m.name} rơi ra ${it.name}! (${fxText(it.fx)}) Mở Túi đồ để mặc.`);
      }
    }
  }
  if (ctx.rnd() < lootChance) {
    const l = lootDrop(c, m, ctx);
    if (l) notes.push(l);
  }
  const tierBefore = tierOf(c, m);
  if (growMonster(c, m)) {
    const t = tierOf(c, m);
    if (t > tierBefore) {
      notes.push(`Bị săn quá nhiều, loài ${m.name} tiến hóa thành ${monsterName(c, m)} (Lv${effLv(c, m)})! Chúng mạnh lên nhanh hơn bạn.`);
      ctx.fx('evil', monsterName(c, m));
    }
  }
  if (m.human && (m.id === 'son_tac' || m.id === 'thich_khach' || m.id === 'doc_vuong')) c.daoTam = Math.min(100, c.daoTam + 1);
  if (n === 100) notes.push(`Đã trảm 100 con ${m.name}. Giang hồ gọi bạn là khắc tinh của chúng.`);
  const r = ctx.rnd();
  if (r < 0.02) {
    addCult(c, killExp(c, m) * 6);
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

const RARE_NAME = ['Phàm', 'Tốt', 'Hiếm', 'Cực phẩm'];
const RARE_SELL = [15, 60, 220, 800];

/**
 * Chiến lợi phẩm ngẫu nhiên khi hạ quái: phần lớn là đồ lởm, thỉnh thoảng ra đồ xịn.
 * Tỉ lệ độ hiếm: phàm 60%, tốt 30%, hiếm 8%, cực phẩm 2% (khí vận, đồ tăng rơi đồ, quái tiến hóa nâng tỉ lệ đồ tốt).
 * Đồ hợp cảnh giới hiện tại (lệch xuống tối đa 2 cảnh giới). Trùng đồ đã có thì bán lấy linh thạch.
 */
export function lootDrop(c: Character, m: Monster, ctx: EffectCtx): string | null {
  const g = gearFx(c.equipped);
  const luck = (1 + Math.max(0, c.stats.khiVan - 50) / 100) * (1 + g.drop / 100) * (1 + tierOf(c, m) * 0.3);
  const r = ctx.rnd();
  const rare = r < 0.02 * luck ? 3 : r < 0.1 * luck ? 2 : r < 0.4 * luck ? 1 : 0;
  const lo = Math.max(0, c.realm - 2);
  let pool = ITEMS.filter((i) => i.src !== 'event' && (i.rare ?? 0) === rare && i.minRealm <= c.realm && i.minRealm >= lo);
  if (!pool.length) pool = ITEMS.filter((i) => i.src !== 'event' && (i.rare ?? 0) === rare && i.minRealm <= c.realm);
  if (!pool.length) return null;
  const fresh = pool.filter((i) => !c.inventory.includes(i.id));
  // 80% ưu tiên món chưa có
  const src = fresh.length && ctx.rnd() < 0.8 ? fresh : pool;
  const it = src[Math.floor(ctx.rnd() * src.length)];
  const tag = `[${RARE_NAME[rare]}]`;
  if (c.inventory.includes(it.id)) {
    const sell = Math.round(RARE_SELL[rare] * (1 + c.realm * 0.5));
    money(c, sell);
    return `${m.name} rơi ra ${tag} ${it.name}, bạn đã có rồi nên đem bán được ${sell} linh thạch.`;
  }
  giveItem(c, it.id, false);
  if (rare >= 3) ctx.fx('layer', `Cực phẩm: ${it.name}`);
  else ctx.fx('buy', it.name);
  if (rare === 0) return `Lục được trên xác ${m.name} một ${it.name} cũ kỹ ${tag}. (${fxText(it.fx)})`;
  return `${m.name} rơi ra ${tag} ${it.name}${rare >= 2 ? '!' : '.'} (${fxText(it.fx)}) Mở Túi đồ để mặc.`;
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
  const d = effLv(c, m) - combatLevel(c);
  return clamp(0.85 - Math.max(0, d) * 0.12 + gearFx(c.equipped).flee / 100, 0.15, 0.95);
}

/** Chưởng pháp: tay không hoặc vận khí xuất chưởng, tên theo con đường tu luyện */
const CHUONG: Record<string, string[]> = {
  _: ['Thiết Sa Chưởng', 'Bát Quái Chưởng', 'Miên Chưởng', 'Phách Không Chưởng', 'Hàng Long Chưởng', 'Thái Cực Chưởng'],
  kiem: ['Kiếm Khí Chưởng', 'Phách Không Chưởng', 'Lục Mạch Chỉ'],
  dan: ['Liệt Hỏa Chưởng', 'Đan Hỏa Chưởng', 'Thiết Sa Chưởng'],
  tran: ['Bát Quái Chưởng', 'Cửu Cung Chưởng', 'Thái Cực Chưởng'],
  phat: ['Như Lai Thần Chưởng', 'Đại Lực Kim Cương Chưởng', 'Bàn Nhược Chưởng'],
  ma: ['Huyền Minh Thần Chưởng', 'Hóa Cốt Miên Chưởng', 'Huyết Ảnh Chưởng', 'Hấp Tinh Đại Pháp'],
  yeu: ['Yêu Lang Trảo', 'Hồ Vĩ Chưởng', 'Vạn Yêu Chưởng'],
};
/** Lượt này có xuất chưởng không: tay không thì luôn dùng chưởng, có vũ khí thì thỉnh thoảng (từ Luyện Khí) */
export function chuongOf(c: Character, rnd: () => number): string | null {
  const bare = !c.equipped.vu_khi;
  if (!bare && (c.realm < 1 || rnd() > 0.35)) return null;
  const list = [...(CHUONG[c.path ?? ''] ?? []), ...CHUONG._];
  return list[Math.floor(rnd() * list.length)];
}
