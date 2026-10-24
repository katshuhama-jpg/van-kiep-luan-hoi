'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Sprite from '@/components/Sprite';
import { PATHS, realmLabel } from '@/lib/game/data';
import { describeLean } from '@/lib/game/engine';
import { fmt } from '@/lib/game/helpers';
import type { Character } from '@/lib/game/types';
import { leaderboard, type RankKind, type RankLean } from '@/lib/storage';
import { useAuth } from '@/lib/useAuth';

const LEANS: { id: RankLean; name: string }[] = [
  { id: 'all', name: 'Tất cả' },
  { id: 'chinh', name: 'Chính phái' },
  { id: 'trung', name: 'Trung lập' },
  { id: 'ta', name: 'Tà phái' },
];

const PATH_FILTERS: { id: string; name: string }[] = [
  { id: 'all', name: 'Mọi con đường' },
  ...Object.values(PATHS).map((p) => ({ id: p.id, name: p.name })),
  { id: 'none', name: 'Chưa chọn đường' },
];

function Medal({ rank }: { rank: number }) {
  const col = rank === 1 ? '#ffcf3e' : rank === 2 ? '#d6dce6' : rank === 3 ? '#d98a4a' : null;
  if (!col) return <span className="rank-no">{rank}</span>;
  return (
    <svg className="rank-medal" viewBox="0 0 10 12" width="30" height="36" shapeRendering="crispEdges" role="img" aria-label={`Hạng ${rank}`}>
      <rect x="2" y="0" width="2" height="4" fill="#b8432f" />
      <rect x="6" y="0" width="2" height="4" fill="#3d6fb0" />
      <rect x="2" y="4" width="6" height="8" fill={col} />
      <rect x="1" y="5" width="8" height="6" fill={col} />
      <rect x="3" y="5" width="2" height="1" fill="#ffffff" />
      <text x="5" y="10.2" fontSize="5" textAnchor="middle" fill="#3b2a1a" fontFamily="VT323, monospace">
        {rank}
      </text>
    </svg>
  );
}

export default function RankPage() {
  const { user, ready, enabled } = useAuth();
  const [kind, setKind] = useState<RankKind>('power');
  const [lean, setLean] = useState<RankLean>('all');
  const [path, setPath] = useState('all');
  const [rows, setRows] = useState<{ username: string; c: Character }[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancel = false;
    setRows(null);
    leaderboard(kind, lean, path).then((r) => {
      if (cancel) return;
      setFailed(r === null);
      setRows(r ?? []);
    });
    return () => {
      cancel = true;
    };
  }, [ready, kind, lean, path]);

  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 28 }}>
            Xếp hạng
          </span>
          <span className="meta">Tu sĩ đang tại thế</span>
          <Link href="/choi" className="icon-btn" style={{ textDecoration: 'none', display: 'grid', placeItems: 'center' }} aria-label="Quay lại game">
            ‹
          </Link>
        </div>
      </header>

      <div className="tabs" role="tablist" style={{ margin: 0 }}>
        <button role="tab" aria-selected={kind === 'power'} className={kind === 'power' ? 'on' : ''} onClick={() => setKind('power')}>
          Năng lực
        </button>
        <button role="tab" aria-selected={kind === 'wealth'} className={kind === 'wealth' ? 'on' : ''} onClick={() => setKind('wealth')}>
          Phú hào
        </button>
      </div>

      <div className="chips" role="radiogroup" aria-label="Lọc theo phái">
        {LEANS.map((l) => (
          <button key={l.id} role="radio" aria-checked={lean === l.id} className={`chip-btn ${l.id} ${lean === l.id ? 'on' : ''}`} onClick={() => setLean(l.id)}>
            {l.name}
          </button>
        ))}
      </div>
      <div className="chips scroll" role="radiogroup" aria-label="Lọc theo con đường">
        {PATH_FILTERS.map((p) => (
          <button key={p.id} role="radio" aria-checked={path === p.id} className={`chip-btn ${path === p.id ? 'on' : ''}`} onClick={() => setPath(p.id)}>
            {p.name}
          </button>
        ))}
      </div>

      {!enabled || failed ? (
        <section className="panel">
          <p style={{ margin: 0 }}>Chưa kết nối được máy chủ xếp hạng.</p>
        </section>
      ) : rows === null ? (
        <p>Đang xem thiên bảng...</p>
      ) : rows.length === 0 ? (
        <section className="panel">
          <p style={{ margin: 0 }}>Chưa có tu sĩ nào ở mục này.</p>
        </section>
      ) : (
        <ol className="ranks">
          {rows.map((r, i) => {
            const c = r.c;
            const mine = user?.username === r.username;
            return (
              <li key={r.username} className={`rank-row ${mine ? 'mine' : ''} ${i < 3 ? 'top' : ''}`}>
                <Medal rank={i + 1} />
                <div className="rank-sprite">
                  <Sprite c={c} size={58} />
                </div>
                <div className="rank-body">
                  <span className="rank-name">
                    {c.name}
                    {mine && <span className="badge">Bạn</span>}
                  </span>
                  <small>
                    {r.username} · {Math.floor(c.age)} tuổi · {c.path ? PATHS[c.path].name : 'chưa chọn đường'} · {describeLean(c.daoTam)}
                  </small>
                </div>
                <div className="rank-val">
                  {kind === 'power' ? (
                    <span>{c.realm === 0 ? 'Phàm nhân' : realmLabel(c.realm, c.layer)}</span>
                  ) : (
                    <span>
                      {fmt(c.linhThach)}
                      <small>linh thạch</small>
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {!user && (
        <p className="note" style={{ margin: 0 }}>
          Nhân vật chế độ khách không lên bảng. <Link href="/dang-nhap">Đăng nhập</Link> để ghi danh.
        </p>
      )}
    </main>
  );
}
