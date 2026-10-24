'use client';

import { PATHS } from '@/lib/game/data';
import { equippedLook } from '@/lib/game/helpers';
import type { Character } from '@/lib/game/types';

type R = [number, number, number, number, string];

const ROBES: Record<string, { body: string; dark: string; trim: string }> = {
  vai: { body: '#a08060', dark: '#7a5f44', trim: '#5a4128' },
  thanh: { body: '#3fa58a', dark: '#2d7a66', trim: '#e9fff6' },
  bach: { body: '#f2f6ff', dark: '#c9d6f0', trim: '#6fb8ff' },
  huyet: { body: '#1e1a24', dark: '#141217', trim: '#c0202e' },
  tukim: { body: '#7a4ab0', dark: '#5a3488', trim: '#ffc23d' },
  casa: { body: '#e0902a', dark: '#b8702a', trim: '#b8432f' },
};

export interface Look {
  stage: 'baby' | 'child' | 'adult';
  aging: 0 | 1 | 2; // 0 trẻ, 1 trung niên, 2 già
  gender: 'nam' | 'nu';
  yeu: boolean;
  path: Character['path'];
  dao: number;
  realm: number;
  robe: string;
  weapon: string | null;
  acc: string | null;
  pet: boolean;
  dead: boolean;
}

export function lookOf(c: Character): Look {
  const ratio = c.age / Math.max(1, c.lifespan);
  return {
    stage: c.age < 4 ? 'baby' : c.age < 13 ? 'child' : 'adult',
    aging: ratio > 0.8 ? 2 : ratio > 0.6 ? 1 : 0,
    gender: c.gender,
    yeu: c.race === 'yeu',
    path: c.path,
    dao: c.daoTam,
    realm: c.realm,
    robe: equippedLook(c, 'ao') ?? 'vai',
    weapon: equippedLook(c, 'vu_khi'),
    acc: equippedLook(c, 'phu_kien'),
    pet: c.pet,
    dead: c.dead,
  };
}

export function auraColor(l: Look): string | null {
  if (l.realm < 1) return null;
  if (l.path) return PATHS[l.path].aura;
  if (l.dao <= -40) return '#ff3448';
  if (l.dao >= 40) return '#ffe27a';
  return '#9ff0c8';
}

