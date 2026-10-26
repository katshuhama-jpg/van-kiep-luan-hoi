'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Sprite from '@/components/Sprite';
import Podium from '@/components/Podium';
import ArenaMatch from '@/components/ArenaMatch';
import { PixelFx, fxMotes, fxRays } from '@/components/PixelFx';
import type { Player } from '@/lib/auth';
import { PATHS, realmLabel } from '@/lib/game/data';
import { foeChar, foeStats } from '@/lib/game/duel';
import { ELEMENTS, elementOf } from '@/lib/game/nguhanh';
import type { RivalChar } from '@/lib/game/types';
import { baseChance, fitsRule, equalize, ruleOf, vnDate, type ArenaRule } from '@/lib/game/arena';
import { arena2State, arenaCandidates, arenaDraw, arenaFight2, arenaPick, arenaShadow, toRival, type Arena2State } from '@/lib/social';

export const ARENA_TURNS = 3;

/** Phẩm của thẻ bóng theo cảnh giới thật (trước khi kéo về cùng cấp) */
const TIERS = [
  { name: 'Phàm thiếp', cls: 't0' },
  { name: 'Linh thiếp', cls: 't1' },
  { name: 'Huyền thiếp', cls: 't2' },
  { name: 'Thiên thiếp', cls: 't3' },
];
const tierOf = (r: RivalChar) => (r.realm >= 8 ? 3 : r.realm >= 6 ? 2 : r.realm >= 3 ? 1 : 0);
const omen = (p: number) =>
  p >= 0.58 ? { name: 'Thượng cát', text: 'Quẻ tốt: bóng này khó đỡ được thế của bạn.' } : p <= 0.42 ? { name: 'Hạ hung', text: 'Quẻ xấu: bóng này có lợi thế, phải đoán thật chuẩn.' } : { name: 'Trung bình', text: 'Quẻ hòa: thắng thua nằm ở cách đoán thế.' };

/** Cuộn tới một mục trên trang lôi đài */
function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Ba bước mỗi ngày ở lôi đài, bước đang làm sáng lên, chạm để tới đúng chỗ */
function TodaySteps({ step, left }: { step: 1 | 2 | 3; left: number }) {
  const steps = [
    { n: 1, t: 'Chọn bóng', d: 'một kiếp mạnh nhất của bạn', to: 'ar-pick' },
    { n: 2, t: 'Xin xăm', d: `rút đối thủ · còn ${left} lượt`, to: 'ar-xam' },
    { n: 3, t: 'Ra đài', d: 'đánh 3 hiệp, thắng +3 điểm', to: 'ar-xam' },
  ];
  return (
    <nav className="ar-steps" aria-label="Các bước hôm nay">
      {steps.map((x) => (
        <button key={x.n} className={x.n < step ? 'done' : x.n === step ? 'now' : ''} onClick={() => jump(x.to)} disabled={x.n > step}>
          <i>{x.n < step ? '✓' : x.n}</i>
          <span>
            <b>{x.t}</b>
            <small>{x.d}</small>
          </span>
        </button>
      ))}
    </nav>
  );
}

