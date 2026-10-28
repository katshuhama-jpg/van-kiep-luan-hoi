'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PastSelfSprite } from './VanKiep';
import ShareSheet from './ShareSheet';
import { gioToday, hoDaoPower, lastWords, lightningGrudge, loadPastSelves, weekWrap, type PastSelf, type WeekWrap } from '@/lib/vanKiep';
import { shareWeek } from '@/lib/wrapCard';
import { loadAll, saveMeta, thapHuong } from '@/lib/storage';
import { realmLabel } from '@/lib/game/data';
import type { ShareOut } from '@/lib/shareCard';
import type { Player } from '@/lib/auth';
import { track } from '@/lib/track';
import { tr } from '@/lib/i18n';

export const GIO_PHUC = 3;

export const realmOfSelf = (p: PastSelf) => (p.ascended ? tr('Phi thăng', 'Ascended') : p.realm === 0 ? tr('Phàm nhân', 'Mortal') : realmLabel(p.realm, 1));

/** Danh sách kiếp trước của người đang xem (dùng chung trang đầu và Tàng Kiếp Các) */
export function usePastSelves(user: Player | null, ready: boolean): PastSelf[] | null {
  const [lives, setLives] = useState<PastSelf[] | null>(null);
  useEffect(() => {
    if (!ready) return;
    loadPastSelves(user, 1000).then(setLives).catch(() => setLives([]));
  }, [ready, user]);
  return lives;
}

const gioKey = (p: PastSelf, days: number) => `vkl.gio.${p.id}.${days}`;
function gioDone(p: PastSelf, days: number): boolean {
  try {
    return !!localStorage.getItem(gioKey(p, days));
  } catch {
    return false;
  }
}

/** Ngày giỗ: hôm nay tròn 7, 49, 100 ngày hay tròn năm một kiếp mất. Thắp nén hương được phúc duyên cho kiếp sau. */
export function GioNotice({ user, lives }: { user: Player | null; lives: PastSelf[] }) {
  const g = gioToday(lives);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (g) setDone(gioDone(g.p, g.days));
  }, [g?.p.id, g?.days]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!g) return null;
  const { p, days, label } = g;
  const burn = async () => {
    if (busy || done) return;
    setBusy(true);
    try {
      localStorage.setItem(gioKey(p, days), '1');
    } catch {}
    await thapHuong(user, Number.isFinite(Number(p.id)) ? Number(p.id) : p.id).catch(() => null);
    const { meta } = await loadAll(user);
    meta.phucDuyen += GIO_PHUC;
    await saveMeta(user, meta).catch(() => {});
    track('gio', { days });
    setDone(true);
    setBusy(false);
  };
  return (
    <section className={`gio ${done ? 'done' : ''}`} aria-label={tr('Ngày giỗ', 'Memorial day')}>
      <div className="gio-altar" aria-hidden="true">
        <i className="gio-smoke" />
        <PastSelfSprite p={p} size={64} />
        <i className="gio-table" />
      </div>
      <div className="gio-body">
        <small>{tr('Ngày giỗ', 'Memorial day')}</small>
        <p>
          {tr('Hôm nay ', 'Today marks ')}
          <b>{label}</b>
          {tr(` kiếp ${p.lifeNo} của bạn, ${p.name}, mất. `, ` since your life ${p.lifeNo}, ${p.name}, passed away. `)}
          {tr(`${Math.floor(p.age)} tuổi, ${realmOfSelf(p)}.`, `Age ${Math.floor(p.age)}, ${realmOfSelf(p)}.`)}
        </p>
        <q>{lastWords(p)}</q>
        <button className={`btn ${done ? '' : 'btn-red'}`} onClick={burn} disabled={busy || done}>
          {done ? tr(`Đã thắp hương · +${GIO_PHUC} phúc duyên`, `Incense lit · +${GIO_PHUC} fortune`) : tr(`Thắp nén hương (+${GIO_PHUC} phúc duyên)`, `Light incense (+${GIO_PHUC} fortune)`)}
        </button>
      </div>
    </section>
  );
}

/** Trang đầu: ngày giỗ nếu có, không thì nhắc Thất Nhật Lục */
export function HomeVanKiep({ user, ready }: { user: Player | null; ready: boolean }) {
  const lives = usePastSelves(user, ready);
  if (!lives || !lives.length) return null;
  if (gioToday(lives)) return <GioNotice user={user} lives={lives} />;
  const w = weekWrap(lives);
  if (w.n < 3) return null;
  return (
    <Link href="/tang-kiep-cac#tuan" className="wk-nudge" onClick={() => track('wrap_nudge')}>
      <span className="wk-ghosts" aria-hidden="true">
        {lives.slice(-4).map((p) => (
          <PastSelfSprite key={p.id} p={p} size={40} />
        ))}
      </span>
      <span>
        <b>{tr(`Bảy ngày qua bạn đã sống ${w.n} kiếp`, `You lived ${w.n} lives in the past seven days`)}</b>
        <small>{tr(`Danh hiệu tuần: ${w.title} · mở Thất Nhật Lục ›`, `Title of the week: ${w.title} · open your Seven-Day Chronicle ›`)}</small>
      </span>
    </Link>
  );
}

