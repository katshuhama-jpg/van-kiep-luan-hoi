import { addCult, dao, fatal, reward, stat } from './helpers';
import type { Character, EffectCtx, GameEvent } from './types';
import { tr } from '../i18n';

/**
 * 10 kết cục hiếm ở ba cõi (bản 2.0.0). Mỗi kết cục đi kèm một sự kiện ít gặp,
 * phần lớn chỉ xuất hiện ở cảnh giới cao, một lần mỗi kiếp. Cố ý khó gặp.
 */

/** Duyên phận định sẵn mỗi kiếp: chỉ một phần kiếp có duyên gặp sự kiện này (cố định theo kiếp, không đổi khi tải lại) */
function fated(c: Character, id: string, p: number): boolean {
  let h = 2166136261 ^ ((c.lookSeed ?? 0) * 31 + c.lifeNo);
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000 < p;
}

/** Kết thúc kiếp bằng một lựa chọn: không phải cái chết thường, mà là một kết cục */
function endWith(c: Character, ctx: EffectCtx, tag: string, cause: string, fx: string) {
  c.dead = true;
  c.endTag = tag;
  c.cause = cause;
  ctx.fx('breakthrough', fx);
}

/** Hiểm cảnh có thể chết; nếu chết thì gắn kết cục riêng */
function risk(c: Character, ctx: EffectCtx, chance: number, tag: string, cause: string): string | null {
  const d = fatal(c, ctx, chance, cause);
  if (c.dead) c.endTag = tag;
  return d;
}

/** tỉ lệ kiếp có duyên với mỗi sự kiện kết cục */
const FATE = 0.3;

