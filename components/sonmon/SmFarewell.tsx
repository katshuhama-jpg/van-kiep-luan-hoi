'use client';

/**
 * 4.6.0 Ngày 3: một dòng Khí vận ở màn cáo biệt kiếp (giấu sau cờ SON_MON_ON).
 * Có môn: "Kiếp này góp +N Khí vận cho <môn>" (tính trước từ nhiệm vụ ngày; máy chủ cộng thật khi bia được ghi).
 * Chưa có môn: "Vào một sơn môn để mỗi kiếp góp Khí vận".
 */
import { useEffect, useState } from 'react';
import { SON_MON_ON } from '@/lib/flags';
import { currentPlayer } from '@/lib/auth';
import { realApi, type SmState } from '@/lib/sonmon/api';
import { tr } from '@/lib/i18n';

export function SmFarewell({ age, realm }: { age: number; realm: number }) {
  const [st, setSt] = useState<SmState | null | 'none'>(null);
  useEffect(() => {
    if (!SON_MON_ON || !currentPlayer()) return;
    realApi()
      .state()
      .then((s) => setSt(s?.ky_chay ? s : 'none'))
      .catch(() => setSt('none'));
  }, []);
  if (!SON_MON_ON || !st || st === 'none') return null;
  const mon = st.mon;
  if (!mon) return <p className="ctf-line sm-fw">{tr('Vào một sơn môn để mỗi kiếp góp Khí vận.', 'Join a sect so every life adds Fortune to it.')}</p>;
  const nv = st.nv;
  let add = 0;
  if (nv && age >= 16) {
    const now = [nv.kiep + 1 >= nv.muc[0], Math.max(nv.tuoi, age) >= nv.muc[1], Math.max(nv.canh, realm) >= nv.muc[2]];
    now.forEach((ok, i) => {
      if (ok && !nv.xong[i]) add += nv.thuong[i];
    });
  }
  return (
    <p className="ctf-line sm-fw">
      {add > 0
        ? tr(`Kiếp này góp +${add} Khí vận cho ${mon.ten}.`, `This life adds +${add} Fortune to ${mon.ten}.`)
        : age < 16
          ? tr(`Kiếp chết trước 16 tuổi không góp Khí vận cho ${mon.ten}.`, `Lives that end before 16 add no Fortune to ${mon.ten}.`)
          : tr(`Kiếp này chưa xong thêm nhiệm vụ nào của ${mon.ten}.`, `This life finished no new task for ${mon.ten}.`)}
    </p>
  );
}
