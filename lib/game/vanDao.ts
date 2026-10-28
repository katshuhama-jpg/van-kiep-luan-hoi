/**
 * Chứng Đạo mới (ở Tiên giới, Ma giới): Tứ Kiếp Vấn Đạo rồi 13 đạo lôi kiếp.
 * Mỗi kiếp là một tấm thẻ đọc rồi bấm: lựa chọn nào cũng hiện sẵn tỉ lệ, không bắt người chơi tính toán.
 * Trượt một kiếp: máu còn 1%, rớt một đại cảnh giới. Hụt từ 4 đạo lôi: vạn kiếp trước đứng ra đỡ (Vạn Kiếp Hộ Đạo).
 */
import { TOP_REALM } from './data';
import { clamp, needFor, stat } from './helpers';
import type { Character, EffectCtx } from './types';
import { tr } from '../i18n';

export const LOI_TOTAL = 13;
export const LOI_ALLOW = 3; // hụt tối đa 3 đạo vẫn tự chứng đạo
export const VAN_DAO_DELAY = 10; // trượt tứ kiếp: chờ 10 năm mới được thử lại (sau khi tu lại)

/** Thái Hư giữ cách kết thúc riêng; Tiên giới, Ma giới dùng Chứng Đạo mới */
export const usesVanDao = (c: Pick<Character, 'realm' | 'cosmos'>) => c.realm >= TOP_REALM && (c.cosmos === 'tien' || c.cosmos === 'ma');

export interface KiepChoice {
  label: string;
  chance: number;
  ok: string;
  fail: string;
}
export interface KiepCard {
  key: 'tam_ma' | 'ai_no' | 'van_tam' | 'van_thien';
  name: string;
  text: string;
  choices: KiepChoice[];
}

const pct = (x: number) => clamp(Math.round(x * 100) / 100, 0.1, 0.95);

function tamMa(c: Character): KiepCard {
  const s = c.stats;
  return {
    key: 'tam_ma',
    name: tr('Tâm Ma Kiếp', "Heart Demon Trial"),
    text: tr(`Lôi vân rẽ ra. Bước ra từ bóng tối là chính bạn, mắt đỏ như máu, cười đúng nụ cười của bạn. "Vạn năm tu đạo, ngươi đã giết bao nhiêu người? Ngươi nghĩ mình xứng sao?"`, `The thunderclouds part. Out of the dark steps you yourself, eyes red as blood, smiling your exact smile. "Ten thousand years of cultivation - how many have you killed? Do you think you deserve this?"`),
    choices: [
      { label: tr('Rút kiếm chém nó', "Draw your sword and cut it down"), chance: pct(0.45 + (s.tamCanh - s.tamMa) / 160), ok: tr('Một kiếm chém đôi bóng ma. Tâm bạn lặng như mặt hồ.', "One stroke splits the demon in two. Your heart is still as a lake."), fail: tr('Kiếm chém vào bóng mà máu chảy ra từ người bạn. Chém nó là chém chính mình.', "The blade cuts the shadow, but the blood flows from you. To cut it is to cut yourself.") },
      { label: tr('Nhận nó là một phần của mình', "Accept it as part of yourself"), chance: pct(0.6 + s.tamCanh / 400 - s.tamMa / 250), ok: tr('Bạn ôm lấy bóng ma. Nó tan vào ngực bạn, không còn là ma nữa.', "You embrace the demon. It melts into your chest and is a demon no longer."), fail: tr('Bóng ma cười lớn, chui vào ngực bạn và cắn nát đạo tâm từ bên trong.', "The demon laughs, crawls into your chest and gnaws your Dao Heart from within.") },
    ],
  };
}

