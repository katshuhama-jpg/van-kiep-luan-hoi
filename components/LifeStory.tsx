'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Scene from './Scene';
import Sprite from './Sprite';
import { demoChar } from '@/lib/game/demo';
import { REALMS, realmLabel, realmName } from '@/lib/game/data';
import { pickStory } from '@/lib/game/miles';
import { condolences, type Condolence } from '@/lib/social';
import CondoPresets from './CondoPresets';
import type { Character, Focus, Fx, FxKind, Mile, PathId } from '@/lib/game/types';
import { tr } from '@/lib/i18n';

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
  birth: { label: tr('Chào đời', "Birth"), focus: 'du_ngoan', fx: ['heal'], season: 0, tone: 'dawn' },
  path: { label: tr('Nhập đạo', "Entering the Dao"), focus: 'tu_luyen', fx: ['breakthrough'], season: 1, tone: 'jade' },
  realm: { label: tr('Đột phá', "Breakthrough"), focus: 'tu_luyen', fx: ['lightning', 'breakthrough'], season: 2, tone: 'storm' },
  love: { label: tr('Nhân duyên', "Fated bonds"), focus: 'ket_duyen', fx: ['love'], season: 0, tone: 'rose' },
  pet: { label: tr('Linh thú', "Spirit beast"), focus: 'du_ngoan', fx: ['love'], season: 1, tone: 'jade' },
  mount: { label: tr('Long kỵ', "Dragon rider"), focus: 'du_ngoan', fx: ['breakthrough'], season: 1, tone: 'gold' },
  duel: { label: tr('Giao đấu', "Duel"), focus: 'tu_luyen', fx: ['hurt'], season: 2, tone: 'blood' },
  revenge: { label: tr('Báo thù', "Revenge"), focus: 'tu_luyen', fx: ['evil'], season: 3, tone: 'blood' },
  sect: { label: tr('Bái sư', "Taking a Master"), focus: 'tu_luyen', fx: ['heal'], season: 1, tone: 'jade' },
  wealth: { label: tr('Phát tài', "Fortune made"), focus: 'kiem_tien', fx: ['buy'], season: 0, tone: 'gold' },
  treasure: { label: tr('Bảo vật', "Treasure"), focus: 'du_ngoan', fx: ['layer'], season: 2, tone: 'gold' },
  hunt: { label: tr('Trừ yêu', "Hunting demons"), focus: 'tru_yeu', fx: ['hurt'], season: 2, tone: 'storm' },
  journey: { label: tr('Lên đường', "Setting out"), focus: 'du_ngoan', fx: ['heal'], season: 1, tone: 'dawn' },
  fate: { label: tr('Mệnh số', "Destiny"), focus: 'du_ngoan', fx: ['love'], season: 0, tone: 'dawn' },
  death: { label: tr('Tạ thế', "Passing"), focus: 'tu_luyen', fx: ['death'], season: 3, tone: 'night' },
};

