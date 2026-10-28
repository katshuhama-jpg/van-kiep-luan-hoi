'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Sprite from './Sprite';
import { foeChar } from '@/lib/game/duel';
import { HO_DAO_MAX, helpersFor, hoDaoCap, hoDaoPower, lastWords, lightningGrudge, loadPastSelves, type PastSelf } from '@/lib/vanKiep';
import { tuKiep, type KiepCard } from '@/lib/game/vanDao';
import { realmLabel } from '@/lib/game/data';
import type { Character } from '@/lib/game/types';
import { useAuth } from '@/lib/useAuth';
import { tr } from '@/lib/i18n';

/** Bóng một kiếp trước, vẽ lại từ ngoại hình đã lưu */
export function PastSelfSprite({ p, size = 56, anim = 'idle', dir = 2 }: { p: PastSelf; size?: number; anim?: 'idle' | 'hurt' | 'spellcast'; dir?: number }) {
  const c = useMemo(() => foeChar(p.rival), [p]);
  return <Sprite c={c} size={size} anim={anim} dir={dir} />;
}

/** Hàng bóng kiếp trước ở màn cáo biệt: kiếp vừa hết bước vào hàng. Ai chết cũng thấy ngay. */
export function VanKiepRow({ c }: { c: Character }) {
  const { user, ready } = useAuth();
  const [lives, setLives] = useState<PastSelf[] | null>(null);
  useEffect(() => {
    if (!ready) return;
    loadPastSelves(user, 400).then(setLives).catch(() => setLives([]));
  }, [ready, user]);
  if (!lives) return null;
  const shown = lives.slice(-9);
  const n = lives.length + 1;
  // kiếp vừa hết cũng tính vào (đã đứng vào hàng)
  const power = hoDaoCap([...lives, { realm: c.realm, ascended: !!c.ascended }]);
  return (
    <div className="vk-row" aria-label={tr(`Vạn kiếp sau lưng bạn: ${n} kiếp`, `Lives behind you: ${n}`)}>
      <div className="vk-line">
        {lives.length > shown.length && <span className="vk-more">+{lives.length - shown.length}</span>}
        {shown.map((p, i) => (
          <span key={p.id} className="vk-ghost" style={{ animationDelay: `${i * 0.08}s` }} title={`${tr('Kiếp', 'Life')} ${p.lifeNo} · ${p.name}`}>
            <PastSelfSprite p={p} size={44} />
          </span>
        ))}
        <span className="vk-ghost vk-new" style={{ animationDelay: `${shown.length * 0.08 + 0.3}s` }}>
          <Sprite c={{ ...c, dead: false }} size={52} anim="idle" dir={2} />
        </span>
      </div>
      <p>
        <b>{tr(`${c.name} bước vào hàng vạn kiếp.`, `${c.name} joins the line of your lives.`)}</b>{' '}
        {tr(`Sau lưng bạn giờ có ${n} kiếp, 13 kiếp mạnh nhất đủ sức đỡ ${power}/13 đạo lôi. Tới ngày Chứng Đạo, họ sẽ đỡ lôi thay bạn.`, `${n} lives now stand behind you, and your 13 strongest can take ${power}/13 bolts. On the day you attain the Dao, they will take the lightning for you.`)}
      </p>
      <a className="vk-link" href="/tang-kiep-cac">
        {tr('Vào Tàng Kiếp Các ›', 'Enter the Hall of Lives ›')}
      </a>
    </div>
  );
}

