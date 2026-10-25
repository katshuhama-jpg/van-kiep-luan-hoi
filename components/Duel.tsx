'use client';

import Sprite from './Sprite';
import { useEffect, useState } from 'react';
import { TitleBadge } from './Hook';
import { weeklyTitles } from '@/lib/storage';
import { PATHS, realmLabel } from '@/lib/game/data';
import { DUEL_INFO, foeChar, lifeText, type DuelFoe } from '@/lib/game/duel';
import { ELEMENTS, elemText, elementOf } from '@/lib/game/nguhanh';
import type { Character } from '@/lib/game/types';

const REL_TXT = { yeu: 'Yếu hơn bạn', ngang: 'Ngang tài ngang sức', manh: 'Mạnh hơn bạn!' };

/** Màn cảnh báo trước khi vào kỳ ngộ giang hồ: ai, mạnh yếu thế nào, chọn đánh hay tránh */
export default function DuelWarning({ me, foe, fleeChance, canBefriend, onPick }: { me: Character; foe: DuelFoe; fleeChance: number; canBefriend: boolean; onPick: (a: 'fight' | 'befriend' | 'leave' | 'flee') => void }) {
  const info = DUEL_INFO[foe.kind];
  const r = foe.rival;
  const fc = foeChar(r);
  const myEl = elementOf(me);
  const foeEl = elementOf(r);
  const et = elemText(myEl, foeEl);
  const foeLife = r.lifeNo ?? 1;
  const lt = lifeText(foeLife, me.lifeNo);
  const [title, setTitle] = useState<string | null>(null);
  useEffect(() => {
    if (r.player && foe.kind !== 'kiep_truoc') weeklyTitles().then((t) => setTitle(t[r.player] ?? null)).catch(() => {});
  }, [r.player, foe.kind]);
  return (
    <div className={`duel-warn ${foe.kind}`} role="dialog" aria-modal="true" aria-labelledby="duel-title">
      <div className="duel-flash" aria-hidden="true" />
      <div className="duel-card">
        <p className="duel-kicker">{foe.kind === 'dich_thu' ? '⚠ Sát khí' : foe.kind === 'kiep_truoc' ? '◈ Tâm cảnh' : '✦ Kỳ ngộ'}</p>
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
          {foe.kind === 'kiep_truoc' ? 'Chính bạn, kiếp trước' : r.player ? `@${r.player}` : 'Giang hồ vô danh'}
          {!r.alive && r.player && foe.kind !== 'kiep_truoc' ? ' · đã khuất' : ''}
          <br />
          {realmLabel(r.realm, r.layer)}
          {r.path ? ` · ${PATHS[r.path]?.name ?? ''}` : ''}
        </p>
        <span className={`duel-rel ${foe.rel}`}>{REL_TXT[foe.rel]}</span>
        <div className={`duel-elem ${et.tone}`}>
          <span className="el" style={{ background: ELEMENTS[myEl].color }}>{ELEMENTS[myEl].sym}</span>
          <span className="vs">⚔</span>
          <span className="el" style={{ background: ELEMENTS[foeEl].color }}>{ELEMENTS[foeEl].sym}</span>
          <small>{et.text}</small>
        </div>
        <div className={`duel-elem duel-life ${lt.tone}`}>
          <span className="kiep-no">Kiếp {me.lifeNo}</span>
          <span className="vs">⚔</span>
          <span className="kiep-no">Kiếp {foeLife}</span>
          <small>{lt.text}</small>
        </div>
        <p className="duel-text">{foe.reason || info.warn}</p>
        {foe.rel !== 'yeu' && foe.kind !== 'kiep_truoc' && <p className="duel-risk">Đối thủ không yếu hơn bạn: không đánh mà rời đi thì có thể bị trọng thương, thậm chí mất mạng.</p>}
        <div className="duel-actions">
          {foe.kind === 'dong_dao' && (
            <>
              <button className="btn btn-red btn-big" onClick={() => onPick('fight')}>
                Luận võ
              </button>
              {canBefriend && (
                <button className="btn" onClick={() => onPick('befriend')}>
                  Kết giao, uống trà luận đạo
                </button>
              )}
              <button className="btn btn-dark" onClick={() => onPick('leave')}>
                Cáo từ{foe.rel === 'yeu' ? '' : ' (có thể bị đánh lén)'}
              </button>
            </>
          )}
          {foe.kind === 'dich_thu' && (
            <>
              <button className="btn btn-red btn-big" onClick={() => onPick('fight')}>
                Nghênh chiến
              </button>
              <button className="btn btn-dark" onClick={() => onPick('flee')}>
                {foe.rel === 'yeu' ? 'Bỏ đi, không chấp kẻ yếu' : `Liều bỏ chạy (${Math.round(fleeChance * 100)}%, dễ trúng đòn sau lưng)`}
              </button>
            </>
          )}
          {foe.kind === 'kiep_truoc' && (
            <button className="btn btn-red btn-big" onClick={() => onPick('fight')}>
              Đối diện chính mình
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
