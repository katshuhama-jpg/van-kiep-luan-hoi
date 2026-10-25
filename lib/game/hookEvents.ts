import { ITEMS } from './data';
import { addCult, giveItem, money, reward, stat } from './helpers';
import { PET_IDS, PETS, adopt } from './pets';
import type { Character, GameEvent } from './types';

/**
 * Sự kiện giữ chân: tiên duyên chắc chắn ở kiếp đầu, thần binh truyền kiếp nhận chủ.
 */
export const HOOK_EVENTS: GameEvent[] = [
  {
    id: 'tien_duyen_dau',
    minAge: 6,
    maxAge: 15,
    once: true,
    weight: 600,
    when: (c) => c.lifeNo === 1,
    title: 'Tiên duyên đầu đời',
    text: () => 'Một lão nhân râu tóc bạc phơ dừng chân trước cửa nhà bạn, nhìn bạn rất lâu: "Đứa trẻ này có tiên cốt. Ta để lại cho con một món quà, con chọn đi."',
    choices: () => [
      {
        label: 'Cuốn bí kíp ố vàng',
        hint: 'ngộ tính +15, tu vi +',
        lean: 'trung',
        run: (c) => {
          stat(c, 'ngoTinh', 15);
          addCult(c, reward(c, 1.5));
          return 'Bạn lật trang đầu, chữ như tự chui vào đầu. Từ đó bạn học gì cũng nhanh.';
        },
      },
      {
        label: 'Một con linh thú nhỏ',
        hint: 'có thú cưng ngay',
        lean: 'chinh',
        run: (c, ctx) => {
          const pool = PET_IDS.slice(0, 12);
          const id = pool[Math.floor(ctx.rnd() * pool.length)];
          adopt(c, id, ctx);
          return `Lão nhân thả xuống một con ${PETS[id].name}. Nó dụi đầu vào chân bạn như đã quen từ kiếp trước.`;
        },
      },
      {
        label: 'Túi gấm và một lời chúc',
        hint: 'khí vận +15, +300 linh thạch',
        lean: 'trung',
        run: (c, ctx) => {
          stat(c, 'khiVan', 15);
          money(c, 300);
          ctx.fx('coin', '+300');
          return 'Trong túi gấm có ba trăm linh thạch và một lá bùa. Lão nhân cười: "Phúc của con còn dài."';
        },
      },
    ],
  },
  {
    id: 'than_binh_nhan_chu',
    minAge: 12,
    once: true,
    weight: 500,
    when: (c) => !!c.legend,
    title: 'Thần binh nhận chủ',
    text: (c) => `Đêm ấy, ngoài sân có tiếng ngân dài như rồng ngâm. Một thanh binh khí cắm thẳng xuống đất, chuôi còn rung: chính là ${c.legend!.name}, thần binh bạn đã mang qua ${c.legend!.lv} kiếp.`,
    choices: (c) => [
      {
        label: 'Rút thần binh lên',
        hint: 'thần binh mạnh thêm một bậc',
        lean: 'trung',
        run: (ch, ctx) => {
          const L = ch.legend!;
          giveItem(ch, L.item, true);
          ctx.fx('layer', L.name);
          return `${L.name} nhận ra chủ cũ, kiếm khí bao trùm cả sân. Mỗi kiếp truyền qua, nó lại mạnh thêm (công +${Math.min(10, L.lv) * 8}%).`;
        },
      },
      {
        label: 'Để nó yên nghỉ',
        hint: 'tâm cảnh +, mất thần binh',
        lean: 'chinh',
        run: (ch) => {
          stat(ch, 'tamCanh', 12);
          ch.legend = null;
          return `Bạn chắp tay vái ${c.legend!.name}. Thần binh rung lên một hồi rồi chìm vào lòng đất.`;
        },
      },
    ],
  },
];

export const legendItemName = (id: string) => ITEMS.find((i) => i.id === id)?.name ?? id;
