/**
 * 4.6.0 Sơn Môn Tranh Bá - số liệu động phủ (plan-4.6.0 Ngày 2).
 * Bản TypeScript này dùng để hiện ước tính trên giao diện và để mô phỏng (`npx tsx scripts/sim-son-mon.ts`).
 * Máy chủ (hàm Supabase) là bản thật: khi đổi số ở đây phải đổi cùng trong SQL.
 * Mọi thứ của Sơn Môn giấu sau cờ SON_MON_ON (chưa có cho tới Ngày 8). File này không có giao diện.
 *
 * Đơn vị: thời gian tính bằng giây, sản lượng tính theo giờ, tọa độ ô bản đồ.
 * Tài nguyên: ls linh thạch, lt linh thảo, kt khoáng thạch (sinh theo giờ), lk linh khí (chỉ từ kiếp).
 */
import { tr } from '../i18n';

export type Gioi = 'thien' | 'hong_tran' | 'u_minh';
export type Res = { ls: number; lt: number; kt: number; lk: number };
export const GIOI: Gioi[] = ['thien', 'hong_tran', 'u_minh'];

export const GIOI_INFO: Record<Gioi, { name: () => string; edge: () => string }> = {
  thien: { name: () => tr('Thiên', 'Heaven'), edge: () => tr('Công mạnh, đi nhanh, nghiên cứu rẻ hơn.', 'Strong attack, fast marches, cheaper research.') },
  hong_tran: { name: () => tr('Hồng Trần', 'Mortal Realm'), edge: () => tr('Sản xuất nhiều hơn, đại trận vững, chiêu hàng rẻ.', 'More production, sturdier wards, cheaper persuasion.') },
  u_minh: { name: () => tr('U Minh', 'Netherworld'), edge: () => tr('Trinh sát mạnh, đệ tử tử trận có phần hoàn hồn.', 'Strong scouts, some fallen disciples return.') },
};

// ---------------- Luật chung ----------------

export const LUAT = {
  /** linh khí từ kiếp theo cảnh giới cao nhất (chỉ số realm của engine: 0 Phàm, 1 Luyện Khí, ... ) */
  linhKhiTheoKiep: { pham: 5, luyen_khi: 5, truc_co: 10, kim_dan: 20, nguyen_anh: 30, hoa_than: 45, luyen_hu: 60, do_kiep: 60, phi_thang: 90, chung_dao: 120 },
  linhKhiTranNgay: 300,
  /** hàng chờ công trình: số mục đang xây cùng lúc (2 khi Chính Điện cấp 10), và số mục chờ phía sau (đã trả tài nguyên lúc đặt). 5 mục chờ để người vào 1 lần/ngày không bị thiệt (sim-son-mon 13/11). */
  xayCungLuc: (chinhDien: number) => (chinhDien >= 10 ? 2 : 1),
  hangChoXay: 5,
  /** hàng chờ luyện: 1 lượt đang luyện + 2 lượt chờ */
  hangChoLuyen: 2,
  /** giờ đêm 0:00-7:00 giờ Việt Nam: thủ x2 */
  demTu: 0, demDen: 7, demThu: 2,
  /** bảo hộ người mới (giây), bế quan tối thiểu và tổng tối đa mỗi Kỷ (giây) */
  baoHo: 5 * 86400, beQuanMin: 2 * 86400, beQuanMax: 7 * 86400,
  /** chân thân bị thương nghỉ */
  chanThanNghi: 6 * 3600,
  /** chỉ ghi điểm khi điểm đối thủ >= 1/3 điểm mình */
  diemToiThieu: 1 / 3,
  /** chiếm phúc địa tối đa, cộng sản lượng của phúc địa */
  phucDiaMax: 2, phucDiaCong: 0.25,
  /** động phủ bị chiếm: giữ lại 50% tài nguyên khi dời về rìa */
  doiPhuGiu: 0.5,
  /** lòng quy thuận ban đầu và trần sơn môn */
  quyThuan: 100, monMax: 12, roiMonCho: 24 * 3600,
  /** yêu động hồi tài nguyên mỗi giờ (theo cấp yêu động) */
  yeuDongHoi: (cap: number) => 40 * cap,
};

// ---------------- Công trình ----------------

