/**
 * Lời thoại trận Phi Kiếm kiểu phim chưởng: mỗi nhịp hai bên hô chiêu, người dẫn kể chiêu va nhau ra sao,
 * ai mất bao nhiêu máu, đỡ đòn thế nào, rồi đôi khi một câu đáp trả.
 */
import { moveOf } from './arena';
import { ultName, type TurnResult } from './arenaFight';
import type { Stance } from './nguHanhDai';
import type { Element, RivalChar } from './types';
import { tr } from '../i18n';

export interface ChatMsg {
  who: 'me' | 'foe' | 'nar';
  text: string;
  hit?: { side: 'me' | 'foe'; v: number }[]; // máu mất trong câu kể, để tô đỏ
  big?: boolean; // tuyệt kỹ, phản kích, kết liễu
}

const pick = <T,>(a: T[], rnd: () => number) => a[Math.floor(rnd() * a.length)];

const EL: Record<Element, { name: string; fx: string }> = {
  kim: { name: tr('Kim', "Metal"), fx: tr('kiếm khí sắc lạnh rít lên', "cold sword qi shrieks through the air") },
  moc: { name: tr('Mộc', "Wood"), fx: tr('dây leo xanh cuộn trào khỏi mặt đài', "green vines surge up from the platform") },
  thuy: { name: tr('Thủy', "Water"), fx: tr('sóng nước dựng thành vách', "the water rises into a wall") },
  hoa: { name: tr('Hỏa', "Fire"), fx: tr('lửa đỏ bùng lên ngùn ngụt', "crimson flames roar skyward") },
  tho: { name: tr('Thổ', "Earth"), fx: tr('đá dưới chân nứt toác, bụi mù bốc lên', "the stone underfoot cracks apart in a cloud of dust") },
};

const SHOUT: Record<Stance, string[]> = {
  cong: [tr('Đỡ chiêu! «{m}»!', "Block this! «{m}»!"), tr('Tiếp ta một chiêu «{m}»!', "Receive my «{m}»!"), tr('Xem «{m}» đây!', "Behold, «{m}»!"), tr('Nạp mạng! «{m}»!', "Give me your life! «{m}»!"), tr('Ăn một chiêu «{m}» của ta!', "Taste my «{m}»!")],
  thu: [tr('Hừ! «{m}» của ta vững như bàn thạch!', "Hmph! My «{m}» stands firm as bedrock!"), tr('«{m}»! Muốn phá? Còn non lắm!', "«{m}»! You want to break it? You're too green!"), tr('Thủ! «{m}»!', "Guard! «{m}»!"), tr('Cứ đánh đi, «{m}» đã giăng sẵn!', "Strike all you like, «{m}» is already in place!")],
  hoa: [tr('Lấy nhu chế cương, «{m}»!', "Softness overcomes hardness, «{m}»!"), tr('«{m}»! Ngươi đánh vào khoảng không rồi!', "«{m}»! You struck empty air!"), tr('Bốn lạng đẩy ngàn cân, «{m}»!', "Four ounces deflect a thousand pounds, «{m}»!"), tr('«{m}», hóa!', "«{m}», dissolve!")],
};

const OUCH = [tr('Khụ... chiêu hay!', "Cough... a fine move!"), tr('Ngươi... được lắm!', "You... not bad at all!"), tr('Chỉ là vết xước!', "Merely a scratch!"), tr('Hự! Ta chưa thua đâu!', "Ugh! I'm not beaten yet!"), tr('Đau thật... nhưng chưa đủ!', "That hurt... but not enough!")];
const TAUNT = [tr('Chỉ thế thôi sao?', "Is that all?"), tr('Còn chiêu nào nữa không?', "Got any other moves?"), tr('Đứng vững vào!', "Stand firm!"), tr('Lần sau nhớ nhìn kỹ!', "Watch more closely next time!"), tr('Hừ, chậm quá!', "Hmph, too slow!")];

const shout = (s: Stance, m: string, rnd: () => number) => pick(SHOUT[s], rnd).replace('{m}', m);

