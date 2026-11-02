import type { Character, EffectCtx, Element, PathId } from './types';
import type { Fighter } from './combat';
import { tr } from '../i18n';
import { REALMS } from './data';

/**
 * 4.2.0 Công pháp: mỗi đạo một bộ tâm pháp (bị động), chiêu thức (có hồi chiêu) và tuyệt kỹ (ra khi thanh đầy).
 * Mọi trận ở màn chơi chính (trừ yêu, chặn đường, người gặp trên giang hồ, bóng kiếp trước) đánh theo công pháp.
 * Thiết kế: docs/research/cong-phap-theo-dao-va-rank-linh-thu.md
 */

export type CpKind = 'tam' | 'chieu' | 'tuyet';
/** Hiệu ứng hình: lib vẽ ở components/CpFx.tsx */
export type CpFx =
  | 'thuong' | 'quyen' | 'chuong_cat' | 'liet' | 'kimxa' | 'taiji' | 'vankiem'
  | 'danbao' | 'doc' | 'hoi' | 'lo' | 'kimquang' | 'loi' | 'khon' | 'tinhdau'
  | 'chuong' | 'chuong_vang' | 'hong' | 'nhulai' | 'huyettrao' | 'thonphe' | 'cuongma' | 'huyette'
  | 'cuuvi' | 'vuot' | 'hoahinh' | 'chanthan';

export interface CpEff {
  mul?: number; // nhân sát thương mỗi đòn
  hits?: number; // số đòn liên tiếp
  pierce?: boolean; // bỏ qua thủ
  burn?: [number, number]; // [số hiệp, % công mỗi hiệp]
  poison?: number; // cộng tầng độc (tối đa 5, mỗi tầng 4% công mỗi hiệp)
  leech?: number; // hút máu theo % sát thương
  stun?: number; // tỉ lệ choáng (đối thủ mất lượt kế)
  shield?: number; // chặn trọn số đòn kế
  reflect?: [number, number]; // [số hiệp, % phản đòn]
  rage?: [number, number, number]; // [số hiệp, nhân công, % máu tự đốt]
  evade?: [number, number]; // [số hiệp, % đối thủ đánh trượt]
  heal?: number; // hồi % máu tối đa (chỉ dùng khi máu dưới 40%)
}
export interface CpTam {
  cult?: number; // % tu luyện
  atk?: number; // % công
  def?: number; // % thủ
  hp?: number; // % máu
  regen?: number; // % máu hồi mỗi hiệp
}
export interface CpDef {
  id: string;
  path: PathId | 'chung';
  kind: CpKind;
  pham: 0 | 1 | 2 | 3; // Hoàng, Huyền, Địa, Thiên
  name: string;
  main: string; // mô tả chính
  fx: CpFx;
  cd?: number; // hồi chiêu (số lượt của mình)
  eff?: CpEff;
  tam?: CpTam;
}

