import { sealLv } from './forge';
import { applyProphecy, checkNewbieGoal, newbieGoal, omenIs } from './hook';
import { loreDone, lore2Count, quyNhatDone } from './lore';
import { ksBreak, ksOf, ksPhuc } from './luanHoi';
import { CHAN_TRUYEN_BREAK, leaveSect, promoteByRealm, rankOf, sectConflict, sectCultMul } from './sect';
import {
  ITEMS,
  fxText,
  gearFx,
  FAMILY_TIERS,
  REGIONS,
  FOCUS,
  MAX_LIFE,
  ASCEND_REALM,
  TOP_REALM,
  lifeCap,
  linhCanBreak,
  BINH_CANH_FAILS,
  BINH_CANH_YEARS,
  realmName,
  HAIR_COLORS,
  HAIR_STYLES,
  HO,
  HO_KEP,
  TEN_NAM_1,
  TEN_NAM_2,
  TEN_NU_1,
  TEN_NU_2,
  LIFE_FATES,
  LINH_CAN,
  ORIGINS,
  PATHS,
  PILLS,
  grindMul,
  overworkFree,
  safeYears,
  dienThoYears,
  pillPrice,
  REALMS,
  TEN_NAM,
  TEN_NU,
  realmLabel,
} from './data';
import { BREAK_EVENT_ID, EVENTS, PATH_EVENT_ID, pathChoices } from './events';
import { maChainYear } from './sectEvents2';
import { ASCEND_MIN_AGE, anOf, destOf, keyAn, needTrial } from './nguHanhDai';
import { ASCEND_GEAR } from './items2';
import { usesVanDao } from './vanDao';
import { DO_KIEP_REALM, FAMILY_RE, isOrphan, addCult, addLife, addPill, clamp, cosmosCause, fatal, reward, wealthTier, dao, giveItem, hurt, money, needFor, pick, stat, usePill, weighted } from './helpers';
import type { Character, Choice, EffectCtx, Fx, FxKind, GameEvent, Meta, PendingEvent, Tone } from './types';
import { applyGifts, giftOf, hasGift } from './gacha';
import { afterChoice, beforeChoice, righteousPeril } from './fate';
import { childLine } from './childhood';
import { petName } from './pets';
import { ELEMENTS } from './nguhanh';
import { tr } from '../i18n';
import { nameOf } from '../hanviet';

export const rnd = () => Math.random();

const GAIN = [6, 30, 30, 34, 38, 42, 46, 50, 70, 85, 100, 120];

export function emptyMeta(): Meta {
  return { phucDuyen: 0, nghiep: 0, lives: 0, talents: [], enemy: null };
}

function lifeMult(c: Character, talents: string[] = []) {
  let m = c.lifeMul ?? 1;
  if (talents.includes('tho')) m *= 1.2;
  if (c.path === 'phat') m *= 1.2;
  if (c.race === 'yeu') m *= 1.1;
  return m;
}

export function genName(gender: 'nam' | 'nu'): string {
  const ho = rnd() < 0.15 ? pick(rnd, HO_KEP) : pick(rnd, HO);
  const r = rnd();
  let ten: string;
  if (r < 0.2) ten = pick(rnd, gender === 'nam' ? TEN_NAM : TEN_NU);
  else if (r < 0.35) ten = pick(rnd, gender === 'nam' ? TEN_NAM_2 : TEN_NU_1);
  else ten = gender === 'nam' ? `${pick(rnd, TEN_NAM_1)} ${pick(rnd, TEN_NAM_2)}` : `${pick(rnd, TEN_NU_1)} ${pick(rnd, TEN_NU_2)}`;
  // tên luôn dựng bằng âm Hán Việt; bản tiếng Anh đổi sang pinyin (Lâm Huyền Lâm -> Lin Xuanlin)
  return nameOf(`${ho} ${ten}`);
}

/** Gieo lá số đầu thai: giới tính, tên, xuất thân, linh căn, nơi sinh, gia cảnh, tướng mạo. Chưa tính thiên phú. */
export function rollBase(): Character {
  const gender = rnd() < 0.5 ? 'nam' : 'nu';
  const origin = weighted(rnd, ORIGINS);
  const lc = weighted(rnd, LINH_CAN);
  const race = origin.id === 'yeu' ? 'yeu' : 'nhan';
  const hairList = Object.entries(HAIR_COLORS)
    .filter(([, h]) => (race === 'yeu' ? h.yeu || h.w <= 4 : !h.yeu))
    .map(([id, h]) => ({ id, w: h.w }));
  const hairColor = weighted(rnd, hairList).id;
  const hairStyle = Math.floor(rnd() * HAIR_STYLES[gender].length);
  const fate = weighted(rnd, LIFE_FATES);
  // nơi sinh và gia cảnh
  const region =
    race === 'yeu'
      ? REGIONS.find((r) => r.id === 'van_yeu')!
      : weighted(
          rnd,
          REGIONS.filter((r) => r.w > 0),
        );
  const birthPlace = pick(rnd, region.places);
  let famTier = FAMILY_TIERS.indexOf(weighted(rnd, FAMILY_TIERS));
  if (origin.id === 'the_gia') famTier = Math.max(famTier, 2);
  if (origin.id === 'co_nhi' || origin.id === 'chua') famTier = 0;
  if (origin.id === 'yeu') famTier = Math.min(famTier, 1);
  const fam = FAMILY_TIERS[famTier];
  const mod = region.mod as { money?: number; tamMa?: number; sucKhoe?: number; khiVan?: number; ngoTinh?: number; daoTam?: number; tamCanh?: number; lifeMul?: number };
  const lifeMul = Math.round((fate.lo + rnd() * (fate.hi - fate.lo)) * 100) / 100;
  const r = (lo: number, hi: number) => Math.round(lo + rnd() * (hi - lo));
  const c: Character = {
    name: genName(gender),
    gender,
    race,
    origin: origin.name,
    originId: origin.id,
    linhCan: lc.name,
    linhCanMul: lc.mul,
    lifeNo: 1,
    age: 0,
    lifespan: Math.round(r(60, 82) * lifeMul),
    realm: 0,
    layer: 1,
    cultivation: 0,
    stats: { tamCanh: r(35, 65), ngoTinh: r(25, 65), khiVan: r(25, 65), tamMa: r(0, 10), sucKhoe: r(70, 95) },
    daoTam: 0,
    path: null,
    sect: null,
    linhThach: Math.round((origin.money * 0.3 + fam.money) * (mod.money ?? 1)),
    inventory: ['ao_vai'],
    equipped: { ao: 'ao_vai' },
    pills: {},
    focus: 'tu_luyen',
    partner: null,
    pet: false,
    log: [],
    dead: false,
    cause: null,
    seenEvents: {},
    ascended: false,
    enemy: null,
    breakDelay: 0,
    hairColor,
    hairStyle,
    lookSeed: Math.floor(rnd() * 2 ** 31),
    element: (['kim', 'moc', 'thuy', 'hoa', 'tho'] as const)[Math.floor(rnd() * 5)],
    lifeMul,
    outfitTone: Math.floor(rnd() * 5),
    outfitCut: Math.floor(rnd() * 4),
    region: region.id,
    birthPlace: `${birthPlace}, ${region.name}`,
    familyTier: famTier,
    fateName: fate.name,
  };
  if (mod.sucKhoe) stat(c, 'sucKhoe', mod.sucKhoe);
  if (mod.khiVan) stat(c, 'khiVan', mod.khiVan);
  if (mod.ngoTinh) stat(c, 'ngoTinh', mod.ngoTinh);
  if (mod.tamMa) stat(c, 'tamMa', mod.tamMa);
  if (mod.tamCanh) stat(c, 'tamCanh', mod.tamCanh);
  if (mod.daoTam) dao(c, mod.daoTam);
  if (mod.lifeMul) {
    c.lifeMul = Math.round((c.lifeMul ?? 1) * mod.lifeMul * 100) / 100;
    c.lifespan = Math.round(c.lifespan * mod.lifeMul);
  }
  if (origin.id === 'chua') c.daoTam = 15;
  c.log.push({
    age: 0,
    tone: 'big',
    text: tr(`__KIEP__ Bạn chào đời là ${gender === 'nam' ? tr('một bé trai', "a baby boy") : tr('một bé gái', "a baby girl")} ở ${birthPlace}, ${region.name} (${region.desc}), ${origin.name.toLowerCase()}, gia cảnh ${fam.name}. Thầy bói nói bạn mang ${lc.name}.`, `__KIEP__ You are born ${gender === 'nam' ? tr('một bé trai', "a baby boy") : tr('một bé gái', "a baby girl")} in ${birthPlace}, ${region.name} (${region.desc}), ${origin.name.toLowerCase()}, into a ${fam.name} family. The fortune-teller says you carry ${lc.name}.`),
  });
  c.log.push({
    age: 0,
    tone: fate.lo < 0.85 ? 'bad' : fate.lo > 1.1 ? 'good' : 'normal',
    text: tr(`Tóc ${HAIR_COLORS[hairColor].name}, lớn lên sẽ để ${HAIR_STYLES[gender][hairStyle]}. Bà mụ xem tướng bảo: mệnh ${fate.name}, bản mệnh ngũ hành thuộc ${ELEMENTS[c.element ?? 'kim'].name}.`, `${HAIR_COLORS[hairColor].name} hair, to be worn ${HAIR_STYLES[gender][hairStyle]} when grown. The midwife reads your face: a ${fate.name} destiny, natal element ${ELEMENTS[c.element ?? 'kim'].name}.`),
  });
  return c;
}

/** Đầu thai thật: lấy lá số đã gieo (hoặc gieo mới), cộng thiên phú mua bằng phúc duyên, nghiệp, kiếp trước, thiên phú rút. */
export function newCharacter(meta: Meta, gifts: string[] = [], base?: Character): Character {
  const c: Character = base ? structuredClone(base) : rollBase();
  c.lifeNo = meta.lives + 1;
  c.enemy = meta.enemy;
  c.log = c.log.map((l) => ({ ...l, text: l.text.replace('__KIEP__', tr(`Kiếp thứ ${c.lifeNo}.`, `Life #${c.lifeNo}.`)) }));
  const t = meta.talents;
  if (t.includes('linh_can') && c.linhCanMul < 1.2) {
    let lc = weighted(rnd, LINH_CAN);
    while (lc.mul < 1.2) lc = weighted(rnd, LINH_CAN);
    c.log = c.log.map((l) => ({ ...l, text: l.text.replace(c.linhCan, lc.name) }));
    c.linhCan = lc.name;
    c.linhCanMul = lc.mul;
  }
  if (t.includes('ky_uc')) stat(c, 'ngoTinh', 20);
  if (t.includes('tho')) c.lifespan = Math.round(c.lifespan * 1.2);
  if (t.includes('gia_tai')) money(c, 300);
  if (t.includes('phuc')) stat(c, 'khiVan', 25);
  if (t.includes('kiem_tam')) giveItem(c, 'moc_kiem');
  // nghiệp lực giờ là thứ tà tu tiêu được; chỉ khi tích quá nặng (từ 150) mới bị trời phạt
  if (meta.nghiep >= 150) {
    stat(c, 'khiVan', -Math.min(20, 5 + Math.round((meta.nghiep - 150) / 10)));
    c.enemy = c.enemy ?? tr('oan hồn đòi nợ từ kiếp trước', "a vengeful ghost come to collect a debt from your past life");
    c.log.push({ age: 0, tone: 'ta', text: tr('Ngày bạn sinh ra, quạ đen đậu kín mái nhà. Nghiệp kiếp trước vẫn chưa trả hết.', "The day you are born, black crows cover the whole roof. The karma of your past life is not yet repaid.") });
  }
  c.past = meta.past ?? null;
  c.loreDone = loreDone(meta);
  c.quyNhat = quyNhatDone(meta);
  c.lore2 = lore2Count(meta);
  c.kiepSo = ksOf(meta);
  c.kiepTich = meta.kiepTich ?? 0;
  c.bell = meta.endings?.go_chuong || meta.endings?.dap_chuong ? 2 : meta.chuongWin ? 1 : 0;
  c.stash = meta.stash ?? null;
  c.legend = meta.legend ?? null;
  c.vendettas = meta.vendettas ?? [];
  applyProphecy(c, meta.prophecy);
  if (c.lifeNo === 1) c.log.push({ age: 0, tone: 'good', text: tr('Kiếp đầu tiên, trời cao thương đứa trẻ mới đến: trước 16 tuổi bạn sẽ không chết. Ba kiếp đầu, tuổi thơ trôi nhanh hơn.', "Your first life: the heavens pity the newcomer, and you will not die before 16. For your first three lives, childhood passes faster.") });
  if (c.lifeNo <= 3) c.log.push({ age: 0, tone: 'good', text: tr(`Ba kiếp đầu được trời thương: tới khi chọn con đường tu luyện, hiểm cảnh khó lấy mạng bạn hơn. Mục tiêu kiếp này: ${newbieGoal(c)?.name ?? ''}.`, `The heavens favor your first three lives: until you choose a cultivation path, danger has a harder time taking you. Goal for this life: ${newbieGoal(c)?.name ?? ''}.`) });
  if (gifts.length) {
    applyGifts(c, gifts);
    c.log.push({ age: 0, tone: 'good', text: tr(`Thiên phú bẩm sinh: ${gifts.map((g) => giftOf(g)?.name).join(', ')}.`, `Innate talents: ${gifts.map((g) => giftOf(g)?.name).join(', ')}.`) });
    if (hasGift(c, 'g_trung_sinh') && c.past)
      c.log.push({ age: 0, tone: 'big', text: tr(`Vừa mở mắt, bạn đã nhớ ra: kiếp trước mình là ${c.past.name}, ${c.past.realmName}, chết năm ${c.past.age} tuổi.`, `The moment you open your eyes, you remember: in your past life you were ${c.past.name}, ${c.past.realmName}, dead at age ${c.past.age}.`) });
    if (hasGift(c, 'g_hop')) c.log.push({ age: 0, tone: 'normal', text: tr('Trong tay bạn nắm chặt một chiếc hộp nhỏ, không ai cạy ra được.', "In your hand you clutch a small box that no one can pry open.") });
    // thiên sát cô tinh: khắc cha mẹ, tuổi thơ không còn người thân
    if (hasGift(c, 'g_co_tinh') && c.originId !== 'co_nhi' && c.originId !== 'chua') {
      c.familyTier = Math.min(c.familyTier ?? 1, 1);
      c.log.push({ age: 0, tone: 'bad', text: tr('Mệnh thiên sát cô tinh. Chưa đầy năm, cha mẹ lần lượt qua đời, ông bà cũng không qua nổi mùa đông. Bạn lớn lên nhờ bát cơm của hàng xóm.', "Born under the Lone Star of Heavenly Doom. Before your first year is out, both parents die one after another, and your grandparents don't survive the winter. You grow up on the neighbors' rice.") });
    }
  }
  // thiên phú mua bằng phúc duyên (áp sau thiên phú bẩm sinh để không bị ghi đè)
  if (t.includes('ho_than')) giveItem(c, 'ngoc_boi', true);
  if (t.includes('van_kiep')) {
    c.grace16 = true;
    c.log.push({ age: 0, tone: 'good', text: tr('Vạn kiếp bất diệt: trước 16 tuổi, trời cao sẽ che chở bạn.', "Ten Thousand Lives Undying: until 16, the heavens will shield you.") });
  }
  if (t.includes('thien_menh')) {
    c.gifts = [...(c.gifts ?? []), 'g_thien_menh'];
    c.stats.khiVan = 100;
    c.linhCanMul = Math.max(c.linhCanMul, 1.6);
  }
  if (t.includes('tien_cot') && c.linhCanMul < 1.9) {
    c.log = c.log.map((l) => ({ ...l, text: l.text.replace(c.linhCan, tr('Thiên linh căn', "Heavenly Spiritual Root")) }));
    c.linhCan = tr('Thiên linh căn', "Heavenly Spiritual Root");
    c.linhCanMul = 1.9;
  }
  // thiên phú tà đạo (trả bằng nghiệp lực)
  if (t.includes('ta_huyet')) {
    dao(c, -30);
    stat(c, 'ngoTinh', 10);
  }
  if (t.includes('ta_dao')) giveItem(c, 'huyet_dao', false);
  if (t.includes('ta_kien')) c.maKien = true;
  if (t.includes('ta_cong')) {
    c.linhCanMul = Math.min(2.2, Math.round(c.linhCanMul * 1.2 * 100) / 100);
    stat(c, 'tamMa', 10);
  }
  if (t.includes('ta_hon')) c.oanHon = true;
  if (t.includes('ta_ton')) {
    dao(c, -60);
    stat(c, 'khiVan', 15);
    c.maTon = true;
    c.log.push({ age: 0, tone: 'ta', text: tr('Ma tôn chuyển thế: ngày bạn ra đời, trời đỏ như máu, chó trong làng tru suốt đêm.', "A Demon Sovereign reincarnated: the day you are born, the sky turns blood red and the village dogs howl all night.") });
  }
  if (t.includes('linh_thu')) {
    const rare = ['tuyet_ho', 'bach_xa', 'hoa_ho', 'bang_phong', 'kim_thu', 'mai_loc', 'linh_loc', 'thu_vuong'];
    c.pet = true;
    c.petKind = rare[Math.floor(rnd() * rare.length)];
    c.log.push({ age: 0, tone: 'good', text: tr('Ngày bạn chào đời, một linh thú lạ nằm canh bên nôi, từ đó không rời.', "The day you are born, a strange spirit beast lies guarding your cradle, and never leaves your side.") });
  }
  return c;
}

