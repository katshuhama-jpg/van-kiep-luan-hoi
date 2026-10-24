'use client';

import type { CSSProperties } from 'react';
import Sprite, { auraColor, lookOf } from './Sprite';
import type { Character, Fx } from '@/lib/game/types';

const SEASON_CLASS = ['xuan', 'ha', 'thu', 'dong'];

function Background({ focus }: { focus: string }) {
  if (focus === 'luyen_dan')
    return (
      <svg className="bg" viewBox="0 0 90 54" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
        <rect width="90" height="54" fill="#4a3a2e" />
        <polygon points="0,0 90,0 90,10 70,6 50,12 30,5 10,11 0,6" fill="#2e241c" />
        <rect x="0" y="40" width="90" height="14" fill="#3a2e24" />
        <rect x="0" y="40" width="90" height="1" fill="#5a4a3a" />
        <rect x="8" y="14" width="14" height="2" fill="#6e4a2e" />
        <rect x="9" y="10" width="3" height="4" fill="#d9b26a" />
        <rect x="13" y="11" width="3" height="3" fill="#9ff0c8" />
        <rect x="17" y="10" width="3" height="4" fill="#c9a0ff" />
        <g>
          <rect x="66" y="28" width="14" height="12" fill="#5a4a3a" />
          <rect x="64" y="26" width="18" height="3" fill="#3e3228" />
          <rect x="68" y="22" width="10" height="4" fill="#5a4a3a" />
          <rect className="flame" x="69" y="33" width="8" height="5" fill="#ff8a3d" />
          <rect className="flame f2" x="71" y="32" width="4" height="2" fill="#ffd36b" />
        </g>
        <circle className="glow" cx="73" cy="34" r="14" fill="#ff8a3d" opacity="0.18" shapeRendering="auto" />
      </svg>
    );
  if (focus === 'du_ngoan')
    return (
      <svg className="bg" viewBox="0 0 90 54" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
        <rect width="90" height="54" fill="#f6d7a8" />
        <rect y="22" width="90" height="10" fill="#f2c08a" />
        <g className="drift-slow">
          <rect x="10" y="6" width="12" height="3" fill="#fff6e6" /><rect x="8" y="7" width="16" height="2" fill="#fff6e6" />
          <rect x="60" y="10" width="10" height="2" fill="#fff6e6" /><rect x="58" y="11" width="14" height="2" fill="#fff6e6" />
          <rect x="100" y="6" width="12" height="3" fill="#fff6e6" /><rect x="98" y="7" width="16" height="2" fill="#fff6e6" />
          <rect x="150" y="10" width="10" height="2" fill="#fff6e6" /><rect x="148" y="11" width="14" height="2" fill="#fff6e6" />
        </g>
        <g className="drift-mid">
          <polygon points="0,36 12,24 22,32 34,20 48,34 60,26 76,34 90,26 102,24 112,32 124,20 138,34 150,26 166,34 180,26 180,54 0,54" fill="#c9907a" />
        </g>
        <g className="drift-fast">
          <polygon points="0,42 16,32 30,40 46,30 62,40 78,34 90,40 106,32 120,40 136,30 152,40 168,34 180,40 180,54 0,54" fill="#8a9a6a" />
        </g>
        <rect y="44" width="90" height="10" fill="#c9a26a" />
        <rect y="44" width="90" height="1" fill="#e6c48a" />
      </svg>
    );
  if (focus === 'kiem_tien')
    return (
      <svg className="bg" viewBox="0 0 90 54" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
        <rect width="90" height="54" fill="#e8d7ad" />
        <rect y="40" width="90" height="14" fill="#b89a6a" />
        <rect y="40" width="90" height="1" fill="#8a6a3d" />
        <rect x="2" y="22" width="22" height="18" fill="#8a5a3a" />
        <polygon points="0,22 26,22 22,16 4,16" fill="#b8432f" />
        <rect x="5" y="30" width="16" height="3" fill="#d9b26a" />
        <rect x="64" y="22" width="24" height="18" fill="#8a5a3a" />
        <polygon points="62,22 90,22 86,16 66,16" fill="#3d6fb0" />
        <rect x="67" y="30" width="18" height="3" fill="#9ff0c8" />
        <g className="swing" style={{ transformOrigin: '45px 4px' }}>
          <rect x="44" y="4" width="1" height="6" fill="#5a4128" />
          <rect x="42" y="10" width="5" height="6" fill="#d9342b" />
          <rect x="43" y="16" width="3" height="1" fill="#ffd36b" />
        </g>
        <g className="swing s2" style={{ transformOrigin: '30px 2px' }}>
          <rect x="30" y="2" width="1" height="5" fill="#5a4128" />
          <rect x="28" y="7" width="5" height="5" fill="#d9342b" />
        </g>
      </svg>
    );
  if (focus === 'ket_duyen')
    return (
      <svg className="bg" viewBox="0 0 90 54" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
        <rect width="90" height="54" fill="#f6d6e0" />
        <rect x="70" y="6" width="8" height="8" fill="#fff8e6" />
        <rect x="69" y="7" width="10" height="6" fill="#fff8e6" />
        <rect y="38" width="90" height="16" fill="#7fbfc8" />
        <rect y="38" width="90" height="1" fill="#a8dde4" />
        <rect className="ripple" x="10" y="44" width="14" height="1" fill="#a8dde4" />
        <rect className="ripple r2" x="60" y="48" width="12" height="1" fill="#a8dde4" />
        <rect x="14" y="40" width="6" height="2" fill="#5fbf95" />
        <rect x="16" y="38" width="2" height="2" fill="#ff8fb1" />
        <rect x="70" y="42" width="6" height="2" fill="#5fbf95" />
        <rect x="72" y="40" width="2" height="2" fill="#ff8fb1" />
        <rect x="0" y="30" width="6" height="8" fill="#c98a9a" />
        <rect x="84" y="28" width="6" height="10" fill="#c98a9a" />
      </svg>
    );
  // tu luyện: núi, thác
  return (
    <svg className="bg" viewBox="0 0 90 54" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
      <rect width="90" height="54" fill="#cfe1e6" />
      <rect y="18" width="90" height="10" fill="#dfeadf" />
      <polygon points="0,34 12,16 24,28 36,12 52,30 64,18 78,28 90,14 90,54 0,54" fill="#8fb3a6" />
      <polygon points="0,42 18,30 32,38 48,28 66,40 80,32 90,38 90,54 0,54" fill="#6b9a8a" />
      <rect x="70" y="16" width="4" height="30" fill="#e8f6ff" />
      <rect className="fall" x="71" y="16" width="1" height="30" fill="#ffffff" />
      <rect className="fall f2" x="73" y="16" width="1" height="30" fill="#bfe0f0" />
      <rect x="66" y="44" width="12" height="2" fill="#ffffff" opacity="0.7" />
      <rect y="46" width="90" height="8" fill="#5a7a5a" />
      <rect y="46" width="90" height="1" fill="#7a9a6a" />
      <rect x="8" y="34" width="2" height="12" fill="#4a3a2a" />
      <rect x="4" y="28" width="10" height="7" fill="#4a7a5a" />
    </svg>
  );
}

