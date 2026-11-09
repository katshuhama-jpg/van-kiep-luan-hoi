import type { Character, RivalChar } from './game/types';

/** Tách khỏi lib/social.ts ('use client') để app/api/loi-dai gọi được trên máy chủ */
/** Đổi dữ liệu nhân vật trên máy chủ thành bóng để đem đi đấu */
export function toRival(username: string, data: unknown): RivalChar | null {
  const c = data as Partial<Character> & { alive?: boolean; lifeId?: number };
  if (!c.name) return null;
  return {
    player: username,
    name: c.name,
    gender: c.gender === 'nu' ? 'nu' : 'nam',
    race: c.race,
    realm: c.realm ?? 0,
    layer: c.layer ?? 1,
    path: c.path ?? null,
    daoTam: c.daoTam ?? 0,
    age: Math.floor(c.age ?? 30),
    lifespan: c.lifespan,
    hairColor: c.hairColor,
    hairStyle: c.hairStyle,
    outfitTone: c.outfitTone,
    outfitCut: c.outfitCut,
    equipped: c.equipped ?? { ao: 'ao_vai' },
    lookSeed: c.lookSeed,
    element: c.element,
    lifeNo: c.lifeNo ?? 1,
    alive: c.alive !== false,
    cosmos: c.cosmos ?? null,
    lifeId: c.lifeId,
  };
}
