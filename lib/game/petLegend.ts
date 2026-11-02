import type { MonsterLook } from './monsterLook';
import { tr } from '../i18n';

/**
 * 4.2.0: linh thú truyền thuyết (rank SSR, SSS). Dùng thú LPC lớn có sẵn trong bộ quái,
 * vẽ bằng MonsterLpc thay cho sprite thú cưng nhỏ ở /lpc/pets.
 */
export interface LegendPet {
  name: string;
  look: MonsterLook;
  meet: string; // câu kể lúc gặp
  fly?: boolean;
}

export const LEGEND_PETS: Record<string, LegendPet> = {
  kim_si: {
    name: tr('Kim Sí Đại Bằng', 'Golden-Winged Roc'),
    look: { kind: 'beast', sheet: 'eagle', frames: 3, cell: 64, scale: 1.9, strip: true, fps: 6, filter: 'sepia(0.4) saturate(1.6) drop-shadow(0 0 3px #ffd36b)' },
    meet: tr('Một con đại bằng cánh vàng sà xuống đỉnh núi nơi bạn ngồi thiền, nghiêng đầu nhìn bạn rất lâu.', 'A golden-winged roc swoops down onto the peak where you meditate and studies you for a long time.'),
    fly: true,
  },
  tat_phuong: {
    name: tr('Tất Phương', 'Bifang'),
    look: { kind: 'beast', sheet: 'dk_crane', frames: 3, cell: 48, scale: 1.3, strip: true, fps: 3, filter: 'sepia(1) saturate(5) hue-rotate(-30deg)' },
    meet: tr('Chim một chân lông đỏ như lửa đậu trên cành khô. Cành cây bốc khói mà không cháy.', 'A one-legged bird with fire-red feathers perches on a dead branch. The branch smokes but does not burn.'),
  },
  cuu_vi: {
    name: tr('Cửu Vĩ Thiên Hồ', 'Nine-Tailed Sky Fox'),
    look: { kind: 'beast', sheet: 'fox_r', frames: 4, cell: 64, scale: 1.2, strip: true, fps: 7, filter: 'grayscale(1) brightness(1.8) drop-shadow(0 0 4px #b8a0ff)' },
    meet: tr('Dưới trăng, một con hồ ly trắng chín đuôi ngồi chặn lối, mắt cười như người.', 'Under the moon a white nine-tailed fox sits in your path, its eyes smiling like a person.'),
  },
  con_bang: {
    name: tr('Côn Bằng', 'Kunpeng'),
    look: { kind: 'beast', sheet: 'eagle', frames: 3, cell: 64, scale: 2.2, strip: true, fps: 5, filter: 'hue-rotate(170deg) saturate(1.5) drop-shadow(0 0 4px #9fd8ff)' },
    meet: tr('Biển bắc nổi sóng, một con cá lớn hóa chim bay lên, bóng cánh che cả trời.', 'The northern sea heaves; a great fish turns into a bird and rises, its wings shading the sky.'),
    fly: true,
  },
  bach_ho: {
    name: tr('Bạch Hổ', 'White Tiger'),
    look: { kind: 'beast', sheet: 'dk_tiger', frames: 3, cell: 64, scale: 1.4, strip: true, fps: 5, filter: 'grayscale(1) brightness(1.6) drop-shadow(0 0 4px #e8f0ff)' },
    meet: tr('Gió tây nổi lên, một con hổ trắng bước ra từ rừng thu, sát khí làm lá rụng ào ào.', 'A west wind rises and a white tiger steps from the autumn woods, its killing aura stripping the leaves.'),
  },
  thanh_giao: {
    name: tr('Thanh Giao', 'Azure Flood Dragon'),
    look: { kind: 'beast', sheet: 'dk_serpent', frames: 8, cell: 64, scale: 1.5, strip: true, fps: 8, filter: 'sepia(1) hue-rotate(70deg) saturate(3) brightness(1.2)' },
    meet: tr('Đầm sâu cuộn nước, một con giao xanh ngóc đầu, sắp hóa rồng mà còn thiếu một bước.', 'The deep pool churns and an azure flood dragon raises its head, one step short of becoming a true dragon.'),
  },
  cung_ky: {
    name: tr('Cùng Kỳ', 'Qiongqi'),
    look: { kind: 'beast', sheet: 'dk_tiger', frames: 3, cell: 64, scale: 1.4, strip: true, fps: 5, filter: 'grayscale(0.5) hue-rotate(220deg) saturate(1.5) drop-shadow(0 0 4px #9a6aff)' },
    meet: tr('Hung thú có cánh mọc trên lưng hổ nằm giữa đống xương, thấy bạn thì liếm mép.', 'A tiger-backed winged fiend lies among bones and licks its lips when it sees you.'),
  },
  thanh_long: {
    name: tr('Thanh Long', 'Azure Dragon'),
    look: { kind: 'beast', sheet: 'dk_flydragon', frames: 3, cell: 144, scale: 0.75, strip: true, fps: 5, filter: 'hue-rotate(80deg) saturate(1.4) drop-shadow(0 0 5px #9ff0c8)' },
    meet: tr('Mây đen cuộn lại phía đông, một con rồng xanh lượn xuống, vảy rơi thành mưa linh khí.', 'Dark clouds roll in from the east and an azure dragon descends, its shed scales falling as rain of spirit qi.'),
    fly: true,
  },
  ky_lan: {
    name: tr('Kỳ Lân', 'Qilin'),
    look: { kind: 'beast', sheet: 'dk_qilin', frames: 3, cell: 85, scale: 1, strip: true, fps: 5, filter: 'saturate(1.3) drop-shadow(0 0 5px #ffd36b)' },
    meet: tr('Nơi bạn đi qua, cỏ khô xanh lại. Một con kỳ lân trắng đứng chờ, không giẫm lên dù một con kiến.', 'Where you pass, dry grass turns green. A white qilin waits, careful not to tread on even an ant.'),
  },
  huyen_vu: {
    name: tr('Huyền Vũ', 'Black Tortoise'),
    look: { kind: 'beast', sheet: 'dk_turtle', frames: 8, cell: 64, scale: 1.3, strip: true, fps: 6, filter: 'hue-rotate(140deg) saturate(1.2) brightness(0.9) drop-shadow(0 0 4px #5ad0c0)' },
    meet: tr('Biển bắc rút nước, để lộ một con rùa đen lớn như hòn đảo, rắn quấn trên mai.', 'The northern sea draws back to reveal a black tortoise the size of an island, a serpent coiled on its shell.'),
  },
  hoa_phuong: {
    name: tr('Hỏa Phượng', 'Fire Phoenix'),
    look: { kind: 'beast', sheet: 'dk_crane', frames: 3, cell: 48, scale: 1.8, strip: true, fps: 3, filter: 'sepia(1) saturate(6) hue-rotate(-15deg) brightness(1.2) drop-shadow(0 0 6px #ffb02a)' },
    meet: tr('Ngọn núi lửa tắt trăm năm bỗng sáng rực. Từ tro tàn, một con phượng lửa vươn cánh hót vang.', 'A volcano dead for a century suddenly blazes. From the ashes a fire phoenix spreads its wings and sings.'),
    fly: true,
  },
};

export const LEGEND_IDS = Object.keys(LEGEND_PETS);
