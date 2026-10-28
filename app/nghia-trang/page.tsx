'use client';

import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadAll, lifeDetail, listMemorials, thapHuong, topIncense, type Memorial } from '@/lib/storage';
import LifeStory, { type LifeRecord } from '@/components/LifeStory';
import { useAuth } from '@/lib/useAuth';
import { RelChips } from '@/components/GiangHo';
import { SOCIAL, type SocialState } from '@/lib/game/social';
import { condolenceAdd, condolenceCounts, loadSocial } from '@/lib/social';
import CondoPresets from '@/components/CondoPresets';
import type { Player } from '@/lib/auth';
import { cosOfGrave, endingOfGrave } from '@/lib/game/collect';
import { RARE_COLOR } from '@/lib/game/endings';
import { tr } from '@/lib/i18n';

type Condo = Record<string, { n: number; last: string }>;

function Tomb({
  m,
  canIncense,
  onIncense,
  onStory,
  condo,
  social,
  user,
  onCondole,
  mine,
}: {
  m: Memorial;
  canIncense: boolean;
  onIncense: () => void;
  onStory: () => void;
  condo?: { n: number; last: string };
  social: SocialState;
  user: Player | null;
  onCondole: (body: string) => void;
  mine: Record<string, number> | null; // kết cục người xem đã mở
}) {
  const [writing, setWriting] = useState(false);
  const end = endingOfGrave(m);
  const unseen = mine !== null && !mine[end.id];
  const [text, setText] = useState('');
  return (
    <article className={`grave ${m.ascended ? 'ascended' : ''} ${cosOfGrave(m) ? `cos-${cosOfGrave(m)}` : ''}`}>
      {cosOfGrave(m) && <span className="grave-cos">{TRUNG[cosOfGrave(m)!]}</span>}
      <small>
        
        {tr("Kiếp ", "Life ")}{m.life_no} · {m.player_name} <RelChips player={m.player_name} s={social} />
      </small>
      <span className="gname">{m.char_name}</span>
      <small>
        {m.age}{tr(" tuổi · ", " years old · ")}{m.realm}
        {m.path ? ` · ${m.path}` : ''}
      </small>
      {m.ascended ? (
        <small style={{ color: /Ma Tôn|Demon Sovereign/.test(m.cause ?? '') ? 'var(--ta)' : 'var(--jade)' }}>{/Ma Tôn|Demon Sovereign/.test(m.cause ?? '') ? tr('Đã thành Ma Tôn', "Became a Demon Sovereign") : tr('Đã phi thăng', "Ascended")}</small>
      ) : (
        m.cause && <small>{m.cause}</small>
      )}
      <span className={`tomb-ending ${unseen ? 'unseen' : ''}`} style={{ ['--rc' as string]: RARE_COLOR[end.rare] } as React.CSSProperties}>
        <i>{tr("Kết cục", "Ending")}</i> {end.name}
        {unseen && <small>{tr("Bạn chưa từng chết như vậy", "You have never died like this")}</small>}
      </span>
      {m.epitaph && <span className="epitaph">“{m.epitaph}”</span>}
      {condo && (
        <span className="tomb-condo">
          {condo.n}{tr(" lời viếng · “", " epitaphs · “")}{condo.last}”
        </span>
      )}
      <button className="btn btn-red story-btn" style={{ marginTop: 'auto', fontSize: 17 }} onClick={onStory} aria-label={tr(`Xem hồi ký ${m.char_name}`, `Read the memoir of ${m.char_name}`)}>
        
        {tr("Xem hồi ký", "Read memoir")}
      </button>
      {user && user.username !== m.player_name && (
        <Link className="btn btn-dark th-btn" href={`/thach-dau?l=${m.id}`} aria-label={tr(`Hạ chiến thư cho ${m.char_name}`, `Issue a challenge to ${m.char_name}`)}>
          
          {tr("⚔ Hạ chiến thư", "⚔ Issue a challenge")}
        </Link>
      )}
      <button
        className="btn"
        style={{ fontSize: 17 }}
        disabled={!canIncense}
        onClick={() => {
          onIncense();
          if (user) setWriting(true);
        }}
        aria-label={tr(`Thắp hương cho ${m.char_name}`, `Burn incense for ${m.char_name}`)}
      >
        
        {tr("Thắp hương · ", "Incense · ")}{m.incense}
      </button>
      {writing && (
        <CondoPresets
          seed={m.id}
          onPick={(b) => {
            onCondole(b);
            setWriting(false);
          }}
        />
      )}
      {writing && (
        <span className="condo-input">
          <input autoFocus value={text} maxLength={120} onChange={(e) => setText(e.target.value)} placeholder={tr("Hoặc tự viết lời viếng", "Or write your own epitaph")} aria-label={tr(`Lời viếng cho ${m.char_name}`, `Epitaph for ${m.char_name}`)} />
          <button
            className="btn"
            disabled={!text.trim()}
            onClick={() => {
              onCondole(text.trim());
              setText('');
              setWriting(false);
            }}
          >
            
            {tr("Gửi", "Send")}
          </button>
        </span>
      )}
    </article>
  );
}

