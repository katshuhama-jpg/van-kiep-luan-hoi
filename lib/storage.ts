'use client';

import { dropSession, type Player } from './auth';
import { emptyMeta } from './game/engine';
import type { Character, Grave, Meta, PendingEvent, WorldEcho, RivalChar } from './game/types';
import { REALMS, realmLabel } from './game/data';
import { supabase } from './supabase';
import { tr } from './i18n';

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
  realm_no?: number | null;
  wealth?: number | null;
  ending?: string | null; // mã kết cục (mộ mới)
  end_tag?: string | null;
}

const K = { save: 'vkl.save', meta: 'vkl.meta', lives: 'vkl.lives', pending: 'vkl.pendingGraves' };

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
  return user?.username ?? tr('Khách', "Guest");
}

/** Tải hồ sơ + bản lưu. Người chơi khách dùng dữ liệu trên máy. */
export async function loadAll(user: Player | null): Promise<{ meta: Meta; save: SaveState | null }> {
  const sb = supabase();
  if (user && sb) {
    const { data, error } = await sb.rpc('vkl_me', { p_token: user.token });
    if (!error && data) {
      const d = data as { meta: Partial<Meta> | null; state: SaveState | null };
      const meta = { ...emptyMeta(), ...(d.meta ?? {}) };
      // bản lưu trên máy có thể mới hơn bản trên mây (mây lưu chậm hơn, hoặc bị ngắt khi chuyển trang).
      // Bản nào là kiếp đã xong (máy cũ còn giữ kiếp cũ, mây đã xóa khi sang kiếp mới) thì bỏ, không được hồi sinh kiếp cũ.
      const rawLocal = readLocal<SaveState>(userKey(user));
      const local = live(rawLocal, meta) ? rawLocal : null;
      const remote = live(d.state, meta) ? d.state : null;
      if (rawLocal && !local) writeLocal(userKey(user), null);
      if (d.state && !remote && sb) sb.rpc('vkl_save_game', { p_token: user.token, p_state: null }).then(() => {}, () => {});
      const save = local && (local.t ?? 0) > (remote?.t ?? 0) ? local : remote;
      return { meta, save };
    }
    if (!error && !data) dropSession();
  }
  const meta = { ...emptyMeta(), ...(readLocal<Meta>(K.meta) ?? {}) };
  const raw = readLocal<SaveState>(K.save);
  if (raw && !live(raw, meta)) writeLocal(K.save, null);
  return { meta, save: live(raw, meta) ? raw : null };
}