/** Dựng các lớp pixel của nhân vật. Lưới 16x20, gốc (0,0) ở góc trên trái. */
function build(l: Look) {
  const shift = l.stage === 'adult' ? 0 : l.stage === 'child' ? 4 : 8;
  const robeH = l.stage === 'adult' ? 8 : l.stage === 'child' ? 5 : 4;
  const skirtH = l.stage === 'adult' ? 2 : l.stage === 'child' ? 1 : 0;
  const armH = l.stage === 'adult' ? 5 : l.stage === 'child' ? 3 : 2;
  const y0 = shift;
  const robeTop = y0 + 8;
  const feetY = robeTop + robeH + skirtH;

  const skin = l.aging === 2 ? '#e2b896' : '#f2c9a0';
  const bald = l.path === 'phat';
  const hair = l.aging === 2 ? '#e6e6ee' : l.aging === 1 ? '#5a5468' : l.yeu ? '#c96a2a' : '#2a1f3d';
  const red = l.path === 'ma' || l.dao <= -60;
  const eye = red ? '#ff2a3a' : l.yeu ? '#ffc23d' : '#1a1a2e';
  const robe = ROBES[l.robe] ?? ROBES.vai;

  const back: R[] = [];
  const body: R[] = [];
  const head: R[] = [];
  const eyes: R[] = [];
  const front: R[] = [];

  // Đuôi yêu tộc (sau lưng)
  if (l.yeu && l.stage !== 'baby') {
    const tails = l.path === 'yeu' ? (l.realm >= 3 ? 3 : 2) : 1;
    for (let t = 0; t < tails; t++) {
      const dx = t === 1 ? -3 : t === 2 ? 3 : 0;
      back.push([11 + dx, robeTop + 2, 3, 4, '#ff9a4a'], [13 + dx, robeTop, 2, 3, '#ff9a4a'], [14 + dx, robeTop - 1, 1, 2, '#fff4e0']);
    }
  }

  // Tóc dài phía sau (nữ)
  if (l.gender === 'nu' && !bald && l.stage !== 'baby') {
    back.push([4, y0 + 3, 8, l.stage === 'adult' ? 9 : 6, hair]);
  }

  // Thân áo
  body.push([4, robeTop, 8, robeH, robe.body]);
  body.push([7, robeTop, 2, Math.min(3, robeH), robe.trim]);
  if (robeH >= 5) body.push([4, robeTop + 4, 8, 1, robe.trim]);
  if (l.robe === 'casa') body.push([5, robeTop, 1, 1, robe.trim], [6, robeTop + 1, 1, 1, robe.trim], [8, robeTop + 2, 1, 1, robe.trim], [9, robeTop + 3, 1, 1, robe.trim], [10, robeTop + 4, 1, 1, robe.trim]);
  // Tay áo
  body.push([2, robeTop + 1, 2, armH, robe.body], [12, robeTop + 1, 2, armH, robe.body]);
  body.push([2, robeTop + 1 + armH, 2, 1, skin], [12, robeTop + 1 + armH, 2, 1, skin]);
  if (skirtH) body.push([3, robeTop + robeH, 10, skirtH, robe.dark]);
  // Chân
  if (l.stage !== 'baby') body.push([5, feetY, 2, 1, '#2a1f2a'], [9, feetY, 2, 1, '#2a1f2a']);
  else body.push([5, feetY, 2, 1, skin], [9, feetY, 2, 1, skin]);
  // Lưng còng khi già: thêm vạt áo lệch
  if (l.aging === 2 && l.stage === 'adult') body.push([3, robeTop, 1, 2, robe.dark]);

  // Đầu
  head.push([5, y0 + 4, 6, 4, skin]);
  if (bald) {
    head.push([5, y0 + 1, 6, 1, skin], [4, y0 + 2, 8, 2, skin], [6, y0 + 2, 1, 1, '#c4874a'], [8, y0 + 2, 1, 1, '#c4874a'], [7, y0 + 1, 1, 1, '#c4874a'], [9, y0 + 1, 1, 1, '#c4874a']);
  } else {
    head.push([5, y0 + 1, 6, 1, hair], [4, y0 + 2, 8, 2, hair], [4, y0 + 4, 1, 3, hair], [11, y0 + 4, 1, 3, hair]);
    if (l.stage !== 'baby') {
      if (l.gender === 'nam') head.push([6, y0, 4, 1, hair], [7, y0 - 1, 2, 1, hair], [7, y0, 2, 1, l.dao <= -40 ? '#c0202e' : '#ffd36b']);
      else head.push([10, y0 + 1, 2, 1, l.dao <= -40 ? '#c0202e' : '#ff8fb1'], [11, y0, 1, 1, '#ffd36b']);
    }
  }
  if (l.yeu) head.push([4, y0, 2, 2, '#ff9a4a'], [10, y0, 2, 2, '#ff9a4a'], [4, y0 - 1, 1, 1, '#ff9a4a'], [11, y0 - 1, 1, 1, '#ff9a4a']);
  if (l.dao <= -80 && l.stage === 'adult') head.push([4, y0 - 1, 1, 2, '#3a0a10'], [11, y0 - 1, 1, 2, '#3a0a10']);
  // Mắt
  if (l.dead) {
    eyes.push([6, y0 + 5, 1, 1, '#6b5a6b'], [9, y0 + 5, 1, 1, '#6b5a6b']);
  } else if (l.path === 'phat') {
    eyes.push([6, y0 + 5, 2, 1, '#1a1a2e'], [9, y0 + 5, 2, 1, '#1a1a2e']);
  } else {
    eyes.push([6, y0 + 5, 1, 1, eye], [9, y0 + 5, 1, 1, eye]);
  }
  head.push([7, y0 + 7, 2, 1, l.aging === 2 ? '#b07a5a' : '#c47a5a']);
  // Râu khi già (nam)
  if (l.aging === 2 && l.gender === 'nam' && l.stage === 'adult') head.push([6, y0 + 7, 4, 2, '#f4f4fa'], [7, y0 + 9, 2, 2, '#f4f4fa']);
  if (l.aging === 1 && l.gender === 'nam' && l.stage === 'adult') head.push([7, y0 + 8, 2, 1, '#4a4458']);

  // Vũ khí cầm tay
  const hy = robeTop + 1 + armH;
  if (l.weapon === 'mockiem') front.push([1, hy - 6, 1, 7, '#b58a5a'], [0, hy - 1, 3, 1, '#7a5a3a']);
  if (l.weapon === 'kiem') front.push([1, hy - 9, 1, 10, '#d9e6ff'], [0, hy - 1, 3, 1, '#ffd36b'], [1, hy - 10, 1, 1, '#ffffff']);
  if (l.weapon === 'dao') front.push([0, hy - 8, 2, 8, '#8a1a24'], [0, hy - 8, 1, 6, '#c0202e'], [0, hy, 3, 1, '#141217']);
  if (l.weapon === 'phattran') front.push([1, hy - 5, 1, 6, '#b58a5a'], [0, hy - 8, 3, 3, '#ffffff'], [0, hy - 5, 1, 2, '#ffffff']);
  if (l.weapon === 'lodan') front.push([13, feetY - 3, 4, 3, '#5a4a3a'], [12, feetY - 4, 6, 1, '#3e3228'], [14, feetY - 2, 2, 1, '#ff8a3d']);
  // Gậy chống khi già
  if (l.aging === 2 && l.stage === 'adult' && !l.weapon) front.push([14, y0 + 6, 1, 14, '#8a5a2a'], [13, y0 + 6, 2, 1, '#6b4a2a']);
  // Phụ kiện
  if (l.acc === 'ngoc') front.push([5, robeTop + 5, 1, 2, '#5fd8a0']);
  if (l.acc === 'holo') front.push([11, robeTop + 4, 2, 2, '#e0a040'], [11, robeTop + 3, 1, 1, '#e0a040']);

  return { back, body, head, eyes, front };
}

