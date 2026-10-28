/**
 * Vạn kiếp: các kiếp đã qua của chính người chơi, dựng lại thành bóng pixel.
 * Phần dùng chung: lấy danh sách kiếp, đổi sang nhân vật để vẽ, câu khắc bia, sức hộ đạo.
 * Dùng ở màn cáo biệt (hàng bóng sau lưng) và Vạn Kiếp Hộ Đạo khi chứng đạo.
 */
import { supabase } from './supabase';
import { localLives } from './storage';
import { toRival } from './social';
import type { Player } from './auth';
import type { RivalChar } from './game/types';
import { tr } from './i18n';

export interface PastSelf {
  id: string;
  lifeNo: number;
  name: string;
  age: number;
  realm: number;
  ascended: boolean;
  cause: string | null;
  epitaph: string | null;
  at: string; // lúc mất (ISO)
  endTag: string | null;
  rival: RivalChar; // để vẽ bằng foeChar + Sprite
}

type Row = { id: number | string; created_at?: string; life_no: number; char_name: string; age: number; realm_no?: number | null; layer_no?: number | null; ascended: boolean; cause: string | null; epitaph: string | null; dao_tam?: number; look?: Record<string, unknown> | null };

function toSelf(r: Row, player: string): PastSelf | null {
  const look = (r.look ?? {}) as Record<string, unknown>;
  const rival = toRival(player, { ...look, name: r.char_name, age: r.age, realm: r.realm_no ?? 0, layer: r.layer_no ?? 1, daoTam: r.dao_tam ?? 0, lifeNo: r.life_no, alive: false });
  if (!rival) return null;
  return { id: String(r.id), lifeNo: r.life_no, name: r.char_name, age: r.age, realm: r.realm_no ?? 0, ascended: !!r.ascended, cause: r.cause, epitaph: r.epitaph, at: r.created_at ?? new Date().toISOString(), endTag: typeof look.endTag === 'string' ? look.endTag : null, rival };
}

/** Các kiếp đã qua, kiếp cũ trước. Đăng nhập thì lấy trên máy chủ, khách thì lấy trên máy. */
export async function loadPastSelves(user: Player | null, limit = 300): Promise<PastSelf[]> {
  const sb = supabase();
  let rows: Row[] = [];
  if (user && sb) {
    const { data } = await sb
      .from('vkl_lives')
      .select('id, created_at, life_no, char_name, age, realm_no, layer_no, ascended, cause, epitaph, dao_tam, look')
      .eq('player_name', user.username)
      .order('created_at', { ascending: true })
      .limit(limit);
    rows = (data as Row[] | null) ?? [];
  } else rows = localLives().slice().reverse() as unknown as Row[];
  return rows.map((r) => toSelf(r, user?.username ?? '')).filter((x): x is PastSelf => !!x);
}

/** Sức một kiếp trước đỡ lôi kiếp thay mình: tính theo cảnh giới lúc chết */
export function hoDaoPower(p: Pick<PastSelf, 'realm' | 'ascended'>): number {
  if (p.ascended || p.realm >= 8) return 2;
  if (p.realm >= 7) return 1.4;
  if (p.realm >= 5) return 1;
  if (p.realm >= 3) return 0.6;
  if (p.realm >= 1) return 0.4;
  return 0.2;
}

/** Lời để lại của một kiếp: câu khắc bia người chơi tự viết, không có thì lấy cách chết */
export function lastWords(p: Pick<PastSelf, 'epitaph' | 'cause'>): string {
  return (p.epitaph && p.epitaph.trim()) || p.cause || '...';
}

/** Mỗi đạo lôi chỉ một kiếp đỡ được: tối đa 13 kiếp lao lên, nên farm nhiều kiếp chết yểu không giúp gì */
export const HO_DAO_MAX = 13;

/** Sức đỡ tối đa của vạn kiếp: cộng 13 kiếp mạnh nhất */
export function hoDaoCap(lives: Pick<PastSelf, 'realm' | 'ascended'>[]): number {
  const top = lives.map(hoDaoPower).sort((a, b) => b - a).slice(0, HO_DAO_MAX);
  return Math.round(top.reduce((a, x) => a + x, 0) * 10) / 10;
}

/** Đội hộ đạo: lấy các kiếp mạnh trước cho tới khi đủ số đạo lôi cần đỡ, tối đa 13 kiếp */
export function hoDaoTeam(lives: PastSelf[], need: number): { team: PastSelf[]; total: number; saved: boolean } {
  const sorted = lives.slice().sort((a, b) => hoDaoPower(b) - hoDaoPower(a) || a.lifeNo - b.lifeNo);
  const team: PastSelf[] = [];
  let total = 0;
  for (const p of sorted) {
    if (total >= need || team.length >= HO_DAO_MAX) break;
    team.push(p);
    total += hoDaoPower(p);
  }
  // đỡ theo thứ tự kiếp cũ trước cho giống một đoàn người đi qua thời gian
  team.sort((a, b) => a.lifeNo - b.lifeNo);
  return { team, total: Math.round(total * 10) / 10, saved: total >= need };
}

