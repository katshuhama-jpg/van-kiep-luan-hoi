'use client';

import { useEffect, useRef, useState } from 'react';
import Sprite, { lpcLayers } from './Sprite';
import { GRADE_COL, drawLife, gradeOf, rankPct, shareLife } from '@/lib/lifeCard';
import { track } from '@/lib/track';
import ShareSheet from './ShareSheet';
import type { ShareOut } from '@/lib/shareCard';
import Radar, { charAxes, wealthScore } from './Radar';
import { GIFTS, RARE_NAME, applyGifts, drawGifts, giftOf } from '@/lib/game/gacha';
import { RARE_COLOR, type Ending } from '@/lib/game/endings';
import { FAMILY_TIERS, PATHS, realmLabel } from '@/lib/game/data';
import { rollBase } from '@/lib/game/engine';
import type { Character } from '@/lib/game/types';
import { ELEMENTS, elementOf } from '@/lib/game/nguhanh';
import { tr } from '@/lib/i18n';

/* ================= Gieo quẻ: lá số nhân vật + thiên phú ================= */
/** Lá số đang gieo dở được giữ lại tới khi đầu thai, rời trang rồi vào lại vẫn là lá số đó và số lần gieo đó */
const LASO_KEY = 'vkl.laso';
type LaSo = { lifeNo: number; cards: string[]; picked: string[]; rolls: number; base: Character };
function readLaSo(lifeNo?: number): LaSo | null {
  try {
    const v = JSON.parse(localStorage.getItem(LASO_KEY) || 'null') as LaSo | null;
    return v && v.base && Array.isArray(v.cards) && v.lifeNo === (lifeNo ?? 0) ? v : null;
  } catch {
    return null;
  }
}
function writeLaSo(v: LaSo) {
  try {
    localStorage.setItem(LASO_KEY, JSON.stringify(v));
  } catch {}
}
/** Gọi khi đã đầu thai xong để kiếp sau gieo lá số mới */
export function clearLaSo() {
  try {
    localStorage.removeItem(LASO_KEY);
  } catch {}
}

