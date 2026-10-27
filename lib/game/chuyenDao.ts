import { ITEMS, PATHS } from './data';
import { addCult, addPill, dao, giveItem, luck, reward, stat } from './helpers';
import type { Character, Choice, EffectCtx, GameEvent, PathId, Slot } from './types';

/**
 * Tán công chuyển đạo (bản sau 3.2.0): đổi con đường giữa kiếp.
 * Không có nút đổi tự do: phải gặp một trong 10 kỳ ngộ, mỗi kỳ ngộ dẫn sang một con đường.
 * Mỗi kiếp đổi được một lần, từ Trúc Cơ trở lên, ở phàm giới.
 * Cái giá: mất 30% tu vi đang có, tâm ma tăng, đồ riêng của con đường cũ phải tháo ra.
 * Kỳ ngộ đã gặp được ghi vào Sổ Sinh Tử để sưu tầm.
 */

export const DAO_LOSS = 0.3;

export interface ChuyenDao {
  id: string;
  to: PathId;
  name: string;
  hint: string; // gợi ý khi chưa gặp (hiện ở Sổ Sinh Tử)
}

export const CHUYEN_DAO: ChuyenDao[] = [
  { id: 'cd_kiem_trung', to: 'kiem', name: 'Kiếm trủng gọi tên', hint: 'Có nơi chôn vạn thanh kiếm, kiếm cũng biết chọn chủ.' },
  { id: 'cd_kiem_mu', to: 'kiem', name: 'Kiếm khách mù trên cầu', hint: 'Người không thấy đường lại thấy rõ đường kiếm.' },
  { id: 'cd_dan_lo', to: 'dan', name: 'Lò đan bỏ hoang', hint: 'Lửa trong lò đã tắt trăm năm mà tro vẫn còn ấm.' },
  { id: 'cd_dan_duoc_vuong', to: 'dan', name: 'Dược Vương trăng trối', hint: 'Người chữa cả đời cho thiên hạ, cuối cùng không chữa được cho mình.' },
  { id: 'cd_tran_co', to: 'tran', name: 'Bàn cờ trong núi', hint: 'Một ván cờ dang dở, đi sai một nước là kẹt lại trong núi.' },
  { id: 'cd_tran_tinh_do', to: 'tran', name: 'Thiên cơ tinh đồ', hint: 'Đêm không trăng, sao trên trời xếp thành một trận đồ.' },
  { id: 'cd_phat_buong_dao', to: 'phat', name: 'Buông dao thành Phật', hint: 'Tay dính máu càng nhiều, tiếng chuông càng nghe rõ.' },
  { id: 'cd_ma_huyet_thu', to: 'ma', name: 'Huyết thư dưới đáy giếng', hint: 'Có cái giếng cạn mà đêm đêm vẫn nghe tiếng nước.' },
  { id: 'cd_ma_tam_ma', to: 'ma', name: 'Tâm ma mở cửa', hint: 'Khi tâm ma đủ lớn, nó không còn muốn giết bạn nữa.' },
  { id: 'cd_yeu_huyet_mach', to: 'yeu', name: 'Huyết mạch thức tỉnh', hint: 'Uống nhầm máu một con yêu thú sắp chết.' },
];

export const chuyenDaoOf = (id: string | undefined) => CHUYEN_DAO.find((x) => x.id === id);

/** Có thể gặp kỳ ngộ chuyển đạo sang con đường `to` không */
const canSwitch = (c: Character, to: PathId) => !!c.path && c.path !== to && !c.daoSwitch && c.realm >= 2 && !c.cosmos;

/** Đổi con đường: trả giá rồi nhận ưu đãi nhỏ của con đường mới */
export function switchPath(c: Character, cd: ChuyenDao, ctx: EffectCtx, opts: { tamMa?: number } = {}): string {
  const from = c.path ? PATHS[c.path].name : 'tán tu';
  const lost = Math.round(c.cultivation * DAO_LOSS);
  c.cultivation = Math.max(0, c.cultivation - lost);
  stat(c, 'tamMa', opts.tamMa ?? 15);
  // đồ riêng của con đường cũ phải tháo ra (vẫn nằm trong túi)
  const off: string[] = [];
  for (const [slot, id] of Object.entries(c.equipped) as [Slot, string | undefined][]) {
    const it = id ? ITEMS.find((i) => i.id === id) : null;
    if (it?.path && it.path !== cd.to) {
      delete c.equipped[slot];
      off.push(it.name);
    }
  }
  c.path = cd.to;
  c.daoSwitch = cd.id;
  if (cd.to === 'phat') dao(c, 10);
  if (cd.to === 'ma') dao(c, -10);
  if (cd.to === 'yeu') stat(c, 'sucKhoe', 10);
  if (cd.to === 'dan') addPill(c, 'tu_khi', 2);
  if (cd.to === 'tran') stat(c, 'tamCanh', 6);
  if (cd.to === 'kiem' && !c.equipped.vu_khi) giveItem(c, 'moc_kiem');
  c.miles = [...(c.miles ?? []), { age: Math.floor(c.age), kind: 'path', text: `Tán công chuyển đạo: bỏ ${from}, theo ${PATHS[cd.to].name} (${cd.name})` }];
  ctx.fx('breakthrough', `Chuyển đạo: ${PATHS[cd.to].name}`);
  return `Bạn tán đi công pháp ${from}, chuyển sang ${PATHS[cd.to].name} (-${lost} tu vi${off.length ? `, tháo ${off.join(', ')}` : ''}).`;
}

