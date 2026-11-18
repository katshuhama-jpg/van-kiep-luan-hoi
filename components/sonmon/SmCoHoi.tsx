'use client';

/**
 * 18/11 tối (Tyler: đánh luôn không trinh sát thì sao biết đủ người thắng). Khối 8c.
 * - Thẻ ô: lực giữ ước lượng 4 mức (Yếu/Vừa/Mạnh/Rất mạnh) khi chưa trinh sát; có trinh sát thì ra số.
 * - Màn xuất chinh: thước so lực ta với khoảng lực giữ + thanh "Cơ hội thắng" 4 nấc + "cần thêm khoảng X".
 * Số lấy từ máy chủ (vkl_sm_co_hoi): lực ta chính xác, lực giữ từ trinh sát 1 giờ qua hoặc mức thô có nhiễu.
 */
import { useEffect, useState } from 'react';
import { tr } from '@/lib/i18n';
import type { SmCoHoi } from '@/lib/sonmon/api';
import { fmtN, hhmm, type SmCtx } from './ui';

export const MUC_GIU = [
  { ten: () => tr('Yếu', 'Weak'), khoang: () => tr('dưới 3.000', 'under 3,000') },
  { ten: () => tr('Vừa', 'Fair'), khoang: () => '3.000 - 8.000' },
  { ten: () => tr('Mạnh', 'Strong'), khoang: () => '8.000 - 15.000' },
  { ten: () => tr('Rất mạnh', 'Very strong'), khoang: () => tr('trên 15.000', 'over 15,000') },
];
const N_MUC = [() => tr('chưa ai', 'nobody'), () => tr('1-2 người', '1-2 people'), () => tr('3-5 người', '3-5 people'), () => tr('6 người trở lên', '6+ people')];

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
  if (ta < (x.lo ?? 0)) return 0;
  if (x.hi != null && ta >= x.hi) return 2;
  return -1;
}
const NAC = [
  { ten: () => tr('Thấp', 'Low'), cls: 'n0' },
  { ten: () => tr('Ngang ngửa', 'Even'), cls: 'n1' },
  { ten: () => tr('Cao', 'Good'), cls: 'n2' },
  { ten: () => tr('Gần như chắc thắng', 'Near certain'), cls: 'n3' },
];