const HOI = [tr('nhất', "One"), tr('nhị', "Two"), tr('tam', "Three"), tr('tứ', "Four"), tr('ngũ', "Five"), tr('lục', "Six"), tr('thất', "Seven"), tr('bát', "Eight")];
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
  const look = (r.look ?? {}) as {
    miles?: Mile[];
    birthPlace?: string;
    origin?: string;
    endTag?: string;
    path?: string | null;
    pet?: boolean;
    petKind?: string;
    mount?: string | null;
    sect?: string | null;
    equipped?: Record<string, string>;
    element?: string;
    cosmos?: 'tien' | 'ma' | 'hu' | null;
  };
  const finalRealm = r.realm_no ?? 0;
  const maTon = look.endTag === 'ma_ton_do_kiep' || /Ma Tôn|Demon Sovereign/.test(r.cause ?? '');
  const story = useMemo(
    () =>
      pickStory(look.miles, {
        age: r.age,
        realm: finalRealm,
        path: look.path,
        pet: look.pet,
        petKind: look.petKind,
        mount: look.mount,
        sect: look.sect,
        equipped: look.equipped,
        element: look.element,
        birthPlace: look.birthPlace,
      }),
    [r, look.miles, finalRealm],
  );
  const slides: Slide[] = useMemo(
    () => [
      { t: 'title' },
      {
        t: 'mile',
        n: 0,
        m: {
          age: 0,
          kind: 'birth',
          text: look.birthPlace ? tr(`Chào đời ở ${look.birthPlace}${look.origin ? `, ${look.origin.toLowerCase()}` : ''}.`, `Born in ${look.birthPlace}${look.origin ? `, ${look.origin.toLowerCase()}` : ''}.`) : tr('Một tiếng khóc chào đời, một kiếp người bắt đầu.', "A first cry, and a new life begins."),
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
    <div className={`ls tone-${tone}`} role="dialog" aria-modal="true" aria-label={tr(`Hồi ký ${r.char_name}`, `Memoir of ${r.char_name}`)}>
      <div className="ls-stars" aria-hidden="true" />
      <div className="ls-col">
        <div className="ls-bars" aria-hidden="true">
          {slides.map((_, k) => (
            <span key={k} className={k < i ? 'done' : k === i ? (playing && !last ? 'run' : 'done') : ''} style={k === i ? { animationDuration: `${i === 0 ? 3600 : SLIDE_MS}ms` } : undefined} />
          ))}
        </div>
        <div className="ls-top">
          <span>
            
            {tr("Hồi ký · ", "Memoir · ")}{r.char_name}{' '}
            <small>
              @{r.player_name}{tr(" · Kiếp ", " · Life ")}{r.life_no}
            </small>
          </span>
          <button className="ls-x" onClick={onClose} aria-label={tr("Đóng hồi ký", "Close memoir")}>
            ✕
          </button>
        </div>

        <div className="ls-stage" key={i}>
          {s.t === 'title' && (
            <div className="ls-title">
              <span className="ls-lantern l" aria-hidden="true" />
              <span className="ls-lantern r" aria-hidden="true" />
              <small className="ls-kicker">{tr("Một kiếp người", "One mortal life")}</small>
              <h2>{r.char_name}</h2>
              <p className="ls-sub">
                {r.age}{tr(" năm dương thế · ", " years in the world · ")}{finalRealm === 0 ? tr('Phàm nhân', "Mortal") : realmLabel(finalRealm, r.layer_no ?? 1, look.cosmos)}
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
                <span className="ls-chap">{r.ascended ? (maTon ? tr('Thành Ma Tôn', "Became a Demon Sovereign") : tr('Phi thăng', "Ascended")) : tr('Hồi kết', "The end")}</span>
              </div>
              <div className="ls-cap">
                <b className="ls-age">{tr("Năm ", "Year ")}{r.age}{tr(" tuổi", " years old")}</b>
                <p>{r.cause ?? tr('Một kiếp người khép lại.', "A life draws to a close.")}</p>
              </div>
              <div className="ls-tomb">
                <span className="ls-stone" aria-hidden="true">
                  <i />
                </span>
                <div>
                  <b>{r.char_name}</b>
                  <small>
                    
                    {tr("Hưởng thọ ", "Lived to ")}{r.age} · {r.realm}
                  </small>
                  {r.epitaph && <em>“{r.epitaph}”</em>}
                  <small>{r.incense}{tr(" nén hương", " sticks of incense")}</small>
                </div>
              </div>
              {condo.length > 0 && (
                <ul className="condo-list" aria-label={tr("Lời viếng", "Condolences")}>
                  {condo.slice(0, 4).map((x, k) => (
                    <li key={k}>
                      <b>@{x.from_player}</b>: {x.body}
                    </li>
                  ))}
                </ul>
              )}
              {onCondole && (
                <CondoPresets
                  seed={lifeId ?? 7}
                  onPick={(b) => {
                    onCondole(b);
                    setCondo((x) => [{ from_player: tr('bạn', "you"), body: b, created_at: new Date().toISOString() }, ...x]);
                  }}
                />
              )}
              {onCondole && (
                <span className="condo-input">
                  <input value={text} maxLength={120} onChange={(e) => setText(e.target.value)} placeholder={tr("Hoặc tự viết lời viếng", "Or write your own condolence")} aria-label={tr("Lời viếng", "Condolences")} />
                  <button
                    className="btn"
                    disabled={!text.trim()}
                    onClick={() => {
                      const b = text.trim();
                      onCondole(b);
                      setCondo((x) => [{ from_player: tr('bạn', "you"), body: b, created_at: new Date().toISOString() }, ...x]);
                      setText('');
                    }}
                  >
                    
                    {tr("Viếng", "Pay respects")}
                  </button>
                </span>
              )}
              <div className="ls-actions">
                <button className="btn" onClick={() => setI(0)}>
                  
                  {tr("Xem lại từ đầu", "Watch from the start")}
                </button>
                {onIncense && (
                  <button className="btn btn-red" disabled={!canIncense} onClick={onIncense}>
                    
                    {tr("Thắp một nén hương", "Burn a stick of incense")}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* chạm nửa trái, nửa phải để lùi, tới; nút giữa tạm dừng */}
        {!last && (
          <>
            <button className="ls-tap l" onClick={() => go(-1)} aria-label={tr("Cảnh trước", "Previous scene")} />
            <button className="ls-tap r" onClick={() => go(1)} aria-label={tr("Cảnh sau", "Next scene")} />
          </>
        )}
        <div className="ls-nav">
          <button className="btn" onClick={() => go(-1)} disabled={i === 0} aria-label={tr("Cảnh trước", "Previous scene")}>
            ‹
          </button>
          <button className="btn" onClick={() => setPlaying(!playing)} disabled={last}>
            {playing && !last ? tr('❚❚ Dừng', "❚❚ Pause") : tr('▶ Tự chạy', "▶ Autoplay")}
          </button>
          <button className="btn" onClick={() => go(1)} disabled={last} aria-label={tr("Cảnh sau", "Next scene")}>
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
  // hồi ký có nhãn riêng, tắt chữ hiệu ứng của cảnh để không chồng lên nhau
  return <Scene c={c} fx={fx} paused={false} season={k.season} quiet />;
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
        <span className="ls-chap">{tr("Hồi thứ ", "Chapter ")}{HOI[n] ?? n + 1}</span>
        <span className="ls-kind">{k.label}</span>
        {m.kind === 'realm' && realm >= 1 && <span className="ls-realm">{realmName(realm, (r.look as { cosmos?: 'tien' | 'ma' } | null)?.cosmos)}</span>}
        {m.kind === 'path' && r.path && <span className="ls-realm">{r.path}</span>}
      </div>
      <div className="ls-cap">
        <b className="ls-age">{m.age === 0 ? tr('Năm đầu tiên', "The first year") : tr(`Năm ${m.age} tuổi`, `Age ${m.age}`)}</b>
        <p>
          {m.text.slice(0, shown)}
          {shown < m.text.length && <i className="ls-caret" aria-hidden="true" />}
        </p>
      </div>
    </div>
  );
}