/** Tứ Kiếp Vấn Đạo: bốn tấm thẻ đọc rồi bấm, mỗi lựa chọn hiện sẵn tỉ lệ */
export function TuKiepOverlay({ c, onPass, onFail, rnd }: { c: Character; onPass: () => void; onFail: (kiepName: string) => void; rnd: () => number }) {
  const [step, setStep] = useState(0);
  const [card, setCard] = useState<KiepCard>(() => tuKiep(c, 0, rnd));
  const [res, setRes] = useState<{ ok: boolean; text: string } | null>(null);
  const pick = (i: number) => {
    if (res) return;
    const ch = card.choices[i];
    const ok = rnd() < ch.chance;
    setRes({ ok, text: ok ? ch.ok : ch.fail });
  };
  const next = () => {
    if (!res) return;
    if (!res.ok) return onFail(card.name);
    if (step >= 3) return onPass();
    const s = step + 1;
    setStep(s);
    setCard(tuKiep(c, s, rnd));
    setRes(null);
  };
  return (
    <div className={`kiep vd vd-${res ? (res.ok ? 'ok' : 'bad') : 'ask'}`} role="dialog" aria-label={tr('Tứ Kiếp Vấn Đạo', 'Four Trials of the Dao')}>
      <i className="kiep-px ld-bg" aria-hidden="true" />
      {res && !res.ok && <i className="vd-redveil" aria-hidden="true" />}
      <div className="vd-steps" aria-hidden="true">
        {[0, 1, 2, 3].map((k) => (
          <i key={k} className={k < step ? 'done' : k === step ? 'now' : ''} />
        ))}
      </div>
      <div className="vd-hero" aria-hidden="true">
        <Sprite c={c} size={96} anim={res && !res.ok ? 'hurt' : 'spellcast'} dir={2} />
      </div>
      <div className="kiep-card vd-card">
        <small>{tr(`Tứ Kiếp Vấn Đạo · ${step + 1}/4`, `Four Trials of the Dao · ${step + 1}/4`)}</small>
        <p className="kiep-big">{card.name}</p>
        <p className="vd-text">{card.text}</p>
        {!res ? (
          <div className="vd-choices">
            {card.choices.map((ch, i) => (
              <button key={i} className="btn vd-choice" onClick={() => pick(i)}>
                <span>{ch.label}</span>
                <b>{Math.round(ch.chance * 100)}%</b>
              </button>
            ))}
          </div>
        ) : (
          <>
            <p className={`vd-res ${res.ok ? 'ok' : 'bad'}`}>{res.text}</p>
            <button className="btn btn-red btn-big" onClick={next}>
              {res.ok ? (step >= 3 ? tr('Đón 13 đạo lôi kiếp', 'Face the 13 bolts') : tr('Kiếp tiếp theo', 'Next trial')) : tr('Đạo cơ rạn vỡ...', 'The foundation cracks...')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

type HPhase = 'fall' | 'gather' | 'pick' | 'finale' | 'end';

/** Kiếp từng chết dưới thiên kiếp: lần này đỡ lôi mạnh gấp rưỡi (báo thù thiên kiếp) */
const powerOf = (p: PastSelf) => Math.round(hoDaoPower(p) * (lightningGrudge(p) ? 1.5 : 1) * 10) / 10;

/**
 * Vạn Kiếp Hộ Đạo: hụt từ 4 đạo lôi, các kiếp trước hiện về. Người chơi chạm vào từng bóng để gửi lên đỡ lôi
 * (tối đa 13 kiếp). Kiếp từng chết dưới thiên kiếp có dấu sét, đỡ gấp rưỡi. Đủ thì vạn kiếp đồng thanh hộ đạo.
 */
export function HoDaoScene({ c, need, onDone }: { c: Character; need: number; onDone: (saved: boolean) => void }) {
  const { user, ready } = useAuth();
  const [lives, setLives] = useState<PastSelf[] | null>(null);
  const [phase, setPhase] = useState<HPhase>('fall');
  const [shown, setShown] = useState(0);
  const [sent, setSent] = useState<PastSelf[]>([]);
  const [cur, setCur] = useState<PastSelf | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  useEffect(() => {
    if (!ready) return;
    loadPastSelves(user, 400).then(setLives).catch(() => setLives([]));
  }, [ready, user]);
  // hàng bóng: 18 kiếp mạnh nhất (kể cả kiếp từng chết dưới thiên kiếp), xếp theo thứ tự kiếp
  const crowd = useMemo(() => (lives ? lives.slice().sort((x, y) => powerOf(y) - powerOf(x) || y.lifeNo - x.lifeNo).slice(0, 18).sort((x, y) => x.lifeNo - y.lifeNo) : []), [lives]);
  const absorbed = Math.round(sent.reduce((a, p) => a + powerOf(p), 0) * 10) / 10;
  const saved = absorbed >= need;
  const left = HO_DAO_MAX - sent.length;
  const canSend = (p: PastSelf) => phase === 'pick' && !cur && !sent.some((x) => x.id === p.id) && left > 0;

  useEffect(() => {
    if (phase !== 'gather' || shown >= crowd.length) return;
    timer.current = setTimeout(() => setShown((s) => s + 1), shown < 6 ? 260 : 110);
  }, [phase, shown, crowd.length]);

  const send = (p: PastSelf) => {
    if (!canSend(p)) return;
    setCur(p);
    timer.current = setTimeout(() => {
      const next = [...sent, p];
      setSent(next);
      setCur(null);
      const tot = next.reduce((a, x) => a + powerOf(x), 0);
      const rest = crowd.filter((x) => !next.some((y) => y.id === x.id));
      if (tot >= need) {
        setPhase('finale');
        timer.current = setTimeout(() => setPhase('end'), 2600);
      } else if (next.length >= HO_DAO_MAX || !rest.length) timer.current = setTimeout(() => setPhase('end'), 700);
    }, 1900);
  };
  // gửi nhanh: bóng mạnh nhất còn lại
  const sendBest = () => {
    const rest = crowd.filter((x) => !sent.some((y) => y.id === x.id)).sort((x, y) => powerOf(y) - powerOf(x));
    if (rest[0]) send(rest[0]);
  };

  return (
    <div className={`kiep hd hd-${phase}`} role="dialog" aria-label={tr('Vạn Kiếp Hộ Đạo', 'Guarded by Ten Thousand Lives')}>
      <i className={`kiep-px ld-bg ${phase === 'pick' ? 'storm' : ''}`} aria-hidden="true" />
      {cur && <i key={cur.id} className="hd-bolt" aria-hidden="true" />}
      {phase === 'finale' && <i className="hd-flash" aria-hidden="true" />}
      <div className="hd-crowd">
        {crowd.slice(0, phase === 'fall' ? 0 : phase === 'gather' ? shown : crowd.length).map((p, i) => {
          const gone = sent.some((t) => t.id === p.id);
          const grudge = lightningGrudge(p);
          return (
            <button
              key={p.id}
              type="button"
              className={`hd-ghost ${gone ? 'gone' : ''} ${cur?.id === p.id ? 'cur' : ''} ${canSend(p) ? 'can' : ''} ${phase === 'finale' && !gone ? 'roar' : ''}`}
              style={{ ['--i' as string]: i }}
              onClick={() => send(p)}
              disabled={!canSend(p)}
              aria-label={tr(`Gửi kiếp ${p.lifeNo} ${p.name} lên đỡ ${powerOf(p)} đạo`, `Send life ${p.lifeNo} ${p.name} to take ${powerOf(p)} bolts`)}
            >
              <PastSelfSprite p={p} size={48} />
              {phase === 'pick' && !gone && (
                <em className={grudge ? 'zap' : ''}>
                  {grudge ? '⚡' : ''}
                  {powerOf(p)}
                </em>
              )}
            </button>
          );
        })}
      </div>
      <div className="hd-stage" aria-hidden="true">
        {cur && (
          <span key={cur.id} className="hd-front">
            <PastSelfSprite p={cur} size={92} anim="spellcast" />
          </span>
        )}
        <span className={`hd-hero ${phase === 'fall' ? 'down' : ''} ${cur ? 'back' : ''} ${phase === 'finale' ? 'rise' : ''}`}>
          <Sprite c={c} size={96} anim={phase === 'fall' ? 'hurt' : 'spellcast'} dir={2} />
        </span>
      </div>

      <div className="hd-text">
        {phase === 'fall' && (
          <div className="kiep-card">
            <p className="kiep-big">{tr('Bạn ngã xuống', 'You fall')}</p>
            <p>{tr(`Hụt ${need} đạo lôi. Đạo cơ rạn vỡ. Đạo lôi cuối cùng đang giáng xuống...`, `You missed ${need} bolts. Your Dao foundation shatters. The final bolt is coming down...`)}</p>
            <p className="vd-text">{tr('Sau lưng bạn, có tiếng bước chân.', 'Behind you, footsteps.')}</p>
            <button className="btn btn-red btn-big" onClick={() => setPhase('gather')} disabled={!lives}>
              {lives ? tr('Quay lại nhìn', 'Look back') : '...'}
            </button>
          </div>
        )}
        {phase === 'gather' && lives && (
          <div className="kiep-card">
            <p className="kiep-big">{tr(`${lives.length} kiếp của bạn hiện về`, `${lives.length} of your lives return`)}</p>
            <p>{tr('Những người bạn từng là, đứng thành hàng trên đỉnh lôi. Không ai nói gì. Họ chờ bạn gọi.', 'Everyone you have ever been, standing in a line on the peak. No one says a word. They are waiting for your call.')}</p>
            <button className="btn btn-red btn-big" onClick={() => setPhase('pick')} disabled={shown < Math.min(crowd.length, 6)}>
              {tr('Đứng dậy', 'Stand up')}
            </button>
          </div>
        )}
        {phase === 'pick' && (
          <div className="hd-words">
            <p className="hd-count">{tr(`Đã đỡ thay ${absorbed}/${need} đạo lôi · còn gọi được ${left} kiếp`, `Took ${absorbed}/${need} bolts · ${left} more can answer`)}</p>
            <div className="hd-bar" aria-hidden="true">
              <i style={{ width: `${Math.min(100, (absorbed / need) * 100)}%` }} />
            </div>
            {cur ? (
              <p key={cur.id} className="hd-line">
                <small>
                  {tr('Kiếp', 'Life')} {cur.lifeNo} · {cur.name} · {cur.realm === 0 ? tr('Phàm nhân', 'Mortal') : realmLabel(cur.realm, 1)}
                  {lightningGrudge(cur) ? tr(' · từng chết dưới thiên kiếp, lần này ta đỡ!', ' · once killed by tribulation - this time I hold it!') : hoDaoPower(cur) < 0.5 ? tr(' · vẫn lao lên', ' · leaps up anyway') : ''}
                </small>
                “{lastWords(cur)}”
              </p>
            ) : (
              <>
                <p className="hd-hint">{tr('Chạm vào một kiếp để gọi họ lên đỡ lôi. Số trên đầu là số đạo họ đỡ được, có dấu ⚡ là kiếp từng chết dưới thiên kiếp, đỡ gấp rưỡi.', 'Tap a life to call them up. The number is how many bolts they can take; ⚡ marks a life once killed by tribulation, which takes 1.5x.')}</p>
                <button className="btn hd-best" onClick={sendBest}>
                  {tr('Gọi kiếp mạnh nhất', 'Call the strongest')}
                </button>
              </>
            )}
          </div>
        )}
        {phase === 'finale' && <p className="hd-roar">{tr('Vạn kiếp đồng thanh: “Đi đi!”', 'Ten thousand lives cry out together: "Go!"')}</p>}
        {phase === 'end' && (
          <div className="kiep-card">
            <p className="kiep-big">{saved ? tr('VẠN KIẾP HỘ ĐẠO', 'GUARDED BY TEN THOUSAND LIVES') : tr('Chưa đủ...', 'Not yet enough...')}</p>
            <p>
              {saved
                ? tr(`${sent.length} kiếp đã lao lên đỡ thay ${need} đạo lôi, cả hàng vạn kiếp đồng thanh tiễn bạn. Bạn không chứng đạo một mình.`, `${sent.length} lives leapt up to take ${need} bolts, and the whole line cried out to send you on. You did not attain the Dao alone.`)
                : tr(`${sent.length} kiếp đã lao lên, đỡ được ${absorbed}/${need} đạo. Bạn hóa thành bóng, đứng đầu hàng. Lần sau, bạn sẽ là người đỡ.`, `${sent.length} lives leapt up and took ${absorbed}/${need} bolts. You become a shadow at the head of the line. Next time, you will be the one who shields.`)}
            </p>
            <button className="btn btn-red btn-big" onClick={() => onDone(saved)}>
              {saved ? tr('Chứng đạo', 'Attain the Dao') : tr('Đứng vào hàng', 'Join the line')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hộ đạo nhỏ: dùng ở thiên kiếp phi thăng (mỗi kiếp Hóa Thần trở lên đỡ 1 đạo hụt, tối đa max)
 * và Ngũ Hành Đài (một kiếp đỡ đòn chí mạng, đánh lại gương đó, mỗi đời một lần).
 * Không có kiếp nào đủ sức thì gọi onDone([]) ngay, người chơi không thấy gì.
 */
export function HoTroScene({ c, mode, max, missed = 0, bg, onDone }: { c: Character; mode: 'kiep' | 'nhd'; max: number; missed?: number; bg?: string; onDone: (sent: PastSelf[]) => void }) {
  const { user, ready } = useAuth();
  const [helpers, setHelpers] = useState<PastSelf[] | null>(null);
  const [sent, setSent] = useState<PastSelf[]>([]);
  const [cur, setCur] = useState<PastSelf | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  useEffect(() => {
    if (!ready) return;
    loadPastSelves(user, 400)
      .then((l) => setHelpers(helpersFor(l).slice(0, 8)))
      .catch(() => setHelpers([]));
  }, [ready, user]);
  useEffect(() => {
    if (helpers && !helpers.length) doneRef.current([]);
  }, [helpers]);
  if (!helpers || !helpers.length) return null;
  const full = sent.length >= max;
  const can = (p: PastSelf) => !cur && !full && !sent.some((x) => x.id === p.id);
  const send = (p: PastSelf) => {
    if (!can(p)) return;
    setCur(p);
    timer.current = setTimeout(() => {
      setSent((s) => [...s, p]);
      setCur(null);
    }, 1900);
  };
  const last = cur ?? sent[sent.length - 1] ?? null;
  return (
    <div className={`kiep hd ht ht-${mode}`} role="dialog" aria-label={tr('Kiếp trước hộ đạo', 'Past lives step in')}>
      <i className={`kiep-px ${bg ? '' : 'ld-bg storm'}`} style={bg ? { background: `#06040e url(${bg}) center bottom / cover no-repeat` } : undefined} aria-hidden="true" />
      {cur && <i key={cur.id} className="hd-bolt" aria-hidden="true" />}
      <div className="hd-text">
        <div className="kiep-card">
          <p className="kiep-big">{mode === 'kiep' ? tr(`Hụt ${missed} đạo thiên lôi`, `${missed} bolts missed`) : tr('Bóng gương sắp hạ bạn', 'The shadow is about to strike you down')}</p>
          <p>
            {mode === 'kiep'
              ? tr(`Sau lưng bạn, ${helpers.length} kiếp từng tới Hóa Thần trở lên bước ra. Chạm một kiếp để họ đỡ thay 1 đạo, tối đa ${max} đạo.`, `Behind you, ${helpers.length} lives that reached Spirit Severing or beyond step forward. Tap one to have them take 1 bolt for you, up to ${max}.`)
              : tr('Một kiếp trước có thể lao ra đỡ đòn này. Bạn không mất gì, đứng dậy đánh lại gương này. Mỗi đời chỉ gọi được một lần.', 'One of your past lives can leap in and take this blow. You lose nothing and fight this mirror again. Only once per life.')}
          </p>
        </div>
      </div>
      <div className="hd-crowd ht-crowd">
        {helpers.map((p, i) => {
          const gone = sent.some((t) => t.id === p.id);
          return (
            <button key={p.id} type="button" className={`hd-ghost ${gone ? 'gone' : ''} ${cur?.id === p.id ? 'cur' : ''} ${can(p) ? 'can' : ''}`} style={{ ['--i' as string]: i }} onClick={() => send(p)} disabled={!can(p)} aria-label={tr(`Gọi kiếp ${p.lifeNo} ${p.name}`, `Call life ${p.lifeNo} ${p.name}`)}>
              <PastSelfSprite p={p} size={52} />
              {lightningGrudge(p) && <em className="zap">⚡</em>}
            </button>
          );
        })}
      </div>
      <div className="hd-stage" aria-hidden="true">
        {cur && (
          <span key={cur.id} className="hd-front">
            <PastSelfSprite p={cur} size={92} anim="spellcast" />
          </span>
        )}
        <span className={`hd-hero ${cur ? 'back' : ''}`}>
          <Sprite c={c} size={96} anim={sent.length ? 'spellcast' : 'idle'} dir={2} />
        </span>
      </div>
      <div className="hd-text">
        <div className="hd-words">
          {mode === 'kiep' && <p className="hd-count">{tr(`Kiếp trước đã đỡ ${sent.length}/${max} đạo`, `Past lives took ${sent.length}/${max} bolts`)}</p>}
          {last ? (
            <p key={last.id} className="hd-line">
              <small>
                {tr('Kiếp', 'Life')} {last.lifeNo} · {last.name} · {realmLabel(last.realm, 1)}
                {lightningGrudge(last) ? tr(' · từng chết dưới thiên kiếp', ' · once killed by tribulation') : ''}
              </small>
              “{lastWords(last)}”
            </p>
          ) : (
            <p className="hd-hint">{tr('Chạm vào một bóng để gọi họ ra.', 'Tap a shadow to call them out.')}</p>
          )}
          {!full && !cur && (
            <button className="btn btn-red btn-big" onClick={() => helpers.find(can) && send(helpers.find(can)!)}>
              {tr('Gọi kiếp mạnh nhất', 'Call the strongest')}
            </button>
          )}
          <button className={`btn btn-big ${sent.length && (full || mode === 'nhd') ? 'btn-red' : ''}`} disabled={!!cur} onClick={() => onDone(sent)}>
            {sent.length ? (mode === 'kiep' ? tr('Độ kiếp tiếp', 'Continue the tribulation') : tr('Đứng dậy, đánh lại', 'Get up and fight again')) : tr('Tự gánh', 'Bear it myself')}
          </button>
        </div>
      </div>
    </div>
  );
}
