'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Scene from '@/components/Scene';
import MusicToggle from '@/components/MusicToggle';
import { TribulationOverlay, Tutorial } from '@/components/Extras';
import { BREAK_EVENT_ID } from '@/lib/game/events';
import { endingOf } from '@/lib/game/endings';
import { BagSheet, BeQuanSheet, BirthPanel, DeathSheet, EventCard, FocusGrid, HuntSheet, LogPanel, SEASONS, ShopSheet, Sheet, StageStrip, StatsPanel } from '@/components/Panels';
import Radar, { charAxes, wealthScore } from '@/components/Radar';
import { giftOf } from '@/lib/game/gacha';
import type { BattleView } from '@/components/Battle';
import { MONSTERS, chuongOf, effLv, fleeChance, hit, killExp, killReward, loseFight, monsterName, monsterStats, playerStats, tierOf, type Fighter } from '@/lib/game/combat';
import { signOut } from '@/lib/auth';
import { ITEMS, PATHS, PILLS, REALMS, TALENTS, gearFx, realmLabel } from '@/lib/game/data';
import { genName, checkProgress, closedDoor, karmaOf, makeCtx, newCharacter, resolveChoice, rnd, seasonOf, usePillNow, yearTick } from '@/lib/game/engine';
import { addPill, fmt, giveItem, money, wealthTier } from '@/lib/game/helpers';
import type { Character, Focus, Fx, Meta, PendingEvent } from '@/lib/game/types';
import { AMBUSH_INTRO, AMBUSH_PER_YEAR, AMBUSH_TURNS, ambushMonsterStats, finishAmbush, pickAmbush } from '@/lib/game/ambush';
import { addMemorial, displayName, fetchWorld, loadAll, saveLocal, saveMeta, saveRemote, type SaveState } from '@/lib/storage';
import { useAuth } from '@/lib/useAuth';

const SPEEDS = [1, 2, 4, 8, 16];
/** màu chưởng lực theo con đường tu luyện */
const qiColor = (c: Character) => (c.path ? PATHS[c.path].aura : c.daoTam <= -40 ? '#ff3448' : '#9ff0c8');
type SheetName = null | 'shop' | 'bag' | 'bequan' | 'menu' | 'hunt' | 'info';

type Battle = BattleView & { t: number; rest: number; ps: Fighter; ms: Fighter };