export type BuildingId = 'chinh_dien' | 'linh_mach' | 'duoc_vien' | 'khoang_dong' | 'tang_bao' | 'luyen_vo' | 'tang_kinh' | 'ho_son' | 'truyen_tong';

export interface Building {
  id: BuildingId;
  name: () => string;
  what: () => string;
  /** giá cấp 1; cấp L nhân với costMul^(L-1) */
  base: Res;
  costMul: number;
  /** giờ xây cấp 1 (giây); cấp L nhân với timeMul^(L-1) */
  time: number;
  timeMul: number;
  /** cần Chính Điện tối thiểu (và công trình khác) mới xây cấp 1 */
  need?: Partial<Record<BuildingId, number>>;
  /** điểm dân số mỗi cấp (dùng xếp hạng dân số) */
  pop: number;
  max: number;
}

export const BUILDINGS: Record<BuildingId, Building> = {
  chinh_dien: { id: 'chinh_dien', name: () => tr('Chính Điện', 'Main Hall'), what: () => tr('Xây nhanh hơn, mở công trình khác. Cấp 5 lập được sơn môn.', 'Faster building, unlocks others. Level 5 can found a sect.'), base: { ls: 70, lt: 40, kt: 60, lk: 0 }, costMul: 1.26, time: 600, timeMul: 1.36, pop: 3, max: 20 },
  linh_mach: { id: 'linh_mach', name: () => tr('Linh Mạch', 'Spirit Vein'), what: () => tr('Sinh linh thạch.', 'Produces spirit stones.'), base: { ls: 40, lt: 50, kt: 30, lk: 0 }, costMul: 1.24, time: 420, timeMul: 1.33, pop: 2, max: 20 },
  duoc_vien: { id: 'duoc_vien', name: () => tr('Dược Viên', 'Herb Garden'), what: () => tr('Sinh linh thảo, nuôi đệ tử.', 'Produces herbs, feeds disciples.'), base: { ls: 50, lt: 30, kt: 40, lk: 0 }, costMul: 1.24, time: 420, timeMul: 1.33, pop: 2, max: 20 },
  khoang_dong: { id: 'khoang_dong', name: () => tr('Khoáng Động', 'Ore Cave'), what: () => tr('Sinh khoáng thạch.', 'Produces ore.'), base: { ls: 50, lt: 40, kt: 30, lk: 0 }, costMul: 1.24, time: 420, timeMul: 1.33, pop: 2, max: 20 },
  tang_bao: { id: 'tang_bao', name: () => tr('Tàng Bảo Khố', 'Treasury'), what: () => tr('Chứa nhiều hơn, giấu một phần khỏi kẻ cướp.', 'Holds more and hides part from raiders.'), base: { ls: 80, lt: 60, kt: 70, lk: 0 }, costMul: 1.25, time: 540, timeMul: 1.33, need: { chinh_dien: 1 }, pop: 1, max: 20 },
  luyen_vo: { id: 'luyen_vo', name: () => tr('Luyện Võ Trường', 'Training Ground'), what: () => tr('Luyện đệ tử, cấp cao luyện nhanh hơn.', 'Trains disciples; higher levels train faster.'), base: { ls: 120, lt: 80, kt: 110, lk: 0 }, costMul: 1.27, time: 900, timeMul: 1.34, need: { chinh_dien: 3 }, pop: 2, max: 20 },
  tang_kinh: { id: 'tang_kinh', name: () => tr('Tàng Kinh Các', 'Scripture Hall'), what: () => tr('Nghiên cứu công, thủ, tốc độ. Cấp 10 mở đệ tử tinh anh.', 'Research attack, defense, speed. Level 10 unlocks elites.'), base: { ls: 160, lt: 120, kt: 140, lk: 0 }, costMul: 1.28, time: 1200, timeMul: 1.35, need: { chinh_dien: 5, luyen_vo: 1 }, pop: 3, max: 20 },
  ho_son: { id: 'ho_son', name: () => tr('Hộ Sơn Đại Trận', 'Mountain Ward'), what: () => tr('Tường thành, cộng thủ cho cả động phủ.', 'Walls: boosts the whole abode defense.'), base: { ls: 70, lt: 50, kt: 100, lk: 0 }, costMul: 1.26, time: 720, timeMul: 1.34, need: { chinh_dien: 2 }, pop: 1, max: 20 },
  truyen_tong: { id: 'truyen_tong', name: () => tr('Truyền Tống Trận', 'Teleport Array'), what: () => tr('Quân đi nhanh hơn, mở viện binh xa.', 'Faster marches, long-range reinforcements.'), base: { ls: 200, lt: 150, kt: 200, lk: 0 }, costMul: 1.28, time: 1500, timeMul: 1.35, need: { chinh_dien: 8, luyen_vo: 3 }, pop: 2, max: 20 },
};
export const BUILDING_IDS = Object.keys(BUILDINGS) as BuildingId[];

