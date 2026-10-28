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

export interface PastSelf {
  id: string;
  lifeNo: number;
  name: string;
  age: number;
  realm: number;
  ascended: boolean;
  cause: string | null;
  epitaph: string | null;
  rival: RivalChar; // để vẽ bằng foeChar + Sprite
}

type Row = { id: number | string; life_no: number; char_name: string; age: number; realm_no?: number | null; layer_no?: number | null; ascended: boolean; cause: string | null; epitaph: string | null; dao_tam?: number; look?: Record<string, unknown> | null };

function toSelf(r: Row, player: string): PastSelf | null {
  const look = (r.look ?? {}) as Record<string, unknown>;
  const rival = toRival(player, { ...look, name: r.char_name, age: r.age, realm: r.realm_no ?? 0, layer: r.layer_no ?? 1, daoTam: r.dao_tam ?? 0, lifeNo: r.life_no, alive: false });
  if (!rival) return null;
  return { id: String(r.id), lifeNo: r.life_no, name: r.char_name, age: r.age, realm: r.realm_no ?? 0, ascended: !!r.ascended, cause: r.cause, epitaph: r.epitaph, rival };
}

/** Các kiếp đã qua, kiếp cũ trước. Đăng nhập thì lấy trên máy chủ, khách thì lấy trên máy. */
export async function loadPastSelves(user: Player | null, limit = 300): Promise<PastSelf[]> {
  const sb = supabase();
  let rows: Row[] = [];
  if (user && sb) {
    const { data } = await sb
      .from('vkl_lives')
      .select('id, life_no, char_name, age, realm_no, layer_no, ascended, cause, epitaph, dao_tam, look')
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
