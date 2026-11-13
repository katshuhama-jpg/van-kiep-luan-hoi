/**
 * 4.6.0 Sơn Môn Tranh Bá: số liệu dùng chung.
 * Bản TypeScript để giao diện hiện ước tính và để mô phỏng (scripts/sim-son-mon.ts).
 * Máy chủ là bản thật: `scripts/gen-son-mon-sql.ts` sinh hàm `vkl_priv.sm_cfg()` từ đúng các số ở đây
 * (supabase/son_mon_cfg_*.sql), nên đổi số ở đây thì phải sinh lại SQL và áp lên Supabase.
 * Giấu sau cờ SON_MON_ON (tắt mặc định) cho tới khối Ngày 8.
 */
import { tr } from '../i18n';

export type Gioi = 'thien' | 'hong_tran' | 'u_minh';
export type Res = { ls: number; lt: number; kt: number; lk?: number };
export type BuildingId =
  | 'chinh_dien'
  | 'linh_mach'
  | 'duoc_vien'
  | 'khoang_dong'
  | 'tang_bao'
  | 'luyen_vo'
  | 'tang_kinh'
  | 'ho_son'
  | 'truyen_tong';
export type UnitRole = 'cong' | 'thu' | 'trinh_sat' | 'chieu_hang' | 'tinh_anh';
export type MarchKind = 'cuop' | 'cong_pha' | 'trinh_sat' | 'chieu_hang' | 'vien_binh';

export const GIOI: Record<Gioi, { name: string; line: string }> = {
  thien: { name: tr('Thiên', 'Heaven'), line: tr('Công mạnh, đi nhanh, nghiên cứu rẻ hơn.', 'Strong attack, fast marches, cheaper research.') },
  hong_tran: { name: tr('Hồng Trần', 'Mortal Realm'), line: tr('Sản xuất nhiều hơn, tường thành vững, chiêu hàng rẻ.', 'More production, sturdy walls, cheap persuasion.') },
  u_minh: { name: tr('U Minh', 'Netherworld'), line: tr('Trinh sát giỏi, đệ tử tử trận có phần hoàn hồn.', 'Keen scouts, some fallen disciples return as souls.') },
};

/** Hằng số chung. Đơn vị giờ thật; khoảng cách đo bằng ô (Euclid). */
export const SM = {
  maxLevel: 20,
  startRes: { ls: 750, lt: 750, kt: 750, lk: 0 } as Res,
  /** công trình có sẵn khi mở động phủ */
  startLevels: { chinh_dien: 1, linh_mach: 1, duoc_vien: 1, khoang_dong: 1 } as Partial<Record<BuildingId, number>>,
  /** quân tối đa một lượt luyện */
  trainMax: 500,
  /** sản lượng mỗi giờ khi công trình tài nguyên ở cấp 0 */
  prodBase: 15,
  /** sản lượng mỗi giờ ở cấp L: prodA * prodG^(L-1) */
  prodA: 40,
  prodG: 1.17,
  /** Hồng Trần sản xuất thêm */
  hongTranProd: 0.1,
  /** sức chứa Tàng Bảo Khố ở cấp L: capA * capG^L */
  capA: 1500,
  capG: 1.27,
  /** phần giấu không bị cướp: hideA + hideL * cấp */
  hideA: 0.1,
  hideL: 0.015,
  /** giá xây cấp L = base * costG^(L-1); giờ xây = baseSec * timeG^(L-1) * cdSpeed^(chính điện - 1) */
  costG: 1.28,
  timeG: 1.33,
  cdSpeed: 0.95,
  /** linh khí cho cấp trên 10: lkPer * (L - 10) */
  lkPer: 8,
  /** Luyện Võ Trường: giờ luyện nhân lvSpeed^(cấp - 1) */
  lvSpeed: 0.95,
  /** Hộ Sơn Đại Trận: % thủ mỗi cấp */
  wallPer: 0.03,
  wallPerHongTran: 0.04,
  /** Truyền Tống Trận: % tốc độ hành quân mỗi cấp */
  ttSpeed: 0.05,
  /** nghiên cứu: mỗi cấp +2% công hoặc thủ, +4% tốc độ; Thiên rẻ hơn 10% */
  researchPer: { cong: 0.02, thu: 0.02, toc: 0.04 },
  researchCostMul: 1.6,
  thienResearch: 0.9,
  /** giờ đêm (giờ Việt Nam) thủ x2 */
  nightFrom: 0,
  nightTo: 7,
  nightDef: 2,
  /** bảo hộ người mới, bế quan, chân thân bị thương */
  protectDays: 5,
  beQuanMinDays: 2,
  beQuanMaxDays: 7,
  heroRestHours: 6,
  /** U Minh: phần đệ tử tử trận hoàn hồn về động phủ */
  uMinhReturn: 0.2,
  /** chiêu hàng: lòng quy thuận mất mỗi đệ tử chiêu hàng sống sót */
  loyaltyPer: { min: 20, max: 30 },
  loyaltyRegenPerHour: 1,
  /** trần linh khí từ kiếp mỗi ngày (giờ Việt Nam) */
  lkDayCap: 300,
  /** hàng chờ: 1 công trình và 1 lượt luyện, 2 khi Chính Điện cấp 10 */
  queue2At: 10,
  /** lập sơn môn khi Chính Điện cấp 5, tối đa 12 người */
  monAt: 5,
  monMax: 12,
  /** chỉ ghi điểm khi đánh động phủ có điểm từ 1/3 điểm mình */
  fairRatio: 1 / 3,
  /** thiệt hại lũy thừa như Travian */
  lossExp: 1.5,
};