/** hệ số chung để cân bằng bằng mô phỏng (giá, giờ xây, sản lượng). Giá x1,4 chốt bằng sim-son-mon 13/11. */
export const SO = { gia: 1.4, gio: 1, sanLuong: 1 };

/** linh khí cho nâng cấp lớn: cấp 6 trở lên của mọi công trình, cấp 10, 15, 20 cần nhiều hơn */
export function linhKhiCost(lv: number): number {
  if (lv < 6) return 0;
  return 4 * (lv - 5) + (lv % 5 === 0 ? 10 * (lv / 5) : 0);
}

export function buildCost(id: BuildingId, lv: number): Res {
  const b = BUILDINGS[id], m = Math.pow(b.costMul, lv - 1) * SO.gia;
  return { ls: Math.round(b.base.ls * m), lt: Math.round(b.base.lt * m), kt: Math.round(b.base.kt * m), lk: linhKhiCost(lv) };
}

/** giờ xây (giây), Chính Điện cấp cd làm nhanh hơn: mỗi cấp -4%, sàn 45% */
export function buildTime(id: BuildingId, lv: number, cd: number): number {
  const b = BUILDINGS[id];
  const f = Math.max(0.45, 1 - 0.04 * Math.max(0, cd - 1));
  return Math.round(b.time * Math.pow(b.timeMul, lv - 1) * f * SO.gio);
}

/** sản lượng mỗi giờ của một mỏ cấp lv (cấp 0 vẫn sinh ít) */
export function prodPerHour(lv: number): number {
  return Math.round((lv <= 0 ? 8 : 20 * Math.pow(1.21, lv - 1) + 4 * lv) * SO.sanLuong);
}

/** sức chứa mỗi loại theo Tàng Bảo Khố (cấp 0 vẫn chứa được) và phần giấu không bị cướp */
export function storage(lv: number): number {
  return Math.round(1200 * Math.pow(1.3, lv));
}
export function hidden(lv: number, gioi: Gioi): number {
  return Math.round(storage(lv) * (0.1 + 0.01 * lv) * (gioi === 'hong_tran' ? 1.2 : 1));
}

/** Hộ Sơn Đại Trận: % thủ cộng thêm */
export function wallBonus(lv: number, gioi: Gioi): number {
  const per = gioi === 'hong_tran' ? 0.035 : 0.03;
  return lv * per;
}

/** sản lượng theo giới: Hồng Trần +10% */
export function gioiProd(gioi: Gioi): number {
  return gioi === 'hong_tran' ? 1.1 : 1;
}

// ---------------- Đệ tử (15 loại) ----------------

export type UnitRole = 'cong' | 'thu' | 'trinh_sat' | 'chieu_hang' | 'tinh_anh';
export type UnitId =
  | 'thien_binh' | 'kim_giap_ve' | 'tuan_thien_ung' | 'tuyen_chi_su' | 'thien_tuong'
  | 'kiem_tu' | 'thiet_ve' | 'du_hiep' | 'thuyet_khach' | 'kiem_tien'
  | 'quy_binh' | 'cot_ve' | 'u_hon' | 'cau_hon_su' | 'quy_vuong';

export interface Unit {
  id: UnitId;
  gioi: Gioi;
  role: UnitRole;
  name: () => string;
  atk: number;
  def: number;
  /** ô mỗi giờ */
  speed: number;
  /** tài nguyên mang về khi cướp */
  carry: number;
  cost: Res;
  /** giây luyện một đệ tử ở Luyện Võ Trường cấp 1 */
  time: number;
  /** linh thảo ăn mỗi giờ */
  upkeep: number;
  /** sức trinh sát (chỉ đội trinh sát) và sức chiêu hàng (giảm quy thuận mỗi lần thắng) */
  scout?: number;
  persuade?: number;
}

