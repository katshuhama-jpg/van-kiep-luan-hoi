'use client';

import { useEffect, useRef, useState } from 'react';
import Sprite from './Sprite';
import Radar, { charAxes, wealthScore } from './Radar';
import { GIFTS, RARE_NAME, applyGifts, drawGifts, giftOf } from '@/lib/game/gacha';
import { RARE_COLOR, type Ending } from '@/lib/game/endings';
import { FAMILY_TIERS, PATHS, realmLabel } from '@/lib/game/data';
import { rollBase } from '@/lib/game/engine';
import type { Character } from '@/lib/game/types';

/* ================= Gieo quẻ: lá số nhân vật + thiên phú ================= */
export function GachaPanel({ phuc, onChange, onBorn, busy }: { phuc: number; onChange: (gifts: string[], spent: number, base: Character | null) => void; onBorn: () => void; busy?: boolean }) {
  const [cards, setCards] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [rolls, setRolls] = useState(0);
  const [flip, setFlip] = useState(0);
  const [base, setBase] = useState<Character | null>(null);
  const [showRadar, setShowRadar] = useState(false);
  // lần gieo đầu tiên và lần gieo lại kế tiếp miễn phí
  const cost = rolls < 2 ? 0 : 5;
  const spent = Math.max(0, rolls - 2) * 5;
  const roll = () => {
    const next = drawGifts(5);
    const b = rollBase();
    setCards(next);
    setPicked([]);
    setBase(b);
    setRolls((r) => r + 1);
    setFlip((f) => f + 1);
    onChange([], Math.max(0, rolls + 1 - 2) * 5, b);
  };
  // vào màn là trời đã gieo sẵn một lá số
  useEffect(() => {
    if (rolls === 0) roll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const toggle = (id: string) => {
    const on = picked.includes(id);
    const next = on ? picked.filter((x) => x !== id) : picked.length >= 2 ? [picked[1], id] : [...picked, id];
    setPicked(next);
    onChange(next, spent, base);
  };
  const best = cards.reduce((m, id) => Math.max(m, giftOf(id)?.rare ?? 0), 0);
  return (
    <>
      <section className="panel">
        <h2>Lá số kiếp này</h2>
        {base && <BirthCard key={'b' + flip} c={base} />}
        {base && (
          <button className="link-btn" onClick={() => setShowRadar(!showRadar)} aria-expanded={showRadar}>
            {showRadar ? 'Ẩn biểu đồ chỉ số' : 'Xem biểu đồ chỉ số'}
          </button>
        )}
        {base && showRadar && <GiftRadar base={base} picked={picked} />}
      </section>
      {cards.length > 0 && (
        <section className="panel">
          <h2>Chọn thiên phú</h2>
          <p className="note" style={{ marginTop: 0 }}>Không bắt buộc. Chọn tối đa 2 lá. Lá ghi &quot;có họa&quot; vừa có lợi vừa có hại.</p>
          <div className={`gacha-row ${best >= 3 ? 'gold' : ''}`} key={flip}>
            {cards.map((id, i) => {
              const g = giftOf(id)!;
              const on = picked.includes(id);
              return (
                <button key={id} className={`gacha-card r${g.rare} ${on ? 'on' : ''}`} style={{ animationDelay: `${0.3 + i * 0.12}s`, ['--rc' as string]: RARE_COLOR[g.rare] }} onClick={() => toggle(id)} aria-pressed={on}>
                  <span className="gc-rare">{RARE_NAME[g.rare]}</span>
                  <b>{g.name}</b>
                  <small>{g.desc}</small>
                  {g.bad && <span className="gc-bad">có họa</span>}
                  {on && <span className="gc-check">✓ Đã chọn</span>}
                </button>
              );
            })}
          </div>
        </section>
      )}
      <div className="birth-bar">
        <button className="btn" onClick={roll} disabled={cost > 0 && phuc < cost}>
          Gieo lại
          <small>{cost ? `-${cost} phúc` : 'miễn phí'}</small>
        </button>
        <button className="btn btn-red btn-big" onClick={onBorn} disabled={busy || !base}>
          Đầu thai ▶
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
        <small>{c.gender === 'nam' ? 'Nam' : 'Nữ'} · lớn lên sẽ thế này</small>
      </div>
      <div className="bc-info">
        <b className="bc-title">{c.name}</b>
        <ul>
          <li>{c.origin}</li>
          <li>{c.birthPlace}</li>
          <li>
            Gia cảnh <b>{fam?.name}</b> · {c.linhThach} linh thạch
          </li>
          <li>
            <b>{c.linhCan}</b>
          </li>
          <li>
            Tướng số: {c.fateName} · thọ khoảng {c.lifespan}
          </li>
        </ul>
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
        {picked.length ? 'Vùng đỏ: chỉ số sau khi nhận thiên phú. Vùng xám: lá số gốc.' : 'Chỉ số của lá số này. Chọn thiên phú để xem thay đổi.'}
        {after.linhCanMul !== base.linhCanMul ? ` Tu luyện x${after.linhCanMul.toFixed(1)}.` : ''}
      </p>
    </div>
  );
}

/* ================= Mini-game thiên kiếp: chạm đúng lúc để đỡ lôi ================= */
type KPhase = 'intro' | 'calm' | 'warn' | 'hit' | 'block' | 'done';
export function TribulationOverlay({ realmName, onDone }: { realmName: string; onDone: (bonus: number, blocked: number) => void }) {
  const TOTAL = 9;
  const [phase, setPhase] = useState<KPhase>('intro');
  const [i, setI] = useState(0);
  const [blocked, setBlocked] = useState(0);
  const [win, setWin] = useState(700);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const st = useRef({ phase: 'intro' as KPhase, i: 0, blocked: 0 });
  st.current = { phase, i, blocked };

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  useEffect(() => clear, []);

  const nextBolt = (idx: number) => {
    if (idx >= TOTAL) {
      setPhase('done');
      return;
    }
    setI(idx);
    setPhase('calm');
    const w = Math.round(800 - idx * 40);
    setWin(w);
    timer.current = setTimeout(() => {
      setPhase('warn');
      timer.current = setTimeout(() => {
        setPhase('hit');
        try {
          navigator.vibrate?.(120);
        } catch {}
        timer.current = setTimeout(() => nextBolt(idx + 1), 550);
      }, w);
    }, 500 + Math.random() * 1100);
  };

  const tap = () => {
    const s = st.current;
    if (s.phase === 'intro') return nextBolt(0);
    if (s.phase === 'warn') {
      clear();
      setBlocked(s.blocked + 1);
      setPhase('block');
      timer.current = setTimeout(() => nextBolt(s.i + 1), 450);
    } else if (s.phase === 'calm') {
      // hấp tấp: lôi đánh ngay
      clear();
      setPhase('hit');
      timer.current = setTimeout(() => nextBolt(s.i + 1), 550);
    }
  };

  const bonus = Math.round(((blocked - 4.5) / TOTAL) * 0.4 * 100) / 100;
  return (
    <div className={`kiep kiep-${phase}`} role="dialog" aria-label="Thiên kiếp" onPointerDown={phase === 'done' ? undefined : tap}>
      <div className="kiep-sky" aria-hidden="true">
        <span className="cloud c1" />
        <span className="cloud c2" />
        <span className="cloud c3" />
      </div>
      {(phase === 'hit' || phase === 'block') && (
        <svg className="kiep-bolt" viewBox="0 0 20 100" aria-hidden="true">
          <polyline points="12,0 5,38 13,40 4,100" fill="none" stroke={phase === 'block' ? '#9ff0c8' : '#fff6a8'} strokeWidth="4" />
        </svg>
      )}
      <div className="kiep-hud">
        <b>
          Lôi kiếp {realmName} · Đạo {Math.min(TOTAL, i + 1)}/{TOTAL}
        </b>
        <span>Đã đỡ: {blocked}</span>
      </div>
      <div className="kiep-center">
        {phase === 'intro' && (
          <>
            <p className="kiep-big">CHÍN ĐẠO LÔI KIẾP</p>
            <p>Khi vòng sáng hiện lên, chạm thật nhanh để vận công đỡ sấm. Chạm sớm là ăn trọn một đạo.</p>
            <p className="kiep-tap">Chạm để bắt đầu</p>
          </>
        )}
        {phase === 'calm' && <p className="kiep-mid">Chờ...</p>}
        {phase === 'warn' && (
          <div className="kiep-ring" style={{ animationDuration: `${win}ms` }}>
            <span>ĐỠ!</span>
          </div>
        )}
        {phase === 'block' && <p className="kiep-mid ok">Đỡ được!</p>}
        {phase === 'hit' && <p className="kiep-mid bad">Trúng sấm!</p>}
        {phase === 'done' && (
          <>
            <p className="kiep-big">
              Đỡ được {blocked}/{TOTAL} đạo
            </p>
            <p>{bonus >= 0 ? `Tỉ lệ vượt kiếp +${Math.round(bonus * 100)}%` : `Tỉ lệ vượt kiếp ${Math.round(bonus * 100)}%`}</p>
            <button className="btn btn-red btn-big" onClick={() => onDone(bonus, blocked)}>
              Xem kết quả
            </button>
          </>
        )}
      </div>
      {phase !== 'done' && (
        <button
          className="kiep-skip"
          onPointerDown={(e) => {
            e.stopPropagation();
            clear();
            onDone(0, -1);
          }}
        >
          Phó mặc số trời
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

async function svgToImage(svg: SVGSVGElement, size: number): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.querySelectorAll('.aura, .halo').forEach((n) => n.remove());
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(size));
  clone.setAttribute('height', String(size));
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

export async function makeCard(c: Character, ending: Ending, epitaph: string, svg: SVGSVGElement | null): Promise<Blob | null> {
  const W = 600;
  const H = 860;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const x = cv.getContext('2d');
  if (!x) return null;
  try {
    await document.fonts.load('40px VT323');
  } catch {}
  x.imageSmoothingEnabled = false;
  // nền giấy da + viền pixel
  x.fillStyle = '#2a2018';
  x.fillRect(0, 0, W, H);
  x.fillStyle = '#f3e6c4';
  x.fillRect(12, 12, W - 24, H - 24);
  x.fillStyle = '#e4d2a6';
  for (let i = 0; i < 60; i++) x.fillRect(12 + ((i * 97) % (W - 40)), 12 + ((i * 53) % (H - 40)), 4, 4);
  x.strokeStyle = '#3e3228';
  x.lineWidth = 4;
  x.strokeRect(24, 24, W - 48, H - 48);
  const font = (px: number) => `${px}px VT323, monospace`;
  x.textAlign = 'center';
  x.fillStyle = '#9a2a1e';
  x.font = font(44);
  x.fillText('VẠN KIẾP LUÂN HỒI', W / 2, 78);
  x.fillStyle = '#6a5a44';
  x.font = font(24);
  x.fillText(`Kiếp thứ ${c.lifeNo}`, W / 2, 106);
  // khung nhân vật
  x.fillStyle = ending.rare >= 3 ? '#2a1f3d' : '#d8c79a';
  x.fillRect(W / 2 - 130, 126, 260, 260);
  if (ending.rare >= 3) {
    x.fillStyle = RARE_COLOR[ending.rare];
    for (let k = 0; k < 16; k++) x.fillRect(W / 2 - 130 + ((k * 61) % 250), 130 + ((k * 37) % 250), 4, 4);
  }
  x.strokeStyle = RARE_COLOR[ending.rare];
  x.lineWidth = 6;
  x.strokeRect(W / 2 - 130, 126, 260, 260);
  if (svg) {
    try {
      const img = await svgToImage(svg, 240);
      x.drawImage(img, W / 2 - 120, 136, 240, 240);
    } catch {}
  }
  x.fillStyle = '#2a2018';
  x.font = font(52);
  x.fillText(c.name, W / 2, 440);
  x.font = font(26);
  x.fillStyle = '#4a3a2a';
  x.fillText(`${Math.floor(c.age)} tuổi · ${c.realm === 0 ? 'Phàm nhân' : realmLabel(c.realm, c.layer)}${c.path ? ' · ' + PATHS[c.path].name : ''}`, W / 2, 474);
  // kết cục
  x.fillStyle = RARE_COLOR[ending.rare];
  x.fillRect(60, 500, W - 120, 64);
  x.fillStyle = '#fff8e6';
  x.font = font(22);
  x.fillText(`KẾT CỤC · ${['PHÀM', 'LINH', 'HUYỀN', 'ĐỊA', 'THIÊN'][ending.rare]} PHẨM`, W / 2, 522);
  x.font = font(36);
  x.fillText(ending.name, W / 2, 554);
  x.fillStyle = '#3e3228';
  x.font = font(24);
  let y = wrap(x, c.cause ?? ending.desc, W / 2, 604, W - 120, 28, 4);
  if (epitaph) {
    x.fillStyle = '#9a2a1e';
    x.font = font(28);
    wrap(x, `"${epitaph}"`, W / 2, y + 10, W - 120, 30, 2);
  }
  x.fillStyle = '#6a5a44';
  x.font = font(22);
  x.fillText('van-kiep-luan-hoi.vercel.app', W / 2, H - 44);
  return new Promise((res) => cv.toBlob((b) => res(b), 'image/png'));
}

export function ShareCard({ c, ending, epitaph }: { c: Character; ending: Ending; epitaph: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const build = async () => {
    setBusy(true);
    const svg = ref.current?.querySelector('svg') ?? null;
    const b = await makeCard(c, ending, epitaph, svg as SVGSVGElement | null);
    setBusy(false);
    if (!b) return;
    setBlob(b);
    setUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(b);
    });
  };
  const share = async () => {
    if (!blob) return;
    const file = new File([blob], `van-kiep-${c.name.replace(/\s+/g, '-')}.png`, { type: 'image/png' });
    const text = `${c.name} - ${ending.name}. Kiếp này của tôi ở Vạn Kiếp Luân Hồi!`;
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Vạn Kiếp Luân Hồi', text });
        return;
      }
    } catch {
      return;
    }
    const a = document.createElement('a');
    a.href = url!;
    a.download = file.name;
    a.click();
  };
  return (
    <div className="share-card">
      <div ref={ref} style={{ position: 'absolute', left: -9999, top: 0 }} aria-hidden="true">
        <Sprite c={{ ...c, dead: false }} size={240} />
      </div>
      {url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`Thẻ kết cục của ${c.name}`} className="share-preview" />
          <div className="choice-row">
            <button className="btn btn-jade" onClick={share}>
              Chia sẻ / Lưu ảnh
            </button>
            <button className="btn" onClick={build} disabled={busy}>
              Làm lại thẻ
            </button>
          </div>
        </>
      ) : (
        <button className="btn btn-jade" style={{ width: '100%' }} onClick={build} disabled={busy}>
          {busy ? 'Đang vẽ...' : 'Tạo thẻ khoe kết cục'}
        </button>
      )}
    </div>
  );
}

