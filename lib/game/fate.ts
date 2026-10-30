import { DO_KIEP_REALM, addWound, afterLoss, atAge, bullyCult, fatal, forcedReady, hurt, markDeath, markForced, money, phamFloor, riskMeter, stat, takeStones, withPham } from './helpers';
import type { Character, Choice, EffectCtx } from './types';
import { tr } from '../i18n';

/**
 * Hiền quá hóa dại: ai lúc nào cũng chọn đường an toàn thì bị coi là dễ bắt nạt.
 * - Lựa chọn không dính rủi ro nào làm tăng "timid", lựa chọn liều làm giảm mạnh.
 * - Từ mức 3 trở lên, mỗi lựa chọn an toàn có xác suất gặp họa: bị bắt nạt, cướp, vu oan, ám sát nhầm.
 * - Ngoài ra đời vốn vô thường: lựa chọn an toàn nào cũng có chút xui rủi nhỏ (nghẹn, trượt chân, rắn cắn).
 * Phần lớn là trọng thương, chết chỉ chiếm phần nhỏ. Tu vi cao và đồ tốt làm kẻ xấu ngại ra tay.
 */

const RISKY_HINT = /nguy|liều|chết|rủi ro|tà/i;

interface Mishap {
  id: string;
  /** trọng số xuất hiện */
  w: (c: Character) => number;
  run: (c: Character, ctx: EffectCtx) => string;
}

const r = (ctx: EffectCtx, a: number, b: number) => Math.round(a + ctx.rnd() * (b - a));
/** 4.1.0 Q2: xui rủi phàm tục: từ Trúc Cơ không chết, kể cả khi đang yếu */
const phamRun = (c: Character, fn: () => string) => {
  const t = withPham(2, fn);
  phamFloor(c, 2);
  return t;
};

