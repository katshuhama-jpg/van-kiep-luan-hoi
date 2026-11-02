import { PETS, adopt, petOf } from './pets';
import { LEGEND_PETS } from './petLegend';
import { addCult, dao, hurt, money, stat } from './helpers';
import type { Character, EffectCtx, GameEvent } from './types';
import { tr } from '../i18n';

/**
 * 4.2.0 Hệ thống linh thú: rank theo loài, thân thiết, tiến hóa 3 bậc, tác dụng theo họ, hộ chủ trong trận, huyết mạch.
 * Ghi chú thiết kế: docs/research/cong-phap-theo-dao-va-rank-linh-thu.md
 */

export type PetRank = 'N' | 'R' | 'SR' | 'SSR' | 'SSS';
export const RANK_ORDER: PetRank[] = ['N', 'R', 'SR', 'SSR', 'SSS'];
export const RANK_INFO: Record<PetRank, { name: string; note: string; mul: number }> = {
  N: { name: tr('Phổ thông', 'Common'), note: tr('Thú thường, gặp ở làng, ở rừng', 'Ordinary beasts of village and forest'), mul: 1 },
  R: { name: tr('Hiếm', 'Rare'), note: tr('Có linh tính, sống quanh linh mạch', 'Spirit-touched, living near ley lines'), mul: 1.15 },
  SR: { name: tr('Siêu hiếm', 'Super rare'), note: tr('Khai linh trí, mang ngũ hành', 'Awakened, bearing an element'), mul: 1.35 },
  SSR: { name: tr('Yêu vương, dị thú', 'Beast kings, strange beasts'), note: tr('Bá chủ một phương, dị thú Sơn Hải Kinh', 'Lords of a region, beasts of the Classic of Mountains and Seas'), mul: 1.7 },
  SSS: { name: tr('Thần thú', 'Divine beasts'), note: tr('Tứ linh: Long, Lân, Quy, Phượng', 'The Four Benevolent Beasts'), mul: 2.2 },
};

const BASE_RANK: Record<string, PetRank> = {
  cho_vang: 'N', chuot_xam: 'N', chuot_bach: 'N', dai_bang: 'N', doi: 'N', soi_con: 'N', ho_ly: 'N', hung_con: 'N',
  ong_vang: 'R', nam_linh: 'R', slime: 'R', ran_con: 'R', su_tu_con: 'R', mai_loc: 'R', tam_linh: 'R',
  hac_lang: 'SR', xich_lang: 'SR', tuyet_ho: 'SR', linh_loc: 'SR', thuc_nhan_hoa: 'SR', bang_phong: 'SR', hoa_linh_dich: 'SR', kim_thu: 'SR',
  bang_lang: 'SR', hoa_ho: 'SR', huyet_buc: 'SR', tuyet_hung: 'SR', bach_xa: 'SR', xich_chi: 'SR',
  bach_lang: 'SSR', thu_vuong: 'SSR', tho_long: 'SSR', kim_si: 'SSR', tat_phuong: 'SSR', cuu_vi: 'SSR', con_bang: 'SSR', bach_ho: 'SSR', thanh_giao: 'SSR', cung_ky: 'SSR',
  thanh_long: 'SSS', ky_lan: 'SSS', huyen_vu: 'SSS', hoa_phuong: 'SSS',
};
export const baseRank = (id: string): PetRank => BASE_RANK[id] ?? 'R';
export const allPetIds = () => [...Object.keys(PETS), ...Object.keys(LEGEND_PETS)];

