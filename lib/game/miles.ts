import { ITEMS, PATHS, REALMS, realmName } from './data';
import { PETS } from './pets';
import { ELEMENTS } from './nguhanh';
import type { Character, Mile, MileKind } from './types';
import { tr } from '../i18n';
import { nameOf } from '../hanviet';

/**
 * Cột mốc chính của một đời: bước vào cảnh giới mới, chọn đạo, bái sư, kết đạo lữ, nuôi linh thú,
 * cưỡi rồng, phát tài, có được bảo vật, trừ yêu, thắng thua người chơi khác.
 * Ghi gọn để xem lại thành "hồi ký" ở nghĩa trang.
 */
export function addMile(c: Character, kind: MileKind, text: string) {
  const m: Mile = { age: Math.floor(c.age), kind, text, realm: c.realm };
  c.miles = [...(c.miles ?? []), m].slice(-24);
}

const WEALTH = [tr('Bần hàn', "Destitute"), tr('Bình dân', "Commoner"), tr('Khá giả', "Well-off"), tr('Phú hộ', "Wealthy"), tr('Đại phú hào', "Tycoon")];
const KILL_STEPS = [10, 50, 200];

function wealthId(c: Character) {
  const w = c.linhThach + (c.income ?? 0) * 10;
  return w < 50 ? 0 : w < 300 ? 1 : w < 1500 ? 2 : w < 6000 ? 3 : 4;
}

/** So với lần ghi trước, thấy thay đổi lớn thì thêm cột mốc */
export function trackMiles(c: Character | null) {
  if (!c) return;
  const s = c.mileSnap ?? { realm: 0, path: null, partner: null, pet: null, mount: null };
  if (c.realm > s.realm && c.realm >= 1)
    addMile(c, 'realm', c.realm === 8 ? (c.cosmos === 'ma' ? tr('Vượt huyết kiếp, bước vào Ma giới', "Survived the blood tribulation and entered the Demon Realm") : c.cosmos === 'hu' ? tr('Vượt lôi kiếp, bước vào Thái Hư giới', "Survived the lightning tribulation and entered the Great Void Realm") : tr('Phi thăng tiên giới', "Ascended to the Immortal Realm")) : tr(`Bước vào ${realmName(c.realm, c.cosmos)}`, `Entered ${realmName(c.realm, c.cosmos)}`));
  if (c.path && c.path !== s.path) addMile(c, 'path', tr(`Chọn con đường ${PATHS[c.path].name}`, `Chose the path of ${PATHS[c.path].name}`));
  if (c.sect && c.sect !== s.sect && s.sect !== undefined) addMile(c, 'sect', tr(`Bái nhập ${c.sect}`, `Joined ${nameOf(c.sect)}`));
  if (c.partner && c.partner !== s.partner) addMile(c, 'love', tr(`Kết thành đạo lữ với ${c.partner}`, `Became Yao companions with ${c.partner}`));
  const pet = c.pet ? (c.petKind ?? null) : null;
  if (pet && pet !== s.pet) addMile(c, 'pet', tr(`Thu nhận ${PETS[pet]?.name ?? tr('một linh thú', "a spirit beast")}`, `Took in ${PETS[pet]?.name ?? tr('một linh thú', "a spirit beast")}`));
  if (c.mount && c.mount !== s.mount) addMile(c, 'mount', tr('Thuần phục được rồng, thành Long Kỵ Sĩ', "Tamed a dragon and became a Dragon Rider"));
  // phát tài: lần đầu lên Phú hộ, Đại phú hào
  const w = wealthId(c);
  if (s.wealth !== undefined && w > s.wealth && w >= 3) addMile(c, 'wealth', tr(`Trở thành ${WEALTH[w]}, gia sản ${c.linhThach} linh thạch`, `Became ${WEALTH[w]}, with a fortune of ${c.linhThach} spirit stones`));
  // bảo vật: lần đầu mặc lên người món cực phẩm
  const rare = Object.values(c.equipped).filter((id): id is string => !!id && (ITEMS.find((i) => i.id === id)?.rare ?? 0) >= 3);
  for (const id of rare) if (s.rare && !s.rare.includes(id)) addMile(c, 'treasure', tr(`Có được bảo vật ${ITEMS.find((i) => i.id === id)?.name}`, `Obtained the treasure ${ITEMS.find((i) => i.id === id)?.name}`));
  // trừ yêu: số quái đã diệt vượt mốc
  const kills = Object.values(c.kills ?? {}).reduce((a, b) => a + b, 0);
  const step = KILL_STEPS.filter((k) => kills >= k).pop();
  if (s.kills !== undefined && step && (s.kills ?? 0) < step) addMile(c, 'hunt', tr(`Diệt đủ ${step} yêu thú, danh trừ yêu vang khắp vùng`, `Slew ${step} demon beasts, earning renown as a demon hunter across the land`));
  c.mileSnap = {
    realm: c.realm,
    path: c.path,
    partner: c.partner,
    pet,
    mount: c.mount ?? null,
    sect: c.sect,
    wealth: Math.max(w, s.wealth ?? 0),
    rare: Array.from(new Set([...(s.rare ?? []), ...rare])),
    kills,
  };
}

/** Thứ tự ưu tiên khi phải bỏ bớt mốc */
const PRIO: Record<MileKind, number> = { journey: 2, fate: 1, revenge: 9, mount: 9, love: 8, path: 8, realm: 7, sect: 7, pet: 6, treasure: 6, duel: 5, wealth: 5, hunt: 4, birth: 0, death: 0 };

