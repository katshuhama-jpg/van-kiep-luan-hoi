import { fatal, hurt, money, riskMeter, stat } from './helpers';
import type { Character, Choice, EffectCtx } from './types';

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

/** họa vì hiền: chỉ xảy ra khi timid cao */
const BULLY: Mishap[] = [
  {
    id: 'bat_nat',
    w: (c) => (c.realm <= 1 ? 4 : 1.5),
    run: (c, ctx) => {
      const lost = Math.round(c.linhThach * 0.2);
      money(c, -lost);
      const t = hurt(c, r(ctx, 15, 30), ctx);
      stat(c, 'tamMa', 4);
      return `Thấy bạn hiền lành nhịn nhục, đám côn đồ đầu làng chặn đường lấy ${lost} linh thạch, còn đánh cho một trận nhừ tử.${t}`;
    },
  },
  {
    id: 'vu_oan',
    w: () => 2,
    run: (c, ctx) => {
      const t = hurt(c, r(ctx, 20, 35), ctx);
      money(c, -Math.round(c.linhThach * 0.3));
      return `Nhà giàu mất trộm, thấy bạn hiền không dám cãi nên đổ hết tội lên đầu. Bạn bị đánh ba mươi trượng, bồi thường gần hết của cải.${t}`;
    },
  },
  {
    id: 'am_sat_nham',
    w: (c) => (c.realm >= 1 ? 2 : 0.6),
    run: (c, ctx) => {
      const f = fatal(c, ctx, 0.3, 'Sát thủ nhận nhầm người. Một mũi tên tẩm độc bay ra từ bóng tối. Bạn chết mà không biết vì sao.');
      if (c.dead) return f ?? '';
      const t = hurt(c, r(ctx, 30, 50), ctx);
      return `Đêm khuya, sát thủ nhận nhầm bạn là mục tiêu. Bạn trúng một đao, may mà kêu cứu kịp.${t}${f ?? ''}`;
    },
  },
  {
    id: 'cuop_cong',
    w: (c) => (c.realm >= 1 ? 2 : 0),
    run: (c, ctx) => {
      c.cultivation = Math.round(c.cultivation * 0.7);
      const t = hurt(c, r(ctx, 20, 35), ctx);
      return `Đồng môn thấy bạn hiền, lén hút trộm linh khí trong lúc bạn tọa thiền. Tu vi tụt mất ba phần.${t}`;
    },
  },
  {
    id: 'bi_lua',
    w: () => 1.5,
    run: (c, ctx) => {
      const lost = Math.round(c.linhThach * 0.4);
      money(c, -lost);
      stat(c, 'tamMa', 5);
      return `Người quen mượn ${lost} linh thạch, thề sống thề chết sẽ trả. Hôm sau hắn bỏ trốn khỏi trấn. Bạn tức đến mất ngủ.`;
    },
  },
  {
    id: 'lam_bia_do_dan',
    w: (c) => (c.age >= 16 ? 1.2 : 0),
    run: (c, ctx) => {
      const f = fatal(c, ctx, 0.25, 'Hai phe giao chiến, chẳng ai thèm hỏi ý kiến người đứng giữa. Bạn bị đẩy ra làm bia đỡ đạn và không bao giờ về nữa.');
      if (c.dead) return f ?? '';
      const t = hurt(c, r(ctx, 25, 45), ctx);
      return `Bạn hiền quá nên bị sai đi đầu khi môn phái đánh nhau. Mình đầy thương tích mới lết được về.${t}${f ?? ''}`;
    },
  },
];

