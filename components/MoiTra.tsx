'use client';

import { useState, type ReactElement } from 'react';
import { TRA_BANK, TRA_QR } from '@/lib/moiTra';
import { track } from '@/lib/track';
import { PixelFx, fxMotes, fxRays } from './PixelFx';
import { tr } from '@/lib/i18n';

const Q = 3; // vùng trống quanh mã, tính theo ô

/** Mã QR vẽ lại kiểu pixel: ô mực trên giấy da, ba góc định vị đỏ son như con dấu */
export function TraQR({ size = 240 }: { size?: number }) {
  const n = TRA_QR.length;
  const finder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const cells: ReactElement[] = [];
  TRA_QR.forEach((row, r) => {
    for (let c = 0; c < n; c++) if (row[c] === '1') cells.push(<rect key={`${r}-${c}`} x={c + Q} y={r + Q} width={1} height={1} fill={finder(r, c) ? '#8a1a1a' : '#2a1f18'} />);
  });
  return (
    <svg className="tra-qr" viewBox={`0 0 ${n + Q * 2} ${n + Q * 2}`} width={size} height={size} shapeRendering="crispEdges" role="img" aria-label={tr(`Mã QR chuyển khoản ${TRA_BANK.bank} ${TRA_BANK.acctText}`, `Bank transfer QR code ${TRA_BANK.bank} ${TRA_BANK.acctText}`)}>
      <rect width={n + Q * 2} height={n + Q * 2} fill="#f3e6c4" />
      {cells}
    </svg>
  );
}

/** Khối "Mời tác giả chén trà" ở trang Tác giả: cuộn thư pháp hai trục gỗ, QR trong khung gỗ đinh vàng có linh quang */
export default function MoiTra() {
  const [msg, setMsg] = useState<string | null>(null);
  async function copy() {
    track('tra_copy');
    try {
      await navigator.clipboard.writeText(TRA_BANK.acct);
      setMsg(tr('Đã chép số tài khoản. Đa tạ đạo hữu!', "Account number copied. Many thanks, fellow Daoist!"));
    } catch {
      setMsg(tr('Máy không cho chép, giữ ngón tay lên số tài khoản để chép.', "Your device won't allow copying - press and hold the account number to copy it."));
    }
  }
  return (
    <section className="moi-tra" id="moi-tra" aria-labelledby="mt-title">
      <i className="mt-rod" aria-hidden="true" />
      <div className="mt-paper">
        <span className="mt-kick">{tr("Ngộ đạo trà quán", "Enlightenment Tea House")}</span>
        <h2 id="mt-title" className="mt-title">
          
          {tr("Mời tác giả một chén ngộ đạo trà!", "Treat the author to a cup of Enlightenment Tea!")}
        </h2>
        <p className="mt-text">{tr("Nếu cảm thấy cõi tiên đồ họa hữu tình, game cuốn hút, đạo hữu có thể hoan hỉ mời bần đạo một chén trà để tái tạo linh lực, tiếp tục độ kiếp fix bug và có tiền mua sữa bỉm nuôi tiểu quỷ ở nhà.", "If this immortal world's art charms you and the game has you hooked, fellow Daoist, you may joyfully treat this humble Daoist to a cup of tea - to restore my spiritual energy, keep braving the tribulation of bug fixing, and buy milk and diapers for the little demon at home.")}</p>
        <div className="mt-altar">
          <PixelFx spec={fxRays('#ffd36b')} scale={3} dur={2.4} className="pa mt-rays" />
          <PixelFx spec={fxMotes(14, '#ffd36b')} scale={3} dur={2} className="pa mt-motes" />
          <div className="mt-frame">
            <i className="ml-stud a" aria-hidden="true" />
            <i className="ml-stud b" aria-hidden="true" />
            <i className="ml-stud c" aria-hidden="true" />
            <i className="ml-stud d" aria-hidden="true" />
            <TraQR />
          </div>
          <span className="mt-scan">{tr("Quét bằng app ngân hàng", "Scan with your banking app")}</span>
        </div>
        <div className="mt-plaque">
          <span>
            <small>{TRA_BANK.bank}</small>
            <b>{TRA_BANK.name}</b>
            <em>{TRA_BANK.acctText}</em>
          </span>
          <button className="btn btn-red" onClick={copy}>
            
            {tr("Chép số", "Copy number")}
          </button>
        </div>
        {msg && <small className="mt-msg">{msg}</small>}
        <span className="mt-sign" aria-hidden="true">
          
          {tr("Bần đạo", "This humble Daoist")}
          <br />
          
          {tr("đa tạ", "thanks you")}
        </span>
      </div>
      <i className="mt-rod" aria-hidden="true" />
    </section>
  );
}