export function GachaPanel({ phuc, onChange, onBorn, busy, lifeNo, barNote }: { phuc: number; onChange: (gifts: string[], spent: number, base: Character | null) => void; onBorn: () => void; busy?: boolean; lifeNo?: number; barNote?: string }) {
  const [cards, setCards] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [rolls, setRolls] = useState(0);
  const [flip, setFlip] = useState(0);
  const [base, setBase] = useState<Character | null>(null);
  const [showRadar, setShowRadar] = useState(false);
  // lần gieo đầu tiên và lần gieo lại kế tiếp miễn phí
  const cost = rolls < 2 ? 0 : 5;
  const spent = Math.max(0, rolls - 2) * 5;
  const roll = (from = rolls) => {
    const next = drawGifts(5);
    const b = rollBase();
    const n = from + 1;
    setCards(next);
    setPicked([]);
    setBase(b);
    setRolls(n);
    setFlip((f) => f + 1);
    writeLaSo({ lifeNo: lifeNo ?? 0, cards: next, picked: [], rolls: n, base: b });
    onChange([], Math.max(0, n - 2) * 5, b);
  };
  // vào màn là trời đã gieo sẵn một lá số; đang gieo dở thì lấy lại lá số cũ
  useEffect(() => {
    const saved = readLaSo(lifeNo);
    if (saved) {
      setCards(saved.cards);
      setPicked(saved.picked ?? []);
      setBase(saved.base);
      setRolls(saved.rolls);
      setFlip((f) => f + 1);
      onChange(saved.picked ?? [], Math.max(0, saved.rolls - 2) * 5, saved.base);
    } else roll(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const toggle = (id: string) => {
    const on = picked.includes(id);
    const next = on ? picked.filter((x) => x !== id) : picked.length >= 2 ? [picked[1], id] : [...picked, id];
    setPicked(next);
    if (base) writeLaSo({ lifeNo: lifeNo ?? 0, cards, picked: next, rolls, base });
    onChange(next, spent, base);
  };
  const best = cards.reduce((m, id) => Math.max(m, giftOf(id)?.rare ?? 0), 0);
  return (
    <>
      <section className="panel la-so">
        <div className="ls-head">
          <h2>{tr("Lá số ", "Fate chart: ")}{lifeNo ? tr(`kiếp ${lifeNo}`, `life ${lifeNo}`) : tr('kiếp này', "this life")}</h2>
          {base && (
            <button className="link-btn" onClick={() => setShowRadar(!showRadar)} aria-expanded={showRadar}>
              {showRadar ? tr('Ẩn chỉ số', "Hide stats") : tr('Xem chỉ số', "Show stats")}
            </button>
          )}
        </div>
        {base && <BirthCard key={'b' + flip} c={base} />}
        {base && showRadar && <GiftRadar base={base} picked={picked} />}
        {cards.length > 0 && (
          <div className="ls-gifts">
            <h3>
              
              {tr("Trời ban thiên phú ", "Heaven-sent talents ")}<small>{tr("chọn tối đa 2 lá, không bắt buộc", "pick up to 2, optional")}</small>
            </h3>
            <div className={`gacha-row ${best >= 3 ? 'gold' : ''}`} key={flip}>
              {cards.map((id, i) => {
                const g = giftOf(id)!;
                const on = picked.includes(id);
                return (
                  <button
                    key={id}
                    className={`gacha-card r${g.rare} ${on ? 'on' : ''}`}
                    style={{ animationDelay: `${0.3 + i * 0.12}s`, ['--rc' as string]: RARE_COLOR[g.rare] }}
                    onClick={() => toggle(id)}
                    aria-pressed={on}
                  >
                    <span className="gc-rare">{RARE_NAME[g.rare]}</span>
                    <b>{g.name}</b>
                    <small>{g.desc}</small>
                    {g.bad && <span className="gc-bad">{tr("có họa", "has a catch")}</span>}
                    {on && <span className="gc-check">{tr("✓ Đã chọn", "✓ Chosen")}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>
      <div className="birth-bar">
        <button className="btn" onClick={() => roll()} disabled={cost > 0 && phuc < cost}>
          
          {tr("Gieo lại", "Reroll")}
          <small>{cost ? tr(`-${cost} phúc`, `-${cost} Fortune`) : tr('miễn phí', "free")}</small>
        </button>
        <button className="btn btn-red btn-big" onClick={onBorn} disabled={busy || !base}>
          <span>{tr("Đầu thai ▶", "Be reborn ▶")}</span>
          {barNote && <small>{barNote}</small>}
        </button>
      </div>
    </>
  );
}

/** Lá số nhân vật: hình lúc trưởng thành, tên đổi được, thân phận */
function BirthCard({ c }: { c: Character }) {
  const fam = FAMILY_TIERS[c.familyTier ?? 1];
  const grown = { ...c, age: 22, lifespan: 90 };
  return (
    <div className="birth-card">
      <div className="bc-sprite">
        <Sprite c={grown} size={112} />
        <small>{c.gender === 'nam' ? tr('Nam', "Male") : tr('Nữ', "Female")}{tr(" · lớn lên sẽ thế này", " · all grown up")}</small>
      </div>
      <div className="bc-info">
        <b className="bc-title">{c.name}</b>
        <i className="bc-origin">{c.origin}</i>
        <dl className="bc-rows">
          <dt>{tr("Quê", "Hometown")}</dt>
          <dd>{c.birthPlace}</dd>
          <dt>{tr("Nhà", "Family")}</dt>
          <dd>
            <b>{fam?.name}</b> · {c.linhThach}{tr(" linh thạch", " spirit stones")}
          </dd>
          <dt>{tr("Căn", "Root")}</dt>
          <dd>
            <b>{c.linhCan}</b>
          </dd>
          <dt>{tr("Thọ", "Lifespan")}</dt>
          <dd>
            
            {tr("khoảng ", "about ")}{c.lifespan} · {c.fateName}
          </dd>
          <dt>{tr("Mệnh", "Element")}</dt>
          <dd>
            <b style={{ color: ELEMENTS[elementOf(c)].color, textShadow: '1px 1px 0 #1f160d' }}>
              {ELEMENTS[elementOf(c)].name}
            </b>
          </dd>
        </dl>
      </div>
    </div>
  );
}

/** Radar xem trước: chỉ số của lá số này trước và sau khi nhận thiên phú */
function GiftRadar({ base, picked }: { base: Character; picked: string[] }) {
  const after = structuredClone(base);
  applyGifts(after, picked);
  const axes = charAxes(after.stats, after.lifespan, wealthScore(after.linhThach), { s: base.stats, life: base.lifespan, wealth: wealthScore(base.linhThach) });
  return (
    <div className="gift-radar">
      <Radar axes={axes} size={230} color={picked.length ? '#b8432f' : '#2f6b5a'} />
      <p className="note" style={{ margin: 0, textAlign: 'center' }}>
        {picked.length ? tr('Vùng đỏ: chỉ số sau khi nhận thiên phú. Vùng xám: lá số gốc.', "Red area: stats after your talents. Gray area: the original fate chart.") : tr('Chỉ số của lá số này. Chọn thiên phú để xem thay đổi.', "This fate chart's stats. Pick talents to see the changes.")}
        {after.linhCanMul !== base.linhCanMul ? tr(` Tu luyện x${after.linhCanMul.toFixed(1)}.`, ` Cultivation x${after.linhCanMul.toFixed(1)}.`) : ''}
      </p>
    </div>
  );
}

/* ================= Mini-game thiên kiếp: đúng nhịp, đúng hướng, né lôi giả ================= */
type KPhase = 'intro' | 'calm' | 'warn' | 'fake' | 'hit' | 'block' | 'trap' | 'fakeGone' | 'done';
const K_TOTAL = 9;
const LANE_X = [17, 50, 83];
/** Đạo thứ idx: thời gian vòng co lại (ms) và cỡ ban đầu. Vòng lọt vào khung (cỡ <= 1.25) mới đỡ được. */
const kWin = (idx: number) => Math.round(1050 - idx * 45);
const kStart = (idx: number) => 2.2 + idx * 0.1;
const kZoneFrom = (idx: number) => (kStart(idx) - 1.25) / (kStart(idx) - 0.8);

function KiepSky({ phase }: { phase: KPhase }) {
  const dark = phase === 'warn' || phase === 'fake';
  return (
    <svg className="kiep-px" viewBox="0 0 90 160" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
      {['#0c0818', '#140e28', '#1c1436', '#261a46', '#302056', '#3a2864'].map((f, i) => (
        <rect key={i} y={i * 16} width="90" height="16" fill={f} />
      ))}
      <rect y="96" width="90" height="64" fill="#3a2864" />
      {/* sao */}
      {[[8, 30], [30, 44], [70, 36], [82, 60], [50, 70], [16, 78]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="1" height="1" fill="#8a80b0" className="kp-star" style={{ animationDelay: `${i * 0.3}s` }} />
      ))}
      {/* mây lôi */}
      <g transform="translate(0 22)">
      <g className={`kp-clouds ${dark ? 'charge' : ''}`}>
        <rect x="-4" y="6" width="34" height="8" fill="#3a2e5a" />
        <rect x="2" y="2" width="20" height="5" fill="#3a2e5a" />
        <rect x="-4" y="13" width="30" height="3" fill="#2a2244" />
        <rect x="28" y="0" width="36" height="9" fill="#44366a" />
        <rect x="34" y="-3" width="22" height="4" fill="#44366a" />
        <rect x="30" y="8" width="32" height="3" fill="#2a2244" />
        <rect x="60" y="5" width="34" height="8" fill="#3a2e5a" />
        <rect x="66" y="1" width="18" height="5" fill="#3a2e5a" />
        <rect x="62" y="12" width="30" height="3" fill="#2a2244" />
      </g>
      </g>
      {/* núi và đỉnh độ kiếp */}
      <polygon points="0,160 0,128 10,120 18,126 28,112 36,118 45,104 54,118 62,112 72,126 80,120 90,128 90,160" fill="#4a3a6a" />
      <polygon points="0,160 0,140 14,134 26,140 38,128 45,124 52,128 64,140 76,134 90,140 90,160" fill="#241a3a" />
      <polygon points="0,128 10,120 18,126 28,112 36,118 45,104 54,118 62,112 72,126 80,120 90,128 90,129 80,121 72,127 62,113 54,119 45,105 36,119 28,113 18,127 10,121 0,129" fill="#8a7ab0" />
      <rect x="38" y="124" width="14" height="3" fill="#6a5a8a" />
    </svg>
  );
}

/** Tia sét pixel đánh xuống từ trên trời tới làn được chọn */
function KiepBolt({ lane, kind }: { lane: number; kind: 'hit' | 'block' | 'trap' }) {
  const x = Math.round((LANE_X[lane] / 100) * 90);
  const col = kind === 'block' ? '#9ff0c8' : kind === 'trap' ? '#c88aff' : '#fff6a8';
  const segs: [number, number, number][] = [];
  let cx = x;
  for (let y = 0; y < 124; y += 8) {
    segs.push([cx, y, 8]);
    cx += y % 16 === 0 ? 3 : -3;
  }
  return (
    <svg className={`kiep-px kp-bolt ${kind}`} viewBox="0 0 90 160" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
      {segs.map(([sx, sy, h], i) => (
        <g key={i}>
          <rect x={sx - 2} y={sy} width="4" height={h} fill={col} opacity="0.35" />
          <rect x={sx - 1} y={sy} width="2" height={h} fill={col} />
        </g>
      ))}
      {kind === 'block' && <rect x={x - 8} y={122} width="16" height="2" fill="#9ff0c8" />}
    </svg>
  );
}

export function TribulationOverlay({ realmName, onDone, c }: { realmName: string; onDone: (bonus: number, blocked: number) => void; c?: Character }) {
  const [phase, setPhase] = useState<KPhase>('intro');
  const [i, setI] = useState(0);
  const [lane, setLane] = useState(1);
  const [res, setRes] = useState<('ok' | 'hit')[]>([]);
  const [lost, setLost] = useState(0); // đạo đã đỡ bị mất vì chạm lôi giả
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t0 = useRef(0);
  const st = useRef({ phase: 'intro' as KPhase, i: 0, lane: 1 });
  st.current = { phase, i, lane };

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  useEffect(() => clear, []);

  const blocked = Math.max(0, res.filter((r) => r === 'ok').length - lost);

  const after = (ms: number, fn: () => void) => {
    clear();
    timer.current = setTimeout(fn, ms);
  };

  const warn = (idx: number) => {
    const ln = Math.floor(Math.random() * 3);
    setLane(ln);
    // từ đạo 3: có lúc mây tụ ra lôi giả trước lôi thật
    const isFake = idx >= 2 && Math.random() < 0.35;
    t0.current = performance.now();
    setPhase(isFake ? 'fake' : 'warn');
    after(kWin(idx), () => {
      if (isFake) {
        setPhase('fakeGone');
        after(380, () => warn(idx));
      } else {
        strike(idx, 'hit');
      }
    });
  };

  const nextBolt = (idx: number) => {
    if (idx >= K_TOTAL) {
      setPhase('done');
      return;
    }
    setI(idx);
    setPhase('calm');
    // ba đạo cuối dồn dập
    const calm = idx >= 6 ? 220 + Math.random() * 260 : 450 + Math.random() * 900;
    after(calm, () => warn(idx));
  };

  const strike = (idx: number, kind: 'hit' | 'block') => {
    setRes((r) => [...r, kind === 'block' ? 'ok' : 'hit']);
    setPhase(kind);
    if (kind === 'hit') {
      try {
        navigator.vibrate?.(140);
      } catch {}
    }
    after(kind === 'block' ? 420 : 560, () => nextBolt(idx + 1));
  };

  const tap = (e: React.PointerEvent) => {
    const s = st.current;
    if (s.phase === 'intro') return nextBolt(0);
    const w = (e.currentTarget as HTMLElement).clientWidth || window.innerWidth;
    const tapLane = Math.min(2, Math.max(0, Math.floor((e.clientX / w) * 3)));
    if (s.phase === 'fake') {
      // chạm vào lôi giả: tâm loạn, mất một đạo đã đỡ
      setLost((l) => l + 1);
      setPhase('trap');
      try {
        navigator.vibrate?.(80);
      } catch {}
      after(520, () => warn(s.i));
      return;
    }
    if (s.phase === 'warn') {
      const f = (performance.now() - t0.current) / kWin(s.i);
      strike(s.i, f >= kZoneFrom(s.i) && tapLane === s.lane ? 'block' : 'hit');
    } else if (s.phase === 'calm') {
      // hấp tấp: lôi đánh ngay
      strike(s.i, 'hit');
    }
  };

  const bonus = Math.round(((blocked - 4.5) / K_TOTAL) * 0.3 * 100) / 100;
  const showBolt = phase === 'hit' || phase === 'block' || phase === 'trap';
  return (
    <div className={`kiep kiep-${phase}`} role="dialog" aria-label={tr("Thiên kiếp", "Heavenly tribulation")} onPointerDown={phase === 'done' ? undefined : tap}>
      <KiepSky phase={phase} />
      {showBolt && <KiepBolt lane={lane} kind={phase as 'hit' | 'block' | 'trap'} />}
      <div className="kiep-hud">
        <div className="kh-top">
          <b>{tr("Lôi kiếp ", "Lightning tribulation · ")}{realmName}</b>
          <span>
            
            {tr("Đạo ", "Bolt ")}{Math.min(K_TOTAL, i + 1)}/{K_TOTAL}
          </span>
        </div>
        <div className="kh-pips" aria-label={tr(`Đã đỡ ${blocked} đạo`, `Blocked ${blocked} bolts`)}>
          {Array.from({ length: K_TOTAL }, (_, k) => (
            <i key={k} className={res[k] ?? (k === i && phase !== 'intro' && phase !== 'done' ? 'now' : '')} />
          ))}
          {lost > 0 && <em>-{lost}</em>}
        </div>
      </div>

      {(phase === 'warn' || phase === 'fake') && (
        <div className={`kiep-aim ${phase === 'fake' ? 'fake' : ''}`} style={{ left: `${LANE_X[lane]}%` }}>
          <span className="ka-frame" />
          <span className="ka-ret" style={{ animationDuration: `${kWin(i)}ms`, ['--s0' as string]: kStart(i) }} />
          <b>{phase === 'fake' ? tr('GIẢ?', "FAKE?") : tr('ĐỠ', "BLOCK")}</b>
        </div>
      )}

      <div className="kiep-center">
        {phase === 'intro' && (
          <div className="kiep-card">
            <p className="kiep-big">{tr("CHÍN ĐẠO LÔI KIẾP", "NINE BOLTS OF TRIBULATION")}</p>
            <ul>
              <li>
                
                {tr("Sét đánh xuống ", "Lightning strikes ")}<b>{tr("trái, giữa hoặc phải", "left, middle or right")}</b>{tr(". Chạm đúng bên có khung ngắm.", ". Tap the side with the target frame.")}
              </li>
              <li>
                
                {tr("Chờ ô ngắm co lọt vào khung ", "Wait for the target to shrink inside the frame ")}<b>{tr("rồi mới chạm", "before you tap")}</b>{tr(". Chạm sớm hay chậm đều trúng sấm.", ". Too early or too late and the lightning hits you.")}
              </li>
              <li>
                
                {tr("Khung ", "The ")}<b className="vio">{tr("tím", "purple")}</b>{tr(" là lôi giả. Chạm vào là mất một đạo đã đỡ.", " frames are fake lightning. Tapping one costs you a bolt you already blocked.")}
              </li>
              <li>{tr("Ba đạo cuối tới dồn dập, không kịp thở.", "The last three bolts come thick and fast, no time to breathe.")}</li>
            </ul>
            <p className="kiep-tap">{tr("Chạm để bắt đầu", "Tap to begin")}</p>
          </div>
        )}
        {phase === 'calm' && <p className="kiep-mid">{tr("Mây đang tụ...", "Clouds gathering...")}</p>}
        {phase === 'block' && <p className="kiep-mid ok">{tr("Đỡ được!", "Blocked!")}</p>}
        {phase === 'hit' && <p className="kiep-mid bad">{tr("Trúng sấm!", "Struck by lightning!")}</p>}
        {phase === 'trap' && <p className="kiep-mid vio">{tr("Trúng lôi giả! Mất một đạo", "Fake bolt! Lost one block")}</p>}
        {phase === 'fakeGone' && <p className="kiep-mid">{tr("Lôi giả tan...", "The fake bolt fades...")}</p>}
        {phase === 'done' && (
          <div className="kiep-card">
            <p className="kiep-big">
              
              {tr("Đỡ được ", "Blocked ")}{blocked}/{K_TOTAL}{tr(" đạo", " bolts")}
            </p>
            <p>{bonus >= 0 ? tr(`Tỉ lệ vượt kiếp +${Math.round(bonus * 100)}%`, `Tribulation survival chance +${Math.round(bonus * 100)}%`) : tr(`Tỉ lệ vượt kiếp ${Math.round(bonus * 100)}%`, `Tribulation survival chance ${Math.round(bonus * 100)}%`)}</p>
            <button className="btn btn-red btn-big" onClick={() => onDone(bonus, blocked)}>
              
              {tr("Xem kết quả", "See the result")}
            </button>
          </div>
        )}
      </div>

      {c && (
        <div className={`kiep-hero ${phase === 'hit' ? 'hurt' : phase === 'block' ? 'guard' : ''}`} aria-hidden="true">
          <Sprite c={c} size={96} />
        </div>
      )}

      {phase !== 'done' && (
        <button
          className="kiep-skip"
          onPointerDown={(e) => {
            e.stopPropagation();
            clear();
            onDone(0, -1);
          }}
        >
          
          {tr("Phó mặc số trời", "Leave it to fate")}
        </button>
      )}
    </div>
  );
}

/* ================= Thẻ chia sẻ kết cục ================= */
function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, maxLines = 4): number {
  const words = text.split(' ');
  let line = '';
  let lines = 0;
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) {
      ctx.fillText(line, x, y);
      y += lh;
      line = w;
      if (++lines >= maxLines - 1) {
        line = words.slice(words.indexOf(w)).join(' ');
        if (ctx.measureText(line).width > maxW) {
          while (ctx.measureText(line + '...').width > maxW) line = line.slice(0, -1);
          line += '...';
        }
        break;
      }
    } else line = t;
  }
  ctx.fillText(line, x, y);
  return y + lh;
}

/** Thẻ Một đời: xếp loại, phần trăm vượt giang hồ, khoe bằng link có hình nhân vật hoặc chép chữ */
export function ShareCard({ c, ending, epitaph, isNew = false }: { c: Character; ending: Ending; epitaph: string; isNew?: boolean }) {
  const [pct, setPct] = useState<number | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [sheet, setSheet] = useState<ShareOut | null>(null);
  const { grade } = gradeOf(c, ending, isNew);
  const urlRef = useRef<string | null>(null);
  urlRef.current = url;
  useEffect(() => () => void (urlRef.current && URL.revokeObjectURL(urlRef.current)), []);
  useEffect(() => {
    let live = true;
    rankPct(c).then((p) => live && setPct(p));
    return () => {
      live = false;
    };
  }, [c]);
  useEffect(() => {
    let live = true;
    drawLife(c, ending, isNew, epitaph, pct).then((cv) => {
      if (!live || !cv) return;
      cv.toBlob((b) => {
        if (!b || !live) return;
        setUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return URL.createObjectURL(b);
        });
      }, 'image/png');
    });
    return () => {
      live = false;
    };
  }, [c, ending, isNew, epitaph, pct]);
  async function share() {
    setBusy(true);
    setMsg(null);
    track('share', { kind: 'life', grade });
    const r = await shareLife(c, ending, isNew, epitaph, pct);
    setBusy(false);
    if (r?.link) setSheet(r);
    else setMsg(r?.saved ? tr('Chưa tạo được link, đã tải ảnh về máy.', "Couldn't create a link; the image was saved to your device.") : tr('Chưa khoe được, thử lại sau.', "Couldn't share, try again later."));
  }
  return (
    <div className="share-card life-card">
      <div className="lc-head">
        <b className={`lc-grade g-${grade}`} style={{ background: GRADE_COL[grade] }}>
          {grade}
        </b>
        <span>
          <small>{tr("Xếp loại đời này", "This life's grade")}</small>
          <b>{pct !== null ? tr(`Vượt ${pct}% giang hồ`, `Beat ${pct}% of the jianghu`) : '...'}</b>
        </span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt={tr(`Thẻ Một đời của ${c.name}`, `${c.name}'s Life Card`)} className="share-preview" />}
      <button className="btn btn-jade btn-big lc-share" onClick={share} disabled={busy}>
        {busy ? tr('Đang tạo link...', "Creating link...") : tr('Khoe đời này', "Show off this life")}
        <small>Threads · Facebook · Messenger · Zalo</small>
      </button>
      {msg && <small className="note">{msg}</small>}
      {sheet && <ShareSheet out={sheet} kind="life" onClose={() => setSheet(null)} />}
    </div>
  );
}

/* ================= Hướng dẫn lần đầu: khoét sáng từng vùng ================= */
const TUT_STEPS: { sel: string; title: string; text: string }[] = [
  { sel: '.stage', title: tr('Đây là bạn', "This is you"), text: tr('Thời gian tự trôi. Thanh vàng phía trên chạy hết là bạn thêm 1 tuổi.', "Time flows on its own. When the gold bar at the top fills, you're 1 year older.") },
  { sel: '.focus-grid', title: tr('Năm nay làm gì?', "What to do this year?"), text: tr('Chạm để chọn việc. Tu luyện để lên cảnh giới, Kiếm tiền để mua đồ, Trừ yêu để đánh quái. Làm một việc quá lâu sẽ bị quá độ, nhớ đổi việc.', "Tap to pick an activity. Cultivate to climb realms, Earn money to buy gear, Hunt demons to fight monsters. Doing one thing too long leads to burnout, so switch it up.") },
  { sel: '.speeds', title: tr('Nhanh hay chậm', "Fast or slow"), text: tr('Tua 2× đến 16×. Nút ❚❚ để dừng, nút » để nhảy tới chuyện kế tiếp.', "Speed up from 2× to 16×. ❚❚ pauses, » skips to the next event.") },
  { sel: '.strip-btn', title: tr('Chỉ số của bạn', "Your stats"), text: tr('Chạm vào tên để xem chỉ số. Sức khỏe về 0 hoặc tâm ma lên 100 là chết.', "Tap your name to see your stats. Health at 0 or heart demon at 100 means death.") },
  { sel: '.dock-actions', title: tr('Mua đồ, bế quan', "Shopping, seclusion"), text: tr('Phường thị bán áo, vũ khí, đan dược. Túi đồ để mặc đồ. Bế quan để tu nhanh nhưng xuất quan sẽ có mất mát.', "The Market sells robes, weapons and pills. Use the Inventory to equip gear. Seclusion speeds up cultivation, but leaving it comes at a cost.") },
  { sel: '.game-scroll', title: tr('Sắp có chuyện xảy ra', "Something is about to happen"), text: tr('Khi gặp chuyện, game tự dừng và hiện 4 cách xử lý. Đọc kỹ, có cách khiến bạn chết. Chúc đạo hữu sống lâu!', "When an event happens, the game pauses and shows 4 ways to respond. Read carefully - some of them get you killed. May you live long, fellow Daoist!") },
];

export function Tutorial({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = TUT_STEPS[i];
  useEffect(() => {
    const el = document.querySelector(step.sel);
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ block: 'nearest' });
    const update = () => setRect(el.getBoundingClientRect());
    update();
    window.addEventListener('resize', update);
    const t = setTimeout(update, 250);
    return () => {
      window.removeEventListener('resize', update);
      clearTimeout(t);
    };
  }, [step.sel]);
  const last = i === TUT_STEPS.length - 1;
  const below = rect ? rect.top + rect.height / 2 < window.innerHeight / 2 : true;
  return (
    <div className="tut" role="dialog" aria-modal="true" aria-label={tr(`Hướng dẫn: ${step.title}`, `Tutorial: ${step.title}`)}>
      {rect ? <div className="tut-hole" style={{ left: rect.left - 4, top: rect.top - 4, width: rect.width + 8, height: rect.height + 8 }} /> : <div className="tut-dim" />}
      <div
        className="tut-card"
        style={rect ? (below ? { top: Math.min(window.innerHeight - 200, rect.bottom + 12) } : { bottom: Math.min(window.innerHeight - 200, window.innerHeight - rect.top + 12) }) : { top: '35%' }}
      >
        <small>
          {i + 1}/{TUT_STEPS.length}
        </small>
        <b>{step.title}</b>
        <p>{step.text}</p>
        <div className="tut-btns">
          <button className="btn" onClick={onDone}>
            
            {tr("Bỏ qua", "Skip")}
          </button>
          <button className="btn btn-red" onClick={() => (last ? onDone() : setI(i + 1))}>
            {last ? tr('Bắt đầu!', "Start!") : tr('Tiếp', "Next")}
          </button>
        </div>
      </div>
    </div>
  );
}