const C = (d: CpDef) => d;
export const CP: CpDef[] = [
  // ---- chung: ai cũng có từ lúc biết đánh nhau ----
  C({ id: 'dan_khi', path: 'chung', kind: 'tam', pham: 0, name: tr('Dẫn Khí Quyết', 'Qi Guiding Art'), main: tr('Tu luyện +5%', 'Cultivation +5%'), fx: 'thuong', tam: { cult: 5 } }),
  C({ id: 'truong_quyen', path: 'chung', kind: 'chieu', pham: 0, name: tr('Thái Tổ Trường Quyền', 'Grand Ancestor Long Fist'), main: tr('Ba quyền liên hoàn', 'Three chained punches'), fx: 'quyen', cd: 3, eff: { hits: 3, mul: 0.55 } }),
  C({ id: 'thiet_sa', path: 'chung', kind: 'chieu', pham: 0, name: tr('Thiết Sa Chưởng', 'Iron Sand Palm'), main: tr('Chưởng nặng, 20% choáng', 'Heavy palm, 20% stun'), fx: 'chuong_cat', cd: 4, eff: { mul: 1.4, stun: 0.2 } }),
  // ---- Kiếm tu: chém liên hoàn, đòn trúng tích kiếm ý ----
  C({ id: 'thanh_lien', path: 'kiem', kind: 'tam', pham: 1, name: tr('Thanh Liên Kiếm Tâm Quyết', 'Azure Lotus Sword Heart Art'), main: tr('Tu luyện +12%, công +6%', 'Cultivation +12%, attack +6%'), fx: 'thuong', tam: { cult: 12, atk: 6 } }),
  C({ id: 'liet_hoa', path: 'kiem', kind: 'chieu', pham: 1, name: tr('Liệt Hỏa Kiếm Quyết', 'Blazing Fire Sword Art'), main: tr('Kiếm khí lửa, thiêu đốt 2 hiệp', 'Fire sword qi, burns for 2 rounds'), fx: 'liet', cd: 3, eff: { mul: 1.45, burn: [2, 0.25] } }),
  C({ id: 'kim_xa', path: 'kiem', kind: 'chieu', pham: 0, name: tr('Kim Xà Kiếm Pháp', 'Golden Serpent Sword Art'), main: tr('Kiếm quang uốn như rắn, hút 30% máu', 'Serpentine sword light, 30% lifesteal'), fx: 'kimxa', cd: 3, eff: { mul: 1.35, leech: 0.3 } }),
  C({ id: 'thai_cuc_kiem', path: 'kiem', kind: 'chieu', pham: 2, name: tr('Thái Cực Kiếm', 'Taiji Sword'), main: tr('Phản 30% sát thương 2 hiệp', 'Reflects 30% damage for 2 rounds'), fx: 'taiji', cd: 4, eff: { mul: 1.2, reflect: [2, 0.3] } }),
  C({ id: 'van_kiem', path: 'kiem', kind: 'tuyet', pham: 3, name: tr('Vạn Kiếm Quy Tông', 'Ten Thousand Swords Return'), main: tr('Năm luồng phi kiếm, không thể né', 'Five flying swords, unblockable'), fx: 'vankiem', eff: { hits: 5, mul: 0.75, pierce: true } }),
  // ---- Đan tu: ném đan, độc cộng dồn, tự hồi ----
  C({ id: 'thanh_moc', path: 'dan', kind: 'tam', pham: 1, name: tr('Thanh Mộc Trường Sinh Quyết', 'Verdant Longevity Art'), main: tr('Mỗi hiệp hồi 3% máu, tu luyện +8%', 'Restores 3% HP per round, cultivation +8%'), fx: 'thuong', tam: { regen: 3, cult: 8 } }),
  C({ id: 'dan_bao', path: 'dan', kind: 'chieu', pham: 1, name: tr('Liệt Diễm Đan Bạo', 'Blazing Pill Burst'), main: tr('Ném hỏa đan nổ, 30% choáng', 'Exploding fire pill, 30% stun'), fx: 'danbao', cd: 3, eff: { mul: 1.4, stun: 0.3 } }),
  C({ id: 'van_doc', path: 'dan', kind: 'chieu', pham: 2, name: tr('Vạn Độc Vụ', 'Myriad Poison Mist'), main: tr('Cộng 2 tầng độc (tối đa 5)', 'Adds 2 poison stacks (max 5)'), fx: 'doc', cd: 2, eff: { mul: 0.9, poison: 2 } }),
  C({ id: 'hoi_xuan', path: 'dan', kind: 'chieu', pham: 0, name: tr('Hồi Xuân Đan Thuật', 'Spring Revival Pill Art'), main: tr('Máu dưới 40% thì hồi 22% máu', 'Below 40% HP, restores 22% HP'), fx: 'hoi', cd: 6, eff: { heal: 0.22, mul: 0.6 } }),
  C({ id: 'luyen_thien_lo', path: 'dan', kind: 'tuyet', pham: 3, name: tr('Cửu Chuyển Luyện Thiên Lô', 'Nine-Turn Heaven Furnace'), main: tr('Lò đan nuốt đối thủ: lửa và độc', 'The furnace swallows the foe: fire and poison'), fx: 'lo', eff: { mul: 2.4, burn: [3, 0.35], poison: 3 } }),
  // ---- Trận tu: dựng trận, khiên, sét, khốn ----
  C({ id: 'chu_thien', path: 'tran', kind: 'tam', pham: 2, name: tr('Chu Thiên Tinh Đấu Quyết', 'Celestial Star Art'), main: tr('Thủ +12%, tu luyện +8%', 'Defense +12%, cultivation +8%'), fx: 'thuong', tam: { def: 12, cult: 8 } }),
  C({ id: 'kim_quang', path: 'tran', kind: 'chieu', pham: 1, name: tr('Kim Quang Hộ Trận', 'Golden Light Ward'), main: tr('Khiên vàng chặn trọn 2 đòn', 'A golden shield blocks 2 hits'), fx: 'kimquang', cd: 5, eff: { mul: 0.8, shield: 2 } }),
  C({ id: 'ngu_loi', path: 'tran', kind: 'chieu', pham: 1, name: tr('Ngũ Lôi Phù', 'Five Thunder Talisman'), main: tr('Ba đạo sét, xuyên giáp', 'Three thunderbolts, armor-piercing'), fx: 'loi', cd: 3, eff: { hits: 3, mul: 0.55, pierce: true } }),
  C({ id: 'me_tung', path: 'tran', kind: 'chieu', pham: 2, name: tr('Mê Tung Khốn Trận', 'Bewildering Trap Array'), main: tr('60% đối thủ lạc trận, mất lượt', '60% chance the foe is trapped and loses a turn'), fx: 'khon', cd: 4, eff: { mul: 0.8, stun: 0.6 } }),
  C({ id: 'tinh_dau_dai_tran', path: 'tran', kind: 'tuyet', pham: 3, name: tr('Chu Thiên Tinh Đấu Đại Trận', 'Grand Celestial Star Array'), main: tr('Bảy sao giáng xuống, choáng', 'Seven stars fall, stunning'), fx: 'tinhdau', eff: { hits: 7, mul: 0.45, stun: 0.6 } }),
  // ---- Phật tu: chịu đòn rồi trả đòn ----
  C({ id: 'kim_cang_the', path: 'phat', kind: 'tam', pham: 2, name: tr('Kim Cang Bất Hoại Thể', 'Indestructible Vajra Body'), main: tr('Thủ +15%, máu +10%', 'Defense +15%, HP +10%'), fx: 'thuong', tam: { def: 15, hp: 10 } }),
  C({ id: 'kim_cang_chuong', path: 'phat', kind: 'chieu', pham: 1, name: tr('Đại Lực Kim Cang Chưởng', 'Great Vajra Palm'), main: tr('Chưởng vàng xuyên giáp', 'Armor-piercing golden palm'), fx: 'chuong', cd: 3, eff: { mul: 1.5, pierce: true } }),
  C({ id: 'kim_chung', path: 'phat', kind: 'chieu', pham: 1, name: tr('Kim Chung Tráo', 'Golden Bell Shield'), main: tr('Chuông vàng chặn 1 đòn, phản 50%', 'A golden bell blocks a hit and reflects 50%'), fx: 'chuong_vang', cd: 6, eff: { mul: 0.6, shield: 1, reflect: [2, 0.5] } }),
  C({ id: 'su_tu_hong', path: 'phat', kind: 'chieu', pham: 0, name: tr('Sư Tử Hống', 'Lion’s Roar'), main: tr('Tiếng gầm, 70% choáng', 'A roar, 70% stun'), fx: 'hong', cd: 4, eff: { mul: 0.9, stun: 0.7 } }),
  C({ id: 'nhu_lai', path: 'phat', kind: 'tuyet', pham: 3, name: tr('Như Lai Thần Chưởng', 'Buddha’s Divine Palm'), main: tr('Bàn tay vàng che trời, chắc chắn choáng', 'A golden palm blots out the sky, sure stun'), fx: 'nhulai', eff: { mul: 2.8, pierce: true, stun: 1 } }),
  // ---- Ma tu: đốt máu lấy sức, hút máu bù ----
  C({ id: 'huyet_hai', path: 'ma', kind: 'tam', pham: 2, name: tr('Huyết Hải Ma Công', 'Sea of Blood Demonic Art'), main: tr('Tu luyện +20%, công +8%', 'Cultivation +20%, attack +8%'), fx: 'thuong', tam: { cult: 20, atk: 8 } }),
  C({ id: 'huyet_anh_trao', path: 'ma', kind: 'chieu', pham: 1, name: tr('Huyết Ảnh Trảo', 'Blood Shadow Claw'), main: tr('Hút 30% sát thương thành máu', 'Converts 30% of damage into HP'), fx: 'huyettrao', cd: 2, eff: { mul: 1.25, leech: 0.3 } }),
  C({ id: 'thon_phe', path: 'ma', kind: 'chieu', pham: 3, name: tr('Thôn Phệ Ma Công', 'Devouring Demonic Art'), main: tr('Đòn nặng, hút 50% máu', 'Heavy strike, 50% lifesteal'), fx: 'thonphe', cd: 5, eff: { mul: 1.6, leech: 0.5 } }),
  C({ id: 'cuong_ma', path: 'ma', kind: 'chieu', pham: 1, name: tr('Cuồng Ma Hóa', 'Demonic Frenzy'), main: tr('Đốt 15% máu, công x1,6 trong 3 hiệp', 'Burn 15% HP, attack x1.6 for 3 rounds'), fx: 'cuongma', cd: 6, eff: { mul: 1, rage: [3, 1.6, 0.15] } }),
  C({ id: 'huyet_te', path: 'ma', kind: 'tuyet', pham: 3, name: tr('Huyết Tế Thiên Ma', 'Blood Sacrifice Heaven Demon'), main: tr('Đòn máu, hút nửa sát thương', 'A blood strike, drains half the damage'), fx: 'huyette', eff: { mul: 2.8, leech: 0.5 } }),
  // ---- Yêu tu: huyết mạch, hóa hình ----
  C({ id: 'yeu_than', path: 'yeu', kind: 'tam', pham: 1, name: tr('Yêu Thần Luyện Thể', 'Yao God Body Tempering'), main: tr('Máu +20%, mỗi hiệp hồi 2% máu', 'HP +20%, restores 2% HP per round'), fx: 'thuong', tam: { hp: 20, regen: 2 } }),
  C({ id: 'thien_ho', path: 'yeu', kind: 'chieu', pham: 2, name: tr('Thiên Hồ Mị Thuật', 'Sky Fox Charm'), main: tr('Đối thủ đánh trượt 40% trong 2 hiệp', 'Foe misses 40% for 2 rounds'), fx: 'cuuvi', cd: 4, eff: { mul: 0.9, evade: [2, 0.4] } }),
  C({ id: 'yeu_trao', path: 'yeu', kind: 'chieu', pham: 1, name: tr('Yêu Trảo Liệt Không', 'Yao Claw Rends the Void'), main: tr('Ba vết vuốt liên tiếp', 'Three slashing claws'), fx: 'vuot', cd: 2, eff: { hits: 3, mul: 0.5 } }),
  C({ id: 'hoa_hinh', path: 'yeu', kind: 'chieu', pham: 2, name: tr('Hóa Hình Thuật', 'Shapeshift'), main: tr('Hóa bản thể 3 hiệp, công x1,8', 'True form for 3 rounds, attack x1.8'), fx: 'hoahinh', cd: 7, eff: { mul: 1, rage: [3, 1.8, 0] } }),
  C({ id: 'chan_than', path: 'yeu', kind: 'tuyet', pham: 3, name: tr('Hiện Chân Thân', 'Reveal True Body'), main: tr('Chân thân khổng lồ giáng đòn', 'A colossal true body strikes'), fx: 'chanthan', eff: { mul: 3 } }),
];
export const cpOf = (id: string) => CP.find((x) => x.id === id);
export const cpOfPath = (p: PathId | 'chung') => CP.filter((x) => x.path === p);
export const PHAM_NAME = [tr('Hoàng', 'Yellow'), tr('Huyền', 'Mystic'), tr('Địa', 'Earth'), tr('Thiên', 'Heaven')];