/** gọi vkl_sm_co_hoi cho một ô; làm mới khi khóa đổi và mỗi 20 giây nếu đang tập hợp */
export function useCoHoi(c: SmCtx, q: number, r: number, khoa: string, songSong = false) {
  const [x, setX] = useState<SmCoHoi | null>(null);
  useEffect(() => {
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

/** dòng lực giữ trên thẻ ô (bản đồ) */
export function GiuUoc({ x }: { x: SmCoHoi | null }) {
  if (!x || x.trong || x.cua_ta) return null;
  if (x.nguon === 'trinh')
    return (
      <>
        <div className="sm-between">
          <b>{tr('Lực giữ ô', 'Tile defence')}</b>
          <b className="sm-giu-n">~{fmtN(x.giu ?? 0)}</b>
        </div>
        <p className="sm-note">
          {tr(`Theo trinh sát lúc ${hhmm(x.trinh_luc!)}: ${x.n ?? 0} người giữ. Đã tính sân nhà, Khí vận của họ${x.dem ? ', ban đêm gấp đôi' : ''}. Sai số khoảng 15%.`, `Scouted at ${hhmm(x.trinh_luc!)}: ${x.n ?? 0} guards. Includes their bonuses. About 15% error.`)}
        </p>
      </>
    );
  const muc = x.muc ?? 0;
  return (
    <>
      <div className="sm-between">
        <b>{tr('Lực giữ ô', 'Tile defence')}</b>
        <b className={`sm-giu-muc m${muc}`}>{MUC_GIU[muc].ten()}</b>
      </div>
      <div className="sm-muc" role="img" aria-label={tr(`Mức ${MUC_GIU[muc].ten()}, ${MUC_GIU[muc].khoang()}`, `Level ${MUC_GIU[muc].ten()}`)}>
        {MUC_GIU.map((_, i) => (
          <i key={i} className={i <= muc ? `on m${muc}` : ''} />
        ))}
      </div>
      <p className="sm-note">
        {tr(`Ước lượng ${MUC_GIU[muc].khoang()}, khoảng ${N_MUC[x.n_muc ?? 0]()} giữ. Chưa trinh sát nên chỉ biết mức. Trinh sát để biết số gần đúng.`, `Rough estimate ${MUC_GIU[muc].khoang()}, about ${N_MUC[x.n_muc ?? 0]()}. Scout for a closer number.`)}
        {x.trinh_ve ? tr(` Trinh sát về lúc ${hhmm(x.trinh_ve)}.`, ` Scout back at ${hhmm(x.trinh_ve)}.`) : ''}
      </p>
    </>
  );
}

/** thẻ "Cơ hội thắng" ở màn xuất chinh */
export function CoHoiThe({ x, dangTap }: { x: SmCoHoi | null; dangTap: boolean }) {
  if (!x) return <p className="sm-note">{tr('Đang tính cơ hội thắng...', 'Working out the odds...')}</p>;
  if (x.trong) return <p className="sm-ok">{tr('Ô trống: tới nơi là cắm cờ, không phải đánh.', 'Empty tile: arrive and plant the flag.')}</p>;
  if (x.cua_ta) return null;
  const ta = x.ta ?? 0;
  const nac = nacCoHoi(x);
  const lo = x.lo ?? 0;
  const hi = x.hi ?? Math.max(lo * 1.5, ta * 1.2, 1);
  const tran = Math.max(hi, ta) * 1.12;
  const pct = (v: number) => `${Math.min(100, (v / tran) * 100)}%`;
  const muc = x.nguon === 'trinh' ? (x.hi ?? 0) : x.hi != null ? x.hi : lo;
  const thieu = Math.max(0, Math.ceil(muc - ta));
  const nguoi = x.avg ? Math.max(1, Math.ceil(thieu / x.avg)) : null;
  return (
    <div className="sm-ch">
      <div className="sm-between">
        <h3>{tr('Cơ hội thắng', 'Chance to win')}</h3>
        <b className={`sm-ch-ten ${nac < 0 ? 'nq' : NAC[nac].cls}`}>{nac < 0 ? tr('Chưa rõ', 'Unclear') : NAC[nac].ten()}</b>
      </div>
      <div className="sm-ch-nac" role="img" aria-label={nac < 0 ? tr('Chưa rõ', 'Unclear') : NAC[nac].ten()}>
        {NAC.map((n, i) => (
          <i key={i} className={nac < 0 ? 'q' : i <= nac ? `on ${NAC[nac].cls}` : ''}>
            {nac < 0 ? '?' : ''}
          </i>
        ))}
      </div>
      <div
        className="sm-thuoc"
        role="img"
        aria-label={tr(`Ta ${fmtN(ta)}, họ khoảng ${fmtN(lo)} đến ${x.hi != null ? fmtN(x.hi) : 'hơn nữa'}`, `Us ${fmtN(ta)}, them about ${fmtN(lo)} to ${x.hi != null ? fmtN(x.hi) : 'more'}`)}
      >
        <span className={`ho${x.hi == null ? ' mo' : ''}`} style={{ left: pct(lo), width: `calc(${pct(hi)} - ${pct(lo)})` }} />
        <span className="ta" style={{ width: pct(ta) }} />
        <span className="vach" style={{ left: pct(ta) }} />
      </div>
      <div className="sm-between sm-thuoc-chu">
        <span>
          <i className="dau ta" aria-hidden /> {tr(`Ta ${fmtN(ta)}`, `Us ${fmtN(ta)}`)}
          <small> · {tr(`${x.n_ta ?? 1} người`, `${x.n_ta ?? 1} marching`)}</small>
        </span>
        <span>
          <i className="dau ho" aria-hidden /> {tr('Họ', 'Them')} {x.nguon === 'trinh' ? `~${fmtN(x.giu ?? 0)}` : x.hi != null ? `${fmtN(lo)}-${fmtN(x.hi)}` : tr(`trên ${fmtN(lo)}`, `over ${fmtN(lo)}`)}
        </span>
      </div>
      {nac === 3 ? (
        <p className="sm-ok">{tr('Đủ người rồi. Ai còn lại nên ở nhà giữ ô.', 'Enough. Everyone else should stay home and guard.')}</p>
      ) : thieu > 0 ? (
        <p className="sm-ch-can">
          {tr(`Cần thêm khoảng ${fmtN(thieu)} Lực chiến`, `Need about ${fmtN(thieu)} more power`)}
          {nguoi ? tr(` (${nguoi} người cỡ trung bình của môn)`, ` (${nguoi} average members)`) : ''}
          {x.nguon === 'trinh' ? tr(' để gần như chắc thắng.', ' to be near certain.') : x.hi != null ? tr(' để vượt mức trên.', ' to clear the top of the range.') : tr(' mới bằng mức dưới.', ' just to reach the bottom.')}
        </p>
      ) : null}
      <p className="sm-note">
        {x.nguon === 'trinh'
          ? tr(`Theo trinh sát lúc ${hhmm(x.trinh_luc!)}, sai số khoảng 15%. Họ có thể gọi thêm người tới giữ trong 20 phút đi đường.`, `From the scout at ${hhmm(x.trinh_luc!)}, about 15% error. They may reinforce while we march.`)
          : x.trinh_ve
            ? tr(`Mới là mức ước lượng. Trinh sát về lúc ${hhmm(x.trinh_ve)}, lúc đó số sẽ rõ hơn${dangTap ? ', vẫn kịp gọi thêm người' : ''}.`, `Only a rough level. The scout returns at ${hhmm(x.trinh_ve)}.`)
            : tr('Mới là mức ước lượng, sai nhiều. Trinh sát để biết số gần đúng.', 'Only a rough level. Scout for a closer number.')}
        {x.dem ? tr(' Tới nơi lúc 0-7h: bên giữ mạnh gấp đôi, đã tính.', ' Night arrival doubles the defence, included.') : ''}
      </p>
    </div>
  );
}
