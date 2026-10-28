/**
 * Bảng Chứng Đạo: trục so sánh mới khi bảng năng lực đã chạm trần (nhiều người cùng Đại La hậu kỳ).
 * Lấy từ bia các kiếp chứng đạo (look.endTag = 'chung_dao'): số lần chứng đạo, chứng đạo nhanh nhất, được vạn kiếp hộ đạo.
 */
import { supabase } from './supabase';

export interface CdRow {
  player: string;
  times: number; // số lần chứng đạo
  fastest: { lifeNo: number; age: number; name: string }; // kiếp chứng đạo sớm nhất (ít kiếp nhất)
  hoDao: number; // số lần được vạn kiếp hộ đạo
  first: string; // lần đầu chứng đạo
}

const HO_DAO_RE = /^(Vạn kiếp đứng ra|Ten thousand past lives)/;
const isTest = (n: string) => /^(test|ui)_/.test(n) || n === 'Khách' || n === 'Guest';

export async function chungDaoBoard(): Promise<CdRow[] | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('vkl_lives')
    .select('player_name, char_name, life_no, age, cause, created_at')
    .eq('look->>endTag', 'chung_dao')
    .order('created_at', { ascending: true })
    .limit(2000);
  if (error) return null;
  const by = new Map<string, CdRow>();
  for (const r of (data as { player_name: string; char_name: string; life_no: number; age: number; cause: string | null; created_at: string }[]) ?? []) {
    if (isTest(r.player_name)) continue;
    const cur = by.get(r.player_name) ?? { player: r.player_name, times: 0, fastest: { lifeNo: r.life_no, age: r.age, name: r.char_name }, hoDao: 0, first: r.created_at };
    cur.times += 1;
    if (r.life_no < cur.fastest.lifeNo || (r.life_no === cur.fastest.lifeNo && r.age < cur.fastest.age)) cur.fastest = { lifeNo: r.life_no, age: r.age, name: r.char_name };
    if (r.cause && HO_DAO_RE.test(r.cause)) cur.hoDao += 1;
    by.set(r.player_name, cur);
  }
  return [...by.values()];
}

/** Ba cách xếp: bằng nhau thì ai đạt trước đứng trên */
export const byTimes = (rows: CdRow[]) => rows.slice().sort((a, b) => b.times - a.times || a.first.localeCompare(b.first));
export const byFastest = (rows: CdRow[]) => rows.slice().sort((a, b) => a.fastest.lifeNo - b.fastest.lifeNo || a.fastest.age - b.fastest.age || a.first.localeCompare(b.first));
export const byHoDao = (rows: CdRow[]) => rows.filter((r) => r.hoDao > 0).sort((a, b) => b.hoDao - a.hoDao || a.first.localeCompare(b.first));
