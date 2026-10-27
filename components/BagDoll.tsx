'use client';

import { useEffect, useState } from 'react';
import ItemIcon from './ItemIcon';
import Sprite from './Sprite';
import { ITEMS, PILLS, fxText as fxTextData, gearFx, type Item } from '@/lib/game/data';
import { playerStats } from '@/lib/game/combat';
import { FORGE_CHANCE, FORGE_COST, FORGE_MAX, FORGE_PER, SEALS, SEAL_COST, canSmelt, forgeLevel, sealLv, smeltValue } from '@/lib/game/forge';
import type { Character, Element, Slot } from '@/lib/game/types';

const RARE_TXT = ['Thường', 'Tốt', 'Hiếm', 'Cực phẩm'];
const SLOT_NAME: Record<Slot, string> = { ao: 'Áo', vu_khi: 'Vũ khí', phu_kien: 'Phụ kiện' };
type Kind = 'all' | Slot | 'dan';
const KINDS: [Kind, string][] = [
  ['all', 'Tất cả'],
  ['vu_khi', 'Vũ khí'],
  ['ao', 'Áo'],
  ['phu_kien', 'Phụ kiện'],
  ['dan', 'Đan'],
];
type Sel = { item: string } | { pill: string } | null;

const fxText = (fx?: Item['fx']) => (fx ? fxTextData(fx) : '');

