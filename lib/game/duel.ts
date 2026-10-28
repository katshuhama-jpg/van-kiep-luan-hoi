import { addMile } from './miles';
import { chieuOf, dichThuDeath, dichThuDraw, dichThuLose, dichThuRevenge, dichThuWin, dongDaoDraw, dongDaoLose, dongDaoWin, dongMonDraw, dongMonLose, dongMonWin, marginOf, swornLine, tamMaLine } from './fightLines';
import { qmark } from './hook';
import { DROP_MUL, combatLevel, hit, playerStats, type Fighter } from './combat';
import { ITEMS, REALMS, fxText, realmLabel } from './data';
import { demoChar } from './demo';
import { ELEMENT_IDS, elemMul, elemRel, elementOf, type ElemRel } from './nguhanh';
import { genName } from './engine';
import { addCult, fatal, giveItem, money, reward, stat } from './helpers';
import { PROVOKE_MUL, SOCIAL } from './social';
import { daiBiDue, promote, sectSide } from './sect';
import type { Character, EffectCtx, RivalChar, Slot, Vendetta } from './types';
import { tr } from '../i18n';
import { nameOf } from '../hanviet';

/**
 * Kỳ ngộ giang hồ: gặp nhân vật của người chơi khác (hoặc chính mình kiếp trước).
 * - Đồng đạo: cùng phe, có thể luận võ, kết giao hoặc cáo từ.
 * - Địch thủ: khác phe, thường mạnh hơn, phải đánh hoặc liều bỏ chạy.
 * - Tâm ma kiếp trước: bóng của chính mình kiếp trước, không chạy được.
 * Có màn cảnh báo trước khi vào trận, nền sân đấu riêng, đánh tối đa 5 hiệp.
 */

export type DuelKind = 'dong_dao' | 'dich_thu' | 'kiep_truoc' | 'dong_mon' | 'ngu_hanh' | 'ma_dau';
export const DUEL_PER_YEAR = 0.1; // trung bình khoảng 10 năm gặp một lần
export const DUEL_TURNS = 5;

export interface DuelFoe {
  kind: DuelKind;
  rival: RivalChar;
  npc: boolean; // không có người chơi thật phù hợp, giang hồ vô danh thay thế
  rel: 'yeu' | 'ngang' | 'manh';
  reason: string; // lý do gặp, mỗi lần một khác
  betray?: boolean; // đồng đạo trở mặt khi uống trà
  revenge?: Vendetta; // gặp lại kẻ thù cũ để báo thù
  hunt?: boolean; // truy sát chủ động: tự bỏ tiền dò tung tích kẻ thù
  sworn?: boolean; // gặp huynh đệ kết nghĩa
  provoke?: boolean; // từng khiêu khích nhau: thắng thua đều gấp rưỡi
  bounty?: number; // tiền truy nã trên đầu đối thủ
  daiBi?: boolean; // trận Đại bỉ tông môn: thắng thì thăng bậc
}

export const DUEL_INFO: Record<DuelKind, { title: string; tag: string; warn: string }> = {
  dong_dao: { title: tr('Gặp đồng đạo', "A kindred spirit"), tag: tr('Đồng đạo', "Kindred"), warn: tr('Một tu sĩ cùng chí hướng chắn đường, chắp tay thi lễ: "Nghe danh đã lâu, xin được lĩnh giáo vài chiêu."', "A like-minded cultivator blocks your way and bows with clasped hands: \"Your name precedes you. I humbly ask to learn a few of your moves.\"") },
  dich_thu: { title: tr('Địch thủ xuất hiện!', "A rival appears!"), tag: tr('Địch thủ', "Rival"), warn: tr('Sát khí ập tới. Kẻ khác đạo đã đợi bạn ở đây từ lâu. Hôm nay chỉ một người được rời đi.', "Killing intent rushes in. Someone of a different Yao has long been waiting for you here. Only one of you leaves today.") },
  dong_mon: { title: tr('Đồng môn tỷ thí', "Sect sparring"), tag: tr('Đồng môn', "Fellow disciple"), warn: tr('Một đồng môn chặn bạn ở diễn võ trường: "Sư môn dạy ta, hôm nay xem ai học giỏi hơn."', "A fellow disciple blocks you on the training ground: \"We had the same teachers. Today we see who learned better.\"") },
  kiep_truoc: { title: tr('Tâm ma kiếp trước', "Heart demon of a past life"), tag: tr('Kiếp trước', "Past life"), warn: tr('Mặt hồ phẳng lặng bỗng in bóng một người. Đó là bạn, của một kiếp đã qua. Muốn đi tiếp, phải vượt qua chính mình.', "A figure suddenly appears on the still surface of the lake. It is you, from a life gone by. To go on, you must overcome yourself.") },
  ma_dau: { title: tr('Ma đầu chặn đường!', "A demon lord blocks the road!"), tag: tr('Ma đầu', "Demon lord"), warn: tr('Một bóng người mắt đỏ như máu chặn ngang đường, sát khí ngút trời.', "A figure with blood-red eyes stands across the road, killing intent soaring to the heavens.") },
  ngu_hanh: { title: tr('Ngũ Hành Vấn Tâm Đài', "Five Elements Heart-Trial Platform"), tag: tr('Ngũ Hành Đài', "Five Elements Platform"), warn: tr('Năm tấm gương dựng quanh đài đá. Trong mỗi tấm là bạn, mang một bản mệnh khác.', "Five mirrors stand around a stone platform. In each one is you, with a different natal element.") },
};

function lean(d: number) {
  return d >= 20 ? 1 : d <= -20 ? -1 : 0;
}

/** Ghép nhân vật đầy đủ từ dữ liệu rút gọn, để vẽ hình và tính chỉ số */
export function foeChar(r: RivalChar): Character {
  return demoChar({
    name: r.name,
    gender: r.gender,
    race: r.race ?? 'nhan',
    realm: r.realm,
    layer: r.layer,
    path: r.path,
    daoTam: r.daoTam,
    age: Math.max(20, r.age),
    lifespan: Math.max(r.lifespan ?? 100, r.age + 1),
    hairColor: r.hairColor,
    hairStyle: r.hairStyle,
    outfitTone: r.outfitTone,
    outfitCut: r.outfitCut,
    equipped: r.equipped ?? { ao: 'ao_vai' },
    lookSeed: r.lookSeed,
    element: r.element,
    cultivation: 0,
    stats: { tamCanh: 60, ngoTinh: 60, khiVan: 50, tamMa: 10, sucKhoe: 90 },
  });
}

export function foeStats(r: RivalChar, me?: Character): Fighter {
  const s = playerStats(foeChar(r));
  if (!me) return s;
  // Luân Hồi Đạo: bên luân hồi nhiều hơn thì hồn mòn hơn (quy hết về chỉ số của đối thủ cho gọn)
  const m = lifeMul(r.lifeNo ?? 1, me.lifeNo) / lifeMul(me.lifeNo, r.lifeNo ?? 1);
  return { ...s, atk: Math.round(s.atk * m), def: Math.round(s.def * m) };
}

/**
 * Luân Hồi Đạo (3.0.0): luân hồi nhiều không còn là lợi thế. Kẻ đã đầu thai nhiều hơn thì hồn phách mòn hơn:
 * mỗi kiếp chênh lệch -1,5% công và thủ, tối đa -15%. Bên ít kiếp hơn không được cộng gì.
 */
export function lifeMul(foeLife: number, myLife: number): number {
  const d = foeLife - myLife;
  return d > 0 ? 1 - Math.min(0.15, d * 0.015) : 1;
}

