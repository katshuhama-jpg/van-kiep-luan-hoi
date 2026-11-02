import type { Character, EffectCtx, PathId } from './types';
import type { Fighter } from './combat';
import { tr } from '../i18n';

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
export function canUpgrade(c: Character, id: string): boolean {
  const o = owned(c, id);
  return !!o && o.tang < 9 && o.exp >= 100 && (o.tang < 3 || (c.tanQuyen ?? 0) >= 1);
}
export function upgrade(c: Character, id: string): string | null {
  if (!canUpgrade(c, id)) return null;
  const o = owned(c, id)!;
  if (o.tang >= 3) c.tanQuyen = (c.tanQuyen ?? 0) - 1;
  o.tang += 1;
  o.exp = 0;
  c.cpHint = false;
  return tr(`${cpOf(id)?.name} lên tầng ${o.tang}.`, `${cpOf(id)?.name} reaches stage ${o.tang}.`);
}
/** Dùng trong trận thì thục luyện thêm chút */
function practice(c: Character | null, id: string) {
  if (!c) return;
  const o = owned(c, id);
  if (o && o.tang < 9) o.exp = Math.min(100, o.exp + 0.5);
}

/** Dung hợp: 2 chiêu cùng đạo đều tầng 9 thì lĩnh ngộ tuyệt kỹ của đạo, tốn 3 tàn quyển, thành 60% */
export const FUSE_COST = 3;
export const FUSE_CHANCE = 0.6;
export function tuyetOf(c: Character): CpDef | undefined {
  return c.path ? cpOfPath(c.path).find((x) => x.kind === 'tuyet') : undefined;
}
export function canFuse(c: Character): boolean {
  const t = tuyetOf(c);
  if (!t || c.cp?.tuyet === t.id) return false;
  const nine = cpOfPath(c.path!).filter((x) => x.kind === 'chieu' && (owned(c, x.id)?.tang ?? 0) >= 9);
  return nine.length >= 2 && (c.tanQuyen ?? 0) >= FUSE_COST;
}
export function fuse(c: Character, rnd: () => number): { ok: boolean; text: string } | null {
  if (!canFuse(c)) return null;
  const t = tuyetOf(c)!;
  c.tanQuyen = (c.tanQuyen ?? 0) - FUSE_COST;
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
export function applyHeir(c: Character, id?: string | null) {
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
    .map((x) => ({ d: x.d!, tang: x.o!.tang }));
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
  const k = 1 + 0.05 * (t - 1); // tầng càng cao chiêu càng mạnh
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
