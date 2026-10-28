import type { Character } from './types';
import { tr } from '../i18n';

/** Nhân vật mẫu cố định (không ngẫu nhiên) để trưng bày ở trang đầu */
export function demoChar(p: Partial<Character>): Character {
  return {
    name: tr('Lâm Thanh Vân', "Lin Qingyun"),
    gender: 'nam',
    race: 'nhan',
    origin: '',
    originId: 'nong',
    linhCan: tr('Huyền linh căn', "Mystic Spiritual Root"),
    linhCanMul: 1.2,
    lifeNo: 1,
    age: 30,
    lifespan: 200,
    realm: 2,
    layer: 1,
    cultivation: 0,
    stats: { tamCanh: 50, ngoTinh: 50, khiVan: 50, tamMa: 0, sucKhoe: 80 },
    daoTam: 0,
    path: null,
    sect: null,
    linhThach: 0,
    inventory: [],
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
    ...p,
  };
}