const U = (id: UnitId, gioi: Gioi, role: UnitRole, vi: string, en: string, atk: number, def: number, speed: number, carry: number, cost: Res, time: number, upkeep: number, extra: Partial<Unit> = {}): Unit =>
  ({ id, gioi, role, name: () => tr(vi, en), atk, def, speed, carry, cost, time, upkeep, ...extra });
const R = (ls: number, lt: number, kt: number, lk = 0): Res => ({ ls, lt, kt, lk });

export const UNITS: Record<UnitId, Unit> = {
  // Thiên: công mạnh, đi nhanh
  thien_binh: U('thien_binh', 'thien', 'cong', 'Thiên Binh', 'Heaven Soldier', 46, 22, 7, 45, R(110, 70, 95), 540, 1),
  kim_giap_ve: U('kim_giap_ve', 'thien', 'thu', 'Kim Giáp Vệ', 'Golden Guard', 15, 50, 6, 20, R(100, 95, 120), 600, 1),
  tuan_thien_ung: U('tuan_thien_ung', 'thien', 'trinh_sat', 'Tuần Thiên Ưng', 'Sky Hawk', 0, 8, 16, 0, R(60, 50, 50), 360, 1, { scout: 18 }),
  tuyen_chi_su: U('tuyen_chi_su', 'thien', 'chieu_hang', 'Tuyên Chỉ Sứ', 'Edict Envoy', 30, 30, 4, 0, R(3500, 2800, 3200, 60), 14400, 4, { persuade: 22 }),
  thien_tuong: U('thien_tuong', 'thien', 'tinh_anh', 'Thiên Tướng', 'Heaven General', 140, 70, 7, 80, R(380, 260, 360, 6), 1500, 3),
  // Hồng Trần: cân bằng, rẻ, thủ vững
  kiem_tu: U('kiem_tu', 'hong_tran', 'cong', 'Kiếm Tu', 'Sword Cultivator', 40, 26, 6, 55, R(95, 70, 85), 500, 1),
  thiet_ve: U('thiet_ve', 'hong_tran', 'thu', 'Thiết Vệ', 'Iron Guard', 16, 54, 5, 25, R(95, 90, 115), 580, 1),
  du_hiep: U('du_hiep', 'hong_tran', 'trinh_sat', 'Du Hiệp', 'Wanderer', 0, 10, 13, 0, R(55, 45, 45), 340, 1, { scout: 14 }),
  thuyet_khach: U('thuyet_khach', 'hong_tran', 'chieu_hang', 'Thuyết Khách', 'Persuader', 25, 30, 4, 0, R(3000, 2400, 2700, 50), 12600, 4, { persuade: 25 }),
  kiem_tien: U('kiem_tien', 'hong_tran', 'tinh_anh', 'Kiếm Tiên', 'Sword Immortal', 125, 85, 6, 90, R(360, 260, 340, 6), 1500, 3),
  // U Minh: trinh sát mạnh, có hoàn hồn
  quy_binh: U('quy_binh', 'u_minh', 'cong', 'Quỷ Binh', 'Ghost Soldier', 41, 24, 6, 50, R(100, 70, 90), 520, 1),
  cot_ve: U('cot_ve', 'u_minh', 'thu', 'Cốt Vệ', 'Bone Guard', 14, 52, 5, 20, R(95, 95, 115), 590, 1),
  u_hon: U('u_hon', 'u_minh', 'trinh_sat', 'U Hồn', 'Wraith', 0, 12, 15, 0, R(50, 45, 45), 320, 1, { scout: 26 }),
  cau_hon_su: U('cau_hon_su', 'u_minh', 'chieu_hang', 'Câu Hồn Sứ', 'Soul Reaper', 28, 28, 4, 0, R(3300, 2600, 3000, 55), 13500, 4, { persuade: 23 }),
  quy_vuong: U('quy_vuong', 'u_minh', 'tinh_anh', 'Quỷ Vương', 'Ghost King', 130, 80, 6, 80, R(370, 260, 350, 6), 1500, 3),
};
export const UNIT_IDS = Object.keys(UNITS) as UnitId[];
export const unitsOf = (g: Gioi) => UNIT_IDS.filter((id) => UNITS[id].gioi === g);
export const unitOf = (g: Gioi, role: UnitRole) => unitsOf(g).find((id) => UNITS[id].role === role)!;

