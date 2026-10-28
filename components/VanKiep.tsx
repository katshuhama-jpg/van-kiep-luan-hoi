'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Sprite from './Sprite';
import { foeChar } from '@/lib/game/duel';
import { hoDaoPower, hoDaoTeam, lastWords, loadPastSelves, type PastSelf } from '@/lib/vanKiep';
import { tuKiep, type KiepCard } from '@/lib/game/vanDao';
import { realmLabel } from '@/lib/game/data';
import type { Character } from '@/lib/game/types';
import { useAuth } from '@/lib/useAuth';
import { tr } from '@/lib/i18n';
import { KiepSky } from './Extras';

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
  const power = Math.round(lives.reduce((a, p) => a + hoDaoPower(p), 0) * 10) / 10;
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
        {tr(`Sau lưng bạn giờ có ${n} kiếp, đủ sức đỡ ${Math.round((power + 0.2) * 10) / 10} đạo lôi. Tới ngày Chứng Đạo, họ sẽ đỡ lôi thay bạn.`, `${n} lives now stand behind you, strong enough to take ${Math.round((power + 0.2) * 10) / 10} bolts. On the day you attain the Dao, they will take the lightning for you.`)}
      </p>
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
      <KiepSky phase={res ? (res.ok ? 'calm' : 'warn') : 'calm'} />
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

type HPhase = 'fall' | 'gather' | 'shield' | 'end';

