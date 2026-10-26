'use client';

import type { Player } from './auth';
import { supabase } from './supabase';
import { SOCIAL, emptySocial, type SocialState } from './game/social';
import type { Character, RivalChar } from './game/types';

/** Quan hệ giang hồ với người chơi khác: tải từ máy chủ, giữ trong SOCIAL để logic trận đấu dùng */

export interface RelRow {
  other: string;
  kind: 'thu' | 'nghia' | 'nghia_req' | 'khieu' | 'hoa';
  dir: 'in' | 'out';
  created_at: string;
  active_today: boolean;
}

export interface BountyRow {
  target: string;
  total: number;
  n: number;
  posters: string[];
  latest: string;
}

export interface ChallengeRow {
  id: number;
  from_player: string;
  to_player: string;
  stake: number;
  status: 'cho' | 'tu_choi' | 'xong';
  winner: string | null;
  detail: string | null;
  created_at: string;
}

let rels: RelRow[] = [];

export async function relList(user: Player | null): Promise<RelRow[]> {
  const sb = supabase();
  if (!sb || !user) return [];
  const { data, error } = await sb.rpc('vkl_rel_list', { p_token: user.token });
  return error ? [] : ((data as RelRow[]) ?? []);
}

export async function bountyBoard(): Promise<BountyRow[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data, error } = await sb.rpc('vkl_bounty_board');
  return error ? [] : ((data as BountyRow[]) ?? []);
}

export async function dodgers(): Promise<string[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data, error } = await sb.rpc('vkl_dodgers');
  return error ? [] : ((data as { username: string }[]) ?? []).map((r) => r.username);
}

/** Tải lại toàn bộ quan hệ giang hồ */
export async function loadSocial(user: Player | null): Promise<SocialState> {
  const [rs, bb, dd] = await Promise.all([relList(user), bountyBoard(), dodgers()]);
  rels = rs;
  const s = emptySocial();
  s.me = user?.username ?? '';
  for (const r of rs) {
    if (r.kind === 'nghia') {
      s.sworn.push(r.other);
      if (r.active_today) s.swornToday.push(r.other);
    } else if (r.kind === 'thu') (r.dir === 'out' ? s.foes : s.hatedBy).push(r.other);
    else if (r.kind === 'khieu') s.provoke.push(r.other);
    else if (r.kind === 'hoa') s.peace.push(r.other);
    else if (r.kind === 'nghia_req') (r.dir === 'in' ? s.swornReq : s.swornSent).push(r.other);
  }
  for (const b of bb) s.bounty[b.target] = b.total;
  s.dodgers = dd;
  SOCIAL.cur = s;
  return s;
}

export const relRows = () => rels;

export type RelAction = 'thu' | 'khieu' | 'nghia_req' | 'nghia_accept' | 'nghia_decline' | 'nghia_break' | 'hoa';

export async function relSet(user: Player | null, other: string, kind: RelAction): Promise<string> {
  const sb = supabase();
  if (!sb || !user) return 'NO_USER';
  const { data, error } = await sb.rpc('vkl_rel_set', { p_token: user.token, p_other: other, p_kind: kind });
  if (error) return 'ERROR';
  await loadSocial(user).catch(() => {});
  return data as string;
}

export async function bountyPost(user: Player | null, target: string, amount: number): Promise<string> {
  const sb = supabase();
  if (!sb || !user) return 'NO_USER';
  const { data, error } = await sb.rpc('vkl_bounty_post', { p_token: user.token, p_target: target, p_amount: amount });
  if (error) return 'ERROR';
  await loadSocial(user).catch(() => {});
  return data as string;
}

/** Hạ được bóng người bị truy nã: lĩnh tiền thưởng (0 nếu không có) */
export async function bountyClaim(user: Player | null, target: string): Promise<number> {
  const sb = supabase();
  if (!sb || !user) return 0;
  const { data, error } = await sb.rpc('vkl_bounty_claim', { p_token: user.token, p_target: target });
  if (error) return 0;
  delete SOCIAL.cur.bounty[target];
  return (data as number) ?? 0;
}

export async function bountyClear(user: Player | null): Promise<number> {
  const sb = supabase();
  if (!sb || !user) return 0;
  const { data, error } = await sb.rpc('vkl_bounty_clear', { p_token: user.token });
  if (error) return 0;
  delete SOCIAL.cur.bounty[user.username];
  return (data as number) ?? 0;
}

/** Tiền cược chiến thư được trả về (thắng, hòa, bị từ chối) */
/** Lĩnh quà đang chờ: kind 'phuc' là phúc duyên cho tài khoản, còn lại là linh thạch cho nhân vật */
export async function payoutClaim(user: Player | null): Promise<{ kind?: string; amount: number; note: string }[]> {
  const sb = supabase();
  if (!sb || !user) return [];
  const r = await sb.rpc('vkl_payout_claim2', { p_token: user.token });
  if (!r.error) return (r.data as { kind: string; amount: number; note: string }[]) ?? [];
  const { data, error } = await sb.rpc('vkl_payout_claim', { p_token: user.token });
  return error ? [] : ((data as { amount: number; note: string }[]) ?? []);
}

