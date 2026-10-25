'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { ANIM, composeStrip, readyStrip, type Anim, type Layer } from '@/lib/lpc';
import type { MonsterLook } from '@/lib/game/monsterLook';

/** Quái tiến hóa: tinh anh đỏ, vương tím, thánh vàng; càng lên càng to */
const TIER_FX = ['', 'saturate(1.3) drop-shadow(0 0 3px #ff2a3a)', 'saturate(1.4) hue-rotate(-20deg) drop-shadow(0 0 4px #b040ff)', 'saturate(1.5) brightness(1.15) drop-shadow(0 0 6px #ffd36b)'];
const TIER_SCALE = [1, 1.08, 1.16, 1.25];

function HumanStrip({ layers, anim, size, scale }: { layers: Layer[]; anim: Anim; size: number; scale: number }) {
  const dir = 1; // quay mặt sang trái, về phía nhân vật
  const key = JSON.stringify([layers, anim, dir]);
  const [url, setUrl] = useState<string | undefined>(() => (typeof window !== 'undefined' ? readyStrip(layers, anim, dir) : undefined));
  useEffect(() => {
    let live = true;
    composeStrip(layers, anim, dir).then((u) => live && setUrl(u));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const meta = ANIM[anim];
  const cell = size * 2 * scale;
  const once = anim === 'hurt';
  const style: CSSProperties = {
    width: cell,
    height: cell,
    left: (size - cell) / 2,
    top: size - cell * 0.82,
    backgroundImage: url ? `url(${url})` : undefined,
    backgroundSize: `${meta.frames * cell}px ${cell}px`,
    ['--lpc-end' as string]: `-${(once ? meta.frames - 1 : meta.frames) * cell}px`,
    animation: once ? `lpc-play ${(meta.frames - 1) / meta.fps}s steps(${meta.frames - 1}) 1 forwards` : `lpc-play ${meta.frames / meta.fps}s steps(${meta.frames}) infinite`,
  };
  return <span className="lpc-strip" style={style} />;
}

function BeastStrip({ look, size, dead }: { look: Extract<MonsterLook, { kind: 'beast' }>; size: number; dead?: boolean }) {
  const cell = look.cell * (size / 64) * look.scale;
  const cols = look.frames + (look.sheet === 'slime' ? 1 : 0);
  const fps = look.fps ?? 8;
  const style: CSSProperties = {
    width: cell,
    height: cell,
    left: (size - cell) / 2,
    top: size - cell * 0.9,
    backgroundImage: `url(/lpc/beasts/${look.sheet}.png)`,
    backgroundSize: `${cols * cell}px ${look.strip ? cell : cell * 4}px`,
    backgroundPositionY: look.strip ? 0 : `-${cell}px`,
    filter: look.filter,
    ['--lpc-end' as string]: `-${look.frames * cell}px`,
    animation: dead ? 'none' : `lpc-play ${look.frames / fps}s steps(${look.frames}) infinite`,
    transform: dead ? 'rotate(90deg) translateX(30%)' : undefined,
  };
  return <span className="lpc-strip" style={style} />;
}

export default function MonsterLpc({ look, size = 112, tier = 0, dead, attacking, still }: { look: MonsterLook; size?: number; tier?: number; dead?: boolean; attacking?: boolean; still?: boolean }) {
  const t = Math.max(0, Math.min(3, tier));
  const wrap: CSSProperties = { width: size, height: size, filter: [TIER_FX[t], dead ? 'grayscale(0.7) brightness(0.8)' : ''].filter(Boolean).join(' ') || undefined };
  const sc = (look.kind === 'human' ? (look.scale ?? 1) : 1) * TIER_SCALE[t];
  return (
    <div className={`lpc lpc-mon ${still ? 'still' : ''} ${dead ? 'mon-dead-lpc' : ''}`} style={wrap} aria-hidden="true">
      {look.kind === 'human' ? (
        <HumanStrip
          layers={t >= 2 ? [...look.layers, { key: t >= 3 ? 'crown_gold' : 'horns_up_fg', tint: t >= 3 ? undefined : '#3a0a10' }] : look.layers}
          anim={dead ? 'hurt' : attacking ? 'slash' : 'idle'}
          size={size}
          scale={sc}
        />
      ) : (
        <BeastStrip look={{ ...look, scale: look.scale * TIER_SCALE[t] }} size={size} dead={dead} />
      )}
    </div>
  );
}