/* ================= Hướng dẫn lần đầu: khoét sáng từng vùng ================= */
const TUT_STEPS: { sel: string; title: string; text: string }[] = [
  { sel: '.stage', title: 'Đây là bạn', text: 'Thời gian tự trôi. Thanh vàng phía trên chạy hết là bạn thêm 1 tuổi.' },
  { sel: '.focus-grid', title: 'Năm nay làm gì?', text: 'Chạm để chọn việc. Tu luyện để lên cảnh giới, Kiếm tiền để mua đồ, Trừ yêu để đánh quái. Làm một việc quá lâu sẽ bị quá độ, nhớ đổi việc.' },
  { sel: '.speeds', title: 'Nhanh hay chậm', text: 'Tua 2× đến 16×. Nút ❚❚ để dừng, nút » để nhảy tới chuyện kế tiếp.' },
  { sel: '.strip-btn', title: 'Chỉ số của bạn', text: 'Chạm vào tên để xem chỉ số. Sức khỏe về 0 hoặc tâm ma lên 100 là chết.' },
  { sel: '.dock-actions', title: 'Mua đồ, bế quan', text: 'Phường thị bán áo, vũ khí, đan dược. Túi đồ để mặc đồ. Bế quan để tu nhanh nhưng xuất quan sẽ có mất mát.' },
  { sel: '.game-scroll', title: 'Sắp có chuyện xảy ra', text: 'Khi gặp chuyện, game tự dừng và hiện 4 cách xử lý. Đọc kỹ, có cách khiến bạn chết. Chúc đạo hữu sống lâu!' },
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
    <div className="tut" role="dialog" aria-modal="true" aria-label={`Hướng dẫn: ${step.title}`}>
      {rect ? <div className="tut-hole" style={{ left: rect.left - 4, top: rect.top - 4, width: rect.width + 8, height: rect.height + 8 }} /> : <div className="tut-dim" />}
      <div className="tut-card" style={rect ? (below ? { top: Math.min(window.innerHeight - 200, rect.bottom + 12) } : { bottom: Math.min(window.innerHeight - 200, window.innerHeight - rect.top + 12) }) : { top: '35%' }}>
        <small>
          {i + 1}/{TUT_STEPS.length}
        </small>
        <b>{step.title}</b>
        <p>{step.text}</p>
        <div className="tut-btns">
          <button className="btn" onClick={onDone}>
            Bỏ qua
          </button>
          <button className="btn btn-red" onClick={() => (last ? onDone() : setI(i + 1))}>
            {last ? 'Bắt đầu!' : 'Tiếp'}
          </button>
        </div>
      </div>
    </div>
  );
}
