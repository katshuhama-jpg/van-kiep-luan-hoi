/**
 * 4.5.0 Ngày 3: thẻ khoe chân thân (dọc 1080x1350 và ngang cho xem trước link).
 * Chân thân, pháp danh, số huyệt, danh hiệu. Vẽ pixel bằng các hàm của lib/shareCard.ts.
 */
import { CW, OH, OW, SITE, box, canvas, deliver, paper, seal, txt, type ShareOut } from './shareCard';
import { composeFrame } from './lpc';
import { ctLayers } from './game/chanThan';
import { HUYET, HUYET_POS, ctTitles, huyetCount, tamTaiCount, type DaoExt } from './game/khaiMach';
import type { Meta } from './game/types';
import { tr } from './i18n';

/** Vẽ chân thân với chấm huyệt. Khung LpcFigure lấy ô 128 của dải ảnh, nên dùng cùng tỉ lệ để chấm khớp với giao diện. */
async function drawCt(x: CanvasRenderingContext2D, meta: Meta, cx: number, top: number, size: number) {
  const ct = meta.chanThan!;
  try {
    const img = await composeFrame(ctLayers(ct), 'idle', 2, 0);
    x.save();
    x.imageSmoothingEnabled = false;
    // giống LpcFigure: ô 128 phóng thành 2*size, đặt lệch lên 0.64*size
    x.drawImage(img, 0, 0, 128, 128, Math.round(cx - size), Math.round(top - 0.64 * size), size * 2, size * 2);
    x.restore();
  } catch {}
  const n = huyetCount(meta);
  const d = Math.round(size / 26);
  for (const h of HUYET) {
    const p = HUYET_POS[h.id];
    const px = Math.round(cx - size / 2 + p.x * size - d / 2);
    const py = Math.round(top + p.y * size - d / 2);
    x.fillStyle = h.id <= n ? '#2a1a08' : '#14101e';
    x.fillRect(px - 3, py - 3, d + 6, d + 6);
    x.fillStyle = h.id <= n ? '#ffd36b' : '#4a4258';
    x.fillRect(px, py, d, d);
  }
}

export async function shareChanThan(meta: Meta, ext: DaoExt, who: string): Promise<ShareOut | null> {
  const ct = meta.chanThan;
  if (!ct) return null;
  const n = huyetCount(meta);
  const titles = ctTitles(meta, ext);
  const tt = tamTaiCount(meta, ext);
  const c = await canvas();
  if (!c) return null;
  const { cv, x } = c;
  paper(x, 'dem');
  txt(x, tr('CHÂN THÂN', 'TRUE SELF'), CW / 2, 140, 60, '#ffd36b', { w: 700, shadow: '#000' });
  txt(x, who, CW / 2, 192, 32, '#c8b89a', { max: CW - 200 });
  box(x, 150, 228, CW - 300, 640, '#13101c', '#3a2864');
  await drawCt(x, meta, CW / 2, 300, 560);
  txt(x, ct.name, CW / 2, 950, 84, '#fff3dc', { w: 700, shadow: '#000', max: CW - 200 });
  // thanh 10 ô
  const cell = 60;
  const x0 = CW / 2 - (cell * 10 + 9 * 10) / 2;
  for (let i = 0; i < 10; i++) box(x, x0 + i * (cell + 10), 1000, cell, 30, i < n ? '#ffd36b' : '#2a2436', '#000');
  txt(x, tr(`${n}/10 đại huyệt · Tam Tài ${tt}/42`, `${n}/10 great points · Three Treasures ${tt}/42`), CW / 2, 1090, 36, '#9ff0c8', { w: 700 });
  if (titles.length) txt(x, titles.slice(0, 2).join(' · '), CW / 2, 1150, 40, '#ffb0a0', { w: 700, max: CW - 200 });
  if (n >= 10) seal(x, CW - 290, 1170, 140, tr('MẠCH', 'MER'), '#b0201a', 56);
  txt(x, 'VẠN KIẾP LUÂN HỒI', 150, 1252, 36, '#ffd36b', { w: 700, align: 'left' });
  txt(x, SITE, 150, 1296, 28, '#c8b89a', { align: 'left' });
  // bản ngang
  const o = await canvas(OW, OH);
  if (!o) return null;
  const g = o.x;
  paper(g, 'dem', OW, OH);
  await drawCt(g, meta, 300, 80, 440);
  txt(g, tr('CHÂN THÂN', 'TRUE SELF'), 820, 150, 44, '#ffd36b', { w: 700, shadow: '#000' });
  txt(g, ct.name, 820, 250, 72, '#fff3dc', { w: 700, shadow: '#000', max: 640 });
  txt(g, tr(`${n}/10 đại huyệt`, `${n}/10 great points`), 820, 330, 40, '#9ff0c8', { w: 700 });
  txt(g, tr(`Tam Tài ${tt}/42`, `Three Treasures ${tt}/42`), 820, 390, 34, '#c8b89a');
  if (titles.length) txt(g, titles[0], 820, 460, 40, '#ffb0a0', { w: 700, max: 640 });
  txt(g, `${who} · VẠN KIẾP LUÂN HỒI`, 820, 566, 26, '#c8b89a', { max: 640 });
  const title = tr(`Chân thân ${ct.name}: ${n}/10 đại huyệt${titles[0] ? `, ${titles[0]}` : ''}`, `True self ${ct.name}: ${n}/10 great points${titles[0] ? `, ${titles[0]}` : ''}`);
  const desc = tr(`Tam Tài ${tt}/42. Mỗi kiếp là một giấc mộng; mộng tan, chân thân còn.`, `Three Treasures ${tt}/42. Each life is a dream; the dream ends, the true self remains.`);
  const text = tr(`Chân thân ${ct.name} của tôi đã khai ${n}/10 đại huyệt.`, `My true self ${ct.name} has opened ${n}/10 great points.`);
  return deliver(cv, o.cv, 'life', `chan-than-${who.replace(/[^\w-]+/g, '')}`, title, desc, text);
}
