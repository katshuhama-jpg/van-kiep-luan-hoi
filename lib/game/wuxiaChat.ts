/**
 * Lời thoại trận Phi Kiếm kiểu phim chưởng: mỗi nhịp hai bên hô chiêu, người dẫn kể chiêu va nhau ra sao,
 * ai mất bao nhiêu máu, đỡ đòn thế nào, rồi đôi khi một câu đáp trả.
 */
import { moveOf } from './arena';
import { ultName, type TurnResult } from './arenaFight';
import type { Stance } from './nguHanhDai';
import type { Element, RivalChar } from './types';

export interface ChatMsg {
  who: 'me' | 'foe' | 'nar';
  text: string;
  hit?: { side: 'me' | 'foe'; v: number }[]; // máu mất trong câu kể, để tô đỏ
  big?: boolean; // tuyệt kỹ, phản kích, kết liễu
}

const pick = <T,>(a: T[], rnd: () => number) => a[Math.floor(rnd() * a.length)];

const EL: Record<Element, { name: string; fx: string }> = {
  kim: { name: 'Kim', fx: 'kiếm khí sắc lạnh rít lên' },
  moc: { name: 'Mộc', fx: 'dây leo xanh cuộn trào khỏi mặt đài' },
  thuy: { name: 'Thủy', fx: 'sóng nước dựng thành vách' },
  hoa: { name: 'Hỏa', fx: 'lửa đỏ bùng lên ngùn ngụt' },
  tho: { name: 'Thổ', fx: 'đá dưới chân nứt toác, bụi mù bốc lên' },
};

const SHOUT: Record<Stance, string[]> = {
  cong: ['Đỡ chiêu! «{m}»!', 'Tiếp ta một chiêu «{m}»!', 'Xem «{m}» đây!', 'Nạp mạng! «{m}»!', 'Ăn một chiêu «{m}» của ta!'],
  thu: ['Hừ! «{m}» của ta vững như bàn thạch!', '«{m}»! Muốn phá? Còn non lắm!', 'Thủ! «{m}»!', 'Cứ đánh đi, «{m}» đã giăng sẵn!'],
  hoa: ['Lấy nhu chế cương, «{m}»!', '«{m}»! Ngươi đánh vào khoảng không rồi!', 'Bốn lạng đẩy ngàn cân, «{m}»!', '«{m}», hóa!'],
};

const OUCH = ['Khụ... chiêu hay!', 'Ngươi... được lắm!', 'Chỉ là vết xước!', 'Hự! Ta chưa thua đâu!', 'Đau thật... nhưng chưa đủ!'];
const TAUNT = ['Chỉ thế thôi sao?', 'Còn chiêu nào nữa không?', 'Đứng vững vào!', 'Lần sau nhớ nhìn kỹ!', 'Hừ, chậm quá!'];

const shout = (s: Stance, m: string, rnd: () => number) => pick(SHOUT[s], rnd).replace('{m}', m);

