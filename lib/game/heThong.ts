import { ITEMS, realmName, type Item } from './data';
import { hasGift } from './gacha';
import { addCult, addLife, addPill, giveItem, money, reward, stat } from './helpers';
import type { Character, EffectCtx } from './types';
import { tr } from '../i18n';

/**
 * 4.1.0 (#30): Hệ Thống thành buff vàng thật sự. Trói định xong, cứ vài năm Hệ Thống phát một nhiệm vụ có hạn
 * (đột phá, trảm yêu, tích linh thạch, tìm đạo lữ, áp tâm ma), làm xong thì thưởng lớn theo cảnh giới
 * (tu vi, trang bị, thọ nguyên) và Hệ Thống lên cấp. Mỗi cấp: tu luyện +2%, đột phá +1% (tối đa cấp 10).
 * Quá hạn thì bị "điện giật" nhẹ. Người có thiên phú Hệ Thống được gói tân thủ lớn và nhiệm vụ đầu sớm hơn.
 */
export type HtKind = 'dot_pha' | 'tram_yeu' | 'tich_tien' | 'dao_lu' | 'tam_ma';
export interface HtState {
  lv: number;
  next: number; // tuổi phát nhiệm vụ kế
  q?: { k: HtKind; target: number; until: number } | null;
  done?: number;
}
export const HT_MAX = 10;
const bound = (c: Character) => {
  const s = c.arcs?.he_thong?.s ?? 0;
  return s >= 1 && s < 9;
};
export const htLv = (c: Character) => (bound(c) ? (c.ht?.lv ?? 0) : 0);
export const htCultMul = (c: Character) => 1 + 0.02 * Math.min(HT_MAX, htLv(c));
export const htBreak = (c: Character) => 0.01 * Math.min(HT_MAX, htLv(c));
const kills = (c: Character) => Object.values(c.kills ?? {}).reduce((a, b) => a + b, 0);

/** Gọi ngay khi trói định: gói tân thủ (người có thiên phú Hệ Thống được gói lớn) */
export function htBind(c: Character): string {
  c.ht = { lv: 1, next: Math.floor(c.age) + (hasGift(c, 'g_he_thong') ? 1 : 3), q: null, done: 0 };
  if (hasGift(c, 'g_he_thong')) {
    money(c, 300);
    addPill(c, 'tu_khi', 3);
    addPill(c, 'truc_co', 1);
    stat(c, 'khiVan', 5);
    return tr('Gói tân thủ VIP: 300 linh thạch, 3 Tụ Khí Đan, 1 Trúc Cơ Đan, khí vận +5. Hệ Thống cấp 1: tu luyện +2%, đột phá +1%.', 'VIP newbie pack: 300 spirit stones, 3 Qi Gathering Pills, 1 Foundation Pill, Luck +5. System level 1: cultivation +2%, breakthrough +1%.');
  }
  return tr('Hệ Thống cấp 1: tu luyện +2%, đột phá +1%. Làm nhiệm vụ để lên cấp.', 'System level 1: cultivation +2%, breakthrough +1%. Complete quests to level it up.');
}

function newQuest(c: Character, rnd: () => number): NonNullable<HtState['q']> {
  const age = Math.floor(c.age);
  const opts: { k: HtKind; w: number }[] = [
    { k: 'dot_pha', w: 3 },
    { k: 'tram_yeu', w: 2 },
    { k: 'tich_tien', w: 2 },
    { k: 'dao_lu', w: !c.partner && c.age >= 16 ? 1.5 : 0 },
    { k: 'tam_ma', w: c.stats.tamMa >= 35 ? 3 : 0 },
  ];
  const sum = opts.reduce((a, o) => a + o.w, 0);
  let r = rnd() * sum;
  const k = (opts.find((o) => (r -= o.w) <= 0) ?? opts[0]).k;
  if (k === 'dot_pha') return { k, target: c.realm + 1, until: age + (c.cosmos ? 70 : 20 + 10 * c.realm) };
  if (k === 'tram_yeu') return { k, target: kills(c) + 8 + 4 * Math.min(c.realm, 8), until: age + 8 };
  if (k === 'tich_tien') return { k, target: Math.round(c.linhThach + 80 + 150 * c.realm), until: age + 10 };
  if (k === 'dao_lu') return { k, target: 1, until: age + 12 };
  return { k, target: 15, until: age + 6 };
}
export function questText(c: Character, q: NonNullable<HtState['q']>): string {
  const left = Math.max(0, q.until - Math.floor(c.age));
  switch (q.k) {
    case 'dot_pha':
      return tr(`đột phá lên ${realmName(q.target, c.cosmos)} trong ${left} năm`, `break through to ${realmName(q.target, c.cosmos)} within ${left} years`);
    case 'tram_yeu':
      return tr(`trảm thêm ${Math.max(0, q.target - kills(c))} yêu thú trong ${left} năm (chọn Trừ yêu)`, `slay ${Math.max(0, q.target - kills(c))} more demon beasts within ${left} years (pick Hunt demons)`);
    case 'tich_tien':
      return tr(`có trong tay ${q.target} linh thạch trong ${left} năm`, `hold ${q.target} spirit stones within ${left} years`);
    case 'dao_lu':
      return tr(`kết thành đạo lữ trong ${left} năm (chọn Kết duyên)`, `take a Dao companion within ${left} years (pick Romance)`);
    default:
      return tr(`áp tâm ma xuống dưới ${q.target} trong ${left} năm`, `push heart demons below ${q.target} within ${left} years`);
  }
}
const isDone = (c: Character, q: NonNullable<HtState['q']>) =>
  q.k === 'dot_pha' ? c.realm >= q.target : q.k === 'tram_yeu' ? kills(c) >= q.target : q.k === 'tich_tien' ? c.linhThach >= q.target : q.k === 'dao_lu' ? !!c.partner : c.stats.tamMa < q.target;