export const COSMOS_END_EVENTS: GameEvent[] = [
  // ---------------- Tiên giới ----------------
  {
    id: 'end_thien_ha',
    cosmos: 'tien',
    once: true,
    weight: 1,
    when: (c) => fated(c, 'end_thien_ha', FATE) && !!c.partner,
    title: tr('Thiên Hà cách trở', "Parted by the Heavenly River"),
    text: (c) =>
      tr(`Đêm thất tịch, bạn đứng bên bờ Thiên Hà nhìn xuống nhân gian. Bóng ${c.partner} vẫn ở đó, tóc đã bạc. Tiên thọ vạn năm, người phàm chỉ còn vài mùa xuân. Tiên quy cấm tiên nhân hạ phàm.`, `On the Qixi night, you stand on the bank of the Heavenly River gazing down at the mortal world. ${c.partner}'s figure is still there, hair gone white. An immortal lives ten thousand years; a mortal has only a few springs left. Immortal law forbids immortals from descending.`),
    choices: (c) => [
      {
        label: tr('Bỏ tiên tịch, hạ phàm sống nốt đời cùng người ấy', "Renounce immortality and descend to live out their life with them"),
        hint: tr('kết thúc kiếp · kết cục hiếm', "ends this life · rare ending"),
        lean: 'chinh',
        run: (ch, ctx) => {
          endWith(ch, ctx, 'ha_pham', tr(`Bỏ tiên tịch, hạ phàm sống trọn kiếp người cùng ${c.partner}`, `Renounced immortal status and descended to live a full mortal life with ${c.partner}`), tr('HẠ PHÀM', "DESCENT"));
          return tr(`Bạn tự xóa tên khỏi tiên tịch, rơi xuống nhân gian như một ngôi sao. Mấy mùa xuân còn lại, bạn cùng ${c.partner} ngồi trước hiên nhà, nhìn Thiên Hà mà cười. Không có tiên nào sống vui hơn thế.`, `You strike your own name from the immortal registry and fall to the mortal world like a star. For the springs that remain, you and ${c.partner} sit on the porch, gazing at the Heavenly River and smiling. No immortal ever lived happier.`);
        },
      },
      {
        label: tr('Gửi một giấc mộng đẹp xuống cho người ấy', "Send them a sweet dream"),
        hint: tr('tâm cảnh +, tâm ma -', "Mind +, heart demon -"),
        lean: 'chinh',
        run: (ch) => {
          stat(ch, 'tamCanh', 10);
          stat(ch, 'tamMa', -10);
          return tr('Đêm ấy người dưới trần mơ thấy bạn. Sáng ra, người ấy mỉm cười kể cho con cháu nghe về một vị tiên quen.', "That night the one below dreams of you. In the morning they smile and tell their grandchildren about an immortal they once knew.");
        },
      },
      {
        label: tr('Quay lưng, tiên phàm đã khác đường', "Turn away, immortals and mortals walk different roads"),
        hint: tr('tu vi +, đạo tâm -', "cultivation +, Dao Heart -"),
        lean: 'ta',
        run: (ch) => {
          dao(ch, -6);
          addCult(ch, reward(ch, 1));
          return tr('Bạn quay đi, dồn hết tâm trí vào tu luyện. Tu vi tăng nhanh, nhưng đêm nào cũng nghe tiếng sông Thiên Hà chảy.', "You turn away and pour your whole mind into cultivation. Your cultivation soars, but every night you hear the Heavenly River flowing.");
        },
      },
    ],
  },
  {
    id: 'end_thu_mon',
    cosmos: 'tien',
    once: true,
    minRealm: 9,
    weight: 1,
    when: (c) => fated(c, 'end_thu_mon', FATE),
    title: tr('Ma quân phá Nam Thiên Môn', "Demon army breaches the Southern Heavenly Gate"),
    text: () => tr('Trống trận dồn dập. Mười vạn ma quân tràn tới Nam Thiên Môn, thiên binh tan tác. Chỉ còn bạn đứng trước cổng.', "War drums pound. A hundred thousand demon soldiers flood toward the Southern Heavenly Gate, and the heavenly soldiers scatter. Only you remain standing before the gate."),
    choices: () => [
      {
        label: tr('Một mình giữ cổng tới hơi thở cuối', "Hold the gate alone to your last breath"),
        hint: tr('tu vi ++, rất nguy hiểm', "cultivation ++, very dangerous"),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 10);
          const d = risk(c, ctx, 0.5, 'thu_mon', tr('Một mình giữ Nam Thiên Môn trước mười vạn ma quân, đứng chết mà không lùi một bước', "Held the Southern Heavenly Gate alone against a hundred thousand demon soldiers, and died standing without yielding a step"));
          if (d) return tr('Bạn chém tới khi kiếm gãy, rồi đứng chết giữa cổng trời. Ma quân không dám bước qua xác bạn.', "You cut until your sword breaks, then die standing in the gate of heaven. The demon army dares not step over your corpse.") + d;
          addCult(c, reward(c, 2.5));
          return tr('Ba ngày ba đêm, ma quân không qua được cổng. Viện binh tới, thấy bạn vẫn đứng, áo đẫm máu. Thiên Đình ghi công lớn.', "For three days and three nights the demon army cannot pass the gate. When reinforcements arrive, they find you still standing, robes soaked in blood. The Heavenly Court records a great merit.");
        },
      },
      {
        label: tr('Rút về Lăng Tiêu Điện cầu viện', "Fall back to Lingxiao Hall for reinforcements"),
        hint: tr('an toàn', "safe"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamMa', 6);
          return tr('Bạn rút lui. Nam Thiên Môn thất thủ một đêm rồi được chiếm lại. Không ai trách, nhưng bạn tự trách.', "You retreat. The Southern Heavenly Gate falls for one night and is retaken. No one blames you, but you blame yourself.");
        },
      },
    ],
  },
  {
    id: 'end_thien_thu',
    cosmos: 'tien',
    once: true,
    minRealm: 10,
    weight: 1,
    when: (c) => fated(c, 'end_thien_thu', FATE),
    title: tr('Tàng Kinh Các của Văn Khúc', "Wenqu's Scripture Pavilion"),
    text: () =>
      tr('Văn Khúc Tinh Quân dẫn bạn vào một tòa lầu không đáy, sách chất cao tận mây. "Mọi đạo pháp đều nằm ở đây, chỉ thiếu một người chép nốt trang cuối. Kẻ chép xong sẽ hóa vào sách mà sống mãi."', "Star Lord Wenqu leads you into a bottomless tower, its books stacked up to the clouds. \"Every Dao art lies here. All that's missing is someone to copy the final page. Whoever finishes it will become part of the book and live forever.\""),
    choices: () => [
      {
        label: tr('Cầm bút, chép trang cuối của thiên thư', "Take up the brush and copy the Heavenly Tome's final page"),
        hint: tr('kết thúc kiếp · kết cục hiếm', "ends this life · rare ending"),
        lean: 'trung',
        run: (c, ctx) => {
          endWith(c, ctx, 'hoa_chu', tr('Chép trang cuối của thiên thư, hóa thành chữ trong sách mà sống mãi', "Copied the Heavenly Tome's final page and became words in the book, living forever"), tr('HÓA CHỮ', "BECOME WORDS"));
          return tr('Ngòi bút chạm giấy, tay bạn hóa thành mực, rồi cả người hóa thành từng nét chữ. Từ nay ai mở thiên thư đều đọc được bạn.', "The brush touches paper and your hand turns to ink, then your whole body into strokes of writing. From now on, whoever opens the Heavenly Tome reads you.");
        },
      },
      {
        label: tr('Chỉ đọc vài trang rồi đi', "Just read a few pages and leave"),
        hint: tr('ngộ tính +', "Insight +"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'ngoTinh', 12);
          return tr('Bạn đọc ba trang, ngộ ra ba đạo lý. Ra khỏi lầu mới biết ở nhân gian đã qua ba trăm năm.', "You read three pages and grasp three truths. Only on leaving the tower do you learn that three hundred years have passed in the mortal world.");
        },
      },
    ],
  },
  {
    id: 'end_thien_de',
    cosmos: 'tien',
    once: true,
    minRealm: 11,
    weight: 1,
    when: (c) => fated(c, 'end_thien_de', FATE) && c.daoTam >= 40,
    title: tr('Ngai vàng Lăng Tiêu Điện', "The throne of Lingxiao Hall"),
    text: () =>
      tr('Thiên Đế cũ đã tọa hóa. Chúng tiên quỳ trước bạn: "Ba giới không thể một ngày không có chủ." Nhưng ai ngồi lên ngai vàng ấy, sẽ không bao giờ được rời Lăng Tiêu Điện nữa.', "The old Heavenly Emperor has passed away in meditation. The immortals kneel before you: \"The Three Realms cannot go a single day without a ruler.\" But whoever sits on that throne may never leave Lingxiao Hall again."),
    choices: () => [
      {
        label: tr('Ngồi lên ngai, gánh ba giới trên vai', "Take the throne and bear the Three Realms on your shoulders"),
        hint: tr('kết thúc kiếp · kết cục hiếm', "ends this life · rare ending"),
        lean: 'chinh',
        run: (c, ctx) => {
          endWith(c, ctx, 'thien_de', tr('Lên ngôi Thiên Đế, vĩnh viễn ngồi trên ngai Lăng Tiêu Điện', "Ascended as Heavenly Emperor, seated forever on the throne of Lingxiao Hall"), tr('THIÊN ĐẾ', "HEAVENLY EMPEROR"));
          return tr('Bạn ngồi xuống. Mây ngũ sắc kéo về, ba giới cùng cúi đầu. Từ đó trở đi, bạn nhìn thấy mọi thứ, mà không bao giờ được chạm vào thứ gì nữa.', "You sit. Five-colored clouds gather and the Three Realms bow as one. From then on you see everything, and may never touch anything again.");
        },
      },
      {
        label: tr('Từ chối, tiên đạo không ở trên ngai', "Refuse, the immortal Dao does not lie on a throne"),
        hint: tr('tâm cảnh +, khí vận +', "Mind +, Luck +"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 12);
          stat(c, 'khiVan', 10);
          return tr('Bạn cúi chào rồi bỏ đi. Chúng tiên xôn xao, nhưng mấy vị lão tiên lại gật gù.', "You bow and walk away. The immortals murmur in uproar, but a few old immortals nod in approval.");
        },
      },
    ],
  },
  // ---------------- Ma giới ----------------
  {
    id: 'end_huyet_hai',
    cosmos: 'ma',
    once: true,
    minRealm: 10,
    weight: 1,
    when: (c) => fated(c, 'end_huyet_hai', FATE),
    title: tr('Trái tim Huyết Hải', "Heart of the Blood Sea"),
    text: () =>
      tr('Giữa Huyết Hải có một trái tim đỏ thẫm vẫn đập, là tàn hồn của Ma Tổ. Ai nuốt được nó sẽ thành chính Huyết Hải: bất tử, nhưng không còn là mình.', "In the middle of the Blood Sea a crimson heart still beats: the remnant soul of the Demon Ancestor. Whoever swallows it becomes the Blood Sea itself: immortal, but no longer themselves."),
    choices: () => [
      {
        label: tr('Nuốt trái tim, hóa thân vào Huyết Hải', "Swallow the heart and merge with the Blood Sea"),
        hint: tr('kết thúc kiếp · kết cục hiếm', "ends this life · rare ending"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -20);
          endWith(c, ctx, 'hoa_huyet_hai', tr('Nuốt trái tim Ma Tổ, hóa thân thành Huyết Hải vô tận', "Swallowed the Demon Ancestor's heart and became the endless Blood Sea"), tr('HÓA HUYẾT HẢI', "BLOOD SEA"));
          return tr('Bạn tan ra, chảy vào từng con sóng đỏ. Huyết Hải dâng cao ba trượng. Từ đó, ma tu nào chết ở Ma giới cũng chảy về bạn.', "You dissolve and flow into every crimson wave. The Blood Sea rises thirty feet. From then on, every demonic cultivator who dies in the Demon Realm flows back to you.");
        },
      },
      {
        label: tr('Rút một giọt máu tim, luyện vào ma thể', "Draw one drop of heart's blood and refine it into your demonic body"),
        hint: tr('tu vi ++, tâm ma ++', "cultivation ++, heart demon ++"),
        lean: 'ta',
        run: (c) => {
          addCult(c, reward(c, 2));
          stat(c, 'tamMa', 18);
          return tr('Một giọt thôi mà ma thể nóng như lửa. Đêm đêm bạn nghe thấy tiếng tim đập không phải của mình.', "Just one drop, and your demonic body burns like fire. Night after night you hear a heartbeat that isn't yours.");
        },
      },
      {
        label: tr('Bỏ đi, thứ này không nên đụng vào', "Leave it, this thing should not be touched"),
        hint: tr('an toàn', "safe"),
        lean: 'trung',
        run: () => tr('Bạn quay lưng. Sau lưng, trái tim đập chậm lại, như thất vọng.', "You turn your back. Behind you the heart slows, as if disappointed."),
      },
    ],
  },
  {
    id: 'end_buong_dao',
    cosmos: 'ma',
    once: true,
    weight: 1,
    when: (c) => fated(c, 'end_buong_dao', FATE) && c.daoTam >= 0,
    title: tr('Tiếng chuông chùa ở Ma giới', "Temple bells in the Demon Realm"),
    text: () =>
      tr('Ở nơi chỉ có máu và lửa, bạn bỗng nghe tiếng chuông chùa. Một lão tăng ngồi giữa đống xương, tay lần tràng hạt: "Ma đầu mà còn nghe được tiếng này, là vẫn còn đường về."', "In a place of nothing but blood and fire, you suddenly hear a temple bell. An old monk sits amid a pile of bones, telling his prayer beads: \"A demon lord who can still hear this sound still has a way back.\""),
    choices: () => [
      {
        label: tr('Buông đồ đao, quy y dưới chân lão tăng', "Lay down the butcher's blade and take refuge at the old monk's feet"),
        hint: tr('kết thúc kiếp · kết cục hiếm', "ends this life · rare ending"),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 30);
          endWith(c, ctx, 'buong_dao', tr('Buông đồ đao giữa Ma giới, quy y thành Phật', "Laid down the butcher's blade in the Demon Realm and became a Buddha"), tr('BUÔNG ĐAO', "LAY DOWN THE BLADE"));
          return tr('Ma đao rơi xuống, vỡ thành tro. Bạn ngồi xuống bên lão tăng, tụng kinh tới khi ma khí trong người tan hết. Ma giới mất một ma đầu, thế gian thêm một vị Phật.', "The demon blade falls and crumbles to ash. You sit beside the old monk and chant sutras until every trace of demonic qi in you is gone. The Demon Realm loses a demon lord; the world gains a Buddha.");
        },
      },
      {
        label: tr('Nghe hết một hồi chuông rồi đi', "Hear out one round of the bell, then leave"),
        hint: tr('tâm ma --', "heart demon --"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamMa', -20);
          return tr('Bạn nghe hết một hồi chuông, lòng nhẹ đi. Lúc quay lại, lão tăng đã không còn ở đó.', "You listen to a full round of the bell and your heart grows lighter. When you turn back, the old monk is gone.");
        },
      },
      {
        label: tr('Giết lão tăng, ở Ma giới không có chỗ cho Phật', "Kill the old monk, the Demon Realm has no place for Buddhas"),
        hint: tr('đạo tâm --', "Dao Heart --"),
        lean: 'ta',
        run: (c) => {
          dao(c, -25);
          addCult(c, reward(c, 1));
          return tr('Lão tăng không chống cự, chỉ cười. Tiếng chuông tắt, nhưng thỉnh thoảng bạn vẫn nghe thấy nó trong mơ.', "The old monk does not resist, only smiles. The bell falls silent, but now and then you still hear it in your dreams.");
        },
      },
    ],
  },
  {
    id: 'end_tam_phuc',
    cosmos: 'ma',
    once: true,
    minRealm: 9,
    weight: 1,
    when: (c) => fated(c, 'end_tam_phuc', FATE),
    title: tr('Tâm phúc', "Trusted right hand"),
    text: () =>
      tr('Tả hộ pháp theo bạn từ ngày mới vào Ma giới, chưa từng phản. Đêm nay hắn dâng chén rượu mừng thọ, tay hơi run. Mùi rượu có gì đó lạ.', "Your Left Guardian has followed you since your first day in the Demon Realm and never betrayed you. Tonight he offers a cup of wine for your birthday, his hand trembling slightly. The wine smells a little off."),
    choices: () => [
      {
        label: tr('Uống cạn, tin hắn thêm lần nữa', "Drain it, trust him once more"),
        hint: tr('đánh cược tính mạng', "bet your life"),
        lean: 'chinh',
        run: (c, ctx) => {
          const d = risk(c, ctx, 0.45, 'tam_phuc', tr('Uống chén rượu độc của tâm phúc, chết trên ngai Ma giới', "Drank the poisoned wine of a trusted right hand and died on the Demon Realm's throne"));
          if (d) return tr('Rượu xuống tới bụng thì ma hồn bốc cháy. Hắn quỳ xuống khóc: "Chủ thượng, Ma giới chỉ có một luật."', "The wine barely reaches your belly before your demon soul catches fire. He kneels and weeps: \"My lord, the Demon Realm has only one law.\"") + d;
          stat(c, 'khiVan', 12);
          return tr('Bạn uống cạn. Hắn quỳ xuống khóc, thú nhận rượu có độc nhưng hắn đã đổi chén. Từ đó hắn theo bạn tới chết.', "You drain the cup. He kneels and weeps, confessing the wine was poisoned but he swapped the cups. From then on he follows you to the death.");
        },
      },
      {
        label: tr('Hất chén rượu, giết hắn trước', "Dash the cup away and kill him first"),
        hint: tr('đạo tâm -, an toàn', "Dao Heart -, safe"),
        lean: 'ta',
        run: (c) => {
          dao(c, -10);
          stat(c, 'tamMa', 8);
          return tr('Bạn giết hắn trước khi hắn kịp nói. Rượu đổ xuống nền đá, không sủi bọt. Có lẽ nó không có độc.', "You kill him before he can speak. The wine spills on the stone floor without a single fizz. Perhaps it was never poisoned.");
        },
      },
    ],
  },
  // ---------------- Thái Hư ----------------
  {
    id: 'end_doi_ten',
    cosmos: 'hu',
    once: true,
    weight: 1,
    when: (c) => fated(c, 'end_doi_ten', FATE),
    title: tr('Kẻ mua tên', "The name buyer"),
    text: () =>
      tr('Một bóng người không mặt chặn đường: "Ở Thái Hư, tên là gánh nặng. Bán tên cho ta, ta trả ngươi trăm năm tu vi. Chỉ là từ nay không ai nhớ ngươi là ai, kể cả ngươi."', "A faceless figure blocks your path: \"In the Great Void, a name is a burden. Sell me yours and I'll pay you a hundred years of cultivation. Only, from then on no one will remember who you are, not even you.\""),
    choices: () => [
      {
        label: tr('Bán tên lấy đạo', "Sell your name for the Dao"),
        hint: tr('tu vi +++, khi chết thành kẻ vô danh', "cultivation +++, die a nameless one"),
        lean: 'ta',
        run: (c) => {
          c.qf = { ...(c.qf ?? {}), voDanh: 1 };
          addCult(c, reward(c, 4));
          return tr('Hắn lấy đi tên bạn như rút một sợi chỉ. Tu vi tăng vọt. Bạn mở miệng định nói mình là ai, rồi ngập ngừng.', "He pulls your name out like a single thread. Your cultivation surges. You open your mouth to say who you are, then hesitate.");
        },
      },
      {
        label: tr('Giữ tên, không bán', "Keep your name, don't sell"),
        hint: tr('tâm cảnh +', "Mind +"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 8);
          return tr('Bạn đọc to tên mình ba lần. Bóng người tan đi như khói.', "You say your name aloud three times. The figure dissipates like smoke.");
        },
      },
    ],
  },
  {
    id: 'end_tuoi_tho',
    cosmos: 'hu',
    once: true,
    minRealm: 9,
    weight: 1,
    when: (c) => fated(c, 'end_tuoi_tho', FATE),
    title: tr('Khe nứt về thuở nhỏ', "A rift back to childhood"),
    text: () =>
      tr('Qua một khe nứt thời gian, bạn thấy chính mình lúc bảy tuổi đang chơi trước sân nhà, mẹ gọi vào ăn cơm. Khe nứt đủ rộng để bước qua. Bước qua rồi thì không quay lại được.', "Through a rift in time you see yourself at seven, playing in the front yard while your mother calls you in for dinner. The rift is wide enough to step through. Once through, there is no coming back."),
    choices: () => [
      {
        label: tr('Bước qua, làm lại đứa trẻ ấy', "Step through and be that child again"),
        hint: tr('kết thúc kiếp · kết cục hiếm', "ends this life · rare ending"),
        lean: 'trung',
        run: (c, ctx) => {
          endWith(c, ctx, 've_tuoi_tho', tr('Bước qua khe nứt thời gian, trở về làm đứa trẻ bảy tuổi trước sân nhà', "Stepped through a rift in time and returned to being a seven-year-old in the front yard"), tr('VỀ TUỔI THƠ', "BACK TO CHILDHOOD"));
          return tr('Bạn bước qua. Tu vi, thần thông, vạn năm ký ức rơi rụng từng thứ một. Khi mẹ gọi lần nữa, bạn chạy vào nhà, không còn nhớ mình từng là ai. Lần này, bạn không đi tu tiên.', "You step through. Cultivation, divine powers, ten thousand years of memory fall away one by one. When your mother calls again, you run inside, no longer remembering who you once were. This time, you don't take up cultivation.");
        },
      },
      {
        label: tr('Đứng nhìn một lúc rồi đi tiếp', "Watch a while, then move on"),
        hint: tr('tâm cảnh ++', "Mind ++"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 15);
          return tr('Bạn đứng nhìn tới khi đứa trẻ ăn xong bữa cơm. Rồi khe nứt khép lại.', "You watch until the child finishes dinner. Then the rift closes.");
        },
      },
    ],
  },
  {
    id: 'end_hoang_luong',
    cosmos: 'hu',
    once: true,
    minRealm: 10,
    weight: 1,
    when: (c) => fated(c, 'end_hoang_luong', FATE),
    title: tr('Mùi kê chín', "The smell of cooked millet"),
    text: () =>
      tr('Giữa hư không, bạn bỗng ngửi thấy mùi kê đang nấu. Một lão đạo sĩ ngồi bên bếp lửa, cười: "Ngươi ngủ lâu quá rồi. Nồi kê sắp chín, có muốn tỉnh dậy không?"', "In the middle of the void you suddenly smell millet cooking. An old Daoist sits by a cooking fire and smiles: \"You've slept too long. The millet is nearly done. Care to wake up?\""),
    choices: () => [
      {
        label: tr('Tỉnh dậy', "Wake up"),
        hint: tr('kết thúc kiếp · kết cục hiếm', "ends this life · rare ending"),
        lean: 'trung',
        run: (c, ctx) => {
          endWith(c, ctx, 'hoang_luong', tr('Tỉnh dậy bên nồi kê chưa chín, cả đời tu tiên chỉ là một giấc mộng', "Woke beside a pot of millet not yet cooked; a whole life of cultivation was only a dream"), tr('TỈNH MỘNG', "AWAKENING"));
          return tr('Bạn mở mắt trong một quán trọ ven đường. Nồi kê vẫn chưa chín. Phi thăng, ba cõi, vạn năm tu luyện, tất cả chỉ là một giấc ngủ trưa. Bạn ngồi dậy, thấy lòng nhẹ tênh.', "You open your eyes in a roadside inn. The millet still isn't done. Ascension, the Three Realms, ten thousand years of cultivation, all of it just an afternoon nap. You sit up, your heart light as a feather.");
        },
      },
      {
        label: tr('Ngủ tiếp, giấc mộng này còn hay', "Keep sleeping, this dream is still good"),
        hint: tr('khí vận +', "Luck +"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'khiVan', 10);
          return tr('Lão đạo sĩ lắc đầu, đậy nắp nồi lại. Bạn quay về hư không, không chắc đâu là thật nữa.', "The old Daoist shakes his head and puts the lid back on the pot. You return to the void, no longer sure what is real.");
        },
      },
    ],
  },
];