export async function challengeSend(user: Player | null, to: string, stake: number): Promise<string> {
  const sb = supabase();
  if (!sb || !user) return 'NO_USER';
  const { data, error } = await sb.rpc('vkl_challenge_send', { p_token: user.token, p_to: to, p_stake: stake });
  return error ? 'ERROR' : (data as string);
}

export async function challengeList(user: Player | null): Promise<ChallengeRow[]> {
  const sb = supabase();
  if (!sb || !user) return [];
  const { data, error } = await sb.rpc('vkl_challenge_list', { p_token: user.token });
  return error ? [] : ((data as ChallengeRow[]) ?? []);
}

export async function challengeAnswer(user: Player | null, id: number, accept: boolean, winner: string | null, detail: string): Promise<string> {
  const sb = supabase();
  if (!sb || !user) return 'NO_USER';
  const { data, error } = await sb.rpc('vkl_challenge_answer', { p_token: user.token, p_id: id, p_accept: accept, p_winner: winner, p_detail: detail });
  return error ? 'ERROR' : (data as string);
}

export interface Condolence {
  from_player: string;
  body: string;
  created_at: string;
}

export async function condolenceAdd(user: Player | null, lifeId: number | string, body: string): Promise<string> {
  const sb = supabase();
  if (!sb || !user) return 'NO_USER';
  const { data, error } = await sb.rpc('vkl_condolence_add', { p_token: user.token, p_life_id: lifeId, p_body: body });
  return error ? 'ERROR' : (data as string);
}

export async function condolences(lifeId: number | string): Promise<Condolence[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data, error } = await sb.rpc('vkl_condolences', { p_life_id: lifeId });
  return error ? [] : ((data as Condolence[]) ?? []);
}

export async function condolenceCounts(ids: (number | string)[]): Promise<Record<string, { n: number; last: string }>> {
  const sb = supabase();
  const nums = ids.map(Number).filter((x) => Number.isFinite(x));
  if (!sb || !nums.length) return {};
  const { data, error } = await sb.rpc('vkl_condolence_counts', { p_ids: nums });
  if (error || !data) return {};
  const out: Record<string, { n: number; last: string }> = {};
  for (const r of data as { life_id: number; n: number; last_body: string }[]) out[String(r.life_id)] = { n: r.n, last: r.last_body };
  return out;
}

export interface OanGia {
  p1: string;
  p2: string;
  fights: number;
  w1: number;
  w2: number;
}

export async function oanGia(): Promise<OanGia[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data, error } = await sb.rpc('vkl_oan_gia');
  return error ? [] : ((data as OanGia[]) ?? []);
}

/** Nhân vật mạnh nhất hiện tại của một người chơi (đang sống ưu tiên), dạng bóng để đem đi đấu */
export async function playerBest(username: string): Promise<RivalChar | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('vkl_player_best', { p_username: username });
  if (error || !data) return null;
  const c = data as Partial<Character> & { alive?: boolean };
  if (!c.name) return null;
  return {
    player: username,
    name: c.name,
    gender: c.gender === 'nu' ? 'nu' : 'nam',
    race: c.race,
    realm: c.realm ?? 0,
    layer: c.layer ?? 1,
    path: c.path ?? null,
    daoTam: c.daoTam ?? 0,
    age: Math.floor(c.age ?? 30),
    lifespan: c.lifespan,
    hairColor: c.hairColor,
    hairStyle: c.hairStyle,
    outfitTone: c.outfitTone,
    outfitCut: c.outfitCut,
    equipped: c.equipped ?? { ao: 'ao_vai' },
    lookSeed: c.lookSeed,
    element: c.element,
    lifeNo: c.lifeNo ?? 1,
    alive: c.alive !== false,
  };
}

/** Khiêu khích chỉ tính một lần chạm mặt: đánh xong thì gỡ */
export async function khieuDone(user: Player | null, other: string) {
  const sb = supabase();
  SOCIAL.cur.provoke = SOCIAL.cur.provoke.filter((p) => p !== other);
  if (!sb || !user) return;
  await sb.rpc('vkl_khieu_done', { p_token: user.token, p_other: other });
}

/** Truyền công lúc tọa hóa: tặng 5 phúc duyên và thư cho người được chọn (không có thì người hữu duyên ngẫu nhiên). Trả về tên người nhận. */
export async function truyenCong(user: Player | null, to: string | null, name: string): Promise<string | null> {
  const sb = supabase();
  if (!sb || !user) return null;
  const { data, error } = await sb.rpc('vkl_truyen_cong', { p_token: user.token, p_to: to, p_name: name });
  return error ? null : ((data as string | null) ?? null);
}
