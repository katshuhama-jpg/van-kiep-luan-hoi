'use client';

import { useEffect, useState } from 'react';
import ItemIcon from './ItemIcon';
import Sprite from './Sprite';
import { ITEMS, PILLS, fxText as fxTextData, gearFx, type Item } from '@/lib/game/data';
import { playerStats } from '@/lib/game/combat';
import { FORGE_COST, FORGE_MAX, canSmelt, elFx, forgeLevel, itemEl, sellValue, smeltValue, type ForgeResult } from '@/lib/game/forge';
import ForgeScene from './ForgeScene';
import type { Character, Slot } from '@/lib/game/types';
import { tr } from '@/lib/i18n';

const RARE_SHORT = [tr('Thường', 'Com'), tr('Tốt', 'Fine'), tr('Hiếm', 'Rare'), tr('Cực', 'Supr')];
const RARE_TXT = [tr('Thường', "Common"), tr('Tốt', "Fine"), tr('Hiếm', "Rare"), tr('Cực phẩm', "Supreme")];
const SLOT_NAME: Record<Slot, string> = { ao: tr('Áo', "Robe"), vu_khi: tr('Vũ khí', "Weapon"), phu_kien: tr('Phụ kiện', "Accessory") };
type Kind = 'all' | Slot | 'dan';
const GROUPS: [Kind, string][] = [
  ['vu_khi', tr('Vũ khí', 'Weapons')],
  ['ao', tr('Áo', 'Robes')],
  ['phu_kien', tr('Phụ kiện', 'Accessories')],
  ['dan', tr('Đan dược', 'Pills')],
];