export default function PlayPage() {
  const { user, ready } = useAuth();
  const [phase, setPhase] = useState<'loading' | 'birth' | 'play'>('loading');
  const [meta, setMeta] = useState<Meta | null>(null);
  const [, setFrame] = useState(0);
  const [fx, setFx] = useState<Fx[]>([]);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(true);
  const [kiep, setKiep] = useState<number | null>(null); // lựa chọn đang chờ mini-game thiên kiếp
  const [tut, setTut] = useState(false); // hướng dẫn lần đầu

  const charRef = useRef<Character | null>(null);
  const pendingRef = useRef<PendingEvent | null>(null);
  const yearSecRef = useRef(30);
  const talentsRef = useRef<string[]>([]);
  const lastRemote = useRef(0);
  const userRef = useRef(user);
  userRef.current = user;
  const battleRef = useRef<Battle | null>(null);
  const ambushRef = useRef<(Battle & { sub: number }) | null>(null); // quái chặn đường

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
        if (!save.char.world) fetchWorld(user).then((w) => { if (charRef.current === save.char && w) save.char.world = w; }).catch(() => {});
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
  activeRef.current = running && sheet === null && phase === 'play' && kiep === null && !tut;

  /** Trận đánh tự động kiểu idle: mỗi lượt bạn đánh một đòn, quái đánh trả một đòn */
  function newFight(c: Character, mId: string, kills: number): Battle | null {
    const m = MONSTERS.find((x) => x.id === mId);
    if (!m) return null;
    const ps = playerStats(c);
    // boss: không thể gây sát thương, mỗi đòn của nó lấy khoảng 1/3 máu
    const ms = m.boss ? { hp: 1e9, atk: Math.round(ps.hp * 0.38 + ps.def * 0.5), def: 1e12 } : monsterStats(m, effLv(c, m));
    return { m, name: monsterName(c, m), lv: m.boss ? 99 : effLv(c, m), tier: m.boss ? 0 : tierOf(c, m), pHp: ps.hp, pMax: ps.hp, mHp: ms.hp, mMax: ms.hp, phase: 'fight', last: [], kills, t: 0, rest: 0, ps, ms };
  }

  function stepBattle(c: Character, dtGame: number): boolean {
    let b = battleRef.current;
    if (!b || b.m.id !== c.huntTarget) {
      b = newFight(c, c.huntTarget!, 0);
      battleRef.current = b;
      if (!b) return false;
    }
    const turn = yearSecRef.current * 0.015;
    b.t += dtGame;
    let changed = false;
    const push = (side: 'p' | 'm', dmg: number, crit: boolean, text?: string, skill?: string | null) => {
      b!.last = [...b!.last.slice(-4), { id: Math.random(), side, dmg, crit, text, skill: skill ?? undefined, qi: skill ? qiColor(c) : undefined }];
    };
    while (b.t >= turn) {
      b.t -= turn;
      changed = true;
      if (b.phase === 'rest') {
        b.rest -= 1;
        if (b.rest <= 0) {
          const nb = newFight(c, b.m.id, b.kills);
          if (!nb) return changed;
          battleRef.current = b = nb;
        }
        continue;
      }
      // bạn ra đòn
      const h1 = hit(b.ps.atk, b.ms.def, rnd, 0.15 + gearFx(c.equipped).crit / 100);
      b.mHp = Math.max(0, b.mHp - h1.dmg);
      push('p', h1.dmg, h1.crit, b.m.boss ? 'Vô hiệu' : undefined, chuongOf(c, rnd));
      if (b.mHp <= 0) {
        const out: Fx[] = [];
        const ctx = makeCtx(c, out);
        const exp = killExp(c, b.m);
        killReward(c, b.m, ctx).forEach((n) => ctx.log(n, 'good'));
        b.kills += 1;
        b.phase = 'rest';
        b.rest = 3;
        b.outcome = 'win';
        push('p', 0, false, `+${exp} tu vi`);
        const p = checkProgress(c, ctx, talentsRef.current);
        pushFx(out);
        if (p || c.dead) {
          pendingRef.current = p;
          persist(true);
          break;
        }
        persist();
        continue;
      }
      // quái đánh trả
      const h2 = hit(b.ms.atk, b.ps.def, rnd);
      b.pHp = Math.max(0, b.pHp - h2.dmg);
      push('m', h2.dmg, h2.crit);
      if (b.pHp <= 0) {
        const out: Fx[] = [];
        const ctx = makeCtx(c, out);
        const text = loseFight(c, b.m, ctx);
        ctx.log(text, c.dead ? 'big' : 'bad');
        b.phase = 'rest';
        b.rest = 8;
        b.outcome = 'lose';
        if (!c.dead) {
          c.focus = 'tu_luyen';
          ctx.log('Bạn về động phủ dưỡng thương, tạm gác việc trừ yêu.', 'normal');
        }
        pushFx(out);
        persist(true);
        break;
      }
      // tự rút lui khi máu thấp
      if (c.autoFlee !== false && b.pHp < b.pMax * 0.3) {
        if (rnd() < fleeChance(c, b.m)) {
          b.phase = 'rest';
          b.rest = 5;
          b.outcome = 'flee';
          push('m', 0, false, 'Rút lui!');
        }
      }
    }
    return changed;
  }

  /** Quái chặn đường: bắt buộc đánh, tối đa 3 hiệp, thời gian dừng trong lúc đánh */
  function startAmbush(c: Character) {
    const { m, tier } = pickAmbush(c, rnd);
    const ps = playerStats(c);
    const ms = ambushMonsterStats(c, m);
    ambushRef.current = {
      m,
      name: monsterName(c, m),
      lv: effLv(c, m),
      tier: tierOf(c, m),
      pHp: ps.hp,
      pMax: ps.hp,
      mHp: ms.hp,
      mMax: ms.hp,
      phase: 'fight',
      last: [{ id: Math.random(), side: 'm', dmg: 0, crit: false, text: 'Chặn đường!' }],
      kills: 0,
      t: -0.9, // khựng lại một nhịp cho người chơi kịp nhìn
      rest: 0,
      ps,
      ms,
      sub: 0,
      ambush: { turn: 0, max: AMBUSH_TURNS, kind: tier },
    };
    c.log.push({ age: Math.floor(c.age), tone: 'bad', text: `${AMBUSH_INTRO[tier]} (${monsterName(c, m)}, Lv${effLv(c, m)})` });
  }

  function stepAmbush(c: Character, dtReal: number): boolean {
    const b = ambushRef.current;
    if (!b) return false;
    const half = 0.6; // mỗi đòn 0,6 giây thật, không phụ thuộc tốc độ
    b.t += dtReal;
    let changed = false;
    const push = (side: 'p' | 'm', dmg: number, crit: boolean, text?: string, skill?: string | null) => {
      b.last = [...b.last.slice(-4), { id: Math.random(), side, dmg, crit, text, skill: skill ?? undefined, qi: skill ? qiColor(c) : undefined }];
    };
    const end = (result: 'win' | 'lose' | 'draw') => {
      const out: Fx[] = [];
      const ctx = makeCtx(c, out);
      const notes = finishAmbush(c, b.m, result, 1 - b.pHp / b.pMax, 1 - b.mHp / b.mMax, ctx);
      notes.forEach((n, i) => ctx.log(n, c.dead ? 'big' : i === 0 ? (result === 'win' ? 'good' : 'bad') : 'good'));
      b.phase = 'rest';
      b.rest = 3;
      b.outcome = result === 'win' ? 'win' : result === 'lose' ? 'lose' : 'flee';
      if (result === 'draw') push('m', 0, false, 'Hết 3 hiệp');
      if (!c.dead) {
        const p = checkProgress(c, ctx, talentsRef.current);
        if (p) pendingRef.current = p;
      }
      pushFx(out);
      persist(true);
    };
    while (b.t >= half) {
      b.t -= half;
      changed = true;
      if (b.phase === 'rest') {
        b.rest -= 1;
        if (b.rest <= 0) {
          ambushRef.current = null;
          return true;
        }
        continue;
      }
      if (b.sub === 0) {
        b.ambush!.turn += 1;
        const h = hit(b.ps.atk, b.ms.def, rnd, 0.15 + gearFx(c.equipped).crit / 100);
        b.mHp = Math.max(0, b.mHp - h.dmg);
        push('p', h.dmg, h.crit, undefined, chuongOf(c, rnd));
        b.sub = 1;
        if (b.mHp <= 0) {
          end('win');
          break;
        }
      } else {
        const h = hit(b.ms.atk, b.ps.def, rnd);
        b.pHp = Math.max(0, b.pHp - h.dmg);
        push('m', h.dmg, h.crit);
        b.sub = 0;
        if (b.pHp <= 0) {
          end('lose');
          break;
        }
        if (b.ambush!.turn >= b.ambush!.max) {
          end('draw');
          break;
        }
      }
    }
    return changed;
  }

  useEffect(() => {
    if (phase !== 'play') return;
    let raf = 0;
    let last = performance.now();
    let lastDraw = 0;
    const step = (t: number) => {
      const dt = Math.min(0.25, (t - last) / 1000);
      last = t;
      const c = charRef.current;
      if (c && activeRef.current && ambushRef.current) {
        // đang bị quái chặn đường: thời gian đứng yên cho tới khi đánh xong
        if (stepAmbush(c, dt)) rerender();
        raf = requestAnimationFrame(step);
        return;
      }
      if (c && activeRef.current && !pendingRef.current && !c.dead && c.focus === 'tru_yeu' && c.age >= 10 && c.huntTarget) {
        if (stepBattle(c, dt * speedRef.current)) rerender();
      }
      if (c && activeRef.current && !pendingRef.current && !c.dead) {
        const dYear = (dt / yearSecRef.current) * speedRef.current;
        if (c.age >= 10 && c.focus !== 'tru_yeu' && rnd() < AMBUSH_PER_YEAR * dYear) {
          startAmbush(c);
          rerender();
          raf = requestAnimationFrame(step);
          return;
        }
        const before = Math.floor(c.age);
        c.age += dYear;
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

  const resolveNow = (i: number) =>
    act((c, out) => {
      const p = pendingRef.current;
      if (!p) return;
      pendingRef.current = null;
      pendingRef.current = resolveChoice(c, p, i, makeCtx(c, out), talentsRef.current);
    });

  const choose = (i: number) => {
    const p = pendingRef.current;
    const c = charRef.current;
    // đột phá có thiên kiếp: chơi mini-game đỡ sấm trước
    if (p && c && p.id === BREAK_EVENT_ID && c.realm + 1 >= 3 && !p.choices[i]?.label.startsWith('Củng cố')) {
      setKiep(i);
      return;
    }
    resolveNow(i);
  };

  const afterKiep = (bonus: number, blocked: number) => {
    const i = kiep;
    setKiep(null);
    const c = charRef.current;
    if (i === null || !c) return;
    c.kiepBonus = bonus;
    if (blocked >= 0) c.log.push({ age: Math.floor(c.age), tone: bonus >= 0 ? 'good' : 'bad', text: `Bạn vận công đỡ được ${blocked}/9 đạo thiên lôi.` });
    resolveNow(i);
  };

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

  const pickFocus = (f: Focus) => {
    if (f === 'tru_yeu') {
      setSheet('hunt');
      return;
    }
    act((c) => (c.focus = f));
  };

  const pickMonster = (id: string) => {
    battleRef.current = null;
    setSheet(null);
    act((c) => {
      c.huntTarget = id;
      c.focus = 'tru_yeu';
    });
  };

  const toggleFlee = (v: boolean) => act((c) => (c.autoFlee = v));

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

  const born = async (talents: string[], yearSec: number, gifts: string[] = [], gachaSpent = 0, base: Character | null = null) => {
    if (!meta) return;
    const cost = talents.reduce((s, id) => s + (TALENTS.find((t) => t.id === id)?.cost ?? 0), 0) + gachaSpent;
    const m2: Meta = { ...meta, phucDuyen: Math.max(0, meta.phucDuyen - cost), talents };
    if (base && !base.name.trim()) base = { ...base, name: genName(base.gender) };
    const c = newCharacter(m2, gifts, base ?? undefined);
    talentsRef.current = talents;
    // rương kiếp trước chỉ có một cơ hội tìm thấy
    const m3: Meta = { ...m2, talents: [], stash: null };
    // dấu vết người chơi khác: tải nền, không chặn việc đầu thai
    fetchWorld(user)
      .then((w) => {
        if (charRef.current === c && w) c.world = w;
      })
      .catch(() => {});
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
    try {
      if (!localStorage.getItem('vkl.tut')) setTut(true);
    } catch {}
  };

  const finishLife = async (epitaph: string, note = '', bury = false) => {
    const c = charRef.current;
    if (!c || !meta) return;
    const k = karmaOf(c);
    const ending = endingOf(c);
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
      realm_no: c.realm,
      layer_no: c.layer,
      wealth: Math.round(c.linhThach),
      look: {
        gender: c.gender,
        race: c.race,
        path: c.path,
        lifespan: c.lifespan,
        hairColor: c.hairColor,
        hairStyle: c.hairStyle,
        outfitTone: c.outfitTone,
        outfitCut: c.outfitCut,
        equipped: c.equipped,
        pet: c.pet,
        sect: c.sect,
      },
    }).catch(() => {});
    const m: Meta = {
      phucDuyen: meta.phucDuyen + k.phuc,
      nghiep: k.nghiep > 0 ? meta.nghiep + k.nghiep : Math.max(0, meta.nghiep - 5),
      lives: meta.lives + 1,
      talents: [],
      enemy: c.daoTam < -30 ? c.enemy : null,
      endings: { ...(meta.endings ?? {}), [ending.id]: (meta.endings?.[ending.id] ?? 0) + 1 },
      past: { name: c.name, lifeNo: c.lifeNo, age: Math.floor(c.age), realm: c.realm, realmName: c.realm === 0 ? 'Phàm nhân' : realmLabel(c.realm, c.layer), daoTam: c.daoTam, cause: c.cause, path: c.path ? PATHS[c.path].name : null, partner: c.partner },
      stash:
        bury && !c.ascended && c.endTag !== 'xuyen_khong'
          ? {
              from: c.name,
              lifeNo: c.lifeNo,
              money: Math.round(c.linhThach * 0.3),
              item: c.equipped.phu_kien ?? c.equipped.vu_khi ?? null,
              note,
              place: rnd() < 0.5 ? 'gốc đa đầu làng' : rnd() < 0.5 ? 'dưới nền ngôi miếu cũ' : 'bên bờ suối sau núi',
            }
          : null,
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
            {c.birthPlace ? ` · ${c.birthPlace.split(', ').pop()}` : ''}
            <br />
            <b>{fmt(c.linhThach)}</b> linh thạch · {wealthTier(c).name}
            {c.income ? ` · +${c.income}/năm` : ''}
          </span>
          <MusicToggle battle={!!ambushRef.current || (c.focus === 'tru_yeu' && c.age >= 10 && !!c.huntTarget && !c.dead)} />
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
        <Scene c={c} fx={fx} paused={paused} season={season} battle={ambushRef.current ?? (c.focus === 'tru_yeu' && c.age >= 10 && battleRef.current?.m.id === c.huntTarget ? battleRef.current : null)} />
        <button className="strip-btn" onClick={() => setSheet('info')} aria-label="Xem bảng chỉ số nhân vật">
          <StageStrip c={c} compact={!!pending && !c.dead} />
        </button>
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
      {sheet === 'info' && (
        <Sheet title={c.name} onClose={() => setSheet(null)}>
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <Radar axes={charAxes(c.stats, c.lifespan, wealthScore(c.linhThach, c.income))} size={250} color={c.daoTam <= -30 ? '#a8303a' : c.daoTam >= 30 ? '#3d6fb0' : '#2f6b5a'} />
          </div>
          <p className="note" style={{ textAlign: 'center', marginTop: 0 }}>
            {c.linhCan} · {c.origin} · {c.birthPlace}
            {c.gifts?.length ? ` · Thiên phú: ${c.gifts.map((g) => giftOf(g)?.name).join(', ')}` : ''}
          </p>
          <StatsPanel c={c} />
        </Sheet>
      )}
      {sheet === 'hunt' && <HuntSheet c={c} onPick={pickMonster} onToggleFlee={toggleFlee} onClose={() => setSheet(null)} />}
      {sheet === 'menu' && (
        <Sheet title="Menu" onClose={() => setSheet(null)}>
          <div className="menu">
            <Link className="btn" href="/" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
              Trang đầu
            </Link>
            <Link className="btn btn-red" href="/bang-xep-hang" onClick={() => persist(true)} style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
              Bảng xếp hạng
            </Link>
            <Link className="btn" href="/nghia-trang" onClick={() => persist(true)} style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
              Nghĩa trang
            </Link>
            <Link className="btn" href="/so-sinh-tu" onClick={() => persist(true)} style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
              Sổ Sinh Tử
            </Link>
            <button
              className="btn"
              onClick={() => {
                setSheet(null);
                setTut(true);
              }}
            >
              Hướng dẫn chơi
            </button>
            <Link className="btn btn-jade" href="/gop-y" onClick={() => persist(true)} style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
              Góp ý tính năng
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
      {c.dead && <DeathSheet c={c} karma={karmaOf(c)} isNew={!meta.endings?.[endingOf(c).id]} onDone={finishLife} />}
      {tut && !pending && !c.dead && (
        <Tutorial
          onDone={() => {
            setTut(false);
            try {
              localStorage.setItem('vkl.tut', '1');
            } catch {}
          }}
        />
      )}
      {kiep !== null && !c.dead && <TribulationOverlay realmName={REALMS[c.realm + 1]?.name ?? 'Phi Thăng'} onDone={afterKiep} />}
    </main>
  );
}

