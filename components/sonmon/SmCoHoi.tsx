'use client';

/**
 * 18/11 tối (Tyler: đánh luôn không trinh sát thì sao biết đủ người thắng). Khối 8c.
 * Tyler 20:20: chưa trinh sát thì lực giữ vẫn "???". Hết 30 phút tập hợp môn tự đi đánh với người đã theo.
 * Màn xuất chinh: lực ta (chính xác) luôn hiện; trinh sát về (tự gửi khi phát lệnh) thì có thước so và thanh "Cơ hội thắng".
 * Số lấy từ máy chủ (vkl_sm_co_hoi).
 */
import { useEffect, useState } from 'react';
import { tr } from '@/lib/i18n';
import type { SmCoHoi } from '@/lib/sonmon/api';
import { fmtN, hhmm, type SmCtx } from './ui';

/** -1: chưa rõ; 0 Thấp, 1 Ngang ngửa, 2 Cao, 3 Gần như chắc thắng */
export function nacCoHoi(x: SmCoHoi): number {
  if (x.trong || x.cua_ta) return -1;
  const ta = x.ta ?? 0;
  if (x.nguon === 'trinh') {
    const g = x.giu ?? 0;
    if (ta >= (x.hi ?? g)) return 3;
    if (ta > g) return 2;
    if (ta >= (x.lo ?? g)) return 1;
    return 0;
  }
  return -1;
}
const NAC = [
  { ten: () => tr('Thấp', 'Low'), cls: 'n0' },
  { ten: () => tr('Ngang ngửa', 'Even'), cls: 'n1' },
  { ten: () => tr('Cao', 'Good'), cls: 'n2' },
  { ten: () => tr('Gần như chắc thắng', 'Near certain'), cls: 'n3' },
];

/** gọi vkl_sm_co_hoi cho một ô; làm mới khi khóa đổi và mỗi 20 giây nếu đang tập hợp */
export function useCoHoi(c: SmCtx, q: number | null, r: number | null, khoa: string, songSong = false) {
  const [x, setX] = useState<SmCoHoi | null>(null);
  useEffect(() => {
    if (q == null || r == null) return;
    let song = true;
    const lay = () => c.api.coHoi(q, r).then((v) => song && setX(v), () => song && setX(null));
    lay();
    const id = songSong ? setInterval(lay, 20e3) : null;
    return () => {
      song = false;
      if (id) clearInterval(id);
    };
  }, [c.api, q, r, khoa, songSong]);
  return x;
}

