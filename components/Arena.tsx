'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Sprite from '@/components/Sprite';
import Podium from '@/components/Podium';
import type { Player } from '@/lib/auth';
import { PATHS, realmLabel } from '@/lib/game/data';
import { foeChar, foeStats } from '@/lib/game/duel';
import { ELEMENTS, elementOf } from '@/lib/game/nguhanh';
import { STANCES, type Stance } from '@/lib/game/nguHanhDai';
import type { RivalChar } from '@/lib/game/types';
import { HABIT_TEXT, ROUND_TEXT, baseChance, beats, bestOf, counterOf, equalize, foeStance, needWins, roundChance, ruleOf, tellOf, vnDate, type ArenaRule } from '@/lib/game/arena';
import { arena2State, arenaCandidates, arenaDraw, arenaFight2, arenaPick, arenaShadow, toRival, type Arena2State } from '@/lib/social';

export const ARENA_TURNS = 3;
const BGS = ['tien', 'ma', 'hu'].flatMap((c) => ['kim', 'moc', 'thuy', 'hoa', 'tho'].map((e) => `/bg/nhd-${c}-${e}.png`));

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

/** Thẻ một bóng: hình, cảnh giới, con đường, bản mệnh, chỉ số */
function ShadowCard({ r, on, onPick, small }: { r: RivalChar; on?: boolean; onPick?: () => void; small?: boolean }) {
  const s = foeStats(r);
  const el = elementOf(r);
  const body = (
    <>
      <span className="sc-fig">
        <Sprite c={foeChar(r)} size={small ? 56 : 72} />
      </span>
      <span className="sc-info">
        <b>{r.name}</b>
        <small>
          {r.realm === 0 ? 'Phàm nhân' : realmLabel(r.realm, r.layer, r.cosmos)} · Kiếp {r.lifeNo ?? 1}
          {r.alive ? ' · đang sống' : ''}
        </small>
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
    <button type="button" className={`shadow-card ${on ? 'on' : ''}`} onClick={onPick} aria-pressed={on}>
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

/** Ống xăm vẽ pixel */
function OngXam({ phase, tier }: { phase: 'idle' | 'shake' | 'fly' | 'open'; tier: number }) {
  return (
    <div className={`xam xam-${phase} xt${tier}`} aria-hidden="true">
      <span className="xam-glow" />
      <span className="xam-stick fly" />
      <svg className="xam-pot" viewBox="0 0 32 40" shapeRendering="crispEdges">
        {[5, 9, 13, 17, 21, 25].map((x, i) => (
          <rect key={x} className={`xs xs${i}`} x={x} y={2 + (i % 3) * 2} width="2" height="16" fill={i % 2 ? '#e8c87a' : '#d8b060'} />
        ))}
        <rect x="3" y="14" width="26" height="24" fill="#7a3a18" />
        <rect x="3" y="14" width="26" height="3" fill="#a8582a" />
        <rect x="3" y="36" width="26" height="2" fill="#4a2010" />
        <rect x="5" y="20" width="22" height="2" fill="#c8963a" />
        <rect x="5" y="30" width="22" height="2" fill="#c8963a" />
        <rect x="13" y="23" width="6" height="5" fill="#b0201a" />
        <rect x="14" y="24" width="4" height="3" fill="#ffd36b" />
      </svg>
    </div>
  );
}

type Draw = { opp: string; foe: RivalChar; again?: boolean };

/** Xin xăm lôi đài: lắc ống xăm, một que bay ra mang màu phẩm của đối thủ, lật thành thẻ bóng */
function XinXam({ me, user, rule, left, onFight, onErr }: { me: RivalChar; user: Player; rule: ArenaRule; left: number; onFight: (d: Draw) => void; onErr: (e: string) => void }) {
  const [phase, setPhase] = useState<'idle' | 'shake' | 'fly' | 'open'>('idle');
  const [draw, setDraw] = useState<Draw | null>(null);
  const tier = draw ? tierOf(draw.foe) : 0;
  async function shake() {
    if (phase !== 'idle') return;
    setPhase('shake');
    const t0 = Date.now();
    const r = await arenaDraw(user);
    if (!r || r.error || !r.opp || !r.shadow) {
      setPhase('idle');
      onErr(r?.error === 'NO_TURNS' ? 'Hôm nay đã hết lượt.' : r?.error === 'NO_OPP' ? 'Chưa có đối thủ nào để rút.' : 'Ống xăm kẹt, thử lại sau.');
      return;
    }
    setDraw({ opp: r.opp, foe: r.shadow, again: r.again });
    // lắc đủ lâu cho hồi hộp, rồi que bay ra
    setTimeout(() => setPhase('fly'), Math.max(0, 1500 - (Date.now() - t0)));
    setTimeout(() => setPhase('open'), Math.max(0, 1500 - (Date.now() - t0)) + 1100);
  }
  const p = draw ? baseChance(me, equalize(draw.foe, me), rule) : 0.5;
  const o = omen(p);
  return (
    <div className="xin-xam">
      {phase !== 'open' ? (
        <>
          <OngXam phase={phase} tier={tier} />
          <button className="btn btn-red btn-big xam-btn" disabled={phase !== 'idle' || left <= 0} onClick={shake}>
            {phase === 'idle' ? `Lắc ống xăm · còn ${left} lượt` : phase === 'shake' ? 'Đang lắc...' : 'Que xăm bay ra!'}
          </button>
          <small className="note">Mỗi que là bóng của một đạo hữu ngẫu nhiên. Màu que báo phẩm của bóng: xám Phàm, lam Linh, tím Huyền, vàng Thiên.</small>
        </>
      ) : (
        draw && (
          <div className={`xam-card ${TIERS[tier].cls}`}>
            <span className="xc-burst" aria-hidden="true" />
            <small className="xc-tier">{TIERS[tier].name}</small>
            <span className="xc-fig">
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

type Round = { my: Stance; foe: Stance; win: boolean; text: string };

/** Màn đấu ba hiệp kiểu Ngũ Hành Đài, khó hơn */
function Match({ me, foe0, opp, rule, revenge, user, onDone }: { me: RivalChar; foe0: RivalChar; opp: string; rule: ArenaRule; revenge: number | null; user: Player; onDone: () => void }) {
  const foe = useMemo(() => equalize(foe0, me), [foe0, me]);
  const base = useMemo(() => baseChance(me, foe, rule), [me, foe, rule]);
  const bg = useMemo(() => BGS[Math.floor(Math.random() * BGS.length)], []);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [plan, setPlan] = useState<{ foe: Stance; tell: { shown: Stance | null; text: string } } | null>(null);
  const [anim, setAnim] = useState<Round | null>(null);
  const [res, setRes] = useState<{ win: boolean; pts?: number; err?: string } | null>(null);
  const wins = rounds.filter((r) => r.win).length;
  const losses = rounds.length - wins;
  const need = needWins(rule);
  const over = wins >= need || losses >= need;
  const forced = rounds.length === 0 && rule.force1 ? rule.force1 : null;

  useEffect(() => {
    if (over || anim) return;
    const last = rounds.length ? rounds[rounds.length - 1].my : null;
    const fs = foeStance(foe, Math.random, rounds.length, last, rule);
    setPlan({ foe: fs, tell: tellOf(fs, rule, Math.random) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds.length, anim]);

  useEffect(() => {
    if (!over || res) return;
    const win = wins >= need;
    const detail = `${me.name} ${win ? 'thắng' : 'thua'} ${foe.name} ${wins}-${losses}. Luật hôm nay: ${rule.name}.`;
    arenaFight2(user, opp, win, detail, revenge).then((r) => setRes({ win, pts: r?.pts, err: !r ? 'Lôi đài đang đông, kết quả chưa ghi được.' : r.error }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  function play(my: Stance) {
    if (!plan || anim || over) return;
    const p = roundChance(base, my, plan.foe, rule, { last: rounds.length === bestOf(rule) - 1, myWonLast: rounds.length ? rounds[rounds.length - 1].win : null });
    const win = Math.random() < p;
    const pool = win ? ROUND_TEXT.win : ROUND_TEXT.lose;
    const r: Round = { my, foe: plan.foe, win, text: pool[Math.floor(Math.random() * pool.length)] };
    setAnim(r);
    setTimeout(() => {
      setRounds((x) => [...x, r]);
      setAnim(null);
    }, 900);
  }
  const auto = () => play(forced ?? (plan?.tell.shown ? counterOf(plan.tell.shown, rule) : (['cong', 'thu', 'hoa'] as Stance[])[Math.floor(Math.random() * 3)]));
  const all: Stance[] = ['cong', 'thu', 'hoa'];

  return (
    <div className="arena-match" role="dialog" aria-modal="true" aria-label={`Lôi đài với @${opp}`}>
      <div className="am-stage" style={{ backgroundImage: `url(${bg})` }}>
        <div className={`am-side me ${anim ? (anim.win ? 'hit' : 'hurt') : ''}`}>
          <Sprite c={foeChar(me)} size={84} anim={anim ? 'slash' : 'idle'} dir={3} />
          <small>{me.name}</small>
        </div>
        <div className="am-mid">
          <span className="am-pips" aria-label={`Thắng ${wins}, thua ${losses}`}>
            {Array.from({ length: bestOf(rule) }, (_, i) => (
              <i key={i} className={rounds[i] ? (rounds[i].win ? 'w' : 'l') : ''} />
            ))}
          </span>
          <b>{over ? (wins >= need ? 'THẮNG' : 'THUA') : `Hiệp ${rounds.length + 1}`}</b>
          {anim && (
            <small className="am-clash">
              {STANCES[anim.my].name} ⚔ {STANCES[anim.foe].name}
            </small>
          )}
        </div>
        <div className={`am-side foe ${anim ? (anim.win ? 'hurt' : 'hit') : ''}`}>
          <Sprite c={foeChar(foe)} size={84} anim={anim ? 'slash' : 'idle'} dir={1} />
          <small>
            {foe.name} · @{opp}
          </small>
        </div>
      </div>
      <div className="am-body">
        <p className="am-rule">
          <b>{rule.name}:</b> {rule.desc} {revenge ? <em>Trận báo thù, không tính lượt.</em> : null}
        </p>
        {rounds.length > 0 && (
          <ol className="am-log">
            {rounds.map((r, i) => (
              <li key={i} className={r.win ? 'w' : 'l'}>
                Hiệp {i + 1}: bạn {STANCES[r.my].name}, đối thủ {STANCES[r.foe].name}. {r.text}
              </li>
            ))}
          </ol>
        )}
        {!over ? (
          <>
            <p className="am-tell">
              {plan?.tell.text} <small>{HABIT_TEXT[foe.path ?? ''] ?? ''}</small>
            </p>
            <div className="am-stances">
              {all.map((s) => {
                const beat = all.find((x) => beats(s, x, rule))!;
                const lose = all.find((x) => beats(x, s, rule))!;
                return (
                  <button key={s} className={`am-stance st-${s}`} disabled={!!anim || (!!forced && forced !== s)} onClick={() => play(s)}>
                    <b>{STANCES[s].name}</b>
                    <small>
                      thắng {STANCES[beat].name}, thua {STANCES[lose].name}
                    </small>
                  </button>
                );
              })}
            </div>
            <button className="btn am-auto" disabled={!!anim} onClick={auto}>
              Tự đánh hiệp này
            </button>
          </>
        ) : (
          <div className="am-res">
            {res ? (
              <>
                <p>
                  {wins >= need ? `Bạn thắng ${wins}-${losses}. +3 điểm lôi đài.` : `Bạn thua ${wins}-${losses}. Không được điểm.`}
                  {typeof res.pts === 'number' ? ` Tuần này: ${res.pts} điểm.` : ''}
                </p>
                {res.err && <p className="ar-err">{res.err === 'NO_TURNS' ? 'Hôm nay đã hết lượt.' : res.err === 'NO_REVENGE' ? 'Lượt báo thù đã hết hạn.' : res.err === 'BAD_OPP' ? 'Quẻ này không còn hiệu lực.' : res.err}</p>}
              </>
            ) : (
              <p>Đang ghi kết quả lên bảng...</p>
            )}
            <button className="btn btn-red btn-big" disabled={!res} onClick={onDone}>
              Rời lôi đài
            </button>
          </div>
        )}
      </div>
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
          </span>
        </div>
      ) : (
        <p className="note">
          <Link href="/dang-nhap?next=/loi-dai">Đăng nhập</Link> để lên lôi đài.
        </p>
      )}

      {st.me && (
        <>
          <h3 className="gh-h">Bóng xuất chiến hôm nay</h3>
          {champ ? (
            <>
              <ShadowCard r={champ} />
              <small className="note">Đã chọn, giữ nguyên tới hết ngày. Người khác rút trúng bạn cũng gặp bóng này.</small>
            </>
          ) : cands === null ? (
            <p>Đang gọi các kiếp trước...</p>
          ) : !cands.length ? (
            <p className="note">Bạn chưa có kiếp nào. Sống trọn một kiếp rồi quay lại lôi đài.</p>
          ) : (
            <>
              <p className="note" style={{ margin: 0 }}>
                Chọn 1 trong {cands.length} kiếp mạnh nhất. Chọn rồi thì giữ tới hết ngày. Luật hôm nay: {rule.name}, hãy chọn bóng hợp luật.
              </p>
              <div className="shadow-pick">
                {cands.map((c, i) => (
                  <ShadowCard key={`${c.lifeId}-${i}`} r={c} on={pick === i} onPick={() => setPick(i)} />
                ))}
              </div>
              <button className="btn btn-red btn-big" disabled={pick === null || !!busy} onClick={lock}>
                {busy === 'pick' ? 'Đang triệu hồi...' : 'Xuất chiến'}
              </button>
            </>
          )}
        </>
      )}

      {st.me && champ && user && (
        <>
          <h3 className="gh-h">Xin xăm đối thủ</h3>
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
        <Match
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