const FX_TEXT: Partial<Record<Fx['kind'], string>> = {
  breakthrough: 'ĐỘT PHÁ!',
  lightning: 'THIÊN KIẾP',
  death: '',
};

export default function Scene({ c, fx, paused, season }: { c: Character; fx: Fx[]; paused: boolean; season: number }) {
  const focus = c.age < 6 ? 'tu_luyen' : c.focus;
  const aura = auraColor(lookOf(c)) ?? '#9ff0c8';
  const shaking = fx.some((f) => f.kind === 'breakthrough' || f.kind === 'hurt' || f.kind === 'lightning');
  const particles = Array.from({ length: 10 }, (_, i) => i);
  return (
    <div className={`scene ${paused ? 'paused' : ''} ${shaking ? 'shake' : ''} ${c.dead ? 'scene-dead' : ''}`} style={{ ['--aura' as string]: aura } as CSSProperties}>
      <Background focus={focus} />

      <div className={`season ${SEASON_CLASS[season]}`} aria-hidden="true">
        {particles.map((i) => (
          <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i * 0.73) % 5}s`, animationDuration: `${5 + (i % 4)}s` }} />
        ))}
      </div>

      {!c.dead && focus === 'tu_luyen' && c.age >= 6 && (
        <div className="amb qi" aria-hidden="true">
          {particles.slice(0, 8).map((i) => (
            <span key={i} style={{ left: `${30 + ((i * 13) % 40)}%`, animationDelay: `${i * 0.35}s` }} />
          ))}
        </div>
      )}
      {!c.dead && focus === 'luyen_dan' && (
        <div className="amb smoke" aria-hidden="true">
          {particles.slice(0, 5).map((i) => (
            <span key={i} style={{ animationDelay: `${i * 0.7}s` }} />
          ))}
        </div>
      )}
      {!c.dead && focus === 'kiem_tien' && (
        <div className="amb coins" aria-hidden="true">
          {particles.slice(0, 3).map((i) => (
            <span key={i} style={{ left: `${44 + i * 6}%`, animationDelay: `${i * 1.1}s` }} />
          ))}
        </div>
      )}
      {!c.dead && focus === 'ket_duyen' && (
        <div className="amb hearts" aria-hidden="true">
          {particles.slice(0, 4).map((i) => (
            <span key={i} style={{ left: `${38 + i * 7}%`, animationDelay: `${i * 0.9}s` }}>♥</span>
          ))}
        </div>
      )}
      {!c.dead && focus === 'du_ngoan' && (
        <div className="amb dust" aria-hidden="true">
          <span />
          <span style={{ animationDelay: '0.4s' }} />
        </div>
      )}

      <div className="sprite-wrap">
        <Sprite c={c} size={176} focus={focus} />
      </div>

      {c.dead && (
        <div className="ghost" aria-hidden="true">
          <Sprite c={{ ...c, dead: false, pet: false }} size={120} />
        </div>
      )}

      <div className="fx-layer" aria-live="polite">
        {fx.map((f, idx) => (
          <div key={f.id} className={`fx fx-${f.kind}`}>
            {f.kind === 'breakthrough' && (
              <>
                <div className="flash" />
                <div className="ring" />
                <div className="ring r2" />
                <div className="ring r3" />
              </>
            )}
            {f.kind === 'lightning' && (
              <>
                <div className="flash dark" />
                <svg className="bolt" viewBox="0 0 20 60" aria-hidden="true"><polyline points="12,0 6,24 12,24 4,60" fill="none" stroke="#fff6a8" strokeWidth="3" /></svg>
                <svg className="bolt b2" viewBox="0 0 20 60" aria-hidden="true"><polyline points="10,0 14,20 8,22 14,60" fill="none" stroke="#c9b8ff" strokeWidth="2" /></svg>
              </>
            )}
            {(f.kind === 'layer' || f.kind === 'buy') && (
              <div className="burst">
                {particles.slice(0, 8).map((i) => (
                  <span key={i} style={{ ['--a' as string]: `${i * 45}deg` } as CSSProperties} />
                ))}
              </div>
            )}
            {f.kind === 'coin' && (
              <div className="burst coinb">
                {particles.slice(0, 8).map((i) => (
                  <span key={i} style={{ ['--a' as string]: `${i * 45}deg` } as CSSProperties} />
                ))}
              </div>
            )}
            {f.kind === 'love' && (
              <div className="burst loveb">
                {particles.slice(0, 6).map((i) => (
                  <span key={i} style={{ ['--a' as string]: `${i * 60}deg` } as CSSProperties}>♥</span>
                ))}
              </div>
            )}
            {f.kind === 'evil' && <div className="smokeburst" />}
            {f.kind === 'hurt' && <div className="flash red" />}
            {f.kind === 'heal' && <div className="plus">+</div>}
            {(f.label || FX_TEXT[f.kind]) && (
              <div className={`fx-label ${f.kind === 'breakthrough' || f.kind === 'lightning' ? 'big' : ''}`} style={f.kind === 'breakthrough' || f.kind === 'lightning' ? undefined : { top: `${20 + (idx % 4) * 11}%` }}>
                {f.kind === 'breakthrough' && f.label ? (
                  <>
                    <small>ĐỘT PHÁ</small>
                    {f.label}
                  </>
                ) : (
                  f.label || FX_TEXT[f.kind]
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
