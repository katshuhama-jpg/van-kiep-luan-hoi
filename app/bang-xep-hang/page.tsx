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
import { tr } from '@/lib/i18n';

const LEANS: { id: RankLean; name: string }[] = [
  { id: 'all', name: tr('Tất cả', "All") },
  { id: 'chinh', name: tr('Chính phái', "Righteous") },
  { id: 'trung', name: tr('Trung lập', "Neutral") },
  { id: 'ta', name: tr('Tà phái', "Evil") },
];

const SCOPES: { id: RankScope; name: string }[] = [
  { id: 'week', name: tr('Tuần này', "This week") },
  { id: 'all', name: tr('Mọi kiếp', "All lives") },
  { id: 'alive', name: tr('Đang sống', "Alive") },
  { id: 'dead', name: tr('Đã mất', "Dead") },
];

const PATH_FILTERS: { id: string; name: string }[] = [{ id: 'all', name: tr('Mọi con đường', "All Paths") }, ...Object.values(PATHS).map((p) => ({ id: p.id, name: p.name })), { id: 'none', name: tr('Chưa chọn đường', "No Path yet") }];

function Medal({ rank }: { rank: number }) {
  const col = rank === 1 ? '#ffcf3e' : rank === 2 ? '#d6dce6' : rank === 3 ? '#d98a4a' : null;
  if (!col) return <span className="rank-no">{rank}</span>;
  return (
    <svg className="rank-medal" viewBox="0 0 10 12" width="30" height="36" shapeRendering="crispEdges" role="img" aria-label={tr(`Hạng ${rank}`, `Rank ${rank}`)}>
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
  const cls = (t: string) => (t === lore ? 'lore-master' : t === coll ? 'collector' : /Ma Đầu|Demon Lord/.test(t) ? 'ta' : /Minh Chủ|Alliance Leader/.test(t) ? 'chinh' : /Phú|Rich/.test(t) ? 'phu' : /Thọ|Long/.test(t) ? 'tho' : 'gold');
  return (
    <span className="rank-titles">
      {shown.map((t) => (
        <span key={t} className={`title-badge ${cls(t)}`}>
          {t}
        </span>
      ))}
      {titles.length > 2 && (
        <button type="button" className="title-more" onClick={() => setOpen(!open)} aria-label={open ? tr('Thu gọn danh hiệu', "Collapse titles") : tr(`Xem thêm ${titles.length - 2} danh hiệu`, `Show ${titles.length - 2} more titles`)}>
          {open ? tr('Thu gọn', "Collapse") : `+${titles.length - 2}`}
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
            
            {tr("Xếp hạng", "Rankings")}
          </span>
          <span className="meta">{tr("Anh hùng các đời", "Heroes of all ages")}</span>
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
          
          {tr("Năng lực", "Power")}
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
          
          {tr("Phú hào", "Tycoons")}
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
          
          {tr("Trường thọ", "Longevity")}
        </button>
        <button
          role="tab"
          aria-selected={truy}
          className={truy ? 'on' : ''}
          onClick={() => setTruy(true)}
        >
          
          {tr("Truy nã", "Wanted")}
        </button>
      </div>

      {truy ? (
        <section className="gh-truy">
          <h3 className="gh-h">{tr("Bảng truy nã", "Wanted board")}</h3>
          {board === null ? (
            <p>{tr("Đang dán cáo thị...", "Posting notices...")}</p>
          ) : !board.length ? (
            <p className="note">{tr("Chưa ai bị treo thưởng. Vào game, mở Giang hồ để treo đầu kẻ thù.", "No bounties yet. Enter the game and open Jianghu to put a price on your enemy's head.")}</p>
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
                      {b.n}{tr(" lệnh · treo bởi ", " bounties · posted by ")}{b.posters.map((p) => '@' + p).join(', ')}
                    </small>
                  </span>
                  <b className="gh-gold">{fmt(b.total)}</b>
                </li>
              ))}
            </ol>
          )}
          <h3 className="gh-h">{tr("Oan gia", "Nemeses")}</h3>
          <p className="note" style={{ marginTop: 0 }}>
            
            {tr("Những cặp đối đầu nhiều nhất giang hồ.", "The fiercest rivalries in the jianghu.")}
          </p>
          {!pairs.length ? (
            <p className="note">{tr("Chưa có cặp oan gia nào.", "No sworn enemies yet.")}</p>
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
                      {p.fights}{tr(" trận", " fights")}{p.fights - p.w1 - p.w2 > 0 ? tr(`, ${p.fights - p.w1 - p.w2} trận hòa`, `, ${p.fights - p.w1 - p.w2} draws`) : ''}
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
              <span className="sr-only">{tr("Thời gian", "Time")}</span>
              <select value={scope} onChange={(e) => setScope(e.target.value as RankScope)} aria-label={tr("Lọc theo sống chết", "Filter by alive or dead")}>
                {SCOPES.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">{tr("Phe", "Faction")}</span>
              <select value={lean} onChange={(e) => setLean(e.target.value as RankLean)} aria-label={tr("Lọc theo phái", "Filter by side")}>
                {LEANS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id === 'all' ? tr('Mọi phe', "All sides") : l.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">{tr("Con đường", "Path")}</span>
              <select value={path} onChange={(e) => setPath(e.target.value)} aria-label={tr("Lọc theo con đường", "Filter by Path")}>
                {PATH_FILTERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id === 'all' ? tr('Mọi đạo', "All Paths") : p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {scope === 'week' && <p className="note rank-note">{tr("Tính lại mỗi thứ Hai. Top 3 tuần và người mạnh nhất mỗi phe được treo danh hiệu.", "Resets every Monday. The weekly top 3 and the strongest of each side earn titles.")}</p>}

          {!enabled || failed ? (
            <section className="panel">
              <p style={{ margin: 0 }}>{tr("Chưa kết nối được máy chủ xếp hạng.", "Can't reach the ranking server.")}</p>
            </section>
          ) : rows === null ? (
            <p>{tr("Đang xem thiên bảng...", "Reading the Heaven Ranking...")}</p>
          ) : rows.length === 0 ? (
            <section className="panel">
              <p style={{ margin: 0 }}>{tr("Chưa có tu sĩ nào ở mục này.", "No cultivators here yet.")}</p>
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
                          {r.alive ? tr('Đang sống', "Alive") : c.endTag === 'chung_dao' ? tr('Chứng đạo', "Attained the Dao") : c.cosmos === 'ma' ? tr('Ma giới', "Demon Realm") : c.cosmos === 'hu' ? tr('Thái Hư', "Great Void") : c.cosmos === 'tien' || c.ascended ? tr('Tiên giới', "Immortal Realm") : tr('Đã mất', "Dead")}
                        </span>
                      </span>
                      <span className="rank-val">
                        {kind === 'power'
                          ? c.realm === 0
                            ? tr('Phàm nhân', "Mortal")
                            : realmLabel(c.realm, c.layer, c.cosmos)
                          : kind === 'age'
                            ? tr(`Thọ ${Math.floor(c.age)} tuổi · ${c.realm === 0 ? tr('Phàm nhân', "Mortal") : realmLabel(c.realm, c.layer, c.cosmos)}`, `Lived to ${Math.floor(c.age)} · ${c.realm === 0 ? tr('Phàm nhân', "Mortal") : realmLabel(c.realm, c.layer, c.cosmos)}`)
                            : tr(`${fmt(c.linhThach)} linh thạch`, `${fmt(c.linhThach)} spirit stones`)}
                        {(c.kiepSo ?? 0) > 0 && <span className="ks-chip">{tr("Kiếp Số ", "Calamity Count ")}{c.kiepSo}</span>}
                      </span>
                      <small className="rank-meta">
                        <b className="rank-user">@{r.username}</b>
                        {mine ? tr(' (bạn)', " (you)") : ''}{tr(" · Kiếp ", " · Life ")}{c.lifeNo} · {Math.floor(c.age)}{tr(" tuổi · ", " yrs · ")}{c.path ? PATHS[c.path].name : tr('chưa chọn đường', "no Path yet")} · {describeLean(c.daoTam)}
                      </small>
                      <RankTitles weekly={titles[titleKey(r.username, c.lifeNo)] ?? []} lore={lm[r.username] ? '🔔 ' + lm[r.username] : null} coll={coll[r.username] ? collectorTitle(coll[r.username]) : null} />
                      <RelChips player={r.username} s={social} />
                      {user && !mine && (
                        <Link className="rank-thach" href={`/thach-dau?u=${encodeURIComponent(r.username)}`}>
                          
                          {tr("⚔ Hạ chiến thư", "⚔ Issue a challenge")}
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
          <Link href="/dang-nhap">{tr("Đăng nhập", "Log in")}</Link>{tr(" để ghi danh lên bảng.", " to register on the board.")}
        </p>
      )}
    </main>
  );
}