/** thẻ "Cơ hội thắng" ở màn xuất chinh */
export function CoHoiThe({ x, dangTap }: { x: SmCoHoi | null; dangTap: boolean }) {
  if (!x) return <p className="sm-note">{tr('Đang tính cơ hội thắng...', 'Working out the odds...')}</p>;
  if (x.trong) return <p className="sm-ok">{tr('Ô trống: tới nơi là cắm cờ, không phải đánh.', 'Empty tile: arrive and plant the flag.')}</p>;
  if (x.cua_ta) return null;
  const ta = x.ta ?? 0;
  if (x.nguon !== 'trinh')
    return (
      <div className="sm-ch">
        <div className="sm-between">
          <h3>{tr('Cơ hội thắng', 'Chance to win')}</h3>
          <b className="sm-ch-ten nq">{tr('Chưa rõ', 'Unclear')}</b>
        </div>
        <div className="sm-ch-nac" role="img" aria-label={tr('Chưa rõ', 'Unclear')}>
          {NAC.map((_, i) => (
            <i key={i} className="q">?</i>
          ))}
        </div>
        <div className="sm-between sm-thuoc-chu">
          <span>
            <i className="dau ta" aria-hidden /> {tr(`Ta ${fmtN(ta)}`, `Us ${fmtN(ta)}`)}
            <small> · {tr(`${x.n_ta ?? 1} người`, `${x.n_ta ?? 1} marching`)}</small>
          </span>
          <span>
            <i className="dau ho" aria-hidden /> {tr('Họ ???', 'Them ???')}
          </span>
        </div>
        <p className="sm-note">
          {x.trinh_ve
            ? tr(`Đang trinh sát, có tin lúc ${hhmm(x.trinh_ve)}${dangTap ? '. Tin về trước khi hết giờ tập hợp thì vẫn kịp gọi thêm người' : ''}.`, `Scouting, back at ${hhmm(x.trinh_ve)}.`)
            : tr('Chưa trinh sát nên chưa biết lực giữ. Trinh sát ô này để biết cần bao nhiêu người.', 'Not scouted yet. Scout this tile to know how many you need.')}
          {x.dem ? tr(' Tới nơi lúc 0-7h: bên giữ mạnh gấp đôi.', ' Night arrival doubles the defence.') : ''}
        </p>
      </div>
    );
  const nac = nacCoHoi(x);
  const g = x.giu ?? 0;
  const lo = x.lo ?? g;
  const hi = x.hi ?? g;
  const tran = Math.max(hi, ta) * 1.12 || 1;
  const pct = (v: number) => `${Math.min(100, (v / tran) * 100)}%`;
  const thieu = Math.max(0, Math.ceil(hi - ta));
  const nguoi = x.avg ? Math.max(1, Math.ceil(thieu / x.avg)) : null;
  return (
    <div className="sm-ch">
      <div className="sm-between">
        <h3>{tr('Cơ hội thắng', 'Chance to win')}</h3>
        <b className={`sm-ch-ten ${NAC[nac].cls}`}>{NAC[nac].ten()}</b>
      </div>
      <div className="sm-ch-nac" role="img" aria-label={NAC[nac].ten()}>
        {NAC.map((_, i) => (
          <i key={i} className={i <= nac ? `on ${NAC[nac].cls}` : ''} />
        ))}
      </div>
      <div className="sm-thuoc" role="img" aria-label={tr(`Ta ${fmtN(ta)}, họ khoảng ${fmtN(lo)} đến ${fmtN(hi)}`, `Us ${fmtN(ta)}, them about ${fmtN(lo)} to ${fmtN(hi)}`)}>
        <span className="ho" style={{ left: pct(lo), width: `calc(${pct(hi)} - ${pct(lo)})` }} />
        <span className="ta" style={{ width: pct(ta) }} />
        <span className="vach" style={{ left: pct(ta) }} />
      </div>
      <div className="sm-between sm-thuoc-chu">
        <span>
          <i className="dau ta" aria-hidden /> {tr(`Ta ${fmtN(ta)}`, `Us ${fmtN(ta)}`)}
          <small> · {tr(`${x.n_ta ?? 1} người`, `${x.n_ta ?? 1} marching`)}</small>
        </span>
        <span>
          <i className="dau ho" aria-hidden /> {tr(`Họ ~${fmtN(g)}`, `Them ~${fmtN(g)}`)}
        </span>
      </div>
      {nac === 3 ? (
        <p className="sm-ok">{tr('Đủ người rồi. Ai còn lại nên ở nhà giữ ô.', 'Enough. Everyone else should stay home and guard.')}</p>
      ) : (
        <p className="sm-ch-can">
          {tr(`Cần thêm khoảng ${fmtN(thieu)} Lực chiến`, `Need about ${fmtN(thieu)} more power`)}
          {nguoi ? tr(` (${nguoi} người cỡ trung bình của môn)`, ` (${nguoi} average members)`) : ''}
          {tr(' để gần như chắc thắng.', ' to be near certain.')}
        </p>
      )}
      <p className="sm-note">
        {tr(`Theo trinh sát lúc ${hhmm(x.trinh_luc!)}: ${x.n ?? 0} người giữ, sai số khoảng 15%. Đã tính sân nhà, Khí vận của họ${x.dem ? ', đêm gấp đôi' : ''}. Họ có thể gọi thêm người trong 20 phút đi đường.`, `From the scout at ${hhmm(x.trinh_luc!)}: ${x.n ?? 0} guards, about 15% error. They may reinforce while we march.`)}
      </p>
    </div>
  );
}
