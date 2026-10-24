'use client';

import { HAIR_COLORS, PATHS } from '@/lib/game/data';
import { equippedLook } from '@/lib/game/helpers';
import type { Character } from '@/lib/game/types';

type R = [number, number, number, number, string];

type Robe = { body: string; dark: string; trim: string; alt: string };

/** Mỗi loại áo có vài phối màu, nhân vật bốc ngẫu nhiên một phối từ lúc sinh */
const ROBES: Record<string, Robe[]> = {
  vai: [
    { body: '#a08060', dark: '#7a5f44', trim: '#5a4128', alt: '#c9b08a' },
    { body: '#7d8590', dark: '#5c636c', trim: '#3e434a', alt: '#b4bac2' },
    { body: '#4f5f8a', dark: '#3a4768', trim: '#e6dcc4', alt: '#7a8ab4' },
    { body: '#7a7a4a', dark: '#5a5a34', trim: '#3e3e22', alt: '#a8a874' },
    { body: '#9a5a4a', dark: '#74423a', trim: '#e6cfa4', alt: '#c48a74' },
  ],
  thanh: [
    { body: '#3fa58a', dark: '#2d7a66', trim: '#e9fff6', alt: '#7fd8b8' },
    { body: '#3a8fb0', dark: '#2a6a86', trim: '#eaf6ff', alt: '#7cc4e0' },
    { body: '#5a9a4a', dark: '#427234', trim: '#f2ffe6', alt: '#98cc84' },
    { body: '#2f8a8a', dark: '#216464', trim: '#ffe7a8', alt: '#6cc0c0' },
  ],
  bach: [
    { body: '#f2f6ff', dark: '#c9d6f0', trim: '#6fb8ff', alt: '#ffffff' },
    { body: '#fbf6ec', dark: '#e2d6bc', trim: '#c0402e', alt: '#ffffff' },
    { body: '#f4f4f8', dark: '#cfd0dc', trim: '#c9962e', alt: '#ffffff' },
    { body: '#eef8f2', dark: '#c4dccc', trim: '#3fa58a', alt: '#ffffff' },
  ],
  huyet: [
    { body: '#1e1a24', dark: '#141217', trim: '#c0202e', alt: '#3a2030' },
    { body: '#22182e', dark: '#140e1c', trim: '#9a3ad0', alt: '#3a2650' },
    { body: '#2a1414', dark: '#1a0a0a', trim: '#ff6a2a', alt: '#4a1e1e' },
  ],
  tukim: [
    { body: '#7a4ab0', dark: '#5a3488', trim: '#ffc23d', alt: '#a07ad0' },
    { body: '#a8303a', dark: '#7e2028', trim: '#ffc23d', alt: '#d0606a' },
    { body: '#2a3a7a', dark: '#1c285a', trim: '#ffc23d', alt: '#5a6ab0' },
    { body: '#1e5a4a', dark: '#123e32', trim: '#ffd36b', alt: '#4a8a76' },
  ],
  casa: [
    { body: '#e0902a', dark: '#b8702a', trim: '#b8432f', alt: '#f0b45a' },
    { body: '#a8432f', dark: '#80301f', trim: '#e0b02a', alt: '#c86a54' },
    { body: '#c9a24a', dark: '#9a7a30', trim: '#7a2a1e', alt: '#e0c47a' },
  ],
};