/** họa vì hiền: chỉ xảy ra khi timid cao */
const BULLY: Mishap[] = [
  {
    id: 'bat_nat',
    w: (c) => (c.realm <= 1 ? 4 : 1.5),
    run: (c, ctx) => {
      // 4.1.0 Q2b: từ Trúc Cơ, côn đồ phàm tục không dám động vào người tu đạo
      if (c.realm >= 2 && !c.cosmos) {
        stat(c, 'khiVan', 1);
        return tr('Đám côn đồ đầu làng định chặn đường bạn, thấy bạn đạp kiếm bay qua đầu thì dạt cả xuống ruộng. Từ đó cả bọn gọi bạn là "tiên sư", thấy bóng là cúi chào.', "The village thugs try to block your way, then see you fly overhead on your sword and dive into the paddy. Ever since, they call you \"Immortal Master\" and bow whenever your shadow passes.");
      }
      const lost = Math.round(c.linhThach * 0.2);
      money(c, -lost);
      const t = hurt(c, r(ctx, 15, 30), ctx);
      stat(c, 'tamMa', 4);
      return tr(`Thấy bạn hiền lành nhịn nhục, đám côn đồ đầu làng chặn đường lấy ${lost} linh thạch, còn đánh cho một trận nhừ tử.${t}`, `Seeing how meek and long-suffering you are, the village thugs block your way, take ${lost} spirit stones and beat you black and blue.${t}`);
    },
  },
  {
    id: 'vu_oan',
    w: () => 2,
    run: (c, ctx) => {
      if (c.realm >= 2 && !c.cosmos) {
        stat(c, 'tamCanh', 2);
        return tr('Nhà giàu mất trộm, định đổ tội cho bạn. Bạn chỉ quét thần thức một vòng là thấy túi bạc giấu dưới giường quản gia. Quan phủ rối rít tạ lỗi, còn mời bạn ở lại dùng trà.', "A rich family is robbed and tries to pin it on you. One sweep of your divine sense finds the silver hidden under the steward's bed. The magistrate apologizes profusely and invites you to stay for tea.");
      }
      const t = hurt(c, r(ctx, 20, 35), ctx);
      money(c, -Math.round(c.linhThach * 0.3));
      return tr(`Nhà giàu mất trộm, thấy bạn hiền không dám cãi nên đổ hết tội lên đầu. Bạn bị đánh ba mươi trượng, bồi thường gần hết của cải.${t}`, `A rich family is robbed, and since you're too meek to argue, they pin it all on you. You get thirty strokes of the cane and pay back nearly everything you own.${t}`);
    },
  },
  {
    id: 'am_sat_nham',
    w: (c) => (c.realm >= 1 ? 1 : 0.3),
    run: (c, ctx) => {
      // đã Độ Kiếp: không phải sát thủ nhận nhầm mà là lôi kiếp của người khác nhận nhầm khí tức
      if (c.realm >= DO_KIEP_REALM && !c.cosmos) {
        const f = fatal(c, ctx, 0.12, tr('Lôi kiếp của người khác nhận nhầm khí tức. Chín đạo thiên lôi đánh lệch sang, bạn hóa tro thay cho kẻ ấy.', "Someone else's tribulation mistakes your aura for theirs. Nine bolts of heavenly lightning veer toward you, and you turn to ash in their place."));
        if (c.dead) return f ?? '';
        ctx.fx('lightning');
        const t = hurt(c, r(ctx, 30, 50), ctx);
        return tr(`Một lão quái gần đó độ kiếp, lôi vân nhận nhầm khí tức của bạn. Ba đạo thiên lôi đánh lệch sang, bạn gồng mình đỡ được.${t}`, `An old monster nearby is facing tribulation, and the thunderclouds mistake your aura for his. Three heavenly bolts veer your way; you brace and withstand them.${t}`);
      }
      const f = fatal(c, ctx, 0.12, tr('Sát thủ nhận nhầm người. Một mũi tên tẩm độc bay ra từ bóng tối. Bạn chết mà không biết vì sao.', "An assassin mistakes you for someone else. A poisoned arrow flies from the shadows. You die without ever knowing why."));
      if (c.dead) return f ?? '';
      const t = hurt(c, r(ctx, 30, 50), ctx);
      return tr(`Đêm khuya, sát thủ nhận nhầm bạn là mục tiêu. Bạn trúng một đao, may mà kêu cứu kịp.${t}${f ?? ''}`, `Late at night, an assassin mistakes you for his target. You take a blade, but luckily cry for help in time.${t}${f ?? ''}`);
    },
  },
  {
    id: 'cuop_cong',
    w: (c) => (c.realm >= 1 ? 2 : 0),
    run: (c, ctx) => {
      // 4.1.0 Q2b: từ Trúc Cơ, mất tối đa 5% tu vi và được chọn tố cáo hay thách đấu (sự kiện dong_mon_hut_cong)
      if (c.realm >= 2 && !c.cosmos) {
        const lost = bullyCult(c, c.cultivation * 0.3);
        c.cultivation = Math.max(0, c.cultivation - lost);
        c.qf = { ...(c.qf ?? {}), dmHut: lost };
        return tr(`Đang tọa thiền, bạn giật mình thấy linh khí chảy ngược khỏi đan điền: có đồng môn lén hút trộm tu vi (-${lost} tu vi). Bạn mở mắt, kịp nhìn rõ mặt hắn.`, `Mid-meditation, you feel spirit qi flowing backward out of your dantian: a fellow disciple is siphoning your cultivation (-${lost} cultivation). You open your eyes in time to see his face.`);
      }
      c.cultivation = Math.round(c.cultivation * 0.7);
      const t = hurt(c, r(ctx, 20, 35), ctx);
      return tr(`Đồng môn thấy bạn hiền, lén hút trộm linh khí trong lúc bạn tọa thiền. Tu vi tụt mất ba phần.${t}`, `A fellow disciple, seeing how meek you are, secretly siphons your spirit qi while you meditate. You lose three-tenths of your cultivation.${t}`);
    },
  },
  {
    id: 'bi_lua',
    w: () => 1.5,
    run: (c, ctx) => {
      if (c.realm >= 4 && !c.cosmos) return tr('Người quen định mượn tiền, vừa nhìn vào mắt bạn đã run run tự khai là định lừa, rồi tự tát mình hai cái. Bạn chưa kịp nói câu nào.', "An acquaintance comes to borrow money, takes one look into your eyes, confesses he meant to swindle you, and slaps himself twice. You haven't said a word.");
      const lost = takeStones(c, 0.4);
      stat(c, 'tamMa', c.realm >= 2 ? 2 : 5);
      return tr(`Người quen mượn ${lost} linh thạch, thề sống thề chết sẽ trả. Hôm sau hắn bỏ trốn khỏi trấn. Bạn tức đến mất ngủ.`, `An acquaintance borrows ${lost} spirit stones, swearing on his life to repay. The next day he flees town. You're so furious you can't sleep.`);
    },
  },
  {
    id: 'lam_bia_do_dan',
    w: (c) => (c.age >= 16 ? 1.2 : 0),
    run: (c, ctx) => {
      const f = fatal(c, ctx, 0.25, tr('Hai phe giao chiến, chẳng ai thèm hỏi ý kiến người đứng giữa. Bạn bị đẩy ra làm bia đỡ đạn và không bao giờ về nữa.', "Two factions clash, and nobody bothers asking the one caught in the middle. You're shoved forward as cannon fodder and never come back."));
      if (c.dead) return f ?? '';
      const t = hurt(c, r(ctx, 25, 45), ctx);
      return tr(`Bạn hiền quá nên bị sai đi đầu khi môn phái đánh nhau. Mình đầy thương tích mới lết được về.${t}${f ?? ''}`, `You're so meek they send you in first when the sect goes to war. You crawl back covered in wounds.${t}${f ?? ''}`);
    },
  },
];

