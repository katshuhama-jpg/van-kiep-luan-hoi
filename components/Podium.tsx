'use client';

import { useEffect, useRef, useState } from 'react';
import Sprite from '@/components/Sprite';
import { Sheet } from '@/components/Panels';
import { foeChar } from '@/lib/game/duel';
import { PATHS, realmLabel } from '@/lib/game/data';
import type { RivalChar } from '@/lib/game/types';
import { arenaPodiumShadow } from '@/lib/social';
import { tr } from '@/lib/i18n';

export interface PodiumEntry {
  username: string;
  pts: number;
  wins: number;
  losses: number;
  winRun?: number;
}

const TITLE = [tr('Lôi Đài Bá Chủ', "Arena Overlord"), tr('Lôi Đài Á Chủ', "Arena Second Lord"), tr('Lôi Đài Tam Kiệt', "Arena Third Hero")];
/**
 * Vị trí trên nền (theo phần trăm khung 128x88): ô cắt riêng cho từng người để hào quang, cánh không lấn sang nhau.
 * x0..x1: bề ngang ô; foot: chân đứng; size: cỡ nhân vật theo bề ngang khung.
 */
const SLOT = [
  { x0: 31.5, x1: 68.5, top: 4, foot: 63, size: 0.27, dir: 2 }, // số 1, trước long ỷ
  { x0: 0, x1: 26.6, top: 15, foot: 68, size: 0.22, dir: 3 }, // số 2, hốc trái, nhìn vào giữa
  { x0: 73.4, x1: 100, top: 15, foot: 72, size: 0.22, dir: 1 }, // số 3, hốc phải
];

/** Bục vinh danh kiểu đại điện Long Ỷ: số 1 đứng giữa trước ngai, số 2 và 3 ở hai hốc hai bên */
export default function Podium({ top, me }: { top: PodiumEntry[]; me?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(360);
  const [chars, setChars] = useState<(RivalChar | null)[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const three = top.slice(0, 3);
  const key = three.map((t) => t.username).join(',');
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    let live = true;
    Promise.all(three.map((t) => arenaPodiumShadow(t.username).catch(() => null))).then((x) => live && setChars(x));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const h = (w * 88) / 128;
  const sel = open !== null ? { t: three[open], c: chars[open] } : null;
  return (
    <section className="podium" aria-label={tr("Ba người đứng đầu lôi đài tuần này", "This week's top three in the Arena")}>
      <div className={`pd-stage ${chars.length === three.length ? 'ready' : ''}`} ref={box} style={{ height: h }}>
        <i className="pd-beam" aria-hidden="true" />
        {/* hai rồng vàng chầu hai bên long ỷ (ảnh Chinese Green Dragon của Pixel Archer, CC0, nhuộm vàng); phóng theo bội số nguyên cho nét pixel sắc */}
        {[0, 1].map((k) => (
          <img key={k} className={`pd-long ${k ? 'r' : 'l'}`} src="/px/long_vang.png" alt="" aria-hidden="true" width={128 * Math.max(1, Math.floor(w / 300))} height={64 * Math.max(1, Math.floor(w / 300))} />
        ))}
        {SLOT.map((s, i) => {
          const t = three[i];
          const c = chars[i];
          const size = Math.round(w * s.size);
          const left = (w * s.x0) / 100;
          const width = (w * (s.x1 - s.x0)) / 100;
          const top = (h * s.top) / 100;
          const height = (h * (s.foot - s.top)) / 100;
          return (
            <button
              key={i}
              type="button"
              className={`pd-slot s${i + 1} ${t ? '' : 'empty'}`}
              style={{ left, width, top, height }}
              onClick={() => t && setOpen(i)}
              disabled={!t}
              aria-label={t ? tr(`Hạng ${i + 1}: @${t.username}, ${t.pts} điểm. Bấm xem chi tiết`, `Rank ${i + 1}: @${t.username}, ${t.pts} points. Tap for details`) : tr(`Hạng ${i + 1} còn trống`, `Rank ${i + 1} is empty`)}
            >
              {t && c ? (
                <span className="pd-fig" style={{ width: size, height: size }}>
                  <Sprite c={foeChar(c)} size={size} anim="idle" dir={s.dir} />
                </span>
              ) : (
                <span className="pd-ghost" style={{ width: size * 0.4, height: size * 0.75 }} />
              )}
            </button>
          );
        })}
      </div>
      <ol className="pd-plaques">
        {[1, 0, 2].map((i) => {
          const t = three[i];
          const c = chars[i];
          return (
            <li key={i} className={`pd-plaque p${i + 1} ${t && t.username === me ? 'mine' : ''}`}>
              <button type="button" onClick={() => t && setOpen(i)} disabled={!t}>
                <span className="pd-rank">{i + 1}</span>
                {t ? (
                  <>
                    <b className="pd-name">{c?.name ?? '...'}</b>
                    <small className="pd-user">
                      @{t.username}
                      {t.username === me ? tr(' · Bạn', " · You") : ''}
                    </small>
                    <small className="pd-elo">
                      {t.pts}{tr(" điểm", " pts")}{(t.winRun ?? 0) >= 3 ? tr(` · Liên thắng ${t.winRun}`, ` · ${t.winRun}-win streak`) : ''}
                    </small>
                  </>
                ) : (
                  <small className="pd-user">{tr("Còn trống", "Empty")}</small>
                )}
              </button>
            </li>
          );
        })}
      </ol>
      {sel?.t && (
        <Sheet title={TITLE[open!]} onClose={() => setOpen(null)}>
          <div className="pd-detail">
            {sel.c && (
              <span className="pd-dfig">
                <Sprite c={foeChar(sel.c)} size={120} />
              </span>
            )}
            <div>
              <b className="pd-dname">{sel.c?.name ?? '@' + sel.t.username}</b>
              <p>
                @{sel.t.username}
                {sel.t.username === me ? tr(' (bạn)', " (you)") : ''}
              </p>
              <p>
                <b>{sel.t.pts}</b>{tr(" điểm lôi đài · ", " arena points · ")}{sel.t.wins}{tr(" thắng, ", " wins, ")}{sel.t.losses}{tr(" thua tuần này", " losses this week")}
                {(sel.t.winRun ?? 0) >= 3 ? tr(` · Liên thắng ${sel.t.winRun}`, ` · ${sel.t.winRun}-win streak`) : ''}
              </p>
              {sel.c && (
                <p>
                  {sel.c.realm === 0 ? tr('Phàm nhân', "Mortal") : realmLabel(sel.c.realm, sel.c.layer, sel.c.cosmos)}
                  {sel.c.path ? ` · ${PATHS[sel.c.path].name}` : ''}{tr(" · Kiếp ", " · Life ")}{sel.c.lifeNo ?? 1}
                  {sel.c.alive ? tr(' · đang sống', " · alive") : tr(' · đã mất', " · deceased")}
                </p>
              )}
              <p className="note">{tr("Bóng người chơi này đã cầm ra lôi đài gần nhất.", "The shadow this player most recently took into the arena.")}</p>
            </div>
          </div>
        </Sheet>
      )}
    </section>
  );
}
