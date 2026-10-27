'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Sprite from '@/components/Sprite';
import PhiKiem from '@/components/PhiKiem';
import { HpBar } from '@/components/ArenaMatch';
import { PixelFx, fxMotes } from '@/components/PixelFx';
import type { Player } from '@/lib/auth';
import { PATHS, realmLabel } from '@/lib/game/data';
import { foeChar } from '@/lib/game/duel';
import { ELEMENTS, elementOf } from '@/lib/game/nguhanh';
import type { RivalChar } from '@/lib/game/types';
import { baseChance, equalize, type ArenaRule } from '@/lib/game/arena';
import { turnLines, ultName, type FightState } from '@/lib/game/arenaFight';
import { ARENA_DAY_HON, ARENA_LOSE_PHUC, ARENA_WIN_PHUC, autoClash, powerOf, tierOfPts, type Clash } from '@/lib/game/phiKiem';
import { arenaFight3 } from '@/lib/social';
import { shareMatch, type ShareOut } from '@/lib/shareCard';
import ShareSheet from '@/components/ShareSheet';
import { track } from '@/lib/track';

const BGS = ['tien', 'ma', 'hu'].flatMap((c) => ['kim', 'moc', 'thuy', 'hoa', 'tho'].map((e) => `/bg/nhd-${c}-${e}.png`));
type Phase = 'vs' | 'pk' | 'clash' | 'final' | 'res';
type Pop = { id: number; side: 'me' | 'foe'; v: number; tag?: string };
type Res = { pts?: number; used?: number; phuc?: number; hon?: number; err?: string };

const realmOf = (r: RivalChar) => (r.realm === 0 ? 'Phàm nhân' : realmLabel(r.realm, r.layer, r.cosmos));

