'use client';

import { useEffect, useRef, useState } from 'react';
import ItemIcon from './ItemIcon';
import { PixelFx, fxLua } from './PixelFx';
import { ITEMS } from '@/lib/game/data';
import { FORGE_CHANCE, FORGE_COST, FORGE_MAX, FORGE_PER, breakChance, elFx, forgeLevel, itemEl, tinhPrice, type ForgeResult } from '@/lib/game/forge';
import type { Character } from '@/lib/game/types';

const EL_COL: Record<string, string> = { kim: '#d8d8e8', moc: '#5ac86a', thuy: '#5a9ae0', hoa: '#e85a3a', tho: '#c8963a' };

/**
 * Lò rèn: vũ khí đang cầm đặt trên đe trước lò lửa, búa gõ ba nhịp rồi ra kết quả.
 * Búa lấy từ bộ icon CC0 của Henrique Lazarini, đe từ "Anvil" của AntumDeluge (CC0, dựa trên ảnh của nightowl và Momentmal); lửa lò là hiệu ứng pixel sẵn có của game.
 */
export default function ForgeScene({ c, onForge, onBuy, onClose }: { c: Character; onForge: () => ForgeResult | null; onBuy?: (n: number) => void; onClose: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'hit' | 'res'>('idle');
  const [res, setRes] = useState<ForgeResult | null>(null);
  const [hits, setHits] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const w = c.equipped.vu_khi ? ITEMS.find((i) => i.id === c.equipped.vu_khi) : null;
  // vừa vỡ thì vẫn giữ hình món cũ để hiện kết quả
  const [shown] = useState(w);
  const it = w ?? shown;
  if (!it) return null;
  const lv = forgeLevel(c);
  const el = elFx(itemEl(c, it.id));
  const max = lv >= FORGE_MAX;
  const cost = FORGE_COST[lv] ?? 0;
  const ok = FORGE_CHANCE[lv] ?? 0;
  const brk = (1 - ok) * breakChance(c);
  const enough = (c.tinhHoa ?? 0) >= cost;

  function strike() {
    if (phase === 'hit' || max || !enough || !w) return;
    setPhase('hit');
    setRes(null);
    setHits(0);
    // ba nhịp búa rồi mới ra kết quả
    [0, 1, 2].forEach((i) => timers.current.push(setTimeout(() => setHits(i + 1), 280 + i * 360)));
    timers.current.push(
      setTimeout(() => {
        const r = onForge();
        setRes(r);
        setPhase('res');
        try {
          navigator.vibrate?.(r?.kind === 'break' ? [80, 60, 160] : r?.kind === 'ok' ? 40 : 90);
        } catch {}
      }, 1400),
    );
  }

  return (
    <div className="forge-wrap" role="dialog" aria-modal="true" aria-label="Lò rèn">
      <div className="forge-scene">
        <div className="fs-head">
          <b>Lò rèn</b>
          <span className="fs-tinh">Tinh thiết {c.tinhHoa ?? 0}</span>
          <button className="ss-x" onClick={onClose} aria-label="Đóng lò rèn" disabled={phase === 'hit'}>
            ✕
          </button>
        </div>
        <div className={`fs-stage ${phase === 'hit' ? 'hitting' : ''} ${res ? `r-${res.kind}` : ''}`}>
          <PixelFx spec={fxLua(14)} scale={4} dur={1.2} className="pa fs-fire" />
          <img className="fs-de" src="/px/de_ren.png" alt="" width={64} height={64} />
          <span className={`fs-weapon ${res?.kind === 'break' ? 'broken' : ''}`} key={`w${hits}`}>
            <ItemIcon item={it} />
            {res?.kind !== 'break' && lv > 0 && <i>+{lv}</i>}
          </span>
          <img className={`fs-hammer ${phase === 'hit' ? 'swing' : ''}`} src="/icons/g_chuy_go_lim.png" alt="" width={32} height={32} />
          {phase === 'hit' && hits > 0 && (
            <span className="fs-spark" key={hits} aria-hidden="true">
              {Array.from({ length: 8 }, (_, i) => (
                <i key={i} style={{ ['--a' as string]: `${i * 45}deg` }} />
              ))}
            </span>
          )}
          {res && <span className={`fs-stamp ${res.kind}`}>{res.kind === 'ok' ? `+${res.lv}!` : res.kind === 'break' ? 'VỠ!' : 'Hỏng'}</span>}
        </div>
        <div className="fs-info">
          <b className="fs-name">
            {it.name}
            {res?.kind !== 'break' && lv > 0 ? ` +${lv}` : ''}
          </b>
          <span className="fs-el" style={{ ['--ec' as string]: EL_COL[el.el] }}>
            Hệ {el.name} · {el.short}: {el.per} mỗi cấp {lv > 0 && res?.kind !== 'break' ? `(đang cấp ${lv})` : ''}
          </span>
          {res && <p className={`fs-res ${res.kind}`}>{res.text}</p>}
          {res?.kind === 'break' ? (
            <button className="btn btn-big" onClick={onClose}>
              Rời lò rèn
            </button>
          ) : max ? (
            <p className="note">Đã rèn tới +{FORGE_MAX}, cao nhất.</p>
          ) : (
            <>
              <dl className="fs-odds">
                <dt>Lên +{lv + 1}</dt>
                <dd>
                  công +{Math.round((lv + 1) * FORGE_PER * 100)}%, hệ {el.name} cấp {lv + 1}
                </dd>
                <dt>Tốn</dt>
                <dd className={enough ? '' : 'bad'}>{cost} tinh thiết</dd>
                <dt>Thành</dt>
                <dd>{Math.round(ok * 100)}%</dd>
                <dt>Vỡ mất đồ</dt>
                <dd className={brk > 0 ? 'bad' : ''}>{brk > 0 ? `${Math.round(brk * 100)}%` : 'không'}</dd>
              </dl>
              <button className="btn btn-red btn-big fs-go" disabled={phase === 'hit' || !enough} onClick={strike}>
                {phase === 'hit' ? 'Đang rèn...' : enough ? '⚒ Gõ búa' : 'Thiếu tinh thiết'}
              </button>
              {onBuy && (
                <div className="fs-buy">
                  <small>Mua tinh thiết · {tinhPrice(c)} linh thạch/cục · đang có {Math.floor(c.linhThach)}</small>
                  <span>
                    {[1, 5, Math.max(1, cost - (c.tinhHoa ?? 0))].filter((n, i, a) => a.indexOf(n) === i).map((n) => (
                      <button key={n} className="btn" disabled={phase === 'hit' || c.linhThach < tinhPrice(c) * n} onClick={() => onBuy(n)}>
                        +{n}
                        {n === Math.max(1, cost - (c.tinhHoa ?? 0)) && !enough ? ' (đủ gõ)' : ''}
                      </button>
                    ))}
                  </span>
                </div>
              )}
              {c.legend?.item === it.id && <small className="note">Thần binh truyền đời không vỡ, rèn hỏng chỉ mất tinh thiết.</small>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
