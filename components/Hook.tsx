'use client';

import { useEffect, useState } from 'react';
import { Sheet } from './Panels';
import { CHECKIN, QUEST_BONUS, QUEST_REWARD, canChiDay, checkinClaimed, checkinDay, dailyOf, omenToday, questName } from '@/lib/game/hook';
import { honActive } from '@/lib/game/luanHoi';
import type { Meta } from '@/lib/game/types';
import { rumorHead, rumorToday } from '@/lib/game/collect';
import { endingStats } from '@/lib/storage';

/** Tiếng đồn hôm nay ở màn đầu thai: gợi mờ một kết cục ít người mở nhất, chạm để mở Sổ Sinh Tử */
export function RumorLine({ meta }: { meta: Meta }) {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    endingStats()
      .then((r) => r && setCounts(r.counts))
      .catch(() => {});
  }, []);
  const rumor = rumorToday(meta, undefined, counts);
  if (!rumor) return null;
  const n = counts ? (counts[rumor.id] ?? 0) : null;
  return (
    <a className="rumor-line" href="/so-sinh-tu">
      <i>Tiếng đồn</i>
      <span>
        {rumorHead()}: “{rumor.hint}”
        {n !== null && <small>{n === 0 ? ' Chưa ai trong giang hồ chạm tới.' : n <= 3 ? ` Mới ${n} người chạm tới.` : ''}</small>}
      </span>
    </a>
  );
}

/** Thẻ "Hôm nay": thiên tượng, chuỗi ngày, nhiệm vụ ngày */
/** Biểu tượng pixel 10x10 cho từng thiên tượng (# = màu chính, o = màu phụ) */
const OMEN_PX: Record<string, string[]> = {
  loi_van: ['..oooooo..', '.oooooooo.', 'oooooooooo', '.oooooooo.', '....##....', '...##.....', '..######..', '....##....', '...##.....', '..##......'],
  linh_khi: ['..........', '...oo.....', '..oooo.oo.', '.oooooooooo', 'oooooooooo', '..........', '.#.#.#.#..', '..#.#.#.#.', '.#.#.#.#..', '..........'],
  huyet_nguyet: ['...####...', '..######..', '.###oo###.', '.##oooo##.', '.##oooo##.', '.###oo###.', '..######..', '...####...', '..........', '..........'],
  phat_quang: ['....##....', '..#.##.#..', '...####...', '.########.', '##.#oo#.##', '.########.', '...####...', '..#.##.#..', '....##....', '..........'],
  cat_tinh: ['....#.....', '....#.....', '...###....', '#########.', '.#######..', '..#####...', '.###.###..', '.##...##..', '.#.....#..', '..........'],
  yeu_trieu: ['.##....##.', '.###..###.', '.########.', '##o####o##', '##########', '.###..###.', '..######..', '...#..#...', '..........', '..........'],
  giang_ho_loan: ['#........#', '.#......#.', '..#....#..', '...#..#...', '....##....', '....##....', '...#..#...', '..o....o..', '.oo....oo.', 'oo......oo'],
};