/** Trang bị thưởng: đồ rơi phẩm Hiếm (cấp cao có Cực phẩm) hợp cảnh giới và con đường, chưa có trong túi */
function gearReward(c: Character, rnd: () => number): Item | null {
  const rare = htLv(c) >= 6 && rnd() < 0.4 ? 3 : 2;
  const lo = c.cosmos ? 8 : Math.max(0, c.realm - 1);
  const hi = c.cosmos ? Math.min(11, c.realm) : Math.min(7, c.realm + 1);
  const pool = ITEMS.filter((i) => i.src === 'drop' && (i.rare ?? 0) === rare && i.minRealm >= lo && i.minRealm <= hi && (!i.path || i.path === c.path) && !c.inventory.includes(i.id));
  return pool.length ? pool[Math.floor(rnd() * pool.length)] : null;
}

/** Mỗi năm: phát nhiệm vụ, kiểm tra hoàn thành hoặc quá hạn */
export function htYear(c: Character, ctx: EffectCtx) {
  if (!bound(c)) return;
  const age = Math.floor(c.age);
  if (!c.ht) c.ht = { lv: 1, next: age + 2, q: null, done: 0 };
  const h = c.ht;
  if (h.q) {
    if (isDone(c, h.q)) {
      const k = h.q.k;
      h.q = null;
      h.done = (h.done ?? 0) + 1;
      h.lv = Math.min(HT_MAX, h.lv + 1);
      h.next = age + 3;
      const cult = reward(c, 0.4 + 0.05 * h.lv);
      addCult(c, cult);
      const parts = [tr(`tu vi +${Math.round(cult)}`, `cultivation +${Math.round(cult)}`)];
      if (k === 'dot_pha' || k === 'tram_yeu' || h.lv % 3 === 0) {
        const it = gearReward(c, ctx.rnd);
        if (it) {
          giveItem(c, it.id, false);
          parts.push(it.name);
        }
      }
      if (k === 'dot_pha' || k === 'dao_lu') {
        addLife(c, 5);
        parts.push(tr('thọ +5 năm', 'lifespan +5 years'));
      }
      if (k === 'tich_tien') {
        stat(c, 'khiVan', 3);
        stat(c, 'ngoTinh', 2);
        parts.push(tr('khí vận +3, ngộ tính +2', 'Luck +3, Insight +2'));
      }
      if (k === 'tam_ma') {
        addPill(c, 'thanh_tam', 2);
        parts.push(tr('2 Thanh Tâm Đan', '2 Clear Mind Pills'));
      }
      ctx.fx('layer', tr('Đinh!', 'Ding!'));
      ctx.log(
        tr(`"Đinh! Nhiệm vụ hoàn thành. Thưởng: ${parts.join(', ')}. Hệ Thống lên cấp ${h.lv}: tu luyện +${2 * h.lv}%, đột phá +${h.lv}%."`, `"Ding! Quest complete. Reward: ${parts.join(', ')}. System level ${h.lv}: cultivation +${2 * h.lv}%, breakthrough +${h.lv}%."`),
        'good',
      );
      return;
    }
    if (age >= h.q.until) {
      h.q = null;
      h.next = age + 3;
      stat(c, 'sucKhoe', -8);
      ctx.log(tr('"Đinh! Nhiệm vụ thất bại. Trừng phạt: điện giật nhẹ." Tóc bạn dựng đứng suốt một tháng.', '"Ding! Quest failed. Penalty: a mild electric shock." Your hair stands on end for a month.'), 'bad');
      return;
    }
    if (h.q.until - age === 2) ctx.log(tr(`"Đinh! Nhắc ký chủ: còn 2 năm để ${questText(c, h.q)}."`, `"Ding! Reminder: 2 years left to ${questText(c, h.q)}."`), 'normal');
    return;
  }
  if (age >= h.next) {
    h.q = newQuest(c, ctx.rnd);
    ctx.log(tr(`"Đinh! Nhiệm vụ mới: ${questText(c, h.q)}. Thưởng lớn, Hệ Thống lên cấp."`, `"Ding! New quest: ${questText(c, h.q)}. Big reward, and the System levels up."`), 'good');
  }
}
