'use client';

import { Sheet } from './Panels';
import { QUEST_BONUS, QUEST_REWARD, canChiDay, dailyOf, omenToday, questName, streakGift } from '@/lib/game/hook';
import type { Meta } from '@/lib/game/types';

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
  const next = streakGift(n + 1);
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
          {next && <small> · mai thêm +{next.money} linh thạch</small>}
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

/** Danh hiệu tuần trên đầu nhân vật */
export function TitleBadge({ title }: { title?: string | null }) {
  if (!title) return null;
  const tone = title.includes('Ma Đầu') ? 'ta' : title.includes('Minh Chủ') ? 'chinh' : 'gold';
  return <span className={`title-badge ${tone}`}>{title}</span>;
}
