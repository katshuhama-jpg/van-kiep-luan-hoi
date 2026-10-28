'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Sprite from '@/components/Sprite';
import { PixelFx, fxBatQuai, fxCuuVi, fxKiem, fxLua, fxMaKhi, fxMotes, fxPhatQuang, fxRays, type FxSpec } from '@/components/PixelFx';
import type { Player } from '@/lib/auth';
import { foeChar } from '@/lib/game/duel';
import { realmLabel } from '@/lib/game/data';
import { ELEMENTS, elemMul, elementOf } from '@/lib/game/nguhanh';
import { STANCES, type Stance } from '@/lib/game/nguHanhDai';
import type { Element, RivalChar } from '@/lib/game/types';
import { HABIT_TEXT, baseChance, beats, equalize, type ArenaRule } from '@/lib/game/arena';
import { KI_MAX, TURN_CAP, apply, autoPick, foeIntent, foeUlt, handOf, myUlt, newFight, trade, turnLines, ultName, type FightState, type Intent, type Parry, type TurnResult } from '@/lib/game/arenaFight';
import { arenaFight2 } from '@/lib/social';
import { track } from '@/lib/track';
import { tr } from '@/lib/i18n';

const BGS = ['tien', 'ma', 'hu'].flatMap((c) => ['kim', 'moc', 'thuy', 'hoa', 'tho'].map((e) => `/bg/nhd-${c}-${e}.png`));
const EL_NAME: Record<Element, string> = { kim: tr('Kim', "Metal"), moc: tr('Mộc', "Wood"), thuy: tr('Thủy', "Water"), hoa: tr('Hỏa', "Fire"), tho: tr('Thổ', "Earth") };
const PARRY_MS = 950;
/** Khung ngắm đỡ tuyệt kỹ co từ 2.4 xuống 0.8: lọt khung giữa là đúng nhịp */
const parryOf = (f: number): Parry => (f >= 0.78 && f <= 0.9 ? 'perfect' : f >= 0.64 && f <= 0.98 ? 'good' : 'miss');

function ultFx(r: RivalChar): FxSpec {
  const col = ELEMENTS[elementOf(r)].color;
  switch (r.path) {
    case 'kiem':
      return fxKiem(9, col);
    case 'phat':
      return fxPhatQuang();
    case 'tran':
      return fxBatQuai(col);
    case 'dan':
      return fxLua(10);
    case 'ma':
      return fxMaKhi(10);
    case 'yeu':
      return fxCuuVi(9);
    default:
      return fxRays(col);
  }
}

type Log = { n: number; lines: string[]; cls: 'w' | 'l' | 'c' | 'u' };
type Pop = { id: number; side: 'me' | 'foe'; v: number; tag?: string };

export function HpBar({ name, side, s, flip }: { name: string; side: FightState['me']; s?: string; flip?: boolean }) {
  const pct = Math.max(0, side.hp / side.max) * 100;
  return (
    <div className={`af-hp ${flip ? 'r' : ''}`}>
      <b>{name}</b>
      <span className="af-bar" aria-label={tr(`Máu ${side.hp}/${side.max}`, `HP ${side.hp}/${side.max}`)}>
        <i className={pct < 30 ? 'low' : ''} style={{ width: `${pct}%` }} />
        <em>
          {side.hp}/{side.max}
        </em>
      </span>
      <span className="af-ki" aria-label={tr(`Nội lực ${side.ki}/${KI_MAX}`, `Inner force ${side.ki}/${KI_MAX}`)}>
        {Array.from({ length: KI_MAX }, (_, i) => (
          <i key={i} className={i < side.ki ? (side.ki >= KI_MAX ? 'full' : 'on') : ''} />
        ))}
        {s && <small>{s}</small>}
      </span>
    </div>
  );
}