const stay = (text: string, gain = 0.15): Choice => ({
  label: 'Giữ con đường của mình',
  lean: 'trung',
  run: (c) => {
    const exp = Math.round(reward(c, gain));
    addCult(c, exp);
    stat(c, 'tamCanh', 3);
    return `${text} (+${exp} tu vi)`;
  },
});

const cost = (to: PathId) => `đổi sang ${PATHS[to].name} · mất 30% tu vi · tâm ma tăng · mỗi kiếp một lần`;
const ev = (id: string) => CHUYEN_DAO.find((x) => x.id === id)!;

export const CHUYEN_DAO_EVENTS: GameEvent[] = [
  {
    id: 'cd_kiem_trung',
    minRealm: 2,
    once: true,
    weight: 1.4,
    when: (c) => canSwitch(c, 'kiem'),
    title: 'Kiếm trủng gọi tên',
    text: () => 'Đi ngang một thung lũng cắm đầy kiếm gãy, một thanh kiếm cổ bỗng rung lên rồi tự rút khỏi đất, bay tới lơ lửng trước mặt bạn. Chuôi kiếm khắc đúng tên bạn.',
    choices: () => [
      {
        label: 'Nắm lấy chuôi kiếm',
        hint: cost('kiem'),
        lean: 'trung',
        run: (c, ctx) => `${switchPath(c, ev('cd_kiem_trung'), ctx)} Kiếm ý tràn vào kinh mạch, công pháp cũ vỡ vụn. Từ nay bạn là Kiếm tu.`,
      },
      stay('Bạn cúi đầu cảm tạ, đặt thanh kiếm trở lại đất. Kiếm rung lên một tiếng như thở dài.'),
    ],
  },
  {
    id: 'cd_kiem_mu',
    minRealm: 2,
    once: true,
    weight: 1.4,
    when: (c) => canSwitch(c, 'kiem'),
    title: 'Kiếm khách mù trên cầu',
    text: () => 'Một lão già mù ngồi chặn giữa cầu, gậy trúc gác ngang đùi: "Ta nghe tiếng bước chân là biết ngươi đi sai đường. Đỡ được ba gậy, ta dạy ngươi đường kiếm."',
    choices: () => [
      {
        label: 'Đỡ ba gậy',
        hint: `${cost('kiem')} · có thể bị thương`,
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() >= luck(c, 0.6 + c.stats.ngoTinh / 400)) {
            stat(c, 'sucKhoe', -15);
            return 'Gậy thứ hai đã quất trúng cổ tay bạn. Lão già lắc đầu bỏ đi, tiếng gậy gõ xa dần (-15 sức khỏe).';
          }
          return `Ba gậy, bạn đỡ trọn. Lão già cười: "Đường kiếm không ở mắt." ${switchPath(c, ev('cd_kiem_mu'), ctx)}`;
        },
      },
      stay('Bạn vòng qua cầu khác. Sau lưng lão già hát một câu không rõ lời.'),
    ],
  },
  {
    id: 'cd_dan_lo',
    minRealm: 2,
    once: true,
    weight: 1.4,
    when: (c) => canSwitch(c, 'dan'),
    title: 'Lò đan bỏ hoang',
    text: () => 'Trong động đá có một lò đan đồng xanh phủ rêu. Lửa tắt đã trăm năm mà tro vẫn còn ấm. Dưới đáy lò ép một cuốn đan kinh viết dở.',
    choices: () => [
      {
        label: 'Nhóm lại lửa lò, học theo đan kinh',
        hint: cost('dan'),
        lean: 'trung',
        run: (c, ctx) => `Lửa lò bùng lên xanh biếc như nhận ra chủ mới. ${switchPath(c, ev('cd_dan_lo'), ctx)} Mẻ đan đầu tiên ra lò thơm cả núi.`,
      },
      stay('Bạn lấy cuốn đan kinh làm gối đầu, đọc vài trang rồi ngủ thiếp đi.', 0.12),
    ],
  },
  {
    id: 'cd_dan_duoc_vuong',
    minRealm: 2,
    once: true,
    weight: 1.2,
    when: (c) => canSwitch(c, 'dan') && c.daoTam >= 0,
    title: 'Dược Vương trăng trối',
    text: () => 'Một ông lão nằm thoi thóp bên đường, tay vẫn nắm chặt giỏ thuốc. Ông nhận ra bạn: "Ta chữa cả đời cho người, không có ai nối nghề. Ngươi có muốn không?"',
    choices: () => [
      {
        label: 'Quỳ xuống nhận nghề',
        hint: `${cost('dan')} · đạo tâm thêm chính`,
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 8);
          return `Ông lão đặt giỏ thuốc vào tay bạn rồi nhắm mắt. ${switchPath(c, ev('cd_dan_duoc_vuong'), ctx, { tamMa: 8 })} Bạn chôn ông dưới gốc cây thuốc ông trồng.`;
        },
      },
      {
        label: 'Ở lại chăm ông những ngày cuối',
        lean: 'chinh',
        run: (c) => {
          dao(c, 6);
          addPill(c, 'tu_khi', 1);
          return 'Bạn ở lại bảy ngày, ông đi thanh thản. Ông để lại cho bạn một viên đan tự tay luyện.';
        },
      },
    ],
  },
  {
    id: 'cd_tran_co',
    minRealm: 2,
    once: true,
    weight: 1.4,
    when: (c) => canSwitch(c, 'tran'),
    title: 'Bàn cờ trong núi',
    text: () => 'Hai ông lão đánh cờ trên tảng đá giữa núi, một người đã hóa đá từ lâu. Người còn lại chỉ vào ghế trống: "Đi tiếp nước của y. Đi sai thì ở lại đây với ta."',
    choices: () => [
      {
        label: 'Ngồi xuống đi tiếp ván cờ',
        hint: `${cost('tran')} · đi sai mất mấy năm`,
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() >= luck(c, 0.55 + c.stats.ngoTinh / 300)) {
            c.age += 5;
            return 'Bạn đi sai một nước. Khi tỉnh lại, ông lão đã biến mất, râu bạn dài ra một gang. Năm năm đã trôi qua.';
          }
          return `Nước cờ của bạn mở ra một con đường giữa thế cờ chết. Ông lão gật đầu: "Trận cũng như cờ." ${switchPath(c, ev('cd_tran_co'), ctx)}`;
        },
      },
      stay('Bạn chắp tay xin kiếu. Ông lão không ngẩng lên, chỉ đặt thêm một quân cờ.'),
    ],
  },
  {
    id: 'cd_tran_tinh_do',
    minRealm: 3,
    once: true,
    weight: 1.2,
    when: (c) => canSwitch(c, 'tran') && c.stats.ngoTinh >= 30,
    title: 'Thiên cơ tinh đồ',
    text: () => 'Đêm không trăng, bạn nằm trên mái nhà và chợt thấy sao trời xếp thành một trận đồ khổng lồ, mỗi ngôi sao là một mắt trận. Nhìn thêm một chút nữa là hiểu.',
    choices: () => [
      {
        label: 'Thức trắng chép lại tinh đồ',
        hint: cost('tran'),
        lean: 'trung',
        run: (c, ctx) => `Gà gáy thì bạn chép xong. Công pháp cũ trong người tự tán đi như sương sớm. ${switchPath(c, ev('cd_tran_tinh_do'), ctx)}`,
      },
      stay('Bạn ngắm đến khi mây kéo tới. Trong lòng sáng ra được vài điều.'),
    ],
  },
  {
    id: 'cd_phat_buong_dao',
    minRealm: 2,
    once: true,
    weight: 3,
    when: (c) => canSwitch(c, 'phat') && (c.daoTam <= -10 || Object.values(c.kills ?? {}).reduce((a, b) => a + b, 0) >= 20),
    title: 'Buông dao thành Phật',
    text: () => 'Đêm ấy bạn mơ thấy những kẻ đã chết dưới tay mình đứng kín sân. Sáng ra, có tiếng chuông chùa vọng tới mà quanh đây trăm dặm không có chùa nào.',
    choices: () => [
      {
        label: 'Đi theo tiếng chuông',
        hint: `${cost('phat')} · tâm ma giảm thay vì tăng`,
        lean: 'chinh',
        run: (c, ctx) => {
          const r = switchPath(c, ev('cd_phat_buong_dao'), ctx, { tamMa: -10 });
          dao(c, 15);
          return `Bạn quỳ trước một ngôi chùa đổ nát, tự tay cắt tóc. ${r} Đêm đó không còn mơ thấy ai nữa.`;
        },
      },
      stay('Bạn bịt tai lại. Tiếng chuông vẫn vang tới tận trưa.', 0.1),
    ],
  },
  {
    id: 'cd_ma_huyet_thu',
    minRealm: 2,
    once: true,
    weight: 1.4,
    when: (c) => canSwitch(c, 'ma') && c.daoTam <= 20,
    title: 'Huyết thư dưới đáy giếng',
    text: () => 'Cái giếng cạn sau làng đêm đêm vẫn có tiếng nước. Bạn thả dây xuống, dưới đáy là một cuốn sách viết bằng máu, chữ vẫn còn ướt.',
    choices: () => [
      {
        label: 'Đọc hết cuốn huyết thư',
        hint: `${cost('ma')} · đạo tâm thêm tà`,
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -10);
          return `Chữ máu bò lên tay bạn, chui vào kinh mạch. ${switchPath(c, ev('cd_ma_huyet_thu'), ctx, { tamMa: 20 })} Từ đó giếng không còn tiếng nước.`;
        },
      },
      {
        label: 'Đốt cuốn sách',
        lean: 'chinh',
        run: (c) => {
          dao(c, 6);
          stat(c, 'tamMa', -5);
          return 'Sách cháy ra khói đỏ, có tiếng ai đó hét lên dưới đáy giếng rồi im bặt.';
        },
      },
    ],
  },
  {
    id: 'cd_ma_tam_ma',
    minRealm: 3,
    once: true,
    weight: 3,
    when: (c) => canSwitch(c, 'ma') && c.stats.tamMa >= 45,
    title: 'Tâm ma mở cửa',
    text: () => 'Lúc bế quan, tâm ma không gào thét như mọi khi. Nó ngồi xuống trước mặt bạn, giọng rất hiền: "Đừng chống lại ta nữa. Để ta dẫn đường, ngươi sẽ đi xa hơn."',
    choices: () => [
      {
        label: 'Mở cửa cho tâm ma',
        hint: `${cost('ma')} · tâm ma giảm vì đã hòa làm một`,
        lean: 'ta',
        run: (c, ctx) => {
          const r = switchPath(c, ev('cd_ma_tam_ma'), ctx, { tamMa: -25 });
          dao(c, -15);
          return `Bạn và tâm ma hòa làm một. ${r} Đầu óc chưa bao giờ nhẹ như vậy.`;
        },
      },
      {
        label: 'Trấn áp nó một lần nữa',
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamMa', -8);
          stat(c, 'sucKhoe', -8);
          return 'Bạn nghiến răng niệm chú suốt ba ngày. Tâm ma lui vào bóng tối, để lại một câu: "Ta sẽ chờ."';
        },
      },
    ],
  },
  {
    id: 'cd_yeu_huyet_mach',
    minRealm: 2,
    once: true,
    weight: 1.4,
    when: (c) => canSwitch(c, 'yeu'),
    title: 'Huyết mạch thức tỉnh',
    text: (c) => (c.race === 'yeu' ? 'Đêm trăng tròn, cái đuôi bạn giấu bao năm bỗng ngứa ran. Máu yêu tộc trong người sôi lên, đòi được trở về.' : 'Một con yêu thú hấp hối gục dưới chân bạn, máu nó bắn lên môi. Vị máu ngọt lạ, toàn thân nóng ran như có lửa.'),
    choices: (c) => [
      {
        label: c.race === 'yeu' ? 'Thả cho huyết mạch thức tỉnh' : 'Nuốt luôn ngụm máu',
        hint: cost('yeu'),
        lean: 'trung',
        run: (ch, ctx) => `Xương cốt kêu răng rắc, mắt bạn đổi màu. ${switchPath(ch, ev('cd_yeu_huyet_mach'), ctx)}`,
      },
      stay(c.race === 'yeu' ? 'Bạn ngâm mình dưới suối lạnh tới sáng, giữ lại hình người.' : 'Bạn nhổ ra, súc miệng bằng rượu mạnh. Đêm đó sốt cao rồi khỏi.', 0.1),
    ],
  },
];
