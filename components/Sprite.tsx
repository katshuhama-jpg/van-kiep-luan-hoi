'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { HAIR_COLORS, ITEMS, PATHS, type RobeDeco, type WeaponKind } from '@/lib/game/data';
import { ANIM, composeStrip, readyStrip, type Anim, type Layer } from '@/lib/lpc';
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
  robeColors?: [string, string, string, string];
  deco?: RobeDeco;
  wpn?: { k: WeaponKind; a: string; b: string };
  seed: number; // hạt giống nét riêng (da, mặt, râu, trang sức)
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

function hashStr(t: string) {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function lookOf(c: Character): Look {
  const ratio = c.age / Math.max(1, c.lifespan);
  return {
    stage: c.age < 4 ? 'baby' : c.age < 13 ? 'child' : 'adult',
    aging: ratio > 0.8 ? 2 : ratio > 0.6 ? 1 : 0,
    seed: c.lookSeed ?? hashStr(c.name + (c.birthPlace ?? '') + c.lifeNo),
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
    robeColors: ITEMS.find((i) => i.id === c.equipped.ao)?.robe,
    deco: ITEMS.find((i) => i.id === c.equipped.ao)?.deco,
    wpn: ITEMS.find((i) => i.id === c.equipped.vu_khi)?.wpn,
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
  const robe: Robe = l.robeColors ? { body: l.robeColors[0], dark: l.robeColors[1], trim: l.robeColors[2], alt: l.robeColors[3] } : tones[l.tone % tones.length];
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
  // Họa tiết áo đặc biệt
  if (l.deco && l.stage !== 'baby') {
    const d = l.deco;
    if (d === 'van') body.push([5, robeTop + 2, 1, 1, robe.trim], [10, robeTop + 3, 1, 1, robe.trim], [5, robeTop + robeH - 1, 2, 1, robe.trim], [9, robeTop + robeH - 2, 2, 1, robe.trim]);
    if (d === 'giap') body.push([3, robeTop, 3, 2, robe.trim], [10, robeTop, 3, 2, robe.trim], [4, robeTop + 2, 8, 1, robe.dark], [5, robeTop + 3, 6, 1, robe.alt]);
    if (d === 'vay') for (let yy = 0; yy < robeH - 1; yy += 2) body.push([4 + (yy % 4 ? 1 : 0), robeTop + yy, 1, 1, robe.alt], [6 + (yy % 4 ? 1 : 0), robeTop + yy + 1, 1, 1, robe.alt], [10 - (yy % 4 ? 1 : 0), robeTop + yy, 1, 1, robe.alt]);
    if (d === 'long') body.push([5, robeTop + 1, 1, 1, robe.trim], [6, robeTop + 2, 1, 1, robe.trim], [5, robeTop + 3, 1, 1, robe.trim], [10, robeTop + 2, 1, 2, robe.trim], [9, robeTop + 4, 2, 1, robe.trim], [4, robeTop, 8, 1, robe.trim]);
    if (d === 'hoa') body.push([5, robeTop + 2, 1, 1, robe.alt], [10, robeTop + 3, 1, 1, robe.alt], [6, robeTop + robeH - 2, 1, 1, robe.alt], [9, robeTop + 1, 1, 1, robe.alt]);
    if (d === 'vu') body.push([2, robeTop - 1, 2, 2, robe.alt], [12, robeTop - 1, 2, 2, robe.alt], [1, robeTop, 1, 2, robe.alt], [14, robeTop, 1, 2, robe.alt]);
    if (d === 'manh') body.push([5, robeTop + 1, 2, 2, '#6a8a5a'], [9, robeTop + 3, 2, 2, '#9a5a4a'], [6, robeTop + robeH - 2, 2, 1, '#5a6a8a']);
    if (d === 'long_thu') body.push([3, robeTop, 10, 1, robe.trim], [4, robeTop + 1, 1, 1, robe.trim], [11, robeTop + 1, 1, 1, robe.trim]);
  }
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
  // Vũ khí mới vẽ theo dáng + màu
  const W = l.wpn;
  if (W && l.stage !== 'baby') {
    const { a, b } = W;
    switch (W.k) {
      case 'kiem': front.push([1, hy - 9, 1, 9, a], [0, hy - 1, 3, 1, b], [1, hy, 1, 1, b]); break;
      case 'dao': front.push([0, hy - 8, 2, 8, a], [1, hy - 8, 1, 7, mix(a, '#000000', 0.2)], [0, hy, 3, 1, b]); break;
      case 'thuong': front.push([1, hy - 12, 1, 16, b], [0, hy - 14, 3, 2, a], [1, hy - 15, 1, 1, a], [0, hy - 11, 3, 1, '#c0202e']); break;
      case 'cung': front.push([0, hy - 8, 1, 2, a], [-1, hy - 6, 1, 8, a], [0, hy + 2, 1, 2, a], [1, hy - 7, 1, 10, b]); break;
      case 'quat': front.push([-1, hy - 5, 4, 4, a], [0, hy - 6, 2, 1, a], [0, hy - 4, 1, 3, b], [2, hy - 4, 1, 3, b], [1, hy - 1, 1, 1, b]); break;
      case 'truong': front.push([1, hy - 11, 1, 14, a], [0, hy - 12, 3, 1, b], [1, hy - 13, 1, 1, b]); break;
      case 'chuy': front.push([1, hy - 5, 1, 6, b], [-1, hy - 9, 5, 4, a], [0, hy - 10, 3, 1, a], [1, hy - 7, 1, 1, '#ffffff']); break;
      case 'tieu': front.push([0, hy - 6, 1, 7, a], [0, hy - 4, 1, 1, b], [0, hy - 2, 1, 1, b], [0, hy, 1, 1, b]); break;
      case 'roi': front.push([1, hy - 3, 1, 4, b], [0, hy - 5, 1, 2, a], [-1, hy - 7, 1, 2, a], [-2, hy - 8, 1, 1, a]); break;
      case 'song': front.push([1, hy - 8, 1, 8, a], [0, hy, 3, 1, b], [14, hy - 8, 1, 8, b], [13, hy, 3, 1, a]); break;
      case 'liem': front.push([1, hy - 10, 1, 13, b], [-3, hy - 11, 5, 1, a], [-3, hy - 10, 1, 2, a], [-2, hy - 9, 1, 1, a]); break;
      case 'but': front.push([1, hy - 6, 1, 6, b], [1, hy - 8, 1, 2, a], [0, hy - 7, 1, 1, a]); break;
      case 'cuoc': front.push([1, hy - 9, 1, 11, b], [-1, hy - 10, 3, 2, a]); break;
      case 'quyen': front.push([1, hy - 1, 3, 2, a], [12, hy - 1, 3, 2, a], [1, hy - 1, 3, 1, b], [12, hy - 1, 3, 1, b]); break;
    }
  }
  // Gậy chống khi già
  if (l.aging === 2 && l.stage === 'adult' && !l.weapon && !l.wpn) front.push([14, y0 + 6, 1, 14, '#8a5a2a'], [13, y0 + 6, 2, 1, '#6b4a2a']);
  // Phụ kiện
  if (l.acc === 'ngoc') front.push([5, robeTop + 5, 1, 2, '#5fd8a0']);
  if (l.acc === 'holo') front.push([11, robeTop + 4, 2, 2, '#e0a040'], [11, robeTop + 3, 1, 1, '#e0a040']);

  return { back, body, head, eyes, front };
}

function rects(list: R[], keyPrefix: string) {
  return list.map(([x, y, w, h, f], i) => <rect key={keyPrefix + i} x={x} y={y} width={w} height={h} fill={f} />);
}

/** Bản vẽ pixel cũ bằng SVG: dùng tạm khi ảnh LPC chưa tải xong */
export function PixelSprite({ c, size = 140, focus }: { c: Character; size?: number; focus?: string }) {
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

/* ================= Nhân vật LPC ================= */
function robeOf(l: Look): Robe {
  const tones = ROBES[l.robe] ?? ROBES.vai;
  return l.robeColors ? { body: l.robeColors[0], dark: l.robeColors[1], trim: l.robeColors[2], alt: l.robeColors[3] } : tones[l.tone % tones.length];
}

// 3 kiểu đầu giữ nguyên thứ tự cũ để nhân vật đang chơi không đổi tóc
export const HAIR_LPC = {
  nam: ['high_ponytail', 'long_tied', 'xlong', 'long_messy', 'ponytail', 'long_band', 'relm_xlong', 'unkempt', 'long_center_part', 'bald', 'buzzcut', 'balding'],
  nu: ['xlong', 'bunches', 'high_ponytail', 'braid', 'princess', 'single', 'half_up', 'bangs_bun', 'xlong_wavy', 'pigtails', 'long_straight', 'curtains_long', 'long_center_part', 'loose', 'shoulderl', 'relm_xlong'],
} as const;

/** Nét riêng của từng người: màu da, khuôn mặt, râu, đồ trang sức. Suy ra từ hạt giống nên luôn cố định. */
const SKIN = [null, null, null, '*#fff0e4', '*#ffe2c8', '*#f6d0aa', '*#e8bc92'];
const BEARD_YOUNG = [null, null, null, 'stubble', 'stache', 'beard_trim', 'stache_hb', 'stache_hs'];
const BEARD_MID = [null, 'beard_trim', 'beard_med', 'stache', 'stache_hb', 'beard'];
// về già: 70% để râu, râu bạc theo tóc
const BEARD_OLD = ['beard', 'beard', 'beard', 'beard_med', 'beard_trim', 'stache_hb', 'stache', null, null, null];
/** Phụ kiện trên đầu và ở cổ/tai, mỗi chỗ tối đa một món. [lớp ảnh, trọng số] */
type Acc = { key: string | null; w: number; tint?: 'trim' | 'dark' | 'alt' | string };
const HEAD_ACC: Record<'nam' | 'nu', Acc[]> = {
  nam: [
    { key: null, w: 44 },
    { key: 'headband', w: 11, tint: 'trim' }, // khăn buộc trán
    { key: 'non_la', w: 8, tint: '#ecd28c' }, // nón lá
    { key: 'mask', w: 4, tint: '#2a2a33' }, // khăn đen của thích khách
    { key: 'bandana2', w: 8, tint: 'trim' }, // khăn trùm đầu
    { key: 'leather_cap', w: 6 }, // mũ da
    { key: 'band_thick', w: 8, tint: 'trim' }, // đai trán dày
    { key: 'hood_f', w: 4, tint: 'dark' }, // mũ trùm áo choàng
    { key: 'eyepatch', w: 3 }, // bịt một mắt
  ],
  nu: [
    { key: null, w: 42 },
    { key: 'headband', w: 9, tint: 'trim' },
    { key: 'non_la', w: 7, tint: '#ecd28c' },
    { key: 'hairtie', w: 9, tint: '#c0303a' }, // dây buộc tóc đỏ
    { key: 'band_thick', w: 6, tint: 'trim' },
    { key: 'hood_f', w: 6, tint: 'dark' },
    { key: 'bandana2', w: 6, tint: 'alt' },
    { key: 'eyepatch', w: 2 },
  ],
};
const NECK_ACC: Record<'nam' | 'nu', Acc[]> = {
  nam: [
    { key: null, w: 44 },
    { key: 'ear_stud', w: 8 }, // khuyên tai
    { key: 'amulet', w: 9 }, // bùa hộ mệnh
    { key: 'beads', w: 10 }, // chuỗi hạt
    { key: 'scarf', w: 9, tint: 'alt' }, // khăn quàng cổ
    { key: 'backpack', w: 10 }, // tay nải
    { key: 'quiver', w: 10 }, // ống tên sau lưng
  ],
  nu: [
    { key: null, w: 38 },
    { key: 'earrings', w: 8, tint: '#e0b02a' }, // hoa tai vàng
    { key: 'ear_moon', w: 8 }, // hoa tai trăng khuyết
    { key: 'ear_pear', w: 8 }, // hoa tai giọt ngọc
    { key: 'ear_stud', w: 7 }, // khuyên tai nhỏ
    { key: 'gem', w: 9 }, // dây chuyền ngọc
    { key: 'charm', w: 8 }, // bùa hộ mệnh
    { key: 'scarf', w: 9, tint: 'alt' }, // khăn quàng
    { key: 'beads', w: 5 }, // chuỗi hạt
  ],
};
const BROWS = [null, 'brow_thin', 'brow_thick'];
const NOSES = [null, 'nose_button', 'nose_straight'];

export function featOf(l: Look) {
  let x = l.seed >>> 0 || 1;
  const r = (n: number) => {
    x = (Math.imul(x ^ (x >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    return x % n;
  };
  const pickW = (list: Acc[]) => {
    let v = r(list.reduce((t, a) => t + a.w, 0));
    for (const a of list) if ((v -= a.w) < 0) return a;
    return list[0];
  };
  const g = l.gender === 'nam' ? 'nam' : 'nu';
  const skin = SKIN[r(SKIN.length)];
  const face = r(10); // 0-6 thường, 7-8 gầy, 9 đầy đặn (nam)
  const beard = [BEARD_YOUNG, BEARD_MID, BEARD_OLD][l.aging][r(10)] ?? null;
  return {
    skin,
    head: g === 'nam' ? (face >= 9 ? 'head_mp' : face >= 7 ? 'head_mg' : null) : null,
    beard: g === 'nam' ? beard : null,
    brow: BROWS[r(3)],
    nose: NOSES[r(3)],
    hat: pickW(HEAD_ACC[g]),
    neck: pickW(NECK_ACC[g]),
  };
}
const HAIR_CHILD = ['relm_short', 'parted_side_bangs', 'wavy'];

function weaponLayers(l: Look): { bg?: string; fg?: string; tint?: string } {
  const k = l.wpn?.k ?? l.weapon;
  if (!k) return {};
  const a = l.wpn?.a;
  const red = a && parseInt(a.slice(1, 3), 16) > parseInt(a.slice(3, 5), 16) + 70 ? a : undefined;
  if (k === 'mockiem') return { bg: 'w_sword_bg', fg: 'w_sword', tint: '#a0703a' };
  if (k === 'kiem') return { bg: 'w_sword_bg', fg: 'w_sword', tint: red };
  if (k === 'dao' || k === 'song') return { bg: 'w_katana_bg', fg: 'w_katana', tint: red };
  if (k === 'thuong') return { bg: 'w_spear_bg', fg: 'w_spear' };
  if (k === 'cung') return { bg: 'w_bow_bg', fg: 'w_bow' };
  if (k === 'roi') return { bg: 'w_whip_bg', fg: 'w_whip', tint: a };
  if (k === 'can') return { bg: 'w_rod_bg', fg: 'w_rod' };
  if (k === 'cuoc') return { bg: 'w_pick_bg', fg: 'w_pick' };
  if (k === 'truong') return { bg: 'w_staff_bg', fg: 'w_staff' };
  if (['phattran', 'but', 'tieu', 'quat'].includes(k)) return { fg: 'w_cane', tint: a };
  if (k === 'quyen') return { fg: 'gloves', tint: a };
  if (k === 'chuy') return { fg: 'w_mace' };
  if (k === 'liem') return { fg: 'w_scythe', tint: red };
  return {};
}

/** Danh sách lớp ảnh theo ngoại hình hiện tại: tuổi, cảnh giới, đồ đang mặc, đạo tâm */
export function lpcLayers(c: Character, hideWeapon = false): Layer[] {
  const l = lookOf(c);
  const robe = robeOf(l);
  const hair = hairNow(l);
  const st = l.hairStyle % 3;
  const eye = l.path === 'ma' || l.dao <= -60 ? 'red' : l.yeu ? 'orange' : ['brown', 'brown', 'gray', 'blue'][c.name.length % 4];
  if (l.stage !== 'adult') {
    // trẻ con cũng cầm vũ khí: hạ thấp xuống tay trẻ, thu nhỏ bớt không được nên chỉ dịch vị trí
    const cw = l.stage === 'child' && !c.dead && !hideWeapon ? weaponLayers(l) : {};
    const DY = 7;
    return [
      ...(cw.bg ? [{ key: cw.bg, tint: cw.tint, dy: DY }] : []),
      { key: 'body_child' },
      { key: 'head_c' },
      { key: 'eyes_c' },
      { key: 'pants_c', tint: robe.dark },
      { key: 'shirt_c', tint: robe.body },
      ...(l.path === 'phat' ? [] : [{ key: `hairc_${HAIR_CHILD[st]}`, tint: hair }]),
      ...(cw.fg ? [{ key: cw.fg, tint: cw.tint, dy: DY }] : []),
    ];
  }
  const elder = l.aging === 2;
  const ft = featOf(l);
  const head = l.gender === 'nam' ? (elder ? 'head_me' : ft.head ?? 'head_m') : elder ? 'head_fe' : 'head_f';
  const list = HAIR_LPC[l.gender === 'nam' ? 'nam' : 'nu'];
  const hs = list[l.hairStyle % list.length];
  const monk = l.path === 'phat';
  // đầu trọc: Phật tu cạo tóc, hoặc người thường sinh ra đã chọn kiểu đầu trọc
  const bald = monk || hs === 'bald';
  const w = weaponLayers(l);
  const showW = !c.dead && !hideWeapon;
  const cut = l.cut % 4;
  const deco = l.deco;
  const realm = l.realm;
  const ma = l.path === 'ma' || l.dao <= -60;
  // áo choàng: do đồ (lông vũ, áo rách) hoặc từ Kim Đan trở lên
  const cape = deco === 'vu' ? robe.alt : deco === 'manh' ? '#5a4a3a' : realm >= 3 ? robe.dark : null;
  const tattered = deco === 'manh';
  // Luyện Hư trở lên mọc cánh: ma tu cánh dơi, còn lại cánh trắng
  const wings = realm >= 6 ? (ma ? 'bwings' : 'wings') : null;
  const out: Layer[] = [];
  if (wings) out.push({ key: `${wings}_bg` });
  if (cape) out.push({ key: tattered ? 'capet_bg' : 'cape_bg', tint: cape });
  if (l.yeu) out.push({ key: 'tail_bg' });
  if (!bald) out.push({ key: `hair_${hs}_bg`, tint: hair });
  if (w.bg && showW) out.push({ key: w.bg, tint: w.tint });
  const accTint = (a: Acc) => (a.tint === 'trim' ? robe.trim : a.tint === 'dark' ? robe.dark : a.tint === 'alt' ? robe.alt : a.tint);
  // tay nải, ống tên đeo sau lưng
  if (ft.neck.key === 'backpack' || ft.neck.key === 'quiver') out.push({ key: ft.neck.key, tint: accTint(ft.neck) });
  out.push({ key: 'body_adult', tint: ft.skin ?? undefined }, { key: head, tint: ft.skin ?? undefined }, { key: `eyes_${eye}` });
  if (ft.nose && !elder) out.push({ key: ft.nose, tint: ft.skin ?? undefined });
  if (ft.brow) out.push({ key: ft.brow, tint: hair });
  out.push({ key: 'pants', tint: robe.dark }, { key: 'shoes' });
  // thân áo theo loại đồ
  if (deco === 'giap') {
    out.push({ key: 'armour_plate', tint: robe.body });
  } else if (deco === 'vay') {
    out.push({ key: 'kimono_split', tint: robe.dark }, { key: 'chainmail', tint: robe.body });
  } else {
    const kim = deco === 'manh' || cut === 3 ? 'kimono_split' : 'kimono_normal';
    out.push({ key: kim, tint: robe.body }, { key: `${kim}_trim`, tint: robe.trim });
    if (cut === 2 || deco === 'long') out.push({ key: 'kimono_sleeves_oversize', tint: deco === 'long' ? robe.body : robe.alt }, { key: 'kimono_sleeves_oversize_trim', tint: robe.trim });
  }
  out.push({ key: 'obi', tint: cut === 1 || deco === 'long' ? robe.trim : robe.dark });
  // vai: Hóa Thần mặc giáp vai vàng, Trúc Cơ khoác khăn vai, áo lông có cổ lông
  if (realm >= 5 || deco === 'giap') out.push({ key: 'pauldrons', tint: realm >= 5 ? '#e0b02a' : robe.trim });
  else if (deco === 'long_thu' || realm >= 2) out.push({ key: 'mantal', tint: robe.trim });
  // râu nhuộm theo màu tóc hiện tại nên cũng bạc dần khi già
  if (ft.beard) out.push({ key: ft.beard, tint: hair });
  if (!bald) out.push({ key: `hair_${hs}_fg`, tint: hair });
  // phụ kiện cổ, tai
  if (ft.neck.key && ft.neck.key !== 'backpack' && ft.neck.key !== 'quiver') out.push({ key: ft.neck.key, tint: accTint(ft.neck) });
  // phụ kiện đầu: khi đã đội mũ miện (Nguyên Anh trở lên) thì bỏ nón, khăn; che mặt, bịt mắt vẫn giữ
  const hk = ft.hat.key;
  const faceAcc = hk === 'mask' || hk === 'eyepatch';
  // Phật tu không đội nón, khăn
  // đầu trọc, đầu cạo: chỉ đeo đai/khăn buộc trán để còn thấy cái đầu
  const shaved = bald || hs === 'buzzcut' || hs === 'balding';
  const bandOnly = hk === 'headband' || hk === 'band_thick';
  if (hk && (faceAcc || (realm < 4 && !monk && (!shaved || bandOnly)))) out.push({ key: hk, tint: accTint(ft.hat) });
  // mũ miện theo cảnh giới (Phật tu đầu trọc, chỉ có hào quang)
  if (!monk) {
    if (realm >= 7) out.push({ key: 'crown_gold' });
    else if (realm >= 4) out.push({ key: 'tiara_gold' });
    else if (realm >= 3) out.push({ key: 'tiara_silver' });
  }
  if (l.dao <= -80) out.push({ key: 'horns_bg', tint: '#3a0a10' }, { key: 'horns_fg', tint: '#3a0a10' });
  if (cape) out.push({ key: tattered ? 'capet_fg' : 'cape_fg', tint: cape });
  if (wings) out.push({ key: `${wings}_fg` });
  if (l.yeu) out.push({ key: 'tail_fg' });
  if (w.fg && showW) out.push({ key: w.fg, tint: w.tint });
  return out;
}

/** Động tác mặc định theo việc đang làm */
export function animFor(c: Character, focus?: string): { anim: Anim; dir: number } {
  if (c.dead) return { anim: 'hurt', dir: 2 };
  if (focus === 'du_ngoan') return { anim: 'walk', dir: 3 };
  if (focus === 'tu_luyen' && c.age >= 6) return { anim: 'spellcast', dir: 2 };
  return { anim: 'idle', dir: 2 };
}

/**
 * Hào quang theo cảnh giới, càng lên càng rõ:
 * 1 tỏa sáng mờ, 2 thêm linh khí bay lên, 3 thêm vòng pháp trận dưới chân,
 * 4 vòng đôi và nhiều linh khí, 5 thêm cột sáng, 6 thêm tinh quang bay quanh, 7+ thêm hào quang tỏa tia.
 */
function Aura({ color, realm, layer, box }: { color: string; realm: number; layer: number; box: number }) {
  const r = Math.min(realm, 8);
  // mạnh dần trong cùng cảnh giới theo tầng
  const k = Math.min(1, 0.4 + r * 0.08 + Math.min(layer, 9) * 0.008);
  const size = box * (0.55 + r * 0.06);
  const motes = r >= 2 ? Math.min(12, (r - 1) * 2) : 0;
  const style = { ['--aura' as string]: color, ['--k' as string]: k } as CSSProperties;
  return (
    <span className={`aura r${r}`} style={style} aria-hidden="true">
      {r >= 7 && <span className="aura-rays" style={{ width: box * 1.15, height: box * 1.15 }} />}
      {r >= 5 && <span className="aura-pillar" style={{ width: box * 0.34, height: box * 1.1 }} />}
      <span className="lpc-aura" style={{ width: size, height: size }} />
      {r >= 3 && <span className="aura-ring" style={{ width: box * (0.5 + r * 0.03), height: box * (0.5 + r * 0.03), marginBottom: -box * (0.21 + r * 0.015) }} />}
      {r >= 4 && <span className="aura-ring two" style={{ width: box * (0.66 + r * 0.03), height: box * (0.66 + r * 0.03), marginBottom: -box * (0.29 + r * 0.015) }} />}
      {Array.from({ length: motes }, (_, i) => (
        <span key={i} className="aura-mote" style={{ left: `${30 + ((i * 37) % 40)}%`, animationDelay: `${-(i * 0.47) % 2.6}s`, animationDuration: `${2.2 + (i % 3) * 0.5}s` }} />
      ))}
      {r >= 6 && (
        <>
          <span className="aura-orbit" style={{ width: box * 0.7, height: box * 0.7 }}>
            <i />
          </span>
          <span className="aura-orbit rev" style={{ width: box * 0.8, height: box * 0.8 }}>
            <i />
          </span>
        </>
      )}
    </span>
  );
}

export default function Sprite({ c, size = 140, focus, anim, dir }: { c: Character; size?: number; focus?: string; anim?: Anim; dir?: number }) {
  const l = lookOf(c);
  const def = animFor(c, focus);
  const a = anim ?? def.anim;
  const d = dir ?? def.dir;
  const layers = lpcLayers(c, a === 'hurt');
  const key = JSON.stringify([layers, a, d]);
  const [strip, setStrip] = useState<{ key: string; url: string } | null>(() => {
    const u = typeof window !== 'undefined' ? readyStrip(layers, a, d) : undefined;
    return u ? { key, url: u } : null;
  });
  useEffect(() => {
    let live = true;
    composeStrip(layers, a, d).then((url) => live && setStrip({ key, url }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const meta = ANIM[a];
  const aura = auraColor(l);
  const scale = l.stage === 'baby' ? 0.75 : 1;
  const box = size;
  const cell = box * 2 * scale; // khung 128 = gấp đôi khung người 64
  const url = strip?.key === key ? strip.url : strip?.url; // giữ hình cũ trong lúc ghép hình mới
  const once = a === 'hurt';
  const style: CSSProperties = {
    width: cell,
    height: cell,
    left: (box - cell) / 2,
    top: box - cell * 0.82,
    backgroundImage: url ? `url(${url})` : undefined,
    backgroundSize: `${meta.frames * cell}px ${cell}px`,
    // chạy một lần (ngã xuống) thì dừng ở khung cuối, không trượt ra ô trống
    ['--lpc-end' as string]: `-${(once ? meta.frames - 1 : meta.frames) * cell}px`,
    animation: once ? `lpc-play ${(meta.frames - 1) / meta.fps}s steps(${meta.frames - 1}) 1 forwards` : `lpc-play ${meta.frames / meta.fps}s steps(${meta.frames}) infinite`,
  };
  return (
    <div className={`lpc ${l.dead ? 'is-dead' : ''}`} style={{ width: box, height: box }} role="img" aria-label={`${c.name}, ${c.age < 13 ? 'trẻ con' : 'người lớn'}${l.path ? ', ' + PATHS[l.path].name : ''}`}>
      {aura && !l.dead && <Aura color={aura} realm={l.realm} layer={c.layer} box={box} />}
      {l.path === 'phat' && !l.dead && <span className="lpc-halo" style={{ width: box * 0.26, height: box * 0.26, top: box * 0.06 }} />}
      {url ? <span className="lpc-strip" style={style} /> : <PixelSprite c={c} size={box} focus={focus} />}
      {l.acc === 'kiembay' && !l.dead && <span className="lpc-orbit" aria-hidden="true" />}
      {l.pet && l.stage !== 'baby' && (
        <span
          className="lpc-pet"
          aria-hidden="true"
          style={{
            width: box * 0.4,
            height: box * 0.4,
            backgroundImage: 'url(/lpc/beasts/fox_r.png)',
            backgroundSize: `${box * 0.4 * 4}px ${box * 0.4}px`,
            ['--lpc-end' as string]: `-${box * 0.4 * 4}px`,
            animation: l.dead ? 'none' : 'lpc-play 0.6s steps(4) infinite',
          }}
        />
      )}
    </div>
  );
}

/** Lớp áo để vẽ biểu tượng pháp y trong phường thị / túi đồ */
export function robeIconLayers(item: { look: string; robe?: [string, string, string, string]; deco?: RobeDeco }): Layer[] {
  const tones = ROBES[item.look] ?? ROBES.vai;
  const r: Robe = item.robe ? { body: item.robe[0], dark: item.robe[1], trim: item.robe[2], alt: item.robe[3] } : tones[0];
  const d = item.deco;
  if (d === 'giap') return [{ key: 'armour_plate', tint: r.body }, { key: 'pauldrons', tint: r.trim }];
  if (d === 'vay') return [{ key: 'kimono_split', tint: r.dark }, { key: 'chainmail', tint: r.body }];
  const kim = d === 'manh' ? 'kimono_split' : 'kimono_normal';
  const out: Layer[] = [{ key: kim, tint: r.body }, { key: `${kim}_trim`, tint: r.trim }];
  if (d === 'long' || item.look === 'casa') out.push({ key: 'kimono_sleeves_oversize', tint: r.body }, { key: 'kimono_sleeves_oversize_trim', tint: r.trim });
  out.push({ key: 'obi', tint: d === 'long' ? r.trim : r.dark });
  if (d === 'long_thu') out.push({ key: 'mantal', tint: r.trim });
  return out;
}
