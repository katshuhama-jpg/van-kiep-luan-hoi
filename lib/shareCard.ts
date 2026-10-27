'use client';

/**
 * Thẻ khoe 1080x1350 (vừa khung Threads, Facebook), vẽ kiểu pixel:
 * khung, hoa văn, ấn đều là ô vuông bội số 6; nhân vật LPC phóng to không làm mịn.
 * Dùng chung cho thẻ kết quả trận lôi đài và Thẻ Một đời.
 */
import { lpcLayers } from '@/components/Sprite';
import { composeFrame } from '@/lib/lpc';
import { foeChar } from '@/lib/game/duel';
import { PATHS, realmLabel } from '@/lib/game/data';
import type { Character, RivalChar } from '@/lib/game/types';
import { currentPlayer } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { SITE_URL } from '@/lib/seo';

export const CW = 1080;
export const CH = 1350;
export const P = 6; // một "điểm ảnh" của thẻ
export const SITE = 'van-kiep-luan-hoi.vercel.app';

export const font = (px: number, w = 600) => `${w} ${px}px 'Barlow Semi Condensed', sans-serif`;

export const OW = 1200;
export const OH = 630;

export async function canvas(w = CW, h = CH): Promise<{ cv: HTMLCanvasElement; x: CanvasRenderingContext2D } | null> {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const x = cv.getContext('2d');
  if (!x) return null;
  try {
    await document.fonts.load(font(40));
    await document.fonts.load(font(40, 700));
  } catch {}
  x.imageSmoothingEnabled = false;
  return { cv, x };
}

/** Ô vuông nguyên theo lưới P */
export function blk(x: CanvasRenderingContext2D, gx: number, gy: number, gw: number, gh: number, c: string) {
  x.fillStyle = c;
  x.fillRect(Math.round(gx / P) * P, Math.round(gy / P) * P, Math.round(gw / P) * P, Math.round(gh / P) * P);
}

/** Nền giấy da, viền gỗ hai lớp, đinh vàng bốn góc */
export function paper(x: CanvasRenderingContext2D, tone: 'giay' | 'dem' = 'giay', CW = 1080, CH = 1350) {
  const dark = tone === 'dem';
  blk(x, 0, 0, CW, CH, '#1f160d');
  blk(x, P * 3, P * 3, CW - P * 6, CH - P * 6, dark ? '#3a1f1a' : '#8a5a2e');
  blk(x, P * 5, P * 5, CW - P * 10, CH - P * 10, dark ? '#1a0e10' : '#f3e6c4');
  // hạt giấy
  for (let i = 0; i < 160; i++) blk(x, P * 6 + ((i * 397) % (CW - P * 14)), P * 6 + ((i * 251) % (CH - P * 14)), P, P, dark ? '#2a1820' : '#e4d2a6');
  // viền trong
  for (let k = 0; k < 2; k++) {
    const c = k ? (dark ? '#c08a3a' : '#3e3228') : dark ? '#5a2a1a' : '#b08a5a';
    const o = P * (8 + k);
    blk(x, o, o, CW - o * 2, P, c);
    blk(x, o, CH - o - P, CW - o * 2, P, c);
    blk(x, o, o, P, CH - o * 2, c);
    blk(x, CW - o - P, o, P, CH - o * 2, c);
  }
  // đinh góc
  for (const [ax, ay] of [
    [P * 12, P * 12],
    [CW - P * 15, P * 12],
    [P * 12, CH - P * 15],
    [CW - P * 15, CH - P * 15],
  ]) {
    blk(x, ax, ay, P * 3, P * 3, '#ffd36b');
    blk(x, ax + P, ay + P, P, P, '#fff8dc');
  }
}

/** Ô khung có viền pixel */
export function box(x: CanvasRenderingContext2D, bx: number, by: number, bw: number, bh: number, fill: string, edge: string) {
  blk(x, bx, by, bw, bh, edge);
  blk(x, bx + P, by + P, bw - P * 2, bh - P * 2, fill);
}

/** Nhân vật LPC phóng to không làm mịn; khung 128, người nằm khoảng giữa */
export async function hero(x: CanvasRenderingContext2D, c: Character, cx: number, top: number, scale: number, dir = 2, dead = false) {
  try {
    const img = await composeFrame(lpcLayers({ ...c, dead: false }), 'idle', dir, 0);
    x.save();
    x.imageSmoothingEnabled = false;
    if (dead) x.filter = 'grayscale(1) brightness(0.7)';
    x.drawImage(img, 32, 24, 64, 80, Math.round(cx - 32 * scale), top, 64 * scale, 80 * scale);
    x.restore();
  } catch {}
}

