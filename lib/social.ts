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
  const [rs, bb, dd, md] = await Promise.all([relList(user), bountyBoard(), dodgers(), madList(user)]);
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
  s.maDau = md;
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
  const r3 = await sb.rpc('vkl_payout_claim3', { p_token: user.token });
  if (!r3.error) return (r3.data as { kind: string; amount: number; note: string }[]) ?? [];
  // lỗi mạng tạm thời thì thôi, đợi lần sau; chỉ lùi về hàm cũ khi máy chủ chưa có hàm mới
  if (r3.error.code !== 'PGRST202' && !/function .* does not exist|Could not find the function/i.test(r3.error.message)) return [];
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
  return toRival(username, data);
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

/** Số liệu giang hồ để mở các mảnh Thiên thư Quyển II */
export async function loreSocial(user: Player | null): Promise<import('./game/lore').LoreSocial | null> {
  const sb = supabase();
  if (!sb || !user) return null;
  const { data, error } = await sb.rpc('vkl_lore_social', { p_token: user.token });
  return error || !data ? null : (data as import('./game/lore').LoreSocial);
}

// ---------- Lôi đài hằng ngày ----------
export interface ArenaState {
  me: { username: string; elo: number; used: number; wins: number; losses: number } | null;
  opps: { username: string; elo: number }[];
  top: { username: string; elo: number; wins: number; losses: number }[];
  champs: { week: string; rank: number; username: string; elo: number }[];
}
export const ARENA_TURNS = 3;

export async function arenaState(user: Player | null): Promise<ArenaState | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('vkl_arena_state', { p_token: user?.token ?? '00000000-0000-0000-0000-000000000000' });
  return error || !data ? null : (data as ArenaState);
}

export async function arenaFight(user: Player | null, opp: string, win: boolean, detail: string): Promise<{ delta?: number; elo?: number; used?: number; error?: string } | null> {
  const sb = supabase();
  if (!sb || !user) return null;
  const { data, error } = await sb.rpc('vkl_arena_fight', { p_token: user.token, p_opp: opp, p_win: win, p_detail: detail });
  return error ? null : (data as { delta?: number; elo?: number; used?: number; error?: string });
}

/** Đổi dữ liệu nhân vật trên máy chủ thành bóng để đem đi đấu */
export function toRival(username: string, data: unknown): RivalChar | null {
  const c = data as Partial<Character> & { alive?: boolean; lifeId?: number };
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
    cosmos: c.cosmos ?? null,
    lifeId: c.lifeId,
  };
}

// ---------- Lôi đài 2: điểm tuần, bóng xuất chiến, báo thù ----------
export interface Arena2State {
  me: { username: string; pts: number; used: number; wins: number; losses: number; winRun: number; champ: unknown | null } | null;
  opps: { username: string; pts: number }[];
  revenge: { id: number; target: string; at: string }[];
  top: { username: string; pts: number; wins: number; losses: number; winRun: number }[];
  champs: { week: string; rank: number; username: string; pts: number }[];
}
const NO_TOKEN = '00000000-0000-0000-0000-000000000000';

export async function arena2State(user: Player | null): Promise<Arena2State | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('vkl_arena_state2', { p_token: user?.token ?? NO_TOKEN });
  return error || !data ? null : (data as Arena2State);
}

export async function arenaCandidates(user: Player | null): Promise<RivalChar[]> {
  const sb = supabase();
  if (!sb || !user) return [];
  const { data, error } = await sb.rpc('vkl_arena_candidates', { p_token: user.token });
  if (error || !Array.isArray(data)) return [];
  return data.map((d) => toRival(user.username, d)).filter((x): x is RivalChar => !!x);
}

export async function arenaPick(user: Player | null, lifeId: number): Promise<{ champ?: unknown; error?: string } | null> {
  const sb = supabase();
  if (!sb || !user) return null;
  const { data, error } = await sb.rpc('vkl_arena_pick', { p_token: user.token, p_life_id: lifeId });
  return error ? null : (data as { champ?: unknown; error?: string });
}

