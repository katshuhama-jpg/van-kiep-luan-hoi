/**
 * Lôi đài Phi Kiếm (3.2.0): một trận khoảng 25 giây, một ngón tay.
 * 1. Phi kiếm phá hộ thể 12 giây: chạm là phóng kiếm vào vòng hộ thể đang xoay. Trúng chỗ trống +1 kiếm,
 *    trúng thanh đã cắm là "Phản phệ" (mất liên kích). Đủ 10 kiếm thì vỡ một tầng, vòng mới nhanh hơn.
 * 2. Hai bóng tự đánh theo bộ trận máu sẵn có. Số kiếm quy ra sức mạnh: 70% + 2% mỗi kiếm, tối đa 130% ở 30 kiếm.
 *    Bên tụt dưới 30% máu lần đầu được "tuyệt địa phản kích" một đòn, để trận hay kết thúc sát nút.
 * 3. Đòn cuối chậm lại, đóng dấu THẮNG hoặc BẠI.
 */
import { equalize, type ArenaRule } from './arena';
import { KI_MAX, TURN_CAP, apply, autoPick, foeIntent, foeUlt, handOf, myUlt, newFight, trade, type FightState, type Parry, type TurnResult } from './arenaFight';
import type { RivalChar } from './types';
import { tr } from '../i18n';

export const PK_SECONDS = 12;
export const PK_PER_LAYER = 10;
export const PK_HIT_DEG = 17; // kiếm mới cách kiếm cũ dưới ngần này độ là đụng
export const PK_COOLDOWN = 140; // ms giữa hai lần phóng

/** Sức mạnh từ số kiếm cắm được */
export const powerOf = (swords: number) => Math.min(1.3, 0.7 + swords * 0.02);

/** Tốc độ vòng hộ thể (độ mỗi giây) theo tầng và độ mạnh của bóng đối thủ (base là cơ hội thắng của mình, 0..1) */
export function ringSpeed(layer: number, base: number): number {
  const foeEdge = Math.max(-0.2, Math.min(0.2, 0.5 - base)); // đối thủ mạnh hơn thì xoay nhanh hơn
  return (95 + layer * 32) * (1 + foeEdge);
}

/** Bước của trận tự đánh, để giao diện phát lại từng nhịp */
export interface ClashStep {
  r: TurnResult;
  st: FightState; // trạng thái sau bước này
  comeback?: 'me' | 'foe'; // đòn tuyệt địa phản kích
}
export interface Clash {
  steps: ClashStep[];
  win: boolean;
  hpPct: number; // máu còn lại của bên thắng, %
  meHp: number;
  foeHp: number;
}

/** Hai bóng tự đánh tới khi một bên gục. power nhân sát thương mình gây, chia sát thương mình nhận. */
export function autoClash(me: RivalChar, foe0: RivalChar, base: number, rule: ArenaRule, power: number, rnd: () => number = Math.random): Clash {
  const foe = equalize(foe0, me);
  let st = newFight(rule);
  const steps: ClashStep[] = [];
  const meMul = power;
  const foeMul = 1 / Math.sqrt(power);
  let meCb = false;
  let foeCb = false;
  let pendingCb: 'me' | 'foe' | null = null;
  for (let guard = 0; guard < TURN_CAP + 4 && !st.over; guard++) {
    let r: TurnResult;
    let comeback: ClashStep['comeback'];
    if (pendingCb) {
      // tuyệt địa phản kích: chắc chắn trúng, mạnh như một tuyệt kỹ nhỏ
      comeback = pendingCb;
      const dmg = Math.round((pendingCb === 'me' ? st.foe.max : st.me.max) * (0.16 + rnd() * 0.06));
      r = { kind: pendingCb === 'me' ? 'ult_me' : 'ult_foe', winner: pendingCb, toFoe: pendingCb === 'me' ? dmg : 0, toMe: pendingCb === 'foe' ? dmg : 0, crit: false, elemTag: null, parry: pendingCb === 'foe' ? 'miss' : undefined };
      pendingCb = null;
    } else if (st.foeUltNext) {
      // kiếm nhiều thì đỡ tuyệt kỹ khéo hơn
      const x = rnd();
      const q: Parry = x < 0.12 + (power - 0.7) * 0.4 ? 'perfect' : x < 0.55 + (power - 0.7) * 0.3 ? 'good' : 'miss';
      r = foeUlt(me, foe, base, st, rule, q);
    } else if (st.me.ki >= KI_MAX) {
      r = myUlt(me, foe, base, st, rule);
    } else {
      const it = foeIntent(foe, st, rule, rnd, me);
      const hand = handOf(me, rnd);
      // bóng tự đánh: đoán theo ý đồ để lộ khoảng 3 lần trong 10
      const pk = rnd() < 0.3 ? autoPick(it, hand, rule, rnd) : { s: (['cong', 'thu', 'hoa'] as const)[Math.floor(rnd() * 3)], el: hand[Math.floor(rnd() * hand.length)] };
      r = trade(st, base, pk.s, pk.el, it, rule, rnd);
    }
    r = { ...r, toFoe: Math.round(r.toFoe * meMul), toMe: Math.round(r.toMe * foeMul) };
    const next = apply(st, r);
    // vừa tụt dưới 30% lần đầu mà chưa gục: lượt sau phản kích
    if (!next.over) {
      if (!meCb && next.me.hp / next.me.max < 0.3) {
        meCb = true;
        pendingCb = 'me';
      } else if (!foeCb && next.foe.hp / next.foe.max < 0.3) {
        foeCb = true;
        pendingCb = 'foe';
      }
    }
    st = next;
    steps.push({ r, st, comeback });
  }
  const win = st.over === 'win';
  const side = win ? st.me : st.foe;
  return { steps, win, hpPct: Math.max(1, Math.round((side.hp / side.max) * 100)), meHp: st.me.hp, foeHp: st.foe.hp };
}

/** Bậc lôi đài theo điểm tuần */
export const ARENA_TIERS = [
  { pts: 3, name: tr('Luyện Khí', "Qi Refining") },
  { pts: 9, name: tr('Trúc Cơ', "Foundation") },
  { pts: 18, name: tr('Kim Đan', "Golden Core") },
  { pts: 30, name: tr('Nguyên Anh', "Nascent Soul") },
  { pts: 42, name: tr('Hóa Thần', "Spirit Transformation") },
  { pts: 54, name: tr('Độ Kiếp', "Tribulation") },
];
/** Bậc hiện tại (0 = chưa vào bậc) và điểm còn thiếu để lên bậc kế */
export function tierOfPts(pts: number): { n: number; name: string; next: { name: string; need: number } | null } {
  let n = 0;
  for (let i = 0; i < ARENA_TIERS.length; i++) if (pts >= ARENA_TIERS[i].pts) n = i + 1;
  const nx = ARENA_TIERS[n];
  return { n, name: n ? ARENA_TIERS[n - 1].name : tr('Chưa vào bậc', "Unranked"), next: nx ? { name: nx.name, need: nx.pts - pts } : null };
}

export const ARENA_WIN_PHUC = 10;
export const ARENA_LOSE_PHUC = 3;
export const ARENA_DAY_HON = 15;
export const ARENA_TIER_PHUC = 5;
