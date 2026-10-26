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
import { collectors, leaderboard, loreMasters, titleKey, weeklyTitles, type RankKind, type RankLean, type RankScope } from '@/lib/storage';
import { useAuth } from '@/lib/useAuth';
import { RelChips } from '@/components/GiangHo';
import { collectorTitle } from '@/lib/game/collect';
import { SOCIAL, type SocialState } from '@/lib/game/social';
import { bountyBoard, loadSocial, oanGia, type BountyRow, type OanGia } from '@/lib/social';

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

const PATH_FILTERS: { id: string; name: string }[] = [{ id: 'all', name: 'Mọi con đường' }, ...Object.values(PATHS).map((p) => ({ id: p.id, name: p.name })), { id: 'none', name: 'Chưa chọn đường' }];

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
  const [titles, setTitles] = useState<Record<string, string[]>>({});
  const [social, setSocial] = useState<SocialState>(SOCIAL.cur);
  const [coll, setColl] = useState<Record<string, number>>({});
  const [lm, setLm] = useState<Record<string, string>>({});
  const [truy, setTruy] = useState(false);
  const [board, setBoard] = useState<BountyRow[] | null>(null);
  const [pairs, setPairs] = useState<OanGia[]>([]);
  useEffect(() => {
    weeklyTitles()
      .then(setTitles)
      .catch(() => {});
    collectors()
      .then(setColl)
      .catch(() => {});
    loreMasters()
      .then(setLm)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (ready)
      loadSocial(user)
        .then((x) => setSocial({ ...x }))
        .catch(() => {});
  }, [ready, user]);
  useEffect(() => {
    if (!truy || board) return;
    bountyBoard().then(setBoard);
    oanGia().then(setPairs);
  }, [truy, board]);

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

      <div className="tabs tabs-4" role="tablist" style={{ margin: 0 }}>
        <button
          role="tab"
          aria-selected={!truy && kind === 'power'}
          className={!truy && kind === 'power' ? 'on' : ''}
          onClick={() => {
            setKind('power');
            setTruy(false);
          }}
        >
          Năng lực
        </button>
        <button
          role="tab"
          aria-selected={!truy && kind === 'wealth'}
          className={!truy && kind === 'wealth' ? 'on' : ''}
          onClick={() => {
            setKind('wealth');
            setTruy(false);
          }}
        >
          Phú hào
        </button>
        <button
          role="tab"
          aria-selected={!truy && kind === 'age'}
          className={!truy && kind === 'age' ? 'on' : ''}
          onClick={() => {
            setKind('age');
            setTruy(false);
          }}
        >
          Trường thọ
        </button>
        <button role="tab" aria-selected={truy} className={truy ? 'on' : ''} onClick={() => setTruy(true)}>
          Truy nã
        </button>
      </div>

      {truy ? (
        <section className="gh-truy">
          <h3 className="gh-h">Bảng truy nã</h3>
          {board === null ? (
            <p>Đang dán cáo thị...</p>
          ) : !board.length ? (
            <p className="note">Chưa ai bị treo thưởng. Vào game, mở Giang hồ để treo đầu kẻ thù.</p>
          ) : (
            <ol className="gh-board">
              {board.map((b) => (
                <li key={b.target} className={b.target === user?.username ? 'me' : ''}>
                  <span className="gh-poster" aria-hidden="true">
                    ☠
                  </span>
                  <span>
                    <b>@{b.target}</b> <RelChips player={b.target} s={social} />
                    <small>
                      {b.n} lệnh · treo bởi {b.posters.map((p) => '@' + p).join(', ')}
                    </small>
                  </span>
                  <b className="gh-gold">{fmt(b.total)}</b>
                </li>
              ))}
            </ol>
          )}
          <h3 className="gh-h">Oan gia</h3>
          <p className="note" style={{ marginTop: 0 }}>
            Những cặp đối đầu nhiều nhất giang hồ.
          </p>
          {!pairs.length ? (
            <p className="note">Chưa có cặp oan gia nào.</p>
          ) : (
            <ol className="gh-board">
              {pairs.map((p) => (
                <li key={p.p1 + p.p2} className={p.p1 === user?.username || p.p2 === user?.username ? 'me' : ''}>
                  <span className="gh-poster" aria-hidden="true">
                    ⚔
                  </span>
                  <span>
                    <b>@{p.p1}</b> {p.w1} : {p.w2} <b>@{p.p2}</b>
                    <small>
                      {p.fights} trận{p.fights - p.w1 - p.w2 > 0 ? `, ${p.fights - p.w1 - p.w2} trận hòa` : ''}
                    </small>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : (
        <>
          <div className="chips" role="radiogroup" aria-label="Lọc theo sống chết">
            {SCOPES.map((x) => (
              <button key={x.id} role="radio" aria-checked={scope === x.id} className={`chip-btn ${scope === x.id ? 'on' : ''}`} onClick={() => setScope(x.id)}>
                {x.name}
              </button>
            ))}
          </div>
          {scope === 'week' && (
            <p className="note" style={{ margin: '0 0 6px' }}>
              Bảng tuần tính lại từ thứ Hai hằng tuần. Ba người mạnh nhất tuần, cùng người mạnh nhất chính phái và tà phái, được treo danh hiệu: Thiên Hạ Đệ Nhất, Đệ Nhị Cao Thủ, Đệ Tam Cao Thủ, Võ
              Lâm Minh Chủ, Đệ Nhất Ma Đầu.
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
                        {kind === 'power'
                          ? c.realm === 0
                            ? 'Phàm nhân'
                            : realmLabel(c.realm, c.layer, c.cosmos)
                          : kind === 'age'
                            ? `Thọ ${Math.floor(c.age)} tuổi · ${c.realm === 0 ? 'Phàm nhân' : realmLabel(c.realm, c.layer, c.cosmos)}`
                            : `${fmt(c.linhThach)} linh thạch`}
                      </span>
                      <span className="rank-owner">
                        <span className="rank-user">@{r.username}</span>
                        <TitleBadge title={titles[titleKey(r.username, c.lifeNo)]} />
                        {lm[r.username] && <span className="title-badge lore-master">🔔 {lm[r.username]}</span>}
                        {coll[r.username] && <span className="title-badge collector">{collectorTitle(coll[r.username])}</span>}
                        {mine && <span className="badge">Bạn</span>}
                        <RelChips player={r.username} s={social} />
                        {!r.alive && (
                          <span className="badge gone-badge">
                            {c.endTag === 'chung_dao' ? 'Chứng đạo' : c.cosmos === 'ma' ? 'Ma giới' : c.cosmos === 'hu' ? 'Thái Hư' : c.cosmos === 'tien' || c.ascended ? 'Tiên giới' : 'Đã mất'}
                          </span>
                        )}
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
        </>
      )}

      {!user && (
        <p className="note" style={{ margin: 0 }}>
          Nhân vật chế độ khách không lên bảng. <Link href="/dang-nhap">Đăng nhập</Link> để ghi danh.
        </p>
      )}
    </main>
  );
}