/** vô thường: xui rủi nhỏ, ai cũng có thể gặp */
const BAD_LUCK: Mishap[] = [
  {
    id: 'nghen',
    w: (c) => (c.age >= c.lifespan * 0.6 ? 3 : 1),
    // 4.1.0 Q2: xui rủi phàm tục, từ Trúc Cơ chỉ bị thương
    run: (c, ctx) =>
      phamRun(c, () => {
        const f = fatal(c, ctx, c.age >= c.lifespan * 0.6 ? 0.35 : 0.15, tr('Ăn bánh trôi vội quá, bạn bị nghẹn. Tu tiên cả đời, chết vì một viên bánh.', "You eat your rice balls too fast and choke. A lifetime of cultivation, killed by a dumpling."));
        if (c.dead) return f ?? '';
        const t = hurt(c, r(ctx, 8, 15), ctx);
        return tr(`Đang ăn thì nghẹn, trợn mắt mãi mới khạc ra được.${t}${f ?? ''}`, `You choke mid-meal, eyes bulging, before finally coughing it up.${t}${f ?? ''}`);
      }),
  },
  {
    id: 'truot_chan',
    w: () => 1,
    // 4.1.0 Q2: xui rủi phàm tục, từ Trúc Cơ chỉ bị thương
    run: (c, ctx) =>
      phamRun(c, () => {
        const f = fatal(c, ctx, 0.12, tr('Trời mưa trơn, bạn trượt chân ngã xuống giếng. Sáng hôm sau người ta mới vớt lên.', "The rain makes everything slick; you slip and fall into a well. They only fish you out the next morning."));
        if (c.dead) return f ?? '';
        const t = hurt(c, r(ctx, 12, 25), ctx);
        return tr(`Trời mưa trơn, bạn trượt chân ngã gãy tay.${t}${f ?? ''}`, `The rain makes everything slick; you slip and break your arm.${t}${f ?? ''}`);
      }),
  },
  {
    id: 'ran_can',
    w: (c) => (c.realm <= 1 ? 1 : 0.3),
    // 4.1.0 Q2: xui rủi phàm tục, từ Trúc Cơ chỉ bị thương
    run: (c, ctx) =>
      phamRun(c, () => {
        const f = fatal(c, ctx, 0.1, tr('Một con rắn lục đuôi đỏ cắn vào gót chân. Độc lan nhanh hơn bạn chạy.', "A red-tailed green viper bites your heel. The venom spreads faster than you can run."));
        if (c.dead) return f ?? '';
        const t = hurt(c, r(ctx, 15, 25), ctx);
        return tr(`Bị rắn cắn, sốt mê man ba ngày.${t}${f ?? ''}`, `Bitten by a snake, you lie in a fever for three days.${t}${f ?? ''}`);
      }),
  },
  {
    id: 'ngo_doc',
    w: () => 0.8,
    run: (c, ctx) => {
      const t = hurt(c, r(ctx, 10, 20), ctx);
      return tr(`Ăn phải nấm lạ trong rừng, nôn mửa cả tuần.${t}`, `You eat a strange mushroom in the forest and throw up for a week.${t}`);
    },
  },
];

