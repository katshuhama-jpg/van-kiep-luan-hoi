'use client';

/**
 * Thẻ "Thất Nhật Lục": tóm tắt các kiếp trong 7 ngày, vẽ pixel như thẻ một đời, khoe được qua link /k/<mã>.
 */
import { CW, OH, OW, box, canvas, deliver, hero, paper, seal, txt, wrapTxt, SITE, type ShareOut } from './shareCard';
import { foeChar } from './game/duel';
import { realmLabel } from './game/data';
import type { PastSelf, WeekWrap } from './vanKiep';
import { tr } from './i18n';

const realmOf = (p: PastSelf) => (p.ascended ? tr('Phi thăng', 'Ascended') : p.realm === 0 ? tr('Phàm nhân', 'Mortal') : realmLabel(p.realm, 1));

function range(now = Date.now()): string {
  const f = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
  return `${f(new Date(now - 6 * 86400000))} - ${f(new Date(now))}`;
}

export async function shareWeek(w: WeekWrap, lives: PastSelf[], who: string): Promise<ShareOut | null> {
  const c = await canvas();
  if (!c) return null;
  const { cv, x } = c;
  paper(x, 'dem');
  txt(x, tr('THẤT NHẬT LỤC', 'SEVEN-DAY CHRONICLE'), CW / 2, 150, 66, '#ffd36b', { w: 700, shadow: '#000' });
  txt(x, `${who} · ${range()}`, CW / 2, 204, 34, '#c8b89a', { max: CW - 200 });
  // hàng bóng các kiếp trong tuần, kiếp mạnh nhất ở giữa to hơn
  const row = lives.slice(-7);
  const step = Math.min(132, (CW - 220) / Math.max(1, row.length));
  const x0 = CW / 2 - (step * (row.length - 1)) / 2;
  box(x, 96, 236, CW - 192, 380, '#1c1430', '#3a2864');
  for (let i = 0; i < row.length; i++) await hero(x, foeChar(row[i].rival), x0 + i * step, 290, row.length > 4 ? 3.6 : 4.2, 2, false);
  // danh hiệu
  box(x, 96, 640, CW - 192, 150, '#5a1420', '#000');
  txt(x, tr('Danh hiệu tuần', 'Title of the week'), CW / 2, 690, 30, '#f3c8b0');
  txt(x, w.title, CW / 2, 754, 56, '#fff3dc', { w: 700, shadow: '#000', max: CW - 260 });
  // ô số
  const cell = (cx: number, cy: number, big: string, small: string) => {
    box(x, cx, cy, 420, 150, '#2a1f3d', '#5a4a8a');
    txt(x, big, cx + 210, cy + 74, 56, '#9ff0c8', { w: 700, shadow: '#000', max: 390 });
    txt(x, small, cx + 210, cy + 124, 28, '#c8b89a', { max: 390 });
  };
  cell(108, 816, `${w.n}`, tr('kiếp đã sống', 'lives lived'));
  cell(CW - 528, 816, `${w.years}`, tr('năm trên đời', 'years on earth'));
  let y = 990;
  const line = (label: string, val: string) => {
    txt(x, label, 130, y, 30, '#a89878', { align: 'left' });
    txt(x, val, CW - 130, y, 32, '#fff3dc', { align: 'right', w: 700, max: CW - 470 });
    y += 46;
  };
  if (w.top) line(tr('Cảnh giới cao nhất', 'Highest realm'), `${realmOf(w.top)} · ${w.top.name}`);
  if (w.longest) line(tr('Sống lâu nhất', 'Longest life'), tr(`${w.longest.name}, ${Math.floor(w.longest.age)} tuổi`, `${w.longest.name}, age ${Math.floor(w.longest.age)}`));
  if (w.shortest && w.n > 1) line(tr('Yểu mệnh nhất', 'Shortest life'), tr(`${w.shortest.name}, ${Math.floor(w.shortest.age)} tuổi`, `${w.shortest.name}, age ${Math.floor(w.shortest.age)}`));
  if (w.cause && w.cause.n > 1) {
    txt(x, tr(`Chết nhiều nhất (${w.cause.n} lần):`, `Most common death (${w.cause.n}x):`), 130, y, 30, '#a89878', { align: 'left' });
    wrapTxt(x, w.cause.text, 130, y + 38, w.dao || w.ascended ? CW - 460 : CW - 260, 34, 28, '#ffb0a0', 2, 'left');
  }
  if (w.dao || w.ascended) seal(x, CW - 290, 1170, 140, w.dao ? tr('ĐẠO', 'DAO') : tr('TIÊN', 'IMM'), '#b0201a', 56);
  txt(x, tr('VẠN KIẾP LUÂN HỒI', 'VẠN KIẾP LUÂN HỒI'), 150, 1252, 36, '#ffd36b', { w: 700, align: 'left' });
  txt(x, SITE, 150, 1296, 28, '#c8b89a', { align: 'left' });

  // bản ngang cho xem trước link
  const o = await canvas(OW, OH);
  if (!o) return null;
  const g = o.x;
  paper(g, 'dem', OW, OH);
  txt(g, tr('THẤT NHẬT LỤC', 'SEVEN-DAY CHRONICLE'), OW / 2, 96, 48, '#ffd36b', { w: 700, shadow: '#000' });
  const r2 = lives.slice(-5);
  const s2 = Math.min(150, (OW - 240) / Math.max(1, r2.length));
  const g0 = OW / 2 - (s2 * (r2.length - 1)) / 2;
  for (let i = 0; i < r2.length; i++) await hero(g, foeChar(r2[i].rival), g0 + i * s2, 120, 3.2, 2, false);
  txt(g, w.title, OW / 2, 440, 48, '#fff3dc', { w: 700, shadow: '#000', max: OW - 160 });
  txt(g, tr(`${w.n} kiếp · ${w.years} năm trên đời`, `${w.n} lives · ${w.years} years on earth`), OW / 2, 500, 32, '#9ff0c8', { w: 700 });
  txt(g, `${who} · VẠN KIẾP LUÂN HỒI`, OW / 2, 566, 26, '#c8b89a');
  const title = tr(`${who}: ${w.n} kiếp trong một tuần, danh hiệu "${w.title}"`, `${who}: ${w.n} lives in one week, title "${w.title}"`);
  const desc = tr(`${w.years} năm trên đời${w.top ? `, cao nhất ${realmOf(w.top)}` : ''}. Vào Vạn Kiếp Luân Hồi xem tuần của bạn.`, `${w.years} years on earth${w.top ? `, highest ${realmOf(w.top)}` : ''}. Play Ten Thousand Rebirths and see your week.`);
  const text = tr(`Tuần này tôi sống ${w.n} kiếp, tổng ${w.years} năm, được phong "${w.title}".`, `This week I lived ${w.n} lives, ${w.years} years in total, and earned the title "${w.title}".`);
  return deliver(cv, o.cv, 'life', `that-nhat-luc-${who.replace(/[^\w-]+/g, '')}`, title, desc, text);
}

