'use client';

import { useState, type ReactElement } from 'react';
import { TRA_BANK, TRA_QR } from '@/lib/moiTra';
import { track } from '@/lib/track';

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
    <svg className="tra-qr" viewBox={`0 0 ${n + Q * 2} ${n + Q * 2}`} width={size} height={size} shapeRendering="crispEdges" role="img" aria-label={`Mã QR chuyển khoản ${TRA_BANK.bank} ${TRA_BANK.acctText}`}>
      <rect width={n + Q * 2} height={n + Q * 2} fill="#f3e6c4" />
      {cells}
    </svg>
  );
}

/** Khối "Mời tác giả chén trà" ở trang Tác giả */
export default function MoiTra() {
  const [msg, setMsg] = useState<string | null>(null);
  async function copy() {
    track('tra_copy');
    try {
      await navigator.clipboard.writeText(TRA_BANK.acct);
      setMsg('Đã chép số tài khoản.');
    } catch {
      setMsg('Máy không cho chép, giữ ngón tay lên số tài khoản để chép.');
    }
  }
  return (
    <section className="panel moi-tra" id="moi-tra">
      <div className="mt-head">
        <span className="mt-seal" aria-hidden="true">
          Trà
        </span>
        <span>
          <h2>Mời tác giả chén trà</h2>
          <small>Tu tiên cũng cần trà nóng. Game miễn phí, không quảng cáo, không nạp.</small>
        </span>
      </div>
      <p className="mt-text">Nếu đạo hữu thấy vui, mời tác giả một chén trà để có thêm sức gõ phím, nuôi máy chủ và vẽ thêm kỳ ngộ. Mời hay không, giang hồ vẫn như nhau: không có quà, không có đặc quyền gì trong game.</p>
      <div className="mt-card">
        <TraQR />
        <dl>
          <dt>Ngân hàng</dt>
          <dd>{TRA_BANK.bank}</dd>
          <dt>Chủ tài khoản</dt>
          <dd>{TRA_BANK.name}</dd>
          <dt>Số tài khoản</dt>
          <dd className="mt-acct">{TRA_BANK.acctText}</dd>
        </dl>
        <button className="btn" onClick={copy}>
          Chép số tài khoản
        </button>
        {msg && <small className="note">{msg}</small>}
      </div>
      <small className="note">Mở app ngân hàng, quét mã là được. Đa tạ đạo hữu.</small>
    </section>
  );
}
