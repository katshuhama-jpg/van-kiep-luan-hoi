'use client';

import type { CSSProperties } from 'react';
import Sprite, { auraColor, lookOf } from './Sprite';
import { BattleOverlay, type BattleView } from './Battle';
import MonsterLpc from './MonsterLpc';
import { DRAGON_BABY, DRAGON_BIG } from '@/lib/game/monsterLook';
import type { Character, Fx } from '@/lib/game/types';
import { REALMS } from '@/lib/game/data';

const REALM_NAMES: string[] = REALMS.map((r) => r.name);

const SEASON_CLASS = ['xuan', 'ha', 'thu', 'dong'];
const BG_SCENES = ['tu_luyen', 'du_ngoan', 'kiem_tien', 'ket_duyen', 'luyen_dan'];
const SEASON_PARTS = Array.from({ length: 24 }, (_, i) => i);

/** Bảng màu từng mùa: trời, sương, núi xa, đồi gần, đất, mép cỏ, tán lá, thân cây, nước */
const PAL = [
  { sky: '#dff0e8', haze: '#f6e0ea', far: '#9cc4a8', near: '#6faa82', ground: '#5f9a5a', top: '#8ac87a', leaf: '#f2a6c0', leaf2: '#ffd0de', trunk: '#5a3a2a', water: '#e8f6ff', road: '#c9a26a' },
  { sky: '#bfe4f4', haze: '#e6f6d6', far: '#6faa8a', near: '#4a8a5a', ground: '#3f7a3a', top: '#6ab85a', leaf: '#3f8a3a', leaf2: '#5fb05a', trunk: '#4a3a2a', water: '#e8f6ff', road: '#c9a26a' },
  { sky: '#f2dcb4', haze: '#f6c98a', far: '#c9906a', near: '#a8603a', ground: '#8a6a3a', top: '#c9963a', leaf: '#d9602a', leaf2: '#f0a030', trunk: '#4a2a1a', water: '#e6eef0', road: '#b88a5a' },
  { sky: '#dde6f0', haze: '#eef2f8', far: '#a8b8c8', near: '#8a9aae', ground: '#e6eef6', top: '#ffffff', leaf: '#ffffff', leaf2: '#dfe8f2', trunk: '#4a3a3a', water: '#cfe6f6', road: '#d8dce6' },
];