/** Trận lôi đài kiểu máu: thế + ấn ngũ hành mỗi lượt, nội lực đầy thì tung tuyệt kỹ, đỡ tuyệt kỹ đối thủ bằng nhịp */
export default function ArenaMatch({ me, foe0, opp, rule, revenge, user, onDone }: { me: RivalChar; foe0: RivalChar; opp: string; rule: ArenaRule; revenge: number | null; user: Player; onDone: () => void }) {
  const foe = useMemo(() => equalize(foe0, me), [foe0, me]);
  const base = useMemo(() => baseChance(me, foe, rule), [me, foe, rule]);
  const bg = useMemo(() => BGS[Math.floor(Math.random() * BGS.length)], []);
  const [st, setSt] = useState<FightState>(() => newFight(rule));
  const [intent, setIntent] = useState<Intent | null>(null);
  const [hand, setHand] = useState<Element[]>([]);
  const [sel, setSel] = useState<Element | null>(null);
  const [phase, setPhase] = useState<'idle' | 'anim' | 'cutin' | 'parry'>('idle');
  const [anim, setAnim] = useState<TurnResult | null>(null);
  const [cut, setCut] = useState<'me' | 'foe' | null>(null);
  const [pops, setPops] = useState<Pop[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [res, setRes] = useState<{ win: boolean; pts?: number; err?: string } | null>(null);
  const t0 = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const later = (ms: number, fn: () => void) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  };

  // lượt mới: đối thủ lộ ý đồ, rút 3 ấn ngũ hành
  useEffect(() => {
    if (st.over || st.foeUltNext || phase !== 'idle') return;
    const it = foeIntent(foe, st, rule, Math.random, me);
    const h = handOf(me, Math.random);
    setIntent(it);
    setHand(h);
    setSel(h[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.turn, st.foeUltNext, st.over]);

  // hết trận: ghi kết quả
  useEffect(() => {
    if (!st.over || res) return;
    const win = st.over === 'win';
    const pct = (s: FightState['me']) => Math.round((s.hp / s.max) * 100);
    const detail = tr(`${me.name} ${win ? tr('thắng', "defeated") : tr('thua', "lost to")} ${foe.name} sau ${st.turn} lượt (còn ${pct(st.me)}% máu, đối thủ ${pct(st.foe)}%). Luật hôm nay: ${rule.name}.`, `${me.name} ${win ? tr('thắng', "defeated") : tr('thua', "lost to")} ${foe.name} after ${st.turn} turns (${pct(st.me)}% HP left, opponent ${pct(st.foe)}%). Today's rule: ${rule.name}.`);
    track('arena_fight', { win, turns: st.turn, revenge: !!revenge, rule: rule.name });
    arenaFight2(user, opp, win, detail, revenge).then((r) => setRes({ win, pts: r?.pts, err: !r ? tr('Lôi đài đang đông, kết quả chưa ghi được.', "The Arena is packed - the result couldn't be recorded.") : r.error }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.over]);

  function land(r: TurnResult) {
    const id = Date.now();
    const tag = r.elemTag === 'khac' ? tr('Khắc!', "Counter!") : r.elemTag === 'bi_khac' ? tr('Bị khắc', "Countered") : undefined;
    const p: Pop[] = [];
    if (r.toFoe) p.push({ id: id + 1, side: 'foe', v: r.toFoe, tag: r.winner !== 'foe' ? (r.crit ? tr('Chí mạng!', "Critical!") : tag) : undefined });
    if (r.toMe) p.push({ id: id + 2, side: 'me', v: r.toMe, tag: r.winner === 'foe' ? (r.crit ? tr('Chí mạng!', "Critical!") : tag) : undefined });
    if (r.kind === 'ult_foe' && r.parry === 'perfect') p.push({ id: id + 3, side: 'me', v: 0, tag: tr('Hóa giải!', "Deflected!") });
    setPops(p);
    const n = st.turn + 1;
    setLogs((l) => [...l, { n, lines: turnLines(r, me, foe, Math.random), cls: r.kind !== 'trade' ? 'u' : r.winner === 'me' ? 'w' : r.winner === 'foe' ? 'l' : 'c' }]);
    setSt((s) => apply(s, r));
  }

  function play(s: Stance, el?: Element) {
    if (!intent || phase !== 'idle' || st.over) return;
    const r = trade(st, base, s, el ?? sel ?? hand[0], intent, rule, Math.random);
    setAnim(r);
    setPhase('anim');
    later(650, () => {
      land(r);
      later(350, () => {
        setAnim(null);
        setPhase('idle');
      });
    });
  }

  function ult() {
    if (phase !== 'idle' || st.me.ki < KI_MAX || st.over) return;
    setCut('me');
    setPhase('cutin');
    later(1500, () => {
      setCut(null);
      const r = myUlt(me, foe, base, st, rule);
      setAnim(r);
      setPhase('anim');
      later(500, () => {
        land(r);
        later(400, () => {
          setAnim(null);
          setPhase('idle');
        });
      });
    });
  }

  function brace(auto?: boolean) {
    if (phase !== 'idle' || !st.foeUltNext || st.over) return;
    setCut('foe');
    setPhase('cutin');
    later(1300, () => {
      setCut(null);
      if (auto) return finishParry(Math.random() < 0.5 ? 'good' : 'miss');
      t0.current = performance.now();
      setPhase('parry');
      later(PARRY_MS + 80, () => finishParry('miss'));
    });
  }
  function tapParry() {
    if (phase !== 'parry') return;
    finishParry(parryOf((performance.now() - t0.current) / PARRY_MS));
  }
  function finishParry(q: Parry) {
    const r = foeUlt(me, foe, base, st, rule, q);
    setAnim(r);
    setPhase('anim');
    try {
      if (q === 'miss') navigator.vibrate?.(140);
    } catch {}
    later(450, () => {
      land(r);
      later(450, () => {
        setAnim(null);
        setPhase('idle');
      });
    });
  }

  function auto() {
    if (phase !== 'idle' || st.over) return;
    if (st.foeUltNext) return brace(true);
    if (st.me.ki >= KI_MAX) return ult();
    if (!intent) return;
    const pk = autoPick(intent, hand, rule, Math.random);
    setSel(pk.el);
    play(pk.s, pk.el);
  }

  const all: Stance[] = ['cong', 'thu', 'hoa'];
  const meHurt = anim && anim.toMe > 0;
  const foeHurt = anim && anim.toFoe > 0;
  const lastLog = logs.length ? logs[logs.length - 1] : null;
  const elTag = (e: Element) => (intent?.elShown ? (elemMul(e, intent.elShown) > 1.2 ? tr('khắc', "counters") : elemMul(intent.elShown, e) > 1.2 ? tr('bị khắc', "countered") : '') : '');

  return (
    <div className="arena-match af" role="dialog" aria-modal="true" aria-label={tr(`Lôi đài với @${opp}`, `Arena vs @${opp}`)}>
      <div className={`af-stage ${anim?.kind === 'ult_me' || (anim?.kind === 'ult_foe' && anim.parry === 'miss') ? 'quake' : ''}`} style={{ backgroundImage: `url(${bg})` }}>
        <div className="af-hud">
          <HpBar name={me.name} side={st.me} s={st.me.ki >= KI_MAX ? tr('Tuyệt kỹ!', "Ultimate!") : undefined} />
          <span className="af-turn">
            {st.over ? (st.over === 'win' ? tr('THẮNG', "VICTORY") : tr('THUA', "DEFEAT")) : tr(`Lượt ${st.turn + 1}/${TURN_CAP}`, `Turn ${st.turn + 1}/${TURN_CAP}`)}
          </span>
          <HpBar name={`${foe.name}`} side={st.foe} s={st.foeUltNext ? tr('Sắp tung tuyệt kỹ!', "Ultimate incoming!") : undefined} flip />
        </div>
        <div className="af-floor">
          <div className={`af-fig me ${meHurt ? 'hurt' : anim && anim.winner === 'me' ? 'lunge' : ''} ${st.over === 'lose' ? 'down' : ''}`}>
            <Sprite c={foeChar(me)} size={96} anim={anim && anim.winner !== 'foe' ? 'slash' : meHurt ? 'hurt' : 'idle'} dir={3} />
            {pops
              .filter((p) => p.side === 'me')
              .map((p) => (
                <span key={p.id} className={`af-pop ${p.v ? 'dmg' : 'ok'}`}>
                  {p.v ? `-${p.v}` : ''}
                  {p.tag && <small>{p.tag}</small>}
                </span>
              ))}
          </div>
          <div className={`af-fig foe ${foeHurt ? 'hurt' : anim && anim.winner === 'foe' ? 'lunge' : ''} ${st.over === 'win' ? 'down' : ''}`}>
            <Sprite c={foeChar(foe)} size={96} anim={anim && anim.winner === 'foe' ? 'slash' : foeHurt ? 'hurt' : 'idle'} dir={1} />
            {pops
              .filter((p) => p.side === 'foe')
              .map((p) => (
                <span key={p.id} className="af-pop dmg">
                  -{p.v}
                  {p.tag && <small>{p.tag}</small>}
                </span>
              ))}
          </div>
          {anim?.kind === 'trade' && (
            <span className={`af-clash ${anim.winner}`}>
              <i style={{ color: ELEMENTS[anim.myEl!].color }}>{STANCES[anim.my!].name}</i> ⚔ <i style={{ color: ELEMENTS[anim.foeEl!].color }}>{STANCES[anim.foe!].name}</i>
            </span>
          )}
        </div>
      </div>

      {cut && (
        <div className={`af-cut ${cut}`} aria-live="assertive">
          <PixelFx spec={ultFx(cut === 'me' ? me : foe)} scale={4} dur={1.2} className="pa af-cut-fx" />
          <PixelFx spec={fxMotes(14, ELEMENTS[elementOf(cut === 'me' ? me : foe)].color)} scale={3} dur={1.4} className="pa af-cut-motes" />
          <span className="af-cut-fig">
            <Sprite c={foeChar(cut === 'me' ? me : foe)} size={176} anim="spellcast" dir={cut === 'me' ? 3 : 1} />
          </span>
          <span className="af-cut-band">
            <small>{cut === 'me' ? tr('Tuyệt kỹ', "Ultimate") : tr(`${foe.name} tung tuyệt kỹ`, `${foe.name} unleashes an ultimate`)}</small>
            <b>{ultName(cut === 'me' ? me : foe)}</b>
          </span>
        </div>
      )}

      {phase === 'parry' && (
        <div className="af-parry" onPointerDown={tapParry} role="button" aria-label={tr("Chạm đúng nhịp để đỡ tuyệt kỹ", "Tap on the beat to parry the ultimate")}>
          <div className="kiep-aim af-aim">
            <span className="ka-frame" />
            <span className="ka-ret" style={{ animationDuration: `${PARRY_MS}ms`, ['--s0' as string]: 2.4 } as CSSProperties} />
            <b>{tr("ĐỠ!", "PARRY!")}</b>
          </div>
          <p>{tr("Chạm khi ô ngắm lọt vào khung", "Tap when the reticle is inside the frame")}</p>
        </div>
      )}

      <div className="am-body">
        <p className="am-rule">
          <b>{rule.name}:</b> {rule.desc} {revenge ? <em>{tr("Trận báo thù, không tính lượt.", "Revenge match - doesn't use a turn.")}</em> : null}
          <br />
          <small>
            
            {tr("Ngang cảnh giới: ", "Realm-matched: ")}{foe.name}{tr(" (thật là ", " (actually ")}{foe0.realm === 0 ? tr('Phàm nhân', "Mortal") : realmLabel(foe0.realm, foe0.layer, foe0.cosmos)}{tr(") được kéo về ", ") is scaled to ")}{me.realm === 0 ? tr('Phàm nhân', "Mortal") : realmLabel(me.realm, me.layer, me.cosmos)}{tr(" như bạn.", " just like you.")}
          </small>
        </p>
        {!st.over ? (
          <>
            {st.foeUltNext ? (
              <>
                <p className="am-tell af-warn">
                  {foe.name}{tr(" đã tụ đủ nội lực, sắp tung ", " has gathered full inner force and is about to unleash ")}<b>“{ultName(foe)}”</b>! <small>{tr("Chạm đúng nhịp khi ô ngắm lọt vào khung: đúng nhịp thì phản đòn, hơi lệch thì đỡ được phần lớn.", "Tap on the beat when the reticle is inside the frame: perfect timing counters, slightly off still blocks most of it.")}</small>
                </p>
                <button className="btn btn-red btn-big af-brace" disabled={phase !== 'idle'} onClick={() => brace()}>
                  
                  {tr("Đón đỡ tuyệt kỹ", "Parry the ultimate")}
                </button>
              </>
            ) : (
              <>
                <p className="am-tell">
                  {intent?.tell.text} {intent?.elShown ? <>{tr("Quanh người tụ khí hệ ", "Qi gathers around them, element: ")}<b style={{ color: ELEMENTS[intent.elShown].color, textShadow: '1px 1px 0 #1f160d' }}>{EL_NAME[intent.elShown]}</b>.</> : null}
                  <small>{HABIT_TEXT[foe.path ?? ''] ?? ''}{tr(" Ý đồ để lộ không phải lúc nào cũng thật.", " Their tells aren't always honest.")}</small>
                </p>
                <div className="af-hand" role="radiogroup" aria-label={tr("Ấn ngũ hành gắn vào chiêu", "Five Elements seal attached to the move")}>
                  <small>{tr("Ấn ngũ hành", "Five Elements seal")}</small>
                  {hand.map((e) => (
                    <button key={e} role="radio" aria-checked={sel === e} className={`af-seal ${sel === e ? 'on' : ''}`} style={{ ['--ec' as string]: ELEMENTS[e].color }} onClick={() => setSel(e)} disabled={phase !== 'idle'}>
                      <b>{EL_NAME[e]}</b>
                      {elTag(e) && <small className={intent?.elShown && elemMul(e, intent.elShown) > 1.2 ? 'good' : 'bad'}>{elTag(e)}</small>}
                    </button>
                  ))}
                </div>
                {st.me.ki >= KI_MAX && (
                  <button className="btn btn-big af-ult" disabled={phase !== 'idle'} onClick={ult}>
                    
                    {tr("✦ Tuyệt kỹ: ", "✦ Ultimate: ")}{ultName(me)}
                  </button>
                )}
                <div className="am-stances">
                  {all.map((s) => {
                    const beat = all.find((x) => beats(s, x, rule))!;
                    const lose = all.find((x) => beats(x, s, rule))!;
                    return (
                      <button key={s} className={`am-stance st-${s}`} disabled={phase !== 'idle' || (st.turn === 0 && !!rule.force1 && rule.force1 !== s)} onClick={() => play(s)}>
                        <b>{STANCES[s].name}</b>
                        <small>
                          
                          {tr("thắng ", "beats ")}{STANCES[beat].name}{tr(", thua ", ", loses to ")}{STANCES[lose].name}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            <button className="btn am-auto" disabled={phase !== 'idle'} onClick={auto}>
              
              {tr("Tự đánh lượt này", "Auto-play this turn")}
            </button>
          </>
        ) : (
          <div className="am-res">
            {res ? (
              <>
                <p>
                  {st.over === 'win' ? tr(`Bạn thắng sau ${st.turn} lượt. +3 điểm lôi đài.`, `You win after ${st.turn} turns. +3 arena points.`) : tr(`Bạn thua sau ${st.turn} lượt. Không được điểm.`, `You lose after ${st.turn} turns. No points.`)}
                  {typeof res.pts === 'number' ? tr(` Tuần này: ${res.pts} điểm.`, ` This week: ${res.pts} points.`) : ''}
                </p>
                {res.err && <p className="ar-err">{res.err === 'NO_TURNS' ? tr('Hôm nay đã hết lượt.', "No turns left today.") : res.err === 'NO_REVENGE' ? tr('Lượt báo thù đã hết hạn.', "Your revenge match has expired.") : res.err === 'BAD_OPP' ? tr('Quẻ này không còn hiệu lực.', "This draw is no longer valid.") : res.err}</p>}
              </>
            ) : (
              <p>{tr("Đang ghi kết quả lên bảng...", "Recording the result...")}</p>
            )}
            <button className="btn btn-red btn-big" disabled={!res} onClick={onDone}>
              
              {tr("Rời lôi đài", "Leave the arena")}
            </button>
          </div>
        )}
        {logs.length > 0 ? (
          <section className="am-comm" aria-live="polite">
            <h4>{tr("Diễn biến", "Match log")}</h4>
            {[...logs].reverse().map((l) => (
              <div key={l.n} className={`am-round ${l.cls === 'w' || l.cls === 'u' ? 'w' : l.cls === 'l' ? 'l' : ''} ${l === lastLog ? 'live' : ''}`}>
                <b>{tr("Lượt ", "Turn ")}{l.n}</b>
                {l.lines.map((t, k) => (
                  <p key={k} className={k === l.lines.length - 1 ? 'res' : k === 0 ? 'me' : 'foe'}>
                    {t}
                  </p>
                ))}
              </div>
            ))}
          </section>
        ) : (
          <p className="am-comm-empty">{tr("Diễn biến trận đấu sẽ hiện ở đây.", "The match log will appear here.")}</p>
        )}
      </div>
    </div>
  );
}
