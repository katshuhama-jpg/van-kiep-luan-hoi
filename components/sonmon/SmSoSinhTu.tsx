'use client';

/**
 * 4.6.0 Sơn Môn, Ngày 6: mục "Sơn môn các Kỷ" ở Sổ Sinh Tử. Chỉ hiện khi cờ SON_MON_ON bật (trang gọi kiểm cờ).
 * Đọc vkl_sm_ky_kq(): hạng 1 khắc tên (chữ vàng), hạng 2-3 khung tên vàng. Chưa có Kỷ nào kết thì ghi một dòng.
 */
import { useEffect, useState } from 'react';
import { tr } from '@/lib/i18n';
import { smKyKq, type SmKyKq } from '@/lib/sonmon/admin';
import { HuyHieu } from './Pixel';

const ngay = (iso: string) => {
  const d = new Date(new Date(iso).getTime() + 7 * 3600e3);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
};

export function SmSoSinhTu() {
  const [ds, setDs] = useState<SmKyKq[] | null>(null);
  useEffect(() => {
    smKyKq().then(setDs);
  }, []);
  return (
    <section className="panel" style={{ marginTop: 10 }}>
      <h2>{tr('Sơn môn các Kỷ', 'Sects of each era')}</h2>
      {!ds ? null : ds.length === 0 ? (
        <p className="note" style={{ marginTop: 0 }}>{tr('Chưa Kỷ nào khép lại. Hết Kỷ, môn chiếm nhiều ô đất nhất trên bản đồ được khắc tên ở đây.', 'No era has ended yet. When one ends, the sect holding the most tiles is engraved here.')}</p>
      ) : (
        ds.map((k) => (
          <div key={k.ky} style={{ marginTop: 8 }}>
            <p className="note" style={{ margin: '0 0 4px' }}>
              {tr(`Kỷ ${k.ky} (${ngay(k.bat_dau)} - ${ngay(k.ket_thuc)})`, `Era ${k.ky} (${ngay(k.bat_dau)} - ${ngay(k.ket_thuc)})`)}
            </p>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {k.mon.slice(0, 5).map((m) => (
                <li
                  key={m.hang}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 6px',
                    border: m.khac || m.vang ? '3px solid #c9a227' : '2px solid transparent',
                    background: m.khac ? '#2a2238' : undefined,
                    color: m.khac ? '#f2d16b' : undefined,
                  }}
                >
                  <b style={{ minWidth: 22, textAlign: 'right' }}>{m.hang}</b>
                  <HuyHieu id={m.huy_hieu} size={28} label={m.ten} />
                  <span style={{ flex: 1, minWidth: 0, fontWeight: m.khac ? 700 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.ten}</span>
                  <small style={{ whiteSpace: 'nowrap' }}>{tr(`${m.o} ô`, `${m.o} tiles`)}</small>
                </li>
              ))}
            </ol>
          </div>
        ))
      )}
    </section>
  );
}