/** Linh khí về động phủ theo kiếp vừa khép (cảnh giới cao nhất của kiếp) */
export function linhKhiOfLife(realmNo: number, ascended: boolean, chungDao: boolean): number {
  if (chungDao) return 120;
  if (ascended) return 90;
  if (realmNo >= 6) return 60; // Luyện Hư, Độ Kiếp
  return [5, 5, 10, 20, 30, 45][Math.max(0, realmNo)] ?? 60;
}

export type BuildingDef = {
  id: BuildingId;
  name: string;
  line: string;
  base: Res;
  baseSec: number;
  /** cần Chính Điện cấp mấy mới xây được */
  needCd: number;
  /** điểm (dân số) mỗi cấp */
  pop: number;
};

export const BUILDINGS: BuildingDef[] = [
  { id: 'chinh_dien', name: tr('Chính Điện', 'Main Hall'), line: tr('Xây nhanh hơn, mở công trình khác. Cấp 5 lập được sơn môn.', 'Builds faster, unlocks other buildings. Level 5 can found a sect.'), base: { ls: 90, lt: 60, kt: 90 }, baseSec: 60, needCd: 0, pop: 3 },
  { id: 'linh_mach', name: tr('Linh Mạch', 'Spirit Vein'), line: tr('Sinh linh thạch.', 'Produces spirit stones.'), base: { ls: 50, lt: 60, kt: 50 }, baseSec: 45, needCd: 0, pop: 2 },
  { id: 'duoc_vien', name: tr('Dược Viên', 'Herb Garden'), line: tr('Sinh linh thảo, nuôi đệ tử.', 'Produces spirit herbs, feeds disciples.'), base: { ls: 60, lt: 40, kt: 60 }, baseSec: 45, needCd: 0, pop: 2 },
  { id: 'khoang_dong', name: tr('Khoáng Động', 'Ore Cave'), line: tr('Sinh khoáng thạch.', 'Produces ore.'), base: { ls: 60, lt: 60, kt: 40 }, baseSec: 45, needCd: 0, pop: 2 },
  { id: 'tang_bao', name: tr('Tàng Bảo Khố', 'Treasury'), line: tr('Chứa nhiều hơn, giấu một phần khỏi kẻ cướp.', 'Holds more, hides part from raiders.'), base: { ls: 70, lt: 70, kt: 90 }, baseSec: 50, needCd: 1, pop: 1 },
  { id: 'luyen_vo', name: tr('Luyện Võ Trường', 'Training Ground'), line: tr('Luyện đệ tử, cấp cao luyện nhanh hơn.', 'Trains disciples, faster at higher levels.'), base: { ls: 110, lt: 90, kt: 120 }, baseSec: 90, needCd: 2, pop: 2 },
  { id: 'tang_kinh', name: tr('Tàng Kinh Các', 'Scripture Pavilion'), line: tr('Nghiên cứu công, thủ, tốc độ. Cấp 10 mở đệ tử tinh anh.', 'Research attack, defence, speed. Level 10 unlocks elite disciples.'), base: { ls: 130, lt: 120, kt: 110 }, baseSec: 120, needCd: 5, pop: 2 },
  { id: 'ho_son', name: tr('Hộ Sơn Đại Trận', 'Mountain Ward'), line: tr('Tường thành, cộng thủ cho động phủ.', 'Walls, adds defence to your abode.'), base: { ls: 80, lt: 50, kt: 120 }, baseSec: 75, needCd: 3, pop: 1 },
  { id: 'truyen_tong', name: tr('Truyền Tống Trận', 'Teleport Array'), line: tr('Hành quân nhanh hơn.', 'Faster marches.'), base: { ls: 160, lt: 120, kt: 160 }, baseSec: 150, needCd: 8, pop: 2 },
];
export const BUILDING_BY = Object.fromEntries(BUILDINGS.map((b) => [b.id, b])) as Record<BuildingId, BuildingDef>;
export const RES_BUILDING: Record<'ls' | 'lt' | 'kt', BuildingId> = { ls: 'linh_mach', lt: 'duoc_vien', kt: 'khoang_dong' };