/** điều kiện luyện: công/thủ/trinh sát cần Luyện Võ Trường 1; chiêu hàng cần Chính Điện 10; tinh anh cần Tàng Kinh Các 10 */
export function unitNeed(role: UnitRole): Partial<Record<BuildingId, number>> {
  if (role === 'chieu_hang') return { chinh_dien: 10, luyen_vo: 5 };
  if (role === 'tinh_anh') return { tang_kinh: 10, luyen_vo: 10 };
  if (role === 'trinh_sat') return { luyen_vo: 1, tang_kinh: 1 };
  return { luyen_vo: 1 };
}

/** giây luyện một đệ tử, Luyện Võ Trường cấp lv: mỗi cấp -5%, sàn 40% */
export function trainTime(id: UnitId, lv: number): number {
  return Math.round(UNITS[id].time * Math.max(0.4, 1 - 0.05 * Math.max(0, lv - 1)));
}

/** U Minh: 20% đệ tử tử trận hoàn hồn về động phủ */
export const HOAN_HON = 0.2;

// ---------------- Nghiên cứu (Tàng Kinh Các) ----------------

export type ResearchId = 'cong' | 'thu' | 'toc';
export const RESEARCH: Record<ResearchId, { name: () => string; per: number; max: number; base: Res; mul: number; time: number }> = {
  cong: { name: () => tr('Công pháp tấn công', 'Attack arts'), per: 0.015, max: 20, base: R(300, 250, 280), mul: 1.3, time: 1800 },
  thu: { name: () => tr('Công pháp phòng thủ', 'Defense arts'), per: 0.015, max: 20, base: R(280, 260, 300), mul: 1.3, time: 1800 },
  toc: { name: () => tr('Thân pháp hành quân', 'Marching arts'), per: 0.02, max: 10, base: R(260, 300, 240), mul: 1.35, time: 2400 },
};
/** nghiên cứu cấp lv cần Tàng Kinh Các cấp >= lv; Thiên rẻ hơn 10% */
export function researchCost(id: ResearchId, lv: number, gioi: Gioi): Res {
  const r = RESEARCH[id], m = Math.pow(r.mul, lv - 1) * (gioi === 'thien' ? 0.9 : 1);
  return { ls: Math.round(r.base.ls * m), lt: Math.round(r.base.lt * m), kt: Math.round(r.base.kt * m), lk: lv >= 10 ? 5 * (lv - 9) : 0 };
}

// ---------------- Trận ----------------

export type Army = Partial<Record<UnitId, number>>;

export interface Side {
  army: Army;
  gioi: Gioi;
  /** cấp nghiên cứu công (bên đánh) hoặc thủ (bên thủ) */
  research: number;
  /** Hộ Sơn Đại Trận (chỉ bên thủ) */
  wall?: number;
  /** chân thân dẫn quân: cộng % từ huyệt (mỗi huyệt +0,5%) và hành viên mãn khắc ô đánh tới (+3%) */
  hero?: { huyet: number; khac?: boolean };
}

export function armyAtk(s: Side): number {
  let a = 0;
  for (const id of Object.keys(s.army) as UnitId[]) a += UNITS[id].atk * (s.army[id] ?? 0);
  return a * (1 + RESEARCH.cong.per * s.research) * heroMul(s);
}
export function armyDef(s: Side, night: boolean): number {
  let d = 0;
  for (const id of Object.keys(s.army) as UnitId[]) d += UNITS[id].def * (s.army[id] ?? 0);
  d += 10; // dân trong động phủ luôn có sức thủ tối thiểu
  return d * (1 + RESEARCH.thu.per * s.research) * (1 + wallBonus(s.wall ?? 0, s.gioi)) * heroMul(s) * (night ? LUAT.demThu : 1);
}
function heroMul(s: Side): number {
  if (!s.hero) return 1;
  return 1 + 0.005 * s.hero.huyet + (s.hero.khac ? 0.03 : 0);
}

/** giờ đêm theo giờ Việt Nam (UTC+7) */
export function isNight(ms: number): boolean {
  const h = new Date(ms + 7 * 3600000).getUTCHours();
  return h >= LUAT.demTu && h < LUAT.demDen;
}