/** Họ linh thú quyết định tác dụng: hộ chủ (đánh), phúc (vận, tiền), dưỡng (sức khỏe, tu vi) */
export type PetFamily = 'ho_chu' | 'phuc' | 'duong';
const FAMILY: Record<string, PetFamily> = {
  soi_con: 'ho_chu', hac_lang: 'ho_chu', xich_lang: 'ho_chu', bang_lang: 'ho_chu', bach_lang: 'ho_chu', cho_vang: 'ho_chu', hung_con: 'ho_chu', tuyet_hung: 'ho_chu',
  su_tu_con: 'ho_chu', dai_bang: 'ho_chu', kim_si: 'ho_chu', bach_ho: 'ho_chu', cung_ky: 'ho_chu', thanh_giao: 'ho_chu', thanh_long: 'ho_chu',
  ho_ly: 'phuc', tuyet_ho: 'phuc', hoa_ho: 'phuc', chuot_xam: 'phuc', chuot_bach: 'phuc', kim_thu: 'phuc', thu_vuong: 'phuc', xich_chi: 'phuc', ong_vang: 'phuc', cuu_vi: 'phuc', ky_lan: 'phuc',
};
export const familyOf = (id: string): PetFamily => FAMILY[id] ?? 'duong';
export const FAMILY_NAME: Record<PetFamily, string> = { ho_chu: tr('Hộ chủ', 'Guardian'), phuc: tr('Chiêu phúc', 'Fortune'), duong: tr('Dưỡng thân', 'Nurture') };

export const petId = (c: Character): string => petOf(c);
export const isLegend = (id: string) => !!LEGEND_PETS[id];
export const petEvo = (c: Character) => Math.min(2, c.petEvo ?? 0);

/** Rank hiện tại: tiến hóa nâng 1 bậc mỗi lần, thú thường tối đa SSR; thần thú giữ SSS */
export function rankNow(id: string, evo: number): PetRank {
  const b = RANK_ORDER.indexOf(baseRank(id));
  if (b >= 4) return 'SSS';
  return RANK_ORDER[Math.min(3, b + (b >= 3 ? 0 : evo))];
}
export const rankMul = (id: string, evo: number) => RANK_INFO[rankNow(id, evo)].mul * (1 + 0.15 * evo);

/** Thân thiết: cấp tối đa theo bậc tiến hóa */
export const LV_CAP = [10, 20, 30];
export function petLv(c: Character): number {
  return Math.min(LV_CAP[petEvo(c)], 1 + Math.floor((c.petExp ?? 0) / 2));
}
export function lvPct(c: Character): number {
  const lv = petLv(c);
  if (lv >= LV_CAP[petEvo(c)]) return 1;
  return ((c.petExp ?? 0) % 2) / 2;
}

/** Điều kiện tiến hóa lên bậc kế */
export const EVO_REALM = [2, 4]; // Trúc Cơ, Nguyên Anh
export function evoNeed(c: Character): { lv: number; realm: number; okLv: boolean; okRealm: boolean } | null {
  const e = petEvo(c);
  if (e >= 2) return null;
  const lv = LV_CAP[e];
  const realm = EVO_REALM[e];
  return { lv, realm, okLv: petLv(c) >= lv, okRealm: c.realm >= realm || !!c.cosmos };
}
export function canEvolve(c: Character): boolean {
  const n = c.pet ? evoNeed(c) : null;
  return !!n && n.okLv && n.okRealm;
}

const EVO_TITLE = ['', tr('Linh', 'Spirit'), tr('Thánh', 'Holy')];
const cap = (s: string) => s.replace(/(^|\s)\S/g, (x) => x.toUpperCase());
export function baseName(id: string): string {
  return LEGEND_PETS[id]?.name ?? cap(PETS[id]?.name ?? tr('linh thú', 'spirit beast'));
}
export function petTitle(c: Character): string {
  const id = petId(c);
  const e = petEvo(c);
  if (!e || isLegend(id)) return baseName(id);
  return tr(`${EVO_TITLE[e]} ${baseName(id)}`, `${EVO_TITLE[e]} ${baseName(id)}`);
}

export function evolve(c: Character, ctx: EffectCtx): string | null {
  if (!canEvolve(c)) return null;
  const id = petId(c);
  const before = rankNow(id, petEvo(c));
  c.petEvo = petEvo(c) + 1;
  const after = rankNow(id, c.petEvo);
  ctx.fx('breakthrough', tr('TIẾN HÓA', 'EVOLVED'));
  const up = after !== before ? tr(` Rank ${before} lên ${after}.`, ` Rank ${before} to ${after}.`) : '';
  return tr(`${baseName(id)} lột xác dưới ánh trăng, linh khí cuộn quanh người. Nay là ${petTitle(c)}.${up}`, `${baseName(id)} sheds its old form under the moon, wreathed in spirit qi. It is now the ${petTitle(c)}.${up}`);
}