/** Kiếp từng chết dưới thiên kiếp: lần sau hộ đạo đỡ lôi mạnh gấp rưỡi (báo thù thiên kiếp) */
export const lightningGrudge = (p: Pick<PastSelf, 'cause'>) => /thiên kiếp|lôi kiếp|thiên lôi|tribulation|lightning/i.test(p.cause ?? '');

/** Bóng đủ sức ra tay ở Ngũ Hành Đài và thiên kiếp phi thăng: từ Hóa Thần trở lên, kiếp mạnh trước */
export function helpersFor(lives: PastSelf[], minRealm = 5): PastSelf[] {
  return lives
    .filter((p) => p.ascended || p.realm >= minRealm)
    .sort((a, b) => hoDaoPower(b) - hoDaoPower(a) || Number(lightningGrudge(b)) - Number(lightningGrudge(a)) || b.lifeNo - a.lifeNo);
}

// ---------- Ngày giỗ ----------
const DAY = 86400000;
/** Số ngày từ lúc mất tới hôm nay, tính theo lịch máy (nửa đêm) */
export function daysSince(iso: string, now = Date.now()): number {
  const a = new Date(iso);
  const b = new Date(now);
  const d0 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const d1 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((d1 - d0) / DAY);
}

/** Các mốc giỗ: tuần đầu, 49 ngày, 100 ngày, giỗ đầu và các năm sau */
export function gioName(days: number): string | null {
  if (days === 7) return tr('tròn 7 ngày', '7 days');
  if (days === 49) return tr('tròn 49 ngày', '49 days');
  if (days === 100) return tr('tròn 100 ngày', '100 days');
  if (days > 0 && days % 365 === 0) return days === 365 ? tr('giỗ đầu', 'one year') : tr(`giỗ năm thứ ${days / 365}`, `${days / 365} years`);
  return null;
}

/** Kiếp có ngày giỗ hôm nay: lấy kiếp mạnh nhất trong số đó */
export function gioToday(lives: PastSelf[], now = Date.now()): { p: PastSelf; days: number; label: string } | null {
  const hits = lives
    .map((p) => ({ p, days: daysSince(p.at, now) }))
    .map((x) => ({ ...x, label: gioName(x.days) }))
    .filter((x): x is { p: PastSelf; days: number; label: string } => !!x.label);
  if (!hits.length) return null;
  hits.sort((a, b) => hoDaoPower(b.p) - hoDaoPower(a.p) || b.p.age - a.p.age);
  return hits[0];
}

// ---------- Thất Nhật Lục ----------
export interface WeekWrap {
  n: number; // số kiếp trong 7 ngày
  years: number; // tổng số năm đã sống
  longest: PastSelf | null;
  top: PastSelf | null; // cảnh giới cao nhất
  shortest: PastSelf | null;
  cause: { text: string; n: number } | null; // cách chết hay gặp nhất
  dao: number; // số lần chứng đạo
  ascended: number;
  title: string; // danh hiệu tuần
}

const causeKey = (s: string | null) => (s ?? '').replace(/[0-9]+/g, '#').split(/[.,:;(]/)[0].trim().slice(0, 60);

export function weekWrap(lives: PastSelf[], now = Date.now()): WeekWrap {
  const wk = lives.filter((p) => now - new Date(p.at).getTime() < 7 * DAY);
  const by = <T,>(arr: T[], f: (x: T) => number) => (arr.length ? arr.reduce((a, b) => (f(b) > f(a) ? b : a)) : null);
  const counts: Record<string, { n: number; text: string }> = {};
  for (const p of wk) {
    const k = causeKey(p.cause);
    if (k) counts[k] = { n: (counts[k]?.n ?? 0) + 1, text: counts[k]?.text ?? (p.cause ?? '') };
  }
  const topCause = Object.values(counts).sort((a, b) => b.n - a.n)[0];
  const dao = wk.filter((p) => p.endTag === 'chung_dao').length;
  const ascended = wk.filter((p) => p.ascended).length;
  const years = Math.round(wk.reduce((a, p) => a + p.age, 0));
  const shortest = wk.length ? wk.reduce((a, b) => (b.age < a.age ? b : a)) : null;
  const n = wk.length;
  const title =
    dao > 0
      ? tr('Người Đứng Ngoài Luân Hồi', 'One Beyond the Cycle')
      : ascended > 0
        ? tr('Kẻ Phá Thiên Môn', 'Breaker of the Heavenly Gate')
        : n >= 15
          ? tr('Khách Quen Của Diêm Vương', "Yama's Regular")
          : years >= 1000
            ? tr('Lão Quái Ngàn Năm', 'Thousand-Year Old Monster')
            : n >= 5
              ? tr('Kẻ Luân Hồi Không Mỏi', 'Tireless Reincarnator')
              : tr('Tu Sĩ Mới Nhập Môn', 'Fresh Initiate');
  return { n, years, longest: by(wk, (p) => p.age), top: by(wk, (p) => (p.ascended ? 100 : 0) + p.realm * 10), shortest, cause: topCause ?? null, dao, ascended, title };
}
