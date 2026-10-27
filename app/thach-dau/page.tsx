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

const realmOf = (r: RivalChar) => (r.realm === 0 ? 'Phàm nhân' : realmLabel(r.realm, r.layer, r.cosmos));

/**
 * Hạ chiến thư: đấu Phi Kiếm với bóng một kiếp cụ thể của người khác (?l=<id kiếp> từ nghĩa trang, ?u=<tên> từ bảng xếp hạng).
 * Không cần người kia đang chơi. Kéo ngang cảnh giới như lôi đài. 3 chiến thư mỗi ngày, không tính điểm tuần.
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

  const me = cands?.[pick] ?? null;
  const f = foe && foe !== 'none' ? foe : null;
  const self = !!f && f.player === user?.username;
  return (
    <main className="app thach">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 28 }}>
            Chiến thư
          </span>
          <span className="meta">Đấu với bóng một kiếp của đạo hữu khác</span>
          <BackButton fallback="/nghia-trang" />
        </div>
      </header>
      {!ready || foe === null ? (
        <p>Đang mở chiến thư...</p>
      ) : foe === 'none' ? (
        <p className="note">
          Không tìm thấy kiếp này. Vào <Link href="/nghia-trang">Nghĩa trang</Link> hoặc <Link href="/bang-xep-hang">Bảng xếp hạng</Link> để chọn người muốn thách đấu.
        </p>
      ) : !user ? (
        <p className="note">
          <Link href={`/dang-nhap?next=${encodeURIComponent('/thach-dau' + location.search)}`}>Đăng nhập</Link> để hạ chiến thư.
        </p>
      ) : (
        <>
          <div className="ar-stage th-stage" style={{ backgroundImage: 'url(/bg/nhd-tien-kim.png)' }}>
            <div className="ar-side me">
              {me ? <Sprite c={foeChar(me)} size={120} anim="idle" dir={3} /> : <span className="ar-unknown">?</span>}
              <b>{me ? me.name : 'Bóng của bạn'}</b>
            </div>
            <span className="ar-vs">VS</span>
            <div className="ar-side foe">
              <Sprite c={foeChar(f!.shadow)} size={120} anim="idle" dir={1} />
              <b>{f!.shadow.name}</b>
            </div>
            <span className="ar-rule-tag">
              @{f!.player} · Kiếp {f!.shadow.lifeNo ?? 1} · {realmOf(f!.shadow)}
            </span>
          </div>
          <p className="note th-note">
            Hai bên được kéo ngang cảnh giới bóng của bạn. Thắng +5 phúc duyên, thua +2. Người kia nhận thư và được báo thù ở Lôi đài. {f!.shadow.path ? `Đối thủ là ${PATHS[f!.shadow.path].name}.` : ''}
          </p>
          {cands && cands.length > 1 && (
            <>
              <h3 className="gh-h">Chọn bóng ra trận</h3>
              <div className="th-picks">
                {cands.map((c, i) => (
                  <button key={`${c.lifeId}-${i}`} className={`th-pick ${pick === i ? 'on' : ''}`} onClick={() => setPick(i)}>
                    <Sprite c={foeChar(c)} size={56} />
                    <b>{c.name}</b>
                    <small>{realmOf(c)}</small>
                  </button>
                ))}
              </div>
            </>
          )}
          {cands && !cands.length && <p className="note">Bạn chưa có kiếp nào. Sống trọn một kiếp rồi quay lại.</p>}
          <div className="ar-dock">
            <button
              className="btn btn-red btn-big ar-go-btn"
              disabled={!me || self || !left}
              onClick={() => {
                track('thach_go', { opp: f!.player });
                setFight(Date.now());
              }}
            >
              {self ? 'Không tự thách chính mình' : left ? '⚔ Hạ chiến thư' : 'Hết chiến thư hôm nay'}
              <small>{left === null ? '...' : `còn ${left}/3 chiến thư hôm nay`}</small>
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