export const OUTFIT_CUTS = ['áo dài thẳng', 'áo thắt đai tua', 'áo khoác choàng vai', 'áo ngắn quần túm'];

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
  hair: string; // màu tóc bẩm sinh (hex)
  hairStyle: number;
  tone: number; // phối màu áo
  cut: number; // kiểu dáng áo
}

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/** Màu tóc hiện tại: bẩm sinh, rồi bạc dần theo tuổi, nhuốm đỏ khi nhập ma, ánh tiên khí ở cảnh giới cao */
export function hairNow(l: Look): string {
  let h = l.hair;
  if (l.path === 'ma' || l.dao <= -60) h = mix(h, '#7a0a1e', 0.55);
  else if (l.realm >= 5) h = mix(h, auraColor(l) ?? '#ffe27a', 0.3);
  if (l.aging === 1) h = mix(h, '#a8a6b6', 0.45);
  if (l.aging === 2) h = mix(h, '#eeeef4', 0.85);
  return h;
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
    hair: HAIR_COLORS[c.hairColor ?? (c.race === 'yeu' ? 'hoa_ly' : 'den')]?.hex ?? '#2a1f3d',
    hairStyle: c.hairStyle ?? 0,
    tone: c.outfitTone ?? 0,
    cut: c.outfitCut ?? 0,
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
  const hair = hairNow(l);
  const hairDark = mix(hair, '#000000', 0.25);
  const st = l.hairStyle % 3;
  const red = l.path === 'ma' || l.dao <= -60;
  const eye = red ? '#ff2a3a' : l.yeu ? '#ffc23d' : '#1a1a2e';
  const tones = ROBES[l.robe] ?? ROBES.vai;
  const robe = tones[l.tone % tones.length];
  const cut = l.stage === 'baby' ? 0 : l.cut % 4;

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

  // Tóc phía sau theo kiểu tóc
  if (!bald && l.stage !== 'baby') {
    const long = l.stage === 'adult' ? 9 : 6;
    if (l.gender === 'nu' && st === 0) back.push([4, y0 + 3, 8, long, hair], [4, y0 + 3 + long - 1, 8, 1, hairDark]);
    if (l.gender === 'nu' && st === 1) back.push([4, y0 + 3, 8, 4, hair]);
    if (l.gender === 'nu' && st === 2) back.push([4, y0 + 3, 8, Math.max(4, long - 3), hair]);
    if (l.gender === 'nam' && st === 1) back.push([11, y0 + 2, 2, 2, hair], [12, y0 + 4, 2, long - 1, hair], [12, y0 + 4, 1, long - 1, hairDark]);
  }

  // Thân áo theo kiểu dáng
  const shortTop = cut === 3 && l.stage === 'adult' ? 2 : 0; // áo ngắn: lộ quần
  body.push([4, robeTop, 8, robeH - shortTop, robe.body]);
  if (cut === 2) {
    // áo choàng: hai vạt ngoài màu đậm, áo trong sáng
    body.push([4, robeTop, 2, robeH - shortTop, robe.dark], [10, robeTop, 2, robeH - shortTop, robe.dark], [6, robeTop, 4, robeH - shortTop, robe.alt]);
    body.push([3, robeTop, 10, 1, robe.dark]);
  }
  body.push([7, robeTop, 2, Math.min(3, robeH), robe.trim]);
  if (robeH >= 5) body.push([4, robeTop + 4, 8, 1, robe.trim]);
  if (cut === 1 && robeH >= 5) {
    // đai thắt nơ có tua rủ
    body.push([8, robeTop + 4, 2, 1, robe.dark], [8, robeTop + 5, 1, 2, robe.trim], [9, robeTop + 5, 1, 3, robe.trim]);
    body.push([4, robeTop + 1, 1, 3, robe.alt]);
  }
  if (cut === 0 && robeH >= 6) body.push([5, robeTop + 5, 1, robeH - 5, robe.alt], [10, robeTop + 5, 1, robeH - 5, robe.alt]);
  if (l.robe === 'casa') body.push([5, robeTop, 1, 1, robe.trim], [6, robeTop + 1, 1, 1, robe.trim], [8, robeTop + 2, 1, 1, robe.trim], [9, robeTop + 3, 1, 1, robe.trim], [10, robeTop + 4, 1, 1, robe.trim]);
  // Tay áo: áo choàng tay rộng, áo ngắn tay bó
  const sleeve = cut === 2 ? robe.dark : robe.body;
  if (cut === 3) body.push([3, robeTop + 1, 1, armH, sleeve], [12, robeTop + 1, 1, armH, sleeve], [2, robeTop + 1, 1, armH - 1, skin], [13, robeTop + 1, 1, armH - 1, skin]);
  else body.push([2, robeTop + 1, 2, armH, sleeve], [12, robeTop + 1, 2, armH, sleeve]);
  if (cut === 2) body.push([1, robeTop + armH - 1, 1, 2, sleeve], [14, robeTop + armH - 1, 1, 2, sleeve]);
  body.push([2, robeTop + 1 + armH, 2, 1, skin], [12, robeTop + 1 + armH, 2, 1, skin]);
  if (shortTop) {
    // quần túm ống
    body.push([4, robeTop + robeH - 2, 3, skirtH + 2, robe.dark], [9, robeTop + robeH - 2, 3, skirtH + 2, robe.dark], [4, feetY - 1, 3, 1, robe.trim], [9, feetY - 1, 3, 1, robe.trim]);
  } else if (skirtH) {
    body.push([3, robeTop + robeH, 10, skirtH, robe.dark]);
    if (cut === 1) body.push([3, robeTop + robeH + skirtH - 1, 10, 1, robe.trim]);
  }
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
    const tie = l.dao <= -40 ? '#c0202e' : '#ffd36b';
    if (l.stage !== 'baby') {
      if (l.gender === 'nam') {
        if (st === 0) head.push([6, y0, 4, 1, hair], [7, y0 - 1, 2, 1, hair], [7, y0, 2, 1, tie]);
        if (st === 1) head.push([11, y0 + 2, 1, 1, tie], [5, y0 + 4, 2, 1, hair]);
        if (st === 2) head.push([5, y0 + 4, 1, 1, hair], [7, y0 + 4, 1, 1, hair], [9, y0 + 4, 2, 1, hair], [3, y0 + 2, 1, 1, hair], [12, y0 + 1, 1, 2, hair], [6, y0, 2, 1, hair]);
      } else {
        if (st === 0) head.push([10, y0 + 1, 2, 1, l.dao <= -40 ? '#c0202e' : '#ff8fb1'], [11, y0, 1, 1, '#ffd36b']);
        if (st === 1) head.push([2, y0, 3, 3, hair], [11, y0, 3, 3, hair], [3, y0 + 1, 1, 1, hairDark], [12, y0 + 1, 1, 1, hairDark], [4, y0 + 2, 1, 1, '#ff8fb1'], [11, y0 + 2, 1, 1, '#ff8fb1']);
        if (st === 2) {
          const n = l.stage === 'adult' ? 4 : 2;
          for (let i = 0; i < n; i++) head.push([3, y0 + 7 + i * 2, 2, 1, hair], [3, y0 + 8 + i * 2, 2, 1, hairDark]);
          head.push([3, y0 + 7 + n * 2, 2, 1, '#ff8fb1']);
        }
      }
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
