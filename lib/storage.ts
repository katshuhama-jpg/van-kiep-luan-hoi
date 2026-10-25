'use client';

import { dropSession, type Player } from './auth';
import { emptyMeta } from './game/engine';
import type { Character, Grave, Meta, PendingEvent, WorldEcho } from './game/types';
import { REALMS, realmLabel } from './game/data';
import { supabase } from './supabase';

export interface SaveState {
  v: 1;
  char: Character;
  pending: PendingEvent | null;
  yearSec: number;
  talents?: string[];
  t?: number; // thời điểm lưu, để chọn bản mới hơn giữa máy và mây
}

export interface Memorial {
  id: number | string;
  player_name: string;
  char_name: string;
  life_no: number;
  age: number;
  realm: string;
  path: string | null;
  dao_tam: number;
  cause: string | null;
  epitaph: string | null;
  ascended: boolean;
  incense: number;
  created_at: string;
}

const K = { save: 'vkl.save', meta: 'vkl.meta', lives: 'vkl.lives' };

function readLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* bộ nhớ trình duyệt bị chặn: bỏ qua */
  }
}

export function displayName(user: Player | null): string {
  return user?.username ?? 'Khách';
}

/** Tải hồ sơ + bản lưu. Người chơi khách dùng dữ liệu trên máy. */
export async function loadAll(user: Player | null): Promise<{ meta: Meta; save: SaveState | null }> {
  const sb = supabase();
  if (user && sb) {
    const { data, error } = await sb.rpc('vkl_me', { p_token: user.token });
    if (!error && data) {
      const d = data as { meta: Partial<Meta> | null; state: SaveState | null };
      // bản lưu trên máy có thể mới hơn bản trên mây (mây lưu chậm hơn, hoặc bị ngắt khi chuyển trang)
      const local = readLocal<SaveState>(userKey(user));
      const remote = d.state;
      const save = local && (local.t ?? 0) > (remote?.t ?? 0) ? local : remote;
      return { meta: { ...emptyMeta(), ...(d.meta ?? {}) }, save };
    }
    if (!error && !data) dropSession();
  }
  return { meta: { ...emptyMeta(), ...(readLocal<Meta>(K.meta) ?? {}) }, save: readLocal<SaveState>(K.save) };
}

export async function saveMeta(user: Player | null, meta: Meta) {
  if (!user) writeLocal(K.meta, meta);
  const sb = supabase();
  if (user && sb) await sb.rpc('vkl_save_meta', { p_token: user.token, p_meta: meta });
}

const userKey = (user: Player) => `vkl.save.u.${user.username}`;

/** Lưu trên máy. Người đăng nhập cũng giữ một bản trên máy để chuyển trang không mất tiến độ. */
export function saveLocal(user: Player | null, state: SaveState | null) {
  const v = state ? { ...state, t: Date.now() } : null;
  writeLocal(user ? userKey(user) : K.save, v);
}

export async function saveRemote(user: Player | null, state: SaveState | null) {
  const sb = supabase();
  if (!user || !sb) return;
  await sb.rpc('vkl_save_game', { p_token: user.token, p_state: state ? { ...state, t: Date.now() } : null });
}

export async function addMemorial(user: Player | null, m: Omit<Memorial, 'id' | 'incense' | 'created_at'> & { realm_no?: number; layer_no?: number; wealth?: number; look?: Record<string, unknown> }) {
  const sb = supabase();
  if (user && sb) {
    await sb.rpc('vkl_add_life', { p_token: user.token, p_life: m });
    return;
  }
  const local = readLocal<Memorial[]>(K.lives) ?? [];
  const entry: Memorial = { ...m, id: `local-${Date.now()}`, incense: 0, created_at: new Date().toISOString() };
  writeLocal(K.lives, [entry, ...local].slice(0, 100));
}

const COLS = 'id, player_name, char_name, life_no, age, realm, path, dao_tam, cause, epitaph, ascended, incense, created_at';

export async function listMemorials(user: Player | null): Promise<{ all: Memorial[]; mine: Memorial[] }> {
  const local = readLocal<Memorial[]>(K.lives) ?? [];
  const sb = supabase();
  if (!sb) return { all: local, mine: local };
  const [{ data: all }, mine] = await Promise.all([
    sb.from('vkl_lives').select(COLS).order('created_at', { ascending: false }).limit(60),
    user ? sb.rpc('vkl_my_lives', { p_token: user.token }).then((r) => (r.data as Memorial[] | null) ?? []) : Promise.resolve(local),
  ]);
  return { all: (all as Memorial[] | null) ?? [], mine };
}