/** Một nhịp đánh thành vài dòng thoại. last: nhịp kết liễu (câu gục ngã do màn trận tự thêm). */
export function chatOf(r: TurnResult, me: RivalChar, foe: RivalChar, rnd: () => number, opt: { comeback?: 'me' | 'foe'; last?: boolean } = {}): ChatMsg[] {
  const out: ChatMsg[] = [];
  const nm = { me: me.name, foe: foe.name };

  if (opt.comeback) {
    const a = opt.comeback;
    const b = a === 'me' ? 'foe' : 'me';
    const v = a === 'me' ? r.toFoe : r.toMe;
    out.push({ who: a, text: 'Ta chưa thua! Tuyệt địa phản kích!', big: true });
    out.push({ who: 'nar', text: `Bị dồn tới đường cùng, ${nm[a]} gầm lên, toàn thân bùng sáng. Một đòn liều mạng đánh thẳng vào ${nm[b]}: mất ${v} máu.`, hit: [{ side: b, v }], big: true });
    if (!opt.last) out.push({ who: b, text: pick(OUCH, rnd) });
        return out;
  }

  if (r.kind === 'ult_me') {
    out.push({ who: 'me', text: `Tuyệt kỹ, «${ultName(me)}»!!!`, big: true });
    out.push({ who: 'nar', text: `Trời đất tối sầm. ${nm.me} dồn toàn bộ nội lực vào một chiêu, ${nm.foe} trúng trọn, mất ${r.toFoe} máu.${r.elemTag === 'khac' ? ' Bản mệnh khắc chế, uy lực tăng vọt!' : ''}`, hit: [{ side: 'foe', v: r.toFoe }], big: true });
    if (!opt.last) out.push({ who: 'foe', text: pick(OUCH, rnd) });
    return out;
  }
  if (r.kind === 'ult_foe') {
    out.push({ who: 'foe', text: `Tuyệt kỹ, «${ultName(foe)}»!!!`, big: true });
    if (r.parry === 'perfect') {
      out.push({ who: 'me', text: 'Ta đợi chiêu này lâu rồi!' });
      out.push({ who: 'nar', text: `${nm.me} đón đúng nhịp, hóa giải toàn bộ rồi trả lại một chưởng: ${nm.foe} mất ${r.toFoe} máu.`, hit: [{ side: 'foe', v: r.toFoe }] });
    } else {
      out.push({
        who: 'nar',
        text: r.parry === 'good' ? `${nm.me} vận khí chống đỡ, chặn được phần lớn nhưng vẫn mất ${r.toMe} máu.` : `${nm.me} chậm một nhịp, trúng trọn tuyệt kỹ, mất ${r.toMe} máu.`,
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
  const tag = r.elemTag === 'khac' ? ' Hành khắc chế, uy lực tăng vọt!' : r.elemTag === 'bi_khac' ? ' Hành bị khắc, đòn nhẹ hẳn đi.' : '';
  const crit = r.crit ? ' Chí mạng!' : '';

  if (r.winner === 'clash') {
    out.push({
      who: 'nar',
      text: `«${a}» hệ ${elA.name} va thẳng «${b}» hệ ${elB.name}, ${elA.fx}. Hai luồng chân khí nổ vang, cả hai cùng bật lùi: ${nm.me} mất ${r.toMe}, ${nm.foe} mất ${r.toFoe} máu.`,
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
  if (ws === 'thu' && back === 0) text = `${nm[l]} lao tới nhưng va phải «${wm}», ${wel.fx}. ${nm[w]} chặn gọn rồi phản một chưởng, ${nm[l]} mất ${v} máu.`;
  else if (ws === 'hoa') text = `«${wm}» dẫn lệch «${lm}» sang bên, ${nm[l]} hụt đà. ${nm[w]} thuận thế đánh ngược, ${wel.fx}: ${nm[l]} mất ${v} máu.`;
  else if (ls === 'thu') text = `«${wm}» hệ ${wel.name} đập vỡ «${lm}», ${wel.fx}. ${nm[l]} lùi ba bước, mất ${v} máu.`;
  else text = `«${wm}» tới trước một nhịp, ${wel.fx}. «${lm}» chưa kịp thành hình thì ${nm[l]} đã trúng đòn, mất ${v} máu.`;
  const hit: ChatMsg['hit'] = [{ side: l, v }];
  if (back > 0) {
    text += ` ${nm[w]} cũng dính dư chấn, mất ${back} máu.`;
    hit.push({ side: w, v: back });
  }
  out.push({ who: 'nar', text: text + tag + crit, hit, big: r.crit });
  if (!opt.last && rnd() < 0.45) out.push(rnd() < 0.5 ? { who: l, text: pick(OUCH, rnd) } : { who: w, text: pick(TAUNT, rnd) });
  return out;
}

/** Câu kết khi một bên gục */
export const koLine = (name: string): ChatMsg => ({ who: 'nar', text: `${name} khuỵu xuống, chân khí tán loạn, không gượng dậy nổi nữa.`, big: true });