export async function arenaShadow(username: string): Promise<RivalChar | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('vkl_arena_shadow', { p_username: username });
  return error || !data ? null : toRival(username, data);
}

/** Hình trên bục Long Ỷ: bóng người chơi đã cầm ra đài gần nhất, không phải kiếp mạnh nhất */
export async function arenaPodiumShadow(username: string): Promise<RivalChar | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('vkl_arena_podium_shadow', { p_username: username });
  if (error) return arenaShadow(username);
  return !data ? null : toRival(username, data);
}

export async function arenaFight2(user: Player | null, opp: string, win: boolean, detail: string, revenge: number | null): Promise<{ pts?: number; used?: number; winRun?: number; error?: string } | null> {
  const sb = supabase();
  if (!sb || !user) return null;
  const { data, error } = await sb.rpc('vkl_arena_fight2', { p_token: user.token, p_opp: opp, p_win: win, p_detail: detail, p_revenge: revenge ?? 0 });
  return error ? null : (data as { pts?: number; used?: number; winRun?: number; error?: string });
}

/** Xin xăm đối thủ lôi đài: máy chủ rút ngẫu nhiên; quẻ chưa giải thì trả lại đúng người cũ */
export async function arenaDraw(user: Player | null): Promise<{ opp?: string; shadow?: RivalChar | null; again?: boolean; error?: string } | null> {
  const sb = supabase();
  if (!sb || !user) return null;
  const { data, error } = await sb.rpc('vkl_arena_draw', { p_token: user.token });
  if (error || !data) return null;
  const d = data as { opp?: string; shadow?: unknown; again?: boolean; error?: string };
  return { ...d, shadow: d.opp && d.shadow ? toRival(d.opp, d.shadow) : null };
}

/** Lôi đài Phi Kiếm (3.2.0): ghi trận, thua vẫn +1 điểm; thưởng phúc và Hồn lực vào hàng chờ quà */
export async function arenaFight3(user: Player | null, opp: string, win: boolean, detail: string, revenge: number | null, hp: number, swords: number): Promise<{ pts?: number; used?: number; winRun?: number; phuc?: number; hon?: number; tier?: number; error?: string } | null> {
  const sb = supabase();
  if (!sb || !user) return null;
  const { data, error } = await sb.rpc('vkl_arena_fight3', { p_token: user.token, p_opp: opp, p_win: win, p_detail: detail, p_revenge: revenge ?? 0, p_hp: hp, p_swords: swords });
  return error ? null : (data as { pts?: number; used?: number; error?: string });
}

/** Lượt lôi đài còn lại hôm nay và nợ báo thù, cho chấm đỏ ở nút Lôi đài */
export async function arenaTierInfo(user: Player | null): Promise<{ pts: number; tier: number; left: number; revenge: number } | null> {
  const sb = supabase();
  if (!sb || !user) return null;
  const { data, error } = await sb.rpc('vkl_arena_tier_info', { p_token: user.token });
  return error ? null : (data as { pts: number; tier: number; left: number; revenge: number } | null);
}

/** Bóng ma đầu đang hoành hành (3.2.0) */
async function madList(user: Player | null): Promise<import('./game/social').MaDau[]> {
  const sb = supabase();
  if (!sb || !user) return [];
  const { data, error } = await sb.rpc('vkl_mad_list', { p_token: user.token });
  if (error || !Array.isArray(data)) return [];
  return (data as { owner: string; champ: unknown; kills: number }[])
    .map((d) => {
      const r = toRival(d.owner, d.champ);
      return r ? { owner: d.owner, rival: r, kills: d.kills } : null;
    })
    .filter((x): x is import('./game/social').MaDau => !!x);
}

/** Ghi kết quả gặp ma đầu: máy chủ gửi thư cho chủ bóng và chia phúc duyên */
export async function madResult(user: Player | null, owner: string, win: boolean, lifeNo: number, charName: string): Promise<void> {
  const sb = supabase();
  if (!sb || !user) return;
  await sb.rpc('vkl_mad_result', { p_token: user.token, p_owner: owner, p_win: win, p_life_no: lifeNo, p_char: charName });
}
