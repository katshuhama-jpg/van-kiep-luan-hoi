'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import BackButton from '@/components/BackButton';
import LoiDaiMatch from '@/components/LoiDaiMatch';
import Sprite from '@/components/Sprite';
import { PATHS, realmLabel } from '@/lib/game/data';
import { foeChar } from '@/lib/game/duel';
import { ruleOf } from '@/lib/game/arena';
import type { RivalChar } from '@/lib/game/types';
import { arenaCandidates, arenaShadow, lifeShadow, thachLeft } from '@/lib/social';
import { track } from '@/lib/track';
import { useAuth } from '@/lib/useAuth';
import { tr } from '@/lib/i18n';

const realmOf = (r: RivalChar) => (r.realm === 0 ? tr('Phàm nhân', "Mortal") : realmLabel(r.realm, r.layer, r.cosmos));
/** Góp ý #17: chiến thư đấu bằng cảnh giới thật, hai bên không được lệch quá 3 đại cảnh giới */
const THACH_MAX_GAP = 3;
const gapOf = (a: RivalChar, b: RivalChar) => Math.abs((a.realm ?? 0) - (b.realm ?? 0));

/**
 * Hạ chiến thư: đấu Phi Kiếm với bóng một kiếp cụ thể của người khác (?l=<id kiếp> từ nghĩa trang, ?u=<tên> từ bảng xếp hạng).
 * Không cần người kia đang chơi. Đấu bằng cảnh giới thật, lệch tối đa 3 đại cảnh giới. 3 chiến thư mỗi ngày, không tính điểm tuần.
 */
