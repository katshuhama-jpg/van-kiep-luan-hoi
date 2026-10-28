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
import { ultName, type FightState } from '@/lib/game/arenaFight';
import { chatOf, koLine, type ChatMsg } from '@/lib/game/wuxiaChat';
import { ARENA_DAY_HON, ARENA_LOSE_PHUC, ARENA_WIN_PHUC, autoClash, powerOf, tierOfPts, type Clash } from '@/lib/game/phiKiem';
import { arenaFight3, thachFight } from '@/lib/social';
import { shareMatch, type ShareOut } from '@/lib/shareCard';
import ShareSheet from '@/components/ShareSheet';
import { track } from '@/lib/track';
import { tr } from '@/lib/i18n';

const MSG_GAP = 550; // ms giữa hai câu thoại
const BGS = ['tien', 'ma', 'hu'].flatMap((c) => ['kim', 'moc', 'thuy', 'hoa', 'tho'].map((e) => `/bg/nhd-${c}-${e}.png`));
type Phase = 'vs' | 'pk' | 'clash' | 'final' | 'res';
type Pop = { id: number; side: 'me' | 'foe'; v: number; tag?: string };
type Res = { pts?: number; used?: number; phuc?: number; hon?: number; left?: number; err?: string };

const realmOf = (r: RivalChar) => (r.realm === 0 ? tr('Phàm nhân', "Mortal") : realmLabel(r.realm, r.layer, r.cosmos));

