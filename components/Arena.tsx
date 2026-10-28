'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sprite from '@/components/Sprite';
import Podium from '@/components/Podium';
import LoiDaiMatch from '@/components/LoiDaiMatch';
import type { Player } from '@/lib/auth';
import { PATHS, realmLabel } from '@/lib/game/data';
import { foeChar, foeStats } from '@/lib/game/duel';
import { ELEMENTS, elementOf } from '@/lib/game/nguhanh';
import type { RivalChar } from '@/lib/game/types';
import { fitsRule, ruleOf, vnDate, type ArenaRule } from '@/lib/game/arena';
import { ARENA_TIERS, tierOfPts } from '@/lib/game/phiKiem';
import { track } from '@/lib/track';
import { arena2State, arenaCandidates, arenaDraw, arenaPick, arenaShadow, toRival, type Arena2State } from '@/lib/social';
import { tr } from '@/lib/i18n';

export const ARENA_TURNS = 3;

/** Thẻ một bóng: hình, cảnh giới, con đường, bản mệnh, chỉ số */
function ShadowCard({ r, on, onPick, small, rank, rule, vert }: { r: RivalChar; on?: boolean; onPick?: () => void; small?: boolean; rank?: number; rule?: ArenaRule; vert?: boolean }) {
  const s = foeStats(r);
  const el = elementOf(r);
  const body = (
    <>
      {rank !== undefined && <span className={`sc-rank r${rank}`}>{rank === 1 ? tr('Mạnh nhất', "Strongest") : tr(`Hạng ${rank}`, `Rank ${rank}`)}</span>}
      <span className="sc-fig">
        <Sprite c={foeChar(r)} size={vert ? 84 : small ? 56 : 72} />
      </span>
      <span className="sc-info">
        <span className="sc-tags">
          <i className={r.alive ? 'live' : 'past'}>{r.alive ? tr('Nhân vật đang chơi', "Current character") : tr(`Kiếp thứ ${r.lifeNo ?? 1} của bạn`, `Your life #${r.lifeNo ?? 1}`)}</i>
          {rule && fitsRule(r, rule) && <i className="fit">{tr("Hợp luật hôm nay", "Fits today's rule")}</i>}
        </span>
        <b>{r.name}</b>
        <small>{r.realm === 0 ? tr('Phàm nhân', "Mortal") : realmLabel(r.realm, r.layer, r.cosmos)}</small>
        <small>
          {r.path ? PATHS[r.path].name : tr('Chưa chọn đường', "No Path yet")}{tr(" · Mệnh ", " · Natal ")}{ELEMENTS[el].name} · {r.age}{tr(" tuổi", " yrs")}
        </small>
        <span className="sc-stats">
          <i>{tr("Công ", "Atk ")}{s.atk}</i>
          <i>{tr("Thủ ", "Def ")}{s.def}</i>
          <i>{tr("Huyết ", "HP ")}{s.hp}</i>
        </span>
      </span>
    </>
  );
  return onPick ? (
    <button type="button" className={`shadow-card ${on ? 'on' : ''} ${vert ? 'vert' : ''}`} onClick={onPick} aria-pressed={on}>
      {body}
    </button>
  ) : (
    <div className={`shadow-card ${small ? 'small' : ''}`}>{body}</div>
  );
}