function readPref(k: string) {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function writePref(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {}
}

/**
 * Túi đồ kiểu búp bê: nhân vật ở giữa, ô trang bị quanh người, chỉ số bên cạnh, lưới đồ ở dưới.
 * Chạm một ô để xem chi tiết và thao tác: dùng, luyện hóa, rèn, khắc ấn ngũ hành.
 */
export default function BagDoll({ c, onEquip, onUsePill, onSmelt, onForge, onSeal }: { c: Character; onEquip: (id: string) => void; onUsePill: (id: string) => void; onSmelt?: (id: string) => void; onForge?: () => void; onSeal?: (el: Element) => void }) {
  const [kind, setKind] = useState<Kind>(() => (readPref('vkl.bagKind') as Kind) || 'all');
  useEffect(() => writePref('vkl.bagKind', kind), [kind]);
  const [sel, setSel] = useState<Sel>(() => (c.equipped.vu_khi ? { item: c.equipped.vu_khi } : null));
  const owned = ITEMS.filter((i) => c.inventory.includes(i.id)).sort((a, b) => c.inventory.lastIndexOf(b.id) - c.inventory.lastIndexOf(a.id));
  const pills = PILLS.filter((p) => (c.pills[p.id] ?? 0) > 0);
  const shownItems = kind === 'dan' ? [] : kind === 'all' ? owned : owned.filter((i) => i.slot === kind);
  const shownPills = kind === 'all' || kind === 'dan' ? pills : [];
  const st = playerStats(c);
  const g = gearFx(c.equipped);
  const lv = forgeLevel(c);
  const isOn = (id: string) => Object.values(c.equipped).includes(id);
  const selItem = sel && 'item' in sel ? ITEMS.find((i) => i.id === sel.item) : null;
  const selPill = sel && 'pill' in sel ? PILLS.find((p) => p.id === sel.pill) : null;
  // món đang chọn bị luyện hóa mất thì bỏ chọn
  useEffect(() => {
    if (sel && 'item' in sel && !c.inventory.includes(sel.item)) setSel(null);
    if (sel && 'pill' in sel && !(c.pills[sel.pill] > 0)) setSel(null);
  });

  const slotBox = (s: Slot) => {
    const id = c.equipped[s];
    const it = id ? ITEMS.find((i) => i.id === id) : null;
    const on = !!it && selItem?.id === it.id;
    return (
      <button type="button" className={`doll-slot r${it?.rare ?? 0} ${on ? 'sel' : ''} ${it ? '' : 'empty'}`} onClick={() => it && setSel({ item: it.id })} aria-label={it ? `${SLOT_NAME[s]}: ${it.name}` : `${SLOT_NAME[s]} trống`}>
        {it ? <ItemIcon item={it} /> : <small>{SLOT_NAME[s]}</small>}
        {s === 'vu_khi' && lv > 0 && <i className="doll-plus">+{lv}</i>}
      </button>
    );
  };

  return (
    <div className="bagdoll">
      <div className="doll">
        <div className="doll-col">
          {slotBox('ao')}
          {slotBox('vu_khi')}
        </div>
        <div className="doll-fig">
          <Sprite c={c} size={132} anim="idle" dir={2} />
        </div>
        <div className="doll-col">
          {slotBox('phu_kien')}
          <dl className="doll-stats">
            <dt>Công</dt>
            <dd>{st.atk}</dd>
            <dt>Thủ</dt>
            <dd>{st.def}</dd>
            <dt>Sinh lực</dt>
            <dd>{st.hp}</dd>
          </dl>
        </div>
      </div>
      <div className="doll-bar">
        <span>{fxTextData(g) || 'Trang bị chưa có chỉ số'}</span>
        <b>Tinh hoa {c.tinhHoa ?? 0}</b>
      </div>

      <div className="inv-kinds" role="tablist" aria-label="Loại đồ">
        {KINDS.map(([k, n]) => (
          <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
            {n}
          </button>
        ))}
      </div>
      <div className="inv-grid">
        {shownItems.map((it) => (
          <button key={it.id} type="button" className={`inv-cell r${it.rare ?? 0} ${selItem?.id === it.id ? 'sel' : ''}`} onClick={() => setSel({ item: it.id })} aria-label={it.name}>
            <ItemIcon item={it} />
            {isOn(it.id) && <i className="inv-on">Mặc</i>}
          </button>
        ))}
        {shownPills.map((p) => (
          <button key={p.id} type="button" className={`inv-cell pill ${selPill?.id === p.id ? 'sel' : ''}`} onClick={() => setSel({ pill: p.id })} aria-label={p.name}>
            <ItemIcon pill={p.id} />
            <i className="inv-n">{c.pills[p.id]}</i>
          </button>
        ))}
        {Array.from({ length: Math.max(0, 10 - shownItems.length - shownPills.length) }, (_, i) => (
          <span key={`e${i}`} className="inv-cell empty" aria-hidden="true" />
        ))}
      </div>

      {selItem && (
        <section className="inv-detail">
          <div className="inv-d-head">
            <span className={`inv-cell r${selItem.rare ?? 0}`}>
              <ItemIcon item={selItem} />
            </span>
            <span>
              <b>
                {c.legend?.item === selItem.id ? `★ ${c.legend.name}` : selItem.name}
                {selItem.slot === 'vu_khi' && isOn(selItem.id) && lv > 0 ? <em className="forge-lv"> +{lv}</em> : null}
              </b>
              <small>
                {SLOT_NAME[selItem.slot]} · {RARE_TXT[selItem.rare ?? 0]}
                {selItem.fx ? ` · ${fxText(selItem.fx)}` : ''}
              </small>
            </span>
          </div>
          <p className="inv-desc">{selItem.desc}</p>
          <div className="inv-acts">
            <button className={`btn ${isOn(selItem.id) ? 'btn-jade' : 'btn-red'}`} onClick={() => onEquip(selItem.id)}>
              {isOn(selItem.id) ? 'Đang dùng' : 'Dùng'}
            </button>
            {onSmelt && canSmelt(c, selItem.id) && (
              <button className="btn" onClick={() => onSmelt(selItem.id)}>
                Luyện hóa · +{smeltValue(selItem.id)} tinh hoa
              </button>
            )}
          </div>
          {selItem.slot === 'vu_khi' && isOn(selItem.id) && onForge && (
            <div className="forge-box">
              <div className="forge-row">
                <span>
                  <b>Rèn {lv}/{FORGE_MAX}</b>
                  <small>mỗi cấp công +{Math.round(FORGE_PER * 100)}%</small>
                </span>
                <span className="forge-pips" aria-hidden="true">
                  {Array.from({ length: FORGE_MAX }, (_, i) => (
                    <i key={i} className={i < lv ? 'on' : ''} />
                  ))}
                </span>
                {lv < FORGE_MAX && (
                  <button className="btn btn-red" disabled={(c.tinhHoa ?? 0) < FORGE_COST[lv]} onClick={onForge}>
                    +1 · {FORGE_COST[lv]}
                    {FORGE_CHANCE[lv] < 1 ? ` · ${Math.round(FORGE_CHANCE[lv] * 100)}%` : ''}
                  </button>
                )}
              </div>
              <small className="note">Ấn ngũ hành, cấp ấn không vượt cấp rèn:</small>
              {SEALS.map((s) => {
                const sl = sealLv(c, s.el);
                const can = sl < FORGE_MAX && sl < lv && (c.tinhHoa ?? 0) >= SEAL_COST[sl];
                return (
                  <div key={s.el} className={`forge-row seal s-${s.el}`}>
                    <span>
                      <b>
                        Ấn {s.name} {sl}/{FORGE_MAX}
                      </b>
                      <small>{s.per} mỗi cấp</small>
                    </span>
                    <span className="forge-pips" aria-hidden="true">
                      {Array.from({ length: FORGE_MAX }, (_, i) => (
                        <i key={i} className={i < sl ? 'on' : ''} />
                      ))}
                    </span>
                    {sl < FORGE_MAX && onSeal && (
                      <button className="btn" disabled={!can} onClick={() => onSeal(s.el)}>
                        +1 · {SEAL_COST[sl]}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
      {selPill && (
        <section className="inv-detail">
          <div className="inv-d-head">
            <span className="inv-cell pill">
              <ItemIcon pill={selPill.id} />
            </span>
            <span>
              <b>
                {selPill.name} x{c.pills[selPill.id]}
              </b>
              <small>Đan dược</small>
            </span>
          </div>
          <p className="inv-desc">{selPill.desc}</p>
          <div className="inv-acts">
            <button className="btn btn-red" onClick={() => onUsePill(selPill.id)}>
              Uống
            </button>
          </div>
        </section>
      )}
      {!selItem && !selPill && <p className="note inv-hint">Chạm vào một món để xem và dùng. Đồ thừa luyện hóa ra tinh hoa để rèn và khắc ấn cho vũ khí.</p>}
    </div>
  );
}
