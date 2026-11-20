/**
 * 20/11 (Tyler duyệt đợt đồ họa 2): cảnh tông môn từ Cultivation World Simulator (4thfever, CC BY-NC-SA 4.0),
 * ghi công ở /tac-gia. Ảnh giữ nguyên nội dung, chỉ đổi sang webp cho nhẹ. Mỗi môn một cảnh cố định theo mã môn.
 */
import { tr } from '@/lib/i18n';
import { HuyHieu } from './Pixel';

export const CANH_N = 14;
export const canhSo = (id: number) => (((id - 1) % CANH_N) + CANH_N) % CANH_N + 1;

/** Ảnh lớn đầu thẻ Môn nhà */
export function CanhBanner({ id }: { id: number }) {
  return <img className="sm-canh" src={`/cws/mon/s${canhSo(id)}.webp`} alt={tr('Cảnh sơn môn', 'Sect scenery')} width={512} height={512} loading="lazy" decoding="async" />;
}

/** Ảnh nhỏ trong danh sách môn, huy hiệu đặt ở góc */
export function CanhThumb({ id, huy, size = 64 }: { id: number; huy: number; size?: number }) {
  return (
    <span className="sm-canh-t" style={{ width: size, height: size }}>
      <img src={`/cws/mon/t${canhSo(id)}.webp`} alt="" width={size} height={size} loading="lazy" decoding="async" />
      <span className="sm-canh-hh">
        <HuyHieu id={huy} size={26} />
      </span>
    </span>
  );
}