export function makeCtx(c: Character, fxOut: Fx[]): EffectCtx {
  return {
    rnd,
    fx: (kind: FxKind, label?: string) => fxOut.push({ kind, label, id: Math.random() }),
    log: (text: string, tone: Tone = 'normal') => c.log.push({ age: Math.floor(c.age), text, tone }),
  };
}

function die(c: Character, cause: string, ctx: EffectCtx) {
  if (c.dead) return;
  // oan hồn hộ thể: đỡ một lần chết
  if (c.oanHon) {
    c.oanHon = false;
    c.stats.sucKhoe = Math.max(c.stats.sucKhoe, 20);
    c.stats.tamMa = Math.min(c.stats.tamMa, 70);
    ctx.log(tr('Một bóng oan hồn từ kiếp trước lao ra chắn trước mặt bạn rồi tan biến. Bạn thoát chết trong gang tấc.', "A vengeful ghost from your past life darts out in front of you and dissolves. You escape death by a hair."), 'ta');
    ctx.fx('heal', tr('Oan hồn hộ thể', "Ghostly guardian"));
    return;
  }
  // kiếp đầu được trời thương đến 16 tuổi
  if ((c.lifeNo === 1 || c.grace16) && c.age < 16) {
    c.stats.sucKhoe = Math.max(c.stats.sucKhoe, 15);
    c.stats.tamMa = Math.min(c.stats.tamMa, 60);
    ctx.log(tr('Tưởng đã mất mạng, nhưng trời cao như còn thương đứa trẻ này. Bạn thoát chết trong gang tấc.', "It seemed you were done for, but the heavens still pity this child. You escape death by a hair."), 'good');
    ctx.fx('heal', tr('Trời thương', "Heaven's mercy"));
    return;
  }
  c.dead = true;
  c.cause = cosmosCause(c, cause);
  ctx.fx('death');
  ctx.log(c.cause, 'big');
}

function enterRealm(c: Character, realm: number, ctx: EffectCtx, talents: string[]) {
  c.breakFail = undefined;
  c.realm = realm;
  c.layer = 1;
  c.cultivation = 0;
  const base = REALMS[realm]?.life ?? c.lifespan;
  c.lifespan = Math.min(lifeCap(realm), Math.max(c.lifespan, Math.round(base * lifeMult(c, talents) * (0.9 + rnd() * 0.2))));
  const up = promoteByRealm(c, ctx);
  if (up) ctx.log(up, 'good');
  // quà phi thăng theo cõi: áo khi vào cõi (mặc luôn), vũ khí ở cảnh giới 9, phụ kiện ở cảnh giới 10
  if (c.cosmos && realm >= ASCEND_REALM && realm <= ASCEND_REALM + 2) {
    const id = ASCEND_GEAR[c.cosmos][realm - ASCEND_REALM];
    const it = ITEMS.find((i) => i.id === id);
    if (it && !c.inventory.includes(id)) {
      giveItem(c, id, realm === ASCEND_REALM);
      const who = c.cosmos === 'ma' ? tr('Ma Đế', "The Demon Emperor") : c.cosmos === 'hu' ? tr('Hư không', "The Void") : tr('Thiên Đình', "The Heavenly Court");
      ctx.fx('buy', it.name);
      ctx.log(
        realm === ASCEND_REALM
          ? tr(`${who} ban cho bạn ${it.name}. Bạn khoác vào, khí tức đổi khác hẳn.`, `${who} bestows ${it.name} upon you. You put it on, and your aura changes completely.`)
          : tr(`${who} ban thưởng ${it.name}${realm === ASCEND_REALM + 2 ? tr(', đủ bộ ba món của cõi này', ", completing this realm's three-piece set") : ''}. Mở Túi đồ để mang.`, `${who} rewards you with ${it.name}${realm === ASCEND_REALM + 2 ? tr(', đủ bộ ba món của cõi này', ", completing this realm's three-piece set") : ''}. Open your Inventory to equip it.`),
        'good',
      );
    }
  }
  if (!c.cosmos && (realm === 5 || realm === 7)) {
    const k = ELEMENTS[keyAn(c)].name;
    ctx.log(
      realm === 5
        ? tr(`Hóa Thần rồi, bạn bắt đầu mơ thấy năm tấm gương. Trước cửa phi thăng là Ngũ Hành Vấn Tâm Đài: phải hạ 5 bóng của chính mình, mỗi bóng một hệ. Bóng cuối khắc bản mệnh của bạn. Hãy săn quái hệ ${k} để tích Ngũ Hành Ấn (hiện có ${anOf(c, keyAn(c))}/5).`, `Now at Spirit Transformation, you begin dreaming of five mirrors. Before the gate of Ascension stands the Five Elements Heart-Trial Platform: you must defeat 5 shadows of yourself, one per element. The last one overcomes your natal element. Hunt ${k}-element monsters to gather Five Elements Seals (you have ${anOf(c, keyAn(c))}/5).`)
        : tr(`Độ Kiếp rồi, Ngũ Hành Đài đã gần (cửa trời chỉ mở cho người từ ${ASCEND_MIN_AGE} tuổi). Ấn hệ ${k} đang có ${anOf(c, keyAn(c))}/5. Đủ 5 ấn thì bóng cuối không còn khắc được bạn.`, `Now at Tribulation, the Five Elements Platform is near (the heavenly gate opens only to those aged ${ASCEND_MIN_AGE} or more). You hold ${anOf(c, keyAn(c))}/5 ${k} Seals. With all 5, the last shadow can no longer overcome you.`),
      'big',
    );
  }
}

export function gearMul(c: Character) {
  return 1 + gearFx(c.equipped).cult / 100;
}

function pathMul(c: Character) {
  switch (c.path) {
    case 'ma':
      return 1.45;
    case 'kiem':
      return 1.08;
    case 'yeu':
      return 1.1;
    case 'phat':
      return 1.1;
    case 'dan':
      return 1.05;
    default:
      return 1;
  }
}

export function yearlyGain(c: Character) {
  const base = GAIN[c.realm] ?? 90;
  // tà đạo tu nhanh hơn (đổi lại nhiều tâm ma, nhiều kẻ thù)
  const lean = c.daoTam <= -40 ? 1.22 : c.daoTam <= -15 ? 1.08 : 1;
  return (
    base *
    sectCultMul(c) *
    (c.maTon ? 1.15 : 1) *
    (c.maLord === 'huyet' && c.cosmos === 'ma' ? 1.12 : 1) *
    c.linhCanMul *
    (0.6 + c.stats.ngoTinh / 100) *
    pathMul(c) *
    gearMul(c) *
    (c.stats.tamMa > 70 ? 0.8 : 1) *
    (hasGift(c, 'g_doan_menh') ? 1.3 : 1) *
    lean
  );
}

// Câu chuyện thường ngày ghép ngẫu nhiên từ nhiều mảnh để hiếm khi lặp lại
const WHEN = [
  tr('Đầu xuân,', "In early spring,"),
  tr('Giữa hè,', "At midsummer,"),
  tr('Cuối thu,', "In late autumn,"),
  tr('Đêm đông,', "On a winter night,"),
  tr('Một đêm trăng tròn,', "One full-moon night,"),
  tr('Sau cơn mưa rào,', "After a downpour,"),
  tr('Sáng sớm sương mù,', "On a misty morning,"),
  tr('Lúc hoàng hôn,', "At dusk,"),
  tr('Ngày tuyết đầu mùa,', "On the day of the first snow,"),
  tr('Tiết Thanh Minh,', "At Qingming,"),
  tr('Đêm Trung Thu,', "On Mid-Autumn night,"),
  tr('Mùa hoa đào nở,', "In peach-blossom season,"),
];
const WHERE = [
  tr('dưới thác Bạch Long', "beneath Bai Long Falls"),
  tr('trên đỉnh Vân Vụ', "atop Yun Wu Peak"),
  tr('bên bờ Thanh Giang', "on the banks of Qingjiang River"),
  tr('trong rừng trúc tím', "in a purple bamboo grove"),
  tr('ở hậu sơn', "on the back mountain"),
  tr('trong động phủ', "in your cave abode"),
  tr('dưới gốc tùng ngàn năm', "under a thousand-year pine"),
  tr('trên thuyền giữa hồ Kính Nguyệt', "in a boat on Jingyue Lake"),
  tr('ở thạch đình bỏ hoang', "in an abandoned stone pavilion"),
  tr('trên vách đá Tuyệt Bích', "on the Juebi cliff"),
  tr('trong ngôi miếu đổ nát', "in a ruined temple"),
  tr('giữa thảo nguyên Bắc Mạc', "on the Beimo steppe"),
];
const DOING: Record<string, string[]> = {
  tu_luyen: [
    tr('bạn ngồi thiền vận chuyển chu thiên', "you meditate, circulating qi through the Grand Cycle"),
    tr('bạn luyện đi luyện lại một chiêu kiếm', "you drill the same sword move over and over"),
    tr('bạn hấp thụ linh khí nhật nguyệt', "you absorb the essence of sun and moon"),
    tr('bạn nghiền ngẫm bộ công pháp cũ', "you pore over an old technique manual"),
    tr('bạn thử đả thông một huyệt đạo khó', "you try to open a stubborn meridian point"),
    tr('bạn luyện công đến quên ăn', "you train so hard you forget to eat"),
  ],
  luyen_dan: [tr('bạn canh lò đan suốt bảy ngày', "you watch over the pill furnace for seven days"), tr('bạn thử một đan phương mới', "you try a new pill recipe"), tr('bạn đi hái thảo dược', "you go gathering herbs"), tr('bạn ghi chép lại các lần nổ lò', "you write up notes on every furnace explosion"), tr('bạn phơi thảo dược trên mái nhà', "you dry herbs on the roof")],
  du_ngoan: [tr('bạn dừng chân ngắm cảnh', "you stop to take in the view"), tr('bạn nghe người kể chuyện giang hồ', "you listen to a storyteller's tales of the jianghu"), tr('bạn vẽ lại phong cảnh', "you paint the scenery"), tr('bạn uống rượu với một khách lạ', "you share wine with a stranger"), tr('bạn lạc đường mất ba ngày', "you get lost for three days")],
  kiem_tien: [tr('bạn bày sạp bán phù chú', "you set up a stall selling talismans"), tr('bạn nhận làm thuê cho thương hội', "you take a job with a merchant guild"), tr('bạn đi buôn linh thảo', "you trade in spirit herbs"), tr('bạn chép kinh thuê cho chùa', "you copy sutras for a temple"), tr('bạn đòi nợ giúp một lão chủ tiệm', "you collect a debt for an old shopkeeper")],
  ket_duyen: [tr('bạn uống trà luận đạo với bạn cũ', "you discuss the Dao over tea with an old friend"), tr('bạn dự hội thơ của tu sĩ trẻ', "you attend a young cultivators' poetry gathering"), tr('bạn giúp một người lạ sửa xe', "you help a stranger fix a cart"), tr('bạn viết thư cho cố nhân', "you write a letter to an old friend"), tr('bạn kết giao thêm vài đạo hữu', "you make a few more fellow Daoist friends")],
  tru_yeu: [tr('bạn lau sạch máu yêu thú trên vũ khí', "you wipe demon beast blood off your weapon"), tr('bạn băng bó vết cào trên tay', "you bandage the claw marks on your arm"), tr('bạn đếm lại chiến lợi phẩm', "you count your spoils"), tr('bạn nghe tiếng sói tru vọng về', "you hear wolves howling in the distance")],
};
const RESULT: Record<string, string[]> = {
  tu_luyen: [
    tr('chân khí lưu chuyển thêm một vòng.', "and your true qi completes another cycle."),
    tr('trong đầu chợt sáng ra một điều.', "and something suddenly becomes clear."),
    tr('không thu được gì, nhưng lòng bình thản.', "gaining nothing, but your heart is at peace."),
    tr('mồ hôi ướt đẫm, tu vi nhích thêm một chút.', "drenched in sweat, your cultivation inching up."),
    tr('suýt nữa thì khí huyết nghịch hành.', "and your qi and blood nearly run backwards."),
  ],
  luyen_dan: [tr('mùi thuốc thơm khắp núi.', "and the scent of medicine fills the mountain."), tr('lò đan nổ, tóc cháy xém một mảng.', "and the furnace explodes, singeing off a patch of your hair."), tr('ra lò mấy viên đan có vân mây.', "and a few pills come out with cloud patterns."), tr('cuối cùng cũng hiểu vì sao lần trước hỏng.', "and you finally understand why the last batch failed.")],
  du_ngoan: [tr('lòng rộng mở hơn hẳn.', "and your heart feels much wider."), tr('nhớ nhà da diết.', "and you miss home terribly."), tr('học được vài câu tiếng địa phương.', "and you pick up a few phrases of the local dialect."), tr('thấy thiên hạ rộng lớn hơn mình tưởng.', "and the world seems bigger than you thought.")],
  kiem_tien: [tr('kiếm được kha khá linh thạch.', "and you earn a tidy sum of spirit stones."), tr('bị quỵt mất một nửa tiền công.', "and get cheated out of half your pay."), tr('gặp được một mối làm ăn lâu dài.', "and land a steady business partner."), tr('mệt rã rời nhưng túi rủng rỉnh.', "exhausted, but with a jingling purse.")],
  ket_duyen: [tr('cười nói đến tận khuya.', "chatting and laughing late into the night."), tr('thấy lòng ấm áp lạ thường.', "and feel strangely warm inside."), tr('nghe được tin đồn thú vị trên giang hồ.', "and hear an interesting rumor from the jianghu."), tr('hẹn năm sau gặp lại.', "promising to meet again next year.")],
  tru_yeu: [tr('tay vẫn còn run.', "your hands still shaking."), tr('thấy mình mạnh hơn hôm qua.', "feeling stronger than yesterday."), tr('nhớ lại trận đánh suýt mất mạng.', "recalling the fight that nearly killed you.")],
};

