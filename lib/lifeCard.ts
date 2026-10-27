'use client';

/**
 * Thẻ Một đời (3.2.0): ảnh dọc 1080x1350 để khoe một kiếp.
 * Xếp loại S/A/B/C/D, dòng "vượt X% giang hồ", 3 dòng đáng nhớ, tên game ở chân thẻ.
 * Ngưỡng xếp loại chỉnh trên 900 kiếp đã ghi (27/10): S khoảng 4%, A 7%, B 18%, C 28%.
 */
import { PATHS, realmLabel } from '@/lib/game/data';
import { RARE_COLOR, type Ending } from '@/lib/game/endings';
import type { Character } from '@/lib/game/types';
import { supabase } from '@/lib/supabase';
import { CH, CW, OH, OW, P, SITE, blk, box, canvas, copyText, deliver, hero, paper, seal, txt, wrapTxt, type ShareOut } from '@/lib/shareCard';

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';
export const GRADE_COL: Record<Grade, string> = { S: '#d0202e', A: '#d9822b', B: '#8a3ad0', C: '#3d6fb0', D: '#6a5a44' };

/** Điểm gốc, giống hệt công thức trên database để so phần trăm */
export const baseScore = (c: Character) => c.realm * 10 + Math.floor(c.age) / 10 + (c.ascended ? 30 : 0);

export function gradeOf(c: Character, ending: Ending, isNew: boolean): { grade: Grade; score: number } {
  const score = baseScore(c) + (ending.rare >= 3 ? 20 : 0) + (isNew ? 10 : 0);
  const grade: Grade = score >= 120 ? 'S' : score >= 80 ? 'A' : score >= 50 ? 'B' : score >= 25 ? 'C' : 'D';
  return { grade, score };
}

/** Phần trăm kiếp trong giang hồ có điểm thấp hơn kiếp này */
export async function rankPct(c: Character): Promise<number | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('vkl_life_rank', { p_score: baseScore(c) });
  return error ? null : (data as number);
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

/** 3 dòng đáng nhớ: ưu tiên dòng có tên người chơi thật, rồi cột mốc lớn, rồi chuyện lớn trong nhật ký */
export function memorable(c: Character): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (age: number, t: string) => {
    const s = clean(t);
    if (!s || s.length > 110 || seen.has(s)) return;
    seen.add(s);
    out.push(`${age} tuổi: ${s}`);
  };
  const miles = (c.miles ?? []).filter((m) => m.kind !== 'birth' && m.kind !== 'death');
  const logs = c.log ?? [];
  for (const m of miles) if (/@\w/.test(m.text)) add(m.age, m.text);
  for (const l of logs) if (out.length < 3 && /@\w/.test(l.text) && l.tone !== 'normal') add(l.age, l.text);
  const order = ['revenge', 'duel', 'love', 'treasure', 'fate', 'realm', 'path', 'sect', 'pet', 'mount', 'wealth', 'hunt', 'journey'];
  for (const k of order) for (const m of miles) if (out.length < 3 && m.kind === k) add(m.age, m.text);
  for (const l of logs) if (out.length < 3 && l.tone === 'big') add(l.age, l.text);
  return out.slice(0, 3).sort((a, b) => parseInt(a) - parseInt(b));
}

const realmOf = (c: Character) => (c.realm === 0 ? 'Phàm nhân' : realmLabel(c.realm, c.layer, c.cosmos));

/** Bản chữ ngắn để dán vào nhóm */
export function lifeText(c: Character, ending: Ending, grade: Grade, pct: number | null): string {
  return `Kiếp ${c.lifeNo} · ${c.name} · ${realmOf(c)} · ${Math.floor(c.age)} tuổi · ${ending.name} · Xếp loại ${grade}${pct !== null ? ` · vượt ${pct}% giang hồ` : ''}\n${SITE}`;
}