function pick(list: Mishap[], c: Character, ctx: EffectCtx): Mishap | null {
  const ws = list.map((m) => Math.max(0, m.w(c)));
  const total = ws.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  let x = ctx.rnd() * total;
  for (let i = 0; i < list.length; i++) {
    x -= ws[i];
    if (x <= 0) return list[i];
  }
  return list[list.length - 1];
}

/** Gọi trước khi chạy lựa chọn: đánh dấu mốc rủi ro */
export function beforeChoice(): number {
  return riskMeter.n;
}

/**
 * Sau khi chạy lựa chọn: lựa chọn an toàn thì cộng điểm hiền, có thể gặp họa.
 * Trả về câu chuyện xảy ra (nếu có) để ghi vào nhật ký.
 */
export function afterChoice(c: Character, choice: Choice, mark: number, ctx: EffectCtx): string | null {
  if (c.dead || c.age < 6 || c.cosmos) return null;
  const risky = riskMeter.n > mark || RISKY_HINT.test(choice.hint ?? '') || choice.lean === 'ta';
  if (risky) {
    c.timid = Math.max(0, (c.timid ?? 0) - 3);
    return null;
  }
  // 4.1.0 Q2b: chọn đường chính nghĩa không phải là hiền nhát, không làm người ta coi thường (trước đây chính đạo bị ăn hiếp gấp nhiều lần tà đạo)
  const righteous = choice.lean === 'chinh';
  const t = righteous ? (c.timid ?? 0) : (c.timid = (c.timid ?? 0) + 1);
  if (t === 3 && !righteous) ctx.log(tr('Người trong trấn bắt đầu xì xào: kẻ này hiền như cục đất, bắt nạt cũng chẳng dám kêu.', "The townsfolk start whispering: this one's as meek as a lump of dirt - bully them and they won't even squeak."), 'bad');
  // kẻ mạnh, đồ xịn thì ít ai dám động vào
  const guard = 1 / (1 + c.realm * 0.35);
  const bullyP = t >= 3 && !righteous ? Math.min(0.32, (t - 2) * 0.065) * guard : 0;
  const luckP = 0.015;
  const roll = ctx.rnd();
  let m: Mishap | null = null;
  if (roll < bullyP) m = pick(BULLY, c, ctx);
  else if (roll < bullyP + luckP) m = pick(BAD_LUCK, c, ctx);
  if (!m) return null;
  if (BULLY.includes(m)) c.timid = Math.max(0, t - 2); // bị một vố thì người ta tạm buông tha
  ctx.fx('hurt');
  return m.run(c, ctx);
}

/**
 * Cây cao đón gió: người nổi danh chính đạo bị ma đạo để mắt, hay ra tay trượng nghĩa nên dễ vạ lây.
 * Cân với tâm ma của tà đạo, để chính đạo không phải con đường sống lâu chắc chắn.
 */