export type UnitDef = {
  id: string;
  gioi: Gioi;
  role: UnitRole;
  name: string;
  atk: number;
  def: number;
  /** ô mỗi giờ */
  speed: number;
  carry: number;
  cost: Res;
  trainSec: number;
  /** linh thảo ăn mỗi giờ */
  upkeep: number;
  /** cần Luyện Võ cấp mấy, Tàng Kinh cấp mấy */
  needLv: number;
  needTk: number;
  /** sức trinh sát (chỉ trinh sát) */
  scout?: number;
};

const u = (id: string, gioi: Gioi, role: UnitRole, vi: string, en: string, atk: number, def: number, speed: number, carry: number, cost: Res, trainSec: number, upkeep: number, needLv: number, needTk: number, scout?: number): UnitDef => ({ id, gioi, role, name: tr(vi, en), atk, def, speed, carry, cost, trainSec, upkeep, needLv, needTk, scout });

/** 15 loại đệ tử: mỗi giới công, thủ, trinh sát, chiêu hàng, tinh anh */
export const UNITS: UnitDef[] = [
  u('thien_binh', 'thien', 'cong', 'Thiên Binh', 'Heavenly Soldier', 62, 22, 7, 55, { ls: 130, lt: 90, kt: 160, lk: 0 }, 600, 1, 1, 0),
  u('kim_giap_ve', 'thien', 'thu', 'Kim Giáp Vệ', 'Golden Guard', 18, 58, 5, 20, { ls: 110, lt: 100, kt: 150, lk: 0 }, 600, 1, 1, 0),
  u('tuan_thien_ung', 'thien', 'trinh_sat', 'Tuần Thiên Ưng', 'Sky Patrol Hawk', 0, 8, 18, 0, { ls: 60, lt: 50, kt: 40, lk: 0 }, 400, 1, 3, 0, 30),
  u('tuyen_chi_su', 'thien', 'chieu_hang', 'Tuyên Chỉ Sứ', 'Edict Envoy', 30, 35, 4, 0, { ls: 900, lt: 800, kt: 900, lk: 0 }, 5400, 4, 5, 5),
  u('loi_bo_than_tuong', 'thien', 'tinh_anh', 'Lôi Bộ Thần Tướng', 'Thunder General', 160, 90, 6, 80, { ls: 450, lt: 350, kt: 500, lk: 15 }, 2400, 3, 5, 10),

  u('kiem_tu', 'hong_tran', 'cong', 'Kiếm Tu', 'Sword Cultivator', 55, 30, 6, 60, { ls: 120, lt: 90, kt: 150, lk: 0 }, 600, 1, 1, 0),
  u('thiet_ve', 'hong_tran', 'thu', 'Thiết Vệ', 'Iron Guard', 18, 62, 5, 25, { ls: 110, lt: 100, kt: 150, lk: 0 }, 600, 1, 1, 0),
  u('du_hiep', 'hong_tran', 'trinh_sat', 'Du Hiệp', 'Wandering Ranger', 0, 10, 15, 0, { ls: 60, lt: 50, kt: 40, lk: 0 }, 400, 1, 3, 0, 30),
  u('thuyet_khach', 'hong_tran', 'chieu_hang', 'Thuyết Khách', 'Persuader', 25, 35, 4, 0, { ls: 700, lt: 650, kt: 700, lk: 0 }, 5400, 4, 5, 5),
  u('kiem_tien', 'hong_tran', 'tinh_anh', 'Kiếm Tiên', 'Sword Immortal', 145, 110, 6, 90, { ls: 450, lt: 350, kt: 500, lk: 15 }, 2400, 3, 5, 10),

  u('quy_binh', 'u_minh', 'cong', 'Quỷ Binh', 'Ghost Soldier', 57, 24, 6, 50, { ls: 115, lt: 85, kt: 145, lk: 0 }, 600, 1, 1, 0),
  u('cot_ve', 'u_minh', 'thu', 'Cốt Vệ', 'Bone Guard', 16, 57, 5, 20, { ls: 105, lt: 95, kt: 140, lk: 0 }, 600, 1, 1, 0),
  u('u_hon', 'u_minh', 'trinh_sat', 'U Hồn', 'Wraith', 0, 12, 19, 0, { ls: 55, lt: 45, kt: 35, lk: 0 }, 380, 1, 3, 0, 45),
  u('cau_hon_su', 'u_minh', 'chieu_hang', 'Câu Hồn Sứ', 'Soul Reaper', 28, 35, 4, 0, { ls: 900, lt: 800, kt: 900, lk: 0 }, 5400, 4, 5, 5),
  u('diem_la_quy_tuong', 'u_minh', 'tinh_anh', 'Diêm La Quỷ Tướng', 'Yama General', 150, 95, 6, 70, { ls: 430, lt: 330, kt: 480, lk: 15 }, 2400, 3, 5, 10),
];
export const UNIT_BY = Object.fromEntries(UNITS.map((x) => [x.id, x])) as Record<string, UnitDef>;
export const unitsOf = (g: Gioi) => UNITS.filter((x) => x.gioi === g);

