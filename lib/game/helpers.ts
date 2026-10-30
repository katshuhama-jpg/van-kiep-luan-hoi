import { sealFatal } from './forge';
import { omenCultMul, omenIs } from './hook';
import { swornCultMul } from './social';
import { masterSaves } from './sect';
import { ITEMS, REALMS } from './data';
import type { Character, EffectCtx, Stats } from './types';
import { tr } from '../i18n';

/** Bộ sinh số ngẫu nhiên có hạt giống (mulberry32) */

/** Cảnh giới Độ Kiếp: từ đây ở phàm giới mới gặp quái Độ Kiếp, hiểm họa phàm tục không còn lấy được mạng */
export const DO_KIEP_REALM = 7;
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Chọn ngẫu nhiên n phần tử (giữ nguyên theo hạt giống) */
export function sample<T>(seed: number, arr: readonly T[], n: number): T[] {
  const r = seeded(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/** Bậc gia cảnh theo linh thạch và thu nhập */
export function wealthTier(c: { linhThach: number; income?: number }): { id: number; name: string } {
  const w = c.linhThach + (c.income ?? 0) * 10;
  if (w < 50) return { id: 0, name: tr('Bần hàn', "Destitute") };
  if (w < 300) return { id: 1, name: tr('Bình dân', "Commoner") };
  if (w < 1500) return { id: 2, name: tr('Khá giả', "Well-off") };
  if (w < 6000) return { id: 3, name: tr('Phú hộ', "Wealthy") };
  return { id: 4, name: tr('Đại phú hào', "Tycoon") };
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function pick<T>(rnd: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

export function weighted<T extends { w: number }>(rnd: () => number, arr: readonly T[]): T {
  const total = arr.reduce((s, a) => s + a.w, 0);
  let r = rnd() * total;
  for (const a of arr) {
    r -= a.w;
    if (r <= 0) return a;
  }
  return arr[arr.length - 1];
}

export function stat(c: Character, key: keyof Stats, delta: number) {
  // kẻ đã quen đường tà thì tâm ma dâng chậm hơn (lòng đã chai)
  if (key === 'tamMa' && delta > 0 && c.daoTam <= -40) delta *= 0.7;
  if (key === 'tamMa' && delta > 0 && omenIs('phat_quang')) delta *= 0.6;
  if (key === 'tamMa' && delta > 0 && c.maKien) delta *= 0.65;
  // 3.1.0: Phổ Đà Sơn tụng kinh mỗi ngày, tâm ma tăng chậm
  if (key === 'tamMa' && delta > 0 && c.sect === 'Phổ Đà Sơn' && !c.cosmos) delta *= 0.7;
  // Kiếp Số 10: tâm ma dâng nhanh hơn
  if (key === 'tamMa' && delta > 0 && (c.kiepSo ?? 0) >= 10) delta *= 1.2;
  // càng cao càng khó lên: khí vận, tâm cảnh, ngộ tính trên 80 chỉ tăng nửa
  if (delta > 0 && key !== 'tamMa' && key !== 'sucKhoe' && c.stats[key] >= 80) delta *= 0.5;
  c.stats[key] = clamp(Math.round(c.stats[key] + delta), 0, 100);
}

export function dao(c: Character, delta: number) {
  c.daoTam = clamp(Math.round(c.daoTam + delta), -100, 100);
}

/** Thêm thọ nguyên từ đan, đào, kỳ ngộ: ghi vào lifeExtra để mức trần thọ hằng năm không cắt mất */
export function addLife(c: Character, years: number) {
  c.lifespan += years;
  c.lifeExtra = (c.lifeExtra ?? 0) + years;
}

export function money(c: Character, delta: number) {
  c.linhThach = Math.max(0, Math.round(c.linhThach + delta));
}

/** Tu vi cần cho mỗi tầng ở cảnh giới hiện tại */
/** 3.1.0b: thọ dài ra 1,5 lần nên tu vi cần từ Kim Đan trở lên tăng 1,5 lần, để phi thăng không quá dễ */
export const NEED_MUL_HIGH = 1.5;
export function needFor(c: Character): number {
  return Math.round((REALMS[c.realm]?.need || 40) * (c.realm >= 3 ? NEED_MUL_HIGH : 1));
}

/** số năm tối thiểu cho mỗi tầng ở tiên/ma/hư giới */
export const COSMOS_YEARS_PER_LAYER = 24;
/** cảnh giới cuối (Đại La, Ma Đế, Hỗn Nguyên) nhanh hơn để kẻ phi thăng sớm còn kịp thử Chứng Đạo */
export const COSMOS_YEARS_TOP = 16;

export function addCult(c: Character, amount: number) {
  // thiên tượng hôm nay làm tu vi nhanh hay chậm
  if (amount > 0) amount *= omenCultMul(c) * swornCultMul();
  // sau phi thăng: thiên đạo áp chế, mỗi năm hấp thu tối đa 1/17 tu vi một tầng (ít nhất 51 năm một cảnh giới, cảnh giới cuối 36 năm)
  if (amount > 0 && c.cosmos) {
    const y = Math.floor(c.age);
    if (c.cgY !== y) {
      c.cgY = y;
      c.cgN = 0;
    }
    const room = Math.max(0, needFor(c) / ((c.realm >= 11 ? COSMOS_YEARS_TOP : COSMOS_YEARS_PER_LAYER) + ((c.kiepSo ?? 0) >= 8 ? 2 : 0)) - (c.cgN ?? 0));
    amount = Math.min(amount, room);
    c.cgN = (c.cgN ?? 0) + amount;
  }
  c.cultivation = Math.max(0, c.cultivation + amount);
}

const BASE_YEAR = [6, 30, 30, 34, 38, 42, 46, 50];

/** Phần thưởng tu vi: x tầng ở cảnh giới thấp, nhưng ở cảnh giới cao chỉ bằng khoảng x*3 năm tu luyện */
export function reward(c: Character, x: number): number {
  const yearly = (BASE_YEAR[c.realm] ?? 34) * c.linhCanMul * (0.6 + c.stats.ngoTinh / 100);
  return Math.min(needFor(c) * x, yearly * x * 3);
}

/** Tu vi tính theo phần trăm của tầng hiện tại */
export function cultPct(c: Character): number {
  return clamp(c.cultivation / needFor(c), 0, 1);
}

export function hasItem(c: Character, id: string) {
  return c.inventory.includes(id);
}

export function equippedLook(c: Character, slot: 'ao' | 'vu_khi' | 'phu_kien'): string | null {
  const id = c.equipped[slot];
  if (!id) return null;
  return ITEMS.find((i) => i.id === id)?.look ?? null;
}

export function giveItem(c: Character, id: string, equip = true) {
  if (!c.inventory.includes(id)) c.inventory.push(id);
  const item = ITEMS.find((i) => i.id === id);
  if (item && equip) c.equipped[item.slot] = id;
}

export function addPill(c: Character, id: string, n = 1) {
  c.pills[id] = (c.pills[id] ?? 0) + n;
}

export function usePill(c: Character, id: string): boolean {
  if ((c.pills[id] ?? 0) <= 0) return false;
  c.pills[id] -= 1;
  return true;
}

/** Đếm số lần một lựa chọn có dính rủi ro (bị thương, hiểm cảnh) để biết người chơi đang chọn an toàn hay liều */
export const riskMeter = { n: 0 };

/** Bị thương. Ngọc bội hộ thân đỡ một đòn chí mạng. */
/** 4.1.0: câu nhắc tuổi lúc chết, gắn vào nguyên nhân để văn bia nêu rõ chết năm nào */
export function atAge(c: Character): string {
  const n = Math.floor(c.age);
  return tr(` Năm ấy bạn ${n} tuổi.`, ` You were ${n}.`);
}

/** 4.1.0: ghi lại một vết thương nặng (nguồn, kẻ gây ra) để khi chết vì thương thế biết gắn kết cục nào */
export function addWound(c: Character, amt: number, text: string, tag?: string, by?: string) {
  if (amt <= 0) return;
  const age = Math.floor(c.age);
  c.wounds = [...(c.wounds ?? []).filter((w) => w.age >= age - 6), { age, amt: Math.round(amt), tag, by, text }].slice(-8);
}

/** 4.1.0: gắn kết cục và kẻ giết khi vừa chết (không ghi đè kết cục đã gắn, không áp ở ba cõi) */
export function markDeath(c: Character, tag?: string, by?: string) {
  if (!c.dead) return;
  if (tag && !c.cosmos && !c.endTag) c.endTag = tag;
  if (by && !c.killer) c.killer = by;
}

export function hurt(c: Character, amount: number, ctx: EffectCtx): string {
  riskMeter.n++;
  c.stats.sucKhoe = clamp(c.stats.sucKhoe - amount, 0, 100);
  ctx.fx('hurt', `-${amount}`);
  if (c.stats.sucKhoe <= 0 && c.equipped.phu_kien === 'ngoc_boi') {
    c.equipped.phu_kien = undefined;
    c.inventory = c.inventory.filter((i) => i !== 'ngoc_boi');
    c.stats.sucKhoe = 25;
    ctx.fx('heal', tr('Ngọc bội vỡ', "Jade pendant shattered"));
    return tr(' Ngọc bội hộ thân vỡ vụn, đỡ cho bạn một kiếp.', " Your protective jade pendant shatters, taking the blow for you and saving your life.");
  }
  return '';
}

/** Xác suất thành công dựa trên khí vận */
export function luck(c: Character, base: number): number {
  return clamp(base + (c.stats.khiVan - 50) / 250, 0.05, 0.95);
}

export function fmt(n: number) {
  return Math.round(n).toLocaleString('vi-VN');
}

/**
 * Lựa chọn chí mạng: có tỉ lệ chết ngay. Khí vận cao giảm nhẹ rủi ro,
 * ngọc bội hộ thân đỡ được một lần.
 */
/** 3.2.0: số kiếp đầu được trời thương và hệ số rủi ro chết */
export const NEWBIE_LIVES = 3;
export const NEWBIE_FATAL_MUL = 0.4;

/** trẻ con và thiếu niên được trời thương: dưới 13 tuổi rủi ro chỉ còn 35%, 13-17 tuổi còn 65% */
function youngMul(age: number): number {
  return age < 13 ? 0.35 : age < 18 ? 0.65 : 1;
}

/** 4.1.0 Q2: đang chạy sự kiện tai họa phàm tục thì từ cảnh giới này trở lên, cái chết chỉ thành thương (null = không áp dụng) */
export const phamGuard: { at: number | null } = { at: null };

/** Chạy fn với ngưỡng phàm tục tạm thời (dùng cho xui rủi nhỏ ngoài sự kiện) */
export function withPham<T>(at: number, fn: () => T): T {
  const old = phamGuard.at;
  phamGuard.at = at;
  try {
    return fn();
  } finally {
    phamGuard.at = old;
  }
}
/** Sau tai họa phàm tục ở cảnh giới đủ cao: giữ lại chút sức khỏe để nó không thành giọt nước tràn ly */
export function phamFloor(c: Character, at: number) {
  if (!c.dead && !c.cosmos && c.realm >= at && c.stats.sucKhoe < 5) c.stats.sucKhoe = 5;
}

/** 4.1.0 Q2b: trần thiệt hại khi bị phàm nhân, cướp vặt, đồng môn thấp hơn ăn hiếp. Từ Trúc Cơ mất tối đa 5% và không quá mức trần theo cảnh giới */
export const BULLY_CAP_FRAC = 0.05;
export function bullyCapOf(realm: number): number {
  return 60 * realm;
}
/** Số linh thạch bị lấy (đã làm tròn, đã áp trần theo cảnh giới). Chưa trừ tiền: gọi money(c, -n) sau */
export function bullyLoss(c: Character, frac: number): number {
  const raw = Math.max(0, Math.round(c.linhThach * frac));
  if (c.realm < 2 || c.cosmos) return raw;
  return Math.min(raw, Math.round(c.linhThach * BULLY_CAP_FRAC), bullyCapOf(c.realm));
}
/** Lấy linh thạch của nạn nhân theo tỉ lệ (có trần), trả về số đã lấy */
export function takeStones(c: Character, frac: number): number {
  const n = bullyLoss(c, frac);
  if (n > 0) money(c, -n);
  return n;
}
/** Tu vi bị hút, chiếm: từ Trúc Cơ tối đa 5% tu vi hiện có */
export function bullyCult(c: Character, amount: number): number {
  const a = Math.max(0, Math.round(amount));
  if (c.realm < 2 || c.cosmos) return a;
  return Math.min(a, Math.round(c.cultivation * BULLY_CAP_FRAC));
}

/** 4.1.0 Q3: khoảng lặng giữa hai trận bắt buộc (chặn đường, gặp người, oan gia, cướp đường, sát thủ) */
export const FORCED_GAP_YEARS = 3;
export const FORCED_GAP_MS = 60_000;
/** đồng hồ thật, mô phỏng thay bằng đồng hồ giả */
export const forcedClock = { now: () => Date.now() };
export function forcedReady(c: Character): boolean {
  if (c.lastForced !== undefined && c.age - c.lastForced < FORCED_GAP_YEARS) return false;
  if (c.forcedAt !== undefined && forcedClock.now() - c.forcedAt < FORCED_GAP_MS) return false;
  return true;
}
/** Đánh dấu một trận bắt buộc. Trả về số năm game kể từ trận bắt buộc trước (null nếu là trận đầu của kiếp) */
export function markForced(c: Character): number | null {
  const gap = c.lastForced === undefined ? null : Math.round((c.age - c.lastForced) * 10) / 10;
  c.lastForced = c.age;
  c.forcedAt = forcedClock.now();
  return gap;
}
/** Thua trận mà còn sống: 5 năm sau dễ gặp cơ duyên hơn */
export function afterLoss(c: Character) {
  if (!c.dead) c.coDuyenUntil = Math.floor(c.age) + 5;
}

export function fatal(c: Character, ctx: EffectCtx, chance: number, cause: string): string | null {
  riskMeter.n++;
  // trẻ con được trời thương hơn một chút
  const tough = c.gifts?.includes('g_menh_cung') && chance < 1 ? 0.7 : 1;
  // độ khó: mọi hiểm cảnh nguy như gốc (trước tăng 25%, người chơi kêu chết nhiều quá)
  const hard = 1;
  // khí vận chỉ giảm rủi ro theo tỉ lệ (tối đa 20%), không còn trừ thẳng làm hiểm cảnh nhỏ gần như vô hại
  const luckMul = 1 - clamp((c.stats.khiVan - 50) / 250, -0.2, 0.2);
  // 3.2.0: ba kiếp đầu của tài khoản được trời thương tới khi chọn con đường tu luyện
  const newbie = (c.lifeNo <= NEWBIE_LIVES && !c.path ? NEWBIE_FATAL_MUL : 1) * sealFatal(c);
  const p = clamp(chance * hard * tough * (chance < 1 ? youngMul(c.age) * newbie : 1) * (chance < 1 ? luckMul : 1), 0.01, chance >= 1 ? 1 : 0.95);
  if (ctx.rnd() >= p) return null;
  // 4.1.0 Q2: tai họa phàm tục không giết được người tu đạo đủ cao, chỉ gây thương
  if (phamGuard.at !== null && chance < 1 && !c.cosmos && c.realm >= phamGuard.at) {
    const dmg = Math.round(8 + Math.min(1, chance) * 30);
    c.stats.sucKhoe = Math.max(5, c.stats.sucKhoe - dmg);
    ctx.fx('hurt', tr('Thân tu đạo', 'Cultivator body'));
    return tr(` Phàm thai đã thoát, tai họa ấy chỉ làm bạn bị thương (-${dmg} sức khỏe).`, ` You are past mortal flesh now - the mishap only wounds you (-${dmg} Health).`);
  }
  if (c.oanHon) {
    c.oanHon = false;
    c.stats.sucKhoe = Math.max(20, c.stats.sucKhoe);
    ctx.fx('heal', tr('Oan hồn hộ thể', "Wronged spirit's shield"));
    return tr(' Một bóng oan hồn từ kiếp trước lao ra chắn đòn rồi tan biến. Bạn thoát chết trong gang tấc.', " A wronged spirit from a past life lunges out to block the blow, then fades away. You escape death by a hair.");
  }
  // chân truyền chính phái: sư phụ cứu một lần
  const saved = masterSaves(c);
  if (saved) {
    ctx.fx('heal', tr('Sư phụ cứu', "Saved by Master"));
    return saved;
  }
  // kiếp đầu tiên được trời thương: chưa đủ 16 tuổi thì không chết, chỉ bị thương
  if ((c.lifeNo === 1 || c.grace16) && c.age < 16) {
    c.stats.sucKhoe = Math.max(10, c.stats.sucKhoe - 20);
    ctx.fx('heal', tr('Trời thương', "Heaven's pity"));
    return tr(' Tưởng đã mất mạng, nhưng trời cao như còn thương đứa trẻ này. Bạn tỉnh lại, người đầy thương tích.', " You thought you were done for, but the heavens seem to still pity this child. You wake up, covered in wounds.");
  }
  if (c.equipped.phu_kien === 'ngoc_boi') {
    c.equipped.phu_kien = undefined;
    c.inventory = c.inventory.filter((i) => i !== 'ngoc_boi');
    c.stats.sucKhoe = 20;
    ctx.fx('heal', tr('Ngọc bội vỡ', "Jade pendant shattered"));
    return tr(' Đúng lúc tưởng chết, ngọc bội hộ thân vỡ tan, giữ lại cho bạn một hơi thở.', " Just as death seems certain, your protective jade pendant shatters, leaving you one last breath.");
  }
  c.dead = true;
  c.cause = cosmosCause(c, cause);
  c.stats.sucKhoe = 0;
  ctx.fx('death');
  return ' ' + c.cause;
}

/** Chết ở ba cõi vì nguyên nhân thường (quái, hiểm cảnh, thương thế...): thêm câu kết riêng của cõi, để không chết như người phàm */
const COSMOS_EPI: Record<'tien' | 'ma' | 'hu', string> = {
  tien: tr('Tiên thể vỡ vụn, chỉ còn chút tiên quang rơi xuống nhân gian như mưa sao.', "Your immortal body shattered, and only a little immortal light fell to the mortal world like a meteor shower."),
  ma: tr('Ma hồn tan vào huyết hải, Ma giới chẳng ai còn nhắc tên.', "Your demon soul dissolved into the blood sea, and no one in the Demon Realm speaks your name anymore."),
  hu: tr('Thân thể tan vào hư không, như chưa từng tồn tại.', "Your body dissolved into the void, as if you had never existed."),
};
export function cosmosCause(c: Character, cause: string): string {
  if (!c.cosmos || /tiên giới|Tiên Ma|Trảm Tiên|Thiên Đình|Ma giới|huyết hải|hư không|Lôi Bộ|tiên quang|immortal realm|demon realm|heavenly court|blood sea|sea of blood|the void|thunder ministry|immortal light/i.test(cause)) return cause;
  return `${cause} ${COSMOS_EPI[c.cosmos]}`;
}

/** Không cha không mẹ: cô nhi, trẻ bị bỏ ở chùa, mệnh thiên sát cô tinh. Tuổi thơ không có cảnh cha mẹ, ông bà. */
export const isOrphan = (c: Character) => c.originId === 'co_nhi' || c.originId === 'chua' || !!c.gifts?.includes('g_co_tinh');
/** Câu chữ nhắc tới cha mẹ, ông bà ruột */
export const FAMILY_RE = /(^|[^\p{L}])(mẹ|cha|ông nội|bà nội|ông ngoại|bà ngoại|ông bà|cha mẹ|bà ru|nhà mình|anh họ|mother|father|mom|dad|grandma|grandpa|grandmother|grandfather|parents|cousin)(?![\p{L}])/iu;