/** Chữ có bóng đổ cứng kiểu pixel */
export function txt(x: CanvasRenderingContext2D, s: string, tx: number, ty: number, px: number, col: string, opt: { w?: number; shadow?: string; align?: CanvasTextAlign; max?: number } = {}) {
  x.font = font(px, opt.w ?? 600);
  x.textAlign = opt.align ?? 'center';
  if (opt.shadow) {
    x.fillStyle = opt.shadow;
    x.fillText(s, tx + P / 2, ty + P / 2, opt.max);
  }
  x.fillStyle = col;
  x.fillText(s, tx, ty, opt.max);
}

/** Xuống dòng theo bề ngang, trả về y sau dòng cuối */
export function wrapTxt(x: CanvasRenderingContext2D, s: string, tx: number, ty: number, maxW: number, lh: number, px: number, col: string, maxLines = 3, align: CanvasTextAlign = 'center'): number {
  x.font = font(px);
  x.textAlign = align;
  x.fillStyle = col;
  const words = s.split(' ');
  let line = '';
  let n = 0;
  let y = ty;
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (x.measureText(t).width > maxW && line) {
      n++;
      x.fillText(n === maxLines ? `${line}...` : line, tx, y);
      y += lh;
      line = w;
      if (n === maxLines) return y;
    } else line = t;
  }
  if (line) {
    x.fillText(line, tx, y);
    y += lh;
  }
  return y;
}

/** Ấn đỏ vuông kiểu pixel, chữ ở giữa */
export function seal(x: CanvasRenderingContext2D, sx: number, sy: number, size: number, label: string, col = '#b0201a', px = 120) {
  blk(x, sx, sy, size, size, col);
  blk(x, sx + P * 2, sy + P * 2, size - P * 4, P, '#f3e6c4');
  blk(x, sx + P * 2, sy + size - P * 3, size - P * 4, P, '#f3e6c4');
  blk(x, sx + P * 2, sy + P * 2, P, size - P * 4, '#f3e6c4');
  blk(x, sx + size - P * 3, sy + P * 2, P, size - P * 4, '#f3e6c4');
  txt(x, label, sx + size / 2, sy + size / 2 + px * 0.36, px, '#f3e6c4', { w: 700 });
}

const toBlob = (cv: HTMLCanvasElement) => new Promise<Blob | null>((res) => cv.toBlob((b) => res(b), 'image/png'));

/** Đẩy ảnh ngang lên server, nhận link /k/<mã> có xem trước hình nhân vật */
export async function publish(kind: 'life' | 'match', title: string, desc: string, og: HTMLCanvasElement): Promise<string | null> {
  const user = currentPlayer();
  const sb = supabase();
  if (!user || !sb) return null;
  const b64 = og.toDataURL('image/png').split(',')[1];
  const { data, error } = await sb.rpc('vkl_card_put', { p_token: user.token, p_kind: kind, p_title: title, p_desc: desc, p_png: b64 });
  return error || !data ? null : `${SITE_URL}/k/${data as string}`;
}

/** Tải ảnh dọc về máy */
export async function download(cv: HTMLCanvasElement, name: string): Promise<boolean> {
  const b = await toBlob(cv);
  if (!b) return false;
  const url = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}

/** Kết quả chuẩn bị khoe: có link thì mở bảng khoe trong game, không có thì đã tải ảnh về */
export type ShareOut = { link: string | null; title: string; text: string; saved: boolean };

/**
 * Chuẩn bị khoe: đẩy ảnh ngang lên server lấy link /k/<mã> (dán lên mạng hiện hình nhân vật, tiêu đề, mô tả).
 * Không tạo được link thì tải ảnh dọc về máy.
 */
export async function deliver(portrait: HTMLCanvasElement, og: HTMLCanvasElement, kind: 'life' | 'match', name: string, title: string, desc: string, text: string): Promise<ShareOut> {
  const link = await publish(kind, title, desc, og);
  if (link) return { link, title, text, saved: false };
  return { link: null, title, text, saved: await download(portrait, name) };
}

/** Link mở thẳng từng mạng xã hội */
export function shareTargets(link: string, text: string) {
  const e = encodeURIComponent;
  return {
    threads: `https://www.threads.net/intent/post?text=${e(`${text}\n${link}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${e(link)}`,
    messenger: `fb-messenger://share/?link=${e(link)}`,
  };
}

export async function copyText(s: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(s);
    return true;
  } catch {
    return false;
  }
}

const realmOf = (r: { realm: number; layer: number; cosmos?: 'tien' | 'ma' | 'hu' | null }) => (r.realm === 0 ? 'Phàm nhân' : realmLabel(r.realm, r.layer, r.cosmos));