/** Thất Nhật Lục: số liệu 7 ngày và nút khoe thẻ */
export function WeekBlock({ w, lives, who }: { w: WeekWrap; lives: PastSelf[]; who: string }) {
  const [out, setOut] = useState<ShareOut | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const wk = lives.filter((p) => Date.now() - new Date(p.at).getTime() < 7 * 86400000);
  const share = async () => {
    setBusy(true);
    track('wrap_share');
    const r = await shareWeek(w, wk, who).catch(() => null);
    setBusy(false);
    if (r?.link) setOut(r);
    else if (r?.saved) setSaved(true);
  };
  if (!w.n)
    return (
      <section id="tuan" className="wk">
        <h2>
        {tr('Thất Nhật Lục', 'Seven-Day Chronicle')} <small className="wk-sub">{tr('bảy ngày luân hồi', 'your last seven days')}</small>
      </h2>
        <p className="note">{tr('7 ngày qua chưa có kiếp nào kết thúc. Sống hết một kiếp là Thất Nhật Lục ghi lại.', 'No life has ended in the past 7 days. Finish one and the Chronicle records it.')}</p>
      </section>
    );
  return (
    <section id="tuan" className="wk">
      <h2>
        {tr('Thất Nhật Lục', 'Seven-Day Chronicle')} <small className="wk-sub">{tr('bảy ngày luân hồi', 'your last seven days')}</small>
      </h2>
      <p className="wk-title">{w.title}</p>
      <div className="wk-grid">
        <div>
          <b>{w.n}</b>
          <small>{tr('kiếp', 'lives')}</small>
        </div>
        <div>
          <b>{w.years}</b>
          <small>{tr('năm trên đời', 'years lived')}</small>
        </div>
        <div>
          <b>{w.dao + w.ascended}</b>
          <small>{tr('lần phá thiên', 'breakthroughs')}</small>
        </div>
      </div>
      <ul className="wk-list">
        {w.top && (
          <li>
            {tr('Cao nhất: ', 'Highest: ')}
            <b>{realmOfSelf(w.top)}</b> · {w.top.name}
          </li>
        )}
        {w.longest && (
          <li>
            {tr('Sống lâu nhất: ', 'Longest: ')}
            <b>{w.longest.name}</b> · {tr(`${Math.floor(w.longest.age)} tuổi`, `age ${Math.floor(w.longest.age)}`)}
          </li>
        )}
        {w.cause && w.cause.n > 1 && (
          <li>
            {tr(`Chết nhiều nhất (${w.cause.n} lần): `, `Most common death (${w.cause.n}x): `)}
            <i>{w.cause.text}</i>
          </li>
        )}
      </ul>
      <button className="btn btn-red btn-big" onClick={share} disabled={busy}>
        {busy ? tr('Đang vẽ thẻ...', 'Drawing your card...') : tr('Khoe Thất Nhật Lục', 'Share your Chronicle')}
      </button>
      {saved && <small className="note">{tr('Đã tải thẻ về máy. Đăng nhập để có link khoe hiện hình.', 'Card downloaded. Log in to get a link that shows the picture.')}</small>}
      {out && <ShareSheet out={out} kind="life" onClose={() => setOut(null)} />}
    </section>
  );
}

/** Một ô kiếp trên kệ Tàng Kiếp Các */
export function KiepShelf({ lives, onPick }: { lives: PastSelf[]; onPick: (p: PastSelf) => void }) {
  return (
    <div className="tk-shelf">
      {lives.map((p) => (
        <button key={p.id} type="button" className={`tk-cell ${p.ascended ? 'tk-asc' : ''} ${p.endTag === 'chung_dao' ? 'tk-dao' : ''}`} onClick={() => onPick(p)}>
          <span className="tk-niche">
            <PastSelfSprite p={p} size={52} />
            {lightningGrudge(p) && <em className="tk-zap">⚡</em>}
          </span>
          <small>
            {tr('Kiếp', 'Life')} {p.lifeNo}
          </small>
          <b>{p.name}</b>
          <small>
            {realmOfSelf(p)} · {Math.floor(p.age)}
          </small>
        </button>
      ))}
    </div>
  );
}

export function KiepDetail({ p, onClose }: { p: PastSelf; onClose: () => void }) {
  return (
    <div className="ss-wrap" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="ss-sheet tk-detail" onClick={(e) => e.stopPropagation()}>
        <div className="ss-head">
          <b>
            {tr('Kiếp', 'Life')} {p.lifeNo} · {p.name}
          </b>
          <button className="ss-x" onClick={onClose} aria-label={tr('Đóng', 'Close')}>
            ✕
          </button>
        </div>
        <div className="tk-big">
          <PastSelfSprite p={p} size={112} />
        </div>
        <p>
          {tr(`${Math.floor(p.age)} tuổi · ${realmOfSelf(p)}`, `Age ${Math.floor(p.age)} · ${realmOfSelf(p)}`)}
          <br />
          <small>{new Date(p.at).toLocaleDateString()}</small>
        </p>
        {p.cause && <p className="tk-cause">{p.cause}</p>}
        {p.epitaph && <q>{p.epitaph}</q>}
        <p className="tk-power">
          {tr(`Ngày Chứng Đạo, kiếp này đỡ được ${hoDaoPower(p)} đạo lôi`, `On the day of the Dao, this life can take ${hoDaoPower(p)} bolts`)}
          {lightningGrudge(p) ? tr(', gấp rưỡi vì từng chết dưới thiên kiếp', ', 1.5x for having died to tribulation') : ''}.
          {(p.ascended || p.realm >= 5) && tr(' Đủ sức ra tay ở Ngũ Hành Đài và thiên kiếp phi thăng.', ' Strong enough to step in at the Five Elements Platform and the ascension tribulation.')}
        </p>
      </div>
    </div>
  );
}

