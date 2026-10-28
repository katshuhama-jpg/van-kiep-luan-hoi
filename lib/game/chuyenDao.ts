import { ITEMS, PATHS } from './data';
import { addCult, addPill, dao, giveItem, luck, reward, stat } from './helpers';
import type { Character, Choice, EffectCtx, GameEvent, PathId, Slot } from './types';
import { tr } from '../i18n';

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
  { id: 'cd_kiem_trung', to: 'kiem', name: tr('Kiếm trủng gọi tên', "The Sword Tomb calls your name"), hint: tr('Có nơi chôn vạn thanh kiếm, kiếm cũng biết chọn chủ.', "There is a place where ten thousand swords lie buried, and swords too choose their masters.") },
  { id: 'cd_kiem_mu', to: 'kiem', name: tr('Kiếm khách mù trên cầu', "The blind swordsman on the bridge"), hint: tr('Người không thấy đường lại thấy rõ đường kiếm.', "A man who cannot see the road sees the way of the sword clearly.") },
  { id: 'cd_dan_lo', to: 'dan', name: tr('Lò đan bỏ hoang', "The abandoned furnace"), hint: tr('Lửa trong lò đã tắt trăm năm mà tro vẫn còn ấm.', "The furnace fire died a hundred years ago, yet the ashes are still warm.") },
  { id: 'cd_dan_duoc_vuong', to: 'dan', name: tr('Dược Vương trăng trối', "The Medicine King's last words"), hint: tr('Người chữa cả đời cho thiên hạ, cuối cùng không chữa được cho mình.', "He healed the world all his life, but in the end could not heal himself.") },
  { id: 'cd_tran_co', to: 'tran', name: tr('Bàn cờ trong núi', "The Go board in the mountain"), hint: tr('Một ván cờ dang dở, đi sai một nước là kẹt lại trong núi.', "An unfinished game - one wrong move and you are trapped in the mountain.") },
  { id: 'cd_tran_tinh_do', to: 'tran', name: tr('Thiên cơ tinh đồ', "Star chart of heavenly secrets"), hint: tr('Đêm không trăng, sao trên trời xếp thành một trận đồ.', "On a moonless night, the stars arrange themselves into a formation.") },
  { id: 'cd_phat_buong_dao', to: 'phat', name: tr('Buông dao thành Phật', "Lay down the blade, become a Buddha"), hint: tr('Tay dính máu càng nhiều, tiếng chuông càng nghe rõ.', "The more blood on your hands, the clearer the bell rings.") },
  { id: 'cd_ma_huyet_thu', to: 'ma', name: tr('Huyết thư dưới đáy giếng', "Blood letter at the bottom of the well"), hint: tr('Có cái giếng cạn mà đêm đêm vẫn nghe tiếng nước.', "There is a dry well that still echoes with water every night.") },
  { id: 'cd_ma_tam_ma', to: 'ma', name: tr('Tâm ma mở cửa', "The heart demon opens the door"), hint: tr('Khi tâm ma đủ lớn, nó không còn muốn giết bạn nữa.', "When a heart demon grows large enough, it no longer wants to kill you.") },
  { id: 'cd_yeu_huyet_mach', to: 'yeu', name: tr('Huyết mạch thức tỉnh', "Bloodline awakening"), hint: tr('Uống nhầm máu một con yêu thú sắp chết.', "You drank the blood of a dying demon beast by mistake.") },
];

export const chuyenDaoOf = (id: string | undefined) => CHUYEN_DAO.find((x) => x.id === id);

/** Có thể gặp kỳ ngộ chuyển đạo sang con đường `to` không */
const canSwitch = (c: Character, to: PathId) => !!c.path && c.path !== to && !c.daoSwitch && c.realm >= 2 && !c.cosmos;

/** Đổi con đường: trả giá rồi nhận ưu đãi nhỏ của con đường mới */
export function switchPath(c: Character, cd: ChuyenDao, ctx: EffectCtx, opts: { tamMa?: number } = {}): string {
  const from = c.path ? PATHS[c.path].name : tr('tán tu', "rogue cultivator");
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
  c.miles = [...(c.miles ?? []), { age: Math.floor(c.age), kind: 'path', text: tr(`Tán công chuyển đạo: bỏ ${from}, theo ${PATHS[cd.to].name} (${cd.name})`, `Disperse and switch Paths: abandon ${from}, follow ${PATHS[cd.to].name} (${cd.name})`) }];
  ctx.fx('breakthrough', tr(`Chuyển đạo: ${PATHS[cd.to].name}`, `Path change: ${PATHS[cd.to].name}`));
  return tr(`Bạn tán đi công pháp ${from}, chuyển sang ${PATHS[cd.to].name} (-${lost} tu vi${off.length ? tr(`, tháo ${off.join(', ')}`, `, unequipped ${off.join(', ')}`) : ''}).`, `You disperse your ${from} technique and switch to ${PATHS[cd.to].name} (-${lost} cultivation${off.length ? tr(`, tháo ${off.join(', ')}`, `, unequipped ${off.join(', ')}`) : ''}).`);
}