function OmenIcon({ id }: { id: string }) {
  const rows = OMEN_PX[id] ?? OMEN_PX.loi_van;
  return (
    <svg className="tt-icon" viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden="true">
      {rows.flatMap((r, y) => r.split('').map((ch, x) => (ch === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" className={ch === '#' ? 'a' : 'b'} />)))}
    </svg>
  );
}

/**
 * Thẻ "Hôm nay" kiểu thẻ bài pixel kiếm hiệp:
 * thiên tượng (can chi ngày, nên và kiêng), dưới là chuỗi tu luyện và nhiệm vụ ngày gọn trong một khối.
 */
export function TodayScroll({ meta }: { meta: Meta }) {
  const o = omenToday();
  const d = dailyOf(meta);
  const n = meta.streak?.n ?? 1;
  return (
    <section className={`thien-tuong o-${o.id}`} aria-label={`Thiên tượng hôm nay: ${o.name}`}>
      <div className="tt-head">
        <span>Thiên tượng hôm nay</span>
        <span>Ngày {canChiDay()}</span>
      </div>
      <div className="tt-main">
        <span className="tt-seal">
          <OmenIcon id={o.id} />
        </span>
        <div className="tt-text">
          <b className="tt-name">{o.name}</b>
          <p>{o.desc}</p>
        </div>
      </div>
      <div className="tt-yiji">
        <span>
          <i className="nghi">Nên</i> {o.nghi}
        </span>
        <span>
          <i className="ky">Kiêng</i> {o.ky}
        </span>
      </div>
      <div className="tt-daily">
        <div className="tt-streak">
          <b>Chuỗi tu luyện {n} ngày</b>
        </div>
        <ul className="tt-quests" aria-label={`Nhiệm vụ hôm nay, mỗi việc +${QUEST_REWARD} phúc duyên, xong cả 3 thêm +${QUEST_BONUS}`}>
          {d.quests.map((id) => (
            <li key={id} className={d.done.includes(id) ? 'done' : ''}>
              <span className="box" aria-hidden="true" />
              {questName(id)}
            </li>
          ))}
        </ul>
        <small className="tt-note">
          Nhiệm vụ +{QUEST_REWARD} phúc duyên mỗi việc, xong cả 3 thêm +{QUEST_BONUS}
        </small>
      </div>
    </section>
  );
}

export function HookSheet({ meta, onClose }: { meta: Meta; onClose: () => void }) {
  return (
    <Sheet title="Hôm nay" onClose={onClose}>
      <TodayScroll meta={meta} />
    </Sheet>
  );
}

/** Danh hiệu tuần trên đầu nhân vật (có thể nhiều danh hiệu) */
export function TitleBadge({ title }: { title?: string | string[] | null }) {
  const list = (Array.isArray(title) ? title : title ? [title] : []).filter(Boolean);
  if (!list.length) return null;
  return (
    <>
      {list.map((t) => {
        const tone = t.includes('Ma Đầu') ? 'ta' : t.includes('Minh Chủ') ? 'chinh' : t.includes('Phú') ? 'phu' : t.includes('Thọ') ? 'tho' : 'gold';
        return (
          <span key={t} className={`title-badge ${tone}`}>
            {t}
          </span>
        );
      })}
    </>
  );
}

/** 3.2.0: điểm danh 7 ngày ở màn đầu thai, cùng nhiệm vụ ngày */
export function CheckinRow({ meta, onClaim }: { meta: Meta; onClaim: () => void }) {
  const day = checkinDay(meta);
  const claimed = checkinClaimed(meta);
  const hon = honActive(meta);
  const d = dailyOf(meta);
  const labelOf = (i: number) => {
    const g = CHECKIN[i];
    return g.hon && !hon ? `${g.honPhuc} phúc${g.item ? ', ngọc bội' : ''}` : g.label;
  };
  const done = d.quests.filter((id) => d.done.includes(id)).length;
  return (
    <section className="checkin" aria-label="Điểm danh 7 ngày và nhiệm vụ hôm nay">
      <div className="ci-line">
        <b>Điểm danh</b>
        <ol className="ci-pips">
          {CHECKIN.map((_, i) => {
            const n = i + 1;
            const st = n < day || (n === day && claimed) ? 'got' : n === day ? 'now' : '';
            return (
              <li key={n} className={st} title={`Ngày ${n}: ${labelOf(i)}`}>
                {st === 'got' ? '✓' : n}
              </li>
            );
          })}
        </ol>
      </div>
      <div className="ci-line">
        <details className="ci-q">
          <summary>
            Nhiệm vụ {done}/{d.quests.length}
          </summary>
          <ul className="ci-quests" aria-label={`Nhiệm vụ hôm nay, mỗi việc +${QUEST_REWARD} phúc duyên`}>
            {d.quests.map((id) => (
              <li key={id} className={d.done.includes(id) ? 'done' : ''}>
                <span className="box" aria-hidden="true" />
                {questName(id)}
              </li>
            ))}
          </ul>
          <small className="tt-note">
            +{QUEST_REWARD} phúc mỗi việc, xong cả 3 thêm +{QUEST_BONUS}
            {hon ? ', mỗi việc hồi 10 Hồn lực' : ''}
          </small>
        </details>
        {!claimed ? (
          <button className="btn btn-red ci-claim" onClick={onClaim}>
            Nhận {labelOf(day - 1)}
          </button>
        ) : (
          <small className="ci-done">Mai: {labelOf(day % 7)}</small>
        )}
      </div>
    </section>
  );
}