export default function ThachDau() {
  const { user, ready } = useAuth();
  const [foe, setFoe] = useState<{ player: string; shadow: RivalChar; lifeId: number } | null | 'none'>(null);
  const [cands, setCands] = useState<RivalChar[] | null>(null);
  const [pick, setPick] = useState(0);
  const [left, setLeft] = useState<number | null>(null);
  const [fight, setFight] = useState<number | null>(null);
  const rule = ruleOf();

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const l = Number(q.get('l') || 0);
    const u = q.get('u');
    if (l) lifeShadow(l).then((r) => setFoe(r ? { ...r, lifeId: l } : 'none'));
    else if (u) arenaShadow(u).then((r) => setFoe(r ? { player: u, shadow: r, lifeId: 0 } : 'none'));
    else setFoe('none');
  }, []);
  useEffect(() => {
    if (!ready || !user) return;
    arenaCandidates(user).then(setCands);
    thachLeft(user).then(setLeft);
  }, [ready, user]);

  const f = foe && foe !== 'none' ? foe : null;
  // tự chọn bóng đầu tiên đủ gần cảnh giới đối thủ
  useEffect(() => {
    if (!cands || !f) return;
    const i = cands.findIndex((c) => gapOf(c, f.shadow) <= THACH_MAX_GAP);
    if (i >= 0) setPick(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cands, f?.lifeId, f?.player]);
  const me = cands?.[pick] ?? null;
  const tooFar = !!me && !!f && gapOf(me, f.shadow) > THACH_MAX_GAP;
  const self = !!f && f.player === user?.username;
  return (
    <main className="app thach">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 28 }}>
            
            {tr("Chiến thư", "Challenge letter")}
          </span>
          <span className="meta">{tr("Đấu với bóng một kiếp của đạo hữu khác", "Fight the shadow of another fellow Daoist's life")}</span>
          <BackButton fallback="/nghia-trang" />
        </div>
      </header>
      {!ready || foe === null ? (
        <p>{tr("Đang mở chiến thư...", "Opening the challenge letter...")}</p>
      ) : foe === 'none' ? (
        <p className="note">
          
          {tr("Không tìm thấy kiếp này. Vào ", "Life not found. Visit the ")}<Link href="/nghia-trang">{tr("Nghĩa trang", "Cemetery")}</Link>{tr(" hoặc ", " or ")}<Link href="/bang-xep-hang">{tr("Bảng xếp hạng", "Leaderboard")}</Link>{tr(" để chọn người muốn thách đấu.", " to pick someone to challenge.")}
        </p>
      ) : !user ? (
        <p className="note">
          <Link href={`/dang-nhap?next=${encodeURIComponent('/thach-dau' + location.search)}`}>{tr("Đăng nhập", "Log in")}</Link>{tr(" để hạ chiến thư.", " to issue a challenge.")}
        </p>
      ) : (
        <>
          <div className="ar-stage th-stage" style={{ backgroundImage: 'url(/bg/nhd-tien-kim.png)' }}>
            <div className="ar-side me">
              {me ? <Sprite c={foeChar(me)} size={120} anim="idle" dir={3} /> : <span className="ar-unknown">?</span>}
              <b>{me ? me.name : tr('Bóng của bạn', "Your shadow")}</b>
            </div>
            <span className="ar-vs">VS</span>
            <div className="ar-side foe">
              <Sprite c={foeChar(f!.shadow)} size={120} anim="idle" dir={1} />
              <b>{f!.shadow.name}</b>
            </div>
            <span className="ar-rule-tag">
              @{f!.player}{tr(" · Kiếp ", " · Life ")}{f!.shadow.lifeNo ?? 1} · {realmOf(f!.shadow)}
            </span>
          </div>
          <p className="note th-note">
            
            {tr("Đấu bằng cảnh giới thật, hai bên lệch tối đa 3 đại cảnh giới. Thắng +5 phúc duyên, thua +2. Người kia nhận thư và được báo thù ở Lôi đài. ", "Fought at true realms, at most 3 major realms apart. Win +5 Fortune, lose +2. The other player receives the letter and can take revenge in the Arena. ")}{f!.shadow.path ? tr(`Đối thủ là ${PATHS[f!.shadow.path].name}.`, `Opponent: ${PATHS[f!.shadow.path].name}.`) : ''}
          </p>
          {cands && cands.length > 1 && (
            <>
              <h3 className="gh-h">{tr("Chọn bóng ra trận", "Choose a shadow to send in")}</h3>
              <div className="th-picks">
                {cands.map((c, i) => (
                  <button key={`${c.lifeId}-${i}`} className={`th-pick ${pick === i ? 'on' : ''} ${gapOf(c, f!.shadow) > THACH_MAX_GAP ? 'far' : ''}`} onClick={() => setPick(i)}>
                    <Sprite c={foeChar(c)} size={56} />
                    <b>{c.name}</b>
                    <small>{realmOf(c)}</small>
                  </button>
                ))}
              </div>
            </>
          )}
          {cands && !cands.length && <p className="note">{tr("Bạn chưa có kiếp nào. Sống trọn một kiếp rồi quay lại.", "You have no lives yet. Live one full life, then come back.")}</p>}
          <div className="ar-dock">
            <button
              className="btn btn-red btn-big ar-go-btn"
              disabled={!me || self || !left || tooFar}
              onClick={() => {
                track('thach_go', { opp: f!.player });
                setFight(Date.now());
              }}
            >
              {self ? tr('Không tự thách chính mình', "You can't challenge yourself") : tooFar ? tr('Lệch quá 3 đại cảnh giới', 'More than 3 major realms apart') : left ? tr('⚔ Hạ chiến thư', "⚔ Issue a challenge") : tr('Hết chiến thư hôm nay', "No challenges left today")}
              <small>{left === null ? '...' : tr(`còn ${left}/3 chiến thư hôm nay`, `${left}/3 challenges left today`)}</small>
            </button>
          </div>
        </>
      )}
      {fight && f && me && user && (
        <LoiDaiMatch
          key={fight}
          me={me}
          foe0={f.shadow}
          opp={f.player}
          rule={rule}
          revenge={null}
          user={user}
          leftAfter={0}
          mode="thach"
          lifeId={f.lifeId}
          onNext={() => setFight(null)}
          onDone={() => {
            setFight(null);
            thachLeft(user).then(setLeft);
          }}
        />
      )}
    </main>
  );
}