/** Yêu động (NPC): thủ theo cấp, của cải hồi theo giờ */
export const YEU_DONG = { defA: 120, defG: 1.45, resA: 300, resG: 1.35, regenPerHour: 0.08 };
/** Phúc địa: yêu thú giữ, +25% một loại tài nguyên, mỗi động phủ tối đa 2 */
export const PHUC_DIA = { bonus: 0.25, max: 2, defA: 600, defG: 1.4 };

// ---------- công thức ----------
const pow = Math.pow;
const r0 = (x: number) => Math.round(x);

export function buildCost(id: BuildingId, level: number): Res {
  const b = BUILDING_BY[id];
  const m = pow(SM.costG, level - 1);
  return { ls: r0(b.base.ls * m), lt: r0(b.base.lt * m), kt: r0(b.base.kt * m), lk: level > 10 ? SM.lkPer * (level - 10) : 0 };
}
export function buildSec(id: BuildingId, level: number, cdLevel: number): number {
  return r0(BUILDING_BY[id].baseSec * pow(SM.timeG, level - 1) * pow(SM.cdSpeed, Math.max(0, cdLevel - 1)));
}
export function prodPerHour(level: number, gioi: Gioi): number {
  const p = level <= 0 ? SM.prodBase : SM.prodA * pow(SM.prodG, level - 1);
  return p * (gioi === 'hong_tran' ? 1 + SM.hongTranProd : 1);
}
export const capOf = (tangBao: number) => r0(SM.capA * pow(SM.capG, tangBao));
export const hiddenOf = (tangBao: number) => Math.min(0.5, SM.hideA + SM.hideL * tangBao);
export const wallOf = (level: number, gioi: Gioi) => level * (gioi === 'hong_tran' ? SM.wallPerHongTran : SM.wallPer);
export function trainSec(unitId: string, lvLevel: number): number {
  return r0(UNIT_BY[unitId].trainSec * pow(SM.lvSpeed, Math.max(0, lvLevel - 1)));
}
export function researchCost(kind: 'cong' | 'thu' | 'toc', level: number, gioi: Gioi): Res {
  const m = 200 * pow(SM.researchCostMul, level - 1) * (gioi === 'thien' ? SM.thienResearch : 1) * (kind === 'toc' ? 1.2 : 1);
  return { ls: r0(m), lt: r0(m * 0.8), kt: r0(m), lk: 0 };
}
/** điểm động phủ (dân số): tổng pop * cấp(cấp+1)/2 */
export function pointsOf(levels: Partial<Record<BuildingId, number>>): number {
  let s = 0;
  for (const b of BUILDINGS) {
    const l = levels[b.id] ?? 0;
    s += (b.pop * l * (l + 1)) / 2;
  }
  return r0(s);
}
export function isNightVN(d: Date): boolean {
  const h = (d.getUTCHours() + 7) % 24;
  return h >= SM.nightFrom && h < SM.nightTo;
}