export function lifeText(foeLife: number, myLife: number): { text: string; tone: 'good' | 'bad' | 'normal' } {
  const d = foeLife - myLife;
  if (d > 0) return { text: tr(`Đối thủ luân hồi nhiều hơn bạn ${d} kiếp, hồn phách đã mòn: công và thủ ${Math.round((lifeMul(foeLife, myLife) - 1) * 100)}%.`, `Your opponent has reincarnated ${d} more lives than you; their soul is worn thin: Attack and Defense ${Math.round((lifeMul(foeLife, myLife) - 1) * 100)}%.`), tone: 'good' };
  if (d < 0) return { text: tr(`Bạn luân hồi nhiều hơn ${-d} kiếp, hồn phách đã mòn: công và thủ ${Math.round((lifeMul(myLife, foeLife) - 1) * 100)}%.`, `You have reincarnated ${-d} more lives; your soul is worn thin: Attack and Defense ${Math.round((lifeMul(myLife, foeLife) - 1) * 100)}%.`), tone: 'bad' };
  return { text: tr('Cùng số kiếp luân hồi, không ai hơn ai.', "Same number of lives reincarnated. Neither has the edge."), tone: 'normal' };
}

function npcRival(c: Character, realm: number, sign: number, rnd: () => number): RivalChar {
  const gender = rnd() < 0.5 ? 'nam' : 'nu';
  const paths = sign < 0 ? ['ma', 'kiem', 'dan'] : sign > 0 ? ['kiem', 'phat', 'tran'] : ['kiem', 'dan', 'tran'];
  const weapons = ITEMS.filter((i) => i.slot === 'vu_khi' && i.minRealm <= realm && !i.path);
  const robes = ITEMS.filter((i) => i.slot === 'ao' && i.minRealm <= realm && !i.path);
  return {
    player: '',
    name: genName(gender),
    gender,
    realm,
    layer: 1 + Math.floor(rnd() * (REALMS[realm]?.layers ?? 3)),
    path: realm >= 2 ? (paths[Math.floor(rnd() * paths.length)] as RivalChar['path']) : null,
    daoTam: sign * (30 + Math.floor(rnd() * 60)),
    age: 20 + Math.floor(rnd() * 60),
    hairColor: ['den', 'nau', 'bac', 'do'][Math.floor(rnd() * 4)],
    hairStyle: Math.floor(rnd() * 10),
    outfitTone: Math.floor(rnd() * 5),
    outfitCut: Math.floor(rnd() * 4),
    equipped: { ao: robes[Math.floor(rnd() * robes.length)]?.id ?? 'ao_vai', vu_khi: weapons[Math.floor(rnd() * weapons.length)]?.id },
    lookSeed: Math.floor(rnd() * 2 ** 31),
    lifeNo: Math.max(1, c.lifeNo + Math.floor(rnd() * 9) - 3),
    alive: true,
  };
}

/** Đổi cấp chiến đấu ra cảnh giới và tầng: Luyện Khí 1-9, từ Trúc Cơ mỗi cảnh giới 3 tầng */
function clToRealm(cl: number): { realm: number; layer: number } {
  if (cl <= 9) return { realm: 1, layer: Math.max(1, cl) };
  const realm = Math.min(11, 2 + Math.floor((cl - 10) / 3));
  return { realm, layer: Math.min(3, cl - (9 + (realm - 2) * 3)) };
}

/** Danh hiệu ma đầu theo con đường của bóng */
const MA_TITLE: Record<string, string> = {
  kiem: tr('Huyết Kiếm Ma Soái', "Blood Sword Demon Marshal"),
  ma: tr('Huyết Ma Lão Tổ', "Blood Demon Patriarch"),
  phat: tr('Hắc Phật Ma Tăng', "Black Buddha Demon Monk"),
  tran: tr('Âm Trận Ma Quân', "Yin Formation Demon Lord"),
  dan: tr('Độc Đan Ma Y', "Poison Pill Demon Physician"),
  yeu: tr('Thiên Yêu Ma Vương', "Heavenly Yao Demon King"),
  '': tr('Vô Danh Ma Đầu', "Nameless Demon Lord"),
};
export const maTitle = (r: RivalChar) => MA_TITLE[r.path ?? ''] ?? MA_TITLE[''];
export const MA_DAU_MAX = 2;

/**
 * Bóng ma đầu (3.2.0): bóng thắng 2 trận lôi đài trong ngày đi vào kiếp của người khác.
 * Chỉ từ Trúc Cơ, tối đa 2 lần mỗi kiếp, không gặp bóng của chính mình, kéo ngang cảnh giới.
 */
function pickMaDau(c: Character, rnd: () => number): DuelFoe | null {
  const list = SOCIAL.cur.maDau.filter((m) => m.owner !== SOCIAL.cur.me);
  if (c.realm < 2 || (c.maDauMet ?? 0) >= MA_DAU_MAX || !list.length || rnd() >= 0.35) return null;
  const m = list[Math.floor(rnd() * list.length)];
  c.maDauMet = (c.maDauMet ?? 0) + 1;
  SOCIAL.cur.maDau = SOCIAL.cur.maDau.filter((x) => x.owner !== m.owner);
  const rival: RivalChar = { ...m.rival, realm: c.realm, layer: c.layer, cosmos: c.cosmos ?? null, alive: true };
  const kills = m.kills >= 2 ? tr(`vừa hạ ${m.kills} người trong giang hồ`, `fresh from cutting down ${m.kills} people in the jianghu`) : tr('vừa thắng liền hai trận trên lôi đài', "fresh from two straight wins in the Arena");
  const reason = tr(`${maTitle(rival)} ${rival.name} (@${m.owner}) chặn đường. Mắt hắn đỏ như máu, ${kills}. Không tránh được, phải đánh.`, `${maTitle(rival)} ${rival.name} (@${m.owner}) blocks your path. His eyes are blood-red, ${kills}. There's no avoiding it - you must fight.`);
  return { kind: 'ma_dau', rival, npc: false, rel: 'ngang', reason };
}

/** Chọn cuộc gặp năm nay. null nếu không có gì hợp lý. */
export function pickDuel(c: Character, rnd: () => number): DuelFoe | null {
  const md = pickMaDau(c, rnd);
  if (md) return md;
  const f = pickDuel0(c, rnd);
  if (!f || f.npc || !f.rival.player || f.kind === 'kiep_truoc') return f;
  // gắn quan hệ giang hồ với người chơi thật
  const S = SOCIAL.cur;
  const p = f.rival.player;
  if (S.sworn.includes(p) && !f.revenge && !f.hunt && f.kind !== 'dong_mon') {
    f.kind = 'dong_dao';
    f.sworn = true;
  }
  if (S.provoke.includes(p)) f.provoke = true;
  if (S.bounty[p]) f.bounty = S.bounty[p];
  return f;
}

/**
 * Đồng môn tỷ thí: ưu tiên bóng người chơi thật cùng tông môn, không có thì một sư huynh, sư tỷ vô danh.
 * Luôn cùng cấp với bạn, ngũ hành rút ngẫu nhiên đều cả năm hệ để mỗi trận một khác.
 */