const KINDS: [Kind, string][] = [
  ['all', tr('Tất cả', "All")],
  ['vu_khi', tr('Vũ khí', "Weapon")],
  ['ao', tr('Áo', "Robe")],
  ['phu_kien', tr('Phụ kiện', "Accessory")],
  ['dan', tr('Đan', "Pills")],
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
 * Chạm một ô để xem chi tiết và thao tác: dùng, bán, phân giải, mở lò rèn.
 */
export default function BagDoll({ c, onEquip, onUsePill, onSmelt, onSell, onForge, onBuy }: { c: Character; onEquip: (id: string) => void; onUsePill: (id: string) => void; onSmelt?: (id: string) => void; onSell?: (id: string) => void; onForge?: () => ForgeResult | null; onBuy?: (n: number) => void }) {
  const [forging, setForging] = useState(false);
  const [kind, setKind] = useState<Kind>(() => (readPref('vkl.bagKind') as Kind) || 'all');
  useEffect(() => writePref('vkl.bagKind', kind), [kind]);
  const [sel, setSel] = useState<Sel>(null);
  const [forgeMsg, setForgeMsg] = useState(false);
  const owned = ITEMS.filter((i) => c.inventory.includes(i.id)).sort((a, b) => c.inventory.lastIndexOf(b.id) - c.inventory.lastIndexOf(a.id));
  const pills = PILLS.filter((p) => (c.pills[p.id] ?? 0) > 0);
  const shownItems = kind === 'dan' ? [] : kind === 'all' ? owned : owned.filter((i) => i.slot === kind);
  const shownPills = kind === 'all' || kind === 'dan' ? pills : [];
  const st = playerStats(c);
  const g = gearFx(c.equipped);
  const lv = forgeLevel(c);
  const isOn = (id: string) => Object.values(c.equipped).includes(id);
  // đồ thừa: không mặc, không phải thần binh, phẩm không hơn món đang mặc cùng ô
  // món kém hơn món đang mặc: phẩm thấp hơn, hoặc cùng phẩm mà giá thấp hơn hay bằng
  const isSpare = (it: Item) => {
    const onId = c.equipped[it.slot];
    const on = onId ? ITEMS.find((i) => i.id === onId) : null;
    if (!on || !canSmelt(c, it.id)) return false;
    const r = it.rare ?? 0;
    const ro = on.rare ?? 0;
    return r < ro || (r === ro && it.price <= on.price);
  };
  const spares = owned.filter(isSpare);
  const [sure, setSure] = useState(false);
  useEffect(() => setSure(false), [spares.length]);
  const sellSpares = () => {
    if (!onSell) return;
    if (!sure) return setSure(true);
    spares.forEach((it) => onSell(it.id));
    setSure(false);
  };
  // sắp xếp: đang mặc trước, rồi phẩm cao trước, đồ thừa xuống cuối
  const order = (a: Item, b: Item) => Number(isOn(b.id)) - Number(isOn(a.id)) || Number(isSpare(a)) - Number(isSpare(b)) || (b.rare ?? 0) - (a.rare ?? 0);
  const selItem = sel && 'item' in sel ? ITEMS.find((i) => i.id === sel.item) : null;
  const selPill = sel && 'pill' in sel ? PILLS.find((p) => p.id === sel.pill) : null;
  // món đang chọn bị bán hay phân giải thì bỏ chọn
  useEffect(() => {
    if (sel && 'item' in sel && !c.inventory.includes(sel.item)) setSel(null);
    if (sel && 'pill' in sel && !(c.pills[sel.pill] > 0)) setSel(null);
  });

  const slotBox = (s: Slot) => {
    const id = c.equipped[s];
    const it = id ? ITEMS.find((i) => i.id === id) : null;
    const on = !!it && selItem?.id === it.id;
    return (
      <button type="button" className={`doll-slot r${it?.rare ?? 0} ${on ? 'sel' : ''} ${it ? '' : 'empty'}`} onClick={() => it && setSel({ item: it.id })} aria-label={it ? `${SLOT_NAME[s]}: ${it.name}` : tr(`${SLOT_NAME[s]} trống`, `${SLOT_NAME[s]} empty`)}>
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
            <dt>{tr("Công", "Attack")}</dt>
            <dd>{st.atk}</dd>
            <dt>{tr("Thủ", "Defense")}</dt>
            <dd>{st.def}</dd>
            <dt>{tr("Sinh lực", "HP")}</dt>
            <dd>{st.hp}</dd>
          </dl>
        </div>
      </div>
      <div className="doll-bar">
        <span>{fxTextData(g) || tr('Trang bị chưa có chỉ số', "No equipment stats yet")}</span>
        <button
          type="button"
          className="doll-forge"
          onClick={() => {
            if (c.equipped.vu_khi && onForge) setForging(true);
            else {
              setForgeMsg(true);
              if (owned.some((i) => i.slot === 'vu_khi')) setKind('vu_khi');
            }
          }}
        >
          {tr('⚒ Lò rèn', '⚒ Forge')}
          {c.equipped.vu_khi ? ` +${lv}` : ''}
          <small>{tr(`tinh thiết ${c.tinhHoa ?? 0}`, `iron ${c.tinhHoa ?? 0}`)}</small>
        </button>
      </div>

      {forgeMsg && !c.equipped.vu_khi && (
        <p className="note forge-msg" onClick={() => setForgeMsg(false)}>
          {owned.some((i) => i.slot === 'vu_khi')
            ? tr('Lò rèn nâng vũ khí đang cầm. Chạm một vũ khí trong nhóm Vũ khí bên dưới rồi bấm "Cầm lên và rèn".', 'The forge upgrades the weapon you hold. Tap a weapon in the Weapons group below, then "Wield and forge".')
            : tr('Lò rèn nâng vũ khí đang cầm. Túi chưa có vũ khí nào: mua ở Phường thị, hoặc diệt yêu thú để rơi đồ.', 'The forge upgrades the weapon you hold. You have no weapon yet: buy one at the Market, or hunt monsters for drops.')}
        </p>
      )}
      <div className="inv-kinds" role="tablist" aria-label={tr("Loại đồ", "Item type")}>
        {KINDS.map(([k, n]) => (
          <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
            {n}
          </button>
        ))}
      </div>
      {onSell && spares.length > 0 && kind !== 'dan' && (
        <button className={`btn inv-clean ${sure ? 'btn-red' : ''}`} onClick={sellSpares}>
          {sure
            ? tr(`Chắc chưa? Bấm lần nữa để bán ${spares.length} món`, `Sure? Tap again to sell ${spares.length} items`)
            : tr(`Bán ${spares.length} món thừa · +${spares.reduce((x, it) => x + sellValue(it.id), 0)} linh thạch`, `Sell ${spares.length} spare items · +${spares.reduce((x, it) => x + sellValue(it.id), 0)} spirit stones`)}
        </button>
      )}
      {(kind === 'all' ? GROUPS : [[kind, '']] as [Kind, string][]).map(([g, label]) => {
        const items = kind === 'dan' || g === 'dan' ? [] : shownItems.filter((i) => i.slot === g).sort(order);
        const ps = g === 'dan' || kind === 'dan' ? shownPills : [];
        if (kind === 'all' && !items.length && !ps.length) return null;
        const n = items.length + ps.length;
        return (
          <div key={g}>
            {kind === 'all' && (
              <h4 className="inv-group">
                {label} <small>{n}</small>
              </h4>
            )}
            <div className="inv-grid">
              {items.map((it) => (
                <button key={it.id} type="button" className={`inv-cell r${it.rare ?? 0} ${selItem?.id === it.id ? 'sel' : ''} ${isSpare(it) ? 'spare' : ''}`} onClick={() => setSel({ item: it.id })} aria-label={it.name}>
                  <ItemIcon item={it} />
                  {isOn(it.id) ? <i className="inv-on">{tr('Mặc', 'Wear')}</i> : isSpare(it) ? <i className="inv-spare">{tr('Thừa', 'Spare')}</i> : null}
                  <i className={`inv-rare r${it.rare ?? 0}`}>{RARE_SHORT[it.rare ?? 0]}{it.slot === 'vu_khi' && isOn(it.id) && lv > 0 ? ` +${lv}` : ''}</i>
                </button>
              ))}
              {ps.map((p) => (
                <button key={p.id} type="button" className={`inv-cell pill ${selPill?.id === p.id ? 'sel' : ''}`} onClick={() => setSel({ pill: p.id })} aria-label={p.name}>
                  <ItemIcon pill={p.id} />
                  <i className="inv-n">{c.pills[p.id]}</i>
                </button>
              ))}
              {kind !== 'all' && Array.from({ length: Math.max(0, 5 - n) }, (_, i) => <span key={`e${i}`} className="inv-cell empty" aria-hidden="true" />)}
            </div>
          </div>
        );
      })}
      {kind === 'all' && !owned.length && !pills.length && <p className="note">{tr('Túi trống.', 'Your bag is empty.')}</p>}

      {(selItem || selPill) && <div className="inv-pop-back" onClick={() => setSel(null)} aria-hidden="true" />}
      {selItem && (
        <section className="inv-detail inv-pop" role="dialog" aria-label={selItem.name}>
          <button type="button" className="inv-pop-x" onClick={() => setSel(null)} aria-label={tr('Đóng', 'Close')}>
            ✕
          </button>
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
                {SLOT_NAME[selItem.slot]} · {RARE_TXT[selItem.rare ?? 0]} · <span className={`el-tag e-${itemEl(c, selItem.id)}`}>{tr("Hệ ", "Element: ")}{elFx(itemEl(c, selItem.id)).name}</span>
                {selItem.fx ? ` · ${fxText(selItem.fx)}` : ''}
              </small>
            </span>
          </div>
          <p className="inv-desc">{selItem.desc}</p>
          <div className="inv-acts">
            <button className={`btn ${isOn(selItem.id) ? 'btn-jade' : 'btn-red'}`} onClick={() => onEquip(selItem.id)}>
              {isOn(selItem.id) ? tr('Đang dùng', "Equipped") : tr('Dùng', "Use")}
            </button>
            {onSell && canSmelt(c, selItem.id) && (
              <button className="btn" onClick={() => onSell(selItem.id)}>
                
                {tr("Bán · +", "Sell · +")}{sellValue(selItem.id)}{tr(" linh thạch", " spirit stones")}
              </button>
            )}
            {onSmelt && canSmelt(c, selItem.id) && (
              <button className="btn" onClick={() => onSmelt(selItem.id)}>
                
                {tr("Phân giải · +", "Dismantle · +")}{smeltValue(selItem.id)}{tr(" tinh thiết", " refined iron")}
              </button>
            )}
          </div>
          {selItem.slot === 'vu_khi' && !isOn(selItem.id) && onForge && (
            <button
              className="btn btn-red btn-big forge-open"
              onClick={() => {
                onEquip(selItem.id);
                setSel(null);
                setForging(true);
              }}
            >
              {tr('⚒ Cầm lên và rèn', '⚒ Wield and forge')}
              <small>{tr(`rèn +1 tốn ${FORGE_COST[0]} tinh thiết · đang có ${c.tinhHoa ?? 0}`, `+1 costs ${FORGE_COST[0]} iron · you have ${c.tinhHoa ?? 0}`)}</small>
            </button>
          )}
          {selItem.slot !== 'vu_khi' && <p className="note forge-note">{tr('Lò rèn chỉ rèn vũ khí. Chọn một vũ khí trong túi để rèn.', 'The forge only works on weapons. Pick a weapon in your bag to forge.')}</p>}
          {selItem.slot === 'vu_khi' && isOn(selItem.id) && onForge && (
            <button className="btn btn-red btn-big forge-open" onClick={() => setForging(true)}>
              
              {tr("⚒ Mở lò rèn", "⚒ Open the forge")}
              <small>{lv >= FORGE_MAX ? tr(`đã +${FORGE_MAX}`, `maxed +${FORGE_MAX}`) : tr(`đang +${lv} · tinh thiết ${c.tinhHoa ?? 0}`, `now +${lv} · refined iron ${c.tinhHoa ?? 0}`)}</small>
            </button>
          )}
        </section>
      )}
      {selPill && (
        <section className="inv-detail inv-pop" role="dialog" aria-label={selPill.name}>
          <button type="button" className="inv-pop-x" onClick={() => setSel(null)} aria-label={tr('Đóng', 'Close')}>
            ✕
          </button>
          <div className="inv-d-head">
            <span className="inv-cell pill">
              <ItemIcon pill={selPill.id} />
            </span>
            <span>
              <b>
                {selPill.name} x{c.pills[selPill.id]}
              </b>
              <small>{tr("Đan dược", "Pills")}</small>
            </span>
          </div>
          <p className="inv-desc">{selPill.desc}</p>
          <div className="inv-acts">
            <button className="btn btn-red" onClick={() => onUsePill(selPill.id)}>
              
              {tr("Uống", "Take")}
            </button>
          </div>
        </section>
      )}
      {forging && onForge && <ForgeScene c={c} onForge={onForge} onBuy={onBuy} onClose={() => setForging(false)} />}
      {!selItem && !selPill && <p className="note inv-hint">{tr("Chạm vào một món để xem và dùng. Mỗi món mang một hệ ngũ hành. Đồ thừa đem bán lấy linh thạch hoặc phân giải ra tinh thiết để rèn vũ khí.", "Tap an item to inspect and use it. Every item carries one of the Five Elements. Sell spares for spirit stones or dismantle them into refined iron for forging weapons.")}</p>}
    </div>
  );
}
