'use client';

import type { Monster } from '@/lib/game/combat';

type R = [number, number, number, number, string];

/** Vẽ quái pixel 16x16, quay mặt sang trái (về phía nhân vật) */
function monsterRects(m: Monster): R[] {
  const b = m.body;
  const a = m.accent;
  const e = m.eye;
  switch (m.shape) {
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

export function MonsterSprite({ m, size = 48, dead }: { m: Monster; size?: number; dead?: boolean }) {
  return (
    <svg viewBox="-1 -2 18 18" width={size} height={size} shapeRendering="crispEdges" role="img" aria-label={m.name} className={`mon ${dead ? 'mon-dead' : ''}`}>
      {monsterRects(m).map(([x, y, w, h, f], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={f} />
      ))}
    </svg>
  );
}

export interface BattleView {
  m: Monster;
  pHp: number;
  pMax: number;
  mHp: number;
  mMax: number;
  phase: 'fight' | 'rest';
  last: { id: number; side: 'p' | 'm'; dmg: number; crit: boolean; text?: string }[];
  outcome?: 'win' | 'lose' | 'flee';
  kills: number;
}

/** Lớp phủ trận đánh trên sân khấu: quái, thanh máu, số sát thương */
export function BattleOverlay({ b }: { b: BattleView }) {
  const lastHit = b.last[b.last.length - 1];
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
          {b.m.name} · Lv{b.m.lv}
        </span>
        <div className="hpbar enemy">
          <div style={{ width: `${(b.mHp / b.mMax) * 100}%` }} />
        </div>
      </div>
      <div className={`mon-wrap ${lastHit?.side === 'p' && b.phase === 'fight' ? 'got-hit' : ''} ${lastHit?.side === 'm' ? 'attacking' : ''}`} key={lastHit?.id ?? 0}>
        <MonsterSprite m={b.m} size={112} dead={b.phase === 'rest' && b.outcome === 'win'} />
      </div>
      {b.last.map((h) => (
        <span key={h.id} className={`dmg ${h.side} ${h.crit ? 'crit' : ''}`}>
          {h.text ?? `-${h.dmg}`}
        </span>
      ))}
      <span className="kill-count">Đã trảm: {b.kills}</span>
    </div>
  );
}