/** Một trận Lôi đài Phi Kiếm khoảng 25 giây: thẻ VS, phi kiếm phá hộ thể, hai bóng tự đánh, đòn kết liễu chậm, thẻ kết quả */
export default function LoiDaiMatch({
  me,
  foe0,
  opp,
  rule,
  revenge,
  user,
  leftAfter,
  mode = 'arena',
  lifeId = 0,
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
  mode?: 'arena' | 'thach'; // thach: hạ chiến thư với bóng một kiếp cụ thể
  lifeId?: number;
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
  const [chat, setChat] = useState<(ChatMsg & { k: number; d: number })[]>([]);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const msgN = useRef(0);
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
      later(step < 0 ? 400 : lastLen.current * MSG_GAP + 300, () => setPhase('final'));
      return;
    }
    // mỗi câu thoại hiện cách nhau một nhịp để kịp đọc như phim chưởng
    const said = step >= 0 ? lastLen.current : 1;
    later(step < 0 ? 600 : said * MSG_GAP + 350, () => showStep(step + 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, step, clash]);

  // thêm thoại vào khung chat; instant: tua nhanh thì hiện ngay không chờ
  const lastLen = useRef(1);
  function say(msgs: ChatMsg[], instant = false) {
    lastLen.current = msgs.length;
    setChat((c) => [...c, ...msgs.map((m, j) => ({ ...m, k: ++msgN.current, d: instant ? 0 : j * MSG_GAP }))]);
  }

  function showStep(i: number, instant = false) {
    if (!clash) return;
    const s = clash.steps[i];
    const id = Date.now();
    const p: Pop[] = [];
    if (s.r.toFoe) p.push({ id: id + 1, side: 'foe', v: s.r.toFoe, tag: s.r.crit ? tr('Chí mạng!', "Critical!") : s.r.elemTag === 'khac' && s.r.winner === 'me' ? tr('Khắc!', "Counter!") : undefined });
    if (s.r.toMe) p.push({ id: id + 2, side: 'me', v: s.r.toMe, tag: s.r.crit ? tr('Chí mạng!', "Critical!") : undefined });
    setPops(p);
    setBanner(s.comeback ? (s.comeback === 'me' ? tr(`${me.name}: Tuyệt địa phản kích!`, `${me.name}: Last-stand counterattack!`) : tr(`${foe.name}: Tuyệt địa phản kích!`, `${foe.name}: Last-stand counterattack!`)) : null);
    const last = i === clash.steps.length - 1;
    const msgs = chatOf(s.r, me, foe, Math.random, { comeback: s.comeback, last });
    if (last) msgs.push(koLine(clash.win ? foe.name : me.name));
    say(msgs, instant);
    setStep(i);
  }

  // đòn kết liễu: chậm lại, tên tuyệt kỹ, đóng dấu, rồi ghi kết quả
  useEffect(() => {
    if (phase !== 'final' || !clash) return;
    const last = clash.steps.length - 1;
    later(1500, () => {
      showStep(last);
      // đọc xong mấy câu kết liễu rồi mới hiện bảng kết quả
      later(lastLen.current * MSG_GAP + 700, () => {
        setPhase('res');
        const hp = clash.hpPct;
        const detail = tr(`${me.name} ${clash.win ? tr('hạ', "defeated") : tr('bại dưới tay', "fell to")} ${foe.name}, cắm ${swords} phi kiếm, ${clash.win ? tr('còn', "keeping") : tr('đối thủ còn', "opponent keeping")} ${hp}% máu. Luật hôm nay: ${rule.name}.`, `${me.name} ${clash.win ? tr('hạ', "defeated") : tr('bại dưới tay', "fell to")} ${foe.name}, landing ${swords} flying swords, ${clash.win ? tr('còn', "keeping") : tr('đối thủ còn', "opponent keeping")} ${hp}% HP. Today's rule: ${rule.name}.`);
        track('arena_fight', { win: clash.win, swords, revenge: !!revenge, rule: rule.name, mode: 'phi_kiem' });
        if (mode === 'thach')
          thachFight(user, opp, lifeId, clash.win, hp, swords, detail).then((r) => setRes(r ? { phuc: r.phuc, left: r.left, err: r.error } : { err: tr('Chưa ghi được chiến thư, thử lại sau.', "Couldn't record the challenge, try again later.") }));
        else arenaFight3(user, opp, clash.win, detail, revenge, hp, swords).then((r) => setRes(r ? { ...r, err: r.error } : { err: tr('Lôi đài đang đông, kết quả chưa ghi được.', "The arena is crowded; the result wasn't recorded.") }));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function skip() {
    if (phase !== 'clash' || !clash) return;
    // tua: in hết thoại các nhịp còn lại ngay, rồi vào đòn kết liễu
    for (let i = step + 1; i <= clash.steps.length - 2; i++) showStep(i, true);
    setStep(clash.steps.length - 2);
  }

  // khung thoại luôn cuộn xuống câu mới nhất
  useEffect(() => {
    // cuộn trong khung thoại, sân đấu và thanh máu vẫn đứng yên ở trên
    const el = chatBoxRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [chat.length]);

  async function share() {
    if (!clash) return;
    track('share', { kind: 'match' });
    setSharing(true);
    setShareMsg(null);
    const r = await shareMatch({ me, foe, meUser: user.username, opp, win: clash.win, hp: clash.hpPct, swords, rule: rule.name });
    setSharing(false);
    if (r?.link) setSheet(r);
    else setShareMsg(r?.saved ? tr('Chưa tạo được link, đã tải ảnh về máy.', "Couldn't create a link; the image was downloaded instead.") : tr('Chưa khoe được, thử lại sau.', "Couldn't share, try again later."));
  }

  const cur: FightState | null = clash ? (step >= 0 ? clash.steps[step].st : { ...clash.steps[0].st, me: { ...clash.steps[0].st.me, hp: clash.steps[0].st.me.max, ki: 0 }, foe: { ...clash.steps[0].st.foe, hp: clash.steps[0].st.foe.max, ki: 0 }, over: null }) : null;
  const done = phase === 'res' || (phase === 'final' && clash && step === clash.steps.length - 1);
  const meHurt = pops.some((p) => p.side === 'me');
  const foeHurt = pops.some((p) => p.side === 'foe');
  const winName = clash ? (clash.win ? me : foe) : me;
  const pw = Math.round(powerOf(swords) * 100);
  const tier = res?.pts !== undefined ? tierOfPts(res.pts) : null;

  const chatBox = (
    <div className={`ldm-chat ${phase === 'res' ? 'static' : ''}`} aria-live="polite" ref={chatBoxRef}>
      <p className="lc-msg nar">
        {me.name}{tr(" mang ", " carries ")}{swords}{tr(" phi kiếm, sức mạnh ", " flying swords, power ")}{pw}{tr("%. Hai bóng bước lên lôi đài!", "%. Two shadows step into the arena!")}
      </p>
      {chat.map((m) => (
        <p key={m.k} className={`lc-msg ${m.who} ${m.big ? 'big' : ''}`} style={m.d ? { animationDelay: `${m.d}ms` } : undefined}>
          {m.who !== 'nar' && <b className="lc-name">{m.who === 'me' ? me.name : foe.name}</b>}
          <span>{m.text}</span>
          {m.hit && (
            <span className="lc-hit">
              {m.hit.map((h, j) => (
                <em key={j} className={h.side}>
                  {h.side === 'me' ? me.name : foe.name} -{h.v}
                </em>
              ))}
            </span>
          )}
        </p>
      ))}
      </div>
  );

  return (
    <div className="arena-match af ldm" role="dialog" aria-modal="true" aria-label={tr(`Lôi đài với @${opp}`, `Arena vs @${opp}`)}>
      {phase === 'vs' && (
        <div className="ldm-vs" onClick={() => setPhase('pk')} role="button" aria-label={tr("Chạm để vào trận", "Tap to enter the fight")}>
          <div className="ldm-vs-card me">
            <Sprite c={foeChar(me)} size={96} anim="idle" dir={3} />
            <b>{me.name}</b>
            <small>
              @{user.username} · {me.path ? PATHS[me.path].name : tr('Chưa chọn đường', "No path chosen")} · {ELEMENTS[elementOf(me)].name}
            </small>
          </div>
          <span className="ldm-vs-x">VS</span>
          <div className="ldm-vs-card foe">
            <Sprite c={foeChar(foe)} size={96} anim="idle" dir={1} />
            <b>{foe.name}</b>
            <small>
              @{opp} · {foe.path ? PATHS[foe.path].name : tr('Chưa chọn đường', "No path chosen")} · {ELEMENTS[elementOf(foe)].name}
            </small>
          </div>
          <p className="ldm-vs-rule">
            
            {tr("Ngang cảnh giới ", "Leveled to ")}<b>{realmOf(me)}</b>{tr(" · Luật hôm nay: ", " · Today's rule: ")}<b>{rule.name}</b>
            {revenge ? tr(' · Trận báo thù', " · Revenge match") : ''}
          </p>
        </div>
      )}

      {phase === 'pk' && <PhiKiem foe={foe} base={base} onDone={afterPk} />}

      {(phase === 'clash' || phase === 'final' || phase === 'res') && clash && cur && (
        <>
          <div className={`af-stage ldm-stage ${phase === 'final' ? 'slowmo' : ''}`} style={{ backgroundImage: `url(${bg})` }}>
            <div className="af-hud">
              <HpBar name={me.name} side={cur.me} />
              <span className="af-turn">{done ? (clash.win ? tr('THẮNG', "VICTORY") : tr('BẠI', "DEFEAT")) : tr(`${pw}% sức`, `${pw}% power`)}</span>
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
              {done && <span className={`ldm-stamp ${clash.win ? 'win' : 'lose'}`}>{clash.win ? tr('THẮNG', "VICTORY") : tr('BẠI', "DEFEAT")}</span>}
            </div>
          </div>
          {phase === 'final' && step < clash.steps.length - 1 && (
            <div className={`af-cut ldm-cut ${clash.win ? 'me' : 'foe'}`} aria-live="assertive">
              <PixelFx spec={fxMotes(14, ELEMENTS[elementOf(winName)].color)} scale={3} dur={1.6} className="pa af-cut-motes" />
              <span className="af-cut-fig">
                <Sprite c={foeChar(winName)} size={176} anim="spellcast" dir={clash.win ? 3 : 1} />
              </span>
              <span className="af-cut-band">
                <small>{tr("Đòn kết liễu", "Finishing blow")}</small>
                <b>{swords >= 16 && clash.win ? tr('Vạn Kiếm Quy Tông', "Ten Thousand Swords Return") : ultName(winName)}</b>
              </span>
            </div>
          )}
          <div className="am-body">
            {phase !== 'res' ? (
              <>
                {chatBox}
                {phase === 'clash' && (
                  <button className="btn am-auto" onClick={skip}>
                    
                    {tr("Tua tới đòn cuối", "Skip to the final blow")}
                  </button>
                )}
              </>
            ) : (
              <>
              <div className={`ldm-res ${clash.win ? 'win' : 'lose'}`}>
                <b className="ldm-res-head">{clash.win ? tr(`Bạn hạ @${opp}`, `You defeated @${opp}`) : tr(`@${opp} thắng bạn`, `@${opp} defeated you`)}</b>
                <p>
                  {swords}{tr(" phi kiếm · ", " flying swords · ")}{clash.win ? tr('còn', "keeping") : tr('đối thủ còn', "opponent keeping")} {clash.hpPct}{tr("% máu", "% HP")}
                </p>
                {res ? (
                  res.err ? (
                    <p className="ar-err">{res.err === 'NO_TURNS' ? tr('Hôm nay đã hết lượt.', "No turns left today.") : res.err === 'NO_REVENGE' ? tr('Lượt báo thù đã hết hạn.', "Your revenge chance has expired.") : res.err === 'BAD_OPP' ? tr('Lượt này không còn hiệu lực.', "This turn is no longer valid.") : res.err}</p>
                  ) : (
                    <ul className="ldm-gain">
                      {mode === 'arena' ? <li>+{clash.win ? 3 : 1}{tr(" điểm", " points")}</li> : <li>{tr("Còn ", "You have ")}{res.left ?? 0}{tr(" chiến thư hôm nay", " challenges left today")}</li>}
                      <li>+{res.phuc ?? (clash.win ? ARENA_WIN_PHUC : ARENA_LOSE_PHUC)}{tr(" phúc", " Fortune")}</li>
                      {(res.hon ?? 0) > 0 && <li>+{ARENA_DAY_HON}{tr(" Hồn lực", " Soul Power")}</li>}
                      {tier && <li className="ldm-tier">{tier.name}{tier.next ? tr(` · còn ${tier.next.need} lên ${tier.next.name}`, ` · ${tier.next.need} more to ${tier.next.name}`) : ''}</li>}
                    </ul>
                  )
                ) : (
                  <p>{tr("Đang ghi kết quả lên bảng...", "Recording result on the board...")}</p>
                )}
                <div className="ldm-acts">
                  {leftAfter > 0 && !revenge && mode === 'arena' ? (
                    <button className="btn btn-red btn-big" disabled={!res} onClick={onNext}>
                      
                      {tr("Trận tiếp · còn ", "Next match · ")}{leftAfter}{tr(" lượt", " turns left")}
                    </button>
                  ) : (
                    <button className="btn btn-red btn-big" disabled={!res} onClick={onDone}>
                      
                      {tr("Rời lôi đài", "Leave the arena")}
                    </button>
                  )}
                  <button className="btn ldm-share" onClick={share} disabled={sharing}>
                    {sharing ? tr('Đang tạo link...', "Creating link...") : tr('Khoe trận', "Show off match")}
                  </button>
                  {leftAfter > 0 && !revenge && mode === 'arena' && (
                    <button className="btn ldm-leave" disabled={!res} onClick={onDone}>
                      
                      {tr("Nghỉ đã", "Take a break")}
                    </button>
                  )}
                </div>
                {shareMsg && <small className="note">{shareMsg}</small>}
                {sheet && <ShareSheet out={sheet} kind="match" onClose={() => setSheet(null)} />}
              </div>
              <h3 className="lc-title">{tr("Diễn biến trận", "Match log")}</h3>
              {chatBox}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