/** Thanh riêng của mỗi đạo */
export const GAUGE_NAME: Record<string, string> = {
  kiem: tr('Kiếm ý', 'Sword intent'),
  dan: tr('Đan hỏa', 'Pill fire'),
  tran: tr('Trận nhãn', 'Array eye'),
  phat: tr('Định lực', 'Samadhi'),
  ma: tr('Sát khí', 'Killing intent'),
  yeu: tr('Yêu lực', 'Yao force'),
  chung: tr('Khí thế', 'Momentum'),
};
export const PATH_IDEA: Record<string, string> = {
  kiem: tr('Đánh nhanh, chém liên hoàn. Mỗi đòn trúng tích kiếm ý, đầy thì ra tuyệt kỹ.', 'Fast chained slashes. Every hit builds sword intent; when full, the ultimate fires.'),
  dan: tr('Ném đan, rải độc, tự hồi máu. Độc cộng dồn tầng, đánh lâu mới mạnh.', 'Throw pills, spread poison, heal yourself. Poison stacks, so long fights favor you.'),
  tran: tr('Bày trận trước, đánh sau. Mỗi chiêu dựng một cột trận, đủ 3 cột thì đại trận tự mở.', 'Set the array first, then strike. Each technique raises a pillar; three pillars open the grand array.'),
  phat: tr('Chịu đòn rồi trả đòn. Mỗi lần bị đánh tích định lực, đầy thì phản một chưởng lớn.', 'Take the blow, then return it. Every hit taken builds samadhi; when full, a great palm answers.'),
  ma: tr('Đốt máu mình lấy sức mạnh, hút máu quái bù lại. Máu càng thấp sát khí càng lên nhanh.', 'Burn your own blood for power and drain the foe to recover. The lower your HP, the faster killing intent rises.'),
  yeu: tr('Dựa vào huyết mạch và thể chất. Đầy yêu lực thì hiện chân thân.', 'Rely on bloodline and body. When yao force is full, your true body appears.'),
  chung: tr('Chưa chọn con đường: chỉ có quyền cước cơ bản.', 'No path yet: only basic fists.'),
};

