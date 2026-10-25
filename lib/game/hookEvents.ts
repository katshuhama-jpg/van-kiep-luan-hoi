import { ITEMS } from './data';
import { addCult, giveItem, money, reward, stat } from './helpers';
import { PET_IDS, PETS, adopt } from './pets';
import type { Character, GameEvent } from './types';

/**
 * Sự kiện giữ chân: tiên duyên chắc chắn ở kiếp đầu, thần binh truyền kiếp nhận chủ.
 */
export const HOOK_EVENTS: GameEvent[] = [
  {
    id: 'van_kiep_quy_nhat',
    minAge: 30,
    once: true,
    weight: 400,
    when: (c) => !!c.loreDone,
    title: 'Vạn Kiếp Quy Nhất',
    text: () =>
      'Đêm ấy bạn không mơ. Bạn tỉnh giấc trên đỉnh núi tuyết, và người kia đã quay mặt lại, mỉm cười bằng khuôn mặt của bạn: "Vạn kiếp đã đủ. Ngươi muốn dừng lại, hay đi thêm một kiếp nữa?"',
    choices: () => [
      {
        label: 'Buông bỏ, thoát khỏi Vạn Kiếp',
        hint: 'kết thúc mọi luân hồi',
        lean: 'chinh',
        run: (c, ctx) => {
          c.dead = true;
          c.endTag = 'thoat_van_kiep';
          c.cause = 'Gom lại vạn mảnh của chính mình, mỉm cười bước ra khỏi luân hồi';
          ctx.fx('breakthrough', 'VẠN KIẾP QUY NHẤT');
          return 'Bạn bước tới, hai bóng người hòa làm một. Tiếng chuông vang lên lần cuối, rồi im lặng. Lần đầu tiên sau vạn kiếp, bạn không cần câu trả lời nữa.';
        },
      },
      {
        label: 'Ở lại, sống trọn kiếp này đã',
        hint: 'tâm cảnh, khí vận +20',
        lean: 'trung',
        run: (c) => {
          c.stats.tamCanh = Math.min(100, c.stats.tamCanh + 20);
          c.stats.khiVan = Math.min(100, c.stats.khiVan + 20);
          return 'Người kia gật đầu: "Cũng là một câu trả lời." Bạn tỉnh dậy, thấy nắng sớm đẹp hơn mọi buổi sáng trước đây.';
        },
      },
    ],
  },
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
    text: (c) =>
      `Đêm ấy, ngoài sân có tiếng ngân dài như rồng ngâm. Một thanh binh khí cắm thẳng xuống đất, chuôi còn rung: chính là ${c.legend!.name}, thần binh bạn đã mang qua ${c.legend!.lv} kiếp.`,
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
