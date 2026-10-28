'use client';

/**
 * Con Đường Sau Chứng Đạo: hiện ở màn cáo biệt khi vừa chứng đạo.
 * Một dòng thứ hạng trên Bảng Chứng Đạo (người chơi ở lại vì được so), một bước tiếp theo, chạm để xem cả con đường,
 * và ô hỏi đạo hữu muốn Thiên Đạo thêm gì (gửi thẳng vào Góp ý).
 */
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { byTimes, chungDaoBoard } from '@/lib/chungDaoBoard';
import { addFeedback } from '@/lib/storage';
import { ENDINGS } from '@/lib/game/endings';
import { LORE } from '@/lib/game/lore';
import { HIDDEN_ITEMS } from '@/lib/game/collect';
import { nearEndings } from '@/lib/game/hook';
import type { Character, Meta } from '@/lib/game/types';
import { useAuth } from '@/lib/useAuth';
import { tr } from '@/lib/i18n';

export default function SauChungDao({ c, meta }: { c: Character; meta: Meta }) {
  const { user } = useAuth();
  const [rank, setRank] = useState<{ pos: number; of: number; times: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [wish, setWish] = useState('');
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    chungDaoBoard().then((rows) => {
      if (!rows) return;
      // kiếp vừa chứng đạo chưa kịp lên máy chủ: cộng vào trước khi xếp
      const mine = rows.find((r) => r.player === user.username);
      const next = mine ? rows.map((r) => (r === mine ? { ...r, times: r.times + 1 } : r)) : [...rows, { player: user.username, times: 1, fastest: { lifeNo: c.lifeNo, age: Math.floor(c.age), name: c.name }, hoDao: 0, first: new Date().toISOString() }];
      const list = byTimes(next);
      const pos = list.findIndex((r) => r.player === user.username);
      setRank({ pos: pos + 1, of: list.length, times: list[pos]?.times ?? 1 });
    });
  }, [user, c.lifeNo, c.age, c.name]);

  const road = useMemo(() => {
    const ends = Object.keys(meta.endings ?? {}).length + 1;
    const lore1 = LORE.filter((f) => (f.book ?? 1) === 1);
    const lore2 = LORE.filter((f) => f.book === 2);
    const got = new Set(meta.lore ?? []);
    const items = new Set(meta.itemBook ?? []);
    const near = nearEndings(c, meta.endings);
    const steps = [
      { key: 'end', done: ends >= ENDINGS.length, text: tr(`Sổ Sinh Tử: ${ends}/${ENDINGS.length} kết cục`, `Book of Life and Death: ${ends}/${ENDINGS.length} endings`), next: near[0] ? tr(`Gần mở nhất: ${near[0].name} - ${near[0].hint}`, `Closest: ${near[0].name} - ${near[0].hint}`) : null, href: '/so-sinh-tu' },
      { key: 'lore1', done: lore1.every((f) => got.has(f.id)), text: tr(`Thiên thư Quyển I: ${lore1.filter((f) => got.has(f.id)).length}/${lore1.length} mảnh`, `Heavenly Tome I: ${lore1.filter((f) => got.has(f.id)).length}/${lore1.length} fragments`), next: null, href: '/so-sinh-tu' },
      { key: 'lore2', done: lore2.every((f) => got.has(f.id)), text: tr(`Thiên thư Quyển II: ${lore2.filter((f) => got.has(f.id)).length}/${lore2.length} mảnh`, `Heavenly Tome II: ${lore2.filter((f) => got.has(f.id)).length}/${lore2.length} fragments`), next: null, href: '/so-sinh-tu' },
      { key: 'bell', done: !!meta.chuongWin, text: meta.chuongWin ? tr('Đã thắng Kẻ Gõ Chuông', 'Defeated the Bell Ringer') : tr('Kẻ Gõ Chuông: ???', 'The Bell Ringer: ???'), next: meta.chuongWin ? null : tr('Có kẻ đang gõ chuông trên đỉnh các cõi.', 'Someone is ringing a bell atop the realms.'), href: null },
      { key: 'items', done: items.size >= HIDDEN_ITEMS.length, text: tr(`Bảo khố: ${items.size}/${HIDDEN_ITEMS.length} món`, `Treasury: ${items.size}/${HIDDEN_ITEMS.length} items`), next: null, href: '/so-sinh-tu' },
    ];
    return steps;
  }, [c, meta]);
  const first = road.find((s) => !s.done && s.next) ?? road.find((s) => !s.done) ?? null;

  const send = async () => {
    const t = wish.trim();
    if (!t || !user) return;
    const err = await addFeedback(user, 'tinh_nang', tr(`[Sau chứng đạo] ${t}`, `[After Dao] ${t}`));
    setSent(err ?? tr('Thiên Đạo đã nghe. Tác giả sẽ đọc từng lời.', 'The Heavenly Dao has heard. The author will read every word.'));
    if (!err) setWish('');
  };

  return (
    <div className="scd">
      <small>{tr('Con đường sau chứng đạo', 'The road after the Dao')}</small>
      {rank && (
        <p className="scd-rank">
          {tr(`Bạn đứng thứ ${rank.pos}/${rank.of} trên Bảng Chứng Đạo với ${rank.times} lần chứng đạo.`, `You are #${rank.pos} of ${rank.of} on the Dao Board with ${rank.times} attainment(s).`)} <Link href="/bang-xep-hang">{tr('Xem bảng ›', 'See board ›')}</Link>
        </p>
      )}
      {first && (
        <p className="scd-next">
          <b>{tr('Bước tiếp theo: ', 'Next step: ')}</b>
          {first.text}
          {first.next ? <em> · {first.next}</em> : null}
        </p>
      )}
      <button className="btn scd-open" onClick={() => setOpen(!open)}>
        {open ? tr('Thu gọn', 'Collapse') : tr('Xem cả con đường', 'See the whole road')}
      </button>
      {open && (
        <ul className="scd-road">
          {road.map((s) => (
            <li key={s.key} className={s.done ? 'done' : ''}>
              <span aria-hidden="true">{s.done ? '✓' : '·'}</span> {s.href ? <Link href={s.href}>{s.text}</Link> : s.text}
            </li>
          ))}
        </ul>
      )}
      <div className="scd-wish">
        <label htmlFor="scd-wish">{tr('Đạo hữu đã đứng ngoài luân hồi. Muốn Thiên Đạo thêm gì cho giang hồ?', 'You now stand outside the cycle. What should the Heavenly Dao add to the world?')}</label>
        {user ? (
          <>
            <textarea id="scd-wish" rows={2} maxLength={500} value={wish} onChange={(e) => setWish(e.target.value)} placeholder={tr('vd: cho chứng đạo rồi được làm sư phụ người mới...', 'e.g. let those who attained the Dao mentor newcomers...')} />
            <button className="btn btn-red" onClick={send} disabled={!wish.trim()}>
              {tr('Gửi lên Thiên Đạo', 'Send to the Heavenly Dao')}
            </button>
            {sent && <p className="note">{sent}</p>}
          </>
        ) : (
          <p className="note">
            <Link href="/dang-nhap">{tr('Đăng nhập', 'Log in')}</Link>
            {tr(' để gửi điều ước.', ' to send your wish.')}
          </p>
        )}
      </div>
    </div>
  );
}