/** Một trận Lôi đài Phi Kiếm khoảng 25 giây: thẻ VS, phi kiếm phá hộ thể, hai bóng tự đánh, đòn kết liễu chậm, thẻ kết quả */
export default function LoiDaiMatch({
  me,
  foe0,
  opp,
  rule,
  revenge,
  user,
  leftAfter,
  onNext,
  onDone,
}: {
  me: RivalChar;
  foe0: RivalChar;
  opp: string;
  rule: ArenaRule;
  revenge: number | null;
  user: Player;
  leftAfter: number; // lượt còn lại sau trận này
  onNext: () => void;
  onDone: () => void;
}) {
  const foe = useMemo(() => equalize(foe0, me), [foe0, me]);
  const base = useMemo(() => baseChance(me, foe, rule), [me, foe, rule]);
  const bg = useMemo(() => BGS[Math.floor(Math.random() * BGS.length)], []);
  const [phase, setPhase] = useState<Phase>('vs');
  const [swords, setSwords] = useState(0);
  const [clash, setClash] = useState<Clash | null>(null);
  const [step, setStep] = useState(-1);
  const [pops, setPops] = useState<Pop[]>([]);
  const [line, setLine] = useState('');
  const [banner, setBanner] = useState<string | null>(null);
  const [res, setRes] = useState<Res | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [sheet, setSheet] = useState<ShareOut | null>(null);
  const [sharing, setSharing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const later = (ms: number, fn: () => void) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  };
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  // thẻ VS đập xuống rồi vào phi kiếm
  useEffect(() => {
    if (phase === 'vs') later(2600, () => setPhase('pk'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function afterPk(n: number) {
    setSwords(n);
    const c = autoClash(me, foe0, base, rule, powerOf(n));
    setClash(c);
    setStep(-1);
    setPhase('clash');
    track('arena_pk', { swords: n, win: c.win });
  }

  // phát lại từng nhịp trận tự đánh; nhịp cuối chuyển sang đòn kết liễu chậm
  useEffect(() => {
    if (phase !== 'clash' || !clash) return;
    const n = clash.steps.length;
    if (step >= n - 2) {
      later(step < 0 ? 400 : 420, () => setPhase('final'));
      return;
    }
    const gap = n > 12 ? 360 : 440;
    later(step < 0 ? 500 : gap, () => showStep(step + 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, step, clash]);

  function showStep(i: number) {
    if (!clash) return;
    const s = clash.steps[i];
    const id = Date.now();
    const p: Pop[] = [];
    if (s.r.toFoe) p.push({ id: id + 1, side: 'foe', v: s.r.toFoe, tag: s.r.crit ? 'Chí mạng!' : s.r.elemTag === 'khac' && s.r.winner === 'me' ? 'Khắc!' : undefined });
    if (s.r.toMe) p.push({ id: id + 2, side: 'me', v: s.r.toMe, tag: s.r.crit ? 'Chí mạng!' : undefined });
    setPops(p);
    setBanner(s.comeback ? (s.comeback === 'me' ? `${me.name}: Tuyệt địa phản kích!` : `${foe.name}: Tuyệt địa phản kích!`) : null);
    if (s.comeback) setLine(s.comeback === 'me' ? `Bị dồn tới đường cùng, ${me.name} bùng nổ đánh trả, ${foe.name} mất ${s.r.toFoe} máu.` : `${foe.name} bị dồn tới đường cùng, bùng nổ đánh trả, bạn mất ${s.r.toMe} máu.`);
    else setLine(turnLines(s.r, me, foe, Math.random).slice(-1)[0] ?? '');
    setStep(i);
  }

  // đòn kết liễu: chậm lại, tên tuyệt kỹ, đóng dấu, rồi ghi kết quả
  useEffect(() => {
    if (phase !== 'final' || !clash) return;
    const last = clash.steps.length - 1;
    later(1500, () => {
      showStep(last);
      later(900, () => {
        setPhase('res');
        const hp = clash.hpPct;
        const detail = `${me.name} ${clash.win ? 'hạ' : 'bại dưới tay'} ${foe.name}, cắm ${swords} phi kiếm, ${clash.win ? 'còn' : 'đối thủ còn'} ${hp}% máu. Luật hôm nay: ${rule.name}.`;
        track('arena_fight', { win: clash.win, swords, revenge: !!revenge, rule: rule.name, mode: 'phi_kiem' });
        arenaFight3(user, opp, clash.win, detail, revenge, hp, swords).then((r) => setRes(r ? { ...r, err: r.error } : { err: 'Lôi đài đang đông, kết quả chưa ghi được.' }));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function skip() {
    if (phase !== 'clash' || !clash) return;
    setStep(clash.steps.length - 2);
  }

  async function share() {
    if (!clash) return;
    track('share', { kind: 'match' });
    setSharing(true);
    setShareMsg(null);
    const r = await shareMatch({ me, foe, meUser: user.username, opp, win: clash.win, hp: clash.hpPct, swords, rule: rule.name });
    setSharing(false);
    if (r?.link) setSheet(r);
    else setShareMsg(r?.saved ? 'Chưa tạo được link, đã tải ảnh về máy.' : 'Chưa khoe được, thử lại sau.');
  }

  const cur: FightState | null = clash ? (step >= 0 ? clash.steps[step].st : { ...clash.steps[0].st, me: { ...clash.steps[0].st.me, hp: clash.steps[0].st.me.max, ki: 0 }, foe: { ...clash.steps[0].st.foe, hp: clash.steps[0].st.foe.max, ki: 0 }, over: null }) : null;
  const done = phase === 'res' || (phase === 'final' && clash && step === clash.steps.length - 1);
  const meHurt = pops.some((p) => p.side === 'me');
  const foeHurt = pops.some((p) => p.side === 'foe');
  const winName = clash ? (clash.win ? me : foe) : me;
  const pw = Math.round(powerOf(swords) * 100);
  const tier = res?.pts !== undefined ? tierOfPts(res.pts) : null;

  return (
    <div className="arena-match af ldm" role="dialog" aria-modal="true" aria-label={`Lôi đài với @${opp}`}>
      {phase === 'vs' && (
        <div className="ldm-vs" onClick={() => setPhase('pk')} role="button" aria-label="Chạm để vào trận">
          <div className="ldm-vs-card me">
            <Sprite c={foeChar(me)} size={96} anim="idle" dir={3} />
            <b>{me.name}</b>
            <small>
              @{user.username} · {me.path ? PATHS[me.path].name : 'Chưa chọn đường'} · {ELEMENTS[elementOf(me)].name}
            </small>
          </div>
          <span className="ldm-vs-x">VS</span>
          <div className="ldm-vs-card foe">
            <Sprite c={foeChar(foe)} size={96} anim="idle" dir={1} />
            <b>{foe.name}</b>
            <small>
              @{opp} · {foe.path ? PATHS[foe.path].name : 'Chưa chọn đường'} · {ELEMENTS[elementOf(foe)].name}
            </small>
          </div>
          <p className="ldm-vs-rule">
            Ngang cảnh giới <b>{realmOf(me)}</b> · Luật hôm nay: <b>{rule.name}</b>
            {revenge ? ' · Trận báo thù' : ''}
          </p>
        </div>
      )}

      {phase === 'pk' && <PhiKiem foe={foe} base={base} onDone={afterPk} />}

      {(phase === 'clash' || phase === 'final' || phase === 'res') && clash && cur && (
        <>
          <div className={`af-stage ldm-stage ${phase === 'final' ? 'slowmo' : ''}`} style={{ backgroundImage: `url(${bg})` }}>
            <div className="af-hud">
              <HpBar name={me.name} side={cur.me} />
              <span className="af-turn">{done ? (clash.win ? 'THẮNG' : 'BẠI') : `${pw}% sức`}</span>
              <HpBar name={foe.name} side={cur.foe} flip />
            </div>
            <div className="af-floor">
              <div className={`af-fig me ${meHurt && phase !== 'res' ? 'hurt' : ''} ${done && !clash.win ? 'down' : ''}`}>
                <Sprite c={foeChar(me)} size={96} anim={foeHurt ? 'slash' : meHurt ? 'hurt' : 'idle'} dir={3} />
                {pops
                  .filter((p) => p.side === 'me')
                  .map((p) => (
                    <span key={p.id} className="af-pop dmg">
                      -{p.v}
                      {p.tag && <small>{p.tag}</small>}
                    </span>
                  ))}
              </div>
              <div className={`af-fig foe ${foeHurt && phase !== 'res' ? 'hurt' : ''} ${done && clash.win ? 'down' : ''}`}>
                <Sprite c={foeChar(foe)} size={96} anim={meHurt ? 'slash' : foeHurt ? 'hurt' : 'idle'} dir={1} />
                {pops
                  .filter((p) => p.side === 'foe')
                  .map((p) => (
                    <span key={p.id} className="af-pop dmg">
                      -{p.v}
                      {p.tag && <small>{p.tag}</small>}
                    </span>
                  ))}
              </div>
              {banner && phase === 'clash' && <span className="ldm-banner">{banner}</span>}
              {done && <span className={`ldm-stamp ${clash.win ? 'win' : 'lose'}`}>{clash.win ? 'THẮNG' : 'BẠI'}</span>}
            </div>
          </div>
          {phase === 'final' && step < clash.steps.length - 1 && (
            <div className={`af-cut ldm-cut ${clash.win ? 'me' : 'foe'}`} aria-live="assertive">
              <PixelFx spec={fxMotes(14, ELEMENTS[elementOf(winName)].color)} scale={3} dur={1.6} className="pa af-cut-motes" />
              <span className="af-cut-fig">
                <Sprite c={foeChar(winName)} size={176} anim="spellcast" dir={clash.win ? 3 : 1} />
              </span>
              <span className="af-cut-band">
                <small>Đòn kết liễu</small>
                <b>{swords >= 16 && clash.win ? 'Vạn Kiếm Quy Tông' : ultName(winName)}</b>
              </span>
            </div>
          )}
          <div className="am-body">
            {phase !== 'res' ? (
              <>
                <p className="am-tell ldm-line" aria-live="polite">
                  {line || `${me.name} mang ${swords} phi kiếm, sức mạnh ${pw}%. Hai bóng lao vào nhau!`}
                </p>
                {phase === 'clash' && (
                  <button className="btn am-auto" onClick={skip}>
                    Tua tới đòn cuối
                  </button>
                )}
              </>
            ) : (
              <div className={`ldm-res ${clash.win ? 'win' : 'lose'}`}>
                <b className="ldm-res-head">{clash.win ? `Bạn hạ @${opp}` : `@${opp} thắng bạn`}</b>
                <p>
                  {swords} phi kiếm · {clash.win ? 'còn' : 'đối thủ còn'} {clash.hpPct}% máu
                </p>
                {res ? (
                  res.err ? (
                    <p className="ar-err">{res.err === 'NO_TURNS' ? 'Hôm nay đã hết lượt.' : res.err === 'NO_REVENGE' ? 'Lượt báo thù đã hết hạn.' : res.err === 'BAD_OPP' ? 'Lượt này không còn hiệu lực.' : res.err}</p>
                  ) : (
                    <ul className="ldm-gain">
                      <li>+{clash.win ? 3 : 1} điểm</li>
                      <li>+{res.phuc ?? (clash.win ? ARENA_WIN_PHUC : ARENA_LOSE_PHUC)} phúc</li>
                      {(res.hon ?? 0) > 0 && <li>+{ARENA_DAY_HON} Hồn lực</li>}
                      {tier && <li className="ldm-tier">{tier.name}{tier.next ? ` · còn ${tier.next.need} lên ${tier.next.name}` : ''}</li>}
                    </ul>
                  )
                ) : (
                  <p>Đang ghi kết quả lên bảng...</p>
                )}
                <div className="ldm-acts">
                  {leftAfter > 0 && !revenge ? (
                    <button className="btn btn-red btn-big" disabled={!res} onClick={onNext}>
                      Trận tiếp · còn {leftAfter} lượt
                    </button>
                  ) : (
                    <button className="btn btn-red btn-big" disabled={!res} onClick={onDone}>
                      Rời lôi đài
                    </button>
                  )}
                  <button className="btn ldm-share" onClick={share} disabled={sharing}>
                    {sharing ? 'Đang tạo link...' : 'Khoe trận'}
                  </button>
                  {leftAfter > 0 && !revenge && (
                    <button className="btn ldm-leave" disabled={!res} onClick={onDone}>
                      Nghỉ đã
                    </button>
                  )}
                </div>
                {shareMsg && <small className="note">{shareMsg}</small>}
                {sheet && <ShareSheet out={sheet} kind="match" onClose={() => setSheet(null)} />}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
