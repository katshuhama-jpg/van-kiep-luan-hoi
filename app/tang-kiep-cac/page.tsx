'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import { PastSelfSprite } from '@/components/VanKiep';
import { GioNotice, KiepDetail, KiepShelf, WeekBlock, realmOfSelf, usePastSelves } from '@/components/TangKiep';
import { HO_DAO_MAX, hoDaoCap, weekWrap, type PastSelf } from '@/lib/vanKiep';
import { displayName } from '@/lib/storage';
import { useAuth } from '@/lib/useAuth';
import { tr } from '@/lib/i18n';

type Sort = 'new' | 'strong' | 'old';

export default function TangKiepCac() {
  const { user, ready } = useAuth();
  const lives = usePastSelves(user, ready);
  const [pick, setPick] = useState<PastSelf | null>(null);
  const [sort, setSort] = useState<Sort>('new');
  const w = useMemo(() => (lives ? weekWrap(lives) : null), [lives]);
  const sorted = useMemo(() => {
    if (!lives) return [];
    const l = lives.slice();
    if (sort === 'new') return l.reverse();
    if (sort === 'old') return l.sort((a, b) => b.age - a.age);
    return l.sort((a, b) => Number(b.ascended) - Number(a.ascended) || b.realm - a.realm || b.age - a.age);
  }, [lives, sort]);
  const top = useMemo(() => (lives?.length ? lives.slice().sort((a, b) => Number(b.ascended) - Number(a.ascended) || b.realm - a.realm || b.age - a.age)[0] : null), [lives]);
  const oldest = useMemo(() => (lives?.length ? lives.reduce((a, b) => (b.age > a.age ? b : a)) : null), [lives]);
  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 28 }}>
            {tr('Tàng Kiếp Các', 'Hall of Lives')}
          </span>
          <span className="meta">{tr('Mọi kiếp bạn từng là', 'Everyone you have ever been')}</span>
          <BackButton fallback="/" />
        </div>
      </header>

      {!lives && <p className="note">{tr('Đang mở cửa các...', 'Opening the hall...')}</p>}
      {lives && !lives.length && (
        <section className="panel">
          <p>{tr('Các còn trống. Sống hết một kiếp, bóng kiếp ấy sẽ về đây đứng.', 'The hall is empty. Finish a life and its shadow will come to stand here.')}</p>
          <Link href="/choi" className="btn btn-red btn-big" style={{ display: 'block', textDecoration: 'none' }}>
            {tr('Vào luân hồi', 'Enter the Cycle')}
          </Link>
        </section>
      )}
      {lives && lives.length > 0 && (
        <>
          <section className="tk-hall" aria-label={tr('Các kiếp đứng trong các', 'Your lives in the hall')}>
            <div className="vk-line">
              {lives.slice(-9).map((p, i) => (
                <span key={p.id} className="vk-ghost" style={{ animationDelay: `${i * 0.08}s` }}>
                  <PastSelfSprite p={p} size={48} />
                </span>
              ))}
            </div>
          </section>
          <div className="tk-stats">
            <div>
              <b>{lives.length}</b>
              <small>{tr('kiếp đã qua', 'lives lived')}</small>
            </div>
            <div>
              <b>{top ? realmOfSelf(top) : '-'}</b>
              <small>{tr('cao nhất', 'highest')}</small>
            </div>
            <div>
              <b>{oldest ? Math.floor(oldest.age) : 0}</b>
              <small>{tr('tuổi thọ dài nhất', 'longest life')}</small>
            </div>
            <div>
              <b>
                {hoDaoCap(lives)}/{HO_DAO_MAX}
              </b>
              <small>{tr('đạo lôi đỡ được', 'bolts they can take')}</small>
            </div>
          </div>
          <GioNotice user={user} lives={lives} />
          {w && <WeekBlock w={w} lives={lives} who={user ? `@${user.username}` : displayName(user)} />}
          <section className="tk-wrap">
            <h2>{tr('Kệ các kiếp', 'The shelves')}</h2>
            <div className="tabs" role="tablist">
              {(
                [
                  ['new', tr('Mới nhất', 'Newest')],
                  ['strong', tr('Mạnh nhất', 'Strongest')],
                  ['old', tr('Sống lâu', 'Longest')],
                ] as [Sort, string][]
              ).map(([k, l]) => (
                <button key={k} className={sort === k ? 'on' : ''} onClick={() => setSort(k)}>
                  {l}
                </button>
              ))}
            </div>
            <KiepShelf lives={sorted.slice(0, 120)} onPick={setPick} />
            {sorted.length > 120 && <p className="note">{tr(`Còn ${sorted.length - 120} kiếp nữa trên kệ trong.`, `${sorted.length - 120} more lives on the inner shelves.`)}</p>}
          </section>
        </>
      )}
      {pick && <KiepDetail p={pick} onClose={() => setPick(null)} />}
    </main>
  );
}
