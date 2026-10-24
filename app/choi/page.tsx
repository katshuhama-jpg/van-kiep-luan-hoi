'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Scene from '@/components/Scene';
import { BagSheet, BeQuanSheet, BirthPanel, DeathSheet, EventCard, FocusGrid, LogPanel, SEASONS, ShopSheet, Sheet, StageStrip } from '@/components/Panels';
import { signOut } from '@/lib/auth';
import { ITEMS, PATHS, PILLS, TALENTS, realmLabel } from '@/lib/game/data';
import { closedDoor, karmaOf, makeCtx, newCharacter, resolveChoice, seasonOf, usePillNow, yearTick } from '@/lib/game/engine';
import { addPill, fmt, giveItem, money } from '@/lib/game/helpers';
import type { Character, Focus, Fx, Meta, PendingEvent } from '@/lib/game/types';
import { addMemorial, displayName, loadAll, saveLocal, saveMeta, saveRemote, type SaveState } from '@/lib/storage';
import { useAuth } from '@/lib/useAuth';

const SPEEDS = [1, 2, 4, 8, 16];
type SheetName = null | 'shop' | 'bag' | 'bequan' | 'menu';

export default function PlayPage() {
  const { user, ready } = useAuth();
  const [phase, setPhase] = useState<'loading' | 'birth' | 'play'>('loading');
  const [meta, setMeta] = useState<Meta | null>(null);
  const [, setFrame] = useState(0);
  const [fx, setFx] = useState<Fx[]>([]);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(true);

  const charRef = useRef<Character | null>(null);
  const pendingRef = useRef<PendingEvent | null>(null);
  const yearSecRef = useRef(30);
  const talentsRef = useRef<string[]>([]);
  const lastRemote = useRef(0);
  const userRef = useRef(user);
  userRef.current = user;

  const rerender = useCallback(() => setFrame((f) => f + 1), []);

  const pushFx = useCallback((list: Fx[]) => {
    if (!list.length) return;
    setFx((prev) => [...prev, ...list].slice(-4));
    const ids = list.map((f) => f.id);
    setTimeout(() => setFx((prev) => prev.filter((f) => !ids.includes(f.id))), list.some((f) => f.kind === 'death') ? 3500 : 1900);
  }, []);

  const snapshot = useCallback((): SaveState | null => {
    const c = charRef.current;
    if (!c) return null;
    return { v: 1, char: c, pending: pendingRef.current, yearSec: yearSecRef.current, talents: talentsRef.current };
  }, []);

  const persist = useCallback(
    (forceRemote = false) => {
      const s = snapshot();
      if (!s) return;
      saveLocal(userRef.current, s);
      const now = Date.now();
      if (forceRemote || now - lastRemote.current > 15000) {
        lastRemote.current = now;
        saveRemote(userRef.current, s).catch(() => {});
      }
    },
    [snapshot],
  );

  // Tải dữ liệu khi biết đã đăng nhập hay chưa
  useEffect(() => {
    if (!ready) return;
    let cancel = false;
    (async () => {
      const { meta: m, save } = await loadAll(user);
      if (cancel) return;
      setMeta(m);
      if (save?.char && !save.char.dead) {
        charRef.current = save.char;
        pendingRef.current = save.pending;
        yearSecRef.current = save.yearSec || 30;
        talentsRef.current = save.talents ?? [];
        setPhase('play');
      } else setPhase('birth');
    })();
    return () => {
      cancel = true;
    };
  }, [ready, user?.token]);

  // Vòng lặp thời gian
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const activeRef = useRef(false);
  activeRef.current = running && sheet === null && phase === 'play';

  useEffect(() => {
    if (phase !== 'play') return;
    let raf = 0;
    let last = performance.now();
    let lastDraw = 0;
    const step = (t: number) => {
      const dt = Math.min(0.25, (t - last) / 1000);
      last = t;
      const c = charRef.current;
      if (c && activeRef.current && !pendingRef.current && !c.dead) {
        const before = Math.floor(c.age);
        c.age += (dt / yearSecRef.current) * speedRef.current;
        const after = Math.floor(c.age);
        if (after > before) {
          const frac = c.age - after;
          const out: Fx[] = [];
          const ctx = makeCtx(c, out);
          let stopped = false;
          for (let y = before + 1; y <= after; y++) {
            c.age = y;
            const p = yearTick(c, ctx, { talents: talentsRef.current });
            if (p || c.dead) {
              pendingRef.current = p;
              stopped = true;
              break;
            }
          }
          if (!stopped) c.age = after + frac;
          pushFx(out);
          persist(stopped);
          rerender();
        } else if (t - lastDraw > 120) {
          lastDraw = t;
          rerender();
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const onHide = () => {
      if (document.visibilityState === 'hidden') persist(true);
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [phase, persist, pushFx, rerender]);

  // --------- Hành động ---------
  const act = useCallback(
    (fn: (c: Character, out: Fx[]) => void) => {
      const c = charRef.current;
      if (!c) return;
      const out: Fx[] = [];
      fn(c, out);
      pushFx(out);
      persist(true);
      rerender();
    },
    [persist, pushFx, rerender],
  );

  const choose = (i: number) =>
    act((c, out) => {
      const p = pendingRef.current;
      if (!p) return;
      pendingRef.current = null;
      pendingRef.current = resolveChoice(c, p, i, makeCtx(c, out), talentsRef.current);
    });

  const skipAhead = () =>
    act((c, out) => {
      const ctx = makeCtx(c, out);
      for (let i = 0; i < 40 && !c.dead; i++) {
        c.age = Math.floor(c.age) + 1;
        const p = yearTick(c, ctx, { talents: talentsRef.current });
        if (p) {
          pendingRef.current = p;
          break;
        }
      }
      setRunning(true);
    });

  const pickFocus = (f: Focus) => act((c) => (c.focus = f));

  const buyItem = (id: string) =>
    act((c, out) => {
      const it = ITEMS.find((x) => x.id === id);
      if (!it || c.linhThach < it.price) return;
      money(c, -it.price);
      giveItem(c, id, true);
      out.push({ kind: 'buy', id: Math.random(), label: it.name });
      c.log.push({ age: Math.floor(c.age), tone: 'good', text: `Mua ${it.name} ở phường thị. (-${fmt(it.price)} linh thạch)` });
    });

  const buyPill = (id: string) =>
    act((c, out) => {
      const p = PILLS.find((x) => x.id === id);
      if (!p || c.linhThach < p.price) return;
      money(c, -p.price);
      addPill(c, id);
      out.push({ kind: 'coin', id: Math.random(), label: `+1 ${p.name}` });
    });

  const equip = (id: string) =>
    act((c, out) => {
      const it = ITEMS.find((x) => x.id === id);
      if (!it) return;
      c.equipped[it.slot] = c.equipped[it.slot] === id && it.slot !== 'ao' ? undefined : id;
      out.push({ kind: 'buy', id: Math.random(), label: it.name });
    });

  const takePill = (id: string) =>
    act((c, out) => {
      const p = usePillNow(c, id, makeCtx(c, out), talentsRef.current);
      if (p) {
        pendingRef.current = p;
        setSheet(null);
      }
    });

  const beQuan = (years: number) => {
    setSheet(null);
    act((c, out) => {
      const { pending } = closedDoor(c, years, makeCtx(c, out), talentsRef.current);
      pendingRef.current = pending;
    });
  };

  const born = async (talents: string[], yearSec: number) => {
    if (!meta) return;
    const cost = talents.reduce((s, id) => s + (TALENTS.find((t) => t.id === id)?.cost ?? 0), 0);
    const m2: Meta = { ...meta, phucDuyen: meta.phucDuyen - cost, talents };
    const c = newCharacter(m2);
    talentsRef.current = talents;
    const m3: Meta = { ...m2, talents: [] };
    setMeta(m3);
    saveMeta(user, m3).catch(() => {});
    charRef.current = c;
    pendingRef.current = null;
    yearSecRef.current = yearSec;
    setSpeed(1);
    setRunning(true);
    setFx([]);
    setPhase('play');
    persist(true);
    window.scrollTo(0, 0);
  };

  const finishLife = async (epitaph: string) => {
    const c = charRef.current;
    if (!c || !meta) return;
    const k = karmaOf(c);
    await addMemorial(user, {
      player_name: displayName(user),
      char_name: c.name,
      life_no: c.lifeNo,
      age: Math.floor(c.age),
      realm: realmLabel(c.realm, c.layer),
      path: c.path ? PATHS[c.path].name : null,
      dao_tam: c.daoTam,
      cause: c.cause,
      epitaph: epitaph || null,
      ascended: c.ascended,
    }).catch(() => {});
    const m: Meta = {
      phucDuyen: meta.phucDuyen + k.phuc,
      nghiep: k.nghiep > 0 ? meta.nghiep + k.nghiep : Math.max(0, meta.nghiep - 5),
      lives: meta.lives + 1,
      talents: [],
      enemy: c.daoTam < -30 ? c.enemy : null,
    };
    setMeta(m);
    await saveMeta(user, m).catch(() => {});
    charRef.current = null;
    pendingRef.current = null;
    saveLocal(user, null);
    saveRemote(user, null).catch(() => {});
    setPhase('birth');
  };

  // --------- Giao diện ---------
  if (phase === 'loading' || !meta) {
    return (
      <main className="app title-screen">
        <p>Đang mở luân hồi đài...</p>
      </main>
    );
  }

  if (phase === 'birth') {
    return (
      <main className="app">
        <header className="topbar">
          <div className="topbar-row">
            <span className="age-big" style={{ fontSize: 28 }}>
              Luân hồi
            </span>
            <span className="meta">{user ? `Đạo hữu ${displayName(user)}` : 'Đang chơi chế độ khách'}</span>
            <Link href="/" className="icon-btn" style={{ textDecoration: 'none', display: 'grid', placeItems: 'center' }} aria-label="Về trang đầu">
              ‹
            </Link>
          </div>
        </header>
        {!user && (
          <p className="note" style={{ margin: 0 }}>
            Chế độ khách chỉ lưu trên máy này. <Link href="/dang-nhap">Đăng nhập</Link> để lưu và lập bia ở nghĩa trang chung.
          </p>
        )}
        <BirthPanel meta={meta} onBorn={born} />
      </main>
    );
  }

  const c = charRef.current!;
  const pending = pendingRef.current;
  const paused = !running || !!pending || sheet !== null || c.dead;
  const season = seasonOf(c.age);
  const yearPct = (c.age % 1) * 100;

  return (
    <main className={`game ${pending && !c.dead ? 'has-event' : ''}`}>
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big">{Math.floor(c.age)}</span>
          <span className="meta">
            tuổi · {SEASONS[season]} · Kiếp {c.lifeNo}
            <br />
            <b>{fmt(c.linhThach)}</b> linh thạch · 1 năm ≈ {Math.round(yearSecRef.current / speed)}s
          </span>
          <button className="icon-btn" onClick={() => setSheet('menu')} aria-label="Mở menu">
            ≡
          </button>
        </div>
        <div className="year-bar" aria-hidden="true">
          <div style={{ width: `${yearPct}%` }} />
        </div>
        <div className="speeds">
          <button className="play" onClick={() => setRunning(!running)} aria-label={running ? 'Tạm dừng' : 'Tiếp tục'} disabled={!!pending || c.dead}>
            {running ? '❚❚' : '▶'}
          </button>
          {SPEEDS.map((s) => (
            <button
              key={s}
              className={speed === s ? 'on' : ''}
              onClick={() => {
                setSpeed(s);
                setRunning(true);
              }}
              aria-pressed={speed === s}
            >
              {s}×
            </button>
          ))}
          <button className="next" onClick={skipAhead} disabled={!!pending || c.dead} aria-label="Tua tới sự kiện kế tiếp">
            »
          </button>
        </div>
      </header>

      <section className="stage">
        <Scene c={c} fx={fx} paused={paused} season={season} />
        <StageStrip c={c} compact={!!pending && !c.dead} />
      </section>

      <div className="game-scroll">
        <LogPanel log={c.log} />
      </div>

      <footer className="game-bottom">
        {pending && !c.dead ? (
          <EventCard p={pending} onChoose={choose} />
        ) : (
          <div className="dock-inner">
            <FocusGrid c={c} onPick={pickFocus} />
            <div className="dock-actions">
              <button className="btn btn-dark" onClick={() => setSheet('shop')} disabled={c.dead}>
                Phường thị
              </button>
              <button className="btn btn-dark" onClick={() => setSheet('bag')} disabled={c.dead}>
                Túi đồ
              </button>
              <button className="btn btn-jade" onClick={() => setSheet('bequan')} disabled={c.dead}>
                Bế quan
              </button>
            </div>
          </div>
        )}
      </footer>

      {sheet === 'shop' && <ShopSheet c={c} onBuyItem={buyItem} onBuyPill={buyPill} onClose={() => setSheet(null)} />}
      {sheet === 'bag' && <BagSheet c={c} onEquip={equip} onUsePill={takePill} onClose={() => setSheet(null)} />}
      {sheet === 'bequan' && <BeQuanSheet c={c} onGo={beQuan} onClose={() => setSheet(null)} />}
      {sheet === 'menu' && (
        <Sheet title="Menu" onClose={() => setSheet(null)}>
          <div className="menu">
            <Link className="btn" href="/" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
              Trang đầu
            </Link>
            <Link className="btn" href="/nghia-trang" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
              Nghĩa trang
            </Link>
            {user ? (
              <button
                className="btn"
                onClick={async () => {
                  persist(true);
                  await signOut();
                  setSheet(null);
                }}
              >
                Đăng xuất ({displayName(user)})
              </button>
            ) : (
              <Link className="btn btn-red" href="/dang-nhap" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                Đăng nhập để lưu lên mây
              </Link>
            )}
          </div>
        </Sheet>
      )}
      {c.dead && <DeathSheet c={c} karma={karmaOf(c)} onDone={finishLife} />}
    </main>
  );
}