/** Một nhịp đánh thành vài dòng thoại. last: nhịp kết liễu (câu gục ngã do màn trận tự thêm). */
export function chatOf(r: TurnResult, me: RivalChar, foe: RivalChar, rnd: () => number, opt: { comeback?: 'me' | 'foe'; last?: boolean } = {}): ChatMsg[] {
  const out: ChatMsg[] = [];
  const nm = { me: me.name, foe: foe.name };

  if (opt.comeback) {
    const a = opt.comeback;
    const b = a === 'me' ? 'foe' : 'me';
    const v = a === 'me' ? r.toFoe : r.toMe;
    out.push({ who: a, text: tr('Ta chưa thua! Tuyệt địa phản kích!', "I'm not beaten! Last-ditch counterstrike!"), big: true });
    out.push({ who: 'nar', text: tr(`Bị dồn tới đường cùng, ${nm[a]} gầm lên, toàn thân bùng sáng. Một đòn liều mạng đánh thẳng vào ${nm[b]}: mất ${v} máu.`, `Driven to the brink, ${nm[a]} roars as their whole body blazes with light. A desperate blow slams straight into ${nm[b]}: ${v} HP lost.`), hit: [{ side: b, v }], big: true });
    if (!opt.last) out.push({ who: b, text: pick(OUCH, rnd) });
        return out;
  }

  if (r.kind === 'ult_me') {
    out.push({ who: 'me', text: tr(`Tuyệt kỹ, «${ultName(me)}»!!!`, `Ultimate art, «${ultName(me)}»!!!`), big: true });
    out.push({ who: 'nar', text: tr(`Trời đất tối sầm. ${nm.me} dồn toàn bộ nội lực vào một chiêu, ${nm.foe} trúng trọn, mất ${r.toFoe} máu.${r.elemTag === 'khac' ? tr(' Bản mệnh khắc chế, uy lực tăng vọt!', " Natal element counter, power surges!") : ''}`, `Heaven and earth go dark. ${nm.me} pours all their inner force into a single move, and ${nm.foe} takes it full on, losing ${r.toFoe} HP.${r.elemTag === 'khac' ? tr(' Bản mệnh khắc chế, uy lực tăng vọt!', " Natal element counter, power surges!") : ''}`), hit: [{ side: 'foe', v: r.toFoe }], big: true });
    if (!opt.last) out.push({ who: 'foe', text: pick(OUCH, rnd) });
    return out;
  }
  if (r.kind === 'ult_foe') {
    out.push({ who: 'foe', text: tr(`Tuyệt kỹ, «${ultName(foe)}»!!!`, `Ultimate art, «${ultName(foe)}»!!!`), big: true });
    if (r.parry === 'perfect') {
      out.push({ who: 'me', text: tr('Ta đợi chiêu này lâu rồi!', "I've been waiting for this move!") });
      out.push({ who: 'nar', text: tr(`${nm.me} đón đúng nhịp, hóa giải toàn bộ rồi trả lại một chưởng: ${nm.foe} mất ${r.toFoe} máu.`, `${nm.me} meets it right on the beat, dissolves it completely and returns a palm strike: ${nm.foe} loses ${r.toFoe} HP.`), hit: [{ side: 'foe', v: r.toFoe }] });
    } else {
      out.push({
        who: 'nar',
        text: r.parry === 'good' ? tr(`${nm.me} vận khí chống đỡ, chặn được phần lớn nhưng vẫn mất ${r.toMe} máu.`, `${nm.me} channels qi to defend, blocking most of it but still losing ${r.toMe} HP.`) : tr(`${nm.me} chậm một nhịp, trúng trọn tuyệt kỹ, mất ${r.toMe} máu.`, `${nm.me} is a beat too slow and takes the ultimate full on, losing ${r.toMe} HP.`),
        hit: [{ side: 'me', v: r.toMe }],
        big: true,
      });
      if (!opt.last) out.push({ who: 'me', text: pick(OUCH, rnd) });
    }
    return out;
  }

  const my = r.my!;
  const fs = r.foe!;
  const a = moveOf(me, my, rnd);
  const b = moveOf(foe, fs, rnd);
  out.push({ who: 'me', text: shout(my, a, rnd) });
  out.push({ who: 'foe', text: shout(fs, b, rnd) });

  const elA = EL[r.myEl!];
  const elB = EL[r.foeEl!];
  const tag = r.elemTag === 'khac' ? tr(' Hành khắc chế, uy lực tăng vọt!', " Element counter, power surges!") : r.elemTag === 'bi_khac' ? tr(' Hành bị khắc, đòn nhẹ hẳn đi.', " Element countered, the blow weakens.") : '';
  const crit = r.crit ? tr(' Chí mạng!', " Critical hit!") : '';

  if (r.winner === 'clash') {
    out.push({
      who: 'nar',
      text: tr(`«${a}» hệ ${elA.name} va thẳng «${b}» hệ ${elB.name}, ${elA.fx}. Hai luồng chân khí nổ vang, cả hai cùng bật lùi: ${nm.me} mất ${r.toMe}, ${nm.foe} mất ${r.toFoe} máu.`, `${elA.name}-element «${a}» crashes head-on into ${elB.name}-element «${b}», ${elA.fx}. The two currents of true qi explode, and both are thrown back: ${nm.me} loses ${r.toMe}, ${nm.foe} loses ${r.toFoe} HP.`),
      hit: [
        { side: 'me', v: r.toMe },
        { side: 'foe', v: r.toFoe },
      ],
    });
    return out;
  }

  const w = r.winner; // bên đánh trúng
  const l = w === 'me' ? 'foe' : 'me';
  const wm = w === 'me' ? a : b;
  const lm = w === 'me' ? b : a;
  const ws = w === 'me' ? my : fs;
  const ls = w === 'me' ? fs : my;
  const wel = w === 'me' ? elA : elB;
  const v = w === 'me' ? r.toFoe : r.toMe;
  const back = w === 'me' ? r.toMe : r.toFoe;
  let text: string;
  if (ws === 'thu' && back === 0) text = tr(`${nm[l]} lao tới nhưng va phải «${wm}», ${wel.fx}. ${nm[w]} chặn gọn rồi phản một chưởng, ${nm[l]} mất ${v} máu.`, `${nm[l]} charges in but slams into «${wm}», ${wel.fx}. ${nm[w]} blocks cleanly and counters with a palm strike, ${nm[l]} loses ${v} HP.`);
  else if (ws === 'hoa') text = tr(`«${wm}» dẫn lệch «${lm}» sang bên, ${nm[l]} hụt đà. ${nm[w]} thuận thế đánh ngược, ${wel.fx}: ${nm[l]} mất ${v} máu.`, `«${wm}» deflects «${lm}» aside and ${nm[l]} overreaches. ${nm[w]} turns the momentum back on them, ${wel.fx}: ${nm[l]} loses ${v} HP.`);
  else if (ls === 'thu') text = tr(`«${wm}» hệ ${wel.name} đập vỡ «${lm}», ${wel.fx}. ${nm[l]} lùi ba bước, mất ${v} máu.`, `${wel.name}-element «${wm}» shatters «${lm}», ${wel.fx}. ${nm[l]} staggers back three steps, losing ${v} HP.`);
  else text = tr(`«${wm}» tới trước một nhịp, ${wel.fx}. «${lm}» chưa kịp thành hình thì ${nm[l]} đã trúng đòn, mất ${v} máu.`, `«${wm}» lands a beat earlier, ${wel.fx}. Before «${lm}» can even take shape, ${nm[l]} is hit, losing ${v} HP.`);
  const hit: ChatMsg['hit'] = [{ side: l, v }];
  if (back > 0) {
    text += tr(` ${nm[w]} cũng dính dư chấn, mất ${back} máu.`, ` ${nm[w]} is caught in the backlash too, losing ${back} HP.`);
    hit.push({ side: w, v: back });
  }
  out.push({ who: 'nar', text: text + tag + crit, hit, big: r.crit });
  if (!opt.last && rnd() < 0.45) out.push(rnd() < 0.5 ? { who: l, text: pick(OUCH, rnd) } : { who: w, text: pick(TAUNT, rnd) });
  return out;
}

/** Câu kết khi một bên gục */
export const koLine = (name: string): ChatMsg => ({ who: 'nar', text: tr(`${name} khuỵu xuống, chân khí tán loạn, không gượng dậy nổi nữa.`, `${name} drops to one knee, true qi scattered, unable to rise again.`), big: true });