function flavorLine(c: Character, focus: string): string {
  const extra: string[] = [];
  if (c.pet) extra.push(tr(`Con ${petName(c)} quanh quẩn bên cạnh.`, `Your ${petName(c)} hangs around nearby.`));
  if (c.partner) extra.push(tr(`${c.partner} ở bên pha trà.`, `${c.partner} brews tea beside you.`));
  if (c.enemy) extra.push(tr(`Bạn chợt nghĩ đến ${c.enemy}.`, `You suddenly think of ${c.enemy}.`));
  const tail = extra.length && rnd() < 0.25 ? ' ' + pick(rnd, extra) : '';
  return `${pick(rnd, WHEN)} ${pick(rnd, DOING[focus] ?? DOING.tu_luyen)} ${pick(rnd, WHERE)}, ${pick(rnd, RESULT[focus] ?? RESULT.tu_luyen)}${tail}`;
}

/** Lên tầng nhỏ, hoặc trả về sự kiện đột phá nếu đã đầy tầng cuối */
function progress(c: Character, ctx: EffectCtx, talents: string[]): PendingEvent | null {
  if (c.dead) return null;
  if (c.realm === 0) {
    if (c.cultivation >= 40 && c.age >= 8) {
      enterRealm(c, 1, ctx, talents);
      ctx.fx('breakthrough', tr('Luyện Khí', "Qi Refining"));
      ctx.log(tr('Dẫn khí nhập thể! Bạn chính thức bước vào Luyện Khí, trở thành tu sĩ.', "Qi enters your body! You formally step into Qi Refining and become a cultivator."), 'big');
    }
    return null;
  }
  const R = REALMS[c.realm];
  let guard = 0;
  while (c.cultivation >= needFor(c) && guard++ < 20) {
    if (c.layer < R.layers) {
      c.cultivation -= needFor(c);
      c.layer += 1;
      ctx.fx('layer', realmLabel(c.realm, c.layer, c.cosmos));
      ctx.log(tr(`Lên ${realmLabel(c.realm, c.layer, c.cosmos)}.`, `Reached ${realmLabel(c.realm, c.layer, c.cosmos)}.`), 'good');
    } else {
      c.cultivation = needFor(c);
      if (c.breakDelay > 0) return null;
      // phi thăng còn cần đủ tuổi đạo hạnh: chưa đủ thì chặn, nhắc còn bao năm (mỗi 10 năm một lần)
      if (c.realm + 1 === ASCEND_REALM && !c.cosmos && c.age < ASCEND_MIN_AGE) {
        const left = Math.ceil(ASCEND_MIN_AGE - c.age);
        if (c.ascWait === undefined || c.age - c.ascWait >= 10) {
          c.ascWait = Math.floor(c.age);
          ctx.log(tr(`Tu vi đã đủ phi thăng, nhưng đạo hạnh còn non: cửa trời chỉ mở cho người từ ${ASCEND_MIN_AGE} tuổi. Còn ${left} năm nữa. Tranh thủ săn quái tích Ngũ Hành Ấn cho Ngũ Hành Đài.`, `Your cultivation is enough to ascend, but your Dao is still green: the heavenly gate opens only to those aged ${ASCEND_MIN_AGE} or more. ${left} years to go. Hunt monsters meanwhile to gather Five Elements Seals for the Five Elements Platform.`), 'big');
        }
        return null;
      }
      return buildPending(c, breakEvent(c));
    }
  }
  return null;
}

/** Chết vì sức khỏe cạn: nói rõ vết thương gần nhất đến từ đâu, để người chơi hiểu vì sao */
function hurtCause(c: Character): string {
  const age = Math.floor(c.age);
  const last = [...c.log].reverse().find((l) => l.tone === 'bad' && l.age >= age - 4 && !l.text.startsWith('⚠') && !/tẩu hỏa|thiên kiếp|qi deviation|tribulation/i.test(l.text));
  if (!last) return tr('Thương thế quá nặng, bạn trút hơi thở cuối cùng.', "Your wounds are too severe. You breathe your last.");
  const t = last.text.length > 90 ? last.text.slice(0, 88).trimEnd() + '…' : last.text;
  return tr(`Thương thế chồng chất không kịp hồi phục (lần cuối, năm ${last.age} tuổi: ${t}). Bạn trút hơi thở cuối cùng.`, `Wound piled on wound with no time to heal (the last, at age ${last.age}: ${t}). You breathe your last.`);
}

function checkDeath(c: Character, ctx: EffectCtx) {
  if (c.dead) return;
  // được cứu khỏi chết (oan hồn, sư phụ...) thì bỏ nhãn cách chết đã gắn
  if (c.endTag && ['loi_phat', 'tam_ma_doat_xa', 'lac_khe_nut', 'tu_tran', 'tram_tien_dai'].includes(c.endTag)) c.endTag = undefined;
  if (c.stats.sucKhoe <= 0) die(c, hurtCause(c), ctx);
  else if (c.stats.tamMa >= 100) {
    // tâm ma đầy chưa chắc đã chết: 40% tẩu hỏa nhập ma, còn lại trọng thương, rớt tu vi rồi gượng lại được
    if (rnd() < 0.4) {
      if (c.cosmos) c.endTag = COSMOS_DEATH_TAG[c.cosmos];
      die(c, c.cosmos ? COSMOS_TAMMA_TEXT[c.cosmos] : tr('Tâm ma phản phệ. Bạn tẩu hỏa nhập ma, kinh mạch nổ tung.', "Your heart demon strikes back. You fall into qi deviation and your meridians burst."), ctx);
    }
    else {
      c.stats.tamMa = 65;
      stat(c, 'sucKhoe', -35);
      c.cultivation = Math.round(c.cultivation * 0.85);
      ctx.fx('hurt', tr('Tâm ma', "Heart demon"));
      ctx.log(tr('Tâm ma bùng phát, bạn hộc máu ngã quỵ, tu vi tụt mất một đoạn. May mà gượng giữ được linh đài.', "Your heart demon erupts; you cough up blood and collapse, losing a chunk of cultivation. Luckily you hold your spirit platform together."), 'bad');
      if (c.stats.sucKhoe <= 0) die(c, tr('Tâm ma phản phệ cộng thêm trọng thương, bạn không qua khỏi.', "Heart demon backlash on top of grave wounds - you do not pull through."), ctx);
    }
  } else if (c.age >= c.lifespan) {
    if (c.cosmos) c.endTag = c.cosmos === 'ma' ? 'ma_the_muc_ruong' : c.cosmos === 'hu' ? 'hoa_tinh' : 'thien_nhan_ngu_suy';
    die(
      c,
      c.cosmos === 'ma'
        ? tr(`Ma thể mục ruỗng, ma hồn tan vào huyết hải. Ma giới mất một vị ${realmName(c.realm, 'ma')} ở tuổi ${Math.floor(c.age)}.`, `Your demon body rots away and your demon soul dissolves into the sea of blood. The Demon Realm loses a ${realmName(c.realm, 'ma')} at age ${Math.floor(c.age)}.`)
        : c.cosmos === 'hu'
          ? tr(`Thân thể dần trong suốt rồi tan vào hư không, như chưa từng tồn tại. Thái Hư giới tiễn một vị ${realmName(c.realm, 'hu')} ở tuổi ${Math.floor(c.age)}.`, `Your body slowly turns transparent and fades into the void, as if you never existed. The Great Void Realm bids farewell to a ${realmName(c.realm, 'hu')} at age ${Math.floor(c.age)}.`)
          : c.cosmos === 'tien'
          ? tr(`Thiên nhân ngũ suy: áo tiên bám bụi, hoa trên đầu héo úa, thân không còn tỏa sáng. Bạn tọa hóa giữa tiên giới ở tuổi ${Math.floor(c.age)}.`, `The Five Decays of the Celestial: your immortal robe gathers dust, the flowers on your head wither, your body no longer shines. You pass away in the Immortal Realm at age ${Math.floor(c.age)}.`)
          : tr(`Thọ nguyên cạn kiệt. Bạn tọa hóa ở tuổi ${Math.floor(c.age)}.`, `Your lifespan runs out. You pass away at age ${Math.floor(c.age)}.`),
      ctx,
    );
  }
}

/** Chết vì kiếp nạn hay tâm ma ở ba cõi: mỗi cõi một kiểu chết riêng */
const COSMOS_DEATH_TAG: Record<'tien' | 'ma' | 'hu', string> = { tien: 'loi_phat', ma: 'tam_ma_doat_xa', hu: 'lac_khe_nut' };
const COSMOS_TAMMA_TEXT: Record<'tien' | 'ma' | 'hu', string> = {
  tien: tr('Tâm ma vừa ló dạng, thiên lôi đã giáng xuống. Tiên giới không dung tiên thân nhiễm ma, ba hồn bảy vía tan theo tiếng sấm.', "Your heart demon barely shows itself before heavenly lightning strikes. The Immortal Realm tolerates no demon-tainted immortal, and your souls scatter with the thunder."),
  ma: tr('Bóng tối trong lòng bạn đứng dậy, bước ra khỏi thân xác rồi quay lại chiếm lấy nó. Kẻ đang sống tiếp kia không còn là bạn.', "The darkness in your heart stands up, steps out of your body, then turns back and takes it. Whoever goes on living in it is no longer you."),
  hu: tr('Tâm ma làm linh đài chao đảo, bạn hụt một bước giữa hư không và rơi vào khe nứt thời gian, trôi mãi không đáy.', "Your heart demon shakes your spirit platform; you miss a step in the void and fall into a crack in time, drifting forever with no bottom."),
};
const COSMOS_KIEP_TEXT: Record<'tien' | 'ma' | 'hu', string> = {
  tien: tr('Lôi kiếp nơi tiên giới không nương tay. Tiên thể vỡ tan dưới đạo lôi cuối cùng.', "The tribulations of the Immortal Realm show no mercy. Your immortal body shatters under the final bolt."),
  ma: tr('Huyết lôi đánh nát ma thể, tâm ma thừa cơ chiếm lấy chỗ trống.', "Blood lightning smashes your demon body, and your heart demon seizes the empty space."),
  hu: tr('Kiếp nạn xé toạc hư không quanh bạn. Bạn bị cuốn vào khe nứt thời gian.', "The tribulation tears open the void around you. You are swept into a crack in time."),
};

function mentionsFamily(c: Character, e: GameEvent): boolean {
  try {
    if (FAMILY_RE.test(e.title) || FAMILY_RE.test(e.text(c))) return true;
    return e.choices(c, 0).some((ch) => FAMILY_RE.test(ch.label) || FAMILY_RE.test(ch.hint ?? ''));
  } catch {
    return false;
  }
}

