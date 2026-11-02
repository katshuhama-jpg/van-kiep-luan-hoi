'use client';
/** 4.2.0 Màn linh thú: rank, thân thiết, tiến hóa, tác dụng, huyết mạch, sổ linh thú theo rank */
import { useState, type CSSProperties } from 'react';
import MonsterLpc from './MonsterLpc';
import { PETS } from '@/lib/game/pets';
import { LEGEND_PETS } from '@/lib/game/petLegend';
import {
  RANK_INFO,
  RANK_ORDER,
  allPetIds,
  baseName,
  baseRank,
  effectLines,
  evoNeed,
  canEvolve,
  lvPct,
  petEvo,
  petId,
  petLv,
  petTitle,
  rankNow,
  LV_CAP,
  type PetRank,
} from '@/lib/game/linhThu';
import { REALMS } from '@/lib/game/data';
import type { Character } from '@/lib/game/types';
import { tr } from '@/lib/i18n';

export function RankBadge({ r, big }: { r: PetRank; big?: boolean }) {
  return <span className={`lt-rank rk-${r} ${big ? 'big' : ''}`}>{r}</span>;
}

/** Vẽ một linh thú: sprite thú cưng nhỏ hoặc thú truyền thuyết. box = cỡ khung (px) */
export function PetPic({ id, box, still, dark, evo = 0, dir = 1 }: { id: string; box: number; still?: boolean; dark?: boolean; evo?: number; dir?: 0 | 1 }) {
  const glow = evo >= 2 ? 'drop-shadow(0 0 4px #ffd36b)' : evo >= 1 ? 'drop-shadow(0 0 3px #9ff0c8)' : '';
  const L = LEGEND_PETS[id];
  if (L)
    return (
      <span className={`lt-pic ${dark ? 'lt-dark' : ''}`} style={{ filter: dark ? undefined : glow || undefined }}>
        <MonsterLpc look={L.look} size={box} still={still} />
      </span>
    );
  const p = PETS[id];
  if (!p) return null;
  const k = (box / 64) * (p.w <= 32 ? 1.6 : p.w >= 80 ? 0.8 : 1) * (1 + 0.1 * evo);
  const w = p.w * k;
  const h = p.h * k;
  return (
    <span
      className="lt-pet"
      style={
        {
          width: w,
          height: h,
          backgroundImage: `url(/lpc/pets/${id}.png)`,
          backgroundSize: `${p.n * w}px ${2 * h}px`,
          backgroundPositionY: dir ? -h : 0,
          ['--lpc-end' as string]: `-${p.n * w}px`,
          animation: still ? 'none' : `lpc-play ${p.n / p.fps}s steps(${p.n}) infinite`,
          filter: dark ? 'brightness(0) opacity(0.35)' : [p.filter, glow].filter(Boolean).join(' ') || undefined,
        } as CSSProperties
      }
      aria-hidden="true"
    />
  );
}

/** Huy hiệu linh thú trên sân khấu, chạm để mở màn linh thú */
export function PetBadge({ c, onOpen }: { c: Character; onOpen: () => void }) {
  const id = petId(c);
  const ready = canEvolve(c);
  return (
    <button className={`lt-badge ${ready ? 'ready' : ''}`} onClick={onOpen} aria-label={tr(`Xem linh thú ${petTitle(c)}`, `View spirit beast ${petTitle(c)}`)}>
      <span className="lt-badge-pic">
        <PetPic id={id} box={36} still evo={petEvo(c)} />
      </span>
      <span>
        <b>{petTitle(c)}</b>
        <small>
          {rankNow(id, petEvo(c))} · Lv {petLv(c)}
          {ready ? tr(' · tiến hóa!', ' · evolve!') : ''}
        </small>
      </span>
    </button>
  );
}

