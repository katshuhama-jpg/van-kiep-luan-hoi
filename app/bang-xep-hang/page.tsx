'use client';

import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Sprite from '@/components/Sprite';
import { PATHS, realmLabel } from '@/lib/game/data';
import { describeLean } from '@/lib/game/engine';
import { fmt } from '@/lib/game/helpers';
import type { Character } from '@/lib/game/types';
import { TitleBadge } from '@/components/Hook';
import { leaderboard, titleKey, weeklyTitles, type RankKind, type RankLean, type RankScope } from '@/lib/storage';
import { useAuth } from '@/lib/useAuth';

const LEANS: { id: RankLean; name: string }[] = [
  { id: 'all', name: 'Tất cả' },
  { id: 'chinh', name: 'Chính phái' },
  { id: 'trung', name: 'Trung lập' },
  { id: 'ta', name: 'Tà phái' },
];

const SCOPES: { id: RankScope; name: string }[] = [
  { id: 'week', name: 'Tuần này' },
  { id: 'all', name: 'Mọi kiếp' },
  { id: 'alive', name: 'Đang sống' },
  { id: 'dead', name: 'Đã mất' },
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
      <text x="5" y="10.2" fontSize="5" textAnchor="middle" fill="#3b2a1a" fontFamily="'Barlow Semi Condensed', sans-serif">
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
  const [scope, setScope] = useState<RankScope>('all');
  const [rows, setRows] = useState<{ username: string; c: Character; alive: boolean }[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [titles, setTitles] = useState<Record<string, string>>({});
  useEffect(() => {
    weeklyTitles().then(setTitles).catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancel = false;
    setRows(null);
    leaderboard(kind, lean, path, scope).then((r) => {
      if (cancel) return;
      setFailed(r === null);
      setRows(r ?? []);
    });
    return () => {
      cancel = true;
    };
  }, [ready, kind, lean, path, scope]);

  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 28 }}>
            Xếp hạng
          </span>
          <span className="meta">Anh hùng các đời</span>
          <BackButton fallback="/choi" />
        </div>
      </header>

      <div className="tabs" role="tablist" style={{ margin: 0 }}>
        <button role="tab" aria-selected={kind === 'power'} className={kind === 'power' ? 'on' : ''} onClick={() => setKind('power')}>
          Năng lực
        </button>
        <button role="tab" aria-selected={kind === 'wealth'} className={kind === 'wealth' ? 'on' : ''} onClick={() => setKind('wealth')}>
          Phú hào
        </button>
        <button role="tab" aria-selected={kind === 'age'} className={kind === 'age' ? 'on' : ''} onClick={() => setKind('age')}>
          Trường thọ
        </button>
      </div>

      <div className="chips" role="radiogroup" aria-label="Lọc theo sống chết">
        {SCOPES.map((x) => (
          <button key={x.id} role="radio" aria-checked={scope === x.id} className={`chip-btn ${scope === x.id ? 'on' : ''}`} onClick={() => setScope(x.id)}>
            {x.name}
          </button>
        ))}
      </div>
      {scope === 'week' && (
        <p className="note" style={{ margin: '0 0 6px' }}>
          Bảng tuần tính lại từ thứ Hai hằng tuần. Ba người mạnh nhất tuần, cùng người mạnh nhất chính phái và tà phái, được treo danh hiệu: Thiên Hạ Đệ Nhất, Đệ Nhị Cao Thủ, Đệ Tam Cao Thủ, Võ Lâm Minh Chủ, Đệ Nhất Ma Đầu.
        </p>
      )}
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
              <li key={`${r.username}-${c.lifeNo}-${r.alive}-${i}`} className={`rank-row ${mine ? 'mine' : ''} ${i < 3 ? 'top' : ''} ${r.alive ? '' : 'gone'}`}>
                <Medal rank={i + 1} />
                <div className="rank-sprite">
                  {/* người đã mất vẫn vẽ dáng đứng (làm xám), dáng ngã nhìn từ trên xuống khó nhận ra */}
                  <Sprite c={c.dead ? { ...c, dead: false } : c} size={64} />
                </div>
                <div className="rank-body">
                  <span className="rank-name">{c.name}</span>
                  <span className="rank-val">
                    {kind === 'power' ? (c.realm === 0 ? 'Phàm nhân' : realmLabel(c.realm, c.layer)) : kind === 'age' ? `Thọ ${Math.floor(c.age)} tuổi · ${c.realm === 0 ? 'Phàm nhân' : realmLabel(c.realm, c.layer)}` : `${fmt(c.linhThach)} linh thạch`}
                  </span>
                  <span className="rank-owner">
                    <span className="rank-user">@{r.username}</span>
                    <TitleBadge title={titles[titleKey(r.username, c.lifeNo)]} />
                    {mine && <span className="badge">Bạn</span>}
                    {!r.alive && <span className="badge gone-badge">{c.ascended ? (c.cause?.includes('Ma Tôn') ? 'Ma Tôn' : 'Phi thăng') : 'Đã mất'}</span>}
                  </span>
                  <small>
                    {r.alive ? '' : `Kiếp ${c.lifeNo} · `}
                    {Math.floor(c.age)} tuổi · {c.path ? PATHS[c.path].name : 'chưa chọn đường'} · {describeLean(c.daoTam)}
                  </small>
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
