import { addCult, addPill, dao, fatal, hurt, money, reward, stat } from './helpers';
import type { Character, EffectCtx, GameEvent } from './types';
import { tr } from '../i18n';

/** Thử vận: sống thì được thưởng, xui thì chết. Trả về câu kết. */
function gamble(c: Character, ctx: EffectCtx, chance: number, cause: string, lead: string, win: (c: Character, ctx: EffectCtx) => string): string {
  const f = fatal(c, ctx, chance, cause);
  if (c.dead) return lead + (f ?? '');
  return win(c, ctx) + (f ?? '');
}

/** 10 kịch bản có thể chết */
export const EVENTS3: GameEvent[] = [
  {
    id: 'nam_phat_sang',
    minAge: 6,
    once: true,
    weight: 6,
    title: tr('Nấm phát sáng', "Glowing mushroom"),
    text: () => tr('Trong hang sâu, bạn thấy một cây nấm tím phát ánh sáng xanh lam, tỏa mùi thơm ngọt khiến đầu óc lâng lâng.', "Deep in a cave you find a purple mushroom glowing blue, its sweet scent making your head swim."),
    choices: () => [
      {
        label: tr('Ăn sống luôn', "Eat it raw"),
        hint: tr('rất liều', "very risky"),
        lean: 'trung',
        run: (c, ctx) =>
          gamble(c, ctx, 0.3, tr('Bạn ăn phải nấm Quỷ Đăng. Đêm đó bạn cười không ngừng, rồi không bao giờ tỉnh lại.', "It was a Ghost Lantern mushroom. That night you laugh and laugh, and never wake up again."), tr('Vị ngọt lịm...', "So sweet..."), (ch, cx) => {
            addCult(ch, reward(ch, 2));
            stat(ch, 'ngoTinh', 10);
            cx.fx('breakthrough', tr('Linh chi', "Lingzhi"));
            return tr('Là Huyễn Linh Chi ngàn năm! Bạn thấy cả vũ trụ xoay vần trong đầu.', "A thousand-year Illusion Lingzhi! You feel the whole cosmos spinning inside your head.");
          }),
      },
      {
        label: tr('Cho chuột ăn thử trước', "Feed some to a rat first"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.5) {
            stat(c, 'ngoTinh', 5);
            addCult(c, reward(c, 1));
            return tr('Con chuột không sao, còn chạy nhanh hơn. Bạn yên tâm ăn phần còn lại.', "The rat is fine - it even runs faster. Reassured, you eat the rest.");
          }
          return tr('Con chuột co giật rồi chết. Bạn ném cây nấm đi, lạnh cả sống lưng.', "The rat twitches and dies. You toss the mushroom away, a chill running down your spine.");
        },
      },
      {
        label: tr('Hái về bán cho dược phường', "Pick it and sell it to the apothecary"),
        hint: tr('+linh thạch', "+spirit stones"),
        lean: 'trung',
        run: (c) => {
          money(c, 80);
          return tr('Lão dược sư trả 80 linh thạch, mắt không rời cây nấm.', "The old apothecary pays 80 spirit stones, never taking his eyes off the mushroom.");
        },
      },
      { label: tr('Bỏ đi', "Leave it"), lean: 'trung', run: () => tr('Thứ gì đẹp quá thường có độc. Bạn đi tiếp.', "Anything that pretty is usually poisonous. You move on.") },
    ],
  },
  {
    id: 'yeu_nu_dem',
    minAge: 16,
    maxAge: 70,
    once: true,
    weight: 6,
    title: tr('Mỹ nhân trong miếu hoang', "Beauty in the ruined temple"),
    text: (c) => tr(`Đêm mưa, bạn trú trong miếu hoang. Một ${c.gender === 'nam' ? tr('thiếu nữ', "maiden") : tr('công tử', "young gentleman")} áo trắng tuyệt sắc bước vào, mỉm cười mời bạn chén rượu ấm.`, `On a rainy night you shelter in a ruined temple. A breathtaking ${c.gender === 'nam' ? tr('thiếu nữ', "maiden") : tr('công tử', "young gentleman")} in white walks in and, smiling, offers you a cup of warm wine.`),
    choices: () => [
      {
        label: tr('Nhận chén rượu', "Accept the wine"),
        hint: tr('nguy', "risky"),
        lean: 'trung',
        run: (c, ctx) =>
          gamble(c, ctx, 0.35, tr('Sáng hôm sau, tiều phu tìm thấy một cái xác khô quắt trong miếu. Yêu tinh đã hút cạn dương khí của bạn.', "The next morning a woodcutter finds a shrivelled corpse in the temple. A demon drained every drop of your yang essence."), tr('Rượu ngọt lạ thường...', "The wine is strangely sweet..."), (ch) => {
            stat(ch, 'tamCanh', 6);
            return tr('Người ấy chỉ là một tiểu thư lạc đường. Hai người trò chuyện đến sáng.', "They were just a lost young noble. The two of you talk until dawn.");
          }),
      },
      {
        label: tr('Rút kiếm chém trước', "Draw your sword and strike first"),
        hint: tr('tà', "evil"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -6);
          if (ctx.rnd() < 0.5) {
            addCult(c, reward(c, 1.2));
            return tr('Đầu rơi xuống hóa thành đầu cáo. Bạn lấy được yêu đan.', "The severed head turns into a fox's head. You claim its demon core.");
          }
          stat(c, 'tamMa', 15);
          return tr('Máu đỏ chảy ra, người ấy chết thật. Chỉ là một cô gái bình thường.', "Red blood flows. They really are dead - just an ordinary girl.");
        },
      },
      {
        label: tr('Niệm chú, rắc gạo nếp', "Chant a spell, scatter sticky rice"),
        lean: 'chinh',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.6) {
            dao(c, 5);
            stat(c, 'khiVan', 6);
            return tr('Nó rú lên, hiện nguyên hình hồ ly rồi chạy mất.', "It shrieks, reveals its true fox form, and flees.");
          }
          return tr('Gạo nếp không có tác dụng. Nó cười khanh khách, cào bạn một vết rồi biến mất.', "The sticky rice does nothing. It cackles, claws you, and vanishes.") + hurt(c, 20, ctx);
        },
      },
      {
        label: tr('Giả vờ ngủ say', "Pretend to be fast asleep"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', -3);
          return tr('Cả đêm bạn nghe tiếng thở sát bên tai. Sáng ra người ấy đã đi, để lại một sợi lông trắng.', "All night you hear breathing right by your ear. By morning they're gone, leaving a single white hair.");
        },
      },
    ],
  },
  {
    id: 'cau_treo',
    minAge: 10,
    once: true,
    weight: 6,
    title: tr('Cầu treo Vạn Trượng', "Wanzhang Bridge"),
    text: () => tr('Cây cầu dây duy nhất bắc qua vực Vạn Trượng đã mục nát. Đi đường vòng mất ba tháng.', "The only rope bridge across the Wanzhang Chasm has rotted. The detour takes three months."),
    choices: () => [
      {
        label: tr('Chạy thật nhanh qua cầu', "Sprint across the bridge"),
        hint: tr('liều', "risky"),
        lean: 'trung',
        run: (c, ctx) =>
          gamble(c, ctx, 0.15, tr('Dây cầu đứt phựt ở giữa. Bạn rơi xuống vực Vạn Trượng, tiếng kêu vọng mãi không dứt.', "The rope snaps in the middle. You fall into the Wanzhang Chasm, your scream echoing forever."), tr('Đến giữa cầu, có tiếng rắc...', "Halfway across, there's a crack..."), (ch) => {
            stat(ch, 'khiVan', 3);
            return tr('Bạn vừa đặt chân sang bờ bên kia thì cầu đứt. Tim đập thình thịch.', "The moment your foot touches the far side, the bridge gives way. Your heart is pounding.");
          }),
      },
      {
        label: tr('Ngự khí bay qua', "Ride the qi across"),
        hint: tr('cần tu vi', "needs cultivation"),
        lean: 'trung',
        run: (c, ctx) => {
          if (c.realm >= 2) return tr('Bạn nhẹ nhàng lướt qua vực sâu. Tu sĩ thì cần gì cầu.', "You glide lightly over the abyss. What does a cultivator need a bridge for?");
          return gamble(c, ctx, 0.4, tr('Tu vi chưa đủ để ngự khí. Bạn rơi giữa chừng.', "Your cultivation isn't enough to ride the qi. You drop halfway."), tr('Bạn nhún người bay lên...', "You spring into the air..."), () => tr('Bạn chạm được vách đá bên kia, móng tay bật máu.', "You catch the cliff face on the other side, fingernails torn bloody."));
        },
      },
      {
        label: tr('Đi đường vòng', "Take the detour"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'tamCanh', 3);
          return tr('Ba tháng đường vòng, bạn ngắm được nhiều cảnh đẹp.', "Three months of detour, and plenty of fine scenery along the way.");
        },
      },
      {
        label: tr('Sửa cầu cho người sau', "Repair the bridge for others"),
        hint: tr('-40 linh thạch', "-40 spirit stones"),
        lean: 'chinh',
        run: (c) => {
          money(c, -40);
          dao(c, 8);
          stat(c, 'khiVan', 5);
          return tr('Dân làng hai bờ khắc tên bạn lên trụ cầu.', "The villagers on both banks carve your name into the bridge post.");
        },
      },
    ],
  },
  {
    id: 'hong_mon_yen',
    minAge: 18,
    minRealm: 1,
    once: true,
    weight: 5,
    title: tr('Tiệc Hồng Môn', "Hongmen Banquet"),
    text: () => tr('Thành chủ mời bạn dự tiệc. Giữa tiệc, bạn thấy đao phủ nấp sau rèm, và chén rượu trước mặt có màu hơi lạ.', "The City Lord invites you to a feast. Midway, you spot axemen hidden behind the curtain - and the wine before you looks slightly off."),
    choices: () => [
      {
        label: tr('Uống cạn cho phải phép', "Drain it, as etiquette demands"),
        hint: tr('nguy', "risky"),
        lean: 'trung',
        run: (c, ctx) =>
          gamble(c, ctx, 0.4, tr('Rượu có Đoạn Trường Tán. Bạn gục xuống bàn tiệc, máu đen trào ra khóe miệng.', "The wine was laced with Gut-Severing Powder. You slump over the table, black blood trickling from your lips."), tr('Bạn nâng chén...', "You raise the cup..."), (ch) => {
            money(ch, 200);
            return tr('Hóa ra thành chủ chỉ thử lòng can đảm. Ông thưởng bạn 200 linh thạch.', "The City Lord was only testing your nerve. He rewards you 200 spirit stones.");
          }),
      },
      {
        label: tr('Lật bàn, giết thành chủ', "Flip the table, kill the City Lord"),
        hint: tr('rất nguy, tà', "very dangerous, evil"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -12);
          return gamble(c, ctx, 0.3, tr('Ba mươi đao phủ ùa ra. Bạn chết dưới loạn đao.', "Thirty axemen pour out. You fall beneath a storm of blades."), tr('Bạn hất tung bàn tiệc...', "You hurl the table aside..."), (ch, cx) => {
            money(ch, 800);
            cx.fx('coin', '+800');
            ch.enemy = tr('triều đình truy nã', "wanted by the imperial court");
            return tr('Bạn chém thành chủ, vét sạch kho bạc rồi trốn đi. Từ nay bị truy nã.', "You cut down the City Lord, loot the treasury and flee. From now on you're a wanted fugitive.");
          });
        },
      },
      {
        label: tr('Giả say, xin ra ngoài', "Feign drunkenness, excuse yourself"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.7) return tr('Bạn lẻn ra hậu viện rồi trèo tường trốn mất.', "You slip out to the back courtyard and climb over the wall.");
          return tr('Thị vệ chặn lại, đâm một nhát. Bạn vẫn trốn được.', "A guard blocks you and lands a stab. You still get away.") + hurt(c, 25, ctx);
        },
      },
      {
        label: tr('Dùng ngân châm thử rượu', "Test the wine with a silver needle"),
        lean: 'chinh',
        run: (c) => {
          dao(c, 3);
          stat(c, 'khiVan', 4);
          return tr('Ngân châm hóa đen. Bạn đặt chén xuống, mỉm cười nhìn thành chủ. Không ai dám động thủ nữa.', "The silver needle turns black. You set down the cup and smile at the City Lord. No one dares make a move.");
        },
      },
    ],
  },
  {
    id: 'ho_bang',
    minAge: 7,
    once: true,
    weight: 5,
    when: (c) => Math.floor((c.age % 1) * 4) === 3 || c.region === 'bac_mac',
    title: tr('Mặt hồ đóng băng', "Frozen lake"),
    text: () => tr('Mùa đông, hồ lớn đóng băng. Giữa hồ có một bông Băng Liên trắng muốt đang nở, giá ngàn lượng.', "In winter the great lake freezes over. In its centre blooms a snow-white Ice Lotus worth a thousand taels."),
    choices: () => [
      {
        label: tr('Bò ra giữa hồ hái', "Crawl out to pick it"),
        hint: tr('liều', "risky"),
        lean: 'trung',
        run: (c, ctx) =>
          gamble(c, ctx, 0.25, tr('Mặt băng nứt toác. Bạn rơi xuống nước lạnh buốt, không ai kịp kéo lên.', "The ice cracks wide open. You plunge into the freezing water before anyone can pull you out."), tr('Băng kêu răng rắc dưới tay...', "The ice creaks under your hands..."), (ch, cx) => {
            money(ch, 300);
            addPill(ch, 'dien_tho');
            cx.fx('coin', tr('Băng Liên', "Ice Lotus"));
            return tr('Bạn hái được Băng Liên, đổi được 300 linh thạch và một viên Diên Thọ Đan.', "You pick the Ice Lotus and trade it for 300 spirit stones and a Longevity Pill.");
          }),
      },
      {
        label: tr('Ném dây móc kéo vào', "Throw a grappling hook and drag it in"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.4) {
            money(c, 300);
            return tr('Trúng rồi! Bạn kéo được bông Băng Liên vào bờ.', "Got it! You haul the Ice Lotus to shore.");
          }
          return tr('Bông hoa rơi xuống lỗ băng, chìm mất.', "The flower slips into a hole in the ice and sinks.");
        },
      },
      {
        label: tr('Trượt băng chơi với lũ trẻ', "Go skating with the kids"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'tamCanh', 6);
          return tr('Một buổi chiều vui vẻ. Bạn quên luôn bông hoa.', "A fun afternoon. You forget all about the flower.");
        },
      },
      { label: tr('Về nhà sưởi ấm', "Go home and warm up"), lean: 'trung', run: () => tr('Ngoài trời lạnh quá. Bông hoa để người khác lo.', "It's far too cold out. Let someone else worry about the flower.") },
    ],
  },
  {
    id: 'on_dich',
    minAge: 10,
    once: true,
    weight: 5,
    title: tr('Ôn dịch', "Plague"),
    text: () => tr('Ôn dịch tràn qua trấn. Người chết chất đống ngoài cổng thành. Quan phủ sắp phong tỏa toàn bộ.', "A plague sweeps through the town. Corpses pile up outside the gates. The magistrate is about to seal everything off."),
    choices: () => [
      {
        label: tr('Ở lại chữa bệnh cứu người', "Stay and heal the sick"),
        hint: tr('chính, có thể nhiễm', "righteous, may get infected"),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 15);
          return gamble(c, ctx, 0.25, tr('Bạn cứu được hơn trăm người, rồi chính bạn nhiễm dịch. Dân trấn lập miếu thờ bạn.', "You save over a hundred people, then catch the plague yourself. The townsfolk build a shrine in your honour."), tr('Ngày thứ bốn mươi, bạn bắt đầu ho...', "On the fortieth day, you start to cough..."), (ch) => {
            stat(ch, 'khiVan', 12);
            stat(ch, 'tamCanh', 10);
            return tr('Ba tháng không ngủ, bạn cứu được cả trấn. Người người gọi bạn là thần y.', "Three sleepless months, and you save the whole town. Everyone calls you a miracle doctor.");
          });
        },
      },
      {
        label: tr('Trốn khỏi thành trước khi phong tỏa', "Flee before the lockdown"),
        lean: 'trung',
        run: (c, ctx) =>
          gamble(
            c,
            ctx,
            0.1,
            tr('Bạn đã nhiễm bệnh từ trước khi trốn. Chết bên vệ đường, không ai dám lại gần.', "You were already infected before you fled. You die by the roadside, and no one dares come near."),
            tr('Bạn chạy suốt đêm...', "You run all night..."),
            () => tr('Bạn trốn thoát. Đêm nào cũng mơ thấy những người bị bỏ lại.', "You escape. Every night you dream of those left behind."),
          ),
      },
      {
        label: tr('Bán thuốc giá cắt cổ', "Sell medicine at extortionate prices"),
        hint: tr('tà, +linh thạch', "evil, +spirit stones"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -15);
          money(c, 400);
          ctx.fx('coin', '+400');
          return tr('Bạn bán thuốc gấp trăm lần giá. Giàu lên nhanh chóng, nhưng ai cũng nguyền rủa bạn.', "You sell medicine at a hundred times the price. You get rich fast, but everyone curses your name.");
        },
      },
      {
        label: tr('Đóng cửa, uống Thanh Tâm Đan', "Lock the door, take a Clear Heart Pill"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'sucKhoe', -10);
          return tr('Bạn đóng cửa ba tháng. Gầy rộc, nhưng còn sống.', "You stay shut in for three months. Gaunt, but alive.");
        },
      },
    ],
  },
  {
    id: 'mang_xa_khong_lo',
    minAge: 12,
    once: true,
    weight: 5,
    title: tr('Mãng xà ngàn năm', "Thousand-year python"),
    text: () => tr('Đang đi đường núi, bạn nhận ra khúc gỗ mình vừa ngồi lên nghỉ chân... đang thở.', "On a mountain trail you realise the log you sat on to rest is... breathing."),
    choices: () => [
      {
        label: tr('Đâm vào mắt nó', "Stab it in the eye"),
        hint: tr('liều, thưởng lớn', "risky, big reward"),
        lean: 'trung',
        run: (c, ctx) =>
          gamble(c, ctx, 0.35, tr('Mãng xà quấn chặt lấy bạn, xương cốt vỡ vụn rồi nuốt chửng.', "The python coils around you, crushes your bones, and swallows you whole."), tr('Bạn vung kiếm...', "You swing your sword..."), (ch, cx) => {
            addCult(ch, reward(ch, 2.5));
            cx.fx('breakthrough', tr('Trảm mãng', "Python slain"));
            return tr('Một kiếm xuyên mắt! Mãng xà giãy chết. Bạn mổ lấy mật rắn, tu vi tăng vọt.', "One thrust through the eye! The python thrashes and dies. You cut out its gallbladder and your cultivation soars.");
          }),
      },
      {
        label: tr('Nằm im giả chết', "Lie still and play dead"),
        lean: 'trung',
        run: (c, ctx) => gamble(c, ctx, 0.15, tr('Mãng xà không quan tâm bạn chết hay sống. Nó nuốt luôn.', "The python doesn't care if you're dead or alive. It swallows you anyway."), tr('Bạn nín thở...', "You hold your breath..."), () => tr('Nó trườn đi. Bạn nằm im thêm một canh giờ mới dám đứng dậy.', "It slithers away. You lie still for another hour before you dare stand up.")),
      },
      {
        label: tr('Rải hùng hoàng rồi chạy', "Scatter realgar and run"),
        hint: tr('-20 linh thạch', "-20 spirit stones"),
        lean: 'trung',
        run: (c) => {
          money(c, -20);
          return tr('Mùi hùng hoàng làm nó chùn lại. Bạn chạy một mạch xuống núi.', "The realgar smell makes it recoil. You run all the way down the mountain.");
        },
      },
      {
        label: tr('Thì thầm với nó', "Whisper to it"),
        hint: tr('yêu tộc?', "yao race?"),
        lean: 'trung',
        run: (c, ctx) => {
          if (c.race === 'yeu') {
            stat(c, 'khiVan', 10);
            return tr('Nó nhận ra bạn là yêu tộc, cúi đầu nhường đường rồi tặng một chiếc vảy.', "It recognises you as yao kin, bows its head to let you pass, and gifts you a scale.");
          }
          return gamble(c, ctx, 0.3, tr('Nó không hiểu tiếng người. Bạn trở thành bữa tối.', "It doesn't understand human speech. You become dinner."), tr('Bạn ghé sát tai nó...', "You lean close to its ear..."), () => tr('Nó lè lưỡi liếm mặt bạn rồi bỏ đi. Thật khó hiểu.', "It flicks its tongue across your face and leaves. Baffling."));
        },
      },
    ],
  },
  {
    id: 'set_danh',
    minAge: 18,
    once: true,
    weight: 5,
    title: tr('Sấm sét giữa trời quang', "Thunder from a clear sky"),
    text: () => tr('Trời đang trong xanh bỗng tối sầm. Một tia sét đánh xuống ngay cạnh chỗ bạn đứng, cháy đen cả gốc cây.', "The clear blue sky suddenly goes black. A bolt of lightning strikes right beside you, scorching a tree stump."),
    choices: () => [
      {
        label: tr('Giơ kiếm lên trời lĩnh ngộ lôi pháp', "Raise your sword to comprehend thunder law"),
        hint: tr('cực liều', "insanely risky"),
        lean: 'trung',
        run: (c, ctx) => {
          ctx.fx('lightning');
          return gamble(c, ctx, 0.4, tr('Tia sét thứ hai đánh trúng mũi kiếm. Bạn hóa thành than đen trên đỉnh núi.', "A second bolt hits the tip of your sword. You become a lump of charcoal on the mountaintop."), tr('Bạn giơ cao thanh kiếm...', "You raise your sword high..."), (ch, cx) => {
            addCult(ch, reward(ch, 3));
            stat(ch, 'ngoTinh', 12);
            cx.fx('breakthrough', tr('Lôi pháp', "Thunder law"));
            return tr('Sét đánh trúng, nhưng bạn hấp thu được lôi lực! Tóc dựng đứng, tu vi tăng vọt.', "The lightning hits, but you absorb its power! Hair standing on end, your cultivation soars.");
          });
        },
      },
      {
        label: tr('Nằm rạp xuống đất', "Lie flat on the ground"),
        lean: 'trung',
        run: (c, ctx) => {
          if (ctx.rnd() < 0.8) return tr('Sấm sét đi qua. Bạn mặt mũi lấm lem nhưng còn sống.', "The storm passes. You're filthy but alive.");
          return tr('Sét đánh trúng cây bên cạnh, cành gãy đập vào lưng bạn.', "Lightning strikes the tree beside you, and a broken branch slams into your back.") + hurt(c, 20, ctx);
        },
      },
      {
        label: tr('Chạy vào hang trú', "Run into a cave for shelter"),
        lean: 'trung',
        run: (c) => {
          stat(c, 'khiVan', 3);
          return tr('Trong hang có một bộ xương cầm cuốn bí kíp. Tiếc là chữ đã mờ hết.', "In the cave sits a skeleton clutching a secret manual. Sadly the writing has all faded.");
        },
      },
      {
        label: tr('Quỳ xuống sám hối', "Kneel and repent"),
        hint: tr('nếu từng làm ác', "if you've done evil"),
        lean: 'chinh',
        run: (c, ctx) => {
          if (c.daoTam < -30)
            return gamble(c, ctx, 0.3, tr('Trời không tha. Sét đánh trúng đỉnh đầu bạn đang cúi xuống.', "Heaven does not forgive. Lightning strikes the top of your bowed head."), tr('Bạn khấn vái...', "You pray..."), (ch) => {
              dao(ch, 10);
              return tr('Mây tan. Có lẽ trời cho bạn thêm một cơ hội.', "The clouds part. Perhaps Heaven is giving you another chance.");
            });
          dao(c, 4);
          return tr('Lòng không thẹn, sét không đến gần.', "A clear conscience - the lightning keeps its distance.");
        },
      },
    ],
  },
  {
    id: 'lan_kha',
    minAge: 20,
    once: true,
    weight: 4,
    title: tr('Ván cờ của tiên nhân', "The immortals' game of Go"),
    text: () => tr('Trên đỉnh núi, hai ông lão đang đánh cờ dưới gốc tùng. Một người vẫy bạn: "Ngồi xem một ván đi."', "On a mountaintop, two old men play Go beneath a pine. One beckons you: \"Sit and watch a game.\""),
    choices: () => [
      {
        label: tr('Ngồi xem hết ván cờ', "Watch the whole game"),
        hint: tr('thời gian?', "time?"),
        lean: 'trung',
        run: (c, ctx) => {
          const yrs = 20 + Math.floor(ctx.rnd() * 40);
          c.age += yrs;
          addCult(c, reward(c, 3));
          stat(c, 'ngoTinh', 15);
          if (c.age >= c.lifespan) {
            c.dead = true;
            c.endTag = 'lan_kha';
            c.cause = tr(`Xem xong ván cờ, cán rìu bên cạnh đã mục nát. Xuống núi mới biết đã qua ${yrs} năm. Bạn già đi rồi tọa hóa ngay dưới chân núi.`, `When the game ends, the axe handle beside you has rotted away. Back down the mountain, you learn ${yrs} years have passed. You age at once and pass away at the foot of the mountain.`);
            ctx.fx('death');
            return c.cause;
          }
          return tr(`Ván cờ kết thúc, bạn ngộ ra nhiều điều. Xuống núi mới biết đã qua ${yrs} năm, người quen chẳng còn ai.`, `The game ends and you've grasped a great deal. Back down the mountain, you learn ${yrs} years have passed, and everyone you knew is gone.`);
        },
      },
      {
        label: tr('Xin được đánh một ván', "Ask to play a game"),
        hint: tr('tu vi', "cultivation"),
        lean: 'trung',
        run: (c, ctx) => {
          c.age += 5;
          if (ctx.rnd() < 0.3) {
            addCult(c, reward(c, 4));
            return tr('Bạn thắng tiên nhân một nước! Ông cười lớn, truyền cho bạn một đạo pháp quyết. Xuống núi đã qua năm năm.', "You beat the immortal by a single move! He laughs heartily and teaches you a Dao technique. Five years have passed when you come down the mountain.");
          }
          stat(c, 'tamCanh', 5);
          return tr('Bạn thua tan tác. Xuống núi mới biết đã qua năm năm.', "You're crushed. Back down the mountain, you learn five years have passed.");
        },
      },
      {
        label: tr('Lấy trộm một quân cờ', "Steal a Go stone"),
        hint: tr('tà', "evil"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -5);
          return gamble(c, ctx, 0.3, tr('Ông lão chỉ liếc nhìn. Bạn hóa thành tượng đá đứng mãi trên đỉnh núi.', "The old man merely glances at you. You turn to stone and stand on that peak forever."), tr('Bạn thò tay...', "You reach out..."), (ch) => {
            money(ch, 500);
            return tr('Quân cờ bằng ngọc tiên, bán được 500 linh thạch.', "The Go stone is immortal jade - it sells for 500 spirit stones.");
          });
        },
      },
      {
        label: tr('Cúi chào rồi đi', "Bow and leave"),
        lean: 'chinh',
        run: (c) => {
          stat(c, 'khiVan', 5);
          return tr('Ông lão gật đầu: "Biết đủ là phúc."', "The old man nods: \"Knowing when you have enough is a blessing.\"");
        },
      },
    ],
  },
  {
    id: 'dong_dat',
    minAge: 15,
    once: true,
    weight: 5,
    title: tr('Địa long trở mình', "The earth dragon stirs"),
    text: () => tr('Đêm khuya, mặt đất rung chuyển dữ dội. Nhà cửa đổ sập, tiếng kêu cứu vang khắp nơi. Kho linh thạch của bạn sắp bị vùi lấp.', "Late at night the ground shakes violently. Houses collapse, cries for help everywhere. Your spirit stone store is about to be buried."),
    choices: () => [
      {
        label: tr('Lao vào cứu kho linh thạch', "Rush in to save the spirit stones"),
        hint: tr('liều vì tiền', "risking it for money"),
        lean: 'trung',
        run: (c, ctx) =>
          gamble(c, ctx, 0.3, tr('Xà nhà sập xuống. Người ta đào được xác bạn vẫn ôm chặt túi linh thạch.', "A beam comes crashing down. They dig out your corpse still clutching the bag of spirit stones."), tr('Bạn chạy vào kho...', "You dash into the storeroom..."), (ch) => {
            money(ch, 100);
            return tr('Bạn ôm được túi linh thạch chạy ra ngay trước khi mái nhà đổ.', "You grab the bag of spirit stones and get out just before the roof caves in.");
          }),
      },
      {
        label: tr('Cứu đứa bé trong nhà bên', "Save the child next door"),
        hint: tr('chính', "righteous"),
        lean: 'chinh',
        run: (c, ctx) => {
          dao(c, 12);
          return gamble(c, ctx, 0.2, tr('Bạn đẩy được đứa bé ra ngoài, rồi bức tường đổ ập lên người bạn.', "You shove the child to safety, then the wall collapses on top of you."), tr('Bạn lao vào đống đổ nát...', "You charge into the rubble..."), (ch) => {
            stat(ch, 'khiVan', 10);
            money(ch, -Math.round(ch.linhThach * 0.5));
            return tr('Bạn cứu được đứa bé, nhưng kho linh thạch bị vùi mất một nửa.', "You save the child, but half your spirit stones are buried.");
          });
        },
      },
      {
        label: tr('Chạy ra bãi trống', "Run to open ground"),
        lean: 'trung',
        run: (c) => {
          money(c, -Math.round(c.linhThach * 0.4));
          return tr('Bạn an toàn. Kho linh thạch bị vùi mất gần một nửa.', "You're safe. Nearly half your spirit stones are buried.");
        },
      },
      {
        label: tr('Nhân lúc hỗn loạn đi hôi của', "Loot in the chaos"),
        hint: tr('tà', "evil"),
        lean: 'ta',
        run: (c, ctx) => {
          dao(c, -12);
          money(c, 250);
          if (ctx.rnd() < 0.3) return tr('Bị bắt quả tang, bạn bị dân đánh một trận.', "Caught red-handed, you get a beating from the townsfolk.") + hurt(c, 25, ctx);
          return tr('Bạn vơ vét được kha khá trong đống đổ nát.', "You scavenge a decent haul from the rubble.");
        },
      },
    ],
  },
];