export function LinhThuSheet({ c, book, onEvolve, onClose }: { c: Character; book: string[]; onEvolve: () => void; onClose: () => void }) {
  const [view, setView] = useState<string | null>(null);
  const has = c.pet && !c.dead;
  const id = has ? petId(c) : null;
  const evo = petEvo(c);
  const seen = new Set([...book, ...(id ? [id] : [])]);
  const all = allPetIds();
  const need = has ? evoNeed(c) : null;
  const lines = has ? effectLines(c) : [];
  const show = view ?? id;
  const showSeen = !!show && seen.has(show);
  return (
    <div className="forge-wrap" role="dialog" aria-modal="true" aria-label={tr('Linh thú', 'Spirit beasts')}>
      <div className="forge-scene">
        <div className="fs-head">
          <b>{tr('Linh thú', 'Spirit beasts')}</b>
          <span className="fs-tinh">
            {tr('Sổ', 'Book')} {seen.size}/{all.length}
          </span>
          <button className="ss-x" onClick={onClose} aria-label={tr('Đóng', 'Close')}>
            ✕
          </button>
        </div>
        <div className="lt-stage" style={{ backgroundImage: 'url(/bg/du_ngoan-1.png)' }}>
          {show ? (
            <>
              <span className="lt-name">
                <b>
                  <RankBadge r={view ? baseRank(show) : rankNow(show, evo)} /> {view ? (showSeen || LEGEND_PETS[show] ? baseName(show) : '???') : petTitle(c)}
                </b>
                <small>
                  {view
                    ? showSeen
                      ? tr('Đã từng nuôi', 'Raised before')
                      : tr('Chưa gặp', 'Not yet met')
                    : tr(`Bậc ${evo + 1}/3 · Thân thiết ${petLv(c)}`, `Stage ${evo + 1}/3 · Bond ${petLv(c)}`)}
                </small>
              </span>
              <div className={`lt-big ${!view && evo >= 2 ? 'b2' : ''}`} key={`${show}${evo}`}>
                <PetPic id={show} box={LEGEND_PETS[show] ? 170 : 150} evo={view ? 0 : evo} dark={!!view && !showSeen} />
              </div>
              {view && id && (
                <button className="lt-back" onClick={() => setView(null)}>
                  ← {petTitle(c)}
                </button>
              )}
            </>
          ) : (
            <p className="lt-empty">{tr('Kiếp này chưa có linh thú nào theo bạn.', 'No spirit beast follows you in this life yet.')}</p>
          )}
        </div>
        <div className="fs-info">
          {has && id && (
            <>
              <div className="lt-evo">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={`lt-evo-n ${i === evo ? 'on' : ''} ${i < evo ? 'done' : ''}`}>
                    <span className="lt-evo-pic">
                      <PetPic id={id} box={44} still evo={i} dark={i > evo} />
                    </span>
                    <small>{tr(`Bậc ${i + 1}`, `Stage ${i + 1}`)}</small>
                    <RankBadge r={rankNow(id, i)} />
                  </span>
                ))}
              </div>

              <div className="lt-box">
                <div className="lt-row">
                  <span>{tr('Thân thiết', 'Bond')}</span>
                  <b>
                    Lv {petLv(c)}/{LV_CAP[evo]}
                  </b>
                </div>
                <span className="lt-prog">
                  <span style={{ width: `${Math.round(Math.min(1, (petLv(c) - 1 + lvPct(c)) / (LV_CAP[evo] - 1)) * 100)}%` }} />
                </span>
                <small>{tr('Mỗi năm bên nhau thêm thân thiết, cùng đánh trận thêm nữa.', 'Bond grows each year together, and more when fighting side by side.')}</small>
              </div>

              <div className="lt-box">
                <b className="lt-h">{tr('Tác dụng', 'Effects')}</b>
                {lines.map((l) => (
                  <span key={l.tag} className={`lt-eff ${l.on ? '' : 'lock'}`}>
                    <i>{l.tag}</i> {l.text}
                  </span>
                ))}
                {c.petBlood && (
                  <span className="lt-eff">
                    <i className="blood">{tr('Huyết mạch', 'Bloodline')}</i> {tr(`${baseName(c.petBlood)}: thêm một nửa tác dụng của loài đó`, `${baseName(c.petBlood)}: half that species' effect`)}
                  </span>
                )}
              </div>

              {need && (
                <div className="lt-box">
                  <b className="lt-h">
                    {tr(`Tiến hóa lên bậc ${evo + 2}`, `Evolve to stage ${evo + 2}`)} ·{' '}
                    {rankNow(id, evo) !== rankNow(id, evo + 1) ? `${rankNow(id, evo)} → ${rankNow(id, evo + 1)}` : tr(`giữ ${rankNow(id, evo)}, mạnh thêm`, `stays ${rankNow(id, evo)}, grows stronger`)}
                  </b>
                  <span className={`lt-need ${need.okLv ? 'ok' : ''}`}>
                    {need.okLv ? '✓' : '✗'} {tr(`Thân thiết Lv ${need.lv} (đang ${petLv(c)})`, `Bond Lv ${need.lv} (now ${petLv(c)})`)}
                  </span>
                  <span className={`lt-need ${need.okRealm ? 'ok' : ''}`}>
                    {need.okRealm ? '✓' : '✗'} {tr(`Chủ đạt ${REALMS[need.realm].name}`, `Master reaches ${REALMS[need.realm].name}`)}
                  </span>
                  <button className="btn btn-jade" disabled={!canEvolve(c)} onClick={onEvolve}>
                    {tr('Tiến hóa', 'Evolve')}
                  </button>
                </div>
              )}
            </>
          )}

          <div className="lt-box">
            <b className="lt-h">{tr('Huyết mạch', 'Bloodlines')}</b>
            {(c.huyetMach ?? []).length ? (
              (c.huyetMach ?? []).map((h) => (
                <span key={h.id} className="lt-blood">
                  <span className="lt-evo-pic">
                    <PetPic id={h.id} box={32} still evo={2} />
                  </span>
                  <span>
                    <b>{baseName(h.id)}</b>
                    <small>{tr(`từ kiếp ${h.life}`, `from life ${h.life}`)}</small>
                  </span>
                </span>
              ))
            ) : (
              <small>{tr('Chưa có. Linh thú lên bậc 3 sẽ để lại huyết mạch khi kiếp này khép lại. Linh thú kiếp sau thừa hưởng một nửa tác dụng.', 'None yet. A stage 3 beast leaves its bloodline when this life ends; the next life’s beast inherits half its effect.')}</small>
            )}
          </div>

          <b className="lt-h">{tr('Sổ linh thú', 'Bestiary')}</b>
          <p className="note">{tr('Rank càng cao càng hiếm gặp. Chạm một con để xem.', 'Higher ranks are rarer. Tap one to view.')}</p>
          {RANK_ORDER.map((r) => {
            const ids = all.filter((x) => baseRank(x) === r);
            return (
              <div key={r} className={`lt-rk rk-${r}`}>
                <div className="lt-rk-head">
                  <RankBadge r={r} big />
                  <span>
                    <b>{RANK_INFO[r].name}</b>
                    <small>{RANK_INFO[r].note}</small>
                  </span>
                </div>
                <div className="lt-book">
                  {ids.map((x) => {
                    // ô lớn có tên cho cả hàng SSR, SSS để các con cùng rank to bằng nhau
                    const L = r === 'SSR' || r === 'SSS';
                    const s = seen.has(x);
                    return (
                      <button key={x} className={`lt-book-i ${L ? 'big' : ''} ${show === x ? 'on' : ''}`} onClick={() => setView(x)} aria-label={s || L ? baseName(x) : tr('Chưa gặp', 'Not yet met')}>
                        <PetPic id={x} box={L ? 50 : 40} still dark={!s} />
                        {L && <small>{baseName(x)}</small>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