const stay = (text: string, gain = 0.15): Choice => ({
  label: tr('Giữ con đường của mình', "Keep to your own Path"),
  lean: 'trung',
  run: (c) => {
    const exp = Math.round(reward(c, gain));
    addCult(c, exp);
    stat(c, 'tamCanh', 3);
    return tr(`${text} (+${exp} tu vi)`, `${text} (+${exp} cultivation)`);
  },
});

const cost = (to: PathId) => tr(`đổi sang ${PATHS[to].name} · mất 30% tu vi · tâm ma tăng · mỗi kiếp một lần`, `switch to ${PATHS[to].name} · lose 30% cultivation · heart demon rises · once per life`);
const ev = (id: string) => CHUYEN_DAO.find((x) => x.id === id)!;

export const CHUYEN_DAO_EVENTS: GameEvent[] = [
  {
    id: 'cd_kiem_trung',
    minRealm: 2,
    once: true,
    weight: 1.4,
    when: (c) => canSwitch(c, 'kiem'),
    title: tr('Kiếm trủng gọi tên', "The Sword Tomb calls your name"),
    text: () => tr('Đi ngang một thung lũng cắm đầy kiếm gãy, một thanh kiếm cổ bỗng rung lên rồi tự rút khỏi đất, bay tới lơ lửng trước mặt bạn. Chuôi kiếm khắc đúng tên bạn.', "Passing through a valley bristling with broken swords, an ancient blade suddenly trembles, pulls itself from the earth, and hovers before you. Your name is carved on its hilt."),
    choices: () => [
      {
        label: tr('Nắm lấy chuôi kiếm', "Grasp the hilt"),
        hint: cost('kiem'),
        lean: 'trung',
        run: (c, ctx) => tr(`${switchPath(c, ev('cd_kiem_trung'), ctx)} Kiếm ý tràn vào kinh mạch, công pháp cũ vỡ vụn. Từ nay bạn là Kiếm tu.`, `${switchPath(c, ev('cd_kiem_trung'), ctx)} Sword intent floods your meridians, shattering your old technique. From now on you are a Sword Cultivator.`),
      },
      stay(tr('Bạn cúi đầu cảm tạ, đặt thanh kiếm trở lại đất. Kiếm rung lên một tiếng như thở dài.', "You bow your thanks and set the sword back in the earth. It hums once, like a sigh.")),
    ],
  },
  {
    id: 'cd_kiem_mu',
    minRealm: 2,
    once: true,
    weight: 1.4,
    when: (c) => canSwitch(c, 'kiem'),
    title: tr('Kiếm khách mù trên cầu', "The blind swordsman on the bridge"),
    text: () => tr('Một lão già mù ngồi chặn giữa cầu, gậy trúc gác ngang đùi: "Ta nghe tiếng bước chân là biết ngươi đi sai đường. Đỡ được ba gậy, ta dạy ngươi đường kiếm."', "A blind old man sits blocking the bridge, a bamboo staff across his lap: \"I can tell from your footsteps you're on the wrong path. Block three strikes and I'll teach you the way of the sword.\""),
    choices: () => [
      {
        label: tr('Đỡ ba gậy', "Block three strikes"),
        hint: tr(`${cost('kiem')} · có thể bị thương`, `${cost('kiem')} · may get hurt`),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() >= luck(c, 0.6 + c.stats.ngoTinh / 400)) {
            stat(c, 'sucKhoe', -15);
            return tr('Gậy thứ hai đã quất trúng cổ tay bạn. Lão già lắc đầu bỏ đi, tiếng gậy gõ xa dần (-15 sức khỏe).', "The second strike catches your wrist. The old man shakes his head and leaves, the tap of his staff fading away (-15 Health).");
          }
          return tr(`Ba gậy, bạn đỡ trọn. Lão già cười: "Đường kiếm không ở mắt." ${switchPath(c, ev('cd_kiem_mu'), ctx)}`, `You block all three. The old man laughs: "The way of the sword is not in the eyes." ${switchPath(c, ev('cd_kiem_mu'), ctx)}`);
        },
      },
      stay(tr('Bạn vòng qua cầu khác. Sau lưng lão già hát một câu không rõ lời.', "You take another bridge. Behind you, the old man sings a line you can't make out.")),
    ],
  },
  {
    id: 'cd_dan_lo',
    minRealm: 2,
    once: true,
    weight: 1.4,
    when: (c) => canSwitch(c, 'dan'),
    title: tr('Lò đan bỏ hoang', "The abandoned furnace"),
    text: () => tr('Trong động đá có một lò đan đồng xanh phủ rêu. Lửa tắt đã trăm năm mà tro vẫn còn ấm. Dưới đáy lò ép một cuốn đan kinh viết dở.', "In a stone cave sits a moss-covered bronze furnace. Its fire died a century ago, yet the ashes are still warm. Pressed under it is a half-finished alchemy manual."),
    choices: () => [
      {
        label: tr('Nhóm lại lửa lò, học theo đan kinh', "Rekindle the furnace and follow the manual"),
        hint: cost('dan'),
        lean: 'trung',
        run: (c, ctx) => tr(`Lửa lò bùng lên xanh biếc như nhận ra chủ mới. ${switchPath(c, ev('cd_dan_lo'), ctx)} Mẻ đan đầu tiên ra lò thơm cả núi.`, `The furnace flares emerald green, as if recognising its new master. ${switchPath(c, ev('cd_dan_lo'), ctx)} Your first batch of pills perfumes the whole mountain.`),
      },
      stay(tr('Bạn lấy cuốn đan kinh làm gối đầu, đọc vài trang rồi ngủ thiếp đi.', "You use the alchemy manual as a pillow, read a few pages, and doze off."), 0.12),
    ],
  },
  {
    id: 'cd_dan_duoc_vuong',
    minRealm: 2,
    once: true,
    weight: 1.2,
    when: (c) => canSwitch(c, 'dan') && c.daoTam >= 0,
    title: tr('Dược Vương trăng trối', "The Medicine King's last words"),
    text: () => tr('Một ông lão nằm thoi thóp bên đường, tay vẫn nắm chặt giỏ thuốc. Ông nhận ra bạn: "Ta chữa cả đời cho người, không có ai nối nghề. Ngươi có muốn không?"', "An old man lies dying by the road, still clutching his herb basket. He recognises you: \"I healed people all my life and have no one to carry on. Will you?\""),
    choices: () => [
      {
        label: tr('Quỳ xuống nhận nghề', "Kneel and accept the craft"),
        hint: tr(`${cost('dan')} · đạo tâm thêm chính`, `${cost('dan')} · Dao Heart turns more righteous`),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 8);
          return tr(`Ông lão đặt giỏ thuốc vào tay bạn rồi nhắm mắt. ${switchPath(c, ev('cd_dan_duoc_vuong'), ctx, { tamMa: 8 })} Bạn chôn ông dưới gốc cây thuốc ông trồng.`, `The old man places the basket in your hands and closes his eyes. ${switchPath(c, ev('cd_dan_duoc_vuong'), ctx, { tamMa: 8 })} You bury him beneath the medicinal tree he planted.`);
        },
      },
      {
        label: tr('Ở lại chăm ông những ngày cuối', "Stay and care for him in his last days"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 6);
          addPill(c, 'tu_khi', 1);
          return tr('Bạn ở lại bảy ngày, ông đi thanh thản. Ông để lại cho bạn một viên đan tự tay luyện.', "You stay seven days, and he passes in peace. He leaves you a pill he refined himself.");
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
    title: tr('Bàn cờ trong núi', "The Go board in the mountain"),
    text: () => tr('Hai ông lão đánh cờ trên tảng đá giữa núi, một người đã hóa đá từ lâu. Người còn lại chỉ vào ghế trống: "Đi tiếp nước của y. Đi sai thì ở lại đây với ta."', "Two old men play Go on a boulder in the mountains, one long since turned to stone. The other points to the empty seat: \"Play his move. Get it wrong and you stay here with me.\""),
    choices: () => [
      {
        label: tr('Ngồi xuống đi tiếp ván cờ', "Sit down and continue the game"),
        hint: tr(`${cost('tran')} · đi sai mất mấy năm`, `${cost('tran')} · a wrong move costs years`),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() >= luck(c, 0.55 + c.stats.ngoTinh / 300)) {
            c.age += 5;
            return tr('Bạn đi sai một nước. Khi tỉnh lại, ông lão đã biến mất, râu bạn dài ra một gang. Năm năm đã trôi qua.', "You make a wrong move. When you come to, the old man is gone and your beard has grown a hand's length. Five years have passed.");
          }
          return tr(`Nước cờ của bạn mở ra một con đường giữa thế cờ chết. Ông lão gật đầu: "Trận cũng như cờ." ${switchPath(c, ev('cd_tran_co'), ctx)}`, `Your move opens a path through a dead position. The old man nods: "Formations are like Go." ${switchPath(c, ev('cd_tran_co'), ctx)}`);
        },
      },
      stay(tr('Bạn chắp tay xin kiếu. Ông lão không ngẩng lên, chỉ đặt thêm một quân cờ.', "You bow and take your leave. The old man doesn't look up, only places another stone.")),
    ],
  },
  {
    id: 'cd_tran_tinh_do',
    minRealm: 3,
    once: true,
    weight: 1.2,
    when: (c) => canSwitch(c, 'tran') && c.stats.ngoTinh >= 30,
    title: tr('Thiên cơ tinh đồ', "Star chart of heavenly secrets"),
    text: () => tr('Đêm không trăng, bạn nằm trên mái nhà và chợt thấy sao trời xếp thành một trận đồ khổng lồ, mỗi ngôi sao là một mắt trận. Nhìn thêm một chút nữa là hiểu.', "On a moonless night, lying on the roof, you suddenly see the stars form a vast formation, each star an eye of the array. Just a little longer and you'd understand it."),
    choices: () => [
      {
        label: tr('Thức trắng chép lại tinh đồ', "Stay up all night copying the star chart"),
        hint: cost('tran'),
        lean: 'trung',
        run: (c, ctx) => tr(`Gà gáy thì bạn chép xong. Công pháp cũ trong người tự tán đi như sương sớm. ${switchPath(c, ev('cd_tran_tinh_do'), ctx)}`, `By cockcrow you've finished. Your old technique dissolves like morning mist. ${switchPath(c, ev('cd_tran_tinh_do'), ctx)}`),
      },
      stay(tr('Bạn ngắm đến khi mây kéo tới. Trong lòng sáng ra được vài điều.', "You gaze until the clouds roll in. A few things become clear in your heart.")),
    ],
  },
  {
    id: 'cd_phat_buong_dao',
    minRealm: 2,
    once: true,
    weight: 3,
    when: (c) => canSwitch(c, 'phat') && (c.daoTam <= -10 || Object.values(c.kills ?? {}).reduce((a, b) => a + b, 0) >= 20),
    title: tr('Buông dao thành Phật', "Lay down the blade, become a Buddha"),
    text: () => tr('Đêm ấy bạn mơ thấy những kẻ đã chết dưới tay mình đứng kín sân. Sáng ra, có tiếng chuông chùa vọng tới mà quanh đây trăm dặm không có chùa nào.', "That night you dream the yard is packed with everyone who died by your hand. In the morning a temple bell rings out, though there's no temple within a hundred miles."),
    choices: () => [
      {
        label: tr('Đi theo tiếng chuông', "Follow the bell"),
        hint: tr(`${cost('phat')} · tâm ma giảm thay vì tăng`, `${cost('phat')} · heart demon falls instead of rising`),
        lean: 'chinh',
        run: (c, ctx) => {
          const r = switchPath(c, ev('cd_phat_buong_dao'), ctx, { tamMa: -10 });
          dao(c, 15);
          return tr(`Bạn quỳ trước một ngôi chùa đổ nát, tự tay cắt tóc. ${r} Đêm đó không còn mơ thấy ai nữa.`, `You kneel before a ruined temple and cut your own hair. ${r} That night, you dream of no one.`);
        },
      },
      stay(tr('Bạn bịt tai lại. Tiếng chuông vẫn vang tới tận trưa.', "You cover your ears. The bell keeps ringing until noon."), 0.1),
    ],
  },
  {
    id: 'cd_ma_huyet_thu',
    minRealm: 2,
    once: true,
    weight: 1.4,
    when: (c) => canSwitch(c, 'ma') && c.daoTam <= 20,
    title: tr('Huyết thư dưới đáy giếng', "Blood letter at the bottom of the well"),
    text: () => tr('Cái giếng cạn sau làng đêm đêm vẫn có tiếng nước. Bạn thả dây xuống, dưới đáy là một cuốn sách viết bằng máu, chữ vẫn còn ướt.', "The dry well behind the village echoes with water every night. You lower a rope - at the bottom lies a book written in blood, the ink still wet."),
    choices: () => [
      {
        label: tr('Đọc hết cuốn huyết thư', "Read the whole blood letter"),
        hint: tr(`${cost('ma')} · đạo tâm thêm tà`, `${cost('ma')} · Dao Heart turns more evil`),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -10);
          return tr(`Chữ máu bò lên tay bạn, chui vào kinh mạch. ${switchPath(c, ev('cd_ma_huyet_thu'), ctx, { tamMa: 20 })} Từ đó giếng không còn tiếng nước.`, `The blood characters crawl up your arm and into your meridians. ${switchPath(c, ev('cd_ma_huyet_thu'), ctx, { tamMa: 20 })} From then on, the well falls silent.`);
        },
      },
      {
        label: tr('Đốt cuốn sách', "Burn the book"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 6);
          stat(c, 'tamMa', -5);
          return tr('Sách cháy ra khói đỏ, có tiếng ai đó hét lên dưới đáy giếng rồi im bặt.', "It burns with red smoke. Someone screams at the bottom of the well, then falls silent.");
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
    title: tr('Tâm ma mở cửa', "The heart demon opens the door"),
    text: () => tr('Lúc bế quan, tâm ma không gào thét như mọi khi. Nó ngồi xuống trước mặt bạn, giọng rất hiền: "Đừng chống lại ta nữa. Để ta dẫn đường, ngươi sẽ đi xa hơn."', "In seclusion, your heart demon doesn't howl as usual. It sits before you and speaks gently: \"Stop fighting me. Let me lead, and you will go further.\""),
    choices: () => [
      {
        label: tr('Mở cửa cho tâm ma', "Open the door to your heart demon"),
        hint: tr(`${cost('ma')} · tâm ma giảm vì đã hòa làm một`, `${cost('ma')} · heart demon falls as you become one`),
        lean: 'ta',
        run: (c, ctx) => {
          const r = switchPath(c, ev('cd_ma_tam_ma'), ctx, { tamMa: -25 });
          dao(c, -15);
          return tr(`Bạn và tâm ma hòa làm một. ${r} Đầu óc chưa bao giờ nhẹ như vậy.`, `You and your heart demon become one. ${r} Your mind has never felt so light.`);
        },
      },
      {
        label: tr('Trấn áp nó một lần nữa', "Suppress it once more"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamMa', -8);
          stat(c, 'sucKhoe', -8);
          return tr('Bạn nghiến răng niệm chú suốt ba ngày. Tâm ma lui vào bóng tối, để lại một câu: "Ta sẽ chờ."', "You grit your teeth and chant for three days. The heart demon retreats into the dark, leaving one line: \"I will wait.\"");
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
    title: tr('Huyết mạch thức tỉnh', "Bloodline awakening"),
    text: (c) => (c.race === 'yeu' ? tr('Đêm trăng tròn, cái đuôi bạn giấu bao năm bỗng ngứa ran. Máu yêu tộc trong người sôi lên, đòi được trở về.', "On the night of the full moon, the tail you've hidden for years starts to tingle. The yao blood in you boils, demanding to return.") : tr('Một con yêu thú hấp hối gục dưới chân bạn, máu nó bắn lên môi. Vị máu ngọt lạ, toàn thân nóng ran như có lửa.', "A dying demon beast collapses at your feet, its blood spattering your lips. It tastes strangely sweet, and your whole body burns as if on fire.")),
    choices: (c) => [
      {
        label: c.race === 'yeu' ? tr('Thả cho huyết mạch thức tỉnh', "Let the bloodline awaken") : tr('Nuốt luôn ngụm máu', "Swallow the blood"),
        hint: cost('yeu'),
        lean: 'trung',
        run: (ch, ctx) => tr(`Xương cốt kêu răng rắc, mắt bạn đổi màu. ${switchPath(ch, ev('cd_yeu_huyet_mach'), ctx)}`, `Your bones crack and your eyes change colour. ${switchPath(ch, ev('cd_yeu_huyet_mach'), ctx)}`),
      },
      stay(c.race === 'yeu' ? tr('Bạn ngâm mình dưới suối lạnh tới sáng, giữ lại hình người.', "You soak in a cold spring until dawn, holding on to your human form.") : tr('Bạn nhổ ra, súc miệng bằng rượu mạnh. Đêm đó sốt cao rồi khỏi.', "You spit it out and rinse your mouth with strong liquor. That night you run a high fever, then recover."), 0.1),
    ],
  },
];