const TRUNG = { tien: tr('Tiên Trủng', "Immortal Tombs"), ma: tr('Ma Trủng', "Demon Tombs"), hu: tr('Hư Trủng', "Void Tombs") } as const;

export default function Graveyard() {
  const { user, ready } = useAuth();
  const [tab, setTab] = useState<'all' | 'mine' | 'den'>('all');
  const [data, setData] = useState<{ all: Memorial[]; mine: Memorial[]; den: Memorial[] } | null>(null);

  const [condo, setCondo] = useState<Condo>({});
  const [social, setSocial] = useState<SocialState>(SOCIAL.cur);
  const [mine, setMine] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    if (!ready) return;
    loadAll(user)
      .then((x) => setMine(x.meta.endings ?? {}))
      .catch(() => {});
    Promise.all([listMemorials(user), topIncense()]).then(([d, den]) => setData({ ...d, den }));
    loadSocial(user)
      .then((x) => setSocial({ ...x }))
      .catch(() => {});
  }, [ready, user?.token]);

  const list = data ? data[tab] : [];
  useEffect(() => {
    const ids = list.map((m) => m.id).filter((id) => !(String(id) in condo));
    if (ids.length) condolenceCounts(ids).then((c) => setCondo((x) => ({ ...x, ...c })));
  }, [list]);
  async function condole(m: Memorial, body: string) {
    const r = await condolenceAdd(user, m.id, body);
    if (r !== 'OK') return;
    setCondo((x) => ({ ...x, [String(m.id)]: { n: (x[String(m.id)]?.n ?? 0) + 1, last: body } }));
  }
  const [story, setStory] = useState<{ m: Memorial; r: LifeRecord } | null>(null);
  async function openStory(m: Memorial) {
    const d = await lifeDetail(m);
    setStory({ m, r: { ...m, ...d } });
  }

  async function incense(m: Memorial) {
    const n = await thapHuong(user, m.id);
    if (n === null || !data) return;
    const up = (arr: Memorial[]) => arr.map((x) => (x.id === m.id ? { ...x, incense: n } : x));
    setData({ all: up(data.all), mine: up(data.mine), den: up(data.den) });
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 28 }}>
            
            {tr("Nghĩa trang", "Cemetery")}
          </span>
          <span className="meta">{tr("Nơi các kiếp đã qua yên nghỉ", "Where past lives rest")}</span>
          <BackButton fallback="/" />
        </div>
      </header>

      <div className="tabs">
        <button className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>
          
          {tr("Mọi người", "Everyone")}
        </button>
        <button className={tab === 'mine' ? 'on' : ''} onClick={() => setTab('mine')}>
          
          {tr("Các kiếp của tôi", "My lives")}
        </button>
        <button className={tab === 'den' ? 'on' : ''} onClick={() => setTab('den')}>
          
          {tr("Đền danh nhân", "Hall of Fame")}
        </button>
      </div>

      {!user && (
        <p className="note" style={{ margin: 0 }}>
          
          {tr("Đăng nhập để thắp hương và để bia của bạn hiện cho mọi người.", "Log in to burn incense and let everyone see your tombstones.")}
        </p>
      )}

      {tab === 'den' && (
        <p className="note" style={{ margin: 0 }}>
          
          {tr("Những ngôi mộ được giang hồ thắp hương nhiều nhất. Danh nhân được ghi tên ở đây mãi mãi.", "The graves the jianghu has burned the most incense at. The famous are remembered here forever.")}
        </p>
      )}

      {!data ? (
        <p>{tr("Đang dọn cỏ...", "Clearing the weeds...")}</p>
      ) : list.length === 0 ? (
        <section className="panel">
          <p style={{ margin: 0 }}>{tr("Chưa có ngôi mộ nào. Hãy sống trọn một kiếp rồi quay lại.", "No graves yet. Live one full life and come back.")}</p>
        </section>
      ) : (
        <div className="grave-list">
          {list.map((m) => (
            <Tomb
              key={m.id}
              m={m}
              canIncense={!!user && typeof m.id === 'number'}
              onIncense={() => incense(m)}
              onStory={() => openStory(m)}
              condo={condo[String(m.id)]}
              social={social}
              user={user}
              onCondole={(b) => condole(m, b)}
              mine={mine}
            />
          ))}
        </div>
      )}

      {story && (
        <LifeStory
          r={story.r}
          lifeId={typeof story.m.id === 'number' ? story.m.id : undefined}
          onCondole={user && typeof story.m.id === 'number' ? (b) => condole(story.m, b) : undefined}
          onClose={() => setStory(null)}
          canIncense={!!user && typeof story.m.id === 'number'}
          onIncense={async () => {
            await incense(story.m);
            setStory((x) => (x ? { ...x, r: { ...x.r, incense: x.r.incense + 1 } } : x));
          }}
        />
      )}

      <Link href="/choi" className="btn btn-red btn-big" style={{ textDecoration: 'none', textAlign: 'center' }}>
        
        {tr("Vào luân hồi", "Enter the Cycle")}
      </Link>
    </main>
  );
}
