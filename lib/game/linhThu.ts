import { PETS, adopt, petOf } from './pets';
import { LEGEND_PETS } from './petLegend';
import { addCult, dao, hurt, money, stat } from './helpers';
import type { Character, Choice, EffectCtx, Element, GameEvent } from './types';
import type { Monster } from './combat';
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
  // 4.2.0: thú vượt tầm chủ, chưa đủ thân thiết thì có thể bỏ đi (chống nuôi thú quá mạnh từ sớm)
  const over = RANK_ORDER.indexOf(rankNow(id, petEvo(c))) - RANK_ORDER.indexOf(maxRankFor(c));
  if (over > 0 && petLv(c) < 10 && rnd() < LEAVE_PER_YEAR * over) {
    const name = petTitle(c);
    c.pet = false;
    c.petOf = undefined;
    ctx.log(tr(`${name} vốn là linh thú cao giai, thấy chủ còn non kém nên một đêm lặng lẽ bỏ đi.`, `Your ${name}, a high-rank beast, finds its master too weak and slips away one night.`), 'bad');
    return;
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


export const DI_THU_EVENT: GameEvent = {
  id: 'di_thu',
  minRealm: 3,
  weight: 0.8,
  once: true,
  title: tr('Dị thú xuất thế', 'A strange beast appears'),
  pet: (c) => pickBy(SSR_LEGENDS, c),
  text: (c) => LEGEND_PETS[pickBy(SSR_LEGENDS, c)].meet,
  choices: (c) => {
    const id = pickBy(SSR_LEGENDS, c);
    const name = LEGEND_PETS[id].name;
    return [
      meetChoice(c, id),
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
  pet: (c) => pickBy(SSS_LEGENDS, c),
  text: (c) => LEGEND_PETS[pickBy(SSS_LEGENDS, c)].meet,
  choices: (c) => {
    const id = pickBy(SSS_LEGENDS, c);
    const name = LEGEND_PETS[id].name;
    return [
      meetChoice(c, id),
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


// ======================= 4.2.0: gặp thú kiểu Pokémon =======================
/** Rank tối đa chủ giữ được lâu dài theo cảnh giới; vượt quá thì thú có thể bỏ đi */
export function maxRankFor(c: Character): PetRank {
  if (c.cosmos || c.realm >= 5) return 'SSS';
  if (c.realm >= 3) return 'SSR';
  if (c.realm >= 2) return 'SR';
  return 'R';
}
export const LEAVE_PER_YEAR = 0.05;

/** Tỉ lệ rank khi gặp thú thường (theo cảnh giới lúc gặp). SSS chỉ đến từ sự kiện Thần thú. */
export const RANK_ODDS: { from: number; label: string; odds: Partial<Record<PetRank, number>> }[] = [
  { from: 0, label: tr('Phàm nhân, Luyện Khí', 'Mortal, Qi Refining'), odds: { N: 0.6, R: 0.3, SR: 0.1 } },
  { from: 2, label: tr('Trúc Cơ', 'Foundation'), odds: { N: 0.4, R: 0.35, SR: 0.22, SSR: 0.03 } },
  { from: 3, label: tr('Kim Đan trở lên', 'Golden Core and up'), odds: { N: 0.25, R: 0.35, SR: 0.3, SSR: 0.1 } },
];
export function oddsRow(c: Character) {
  const r = c.cosmos ? 99 : c.realm;
  return [...RANK_ODDS].reverse().find((x) => r >= x.from) ?? RANK_ODDS[0];
}

/** Dòng họ thú: mỗi kịch bản là một họ, có loài ở nhiều rank. Mảng nhiều loài thì chọn theo hoàn cảnh. */
type Fam = Partial<Record<PetRank, string[]>>;
export const FAMILIES: Record<string, Fam> = {
  chuot: { N: ['chuot_xam', 'chuot_bach'], SR: ['kim_thu', 'xich_chi'], SSR: ['thu_vuong'] },
  soi: { N: ['soi_con'], SR: ['hac_lang', 'xich_lang', 'bang_lang'], SSR: ['bach_lang'] },
  ho: { N: ['ho_ly'], SR: ['tuyet_ho', 'hoa_ho'] },
  ran: { R: ['ran_con'], SR: ['bach_xa'] },
  gau: { N: ['hung_con'], SR: ['tuyet_hung'] },
  loc: { R: ['mai_loc'], SR: ['linh_loc'] },
  dat: { R: ['tam_linh'], SSR: ['tho_long'] },
  hoa: { R: ['nam_linh'], SR: ['thuc_nhan_hoa'] },
  lua: { R: ['slime'], SR: ['hoa_linh_dich', 'hoa_ho'] },
  hang: { N: ['doi'], R: ['ong_vang'], SR: ['huyet_buc', 'bang_phong'] },
  troi: { N: ['dai_bang'], R: ['su_tu_con'] },
  nha: { N: ['cho_vang'], R: ['su_tu_con'] },
  thuong: { R: ['su_tu_con'], SR: ['linh_loc'] },
};
const snowy = (c: Character) => c.region === 'tuyet_vuc' || c.region === 'bac_mac';
function hash(...xs: (string | number)[]): number {
  let h = 2166136261;
  for (const x of String(xs.join('|'))) h = Math.imul(h ^ x.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967296;
}
/** Chọn loài trong họ theo hoàn cảnh */
function pickIn(c: Character, ids: string[], r: number): string {
  if (ids.includes('bang_lang') && snowy(c)) return 'bang_lang';
  if (ids.includes('xich_lang') && c.daoTam <= -30) return 'xich_lang';
  if (ids.includes('tuyet_ho') && snowy(c)) return 'tuyet_ho';
  if (ids.includes('bang_phong') && snowy(c)) return 'bang_phong';
  if (ids.includes('huyet_buc') && c.daoTam <= -20) return 'huyet_buc';
  const pool = ids.filter((x) => x !== 'bang_lang' && x !== 'xich_lang');
  const list = pool.length ? pool : ids;
  return list[Math.floor(r * list.length) % list.length];
}
/** Tung rank theo cảnh giới (cố định theo kiếp, tuổi, kịch bản để lời kể và lựa chọn khớp nhau) rồi chọn loài trong họ */
export function familyPet(c: Character, fam: string, key: string, maxRank?: PetRank): string {
  const F = FAMILIES[fam] ?? FAMILIES.nha;
  const odds = oddsRow(c).odds;
  let x = hash(c.lookSeed ?? 1, c.lifeNo, Math.floor(c.age), key);
  let rank: PetRank = 'N';
  for (const r of RANK_ORDER) {
    const p = odds[r] ?? 0;
    if (x < p) {
      rank = r;
      break;
    }
    x -= p;
  }
  if (maxRank && RANK_ORDER.indexOf(rank) > RANK_ORDER.indexOf(maxRank)) rank = maxRank;
  // họ không có rank này thì lùi xuống rank gần nhất có, hết thì lấy rank thấp nhất của họ
  let i = RANK_ORDER.indexOf(rank);
  while (i >= 0 && !F[RANK_ORDER[i]]) i--;
  const tier = i >= 0 ? RANK_ORDER[i] : RANK_ORDER.find((r) => F[r])!;
  return pickIn(c, F[tier]!, hash(c.lookSeed ?? 1, key, 'loai'));
}

/** Cấp của thú khi gặp: theo rank, không theo chủ. Cấp người: Luyện Khí 1-9, Trúc Cơ 10-12, Kim Đan 13-15 ... Độ Kiếp 25-27 */
const BEAST_LV: Record<PetRank, [number, number]> = { N: [1, 5], R: [4, 10], SR: [9, 15], SSR: [13, 22], SSS: [23, 30] };
export function beastLv(id: string, c: Character): number {
  const [a, b] = BEAST_LV[baseRank(id)];
  return a + Math.floor(hash(c.lookSeed ?? 1, c.lifeNo, id) * (b - a + 1));
}
const CATCH_BASE: Record<PetRank, number> = { N: 0.95, R: 0.8, SR: 0.6, SSR: 0.45, SSS: 0.35 };
const CATCH_CAP: Record<PetRank, number> = { N: 0.97, R: 0.93, SR: 0.85, SSR: 0.7, SSS: 0.4 };
/** Tỉ lệ thu phục: cao cấp hơn thú thì dễ, thấp hơn thì khó nhanh; thú càng kiệt sức càng dễ; khí vận góp chút */
export function catchChance(c: Character, id: string, lv: number, hpLeft = 1): number {
  const r = baseRank(id);
  const gap = combatLv(c) - lv;
  const g = gap >= 0 ? Math.min(0.3, gap * 0.025) : gap * 0.035;
  const p = CATCH_BASE[r] + g + (1 - hpLeft) * 0.12 + (c.stats.khiVan - 50) / 600;
  return Math.max(0.03, Math.min(CATCH_CAP[r], p));
}
const REALM_BASE = [0, 0, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
function combatLv(c: Character): number {
  if (c.realm === 0) return 0;
  return (REALM_BASE[c.realm] ?? 24) + c.layer;
}

/** Lựa chọn khi gặp thú: đủ sức (có tu vi, từ 10 tuổi) thì đánh rồi thu phục; trẻ con thì dụ về nuôi theo tỉ lệ */
export function meetChoice(c: Character, id: string): Choice {
  const lv = beastLv(id, c);
  const name = baseName(id);
  const r = baseRank(id);
  if (c.realm >= 1 && c.age >= 10) {
    return {
      label: tr(`Giao chiến thu phục ${name} (${r}, Lv${lv})`, `Fight to tame the ${name} (${r}, Lv${lv})`),
      hint: tr('thắng mới có cơ hội thu phục', 'only a win gives a chance to tame'),
      lean: 'chinh',
      run: (ch) => {
        ch.beastFight = { id, lv };
        return tr(`Bạn thủ thế. ${name} gầm khẽ, lông dựng đứng.`, `You take your stance. The ${name} growls, fur on end.`);
      },
    };
  }
  const p = catchChance(c, id, lv);
  return {
    label: tr(`Dụ ${name} về nuôi (${r})`, `Coax the ${name} home (${r})`),
    hint: tr(`khoảng ${Math.round(p * 100)}%`, `about ${Math.round(p * 100)}%`),
    lean: 'chinh',
    run: (ch, ctx) => {
      if (ctx.rnd() < p) return tr(`${name} ngập ngừng rồi theo bạn về nhà.`, `The ${name} hesitates, then follows you home.`) + adopt(ch, id, ctx);
      return tr(`${name} hít hít tay bạn rồi chạy biến vào rừng.`, `The ${name} sniffs your hand, then bolts into the woods.`);
    },
  };
}

/** Quái để đánh: dựng từ linh thú (Battle vẽ bằng sprite thú qua petId) */
/** 4.3.0: trận thu phục đánh theo công pháp (chiêu, thiêu, độc, hút máu) nên thú hoang dày máu hơn, rank càng cao càng dày,
 * giữ tỉ lệ thu phục như thiết kế (scripts/sim-thu-phuc.ts): [nhân máu, nhân công] */
export const BEAST_MUL: Record<PetRank, [number, number]> = { N: [1, 1], R: [1.2, 1], SR: [1.7, 1.05], SSR: [2, 1.1], SSS: [2.6, 1.2] };
export function beastStats<T extends { hp: number; atk: number }>(ms: T, id: string, k = 1): T {
  const [h, a] = BEAST_MUL[baseRank(id)];
  return { ...ms, hp: Math.round(ms.hp * h * k), atk: Math.round(ms.atk * a) };
}
export function beastMonster(id: string, lv: number): Monster {
  return {
    id: 'linh_thu_' + id,
    petId: id,
    name: baseName(id),
    lv,
    place: tr('Hoang dã', 'The wilds'),
    shape: 'thu',
    body: '#8a6a4a',
    accent: '#c8a070',
    eye: '#ffd36b',
    desc: '',
    el: ELEM_OF[familyOfEl(id)],
  };
}
const ELEM_OF: Record<string, Element> = { kim: 'kim', moc: 'moc', thuy: 'thuy', hoa: 'hoa', tho: 'tho' };
function familyOfEl(id: string): string {
  if (/hoa|xich|lua|tat_phuong|phuong/.test(id)) return 'hoa';
  if (/bang|tuyet|thanh_giao|huyen_vu/.test(id)) return 'thuy';
  if (/nam|loc|hoa_|tam|thanh_long|thuc/.test(id)) return 'moc';
  if (/kim|bach|ho$|chuot/.test(id)) return 'kim';
  return 'tho';
}

/** Sau khi thắng (hoặc đánh thú kiệt sức): thẻ thu phục */
export const CATCH_EVENT_ID = 'thu_phuc_linh_thu';
export function catchEvent(c: Character): GameEvent {
  const t = c.catchTarget;
  const id = t?.id ?? 'cho_vang';
  const name = baseName(id);
  const p = t ? catchChance(c, id, t.lv, t.hp) : 0;
  return {
    id: CATCH_EVENT_ID,
    title: tr(`Thu phục ${name}`, `Tame the ${name}`),
    pet: () => id,
    text: () =>
      t && t.hp <= 0
        ? tr(`${name} gục xuống, thở dốc, mắt vẫn còn ngang ngạnh. Thú ${baseRank(id)} không phải lúc nào cũng chịu khuất phục.`, `The ${name} collapses, panting, eyes still defiant. A rank ${baseRank(id)} beast does not always submit.`)
        : tr(`${name} kiệt sức nhưng chưa gục, vẫn gầm gừ nhìn bạn.`, `The ${name} is exhausted but still standing, snarling at you.`),
    choices: () => [
      {
        label: tr(`Thu phục ${name}`, `Tame the ${name}`),
        hint: tr(`khoảng ${Math.round(p * 100)}%${c.pet ? `, ${petTitle(c)} sẽ bỏ đi` : ''}`, `about ${Math.round(p * 100)}%${c.pet ? `, your ${petTitle(c)} will leave` : ''}`),
        lean: 'chinh',
        run: (ch, ctx) => {
          ch.catchTarget = null;
          if (ctx.rnd() < p) {
            const note = adopt(ch, id, ctx);
            stat(ch, 'khiVan', baseRank(id) === 'SSS' ? 5 : 1);
            return tr(`${name} cúi đầu, để bạn đặt tay lên trán. Từ nay nó theo bạn.`, `The ${name} bows its head and lets you touch its brow. From now on it follows you.`) + note;
          }
          if (ctx.rnd() < 0.3) return tr(`${name} vùng dậy cào một phát rồi thoát đi. `, `The ${name} lashes out with a claw and escapes. `) + hurt(ch, 8, ctx);
          return tr(`${name} vùng ra, chạy mất vào rừng sâu. Duyên chưa tới.`, `The ${name} breaks free and vanishes into the deep forest. The time is not yet right.`);
        },
      },
      {
        label: tr('Thả nó đi', 'Let it go'),
        lean: 'trung',
        run: (ch) => {
          ch.catchTarget = null;
          stat(ch, 'khiVan', 1);
          dao(ch, 1);
          return tr(`Bạn lùi lại. ${name} nhìn bạn một lúc rồi bỏ đi.`, `You step back. The ${name} watches you a moment, then leaves.`);
        },
      },
    ],
  };
}