// ---------- Công pháp của nhân vật ----------
export interface CpOwn {
  id: string;
  tang: number; // 1-9
  exp: number; // 0-100 thục luyện
  bien?: Bien | null; // biến chiêu chọn ở tầng 6 (chỉ chiêu thức)
}
/** Ngộ chiêu ở tầng 6: Cương (mạnh, chậm) hoặc Nhu (nhanh, hiệu ứng đậm). Chọn rồi không đổi trong kiếp này. */
export type Bien = 'cuong' | 'nhu';
export const BIEN_TANG = 6;
export const BIEN_NAME: Record<Bien, string> = { cuong: tr('Cương', 'Hard'), nhu: tr('Nhu', 'Soft') };
export const BIEN_DESC: Record<Bien, string> = {
  cuong: tr('Sát thương x1,3, hồi chiêu chậm thêm 1 lượt', 'Damage x1.3, cooldown +1 turn'),
  nhu: tr('Hồi chiêu nhanh hơn 1 lượt, thiêu/độc/hút máu/choáng/khiên/phản đòn đậm hơn 30%', 'Cooldown -1 turn; burn, poison, lifesteal, stun, shield and reflect 30% stronger'),
};
export function bienDef(d: CpDef, b?: Bien | null): CpDef {
  if (!b || d.kind !== 'chieu') return d;
  const e = { ...(d.eff ?? {}) };
  if (b === 'cuong') return { ...d, cd: (d.cd ?? 3) + 1, eff: { ...e, mul: (e.mul ?? 1) * 1.3 } };
  const up = (x: number) => x * 1.3;
  if (e.burn) e.burn = [e.burn[0], up(e.burn[1])];
  if (e.poison) e.poison += 1;
  if (e.leech) e.leech = up(e.leech);
  if (e.stun) e.stun = up(e.stun);
  if (e.shield) e.shield += 1;
  if (e.reflect) e.reflect = [e.reflect[0], up(e.reflect[1])];
  if (e.evade) e.evade = [e.evade[0], up(e.evade[1])];
  if (e.heal) e.heal = up(e.heal);
  if (e.rage) e.rage = [e.rage[0], e.rage[1], e.rage[2] * 0.7];
  return { ...d, cd: Math.max(1, (d.cd ?? 3) - 1), eff: e };
}
export interface CpState {
  own: CpOwn[];
  eq: string[]; // [tâm pháp, chiêu 1, chiêu 2, chiêu 3]
  tuyet?: string | null; // tuyệt kỹ đã lĩnh ngộ
}
export const SLOT_REALM = [0, 0, 2, 4]; // ô tâm pháp, chiêu 1 mở sẵn; chiêu 2 từ Trúc Cơ; chiêu 3 từ Nguyên Anh
export const slotOpen = (c: Character, i: number) => !!c.cosmos || c.realm >= SLOT_REALM[i];

export function cpState(c: Character): CpState {
  if (!c.cp) c.cp = { own: [], eq: [] };
  return c.cp;
}
export function owned(c: Character, id: string): CpOwn | undefined {
  return c.cp?.own.find((x) => x.id === id);
}
function grant(c: Character, id: string, tang = 1): boolean {
  const s = cpState(c);
  if (s.own.some((x) => x.id === id)) return false;
  s.own.push({ id, tang, exp: 0 });
  return true;
}
/** Tự lắp vào ô trống phù hợp */
function autoEquip(c: Character, id: string) {
  const s = cpState(c);
  const d = cpOf(id);
  if (!d || d.kind === 'tuyet' || s.eq.includes(id)) return;
  if (d.kind === 'tam') {
    const cur = cpOf(s.eq[0] ?? '');
    if (!cur || cur.path === 'chung' || cur.path !== c.path) s.eq[0] = id;
    return;
  }
  for (let i = 1; i <= 3; i++) {
    const cur = cpOf(s.eq[i] ?? '');
    if (!slotOpen(c, i)) continue;
    if (!cur || (cur.path === 'chung' && d.path !== 'chung')) {
      s.eq[i] = id;
      return;
    }
  }
}
export function equip(c: Character, id: string, slot?: number): boolean {
  const s = cpState(c);
  const d = cpOf(id);
  if (!d || !owned(c, id) || d.kind === 'tuyet') return false;
  if (d.kind === 'tam') {
    s.eq[0] = id;
    return true;
  }
  const i = slot ?? [1, 2, 3].find((k) => slotOpen(c, k) && !s.eq[k]) ?? [1, 2, 3].filter((k) => slotOpen(c, k)).pop() ?? 1;
  if (!slotOpen(c, i)) return false;
  for (let k = 1; k <= 3; k++) if (s.eq[k] === id) s.eq[k] = '';
  s.eq[i] = id;
  return true;
}
export function unequip(c: Character, id: string) {
  const s = cpState(c);
  s.eq = s.eq.map((x, i) => (x === id && i > 0 ? '' : x));
}

/** Đồng bộ mỗi năm: ai cũng có quyền cước cơ bản; có đạo thì sư môn truyền tâm pháp và chiêu đầu; lên cảnh giới mở thêm chiêu */
export function cpSync(c: Character, ctx?: EffectCtx | null): void {
  const s = cpState(c);
  if (!s.own.length) {
    grant(c, 'dan_khi');
    grant(c, 'truong_quyen');
    s.eq = ['dan_khi', 'truong_quyen'];
  }
  if (c.realm >= 1 && grant(c, 'thiet_sa')) autoEquip(c, 'thiet_sa');
  const p = c.path;
  if (!p) return;
  const list = cpOfPath(p);
  const tam = list.find((x) => x.kind === 'tam')!;
  const chieu = list.filter((x) => x.kind === 'chieu');
  const say = (t: string) => ctx?.log(t, 'good');
  if (grant(c, tam.id)) {
    autoEquip(c, tam.id);
    say(tr(`Sư môn truyền tâm pháp ${tam.name}.`, `Your lineage passes down the ${tam.name}.`));
  }
  if (grant(c, chieu[0].id)) {
    autoEquip(c, chieu[0].id);
    say(tr(`Học được chiêu ${chieu[0].name}. Mở Công pháp để xem.`, `You learn the ${chieu[0].name}. Open Techniques to view it.`));
  }
  if ((c.realm >= 2 || c.cosmos) && chieu[1] && grant(c, chieu[1].id)) {
    autoEquip(c, chieu[1].id);
    say(tr(`Trúc Cơ thành, ngộ ra chiêu ${chieu[1].name}.`, `With your foundation set, you comprehend the ${chieu[1].name}.`));
  }
  if ((c.realm >= 4 || c.cosmos) && chieu[2] && grant(c, chieu[2].id)) {
    autoEquip(c, chieu[2].id);
    say(tr(`Nguyên Anh hiện hình, lĩnh ngộ ${chieu[2].name}.`, `Your nascent soul takes form; you grasp the ${chieu[2].name}.`));
  }
}

