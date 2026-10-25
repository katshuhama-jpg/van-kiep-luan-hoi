'use client';

import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listMemorials, thapHuong, type Memorial } from '@/lib/storage';
import { useAuth } from '@/lib/useAuth';

function Tomb({ m, canIncense, onIncense }: { m: Memorial; canIncense: boolean; onIncense: () => void }) {
  return (
    <article className={`grave ${m.ascended ? 'ascended' : ''}`}>
      <small>Kiếp {m.life_no} · {m.player_name}</small>
      <span className="gname">{m.char_name}</span>
      <small>
        {m.age} tuổi · {m.realm}
        {m.path ? ` · ${m.path}` : ''}
      </small>
      {m.ascended ? <small style={{ color: 'var(--jade)' }}>Đã phi thăng</small> : m.cause && <small>{m.cause}</small>}
      {m.epitaph && <span className="epitaph">“{m.epitaph}”</span>}
      <button className="btn" style={{ marginTop: 'auto', fontSize: 17 }} disabled={!canIncense} onClick={onIncense} aria-label={`Thắp hương cho ${m.char_name}`}>
        Thắp hương · {m.incense}
      </button>
    </article>
  );
}

export default function Graveyard() {
  const { user, ready } = useAuth();
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [data, setData] = useState<{ all: Memorial[]; mine: Memorial[] } | null>(null);

  useEffect(() => {
    if (!ready) return;
    listMemorials(user).then(setData);
  }, [ready, user?.token]);

  const list = data ? data[tab] : [];

  async function incense(m: Memorial) {
    const n = await thapHuong(user, m.id);
    if (n === null || !data) return;
    const up = (arr: Memorial[]) => arr.map((x) => (x.id === m.id ? { ...x, incense: n } : x));
    setData({ all: up(data.all), mine: up(data.mine) });
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 28 }}>
            Nghĩa trang
          </span>
          <span className="meta">Nơi các kiếp đã qua yên nghỉ</span>
          <BackButton fallback="/" />
        </div>
      </header>

      <div className="tabs">
        <button className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>
          Mọi người
        </button>
        <button className={tab === 'mine' ? 'on' : ''} onClick={() => setTab('mine')}>
          Các kiếp của tôi
        </button>
      </div>

      {!user && <p className="note" style={{ margin: 0 }}>Đăng nhập để thắp hương và để bia của bạn hiện cho mọi người.</p>}

      {!data ? (
        <p>Đang dọn cỏ...</p>
      ) : list.length === 0 ? (
        <section className="panel">
          <p style={{ margin: 0 }}>Chưa có ngôi mộ nào. Hãy sống trọn một kiếp rồi quay lại.</p>
        </section>
      ) : (
        <div className="grave-list">
          {list.map((m) => (
            <Tomb key={m.id} m={m} canIncense={!!user && typeof m.id === 'number'} onIncense={() => incense(m)} />
          ))}
        </div>
      )}

      <Link href="/choi" className="btn btn-red btn-big" style={{ textDecoration: 'none', textAlign: 'center' }}>
        Vào luân hồi
      </Link>
    </main>
  );
}