/** Bản lưu còn dùng được: kiếp trong bản lưu chưa được ghi là đã xong (kiếp đang chơi luôn là meta.lives + 1) */
function live(s: SaveState | null | undefined, meta: Meta): s is SaveState {
  return !!s?.char && (s.char.lifeNo ?? 0) > (meta.lives ?? 0);
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

// ---------- Chơi thử: bia chờ ghi danh ----------
/** Chơi thử chết từ Kim Đan trở lên, hoặc phi thăng, hoặc sống trên 150 tuổi thì mời ghi danh */
export const GHI_DANH_REALM = 3;
export function worthGhiDanh(c: Pick<Character, 'realm' | 'ascended' | 'age'>): boolean {
  return c.realm >= GHI_DANH_REALM || !!c.ascended || c.age >= 150;
}
type GraveIn = Parameters<typeof addMemorial>[1];
/** Giữ tối đa 5 bia đáng ghi danh nhất trên máy, chờ đăng ký */
export function addPendingGrave(g: GraveIn) {
  const ls = readLocal<GraveIn[]>(K.pending) ?? [];
  const score = (x: GraveIn) => (x.ascended ? 1e6 : 0) + (x.realm_no ?? 0) * 1e4 + x.age;
  writeLocal(K.pending, [g, ...ls].sort((a, b) => score(b) - score(a)).slice(0, 5));
}
export function pendingGraves(): GraveIn[] {
  return readLocal<GraveIn[]>(K.pending) ?? [];
}

const COLS = 'id, player_name, char_name, life_no, age, realm, path, dao_tam, cause, epitaph, ascended, incense, created_at, realm_no, wealth, ending:look->>ending, end_tag:look->>endTag';

export async function listMemorials(user: Player | null): Promise<{ all: Memorial[]; mine: Memorial[] }> {
  const local = readLocal<Memorial[]>(K.lives) ?? [];
  const sb = supabase();
  if (!sb) return { all: local, mine: local };
  const [{ data: all }, mine] = await Promise.all([
    sb.from('vkl_lives').select(COLS).order('created_at', { ascending: false }).limit(60),
    user
      ? sb
          .from('vkl_lives')
          .select(COLS)
          .eq('player_name', user.username)
          .order('created_at', { ascending: false })
          .limit(100)
          .then((r) => (r.data as Memorial[] | null) ?? [])
      : Promise.resolve(local),
  ]);
  return { all: (all as Memorial[] | null) ?? [], mine };
}

/** Chi tiết một ngôi mộ để xem hồi ký: dáng vẻ, cột mốc, cảnh giới cuối */
export async function lifeDetail(m: Memorial): Promise<{ look: Record<string, unknown> | null; realm_no: number | null; layer_no: number | null }> {
  const local = m as Memorial & { look?: Record<string, unknown>; realm_no?: number; layer_no?: number };
  if (typeof m.id !== 'number') return { look: local.look ?? null, realm_no: local.realm_no ?? null, layer_no: local.layer_no ?? null };
  const sb = supabase();
  if (!sb) return { look: null, realm_no: null, layer_no: null };
  const { data } = await sb.from('vkl_lives').select('look, realm_no, layer_no').eq('id', m.id).maybeSingle();
  return (data as { look: Record<string, unknown> | null; realm_no: number | null; layer_no: number | null }) ?? { look: null, realm_no: null, layer_no: null };
}

/** Đền thờ danh nhân: các ngôi mộ được thắp hương nhiều nhất */
export async function topIncense(): Promise<Memorial[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data } = await sb.from('vkl_lives').select(COLS).gt('incense', 0).order('incense', { ascending: false }).limit(12);
  return ((data as Memorial[] | null) ?? []).filter((m) => !isTest(m.player_name));
}

export async function thapHuong(user: Player | null, id: number | string): Promise<number | null> {
  const sb = supabase();
  if (!sb || !user || typeof id !== 'number') return null;
  const { data } = await sb.rpc('vkl_thap_huong', { p_token: user.token, p_life_id: id });
  return typeof data === 'number' ? data : null;
}

export type RankKind = 'power' | 'wealth' | 'age';
export type RankLean = 'all' | 'chinh' | 'trung' | 'ta';
export type RankScope = 'all' | 'alive' | 'dead' | 'week';

