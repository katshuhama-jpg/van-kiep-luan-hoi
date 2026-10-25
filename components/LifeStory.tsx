'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Scene from './Scene';
import Sprite from './Sprite';
import { demoChar } from '@/lib/game/demo';
import { REALMS, realmLabel } from '@/lib/game/data';
import { pickStory } from '@/lib/game/miles';
import { condolences, type Condolence } from '@/lib/social';
import type { Character, Focus, Fx, FxKind, Mile, PathId } from '@/lib/game/types';

/**
 * Hồi ký một kiếp: xem lại các cột mốc chính của người đã khuất như một cuốn truyện tranh pixel.
 * Mỗi mốc là một cảnh trong game (đúng tuổi, đúng cảnh giới, đúng dáng vẻ lúc đó), có hiệu ứng riêng,
 * tự lật trang như story, chạm trái phải để lùi tới.
 */

export interface LifeRecord {
  char_name: string;
  player_name: string;
  life_no: number;
  age: number;
  realm: string;
  realm_no?: number | null;
  layer_no?: number | null;
  path: string | null;
  dao_tam: number;
  cause: string | null;
  epitaph: string | null;
  ascended: boolean;
  incense: number;
  look?: Record<string, unknown> | null;
}

type Slide = { t: 'title' } | { t: 'mile'; m: Mile; n: number } | { t: 'end' };

const KIND: Record<Mile['kind'], { label: string; focus: Focus; fx: FxKind[]; season: number; tone: string }> = {
  birth: { label: 'Chào đời', focus: 'du_ngoan', fx: ['heal'], season: 0, tone: 'dawn' },
  path: { label: 'Nhập đạo', focus: 'tu_luyen', fx: ['breakthrough'], season: 1, tone: 'jade' },
  realm: { label: 'Đột phá', focus: 'tu_luyen', fx: ['lightning', 'breakthrough'], season: 2, tone: 'storm' },
  love: { label: 'Nhân duyên', focus: 'ket_duyen', fx: ['love'], season: 0, tone: 'rose' },
  pet: { label: 'Linh thú', focus: 'du_ngoan', fx: ['love'], season: 1, tone: 'jade' },
  mount: { label: 'Long kỵ', focus: 'du_ngoan', fx: ['breakthrough'], season: 1, tone: 'gold' },
  duel: { label: 'Giao đấu', focus: 'tu_luyen', fx: ['hurt'], season: 2, tone: 'blood' },
  revenge: { label: 'Báo thù', focus: 'tu_luyen', fx: ['evil'], season: 3, tone: 'blood' },
  death: { label: 'Tạ thế', focus: 'tu_luyen', fx: ['death'], season: 3, tone: 'night' },
};

const HOI = ['nhất', 'nhị', 'tam', 'tứ', 'ngũ', 'lục', 'thất', 'bát'];
const SLIDE_MS = 5200;

/** Dựng lại nhân vật ở một thời điểm trong đời từ dáng vẻ đã lưu */
function charAt(r: LifeRecord, age: number, realm: number, extra: Partial<Character> = {}): Character {
  const look = (r.look ?? {}) as Partial<Character> & { miles?: Mile[] };
  return demoChar({
    ...look,
    name: r.char_name,
    lifeNo: r.life_no,
    age,
    lifespan: Math.max(r.age, (look.lifespan as number) ?? r.age),
    realm,
    layer: realm === (r.realm_no ?? realm) ? (r.layer_no ?? 1) : 1,
    path: realm >= 1 ? ((look.path as PathId) ?? null) : null,
    daoTam: r.dao_tam,
    equipped: (look.equipped as Character['equipped']) ?? { ao: 'ao_vai' },
    pet: !!look.pet && age >= 8,
    log: [],
    dead: false,
    ...extra,
  });
}

