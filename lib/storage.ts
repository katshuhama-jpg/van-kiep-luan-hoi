'use client';

import { dropSession, type Player } from './auth';
import { emptyMeta } from './game/engine';
import type { Character, Meta, PendingEvent } from './game/types';
import { supabase } from './supabase';

export interface SaveState {
  v: 1;
  char: Character;
  pending: PendingEvent | null;
  yearSec: number;
  talents?: string[];
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
      return { meta: { ...emptyMeta(), ...(d.meta ?? {}) }, save: d.state };
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

export function saveLocal(user: Player | null, state: SaveState | null) {
  if (!user) writeLocal(K.save, state);
}

export async function saveRemote(user: Player | null, state: SaveState | null) {
  const sb = supabase();
  if (!user || !sb) return;
  await sb.rpc('vkl_save_game', { p_token: user.token, p_state: state });
}

export async function addMemorial(user: Player | null, m: Omit<Memorial, 'id' | 'incense' | 'created_at'>) {
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

export type RankKind = 'power' | 'wealth';
export type RankLean = 'all' | 'chinh' | 'trung' | 'ta';

export async function leaderboard(kind: RankKind, lean: RankLean, path: string): Promise<{ username: string; c: Character }[] | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('vkl_leaderboard', { p_kind: kind, p_lean: lean, p_path: path });
  if (error) return null;
  return ((data as { username: string; c: Character }[] | null) ?? []).map((r) => ({
    username: r.username,
    c: { ...r.c, log: [], seenEvents: {}, pills: {}, inventory: [] } as Character,
  }));
}
