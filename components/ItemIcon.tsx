'use client';

import { useEffect, useState } from 'react';
import { composeStrip, readyStrip } from '@/lib/lpc';
import type { Item } from '@/lib/game/data';
import { robeIconLayers } from './Sprite';

/** Ảnh vật phẩm: icon có sẵn, hoặc áo vẽ bằng chính lớp áo LPC sẽ mặc lên người */
export default function ItemIconImg({ item, pill, size = 34 }: { item?: Item; pill?: string; size?: number }) {
  if (pill) return <img src={`/icons/${pill}.png`} width={size} height={size} alt="" className="px-icon" />;
  if (!item) return null;
  if (item.icon) return <img src={`/icons/${item.id}.png`} width={size} height={size} alt="" className="px-icon" />;
  if (item.slot === 'ao') return <RobeIcon item={item} size={size} />;
  return null;
}

function RobeIcon({ item, size }: { item: Item; size: number }) {
  const layers = robeIconLayers(item);
  const [url, setUrl] = useState(() => (typeof window !== 'undefined' ? readyStrip(layers, 'idle', 2) : undefined));
  useEffect(() => {
    let live = true;
    composeStrip(layers, 'idle', 2).then((u) => live && setUrl(u));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);
  // áo nằm khoảng x 40-88, y 50-100 trong khung 128: phóng cho vừa ô
  const k = size / 44;
  return (
    <span
      className="px-icon"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        backgroundImage: url ? `url(${url})` : undefined,
        backgroundSize: `${2 * 128 * k}px ${128 * k}px`,
        backgroundPosition: `-${42 * k}px -${54 * k}px`,
        imageRendering: 'pixelated',
      }}
    />
  );
}
