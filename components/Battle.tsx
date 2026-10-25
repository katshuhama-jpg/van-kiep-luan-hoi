'use client';
import type { CSSProperties } from 'react';

import type { Monster } from '@/lib/game/combat';
import type { Character } from '@/lib/game/types';
import Sprite from './Sprite';
import MonsterLpc from './MonsterLpc';
import { MONSTER_LOOK } from '@/lib/game/monsterLook';

type R = [number, number, number, number, string];

/** Vẽ quái pixel 16x16, quay mặt sang trái (về phía nhân vật) */
function mix(x: string, y: string, t: number) {
  const px = [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
  const py = [1, 3, 5].map((i) => parseInt(y.slice(i, i + 2), 16));
  return '#' + px.map((v, i) => Math.round(v + (py[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/** Vị trí đầu của từng dáng quái, để gắn sừng/vương miện khi tiến hóa */
const HEAD: Record<string, [number, number]> = { thu: [1, 1], ran: [2, 3], nguoi: [5, 0], chim: [2, 5], rong: [1, 1], bo: [0, 6], vo_lam: [4, 0] };

function monsterRects(m: Monster, tier = 0): R[] {
  // càng tiến hóa màu càng sẫm, mắt càng sáng
  const b = tier >= 3 ? mix(m.body, '#ffd36b', 0.25) : tier >= 2 ? mix(m.body, '#2a0010', 0.3) : m.body;
  const a = tier >= 2 ? mix(m.accent, '#ffd36b', 0.3) : m.accent;
  const e = tier >= 1 ? '#ff2a3a' : m.eye;
  const base = shapeRects(m, b, a, e);
  if (tier >= 1) {
    const [hx, hy] = HEAD[m.shape] ?? [2, 1];
    // gai lưng
    base.push([hx + 5, hy + 4, 1, 1, a], [hx + 7, hy + 4, 1, 1, a]);
    if (tier >= 2) base.push([hx, hy - 2, 1, 2, '#ffd36b'], [hx + 2, hy - 3, 1, 3, '#ffd36b'], [hx + 4, hy - 2, 1, 2, '#ffd36b']);
    if (tier >= 3) base.push([hx - 1, hy - 3, 7, 1, '#fff6a8'], [hx + 2, hy - 4, 1, 1, '#ff2a3a']);
  }
  return base;
}

function shapeRects(m: Monster, b: string, a: string, e: string): R[] {
  switch (m.shape) {
    case 'vo_lam': {
      const skin = '#f2c9a0';
      const r: R[] = [];
      if (m.human?.hat) r.push([1, 1, 13, 1, '#c9a26a'], [4, 0, 7, 1, '#c9a26a'], [6, -1, 3, 1, '#b08a50']);
      else r.push([5, 1, 6, 1, '#1a1a1a'], [4, 2, 1, 2, '#1a1a1a'], [11, 2, 1, 3, a]);
      r.push([5, 2, 6, 4, skin], [6, 3, 1, 1, e], [9, 3, 1, 1, e]);
      if (m.human?.mask) r.push([5, 4, 6, 2, a]);
      else r.push([7, 5, 2, 1, '#8a4a3a']);
      r.push([4, 6, 8, 6, b], [7, 6, 2, 3, a], [4, 9, 8, 1, a], [12, 6, 2, 5, b], [3, 6, 1, 4, b], [12, 11, 2, 1, skin]);
      r.push([5, 12, 2, 3, a], [9, 12, 2, 3, a], [4, 15, 3, 1, '#1a1a1a'], [9, 15, 3, 1, '#1a1a1a']);
      const w = m.human?.weapon;
      if (w === 'kiem') r.push([2, 9, 2, 1, skin], [0, 3, 1, 7, '#d9e6ff'], [0, 9, 2, 1, '#ffd36b']);
      if (w === 'dao') r.push([2, 9, 2, 1, skin], [-1, 4, 2, 6, '#c9ccd6'], [0, 9, 3, 1, '#5a2a1a']);
      if (w === 'quyen') r.push([1, 8, 3, 3, skin], [1, 8, 3, 1, '#c9962e']);
      if (w === 'quat') r.push([2, 9, 2, 1, skin], [-1, 5, 4, 4, '#9ff0c8'], [0, 6, 2, 2, '#3a6a3a']);
      return r;
    }
    case 'thu':
      return [
        [13, 5, 2, 2, b], // đuôi
        [14, 4, 1, 1, a],
        [4, 6, 10, 5, b], // thân
        [5, 10, 8, 1, a],
        [1, 3, 5, 5, b], // đầu
        [0, 5, 2, 2, b], // mõm
        [0, 6, 1, 1, '#1a1a1a'],
        [1, 1, 1, 2, b], // tai
        [4, 1, 1, 2, b],
        [1, 2, 1, 1, a],
        [2, 4, 1, 1, e], // mắt
        [1, 7, 2, 1, '#ffffff'], // nanh
        [4, 11, 2, 3, b], // chân
        [7, 11, 2, 3, b],
        [10, 11, 2, 3, b],
        [12, 11, 2, 3, b],
        [4, 13, 2, 1, a],
        [10, 13, 2, 1, a],
      ];
    case 'ran':
      return [
        [10, 11, 5, 2, b],
        [12, 9, 3, 2, b],
        [8, 8, 5, 2, b],
        [6, 10, 4, 2, b],
        [3, 11, 5, 2, b],
        [9, 9, 1, 1, a],
        [12, 10, 1, 1, a],
        [5, 11, 1, 1, a],
        [11, 12, 1, 1, a],
        [2, 4, 5, 4, b], // đầu ngẩng
        [3, 8, 3, 3, b],
        [3, 5, 1, 1, e],
        [5, 5, 1, 1, e],
        [0, 7, 2, 1, '#e0202e'], // lưỡi
        [3, 3, 1, 1, a],
        [5, 3, 1, 1, a],
      ];
    case 'nguoi':
      return [
        [5, 1, 6, 5, b], // đầu
        [5, 0, 6, 1, a],
        [6, 3, 1, 1, e],
        [9, 3, 1, 1, e],
        [6, 5, 4, 1, '#1a1a1a'],
        [4, 6, 8, 6, a], // thân
        [6, 6, 4, 2, b],
        [2, 6, 2, 5, a], // tay
        [12, 6, 2, 5, a],
        [1, 10, 2, 2, b], // vuốt
        [13, 10, 2, 2, b],
        [5, 12, 2, 4, a], // chân
        [9, 12, 2, 4, a],
        [5, 15, 2, 1, b],
        [9, 15, 2, 1, b],
      ];
    case 'chim':
      return [
        [5, 7, 7, 4, b], // thân
        [6, 2, 4, 5, a], // cánh trên
        [9, 0, 3, 4, a],
        [12, 1, 2, 2, a],
        [11, 8, 4, 2, a], // đuôi
        [13, 10, 2, 2, a],
        [2, 5, 4, 4, b], // đầu
        [0, 7, 2, 1, '#ffd36b'], // mỏ
        [0, 8, 1, 1, '#ffd36b'],
        [3, 6, 1, 1, e],
        [6, 11, 1, 3, '#7a5a3a'], // chân
        [9, 11, 1, 3, '#7a5a3a'],
        [5, 13, 2, 1, '#7a5a3a'],
        [8, 13, 2, 1, '#7a5a3a'],
      ];
    case 'rong':
      return [
        [11, 10, 5, 2, b], // đuôi
        [14, 8, 2, 2, b],
        [5, 7, 8, 4, b], // thân
        [6, 10, 6, 1, a],
        [7, 3, 4, 4, a], // cánh
        [9, 1, 3, 2, a],
        [1, 3, 5, 4, b], // đầu
        [0, 5, 2, 2, b],
        [1, 1, 1, 2, a], // sừng
        [4, 1, 1, 2, a],
        [2, 4, 1, 1, e],
        [0, 7, 3, 1, '#ffffff'],
        [5, 11, 2, 3, b], // chân
        [10, 11, 2, 3, b],
        [5, 13, 2, 1, a],
        [10, 13, 2, 1, a],
        [8, 6, 1, 1, a],
        [11, 7, 1, 1, a],
      ];
    case 'bo':
    default:
      return [
        [5, 9, 8, 3, b], // thân
        [6, 8, 6, 1, a],
        [12, 6, 2, 3, b], // đuôi cong lên
        [13, 3, 2, 3, b],
        [11, 1, 3, 2, b],
        [10, 2, 2, 2, a], // ngòi độc
        [9, 3, 1, 1, '#ffd36b'],
        [2, 8, 3, 2, b], // càng
        [0, 6, 3, 2, b],
        [0, 9, 2, 1, b],
        [4, 9, 1, 1, e],
        [5, 12, 1, 2, a], // chân
        [7, 12, 1, 2, a],
        [9, 12, 1, 2, a],
        [11, 12, 1, 2, a],
      ];
  }
}

export function MonsterSprite({ m, size = 48, dead, tier = 0, attacking, still, pixel }: { m: Monster; size?: number; dead?: boolean; tier?: number; attacking?: boolean; still?: boolean; pixel?: boolean }) {
  const look = pixel ? undefined : MONSTER_LOOK[m.id];
  if (look) return <MonsterLpc look={look} size={size} tier={tier} dead={dead} attacking={attacking} still={still} />;
  return (
    <svg viewBox="-2 -5 20 21" width={size} height={size} shapeRendering="crispEdges" role="img" aria-label={m.name} className={`mon tier-${tier} ${m.boss ? 'boss-' + m.boss : ''} ${dead ? 'mon-dead' : ''}`}>
      {monsterRects(m, tier).map(([x, y, w, h, f], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={f} />
      ))}
    </svg>
  );
}

export interface BattleView {
  m: Monster;
  name: string;
  lv: number;
  tier: number;
  pHp: number;
  pMax: number;
  mHp: number;
  mMax: number;
  phase: 'fight' | 'rest';
  last: { id: number; side: 'p' | 'm'; dmg: number; crit: boolean; text?: string; skill?: string; qi?: string }[];
  outcome?: 'win' | 'lose' | 'flee';
  kills: number;
  /** quái chặn đường: đếm hiệp */
  ambush?: { turn: number; max: number; kind: 'kem' | 'bang' | 'hon' };
  /** kỳ ngộ giang hồ: đối thủ là người */
  duel?: { kind: 'dong_dao' | 'dich_thu' | 'kiep_truoc'; foe: Character; tag: string; player: string; turn: number; max: number };
}

/** Lớp phủ trận đánh trên sân khấu: quái, thanh máu, số sát thương */
export function BattleOverlay({ b }: { b: BattleView }) {
  const lastHit = b.last[b.last.length - 1];
  // đòn gần nhất của mình (quái thường đánh trả ngay sau trong cùng lượt)
  const lastP = [...b.last].reverse().find((h) => h.side === 'p');
  return (
    <div className="battle" aria-live="off">
      <div className="hpbox p">
        <span>Bạn</span>
        <div className="hpbar">
          <div style={{ width: `${(b.pHp / b.pMax) * 100}%` }} />
        </div>
      </div>
      <div className="hpbox m">
        <span>
          {b.name} · Lv{b.lv}
        </span>
        <div className="hpbar enemy">
          <div style={{ width: `${(b.mHp / b.mMax) * 100}%` }} />
        </div>
      </div>
      {b.duel ? (
        <>
          <div className={`duel-bg duel-${b.duel.kind}`} aria-hidden="true">
            <i className="duel-moon" />
            <i className="duel-hills" />
            <i className="duel-floor" />
            {b.duel.kind === 'dong_dao' && (
              <>
                <i className="duel-flag l" />
                <i className="duel-flag r" />
              </>
            )}
            {b.duel.kind === 'dich_thu' && <i className="duel-bolt" />}
            {b.duel.kind === 'kiep_truoc' && (
              <span className="duel-mist">
                {Array.from({ length: 8 }, (_, i) => (
                  <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${-i * 0.7}s` }} />
                ))}
              </span>
            )}
          </div>
          <div className={`foe-wrap ${lastHit?.side === 'p' && b.phase === 'fight' ? 'got-hit' : ''} ${lastHit?.side === 'm' ? 'attacking' : ''} ${b.duel.kind === 'kiep_truoc' ? 'ghost' : ''}`} key={lastHit?.id ?? 0}>
            <Sprite
              c={b.phase === 'rest' && b.outcome === 'win' ? { ...b.duel.foe, dead: true } : b.duel.foe}
              size={150}
              anim={b.phase === 'rest' && b.outcome === 'win' ? 'hurt' : lastHit?.side === 'm' && b.phase === 'fight' ? (lastHit.skill ? 'spellcast' : 'slash') : 'idle'}
              dir={1}
            />
          </div>
          <span className="duel-tag">
            {b.duel.tag}
            {b.duel.player ? ` · @${b.duel.player}` : ''}
          </span>
        </>
      ) : (
        <div className={`mon-wrap ${lastHit?.side === 'p' && b.phase === 'fight' ? 'got-hit' : ''} ${lastHit?.side === 'm' ? 'attacking' : ''}`} key={lastHit?.id ?? 0}>
          <MonsterSprite m={b.m} size={136} tier={b.tier} dead={b.phase === 'rest' && b.outcome === 'win'} attacking={b.phase === 'fight' && lastHit?.side === 'm'} />
        </div>
      )}
      {lastP?.skill && (
        <span key={`q${lastP.id}`} className="chuong" style={{ ['--qi' as string]: lastP.qi ?? '#9ff0c8' } as CSSProperties} aria-hidden="true">
          <i />
        </span>
      )}
      {lastHit?.side === 'm' && lastHit.skill && (
        <span key={`fs${lastHit.id}`} className="chuong foe" style={{ ['--qi' as string]: lastHit.qi ?? '#ff6a5a' } as CSSProperties} aria-hidden="true">
          <i />
        </span>
      )}
      {lastP?.skill && (
        <span key={`s${lastP.id}`} className="skill-name">
          {lastP.skill}!
        </span>
      )}
      {b.last.map((h) => (
        <span key={h.id} className={`dmg ${h.side} ${h.crit ? 'crit' : ''}`}>
          {h.text ?? `-${h.dmg}`}
        </span>
      ))}
      {b.duel ? (
        <span className={`kill-count ambush-tag duel-turn ${b.duel.kind}`}>
          Hiệp {Math.max(1, b.duel.turn)}/{b.duel.max}
        </span>
      ) : b.ambush ? (
        <span className={`kill-count ambush-tag ${b.ambush.kind}`}>
          Chặn đường · Hiệp {Math.max(1, b.ambush.turn)}/{b.ambush.max}
        </span>
      ) : (
        <span className="kill-count">Đã trảm: {b.kills}</span>
      )}
    </div>
  );
}
