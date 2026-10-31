'use client';

import Link from 'next/link';
import GhiDanh from '@/components/GhiDanh';
import { useCallback, useEffect, useRef, useState } from 'react';
import Scene from '@/components/Scene';
import MusicToggle from '@/components/MusicToggle';
import { CoachHint, TribulationOverlay, Tutorial, clearLaSo } from '@/components/Extras';
import { HoDaoScene, HoTroScene, TuKiepOverlay } from '@/components/VanKiep';
import type { PastSelf } from '@/lib/vanKiep';
import { LOI_ALLOW, LOI_TOTAL, daoKhon, failVanDao, usesVanDao } from '@/lib/game/vanDao';
import { BREAK_EVENT_ID } from '@/lib/game/events';
import { ENDINGS, alsoEndings, endingOf } from '@/lib/game/endings';
import { buyTinh, forge, sell, smelt } from '@/lib/game/forge';
import { BagSheet, BaoKhoSheet, BeQuanSheet, BirthPanel, DeathSheet, EventCard, FocusGrid, HuntSheet, LogPanel, OverworkBar, SEASONS, ShopSheet, Sheet, StageStrip, StatsPanel } from '@/components/Panels';
import Radar, { charAxes, wealthScore } from '@/components/Radar';
import { giftOf } from '@/lib/game/gacha';
import type { BattleView } from '@/components/Battle';
import { MONSTERS, combatLevel, effLv, fleeChance, hit, killExp, killReward, loseFight, monsterName, monsterStats, playerStats, tierOf, type Fighter } from '@/lib/game/combat';
import { sessionDropped, signOut } from '@/lib/auth';
import { lang, setLang } from '@/lib/i18n';
import { nameOf } from '@/lib/hanviet';
import { charLang, convertChar, convertMeta, loadDict, looksVi } from '@/lib/retrans';
import { ITEMS, PATHS, PILLS, REALMS, TALENTS, gearFx, itemPrice, pillPrice, RARE_STOCK_REALM, realmLabel, realmName, soldOut, yearSpeed, youthPace } from '@/lib/game/data';
import { genNameVi, checkProgress, closedDoor, karmaOf, makeCtx, newCharacter, resolveChoice, rnd, seasonOf, usePillNow, yearTick, chungDao, openingEvent } from '@/lib/game/engine';
import { addCult, addPill, dao, fatal, fmt, giveItem, money, reward, stat, wealthTier, DO_KIEP_REALM } from '@/lib/game/helpers';
import type { Character, Element, Focus, Fx, Meta, PendingEvent } from '@/lib/game/types';
import DuelWarning from '@/components/Duel';
import { artOf } from '@/lib/game/vocong';
import { trackMiles } from '@/lib/game/miles';
import { ELEMENTS, elemHitTag, elemMul, elemRel, elementOf } from '@/lib/game/nguhanh';
import { DUEL_INFO, DUEL_PER_YEAR, DUEL_TURNS, finishDuel, foeChar, foeStats, pickDuel, teaTrap, toRival, type DuelFoe } from '@/lib/game/duel';
import { SOCIAL } from '@/lib/game/social';
import { daiBiDue, rankName, sectCultMul } from '@/lib/game/sect';
import { bountyClaim, khieuDone, loadSocial, loreSocial, madResult, payoutClaim, truyenCong } from '@/lib/social';
import { GiangHoSheet, type GiangHoApi } from '@/components/GiangHo';
import { HIDDEN_ITEMS, collectStats, markSeen, newFinds, unseen } from '@/lib/game/collect';
import { QUY_NHAT_PHUC, newLore, quyNhatDone } from '@/lib/game/lore';
import { HON_PILLS, QUEST_HON, addHon, pastDanTu, honPillCost, honPillUsed, honDay, type HonPillId, CAU_HON_AT, HON_COST, HON_MAX, KS_NAME, applyHon, honActive, honNow, ksOf, ksOneBig, manhBa, nextKiepTich } from '@/lib/game/luanHoi';
import { serverNow } from '@/lib/serverTime';
import LoiDaiButton from '@/components/LoiDaiButton';
import { AMBUSH_INTRO, AMBUSH_PER_YEAR, AMBUSH_TURNS, ambushMonsterStats, finishAmbush, forcedReady, markForced, pickAmbush } from '@/lib/game/ambush';
import { within } from '@/lib/supabase';
import { endingFirst, titleKey, addMemorial, addPendingGrave, addRetryGrave, worthGhiDanh, displayName, fetchWorld, listMail, loadAll, saveLocal, saveMeta, saveRemote, sendMail, unreadMail, weeklyTitles, type Mail, type SaveState } from '@/lib/storage';
import { CHECKIN, checkinClaimed, checkinDay, checkinItem, checkinLabel, checkinMoney, updateCareer, bumpStreak, evalQuests, newbieGoal, omenIs, qmark, questName, vnDay } from '@/lib/game/hook';
import { CheckinPop, HookSheet, TitleBadge } from '@/components/Hook';
import { omenToday } from '@/lib/game/hook';
import { useAuth } from '@/lib/useAuth';
import ReleaseNotice, { GiftNotice, needNotice } from '@/components/Release';
import AscendScene from '@/components/AscendScene';
import { CURRENT_VERSION, markSeenLocal } from '@/lib/releases';
import NguHanhDai, { NhdMirror, waiting, type NhdView } from '@/components/NguHanhDai';
import { arenaBg, NHD_MAX_TURNS, PHU_PRICE, STANCES, loseRound, mirrorChar, mirrorStance, mirrorStats, needTrial, nhdOf, roundMods, tellOf, winRound, type RoundMods, type Stance } from '@/lib/game/nguHanhDai';
import { sectSide } from '@/lib/game/sect';
import { setLifeCtx, setScreen, track } from '@/lib/track';
import { tr } from '@/lib/i18n';

const SPEEDS = [1, 2, 4, 8, 16];
/** màu chưởng lực theo con đường tu luyện */
const qiColor = (c: Character) => (c.path ? PATHS[c.path].aura : c.daoTam <= -40 ? '#ff3448' : '#9ff0c8');
type SheetName = null | 'shop' | 'bag' | 'bequan' | 'menu' | 'hunt' | 'info' | 'today' | 'mail' | 'kho';

type Battle = BattleView & { t: number; rest: number; ps: Fighter; ms: Fighter };

const HINT_ORDER = ['choice', 'speed', 'focus', 'stats', 'dock'];
/** Bong bóng gợi ý kế tiếp cho người mới, theo đúng lúc cần dùng */
function nextHint(h: Record<string, 1>, pending: boolean, age: number): { k: string; sel: string; text: string; top?: boolean } | null {
  if (pending) return h.choice ? null : { k: 'choice', sel: '.choices', top: true, text: tr('Có chuyện xảy ra: chọn một cách xử lý. Đọc dòng nhỏ dưới mỗi lựa chọn, có cách khiến bạn chết.', 'Something happened: pick a response. Read the small line under each choice - some of them get you killed.') };
  if (!h.choice) return null;
  if (!h.speed) return { k: 'speed', sel: '.speeds', text: tr('Thời gian tự trôi. Bấm 16× để tua nhanh, ❚❚ để dừng.', 'Time flows on its own. Tap 16× to speed up, ❚❚ to pause.') };
  if (!h.focus && age >= 6) return { k: 'focus', sel: '.focus-grid', text: tr('Chạm để chọn việc năm nay: Tu luyện lên cảnh giới, Kiếm tiền mua đồ, Trừ yêu đánh quái.', 'Tap to pick this year\'s focus: Cultivate to climb realms, Earn to buy gear, Hunt to fight monsters.') };
  if (h.focus && !h.stats && age >= 12) return { k: 'stats', sel: '.strip-btn', text: tr('Chạm tên để xem chỉ số. Sức khỏe về 0 hoặc tâm ma lên 100 là chết.', 'Tap your name to see stats. Health at 0 or heart demons at 100 means death.') };
  if (h.stats && !h.dock && age >= 16) return { k: 'dock', sel: '.dock-actions', text: tr('Phường thị bán đồ, Túi đồ để mặc, Bế quan để tu nhanh.', 'The Market sells gear, the Bag equips it, Seclusion speeds up cultivation.') };
  return null;
}

