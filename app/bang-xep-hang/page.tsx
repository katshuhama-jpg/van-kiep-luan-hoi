'use client';

import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Sprite from '@/components/Sprite';
import { PATHS, realmLabel } from '@/lib/game/data';
import { describeLean } from '@/lib/game/engine';
import { fmt } from '@/lib/game/helpers';
import type { Character } from '@/lib/game/types';
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

/** Danh hiệu gọn: hiện 2 cái quan trọng nhất, còn lại gộp vào nút +N */
function RankTitles({ weekly, lore, coll }: { weekly: string[]; lore: string | null; coll: string | null }) {
  const [open, setOpen] = useState(false);
  const titles = [...weekly, lore, coll].filter((t): t is string => !!t);
  if (!titles.length) return null;
  const shown = open ? titles : titles.slice(0, 2);
  const cls = (t: string) => (t === lore ? 'lore-master' : t === coll ? 'collector' : t.includes('Ma Đầu') ? 'ta' : t.includes('Minh Chủ') ? 'chinh' : t.includes('Phú') ? 'phu' : t.includes('Thọ') ? 'tho' : 'gold');
  return (
    <span className="rank-titles">
      {shown.map((t) => (
        <span key={t} className={`title-badge ${cls(t)}`}>
          {t}
        </span>
      ))}
      {titles.length > 2 && (
        <button type="button" className="title-more" onClick={() => setOpen(!open)} aria-label={open ? 'Thu gọn danh hiệu' : `Xem thêm ${titles.length - 2} danh hiệu`}>
          {open ? 'Thu gọn' : `+${titles.length - 2}`}
        </button>
      )}
    </span>
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
  // lôi đài đã có trang riêng
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'loi-dai') window.location.replace('/loi-dai');
  }, []);
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
        <button
          role="tab"
          aria-selected={truy}
          className={truy ? 'on' : ''}
          onClick={() => setTruy(true)}
        >
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
          <div className="rank-filters">
            <label>
              <span className="sr-only">Thời gian</span>
              <select value={scope} onChange={(e) => setScope(e.target.value as RankScope)} aria-label="Lọc theo sống chết">
                {SCOPES.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Phe</span>
              <select value={lean} onChange={(e) => setLean(e.target.value as RankLean)} aria-label="Lọc theo phái">
                {LEANS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id === 'all' ? 'Mọi phe' : l.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Con đường</span>
              <select value={path} onChange={(e) => setPath(e.target.value)} aria-label="Lọc theo con đường">
                {PATH_FILTERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id === 'all' ? 'Mọi đạo' : p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {scope === 'week' && <p className="note rank-note">Tính lại mỗi thứ Hai. Top 3 tuần và người mạnh nhất mỗi phe được treo danh hiệu.</p>}

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
                      <span className="rank-head">
                        <span className="rank-name">{c.name}</span>
                        <span className={`rank-state rs-${r.alive ? 'alive' : c.endTag === 'chung_dao' ? 'dao' : c.cosmos || c.ascended ? 'asc' : 'gone'}`}>
                          {r.alive ? 'Đang sống' : c.endTag === 'chung_dao' ? 'Chứng đạo' : c.cosmos === 'ma' ? 'Ma giới' : c.cosmos === 'hu' ? 'Thái Hư' : c.cosmos === 'tien' || c.ascended ? 'Tiên giới' : 'Đã mất'}
                        </span>
                      </span>
                      <span className="rank-val">
                        {kind === 'power'
                          ? c.realm === 0
                            ? 'Phàm nhân'
                            : realmLabel(c.realm, c.layer, c.cosmos)
                          : kind === 'age'
                            ? `Thọ ${Math.floor(c.age)} tuổi · ${c.realm === 0 ? 'Phàm nhân' : realmLabel(c.realm, c.layer, c.cosmos)}`
                            : `${fmt(c.linhThach)} linh thạch`}
                        {(c.kiepSo ?? 0) > 0 && <span className="ks-chip">Kiếp Số {c.kiepSo}</span>}
                      </span>
                      <small className="rank-meta">
                        <b className="rank-user">@{r.username}</b>
                        {mine ? ' (bạn)' : ''} · Kiếp {c.lifeNo} · {Math.floor(c.age)} tuổi · {c.path ? PATHS[c.path].name : 'chưa chọn đường'} · {describeLean(c.daoTam)}
                      </small>
                      <RankTitles weekly={titles[titleKey(r.username, c.lifeNo)] ?? []} lore={lm[r.username] ? '🔔 ' + lm[r.username] : null} coll={coll[r.username] ? collectorTitle(coll[r.username]) : null} />
                      <RelChips player={r.username} s={social} />
                      {user && !mine && (
                        <Link className="rank-thach" href={`/thach-dau?u=${encodeURIComponent(r.username)}`}>
                          ⚔ Hạ chiến thư
                        </Link>
                      )}
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
          <Link href="/dang-nhap">Đăng nhập</Link> để ghi danh lên bảng.
        </p>
      )}
    </main>
  );
}
