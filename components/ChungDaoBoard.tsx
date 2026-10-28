'use client';

import { useEffect, useState } from 'react';
import { byFastest, byHoDao, byTimes, chungDaoBoard, type CdRow } from '@/lib/chungDaoBoard';
import { tr } from '@/lib/i18n';

type Sort = 'times' | 'fast' | 'ho';

/** Bảng Chứng Đạo ở trang Xếp hạng */
export default function ChungDaoBoard({ me }: { me: string | null }) {
  const [rows, setRows] = useState<CdRow[] | null>(null);
  const [sort, setSort] = useState<Sort>('times');
  useEffect(() => {
    chungDaoBoard().then((r) => setRows(r ?? []));
  }, []);
  if (!rows) return <p>{tr('Đang mở Thiên bảng...', 'Opening the Heavenly Board...')}</p>;
  const list = sort === 'times' ? byTimes(rows) : sort === 'fast' ? byFastest(rows) : byHoDao(rows);
  const myRank = me ? list.findIndex((r) => r.player === me) : -1;
  return (
    <section className="cdb">
      <p className="note" style={{ marginTop: 0 }}>
        {tr('Những người đã vượt kiếp cuối cùng, đứng ngoài luân hồi. Bảng năng lực ai cũng chạm trần Đại La, còn ở đây vẫn phân cao thấp.', 'Those who passed the final tribulation and stepped outside the cycle. On the power board everyone tops out at Daluo; here the ranking goes on.')}
      </p>
      <div className="cdb-sort" role="tablist">
        {(
          [
            ['times', tr('Nhiều lần nhất', 'Most times')],
            ['fast', tr('Nhanh nhất', 'Fastest')],
            ['ho', tr('Vạn kiếp hộ đạo', 'Guarded by past lives')],
          ] as [Sort, string][]
        ).map(([k, n]) => (
          <button key={k} role="tab" aria-selected={sort === k} className={sort === k ? 'on' : ''} onClick={() => setSort(k)}>
            {n}
          </button>
        ))}
      </div>
      {me && (
        <p className="cdb-me">
          {myRank >= 0 ? tr(`Bạn đứng thứ ${myRank + 1}/${list.length}.`, `You are #${myRank + 1} of ${list.length}.`) : tr('Bạn chưa có tên trên bảng này. Chứng đạo một lần để ghi danh.', 'You are not on this board yet. Attain the Dao once to be listed.')}
        </p>
      )}
      {!list.length ? (
        <p className="note">{sort === 'ho' ? tr('Chưa ai được vạn kiếp hộ đạo.', 'No one has been guarded by their past lives yet.') : tr('Chưa ai chứng đạo.', 'No one has attained the Dao yet.')}</p>
      ) : (
        <ol className="gh-board cdb-list">
          {list.slice(0, 30).map((r, i) => (
            <li key={r.player} className={r.player === me ? 'me' : ''}>
              <span className="gh-poster" aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <b>@{r.player}</b>
                <small>
                  {sort === 'fast'
                    ? tr(`Chứng đạo ở kiếp thứ ${r.fastest.lifeNo}, ${r.fastest.age} tuổi · ${r.fastest.name}`, `Attained the Dao in life #${r.fastest.lifeNo} at ${r.fastest.age} · ${r.fastest.name}`)
                    : tr(`Kiếp nhanh nhất: kiếp ${r.fastest.lifeNo}`, `Fastest: life #${r.fastest.lifeNo}`)}
                </small>
              </span>
              <b className="gh-gold">{sort === 'times' ? tr(`${r.times} lần`, `${r.times}x`) : sort === 'fast' ? tr(`kiếp ${r.fastest.lifeNo}`, `#${r.fastest.lifeNo}`) : tr(`${r.hoDao} lần`, `${r.hoDao}x`)}</b>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