const PERILS: ((c: Character, ctx: EffectCtx) => string)[] = [
  (c, ctx) => {
    const by = tr('Thất Sát của Ma đạo', 'the Seven Killers of the Demonic Path');
    const f = fatal(c, ctx, 0.3, tr('Ma đạo nghe danh bạn đã lâu. Đêm ấy bảy tên sát thủ Thất Sát cùng ra tay ám sát, bạn chết khi đang ngồi thiền.', "The Demonic Path has long heard of you. That night the Seven Killers strike together as assassins, and you die while meditating.") + atAge(c));
    markDeath(c, 'dao_giang_ho', by);
    if (c.dead) return f ?? '';
    const dmg = r(ctx, 25, 40);
    // câu bên dưới gọi hurt trong cả hai thứ tiếng (giữ như cũ), nên thương thế thật là gấp đôi
    addWound(c, dmg * 2, tr('bị sát thủ Ma đạo ám sát', 'attacked by Demonic Path assassins'), 'dao_giang_ho', by);
    return tr(`Ma đạo coi bạn là cái gai trong mắt, phái sát thủ đến trừ khử. Bạn đánh lui được nhưng thân mang trọng thương.${hurt(c, dmg, ctx)}${f ?? ''}`, `The Demonic Path sees you as a thorn in its side and sends assassins to remove you. You drive them off, but are gravely wounded.${hurt(c, dmg, ctx)}${f ?? ''}`);
  },
  (c, ctx) => {
    const f = fatal(c, ctx, 0.2, tr('Bạn ra tay cứu một cô gái giữa phố, không ngờ sau lưng ác bá là cả một bang phái. Bạn bị vây đánh đến chết.', "You step in to save a girl in the street, never guessing the bully has a whole gang behind him. They surround you and beat you to death."));
    if (c.dead) return f ?? '';
    return tr(`Thấy chuyện bất bình, bạn ra tay trượng nghĩa. Đồng bọn của ác bá kéo đến vây đánh, bạn trọng thương mới thoát được.${hurt(c, r(ctx, 20, 35), ctx)}${f ?? ''}`, `Seeing an injustice, you step in to right it. The bully's cronies swarm you, and you barely escape, gravely wounded.${hurt(c, r(ctx, 20, 35), ctx)}${f ?? ''}`);
  },
  (c, ctx) => {
    // 4.1.0 Q2b: từ Nguyên Anh, kẻ tiểu nhân phàm tục không lừa nổi; Trúc Cơ, Kim Đan mất có trần và không bị đâm
    if (c.realm >= 4 && !c.cosmos) return tr('Kẻ tiểu nhân giả làm người gặp nạn để gài bẫy bạn. Bạn chỉ nhìn hắn một cái, hắn đã quỳ xuống khai ra cả ổ đồng bọn. Quan phủ được một mẻ lưới lớn.', "A scoundrel poses as someone in trouble to trap you. One look from you and he's on his knees naming his whole gang. The magistrate makes a big haul.");
    const lost = takeStones(c, 0.35);
    if (c.realm >= 2 && !c.cosmos) return tr(`Kẻ tiểu nhân lợi dụng lòng tốt của bạn, giả làm người gặp nạn rồi gài bẫy, cuỗm được ${lost} linh thạch rồi chạy mất dép. Bạn lười đuổi.`, `A scoundrel exploits your kindness, posing as someone in trouble, and makes off with ${lost} spirit stones. You can't be bothered to chase him.`);
    return tr(`Kẻ tiểu nhân lợi dụng lòng tốt của bạn, giả làm người gặp nạn rồi gài bẫy. Bạn mất ${lost} linh thạch, còn bị đâm một nhát.${hurt(c, r(ctx, 15, 25), ctx)}`, `A scoundrel exploits your kindness, posing as someone in trouble to set a trap. You lose ${lost} spirit stones and get stabbed too.${hurt(c, r(ctx, 15, 25), ctx)}`);
  },
  (c, ctx) => {
    const f = fatal(c, ctx, 0.25, tr('Chính tà giao tranh, bạn xung phong đi đầu. Trận ấy chính phái thắng, nhưng bạn không trở về.', "In the clash of righteous and evil, you volunteer for the front line. The righteous win that battle, but you never return."));
    if (c.dead) return f ?? '';
    return tr(`Chính phái triệu tập đi diệt ma, bạn là người xung phong đầu tiên. Thắng trận, nhưng bạn mang về đầy mình thương tích.${hurt(c, r(ctx, 25, 40), ctx)}${f ?? ''}`, `The righteous sects muster to wipe out the demons, and you're the first to volunteer. They win, but you come back riddled with wounds.${hurt(c, r(ctx, 25, 40), ctx)}${f ?? ''}`);
  },
];

export function righteousPeril(c: Character, ctx: EffectCtx): string | null {
  // chuyện giang hồ phàm giới không còn đuổi theo tiên nhân
  if (c.dead || c.age < 16 || c.cosmos) return null;
  const p = c.daoTam >= 70 ? 0.03 : c.daoTam >= 40 ? 0.018 : 0;
  if (!p || ctx.rnd() >= p) return null;
  // 4.1.0 Q3: sát thủ cũng là trận bắt buộc, phải chờ khoảng lặng
  if (!forcedReady(c)) return null;
  markForced(c);
  ctx.fx('hurt');
  return PERILS[Math.floor(ctx.rnd() * PERILS.length)](c, ctx);
}