function eligible(c: Character, e: GameEvent): boolean {
  // sau phi thăng chỉ còn sự kiện tiên giới, ma giới; trước phi thăng không gặp sự kiện của các giới đó
  if (c.cosmos) {
    if (!e.cosmos || (e.cosmos !== 'both' && e.cosmos !== c.cosmos)) return false;
  } else if (e.cosmos) return false;
  const a = c.age;
  if (e.minAge !== undefined && a < e.minAge) return false;
  if (e.maxAge !== undefined && a > e.maxAge) return false;
  if (e.minRealm !== undefined && c.realm < e.minRealm) return false;
  if (e.maxRealm !== undefined && c.realm > e.maxRealm) return false;
  const seen = c.seenEvents[e.id];
  // một sự kiện gặp tối đa 2 lần mỗi kiếp (oan gia, tâm ma 3 lần) để đỡ lặp
  const cap = e.id === 'tam_ma' || e.id === 'ke_thu' ? 3 : 2;
  if ((c.evCount?.[e.id] ?? 0) >= cap) return false;
  if (seen !== undefined) {
    if (e.once) return false;
    if (a - seen < (e.cooldown ?? 10)) return false;
  }
  if (e.when && !e.when(c)) return false;
  // trẻ mồ côi (cô nhi, bị bỏ ở chùa, thiên sát cô tinh): bỏ qua sự kiện tuổi nhỏ có cảnh cha mẹ, ông bà
  if (c.age < 18 && isOrphan(c) && mentionsFamily(c, e)) return false;
  return true;
}

function buildPending(c: Character, e: GameEvent): PendingEvent {
  const seed = Math.floor(rnd() * 2147483647);
  c.seenEvents[e.id] = Math.floor(c.age);
  c.evCount = c.evCount ?? {};
  c.evCount[e.id] = (c.evCount[e.id] ?? 0) + 1;
  return {
    id: e.id,
    seed,
    title: e.title,
    text: e.text(c),
    choices: e.choices(c, seed).map((ch) => ({ label: ch.label, hint: ch.hint, lean: ch.lean })),
  };
}

function pickEvent(c: Character): GameEvent | null {
  const list = EVENTS.filter((e) => eligible(c, e)).map((e) => {
    let w = e.weight ?? 5;
    if (e.id === 'dao_lu' && c.focus === 'ket_duyen') w *= 4;
    if (e.id === 'dao_lu' && hasGift(c, 'g_dao_hoa')) w *= 3;
    if (e.id === 'he_thong' && hasGift(c, 'g_he_thong')) w *= 300;
    return { e, w };
  });
  if (!list.length) return null;
  return weighted(rnd, list).e;
}

export interface TickOpts {
  noEvents?: boolean;
  closed?: boolean; // đang bế quan
  talents?: string[];
}

/** Chạy hết một năm. c.age đã được cộng trước khi gọi. */
export function yearTick(c: Character, ctx: EffectCtx, opts: TickOpts = {}): PendingEvent | null {
  if (c.dead) return null;
  const age = Math.floor(c.age);
  const talents = opts.talents ?? [];
  if (c.breakDelay > 0) c.breakDelay -= 1;
  // ấn Mộc trên vũ khí: mỗi năm hồi thêm sức khỏe
  const moc = sealLv(c, 'moc');
  if (moc) stat(c, 'sucKhoe', moc);

  // Trọng tâm năm nay
  const focus = opts.closed ? 'tu_luyen' : age >= FOCUS[c.focus].minAge ? c.focus : null;
  const jitter = 0.8 + rnd() * 0.4;
  if (age >= 6) {
    const g = yearlyGain(c) * jitter;
    if (focus === 'tu_luyen') addCult(c, g * (opts.closed ? 1.5 : 1));
    else if (c.realm >= 1) addCult(c, g * 0.25);
  }
  // 3.1.0: cày tiền liền nhiều năm thì thu ít dần; % tiền, % đan từ trang bị tối đa +100%
  const grind = grindMul(c.streak?.f === focus ? c.streak.n : 0);
  if (focus === 'luyen_dan') {
    const mul = (c.path === 'dan' ? 2 : 1) * (1 + Math.min(100, gearFx(c.equipped).dan) / 100) * grind;
    money(c, (15 + 25 * c.realm) * mul * jitter);
    if (rnd() < 0.3 * (c.path === 'dan' ? 1.6 : 1)) {
      const p = c.path === 'dan' && rnd() < 0.25 ? 'truc_co' : pick(rnd, ['tu_khi', 'hoi_xuan', 'thanh_tam']);
      addPill(c, p);
      ctx.log(tr(`Luyện thành một viên ${PILLS.find((x) => x.id === p)?.name}.`, `Refined one ${PILLS.find((x) => x.id === p)?.name}.`), 'good');
    }
  } else if (focus === 'kiem_tien') {
    money(c, (c.realm === 0 ? 12 : 10 + 30 * c.realm) * (0.6 + rnd() * 0.8) * (1 + Math.min(100, gearFx(c.equipped).money) / 100) * grind);
    if (grind < 0.7 && rnd() < 0.3) ctx.log(tr('Làm ăn mãi một mối, khách quen đã bão hòa. Thu nhập năm nay ít hẳn, nên đổi việc khác một thời gian.', "Same old business, and your regulars have had enough. Income is way down this year - try something else for a while."), 'normal');
  } else if (focus === 'du_ngoan') {
    if (rnd() < 0.3) stat(c, 'khiVan', 1);
    stat(c, 'tamCanh', 1);
  } else if (focus === 'ket_duyen') {
    stat(c, 'tamCanh', 2);
    stat(c, 'tamMa', -2);
  }

  // ---- Tông môn: thăng bậc theo cảnh giới hay độ tàn nhẫn (ma môn) ----
  if (c.sect) {
    const up = promoteByRealm(c, ctx);
    if (up) ctx.log(up, 'good');
    // 3.1.0: giấu thân phận ở lại tông ngược phe, mỗi năm 10% bị lộ
    if (c.sectHide) {
      if (!sectConflict(c)) c.sectHide = false;
      else if (rnd() < 0.1) {
        const name = c.sect;
        leaveSect(c, true);
        c.enemy = c.enemy ?? tr(`${name} truy nã kẻ phản môn`, `${name} hunts the traitor`);
        ctx.fx('hurt', tr('Bị trục xuất', "Expelled"));
        ctx.log(tr(`Thân phận bị lộ. ${name} tuyên bố trục xuất bạn trước toàn tông, lột áo bào, thu lệnh bài.`, `Your identity is exposed. ${name} expels you before the entire sect, stripping your robe and confiscating your token.`), 'bad');
      }
    }
  }

  // ---- 3.2.0: mục tiêu ba kiếp đầu ----
  const goal = checkNewbieGoal(c);
  if (goal) {
    ctx.log(goal, 'good');
    ctx.fx('buy', tr('Đạt mục tiêu', "Goal reached"));
  }

  // ---- Ba cõi: thiên quy, dấu hiệu suy tàn ----
  if (c.cosmos) {
    cosmosYear(c, ctx);
    if (c.dead) return null;
    const ma = maChainYear(c, rnd);
    if (ma) ctx.log(ma, 'good');
  }
  // ---- Đại hạn ở Độ Kiếp mà không kịp phi thăng: tọa hóa chuyển thế hay truyền công ----
  if (!c.cosmos && c.realm === ASCEND_REALM - 1 && c.lifespan - c.age <= 10 && !c.daiHan) {
    c.daiHan = true;
    return buildPending(c, daiHanEvent(c));
  }

  // ---- Quá độ: làm một việc quá lâu ----
  if (!opts.closed && focus && age >= 10) {
    if (c.streak?.f === focus) c.streak.n += 1;
    else c.streak = { f: focus, n: 1 };
    overwork(c, ctx, focus, c.streak.n);
    if (c.dead) return null;
  }

  // ---- Giàu nghèo ----
  const tier = wealthTier(c);
  if (age < 16) {
    // gia đình nuôi
    money(c, FAMILY_TIERS[c.familyTier ?? 1]?.allowance ?? 3);
  } else {
    // sinh hoạt phí, càng lên cảnh giới càng tốn
    // tiên nhân, ma nhân không cần ăn uống
    const cost = c.cosmos ? 0 : 4 + c.realm * 7 + (c.partner ? 4 : 0) + (hasGift(c, 'g_an') ? 3 : 0);
    if (c.linhThach >= cost) money(c, -cost);
    else {
      money(c, -c.linhThach);
      stat(c, 'sucKhoe', -4);
      stat(c, 'tamCanh', -3);
      if (rnd() < 0.3) ctx.log(tr('Túng quẫn, bạn phải nhịn đói mấy ngày liền.', "Broke, you go hungry for days on end."), 'bad');
    }
  }
  if (c.income) money(c, c.income * (0.7 + rnd() * 0.6));
  if (tier.id >= 3) stat(c, 'sucKhoe', 1); // ăn ngon mặc ấm
  if (tier.id === 0 && age >= 16) stat(c, 'tamMa', 1);

  // ---- Thiên phú có mặt trái ----
  if (hasGift(c, 'g_tham') && age === 20) {
    const lost = Math.round(c.linhThach * 0.8);
    money(c, -lost);
    stat(c, 'ngoTinh', -5);
    ctx.log(tr(`Tham một mối làm ăn "lời gấp mười", bạn bị lừa mất ${lost} linh thạch. Tham thì thâm.`, `Greedy for a "tenfold profit" deal, you get swindled out of ${lost} spirit stones. Greed never pays.`), 'bad');
  }
  if (hasGift(c, 'g_co_tinh') && c.partner && rnd() < 0.05) {
    ctx.log(tr(`Mệnh thiên sát cô tinh. ${c.partner} lâm bệnh nặng rồi qua đời.`, `The Lone Star of Heavenly Doom strikes. ${c.partner} falls gravely ill and dies.`), 'bad');
    c.partner = null;
    stat(c, 'tamMa', 15);
  }

  // ---- Trẻ con chết yểu ----
  if (age >= 1 && age <= 12 && !opts.closed) {
    // chết yểu ngẫu nhiên: giảm còn khoảng một nửa (người chơi chưa kịp tu đã chết thì rất nản)
    const risk = 0.0015 + (tier.id === 0 ? 0.002 : tier.id === 1 ? 0.0008 : 0) + (c.originId === 'the_gia' ? 0.001 : 0);
    if (rnd() < risk) {
      const causes = [
        tr(`Một trận sốt cao cướp đi bạn khi mới ${age} tuổi.`, `A high fever takes you at just ${age} years old.`),
        tr('Bạn trượt chân ngã xuống giếng sau nhà.', "You slip and fall into the well behind the house."),
        tr(`Dịch tả tràn qua làng. Bạn mất năm ${age} tuổi.`, `Cholera sweeps through the village. You die at age ${age}.`),
        tr('Bạn bị rắn độc cắn khi đi chăn trâu, không kịp cứu.', "A venomous snake bites you while you're herding buffalo, and there's no saving you."),
        tr('Bạn đuối nước ở khúc sông đầu làng.', "You drown in the river bend at the edge of the village."),
        tr('Bạn ngã từ trên cây cao xuống, không bao giờ tỉnh lại.', "You fall from a tall tree and never wake up."),
        ...(tier.id === 0 ? [tr('Năm mất mùa, bạn chết đói khi chưa kịp lớn.', "In a year of famine, you starve before you can grow up."), tr('Mùa đông rét đậm, bạn không qua khỏi vì không có áo ấm.', "A bitter winter comes, and without warm clothes you don't make it.")] : []),
        ...(c.originId === 'the_gia' ? [tr('Thích khách của chi trưởng đột nhập, bạn chết trong giấc ngủ.', "An assassin sent by the elder branch slips in, and you die in your sleep."), tr('Có kẻ bỏ độc vào bát chè sen của bạn.', "Someone poisons your bowl of lotus-seed soup.")] : []),
        ...(c.race === 'yeu' ? [tr('Thợ săn yêu bắt được bạn, lột da bán ở phường thị.', "A demon hunter catches you, skins you, and sells the hide at the market.")] : []),
      ];
      const f = fatal(c, ctx, 1, pick(rnd, causes));
      if (c.dead) {
        ctx.log(c.cause ?? '', 'big');
        return null;
      }
      if (f) ctx.log(f.trim(), 'good');
    }
  }

  // ---- Cây cao đón gió: chính đạo nổi danh dễ bị ma đạo nhắm tới ----
  if (!opts.closed) {
    const peril = righteousPeril(c, ctx);
    if (peril) {
      ctx.log(peril, c.dead ? 'big' : 'bad');
      if (c.dead) return null;
    }
  }

  // ---- Quái vật hồi sức khi lâu không bị săn ----
  if (c.monLv) for (const k of Object.keys(c.monLv)) if (c.focus !== 'tru_yeu' || c.huntTarget !== k) c.monLv[k] = Math.max(0, c.monLv[k] - 0.5);

  // Trạng thái thường niên
  const ratio = c.age / c.lifespan;
  if (ratio > 0.85) {
    if (c.stats.sucKhoe > 12) stat(c, 'sucKhoe', -3);
  } else stat(c, 'sucKhoe', ratio > 0.7 ? 1 : 3);
  if (c.stats.tamCanh > 60) stat(c, 'tamMa', -1);
  // tâm ma tự lắng xuống một chút mỗi năm (ma tu thì không)
  if (c.path !== 'ma') stat(c, 'tamMa', -1);
  if (c.path === 'ma') stat(c, 'tamMa', 2);
  if (c.path === 'phat') stat(c, 'tamMa', -2);
  // du ngoạn khi sức khỏe yếu là nghỉ dưỡng: hồi nhanh hơn
  if (focus === 'du_ngoan' && c.stats.sucKhoe < 60) stat(c, 'sucKhoe', 6);
  // cảnh báo sức khỏe nguy kịch, mỗi 3 năm nhắc một lần
  if (c.stats.sucKhoe <= 25 && (c.hpWarnAt ?? -99) + 3 <= age) {
    c.hpWarnAt = age;
    const pill = (c.pills.hoi_xuan ?? 0) > 0 ? tr('uống Hồi Xuân Đan trong Túi đồ', "drink a Spring Return Pill from your Inventory") : tr('mua Hồi Xuân Đan ở Phường thị', "buy a Spring Return Pill at the Market");
    ctx.log(tr(`⚠ Sức khỏe chỉ còn ${Math.round(c.stats.sucKhoe)}. Thêm một vết thương nữa có thể mất mạng: nên chuyển sang Du ngoạn để nghỉ dưỡng, ${pill}, tránh trừ yêu và bế quan.`, `⚠ Health is down to ${Math.round(c.stats.sucKhoe)}. One more wound could kill you: switch to Wander to rest, ${pill}, and avoid hunting demons and seclusion.`), 'bad');
    ctx.fx('hurt', tr('Sức khỏe nguy kịch', "Health critical"));
  }
  const gf = gearFx(c.equipped);
  if (gf.tamMa) stat(c, 'tamMa', gf.tamMa);
  if (gf.tamCanh) stat(c, 'tamCanh', gf.tamCanh);

  // ---- Nhặt được đồ trong lúc sống ----
  if (!opts.closed) {
    const found = findLoot(c, focus, tier.id);
    if (found) {
      giveItem(c, found.id, false);
      ctx.fx('buy', found.name);
      ctx.log(tr(`${found.text} Nhặt được ${found.name}! (${fxText(ITEMS.find((i) => i.id === found.id)?.fx)}) Mở Túi đồ để dùng.`, `${found.text} Found ${found.name}! (${fxText(ITEMS.find((i) => i.id === found.id)?.fx)}) Open your Inventory to use it.`), 'good');
    }
  }
  if (c.partner) stat(c, 'tamCanh', 1);

  // Thọ nguyên tự nhiên không vượt 1.15 lần mức chuẩn của cảnh giới và trần thọ;
  // phần thêm từ đan, đào, kỳ ngộ (lifeExtra) cộng ngoài trần, tối đa nửa trần
  const cap =
    Math.min(lifeCap(c.realm), Math.round((REALMS[c.realm]?.life ?? 70) * 1.15 * lifeMult(c, talents))) +
    Math.min(c.lifeExtra ?? 0, Math.round(lifeCap(c.realm) / 2));
  if (c.lifespan > cap) c.lifespan = cap;

  // Sự kiện tuổi thơ cố định
  // kỷ niệm tuổi thơ, mỗi người một khác
  if (!opts.closed && age >= 1 && age <= 5 && rnd() < 0.85) {
    const t = childLine(c, age, rnd);
    if (t) ctx.log(t);
  }

  // Tầng / cảnh giới
  const brk = progress(c, ctx, talents);
  checkDeath(c, ctx);
  if (c.dead) return null;
  if (brk) return brk;
  if (needPath(c)) return buildPending(c, pathEvent(c));

  if (opts.noEvents || opts.closed) return null;
  const chance = age < 6 ? 0.3 : focus === 'du_ngoan' ? 0.6 : 0.3;
  if (rnd() < chance) {
    const e = pickEvent(c);
    if (e) return buildPending(c, e);
  }
  if (age >= 6 && age <= 12 && rnd() < 0.5) {
    const t = childLine(c, age, rnd);
    if (t) {
      ctx.log(t);
      return null;
    }
  }
  if (age >= 6 && rnd() < 0.35 && focus) ctx.log(flavorLine(c, focus));
  return null;
}