function dongMon(c: Character, rnd: () => number, daiBi: boolean): DuelFoe {
  const pool = (c.world?.rivals ?? []).filter((v) => v.sect && v.sect === c.sect);
  const element = ELEMENT_IDS[Math.floor(rnd() * ELEMENT_IDS.length)];
  const side = sectSide(c);
  let rival: RivalChar;
  let npc = false;
  if (pool.length) rival = { ...pool[Math.floor(rnd() * pool.length)] };
  else {
    npc = true;
    rival = { ...npcRival(c, Math.max(1, c.realm), side === 'ta' ? -1 : 1, rnd), sect: c.sect };
  }
  rival = { ...rival, realm: Math.max(1, c.realm), layer: c.layer, element };
  const g = rival.gender === 'nu' ? tr('Sư tỷ', "Senior sister") : tr('Sư huynh', "Senior brother");
  const n = rival.name + (rival.player ? ` (@${rival.player})` : '');
  const reason = daiBi
    ? tr(`Đại bỉ ${c.sect} khai mạc! Bốc thăm trúng ${g.toLowerCase()} ${n}. Thắng trận này, bạn được thăng bậc ngay trước mặt các trưởng lão.`, `The ${nameOf(c.sect)} Grand Tournament begins! The draw pits you against ${g.toLowerCase()} ${n}. Win this bout and you'll be promoted right before the elders.`)
    : side === 'ta'
      ? tr(`${g} ${n} chặn bạn trong hang tối: "Ở ${c.sect}, muốn lên thì phải giẫm lên đầu người khác."`, `${g} ${n} corners you in a dark cave: "In ${nameOf(c.sect)}, if you want to climb, you step on other people's heads."`)
      : tr(`${g} ${n} gặp bạn ở diễn võ trường ${c.sect}: "Lâu rồi chưa luận kiếm, đấu một trận chứ?"`, `${g} ${n} meets you on the ${nameOf(c.sect)} training ground: "It's been a while since we crossed swords. A bout?"`);
  return { kind: 'dong_mon', rival, npc, rel: 'ngang', reason, daiBi };
}

/** Mức chênh lệch sức mạnh giữa hai bên */
function relOf(c: Character, rival: RivalChar): DuelFoe['rel'] {
  const me = combatLevel(c);
  const foe = combatLevel(foeChar(rival));
  return foe <= me - 2 ? 'yeu' : foe >= me + 2 ? 'manh' : 'ngang';
}

function pickDuel0(c: Character, rnd: () => number): DuelFoe | null {
  const w = c.world;
  const S = SOCIAL.cur;
  // truy sát: người dò tin đã tìm ra kẻ thù, chạm mặt chắc chắn
  if (c.hunt && c.age >= c.hunt.at) {
    const rival = c.hunt.rival;
    c.hunt = null;
    return {
      kind: 'dich_thu',
      rival,
      npc: false,
      rel: relOf(c, rival),
      hunt: true,
      reason: tr(`Người bạn thuê đã dò ra tung tích của @${rival.player}. ${rival.name} đang đứng ngay trước mặt, không còn đường lui. Thắng được thưởng gấp đôi và lấy lại đồ từng bị cướp.`, `The one you hired has tracked down @${rival.player}. ${rival.name} stands right before you, with nowhere left to run. Win for double rewards and take back what was stolen from you.`),
    };
  }
  // Đại bỉ tông môn: tới kỳ thì chắc chắn đấu với một đồng môn
  if (daiBiDue(c)) {
    c.daiBiAt = Math.floor(c.age) + (c.sect === 'Kiếm Cốc' ? 3 : 5 + Math.floor(rnd() * 4));
    return dongMon(c, rnd, true);
  }
  // ghi thù trong sổ (cả từ thư giang hồ) cũng tính là oan gia
  const foesV: Vendetta[] = [
    ...(c.vendettas ?? []),
    ...S.foes.filter((p) => !(c.vendettas ?? []).some((v) => v.player === p)).map((p) => ({ player: p, name: '', items: [], why: tr(`@${p} có tên trong sổ thù của bạn`, `@${p} is in your book of grudges`) })),
  ];
  // oan gia ngõ hẹp: có thù với người chơi thật thì 35% gặp lại họ
  for (const v of foesV) {
    const cands = (w?.rivals ?? []).filter((x) => x.player === v.player);
    if (!cands.length || rnd() >= 0.35) continue;
    const rival = cands.find((x) => x.name === v.name) ?? cands[0];
    return {
      kind: 'dich_thu',
      rival,
      npc: false,
      rel: relOf(c, rival),
      revenge: v,
      reason: tr(`Oan gia ngõ hẹp! Bạn chưa quên: ${v.why}. Nay người của @${v.player} lại xuất hiện trước mặt. Báo thù được thưởng gấp đôi và lấy lại đồ đã mất.`, `Enemies meet on a narrow road! You haven't forgotten: ${v.why}. Now @${v.player}'s character stands before you again. Take revenge for double rewards and reclaim what you lost.`),
    };
  }
  // huynh đệ kết nghĩa: 30% gặp lại nhau trên đường
  const bros = (w?.rivals ?? []).filter((x) => S.sworn.includes(x.player));
  if (bros.length && rnd() < 0.3) {
    const rival = bros[Math.floor(rnd() * bros.length)];
    return {
      kind: 'dong_dao',
      rival,
      npc: false,
      rel: relOf(c, rival),
      sworn: true,
      reason: tr(`Giữa đường gặp lại huynh đệ kết nghĩa ${rival.name} (@${rival.player}). Hai người mừng rỡ, rủ nhau luận võ một trận cho đã tay.`, `On the road you run into your sworn brother ${rival.name} (@${rival.player}). Overjoyed, you two agree to a sparring match just for the fun of it.`),
    };
  }
  // đệ tử tông môn: 25% gặp đồng môn tỷ thí
  if (c.sect && !c.cosmos && rnd() < 0.25) return dongMon(c, rnd, false);
  const past = w?.past ?? null;
  const kinds: [DuelKind, number][] = [
    ['dong_dao', 45],
    ['dich_thu', 35],
    ['kiep_truoc', past ? 20 : 0],
  ];
  const tot = kinds.reduce((a, k) => a + k[1], 0);
  let x = rnd() * tot;
  let kind: DuelKind = 'dong_dao';
  for (const [k, wt] of kinds)
    if ((x -= wt) < 0) {
      kind = k;
      break;
    }

  // cấp độ đối thủ theo cấp chiến đấu, chia ba bậc rõ ràng để ít gặp người ngang cấp:
  // đồng đạo: yếu 45%, ngang 25%, mạnh 30%; địch thủ: 25/25/50; tâm ma kiếp trước: 20/20/60
  const me0 = combatLevel(c);
  const W: Record<DuelKind, [number, number]> = { dong_dao: [0.45, 0.25], dich_thu: [0.25, 0.25], kiep_truoc: [0.2, 0.2], dong_mon: [0, 1], ngu_hanh: [0, 1], ma_dau: [0, 1] };
  const [pw, pn] = W[kind];
  const r = rnd();
  const ri = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
  const delta = r < pw ? -ri(3, 6) : r < pw + pn ? ri(-1, 1) : ri(3, 6);
  const targetCl = Math.max(1, Math.min(39, me0 + delta));
  const tgt = clToRealm(targetCl);

  let rival: RivalChar | null = null;
  let npc = false;
  // quan hệ ngũ hành mong muốn: bị khắc 30%, khắc 20%, cùng mệnh 15%, sinh 17,5%, được sinh 17,5%
  // (để ngẫu nhiên thì khắc + cùng mệnh chiếm 40%, bị khắc chỉ 20%: người chơi thấy quá dễ)
  const myEl = elementOf(c);
  const er = rnd();
  const wantRel: ElemRel = er < 0.3 ? 'bi_khac' : er < 0.5 ? 'khac' : er < 0.65 ? 'dong' : er < 0.825 ? 'sinh' : 'duoc_sinh';
  if (kind === 'kiep_truoc' && past) {
    // bóng kiếp trước: dáng hình kiếp trước, sức mạnh do tâm ma quyết định; tâm ma lớn thì mạnh thêm
    const t2 = c.stats.tamMa >= 50 && delta > 0 ? clToRealm(Math.min(27, targetCl + 2)) : tgt;
    rival = { ...past, realm: t2.realm, layer: t2.layer, lifeNo: Math.max(1, c.lifeNo - 1) };
  } else {
    const mine = lean(c.daoTam);
    // sau phi thăng chỉ gặp người cùng giới
    const pool = (w?.rivals ?? []).filter((v) => v.realm >= 1 && (c.cosmos ? v.cosmos === c.cosmos : !v.cosmos) && Math.abs(combatLevel(foeChar(v)) - targetCl) <= 1);
    const side = pool.filter((v) => (kind === 'dong_dao' ? lean(v.daoTam) === mine || lean(v.daoTam) === 0 : lean(v.daoTam) !== mine || mine === 0));
    const list0 = side.length ? side : pool;
    // ưu tiên đúng quan hệ ngũ hành đã bốc; không có ai hợp thì lấy cả danh sách
    const byElem = list0.filter((v) => elemRel(myEl, elementOf(v)) === wantRel);
    const list = byElem.length ? byElem : list0;
    if (list.length) {
      rival = list[Math.floor(rnd() * list.length)];
    } else {
      npc = true;
      const sign = kind === 'dong_dao' ? mine || 1 : mine > 0 ? -1 : mine < 0 ? 1 : rnd() < 0.5 ? 1 : -1;
      rival = { ...npcRival(c, tgt.realm, sign, rnd), layer: tgt.layer, cosmos: c.cosmos ?? null, element: ELEMENT_IDS.find((e) => elemRel(myEl, e) === wantRel) };
    }
  }
  if (!rival) return null;
  const me = combatLevel(c);
  const foe = combatLevel(foeChar(rival));
  const rel = foe <= me - 2 ? 'yeu' : foe >= me + 2 ? 'manh' : 'ngang';
  return { kind, rival, npc, rel, reason: reasonFor(c, kind, rival, rnd) };
}