/** Thẻ kết quả trận lôi đài: "@A hạ @B, còn 3% máu, cắm 17 phi kiếm" */
export async function shareMatch(m: { me: RivalChar; foe: RivalChar; meUser: string; opp: string; win: boolean; hp: number; swords: number; rule: string }): Promise<ShareOut | null> {
  const c = await canvas();
  if (!c) return null;
  const { cv, x } = c;
  paper(x, 'dem');
  txt(x, 'LÔI ĐÀI PHI KIẾM', CW / 2, 150, 64, '#ffd36b', { w: 700, shadow: '#000' });
  txt(x, `Luật hôm nay: ${m.rule}`, CW / 2, 204, 34, '#c8b89a');
  // hai bóng
  const winSide = m.win ? 'me' : 'foe';
  for (const side of ['me', 'foe'] as const) {
    const r = side === 'me' ? m.me : m.foe;
    const cx = side === 'me' ? 290 : CW - 290;
    box(x, cx - 216, 252, 432, 528, winSide === side ? '#2a1f3d' : '#1f1418', winSide === side ? '#ffd36b' : '#5a4a4a');
    await hero(x, foeChar(r), cx, 276, 5.4, side === 'me' ? 3 : 1, winSide !== side);
    txt(x, r.name, cx, 836, 44, '#fff3dc', { w: 700, max: 420 });
    txt(x, `@${side === 'me' ? m.meUser : m.opp}`, cx, 882, 32, '#c8b89a', { max: 420 });
    txt(x, `${realmOf(r)}${r.path ? ' · ' + PATHS[r.path].name : ''}`, cx, 924, 28, '#a89878', { max: 420 });
  }
  seal(x, CW / 2 - 78, 440, 156, 'VS', '#5a2a1a', 64);
  // dải kết quả
  box(x, 96, 966, CW - 192, 210, m.win ? '#3a6a2a' : '#7a1e18', '#000');
  txt(x, m.win ? `@${m.meUser} hạ @${m.opp}` : `@${m.opp} hạ @${m.meUser}`, CW / 2, 1048, 58, '#fff8e6', { w: 700, shadow: '#000', max: CW - 260 });
  txt(x, `Còn ${m.hp}% máu · cắm ${m.swords} phi kiếm`, CW / 2, 1120, 40, '#ffe9a8', { max: CW - 260 });
  seal(x, CW - 300, 1186, 132, m.win ? 'THẮNG' : 'BẠI', m.win ? '#b0201a' : '#3e3228', 44);
  txt(x, 'VẠN KIẾP LUÂN HỒI', 150, 1252, 36, '#ffd36b', { w: 700, align: 'left' });
  txt(x, SITE, 150, 1296, 28, '#c8b89a', { align: 'left' });
  // bản ngang cho xem trước link
  const o = await canvas(OW, OH);
  if (!o) return null;
  const g = o.x;
  paper(g, 'dem', OW, OH);
  for (const side of ['me', 'foe'] as const) {
    const r = side === 'me' ? m.me : m.foe;
    const cx = side === 'me' ? 250 : OW - 250;
    box(g, cx - 168, 96, 336, 384, winSide === side ? '#2a1f3d' : '#1f1418', winSide === side ? '#ffd36b' : '#5a4a4a');
    await hero(g, foeChar(r), cx, 108, 4.2, side === 'me' ? 3 : 1, winSide !== side);
    txt(g, `@${side === 'me' ? m.meUser : m.opp}`, cx, 520, 36, '#fff3dc', { w: 700, max: 330 });
  }
  seal(g, OW / 2 - 66, 210, 132, 'VS', '#5a2a1a', 56);
  txt(g, m.win ? 'THẮNG' : 'BẠI', OW / 2, 420, 52, m.win ? '#ffd36b' : '#ff6b5a', { w: 700, shadow: '#000' });
  txt(g, `${m.swords} phi kiếm · còn ${m.hp}% máu`, OW / 2, 470, 28, '#e8dcc0', { max: 330 });
  txt(g, 'LÔI ĐÀI · VẠN KIẾP LUÂN HỒI', OW / 2, 556, 26, '#ffd36b', { w: 700 });
  const title = m.win ? `@${m.meUser} hạ @${m.opp} trên lôi đài` : `@${m.opp} hạ @${m.meUser} trên lôi đài`;
  const desc = `${m.me.name} đấu ${m.foe.name}, cắm ${m.swords} phi kiếm, ${m.win ? 'thắng' : 'thua'} khi ${m.win ? 'còn' : 'đối thủ còn'} ${m.hp}% máu. Luật hôm nay: ${m.rule}. Vào Vạn Kiếp Luân Hồi lên đài thử sức.`;
  const text = m.win ? `Tôi vừa hạ @${m.opp} trên lôi đài Vạn Kiếp Luân Hồi, còn ${m.hp}% máu, cắm ${m.swords} phi kiếm.` : `@${m.opp} vừa thắng tôi trên lôi đài Vạn Kiếp Luân Hồi. Mai báo thù!`;
  return deliver(cv, o.cv, 'match', `loi-dai-${m.meUser}-${m.opp}`, title, desc, text);
}