/** Đồ nhặt được theo việc đang làm. Mỗi món chỉ nhặt một lần. */
const LOOT: { id: string; p: number; ok: (c: Character, focus: string | null, tier: number) => boolean; text: string }[] = [
  { id: 'dao_phay', p: 0.04, ok: (c) => c.age >= 6 && c.age <= 14, text: tr('Mẹ dúi cho bạn con dao bếp: "Ra đường phải biết tự vệ."', "Mother presses a kitchen knife into your hand: \"Out there, you have to be able to defend yourself.\"") },
  { id: 'roi_da', p: 0.04, ok: (c, f) => (c.age >= 6 && c.age <= 14) || f === 'kiem_tien', text: tr('Ông lão chăn trâu tặng bạn chiếc roi cũ.', "An old buffalo herder gives you his old whip.") },
  { id: 'ao_toi', p: 0.05, ok: (_c, f) => f === 'du_ngoan', text: tr('Trú mưa trong miếu hoang, bạn thấy chiếc áo tơi treo trên vách.', "Sheltering from the rain in an abandoned temple, you spot a straw raincoat hanging on the wall.") },
  { id: 'can_cau', p: 0.025, ok: (_c, f) => f === 'du_ngoan', text: tr('Bên bờ Vị Thủy, một ông lão câu cá bằng lưỡi thẳng để lại cần câu rồi biến mất.', "On the banks of the Weishui, an old man fishing with a straight hook leaves his rod behind and vanishes.") },
  { id: 'kiem_gay', p: 0.02, ok: (_c, f) => f === 'du_ngoan' || f === 'tu_luyen', text: tr('Trên một ngôi mộ cổ không tên cắm một thanh kiếm gãy, vẫn còn vang tiếng kiếm ngân.', "A broken sword is stuck in a nameless ancient grave, still faintly ringing.") },
  { id: 'hi_phuc', p: 0.04, ok: (_c, f) => f === 'ket_duyen', text: tr('Đám cưới tan, cô dâu bỏ trốn để lại bộ hỉ phục.', "The wedding falls apart; the bride runs off, leaving her wedding dress behind.") },
  { id: 'ao_an_may', p: 0.05, ok: (c, _f, t) => t === 0 && c.age >= 14, text: tr('Một lão ăn mày cởi áo khoác lên vai bạn: "Cái Bang không bỏ huynh đệ."', "An old beggar drapes his coat over your shoulders: \"The Beggars' Sect never abandons a brother.\"") },
  { id: 'long_bao_cu', p: 0.006, ok: (_c, f) => f === 'du_ngoan' || f === 'kiem_tien', text: tr('Đào móng nhà, bạn chạm phải một chiếc rương sơn son: bên trong là long bào của vương triều đã mất.', "Digging the house foundation, you hit a red-lacquered chest: inside is the dragon robe of a fallen dynasty.") },
];

function findLoot(c: Character, focus: string | null, tier: number) {
  for (const l of LOOT) {
    if (c.inventory.includes(l.id) || !l.ok(c, focus, tier)) continue;
    // trẻ mồ côi: con dao bếp là của bà hàng xóm dúi cho
    const text = isOrphan(c) && FAMILY_RE.test(l.text) ? l.text.replace(/^Mẹ /, tr('Bà hàng xóm ', "The neighbor woman ")).replace(/^(Your )?[Mm]other /, 'The neighbor woman ') : l.text;
    if (rnd() < l.p) return { id: l.id, text, name: ITEMS.find((i) => i.id === l.id)?.name ?? l.id };
  }
  return null;
}

// --------- Sự kiện đặc biệt ---------

/** Chọn đạo từ Luyện Khí tầng 5 (trước là Trúc Cơ), để người chơi sớm có mục tiêu */
export function needPath(c: Character): boolean {
  return !c.path && (c.realm >= 2 || (c.realm === 1 && c.layer >= 5));
}

function pathEvent(c: Character): GameEvent {
  return {
    id: PATH_EVENT_ID,
    title: tr('Chọn con đường tu tập', "Choose a cultivation path"),
    text: () =>
      c.realm >= 2
        ? tr('Trúc Cơ đã thành, đạo cơ vững chắc. Đã đến lúc chọn con đường sẽ đi suốt phần đời còn lại.', "Foundation Establishment is complete and your Dao foundation is solid. It is time to choose the path you will walk for the rest of your life.")
        : tr('Luyện Khí đã qua nửa chặng, chân khí bắt đầu có tính khí riêng. Đã đến lúc chọn con đường sẽ đi suốt phần đời còn lại.', "You are halfway through Qi Refining and your true qi has begun to show a temper of its own. It is time to choose the path you will walk for the rest of your life."),
    choices: pathChoices,
  };
}

function breakChance(c: Character) {
  return clamp(
    // chính đạo đạo tâm vững, đột phá dễ hơn chút
    (c.daoTam >= 40 ? 0.06 : 0) +
      // tà tu ở cảnh giới cao quen sát khí, vượt kiếp cũng vững không kém chính đạo
      (c.daoTam <= -40 && c.realm >= 5 ? 0.06 : 0) +
      (c.path === 'phat' ? 0.05 : 0) +
      // kiếp chứng đạo cuối cùng: khó hơn hẳn
      (c.realm >= TOP_REALM ? -0.25 : 0) +
      // 3.1.0b: thiên kiếp phi thăng khó thêm
      (c.realm === ASCEND_REALM - 1 && !c.cosmos ? -0.05 : 0) +
      (rankOf(c) === 3 ? CHAN_TRUYEN_BREAK : 0) +
      (omenIs('loi_van') ? 0.06 : 0) +
      (hasGift(c, 'g_thien_menh') ? 0.1 : 0) +
      // độ khó 1.0.3: hạ nền từ 0.39, mỗi cảnh giới khó thêm 0.08 thay vì 0.07
      0.34 -
      // tiên giới, ma giới tính lại từ đầu: Chân Tiên khó như Trúc Cơ, càng lên càng khó
      Math.max(0, (c.realm >= ASCEND_REALM ? c.realm - ASCEND_REALM + 2 : c.realm) - 2) * 0.08 +
      c.stats.ngoTinh / 450 +
      c.stats.tamCanh / 500 -
      c.stats.tamMa / 200 +
      (c.stats.khiVan - 50) / 500 +
      c.linhCanMul * 0.05 +
      // 3.1.0: từ Kim Đan trở lên (phàm giới) linh căn quyết định nhiều hơn
      (c.realm + 1 >= 3 && c.realm + 1 < ASCEND_REALM ? linhCanBreak(c.linhCanMul) : 0) +
      // Luân Hồi Đạo: Kiếp Số làm thiên kiếp nặng hơn, kiếp tích giúp người kẹt Độ Kiếp
      ksBreak(c),
    0.08,
    0.9,
  );
}

function breakEvent(c: Character): GameEvent {
  const target = c.realm + 1;
  const name = target > TOP_REALM ? tr('Chứng Đạo', "Attain the Dao") : target === ASCEND_REALM ? tr('Phi Thăng', "Ascension") : realmName(target, c.cosmos);
  const kiep = target >= 3;
  return {
    id: BREAK_EVENT_ID,
    title: kiep ? tr(`Thiên kiếp - đột phá ${name}`, `Heavenly tribulation - break through to ${name}`) : tr(`Đột phá ${name}`, `Break through to ${name}`),
    text: () =>
      usesVanDao(c)
        ? tr('Bầu trời im lặng lạ thường. Đây là bước cuối cùng: bốn kiếp vấn đạo, rồi mười ba đạo lôi. Hụt từ bốn đạo, những kiếp trước của bạn sẽ hiện về đỡ thay.', "The sky is strangely silent. This is the final step: four trials of the Dao, then thirteen bolts of lightning. Miss four or more, and your past lives will return to take them for you.")
        : kiep
        ? tr(`Mây đen kéo tới che kín trời. Lôi kiếp đang chờ. Tỉ lệ ước tính khoảng ${Math.round(breakChance(c) * 100)}%.`, `Dark clouds gather and blot out the sky. The lightning tribulation awaits. Estimated chance about ${Math.round(breakChance(c) * 100)}%.`)
        : tr(`Tu vi đã đến đỉnh, bình cảnh rung động. Tỉ lệ ước tính khoảng ${Math.round(breakChance(c) * 100)}%.`, `Your cultivation has peaked and the bottleneck trembles. Estimated chance about ${Math.round(breakChance(c) * 100)}%.`),
    choices: breakChoices,
  };
}

/** Vượt kiếp cuối của Đại La Kim Tiên, Ma Đế: chứng đạo, thoát khỏi mọi giới. hoDao: được vạn kiếp đỡ lôi thay */
export function chungDao(c: Character, ctx: EffectCtx, hoDao = false): string {
  c.dead = true;
  c.endTag = 'chung_dao';
  if (hoDao) c.qf = { ...(c.qf ?? {}), hoDao: 1 };
  c.cause = hoDao
    ? tr('Vạn kiếp đứng ra đỡ lôi thay, chứng đạo vĩnh hằng', "Ten thousand past lives stood up to take the lightning, and you attained the eternal Dao")
    : c.cosmos === 'ma'
      ? tr('Vượt Diệt Thế Ma Kiếp, chứng đạo Ma Thần bất diệt', "Survive the World-Ending Demon Tribulation and attain the Dao as an undying Demon God")
      : tr('Vượt Hỗn Nguyên Đại Kiếp, chứng đạo vĩnh hằng', "Survive the Primordial Great Tribulation and attain the eternal Dao");
  ctx.fx('breakthrough', tr('CHỨNG ĐẠO', "DAO ATTAINED"));
  if (hoDao) return tr('Bạn không chứng đạo một mình. Vạn kiếp của bạn đã đưa bạn tới đây.', "You did not attain the Dao alone. Ten thousand lives of yours carried you here.");
  return c.cosmos === 'ma'
    ? tr('Ma kiếp cuối cùng nổ tung cả ma giới. Khi khói máu tan đi, bạn đã không còn là ma, cũng không còn là người. Bạn chứng đạo Ma Thần, đứng ngoài mọi luân hồi.', "The final demon tribulation blasts the entire Demon Realm. When the bloody smoke clears, you are no longer demon, nor human. You attain the Dao as a Demon God, standing outside all reincarnation.")
    : tr('Hỗn Nguyên Đại Kiếp giáng xuống chín chín tám mươi mốt ngày. Ngày cuối cùng, bạn mỉm cười bước vào ánh sáng. Bạn chứng đạo, vĩnh viễn đứng ngoài luân hồi.', "The Primordial Great Tribulation rains down for eighty-one days. On the last day, you smile and step into the light. You attain the Dao, forever outside reincarnation.");
}

