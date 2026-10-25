import { dao, money, stat } from './helpers';
import type { Character, GameEvent } from './types';

/** Thú cưng: ảnh trong /public/lpc/pets/<id>.png, hàng 0 quay trái, hàng 1 quay phải */
export interface PetDef {
  name: string;
  w: number; // cỡ khung gốc
  h: number;
  n: number; // số khung
  fps: number;
  s: number; // tỉ lệ điểm ảnh so với nhân vật (nhỏ hơn 1 vì chạy phía sau, ở xa hơn)
  fly?: boolean;
  dur: number; // giây cho một vòng chạy qua lại
  meet: string; // câu kể lúc gặp
}

export const PETS: Record<string, PetDef> = {
  soi_con: { name: 'sói con', w: 64, h: 32, n: 5, fps: 9, s: 0.6, dur: 9, meet: 'Một con sói con bị thương nằm thoi thóp bên suối. Bạn băng bó cho nó, từ đó nó lẽo đẽo theo sau.' },
  ho_ly: { name: 'tiểu hồ ly', w: 64, h: 64, n: 4, fps: 8, s: 0.55, dur: 8, meet: 'Một con hồ ly đỏ bám theo bạn ba ngày liền, đuổi thế nào cũng không đi.' },
  tuyet_ho: { name: 'tuyết hồ', w: 64, h: 64, n: 4, fps: 8, s: 0.55, dur: 8, meet: 'Con hồ ly trắng như tuyết dụi đầu vào tay bạn rồi không chịu rời nữa.' },
  cho_vang: { name: 'chó vàng', w: 48, h: 48, n: 8, fps: 12, s: 0.6, dur: 7, meet: 'Con chó vàng lang thang đi theo bạn về nhà, vẫy đuôi rối rít.' },
  chuot_bach: { name: 'bạch thử', w: 32, h: 32, n: 3, fps: 10, s: 0.8, dur: 6, meet: 'Một con chuột bạch chui vào tay áo bạn ngủ. Từ đó bạn có thêm một miệng ăn.' },
  chuot_xam: { name: 'chuột xám', w: 32, h: 32, n: 3, fps: 10, s: 0.8, dur: 6, meet: 'Con chuột xám tinh khôn trộm bánh của bạn, bị bắt quả tang rồi ở lại luôn.' },
  nam_linh: { name: 'nấm linh', w: 32, h: 32, n: 4, fps: 6, s: 0.8, dur: 12, meet: 'Cây nấm sau nhà mọc chân, lạch bạch đi theo bạn như con vịt.' },
  dai_bang: { name: 'ưng con', w: 32, h: 32, n: 3, fps: 8, s: 0.85, fly: true, dur: 10, meet: 'Con ưng non rơi khỏi tổ được bạn nuôi lớn, giờ cứ bay lượn trên đầu bạn.' },
  doi: { name: 'dơi tinh', w: 64, h: 64, n: 7, fps: 12, s: 0.6, fly: true, dur: 7, meet: 'Một con dơi đen treo ngược ở xà nhà. Đêm nào nó cũng bay theo bạn.' },
  ong_vang: { name: 'kim phong', w: 32, h: 32, n: 6, fps: 12, s: 0.75, fly: true, dur: 9, meet: 'Con ong vàng to bằng ngón tay vo ve quanh bạn, chẳng bao giờ đốt.' },
  slime: { name: 'linh dịch', w: 64, h: 64, n: 8, fps: 8, s: 0.55, dur: 11, meet: 'Một khối linh dịch xanh nhảy tưng tưng theo bạn từ con suối linh khí.' },
  ran_con: { name: 'tiểu thanh xà', w: 64, h: 64, n: 7, fps: 8, s: 0.55, dur: 12, meet: 'Con rắn xanh nhỏ quấn lên cổ tay bạn như chiếc vòng, không chịu xuống.' },
};
export const PET_IDS = Object.keys(PETS);

/** Loại thú cưng của nhân vật; nhân vật cũ chưa có thì suy từ hạt giống */
export function petOf(c: Pick<Character, 'petKind' | 'lookSeed' | 'name'>): string {
  if (c.petKind && PETS[c.petKind]) return c.petKind;
  let h = c.lookSeed ?? 0;
  if (!h) for (let i = 0; i < c.name.length; i++) h = (h * 31 + c.name.charCodeAt(i)) >>> 0;
  return PET_IDS[h % PET_IDS.length];
}

export function petName(c: Pick<Character, 'petKind' | 'lookSeed' | 'name'>): string {
  return PETS[petOf(c)].name;
}

/** Thú cưng gặp năm nay (cố định theo tuổi để lời kể và kết quả khớp nhau) */
function petThisYear(c: Character): string {
  const pool = PET_IDS.filter((p) => p !== 'soi_con' && p !== 'tuyet_ho');
  return pool[((c.lookSeed ?? 7) + Math.floor(c.age) * 13) % pool.length];
}

export const PET_EVENT: GameEvent = {
  id: 'thu_cung',
  minAge: 6,
  weight: 7,
  once: true,
  when: (c) => !c.pet,
  title: 'Có đứa đi theo',
  text: (c) => PETS[petThisYear(c)].meet,
  choices: (c) => {
    const id = petThisYear(c);
    const p = PETS[id];
    return [
      { label: `Nhận nuôi ${p.name}`, lean: 'chinh', run: (ch, ctx) => { ch.pet = true; ch.petKind = id; dao(ch, 3); stat(ch, 'tamCanh', 5); ctx.fx('love', 'Có thú cưng'); return `Từ nay ${p.name} chạy theo bạn khắp nơi.`; } },
      { label: 'Cho ăn rồi đuổi đi', lean: 'trung', run: (ch) => { stat(ch, 'khiVan', 2); return `${p.name[0].toUpperCase() + p.name.slice(1)} ăn xong, ngoái nhìn bạn rồi đi mất.`; } },
      { label: 'Bắt đem bán', lean: 'ta', run: (ch) => { dao(ch, -3); money(ch, 25); return `Bạn bán ${p.name} được 25 linh thạch. Đêm đó bạn nằm mơ thấy nó.`; } },
    ];
  },
};