/** Mỗi năm: các bộ đang mang tăng thục luyện; tầng 1-3 tự lên, từ tầng 4 cần tàn quyển (nút Nâng tầng) */
export function cpYear(c: Character, ctx: EffectCtx): void {
  cpSync(c, ctx);
  const s = cpState(c);
  for (const id of s.eq) {
    const o = owned(c, id);
    if (!o || o.tang >= 9) continue;
    o.exp = Math.min(100, o.exp + 9);
    if (o.exp >= 100 && o.tang < 3) {
      o.tang += 1;
      o.exp = 0;
      ctx.log(tr(`${cpOf(id)?.name} lên tầng ${o.tang}.`, `${cpOf(id)?.name} reaches stage ${o.tang}.`), 'good');
    }
  }
  if (s.eq.some((id) => (owned(c, id)?.exp ?? 0) >= 100 && (owned(c, id)?.tang ?? 9) < 9) && !c.cpHint) {
    c.cpHint = true;
    ctx.log(tr('Có công pháp đã đầy thục luyện. Mở Công pháp, dùng tàn quyển để lên tầng.', 'A technique has full mastery. Open Techniques and use a manual fragment to raise its stage.'), 'good');
  }
}
// ---------- Tàn quyển theo từng bộ ----------
/**
 * Mỗi bộ công pháp có tàn quyển riêng (c.tq[id]), không còn một loại dùng cho mọi thứ.
 * Rơi theo nguồn: quái hệ nào ra tàn quyển bộ hệ đó; người cùng đạo ra chiêu của đạo; bóng kiếp trước ra bộ kiếp trước từng luyện.
 * Ép người chơi chọn đường: giá tăng dần theo tầng, chiêu không được vượt tâm pháp quá 2 tầng, chiêu đang mang rơi nhiều hơn.
 * Tránh kẹt vì xui: bộ đang ôm nhiều tàn quyển thì ít rơi thêm; đổi 3 tàn quyển bộ này lấy 1 bộ khác cùng đạo; hiếm hoi có tàn quyển vạn năng.
 */
/** Ngũ hành của từng bộ (quái hệ nào thì rơi tàn quyển bộ hệ đó) */
export const CP_HE: Record<string, Element> = {
  dan_khi: 'tho', truong_quyen: 'tho', thiet_sa: 'kim',
  thanh_lien: 'thuy', liet_hoa: 'hoa', kim_xa: 'kim', thai_cuc_kiem: 'thuy', van_kiem: 'kim',
  thanh_moc: 'moc', dan_bao: 'hoa', van_doc: 'moc', hoi_xuan: 'moc', luyen_thien_lo: 'hoa',
  chu_thien: 'kim', kim_quang: 'kim', ngu_loi: 'moc', me_tung: 'thuy', tinh_dau_dai_tran: 'kim',
  kim_cang_the: 'kim', kim_cang_chuong: 'kim', kim_chung: 'tho', su_tu_hong: 'tho', nhu_lai: 'kim',
  huyet_hai: 'thuy', huyet_anh_trao: 'kim', thon_phe: 'thuy', cuong_ma: 'hoa', huyet_te: 'hoa',
  yeu_than: 'tho', thien_ho: 'hoa', yeu_trao: 'kim', hoa_hinh: 'moc', chan_than: 'hoa',
};
/** Tàn quyển cần để lên tầng kế (theo tầng hiện tại): tầng 1-3 tự lên, sau đó 1,1,2,2,3,3 - một bộ lên tầng 9 tốn 12 */
export const TQ_COST = [0, 0, 0, 1, 1, 2, 2, 3, 3];
export const tqCost = (tang: number) => TQ_COST[tang] ?? 0;
/** Chiêu không được cao hơn tâm pháp quá TAM_GAP tầng: muốn chiêu mạnh phải luyện cả gốc */
export const TAM_GAP = 2;
export const tqOf = (c: Character, id: string) => c.tq?.[id] ?? 0;
export const tamTang = (c: Character) => owned(c, c.cp?.eq[0] ?? '')?.tang ?? 1;
export function capOf(c: Character, id: string): number {
  const d = cpOf(id);
  return !d || d.kind === 'tam' ? 9 : Math.min(9, tamTang(c) + TAM_GAP);
}
/** Lý do chưa nâng được (null là nâng được) */
/** Ngộ đạo hao tu vi: mỗi tàn quyển dùng tốn 2% tu vi cần cho cảnh giới hiện tại (tham công pháp thì chậm đột phá) */
export const TUVI_PER_TQ = 0.02;
export function tuviCost(c: Character, id: string): number {
  const o = owned(c, id);
  return o ? Math.round(tqCost(o.tang) * TUVI_PER_TQ * (REALMS[c.realm]?.need || 60)) : 0;
}
export function upgradeBlock(c: Character, id: string, useVan = false): 'max' | 'exp' | 'cap' | 'tq' | 'tuvi' | 'bien' | null {
  const o = owned(c, id);
  if (!o || o.tang >= 9) return 'max';
  if (o.exp < 100) return 'exp';
  if (o.tang >= capOf(c, id)) return 'cap';
  if (tqOf(c, id) + (useVan ? (c.tqVan ?? 0) : 0) < tqCost(o.tang)) return 'tq';
  if (c.cultivation < tuviCost(c, id)) return 'tuvi';
  if (o.tang === BIEN_TANG - 1 && !o.bien && cpOf(id)?.kind === 'chieu') return 'bien';
  return null;
}
export function canUpgrade(c: Character, id: string): boolean {
  return upgradeBlock(c, id) === null;
}
/** Thiếu tàn quyển riêng thì có thể bù bằng tàn quyển vạn năng (người chơi tự bấm) */
export function vanNeed(c: Character, id: string): number {
  const o = owned(c, id);
  if (!o || upgradeBlock(c, id) !== 'tq' || upgradeBlock(c, id, true) === 'tq') return 0;
  return tqCost(o.tang) - tqOf(c, id);
}
export function upgrade(c: Character, id: string, useVan = false, bien?: Bien): string | null {
  const o = owned(c, id);
  if (!o) return null;
  const blk = upgradeBlock(c, id, useVan);
  if (blk === 'bien' && bien) o.bien = bien;
  else if (blk !== null) return null;
  c.cultivation = Math.max(0, c.cultivation - tuviCost(c, id));
  const cost = tqCost(o.tang);
  const own = Math.min(tqOf(c, id), cost);
  c.tq = { ...(c.tq ?? {}), [id]: tqOf(c, id) - own };
  if (cost - own > 0) c.tqVan = (c.tqVan ?? 0) - (cost - own);
  o.tang += 1;
  o.exp = 0;
  c.cpHint = false;
  const bn = o.tang === BIEN_TANG && o.bien ? tr(` Ngộ ra biến chiêu ${BIEN_NAME[o.bien]}.`, ` You grasp the ${BIEN_NAME[o.bien]} variant.`) : '';
  return tr(`${cpOf(id)?.name} lên tầng ${o.tang}.`, `${cpOf(id)?.name} reaches stage ${o.tang}.`) + bn;
}
/** Đổi 3 tàn quyển bộ này lấy 1 tàn quyển bộ khác cùng đạo (mất nhiều, chỉ để gỡ khi rơi lệch) */
export const SWAP_RATE = 3;
export function canSwap(c: Character, from: string, to: string): boolean {
  const a = cpOf(from);
  const b = cpOf(to);
  return !!a && !!b && from !== to && a.path === b.path && !!owned(c, to) && (owned(c, to)?.tang ?? 9) < 9 && tqOf(c, from) >= SWAP_RATE;
}
export function swapTq(c: Character, from: string, to: string): string | null {
  if (!canSwap(c, from, to)) return null;
  c.tq = { ...(c.tq ?? {}), [from]: tqOf(c, from) - SWAP_RATE, [to]: tqOf(c, to) + 1 };
  return tr(`Chép lại ${SWAP_RATE} tàn quyển ${cpOf(from)?.name} thành 1 tàn quyển ${cpOf(to)?.name}.`, `You rework ${SWAP_RATE} ${cpOf(from)?.name} fragments into 1 ${cpOf(to)?.name} fragment.`);
}