function attempt(c: Character, ctx: EffectCtx, bonus: number): string {
  const target = c.realm + 1;
  // phi thăng phải qua Ngũ Hành Đài trước (màn chơi ở giao diện)
  if (target === ASCEND_REALM && needTrial(c)) {
    c.breakDelay = 1;
    return tr('Năm tấm gương chắn trước cửa trời. Chưa hạ đủ năm bóng của chính mình trên Ngũ Hành Đài thì chưa thể độ kiếp.', "Five mirrors bar the heavenly gate. Until you defeat all five of your shadows on the Five Elements Platform, you cannot face the tribulation.");
  }
  const name = realmName(target, c.cosmos);
  const kiep = target >= 3;
  if (kiep) ctx.fx('lightning');
  const kb = kiep ? (c.kiepBonus ?? 0) : 0;
  c.kiepBonus = 0;
  const ok = rnd() < clamp(breakChance(c) + bonus + kb, 0.05, 0.97);
  if (ok) {
    // vượt kiếp cuối của Đại La Kim Tiên, Ma Đế: chứng đạo, thoát khỏi mọi giới
    if (target > TOP_REALM) return chungDao(c, ctx);
    // phi thăng: không còn là hồi kết, mà mở ra tiên giới (hoặc ma giới cho tà tu)
    if (target === ASCEND_REALM) {
      c.ascended = true;
      c.ascendAge = Math.floor(c.age);
      // tà tu không lên tiên giới mà vượt huyết kiếp, thành Ma Tôn, mở ra ma giới
      if (destOf(c) === 'ma') {
        c.cosmos = 'ma';
        c.endTag = 'ma_ton_do_kiep';
        enterRealm(c, ASCEND_REALM, ctx, []);
        stat(c, 'sucKhoe', 40);
        ctx.fx('breakthrough', tr('MA TÔN', "DEMON SOVEREIGN"));
        return tr(`Chín đạo huyết lôi giáng xuống, bạn nuốt trọn từng đạo một. Trời đất nhuộm đỏ, vạn ma quỳ lạy. Bạn bước qua cửa Ma giới, thành ${realmName(ASCEND_REALM, 'ma')}. Thọ nguyên lên tới ${c.lifespan} năm. Ở đây chỉ có một luật: kẻ mạnh nuốt kẻ yếu.`, `Nine bolts of blood lightning strike, and you swallow every one. Heaven and earth turn red, ten thousand demons kneel. You pass through the gate of the Demon Realm and become a ${realmName(ASCEND_REALM, 'ma')}. Your lifespan rises to ${c.lifespan} years. Here there is only one law: the strong devour the weak.`);
      }
      // trung lập: không lên tiên giới, không vào ma giới, mà bước vào Thái Hư
      if (destOf(c) === 'hu') {
        c.cosmos = 'hu';
        enterRealm(c, ASCEND_REALM, ctx, []);
        stat(c, 'sucKhoe', 40);
        ctx.fx('breakthrough', tr('THÁI HƯ', "GREAT VOID"));
        return tr(`Lôi kiếp tan, nhưng cửa trời không mở, cửa ma cũng không. Không thuộc về chính, cũng chẳng thuộc về tà, bạn bước vào Thái Hư giới, khoảng trống giữa hai cõi, thành ${realmName(ASCEND_REALM, 'hu')}. Thọ nguyên lên tới ${c.lifespan} năm. Ở đây không ai cai quản ai.`, `The tribulation fades, but neither the heavenly gate nor the demon gate opens. Belonging neither to the righteous nor the evil, you step into the Great Void Realm, the gap between the two worlds, and become a ${realmName(ASCEND_REALM, 'hu')}. Your lifespan rises to ${c.lifespan} years. Here no one rules anyone.`);
      }
      c.cosmos = 'tien';
      enterRealm(c, ASCEND_REALM, ctx, []);
      stat(c, 'sucKhoe', 40);
      ctx.fx('breakthrough', tr('PHI THĂNG', "ASCENSION"));
      return tr(`Chín đạo lôi kiếp tan biến, tiên quang giáng xuống. Bạn phi thăng tiên giới, thành ${realmName(ASCEND_REALM, 'tien')}! Thọ nguyên lên tới ${c.lifespan} năm. Tiên giới rộng lớn, con đường còn dài.`, `The nine tribulation bolts vanish and immortal light descends. You ascend to the Immortal Realm as a ${realmName(ASCEND_REALM, 'tien')}! Your lifespan rises to ${c.lifespan} years. The Immortal Realm is vast, and the road is still long.`);
    }
    enterRealm(c, target, ctx, []);
    ctx.fx('breakthrough', name);
    if (target > ASCEND_REALM) stat(c, 'sucKhoe', 10);
    stat(c, 'sucKhoe', 20);
    return tr(`Đột phá thành công! Bạn bước vào ${name}. Thọ nguyên tăng lên ${c.lifespan} năm.`, `Breakthrough successful! You enter ${name}. Lifespan rises to ${c.lifespan} years.`);
  }
  c.cultivation = Math.round(c.cultivation * 0.6);
  // kiếp chứng đạo thất bại thì phải chờ rất lâu mới thử lại
  c.breakDelay = c.realm >= TOP_REALM ? 30 : 3;
  // 3.1.0 bình cảnh: hỏng liên tiếp nhiều lần ở cùng cảnh giới thì phải bế quan
  const bf = c.breakFail && c.breakFail.r === c.realm ? c.breakFail.n + 1 : 1;
  c.breakFail = { r: c.realm, n: bf };
  let binh = '';
  if (bf >= BINH_CANH_FAILS && c.realm < TOP_REALM) {
    c.breakDelay = Math.max(c.breakDelay, BINH_CANH_YEARS);
    c.breakFail = { r: c.realm, n: 0 };
    binh = tr(` Hỏng ${bf} lần liền, bạn rơi vào bình cảnh, phải bế quan ${BINH_CANH_YEARS} năm mới thử lại được.`, ` After ${bf} failures in a row, you hit a bottleneck and must spend ${BINH_CANH_YEARS} years in seclusion before trying again.`);
    ctx.log(tr(`Rơi vào bình cảnh: bế quan ${BINH_CANH_YEARS} năm trước khi đột phá lại.`, `Bottleneck: ${BINH_CANH_YEARS} years of seclusion before your next breakthrough attempt.`), 'bad');
  }
  stat(c, 'tamMa', 8);
  const t = hurt(c, kiep ? 40 + (target - 3) * 12 : 25, ctx);
  if (c.stats.sucKhoe <= 0) {
    if (c.cosmos) c.endTag = COSMOS_DEATH_TAG[c.cosmos];
    die(c, c.cosmos ? COSMOS_KIEP_TEXT[c.cosmos] : kiep ? tr('Bạn hóa thành tro bụi dưới thiên kiếp.', "You are reduced to ash by the heavenly tribulation.") : tr('Xung quan thất bại, kinh mạch đứt đoạn.', "The breakthrough fails and your meridians snap."), ctx);
    return tr('Đột phá thất bại.', "Breakthrough failed.");
  }
  return tr('Đột phá thất bại, tu vi tụt mất một đoạn.', "Breakthrough failed, and you lose a chunk of cultivation.") + t + binh;
}

function breakChoices(c: Character): Choice[] {
  const havePill = (c.pills.truc_co ?? 0) > 0;
  const fourth: Choice =
    c.daoTam < -10 || c.path === 'ma'
      ? {
          label: tr('Huyết tế để phá quan', "Blood sacrifice to break through"),
          hint: tr('+35% tỉ lệ, rất tà', "+35% chance, very evil"),
          lean: 'ta',
          run: (ch, ctx) => {
            dao(ch, -15);
            stat(ch, 'tamMa', 10);
            ctx.fx('evil', tr('Huyết tế', "Blood sacrifice"));
            return tr('Bạn bày huyết trận, dùng máu tươi mở đường. ', "You lay out a blood formation and pave the way with fresh blood. ") + attempt(ch, ctx, 0.35);
          },
        }
      : c.partner
        ? { label: tr(`Nhờ ${c.partner} hộ pháp`, `Ask ${c.partner} to stand guard`), hint: '+15%', lean: 'chinh', run: (ch, ctx) => attempt(ch, ctx, 0.15) }
        : c.sect
          ? {
              label: tr('Xin sư môn hộ pháp', "Ask the sect to stand guard"),
              hint: tr('-300 linh thạch, +20%', "-300 spirit stones, +20%"),
              lean: 'chinh',
              run: (ch, ctx) => {
                money(ch, -300);
                return attempt(ch, ctx, 0.2);
              },
            }
          : { label: tr('Chọn ngày lành, cầu trời', "Pick an auspicious day, pray"), hint: '+8%', lean: 'trung', run: (ch, ctx) => attempt(ch, ctx, 0.08) };
  // Chứng Đạo mới: chỉ có bước lên đỉnh lôi hoặc củng cố, không còn cộng tỉ lệ
  if (usesVanDao(c))
    return [
      { label: tr('Bước lên đỉnh lôi', "Step onto the thunder peak"), hint: tr('tứ kiếp, rồi 13 đạo lôi', "four trials, then 13 bolts"), lean: 'trung', run: (ch, ctx) => attempt(ch, ctx, 0) },
      {
        label: tr('Củng cố thêm 5 năm', "Consolidate 5 more years"),
        hint: tr('tâm cảnh +, ngộ tính +', "Mind +, Insight +"),
        lean: 'chinh',
        run: (ch) => {
          ch.breakDelay = 5;
          stat(ch, 'tamCanh', 8);
          stat(ch, 'ngoTinh', 4);
          stat(ch, 'tamMa', -6);
          return tr('Bạn quyết định chưa vội. Đạo cơ cần thêm thời gian.', "You decide not to rush. Your Dao foundation needs more time.");
        },
      },
    ];
  return [
    {
      label: havePill ? tr('Uống Trúc Cơ Đan rồi xung quan', "Take a Foundation Pill, then break through") : tr('Mua đan dược rồi xung quan', "Buy a pill, then break through"),
      hint: havePill ? tr(`+25%, còn ${c.pills.truc_co}`, `+25%, ${c.pills.truc_co} left`) : tr(`-${pillPrice(c, 'truc_co')} linh thạch, +25%`, `-${pillPrice(c, 'truc_co')} spirit stones, +25%`),
      lean: 'trung',
      run: (ch, ctx) => {
        if (!usePill(ch, 'truc_co')) money(ch, -pillPrice(ch, 'truc_co'));
        return attempt(ch, ctx, 0.25);
      },
    },
    { label: tr('Cưỡng ép xung quan ngay', "Force it now"), hint: tr('không thêm gì', "no bonus"), lean: 'trung', run: (ch, ctx) => attempt(ch, ctx, 0) },
    {
      label: tr('Củng cố thêm 5 năm', "Consolidate 5 more years"),
      hint: tr('tâm cảnh +, ngộ tính +', "Mind +, Insight +"),
      lean: 'chinh',
      run: (ch) => {
        ch.breakDelay = 5;
        stat(ch, 'tamCanh', 8);
        stat(ch, 'ngoTinh', 4);
        stat(ch, 'tamMa', -6);
        return tr('Bạn quyết định chưa vội. Đạo cơ cần thêm thời gian.', "You decide not to rush. Your Dao foundation needs more time.");
      },
    },
    fourth,
  ];
}

const SUY: Record<'tien' | 'ma' | 'hu', string[]> = {
  tien: [
    tr('Thiên nhân ngũ suy, dấu hiệu thứ nhất: áo tiên bắt đầu bám bụi, phủi mãi không sạch.', "The Five Decays of the Celestial, first sign: your immortal robe begins to gather dust that won't brush off."),
    tr('Dấu hiệu thứ hai: hoa trên mũ tiên héo dần, cánh rụng từng cánh.', "Second sign: the flowers on your immortal crown wilt, shedding petal by petal."),
    tr('Dấu hiệu thứ ba: dưới nách rịn mồ hôi, điều chưa từng có từ ngày thành tiên.', "Third sign: sweat beads under your arms, something unheard of since you became immortal."),
    tr('Dấu hiệu thứ tư: thân thể tỏa mùi lạ, tiên hạc không dám bay lại gần.', "Fourth sign: your body gives off a strange odor, and the immortal cranes no longer dare fly near."),
    tr('Dấu hiệu thứ năm: ngồi đâu cũng không yên. Ngũ suy đã đủ, ngày tọa hóa không còn xa.', "Fifth sign: you can't sit still anywhere. All five decays have come; your passing is not far off."),
  ],
  ma: [
    tr('Ma thể bắt đầu suy: da nứt như đất khô.', "Your demon body begins to decay: your skin cracks like dry earth."),
    tr('Ma khí rỉ ra từ những kẽ nứt, gom lại không được.', "Demonic qi seeps out through the cracks, and you can't gather it back."),
    tr('Đôi mắt đỏ của bạn mờ dần.', "Your red eyes slowly dim."),
    tr('Huyết hải gọi tên bạn trong giấc ngủ.', "The sea of blood calls your name in your sleep."),
    tr('Ma thể mục ruỗng từ bên trong. Ngày tan vào huyết hải không còn xa.', "Your demon body rots from within. The day you dissolve into the sea of blood is near."),
  ],
  hu: [
    tr('Hư không bắt đầu đòi lại bạn: có lúc bàn tay trong suốt, nhìn xuyên qua được.', "The void begins to reclaim you: at times your hand turns transparent, and you can see right through it."),
    tr('Bóng của bạn không còn đi theo bạn nữa.', "Your shadow no longer follows you."),
    tr('Có lúc người khác nhìn thẳng qua bạn như không thấy.', "At times people look right through you as if you weren't there."),
    tr('Tiếng nói của bạn đến tai người khác chậm nửa nhịp.', "Your voice reaches others half a beat late."),
    tr('Bạn mờ dần như sương. Sắp đến ngày hóa thành một vì sao.', "You fade like mist. Soon you will become a star."),
  ],
};

/** Mỗi năm ở ba cõi: tiên giới có thiên quy trảm kẻ tâm tà; 20 năm cuối hiện dần 5 dấu hiệu suy tàn */
function cosmosYear(c: Character, ctx: EffectCtx) {
  const cos = c.cosmos as 'tien' | 'ma' | 'hu';
  const age = Math.floor(c.age);
  if (cos === 'tien' && c.daoTam < 0) {
    if (c.daoTam <= -20) {
      const f = fatal(c, ctx, 0.12, tr('Thiên Đình xét tiên tâm đã nhiễm bẩn. Bạn bị giải lên Trảm Tiên Đài, một nhát đao, tiên tịch xóa tên.', "The Heavenly Court judges your immortal heart defiled. You are dragged to the Immortal-Slaying Platform; one stroke of the blade, and your name is struck from the immortal registry."));
      if (c.dead) {
        c.endTag = 'tram_tien_dai';
        return;
      }
      if (f) ctx.log(f.trim(), 'bad');
    }
    if (c.tqWarn === undefined || age - c.tqWarn >= 5) {
      c.tqWarn = age;
      ctx.log(tr(`Thiên quy cảnh cáo: tiên nhân mà đạo tâm tà (${c.daoTam}). Tụt xuống -20 là có ngày lên Trảm Tiên Đài.`, `Heavenly law warns: an immortal with an evil Dao Heart (${c.daoTam}). Drop to -20 and one day you'll stand on the Immortal-Slaying Platform.`), 'big');
    }
  }
  const left = c.lifespan - c.age;
  if (left <= 20) {
    const idx = Math.min(4, Math.floor((20 - left) / 4));
    if ((c.suy ?? -1) < idx) {
      c.suy = idx;
      stat(c, 'sucKhoe', -3);
      ctx.log(SUY[cos][idx], 'big');
    }
  }
}