export default function LifeStory({
  r,
  onClose,
  onIncense,
  canIncense,
  lifeId,
  onCondole,
}: {
  r: LifeRecord;
  onClose: () => void;
  onIncense?: () => void;
  canIncense?: boolean;
  lifeId?: number;
  onCondole?: (body: string) => void;
}) {
  const [condo, setCondo] = useState<Condolence[]>([]);
  const [text, setText] = useState('');
  useEffect(() => {
    if (lifeId)
      condolences(lifeId)
        .then(setCondo)
        .catch(() => {});
  }, [lifeId]);
  const look = (r.look ?? {}) as { miles?: Mile[]; birthPlace?: string; origin?: string; endTag?: string };
  const finalRealm = r.realm_no ?? 0;
  const maTon = look.endTag === 'ma_ton_do_kiep' || (r.cause ?? '').includes('Ma Tôn');
  const story = useMemo(() => pickStory(look.miles, { age: r.age, realm: finalRealm }), [look.miles, r.age, finalRealm]);
  const slides: Slide[] = useMemo(
    () => [
      { t: 'title' },
      {
        t: 'mile',
        n: 0,
        m: {
          age: 0,
          kind: 'birth',
          text: look.birthPlace ? `Chào đời ở ${look.birthPlace}${look.origin ? `, ${look.origin.toLowerCase()}` : ''}.` : 'Một tiếng khóc chào đời, một kiếp người bắt đầu.',
        },
      },
      ...story.map((m, i) => ({ t: 'mile' as const, n: i + 1, m })),
      { t: 'end' },
    ],
    [story, look.birthPlace, look.origin],
  );
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const s = slides[i];
  const last = i === slides.length - 1;

  const go = useCallback((d: number) => setI((x) => Math.max(0, Math.min(slides.length - 1, x + d))), [slides.length]);

  // tự lật trang như story
  useEffect(() => {
    if (!playing || last) return;
    const t = setTimeout(() => go(1), i === 0 ? 3600 : SLIDE_MS);
    return () => clearTimeout(t);
  }, [i, playing, last, go]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [go, onClose]);

  const tone = s.t === 'mile' ? KIND[s.m.kind].tone : s.t === 'end' ? (r.ascended ? (maTon ? 'blood' : 'gold') : 'night') : 'title';

  return (
    <div className={`ls tone-${tone}`} role="dialog" aria-modal="true" aria-label={`Hồi ký ${r.char_name}`}>
      <div className="ls-stars" aria-hidden="true" />
      <div className="ls-col">
        <div className="ls-bars" aria-hidden="true">
          {slides.map((_, k) => (
            <span key={k} className={k < i ? 'done' : k === i ? (playing && !last ? 'run' : 'done') : ''} style={k === i ? { animationDuration: `${i === 0 ? 3600 : SLIDE_MS}ms` } : undefined} />
          ))}
        </div>
        <div className="ls-top">
          <span>
            Hồi ký · {r.char_name}{' '}
            <small>
              @{r.player_name} · Kiếp {r.life_no}
            </small>
          </span>
          <button className="ls-x" onClick={onClose} aria-label="Đóng hồi ký">
            ✕
          </button>
        </div>

        <div className="ls-stage" key={i}>
          {s.t === 'title' && (
            <div className="ls-title">
              <span className="ls-lantern l" aria-hidden="true" />
              <span className="ls-lantern r" aria-hidden="true" />
              <small className="ls-kicker">Một kiếp người</small>
              <h2>{r.char_name}</h2>
              <p className="ls-sub">
                {r.age} năm dương thế · {finalRealm === 0 ? 'Phàm nhân' : realmLabel(finalRealm, r.layer_no ?? 1)}
                {r.path ? ` · ${r.path}` : ''}
              </p>
              <div className="ls-hero">
                <Sprite c={charAt(r, Math.max(20, Math.min(r.age, 60)), finalRealm)} size={150} />
              </div>
              {r.epitaph && <blockquote>“{r.epitaph}”</blockquote>}
            </div>
          )}

          {s.t === 'mile' && <MileSlide r={r} m={s.m} n={s.n} />}

          {s.t === 'end' && (
            <div className="ls-end">
              <div className="ls-scene">
                <SceneAt r={r} age={r.age} realm={finalRealm} kind="death" ascended={r.ascended} />
                <span className="ls-chap">{r.ascended ? (maTon ? 'Thành Ma Tôn' : 'Phi thăng') : 'Hồi kết'}</span>
              </div>
              <div className="ls-cap">
                <b className="ls-age">Năm {r.age} tuổi</b>
                <p>{r.cause ?? 'Một kiếp người khép lại.'}</p>
              </div>
              <div className="ls-tomb">
                <span className="ls-stone" aria-hidden="true">
                  <i />
                </span>
                <div>
                  <b>{r.char_name}</b>
                  <small>
                    Hưởng thọ {r.age} · {r.realm}
                  </small>
                  {r.epitaph && <em>“{r.epitaph}”</em>}
                  <small>{r.incense} nén hương</small>
                </div>
              </div>
              {condo.length > 0 && (
                <ul className="condo-list" aria-label="Lời viếng">
                  {condo.slice(0, 4).map((x, k) => (
                    <li key={k}>
                      <b>@{x.from_player}</b>: {x.body}
                    </li>
                  ))}
                </ul>
              )}
              {onCondole && (
                <span className="condo-input">
                  <input value={text} maxLength={120} onChange={(e) => setText(e.target.value)} placeholder="Để lại một lời viếng" aria-label="Lời viếng" />
                  <button
                    className="btn"
                    disabled={!text.trim()}
                    onClick={() => {
                      const b = text.trim();
                      onCondole(b);
                      setCondo((x) => [{ from_player: 'bạn', body: b, created_at: new Date().toISOString() }, ...x]);
                      setText('');
                    }}
                  >
                    Viếng
                  </button>
                </span>
              )}
              <div className="ls-actions">
                <button className="btn" onClick={() => setI(0)}>
                  Xem lại từ đầu
                </button>
                {onIncense && (
                  <button className="btn btn-red" disabled={!canIncense} onClick={onIncense}>
                    Thắp một nén hương
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* chạm nửa trái, nửa phải để lùi, tới; nút giữa tạm dừng */}
        {!last && (
          <>
            <button className="ls-tap l" onClick={() => go(-1)} aria-label="Cảnh trước" />
            <button className="ls-tap r" onClick={() => go(1)} aria-label="Cảnh sau" />
          </>
        )}
        <div className="ls-nav">
          <button className="btn" onClick={() => go(-1)} disabled={i === 0} aria-label="Cảnh trước">
            ‹
          </button>
          <button className="btn" onClick={() => setPlaying(!playing)} disabled={last}>
            {playing && !last ? '❚❚ Dừng' : '▶ Tự chạy'}
          </button>
          <button className="btn" onClick={() => go(1)} disabled={last} aria-label="Cảnh sau">
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

function SceneAt({ r, age, realm, kind, ascended }: { r: LifeRecord; age: number; realm: number; kind: Mile['kind']; ascended?: boolean }) {
  const k = KIND[kind];
  const dead = kind === 'death' && !ascended;
  const c = charAt(r, age, realm, { focus: k.focus, dead, ascended: !!ascended, cause: dead ? r.cause : null });
  const fx: Fx[] = (kind === 'death' && ascended ? (['breakthrough', 'lightning'] as FxKind[]) : k.fx).map((f, j) => ({ kind: f, id: j + 1 }));
  return <Scene c={c} fx={fx} paused={false} season={k.season} />;
}

function MileSlide({ r, m, n }: { r: LifeRecord; m: Mile; n: number }) {
  const k = KIND[m.kind];
  const realm = m.realm ?? 0;
  const [shown, setShown] = useState(0);
  // chữ hiện dần như đang kể chuyện
  useEffect(() => {
    setShown(0);
    const t = setInterval(() => setShown((x) => (x >= m.text.length ? x : x + 2)), 28);
    return () => clearInterval(t);
  }, [m.text]);
  return (
    <div className={`ls-mile k-${m.kind}`}>
      <div className="ls-scene">
        <SceneAt r={r} age={m.age} realm={realm} kind={m.kind} />
        <span className="ls-chap">Hồi thứ {HOI[n] ?? n + 1}</span>
        <span className="ls-kind">{k.label}</span>
        {m.kind === 'realm' && realm >= 1 && <span className="ls-realm">{REALMS[realm]?.name}</span>}
        {m.kind === 'path' && r.path && <span className="ls-realm">{r.path}</span>}
      </div>
      <div className="ls-cap">
        <b className="ls-age">{m.age === 0 ? 'Năm đầu tiên' : `Năm ${m.age} tuổi`}</b>
        <p>
          {m.text.slice(0, shown)}
          {shown < m.text.length && <i className="ls-caret" aria-hidden="true" />}
        </p>
      </div>
    </div>
  );
}