/** Vạn Kiếp Hộ Đạo: hụt từ 4 đạo lôi, các kiếp trước hiện về đỡ thay */
export function HoDaoScene({ c, need, onDone }: { c: Character; need: number; onDone: (saved: boolean) => void }) {
  const { user, ready } = useAuth();
  const [lives, setLives] = useState<PastSelf[] | null>(null);
  const [phase, setPhase] = useState<HPhase>('fall');
  const [shown, setShown] = useState(0);
  const [idx, setIdx] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  useEffect(() => {
    if (!ready) return;
    loadPastSelves(user, 400).then(setLives).catch(() => setLives([]));
  }, [ready, user]);
  const plan = useMemo(() => (lives ? hoDaoTeam(lives, need) : null), [lives, need]);
  const crowd = useMemo(() => (lives ? lives.slice(-24) : []), [lives]);

  // vạn kiếp hiện dần sau lưng
  useEffect(() => {
    if (phase !== 'gather' || !lives) return;
    if (shown >= crowd.length) return;
    timer.current = setTimeout(() => setShown((s) => s + 1), shown < 6 ? 260 : 90);
  }, [phase, shown, crowd.length, lives]);

  // từng kiếp lao lên đỡ lôi
  useEffect(() => {
    if (phase !== 'shield' || !plan) return;
    if (idx >= plan.team.length - 1) {
      timer.current = setTimeout(() => setPhase('end'), 1400);
      return;
    }
    timer.current = setTimeout(() => setIdx((i) => i + 1), idx < 0 ? 500 : 1900);
  }, [phase, idx, plan]);

  const absorbed = plan ? Math.round(plan.team.slice(0, idx + 1).reduce((a, p) => a + hoDaoPower(p), 0) * 10) / 10 : 0;
  const cur = plan && idx >= 0 ? plan.team[idx] : null;
  const skip = () => {
    if (phase === 'shield' && plan) {
      setIdx(plan.team.length - 1);
      setPhase('end');
    }
  };

  return (
    <div className={`kiep hd hd-${phase}`} role="dialog" aria-label={tr('Vạn Kiếp Hộ Đạo', 'Guarded by Ten Thousand Lives')} onPointerDown={phase === 'shield' ? skip : undefined}>
      <KiepSky phase={phase === 'shield' ? 'warn' : 'calm'} />
      {cur && <i key={cur.id} className="hd-bolt" aria-hidden="true" />}
      <div className="hd-crowd" aria-hidden="true">
        {crowd.slice(0, phase === 'fall' ? 0 : phase === 'gather' ? shown : crowd.length).map((p, i) => {
          const gone = plan ? plan.team.slice(0, idx + 1).some((t) => t.id === p.id) : false;
          return (
            <span key={p.id} className={`hd-ghost ${gone ? 'gone' : ''} ${cur?.id === p.id ? 'cur' : ''}`} style={{ ['--i' as string]: i }}>
              <PastSelfSprite p={p} size={48} />
            </span>
          );
        })}
      </div>
      <div className="hd-stage" aria-hidden="true">
        {cur && phase === 'shield' && (
          <span key={cur.id} className="hd-front">
            <PastSelfSprite p={cur} size={92} anim="spellcast" />
          </span>
        )}
        <span className={`hd-hero ${phase === 'fall' ? 'down' : ''} ${phase === 'shield' ? 'back' : ''}`}>
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
              {lives ? tr('Quay lại nhìn', 'Look back') : tr('...', '...')}
            </button>
          </div>
        )}
        {phase === 'gather' && lives && plan && (
          <div className="kiep-card">
            <p className="kiep-big">{tr(`${lives.length} kiếp của bạn hiện về`, `${lives.length} of your lives return`)}</p>
            <p>{tr('Những người bạn từng là, đứng thành hàng trên đỉnh lôi. Không ai nói gì.', 'Everyone you have ever been, standing in a line on the peak. No one says a word.')}</p>
            <button className="btn btn-red btn-big" onClick={() => setPhase('shield')} disabled={shown < Math.min(crowd.length, 6)}>
              {tr('Đứng dậy', 'Stand up')}
            </button>
          </div>
        )}
        {phase === 'shield' && plan && (
          <div className="hd-words">
            <p className="hd-count">{tr(`Đã đỡ thay ${absorbed}/${need} đạo lôi`, `Took ${absorbed}/${need} bolts for you`)}</p>
            <div className="hd-bar" aria-hidden="true">
              <i style={{ width: `${Math.min(100, (absorbed / need) * 100)}%` }} />
            </div>
            {cur && (
              <p key={cur.id} className="hd-line">
                <small>
                  {tr('Kiếp', 'Life')} {cur.lifeNo} · {cur.name} · {cur.realm === 0 ? tr('Phàm nhân', 'Mortal') : realmLabel(cur.realm, 1)}
                  {hoDaoPower(cur) < 0.5 ? tr(' · vẫn lao lên', ' · leaps up anyway') : ''}
                </small>
                “{lastWords(cur)}”
              </p>
            )}
            <small className="hd-skip">{tr('Chạm để xem nhanh', 'Tap to skip')}</small>
          </div>
        )}
        {phase === 'end' && plan && (
          <div className="kiep-card">
            <p className="kiep-big">{plan.saved ? tr('VẠN KIẾP HỘ ĐẠO', 'GUARDED BY TEN THOUSAND LIVES') : tr('Chưa đủ...', 'Not yet enough...')}</p>
            <p>
              {plan.saved
                ? tr(`${plan.team.length} kiếp đã lao lên đỡ thay ${need} đạo lôi. Bạn không chứng đạo một mình.`, `${plan.team.length} lives leapt up and took ${need} bolts for you. You did not attain the Dao alone.`)
                : tr(`${plan.team.length} kiếp đã lao lên, đỡ được ${plan.total}/${need} đạo. Bạn hóa thành bóng, đứng đầu hàng. Lần sau, bạn sẽ là người đỡ.`, `${plan.team.length} lives leapt up and took ${plan.total}/${need} bolts. You become a shadow at the head of the line. Next time, you will be the one who shields.`)}
            </p>
            <button className="btn btn-red btn-big" onClick={() => onDone(plan.saved)}>
              {plan.saved ? tr('Chứng đạo', 'Attain the Dao') : tr('Đứng vào hàng', 'Join the line')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