export function foeLabel(f: DuelFoe): string {
  const r = f.rival;
  return `${r.name}${r.player ? ` (@${r.player})` : ''} · ${r.realm === 0 ? tr('Phàm nhân', "Mortal") : realmLabel(r.realm, r.layer, r.cosmos)}`;
}

const RARE_NAME = [tr('Phàm', "Common"), tr('Tốt', "Fine"), tr('Hiếm', "Rare"), tr('Cực phẩm', "Supreme")];

/**
 * Lấy một món trong đồ đối thủ đang mang (vũ khí, áo, phụ kiện...). Ưu tiên món mình chưa có;
 * món nào cũng có rồi thì bán lấy linh thạch.
 */
function rivalLoot(c: Character, r: RivalChar, ctx: EffectCtx, chance: number, say: (name: string) => string): string | null {
  if (ctx.rnd() >= chance * DROP_MUL) return null;
  const items = Object.values(r.equipped ?? {})
    .map((id) => ITEMS.find((i) => i.id === id))
    .filter((i): i is (typeof ITEMS)[number] => !!i && i.id !== 'ao_vai');
  if (!items.length) return null;
  const fresh = items.filter((i) => !c.inventory.includes(i.id));
  const it = (fresh.length ? fresh : items)[Math.floor(ctx.rnd() * (fresh.length ? fresh : items).length)];
  const tag = `[${RARE_NAME[it.rare ?? 0]}]`;
  if (c.inventory.includes(it.id)) {
    const sell = Math.round(40 + (it.price || 80) * 0.5 + (it.rare ?? 0) * 120);
    money(c, sell);
    return tr(`${say(`${tag} ${it.name}`)} Bạn đã có món này nên đem bán được ${sell} linh thạch.`, `${say(`${tag} ${it.name}`)} You already own this, so you sell it for ${sell} spirit stones.`);
  }
  giveItem(c, it.id, false);
  ctx.fx((it.rare ?? 0) >= 3 ? 'layer' : 'buy', it.name);
  return tr(`${say(`${tag} ${it.name}`)} (${fxText(it.fx)}) Mở Túi đồ để mặc.`, `${say(`${tag} ${it.name}`)} (${fxText(it.fx)}) Open your Inventory to equip it.`);
}

/** Bị lột n món đang mặc (bỏ qua áo vải khởi đầu). Mặc từ 2 món trở lên thì luôn chừa lại ít nhất một món. */
export function robGear(c: Character, ctx: EffectCtx, n: number, ids?: string[]): string[] {
  const worn = (Object.entries(c.equipped) as [Slot, string | undefined][]).filter(([, id]) => id && id !== 'ao_vai') as [Slot, string][];
  const k = Math.min(n, worn.length <= 1 ? worn.length : worn.length - 1);
  const names: string[] = [];
  for (let i = 0; i < k; i++) {
    const j = Math.floor(ctx.rnd() * worn.length);
    const [slot, id] = worn.splice(j, 1)[0];
    c.equipped[slot] = slot === 'ao' ? 'ao_vai' : undefined;
    c.inventory = c.inventory.filter((x) => x !== id);
    ids?.push(id);
    names.push(ITEMS.find((it) => it.id === id)?.name ?? tr('một món đồ', "an item"));
  }
  if (names.length) ctx.fx('hurt', tr('Bị lột đồ', "Stripped of gear"));
  return names;
}

/** Ghi thù với người chơi thật để kiếp này hoặc kiếp sau báo thù (giữ tối đa 3 mối thù) */
export function addVendetta(c: Character, f: DuelFoe, items: string[], why: string) {
  if (!f.rival.player || f.npc || f.kind === 'kiep_truoc') return;
  const rest = (c.vendettas ?? []).filter((v) => v.player !== f.rival.player);
  const old = (c.vendettas ?? []).find((v) => v.player === f.rival.player);
  c.vendettas = [...rest, { player: f.rival.player, name: f.rival.name, items: [...(old?.items ?? []), ...items].slice(-4), why }].slice(-3);
}