export async function thapHuong(user: Player | null, id: number | string): Promise<number | null> {
  const sb = supabase();
  if (!sb || !user || typeof id !== 'number') return null;
  const { data } = await sb.rpc('vkl_thap_huong', { p_token: user.token, p_life_id: id });
  return typeof data === 'number' ? data : null;
}

export type RankKind = 'power' | 'wealth' | 'age';
export type RankLean = 'all' | 'chinh' | 'trung' | 'ta';
export type RankScope = 'all' | 'alive' | 'dead';

export async function leaderboard(kind: RankKind, lean: RankLean, path: string, scope: RankScope = 'all'): Promise<{ username: string; c: Character; alive: boolean }[] | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('vkl_leaderboard', { p_kind: kind, p_lean: lean, p_path: path, p_scope: scope });
  if (error) return null;
  return ((data as { username: string; c: Character; alive: boolean }[] | null) ?? []).map((r) => ({
    username: r.username,
    alive: r.alive,
    c: {
      ...r.c,
      stats: r.c.stats ?? { tamCanh: 50, ngoTinh: 50, khiVan: 50, tamMa: 0, sucKhoe: 80 },
      equipped: r.c.equipped ?? {},
      log: [],
      seenEvents: {},
      pills: {},
      inventory: [],
    } as Character,
  }));
}

// tài khoản thử nghiệm không xuất hiện trong thế giới
const isTest = (n: string) => /^(test|ui)_/.test(n);

/** Dấu vết của người chơi khác để đưa vào kiếp mới: mộ, ma đầu, minh chủ */
export async function fetchWorld(user: Player | null): Promise<WorldEcho | null> {
  const sb = supabase();
  if (!sb) return null;
  const me = user?.username ?? null;
  const [{ data: lives }, ma, chinh] = await Promise.all([
    sb.from('vkl_lives').select('player_name, char_name, age, realm, cause, epitaph, dao_tam').order('created_at', { ascending: false }).limit(80),
    leaderboard('power', 'ta', 'all', 'all').catch(() => null),
    leaderboard('power', 'chinh', 'all', 'all').catch(() => null),
  ]);
  const rows = ((lives as { player_name: string; char_name: string; age: number; realm: string; cause: string | null; epitaph: string | null; dao_tam: number }[] | null) ?? []).filter((r) => r.player_name !== me && r.player_name !== 'Khách' && !isTest(r.player_name));
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  const graves: Grave[] = rows.slice(0, 6).map((r) => ({ char: r.char_name, player: r.player_name, age: r.age, realm: r.realm, cause: r.cause, epitaph: r.epitaph, dao: r.dao_tam }));
  const top = (list: { username: string; c: Character }[] | null) => {
    const r = list?.find((x) => x.username !== me && !isTest(x.username) && (x.c.realm ?? 0) >= 1);
    return r ? { name: r.c.name, player: r.username, realm: r.c.realm, realmName: realmLabel(r.c.realm, r.c.layer ?? 1) || REALMS[r.c.realm]?.name || '' } : null;
  };
  return { graves, ma: top(ma), chinh: top(chinh) };
}

// ---------- Góp ý tính năng ----------
export type FeedbackKind = 'tinh_nang' | 'loi' | 'can_bang' | 'khac';
export interface Feedback {
  id: number;
  username: string;
  kind: FeedbackKind;
  content: string;
  status: 'moi' | 'dang_lam' | 'da_xong' | 'tu_choi';
  votes: number;
  created_at: string;
  voted: boolean;
  mine: boolean;
}

export async function listFeedback(user: Player | null): Promise<Feedback[] | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('vkl_feedback_list', { p_token: user?.token ?? null });
  if (error) return null;
  return (data as Feedback[]) ?? [];
}

const FB_ERR: Record<string, string> = {
  NOT_LOGGED_IN: 'Cần đăng nhập để góp ý.',
  TOO_FAST: 'Chậm lại một chút, 30 giây mới gửi được một góp ý.',
  TOO_MANY: 'Hôm nay bạn đã gửi đủ 20 góp ý rồi.',
};

export async function addFeedback(user: Player | null, kind: FeedbackKind, content: string): Promise<string | null> {
  const sb = supabase();
  if (!sb || !user) return FB_ERR.NOT_LOGGED_IN;
  const { error } = await sb.rpc('vkl_feedback_add', { p_token: user.token, p_kind: kind, p_content: content });
  if (!error) return null;
  const code = Object.keys(FB_ERR).find((k) => error.message.includes(k));
  return code ? FB_ERR[code] : 'Gửi chưa được, thử lại sau nhé.';
}

export async function voteFeedback(user: Player | null, id: number): Promise<number | null> {
  const sb = supabase();
  if (!sb || !user) return null;
  const { data, error } = await sb.rpc('vkl_feedback_vote', { p_token: user.token, p_id: id });
  return error ? null : (data as number);
}