/** Lời mô tả tác dụng theo họ, bậc và rank (dùng cho màn linh thú) */
export function effectLines(c: Character): { tag: string; text: string; on: boolean }[] {
  const id = petId(c);
  const e = petEvo(c);
  const k = rankMul(id, e);
  const f = familyOf(id);
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const main =
    f === 'ho_chu'
      ? tr(`Trong trận ${pct(strikeChance(id, e))} lao vào đánh một đòn bằng ${pct(strikePower(id, e))} sức bạn`, `In battle, ${pct(strikeChance(id, e))} chance to strike for ${pct(strikePower(id, e))} of your power`)
      : f === 'phuc'
        ? tr(`Mỗi năm ${pct(Math.min(0.6, 0.1 * k))} tha về linh thạch hay thêm khí vận`, `Each year ${pct(Math.min(0.6, 0.1 * k))} chance to bring back spirit stones or luck`)
        : tr(`Mỗi năm hồi ${Math.round(1 + k)} sức khỏe, tu luyện nhanh thêm ${Math.round(2 * k)}%`, `Each year restores ${Math.round(1 + k)} health, cultivation +${Math.round(2 * k)}%`);
  const lines = [{ tag: FAMILY_NAME[f], text: main, on: true }];
  lines.push({ tag: tr('Bậc 2', 'Stage 2'), text: f === 'ho_chu' ? tr('Đánh cùng chủ cả khi bị chặn đường', 'Also fights when you are ambushed') : f === 'phuc' ? tr('Đồ rơi từ quái tăng 10%', 'Monster drops +10%') : tr('Tâm ma mỗi năm giảm 1', 'Inner demon -1 each year'), on: e >= 1 });
  lines.push({ tag: tr('Bậc 3', 'Stage 3'), text: tr('Khi chết để lại huyết mạch cho kiếp sau', 'Leaves a bloodline for your next life when it dies'), on: e >= 2 });
  return lines;
}

/** Hộ chủ trong trận */
export function strikeChance(id: string, evo: number): number {
  return familyOf(id) === 'ho_chu' ? 0.18 + 0.05 * evo : 0.08;
}
export function strikePower(id: string, evo: number): number {
  return (0.25 + 0.1 * evo) * RANK_INFO[rankNow(id, evo)].mul;
}
/** Trả về sức đánh (nhân với công của bạn) nếu linh thú ra đòn lượt này, không thì null */
export function petStrike(c: Character, rnd: () => number, ambush = false): number | null {
  if (!c.pet || c.dead || c.age < 8) return null;
  const id = petId(c);
  const e = petEvo(c);
  if (ambush && (familyOf(id) !== 'ho_chu' || (e < 1 && !isLegend(id)))) return null;
  if (rnd() >= strikeChance(id, e)) return null;
  c.petExp = (c.petExp ?? 0) + 0.25;
  return strikePower(id, e);
}