/** Nguồn rơi tàn quyển */
export type TqSrc = { kind: 'quai'; el?: Element; strong?: boolean } | { kind: 'nguoi'; path?: string | null; el?: Element } | { kind: 'bong'; ids: string[] };
const VAN_CHANCE = { quai: 0.04, nguoi: 0.1, bong: 0.08 };
/** Rơi 1 tàn quyển: chọn bộ theo trọng số, trả về dòng nhật ký (null nếu chẳng có bộ nào cần) */
export function dropTq(c: Character, src: TqSrc, rnd: () => number): string | null {
  const strong = src.kind !== 'quai' || !!src.strong;
  if (rnd() < VAN_CHANCE[src.kind]) {
    c.tqVan = (c.tqVan ?? 0) + 1;
    return tr(`Nhặt được một tàn quyển vạn năng, ghép được vào bất kỳ bộ nào (đang có ${c.tqVan}).`, `You find a universal manual fragment that fits any technique (you have ${c.tqVan}).`);
  }
  const s = cpState(c);
  const tu = tuyetOf(c);
  const nine = c.path ? cpOfPath(c.path).filter((x) => x.kind === 'chieu' && (owned(c, x.id)?.tang ?? 0) >= 9).length : 0;
  const pool: { id: string; w: number }[] = [];
  for (const o of s.own) {
    const d = cpOf(o.id);
    if (!d || d.kind === 'tuyet' || o.tang >= 9 || o.tang < 2) continue;
    // đủ tàn quyển cho tới tầng 9 rồi thì thôi rơi bộ này
    if (tqOf(c, o.id) >= TQ_COST.slice(o.tang).reduce((x, y) => x + y, 0)) continue;
    let w = d.kind === 'tam' ? 0.6 : 1;
    if (s.eq.includes(o.id)) w *= 1.5;
    if (d.path !== 'chung' && d.path !== c.path) w *= 0.3;
    if (src.kind === 'quai' && src.el && CP_HE[o.id] === src.el) w *= 3;
    if (src.kind === 'nguoi') {
      if (src.path && d.path === src.path) w *= 3;
      if (src.el && CP_HE[o.id] === src.el) w *= 2;
    }
    if (src.kind === 'bong' && src.ids.includes(o.id)) w *= 4;
    w /= 1 + 0.5 * tqOf(c, o.id); // đang ôm nhiều thì ít rơi thêm
    pool.push({ id: o.id, w });
  }
  // tàn quyển tuyệt kỹ chỉ rơi từ trận khó, khi đã có 2 chiêu viên mãn
  if (tu && strong && nine >= 2 && s.tuyet !== tu.id) pool.push({ id: tu.id, w: 2 / (1 + 0.5 * tqOf(c, tu.id)) });
  const sum = pool.reduce((x, p) => x + p.w, 0);
  if (!sum) return null;
  let r = rnd() * sum;
  const pick = pool.find((p) => (r -= p.w) <= 0) ?? pool[pool.length - 1];
  c.tq = { ...(c.tq ?? {}), [pick.id]: tqOf(c, pick.id) + 1 };
  return tr(`Nhặt được tàn quyển ${cpOf(pick.id)?.name} (đang có ${tqOf(c, pick.id)}).`, `You find a ${cpOf(pick.id)?.name} fragment (you have ${tqOf(c, pick.id)}).`);
}

/** Dùng trong trận thì thục luyện thêm chút */
function practice(c: Character | null, id: string) {
  if (!c) return;
  const o = owned(c, id);
  if (o && o.tang < 9) o.exp = Math.min(100, o.exp + 0.5);
}

/** Dung hợp: 2 chiêu cùng đạo đều tầng 9 thì lĩnh ngộ tuyệt kỹ của đạo, tốn 3 tàn quyển của chính tuyệt kỹ đó, thành 60% */
export const FUSE_COST = 3;
export const FUSE_CHANCE = 0.6;
export function tuyetOf(c: Character): CpDef | undefined {
  return c.path ? cpOfPath(c.path).find((x) => x.kind === 'tuyet') : undefined;
}
export function canFuse(c: Character): boolean {
  const t = tuyetOf(c);
  if (!t || c.cp?.tuyet === t.id) return false;
  const nine = cpOfPath(c.path!).filter((x) => x.kind === 'chieu' && (owned(c, x.id)?.tang ?? 0) >= 9);
  return nine.length >= 2 && tqOf(c, t.id) >= FUSE_COST;
}
export function fuse(c: Character, rnd: () => number): { ok: boolean; text: string } | null {
  if (!canFuse(c)) return null;
  const t = tuyetOf(c)!;
  c.tq = { ...(c.tq ?? {}), [t.id]: tqOf(c, t.id) - FUSE_COST };
  if (rnd() < FUSE_CHANCE) {
    cpState(c).tuyet = t.id;
    grant(c, t.id, 1);
    return { ok: true, text: tr(`Hai luồng chiêu ý hòa làm một. Bạn lĩnh ngộ tuyệt kỹ ${t.name}!`, `Two techniques merge into one. You comprehend the ultimate ${t.name}!`) };
  }
  return { ok: false, text: tr('Chiêu ý va nhau rồi tan. Tàn quyển hóa tro, lần sau thử lại.', 'The techniques clash and scatter. The fragments turn to ash; try again later.') };
}