/** Kết thúc trận: thưởng phạt theo loại cuộc gặp */
export function finishDuel(c: Character, f: DuelFoe, result: 'win' | 'lose' | 'draw', pLoss: number, ctx: EffectCtx): string[] {
  const r = f.rival;
  const who = r.player ? `${r.name} (@${r.player})` : r.name;
  const harder = (f.rel === 'manh' ? 1.6 : f.rel === 'yeu' ? 0.5 : 1) * (f.provoke ? PROVOKE_MUL : 1);
  const out: string[] = [];
  if (f.provoke) out.push(tr('Hai bên từng khiêu khích nhau, trận này thắng thua đều gấp rưỡi.', "You two have provoked each other before - this bout's wins and losses count one and a half times."));
  if (f.kind === 'ma_dau') {
    const t = `${maTitle(r)} ${r.name}`;
    if (result === 'win') {
      const exp = Math.round(reward(c, 0.5));
      addCult(c, exp);
      stat(c, 'khiVan', 3);
      out.push(tr(`Bạn đánh tan ${t} của @${r.player}. Ma khí tan thành khói đen (+${exp} tu vi, +10 phúc duyên).`, `You shatter @${r.player}'s ${t}. The demonic qi dissolves into black smoke (+${exp} cultivation, +10 Fortune).`));
      const g = rivalLoot(c, r, ctx, 1, (n) => tr(`Bóng ma đầu tan đi, rơi lại ${n}.`, `The demon lord's shadow fades, leaving behind ${n}.`));
      if (g) out.push(g);
      return out;
    }
    // thua hay hòa đều không chết: trọng thương, mất 10% linh thạch (tối đa 500)
    const lost = Math.min(500, Math.round(c.linhThach * 0.1));
    money(c, -lost);
    const hurt = result === 'lose' ? 40 : 20;
    c.stats.sucKhoe = Math.max(5, c.stats.sucKhoe - hurt);
    ctx.fx('hurt', tr('Trọng thương', "Badly wounded"));
    out.push(
      result === 'lose'
        ? tr(`${t} đánh bạn gục xuống, cướp ${lost} linh thạch rồi cười dài bỏ đi. Bạn trọng thương nhưng còn sống (-${hurt} sức khỏe).`, `${t} strikes you down, steals ${lost} spirit stones and leaves with a long laugh. You're badly wounded but alive (-${hurt} Health).`)
        : tr(`Hai bên đánh tới kiệt sức. ${t} giật được ${lost} linh thạch rồi hóa khói đen bỏ đi (-${hurt} sức khỏe).`, `You fight to exhaustion. ${t} snatches ${lost} spirit stones and vanishes in black smoke (-${hurt} Health).`),
    );
    return out;
  }
  if (f.kind === 'dong_mon') {
    const ta = sectSide(c) === 'ta';
    if (result === 'win') {
      const exp = Math.round(reward(c, f.daiBi ? 0.8 : 0.4) * harder);
      addCult(c, exp);
      stat(c, 'khiVan', 2);
      out.push(tr(`${dongMonWin(who, !!f.daiBi, ctx.rnd)} (+${exp} tu vi).`, `${dongMonWin(who, !!f.daiBi, ctx.rnd)} (+${exp} cultivation).`));
      if (f.daiBi) {
        const up = promote(c, ctx, tr('Chưởng môn gật đầu tán thưởng.', "The Sect Leader nods in approval."));
        if (up) out.push(up);
      }
      if (ta) {
        const g = rivalLoot(c, r, ctx, 0.4, (n) => tr(`Theo luật ma môn, kẻ thua phải nộp ${n} cho bạn.`, `By the law of the demonic sect, the loser must hand ${n} over to you.`));
        if (g) out.push(g);
      }
    } else if (result === 'draw') {
      const exp = Math.round(reward(c, 0.25) * harder);
      addCult(c, exp);
      out.push(tr(`${dongMonDraw(who, ctx.rnd)} (+${exp} tu vi).${f.daiBi ? tr(' Đại bỉ lần này bạn chưa được thăng bậc.', " No promotion for you at this Grand Tournament.") : ''}`, `${dongMonDraw(who, ctx.rnd)} (+${exp} cultivation).${f.daiBi ? tr(' Đại bỉ lần này bạn chưa được thăng bậc.', " No promotion for you at this Grand Tournament.") : ''}`));
    } else {
      stat(c, 'sucKhoe', -10);
      stat(c, 'tamCanh', -3);
      out.push(dongMonLose(who, !!f.daiBi, ctx.rnd));
      if (ta) {
        // ma môn: đồng môn cũng chẳng nương tay
        const fl = fatal(c, ctx, 0.08, tr(`Đồng môn ${who} ra tay tàn độc giữa hang tối. Ở ${c.sect}, kẻ yếu không có quyền sống.`, `Fellow disciple ${who} strikes viciously in the dark cave. In ${nameOf(c.sect)}, the weak have no right to live.`));
        if (c.dead) return [fl ?? ''];
        const ids: string[] = [];
        const taken = ctx.rnd() < 0.3 ? robGear(c, ctx, 1, ids) : [];
        if (taken.length) out.push(tr(`${r.name} còn lột mất ${taken.join(', ')} của bạn.${fl ?? ''}`, `${r.name} also strips you of ${taken.join(', ')}.${fl ?? ''}`));
      }
    }
    return out;
  }
  if (f.kind === 'dong_dao' && f.sworn) {
    // huynh đệ luận võ: không ai lột đồ ai, cả hai cùng tiến
    const exp = Math.round(reward(c, result === 'win' ? 0.45 : result === 'draw' ? 0.35 : 0.25) * Math.max(1, harder));
    addCult(c, exp);
    stat(c, 'tamCanh', 3);
    stat(c, 'khiVan', 2);
    out.push(tr(`${swornLine(r.name, result, ctx.rnd)} (+${exp} tu vi).`, `${swornLine(r.name, result, ctx.rnd)} (+${exp} cultivation).`));
    return out;
  }
  if (f.kind === 'dong_dao') {
    if (result === 'win') {
      const exp = Math.round(reward(c, 0.35) * harder);
      addCult(c, exp);
      stat(c, 'khiVan', 2);
      out.push(tr(`${dongDaoWin(who, marginOf(pLoss), ctx.rnd)} (+${exp} tu vi).`, `${dongDaoWin(who, marginOf(pLoss), ctx.rnd)} (+${exp} cultivation).`));
      const g = rivalLoot(c, r, ctx, 0.35, (n) => tr(`${r.name} phục tài, tháo ${n} tặng bạn làm kỷ niệm.`, `${r.name}, won over by your skill, takes off ${n} and gives it to you as a keepsake.`));
      if (g) out.push(g);
    } else if (result === 'draw') {
      const exp = Math.round(reward(c, 0.2) * harder);
      addCult(c, exp);
      stat(c, 'tamCanh', 3);
      out.push(tr(`${dongDaoDraw(who, ctx.rnd)} (+${exp} tu vi).`, `${dongDaoDraw(who, ctx.rnd)} (+${exp} cultivation).`));
    } else {
      const exp = Math.round(reward(c, 0.12) * harder);
      addCult(c, exp);
      stat(c, 'sucKhoe', -12);
      out.push(tr(`${dongDaoLose(who, ctx.rnd)} (+${exp} tu vi).`, `${dongDaoLose(who, ctx.rnd)} (+${exp} cultivation).`));
      // đồng đạo cũng có kẻ giả nhân giả nghĩa: thắng xong trở mặt lột đồ (người nghiêng tà dễ trở mặt hơn)
      if (ctx.rnd() < (r.daoTam < 0 ? 0.35 : 0.15)) {
        const ids: string[] = [];
        const taken = robGear(c, ctx, ctx.rnd() < 0.3 ? 2 : 1, ids);
        if (taken.length) addVendetta(c, f, ids, tr(`${r.name} giả nhân giả nghĩa lột đồ bạn`, `${r.name}, the two-faced hypocrite, stripped your gear`));
        if (taken.length) out.push(tr(`Nào ngờ ${r.name} là kẻ giả nhân giả nghĩa. Thấy bạn kiệt sức, hắn trở mặt lột mất ${taken.join(tr(' và ', " and "))} rồi cười lớn bỏ đi.`, `Who knew ${r.name} was a two-faced hypocrite? Seeing you spent, he turns on you, strips off ${taken.join(tr(' và ', " and "))} and leaves laughing.`));
      }
    }
    return out;
  }
  if (f.kind === 'dich_thu') {
    if (result === 'win') {
      const rv = f.revenge || f.hunt ? 2 : 1; // báo thù, truy sát được thưởng gấp đôi
      const vend = f.revenge ?? (f.hunt ? (c.vendettas ?? []).find((v) => v.player === r.player) : undefined);
      const exp = Math.round(reward(c, 0.6) * harder * rv);
      addCult(c, exp);
      const loot = Math.round((40 + r.realm * 60 * harder) * rv);
      money(c, loot);
      if (r.player && !f.npc) addMile(c, f.revenge || f.hunt ? 'revenge' : 'duel', f.revenge ? tr(`Báo được đại thù với ${r.name} (@${r.player})`, `Avenged a great grudge against ${r.name} (@${r.player})`) : tr(`Đánh bại địch thủ ${r.name} (@${r.player})`, `Defeated rival ${r.name} (@${r.player})`));
      out.push(f.revenge || f.hunt ? tr(`${dichThuRevenge(who, ctx.rnd)} (+${exp} tu vi, +${loot} linh thạch, gấp đôi).`, `${dichThuRevenge(who, ctx.rnd)} (+${exp} cultivation, +${loot} spirit stones, doubled).`) : tr(`${dichThuWin(who, marginOf(pLoss), chieuOf(c, ctx.rnd), ctx.rnd)} (+${exp} tu vi, +${loot} linh thạch).`, `${dichThuWin(who, marginOf(pLoss), chieuOf(c, ctx.rnd), ctx.rnd)} (+${exp} cultivation, +${loot} spirit stones).`));
      if (vend) {
        const back = vend.items.filter((id) => ITEMS.some((i) => i.id === id));
        back.forEach((id) => giveItem(c, id, false));
        if (back.length) out.push(tr(`Bạn lấy lại ${back.map((id) => ITEMS.find((i) => i.id === id)?.name).join(', ')} từng bị cướp.`, `You reclaim ${back.map((id) => ITEMS.find((i) => i.id === id)?.name).join(', ')}, once stolen from you.`));
        c.vendettas = (c.vendettas ?? []).filter((v) => v.player !== vend.player);
        qmark(c, 'revenge');
      }
      // thắng địch thủ: lấy 1 món, 30% lấy được 2 món, không bao giờ lấy hết
      const g = rivalLoot(c, r, ctx, 0.7, (n) => tr(`Bạn lột được ${n} của ${r.name} làm chiến lợi phẩm.`, `You strip ${n} from ${r.name} as spoils of war.`));
      if (g) {
        out.push(g);
        const g2 = rivalLoot(c, r, ctx, 0.3, (n) => tr(`Lục thêm được ${n}.`, `You also scrounge up ${n}.`));
        if (g2) out.push(g2);
      }
      stat(c, 'sucKhoe', -Math.round(pLoss * 20));
    } else if (result === 'draw') {
      stat(c, 'sucKhoe', -Math.round(pLoss * 25));
      out.push(dichThuDraw(who, marginOf(pLoss), ctx.rnd));
    } else {
      // bị đồng đạo trở mặt đánh úp thì càng dễ chết
      const fl = fatal(
        c,
        ctx,
        f.betray ? 0.45 : 0.25,
        f.betray ? tr(`Bạn tin nhầm ${who}. Chén trà còn chưa nguội, người đã thành thi thể.`, `You trusted ${who} wrongly. Before the tea had cooled, you were a corpse.`) : dichThuDeath(who, ctx.rnd),
      );
      if (c.dead) {
        addVendetta(c, f, [], f.betray ? tr(`${r.name} trở mặt giết bạn bên bàn trà`, `${r.name} turned on you and killed you at the tea table`) : tr(`${r.name} đã giết bạn`, `${r.name} killed you`));
        return [fl ?? ''];
      }
      stat(c, 'sucKhoe', -35);
      const lost = Math.round(c.linhThach * (f.provoke ? 0.3 : 0.2));
      money(c, -lost);
      out.push(`${dichThuLose(who, lost, ctx.rnd)}${fl ?? ''}`);
      // bị lột 1-2 món đang mặc, không bao giờ mất hết
      const ids: string[] = [];
      const taken = robGear(c, ctx, ctx.rnd() < 0.3 ? 2 : 1, ids);
      if (taken.length) out.push(tr(`${r.name} còn lột mất ${taken.join(tr(' và ', " and "))} của bạn.`, `${r.name} also strips you of ${taken.join(tr(' và ', " and "))}.`));
      addVendetta(c, f, ids, f.betray ? tr(`${r.name} trở mặt đánh úp bạn`, `${r.name} turned on you in an ambush`) : tr(`${r.name} đánh bại và cướp của bạn`, `${r.name} defeated and robbed you`));
    }
    return out;
  }
  // tâm ma kiếp trước
  if (result === 'win') {
    const exp = Math.round(reward(c, 0.8) * harder);
    addCult(c, exp);
    stat(c, 'tamMa', -20);
    stat(c, 'tamCanh', 8);
    stat(c, 'khiVan', 3);
    addMile(c, 'duel', tr('Vượt qua tâm ma của chính mình kiếp trước', "Overcame the heart demon of your own past life"));
    out.push(tr(`${tamMaLine(r.name, 'win', ctx.rnd)} (+${exp} tu vi).`, `${tamMaLine(r.name, 'win', ctx.rnd)} (+${exp} cultivation).`));
    const g = rivalLoot(c, r, ctx, 0.6, (n) => tr(`Bóng kiếp trước tan đi, để lại ${n}, di vật bạn từng mang kiếp trước.`, `The shadow of your past life fades, leaving ${n}, a relic you carried in that life.`));
    if (g) out.push(g);
  } else if (result === 'draw') {
    stat(c, 'tamMa', 5);
    out.push(tamMaLine(r.name, 'draw', ctx.rnd));
  } else {
    const fl = fatal(c, ctx, 0.1, tr(`Bạn thua chính mình kiếp trước. Hai kiếp người hóa thành một nắm tro bên hồ.`, "You lose to your own past self. Two lifetimes turn into a handful of ash by the lake."));
    if (c.dead) return [fl ?? ''];
    stat(c, 'tamMa', 15);
    stat(c, 'sucKhoe', -25);
    out.push(`${tamMaLine(r.name, 'lose', ctx.rnd)}${fl ?? ''}`);
  }
  return out;
}