function aiNo(c: Character): KiepCard {
  const who = c.partner ?? c.enemy ?? tr('mẹ của bạn', "your mother");
  const lean = c.daoTam >= 20 ? 1 : c.daoTam <= -20 ? -1 : 0;
  return {
    key: 'ai_no',
    name: tr('Ái Nộ Kiếp', "Love and Wrath Trial"),
    text: tr(`Giữa lôi quang hiện ra bóng ${who}, đưa tay về phía bạn: "Ở lại đi. Thành đạo rồi, ai còn nhớ tới ai?"`, `In the lightning appears the shadow of ${who}, reaching for you: "Stay. Once you attain the Dao, who will remember whom?"`),
    choices: [
      { label: tr('Buông tay, bước tiếp', "Let go and walk on"), chance: pct(lean > 0 ? 0.82 : lean < 0 ? 0.5 : 0.68), ok: tr('Bạn buông tay. Bóng người mỉm cười rồi tan vào gió, như đã chờ bạn làm vậy từ lâu.', "You let go. The figure smiles and fades into the wind, as if it had long waited for this."), fail: tr('Bạn buông tay, nhưng lòng không buông. Lôi kiếp nghe được tiếng lòng ấy.', "Your hand lets go, but your heart does not. The tribulation hears it.") },
      { label: tr('Nắm chặt, mang theo cả vào đạo', "Hold on and carry them into the Dao"), chance: pct(lean < 0 ? 0.82 : lean > 0 ? 0.5 : 0.68), ok: tr('Bạn nắm chặt tay ấy. Thiên Đạo im lặng: có kẻ không chịu buông mà vẫn đi được tới đây.', "You grip that hand. The Heavenly Dao falls silent: someone who would not let go has still come this far."), fail: tr('Bàn tay ấy hóa thành xiềng xích, kéo bạn khỏi đỉnh lôi.', "That hand turns into a chain and drags you off the peak.") },
    ],
  };
}

/** Câu hỏi về chính đời mình, lấy từ gia phả: một dòng thật và hai dòng ở năm khác */
function vanTam(c: Character, rnd: () => number): KiepCard {
  const logs = (c.log ?? []).filter((l) => (l.tone === 'big' || l.tone === 'good') && l.age >= 6 && l.text.length > 20);
  const pick = logs.length ? logs[Math.floor(rnd() * logs.length)] : null;
  const short = (t: string) => (t.length > 70 ? t.slice(0, 68).trimEnd() + '...' : t);
  if (!pick) {
    return {
      key: 'van_tam',
      name: tr('Vấn Tâm Kiếp', "Heart-Questioning Trial"),
      text: tr('Một giọng nói vang lên trong đầu: "Ngươi còn nhớ mình là ai không?"', 'A voice echoes in your head: "Do you still remember who you are?"'),
      choices: [{ label: tr(`Ta là ${c.name}`, `I am ${c.name}`), chance: 0.85, ok: tr('Giọng nói im bặt.', "The voice falls silent."), fail: tr('Bạn nói ra tên mình mà nghe như tên người lạ.', "You say your name, and it sounds like a stranger's.") }],
    };
  }
  const others = logs.filter((l) => l.age !== pick.age);
  const fakes: string[] = [];
  while (fakes.length < 2 && others.length) fakes.push(others.splice(Math.floor(rnd() * others.length), 1)[0].text);
  const opts = [{ t: pick.text, right: true }, ...fakes.map((t) => ({ t, right: false }))].sort(() => rnd() - 0.5);
  return {
    key: 'van_tam',
    name: tr('Vấn Tâm Kiếp', "Heart-Questioning Trial"),
    text: tr(`Một giọng nói hỏi: "Năm ${pick.age} tuổi, chuyện gì đã xảy ra với ngươi?"`, `A voice asks: "When you were ${pick.age}, what happened to you?"`),
    choices: opts.map((o) => ({
      label: short(o.t),
      chance: o.right ? 0.95 : 0.4,
      ok: o.right ? tr('Bạn nhớ rõ từng chi tiết. Đạo tâm càng vững.', "You remember every detail. Your Dao Heart grows firmer.") : tr('Giọng nói cười khẽ: "Nhớ nhầm rồi. Nhưng ngươi vẫn đi tới đây." Bạn được cho qua.', 'The voice chuckles: "Wrong memory. But you still made it here." You are let through.'),
      fail: tr('"Đến đời mình còn không nhớ, lấy gì mà chứng đạo?"', '"You cannot even remember your own life. How will you attain the Dao?"'),
    })),
  };
}

