'use client';
/**
 * 4.2.0 Tàng Kinh Các: vòng chiêu quanh người đang tọa thiền (kiểu Mộng Ảo Tu Tiên), danh sách công pháp để nâng tầng,
 * mang/tháo, dung hợp ra tuyệt kỹ, sổ công pháp và chọn bộ truyền thừa cho kiếp sau.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Character } from '@/lib/game/types';
import { CP, FUSE_CHANCE, FUSE_COST, FUSE_TANG, GAUGE_NAME, PATH_IDEA, PHAM_NAME, SLOT_REALM, SWAP_RATE, TAM_GAP, BIEN_DESC, BIEN_NAME, BIEN_TANG, tuviCost, canFuse, canSwap, capOf, cpOf, cpOfPath, heirChoices, owned, slotOpen, tamTang, tangMul, tqCost, tqOf, tuyetOf, upgradeBlock, vanNeed, type Bien, type CpDef } from '@/lib/game/congPhap';
import { PATHS, REALMS } from '@/lib/game/data';
import { tr } from '@/lib/i18n';
import Sprite from './Sprite';
import { PixelFx, fxBatQuai, fxSen } from './PixelFx';
import { orbSpec } from './CpFx';

const PHAM_CLS = ['p0', 'p1', 'p2', 'p3'];
const realmShort = (r: number) => REALMS[r]?.name ?? '';

function Orb({ d, size, dark, lock }: { d: CpDef | null; size: number; dark?: boolean; lock?: string }) {
  if (!d)
    return (
      <span className="tk-orb lock" style={{ width: size, height: size }}>
        <span className="tk-orb-in">
          <small>{tr('Mở khi', 'Opens at')}</small>
          <b>{lock}</b>
        </span>
      </span>
    );
  const sp = orbSpec(d.id, d.fx, d.path, d.kind);
  const k = (size * 0.78) / Math.max(sp.w, sp.h);
  return (
    <span className={`tk-orb ${PHAM_CLS[d.pham]} ${dark ? 'dark' : ''}`} style={{ width: size, height: size }}>
      <span className="tk-orb-in">
        <PixelFx spec={sp} scale={k} dur={0.6} />
      </span>
    </span>
  );
}

const short = (n: string) => n.replace(/ (Kiếm )?(Quyết|Pháp|Tâm Quyết|Ma Công|Thuật)$/, '');

export interface TangKinhProps {
  c: Character;
  onClose: () => void;
  onEquip: (id: string, slot?: number) => void;
  onUnequip: (id: string) => void;
  onUpgrade: (id: string, useVan?: boolean, bien?: Bien) => void;
  onSwap: (from: string, to: string) => void;
  onFuse: () => { ok: boolean; text: string } | null;
  onHeir: (id: string) => void;
  book: string[];
}

export function TangKinhCac({ c, onClose, onEquip, onUnequip, onUpgrade, onSwap, onFuse, onHeir, book }: TangKinhProps) {
  const [tab, setTab] = useState<'luyen' | 'dung' | 'so'>('luyen');
  const [fuseSt, setFuseSt] = useState<'idle' | 'fuse' | { ok: boolean; text: string }>('idle');
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  const path = c.path ?? 'chung';
  const s = c.cp ?? { own: [], eq: [] };
  const eq = s.eq;
  // công pháp hiện ra trong danh sách: đã có + của đạo mình (chưa có thì tối) + chung
  const list = CP.filter((d) => d.kind !== 'tuyet' || owned(c, d.id)).filter((d) => owned(c, d.id) || d.path === path || d.path === 'chung');
  list.sort(
    (a, b) =>
      Number(!!owned(c, b.id)) - Number(!!owned(c, a.id)) || Number(b.path === path) - Number(a.path === path) || ['tuyet', 'tam', 'chieu'].indexOf(a.kind) - ['tuyet', 'tam', 'chieu'].indexOf(b.kind),
  );
  const [sel, setSel] = useState<string>(eq[1] || eq[0] || list[0]?.id || '');
  // 4/11 (Tyler: bấm Mang tự tháo chiêu khác, khó hiểu): ô đầy thì hỏi thay ô nào, mang xong báo rõ vào ô nào
  const [pick, setPick] = useState<string | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [want, setWant] = useState<number | null>(null); // bấm ô chiêu trống trên vòng: chiêu mang tiếp sẽ vào đúng ô đó
  const goRow = (id: string) => {
    setTab('luyen');
    setTimeout(() => document.getElementById(`tk-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
  };
  const moveSlots = [1, 2, 3].filter((k) => slotOpen(c, k));
  const slotName = (k: number) => (k === 0 ? tr('Tâm pháp', 'Heart art') : tr(`Chiêu ${k}`, `Move ${k}`));
  const wear = (d: CpDef) => {
    setSel(d.id);
    if (d.kind === 'tam') {
      const old = eq[0] ? cpOf(eq[0]) : undefined;
      onEquip(d.id);
      setSaid(old ? tr(`Đã đổi tâm pháp: ${short(old.name)} → ${short(d.name)}`, `Heart art changed: ${short(old.name)} → ${short(d.name)}`) : tr(`Đã mang ${short(d.name)}`, `Equipped ${short(d.name)}`));
      return;
    }
    if (want !== null && slotOpen(c, want)) {
      const k = want;
      setWant(null);
      setPick(d.id);
      return replaceAtFor(d, k);
    }
    const free = moveSlots.find((k) => !eq[k]);
    if (free === undefined) {
      setPick(d.id);
      setSaid(null);
      return;
    }
    onEquip(d.id, free);
    setPick(null);
    setSaid(tr(`Đã mang ${short(d.name)} vào ô ${slotName(free)}`, `Equipped ${short(d.name)} in ${slotName(free)}`));
  };
  const replaceAt = (k: number) => {
    const d = pick ? cpOf(pick) : undefined;
    if (d) replaceAtFor(d, k);
  };
  function replaceAtFor(d: CpDef, k: number) {
    const old = eq[k] ? cpOf(eq[k]) : undefined;
    onEquip(d.id, k);
    setPick(null);
    setSaid(old ? tr(`Đã thay ${short(old.name)} bằng ${short(d.name)} ở ô ${slotName(k)}`, `Replaced ${short(old.name)} with ${short(d.name)} in ${slotName(k)}`) : tr(`Đã mang ${short(d.name)} vào ô ${slotName(k)}`, `Equipped ${short(d.name)} in ${slotName(k)}`));
  }
  // nhóm danh sách: đang mang (theo thứ tự ô) / đã có / chưa có
  const isOn = (id: string) => eq.includes(id) || s.tuyet === id;
  const groups: { k: string; title: string; items: CpDef[] }[] = [
    { k: 'on', title: tr('Đang mang', 'Equipped'), items: [...[s.tuyet, ...eq].filter((x): x is string => !!x).map((x) => cpOf(x)).filter((x): x is CpDef => !!x)] },
    { k: 'own', title: tr('Đã có, chưa mang', 'Owned, not equipped'), items: list.filter((d) => owned(c, d.id) && !isOn(d.id)) },
    { k: 'lock', title: tr('Chưa có', 'Not yet learned'), items: list.filter((d) => !owned(c, d.id)) },
  ];
  const tu = tuyetOf(c);
  const tuOwned = s.tuyet ? cpOf(s.tuyet) : undefined;
  const seats: {
    label: string;
    id?: string;
    lock?: string;
    x: number;
    y: number;
  }[] = [
    { label: tr('Tâm pháp', 'Heart art'), id: eq[0], x: 50, y: 26 },
    { label: tr('Chiêu 1', 'Move 1'), id: eq[1] || undefined, x: 15, y: 62 },
    {
      label: tr('Chiêu 2', 'Move 2'),
      id: slotOpen(c, 2) ? eq[2] || undefined : undefined,
      lock: slotOpen(c, 2) ? undefined : realmShort(SLOT_REALM[2]),
      x: 85,
      y: 62,
    },
    {
      label: tr('Chiêu 3', 'Move 3'),
      id: slotOpen(c, 3) ? eq[3] || undefined : undefined,
      lock: slotOpen(c, 3) ? undefined : realmShort(SLOT_REALM[3]),
      x: 13,
      y: 168,
    },
    {
      label: tr('Tuyệt kỹ', 'Ultimate'),
      id: tuOwned?.id,
      lock: tuOwned ? undefined : tr('Dung hợp', 'Fusion'),
      x: 87,
      y: 168,
    },
  ];
  const cdText = (d: CpDef) =>
    d.kind === 'tam' ? tr('Bị động', 'Passive') : d.kind === 'tuyet' ? tr(`${GAUGE_NAME[d.path]} đầy`, `${GAUGE_NAME[d.path]} full`) : tr(`Hồi ${d.cd ?? 3} lượt`, `${d.cd ?? 3}-turn cooldown`);
  const unlockText = (d: CpDef) => {
    const i = cpOfPath(d.path)
      .filter((x) => x.kind === 'chieu')
      .indexOf(d);
    if (d.kind === 'tam') return tr('Có khi nhập đạo', 'Granted on entering the path');
    if (d.path === 'chung') return tr(`Có khi vào ${realmShort(1)}`, `Granted at ${realmShort(1)}`);
    return i <= 0
      ? tr('Có khi nhập đạo', 'Granted on entering the path')
      : i === 1
        ? tr(`Có khi vào ${realmShort(2)}`, `Granted at ${realmShort(2)}`)
        : tr(`Có khi vào ${realmShort(4)}`, `Granted at ${realmShort(4)}`);
  };
  const nine = c.path ? cpOfPath(c.path).filter((x) => x.kind === 'chieu' && (owned(c, x.id)?.tang ?? 0) >= 9) : [];
  const heirs = heirChoices(c);
  const heir = heirs.find((d) => d.id === c.cpHeirPick) ?? heirs[0];
  const seen = new Set([...book, ...s.own.map((o) => o.id)]);
  return (
    <div className="forge-wrap tk-wrap" role="dialog" aria-modal="true" aria-label={tr('Tàng Kinh Các', 'Scripture Pavilion')}>
      <div className="forge-scene">
        <div className="fs-head">
          <b>{tr('Tàng Kinh Các', 'Scripture Pavilion')}</b>
          <span className="fs-tinh tk-tq" title={tr('Tàn quyển vạn năng: bù vào bộ nào cũng được', 'Universal fragments: fit any technique')}>
            <img src="/icons/g_kinh_thu_tan_quyen.png" width={20} height={20} alt="" className="px-icon" />
            {tr('Vạn năng', 'Universal')} {c.tqVan ?? 0}
          </span>
          <button className="ss-x" onClick={onClose} aria-label={tr('Đóng', 'Close')}>
            ✕
          </button>
        </div>
        <div
          className="tk-stage"
          style={{
            backgroundImage: `url(/bg/tu_luyen-${Math.min(3, Math.max(0, Math.floor(c.realm / 2)))}.png)`,
          }}
        >
          <span className="tk-title">{c.path ? PATHS[c.path].name : tr('Chưa nhập đạo', 'No path yet')}</span>
          <div className="tk-floor">
            <PixelFx spec={fxBatQuai(c.path ? PATHS[c.path].aura : '#9ff0c8')} scale={3} dur={2.4} />
          </div>
          <div className="tk-me">
            <Sprite c={c} size={132} anim="spellcast" dir={2} />
          </div>
          <div className="tk-sen">
            <PixelFx spec={fxSen()} scale={3} dur={1} />
          </div>
          <span className="tk-qi" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <i
                key={i}
                style={
                  {
                    left: `${38 + i * 5}%`,
                    animationDelay: `${i * 0.4}s`,
                    background: c.path ? PATHS[c.path].aura : undefined,
                  } as CSSProperties
                }
              />
            ))}
          </span>
          {seats.map((st, i) => {
            const d = st.id ? (cpOf(st.id) ?? null) : null;
            return (
              <button
                key={i}
                className={`tk-seat ${d && sel === d.id ? 'sel' : ''} ${(pick || want === i) && i >= 1 && i <= 3 && !st.lock ? 'pick' : ''}`}
                style={{ left: `${st.x}%`, top: st.y }}
                onClick={() => {
                  if (pick && i >= 1 && i <= 3 && !st.lock) return replaceAt(i);
                  if (d) {
                    setWant(null);
                    setSel(d.id);
                    return goRow(d.id);
                  }
                  if (i >= 1 && i <= 3 && !st.lock) {
                    setWant(i);
                    setTab('luyen');
                    setSaid(tr(`Ô ${slotName(i)} đang trống: bấm Mang ở một chiêu bên dưới để đưa vào ô này`, `${slotName(i)} is empty: tap Equip on a move below to put it here`));
                  }
                }}
                aria-label={d ? d.name : `${st.label}: ${st.lock ?? tr('trống', 'empty')}`}
              >
                <Orb d={d} size={54} lock={st.lock ?? tr('Trống', 'Empty')} />
                <small>{d ? short(d.name) : st.label}</small>
              </button>
            );
          })}
        </div>
        <div className="fs-info">
          <p className="tk-hint">{tr('Vòng trên là 5 ô công pháp đang mang, dùng khi giao đấu. Danh sách dưới là mọi bộ bạn có: bấm Mang để đưa vào ô, bấm một ô trên vòng để xem bộ đó.', 'The ring shows your 5 equipped slots, used in fights. The list below has every technique: tap Equip to put one in a slot, tap a slot to see its technique.')}</p>
          <div className="tk-idea">
            <b>
              {c.path ? PATHS[c.path].name : tr('Quyền cước', 'Fists')} · {tr('thanh', 'gauge')} <i>{GAUGE_NAME[path]}</i>
            </b>
            <span>{PATH_IDEA[path]}</span>
            {tu && <small>{tr(`Tuyệt kỹ: ${tu.name}`, `Ultimate: ${tu.name}`)}</small>}
          </div>
          <div className="chips">
            <button className={`chip-btn ${tab === 'luyen' ? 'on' : ''}`} onClick={() => setTab('luyen')}>
              {tr('Công pháp', 'Techniques')}
            </button>
            <button className={`chip-btn ${tab === 'dung' ? 'on' : ''}`} onClick={() => setTab('dung')}>
              {tr('Dung hợp', 'Fusion')}
            </button>
            <button className={`chip-btn ${tab === 'so' ? 'on' : ''}`} onClick={() => setTab('so')}>
              {tr('Sổ', 'Book')} {seen.size}/{CP.length}
            </button>
          </div>

          {tab === 'luyen' && (
            <div className="tk-list">
              {said && (
                <button className="tk-said" onClick={() => setSaid(null)}>
                  {said}
                </button>
              )}
              {groups.map((g) =>
                g.items.length === 0 ? null : (
                  <div key={g.k} className="tk-group">
                    <span className={`tk-gh ${g.k}`}>
                      {g.title} <i>{g.items.length}</i>
                    </span>
              {g.items.map((d) => {
                const o = owned(c, d.id);
                const on = eq.includes(d.id) || s.tuyet === d.id;
                const van = vanNeed(c, d.id);
                const blk = upgradeBlock(c, d.id, van > 0);
                const tv = o && o.tang >= 3 && o.tang < 9 ? tuviCost(c, d.id) : 0;
                const cost = o ? tqCost(o.tang) : 0;
                const held = tqOf(c, d.id);
                const swapTo = sel === d.id && held >= SWAP_RATE ? list.filter((x) => canSwap(c, d.id, x.id)) : [];
                return (
                  <div key={d.id} id={`tk-${d.id}`} className={`tk-cp ${PHAM_CLS[d.pham]} ${sel === d.id ? 'sel' : ''} ${o ? '' : 'lock'}`} onClick={() => setSel(d.id)}>
                    {on && <span className="tk-ribbon">{tr('Đang mang', 'Equipped')}</span>}
                    <Orb d={d} size={46} dark={!o} />
                    <span className="tk-cp-body">
                      <b className="tk-cp-name">
                        {d.name} <i className={`tk-pham ${PHAM_CLS[d.pham]}`}>{PHAM_NAME[d.pham]}</i>
                        {o && <em>{tr(`T${o.tang}`, `S${o.tang}`)}</em>}
                        {o?.bien && <i className={`tk-bien ${o.bien}`}>{BIEN_NAME[o.bien]}</i>}
                      </b>
                      <span className="tk-cp-desc">{d.main}</span>
                      {o && d.kind !== 'tam' && (
                        <span className="tk-cp-desc tk-pow">
                          {tr('Lực chiêu', 'Power')} {Math.round(tangMul(o.tang) * 100)}%{o.tang < 9 ? ` → ${Math.round(tangMul(o.tang + 1) * 100)}%` : ''}
                          {d.kind === 'chieu' && o.tang < 9 && ` · ${tr(`trần T${capOf(c, d.id)} (tâm pháp T${tamTang(c)} + ${TAM_GAP})`, `cap S${capOf(c, d.id)} (heart art S${tamTang(c)} + ${TAM_GAP})`)}`}
                        </span>
                      )}
                      {o && o.tang < 9 && (
                        <span className="tk-tang">
                          <span className="tk-tang-n">{tr('Thục luyện', 'Mastery')}</span>
                          <span className="tk-prog">
                            <span style={{ width: `${o.exp}%` }} />
                          </span>
                        </span>
                      )}
                      {!o && <span className="tk-cp-desc tk-how">{unlockText(d)}</span>}
                      {o && d.kind === 'chieu' && o.tang === BIEN_TANG - 1 && !o.bien && <span className="tk-cp-desc tk-how">{tr(`Lên T${BIEN_TANG} chọn biến chiêu, giữ cả kiếp: Cương đánh x1,3 nhưng chậm 1 lượt; Nhu nhanh 1 lượt, hiệu ứng đậm 30%.`, `Stage ${BIEN_TANG} locks a variant for this life: Hard hits x1.3 but 1 turn slower; Soft is 1 turn faster with 30% stronger effects.`)}</span>}
                      {swapTo.length > 0 && (
                        <span className="tk-swap">
                          <small>{tr(`Chép ${SWAP_RATE} quyển này thành 1 quyển:`, `Rework ${SWAP_RATE} of these into 1 of:`)}</small>
                          {swapTo.map((x) => (
                            <button
                              key={x.id}
                              className="chip-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSwap(d.id, x.id);
                              }}
                            >
                              {short(x.name)}
                            </button>
                          ))}
                        </span>
                      )}
                      {pick === d.id && (
                        <span className="tk-pick" onClick={(e) => e.stopPropagation()}>
                          <small>{tr('Các ô chiêu đã đầy. Chọn chiêu muốn thay:', 'All move slots are full. Pick one to replace:')}</small>
                          {moveSlots.map((k) => {
                            const x = eq[k] ? cpOf(eq[k]) : undefined;
                            return (
                              <button key={k} className="chip-btn" onClick={() => replaceAt(k)}>
                                {slotName(k)}: {x ? short(x.name) : tr('trống', 'empty')}
                              </button>
                            );
                          })}
                        </span>
                      )}
                    </span>
                    {o && (
                      <span className="tk-cp-side">
                        {(o.tang >= 2 || held > 0) && o.tang < 9 && (
                          <span className={`tk-cost ${cost && held >= cost ? 'ok' : ''}`} title={tr('Tàn quyển riêng của bộ này / cần cho tầng kế', 'Own fragments / needed for next stage')}>
                            <img src="/icons/g_kinh_thu_tan_quyen.png" width={18} height={18} alt={tr('Tàn quyển', 'Fragment')} className="px-icon" />
                            {cost ? `${held}/${cost}` : held}
                          </span>
                        )}
                        {blk === 'bien' ? (
                          (['cuong', 'nhu'] as Bien[]).map((b) => (
                            <button
                              key={b}
                              className={`tk-up tk-bien-btn ${b}`}
                              title={BIEN_DESC[b]}
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpgrade(d.id, van > 0, b);
                              }}
                            >
                              {tr(`Ngộ ${BIEN_NAME[b]}`, `${BIEN_NAME[b]}`)}
                            </button>
                          ))
                        ) : (
                          <button
                            className={`tk-up ${o.tang >= 9 ? 'max' : ''}`}
                            disabled={blk !== null}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpgrade(d.id, van > 0);
                            }}
                          >
                            {blk === 'max'
                              ? tr('Viên mãn', 'Perfected')
                              : blk === 'exp'
                                ? tr('Đang luyện', 'Training')
                                : blk === 'cap'
                                  ? tr('Luyện tâm pháp', 'Train heart art')
                                  : blk === 'tq'
                                    ? tr('Thiếu quyển', 'Need fragment')
                                    : blk === 'tuvi'
                                      ? tr('Thiếu tu vi', 'Need cultivation')
                                      : van
                                        ? tr(`+${van} vạn năng`, `+${van} universal`)
                                        : tr('Nâng tầng', 'Raise')}
                          </button>
                        )}
                        {tv > 0 && <small className={blk === 'tuvi' ? 'bad' : ''}>{tr(`-${tv} tu vi`, `-${tv} cultivation`)}</small>}
                        <small>{cdText(d)}</small>
                        {d.kind !== 'tuyet' && !(d.kind === 'tam' && on) && (
                          <button
                            className={`tk-eq ${pick === d.id ? 'on' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (pick === d.id) return setPick(null);
                              if (on) {
                                onUnequip(d.id);
                                setSaid(tr(`Đã tháo ${short(d.name)}`, `Removed ${short(d.name)}`));
                              } else wear(d);
                            }}
                          >
                            {pick === d.id ? tr('Hủy', 'Cancel') : on ? tr('Tháo', 'Remove') : d.kind === 'tam' ? tr('Đổi tâm pháp', 'Switch') : tr('Mang', 'Equip')}
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
                  </div>
                ),
              )}
              <p className="note">
                {tr(
                  'Đang mang thì thục luyện tự tăng mỗi năm và mỗi lần ra chiêu. Tầng 1-3 tự lên; từ tầng 4 cần tàn quyển riêng của bộ đó (1, 1, 2, 2, 3, 3 quyển) và hao một ít tu vi, chiêu không được cao hơn tâm pháp quá 2 tầng, lên tầng 6 phải chọn biến chiêu Cương hay Nhu. Quái hệ nào rơi tàn quyển bộ hệ đó, người cùng đạo rơi chiêu của đạo, bóng kiếp trước rơi bộ kiếp ấy từng luyện; bộ đang mang rơi nhiều hơn. Rơi lệch thì chép 3 quyển thành 1 quyển bộ khác cùng đạo.',
                  'Equipped techniques gain mastery every year and every time they are used. Stages 1-3 rise on their own; from stage 4 each technique needs its own fragments (1, 1, 2, 2, 3, 3) and some cultivation, stage 6 asks you to pick a Hard or Soft variant, and a move cannot be more than 2 stages above your heart art. Demons drop fragments of their element, same-path cultivators drop their path, past-life shadows drop what that life trained; equipped techniques drop more often. Unlucky drops can be reworked 3-for-1 into another technique of the same path.',
                )}
              </p>
            </div>
          )}

          {tab === 'dung' && (
            <>
              {!c.path ? (
                <p className="note">{tr('Chưa nhập đạo thì chưa có tuyệt kỹ để lĩnh ngộ.', 'Without a path there is no ultimate to comprehend.')}</p>
              ) : tuOwned ? (
                <>
                  {typeof fuseSt === 'object' && fuseSt.ok && <p className="fs-res ok">{fuseSt.text}</p>}
                  <div className="tk-heir">
                    <Orb d={tuOwned} size={52} />
                    <div>
                      <small>{tr('Đã lĩnh ngộ', 'Comprehended')}</small>
                      <b>{tuOwned.name}</b>
                      <span>{tuOwned.main}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={`tk-fuse ${typeof fuseSt === 'object' ? (fuseSt.ok ? 'ok' : 'fail') : fuseSt}`} style={{ backgroundImage: 'url(/bg/luyen_dan-2.png)' }}>
                    {cpOfPath(c.path)
                      .filter((x) => x.kind === 'chieu')
                      .sort((a, b) => (owned(c, b.id)?.tang ?? 0) - (owned(c, a.id)?.tang ?? 0))
                      .slice(0, 2)
                      .map((x, i) => (
                        <span key={x.id} className="tk-fuse-in">
                          {i > 0 && <i className="tk-fuse-x">+</i>}
                          <Orb d={x} size={52} dark={(owned(c, x.id)?.tang ?? 0) < 9} />
                          <small>
                            {short(x.name)} · {owned(c, x.id)?.tang ?? 0}/9
                          </small>
                        </span>
                      ))}
                    {fuseSt === 'fuse' && (
                      <span className="mg-smoke tk-smoke" aria-hidden="true">
                        {Array.from({ length: 6 }, (_, i) => (
                          <i key={i} style={{ ['--i' as string]: i } as CSSProperties} />
                        ))}
                      </span>
                    )}
                    {typeof fuseSt === 'object' && <span className={`fs-stamp ${fuseSt.ok ? 'ok' : 'fail'}`}>{fuseSt.ok ? tr('Lĩnh ngộ!', 'Comprehended!') : tr('Tan rồi', 'Scattered')}</span>}
                  </div>
                  {typeof fuseSt === 'object' && <p className={`fs-res ${fuseSt.ok ? 'ok' : 'fail'}`}>{fuseSt.text}</p>}
                  <dl className="fs-odds">
                    <dt>{tr('Cần', 'Needs')}</dt>
                    <dd className={nine.length >= 2 ? '' : 'bad'}>{tr(`2 chiêu của đạo đạt tầng 9 (có ${nine.length})`, `2 path moves at stage 9 (you have ${nine.length})`)}</dd>
                    <dt>{tr('Tốn', 'Cost')}</dt>
                    <dd className={tu && tqOf(c, tu.id) >= FUSE_COST ? '' : 'bad'}>
                      {tr(`${FUSE_COST} tàn quyển ${tu?.name ?? ''} (có ${tu ? tqOf(c, tu.id) : 0})`, `${FUSE_COST} ${tu?.name ?? ''} fragments (you have ${tu ? tqOf(c, tu.id) : 0})`)}
                      <small className="fs-where">
                        {tr('Có 2 chiêu tầng 9 thì tàn quyển tuyệt kỹ mới xuất hiện: rơi khi thắng quái tự lao ra chặn đường, người giang hồ hoặc bóng kiếp trước, và bán ở Phường thị (thẻ Tàn quyển). Trừ yêu thường không rơi.', 'Ultimate fragments only appear once you have 2 moves at stage 9: they drop when you beat a monster that ambushes you on the road, a jianghu wanderer or a past-life shadow, and are sold at the market (Fragments tab). Regular demon hunting never drops them.')}
                      </small>
                    </dd>
                    <dt>{tr('Thành', 'Success')}</dt>
                    <dd>{Math.round(FUSE_CHANCE * 100)}%</dd>
                    <dt>{tr('Hỏng', 'Failure')}</dt>
                    <dd>{tr('mất tàn quyển, hai chiêu giữ nguyên', 'fragments lost, both moves kept')}</dd>
                    <dt>{tr('Ra', 'Result')}</dt>
                    <dd>{tu ? tr(`${tu.name} tầng ${FUSE_TANG}, luôn mạnh hơn bộc phát`, `${tu.name} at stage ${FUSE_TANG}, always stronger than a burst`) : '???'}</dd>
                  </dl>
                  <button
                    className="btn btn-red btn-big"
                    disabled={!canFuse(c) || fuseSt === 'fuse'}
                    onClick={() => {
                      setFuseSt('fuse');
                      t.current = setTimeout(() => setFuseSt(onFuse() ?? 'idle'), 1400);
                    }}
                  >
                    {fuseSt === 'fuse' ? tr('Đang dung hợp...', 'Fusing...') : tr('☯ Dung hợp', '☯ Fuse')}
                  </button>
                </>
              )}
              <p className="note">
                {tr(
                  'Tuyệt kỹ tự ra khi thanh của đạo đầy. Chưa có tuyệt kỹ thì thanh đầy sẽ bộc phát chiêu mạnh nhất.',
                  'The ultimate fires on its own when your path gauge is full. Without one, a full gauge bursts your strongest move.',
                )}
              </p>
            </>
          )}

          {tab === 'so' && (
            <>
              {heir ? (
                <>
                  <div className="tk-heir">
                    <Orb d={heir} size={48} />
                    <div>
                      <small>{tr('Truyền thừa kiếp sau', 'Inheritance for next life')}</small>
                      <b>{heir.name}</b>
                      <span>{tr('Kiếp sau sinh ra đã biết bộ này, từ tầng 1.', 'Next life you are born knowing this, from stage 1.')}</span>
                    </div>
                  </div>
                  {heirs.length > 1 && (
                    <div className="chips scroll">
                      {heirs.map((x) => (
                        <button key={x.id} className={`chip-btn ${heir.id === x.id ? 'on' : ''}`} onClick={() => onHeir(x.id)}>
                          {x.name}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="note">{tr('Có chiêu viên mãn tầng 9 thì chọn được 1 bộ truyền cho kiếp sau.', 'Perfect a move to stage 9 to pass one on to your next life.')}</p>
              )}
              <div className="tk-book">
                {CP.map((d) => (
                  <span key={d.id} className={`tk-book-i ${seen.has(d.id) ? '' : 'unseen'}`} title={seen.has(d.id) ? d.name : '???'}>
                    <Orb d={d} size={40} dark={!seen.has(d.id)} />
                    <small>{seen.has(d.id) ? short(d.name) : '???'}</small>
                  </span>
                ))}
              </div>
              <p className="note">
                {tr(
                  `Đã gặp ${seen.size}/${CP.length} bộ qua các kiếp. Mỗi đạo một bộ riêng, tuyệt kỹ chỉ ra từ dung hợp.`,
                  `Seen ${seen.size}/${CP.length} across lives. Each path has its own set; ultimates only come from fusion.`,
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
