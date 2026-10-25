import { PATHS, REALMS } from './data';
import { PETS } from './pets';
import type { Character, Mile, MileKind } from './types';

/**
 * Cột mốc chính của một đời: bước vào cảnh giới mới, chọn đạo, kết đạo lữ, nuôi linh thú, cưỡi rồng,
 * thắng hay thua người chơi khác. Ghi gọn để xem lại thành "hồi ký" ở nghĩa trang.
 */
export function addMile(c: Character, kind: MileKind, text: string) {
  const m: Mile = { age: Math.floor(c.age), kind, text, realm: c.realm };
  c.miles = [...(c.miles ?? []), m].slice(-16);
}

/** So với lần ghi trước, thấy thay đổi lớn thì thêm cột mốc */
export function trackMiles(c: Character | null) {
  if (!c) return;
  const s = c.mileSnap ?? { realm: 0, path: null, partner: null, pet: null, mount: null };
  if (c.realm > s.realm && c.realm >= 1) addMile(c, 'realm', `Bước vào ${REALMS[c.realm]?.name ?? 'cảnh giới mới'}`);
  if (c.path && c.path !== s.path) addMile(c, 'path', `Chọn con đường ${PATHS[c.path].name}`);
  if (c.partner && c.partner !== s.partner) addMile(c, 'love', `Kết thành đạo lữ với ${c.partner}`);
  const pet = c.pet ? c.petKind ?? null : null;
  if (pet && pet !== s.pet) addMile(c, 'pet', `Thu nhận ${PETS[pet]?.name ?? 'một linh thú'}`);
  if (c.mount && c.mount !== s.mount) addMile(c, 'mount', 'Thuần phục được rồng, thành Long Kỵ Sĩ');
  c.mileSnap = { realm: c.realm, path: c.path, partner: c.partner, pet, mount: c.mount ?? null };
}

/**
 * Chọn những mốc đáng kể nhất để kể lại (tối đa khoảng 6 mốc giữa đời):
 * đạo, đạo lữ, linh thú, rồng, trận đấu với người, và tối đa 2 lần đột phá lớn gần nhất.
 */
export function pickStory(miles: Mile[] | undefined, fallback: { age: number; realm: number }): Mile[] {
  const ms = miles ?? [];
  if (!ms.length) {
    return fallback.realm >= 1 ? [{ age: Math.max(10, Math.round(fallback.age * 0.7)), kind: 'realm', text: `Tu đến ${REALMS[fallback.realm]?.name}`, realm: fallback.realm }] : [];
  }
  const realms = ms.filter((m) => m.kind === 'realm' && (m.realm ?? 0) >= 2).slice(-2);
  const firstQi = ms.find((m) => m.kind === 'realm' && m.realm === 1);
  const others = ms.filter((m) => m.kind !== 'realm');
  const keep = [...(realms.length ? realms : firstQi ? [firstQi] : []), ...others];
  const uniq = keep.filter((m, i) => keep.findIndex((x) => x.kind === m.kind && x.text === m.text) === i);
  return uniq.sort((a, b) => a.age - b.age).slice(0, 6);
}