export const DAI_HAN_EVENT_ID = '__dai_han__';
function daiHanEvent(c: Character): GameEvent {
  return {
    id: DAI_HAN_EVENT_ID,
    title: tr('Đại hạn trước cửa trời', "The end, before the heavenly gate"),
    text: () =>
      tr(`Đã đến Độ Kiếp mà thọ nguyên chỉ còn chưa tới ${Math.max(1, Math.ceil(c.lifespan - c.age))} năm. Cửa trời còn xa, ngọn đèn trong người đã leo lét. Người tu đến bậc này có quyền tự chọn cách ra đi.`, `You've reached Tribulation, yet less than ${Math.max(1, Math.ceil(c.lifespan - c.age))} years of lifespan remain. The heavenly gate is still far, and the lamp within you flickers. One who has cultivated this far has the right to choose how to go.`),
    choices: () => [
      {
        label: tr('Tọa hóa chuyển thế', "Pass away and reincarnate"),
        hint: tr('chết ngay, kiếp sau mang theo tia linh thức', "die now, carry a spark of spirit into your next life"),
        lean: 'trung',
        run: (ch, ctx) => {
          ch.endTag = 'toa_hoa';
          ch.dead = true;
          ch.cause = tr('Tự tán công, tọa hóa chuyển thế. Một tia linh thức theo bạn sang kiếp sau.', "You disperse your own cultivation and pass away to be reborn. A spark of spirit follows you into your next life.");
          ctx.fx('death');
          return tr('Bạn ngồi xếp bằng, tự tán đi công lực cả đời. Chỉ giữ lại một tia linh thức, gói vào đó những gì đã ngộ ra. Kiếp sau, nó sẽ tìm về.', "You sit cross-legged and disperse a lifetime of cultivation, keeping only a spark of spirit wrapped around everything you have understood. In your next life, it will find its way back.");
        },
      },
      {
        label: tr('Truyền công cho người hữu duyên', "Pass your power to a destined one"),
        hint: tr('chết ngay, một đạo hữu trên giang hồ nhận 5 phúc duyên, kiếp sau được phúc báo', "die now, a fellow Daoist in the jianghu gets 5 Fortune, and you are blessed next life"),
        lean: 'chinh',
        run: (ch, ctx) => {
          ch.endTag = 'truyen_cong';
          ch.truyenCong = true;
          ch.dead = true;
          ch.cause = tr('Truyền hết công lực cho người hữu duyên rồi tọa hóa.', "You pass all your power to a destined one, then pass away.");
          dao(ch, 10);
          ctx.fx('death');
          return tr('Bạn gom toàn bộ công lực thành một luồng sáng, gửi theo gió đến một người hữu duyên trên giang hồ. Người nhẹ tênh, bạn mỉm cười nhắm mắt.', "You gather all your power into a stream of light and send it on the wind to a destined one in the jianghu. Feeling light as a feather, you smile and close your eyes.");
        },
      },
      {
        label: tr('Gắng sống nốt những năm còn lại', "Live out the remaining years"),
        hint: tr('không chọn gì, đợi thọ tận hoặc phi thăng kịp', "choose nothing, wait for the end or a timely ascension"),
        lean: 'trung',
        run: () => tr('Bạn chưa muốn buông. Mỗi ngày còn lại, bạn vẫn ngồi trước động phủ nhìn lên trời.', "You're not ready to let go. Every remaining day, you sit before your cave abode gazing at the sky."),
      },
    ],
  };
}

function findEvent(c: Character, id: string): GameEvent | null {
  if (id === DAI_HAN_EVENT_ID) return daiHanEvent(c);
  if (id === PATH_EVENT_ID) return pathEvent(c);
  if (id === BREAK_EVENT_ID) return breakEvent(c);
  return EVENTS.find((e) => e.id === id) ?? null;
}

export function resolveChoice(c: Character, p: PendingEvent, idx: number, ctx: EffectCtx, talents: string[] = []): PendingEvent | null {
  const e = findEvent(c, p.id);
  if (!e) return null;
  const choice = e.choices(c, p.seed ?? 0)[idx];
  if (!choice) return null;
  const mark = beforeChoice();
  const result = choice.run(c, ctx);
  const tone: Tone = choice.lean === 'chinh' ? 'chinh' : choice.lean === 'ta' ? 'ta' : 'normal';
  ctx.log(`${p.title}: ${choice.label}. ${result}`, c.dead ? 'big' : tone);
  const mishap = afterChoice(c, choice, mark, ctx);
  if (mishap) ctx.log(mishap, c.dead ? 'big' : 'bad');
  checkDeath(c, ctx);
  if (c.dead) return null;
  const brk = progress(c, ctx, talents);
  if (brk) return brk;
  if (needPath(c)) return buildPending(c, pathEvent(c));
  return null;
}

/** Tua nhiều năm khi bế quan. Dừng khi tới bình cảnh hoặc chết. */
export function closedDoor(c: Character, years: number, ctx: EffectCtx, talents: string[] = []): { pending: PendingEvent | null; done: number } {
  const rushed = c.lastClosed !== undefined && c.age - c.lastClosed < 3;
  ctx.log(rushed ? tr(`Vừa xuất quan chưa bao lâu, bạn lại bế quan ${years} năm. Cơ thể chưa kịp hồi phục.`, `Barely out of seclusion, you go back in for ${years} years. Your body hasn't had time to recover.`) : tr(`Bạn đóng cửa động phủ, bế quan ${years} năm.`, `You seal your cave abode and enter seclusion for ${years} years.`), rushed ? 'bad' : 'normal');
  let done = 0;
  let pending: PendingEvent | null = null;
  for (let i = 0; i < years; i++) {
    c.age = Math.floor(c.age) + 1;
    done++;
    pending = yearTick(c, ctx, { closed: true, talents });
    if (c.dead) break;
    // tẩu hỏa nhập ma khi bế quan, càng lâu càng dễ, bế quan dồn dập càng nguy
    const f = fatal(c, ctx, (rushed ? 0.012 : 0.005) + c.stats.tamMa / 4000, tr('Bế quan quá lâu, một mình đối diện tâm ma. Người ta phá cửa động phủ thì bạn đã hóa thành bộ xương khô.', "Too long in seclusion, alone with your heart demon. When they break down the door of your cave abode, you are a dry skeleton."));
    if (c.dead) {
      c.endTag = 'be_quan';
      break;
    }
    if (f) ctx.log(f.trim(), 'good');
    if (pending) break;
  }
  if (c.dead) return { pending: null, done };
  c.lastClosed = Math.floor(c.age);
  c.streak = { f: 'be_quan', n: 0 };
  ctx.log(tr(`Xuất quan sau ${done} năm.`, `You emerge from seclusion after ${done} years.`), 'good');
  closedDoorLosses(c, ctx, done, rushed);
  return { pending, done };
}

/** Bế quan lâu, thế gian bên ngoài đã đổi khác */
function closedDoorLosses(c: Character, ctx: EffectCtx, years: number, rushed: boolean) {
  const r = (p: number) => rnd() < Math.min(0.9, p * (rushed ? 1.5 : 1));
  const notes: string[] = [];
  if (r(years * 0.03)) {
    const lost = Math.round(c.linhThach * (0.1 + rnd() * 0.3));
    if (lost > 0) {
      money(c, -lost);
      notes.push(tr(`Kẻ trộm đào được vào kho, lấy mất ${lost} linh thạch.`, `A thief tunnels into your storeroom and makes off with ${lost} spirit stones.`));
    }
  }
  if (c.partner && r(years * 0.035)) {
    notes.push(tr(`${c.partner} đợi mãi không thấy bạn, đã bỏ đi theo người khác.`, `${c.partner} waited and waited for you, then left with someone else.`));
    c.partner = null;
    stat(c, 'tamMa', 12);
  }
  if (c.pet && r(years * 0.025)) {
    c.pet = false;
    notes.push(tr(`Con ${petName(c)} không ai cho ăn, bỏ đi không trở lại.`, `With no one to feed it, your ${petName(c)} wanders off and never returns.`));
  }
  if (c.sect && r(years * 0.02)) {
    notes.push(tr(`${c.sect} gặp đại nạn khi bạn bế quan. Sư môn tan tác, không còn chốn về.`, `${nameOf(c.sect)} met with catastrophe during your seclusion. The sect is scattered, and you have nowhere to return to.`));
    c.sect = null;
    stat(c, 'tamCanh', -8);
  }
  if ((c.income ?? 0) > 0 && r(years * 0.03)) {
    c.income = Math.round((c.income ?? 0) / 2);
    notes.push(tr('Ruộng đất, cửa tiệm không người trông coi, bị kẻ khác chiếm mất một nửa.', "With no one minding your fields and shop, others seized half of them."));
  }
  if (r(years * 0.03)) {
    notes.push(tr('Người thân trong nhà đã lần lượt qua đời. Không ai đợi bạn xuất quan.', "Your family members have passed away one by one. No one is waiting for you to come out."));
    stat(c, 'tamMa', 8);
  }
  if (r(years * 0.025) && !c.enemy) {
    c.enemy = tr('kẻ đã nhòm ngó động phủ của bạn bao năm', "the one who has eyed your cave abode for years");
    notes.push(tr('Có kẻ đã rình rập động phủ suốt những năm bạn bế quan.', "Someone was lurking around your cave abode all the years you were in seclusion."));
  }
  // ngồi yên quá lâu, cơ thể suy kiệt
  const atrophy = Math.round(years * (rushed ? 1.6 : 0.8));
  if (atrophy >= 4) {
    stat(c, 'sucKhoe', -atrophy);
    notes.push(tr(`Ngồi bất động quá lâu, cơ thể suy kiệt (-${atrophy} sức khỏe).`, `Sitting motionless for too long has drained your body (-${atrophy} Health).`));
  }
  if (notes.length) {
    ctx.fx('hurt', tr('Thế sự đổi thay', "The world has changed"));
    for (const n of notes) ctx.log(n, 'bad');
  } else if (years >= 10) ctx.log(tr('Bước ra khỏi động phủ, cảnh vật vẫn y nguyên. Thật may mắn.', "You step out of your cave abode and everything is just as it was. How lucky."), 'good');
}

