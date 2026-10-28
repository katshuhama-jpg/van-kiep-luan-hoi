'use client';

import Sprite from './Sprite';
import { useEffect, useState } from 'react';
import { TitleBadge } from './Hook';
import { RelChips } from './GiangHo';
import { SOCIAL } from '@/lib/game/social';
import { titleKey, weeklyTitles } from '@/lib/storage';
import { PATHS, realmLabel } from '@/lib/game/data';
import { DUEL_INFO, foeChar, lifeText, type DuelFoe } from '@/lib/game/duel';
import { ELEMENTS, elemText, elementOf } from '@/lib/game/nguhanh';
import type { Character } from '@/lib/game/types';
import { tr } from '@/lib/i18n';

const REL_TXT = { yeu: tr('Yếu hơn bạn', "Weaker than you"), ngang: tr('Ngang tài ngang sức', "Evenly matched"), manh: tr('Mạnh hơn bạn!', "Stronger than you!") };

/** Màn cảnh báo trước khi vào kỳ ngộ giang hồ: ai, mạnh yếu thế nào, chọn đánh hay tránh */
export default function DuelWarning({
  me,
  foe,
  fleeChance,
  canBefriend,
  onPick,
}: {
  me: Character;
  foe: DuelFoe;
  fleeChance: number;
  canBefriend: boolean;
  onPick: (a: 'fight' | 'befriend' | 'leave' | 'flee') => void;
}) {
  const info = DUEL_INFO[foe.kind];
  const r = foe.rival;
  const fc = foeChar(r);
  const myEl = elementOf(me);
  const foeEl = elementOf(r);
  const et = elemText(myEl, foeEl);
  const foeLife = r.lifeNo ?? 1;
  const lt = lifeText(foeLife, me.lifeNo);
  const [title, setTitle] = useState<string[] | null>(null);
  useEffect(() => {
    if (r.player && foe.kind !== 'kiep_truoc')
      weeklyTitles()
        .then((t) => setTitle(t[titleKey(r.player, r.lifeNo)] ?? null))
        .catch(() => {});
  }, [r.player, r.lifeNo, foe.kind]);
  return (
    <div className={`duel-warn ${foe.kind}`} role="dialog" aria-modal="true" aria-labelledby="duel-title">
      <div className="duel-flash" aria-hidden="true" />
      <div className="duel-card">
        <p className="duel-kicker">
          {foe.kind === 'ma_dau' ? tr('☠ Ma đầu', "☠ Demon lord") : foe.kind === 'dich_thu' ? tr('⚠ Sát khí', "⚠ Killing intent") : foe.kind === 'kiep_truoc' ? tr('◈ Tâm cảnh', "◈ Inner world") : foe.kind === 'dong_mon' ? (foe.daiBi ? tr('⚑ Đại bỉ tông môn', "⚑ Grand Sect Tournament") : tr('⚑ Đồng môn', "⚑ Fellow disciple")) : tr('✦ Kỳ ngộ', "✦ Fortuitous encounter")}
        </p>
        <h2 id="duel-title">{info.title}</h2>
        <div className={`duel-foe ${foe.kind === 'kiep_truoc' ? 'ghost' : ''}`}>
          <Sprite c={fc} size={120} />
        </div>
        <p className="duel-name">{r.name}</p>
        {title && (
          <p style={{ margin: '0 0 4px' }}>
            <TitleBadge title={title} />
          </p>
        )}
        <p className="duel-meta">
          {foe.kind === 'kiep_truoc' ? tr('Chính bạn, kiếp trước', "Yourself, from a past life") : r.player ? `@${r.player}` : tr('Giang hồ vô danh', "Nameless wanderer")}
          {!r.alive && r.player && foe.kind !== 'kiep_truoc' ? tr(' · đã khuất', " · deceased") : ''}
          <br />
          {realmLabel(r.realm, r.layer, r.cosmos)}
          {r.path ? ` · ${PATHS[r.path]?.name ?? ''}` : ''}
        </p>
        {foe.kind !== 'kiep_truoc' && r.player && !foe.npc && (
          <p className="duel-tags">
            {foe.hunt && <span className="rel-chip r-thu">{tr("Bạn đang truy sát", "You are hunting them")}</span>}
            {foe.revenge && !foe.hunt && !SOCIAL.cur.foes.includes(r.player) && <span className="rel-chip r-thu">{tr("Kẻ thù của bạn", "Your enemy")}</span>}
            <RelChips player={r.player} />
          </p>
        )}
        <span className={`duel-rel ${foe.rel}`}>{REL_TXT[foe.rel]}</span>
        {(foe.sworn || foe.provoke || foe.bounty) && (
          <p className="duel-social">
            {foe.sworn && <span>{tr("Huynh đệ kết nghĩa: luận võ không ai lột đồ ai, trà luôn là trà thật.", "Sworn brothers: no one strips anyone's gear when sparring, and the tea is always just tea.")}</span>}
            {foe.provoke && <span>{tr("Hai bên từng khiêu khích nhau: thắng thua đều gấp rưỡi.", "You've provoked each other before: wins and losses count one and a half times.")}</span>}
            {!!foe.bounty && <span>{tr("Hạ được người này, lĩnh ", "Defeat this person to claim ")}{foe.bounty}{tr(" linh thạch tiền truy nã.", " spirit stones in bounty.")}</span>}
          </p>
        )}
        <div className={`duel-elem ${et.tone}`}>
          <span className="el" style={{ background: ELEMENTS[myEl].color }}>
            {ELEMENTS[myEl].sym}
          </span>
          <span className="vs">⚔</span>
          <span className="el" style={{ background: ELEMENTS[foeEl].color }}>
            {ELEMENTS[foeEl].sym}
          </span>
          <small>{et.text}</small>
        </div>
        <div className={`duel-elem duel-life ${lt.tone}`}>
          <span className="kiep-no">{tr("Kiếp ", "Life ")}{me.lifeNo}</span>
          <span className="vs">⚔</span>
          <span className="kiep-no">{tr("Kiếp ", "Life ")}{foeLife}</span>
          <small>{lt.text}</small>
        </div>
        <p className="duel-text">{foe.reason || info.warn}</p>
        {foe.rel !== 'yeu' && foe.kind !== 'kiep_truoc' && foe.kind !== 'dong_mon' && foe.kind !== 'ma_dau' && (
          <p className="duel-risk">{tr("Đối thủ không yếu hơn bạn: không đánh mà rời đi thì có thể bị trọng thương, thậm chí mất mạng.", "Your opponent is no weaker than you: walking away without a fight could leave you badly wounded, or even dead.")}</p>
        )}
        <div className="duel-actions">
          {foe.kind === 'dong_dao' && (
            <>
              <button className="btn btn-red btn-big" onClick={() => onPick('fight')}>
                
                {tr("Luận võ", "Spar")}
              </button>
              {canBefriend && (
                <button className="btn" onClick={() => onPick('befriend')}>
                  
                  {tr("Kết giao, uống trà luận đạo", "Make friends over tea and Dao talk")}
                </button>
              )}
              <button className="btn btn-dark" onClick={() => onPick('leave')}>
                
                {tr("Cáo từ", "Take your leave")}{foe.rel === 'yeu' ? '' : tr(' (có thể bị đánh lén)', " (may be ambushed)")}
              </button>
            </>
          )}
          {foe.kind === 'dich_thu' && (
            <>
              <button className="btn btn-red btn-big" onClick={() => onPick('fight')}>
                
                {tr("Nghênh chiến", "Accept the fight")}
              </button>
              <button className="btn btn-dark" onClick={() => onPick('flee')}>
                {foe.rel === 'yeu' ? tr('Bỏ đi, không chấp kẻ yếu', "Walk away, don't stoop to the weak") : tr(`Liều bỏ chạy (${Math.round(fleeChance * 100)}%, dễ trúng đòn sau lưng)`, `Risk fleeing (${Math.round(fleeChance * 100)}%, easy to get hit in the back)`)}
              </button>
            </>
          )}
          {foe.kind === 'dong_mon' && (
            <>
              <button className="btn btn-red btn-big" onClick={() => onPick('fight')}>
                {foe.daiBi ? tr('Lên lôi đài', "Enter the arena") : tr('Tỷ thí', "Compete")}
              </button>
              <button className="btn btn-dark" onClick={() => onPick('leave')}>
                {foe.daiBi ? tr('Bỏ lượt Đại bỉ (chờ kỳ sau)', "Skip this Grand Tournament (wait for the next)") : tr('Nhường một bước', "Yield a step")}
              </button>
            </>
          )}
          {foe.kind === 'kiep_truoc' && (
            <button className="btn btn-red btn-big" onClick={() => onPick('fight')}>
              
              {tr("Đối diện chính mình", "Face yourself")}
            </button>
          )}
          {foe.kind === 'ma_dau' && (
            <>
              <button className="btn btn-red btn-big" onClick={() => onPick('fight')}>
                
                {tr("Nghênh chiến ma đầu", "Face the demon lord")}
              </button>
              <small className="note">{tr("Thắng: +10 phúc duyên và đồ rơi. Thua: trọng thương, mất 10% linh thạch, không chết.", "Win: +10 Fortune and loot. Lose: badly wounded, lose 10% of spirit stones, but no death.")}</small>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