/** Vẽ Thẻ Một đời, trả về canvas */
export async function drawLife(c: Character, ending: Ending, isNew: boolean, epitaph: string, pct: number | null): Promise<HTMLCanvasElement | null> {
  const cv0 = await canvas();
  if (!cv0) return null;
  const { cv, x } = cv0;
  const { grade } = gradeOf(c, ending, isNew);
  const rc = RARE_COLOR[ending.rare];
  paper(x);
  txt(x, 'VẠN KIẾP LUÂN HỒI', CW / 2, 138, 56, '#9a2a1e', { w: 700 });
  txt(x, `Kiếp thứ ${c.lifeNo}`, CW / 2, 186, 34, '#6a5a44');
  // khung nhân vật
  box(x, 150, 216, 504, 504, ending.rare >= 3 ? '#2a1f3d' : '#d8c79a', rc);
  if (ending.rare >= 3) for (let k = 0; k < 22; k++) blk(x, 168 + ((k * 61) % 460), 234 + ((k * 37) % 460), P, P, rc);
  await hero(x, { ...c, dead: false }, 150 + 252, 228, 6, 2);
  // ấn xếp loại ở góc
  seal(x, 702, 240, 228, grade, GRADE_COL[grade], 170);
  txt(x, 'XẾP LOẠI', 702 + 114, 506, 30, '#4a3a2a', { w: 700 });
  if (pct !== null) {
    box(x, 690, 540, 252, 174, '#1f160d', '#ffd36b');
    txt(x, 'Vượt', 816, 588, 30, '#c8b89a');
    txt(x, `${pct}%`, 816, 648, 60, '#ffd36b', { w: 700 });
    txt(x, 'giang hồ', 816, 690, 28, '#c8b89a');
  }
  // tên và thân thế
  txt(x, c.name, CW / 2, 800, 72, '#2a2018', { w: 700, max: CW - 200 });
  txt(x, `${Math.floor(c.age)} tuổi · ${realmOf(c)}${c.path ? ' · ' + PATHS[c.path].name : ''}`, CW / 2, 852, 36, '#4a3a2a', { max: CW - 200 });
  // kết cục
  box(x, 120, 880, CW - 240, 108, rc, '#1f160d');
  txt(x, `KẾT CỤC · ${['PHÀM', 'LINH', 'HUYỀN', 'ĐỊA', 'THIÊN'][ending.rare]} PHẨM${isNew ? ' · LẦN ĐẦU' : ''}`, CW / 2, 922, 28, '#fff8e6', { w: 700 });
  txt(x, ending.name, CW / 2, 970, 48, '#fff8e6', { w: 700, max: CW - 300 });
  // 3 dòng đáng nhớ
  const lines = memorable(c);
  let y = 1036;
  for (const l of lines) {
    blk(x, 132, y - 20, P * 2, P * 2, '#9a2a1e');
    y = wrapTxt(x, l, 162, y, CW - 300, 38, 30, '#3e3228', 2, 'left') + 6;
    if (y > CH - 190) break;
  }
  if (epitaph && y < CH - 150) wrapTxt(x, `"${epitaph}"`, CW / 2, y + 8, CW - 300, 38, 32, '#9a2a1e', 1);
  txt(x, SITE, CW / 2, CH - 96, 30, '#6a5a44');
  return cv;
}

/** Bản ngang 1200x630 cho xem trước link: nhân vật bên trái, xếp loại và kết cục bên phải */
export async function drawLifeOg(c: Character, ending: Ending, isNew: boolean, pct: number | null): Promise<HTMLCanvasElement | null> {
  const o = await canvas(OW, OH);
  if (!o) return null;
  const { cv, x } = o;
  const { grade } = gradeOf(c, ending, isNew);
  const rc = RARE_COLOR[ending.rare];
  paper(x, 'giay', OW, OH);
  box(x, 84, 84, 432, 462, ending.rare >= 3 ? '#2a1f3d' : '#d8c79a', rc);
  if (ending.rare >= 3) for (let k = 0; k < 16; k++) blk(x, 102 + ((k * 61) % 390), 102 + ((k * 37) % 420), P, P, rc);
  await hero(x, { ...c, dead: false }, 300, 96, 5.4, 2);
  txt(x, c.name, 560, 150, 60, '#2a2018', { w: 700, align: 'left', max: 420 });
  txt(x, `Kiếp ${c.lifeNo} · ${Math.floor(c.age)} tuổi`, 560, 200, 32, '#4a3a2a', { align: 'left', max: 420 });
  txt(x, `${realmOf(c)}${c.path ? ' · ' + PATHS[c.path].name : ''}`, 560, 244, 32, '#4a3a2a', { align: 'left', max: 420 });
  box(x, 560, 274, 420, 104, rc, '#1f160d');
  txt(x, `KẾT CỤC ${['PHÀM', 'LINH', 'HUYỀN', 'ĐỊA', 'THIÊN'][ending.rare]} PHẨM`, 770, 310, 24, '#fff8e6', { w: 700 });
  txt(x, ending.name, 770, 356, 40, '#fff8e6', { w: 700, max: 390 });
  seal(x, 560, 400, 150, grade, GRADE_COL[grade], 110);
  if (pct !== null) {
    txt(x, `Vượt ${pct}%`, 730, 466, 44, '#9a2a1e', { w: 700, align: 'left' });
    txt(x, 'các kiếp trong giang hồ', 730, 506, 28, '#4a3a2a', { align: 'left' });
  }
  txt(x, 'VẠN KIẾP LUÂN HỒI', OW - 96, OH - 74, 26, '#9a2a1e', { w: 700, align: 'right' });
  return cv;
}

export async function shareLife(c: Character, ending: Ending, isNew: boolean, epitaph: string, pct: number | null): Promise<ShareOut | null> {
  const [cv, og] = await Promise.all([drawLife(c, ending, isNew, epitaph, pct), drawLifeOg(c, ending, isNew, pct)]);
  if (!cv || !og) return null;
  const { grade } = gradeOf(c, ending, isNew);
  const title = `${c.name}, kiếp ${c.lifeNo}: ${ending.name} · Xếp loại ${grade}`;
  const desc = `${Math.floor(c.age)} tuổi, ${realmOf(c)}${c.path ? ', ' + PATHS[c.path].name : ''}.${pct !== null ? ` Vượt ${pct}% các kiếp trong giang hồ.` : ''} ${(memorable(c)[0] ?? '').replace(/([^.!?])$/, '$1.')} Đầu thai thử một kiếp ở Vạn Kiếp Luân Hồi.`.replace(/\s+/g, ' ').trim();
  return deliver(cv, og, 'life', `kiep-${c.lifeNo}-${c.name.replace(/\s+/g, '-')}`, title, desc, lifeText(c, ending, grade, pct).split('\n')[0]);
}

export async function copyLife(c: Character, ending: Ending, isNew: boolean, pct: number | null): Promise<boolean> {
  return copyText(lifeText(c, ending, gradeOf(c, ending, isNew).grade, pct));
}