/** Hậu quả khi làm một việc quá nhiều năm liền */
const OVERWORK: Record<string, { warn: string; hits: { p: number; run: (c: Character, ctx: EffectCtx) => string }[] }> = {
  tu_luyen: {
    warn: tr('Bạn khổ tu liền mấy năm không nghỉ. Kinh mạch bắt đầu căng như dây đàn.', "You've cultivated nonstop for years. Your meridians are starting to stretch taut as zither strings."),
    hits: [
      {
        p: 3,
        run: (c, ctx) => {
          stat(c, 'sucKhoe', -18);
          c.cultivation = Math.round(c.cultivation * 0.85);
          ctx.fx('hurt', tr('Kinh mạch tổn thương', "Meridian damage"));
          return tr('Khổ tu quá độ, kinh mạch rạn nứt. Phải nằm liệt mấy tháng, tu vi tụt một đoạn.', "Overcultivation cracks your meridians. You're bedridden for months and your cultivation slips.");
        },
      },
      {
        p: 2,
        run: (c) => {
          stat(c, 'tamMa', 14);
          stat(c, 'tamCanh', -8);
          return tr('Đêm nào cũng nghe tiếng thì thầm trong đầu. Tu luyện không ngơi nghỉ khiến tâm ma lớn dần.', "Every night you hear whispers in your head. Cultivating without rest is feeding your heart demon.");
        },
      },
      {
        p: 1,
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.35, tr('Luyện công không ngơi nghỉ, chân khí nghịch chuyển. Bạn tẩu hỏa nhập ma giữa đêm.', "Training without rest, your true qi reverses. You fall into qi deviation in the middle of the night."));
          return f ? tr(`Chân khí đột nhiên chạy loạn...${f}`, `Your true qi suddenly runs wild...${f}`) : tr('Chân khí đột nhiên chạy loạn, bạn suýt tẩu hỏa nhập ma.', "Your true qi suddenly runs wild, and you nearly fall into qi deviation.");
        },
      },
    ],
  },
  luyen_dan: {
    warn: tr('Ngày nào cũng hít khói lò đan, bạn bắt đầu ho khan.', "Breathing furnace smoke every day, you start to develop a dry cough."),
    hits: [
      {
        p: 3,
        run: (c, ctx) => {
          stat(c, 'sucKhoe', -15);
          ctx.fx('hurt', tr('Trúng đan độc', "Pill poisoning"));
          return tr('Đan độc tích tụ trong phổi, bạn ho ra máu đen.', "Pill toxins build up in your lungs; you cough up black blood.");
        },
      },
      {
        p: 2,
        run: (c, ctx) => {
          const lost = Math.round(c.linhThach * 0.25);
          money(c, -lost);
          ctx.fx('hurt', tr('Nổ lò', "Furnace explosion"));
          return tr(`Mệt mỏi lơ đãng, lò đan nổ tung, thiêu rụi ${lost} linh thạch dược liệu.`, `Tired and distracted, your pill furnace explodes, burning up ${lost} spirit stones' worth of herbs.`) + hurt(c, 15, ctx);
        },
      },
      {
        p: 1,
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.3, tr('Lò đan phát nổ trong lúc bạn ngủ gục bên cạnh. Động phủ sập xuống.', "The furnace explodes while you doze beside it. Your cave abode collapses."));
          return f ? tr(`Đêm ấy lửa lò bùng lên dữ dội...${f}`, `That night the furnace fire flares up violently...${f}`) : tr('Lò đan phát nổ, bạn kịp lăn ra ngoài trong gang tấc.', "The furnace explodes, and you roll out just in time.");
        },
      },
    ],
  },
  du_ngoan: {
    warn: tr('Bạn đã phiêu bạt nhiều năm, chân đã mỏi, túi đã nhẹ.', "You've wandered for many years; your feet are weary and your purse is light."),
    hits: [
      {
        p: 3,
        run: (c, ctx) => {
          stat(c, 'sucKhoe', -14);
          ctx.fx('hurt', tr('Bệnh xứ lạ', "Foreign illness"));
          return tr('Bạn mắc bệnh lạ ở xứ người, sốt li bì không ai chăm.', "You catch a strange illness in a foreign land, burning with fever and no one to tend you.");
        },
      },
      {
        p: 2,
        run: (c) => {
          const lost = Math.round(c.linhThach * 0.3);
          money(c, -lost);
          return tr(`Ngủ quên ở quán trọ, bị lục sạch ${lost} linh thạch.`, `You fall asleep at an inn and get cleaned out of ${lost} spirit stones.`);
        },
      },
      {
        p: 1,
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.3, tr('Bạn lạc vào chướng khí rừng thiêng, ngã xuống không bao giờ tỉnh dậy.', "You stray into the miasma of a sacred forest, collapse, and never wake."));
          return f ? tr(`Mải đi, bạn lạc vào vùng chướng khí...${f}`, `Lost in your travels, you wander into a miasma zone...${f}`) : tr('Bạn lạc vào chướng khí, bò được ra ngoài khi chỉ còn thoi thóp.', "You wander into a miasma and crawl out barely breathing.");
        },
      },
    ],
  },
  kiem_tien: {
    warn: tr('Bạn làm lụng quần quật quanh năm, chẳng có ngày nghỉ.', "You toil all year round without a single day off."),
    hits: [
      {
        p: 3,
        run: (c, ctx) => {
          stat(c, 'sucKhoe', -16);
          stat(c, 'tamCanh', -6);
          ctx.fx('hurt', tr('Kiệt sức', "Exhaustion"));
          return tr('Lao lực quá độ, bạn ngã quỵ giữa phường thị.', "Overworked, you collapse in the middle of the market.");
        },
      },
      {
        p: 2,
        run: (c) => {
          const lost = Math.round(c.linhThach * 0.35);
          money(c, -lost);
          return tr(`Tham làm thêm một mối, bạn bị lừa mất ${lost} linh thạch. Tham thì thâm.`, `Greedy for one more deal, you get swindled out of ${lost} spirit stones. Greed never pays.`);
        },
      },
      {
        p: 1,
        run: (c, ctx) => {
          // đã Độ Kiếp: không còn là cướp phàm tục mà là bọn tán tu chuyên đoạt đồ của người sắp độ kiếp
          if (c.realm >= DO_KIEP_REALM && !c.cosmos) {
            const f = fatal(c, ctx, 0.25, tr('Đoạt Kiếp Minh liên thủ bày Khốn Long Trận. Kiếp chưa kịp độ, bạn đã bị luyện thành tro giữa trận.', "The Tribulation Plunderers' League joins hands in a Dragon-Binding Array. Before you can face your tribulation, you are refined to ash inside it."));
            if (f) return tr(`Tin bạn sắp độ kiếp lan khắp tu chân giới...${f}`, `Word that you are about to face tribulation spreads across the cultivation world...${f}`);
            const lost = Math.round(c.linhThach * 0.35);
            money(c, -lost);
            return tr(`Tin bạn sắp độ kiếp lan ra. Ba tên tán tu Đoạt Kiếp Minh bày Khốn Long Trận chặn đường đoạt bảo vật hộ kiếp. Bạn phá trận thoát ra, mất ${lost} linh thạch.`, `Word spreads that you are about to face tribulation. Three rogue cultivators of the Tribulation Plunderers' League set a Dragon-Binding Array to seize your protective treasures. You break out, losing ${lost} spirit stones.`) + hurt(c, 25, ctx);
          }
          const f = fatal(c, ctx, 0.25, tr('Mang nhiều tiền đi đêm quá thường xuyên, bạn bị cướp giết bên bờ sông.', "Carrying too much money at night too often, you are robbed and killed by the river."));
          return f ? tr(`Lại một chuyến hàng đêm...${f}`, `Another night run with the goods...${f}`) : tr('Bị cướp chặn đường lúc đêm khuya, bạn bỏ của chạy lấy người.', "Robbers block your way late at night; you abandon the goods and run for your life.");
        },
      },
    ],
  },
  ket_duyen: {
    warn: tr('Rượu chè, hội hè liên miên. Tu luyện bỏ bê đã lâu.', "Endless wine and parties. You've neglected your cultivation for ages."),
    hits: [
      {
        p: 3,
        run: (c, ctx) => {
          stat(c, 'sucKhoe', -12);
          c.cultivation = Math.round(c.cultivation * 0.9);
          ctx.fx('hurt', tr('Tửu sắc quá độ', "Overindulgence"));
          return tr('Tửu sắc quá độ, thân thể hao mòn, tu vi sa sút.', "Too much wine and romance wears your body down, and your cultivation slips.");
        },
      },
      {
        p: 2,
        run: (c) => {
          const lost = Math.round(c.linhThach * 0.3);
          money(c, -lost);
          stat(c, 'tamMa', 8);
          return tr(`Người tri kỷ hóa ra là kẻ lừa tình, cuỗm đi ${lost} linh thạch.`, `Your soulmate turns out to be a romance scammer and runs off with ${lost} spirit stones.`);
        },
      },
      {
        p: 1,
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.25, tr('Bạn bị chồng của người tình đâm chết trong đêm.', "Your lover's husband stabs you to death in the night."));
          return f ? tr(`Dan díu quá nhiều nơi...${f}`, `Too many affairs in too many places...${f}`) : tr('Bị đánh ghen một trận thừa sống thiếu chết.', "A jealous spouse beats you within an inch of your life.") + hurt(c, 25, ctx);
        },
      },
    ],
  },
  tru_yeu: {
    warn: tr('Bạn giết yêu thú liên miên, trên người nồng nặc mùi máu.', "You've slain demon beasts nonstop; you reek of blood."),
    hits: [
      {
        p: 3,
        run: (c, ctx) => {
          stat(c, 'sucKhoe', -15);
          ctx.fx('hurt', tr('Thương tích dồn', "Wounds piling up"));
          return tr('Vết thương cũ chưa lành đã thêm vết mới. Bạn gục xuống giữa rừng.', "New wounds land before the old ones heal. You collapse in the forest.");
        },
      },
      {
        p: 2,
        run: (c) => {
          stat(c, 'tamMa', 12);
          dao(c, -4);
          return tr('Sát khí nhập tâm. Bạn bắt đầu thấy khoái cảm mỗi khi giết chóc.', "Killing intent seeps into your heart. You start to enjoy every kill.");
        },
      },
      {
        p: 1,
        run: (c, ctx) => {
          const f = fatal(c, ctx, 0.3, tr('Yêu tộc kết bầy báo thù. Bạn bị vây giết giữa rừng sâu.', "The yao race gathers in packs for revenge. You are surrounded and slain deep in the forest."));
          return f ? tr(`Đêm ấy cả rừng rộ lên tiếng gầm...${f}`, `That night the whole forest erupts in roars...${f}`) : tr('Yêu tộc kết bầy báo thù, bạn chạy thoát trong gang tấc.', "The yao race gathers in packs for revenge; you escape by a hair.") + hurt(c, 25, ctx);
        },
      },
    ],
  },
};



function overwork(c: Character, ctx: EffectCtx, focus: string, n: number) {
  const o = OVERWORK[focus];
  if (!o || overworkFree(focus)) return;
  const SAFE_YEARS = safeYears(c);
  if (n === SAFE_YEARS - 1) ctx.log(tr(`${o.warn} Nên đổi việc khác cho thân tâm nghỉ ngơi.`, `${o.warn} Switch to something else and let your body and mind rest.`), 'bad');
  if (n < SAFE_YEARS) return;
  // quá ngưỡng: năm nào cũng nhắc, nói rõ có thể mất mạng
  ctx.log(tr(`⚠ Đã ${n} năm liền làm một việc. Càng kéo dài càng dễ ngã bệnh, thậm chí mất mạng. Hãy đổi sang việc khác.`, `⚠ ${n} years straight doing the same thing. The longer it goes, the likelier you fall ill, or even die. Switch to something else.`), 'big');
  const chance = Math.min(0.4, 0.07 + (n - SAFE_YEARS) * 0.04);
  if (rnd() >= chance) return;
  const hit = weighted(
    rnd,
    o.hits.map((h) => ({ ...h, w: h.p + (n > 10 && h.p === 1 ? 1 : 0) })),
  );
  const text = hit.run(c, ctx);
  if (c.dead) c.endTag = 'qua_do';
  ctx.log(tr(`${n} năm liền không nghỉ. ${text}`, `${n} years straight without rest. ${text}`), c.dead ? 'big' : 'bad');
}

export function usePillNow(c: Character, id: string, ctx: EffectCtx, talents: string[] = []): PendingEvent | null {
  if (!usePill(c, id)) return null;
  // đan độc: uống dồn trong một năm thì dược lực giảm dần, quá 3 viên tích độc trong người
  const yr = Math.floor(c.age);
  if (!c.danDoc || c.danDoc.y !== yr) c.danDoc = { y: yr, n: 0 };
  const nth = c.danDoc.n++;
  // Tụ Khí Đan: mỗi năm chỉ viên đầu đủ lực
  const potency = (id === 'tu_khi' ? [1, 0.3, 0.1] : [1, 0.6, 0.4, 0.25, 0.15])[nth] ?? 0.1;
  if ((id === 'tu_khi' || id === 'truc_co') && nth >= 3) {
    stat(c, 'tamMa', 4);
    stat(c, 'sucKhoe', -5);
    if (nth === 3) ctx.log(tr('Uống đan quá nhiều trong một năm, đan độc tích lại trong kinh mạch. Dược lực giảm hẳn, người nóng ran.', "Too many pills in one year; toxins build up in your meridians. The medicine's effect drops sharply and your body burns."), 'bad');
  }
  if (id === 'tu_khi') {
    addCult(c, reward(c, 0.25 * potency));
    ctx.fx('layer', tr('+tu vi', '+cultivation'));
  } else if (id === 'dien_tho') {
    // kháng dược: viên sau kém viên trước
    const y = dienThoYears(c.dtUsed ?? 0);
    c.dtUsed = (c.dtUsed ?? 0) + 1;
    addLife(c, y);
    ctx.fx('heal', tr(`+${y} năm thọ`, `+${y} yrs lifespan`));
    if (y <= 2) ctx.log(tr('Uống Diên Thọ Đan nhiều quá, thân thể đã quen thuốc. Dược lực chỉ còn chút ít.', "Too many Longevity Pills - your body has grown used to them. Only a trace of their effect remains."), 'bad');
  } else if (id === 'thanh_tam') {
    stat(c, 'tamMa', -25);
    ctx.fx('heal', tr('Thanh tâm', "Clear mind"));
  } else if (id === 'huyet_sat') {
    // tà tu luyện hóa tâm ma bằng máu; chính đạo uống vào thì phản tác dụng
    if (c.daoTam <= -20) {
      stat(c, 'tamMa', -40);
      stat(c, 'sucKhoe', -12);
      ctx.fx('evil', tr('Huyết sát luyện tâm', "Blood-slaughter heart tempering"));
    } else {
      stat(c, 'tamMa', 10);
      ctx.fx('hurt', tr('Huyết khí nghịch', "Qi and blood reversed"));
    }
  } else if (id === 'hoi_xuan') {
    stat(c, 'sucKhoe', 40);
    ctx.fx('heal', tr('+sức khỏe', "+Health"));
  } else if (id === 'truc_co') {
    // dùng khi đột phá; uống lúc thường chỉ tăng chút tu vi
    addCult(c, reward(c, 0.15 * potency));
    ctx.fx('layer');
  }
  ctx.log(tr(`Bạn uống ${PILLS.find((p) => p.id === id)?.name}.`, `You take a ${PILLS.find((p) => p.id === id)?.name}.`), 'good');
  return progress(c, ctx, talents);
}

/** Sau khi được cộng tu vi ngoài vòng năm (đánh quái...): lên tầng, đột phá, chọn đường, kiểm tra chết */
export function checkProgress(c: Character, ctx: EffectCtx, talents: string[] = []): PendingEvent | null {
  checkDeath(c, ctx);
  if (c.dead) return null;
  const brk = progress(c, ctx, talents);
  if (brk) return brk;
  if (needPath(c)) return buildPending(c, pathEvent(c));
  return null;
}

export function karmaOf(c: Character) {
  // phúc duyên mỗi kiếp: giảm nhẹ để cao thủ không mua Tiên cốt mỗi kiếp
  const points = 5 + c.realm * 6 + Math.floor(c.age / 25) + (c.ascended ? 70 : 0);
  // Kiếp Số cao thì phúc nhiều hơn; vừa uống canh Mạnh Bà thì +20%
  const phuc = Math.round((points + Math.max(0, Math.round(c.daoTam / 4))) * ksPhuc(c) * (c.tanHon ? 1.2 : 1));
  // tà tu tích nghiệp lực theo độ tà và cảnh giới, dùng để mua thiên phú tà đạo ở kiếp sau
  const nghiep = c.daoTam < -30 ? Math.round(-c.daoTam / 4 + c.realm * 4 + (c.ascended ? 60 : 0)) : 0;
  return { phuc, nghiep };
}

export function seasonOf(age: number) {
  return Math.floor((age % 1) * 4);
}

export function describeLean(daoTam: number) {
  if (daoTam >= 60) return tr('Chính đạo', "Righteous Path");
  if (daoTam >= 20) return tr('Hướng thiện', "Leaning good");
  if (daoTam > -20) return tr('Trung lập', "Neutral");
  if (daoTam > -60) return tr('Hướng tà', "Leaning evil");
  return tr('Ma đạo', "Demonic Path");
}

export { PATHS };