/** Cây theo mùa: xuân hoa đào, hạ xanh, thu lá đỏ, đông trơ cành phủ tuyết */
function Tree({ x, y, s }: { x: number; y: number; s: number }) {
  const P = PAL[s];
  return (
    <g>
      <rect x={x + 4} y={y + 6} width={2} height={12} fill={P.trunk} />
      {s === 3 ? (
        <>
          <rect x={x + 1} y={y + 5} width={4} height={1} fill={P.trunk} />
          <rect x={x + 6} y={y + 3} width={3} height={1} fill={P.trunk} />
          <rect x={x + 1} y={y + 4} width={4} height={1} fill="#ffffff" />
          <rect x={x + 6} y={y + 2} width={3} height={1} fill="#ffffff" />
          <rect x={x + 4} y={y + 5} width={2} height={1} fill="#ffffff" />
        </>
      ) : (
        <>
          <rect x={x} y={y} width={10} height={7} fill={P.leaf} />
          <rect x={x + 2} y={y - 2} width={6} height={2} fill={P.leaf} />
          <rect x={x + 2} y={y + 1} width={2} height={1} fill={P.leaf2} />
          <rect x={x + 6} y={y + 3} width={2} height={1} fill={P.leaf2} />
          {s === 0 && <rect x={x + 4} y={y - 1} width={1} height={1} fill="#ffffff" />}
        </>
      )}
    </g>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Background({ focus, season = 0 }: { focus: string; season?: number }) {
  const P = PAL[season] ?? PAL[0];
  const snow = season === 3;
  if (focus === 'luyen_dan')
    return (
      <svg className="bg" viewBox="0 0 90 54" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
        <rect width="90" height="54" fill="#4a3a2e" />
        <polygon points="0,0 90,0 90,10 70,6 50,12 30,5 10,11 0,6" fill="#2e241c" />
        {/* cửa sổ nhìn ra mùa */}
        <rect x="34" y="12" width="18" height="14" fill="#2e241c" />
        <rect x="35" y="13" width="16" height="12" fill={P.sky} />
        <rect x="35" y="21" width="16" height="4" fill={P.near} />
        <rect x="35" y="20" width="16" height="1" fill={P.top} />
        <rect x="38" y="15" width="4" height="3" fill={P.leaf} />
        <rect x="39" y="18" width="1" height="3" fill={P.trunk} />
        <rect x="42" y="13" width="1" height="12" fill="#2e241c" />
        <rect x="35" y="18" width="16" height="1" fill="#2e241c" />
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
        <rect width="90" height="54" fill={P.sky} />
        <rect y="22" width="90" height="10" fill={P.haze} />
        <g className="drift-slow">
          <rect x="10" y="6" width="12" height="3" fill="#fff6e6" /><rect x="8" y="7" width="16" height="2" fill="#fff6e6" />
          <rect x="60" y="10" width="10" height="2" fill="#fff6e6" /><rect x="58" y="11" width="14" height="2" fill="#fff6e6" />
          <rect x="100" y="6" width="12" height="3" fill="#fff6e6" /><rect x="98" y="7" width="16" height="2" fill="#fff6e6" />
          <rect x="150" y="10" width="10" height="2" fill="#fff6e6" /><rect x="148" y="11" width="14" height="2" fill="#fff6e6" />
        </g>
        <g className="drift-mid">
          <polygon points="0,36 12,24 22,32 34,20 48,34 60,26 76,34 90,26 102,24 112,32 124,20 138,34 150,26 166,34 180,26 180,54 0,54" fill={P.far} />
          {snow && <polygon points="10,26 12,24 14,26 32,22 34,20 36,22 100,26 102,24 104,26 122,22 124,20 126,22" fill="#ffffff" />}
        </g>
        <g className="drift-fast">
          <polygon points="0,42 16,32 30,40 46,30 62,40 78,34 90,40 106,32 120,40 136,30 152,40 168,34 180,40 180,54 0,54" fill={P.near} />
          <Tree x={20} y={26} s={season} />
          <Tree x={110} y={26} s={season} />
        </g>
        <rect y="44" width="90" height="10" fill={P.road} />
        <rect y="44" width="90" height="1" fill={snow ? '#ffffff' : '#e6c48a'} />
      </svg>
    );
  if (focus === 'kiem_tien')
    return (
      <svg className="bg" viewBox="0 0 90 54" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
        <rect width="90" height="54" fill={P.sky} />
        <rect y="40" width="90" height="14" fill={snow ? '#e6eef6' : '#b89a6a'} />
        <rect y="40" width="90" height="1" fill={snow ? '#ffffff' : '#8a6a3d'} />
        <Tree x={36} y={22} s={season} />
        <rect x="2" y="22" width="22" height="18" fill="#8a5a3a" />
        <polygon points="0,22 26,22 22,16 4,16" fill="#b8432f" />
        {snow && <polygon points="1,17 25,17 22,15 4,15" fill="#ffffff" />}
        <rect x="5" y="30" width="16" height="3" fill="#d9b26a" />
        <rect x="64" y="22" width="24" height="18" fill="#8a5a3a" />
        <polygon points="62,22 90,22 86,16 66,16" fill="#3d6fb0" />
        {snow && <polygon points="63,17 89,17 86,15 66,15" fill="#ffffff" />}
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
        <rect width="90" height="54" fill={season === 0 ? '#f6d6e0' : P.sky} />
        <rect y="26" width="90" height="12" fill={P.haze} />
        <rect x="70" y="6" width="8" height="8" fill="#fff8e6" />
        <rect x="69" y="7" width="10" height="6" fill="#fff8e6" />
        <rect y="38" width="90" height="16" fill={snow ? '#cfe6f6' : '#7fbfc8'} />
        <rect y="38" width="90" height="1" fill={snow ? '#ffffff' : '#a8dde4'} />
        {!snow && <rect className="ripple" x="10" y="44" width="14" height="1" fill="#a8dde4" />}
        {!snow && <rect className="ripple r2" x="60" y="48" width="12" height="1" fill="#a8dde4" />}
        {snow && <rect x="20" y="46" width="30" height="1" fill="#ffffff" />}
        {(season === 0 || season === 1) && (
          <>
            <rect x="14" y="40" width="6" height="2" fill="#5fbf95" />
            <rect x="16" y="38" width="2" height="2" fill="#ff8fb1" />
            <rect x="70" y="42" width="6" height="2" fill="#5fbf95" />
            <rect x="72" y="40" width="2" height="2" fill="#ff8fb1" />
          </>
        )}
        {season === 2 && (
          <>
            <rect x="18" y="43" width="2" height="1" fill="#d9602a" />
            <rect x="52" y="47" width="2" height="1" fill="#f0a030" />
            <rect x="74" y="42" width="2" height="1" fill="#d9602a" />
          </>
        )}
        <rect x="0" y="30" width="6" height="8" fill={P.near} />
        <rect x="84" y="28" width="6" height="10" fill={P.near} />
        <Tree x={-2} y={14} s={season} />
        <Tree x={80} y={12} s={season} />
      </svg>
    );
  // tu luyện: núi, thác
  return (
    <svg className="bg" viewBox="0 0 90 54" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
      <rect width="90" height="54" fill={P.sky} />
      <rect y="18" width="90" height="10" fill={P.haze} />
      {season === 1 && <rect x="12" y="4" width="6" height="6" fill="#fff2a8" />}
      <polygon points="0,34 12,16 24,28 36,12 52,30 64,18 78,28 90,14 90,54 0,54" fill={P.far} />
      {snow && <polygon points="9,20 12,16 15,20 32,17 36,12 40,17 61,22 64,18 67,22 86,19 90,14 90,20" fill="#ffffff" />}
      <polygon points="0,42 18,30 32,38 48,28 66,40 80,32 90,38 90,54 0,54" fill={P.near} />
      <rect x="70" y="16" width="4" height="30" fill={snow ? '#dff0fa' : '#e8f6ff'} />
      {!snow && <rect className="fall" x="71" y="16" width="1" height="30" fill="#ffffff" />}
      {!snow && <rect className="fall f2" x="73" y="16" width="1" height="30" fill="#bfe0f0" />}
      {snow && <rect x="70" y="20" width="4" height="1" fill="#b4d4e6" />}
      <rect x="66" y="44" width="12" height="2" fill="#ffffff" opacity="0.7" />
      <rect y="46" width="90" height="8" fill={P.ground} />
      <rect y="46" width="90" height="1" fill={P.top} />
      {season === 0 && (
        <>
          <rect x="20" y="48" width="1" height="1" fill="#ff8fb1" />
          <rect x="40" y="50" width="1" height="1" fill="#ffd36b" />
          <rect x="56" y="48" width="1" height="1" fill="#ff8fb1" />
        </>
      )}
      {season === 2 && (
        <>
          <rect x="22" y="48" width="2" height="1" fill="#d9602a" />
          <rect x="48" y="50" width="2" height="1" fill="#f0a030" />
        </>
      )}
      <Tree x={4} y={28} s={season} />
    </svg>
  );
}

const FX_TEXT: Partial<Record<Fx['kind'], string>> = {
  breakthrough: 'ĐỘT PHÁ!',
  lightning: 'THIÊN KIẾP',
  death: 'BỎ MẠNG',
};

export default function Scene({ c, fx, paused, season, battle }: { c: Character; fx: Fx[]; paused: boolean; season: number; battle?: BattleView | null }) {
  const focus = c.age < 6 ? 'tu_luyen' : c.focus;
  const aura = auraColor(lookOf(c)) ?? '#9ff0c8';
  const shaking = fx.some((f) => f.kind === 'breakthrough' || f.kind === 'hurt' || f.kind === 'lightning');
  const particles = Array.from({ length: 10 }, (_, i) => i);
  return (
    <div className={`scene ${paused ? 'paused' : ''} ${shaking ? 'shake' : ''} ${c.dead ? 'scene-dead' : ''} ${battle ? 'in-battle' : ''}`} style={{ ['--aura' as string]: aura } as CSSProperties}>
      <div className="bg bg-img" style={{ backgroundImage: `url(/bg/${BG_SCENES.includes(focus) ? focus : 'tu_luyen'}-${season}.png)` }} aria-hidden="true" />
      {(focus === 'tu_luyen' || !BG_SCENES.includes(focus)) && season !== 3 && <div className="bg-fall" aria-hidden="true" />}

      <div className={`season ${SEASON_CLASS[season]}`} aria-hidden="true">
        {season === 1 && <div className="sunrays" />}
        {season === 3 && <div className="snowbank" />}
        {SEASON_PARTS.map((i) => (
          <span
            key={i}
            className={`p${i % 3}`}
            style={{ left: `${(i * 37 + (i % 5) * 7) % 104 - 2}%`, animationDelay: `${-((i * 0.83) % 7)}s`, animationDuration: `${(season === 3 ? 6 : 5) + (i % 5) * 0.9}s` }}
          />
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

      {battle && !c.dead && <BattleOverlay b={battle} />}

      {!c.dead && !battle && (c.mount === 'rong' || (c.arcs?.rong && c.arcs.rong.s >= 2 && c.arcs.rong.s < 9)) && (
        <div className={`dragon ${c.mount === 'rong' ? 'big' : 'baby'}`} aria-hidden="true">
          <MonsterLpc look={c.mount === 'rong' ? DRAGON_BIG : DRAGON_BABY} size={c.mount === 'rong' ? 96 : 52} tier={c.arcs?.rong?.v === 'ma' ? 1 : 0} />
        </div>
      )}

      <div className={`sprite-wrap ${battle && battle.last.length && battle.last[battle.last.length - 1].side === 'p' ? 'lunge' : ''}`} key={battle?.last[battle.last.length - 1]?.id ?? 'idle'}>
        <Sprite c={c} size={150} focus={focus} anim={battle && !c.dead ? (battle.phase === 'fight' ? 'slash' : 'idle') : undefined} dir={battle && !c.dead ? 3 : undefined} />
      </div>

      {c.dead && (
        <div className="ghost" aria-hidden="true">
          <Sprite c={{ ...c, dead: false, pet: false }} size={110} anim="idle" />
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
                    <small>{REALM_NAMES.includes(f.label) || f.label === 'PHI THĂNG' ? 'ĐỘT PHÁ' : 'NHẬP ĐẠO'}</small>
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