export type Army = Record<string, number>;
export type BattleSide = { army: Army; atkMul?: number; defMul?: number };
/** Tính trận như Travian: công so với thủ x (1 + tường) (x2 giờ đêm), thiệt hại theo tỉ lệ lũy thừa 1,5. */
export function battle(att: BattleSide, def: BattleSide & { wall?: number; night?: boolean; npcDef?: number }, kind: MarchKind) {
  let A = 0;
  for (const [id, n] of Object.entries(att.army)) A += (UNIT_BY[id]?.atk ?? 0) * n;
  A *= att.atkMul ?? 1;
  let D = def.npcDef ?? 0;
  for (const [id, n] of Object.entries(def.army)) D += (UNIT_BY[id]?.def ?? 0) * n;
  D = Math.max(1, D * (def.defMul ?? 1) * (1 + (def.wall ?? 0)) * (def.night ? SM.nightDef : 1));
  const win = A > D;
  let attLoss: number;
  let defLoss: number;
  if (kind === 'cuop') {
    const x = pow(Math.min(A, D) / Math.max(A, D, 1), SM.lossExp);
    const winnerLoss = x / (1 + x);
    const loserLoss = 1 / (1 + x);
    attLoss = win ? winnerLoss : loserLoss;
    defLoss = win ? loserLoss : winnerLoss;
  } else {
    attLoss = win ? pow(D / A, SM.lossExp) : 1;
    defLoss = win ? 1 : pow(A / D, SM.lossExp);
  }
  return { A: r0(A), D: r0(D), win, attLoss, defLoss };
}
export function distance(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1);
}
/** giây đường đi: theo đệ tử chậm nhất, Truyền Tống và nghiên cứu tốc độ */
export function marchSec(army: Army, dist: number, ttLevel = 0, tocLevel = 0, gioi?: Gioi): number {
  let slow = Infinity;
  for (const [id, n] of Object.entries(army)) if (n > 0) slow = Math.min(slow, UNIT_BY[id]?.speed ?? 5);
  if (!isFinite(slow)) slow = 6;
  const mul = (1 + SM.ttSpeed * ttLevel) * (1 + SM.researchPer.toc * tocLevel) * (gioi === 'thien' ? 1.1 : 1);
  return r0((dist / (slow * mul)) * 3600);
}

/** Bảng chia khu Kỷ theo số người mở động phủ tuần trước */
export function kyShape(players: number): { days: number; size: number } {
  if (players < 120) return { days: 10, size: 25 };
  if (players <= 300) return { days: 14, size: 31 };
  return { days: 21, size: 41 };
}