export async function leaderboard(kind: RankKind, lean: RankLean, path: string, scope: RankScope = 'all'): Promise<{ username: string; c: Character; alive: boolean }[] | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('vkl_leaderboard', { p_kind: kind, p_lean: lean, p_path: path, p_scope: scope });
  if (error) return null;
  const list = ((data as { username: string; c: Character; alive: boolean }[] | null) ?? []).slice();
  // máy chủ trả các người bằng điểm theo thứ tự ngẫu nhiên nên hạng nhảy mỗi lần tải: xếp lại các nhóm bằng điểm cho cố định
  const key = (r: { c: Character }) => {
    const c = r.c as Character & { ascended?: boolean; cultivation?: number };
    if (kind === 'wealth') return [Math.round(c.linhThach ?? 0)];
    if (kind === 'age') return [Math.floor(c.age ?? 0)];
    return [c.ascended ? 1 : 0, c.realm ?? 0, c.layer ?? 0, Math.floor(c.cultivation ?? 0)];
  };
  const same = (a: number[], b: number[]) => a.every((x, i) => x === b[i]);
  const tie = (a: { username: string; c: Character }, b: { username: string; c: Character }) =>
    Math.floor(b.c.age ?? 0) - Math.floor(a.c.age ?? 0) || (a.c.lifeNo ?? 0) - (b.c.lifeNo ?? 0) || a.username.localeCompare(b.username) || (a.c.name ?? '').localeCompare(b.c.name ?? '');
  for (let i = 0; i < list.length; ) {
    let j = i + 1;
    while (j < list.length && same(key(list[i]), key(list[j]))) j++;
    if (j - i > 1) list.splice(i, j - i, ...list.slice(i, j).sort(tie));
    i = j;
  }
  return list.map((r) => ({
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
  const [{ data: lives }, ma, chinh, all, mine] = await Promise.all([
    sb.from('vkl_lives').select('player_name, char_name, age, realm, cause, epitaph, dao_tam').order('created_at', { ascending: false }).limit(80),
    leaderboard('power', 'ta', 'all', 'all').catch(() => null),
    leaderboard('power', 'chinh', 'all', 'all').catch(() => null),
    leaderboard('power', 'all', 'all', 'all').catch(() => null),
    me ? sb.from('vkl_lives').select('char_name, age, realm_no, layer_no, dao_tam, look').eq('player_name', me).order('created_at', { ascending: false }).limit(1) : Promise.resolve({ data: null }),
  ]);
  const rows = ((lives as { player_name: string; char_name: string; age: number; realm: string; cause: string | null; epitaph: string | null; dao_tam: number }[] | null) ?? []).filter(
    (r) => r.player_name !== me && r.player_name !== 'Khách' && r.player_name !== 'Guest' && !isTest(r.player_name),
  );
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  const graves: Grave[] = rows.slice(0, 6).map((r) => ({ char: r.char_name, player: r.player_name, age: r.age, realm: r.realm, cause: r.cause, epitaph: r.epitaph, dao: r.dao_tam }));
  const top = (list: { username: string; c: Character }[] | null) => {
    const r = list?.find((x) => x.username !== me && !isTest(x.username) && (x.c.realm ?? 0) >= 1);
    return r ? { name: r.c.name, player: r.username, realm: r.c.realm, realmName: realmLabel(r.c.realm, r.c.layer ?? 1) || REALMS[r.c.realm]?.name || '' } : null;
  };
  // nhân vật người chơi khác để gặp trong giang hồ (đồng đạo, địch thủ)
  const toRival = (u: string, c: Character, alive: boolean): RivalChar => ({
    player: u,
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
    equipped: c.equipped,
    lookSeed: c.lookSeed,
    element: c.element,
    lifeNo: c.lifeNo ?? 1,
    sect: c.sect ?? null,
    sectRank: c.sectRank,
    cosmos: c.cosmos ?? null,
    alive,
  });
  const rivals = (all ?? [])
    .filter((x) => x.username !== me && !isTest(x.username) && (x.c.realm ?? 0) >= 1)
    .slice(0, 40)
    .map((x) => toRival(x.username, x.c, x.alive));
  type PastRow = { char_name: string; age: number; realm_no: number | null; layer_no: number | null; dao_tam: number; look: Record<string, unknown> | null };
  const pr = ((mine as { data: PastRow[] | null }).data ?? [])[0];
  const past =
    pr && me ? toRival(me, { ...(pr.look ?? {}), name: pr.char_name, age: pr.age, realm: pr.realm_no ?? 1, layer: pr.layer_no ?? 1, daoTam: pr.dao_tam } as unknown as Character, false) : null;
  return { graves, ma: top(ma), chinh: top(chinh), rivals, past };
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
  reply?: string | null; // lời nhắn của người làm game
  reply_ver?: string | null; // bản cập nhật đã làm góp ý này
}

export async function listFeedback(user: Player | null): Promise<Feedback[] | null> {
  const sb = supabase();
  if (!sb) return null;
  let { data, error } = await sb.rpc('vkl_feedback_list2', { p_token: user?.token ?? null });
  if (error) ({ data, error } = await sb.rpc('vkl_feedback_list', { p_token: user?.token ?? null }));
  if (error) return null;
  // đánh giá nhanh ở màn chết chỉ dành cho người làm game đọc, không hiện ở trang góp ý chung
  return ((data as Feedback[]) ?? []).filter((f) => !/^\[(Đánh giá kiếp|Life rating)/.test(f.content));
}

const FB_ERR: Record<string, string> = {
  NOT_LOGGED_IN: tr('Cần đăng nhập để góp ý.', "Log in to send feedback."),
  TOO_FAST: tr('Chậm lại một chút, 30 giây mới gửi được một góp ý.', "Slow down a little - one request every 30 seconds."),
  TOO_MANY: tr('Hôm nay bạn đã gửi đủ 20 góp ý rồi.', "You've already sent 20 requests today."),
};

export async function addFeedback(user: Player | null, kind: FeedbackKind, content: string): Promise<string | null> {
  const sb = supabase();
  if (!sb || !user) return FB_ERR.NOT_LOGGED_IN;
  const { error } = await sb.rpc('vkl_feedback_add', { p_token: user.token, p_kind: kind, p_content: content });
  if (!error) return null;
  const code = Object.keys(FB_ERR).find((k) => error.message.includes(k));
  return code ? FB_ERR[code] : tr('Gửi chưa được, thử lại sau nhé.', "Couldn't send it, please try again later.");
}

export async function voteFeedback(user: Player | null, id: number): Promise<number | null> {
  const sb = supabase();
  if (!sb || !user) return null;
  const { data, error } = await sb.rpc('vkl_feedback_vote', { p_token: user.token, p_id: id });
  return error ? null : (data as number);
}

// ---------- Hộp thư giang hồ ----------
export interface Mail {
  id: number;
  from_player: string | null;
  kind: string;
  body: string;
  read: boolean;
  created_at: string;
}

/** Gửi thư cho người chơi khác (kết quả kỳ ngộ với bóng nhân vật của họ). Lỗi thì bỏ qua. */
export async function sendMail(user: Player | null, to: string, kind: string, body: string) {
  const sb = supabase();
  if (!sb || !user || !to || to === user.username || isTest(to)) return;
  await sb.rpc('vkl_mail_send', { p_token: user.token, p_to: to, p_kind: kind, p_body: body });
}

export async function listMail(user: Player | null): Promise<Mail[]> {
  const sb = supabase();
  if (!sb || !user) return [];
  const { data, error } = await sb.rpc('vkl_mail_list', { p_token: user.token });
  return error ? [] : ((data as Mail[]) ?? []);
}

export async function unreadMail(user: Player | null): Promise<number> {
  const sb = supabase();
  if (!sb || !user) return 0;
  const { data, error } = await sb.rpc('vkl_mail_unread', { p_token: user.token });
  return error ? 0 : ((data as number) ?? 0);
}

// ---------- Danh hiệu tuần, thống kê kết cục ----------
const TITLE_ORDER = [
  tr('Thiên Hạ Đệ Nhất', "Number One Under Heaven"),
  tr('Võ Lâm Minh Chủ', "Martial Alliance Leader"),
  tr('Đệ Nhất Ma Đầu', "Foremost Demon Lord"),
  tr('Đệ Nhị Cao Thủ', "Second Master"),
  tr('Đệ Tam Cao Thủ', "Third Master"),
  tr('Phú Khả Địch Quốc', "Richer Than Nations"),
  tr('Thọ Tỷ Nam Sơn', "Long as the Southern Hills"),
  tr('Đệ Nhị Phú Hào', "Second Richest"),
  tr('Đệ Nhị Thọ Tinh', "Second Longest-Lived"),
  tr('Đệ Tam Phú Hào', "Third Richest"),
  tr('Đệ Tam Thọ Tinh', "Third Longest-Lived"),
];
let titlesCache: Promise<Record<string, string[]>> | null = null;

/** Danh hiệu tuần này gắn với từng nhân vật (người chơi + kiếp thứ mấy): năng lực, phú hào, trường thọ. Một nhân vật có thể giữ nhiều danh hiệu. */
export function weeklyTitles(): Promise<Record<string, string[]>> {
  if (titlesCache) return titlesCache;
  titlesCache = (async () => {
    const sb = supabase();
    if (!sb) return {};
    const { data, error } = await sb.rpc('vkl_titles_char');
    if (error || !data) return {};
    const out: Record<string, string[]> = {};
    for (const r of data as { username: string; life_no: number; title: string }[]) {
      const k = titleKey(r.username, r.life_no);
      out[k] = [...(out[k] ?? []), r.title].sort((a, b) => TITLE_ORDER.indexOf(a) - TITLE_ORDER.indexOf(b));
    }
    return out;
  })();
  // làm mới sau 5 phút
  setTimeout(() => (titlesCache = null), 5 * 60 * 1000);
  return titlesCache;
}

export const titleKey = (username: string, lifeNo: number | undefined) => `${username}|${lifeNo ?? 1}`;

export async function endingStats(): Promise<{ total: number; counts: Record<string, number> } | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('vkl_ending_stats');
  return error ? null : (data as { total: number; counts: Record<string, number> });
}

/** Báo kết cục vừa mở: ai mở đầu tiên thì cả giang hồ nhận thư Thiên Đạo. Trả về các kết cục mình là người đầu tiên. */
export async function endingFirst(user: Player | null, ids: string[], names: string[]): Promise<string[]> {
  const sb = supabase();
  if (!sb || !user || !ids.length) return [];
  const { data, error } = await sb.rpc('vkl_ending_first', { p_token: user.token, p_ids: ids, p_names: names });
  return error ? [] : ((data as string[]) ?? []);
}

/** Người đầu tiên mở từng kết cục: id kết cục -> username */
export async function endingFirsts(): Promise<Record<string, string>> {
  const sb = supabase();
  if (!sb) return {};
  const { data, error } = await sb.rpc('vkl_ending_firsts');
  return error ? {} : ((data as Record<string, string>) ?? {});
}

// ---------- Danh hiệu sưu tầm ----------
let collectorsCache: Promise<Record<string, number>> | null = null;
/** Người chơi đã mở nhiều kết cục trong Sổ Sinh Tử: username -> số kết cục */
export function collectors(min = 8): Promise<Record<string, number>> {
  if (collectorsCache) return collectorsCache;
  collectorsCache = (async () => {
    const sb = supabase();
    if (!sb) return {};
    const { data, error } = await sb.rpc('vkl_collectors', { p_min: min });
    if (error || !data) return {};
    return Object.fromEntries((data as { username: string; endings: number }[]).map((r) => [r.username, r.endings]));
  })();
  setTimeout(() => (collectorsCache = null), 5 * 60 * 1000);
  return collectorsCache;
}

// ---------- Danh hiệu Thiên thư ----------
let loreMastersCache: Promise<Record<string, string>> | null = null;
/** Người đã đi hết một quyển Thiên thư: username -> danh hiệu (Vạn Kiếp Quy Nhất, Kẻ Gõ Chuông, Phá Chuông) */
export function loreMasters(): Promise<Record<string, string>> {
  if (loreMastersCache) return loreMastersCache;
  loreMastersCache = (async () => {
    const sb = supabase();
    if (!sb) return {};
    const { data, error } = await sb.rpc('vkl_lore_masters');
    if (error || !data) return {};
    return Object.fromEntries((data as { username: string; title: string }[]).map((r) => [r.username, r.title]));
  })();
  setTimeout(() => (loreMastersCache = null), 5 * 60 * 1000);
  return loreMastersCache;
}

/** Tài khoản vừa tạo: đưa hồ sơ và kiếp đang chơi dở của chế độ khách cũ (lưu trên máy) lên tài khoản, rồi xóa bản trên máy */
export async function carryGuest(user: Player | null) {
  if (!user) return;
  const meta = readLocal<Meta>(K.meta);
  const save = readLocal<SaveState>(K.save);
  if (meta && (meta.lives ?? 0) > 0) await saveMeta(user, { ...emptyMeta(), ...meta });
  if (save) {
    saveLocal(user, save);
    await saveRemote(user, save);
  }
  // khắc các bia đáng ghi danh từ lúc chơi thử lên Nghĩa trang tu sĩ, đứng tên tài khoản mới
  for (const g of pendingGraves().reverse()) await addMemorial(user, { ...g, player_name: user.username }).catch(() => {});
  writeLocal(K.pending, null);
  writeLocal(K.meta, null);
  writeLocal(K.save, null);
}
