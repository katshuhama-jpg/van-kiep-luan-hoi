'use client';

import { useEffect, useState } from 'react';
import { composeStrip, readyStrip } from '@/lib/lpc';
import type { Item } from '@/lib/game/data';
import { robeIconLayers } from './Sprite';

/** Ảnh vật phẩm: icon có sẵn, hoặc áo vẽ bằng chính lớp áo LPC sẽ mặc lên người */
export default function ItemIconImg({ item, pill, size = 34, silhouette }: { item?: Item; pill?: string; size?: number; silhouette?: boolean }) {
  if (pill) return <img src={`/icons/${pill}.png`} width={size} height={size} alt="" className="px-icon" loading="lazy" />;
  if (!item) return null;
  if (item.icon) return <img src={`/icons/${item.id}.png`} width={size} height={size} alt="" className="px-icon" loading="lazy" />;
  // áo chưa có (bóng đen trong Bảo khố): dùng hình bóng áo sẵn, không ghép lớp LPC cho đỡ nặng máy
  if (item.slot === 'ao' && silhouette) return <img src="/icons/_robe_sil.png" width={size} height={size} alt="" className="px-icon" />;
  if (item.slot === 'ao') return <RobeIcon item={item} size={size} />;
  return null;
}

/** Ghép icon áo lần lượt từng cái (tối đa 2 cùng lúc, nhường luồng giữa các lần) để danh sách dài không làm đơ máy */
const ICON_URL = new Map<string, string>();
let running = 0;
const waiting: (() => void)[] = [];
function queued<T>(job: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const go = () => {
      running++;
      job()
        .then(resolve, reject)
        .finally(() => {
          running--;
          const next = waiting.shift();
          if (next) setTimeout(next, 16);
        });
    };
    if (running < 2) go();
    else waiting.push(go);
  });
}

function RobeIcon({ item, size }: { item: Item; size: number }) {
  const layers = robeIconLayers(item);
  const [url, setUrl] = useState(() => (typeof window !== 'undefined' ? (ICON_URL.get(item.id) ?? readyStrip(layers, 'idle', 2)) : undefined));
  useEffect(() => {
    let live = true;
    if (ICON_URL.has(item.id)) return;
    queued(() => (live ? composeStrip(layers, 'idle', 2) : Promise.resolve(''))).then((u) => {
      if (!u) return;
      ICON_URL.set(item.id, u);
      if (live) setUrl(u);
    });
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
