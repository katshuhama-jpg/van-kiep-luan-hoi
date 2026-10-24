'use client';

import { useEffect, useState } from 'react';
import { getMusic, musicPref, setMusicPref } from '@/lib/music';

/** Nút bật/tắt nhạc nền. Trình duyệt chỉ cho phát nhạc sau lần chạm đầu tiên. */
export default function MusicToggle({ battle = false }: { battle?: boolean }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const want = musicPref();
    setOn(want);
    if (!want) return;
    const kick = () => {
      if (musicPref()) getMusic().start();
      window.removeEventListener('pointerdown', kick);
    };
    window.addEventListener('pointerdown', kick);
    return () => window.removeEventListener('pointerdown', kick);
  }, []);

  useEffect(() => {
    getMusic().setMode(battle ? 'battle' : 'calm');
  }, [battle]);

  const toggle = () => {
    const next = !on;
    setOn(next);
    setMusicPref(next);
    if (next) getMusic().start();
    else getMusic().stop();
  };

  return (
    <button className="icon-btn music-btn" onClick={toggle} aria-pressed={on} aria-label={on ? 'Tắt nhạc' : 'Bật nhạc'} title={on ? 'Tắt nhạc' : 'Bật nhạc'}>
      <svg viewBox="0 0 8 8" width="18" height="18" shapeRendering="crispEdges" aria-hidden="true">
        <rect x="3" y="0" width="1" height="6" fill="currentColor" />
        <rect x="4" y="0" width="3" height="1" fill="currentColor" />
        <rect x="6" y="1" width="1" height="1" fill="currentColor" />
        <rect x="1" y="5" width="3" height="2" fill="currentColor" />
        {!on && <rect x="0" y="3" width="8" height="1" fill="#e0402e" transform="rotate(-35 4 4)" />}
      </svg>
    </button>
  );
}
