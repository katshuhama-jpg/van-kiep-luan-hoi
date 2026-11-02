'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ItemIcon from './ItemIcon';
import Sprite from './Sprite';
import { ITEMS, fxText, type Item } from '@/lib/game/data';
import { emptyMeta, newCharacter } from '@/lib/game/engine';
import { fmt } from '@/lib/game/helpers';
import {
  MERGE_CHANCE,
  MERGE_COST,
  canMerge,
  marketSpan,
  type MergeResult,
  type Ware,
} from '@/lib/game/market';
import type { Character } from '@/lib/game/types';
import { tr } from '@/lib/i18n';

const RARE_NAME = [tr('Phàm', 'Common'), tr('Tốt', 'Fine'), tr('Hiếm', 'Rare'), tr('Cực phẩm', 'Supreme')];
const pct = (x: number) => `${x > 1 ? '+' : ''}${Math.round((x - 1) * 100)}%`;

/** Nhân vật LPC dựng sẵn cho NPC (người đấu giá, thương nhân), giữ nguyên dáng suốt cảnh */
function useNpc(seed: number, age: number, realm: number): Character {
  return useMemo(() => {
    const c = newCharacter(emptyMeta());
    c.age = age;
    c.realm = realm;
    c.layer = 1;
    c.gender = seed % 2 ? 'nam' : 'nu';
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);
}

/* ---------------- Thị tượng trong phường thị ---------------- */
export function MarketOmenBox({ c }: { c: Character }) {
  const { omen: m, start } = marketSpan(c);
  const line =
    [m.buy !== 1 && tr(`mua đồ ${pct(m.buy)}`, `gear ${pct(m.buy)}`), m.sell !== 1 && tr(`bán đồ ${pct(m.sell)}`, `selling ${pct(m.sell)}`), m.pill !== 1 && tr(`đan ${pct(m.pill)}`, `pills ${pct(m.pill)}`), m.tinh !== 1 && tr(`tinh thiết ${pct(m.tinh)}`, `iron ${pct(m.tinh)}`)]
      .filter(Boolean)
      .join(' · ') || tr('giá như thường', 'normal prices');
  const yrs = Math.floor(c.age) - start;
  return (
    <div className={`mk-omen mk-${m.buy > 1.05 || m.sell < 0.95 || m.pill > 1.05 ? 'dat' : m.buy < 0.95 || m.sell > 1.05 ? 're' : 'binh'}`}>
      <img src="/icons/g_kim_bat.png" width={48} height={48} alt="" className="px-icon" />
      <div>
        <small>{tr('Thị tượng', 'Market')}</small>
        <b>{m.name}</b>
        <span>{m.desc}</span>
        <span>{line}</span>
        <small className="mk-next">{tr(`Đã ${yrs} năm nay. Thị trường đổi lúc nào không ai biết trước.`, `For ${yrs} years now. No one knows when the market will turn.`)}</small>
      </div>
    </div>
  );
}

/* ---------------- Lò hợp bảo ---------------- */
export function MergeScene({ c, onMerge, onClose }: { c: Character; onMerge: (ids: string[]) => MergeResult | null; onClose: () => void }) {
  const [pick, setPick] = useState<string[]>([]);
  const [rare, setRare] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'fuse' | 'res'>('idle');
  const [res, setRes] = useState<MergeResult | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const pool = ITEMS.filter((i) => canMerge(c, i) && (i.rare ?? 0) === rare);
  const picked = pick.map((id) => ITEMS.find((i) => i.id === id)).filter((x): x is Item => !!x);
  const cost = MERGE_COST[rare];
  const enough = (c.tinhHoa ?? 0) >= cost;
  const ready = picked.length === 3 && enough && phase !== 'fuse';
  const toggle = (id: string) => {
    if (phase === 'fuse') return;
    setRes(null);
    setPhase('idle');
    setPick((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : p));
  };
  function go() {
    if (!ready) return;
    setPhase('fuse');
    timers.current.push(
      setTimeout(() => {
        const r = onMerge(pick);
        setRes(r);
        setPick([]);
        setPhase('res');
        try {
          navigator.vibrate?.(r?.kind === 'ok' ? [40, 40, 80] : 90);
        } catch {}
      }, 1500),
    );
  }
  return (
    <div className="forge-wrap" role="dialog" aria-modal="true" aria-label={tr('Lò hợp bảo', 'Treasure cauldron')}>
      <div className="forge-scene">
        <div className="fs-head">
          <b>{tr('Lò hợp bảo', 'Treasure cauldron')}</b>
          <span className="fs-tinh">{tr('Tinh thiết ', 'Refined iron ')}{c.tinhHoa ?? 0}</span>
          <button className="ss-x" onClick={onClose} aria-label={tr('Đóng lò hợp bảo', 'Close the cauldron')} disabled={phase === 'fuse'}>
            ✕
          </button>
        </div>
        <div className={`mg-stage ${phase}`} style={{ backgroundImage: 'url(/bg/luyen_dan-0.png)' }}>
          <div className="mg-slots">
            {[0, 1, 2].map((k) => (
              <button key={k} type="button" className={`mg-slot r${rare} ${picked[k] ? '' : 'empty'}`} onClick={() => picked[k] && toggle(picked[k].id)} aria-label={picked[k] ? picked[k].name : tr('Ô trống', 'Empty slot')}>
                {picked[k] ? <ItemIcon item={picked[k]} size={48} /> : <small>{k + 1}</small>}
              </button>
            ))}
          </div>
          <img className="mg-lo" src="/icons/lo_dan.png" width={96} height={96} alt="" />
          {phase === 'fuse' && (
            <span className="mg-smoke" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => (
                <i key={i} style={{ ['--i' as string]: i }} />
              ))}
            </span>
          )}
          {res && (
            <span className={`mg-out ${res.kind}`}>
              <ItemIcon item={res.item} size={64} />
            </span>
          )}
          {res && <span className={`fs-stamp ${res.kind === 'ok' ? 'ok' : 'fail'}`}>{res.kind === 'ok' ? tr('Thành!', 'Fused!') : tr('Hỏng', 'Failed')}</span>}
        </div>
        <div className="fs-info">
          {res && <p className={`fs-res ${res.kind === 'ok' ? 'ok' : 'fail'}`}>{res.text}</p>}
          <div className="chips">
            {[0, 1, 2].map((r) => (
              <button key={r} className={`chip-btn ${rare === r ? 'on' : ''}`} disabled={phase === 'fuse'} onClick={() => (setRare(r), setPick([]))}>
                {RARE_NAME[r]} → {RARE_NAME[r + 1]}
              </button>
            ))}
          </div>
          <dl className="fs-odds">
            <dt>{tr('Ba món', 'Three items')}</dt>
            <dd>{tr(`cùng phẩm ${RARE_NAME[rare]}, không đang mặc`, `all ${RARE_NAME[rare]}, not equipped`)}</dd>
            <dt>{tr('Thành', 'Success')}</dt>
            <dd>
              {Math.round(MERGE_CHANCE[rare] * 100)}%{tr(` ra 1 món ${RARE_NAME[rare + 1]}`, ` for 1 ${RARE_NAME[rare + 1]} item`)}
            </dd>
            <dt>{tr('Hỏng', 'Fail')}</dt>
            <dd className="bad">{tr(`còn lại 1 món ${RARE_NAME[rare]}`, `1 ${RARE_NAME[rare]} item remains`)}</dd>
            <dt>{tr('Nguyên liệu', 'Materials')}</dt>
            <dd className={enough ? '' : 'bad'}>
              {cost}
              {tr(' tinh thiết', ' refined iron')}
            </dd>
          </dl>
          <button className="btn btn-red btn-big fs-go" disabled={!ready} onClick={go}>
            {phase === 'fuse' ? tr('Đang hợp...', 'Fusing...') : picked.length < 3 ? tr(`Chọn thêm ${3 - picked.length} món`, `Pick ${3 - picked.length} more`) : enough ? tr('⚗ Hợp đồ', '⚗ Fuse') : tr('Thiếu tinh thiết', 'Not enough refined iron')}
          </button>
          <div className="mg-list">
            {pool.length === 0 && <p className="note">{tr(`Chưa có món ${RARE_NAME[rare]} nào để hợp. Đồ đang mặc, thần binh truyền đời và đồ cơ duyên không hợp được.`, `No ${RARE_NAME[rare]} items to fuse. Equipped gear, heirloom weapons and fate items can't be fused.`)}</p>}
            {pool.map((it) => (
              <button key={it.id} type="button" className={`mg-item r${rare} ${pick.includes(it.id) ? 'on' : ''}`} onClick={() => toggle(it.id)}>
                <ItemIcon item={it} size={34} />
                <span>{it.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Thương nhân lưu động ---------------- */
export function MerchantScene({ c, wares, onBuy, onHaggle, onRob, onLeave }: { c: Character; wares: Ware[]; onBuy: (k: number) => void; onHaggle: (k: number) => string | null; onRob: (k: number) => void; onLeave: () => void }) {
  const merchant = useNpc(11, 70, Math.min(c.realm, 3));
  const [msg, setMsg] = useState(tr('"Hàng hiếm, mỗi thứ một món. Đạo hữu ưng món nào?"', '"Rare goods, one of each. Which one catches your eye?"'));
  return (
    <div className="forge-wrap" role="dialog" aria-modal="true" aria-label={tr('Thương nhân lưu động', 'Wandering merchant')}>
      <div className="forge-scene mc-scene">
        <div className="fs-head">
          <b>{tr('Thương nhân lưu động', 'Wandering merchant')}</b>
          <span className="fs-tinh">
            {tr('Linh thạch ', 'Stones ')}
            {fmt(c.linhThach)}
          </span>
        </div>
        <div className="mc-stage" style={{ backgroundImage: 'url(/bg/du_ngoan-0.png)' }}>
          <div className="mc-man">
            <Sprite c={merchant} size={128} anim="idle" dir={2} />
          </div>
          <p className="mc-say">{msg}</p>
        </div>
        <div className="fs-info">
          {wares.map((w, k) => (
            <div key={w.item.id} className={`item mc-ware rare-${w.item.rare ?? 0} ${w.state}`}>
              <div className="item-icon">
                <ItemIcon item={w.item} />
              </div>
              <div className="item-body">
                <span>
                  {w.item.name} <em className={`rare-tag r${w.item.rare ?? 0}`}>{RARE_NAME[w.item.rare ?? 0]}</em>
                </span>
                {w.item.fx && <small className="fx-line">{fxText(w.item.fx)}</small>}
                <small>{w.state === 'bought' ? tr('Đã về tay bạn', 'Now yours') : w.state === 'gone' ? tr('Lão không bán nữa', 'No longer for sale') : tr(`Giá ${fmt(w.price)} linh thạch`, `Price ${fmt(w.price)} spirit stones`)}</small>
              </div>
              {w.state === 'open' && (
                <div className="mc-acts">
                  <button className="btn btn-red" disabled={c.linhThach < w.price} onClick={() => onBuy(k)}>
                    {tr('Mua', 'Buy')}
                  </button>
                  <button className="btn" onClick={() => setMsg(onHaggle(k) ?? msg)}>
                    {tr('Mặc cả', 'Haggle')}
                  </button>
                  <button className="btn btn-dark" onClick={() => onRob(k)}>
                    {tr('Cướp', 'Rob')}
                  </button>
                </div>
              )}
            </div>
          ))}
          <small className="note">{tr('Mặc cả nhờ Ngộ tính và Khí vận, lỡ lời thì lão nâng giá hoặc cất hàng. Cướp làm đạo tâm sa xuống, lão có hộ vệ.', 'Haggling uses Insight and Luck; say the wrong thing and he raises the price or hides it. Robbing darkens your Dao Heart, and he has bodyguards.')}</small>
          <button className="btn btn-big" onClick={onLeave}>
            {tr('Chào lão, đi tiếp', 'Bid farewell and move on')}
          </button>
        </div>
      </div>
    </div>
  );
}