export interface BattleResult {
  win: boolean;
  /** tỉ lệ đệ tử mất mỗi bên (0-1) */
  atkLoss: number;
  defLoss: number;
  A: number;
  D: number;
}

/**
 * Công thức kiểu Travian: tổng công A so tổng thủ D. Bên mạnh hơn thắng, mất (yếu/mạnh)^1,5; bên yếu mất hết.
 * Cướp (raid) nhẹ tay hơn: hai bên cùng mất theo tỉ lệ x = (yếu/mạnh)^1,5, bên thắng mất x/(1+x), bên thua mất 1/(1+x).
 */
export function battle(atk: Side, def: Side, night: boolean, kind: 'cuop' | 'cong_pha' | 'chieu_hang' = 'cong_pha'): BattleResult {
  const A = armyAtk(atk), D = armyDef(def, night);
  const win = A > D;
  const x = Math.pow(Math.min(A, D) / Math.max(A, D, 1), 1.5);
  if (kind === 'cuop') {
    const w = x / (1 + x), l = 1 / (1 + x);
    return win ? { win, atkLoss: w, defLoss: l, A, D } : { win, atkLoss: l, defLoss: w, A, D };
  }
  return win ? { win, atkLoss: x, defLoss: 1, A, D } : { win, atkLoss: 1, defLoss: x, A, D };
}

/** số đệ tử còn lại sau trận (U Minh có hoàn hồn) */
export function afterLoss(army: Army, loss: number, gioi: Gioi): { left: Army; dead: number; back: Army } {
  const left: Army = {}, back: Army = {};
  let dead = 0;
  for (const id of Object.keys(army) as UnitId[]) {
    const n = army[id] ?? 0, d = Math.round(n * loss);
    left[id] = n - d;
    dead += d;
    if (gioi === 'u_minh' && d > 0) back[id] = Math.floor(d * HOAN_HON);
  }
  return { left, dead, back };
}

/** giờ đi (giây) theo khoảng cách ô và đệ tử chậm nhất; Thiên +10% tốc, nghiên cứu thân pháp, Truyền Tống Trận +5%/cấp khi đi trên 10 ô */
export function marchTime(army: Army, dist: number, gioi: Gioi, toc: number, truyenTong: number): number {
  const ids = (Object.keys(army) as UnitId[]).filter((id) => (army[id] ?? 0) > 0);
  if (!ids.length) return 0;
  let v = Math.min(...ids.map((id) => UNITS[id].speed));
  v *= (gioi === 'thien' ? 1.1 : 1) * (1 + RESEARCH.toc.per * toc);
  if (dist > 10) v *= 1 + 0.05 * truyenTong;
  return Math.round((dist / v) * 3600);
}

// ---------------- Điểm ----------------

/** dân số động phủ: tổng cấp x pop */
export function population(levels: Partial<Record<BuildingId, number>>): number {
  let p = 0;
  for (const id of BUILDING_IDS) p += (levels[id] ?? 0) * BUILDINGS[id].pop;
  return p;
}

// ---------------- Kỷ và bản đồ ----------------

export function kyTheoSoNguoi(n: number): { days: number; size: number } {
  if (n < 120) return { days: 10, size: 25 };
  if (n <= 300) return { days: 14, size: 31 };
  return { days: 21, size: 41 };
}

/** khu của giới theo góc quanh tâm: Thiên phía bắc, Hồng Trần đông nam, U Minh tây nam */
export function zoneOf(x: number, y: number, size: number): Gioi | 'tam' {
  const c = (size - 1) / 2, dx = x - c, dy = c - y;
  if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) return 'tam';
  const a = (Math.atan2(dy, dx) * 180) / Math.PI; // 0 = đông, 90 = bắc
  if (a >= 30 && a < 150) return 'thien';
  if (a < 30 && a >= -90) return 'hong_tran';
  return 'u_minh';
}
/** vùng: gần tâm (tới 1/3 bán kính), giữa, rìa */
export function ringOf(x: number, y: number, size: number): 'gan' | 'giua' | 'ria' {
  const c = (size - 1) / 2, r = Math.hypot(x - c, y - c) / c;
  return r <= 0.38 ? 'gan' : r <= 0.72 ? 'giua' : 'ria';
}
export const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);