function rects(list: R[], keyPrefix: string) {
  return list.map(([x, y, w, h, f], i) => <rect key={keyPrefix + i} x={x} y={y} width={w} height={h} fill={f} />);
}

export default function Sprite({ c, size = 140, focus }: { c: Character; size?: number; focus?: string }) {
  const l = lookOf(c);
  const { back, body, head, eyes, front } = build(l);
  const aura = auraColor(l);
  const auraR = 7 + Math.min(l.realm, 7) * 1.1;
  const walking = focus === 'du_ngoan' && !l.dead;
  return (
    <svg
      className={`sprite ${l.dead ? 'is-dead' : ''} ${walking ? 'is-walking' : ''}`}
      viewBox="-8 -10 32 32"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`${c.name}, ${c.age < 13 ? 'trẻ con' : 'người lớn'}${l.path ? ', ' + PATHS[l.path].name : ''}`}
    >
      {aura && !l.dead && (
        <g className="aura" style={{ ['--aura' as string]: aura }}>
          <circle cx={8} cy={10} r={auraR} fill={aura} opacity={0.18} shapeRendering="auto" />
          <circle cx={8} cy={10} r={auraR * 0.7} fill={aura} opacity={0.22} shapeRendering="auto" />
        </g>
      )}
      {l.path === 'phat' && !l.dead && <circle className="halo" cx={8} cy={4 + (l.stage === 'adult' ? 0 : 4)} r={5} fill="none" stroke="#ffe27a" strokeWidth={0.6} shapeRendering="auto" />}
      <g className="breathe">
        <g className={l.yeu ? 'tail' : ''}>{rects(back, 'b')}</g>
        {rects(body, 'o')}
        {rects(head, 'h')}
        <g className="blink">{rects(eyes, 'e')}</g>
        {rects(front, 'f')}
      </g>
      {l.acc === 'kiembay' && !l.dead && (
        <g className="orbit">
          <g transform="translate(18 6) rotate(45)">
            <rect x={0} y={-4} width={1} height={8} fill="#d9e6ff" />
            <rect x={-1} y={3} width={3} height={1} fill="#ffd36b" />
          </g>
        </g>
      )}
      {l.pet && l.stage !== 'baby' && (
        <g className="pet-hop">
          <rect x={-6} y={15} width={1} height={2} fill="#ffffff" />
          <rect x={-3} y={15} width={1} height={2} fill="#ffffff" />
          <rect x={-6} y={17} width={4} height={2} fill="#ffffff" />
          <rect x={-5} y={18} width={1} height={1} fill="#2b2235" />
          <rect x={-3} y={18} width={1} height={1} fill="#2b2235" />
          <rect x={-5} y={19} width={5} height={2} fill="#ffffff" />
          <rect x={0} y={17} width={2} height={3} fill="#ffffff" />
        </g>
      )}
    </svg>
  );
}