export default function PlayPage() {
  const { user, ready } = useAuth();
  const [phase, setPhase] = useState<'loading' | 'birth' | 'play'>('loading');
  const [meta, setMeta] = useState<Meta | null>(null);
  const metaRef = useRef<Meta | null>(null);
  metaRef.current = meta;
  const [find, setFind] = useState<{ id: string; name: string; n: number; rare: number } | null>(null); // vừa có đồ ẩn mới
  const [bagTab, setBagTab] = useState<'tui' | 'kho'>('tui');
  const [, setFrame] = useState(0);
  const [fx, setFx] = useState<Fx[]>([]);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(true);
  const [hoTro, setHoTro] = useState<{ i: number; blocked: number } | null>(null); // kiếp trước đỡ thiên lôi phi thăng
  const [kiep, setKiep] = useState<number | null>(null); // lựa chọn đang chờ mini-game thiên kiếp
  const [vanDao, setVanDao] = useState<{ phase: 'tu' | 'loi' | 'hodao'; need?: number } | null>(null); // Chứng Đạo mới: tứ kiếp, 13 đạo lôi, vạn kiếp hộ đạo
  // Ngũ Hành Đài trước phi thăng: giữ lựa chọn đột phá và sự kiện để độ kiếp sau khi thắng đủ 5 bóng
  const [nhdPeek, setNhdPeek] = useState(false); // xem luật Ngũ Hành Đài từ dải nhắc
  const [nhd, setNhd] = useState<{ i: number; p: PendingEvent; view: NhdView | 'fight' | 'hodao'; foe: Stance; tell: Stance; msg?: string; end?: 'next' | 'done' | 'lose' | 'dead' } | null>(null);
  const [tut, setTut] = useState(false); // hướng dẫn đầy đủ (mở từ menu)
  // gợi ý đúng lúc cho người mới: mỗi lúc một bong bóng, đã xem thì thôi
  const [hints, setHints] = useState<Record<string, 1>>(() => {
    try {
      if (localStorage.getItem('vkl.tut')) return { choice: 1, speed: 1, focus: 1, stats: 1, dock: 1 };
      return JSON.parse(localStorage.getItem('vkl.hints') ?? '{}');
    } catch {
      return {};
    }
  });
  const seeHint = (k: string) =>
    setHints((h) => {
      if (h[k]) return h;
      const n = { ...h, [k]: 1 as const };
      try {
        localStorage.setItem('vkl.hints', JSON.stringify(n));
        if (HINT_ORDER.every((x) => n[x])) localStorage.setItem('vkl.tut', '1');
      } catch {}
      return n;
    });
  const [relOpen, setRelOpen] = useState(false); // cáo thị bản cập nhật mới
  const [ascend, setAscend] = useState<'tien' | 'ma' | 'hu' | null>(null); // cảnh phi thăng vừa xảy ra
  const cosSeen = useRef<string | null | undefined>(undefined);
  const [gifts, setGifts] = useState<{ amount: number; note: string }[] | null>(null); // quà Thiên Đạo vừa lĩnh
  const [duelWarn, setDuelWarn] = useState<DuelFoe | null>(null); // cảnh báo kỳ ngộ giang hồ
  const duelOpen = useRef(false);
  const [mail, setMail] = useState<Mail[] | null>(null); // hộp thư giang hồ
  const [unread, setUnread] = useState(0);
  const [titles, setTitles] = useState<Record<string, string[]>>({});
  const [questNews, setQuestNews] = useState<string[]>([]); // nhiệm vụ vừa xong ở đời trước
  const [achNews, setAchNews] = useState<string[]>([]); // thành tựu vừa đạt
  const [ghiDanh, setGhiDanh] = useState<{ name: string; realm: string; age: number; ascended: boolean; worthy?: boolean } | null>(null); // chơi thử mà chết ở cảnh giới cao: mời ghi danh
  const [loreNews, setLoreNews] = useState<string[]>([]); // mảnh Thiên thư vừa mở

  const charRef = useRef<Character | null>(null);
  const lifeT0 = useRef(0); // lúc bắt đầu kiếp trong phiên này, để đo thời gian một kiếp
  const deathSeen = useRef(0);
  const pendingRef = useRef<PendingEvent | null>(null);
  const yearSecRef = useRef(30);
  const talentsRef = useRef<string[]>([]);
  const lastRemote = useRef(0);
  const userRef = useRef(user);
  userRef.current = user;
  const battleRef = useRef<Battle | null>(null);
  const ambushRef = useRef<(Battle & { sub: number }) | null>(null); // quái chặn đường
  const duelRef = useRef<(Battle & { sub: number; foe: DuelFoe; fs: Fighter; nhd?: RoundMods }) | null>(null); // đấu với người chơi khác

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
      // đột phá đại cảnh giới: ghi để trang đầu hiện "vừa đột phá ..." (so với lần ghi cột mốc trước)
      const cr = charRef.current;
      if (cr && !cr.dead && cr.mileSnap && cr.realm > cr.mileSnap.realm && cr.realm >= 2) track('realm_up', { realm: cr.realm, cosmos: cr.cosmos ?? null, lifeNo: cr.lifeNo });
      trackMiles(charRef.current);
      // Bảo khố: lần đầu có được đồ ẩn thì ghi lại mãi mãi và báo cho người chơi
      const mm = metaRef.current;
      const ch = charRef.current;
      if (mm && ch && !ch.dead) {
        const nf = newFinds(ch, mm.itemBook ?? []);
        if (nf.length) {
          const fresh = mm.itemBook !== undefined; // lần đầu có sổ thì ghi lặng lẽ những món đang có
          const book = [...(mm.itemBook ?? []), ...nf];
          const n = book.length;
          if (fresh) {
            qmark(ch, 'newItem', nf.length);
            for (const id of nf) {
              const it = HIDDEN_ITEMS.find((i) => i.id === id);
              ch.log.push({ age: Math.floor(ch.age), tone: 'good', text: tr(`Lần đầu có được ${it?.name ?? tr('một món đồ ẩn', "a hidden item")}, đã ghi vào Bảo khố (${n}/${HIDDEN_ITEMS.length}).`, `First time obtaining ${it?.name ?? tr('một món đồ ẩn', "a hidden item")} - recorded in the Treasury (${n}/${HIDDEN_ITEMS.length}).`) });
            }
            const last = HIDDEN_ITEMS.find((i) => i.id === nf[nf.length - 1]);
            if (last) setFind({ id: last.id, name: last.name, n, rare: last.rare ?? 0 });
          }
          const m2 = { ...mm, itemBook: book, seenBook: fresh ? mm.seenBook : { e: mm.seenBook?.e ?? 0, i: book.length } };
          metaRef.current = m2;
          setMeta(m2);
          saveMeta(userRef.current, m2).catch(() => {});
        }
      }
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
    // chơi thử: chưa đăng nhập vẫn chơi được, lưu trên máy, không ghi danh lên giang hồ
    // phiên vừa hết hạn thì về trang đăng nhập, để người chơi cũ không tưởng mất tiến độ
    if (!user && sessionDropped()) {
      window.location.replace('/dang-nhap?next=/choi');
      return;
    }
    let cancel = false;
    (async () => {
      const { meta: m00, save } = await loadAll(user);
      if (cancel) return;
      // đổi ngôn ngữ giữa chừng: dịch lại gia phả, sự kiện đang chờ, kiếp trước... sang ngôn ngữ đang dùng
      let m0 = m00;
      const want = lang();
      const needChar = save?.char && charLang(save.char) !== want;
      const needMeta = !!m00.past && (m00.past.cause ? looksVi(m00.past.cause) !== (want === 'vi') : false);
      if ((needChar || needMeta) && (await loadDict())) {
        if (cancel) return;
        if (needChar && save?.char) convertChar(save.char, want, save.pending);
        if (needMeta) m0 = convertMeta(m00, want);
      }
      // chuỗi ngày tu luyện: vào game ngày mới thì cộng chuỗi
      const bumped = bumpStreak(m0);
      const m = bumped ?? m0;
      if (bumped) saveMeta(user, m).catch(() => {});
      setMeta(m);
      // ngày mới chưa nhận quà điểm danh: tự mở bảng quà (người chơi đã qua ít nhất một kiếp)
      if (m.lives > 0 && !checkinClaimed(m)) setCiOpen(true);
      // thư giang hồ chưa đọc: tự mở hộp thư
      if (user)
        unreadMail(user).then((n) => {
          if (cancel || !n) return;
          setUnread(n);
          listMail(user).then((ls) => {
            if (cancel) return;
            setMail(ls);
            setSheet('mail');
            setUnread(0);
          });
        });
      weeklyTitles().then((t) => !cancel && setTitles(t));
      if (user) loadSocial(user).catch(() => {});
      // chết rồi nhưng chưa bấm qua màn cáo biệt (tải lại, sang lôi đài, đóng trang): mở lại màn cáo biệt để kiếp vẫn được ghi.
      // finishLife đã chạy thì meta.past là kiếp này, khi đó bỏ qua để không ghi trùng.
      const deadPending = !!save?.char?.dead && !(m.past && m.past.lifeNo === save.char.lifeNo && m.past.name === save.char.name);
      if (save?.char && (!save.char.dead || deadPending)) {
        if (save.char.dead) deathSeen.current = save.char.lifeNo;
        charRef.current = save.char;
        pendingRef.current = save.pending;
        yearSecRef.current = save.yearSec || 30;
        talentsRef.current = save.talents ?? [];
        if (!save.char.world || !save.char.world.rivals)
          fetchWorld(user)
            .then((w) => {
              if (charRef.current === save.char && w) save.char.world = w;
            })
            .catch(() => {});
        setPhase('play');
        if (user) setTimeout(claimPayouts, 1500);
      } else setPhase('birth');
    })();
    return () => {
      cancel = true;
    };
  }, [ready, user?.token]);

  // đang giữa kiếp: báo bản mới chỉ hiện nút nhỏ, không chen ngang
  useEffect(() => {
    document.body.dataset.busy = phase === 'play' ? '1' : '';
    return () => {
      document.body.dataset.busy = '';
    };
  }, [phase]);

  // vào màn chơi thì kiểm tra ngay đồ ẩn mới (Bảo khố)
  useEffect(() => {
    if (phase === 'play' && meta) persist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, !!meta]);

  // thư giang hồ mới trong lúc chơi: kiểm tra mỗi 2 phút
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      unreadMail(user)
        .then((n) => setUnread(n))
        .catch(() => {});
      loadSocial(user).catch(() => {});
      claimPayouts();
    }, 120000);
    return () => clearInterval(id);
  }, [user]);

  // Vòng lặp thời gian
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const activeRef = useRef(false);
  const [ciGot, setCiGot] = useState<{ day: number; text: string } | null>(null);
  const [ciOpen, setCiOpen] = useState(false);
  activeRef.current = running && sheet === null && !ciOpen && phase === 'play' && kiep === null && hoTro === null && vanDao === null && !tut && duelWarn === null && !nhdPeek && !relOpen && !gifts && !ascend && (nhd === null || nhd.view === 'fight');

  /** Ngũ hành giữa bạn và loài quái */
  function monElem(c: Character, m: { el?: Element }) {
    const me = elementOf(c);
    const foe = m.el ?? 'tho';
    return { me, foe, rel: elemRel(me, foe) };
  }

  /** Trận đánh tự động kiểu idle: mỗi lượt bạn đánh một đòn, quái đánh trả một đòn */
  function newFight(c: Character, mId: string, kills: number): Battle | null {
    const m = MONSTERS.find((x) => x.id === mId);
    if (!m) return null;
    const ps = playerStats(c);
    // boss: không thể gây sát thương, mỗi đòn của nó lấy khoảng 1/3 máu
    const ms = m.boss ? { hp: 1e9, atk: Math.round(ps.hp * 0.38 + ps.def * 0.5), def: 1e12 } : monsterStats(m, effLv(c, m), c);
    return {
      m,
      name: monsterName(c, m),
      lv: m.boss ? 99 : effLv(c, m),
      tier: m.boss ? 0 : tierOf(c, m),
      pHp: ps.hp,
      pMax: ps.hp,
      mHp: ms.hp,
      mMax: ms.hp,
      phase: 'fight',
      last: [],
      kills,
      t: 0,
      rest: 0,
      ps,
      ms,
      melem: m.boss ? undefined : monElem(c, m),
    };
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
    const push = (side: 'p' | 'm', dmg: number, crit: boolean, text?: string, art?: { name: string; palm: boolean } | null) => {
      const me = b!.melem;
      const tag = text || !me || !dmg ? undefined : side === 'p' ? elemHitTag(me.me, me.foe) : elemHitTag(me.foe, me.me);
      b!.last = [...b!.last.slice(-4), { id: Math.random(), side, dmg, crit, text, skill: art?.name, palm: art?.palm, qi: art?.palm ? qiColor(c) : undefined, tag }];
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
      const h1 = hit(b.ps.atk * (b.melem ? elemMul(b.melem.me, b.melem.foe) : 1), b.ms.def, rnd, 0.15 + gearFx(c.equipped).crit / 100);
      b.mHp = Math.max(0, b.mHp - h1.dmg);
      push('p', h1.dmg, h1.crit, b.m.boss ? tr('Vô hiệu', "Immune") : undefined, artOf(c, rnd));
      if (b.mHp <= 0) {
        const out: Fx[] = [];
        const ctx = makeCtx(c, out);
        const exp = killExp(c, b.m);
        killReward(c, b.m, ctx).forEach((n) => ctx.log(n, 'good'));
        b.kills += 1;
        b.phase = 'rest';
        b.rest = 3;
        b.outcome = 'win';
        push('p', 0, false, tr(`+${exp} tu vi`, `+${exp} cultivation`));
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
      const h2 = hit(b.ms.atk * (b.melem ? elemMul(b.melem.foe, b.melem.me) : 1), b.ps.def, rnd);
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
          ctx.log(tr('Bạn về động phủ dưỡng thương, tạm gác việc trừ yêu.', "You return to your cave abode to heal, setting demon hunting aside for now."), 'normal');
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
          push('m', 0, false, tr('Rút lui!', "Retreat!"));
        }
      }
    }
    return changed;
  }

  /** Kỳ ngộ giang hồ: đấu với nhân vật người chơi khác hoặc chính mình kiếp trước, tối đa 5 hiệp */
  function startDuel(c: Character, f: DuelFoe, ambushed: boolean) {
    let ps = playerStats(c);
    // huynh đệ kết nghĩa từ xa phóng tới trợ quyền khi bạn bị đánh úp hay gặp địch thủ
    const bros = SOCIAL.cur.sworn.filter((p) => p !== f.rival.player);
    if (!f.sworn && (ambushed || f.kind === 'dich_thu') && bros.length && rnd() < 0.35) {
      const bro = bros[Math.floor(rnd() * bros.length)];
      ps = { ...ps, hp: Math.round(ps.hp * 1.3), atk: Math.round(ps.atk * 1.15) };
      c.log.push({
        age: Math.floor(c.age),
        tone: 'good',
        text: tr(`Huynh đệ kết nghĩa @${bro} nghe tin, từ xa phóng tới trợ quyền: "Đụng tới huynh đệ ta là đụng tới ta!" (sinh lực +30%, công +15% trận này)`, `Your sworn brother @${bro} hears the news and comes flying from afar to back you up: "Touch my brother and you touch me!" (HP +30%, attack +15% this fight)`),
      });
      if (userRef.current) sendMail(userRef.current, bro, 'nghia', tr(`Bóng của bạn đã ra tay trợ quyền cho huynh đệ @${userRef.current.username} (${c.name}) trước ${f.rival.name}.`, `Your shadow stepped in to help your sworn brother @${userRef.current.username} (${c.name}) against ${f.rival.name}.`)).catch(() => {});
    }
    const fs = foeStats(f.rival, c);
    const fc = foeChar(f.rival);
    duelRef.current = {
      m: { ...MONSTERS[0], id: 'duel', name: f.rival.name },
      name: f.rival.name,
      lv: combatLevel(fc),
      tier: 0,
      pHp: ambushed ? Math.round(ps.hp * (f.betray ? 0.6 : 0.8)) : ps.hp,
      pMax: ps.hp,
      mHp: fs.hp,
      mMax: fs.hp,
      phase: 'fight',
      last: [{ id: Math.random(), side: 'm', dmg: 0, crit: false, text: ambushed ? tr('Bị chặn lại!', "Blocked!") : tr('Xuất chiêu!', "Strike!") }],
      kills: 0,
      t: -0.9,
      rest: 0,
      ps,
      ms: fs,
      fs,
      sub: 0,
      foe: f,
      duel: {
        kind: f.kind,
        foe: fc,
        tag: tr(`${DUEL_INFO[f.kind].tag} · Kiếp ${f.rival.lifeNo ?? 1}`, `${DUEL_INFO[f.kind].tag} · Life ${f.rival.lifeNo ?? 1}`),
        player: f.kind === 'kiep_truoc' ? '' : f.rival.player,
        turn: 0,
        max: DUEL_TURNS,
        elem: { me: elementOf(c), foe: elementOf(fc), rel: elemRel(elementOf(c), elementOf(fc)) },
      },
    };
    rerender();
  }

  function stepDuel(c: Character, dtReal: number): boolean {
    const b = duelRef.current;
    if (!b || !b.duel) return false;
    const half = 0.65;
    b.t += dtReal;
    let changed = false;
    const fc = b.duel.foe;
    const eMe = b.nhd ? b.nhd.myEl : elementOf(c);
    const eFoe = b.nhd ? b.nhd.foeEl : elementOf(fc);
    const push = (side: 'p' | 'm', dmg: number, crit: boolean, text?: string, art?: { name: string; palm: boolean } | null) => {
      // chưởng mang màu bản mệnh, đòn khắc chế có chữ riêng
      const qi = ELEMENTS[side === 'p' ? eMe : eFoe].color;
      const tag = text || b.nhd?.rel === 'dong' ? undefined : side === 'p' ? elemHitTag(eMe, eFoe) : elemHitTag(eFoe, eMe);
      b.last = [...b.last.slice(-4), { id: Math.random(), side, dmg, crit, text, skill: art?.name, palm: art?.palm, qi: art?.palm ? qi : undefined, tag }];
    };
    const end = (result: 'win' | 'lose' | 'draw') => {
      const out: Fx[] = [];
      const ctx = makeCtx(c, out);
      if (b.foe.kind === 'ngu_hanh') {
        const won = result === 'win';
        // thua mà đời này chưa gọi kiếp trước: cho kiếp trước ra đỡ (không có ai đủ sức thì xử thua như thường)
        if (!won && !nhdOf(c).hoDao) {
          b.phase = 'rest';
          b.rest = 4;
          b.outcome = 'lose';
          setNhd((n) => (n ? { ...n, view: 'hodao' } : n));
          return;
        }
        const msg = won ? winRound(c) : loseRound(c, ctx);
        const ek = won ? (nhdOf(c).done ? 'done' : 'next') : c.dead ? 'dead' : 'lose';
        ctx.log(msg, c.dead ? 'big' : won ? 'good' : 'bad');
        if (won) ctx.fx('breakthrough', nhdOf(c).done ? tr('NGŨ HÀNH VIÊN MÃN', "FIVE ELEMENTS PERFECTED") : tr(`Gương ${nhdOf(c).won}/5`, `Mirror ${nhdOf(c).won}/5`));
        b.phase = 'rest';
        b.rest = 4;
        b.outcome = won ? 'win' : 'lose';
        pushFx(out);
        persist(true);
        setNhd((n) => (n ? { ...n, view: 'result', msg, end: ek } : n));
        return;
      }
      const notes = finishDuel(c, b.foe, result, 1 - b.pHp / b.pMax, ctx);
      // 4.1.0: đo trận giao đấu và khoảng cách giữa hai trận bắt buộc
      const gap = markForced(c);
      track('duel', { res: result, kind: b.foe.kind, npc: !!b.foe.npc, rel: b.foe.rel, realm: c.realm, age: Math.floor(c.age), hp: Math.round(c.stats.sucKhoe), dead: c.dead, gap });
      if (gap !== null) track('forced_gap', { src: 'duel', gap, realm: c.realm });
      notes.forEach((n, i) => ctx.log(n, c.dead ? 'big' : i === 0 ? (result === 'win' ? 'good' : result === 'lose' ? 'bad' : 'normal') : 'good'));
      if (result === 'win' && b.foe.kind !== 'kiep_truoc') qmark(c, 'duelWin');
      // thư giang hồ cho chủ nhân của bóng nhân vật vừa gặp
      const fo = b.foe;
      if (fo.kind === 'ma_dau') {
        // máy chủ gửi thư cho chủ bóng, chia phúc duyên; gia phả ghi lại trận này
        madResult(userRef.current, fo.rival.player, result === 'win', c.lifeNo, c.name)
          .then(() => setTimeout(claimPayouts, 1500))
          .catch(() => {});
        c.miles = [...(c.miles ?? []), { age: Math.floor(c.age), kind: 'duel', text: result === 'win' ? tr(`Đánh tan bóng ma đầu ${fo.rival.name} của @${fo.rival.player}`, `Shattered the demon lord shadow ${fo.rival.name} of @${fo.rival.player}`) : tr(`Bị bóng ma đầu ${fo.rival.name} của @${fo.rival.player} đánh trọng thương`, `Gravely wounded by the demon lord shadow ${fo.rival.name} of @${fo.rival.player}`) }];
      }
      if (fo.kind !== 'kiep_truoc' && fo.kind !== 'ma_dau' && fo.rival.player && !fo.npc) {
        const me = userRef.current?.username ?? '';
        const shadow = tr(`bóng ${fo.rival.name} của bạn`, `your shadow ${fo.rival.name}`);
        const loot = notes.find((n) => /lột|tặng bạn|lấy lại|strip|gives it to you|reclaim/.test(n));
        const body =
          result === 'win'
            ? `@${me} (${c.name}) ${fo.revenge ? tr('đã báo thù, hạ', "took revenge and struck down") : tr('đánh bại', "defeated")} ${shadow}.${loot ? ' ' + loot.replace(/^Bạn /, tr('Người ấy ', "They ")).replace(/^You /, 'They ') : ''}`
            : result === 'lose'
              ? tr(`${shadow[0].toUpperCase() + shadow.slice(1)} đã ${fo.betray ? tr('trở mặt bên bàn trà, ', "broke the truce over tea and ") : ''}${c.dead ? tr('giết chết', "killed") : tr('hạ gục', "struck down")} @${me} (${c.name}).${notes.some((n) => /lột mất|strips you of/.test(n)) ? tr(' Còn lột được đồ của họ.', " And stripped them of their gear.") : ''}`, `${shadow[0].toUpperCase() + shadow.slice(1)} ${fo.betray ? tr('trở mặt bên bàn trà, ', "broke the truce over tea and ") : ''}${c.dead ? tr('giết chết', "killed") : tr('hạ gục', "struck down")} @${me} (${c.name}).${notes.some((n) => /lột mất|strips you of/.test(n)) ? tr(' Còn lột được đồ của họ.', " And stripped them of their gear.") : ''}`)
              : tr(`@${me} (${c.name}) đấu với ${shadow} năm hiệp, bất phân thắng bại.`, `@${me} (${c.name}) fought ${shadow} for five rounds - neither could win.`);
        sendMail(userRef.current, fo.rival.player, result === 'win' ? 'thua' : result === 'lose' ? 'thang' : 'hoa', body).catch(() => {});
        // huyết hải thâm thù: ghi lại các kiếp đã giao đấu với người này
        const m0 = metaRef.current;
        if (m0 && !fo.sworn && fo.kind === 'dich_thu') {
          const fe = { ...(m0.feud ?? {}) };
          const lives = Array.from(new Set([...(fe[fo.rival.player] ?? []), c.lifeNo])).slice(-12);
          fe[fo.rival.player] = lives;
          const m2 = { ...m0, feud: fe };
          setMeta(m2);
          saveMeta(userRef.current, m2).catch(() => {});
          if (lives.length === 3 && result === 'win') ctx.log(tr(`Ba kiếp ân oán với @${fo.rival.player}. Giang hồ gọi bạn là kẻ "Báo thù 3 đời".`, `Three lives of grudges with @${fo.rival.player}. The jianghu calls you "the Three-Lifetime Avenger".`), 'big');
        }
        if (fo.provoke) khieuDone(userRef.current, fo.rival.player).catch(() => {});
        // lĩnh tiền truy nã
        if (result === 'win' && fo.bounty) {
          const who = fo.rival.player;
          bountyClaim(userRef.current, who)
            .then((n) => {
              const ch = charRef.current;
              if (!n || !ch || ch.dead) return;
              money(ch, n);
              ch.log.push({ age: Math.floor(ch.age), tone: 'good', text: tr(`Bạn mang thủ cấp bóng ${fo.rival.name} (@${who}) về lĩnh thưởng truy nã: +${n} linh thạch.`, `You bring the head of shadow ${fo.rival.name} (@${who}) back for the bounty: +${n} spirit stones.`) });
              persist(true);
              rerender();
            })
            .catch(() => {});
        }
      }
      b.phase = 'rest';
      b.rest = 4;
      b.outcome = result === 'win' ? 'win' : result === 'lose' ? 'lose' : 'flee';
      if (result === 'draw') push('m', 0, false, tr('Bất phân thắng bại', "A draw"));
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
          duelRef.current = null;
          return true;
        }
        continue;
      }
      if (b.sub === 0) {
        b.duel.turn += 1;
        const h = hit(b.ps.atk, b.fs.def, rnd, 0.15 + gearFx(c.equipped).crit / 100);
        h.dmg = Math.round(h.dmg * (b.nhd ? b.nhd.pMul : elemMul(elementOf(c), elementOf(fc))));
        b.mHp = Math.max(0, b.mHp - h.dmg);
        push('p', h.dmg, h.crit, undefined, artOf(c, rnd));
        b.sub = 1;
        if (b.mHp <= 0) {
          end('win');
          break;
        }
      } else {
        const h = hit(b.fs.atk, b.ps.def, rnd, 0.15 + gearFx(fc.equipped).crit / 100);
        h.dmg = Math.round(h.dmg * (b.nhd ? b.nhd.fMul : elemMul(elementOf(fc), elementOf(c))));
        b.pHp = Math.max(0, b.pHp - h.dmg);
        push('m', h.dmg, h.crit, undefined, artOf(fc, rnd));
        b.sub = 0;
        if (b.pHp <= 0) {
          end('lose');
          break;
        }
        if (b.duel.turn >= b.duel.max) {
          if (b.nhd) end(b.mHp / b.mMax < b.pHp / b.pMax ? 'win' : 'lose');
          else end(b.mHp / b.mMax < b.pHp / b.pMax - 0.25 ? 'win' : 'draw');
          break;
        }
      }
    }
    return changed;
  }

  /** Tỉ lệ bỏ chạy khỏi địch thủ: kẻ yếu hơn thì chạy chắc chắn được */
  const duelFlee = (c: Character, f: DuelFoe) => (f.rel === 'yeu' ? 1 : Math.max(0.1, Math.min(0.85, 0.45 + gearFx(c.equipped).flee / 100 + (f.rel === 'manh' ? -0.15 : 0))));

  /** Không đánh mà rời đi khi đối thủ ngang hoặc mạnh hơn: có thể bị đánh lén trọng thương, thậm chí mất mạng */
  const declineRisk = (c: Character, f: DuelFoe, ctx: ReturnType<typeof makeCtx>, how: 'leave' | 'flee'): string => {
    if (f.rel === 'yeu' || f.kind === 'dong_mon') return '';
    const who = f.rival.name;
    const hurtP = f.rel === 'manh' ? 0.5 : 0.35;
    const dieP = (f.rel === 'manh' ? 0.1 : 0.04) * (f.kind === 'dong_dao' ? 0.5 : 1);
    if (ctx.rnd() >= hurtP) return '';
    const fl = fatal(
      c,
      ctx,
      dieP / hurtP,
      how === 'flee'
        ? tr(`Vừa quay lưng, một đạo kình lực của ${who} đánh xuyên tâm mạch. Bạn ngã xuống giữa đường chạy.`, `The moment you turn your back, a surge of force from ${who} pierces your heart meridian. You fall mid-flight.`)
        : tr(`${who} cười lạnh: "Muốn đi dễ vậy sao?" Một chưởng sau lưng, bạn không bao giờ đứng dậy nữa.`, `${who} laughs coldly: "Think you can leave that easily?" One palm to the back, and you never rise again.`),
    );
    if (c.dead) return ' ' + (fl ?? '').trim();
    stat(c, 'sucKhoe', f.rel === 'manh' ? -35 : -22);
    ctx.fx('hurt');
    return how === 'flee' ? tr(` Chạy thoát nhưng lưng trúng một chưởng của ${who}, trọng thương.${fl ?? ''}`, ` You escape, but take a palm strike from ${who} in the back - grave wounds.${fl ?? ''}`) : tr(` ${who} không vui, tiễn bạn bằng một chưởng. Bạn trọng thương.${fl ?? ''}`, ` ${who} is displeased and sees you off with a palm strike. You are gravely wounded.${fl ?? ''}`);
  };

  const pickDuelAction = (a: 'fight' | 'befriend' | 'leave' | 'flee') => {
    const f = duelWarn;
    const c = charRef.current;
    setDuelWarn(null);
    duelOpen.current = false;
    if (!f || !c) return;
    const who = f.rival.player ? `${f.rival.name} (@${f.rival.player})` : f.rival.name;
    if (a === 'fight') startDuel(c, f, false);
    else if (a === 'flee') {
      if (rnd() < duelFlee(c, f))
        act((ch, out) => {
          const extra = declineRisk(ch, f, makeCtx(ch, out), 'flee');
          ch.log.push({ age: Math.floor(ch.age), tone: ch.dead ? 'big' : extra ? 'bad' : 'normal', text: tr(`Bạn thi triển khinh công thoát khỏi ${who}.${extra}`, `You unleash your lightness skill and escape ${who}.${extra}`) });
        });
      else {
        c.log.push({ age: Math.floor(c.age), tone: 'bad', text: tr(`Bỏ chạy không thành, ${who} chặn đầu đánh úp.`, `Your escape fails - ${who} cuts you off and strikes.`) });
        startDuel(c, f, true);
      }
    } else if (a === 'befriend') {
      // lòng người khó đoán: 40% ám toán, 40% trở mặt ra tay, 20% thật lòng
      const out0: Fx[] = [];
      const trap = teaTrap(c, f, makeCtx(c, out0));
      if (trap.kind === 'tro_mat') {
        c.log.push({ age: Math.floor(c.age), tone: 'bad', text: trap.text });
        pushFx(out0);
        // trở mặt thành địch thủ, bạn bị đánh úp (mất trước một phần máu)
        startDuel(c, { ...f, kind: 'dich_thu', betray: true }, true);
        return;
      }
      const realP = f.rival.player && !f.npc ? f.rival.player : null;
      const meName = `@${userRef.current?.username ?? ''} (${c.name})`;
      if (trap.kind === 'am_toan') {
        c.log.push({ age: Math.floor(c.age), tone: c.dead ? 'big' : 'bad', text: trap.text });
        if (!c.dead) qmark(c, 'teaSurvive');
        if (realP) sendMail(userRef.current, realP, 'doc', tr(`Bóng ${f.rival.name} của bạn đã bỏ độc vào trà mời ${meName}${c.dead ? tr('. Người ấy chết bên bàn trà.', ". They died at the tea table.") : '.'}`, `Your shadow ${f.rival.name} poisoned the tea it served ${meName}${c.dead ? tr('. Người ấy chết bên bàn trà.', ". They died at the tea table.") : '.'}`)).catch(() => {});
        pushFx(out0);
        persist(true);
        rerender();
        return;
      }
      if (realP) sendMail(userRef.current, realP, 'tra', tr(`${meName} cùng bóng ${f.rival.name} của bạn uống trà luận đạo suốt đêm, kết làm bằng hữu.`, `${meName} and your shadow ${f.rival.name} drank tea and discussed the Dao all night, and became friends.`)).catch(() => {});
      act((ch) => {
        qmark(ch, 'teaSurvive');
        if (f.sworn) {
          const exp = Math.round(reward(ch, 0.3));
          addCult(ch, exp);
          ch.log.push({ age: Math.floor(ch.age), tone: 'good', text: tr(`Huynh đệ gặp nhau, trà thật lòng thật. Hai người cùng luận đạo, cả hai cùng tiến (+${exp} tu vi).`, `Brothers meet, the tea is real and so are the hearts. You discuss the Dao together and both of you advance (+${exp} cultivation).`) });
          return;
        }
        const er = elemRel(elementOf(ch), elementOf(f.rival));
        stat(ch, 'khiVan', er === 'duoc_sinh' ? 5 : er === 'sinh' ? 3 : 2);
        stat(ch, 'tamCanh', 4);
        if (er === 'duoc_sinh' || er === 'sinh') ch.log.push({ age: Math.floor(ch.age), tone: 'good', text: tr('Ngũ hành tương sinh, hai người càng nói càng hợp. Khí vận của bạn khởi sắc.', "The five elements nourish each other - the more you talk, the better you click. Your Luck brightens.") });
        ch.log.push({ age: Math.floor(ch.age), tone: 'good', text: tr(`Trà thật, người cũng thật. Bạn cùng ${who} uống trà luận đạo suốt đêm, kết làm bằng hữu giang hồ.`, `The tea is real, and so is the person. You and ${who} drink tea and discuss the Dao all night, becoming friends of the jianghu.`) });
      });
    } else
      act((ch, out) => {
        const extra = declineRisk(ch, f, makeCtx(ch, out), 'leave');
        ch.log.push({ age: Math.floor(ch.age), tone: ch.dead ? 'big' : extra ? 'bad' : 'normal', text: tr(`Bạn chắp tay cáo từ ${who}.${extra || tr(' Núi xanh còn đó, ngày sau gặp lại.', " The green mountains remain; we shall meet again.")}`, `You cup your fists and take your leave of ${who}.${extra || tr(' Núi xanh còn đó, ngày sau gặp lại.', " The green mountains remain; we shall meet again.")}`) });
      });
  };

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
      last: [{ id: Math.random(), side: 'm', dmg: 0, crit: false, text: tr('Chặn đường!', "Ambushed!") }],
      kills: 0,
      t: -0.9, // khựng lại một nhịp cho người chơi kịp nhìn
      rest: 0,
      ps,
      ms,
      sub: 0,
      ambush: { turn: 0, max: AMBUSH_TURNS, kind: tier },
      melem: monElem(c, m),
    };
    c.log.push({
      age: Math.floor(c.age),
      tone: 'bad',
      text: tr(`${m.sect ? tr(`Thí luyện tông môn: ${m.name} ở ${m.place} chặn đường, đệ tử nào cũng phải qua.`, `Sect trial: ${m.name} at ${m.place} blocks the way - every disciple must get past it.`) : AMBUSH_INTRO[tier]} (${monsterName(c, m)}, Lv${effLv(c, m)}, hệ ${ELEMENTS[m.el ?? 'tho'].name})`, `${m.sect ? tr(`Thí luyện tông môn: ${m.name} ở ${m.place} chặn đường, đệ tử nào cũng phải qua.`, `Sect trial: ${m.name} at ${m.place} blocks the way - every disciple must get past it.`) : AMBUSH_INTRO[tier]} (${monsterName(c, m)}, Lv${effLv(c, m)}, ${ELEMENTS[m.el ?? 'tho'].name})`),
    });
  }

  function stepAmbush(c: Character, dtReal: number): boolean {
    const b = ambushRef.current;
    if (!b) return false;
    const half = 0.6; // mỗi đòn 0,6 giây thật, không phụ thuộc tốc độ
    b.t += dtReal;
    let changed = false;
    const push = (side: 'p' | 'm', dmg: number, crit: boolean, text?: string, art?: { name: string; palm: boolean } | null) => {
      const me = b.melem;
      const tag = text || !me || !dmg ? undefined : side === 'p' ? elemHitTag(me.me, me.foe) : elemHitTag(me.foe, me.me);
      b.last = [...b.last.slice(-4), { id: Math.random(), side, dmg, crit, text, skill: art?.name, palm: art?.palm, qi: art?.palm ? qiColor(c) : undefined, tag }];
    };
    const end = (result: 'win' | 'lose' | 'draw') => {
      const out: Fx[] = [];
      const ctx = makeCtx(c, out);
      const notes = finishAmbush(c, b.m, result, 1 - b.pHp / b.pMax, 1 - b.mHp / b.mMax, ctx, b.ambush!.kind);
      if (result === 'win') qmark(c, 'ambushWin');
      // 4.1.0: đo trận chặn đường và khoảng cách giữa hai trận bắt buộc
      const gap = markForced(c);
      track('ambush', { res: result, tier: b.ambush!.kind, mon: b.m.id, lv: b.lv, realm: c.realm, age: Math.floor(c.age), hp: Math.round(c.stats.sucKhoe), dead: c.dead, gap });
      if (gap !== null) track('forced_gap', { src: 'ambush', gap, realm: c.realm });
      notes.forEach((n, i) => ctx.log(n, c.dead ? 'big' : result !== 'win' ? 'bad' : i === 0 ? 'good' : /^(Thắng nhưng|You win, but)/.test(n) ? 'bad' : 'good'));
      b.phase = 'rest';
      b.rest = 3;
      b.outcome = result === 'win' ? 'win' : result === 'lose' ? 'lose' : 'flee';
      if (result === 'draw') push('m', 0, false, b.mHp / b.mMax <= 0.5 && 1 - b.mHp / b.mMax > 1 - b.pHp / b.pMax ? tr('Quái bỏ chạy', "Monster fled") : tr('Bỏ chạy!', "Flee!"));
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
        const h = hit(b.ps.atk * (b.melem ? elemMul(b.melem.me, b.melem.foe) : 1), b.ms.def, rnd, 0.15 + gearFx(c.equipped).crit / 100);
        b.mHp = Math.max(0, b.mHp - h.dmg);
        push('p', h.dmg, h.crit, undefined, artOf(c, rnd));
        b.sub = 1;
        if (b.mHp <= 0) {
          end('win');
          break;
        }
      } else {
        const h = hit(b.ms.atk * (b.melem ? elemMul(b.melem.foe, b.melem.me) : 1), b.ps.def, rnd);
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
      if (c && activeRef.current && duelRef.current) {
        if (stepDuel(c, dt)) rerender();
        raf = requestAnimationFrame(step);
        return;
      }
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
        const dYear = (dt / yearSecRef.current) * speedRef.current * yearSpeed(c.realm, c.cosmos) * youthPace(c);
        if (
          c.realm >= 1 &&
          (c.age >= 15 || daiBiDue(c)) &&
          c.focus !== 'tru_yeu' &&
          !duelOpen.current &&
          ((c.hunt && c.age >= c.hunt.at) || daiBiDue(c) || (forcedReady(c) && rnd() < DUEL_PER_YEAR * (omenIs('giang_ho_loan') ? 2 : 1) * dYear))
        ) {
          const f = pickDuel(c, rnd);
          if (f) {
            duelOpen.current = true;
            activeRef.current = false;
            setDuelWarn(f);
            raf = requestAnimationFrame(step);
            return;
          }
        }
        // 4.1.0 Q3: chặn đường phải chờ khoảng lặng sau trận bắt buộc trước, và bỏ qua khi sức khỏe dưới 35
        if (c.age >= 10 && c.focus !== 'tru_yeu' && c.stats.sucKhoe >= 35 && forcedReady(c) && rnd() < AMBUSH_PER_YEAR * (omenIs('yeu_trieu') ? 2 : 1) * dYear) {
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
            const w0 = c.hpWarnAt;
            const p = yearTick(c, ctx, { talents: talentsRef.current });
            if (p || c.dead) {
              pendingRef.current = p;
              stopped = true;
              break;
            }
            // vừa cảnh báo sức khỏe nguy kịch: tạm dừng để người chơi kịp xử lý
            if (c.hpWarnAt !== w0) {
              setRunning(false);
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
    if (c && !hints.choice) {
      seeHint('choice');
      track('first_choice', { lifeNo: c.lifeNo, ms: Date.now() - lifeT0.current });
    }
    // phi thăng: phải qua Ngũ Hành Đài trước rồi mới độ kiếp
    if (p && c && p.id === BREAK_EVENT_ID && needTrial(c) && !/^(Củng cố|Consolidate)/.test(p.choices[i]?.label ?? '')) {
      pendingRef.current = null;
      const s = nhdOf(c);
      s.tries += 1;
      const foe = mirrorStance(s.won, rnd);
      setNhd({ i, p, view: s.tries > 1 ? 'prep' : 'rules', foe, tell: tellOf(foe, rnd) });
      persist(true);
      return;
    }
    // Chứng Đạo ở Tiên giới, Ma giới: Tứ Kiếp Vấn Đạo, rồi 13 đạo lôi, hụt nhiều thì vạn kiếp hộ đạo
    if (p && c && p.id === BREAK_EVENT_ID && usesVanDao(c) && !/^(Củng cố|Consolidate)/.test(p.choices[i]?.label ?? '')) {
      track('van_dao_start', { lifeNo: c.lifeNo });
      setVanDao({ phase: 'tu' });
      return;
    }
    // đột phá có thiên kiếp: chơi mini-game đỡ sấm trước
    if (p && c && p.id === BREAK_EVENT_ID && c.realm + 1 >= 3 && !/^(Củng cố|Consolidate)/.test(p.choices[i]?.label ?? '')) {
      setKiep(i);
      return;
    }
    resolveNow(i);
  };

  /** Lên đài đánh một bóng: dùng lại sân đấu giang hồ, hệ số theo ngũ hành, ấn, phù, thế trận */
  const nhdFight = (my: Stance, phu: boolean) => {
    const c = charRef.current;
    const n = nhd;
    if (!c || !n) return;
    if (phu) c.phu = Math.max(0, (c.phu ?? 1) - 1);
    const r = nhdOf(c).won;
    const mods = roundMods(c, r, my, n.foe, phu);
    const ps = playerStats(c);
    const fs = mirrorStats(c, r);
    const fc = mirrorChar(c, r);
    c.log.push({ age: Math.floor(c.age), tone: 'normal', text: tr(`Ngũ Hành Đài, gương ${r + 1}: bạn rút lá ${STANCES[my].name}, bóng ra thế ${STANCES[n.foe].name}.${mods.notes.length ? ' ' + mods.notes.join('. ') + '.' : ''}`, `Five Elements Platform, mirror ${r + 1}: you draw ${STANCES[my].name}, the shadow plays ${STANCES[n.foe].name}.${mods.notes.length ? ' ' + mods.notes.join('. ') + '.' : ''}`) });
    duelRef.current = {
      m: { ...MONSTERS[0], id: 'duel', name: fc.name },
      name: fc.name,
      lv: combatLevel(c),
      tier: 0,
      pHp: ps.hp,
      pMax: ps.hp,
      mHp: fs.hp,
      mMax: fs.hp,
      phase: 'fight',
      last: [{ id: Math.random(), side: 'm', dmg: 0, crit: false, text: tr('Bóng bước ra!', "The shadow steps out!") }],
      kills: 0,
      t: -0.9,
      rest: 0,
      ps,
      ms: fs,
      fs,
      sub: 0,
      foe: { kind: 'ngu_hanh', rival: toRival('', fc), npc: true, rel: 'ngang', reason: '' },
      duel: { kind: 'ngu_hanh', foe: fc, tag: tr(`Gương ${r + 1}/5 · ${STANCES[my].name} đấu ${STANCES[n.foe].name}`, `Mirror ${r + 1}/5 · ${STANCES[my].name} vs ${STANCES[n.foe].name}`), player: '', turn: 0, max: NHD_MAX_TURNS, elem: { me: mods.myEl, foe: mods.foeEl, rel: mods.rel }, bg: arenaBg(c, r) },
      nhd: mods,
    };
    setNhd({ ...n, view: 'fight' });
    setRunning(true);
    rerender();
  };

  const nhdNext = () => {
    const c = charRef.current;
    const n = nhd;
    duelRef.current = null;
    if (!c || !n) return setNhd(null);
    if (n.end === 'next') {
      const foe = mirrorStance(nhdOf(c).won, rnd);
      setNhd({ ...n, view: 'prep', msg: undefined, end: undefined, foe, tell: tellOf(foe, rnd) });
      return;
    }
    setNhd(null);
    if (n.end === 'done') {
      pendingRef.current = n.p;
      setKiep(n.i);
      return;
    }
    persist(true);
    rerender();
  };

  /** Ngũ Hành Đài: kiếp trước đỡ đòn thì đánh lại gương này, không ai ra thì thua như thường */
  const nhdHoTro = (sent: PastSelf[]) => {
    const c = charRef.current;
    const n = nhd;
    duelRef.current = null;
    if (!c || !n) return setNhd(null);
    const p = sent[0];
    if (p) {
      nhdOf(c).hoDao = true;
      const msg = tr(`Kiếp ${p.lifeNo}, ${p.name}, lao ra đỡ đòn chí mạng thay bạn rồi tan vào mặt gương. Bạn đứng dậy, tấm gương này vẫn chờ.`, `Life ${p.lifeNo}, ${p.name}, leaps in to take the killing blow, then fades into the mirror. You rise; this mirror is still waiting.`);
      c.log.push({ age: Math.floor(c.age), tone: 'good', text: msg });
      track('ho_tro', { mode: 'nhd', lifeNo: p.lifeNo });
      const foe = mirrorStance(nhdOf(c).won, rnd);
      persist(true);
      setNhd({ ...n, view: 'prep', msg: undefined, end: undefined, foe, tell: tellOf(foe, rnd) });
      rerender();
      return;
    }
    const out: Fx[] = [];
    const ctx = makeCtx(c, out);
    const msg = loseRound(c, ctx);
    ctx.log(msg, c.dead ? 'big' : 'bad');
    pushFx(out);
    persist(true);
    setNhd({ ...n, view: 'result', msg, end: c.dead ? 'dead' : 'lose' });
  };

  const nhdLeave = () => {
    const c = charRef.current;
    setNhd(null);
    duelRef.current = null;
    if (!c) return;
    c.breakDelay = Math.max(c.breakDelay, 3);
    c.log.push({ age: Math.floor(c.age), tone: 'normal', text: tr('Bạn bước xuống Ngũ Hành Đài, về củng cố thêm. Năm tấm gương vẫn chờ.', "You step down from the Five Elements Platform to consolidate further. The five mirrors are still waiting.") });
    persist(true);
    rerender();
  };

  const nhdBuyPhu = () => {
    const c = charRef.current;
    if (!c) return;
    const price = sectSide(c) === 'trung' ? PHU_PRICE / 2 : PHU_PRICE;
    if (c.linhThach < price || (c.phu ?? 0) >= 3) return;
    money(c, -price);
    c.phu = (c.phu ?? 0) + 1;
    c.log.push({ age: Math.floor(c.age), tone: 'good', text: tr(`Sứ giả Thiên Cơ Các bán cho bạn một tấm Ngũ Hành Phù (-${price} linh thạch).`, `An envoy of Tianji Pavilion sells you a Five Elements Talisman (-${price} spirit stones).`) });
    persist(true);
    rerender();
  };

  const afterKiep = (bonus: number, blocked: number) => {
    const i = kiep;
    setKiep(null);
    const c = charRef.current;
    if (i === null || !c) return;
    // thiên kiếp phi thăng từ Độ Kiếp: hụt đạo nào thì kiếp trước (Hóa Thần trở lên) có thể ra đỡ, tối đa 3 đạo
    if (blocked >= 0 && blocked < 9 && !c.cosmos && c.realm === DO_KIEP_REALM) {
      setHoTro({ i, blocked });
      return;
    }
    finishKiep(c, i, bonus, blocked);
  };
  const finishKiep = (c: Character, i: number, bonus: number, blocked: number) => {
    c.kiepBonus = bonus;
    if (blocked >= 0) c.log.push({ age: Math.floor(c.age), tone: bonus >= 0 ? 'good' : 'bad', text: tr(`Bạn vận công đỡ được ${blocked}/9 đạo thiên lôi.`, `You channel your power and block ${blocked}/9 heavenly thunderbolts.`) });
    resolveNow(i);
  };
  const afterHoTro = (sent: PastSelf[]) => {
    const h = hoTro;
    setHoTro(null);
    const c = charRef.current;
    if (!h || !c) return;
    const blocked = Math.min(9, h.blocked + sent.length);
    if (sent.length) {
      c.log.push({ age: Math.floor(c.age), tone: 'good', text: tr(`${sent.map((p) => `Kiếp ${p.lifeNo} (${p.name})`).join(', ')} hiện về, đỡ thay ${sent.length} đạo thiên lôi.`, `${sent.map((p) => `Life ${p.lifeNo} (${p.name})`).join(', ')} returned and took ${sent.length} heavenly bolt(s) for you.`) });
      track('ho_tro', { mode: 'kiep', n: sent.length });
    }
    finishKiep(c, h.i, Math.round(((blocked - 4.5) / 9) * 0.3 * 100) / 100, blocked);
  };

  /** Chứng Đạo mới: kết thúc luồng, bỏ sự kiện đột phá đang chờ */
  const vanDaoEnd = (fn: (ch: Character, ctx: ReturnType<typeof makeCtx>) => string, tone: 'big' | 'bad') => {
    setVanDao(null);
    act((ch, out) => {
      pendingRef.current = null;
      const text = fn(ch, makeCtx(ch, out));
      ch.log.push({ age: Math.floor(ch.age), tone, text });
    });
  };
  const vanDaoLoi = (_b: number, blocked: number) => {
    const c = charRef.current;
    if (!c) return;
    // phó mặc số trời: để trời quyết định số đạo hụt
    const miss = blocked < 0 ? (rnd() < 0.55 ? 1 + Math.floor(rnd() * 3) : 4 + Math.floor(rnd() * 4)) : LOI_TOTAL - blocked;
    c.log.push({ age: Math.floor(c.age), tone: miss <= LOI_ALLOW ? 'good' : 'bad', text: tr(`Mười ba đạo lôi kiếp: bạn đỡ được ${LOI_TOTAL - miss}/${LOI_TOTAL} đạo.`, `Thirteen bolts of tribulation: you block ${LOI_TOTAL - miss}/${LOI_TOTAL}.`) });
    track('van_dao_loi', { miss });
    if (miss <= LOI_ALLOW) return vanDaoEnd((ch, ctx) => chungDao(ch, ctx), 'big');
    setVanDao({ phase: 'hodao', need: miss });
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
    seeHint('focus');
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
      const price = it ? itemPrice(c, it) : 0;
      if (!it || c.linhThach < price || soldOut(c, it)) return;
      money(c, -price);
      giveItem(c, id, true);
      if (it.minRealm >= RARE_STOCK_REALM) c.bought = [...(c.bought ?? []), id];
      out.push({ kind: 'buy', id: Math.random(), label: it.name });
      c.log.push({ age: Math.floor(c.age), tone: 'good', text: tr(`Mua ${it.name} ở phường thị. (-${fmt(price)} linh thạch)`, `Bought ${it.name} at the Market. (-${fmt(price)} spirit stones)`) });
    });

  const buyPill = (id: string) =>
    act((c, out) => {
      const p = PILLS.find((x) => x.id === id);
      const price = p ? pillPrice(c, id) : 0;
      if (!p || c.linhThach < price) return;
      money(c, -price);
      c.pillBuy = { ...(c.pillBuy ?? {}), [id]: (c.pillBuy?.[id] ?? 0) + 1 };
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

  // Điểm danh 7 ngày: nhận quà ngày hôm nay. Kiếp đang sống thì trao ngay, đang giữa hai kiếp thì để dành cho kiếp sau
  const checkin = async () => {
    if (!meta) return;
    const now = await serverNow();
    const day = vnDay();
    const base = bumpStreak(meta, day) ?? meta;
    if (checkinClaimed(base, day)) return;
    const n = checkinDay(base);
    const g = CHECKIN[n - 1];
    const hon = honActive(base);
    const c = charRef.current && !charRef.current.dead ? charRef.current : null;
    let m2: Meta = { ...base, checkin: day };
    let phuc = g.phuc ?? 0;
    if (g.hon) {
      if (hon) m2 = addHon(m2, g.hon, now);
      else phuc += g.honPhuc ?? 0;
    }
    if (phuc) m2 = { ...m2, phucDuyen: m2.phucDuyen + phuc };
    const it = g.rare ? checkinItem(g.rare, c) : null;
    const cash = g.money ? checkinMoney(g.money, c?.realm ?? 0) : 0;
    if (c) {
      act((ch) => {
        if (cash) money(ch, cash);
        if (g.tinh) ch.tinhHoa = (ch.tinhHoa ?? 0) + g.tinh;
        if (it) giveItem(ch, it.id, true);
        ch.log.push({ age: ch.age, tone: 'good', text: tr(`Quà điểm danh ngày ${n}: ${checkinLabel(g, hon, ch.realm).replace(/1 món (Cực phẩm|Hiếm)/, it ? it.name : '$&')}.`, `Day ${n} check-in gift: ${checkinLabel(g, hon, ch.realm).replace(/1 (Supreme|Rare) item/, it ? it.name : '$&')}.`) });
      });
    } else if (cash || it || g.tinh) {
      const cn = base.checkinNext ?? {};
      m2 = { ...m2, checkinNext: { money: (cn.money ?? 0) + cash || undefined, item: it?.id ?? cn.item, tinh: (cn.tinh ?? 0) + (g.tinh ?? 0) || undefined } };
    }
    track('checkin', { day: n, live: !!c });
    const label = checkinLabel(g, hon, c?.realm ?? 0);
    setCiGot({ day: n, text: it ? label.replace(/1 món (Cực phẩm|Hiếm)|1 (Supreme|Rare) item/, it.name) : label });
    setMeta(m2);
    saveMeta(user, m2).catch(() => {});
  };

  // Đan hồi hồn: đổi phúc duyên lấy Hồn lực, mỗi ngày tối đa vài viên
  const hoanHon = async (id: HonPillId) => {
    if (!meta) return;
    const pill = HON_PILLS.find((p) => p.id === id);
    const now = await serverNow();
    if (!pill) return;
    const used = honPillUsed(meta, now);
    const cost = honPillCost(pill.cost, used, pastDanTu(meta));
    if (meta.phucDuyen < cost) return;
    const day = honDay(now);
    const n = used + 1;
    const m2: Meta = { ...addHon(meta, pill.gain, now), phucDuyen: meta.phucDuyen - cost, honPill: { day, n } };
    track('hon_pill', { id, n, cost, hon: Math.round(m2.hon?.v ?? 0) });
    setMeta(m2);
    saveMeta(user, m2).catch(() => {});
  };

  const born = async (talents: string[], yearSec: number, gifts: string[] = [], gachaSpent = 0, base: Character | null = null, drink = false) => {
    if (!meta) return;
    // Luân Hồi Đạo: Kiếp Số từ 5 chỉ giữ một thiên phú lớn
    if (ksOneBig(ksOf(meta)) && talents.includes('tien_cot') && talents.includes('thien_menh')) talents = talents.filter((t) => t !== 'thien_menh');
    // Hồn lực và chén canh Mạnh Bà (từ kiếp 15), giờ lấy theo máy chủ
    const now = await serverNow();
    const lh = honActive(meta);
    let honV = honNow(meta, now);
    const rested = !!meta.hon && now - meta.hon.at >= 8 * 3600_000;
    const mb: Meta = lh ? manhBa(meta, drink) : meta;
    if (lh && drink) honV = Math.min(HON_MAX, honV + 30);
    // thiên phú thường trả bằng phúc duyên, thiên phú tà trả bằng nghiệp lực
    const tal = (id: string) => TALENTS.find((t) => t.id === id);
    const cost = talents.filter((id) => !tal(id)?.ta).reduce((s, id) => s + (tal(id)?.cost ?? 0), 0) + gachaSpent;
    const costTa = talents.filter((id) => tal(id)?.ta).reduce((s, id) => s + (tal(id)?.cost ?? 0), 0);
    const m2: Meta = { ...mb, phucDuyen: Math.max(0, meta.phucDuyen - cost), nghiep: Math.max(0, meta.nghiep - costTa), talents };
    if (base && !base.name.trim()) {
      const nv = genNameVi(base.gender);
      base = { ...base, name: nameOf(nv), nameVi: nv };
    }
    const c = newCharacter(m2, gifts, base ?? undefined);
    c.lang = lang();
    talentsRef.current = talents;
    lifeT0.current = Date.now();
    clearLaSo();
    track('life_start', { lifeNo: c.lifeNo, drink, talents: talents.length, gifts: gifts.length, picked: !!base });
    if ((c.kiepSo ?? 0) > 0) c.log.push({ age: 0, tone: 'big', text: tr(`Kiếp Số ${c.kiepSo} · ${KS_NAME[c.kiepSo ?? 0]}. Thiên đạo đã để mắt tới linh hồn này, kiếp nạn sẽ nặng hơn, phúc báo cũng dày hơn.`, `Calamity Count ${c.kiepSo} · ${KS_NAME[c.kiepSo ?? 0]}. The Heavenly Dao has its eye on this soul: calamities will be heavier, and blessings richer.`) });
    if ((c.kiepTich ?? 0) > 0) c.log.push({ age: 0, tone: 'good', text: tr(`Kiếp tích ${c.kiepTich}: những lần ngã trước cửa trời đã thành kinh nghiệm. Đột phá dễ hơn ${(c.kiepTich ?? 0) * 5}%.`, `Calamity Scars ${c.kiepTich}: past falls at Heaven's gate have become experience. Breakthroughs ${(c.kiepTich ?? 0) * 5}% easier.`) });
    if (lh) {
      applyHon(c, honV, rested && honV >= HON_MAX);
      if (drink) {
        c.tanHon = true;
        c.stats.khiVan = Math.min(100, c.stats.khiVan + 15);
        c.log.push({ age: 0, tone: 'good', text: tr('Bạn uống cạn chén canh Mạnh Bà. Kiếp trước tan như khói, linh hồn nhẹ bẫng. Khí vận +15, phúc duyên kiếp này +20%.', "You drain the bowl of Meng Po's soup. Your past life fades like smoke and your soul feels light as a feather. Luck +15, Fortune this life +20%.") });
      } else {
        c.log.push({ age: 0, tone: 'ta', text: tr(`Bạn hất đổ chén canh Mạnh Bà, mang theo ký ức mà đầu thai (${m2.noDrink} lần liền).`, `You knock over Meng Po's soup and are reborn with your memories intact (${m2.noDrink} times in a row).`) });
        if ((m2.noDrink ?? 0) >= CAU_HON_AT) {
          c.cauHon = true;
          c.log.push({ age: 0, tone: 'bad', text: tr('Sau lưng vang tiếng xích sắt. Địa phủ đã ghi tên bạn vào sổ nợ.', "Iron chains clank behind you. The underworld has entered your name in its book of debts.") });
        }
      }
    }
    // 3.2.0: quà điểm danh dành cho kiếp kế tiếp (linh thạch, ngọc bội)
    const cn = m2.checkinNext;
    if (cn) {
      if (cn.money) money(c, cn.money);
      if (cn.item) giveItem(c, cn.item, true);
      if (cn.tinh) c.tinhHoa = (c.tinhHoa ?? 0) + cn.tinh;
      const nm = cn.item ? ITEMS.find((x) => x.id === cn.item)?.name ?? '' : '';
      c.log.push({ age: 0, tone: 'good', text: tr(`Quà điểm danh: ${[cn.money ? `+${cn.money} linh thạch` : '', nm, cn.tinh ? `+${cn.tinh} tinh thiết` : ''].filter(Boolean).join(', ')}.`, `Check-in gift: ${[cn.money ? `+${cn.money} spirit stones` : '', nm, cn.tinh ? `+${cn.tinh} refined iron` : ''].filter(Boolean).join(', ')}.`) });
    }
    // rương kiếp trước, lời tiên tri, thần binh chỉ dùng cho một kiếp
    if (m2.xaLoi) {
      c.stats.tamMa = Math.min(100, c.stats.tamMa + 15);
      c.log.push({ age: 0, tone: 'bad', text: tr('Bạn sinh ra trong tay nắm chặt một viên xá lợi đen. Nghiệp chướng kiếp trước còn đó: tâm ma +15.', 'You are born clutching a black relic. Last life\'s karma lingers: heart demon +15.') });
    }
    const m3: Meta = { ...m2, xaLoi: false, talents: [], stash: null, prophecy: null, legend: null, checkinNext: undefined, hon: lh ? { v: Math.max(0, honV - HON_COST), at: now } : m2.hon };
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
    // kiếp đầu: chuyện thôi nôi tới ngay, người mới bấm lựa chọn đầu tiên trong vài giây (hướng dẫn thay bằng gợi ý đúng lúc)
    const open = openingEvent(c);
    if (open) {
      pendingRef.current = open;
      rerender();
    }
  };

  // ghi thù từ thư giang hồ: đang chơi thì ghi vào nhân vật, chưa đầu thai thì ghi vào hồ sơ
  const challenge = (player: string) => {
    const v = { player, name: '', items: [], why: tr(`@${player} từng khiến bạn ôm hận`, `@${player} once left you seething with hatred`) };
    const c = charRef.current;
    if (c && !c.dead) c.vendettas = [...(c.vendettas ?? []).filter((x) => x.player !== player), v].slice(-3);
    else if (meta) {
      const m2 = { ...meta, vendettas: [...(meta.vendettas ?? []).filter((x) => x.player !== player), v].slice(-3) };
      setMeta(m2);
      saveMeta(user, m2).catch(() => {});
    }
  };

  // tiền cược chiến thư được trả về: cộng vào nhân vật đang sống
  function claimPayouts() {
    const c = charRef.current;
    if (!userRef.current || !c || c.dead) return;
    payoutClaim(userRef.current)
      .then((ps) => {
        const ch0 = charRef.current;
        if (!ps.length) return;
        // phúc duyên và Hồn lực thuộc tài khoản: nhân vật vừa chết vẫn phải cộng
        const live = !!ch0 && !ch0.dead;
        const ch = ch0 ?? ({ log: [] } as unknown as Character);
        // quà từng trận lôi đài đã hiện ở thẻ kết quả trận, không bật bảng nữa
        const phuc = ps.filter((p) => p.kind === 'phuc' && !/^(Thắng lôi đài|Lôi đài)/.test(p.note));
        if (phuc.length) setGifts(phuc);
        for (const p of ps) {
          if (p.kind === 'hon') {
            const m0 = metaRef.current;
            const lh = honActive(m0);
            if (m0) {
              const m2 = lh ? addHon(m0, p.amount, Date.now()) : { ...m0, phucDuyen: (m0.phucDuyen ?? 0) + Math.round(p.amount / 2) };
              metaRef.current = m2;
              setMeta(m2);
              saveMeta(userRef.current, m2).catch(() => {});
            }
            ch.log.push({ age: Math.floor(ch.age), tone: 'big', text: lh ? tr(`${p.note}: +${p.amount} Hồn lực.`, `${p.note}: +${p.amount} Soul Power.`) : tr(`${p.note}: +${Math.round(p.amount / 2)} phúc duyên.`, `${p.note}: +${Math.round(p.amount / 2)} Fortune.`) });
            continue;
          }
          if (p.kind === 'phuc') {
            // quà của Thiên Đạo: phúc duyên giữ qua các kiếp
            const m0 = metaRef.current;
            if (m0) {
              const m2 = { ...m0, phucDuyen: (m0.phucDuyen ?? 0) + p.amount };
              metaRef.current = m2;
              setMeta(m2);
              saveMeta(userRef.current, m2).catch(() => {});
            }
            ch.log.push({ age: Math.floor(ch.age), tone: 'big', text: tr(`${p.note}: +${p.amount} phúc duyên.`, `${p.note}: +${p.amount} Fortune.`) });
            continue;
          }
          if (!live) continue;
          money(ch, p.amount);
          ch.log.push({ age: Math.floor(ch.age), tone: 'good', text: tr(`${p.note}: +${p.amount} linh thạch.`, `${p.note}: +${p.amount} spirit stones.`) });
        }
        if (!live) return;
        persist(true);
        rerender();
      })
      .catch(() => {});
  }

  const giangHo = (): GiangHoApi | null => {
    if (!user) return null;
    const c = charRef.current;
    const alive = c && !c.dead ? c : null;
    return {
      user,
      money: alive ? alive.linhThach : null,
      spend: (n, why) => {
        const ch = charRef.current;
        if (!ch || ch.dead || ch.linhThach < n) return false;
        if (n > 0) {
          money(ch, -n);
          ch.log.push({ age: Math.floor(ch.age), tone: 'normal', text: tr(`${why}: -${n} linh thạch.`, `${why}: -${n} spirit stones.`) });
          persist(true);
          rerender();
        }
        return true;
      },
      gain: (n, why) => {
        const ch = charRef.current;
        if (!ch || ch.dead || n <= 0) return;
        money(ch, n);
        ch.log.push({ age: Math.floor(ch.age), tone: 'good', text: tr(`${why}: +${n} linh thạch.`, `${why}: +${n} spirit stones.`) });
        persist(true);
        rerender();
      },
      foe: challenge,
      peace: (player) => {
        const ch = charRef.current;
        if (ch && !ch.dead) {
          ch.vendettas = (ch.vendettas ?? []).filter((v) => v.player !== player);
          dao(ch, 5);
          ch.log.push({ age: Math.floor(ch.age), tone: 'good', text: tr(`Bạn gửi lời hòa giải tới @${player}. Buông được mối thù, đạo tâm sáng thêm (+5 đạo tâm).`, `You send words of reconciliation to @${player}. Letting go of the feud, your Dao Heart shines brighter (+5 Dao Heart).`) });
          persist(true);
          rerender();
        }
        if (meta?.vendettas?.some((v) => v.player === player)) {
          const m2 = { ...meta, vendettas: meta.vendettas.filter((v) => v.player !== player) };
          setMeta(m2);
          saveMeta(user, m2).catch(() => {});
        }
      },
      hunt: (rival) => {
        const ch = charRef.current;
        if (!ch || ch.dead) return;
        ch.hunt = { rival, at: ch.age + 0.3 + Math.random() * 0.7 };
        ch.log.push({ age: Math.floor(ch.age), tone: 'normal', text: tr(`Bạn thuê người dò tung tích ${rival.name} (@${rival.player}). Trong vòng một năm sẽ chạm mặt.`, `You hire someone to track down ${rival.name} (@${rival.player}). You will cross paths within a year.`) });
        persist(true);
        rerender();
      },
      hunting: alive?.hunt?.rival.player ?? null,
      me: () => {
        const ch = charRef.current;
        return ch && !ch.dead ? toRival(user.username, ch) : null;
      },
      feud: meta?.feud ?? {},
      vendettas: Array.from(new Set([...(alive?.vendettas ?? []), ...(meta?.vendettas ?? [])].map((v) => v.player))),
    };
  };

  // đánh dấu đã xem mục mới trong Sổ Sinh Tử (e) hay Bảo khố (i)
  // cảnh phi thăng: chỉ khi vừa đổi từ chưa có cõi sang có cõi trong lúc chơi (không bật khi mở lại bản lưu)
  const curCos = charRef.current?.cosmos ?? null;
  const curLife = charRef.current?.lifeNo;
  useEffect(() => {
    if (phase !== 'play') return;
    if (cosSeen.current === undefined) {
      cosSeen.current = curCos;
      return;
    }
    if (!cosSeen.current && curCos) setAscend(curCos);
    cosSeen.current = curCos;
  }, [curCos, curLife, phase]);

  // cáo thị bản cập nhật: một lần cho mỗi bản, nhường hướng dẫn lần đầu
  const metaReady = !!meta;
  useEffect(() => {
    if (!metaReady || phase === 'loading' || tut || !needNotice(metaRef.current?.seenVer)) return;
    // người chưa đi kiếp nào: chưa cần đọc cáo thị, ghi nhận đã xem để bản sau mới hiện
    if ((metaRef.current?.lives ?? 0) === 0) {
      markSeenLocal();
      closeRel(CURRENT_VERSION);
    } else setRelOpen(true);
  }, [metaReady, phase, tut]);
  const closeRel = (v: string) => {
    setRelOpen(false);
    const m0 = metaRef.current;
    if (!m0 || m0.seenVer === v) return;
    const m2 = { ...m0, seenVer: v };
    metaRef.current = m2;
    setMeta(m2);
    saveMeta(user, m2).catch(() => {});
  };

  function seeBook(w: 'e' | 'i') {
    const m0 = metaRef.current;
    if (!m0) return;
    const m2 = markSeen(m0, w);
    if (m2.seenBook?.e === m0.seenBook?.e && m2.seenBook?.i === m0.seenBook?.i) return;
    metaRef.current = m2;
    setMeta(m2);
    saveMeta(user, m2).catch(() => {});
  }

  const finishLife = async (epitaph: string, note = '', bury = false, extra: { prophecy?: { id: string; text: string } | null; legendName?: string | null } = {}) => {
    const c = charRef.current;
    if (!c || !meta) return;
    trackMiles(c);
    const k = karmaOf(c);
    const ending = endingOf(c);
    track('life_end', { lifeNo: c.lifeNo, ending: ending.id, bury, epitaph: !!epitaph.trim() });
    // nhiệm vụ ngày
    const q = evalQuests(meta, c, !meta.endings?.[ending.id]);
    setQuestNews(q.newly);
    // thần binh truyền kiếp: đời nào cũng truyền thì mạnh dần
    const w = c.equipped.vu_khi;
    const legend = extra.legendName && w && !c.ascended ? { item: w, name: extra.legendName.slice(0, 40), lv: c.legend?.item === w ? c.legend.lv + 1 : 1 } : null;
    const petBook = c.pet && c.petKind && !(meta.petBook ?? []).includes(c.petKind) ? [...(meta.petBook ?? []), c.petKind] : meta.petBook;
    // truyền công: gửi phúc duyên cho một người chơi khác (ưu tiên huynh đệ kết nghĩa)
    if (c.truyenCong && user) {
      const bro = SOCIAL.cur.sworn[0] ?? null;
      await within(truyenCong(user, bro, c.name), 8000).catch(() => {});
    }
    // số liệu giang hồ cho Thiên thư Quyển II (chỉ cần sau Quy Nhất)
    const social = quyNhatDone(meta) || c.endTag === 'thoat_van_kiep' ? await within(loreSocial(user), 8000).catch(() => null) : null;
    const grave = {
      player_name: displayName(user),
      char_name: c.name,
      life_no: c.lifeNo,
      age: Math.floor(c.age),
      realm: realmLabel(c.realm, c.layer, c.cosmos),
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
        lookSeed: c.lookSeed,
        petKind: c.petKind,
        element: c.element,
        mount: c.mount,
        miles: c.miles ?? [],
        birthPlace: c.birthPlace,
        origin: c.origin,
        ascended: c.ascended,
        endTag: c.endTag,
        ending: endingOf(c).id,
        realm: c.realm,
        killer: c.killer ?? null,
        cosmos: c.cosmos ?? null,
        kiepSo: c.kiepSo ?? 0,
      },
    };
    // mạng chập chờn thì không để người chơi kẹt ở màn lập bia: quá 10 giây thì giữ bia lại, lần sau khắc tiếp
    await within(addMemorial(user, grave), 11000).catch(() => {
      if (user) addRetryGrave(grave);
    });
    // chơi thử: kiếp đáng ghi danh thì giữ bia lại, đăng ký xong sẽ khắc lên Nghĩa trang tu sĩ
    // khách: mời ngay từ kiếp đầu (3 kiếp đầu, rồi cứ 5 kiếp một lần), không đợi tới Kim Đan; mời ghi danh đang được bấm 42%
    if (!user) {
      addPendingGrave(grave);
      const worthy = worthGhiDanh(c);
      if (worthy || c.lifeNo <= 3 || c.lifeNo % 5 === 0) {
        setGhiDanh({ name: c.name, realm: grave.realm, age: grave.age, ascended: !!c.ascended, worthy });
        track('ghi_danh_show', { lifeNo: c.lifeNo, realm: c.realm, worthy });
      }
    }
    // kết cục lần đầu mở: hỏi máy chủ xem có phải người đầu tiên trong giang hồ không
    const freshIds = Array.from(new Set([ending.id, ...alsoEndings(c)])).filter((id) => !meta.endings?.[id]);
    if (freshIds.length)
      endingFirst(
        user,
        freshIds,
        freshIds.map((id) => ENDINGS.find((e) => e.id === id)?.name ?? id),
      )
        .then((firsts) => {
          if (firsts.length) track('ending_first', { ids: firsts.join(',') });
        })
        .catch(() => {});
    // nhiệm vụ ngày xong thì hồn cũng được hồi thêm
    const metaH = q.newly.length && honActive(meta) ? addHon(meta, q.newly.length * QUEST_HON, Date.now()) : meta;
    const m: Meta = {
      ...metaH,
      daily: q.daily,
      prophecy: extra.prophecy ?? null,
      legend,
      vendettas: (c.vendettas ?? []).slice(-3),
      petBook,
      phucDuyen: meta.phucDuyen + k.phuc + q.reward + (c.goalDone ? (newbieGoal(c)?.reward ?? 0) : 0),
      nghiep: k.nghiep > 0 ? meta.nghiep + k.nghiep : Math.max(0, meta.nghiep - 5),
      lives: meta.lives + 1,
      talents: [],
      enemy: c.daoTam < -30 ? c.enemy : null,
      daoBook: c.daoSwitch && !(meta.daoBook ?? []).includes(c.daoSwitch) ? [...(meta.daoBook ?? []), c.daoSwitch] : meta.daoBook,
      endings: [ending.id, ...alsoEndings(c)].reduce((e, id) => ({ ...e, [id]: (e[id] ?? 0) + 1 }), { ...(meta.endings ?? {}) } as Record<string, number>),
      past: {
        name: c.name,
        lifeNo: c.lifeNo,
        age: Math.floor(c.age),
        realm: c.realm,
        realmName: c.realm === 0 ? tr('Phàm nhân', "Mortal") : realmLabel(c.realm, c.layer, c.cosmos),
        daoTam: c.daoTam,
        cause: c.cause,
        path: c.path ? PATHS[c.path].name : null,
        partner: c.partner,
      },
      stash:
        bury && !c.ascended && c.endTag !== 'xuyen_khong'
          ? {
              from: c.name,
              lifeNo: c.lifeNo,
              money: Math.round(c.linhThach * 0.3),
              item: c.equipped.phu_kien ?? (legend ? null : c.equipped.vu_khi) ?? null,
              note,
              place: rnd() < 0.5 ? tr('gốc đa đầu làng', "under the banyan at the village gate") : rnd() < 0.5 ? tr('dưới nền ngôi miếu cũ', "beneath the floor of the old temple") : tr('bên bờ suối sau núi', "by the stream behind the mountain"),
            }
          : null,
    };
    // thành tựu dài hạn
    // Luân Hồi Đạo: kiếp tích cho người kẹt Độ Kiếp; đánh lui Câu hồn sứ giả thì xóa nợ không uống canh
    m.kiepTich = nextKiepTich(m, c);
    // Xá Lợi Đen: nghiệp chướng theo sang kiếp sau
    if (ending.id === 'xa_loi_den') {
      m.xaLoi = true;
      m.nghiep += 20;
    }
    if (c.qf?.cauHonWin) m.noDrink = 0;
    const car = updateCareer(m, c);
    m.career = car.career;
    if (car.newly.length) {
      m.achievements = [...(m.achievements ?? []), ...car.newly.map((a) => a.id)];
      m.phucDuyen += car.newly.reduce((x, a) => x + a.reward, 0);
    }
    setAchNews(car.newly.map((a) => tr(`${a.name} (+${a.reward} phúc)`, `${a.name} (+${a.reward} Fortune)`)));
    // Vạn Kiếp Quy Nhất lần đầu: thưởng một lần cho mỗi tài khoản (cả người đã đạt từ trước)
    let quyNote = '';
    if (quyNhatDone(m) && !m.quyThuong) {
      m.quyThuong = true;
      m.phucDuyen += QUY_NHAT_PHUC;
      quyNote = tr(`Vạn Kiếp Quy Nhất: +${QUY_NHAT_PHUC} phúc, đeo chuông vàng qua mọi kiếp`, `Ten Thousand Lives Return to One: +${QUY_NHAT_PHUC} Fortune, wear the golden bell through every life`);
    }
    if (c.qf?.chuongWin) m.chuongWin = true;
    // Thiên thư: mảnh ký ức mới
    const lore = newLore(m, c, car.career, social);
    if (lore.length) m.lore = [...(m.lore ?? []), ...lore.map((f) => f.id)];
    setLoreNews(lore.map((f) => f.title));
    if (quyNote) setAchNews((a) => [quyNote, ...a]);
    setMeta(m);
    await within(saveMeta(user, m), 6000).catch(() => {});
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
        <p>{tr("Đang mở luân hồi đài...", "Opening the reincarnation platform...")}</p>
      </main>
    );
  }

  if (phase === 'birth') {
    return (
      <main className="app">
        <header className="topbar">
          <div className="topbar-row">
            <span className="age-big" style={{ fontSize: 28 }}>
              
              {tr("Luân hồi", "Reincarnation")}
            </span>
            <span className="meta">
              {user ? (
                tr(`Đạo hữu ${displayName(user)}`, `Fellow Daoist ${displayName(user)}`)
              ) : (
                <>
                  
                  {tr("Đang chơi thử · ", "Playing as guest · ")}<Link href="/dang-nhap?next=/choi">{tr("Đăng nhập", "Log in")}</Link>
                </>
              )}
            </span>
            <Link href="/" className="icon-btn" style={{ textDecoration: 'none', display: 'grid', placeItems: 'center' }} aria-label={tr("Về trang đầu", "Back to home")}>
              ‹
            </Link>
          </div>
        </header>
        {loreNews.length > 0 && (
          <Link href="/so-sinh-tu#thien-thu" className="quest-news lore" style={{ display: 'block', textDecoration: 'none' }}>
            
            {tr("📜 Thiên thư mở thêm: ", "📜 Heavenly Tome unlocked: ")}<b>{loreNews.join(', ')}</b>{tr(" · chạm để đọc", " · tap to read")}
          </Link>
        )}
        {achNews.length > 0 && (
          <p className="quest-news ach">
            
            {tr("🏆 Thành tựu mới: ", "🏆 New achievement: ")}<b>{achNews.join(', ')}</b>
          </p>
        )}
        {questNews.length > 0 && (
          <p className="quest-news">
            
            {tr("Nhiệm vụ vừa hoàn thành: ", "Quest completed: ")}<b>{questNews.map(questName).join(', ')}</b>
          </p>
        )}
        {sheet === 'mail' && mail && giangHo() && <GiangHoSheet mail={mail} api={giangHo()!} onClose={() => setSheet(null)} />}
        {ciOpen && meta && <CheckinPop meta={meta} realm={charRef.current && !charRef.current.dead ? charRef.current.realm : 0} got={ciGot} onClaim={checkin} onClose={() => setCiOpen(false)} />}
        {sheet === 'kho' && (
          <BaoKhoSheet
            book={meta.itemBook ?? []}
            onClose={() => {
              seeBook('i');
              setSheet(null);
            }}
          />
        )}
        {(setScreen('dau_thai'), null)}
        <BirthPanel meta={meta} onCheckin={meta.lives > 0 ? () => setCiOpen(true) : undefined} onHoanHon={hoanHon} onBorn={born} onKho={() => setSheet('kho')} onSoSinhTu={() => seeBook('e')} />
        {relOpen && !ghiDanh && <ReleaseNotice onClose={closeRel} />}
        {ghiDanh && <GhiDanh {...ghiDanh} lives={meta.lives} onClose={() => setGhiDanh(null)} />}
      </main>
    );
  }

  const c = charRef.current!;
  const pending = pendingRef.current;
  setScreen(c.dead ? 'chet' : pending ? 'su_kien' : sheet ? `bang_${sheet}` : 'choi');
  setLifeCtx({ life: c.lifeNo, age: Math.floor(c.age) });
  if (c.dead && deathSeen.current !== c.lifeNo) {
    deathSeen.current = c.lifeNo;
    track('death', { lifeNo: c.lifeNo, realm: c.realm, age: Math.floor(c.age), path: c.path, cosmos: c.cosmos ?? null, endTag: c.endTag ?? null, ending: endingOf(c).id, killer: c.killer ?? null, min: lifeT0.current ? Math.round((Date.now() - lifeT0.current) / 6000) / 10 : null });
  }
  const battleNow = duelRef.current ?? ambushRef.current ?? (c.focus === 'tru_yeu' && c.age >= 10 && battleRef.current?.m.id === c.huntTarget ? battleRef.current : null);
  const paused = !running || !!pending || sheet !== null || ciOpen || c.dead;
  const season = seasonOf(c.age);
  const omenIcon = omenToday().icon;
  const stats = collectStats(meta);
  const nb = unseen(meta);
  const newBook = nb.endings || nb.items;
  const yearPct = (c.age % 1) * 100;

  return (
    <main className={`game ${pending && !c.dead ? 'has-event' : ''}`}>
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big">{Math.floor(c.age)}</span>
          <span className="meta">
            {user && <TitleBadge title={titles[titleKey(user.username, c.lifeNo)]} />}
            
            {tr("tuổi · ", "yrs · ")}{SEASONS[season]}{tr(" · Kiếp ", " · Life ")}{c.lifeNo}
            {c.birthPlace ? ` · ${c.birthPlace.split(', ').pop()}` : ''}
            <br />
            <b>{fmt(c.linhThach)}</b>{tr(" linh thạch · ", " spirit stones · ")}{wealthTier(c).name}
            {c.income ? tr(` · +${c.income}/năm`, ` · +${c.income}/yr`) : ''}
            {newbieGoal(c) && (
              <>
                <br />
                <span className={`newbie-goal ${c.goalDone ? 'done' : ''}`}>
                  {c.goalDone ? '✓ ' : ''}{tr("Mục tiêu kiếp ", "Goal for life ")}{c.lifeNo}: {newbieGoal(c)!.name} (+{newbieGoal(c)!.reward}{tr(" phúc)", " Fortune)")}
                </span>
              </>
            )}
          </span>
          <div className="top-icons">
            <button className="icon-btn today-btn" onClick={() => setSheet('today')} aria-label={tr("Thiên tượng và nhiệm vụ hôm nay", "Today's omens and quests")}>
              {omenIcon}
            </button>
            {user && (
              <button
                className="icon-btn mail-btn"
                onClick={() => {
                  listMail(user).then((ls) => {
                    setMail(ls);
                    setUnread(0);
                  });
                  setSheet('mail');
                }}
                aria-label={tr(`Giang hồ${unread ? tr(`, ${unread} thư mới`, `, ${unread} new letters`) : ''}`, `Jianghu${unread ? tr(`, ${unread} thư mới`, `, ${unread} new letters`) : ''}`)}
              >
                ✉{unread > 0 && <span className="dot">{unread}</span>}
              </button>
            )}
            <MusicToggle battle={!!duelRef.current || !!ambushRef.current || (c.focus === 'tru_yeu' && c.age >= 10 && !!c.huntTarget && !c.dead)} />
            <button className="icon-btn menu-btn" onClick={() => setSheet('menu')} aria-label={tr(`Mở menu${newBook ? tr(', có mục mới trong Sổ Sinh Tử hoặc Bảo khố', ", new entries in the Book of Life and Death or Treasury") : ''}`, `Open menu${newBook ? tr(', có mục mới trong Sổ Sinh Tử hoặc Bảo khố', ", new entries in the Book of Life and Death or Treasury") : ''}`)}>
              ≡{newBook && <span className="dot" aria-hidden="true" />}
            </button>
          </div>
        </div>
        <div className="year-bar" aria-hidden="true">
          <div style={{ width: `${yearPct}%` }} />
        </div>
        {youthPace(c) > 1 && <small className="youth-tag">{c.age < 16 ? tr(`Tuổi thơ trôi nhanh ×${youthPace(c)}`, `Childhood flies by ×${youthPace(c)}`) : tr(`Kiếp đầu trôi nhanh ×${youthPace(c)}`, `Early lives fly by ×${youthPace(c)}`)}</small>}
        <div className="speeds">
          <button className="play" onClick={() => setRunning(!running)} aria-label={running ? tr('Tạm dừng', "Pause") : tr('Tiếp tục', "Resume")} disabled={!!pending || c.dead}>
            {running ? '❚❚' : '▶'}
          </button>
          {SPEEDS.map((s) => (
            <button
              key={s}
              className={speed === s ? 'on' : ''}
              onClick={() => {
                setSpeed(s);
                setRunning(true);
                if (s > 1) seeHint('speed');
              }}
              aria-pressed={speed === s}
            >
              {s}×
            </button>
          ))}
          <button className="next" onClick={skipAhead} disabled={!!pending || c.dead} aria-label={tr("Tua tới sự kiện kế tiếp", "Skip to next event")}>
            »
          </button>
        </div>
      </header>

      <section className="stage">
        <Scene
          c={c}
          fx={fx}
          paused={paused}
          season={season}
          battle={battleNow}
        />
        {!battleNow && <NhdMirror c={c} onOpen={() => setNhdPeek(true)} />}
        <button
          className="strip-btn"
          onClick={(e) => ((e.target as HTMLElement).closest('.cult.wait') ? setNhdPeek(true) : setSheet('info'))}
          aria-label={tr("Xem bảng chỉ số nhân vật", "View character stats")}
        >
          <StageStrip c={c} compact={!!pending && !c.dead} wait={waiting(c)} />
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
            <OverworkBar c={c} />
            <FocusGrid c={c} onPick={pickFocus} />
            <div className="dock-actions">
              <button className="btn btn-dark" onClick={() => setSheet('shop')} disabled={c.dead}>
                
                {tr("Phường thị", "Market")}
              </button>
              <button
                className="btn btn-dark"
                onClick={() => {
                  setBagTab('tui');
                  setSheet('bag');
                }}
                disabled={c.dead}
              >
                
                {tr("Túi đồ", "Inventory")}
              </button>
              <button className="btn btn-jade" onClick={() => setSheet('bequan')} disabled={c.dead}>
                
                {tr("Bế quan", "Seclusion")}
              </button>
            </div>
          </div>
        )}
      </footer>

      {sheet === 'shop' && <ShopSheet c={c} onBuyItem={buyItem} onBuyPill={buyPill} onClose={() => setSheet(null)} />}
      {sheet === 'bag' && <BagSheet c={c} book={meta.itemBook ?? []} startTab={bagTab} onSeen={() => seeBook('i')} onEquip={equip} onUsePill={takePill} onSmelt={(id) => act((ch, out) => { const t = smelt(ch, id, makeCtx(ch, out)); if (t) ch.log.push({ age: Math.floor(ch.age), tone: 'normal', text: t }); })} onSell={(id) => act((ch, out) => { const t = sell(ch, id, makeCtx(ch, out)); if (t) ch.log.push({ age: Math.floor(ch.age), tone: 'normal', text: t }); })} onBuy={(n) => act((ch, out) => { const t = buyTinh(ch, n, makeCtx(ch, out)); if (t) { ch.log.push({ age: Math.floor(ch.age), tone: 'normal', text: t }); track('buy_tinh', { n }); } })} onForge={(slot) => {
            let r: ReturnType<typeof forge> = null;
            act((ch, out) => {
              r = forge(ch, makeCtx(ch, out), slot);
              if (r) {
                ch.log.push({ age: Math.floor(ch.age), tone: r.kind === 'ok' ? 'good' : 'bad', text: r.text });
                track('forge', { kind: r.kind, lv: r.lv, slot });
              }
            });
            return r;
          }} onClose={() => setSheet(null)} />}
      {sheet === 'bequan' && <BeQuanSheet c={c} onGo={beQuan} onClose={() => setSheet(null)} />}
      {sheet === 'info' && (
        <Sheet title={c.name} onClose={() => setSheet(null)}>
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <Radar axes={charAxes(c.stats, c.lifespan, wealthScore(c.linhThach, c.income))} size={250} color={c.daoTam <= -30 ? '#a8303a' : c.daoTam >= 30 ? '#3d6fb0' : '#2f6b5a'} />
          </div>
          <p className="note" style={{ textAlign: 'center', marginTop: 0 }}>
            {c.linhCan} · {c.origin} · {c.birthPlace}
            {c.gifts?.length ? tr(` · Thiên phú: ${c.gifts.map((g) => giftOf(g)?.name).join(', ')}`, ` · Talent: ${c.gifts.map((g) => giftOf(g)?.name).join(', ')}`) : ''}
            {c.sect ? tr(` · ${rankName(c)} ${c.sect} (tu luyện +${Math.round((sectCultMul(c) - 1) * 100)}%)`, ` · ${rankName(c)} of ${nameOf(c.sect)} (cultivation +${Math.round((sectCultMul(c) - 1) * 100)}%)`) : ''}
          </p>
          <StatsPanel c={c} />
        </Sheet>
      )}
      {sheet === 'today' && <HookSheet meta={meta} onClose={() => setSheet(null)} />}
      {sheet === 'mail' && mail && giangHo() && <GiangHoSheet mail={mail} api={giangHo()!} onClose={() => setSheet(null)} />}
        {ciOpen && meta && <CheckinPop meta={meta} realm={charRef.current && !charRef.current.dead ? charRef.current.realm : 0} got={ciGot} onClaim={checkin} onClose={() => setCiOpen(false)} />}
      {sheet === 'hunt' && <HuntSheet c={c} onPick={pickMonster} onToggleFlee={toggleFlee} onClose={() => setSheet(null)} />}
      {sheet === 'menu' && (
        <Sheet title="Menu" onClose={() => setSheet(null)}>
          <div className="menu">
            <LoiDaiButton onClick={() => persist(true)} />
            <Link className="btn" href="/" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
              
              {tr("Trang đầu", "Home")}
            </Link>
            <Link className="btn btn-red" href="/bang-xep-hang" onClick={() => persist(true)} style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
              
              {tr("Bảng xếp hạng", "Leaderboard")}
            </Link>
            <Link className="btn" href="/nghia-trang" onClick={() => persist(true)} style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
              
              {tr("Nghĩa trang", "Cemetery")}
            </Link>
            <Link
              className="btn"
              href="/so-sinh-tu"
              onClick={() => {
                seeBook('e');
                persist(true);
              }}
              style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}
            >
              
              {tr("Sổ Sinh Tử ", "Book of Life and Death ")}{stats.endings}/{stats.endingsTotal}
              {nb.endings && <span className="new-tag">{tr("mới", "new")}</span>}
            </Link>
            <button
              className="btn"
              onClick={() => {
                setBagTab('kho');
                setSheet('bag');
              }}
              disabled={c.dead}
            >
              
              {tr("Bảo khố ", "Treasury ")}{stats.items}/{stats.itemsTotal}
              {nb.items && <span className="new-tag">{tr("mới", "new")}</span>}
            </button>
            <button
              className="btn"
              onClick={() => {
                setSheet(null);
                setTut(true);
              }}
            >
              
              {tr("Hướng dẫn chơi", "How to play")}
            </button>
            <Link className="btn" href="/cap-nhat" onClick={() => persist(true)} style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
              
              {tr("Lịch sử cập nhật · bản ", "Update history · version ")}{CURRENT_VERSION}
            </Link>
            <button
              className="btn"
              onClick={() => {
                persist(true);
                setLang(lang() === 'en' ? 'vi' : 'en');
              }}
            >
              {lang() === 'en' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
            </button>
            <Link className="btn btn-jade" href="/gop-y" onClick={() => persist(true)} style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
              
              {tr("Góp ý tính năng", "Feature requests")}
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
                
                {tr("Đăng xuất (", "Log out (")}{displayName(user)})
              </button>
            ) : (
              <Link className="btn btn-red" href="/dang-nhap" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                
                {tr("Đăng nhập để lưu lên mây", "Log in to save to the cloud")}
              </Link>
            )}
          </div>
        </Sheet>
      )}
      {c.dead && <DeathSheet c={c} meta={meta} karma={karmaOf(c)} isNew={!meta.endings?.[endingOf(c).id]} onDone={finishLife} />}
      {(() => {
        if (tut || c.dead || sheet !== null || kiep !== null || hoTro || vanDao || nhd || duelWarn || duelRef.current || ambushRef.current) return null;
        const h = nextHint(hints, !!pending, c.age);
        return h ? <CoachHint key={h.k} sel={h.sel} text={h.text} top={h.top} onOk={() => seeHint(h.k)} /> : null;
      })()}
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
      {find && (
        <button
          key={find.id + find.n}
          className={`find-toast r${find.rare}`}
          onAnimationEnd={() => setFind(null)}
          onClick={() => {
            setFind(null);
            setBagTab('kho');
            setSheet('bag');
          }}
        >
          <small>{tr("Bảo khố +1", "Treasury +1")}</small>
          <b>{find.name}</b>
          <small>
            {find.n}/{HIDDEN_ITEMS.length}{tr(" · chạm để xem", " · tap to view")}
          </small>
        </button>
      )}
      {duelWarn && !c.dead && (
        <DuelWarning
          me={c}
          foe={duelWarn}
          fleeChance={duelFlee(c, duelWarn)}
          canBefriend={!!duelWarn.sworn || duelWarn.rel === 'yeu' || ['sinh', 'duoc_sinh'].includes(elemRel(elementOf(c), elementOf(duelWarn.rival)))}
          onPick={pickDuelAction}
        />
      )}
      {relOpen && !c.dead && <ReleaseNotice onClose={closeRel} />}
      {ascend && !c.dead && <AscendScene c={c} cos={ascend} onDone={() => setAscend(null)} />}
      {gifts && !relOpen && <GiftNotice gifts={gifts} onClose={() => setGifts(null)} />}
      {nhdPeek && !nhd && (
        <NguHanhDai c={c} view="rules" tell="cong" preview onFight={() => {}} onBuyPhu={() => {}} onLeave={() => setNhdPeek(false)} onNext={() => {}} onRules={() => setNhdPeek(false)} />
      )}
      {nhd?.view === 'hodao' && <HoTroScene c={c} mode="nhd" max={1} bg={arenaBg(c, nhdOf(c).won)} onDone={nhdHoTro} />}
      {hoTro && !c.dead && <HoTroScene c={c} mode="kiep" max={Math.min(3, 9 - hoTro.blocked)} missed={9 - hoTro.blocked} onDone={afterHoTro} />}
      {nhd && nhd.view !== 'fight' && nhd.view !== 'hodao' && (
        <NguHanhDai
          key={`${nhdOf(c).won}-${nhd.view}`}
          c={c}
          view={nhd.view}
          tell={nhd.tell}
          msg={nhd.msg}
          end={nhd.end}
          onFight={nhdFight}
          onBuyPhu={nhdBuyPhu}
          onLeave={nhdLeave}
          onNext={nhdNext}
          onRules={() => setNhd({ ...nhd, view: nhd.view === 'rules' ? 'prep' : 'rules' })}
        />
      )}
      {vanDao?.phase === 'tu' && !c.dead && (
        <TuKiepOverlay
          c={c}
          rnd={rnd}
          onPass={() => setVanDao({ phase: 'loi' })}
          onFail={(name) => {
            track('van_dao_fail', { kiep: name });
            vanDaoEnd((ch, ctx) => failVanDao(ch, ctx, name), 'bad');
          }}
        />
      )}
      {vanDao?.phase === 'loi' && !c.dead && <TribulationOverlay realmName={tr('Chứng Đạo', 'Attaining the Dao')} title={tr('MƯỜI BA ĐẠO LÔI KIẾP', 'THIRTEEN BOLTS OF TRIBULATION')} total={LOI_TOTAL} bg="/bg/loi-dinh.png" onDone={vanDaoLoi} c={c} />}
      {vanDao?.phase === 'hodao' && !c.dead && (
        <HoDaoScene
          c={c}
          need={vanDao.need ?? 4}
          onDone={(saved) => {
            track('van_dao_ho', { saved });
            vanDaoEnd((ch, ctx) => (saved ? chungDao(ch, ctx, true) : daoKhon(ch)), saved ? 'big' : 'bad');
          }}
        />
      )}
      {kiep !== null && !c.dead && (
        <TribulationOverlay
          realmName={c.realm + 1 > 11 ? tr('Chứng Đạo', "Attaining the Dao") : c.realm + 1 === 8 ? (c.daoTam <= -40 || c.path === 'ma' ? tr('Ma Giới', "Demon Realm") : c.daoTam < 20 ? tr('Thái Hư', "Great Void") : tr('Phi Thăng', "Ascension")) : realmName(c.realm + 1, c.cosmos)}
          onDone={afterKiep}
          c={c}
        />
      )}
    </main>
  );
}