// ---------- Truyền thừa ----------
/** Cuối kiếp: chọn 1 chiêu tầng 9 để kiếp sau sinh ra đã biết (tầng 1) */
export function heirChoices(c: Character): CpDef[] {
  return (c.cp?.own ?? []).filter((o) => o.tang >= 9).map((o) => cpOf(o.id)!).filter((d) => d && d.kind === 'chieu');
}
export function applyHeir(c: Character, id?: string | null, past?: string[]) {
  if (past?.length) c.cpPast = past.slice(-40);
  if (!id || !cpOf(id)) return;
  cpSync(c, null);
  grant(c, id, 1);
}

// ---------- Chỉ số bị động của tâm pháp ----------
function tamOf(c: Character): CpTam {
  const d = cpOf(c.cp?.eq[0] ?? '');
  const o = d ? owned(c, d.id) : undefined;
  if (!d?.tam || !o) return {};
  const k = 0.7 + 0.05 * o.tang;
  const t = d.tam;
  return { cult: (t.cult ?? 0) * k, atk: (t.atk ?? 0) * k, def: (t.def ?? 0) * k, hp: (t.hp ?? 0) * k, regen: (t.regen ?? 0) * k };
}
export function cpCultMul(c: Character): number {
  return 1 + (tamOf(c).cult ?? 0) / 100;
}
export function cpStats(c: Character, f: Fighter): Fighter {
  const t = tamOf(c);
  return { ...f, atk: f.atk * (1 + (t.atk ?? 0) / 100), def: f.def * (1 + (t.def ?? 0) / 100), hp: f.hp * (1 + (t.hp ?? 0) / 100) };
}

// ======================= Trong trận =======================
/** Lực chiêu theo tầng: tầng 1 = 85%, tầng 3 = 100%, tầng 9 = 145% (đối thủ mất máu nhiều hơn rõ khi luyện lên) */
export const tangMul = (t: number) => 0.85 + 0.075 * (Math.max(1, t) - 1);
export interface Loadout {
  path: string;
  chieu: { d: CpDef; tang: number }[];
  tuyet?: { d: CpDef; tang: number };
  regen: number; // % máu mỗi hiệp
}
export function loadoutOf(c: Character): Loadout {
  cpSync(c, null);
  const s = cpState(c);
  const chieu = s.eq
    .slice(1)
    .map((id, i) => ({ d: cpOf(id), o: owned(c, id), i: i + 1 }))
    .filter((x) => x.d && x.o && slotOpen(c, x.i))
    .map((x) => ({ d: bienDef(x.d!, x.o!.bien), tang: x.o!.tang }));
  const tu = s.tuyet ? cpOf(s.tuyet) : undefined;
  return { path: c.path ?? 'chung', chieu, tuyet: tu ? { d: tu, tang: owned(c, tu.id)?.tang ?? 1 } : undefined, regen: tamOf(c).regen ?? 0 };
}
/** Người gặp trên giang hồ (và bóng kiếp trước) cũng đánh theo công pháp đạo của họ, tầng theo cảnh giới */
export function npcLoadout(f: Pick<Character, 'path' | 'realm' | 'cosmos'>): Loadout {
  const p = f.path ?? 'chung';
  const tang = Math.max(1, Math.min(9, 1 + (f.realm ?? 0) + (f.cosmos ? 3 : 0)));
  const list = p === 'chung' ? cpOfPath('chung') : cpOfPath(p);
  const n = (f.realm ?? 0) >= 4 ? 3 : (f.realm ?? 0) >= 2 ? 2 : 1;
  const chieu = list.filter((x) => x.kind === 'chieu').slice(0, n).map((d) => ({ d, tang }));
  const tuyet = (f.realm ?? 0) >= 6 || f.cosmos ? list.find((x) => x.kind === 'tuyet') : undefined;
  const tam = list.find((x) => x.kind === 'tam')?.tam;
  return { path: p, chieu: chieu.length ? chieu : cpOfPath('chung').filter((x) => x.kind === 'chieu').map((d) => ({ d, tang })), tuyet: tuyet ? { d: tuyet, tang } : undefined, regen: tam?.regen ?? 0 };
}

export interface FightSide {
  cd: Record<string, number>;
  gauge: number;
  burn: { n: number; dmg: number } | null; // đang bị thiêu
  poison: number; // tầng độc đang chịu
  poisonDmg: number;
  shield: number;
  reflect: { n: number; pct: number } | null;
  rage: { n: number; mul: number } | null;
  evade: { n: number; pct: number } | null;
  stunned: boolean; // mất lượt kế
}
export const newSide = (): FightSide => ({ cd: {}, gauge: 0, burn: null, poison: 0, poisonDmg: 0, shield: 0, reflect: null, rage: null, evade: null, stunned: false });

export interface ActResult {
  dmg: number;
  crit: boolean;
  hits: number;
  skill?: string;
  fx: CpFx;
  ult?: boolean;
  heal: number;
  self: number; // máu tự đốt
  dot: number; // sát thương thiêu/độc đầu lượt lên đối thủ
  tags: string[];
}

const GAIN: Record<string, (r: { dmg: number; hits: number; skill: boolean }) => number> = {
  kiem: (r) => (r.dmg > 0 ? 18 * Math.min(3, r.hits) : 0),
  dan: (r) => (r.skill ? 30 : 10),
  tran: (r) => (r.skill ? 34 : 6),
  phat: () => 8,
  ma: () => 10,
  yeu: (r) => (r.dmg > 0 ? 16 : 0),
  chung: (r) => (r.dmg > 0 ? 12 : 0),
};