/** Thẻ một bóng: hình, cảnh giới, con đường, bản mệnh, chỉ số */
function ShadowCard({ r, on, onPick, small, rank, rule, vert }: { r: RivalChar; on?: boolean; onPick?: () => void; small?: boolean; rank?: number; rule?: ArenaRule; vert?: boolean }) {
  const s = foeStats(r);
  const el = elementOf(r);
  const body = (
    <>
      {rank !== undefined && <span className={`sc-rank r${rank}`}>{rank === 1 ? 'Mạnh nhất' : `Hạng ${rank}`}</span>}
      <span className="sc-fig">
        <Sprite c={foeChar(r)} size={vert ? 84 : small ? 56 : 72} />
      </span>
      <span className="sc-info">
        <span className="sc-tags">
          <i className={r.alive ? 'live' : 'past'}>{r.alive ? 'Nhân vật đang chơi' : `Kiếp thứ ${r.lifeNo ?? 1} của bạn`}</i>
          {rule && fitsRule(r, rule) && <i className="fit">Hợp luật hôm nay</i>}
        </span>
        <b>{r.name}</b>
        <small>{r.realm === 0 ? 'Phàm nhân' : realmLabel(r.realm, r.layer, r.cosmos)}</small>
        <small>
          {r.path ? PATHS[r.path].name : 'Chưa chọn đường'} · Mệnh {ELEMENTS[el].name} · {r.age} tuổi
        </small>
        <span className="sc-stats">
          <i>Công {s.atk}</i>
          <i>Thủ {s.def}</i>
          <i>Huyết {s.hp}</i>
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
      <small>Luật lôi đài hôm nay · ngày {today.day}</small>
      <b>{today.name}</b>
      <p>{today.desc}</p>
      {!compact && (
        <ol className="rule-week" aria-label="Luật 7 ngày tới">
          {week.map((w, i) => (
            <li key={w.d} className={i === 0 ? 'today' : ''}>
              <small>{i === 0 ? 'Hôm nay' : i === 1 ? 'Mai' : `${w.d.slice(8, 10)}/${w.d.slice(5, 7)}`}</small>
              <span>{w.r.name}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

const TIER_COL = ['#d8d0c8', '#6ab0ff', '#c08aff', '#ffd36b'];

type Draw = { opp: string; foe: RivalChar; again?: boolean };

/** Rút bóng: ba lá bài úp xáo trộn, chạm một lá, lật ra bóng đen của đối thủ rồi hiện hình (hình đều từ LPC và bộ icon CC0) */
type XPhase = 'idle' | 'shuffle' | 'pick' | 'flip' | 'open';
function XinXam({ me, user, rule, left, onFight, onErr }: { me: RivalChar; user: Player; rule: ArenaRule; left: number; onFight: (d: Draw) => void; onErr: (e: string) => void }) {
  const [phase, setPhase] = useState<XPhase>('idle');
  const [draw, setDraw] = useState<Draw | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const tier = draw ? tierOf(draw.foe) : 0;
  async function shuffle() {
    if (phase !== 'idle') return;
    setPhase('shuffle');
    const t0 = Date.now();
    const r = await arenaDraw(user);
    if (!r || r.error || !r.opp || !r.shadow) {
      setPhase('idle');
      onErr(r?.error === 'NO_TURNS' ? 'Hôm nay đã hết lượt.' : r?.error === 'NO_OPP' ? 'Chưa có đối thủ nào để rút.' : 'Bài kẹt, thử lại sau.');
      return;
    }
    setDraw({ opp: r.opp, foe: r.shadow, again: r.again });
    // xáo đủ lâu cho hồi hộp rồi mới cho chọn
    setTimeout(() => setPhase('pick'), Math.max(0, 1300 - (Date.now() - t0)));
  }
  function choose(i: number) {
    if (phase !== 'pick') return;
    setChosen(i);
    setPhase('flip');
    // bóng đen hiện trước, lóe sáng theo phẩm rồi mới lộ mặt
    setTimeout(() => setPhase('open'), 1700);
  }
  const p = draw ? baseChance(me, equalize(draw.foe, me), rule) : 0.5;
  const o = omen(p);
  const col = TIER_COL[tier];
  return (
    <div className="xin-xam">
      {phase !== 'open' ? (
        <>
          <div className={`xb-table xb-${phase}`}>
            {[0, 1, 2].map((i) => {
              const isChosen = chosen === i;
              return (
                <button
                  key={i}
                  type="button"
                  className={`xb-card c${i} ${isChosen ? 'chosen' : chosen !== null ? 'other' : ''}`}
                  disabled={phase !== 'pick'}
                  onClick={() => choose(i)}
                  aria-label={phase === 'pick' ? `Lật lá thứ ${i + 1}` : 'Lá bài úp'}
                  style={{ ['--tc' as string]: col }}
                >
                  {isChosen && phase === 'flip' && draw ? (
                    <span className={`xb-face t${tier}`}>
                      {tier > 0 && <PixelFx spec={fxRays(col)} scale={2} dur={1.2} className="pa xb-rays" />}
                      {tier > 1 && <PixelFx spec={fxMotes(10, col)} scale={3} dur={1.4} className="pa xb-motes" />}
                      <span className="xb-sil">
                        <Sprite c={foeChar(draw.foe)} size={84} anim="idle" dir={2} />
                      </span>
                      <b>{TIERS[tier].name}</b>
                    </span>
                  ) : (
                    <span className="xb-back">
                      <img src="/icons/g_bat_quai_kinh.png" width={32} height={32} alt="" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {phase === 'pick' ? (
            <p className="xb-hint">Chạm một lá để lật</p>
          ) : phase === 'flip' ? (
            <p className="xb-hint" style={{ color: col }}>
              {tier >= 3 ? 'Thiên phẩm hiện thế!' : tier === 2 ? 'Bóng Huyền phẩm!' : tier === 1 ? 'Bóng Linh phẩm' : 'Một bóng Phàm phẩm'}
            </p>
          ) : (
            <button className="btn btn-red btn-big xam-btn" disabled={phase !== 'idle' || left <= 0} onClick={shuffle}>
              {phase === 'idle' ? `Rút bóng đối thủ · còn ${left} lượt` : 'Đang xáo bài...'}
            </button>
          )}
          <small className="note">Mỗi lá là bóng của một đạo hữu ngẫu nhiên. Ánh sáng khi lật báo phẩm của bóng: xám Phàm, lam Linh, tím Huyền, vàng Thiên.</small>
        </>
      ) : (
        draw && (
          <div className={`xam-card ${TIERS[tier].cls}`}>
            <i className="xc-corner tl" aria-hidden="true" />
            <i className="xc-corner tr" aria-hidden="true" />
            <i className="xc-corner bl" aria-hidden="true" />
            <i className="xc-corner br" aria-hidden="true" />
            <small className="xc-tier">{TIERS[tier].name}</small>
            <span className="xc-fig">
              {tier > 0 && <PixelFx spec={fxRays(TIER_COL[tier])} scale={2} dur={1.2} className="pa xc-rays" />}
              {tier > 1 && <PixelFx spec={fxMotes(10, TIER_COL[tier])} scale={3} dur={1.4} className="pa xc-motes" />}
              <Sprite c={foeChar(draw.foe)} size={96} anim="idle" dir={2} />
            </span>
            <b className="xc-name">{draw.foe.name}</b>
            <small>
              @{draw.opp} · bóng thật {draw.foe.realm === 0 ? 'Phàm nhân' : realmLabel(draw.foe.realm, draw.foe.layer, draw.foe.cosmos)}
            </small>
            <small>
              {draw.foe.path ? PATHS[draw.foe.path].name : 'Chưa chọn đường'} · Mệnh {ELEMENTS[elementOf(draw.foe)].name} · lên đài sẽ kéo về {me.realm === 0 ? 'Phàm nhân' : realmLabel(me.realm, me.layer, me.cosmos)}
            </small>
            <p className={`xc-omen o-${o.name === 'Thượng cát' ? 'good' : o.name === 'Hạ hung' ? 'bad' : 'mid'}`}>
              <b>{o.name}</b> · {o.text}
            </p>
            {draw.again && <small className="note">Quẻ trước chưa giải: phải đánh xong bóng này mới rút được quẻ mới.</small>}
            <button className="btn btn-red btn-big" onClick={() => onFight(draw)}>
              Lên đài
            </button>
          </div>
        )
      )}
    </div>
  );
}

/**
 * Lôi đài hằng ngày: chọn bóng xuất chiến (1 trong 5 kiếp mạnh nhất, giữ cả ngày), mỗi ngày 3 lần xin xăm ra đối thủ ngẫu nhiên,
 * bóng đối thủ kéo về cùng cảnh giới. Thắng trận được 3 điểm, thua 0. Điểm reset mỗi thứ Hai.
 */
export default function Arena({ user }: { user: Player | null }) {
  const [st, setSt] = useState<Arena2State | null>(null);
  const [cands, setCands] = useState<RivalChar[] | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [match, setMatch] = useState<{ me: RivalChar; foe: RivalChar; opp: string; revenge: number | null } | null>(null);
  const [round, setRound] = useState(0); // đổi để dựng lại ống xăm sau mỗi trận
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
  useEffect(() => {
    if (user && st?.me && !champ && cands === null) arenaCandidates(user).then(setCands);
  }, [user, st, champ, cands]);

  async function lock() {
    if (!user || pick === null || !cands) return;
    const c = cands[pick];
    setBusy('pick');
    const r = await arenaPick(user, c.lifeId ?? 0);
    setBusy(null);
    if (!r || (r.error && r.error !== 'LOCKED')) {
      setErr('Chưa chọn được bóng, thử lại sau.');
      return;
    }
    load();
  }

  async function revenge(opp: string, id: number) {
    if (!user || !champ || busy) return;
    setBusy(opp);
    setErr(null);
    const foe = await arenaShadow(opp);
    setBusy(null);
    if (!foe) {
      setErr('Không tìm thấy bóng của đối thủ.');
      return;
    }
    setMatch({ me: champ, foe, opp, revenge: id });
  }

  if (!st) return <p>Đang dựng lôi đài...</p>;
  const left = st.me ? Math.max(0, ARENA_TURNS - st.me.used) : 0;
  return (
    <section className="arena">
      {st.me && <TodaySteps step={!champ ? 1 : left > 0 ? 2 : 3} left={left} />}
      <Podium top={st.top} me={user?.username} />
      <RuleBanner />
      {st.me ? (
        <div className="ar-me">
          <span className="ar-elo">
            <small>Điểm tuần</small>
            <b>{st.me.pts}</b>
          </span>
          <span className="ar-info">
            {st.me.wins} thắng · {st.me.losses} thua{st.me.winRun >= 2 ? ` · Liên thắng ${st.me.winRun}` : ''}
            <br />
            Hôm nay còn <b>{left}</b>/{ARENA_TURNS} lượt
            <small className="ar-reset">Lượt và luật đổi lúc 0 giờ, điểm tuần tính lại 0 giờ thứ Hai (giờ Việt Nam)</small>
          </span>
        </div>
      ) : (
        <p className="note">
          <Link href="/dang-nhap?next=/loi-dai">Đăng nhập</Link> để lên lôi đài.
        </p>
      )}

      {st.me && (
        <>
          <h3 className="gh-h">{champ ? 'Bóng xuất chiến hôm nay' : 'Chọn bóng xuất chiến từ các kiếp của bạn'}</h3>
          {champ ? (
            <>
              <ShadowCard r={champ} rule={rule} />
              <small className="note">Bóng của bạn hôm nay, giữ nguyên tới hết ngày. Ai rút trúng bạn cũng đấu với bóng này.</small>
            </>
          ) : cands === null ? (
            <p>Đang gọi các kiếp trước...</p>
          ) : !cands.length ? (
            <p className="note">Bạn chưa có kiếp nào. Sống trọn một kiếp rồi quay lại lôi đài.</p>
          ) : (
            <>
              <div className="sp-intro">
                <b>Đây là {cands.length} nhân vật mạnh nhất bạn từng chơi</b>
                <span>Xếp theo cảnh giới cao nhất từng đạt, gồm cả kiếp đã mất. Chọn một người làm bóng ra lôi đài hôm nay. Chọn rồi thì giữ tới hết ngày, ai rút trúng bạn cũng đấu với bóng này.</span>
                <span>
                  Luật hôm nay <b>{rule.name}</b>: {rule.desc} Bóng có nhãn <i className="fit-tag">Hợp luật hôm nay</i> được lợi thế.
                </span>
              </div>
              <div className="shadow-pick" id="ar-pick">
                {cands.map((c, i) => (
                  <ShadowCard key={`${c.lifeId}-${i}`} r={c} rank={i + 1} rule={rule} vert on={pick === i} onPick={() => setPick(i)} />
                ))}
              </div>
              {/* thanh xuất chiến bám đáy màn hình: luôn thấy, không phải cuộn xuống tìm */}
              <div className={`sp-bar ${pick !== null ? 'ready' : ''}`}>
                {pick !== null && cands[pick] ? (
                  <span className="sp-chosen">
                    <span className="sp-mini">
                      <Sprite c={foeChar(cands[pick])} size={44} />
                    </span>
                    <span>
                      <small>Bóng đã chọn</small>
                      <b>{cands[pick].name}</b>
                    </span>
                  </span>
                ) : (
                  <span className="sp-hint">
                    <b>Bước 1:</b> chọn 1 trong {cands.length} bóng làm người ra đài hôm nay
                  </span>
                )}
                {pick === null ? (
                  <button className="btn btn-red sp-go" onClick={() => jump('ar-pick')}>
                    Chọn bóng ↓
                  </button>
                ) : (
                  <button className="btn btn-red sp-go" disabled={!!busy} onClick={lock}>
                    {busy === 'pick' ? 'Đang triệu hồi...' : '⚔ Xuất chiến'}
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}

      {st.me && champ && user && (
        <>
          <h3 className="gh-h" id="ar-xam">Xin xăm đối thủ</h3>
          {left > 0 ? (
            <XinXam key={round} me={champ} user={user} rule={rule} left={left} onErr={setErr} onFight={(d) => setMatch({ me: champ, foe: d.foe, opp: d.opp, revenge: null })} />
          ) : (
            <p className="note">Hôm nay đã đánh đủ {ARENA_TURNS} trận. Mai lôi đài lại mở với luật mới.</p>
          )}
        </>
      )}
      {err && <p className="note ar-err">{err}</p>}

      {st.me && champ && st.revenge.length > 0 && (
        <>
          <h3 className="gh-h">Nợ máu chờ trả</h3>
          <ul className="ar-opps revenge">
            {st.revenge.map((r) => (
              <li key={r.id}>
                <span>
                  <b>@{r.target}</b>
                  <small>Đã đánh bại bóng của bạn. Báo thù không tính lượt, hạn 48 giờ.</small>
                </span>
                <button className="btn btn-red" disabled={!!busy} onClick={() => revenge(r.target, r.id)}>
                  {busy === r.target ? '...' : 'Báo thù'}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="note ar-rule">
        Bóng đối thủ được kéo về cùng cảnh giới với bóng của bạn. Mỗi hiệp chọn Công, Thủ hay Hóa; đối thủ để lộ ý đồ nhưng không phải lúc nào cũng thật, và biết đọc thế của bạn. Thắng trận được 3 điểm, thua
        0. Điểm tính lại mỗi thứ Hai, top 3 nhận danh hiệu Bá Chủ, Á Chủ, Tam Kiệt.
      </p>

      {st.champs.length > 0 && (
        <>
          <h3 className="gh-h">Bá chủ tuần trước</h3>
          <ol className="ar-champs">
            {st.champs.map((c) => (
              <li key={c.rank}>
                <b>{['Lôi Đài Bá Chủ', 'Lôi Đài Á Chủ', 'Lôi Đài Tam Kiệt'][c.rank - 1]}</b> @{c.username} · {c.pts} điểm
              </li>
            ))}
          </ol>
        </>
      )}
      {st.top.length > 3 && (
        <>
          <h3 className="gh-h">Hạng 4 trở xuống</h3>
          <ol className="gh-board ar-top">
            {st.top.slice(3).map((t, i) => (
              <li key={t.username} className={t.username === user?.username ? 'me' : ''}>
                <span className="gh-poster" aria-hidden="true">
                  {i + 4}
                </span>
                <span>
                  <b>@{t.username}</b>
                  <small>
                    {t.wins} thắng, {t.losses} thua{t.winRun >= 3 ? ` · Liên thắng ${t.winRun}` : ''}
                  </small>
                </span>
                <b className="gh-gold">{t.pts}</b>
              </li>
            ))}
          </ol>
        </>
      )}
      {!st.top.length && <p className="note">Chưa ai có điểm tuần này. Long ỷ còn trống, hãy là người đầu tiên.</p>}

      {match && user && (
        <ArenaMatch
          me={match.me}
          foe0={match.foe}
          opp={match.opp}
          rule={rule}
          revenge={match.revenge}
          user={user}
          onDone={() => {
            setMatch(null);
            setRound((x) => x + 1);
            load();
          }}
        />
      )}
    </section>
  );
}