/** Băng rôn luật hôm nay + lịch 7 ngày */
export function RuleBanner({ compact }: { compact?: boolean }) {
  const today = ruleOf();
  const week = Array.from({ length: 7 }, (_, i) => ({ d: vnDate(i), r: ruleOf(vnDate(i)) }));
  return (
    <section className="rule-banner">
      <small>{tr("Luật lôi đài hôm nay · ngày ", "Today's arena rule · day ")}{today.day}</small>
      <b>{today.name}</b>
      <p>{today.desc}</p>
      {!compact && (
        <ol className="rule-week" aria-label={tr("Luật 7 ngày tới", "Rules for the next 7 days")}>
          {week.map((w, i) => (
            <li key={w.d} className={i === 0 ? 'today' : ''}>
              <small>{i === 0 ? tr('Hôm nay', "Today") : i === 1 ? 'Mai' : `${w.d.slice(8, 10)}/${w.d.slice(5, 7)}`}</small>
              <span>{w.r.name}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

const STAGE_BGS = ['tien', 'ma', 'hu'].flatMap((c) => ['kim', 'moc', 'thuy', 'hoa', 'tho'].map((e) => `/bg/nhd-${c}-${e}.png`));

/**
 * Lôi đài Phi Kiếm (3.2.0): một chạm "Ra đài" là tự lấy bóng mạnh nhất, rút đối thủ, vào trận 25 giây.
 * Mỗi ngày 3 lượt. Thắng +3 điểm, thua +1. Điểm tính lại mỗi thứ Hai, top 3 lên bục.
 */
export default function Arena({ user }: { user: Player | null }) {
  const [st, setSt] = useState<Arena2State | null>(null);
  const [cands, setCands] = useState<RivalChar[] | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [picking, setPicking] = useState(false);
  const [tab, setTab] = useState<'top' | 'thu' | 'how'>('top');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [match, setMatch] = useState<{ me: RivalChar; foe: RivalChar; opp: string; revenge: number | null; leftAfter: number; key: number } | null>(null);
  const rule = ruleOf();
  const load = useCallback(() => {
    arena2State(user)
      .then(setSt)
      .catch(() => setSt(null));
  }, [user]);
  useEffect(() => {
    load();
  }, [load]);
  const champ = useMemo(() => (st?.me?.champ && user ? toRival(user.username, st.me.champ) : null), [st, user]);
  // giữ theo ngày: qua nửa đêm thì bóng và lượt của hôm qua không còn tính
  const champRef = useRef<{ day: string; c: RivalChar | null }>({ day: vnDate(), c: null });
  const usedRef = useRef<{ day: string; n: number }>({ day: vnDate(), n: 0 });
  const today = vnDate();
  if (champRef.current.day !== today) champRef.current = { day: today, c: null };
  if (usedRef.current.day !== today) usedRef.current = { day: today, n: 0 };
  if (champ) champRef.current.c = champ;
  if (st?.me) usedRef.current.n = Math.max(usedRef.current.n, st.me.used);
  useEffect(() => {
    if (user && st?.me && !champ && cands === null) arenaCandidates(user).then(setCands);
  }, [user, st, champ, cands]);

  /** Khóa một bóng cho cả ngày; không chỉ định thì lấy kiếp mạnh nhất */
  async function lockChamp(c?: RivalChar): Promise<RivalChar | null> {
    if (!user) return null;
    let target = c;
    if (!target) {
      const list = cands ?? (await arenaCandidates(user));
      if (!cands) setCands(list);
      target = list[0];
    }
    if (!target) {
      setErr(tr('Bạn chưa có kiếp nào. Sống trọn một kiếp rồi quay lại lôi đài.', "You have no lives yet. Live a full life, then come back to the arena."));
      return null;
    }
    const r = await arenaPick(user, target.lifeId ?? 0);
    if (!r || (r.error && r.error !== 'LOCKED')) {
      setErr(tr('Chưa chọn được bóng, thử lại sau.', "Couldn't pick a shadow, try again later."));
      return null;
    }
    const ch = toRival(user.username, r.champ) ?? target;
    champRef.current = { day: vnDate(), c: ch };
    return ch;
  }

  /** Ra đài: một chạm là vào trận */
  async function raDai() {
    if (!user || busy) return;
    setBusy('go');
    setErr(null);
    track('arena_go', { hasChamp: !!champRef.current.c });
    const ch = champRef.current.c ?? (await lockChamp());
    if (!ch) return setBusy(null);
    const r = await arenaDraw(user);
    setBusy(null);
    if (!r || r.error || !r.opp || !r.shadow) {
      setErr(r?.error === 'NO_TURNS' ? tr('Hôm nay đã đánh đủ 3 trận. Mai lôi đài mở lại với luật mới.', "You've fought all 3 matches today. The arena reopens tomorrow with a new rule.") : r?.error === 'NO_OPP' ? tr('Chưa có đối thủ nào để rút.', "No opponents to draw yet.") : tr('Lôi đài đang đông, thử lại sau.', "The arena is crowded, try again later."));
      load();
      return;
    }
    track('arena_draw');
    const left = Math.max(0, ARENA_TURNS - usedRef.current.n);
    setMatch({ me: ch, foe: r.shadow, opp: r.opp, revenge: null, leftAfter: Math.max(0, left - 1), key: Date.now() });
  }

  async function lockPicked() {
    if (pick === null || !cands) return;
    setBusy('pick');
    track('arena_pick');
    await lockChamp(cands[pick]);
    setBusy(null);
    setPicking(false);
    load();
  }

  async function revenge(opp: string, id: number) {
    if (!user || busy) return;
    setBusy(opp);
    setErr(null);
    const ch = champRef.current.c ?? (await lockChamp());
    const foe = ch ? await arenaShadow(opp) : null;
    setBusy(null);
    if (!ch) return;
    if (!foe) {
      setErr(tr('Không tìm thấy bóng của đối thủ.', "Couldn't find your opponent's shadow."));
      return;
    }
    setMatch({ me: ch, foe, opp, revenge: id, leftAfter: Math.max(0, ARENA_TURNS - usedRef.current.n), key: Date.now() });
  }

  if (!st) return <p>{tr("Đang dựng lôi đài...", "Setting up the arena...")}</p>;
  const left = st.me ? Math.max(0, ARENA_TURNS - st.me.used) : 0;
  const hero = champ ?? cands?.[0] ?? null;
  const t = tierOfPts(st.me?.pts ?? 0);
  const bg = STAGE_BGS[(Number(vnDate().slice(8, 10)) || 1) % STAGE_BGS.length];
  return (
    <section className="arena ar-lobby">
      {st.me ? (
        <div className="ar-top">
          <span className="ar-top-tier">
            <b>{t.name}</b>
            <small>{st.me.pts}{tr(" điểm", " pts")}{t.next ? tr(` · còn ${t.next.need} lên ${t.next.name}`, ` · ${t.next.need} more to ${t.next.name}`) : ''}</small>
          </span>
          <ol className="ar-tier-steps" aria-hidden="true">
            {ARENA_TIERS.map((x, i) => (
              <li key={x.name} className={i < t.n ? 'got' : i === t.n ? 'next' : ''} />
            ))}
          </ol>
          <span className="ar-pips" aria-label={tr(`Còn ${left} trên ${ARENA_TURNS} lượt hôm nay`, `${left} of ${ARENA_TURNS} turns left today`)}>
            {Array.from({ length: ARENA_TURNS }, (_, i) => (
              <img key={i} src="/icons/g_long_tuyen_kiem.png" width={32} height={32} alt="" className={i < left ? 'on' : ''} />
            ))}
          </span>
        </div>
      ) : (
        <p className="note">
          <Link href="/dang-nhap?next=/loi-dai">{tr("Đăng nhập", "Log in")}</Link>{tr(" để lên lôi đài.", " to enter the arena.")}
        </p>
      )}

      <div className="ar-stage" style={{ backgroundImage: `url(${bg})` }}>
        <div className="ar-side me">
          {hero ? <Sprite c={foeChar(hero)} size={120} anim="idle" dir={3} /> : <span className="ar-unknown">?</span>}
          <b>{hero ? hero.name : tr('Bóng của bạn', "Your shadow")}</b>
          {st.me && !champ && hero && (
            <button className="linklike ar-swap" onClick={() => setPicking((v) => !v)}>
              {picking ? tr('Đóng', "Close") : tr('Đổi bóng', "Change shadow")}
            </button>
          )}
        </div>
        <span className="ar-vs">VS</span>
        <div className="ar-side foe">
          {hero ? (
            <span className="ar-shadow">
              <Sprite c={foeChar(hero)} size={120} anim="idle" dir={1} />
            </span>
          ) : (
            <span className="ar-unknown">?</span>
          )}
          <b>{tr("Đối thủ ngẫu nhiên", "Random opponent")}</b>
        </div>
        <span className="ar-rule-tag">
          
          {tr("Luật hôm nay: ", "Today's rule: ")}<b>{rule.name}</b>
        </span>
      </div>
      {err && <p className="note ar-err">{err}</p>}

      {picking && cands && cands.length > 0 ? (
        <>
          <div className="shadow-pick" id="ar-pick">
            {cands.map((c, i) => (
              <ShadowCard key={`${c.lifeId}-${i}`} r={c} rank={i + 1} rule={rule} vert on={pick === i} onPick={() => setPick(i)} />
            ))}
          </div>
          <button className="btn btn-red ar-keep" disabled={!!busy || pick === null} onClick={lockPicked}>
            {busy === 'pick' ? '...' : pick !== null ? tr(`Giữ ${cands[pick].name} cả ngày`, `Keep ${cands[pick].name} all day`) : tr('Chọn một bóng', "Pick a shadow")}
          </button>
        </>
      ) : (
        <>
          <nav className="ar-tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'top'} className={tab === 'top' ? 'on' : ''} onClick={() => setTab('top')}>
              
              {tr("Xếp hạng", "Leaderboard")}
            </button>
            <button role="tab" aria-selected={tab === 'thu'} className={tab === 'thu' ? 'on' : ''} onClick={() => setTab('thu')}>
              
              {tr("Báo thù", "Revenge")}{st.revenge.length ? <i className="ar-tab-dot">{st.revenge.length}</i> : null}
            </button>
            <button role="tab" aria-selected={tab === 'how'} className={tab === 'how' ? 'on' : ''} onClick={() => setTab('how')}>
              
              {tr("Cách chơi", "How to play")}
            </button>
          </nav>
          <div className="ar-tab-body">
            {tab === 'top' && (
              <>
                <Podium top={st.top} me={user?.username} />
                {st.top.length > 3 && (
                  <ol className="gh-board ar-top-list">
                    {st.top.slice(3).map((x, i) => (
                      <li key={x.username} className={x.username === user?.username ? 'me' : ''}>
                        <span className="gh-poster" aria-hidden="true">
                          {i + 4}
                        </span>
                        <span>
                          <b>@{x.username}</b>
                          <small>{tierOfPts(x.pts).name}</small>
                        </span>
                        <b className="gh-gold">{x.pts}</b>
                      </li>
                    ))}
                  </ol>
                )}
                {!st.top.length && <p className="note">{tr("Long ỷ còn trống tuần này, hãy là người đầu tiên.", "The Dragon Throne is empty this week - be the first.")}</p>}
                {st.champs.length > 0 && (
                  <p className="note ar-last">
                    
                    {tr("Tuần trước: ", "Last week: ")}{st.champs.map((c) => `${[tr('Bá Chủ', "Overlord"), tr('Á Chủ', "Runner-up"), tr('Tam Kiệt', "Third Hero")][c.rank - 1]} @${c.username}`).join(' · ')}
                  </p>
                )}
              </>
            )}
            {tab === 'thu' &&
              (st.revenge.length ? (
                <ul className="ar-opps revenge">
                  {st.revenge.map((r) => (
                    <li key={r.id}>
                      <span>
                        <b>@{r.target}{tr(" hạ bóng của bạn", " defeated your shadow")}</b>
                        <small>{tr("Không tốn lượt, hạn 48 giờ", "No turn cost, 48-hour limit")}</small>
                      </span>
                      <button className="btn btn-red" disabled={!!busy} onClick={() => revenge(r.target, r.id)}>
                        {busy === r.target ? '...' : tr('Báo thù', "Revenge")}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="note">{tr("Chưa ai hạ được bóng của bạn.", "No one has defeated your shadow yet.")}</p>
              ))}
            {tab === 'how' && (
              <>
                <ul className="ar-how-list">
                  <li>{tr("Chạm để phóng phi kiếm trong 12 giây, đừng đâm vào kiếm đã cắm.", "Tap to launch flying swords for 12 seconds - don't hit the swords already stuck in.")}</li>
                  <li>{tr("Càng nhiều kiếm, bóng của bạn càng mạnh. Sau đó hai bóng tự đánh.", "The more swords, the stronger your shadow. Then the two shadows fight on their own.")}</li>
                  <li>{tr("Thắng +3 điểm, 10 phúc. Thua +1 điểm, 3 phúc. Đủ 3 trận +15 Hồn lực.", "Win +3 pts, 10 Fortune. Lose +1 pt, 3 Fortune. Finish 3 matches +15 Soul Power.")}</li>
                  <li>{tr("Cuối tuần mỗi bậc thưởng 5 phúc. Top 3 lên bục Long Ỷ.", "At week's end, each tier earns 5 Fortune. Top 3 take the Dragon Throne podium.")}</li>
                </ul>
                <RuleBanner />
              </>
            )}
          </div>
        </>
      )}

      {st.me && (
        <div className="ar-dock">
          <button className="btn btn-red btn-big ar-go-btn" disabled={!!busy || left <= 0} onClick={raDai}>
            {busy === 'go' ? tr('Đang rút đối thủ...', "Drawing an opponent...") : left > 0 ? tr('⚔ Ra đài', "⚔ Enter the arena") : tr('Mai đánh tiếp', "Fight again tomorrow")}
            <small>{left > 0 ? tr(`còn ${left}/${ARENA_TURNS} lượt · 25 giây một trận`, `${left}/${ARENA_TURNS} turns left · 25 seconds per match`) : tr('Hôm nay đã đủ 3 trận', "3 matches done today")}</small>
          </button>
        </div>
      )}

      {match && user && (
        <LoiDaiMatch
          key={match.key}
          me={match.me}
          foe0={match.foe}
          opp={match.opp}
          rule={rule}
          revenge={match.revenge}
          user={user}
          leftAfter={match.leftAfter}
          onNext={() => {
            usedRef.current.n += 1;
            setMatch(null);
            load();
            void raDai();
          }}
          onDone={() => {
            if (!match.revenge) usedRef.current.n += 1;
            setMatch(null);
            load();
          }}
        />
      )}
    </section>
  );
}