/** Lý do gặp: rút ngẫu nhiên theo loại cuộc gặp và hoàn cảnh hai bên, để mỗi lần một khác */
function reasonFor(c: Character, kind: DuelKind, r: RivalChar, rnd: () => number): string {
  const n = r.name;
  const pathName = r.path ? { kiem: tr('kiếm', "the sword"), dan: tr('đan', "alchemy"), tran: tr('trận', "formations"), phat: tr('Phật', "Buddhist arts"), ma: tr('ma công', "demonic arts"), yeu: tr('yêu thuật', "yao sorcery") }[r.path] : tr('võ', "martial arts");
  const pool: string[] = [];
  if (kind === 'dong_dao') {
    pool.push(
      tr(`${n} chắn đường, chắp tay thi lễ: "Nghe danh đã lâu, xin được lĩnh giáo vài chiêu."`, `${n} blocks your way and bows with clasped hands: "Your name precedes you. I humbly ask to learn a few of your moves."`),
      tr(`Trên đỉnh núi vắng, ${n} đang luyện ${pathName}. Thấy bạn, người ấy dừng tay mỉm cười: "Đến đúng lúc, cùng luận một trận chứ?"`, `On a lonely peak, ${n} is practicing ${pathName}. Seeing you, they stop and smile: "Perfect timing. A friendly bout?"`),
      tr(`Hai người cùng nhắm một cây linh chi trên vách đá. ${n} cười: "Ai thắng thì người đó hái, thế nào?"`, `You both have your eye on the same lingzhi growing on a cliff face. ${n} grins: "Winner picks it. Deal?"`),
      tr(`Trong tửu lâu, ${n} nâng chén mời bạn. Uống đến chén thứ ba thì nói: "Rượu ngon phải có kiếm hay. Xin chỉ giáo!"`, `In a tavern, ${n} raises a cup to you. At the third cup they say: "Good wine deserves a good blade. Teach me something!"`),
      tr(`Đại hội luận võ mở ở trấn bên. Bốc thăm thế nào lại trúng đúng ${n}.`, `A martial tournament opens in the next town. As luck would have it, the draw puts you against ${n}.`),
      tr(`${n} được sư phụ dặn đi khắp thiên hạ tìm người ngang tài để mài giũa. Người ấy tìm đến bạn.`, `${n} was sent by their master to roam the world in search of an equal to sharpen against. They have found you.`),
      tr(`Bến đò chỉ còn một chuyến cuối ngày. ${n} đề nghị: "Đấu một trận, ai thắng qua sông trước."`, `Only one last ferry crossing remains today. ${n} proposes: "One bout. Winner crosses first."`),
      tr(`${n} nhặt được bức thư bạn đánh rơi, trả lại rồi nói: "Coi như duyên phận, đấu với ta vài chiêu."`, `${n} picks up a letter you dropped and hands it back: "Call it fate. Spar with me a few moves."`),
    );
    if (r.alive === false && r.player) pool.push(tr(`Anh linh của ${n} chưa tan, vẫn ngồi bên bia mộ chờ người đáng mặt luận võ.`, `The heroic spirit of ${n} has not yet dispersed; it still sits by its tombstone, waiting for an opponent worthy of a bout.`));
  } else if (kind === 'dich_thu') {
    pool.push(
      tr(`Sát khí ập tới. ${n} đã đợi bạn ở đây từ lâu. Hôm nay chỉ một người được rời đi.`, `Killing intent rushes in. ${n} has long been waiting for you here. Only one of you leaves today.`),
      tr(`${n} nhận lệnh truy nã bạn với giá cao. "Đầu ngươi đáng giá lắm," hắn nói.`, `${n} has taken a hefty bounty on your head. "Your head is worth a lot," he says.`),
      tr(`Bạn vô tình giẫm vào lãnh địa của ${n}. Hắn không cần biết lý do.`, `You stray into ${n}'s territory by accident. He doesn't care why.`),
      tr(`Hai người cùng phát hiện một bí cảnh vừa mở. Bí cảnh chỉ đủ cho một người vào.`, "You both discover a secret realm that has just opened. It only has room for one."),
      tr(`${n} tưởng bạn là kẻ đã giết đồng môn của hắn. Giải thích cũng vô ích.`, `${n} thinks you're the one who killed his fellow disciple. Explaining is useless.`),
      tr(`Giữa đường, ${n} chặn đoàn xe bạn đang hộ tống. "Để hàng lại, hoặc để mạng lại."`, `Halfway down the road, ${n} stops the caravan you're escorting. "Leave the goods, or leave your life."`),
      tr(`Ở phường thị, bạn mua được món bảo vật ${n} để mắt từ lâu. Hắn theo bạn ra tận ngoài thành.`, `At the Market you buy a treasure ${n} has long had his eye on. He follows you all the way out of the city.`),
      tr(`${n} tuyên bố trước giang hồ: ai mạnh nhất vùng này thì hắn sẽ đến khiêu chiến. Hôm nay là lượt bạn.`, `${n} has declared to the whole jianghu that he'll challenge whoever is strongest in these parts. Today it's your turn.`),
    );
    if (c.daoTam >= 20 && r.daoTam <= -20)
      pool.push(tr(`Ma đạo ${n} nghe tin bạn ra tay diệt ma, tìm đến báo thù cho đồng môn.`, `Demonic cultivator ${n} heard you've been slaying demons and comes to avenge his fellow disciples.`), tr(`${n} cười gằn: "Chính đạo các ngươi giả nhân giả nghĩa, hôm nay ta lột mặt nạ."`, `${n} sneers: "You righteous hypocrites! Today I tear off your mask."`));
    if (c.daoTam <= -20 && r.daoTam >= 20)
      pool.push(tr(`${n} của chính phái lần theo dấu máu bạn để lại. "Hôm nay thay trời hành đạo."`, `${n} of the righteous sects has followed your trail of blood. "Today I act on behalf of Heaven."`), tr(`Chính phái treo thưởng đầu bạn. ${n} là người đầu tiên tìm tới.`, `The righteous sects have put a bounty on your head. ${n} is the first to come for it.`));
    if (c.enemy) pool.push(tr(`${n} được ${c.enemy} thuê đến lấy mạng bạn.`, `${n} was hired by ${c.enemy} to take your life.`));
    if (c.partner) pool.push(tr(`${n} từng thầm thương ${c.partner}. Thấy bạn, hắn rút vũ khí không nói một lời.`, `${n} once secretly loved ${c.partner}. On seeing you, he draws his weapon without a word.`));
  } else {
    pool.push(
      tr(`Mặt hồ phẳng lặng bỗng in bóng một người. Đó là bạn, của một kiếp đã qua. Muốn đi tiếp, phải vượt qua chính mình.`, "A figure suddenly appears on the still surface of the lake. It is you, from a life gone by. To go on, you must overcome yourself."),
      tr(`Đang tọa thiền, bạn rơi vào tâm cảnh. ${n} đứng trước mặt, hỏi: "Kiếp này ngươi có sống tốt hơn ta không?"`, `In meditation, you sink into your inner world. ${n} stands before you and asks: "Have you lived this life better than I did?"`),
      tr(`Trong giấc mơ, ${n} cầm vũ khí cũ của kiếp trước chặn đường: "Nợ cũ chưa trả, đừng mong đi xa."`, `In a dream, ${n} blocks your path with the old weapon of your past life: "Old debts unpaid - don't think you'll get far."`),
      tr(`Đột phá đến cửa ải, tâm ma hóa thành hình dáng kiếp trước. ${n} cười nhạt: "Ngươi vẫn yếu như ta năm xưa."`, `At the threshold of a breakthrough, your heart demon takes the form of your past life. ${n} smiles thinly: "You're as weak as I was back then."`),
      tr(`Đi qua nơi kiếp trước từng chết, bóng ${n} hiện lên giữa sương mù, ánh mắt đầy tiếc nuối.`, `Passing the place where your past life died, the shadow of ${n} rises in the mist, eyes full of regret.`),
      tr(`Chiếc gương đồng trong miếu cổ phản chiếu không phải bạn, mà là ${n}. Bóng trong gương bước ra.`, `The bronze mirror in the old temple reflects not you, but ${n}. The figure in the mirror steps out.`),
    );
  }
  return pool[Math.floor(rnd() * pool.length)];
}