/** Mỗi năm: thân thiết, tác dụng theo họ, huyết mạch; đổi linh thú thì tính lại từ đầu */
export function petYear(c: Character, ctx: EffectCtx, rnd: () => number): void {
  if (!c.pet) return;
  const id = petId(c);
  if (c.petOf !== id) {
    c.petOf = id;
    c.petExp = 0;
    c.petEvo = 0;
    const blood = c.huyetMach?.[0];
    c.petBlood = blood && blood.id !== id ? blood.id : blood?.id ?? null;
    if (c.petBlood) ctx.log(tr(`${baseName(id)} mang trong người huyết mạch ${baseName(c.petBlood)} từ kiếp trước.`, `${baseName(id)} carries the ${baseName(c.petBlood)} bloodline from a past life.`), 'good');
  }
  const before = petLv(c);
  c.petExp = (c.petExp ?? 0) + 1;
  if (petLv(c) > before && petLv(c) % 5 === 0) ctx.log(tr(`${petTitle(c)} thân thiết với bạn lên cấp ${petLv(c)}.`, `Your ${petTitle(c)} reaches bond level ${petLv(c)}.`), 'good');
  if (canEvolve(c) && !c.petEvoHint) {
    c.petEvoHint = true;
    ctx.log(tr(`${petTitle(c)} cứ nhìn trăng không ngủ. Nó đã đủ sức tiến hóa (mở màn linh thú để xem).`, `Your ${petTitle(c)} stares at the moon all night. It is ready to evolve (open the beast screen).`), 'good');
  }
  const e = petEvo(c);
  const k = rankMul(id, e);
  const fam = familyOf(id);
  const doFam = (f: PetFamily, w: number) => {
    if (f === 'phuc' && rnd() < Math.min(0.6, 0.1 * k) * w) {
      if (rnd() < 0.5) stat(c, 'khiVan', 1);
      else money(c, Math.round((6 + 10 * c.realm) * k));
    } else if (f === 'duong') {
      stat(c, 'sucKhoe', Math.round((1 + k) * w));
      if (e >= 1 && rnd() < 0.5 * w) stat(c, 'tamMa', -1);
    }
  };
  doFam(fam, 1);
  if (c.petBlood && familyOf(c.petBlood) !== fam) doFam(familyOf(c.petBlood), 0.5);
}

/** Phúc thú bậc 2 trở lên: đồ rơi từ quái tăng 10% */
export function petDropMul(c: Character): number {
  return c.pet && familyOf(petId(c)) === 'phuc' && petEvo(c) >= 1 ? 1.1 : 1;
}

/** Tu luyện nhanh thêm nhờ linh thú họ dưỡng thân (nhân vào tu vi mỗi năm) */
export function petCultMul(c: Character): number {
  if (!c.pet) return 1;
  const id = petId(c);
  const own = familyOf(id) === 'duong' ? 0.02 * rankMul(id, petEvo(c)) : 0;
  const blood = c.petBlood && familyOf(c.petBlood) === 'duong' ? 0.01 : 0;
  return 1 + own + blood;
}

/** Cuối kiếp: linh thú bậc 3 để lại huyết mạch (giữ 3 dòng mới nhất) */
export function bloodOnDeath(c: Character, list: { id: string; life: number }[] = []): { id: string; life: number }[] {
  if (!c.pet || petEvo(c) < 2) return list;
  return [{ id: petId(c), life: c.lifeNo }, ...list.filter((x) => x.id !== petId(c))].slice(0, 3);
}

// ---------- Gặp dị thú (SSR) và thần thú (SSS) ----------
const SSR_LEGENDS = ['kim_si', 'tat_phuong', 'cuu_vi', 'con_bang', 'bach_ho', 'thanh_giao', 'cung_ky'];
const SSS_LEGENDS = ['thanh_long', 'ky_lan', 'huyen_vu', 'hoa_phuong'];
const pickBy = (arr: string[], c: Character) => arr[((c.lookSeed ?? 3) + c.lifeNo * 7) % arr.length];

function tameChance(c: Character, sss: boolean): number {
  const base = sss ? 0.18 : 0.35;
  const luck = c.stats.khiVan / (sss ? 400 : 300);
  const heart = c.daoTam >= 30 ? 0.12 : c.daoTam <= -30 ? -0.08 : 0;
  const bond = c.pet && petEvo(c) >= 2 ? 0.1 : 0;
  return Math.max(0.05, Math.min(0.8, base + luck + heart + bond));
}