function vanThien(c: Character): KiepCard {
  const lean = c.daoTam >= 20 ? 1 : c.daoTam <= -20 ? -1 : 0;
  const m = (want: number) => pct(lean === want ? 0.85 : 0.45);
  return {
    key: 'van_thien',
    name: tr('Vấn Thiên Kiếp', "Heaven-Questioning Trial"),
    text: tr('Bầu trời mở ra một con mắt. Thiên Đạo hỏi, giọng như sấm: "Vì sao ngươi tu đạo?"', 'The sky opens a single eye. The Heavenly Dao asks, voice like thunder: "Why do you cultivate?"'),
    choices: [
      { label: tr('Vì chúng sinh', "For all living beings"), chance: m(1), ok: tr('Con mắt khép lại, như gật đầu.', "The eye closes, as if nodding."), fail: tr('"Lời hay. Tiếc là không thật."', '"Fine words. Pity they are not true."') },
      { label: tr('Vì chính ta, không vì ai cả', "For myself and no one else"), chance: m(-1), ok: tr('Thiên Đạo cười lớn: "Thật thà. Đi đi."', 'The Heavenly Dao laughs aloud: "Honest. Go on."'), fail: tr('"Chỉ vì mình thì sao chịu nổi sức nặng của trời?"', '"If only for yourself, how will you bear the weight of heaven?"') },
      { label: tr('Vì muốn biết vì sao phải sống', "To learn why we must live"), chance: m(0), ok: tr('Con mắt nhìn bạn rất lâu: "Ta cũng muốn biết."', 'The eye gazes at you for a long time: "I would like to know too."'), fail: tr('"Câu hỏi hay. Ngươi chưa đủ để hỏi."', '"A good question. You are not yet worthy to ask it."') },
    ],
  };
}

/** Tấm thẻ thứ step (0-3) của Tứ Kiếp Vấn Đạo */
export function tuKiep(c: Character, step: number, rnd: () => number): KiepCard {
  return [tamMa, aiNo, (x: Character) => vanTam(x, rnd), vanThien][step](c);
}

/** Trượt một kiếp: máu còn 1%, rớt một đại cảnh giới, chờ tu lại */
export function failVanDao(c: Character, ctx: EffectCtx, kiep: string): string {
  c.realm = TOP_REALM - 1;
  c.layer = 3;
  c.cultivation = Math.round(needFor(c) * 0.5);
  c.stats.sucKhoe = 1;
  c.breakDelay = VAN_DAO_DELAY;
  stat(c, 'tamMa', 10);
  ctx.fx('hurt', tr('Đạo cơ rạn', "Dao foundation cracked"));
  return tr(`Trượt ${kiep}. Đạo cơ rạn vỡ, máu chỉ còn một sợi, cảnh giới rơi xuống một bậc. Muốn chứng đạo phải tu lại từ đầu.`, `You failed the ${kiep}. Your Dao foundation cracks, your life hangs by a thread, and your realm drops one level. To attain the Dao you must climb again.`);
}

/** Không đủ vạn kiếp đỡ lôi: hóa thành bóng đứng đầu hàng, chờ kiếp sau */
export function daoKhon(c: Character): string {
  c.dead = true;
  c.endTag = 'dao_khon';
  c.cause = tr('Hóa thành bóng, đứng đầu hàng vạn kiếp chờ lần sau đỡ lôi', "Became a shadow at the head of ten thousand lives, waiting to take the lightning next time");
  return tr('Bạn ngã xuống, hóa thành bóng đứng đầu hàng. Lần sau, bạn sẽ là người đỡ.', "You fall, and become the shadow at the head of the line. Next time, you will be the one who shields.");
}