/**
 * Kết giao uống trà với đồng đạo: lòng người khó đoán.
 * 40% bị ám toán ngầm (độc, thuốc mê, cổ trùng...), 40% trở mặt ra tay (đánh lén, phục binh...), 20% là thật lòng.
 */
export type TeaResult = { kind: 'am_toan'; text: string } | { kind: 'tro_mat'; text: string } | { kind: 'that_long' };

const AM_TOAN: ((w: string, h: string) => string)[] = [
  (w, h) => tr(`Chén trà của ${w} có vị đắng lạ. Uống xong, bụng bạn quặn thắt: trà có độc.`, `The tea ${w} serves tastes strangely bitter. After you drink it, your gut twists: poison.`),
  (w, h) => tr(`${w} đốt một nén "an thần hương". Bạn ngửi một lúc thì mê man, tỉnh dậy đã nằm giữa bãi cỏ.`, `${w} lights a stick of "calming incense". After a few breaths you black out, and wake lying in a field.`),
  (w, h) => tr(`Rượu ${w} mời ngấm Thập Hương Nhuyễn Cân Tán, gân cốt bạn mềm nhũn như bún.`, `The wine ${w} offers is laced with Ten Fragrance Sinew-Softening Powder; your bones go limp as noodles.`),
  (w, h) => tr(`Trong ấm trà của ${w} có thả cổ trùng. Mấy ngày sau bạn mới thấy nó cựa quậy trong bụng.`, `${w} slipped a gu worm into the teapot. Only days later do you feel it squirming in your belly.`),
  (w, h) => tr(`${w} rót trà bằng chiếc ấm hai ngăn: chén của ${h} trà thường, chén của bạn trà độc.`, `${w} pours from a two-chambered pot: ${h} drinks plain tea, you drink poison.`),
  (w, h) => tr(`Đang luận đạo say sưa, ${w} vỗ vai thân thiết. Trên tay ${h} dính kim độc mảnh như lông trâu.`, `Deep in a lively Yao discussion, ${w} claps you warmly on the shoulder - and ${h} is hiding a poison needle as fine as an ox hair.`),
  (w, h) => tr(`Bánh ngọt ${w} mời có trộn Tán Công Tán. Bạn vận khí thì thấy chân khí tán loạn.`, `The sweet cakes ${w} offers are mixed with Qi-Scattering Powder. When you circulate your qi, your true qi goes wild.`),
  (w, h) => tr(`${w} dùng "Tỏa Hồn Khúc" thổi sáo giúp vui. Bạn nghe xong đầu óc quay cuồng, ngã gục.`, `${w} plays the "Soul-Locking Tune" on a flute for fun. When it ends your head is spinning, and you collapse.`),
];
const TRO_MAT: ((w: string, h: string) => string)[] = [
  (w, h) => tr(`Chén trà vừa nâng lên, ${w} đã rút kiếm đâm thẳng tới: "Đồng đạo? Giang hồ làm gì có đồng đạo!"`, `You've barely raised the cup when ${w} draws a sword and lunges: "Kindred spirit? There's no such thing in the jianghu!"`),
  (w, h) => tr(`Uống được nửa chén, từ bụi rậm nhảy ra ba tên phục binh. ${w} cười nhạt rồi cùng xông vào.`, `Half a cup in, three ambushers leap out of the bushes. ${w} smirks and charges in with them.`),
  (w, h) => tr(`${w} thấy túi đồ của bạn căng phồng, bỗng nổi lòng tham, hất bàn trà ra tay.`, `${w} sees how stuffed your pouch is, gets greedy, flips the tea table and attacks.`),
  (w, h) => tr(`Hóa ra ${w} nhận tiền thưởng truy nã cái đầu của bạn. Ấm trà chỉ là cái cớ để lại gần.`, `Turns out ${w} took the bounty on your head. The teapot was just an excuse to get close.`),
  (w, h) => tr(`${w} nhắc chuyện cũ, càng nói càng cay: hóa ra sư phụ ${h} từng chết dưới tay người cùng môn với bạn.`, `${w} brings up old history and grows more bitter by the word: turns out ${h} once had a master who died at the hands of someone from your sect.`),
  (w, h) => tr(`Bàn tới công pháp, ${w} đòi bạn đưa bí kíp ra xem. Bạn chưa kịp từ chối, ${h} đã ra tay cướp.`, `Talk turns to cultivation methods, and ${w} demands to see your manual. Before you can refuse, ${h} lunges to snatch it.`),
  (w, h) => tr(`${w} uống say, tâm ma nổi dậy, mắt đỏ ngầu, quay sang đánh bạn như đánh kẻ thù.`, `${w} gets drunk, a heart demon rises, eyes bloodshot, and turns on you as if you were a sworn enemy.`),
  (w, h) => tr(`Ấm trà vỡ tan, bên trong giấu một con dao găm. ${w} đã chuẩn bị từ trước.`, `The teapot shatters, revealing a hidden dagger. ${w} had planned this all along.`),
];