export const DI_THU_EVENT: GameEvent = {
  id: 'di_thu',
  minRealm: 3,
  weight: 0.8,
  once: true,
  title: tr('Dị thú xuất thế', 'A strange beast appears'),
  text: (c) => LEGEND_PETS[pickBy(SSR_LEGENDS, c)].meet,
  choices: (c) => {
    const id = pickBy(SSR_LEGENDS, c);
    const name = LEGEND_PETS[id].name;
    const p = tameChance(c, false);
    return [
      {
        label: tr(`Thử thuần phục ${name}`, `Try to tame the ${name}`),
        hint: tr(`khoảng ${Math.round(p * 100)}%, hỏng thì bị thương`, `about ${Math.round(p * 100)}%, failure hurts`),
        lean: 'chinh',
        run: (ch, ctx) => {
          if (ctx.rnd() < p) {
            const note = adopt(ch, id, ctx);
            dao(ch, 2);
            return tr(`${name} cúi đầu, để bạn đặt tay lên trán. Từ nay nó theo bạn.`, `The ${name} bows its head and lets you touch its brow. From now on it follows you.`) + note;
          }
          return tr(`${name} hất bạn văng xa ba trượng rồi bỏ đi. `, `The ${name} flings you thirty paces and leaves. `) + hurt(ch, 22, ctx);
        },
      },
      {
        label: tr('Cúi chào rồi lui', 'Bow and withdraw'),
        lean: 'trung',
        run: (ch) => {
          stat(ch, 'khiVan', 2);
          stat(ch, 'tamCanh', 3);
          return tr(`${name} nhìn bạn một lúc rồi đi. Bạn thấy lòng nhẹ hẳn.`, `The ${name} watches you a while, then leaves. Your heart feels lighter.`);
        },
      },
      {
        label: tr('Săn lấy tinh huyết', 'Hunt it for its essence blood'),
        hint: tr('nguy hiểm', 'dangerous'),
        lean: 'ta',
        run: (ch, ctx) => {
          dao(ch, -10);
          if (ctx.rnd() < 0.4) {
            money(ch, 300 * (ch.realm + 1));
            addCult(ch, 60 * ch.realm);
            return tr(`Bạn giết được ${name}, lấy tinh huyết luyện thành đan. Trời đất u ám ba ngày.`, `You slay the ${name} and refine its essence blood into a pill. The sky stays dark for three days.`);
          }
          return tr(`${name} phản đòn, bạn thoát chết trong gang tấc. `, `The ${name} fights back; you barely escape with your life. `) + hurt(ch, 35, ctx);
        },
      },
    ];
  },
};

export const THAN_THU_EVENT: GameEvent = {
  id: 'than_thu',
  minRealm: 5,
  weight: 0.25,
  once: true,
  title: tr('Thần thú giáng thế', 'A divine beast descends'),
  text: (c) => LEGEND_PETS[pickBy(SSS_LEGENDS, c)].meet,
  choices: (c) => {
    const id = pickBy(SSS_LEGENDS, c);
    const name = LEGEND_PETS[id].name;
    const p = tameChance(c, true);
    return [
      {
        label: tr(`Xin ${name} nhận làm chủ`, `Ask the ${name} to accept you`),
        hint: tr(`khoảng ${Math.round(p * 100)}%, đạo tâm chính và khí vận cao thì dễ hơn`, `about ${Math.round(p * 100)}%, easier with a righteous heart and high luck`),
        lean: 'chinh',
        run: (ch, ctx) => {
          if (ctx.rnd() < p) {
            const note = adopt(ch, id, ctx);
            stat(ch, 'khiVan', 5);
            return tr(`${name} hạ mình trước bạn. Chuông chùa khắp vùng tự ngân, thần thú đã có chủ.`, `The ${name} lowers itself before you. Temple bells ring on their own across the land: the divine beast has a master.`) + note;
          }
          stat(ch, 'tamCanh', 4);
          return tr(`${name} nhìn bạn, lắc đầu rồi bay vào mây. Duyên chưa tới.`, `The ${name} looks at you, shakes its head and rises into the clouds. The time is not yet right.`);
        },
      },
      {
        label: tr('Quỳ lạy cầu phúc', 'Kneel and pray for blessing'),
        lean: 'trung',
        run: (ch) => {
          stat(ch, 'khiVan', 4);
          ch.lifespan += 5;
          return tr(`${name} thổi một hơi lên trán bạn. Thọ nguyên thêm 5 năm.`, `The ${name} breathes upon your brow. Your lifespan grows by 5 years.`);
        },
      },
    ];
  },
};