export interface StoryFallback {
  age: number;
  realm: number;
  path?: string | null;
  pet?: boolean;
  petKind?: string;
  mount?: string | null;
  sect?: string | null;
  equipped?: Partial<Record<string, string>>;
  element?: string;
  birthPlace?: string;
}

/**
 * Chọn 6-8 mốc giữa đời (cộng chào đời và tạ thế là 8-10 cảnh).
 * Đời nào ghi ít mốc (kiếp cũ chưa có sổ ghi) thì dựng thêm mốc từ cảnh giới, đạo, tông môn, linh thú đã biết.
 */
export function pickStory(miles: Mile[] | undefined, fb: StoryFallback, max = 8): Mile[] {
  const ms = (miles ?? []).filter((m, i, a) => a.findIndex((x) => x.kind === m.kind && x.text === m.text) === i);
  const has = (k: MileKind, realm?: number) => ms.some((m) => m.kind === k && (realm === undefined || m.realm === realm));
  const extra: Mile[] = [];
  const end = Math.max(1, fb.age - 1);
  // tuổi ước chừng khi đạt cảnh giới r: Luyện Khí khoảng 14-16 tuổi, cảnh giới cuối khoảng 80% đời
  const ageAt = (r: number) => (fb.realm <= 1 ? Math.min(end, 15) : Math.min(end, Math.round(15 + ((r - 1) / (fb.realm - 1)) * Math.max(0, fb.age * 0.8 - 15))));
  for (let r = 1; r <= fb.realm; r++)
    if (!has('realm', r) && !(r === 1 && has('realm'))) extra.push({ age: ageAt(r), kind: 'realm', text: r === 1 ? tr('Dẫn khí nhập thể, bước vào Luyện Khí', "Drew qi into the body and entered Qi Refining") : tr(`Tu đến ${REALMS[r]?.name}`, `Cultivated to ${REALMS[r]?.name}`), realm: r });
  if (fb.path && !has('path') && PATHS[fb.path as keyof typeof PATHS])
    extra.push({ age: ageAt(Math.min(2, fb.realm)), kind: 'path', text: tr(`Chọn con đường ${PATHS[fb.path as keyof typeof PATHS].name}`, `Chose the path of ${PATHS[fb.path as keyof typeof PATHS].name}`), realm: Math.min(2, fb.realm) });
  if (fb.sect && !has('sect')) extra.push({ age: Math.min(end, 12), kind: 'sect', text: tr(`Bái nhập ${fb.sect}`, `Joined ${nameOf(fb.sect)}`), realm: 0 });
  if (fb.pet && !has('pet')) extra.push({ age: Math.min(end, 10), kind: 'pet', text: tr(`Thu nhận ${PETS[fb.petKind ?? '']?.name ?? tr('một linh thú', "a spirit beast")}`, `Took in ${PETS[fb.petKind ?? '']?.name ?? tr('một linh thú', "a spirit beast")}`), realm: 0 });
  if (fb.mount && !has('mount')) extra.push({ age: Math.max(1, Math.round(fb.age * 0.85)), kind: 'mount', text: tr('Thuần phục được rồng, thành Long Kỵ Sĩ', "Tamed a dragon and became a Dragon Rider"), realm: fb.realm });

  // đời ít biến cố: kể thêm vài chuyện đời thường từ những gì đã biết
  const fill: Mile[] = [];
  if (fb.element && ELEMENTS[fb.element as keyof typeof ELEMENTS])
    fill.push({ age: 6, kind: 'fate', text: tr(`Thầy bói xem tướng, phán bản mệnh thuộc ${ELEMENTS[fb.element as keyof typeof ELEMENTS].name}`, `A fortune-teller read your face and declared your natal element ${ELEMENTS[fb.element as keyof typeof ELEMENTS].name}`), realm: 0 });
  fill.push({
    age: 16,
    kind: 'journey',
    text: fb.birthPlace ? tr(`Rời ${fb.birthPlace.split(', ')[0]}, khăn gói lên đường xông pha giang hồ`, `Left ${fb.birthPlace.split(', ')[0]}, bundle on your back, to brave the jianghu`) : tr('Khăn gói rời nhà, lên đường xông pha giang hồ', "Left home, bundle on your back, to brave the jianghu"),
    realm: Math.min(1, fb.realm),
  });
  const wp = ITEMS.find((i) => i.id === fb.equipped?.vu_khi);
  if (wp && !has('treasure')) fill.push({ age: Math.max(14, Math.round(fb.age * 0.45)), kind: 'treasure', text: tr(`Có được ${wp.name}, từ đó không rời tay`, `Obtained ${wp.name} and never let it leave your hand`), realm: fb.realm });
  const robe = ITEMS.find((i) => i.id === fb.equipped?.ao && i.id !== 'ao_vai');
  if (robe && !has('treasure')) fill.push({ age: Math.max(15, Math.round(fb.age * 0.6)), kind: 'treasure', text: tr(`Khoác lên mình ${robe.name}`, `Donned ${robe.name}`), realm: fb.realm });
  let all = [...ms, ...extra];
  for (const f of fill) if (all.length < 6 && f.age < fb.age) all.push(f);
  if (all.length > max) {
    // giữ cảnh giới cao nhất, còn lại theo độ quan trọng, cùng mức thì giữ mốc muộn hơn
    const top = all.filter((m) => m.kind === 'realm').sort((a, b) => (b.realm ?? 0) - (a.realm ?? 0))[0];
    const rest = all.filter((m) => m !== top).sort((a, b) => PRIO[b.kind] - PRIO[a.kind] || b.age - a.age);
    all = [...(top ? [top] : []), ...rest].slice(0, max);
  }
  return all.sort((a, b) => a.age - b.age || (a.realm ?? 0) - (b.realm ?? 0));
}