export function teaTrap(c: Character, f: DuelFoe, ctx: EffectCtx): TeaResult {
  const who = f.rival.name;
  const h = f.rival.gender === 'nu' ? tr('ả', "she") : tr('hắn', "he");
  // huynh đệ kết nghĩa thì trà luôn là trà thật
  if (f.sworn) return { kind: 'that_long' };
  const r = ctx.rnd();
  if (r < 0.4) {
    const pick = AM_TOAN[Math.floor(ctx.rnd() * AM_TOAN.length)];
    let text = pick(who, h);
    const hurt = 18 + Math.floor(ctx.rnd() * 14);
    stat(c, 'sucKhoe', -hurt);
    c.cultivation = Math.max(0, Math.round(c.cultivation * 0.95));
    ctx.fx('hurt', tr('Trúng ám toán', "Ambushed"));
    text += tr(` (-${hurt} sức khỏe, tu vi tổn hao).`, ` (-${hurt} Health, cultivation damaged).`);
    // lúc bạn mê man, hắn lục túi
    if (ctx.rnd() < 0.5) {
      const ids: string[] = [];
      const taken = robGear(c, ctx, 1, ids);
      addVendetta(c, f, ids, tr(`${who} bỏ độc vào trà rồi lục túi bạn`, `${who} poisoned your tea and rifled your pouch`));
      const lost = Math.round(c.linhThach * 0.15);
      money(c, -lost);
      text += tr(` Lúc bạn mê man, ${h} lấy mất ${taken.length ? taken.join(', ') + tr(' và ', " and ") : ''}${lost} linh thạch.`, ` While you lay dazed, ${h} took ${taken.length ? taken.join(', ') + tr(' và ', " and ") : ''}${lost} spirit stones.`);
    }
    const fl = fatal(c, ctx, 0.3, tr(`Độc trong chén trà của ${who} ngấm vào tâm mạch. Bạn chết bên bàn trà còn ấm.`, `The poison in ${who}'s tea seeps into your heart meridian. You die at a tea table that is still warm.`));
    if (fl) text += fl;
    return { kind: 'am_toan', text };
  }
  if (r < 0.8) return { kind: 'tro_mat', text: TRO_MAT[Math.floor(ctx.rnd() * TRO_MAT.length)](who, h) };
  return { kind: 'that_long' };
}

/**
 * Chiến thư: hai bóng nhân vật tự đánh 5 hiệp (dùng cho trận hẹn đấu khi chủ nhân vắng mặt).
 * Hết 5 hiệp ai còn nhiều máu hơn (theo phần trăm) thì thắng, chênh dưới 5% là hòa.
 */
export function simulateDuel(me: RivalChar, foe: RivalChar, rnd: () => number): { result: 'win' | 'lose' | 'draw'; hpMe: number; hpFoe: number; rounds: number } {
  const a = foeStats(me);
  const b = foeStats(foe);
  const ma = lifeMul(me.lifeNo ?? 1, foe.lifeNo ?? 1);
  const mb = lifeMul(foe.lifeNo ?? 1, me.lifeNo ?? 1);
  const ea = elemMul(elementOf(me), elementOf(foe));
  const eb = elemMul(elementOf(foe), elementOf(me));
  let ha = a.hp;
  let hb = b.hp;
  let rounds = 0;
  for (let t = 0; t < DUEL_TURNS * 2 && ha > 0 && hb > 0; t++) {
    rounds = Math.floor(t / 2) + 1;
    if (t % 2 === 0) hb -= Math.round(hit(a.atk * ma * ea, b.def * mb, rnd).dmg);
    else ha -= Math.round(hit(b.atk * mb * eb, a.def * ma, rnd).dmg);
  }
  const pa = Math.max(0, ha) / a.hp;
  const pb = Math.max(0, hb) / b.hp;
  const result = hb <= 0 ? 'win' : ha <= 0 ? 'lose' : Math.abs(pa - pb) < 0.05 ? 'draw' : pa > pb ? 'win' : 'lose';
  return { result, hpMe: Math.round(pa * 100), hpFoe: Math.round(pb * 100), rounds };
}

/** Rút gọn nhân vật đang chơi thành bóng để đem đi đấu */
export function toRival(player: string, c: Character): RivalChar {
  return {
    player,
    name: c.name,
    gender: c.gender === 'nu' ? 'nu' : 'nam',
    race: c.race,
    realm: c.realm,
    layer: c.layer,
    path: c.path,
    daoTam: c.daoTam,
    age: Math.floor(c.age),
    lifespan: c.lifespan,
    hairColor: c.hairColor,
    hairStyle: c.hairStyle,
    outfitTone: c.outfitTone,
    outfitCut: c.outfitCut,
    equipped: c.equipped,
    lookSeed: c.lookSeed,
    element: c.element,
    lifeNo: c.lifeNo,
    sect: c.sect,
    sectRank: c.sectRank,
    cosmos: c.cosmos ?? null,
    alive: !c.dead,
  };
}