/** vô thường: xui rủi nhỏ, ai cũng có thể gặp */
const BAD_LUCK: Mishap[] = [
  {
    id: 'nghen',
    w: (c) => (c.age >= c.lifespan * 0.6 ? 3 : 1),
    run: (c, ctx) => {
      const f = fatal(c, ctx, c.age >= c.lifespan * 0.6 ? 0.35 : 0.15, 'Ăn bánh trôi vội quá, bạn bị nghẹn. Tu tiên cả đời, chết vì một viên bánh.');
      if (c.dead) return f ?? '';
      const t = hurt(c, r(ctx, 8, 15), ctx);
      return `Đang ăn thì nghẹn, trợn mắt mãi mới khạc ra được.${t}${f ?? ''}`;
    },
  },
  {
    id: 'truot_chan',
    w: () => 1,
    run: (c, ctx) => {
      const f = fatal(c, ctx, 0.12, 'Trời mưa trơn, bạn trượt chân ngã xuống giếng. Sáng hôm sau người ta mới vớt lên.');
      if (c.dead) return f ?? '';
      const t = hurt(c, r(ctx, 12, 25), ctx);
      return `Trời mưa trơn, bạn trượt chân ngã gãy tay.${t}${f ?? ''}`;
    },
  },
  {
    id: 'ran_can',
    w: (c) => (c.realm <= 1 ? 1 : 0.3),
    run: (c, ctx) => {
      const f = fatal(c, ctx, 0.1, 'Một con rắn lục đuôi đỏ cắn vào gót chân. Độc lan nhanh hơn bạn chạy.');
      if (c.dead) return f ?? '';
      const t = hurt(c, r(ctx, 15, 25), ctx);
      return `Bị rắn cắn, sốt mê man ba ngày.${t}${f ?? ''}`;
    },
  },
  {
    id: 'ngo_doc',
    w: () => 0.8,
    run: (c, ctx) => {
      const t = hurt(c, r(ctx, 10, 20), ctx);
      return `Ăn phải nấm lạ trong rừng, nôn mửa cả tuần.${t}`;
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
  const t = (c.timid = (c.timid ?? 0) + 1);
  if (t === 3) ctx.log('Người trong trấn bắt đầu xì xào: kẻ này hiền như cục đất, bắt nạt cũng chẳng dám kêu.', 'bad');
  // kẻ mạnh, đồ xịn thì ít ai dám động vào
  const guard = 1 / (1 + c.realm * 0.35);
  const bullyP = t >= 3 ? Math.min(0.32, (t - 2) * 0.065) * guard : 0;
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
    const f = fatal(c, ctx, 0.3, 'Ma đạo nghe danh bạn đã lâu. Đêm ấy bảy tên sát thủ cùng ra tay, bạn chết khi đang ngồi thiền.');
    if (c.dead) return f ?? '';
    return `Ma đạo coi bạn là cái gai trong mắt, phái sát thủ đến trừ khử. Bạn đánh lui được nhưng thân mang trọng thương.${hurt(c, r(ctx, 25, 40), ctx)}${f ?? ''}`;
  },
  (c, ctx) => {
    const f = fatal(c, ctx, 0.2, 'Bạn ra tay cứu một cô gái giữa phố, không ngờ sau lưng ác bá là cả một bang phái. Bạn bị vây đánh đến chết.');
    if (c.dead) return f ?? '';
    return `Thấy chuyện bất bình, bạn ra tay trượng nghĩa. Đồng bọn của ác bá kéo đến vây đánh, bạn trọng thương mới thoát được.${hurt(c, r(ctx, 20, 35), ctx)}${f ?? ''}`;
  },
  (c, ctx) => {
    const lost = Math.round(c.linhThach * 0.35);
    money(c, -lost);
    return `Kẻ tiểu nhân lợi dụng lòng tốt của bạn, giả làm người gặp nạn rồi gài bẫy. Bạn mất ${lost} linh thạch, còn bị đâm một nhát.${hurt(c, r(ctx, 15, 25), ctx)}`;
  },
  (c, ctx) => {
    const f = fatal(c, ctx, 0.25, 'Chính tà giao tranh, bạn xung phong đi đầu. Trận ấy chính phái thắng, nhưng bạn không trở về.');
    if (c.dead) return f ?? '';
    return `Chính phái triệu tập đi diệt ma, bạn là người xung phong đầu tiên. Thắng trận, nhưng bạn mang về đầy mình thương tích.${hurt(c, r(ctx, 25, 40), ctx)}${f ?? ''}`;
  },
];

export function righteousPeril(c: Character, ctx: EffectCtx): string | null {
  // chuyện giang hồ phàm giới không còn đuổi theo tiên nhân
  if (c.dead || c.age < 16 || c.cosmos) return null;
  const p = c.daoTam >= 70 ? 0.03 : c.daoTam >= 40 ? 0.018 : 0;
  if (!p || ctx.rnd() >= p) return null;
  ctx.fx('hurt');
  return PERILS[Math.floor(ctx.rnd() * PERILS.length)](c, ctx);
}