/**
 * Lượt đánh của một bên. me/foe: chỉ số, hpNow/hpMax: máu bên đánh, opp: trạng thái bên bị đánh.
 * hit(): hàm tính một đòn thường (combat.hit), truyền vào để tránh vòng import.
 */
export function act(
  lo: Loadout,
  me: FightSide,
  opp: FightSide,
  atk: number,
  def: number,
  hpNow: number,
  hpMax: number,
  rnd: () => number,
  crit: number,
  hitFn: (a: number, d: number, r: () => number, crit?: number) => { dmg: number; crit: boolean },
  who: Character | null = null,
): ActResult {
  const tags: string[] = [];
  // thiêu đốt, độc trên người đối thủ: trừ đầu lượt mình
  let dot = 0;
  if (opp.burn) {
    dot += opp.burn.dmg;
    opp.burn.n -= 1;
    if (opp.burn.n <= 0) opp.burn = null;
  }
  if (opp.poison > 0) dot += Math.round(opp.poisonDmg * opp.poison);
  for (const k of Object.keys(me.cd)) me.cd[k] = Math.max(0, me.cd[k] - 1);
  const rageMul = me.rage ? me.rage.mul : 1;
  if (me.rage && --me.rage.n <= 0) me.rage = null;
  // chọn chiêu: thanh đầy thì tuyệt kỹ (không có thì bộc phát chiêu mạnh nhất), không thì chiêu hết hồi đầu tiên
  let use: { d: CpDef; tang: number } | undefined;
  let ult = false;
  if (me.gauge >= 100) {
    me.gauge = 0;
    ult = true;
    use = lo.tuyet ?? [...lo.chieu].sort((a, b) => (b.d.eff?.mul ?? 1) * (b.d.eff?.hits ?? 1) - (a.d.eff?.mul ?? 1) * (a.d.eff?.hits ?? 1))[0];
  } else {
    use = lo.chieu.find((x) => (me.cd[x.d.id] ?? 0) <= 0 && (!x.d.eff?.heal || hpNow < hpMax * 0.4));
    if (use) me.cd[use.d.id] = use.d.cd ?? 3;
  }
  const e = use?.d.eff ?? {};
  const t = use?.tang ?? 1;
  const k = tangMul(t); // tầng càng cao chiêu càng mạnh
  const bursting = ult && !lo.tuyet;
  const mul = (use ? (e.mul ?? 1) * k : 0.92) * rageMul * (bursting ? 1.5 : 1);
  const hits = use ? (e.hits ?? 1) : 1;
  let dmg = 0;
  let anyCrit = false;
  for (let i = 0; i < hits; i++) {
    const h = hitFn(atk * mul, e.pierce ? 0 : def, rnd, crit);
    dmg += h.dmg;
    anyCrit ||= h.crit;
  }
  let heal = 0;
  let self = 0;
  if (use && dmg > 0) {
    if (e.leech) heal += Math.round(dmg * e.leech * (0.85 + 0.03 * t));
    if (e.burn) {
      opp.burn = { n: e.burn[0], dmg: Math.round(atk * e.burn[1] * k) };
      tags.push(tr('Thiêu đốt!', 'Burning!'));
    }
    if (e.poison) {
      opp.poison = Math.min(5, opp.poison + e.poison);
      opp.poisonDmg = Math.max(opp.poisonDmg, Math.round(atk * 0.04 * k));
      tags.push(tr(`Độc x${opp.poison}`, `Poison x${opp.poison}`));
    }
    if (e.stun && rnd() < Math.min(1, e.stun * (0.85 + 0.03 * t))) {
      opp.stunned = true;
      tags.push(tr('Choáng!', 'Stunned!'));
    }
  }
  if (use) {
    if (e.heal) heal += Math.round(hpMax * e.heal * k);
    if (e.shield) {
      me.shield += e.shield;
      tags.push(tr('Khiên!', 'Shield!'));
    }
    if (e.reflect) me.reflect = { n: e.reflect[0], pct: e.reflect[1] * k };
    if (e.evade) me.evade = { n: e.evade[0], pct: e.evade[1] * k };
    if (e.rage) {
      me.rage = { n: e.rage[0], mul: e.rage[1] * k };
      self += Math.round(hpMax * e.rage[2]);
      tags.push(tr('Cuồng hóa!', 'Frenzy!'));
    }
    practice(who, use.d.id);
  }
  if (lo.regen) heal += Math.round((hpMax * lo.regen) / 100);
  // thanh riêng của đạo
  if (!ult) {
    me.gauge = Math.min(100, me.gauge + (GAIN[lo.path] ?? GAIN.chung)({ dmg, hits, skill: !!use }));
    if (lo.path === 'ma') me.gauge = Math.min(100, me.gauge + Math.round((1 - hpNow / hpMax) * 20));
  }
  return { dmg, crit: anyCrit, hits, skill: use ? (bursting ? tr(`Bộc phát: ${use.d.name}`, `Burst: ${use.d.name}`) : use.d.name) : undefined, fx: use ? use.d.fx : lo.path === 'chung' ? 'quyen' : 'thuong', ult, heal, self, dot, tags };
}

/** Bên bị đánh: khiên, né, phản đòn; Phật tu tích định lực khi chịu đòn */
export function takeHit(lo: Loadout, me: FightSide, dmg: number, rnd: () => number): { dmg: number; reflect: number; note?: string } {
  if (dmg <= 0) return { dmg: 0, reflect: 0 };
  if (me.evade) {
    const miss = rnd() < me.evade.pct;
    if (--me.evade.n <= 0) me.evade = null;
    if (miss) return { dmg: 0, reflect: 0, note: tr('Trượt!', 'Miss!') };
  }
  if (me.shield > 0) {
    me.shield -= 1;
    const reflect = me.reflect ? Math.round(dmg * me.reflect.pct) : 0;
    return { dmg: 0, reflect, note: tr('Đỡ được!', 'Blocked!') };
  }
  const reflect = me.reflect ? Math.round(dmg * me.reflect.pct) : 0;
  if (me.reflect && --me.reflect.n <= 0) me.reflect = null;
  if (lo.path === 'phat') me.gauge = Math.min(100, me.gauge + 22);
  return { dmg, reflect };
}

/** Bị choáng thì mất lượt (trả về true và gỡ choáng) */
export function skipTurn(me: FightSide): boolean {
  if (!me.stunned) return false;
  me.stunned = false;
  return true;
}
