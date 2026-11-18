'use client';

/**
 * Ngày 8a: trang Chân thân, mục "Pháp bảo Sơn Môn": 2 ô (Vũ khí, Phụ kiện). Trống thì ghi khi nào nhận.
 * Chạm một món để mặc, chạm món đang mặc để tháo. Chỉ hiện khi cờ Sơn Môn bật và đã liên kết tài khoản.
 */
import './sonmon.css';
import { useEffect, useState } from 'react';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import { SON_MON_ON } from '@/lib/flags';
import { baoVatDs, baoVatMac, smLoi, type SmBaoVat } from '@/lib/sonmon/api';
import { BaoVatO, bvPham } from './BaoVat';

const O: { id: 'vu_khi' | 'phu_kien'; vi: string; en: string }[] = [
  { id: 'vu_khi', vi: 'Vũ khí', en: 'Weapon' },
  { id: 'phu_kien', vi: 'Phụ kiện', en: 'Accessory' },
];

export function SmPhapBao({ linked }: { linked: boolean }) {
  const [ds, setDs] = useState<SmBaoVat[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!SON_MON_ON || !linked) return;
    baoVatDs().then(setDs);
  }, [linked]);
  if (!SON_MON_ON || !linked || ds === null) return null;
  const mac = async (b: SmBaoVat) => {
    setBusy(true);
    setErr(null);
    try {
      setDs(await baoVatMac(b.id));
      track('sm_bv_mac', { o: b.o, pham: b.pham, thao: b.mac });
    } catch (e) {
      setErr(smLoi(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel">
      <h3 style={{ margin: '0 0 6px' }}>{tr('Pháp bảo Sơn Môn', 'Sect treasures')}</h3>
      <div className="sm-bv-o2">
        {O.map((o) => {
          const dang = ds.find((b) => b.o === o.id && b.mac);
          return (
            <div key={o.id} className={dang ? 'sm-bv-slot' : 'sm-bv-slot trong'}>
              <BaoVatO loai={dang?.loai ?? null} pham={dang?.pham ?? 'pham'} size={28} />
              <div style={{ minWidth: 0, fontSize: 14, lineHeight: 1.3 }}>
                <b style={{ display: 'block' }}>{tr(o.vi, o.en)}</b>
                {dang ? (
                  <span>{tr(`+${dang.pct}% Lực chiến Sơn Môn ở Kỷ ${dang.ky + 1}`, `+${dang.pct}% sect power in era ${dang.ky + 1}`)}</span>
                ) : (
                  <span>{ds.some((b) => b.o === o.id) ? tr('Chạm một món bên dưới để mặc', 'Tap an item below to wear') : tr('Kết Kỷ 1 (21:00 1/12) nhận', 'Earned when Era 1 ends (Dec 1, 9 PM)')}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {ds.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {ds.map((b) => (
            <button key={b.id} className="sm-bv-slot" disabled={busy} onClick={() => mac(b)} aria-pressed={b.mac}>
              <BaoVatO loai={b.loai} pham={b.pham} size={28} />
              <span style={{ minWidth: 0, flex: 1, fontSize: 14, lineHeight: 1.3 }}>
                <b style={{ display: 'block', color: bvPham(b.pham).chu }}>{b.ten}</b>
                <span>{b.khac}</span>
              </span>
              <b style={{ fontSize: 14 }}>{b.mac ? tr('Tháo', 'Remove') : tr('Mặc', 'Wear')}</b>
            </button>
          ))}
        </div>
      )}
      {err && <p className="sm-err" style={{ marginTop: 6 }}>{err}</p>}
    </section>
  );
}
