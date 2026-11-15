'use client';

/**
 * 4.6.0 Sư Đồ: khối nhỏ ở màn Chân thân. Sư phụ của ngươi và tiến độ thành tài, số đệ tử, danh hiệu sư phụ,
 * nút Mời đệ tử (thẻ chia sẻ có hình chân thân), nhận phúc duyên thưởng khi có đệ tử thành tài.
 */
import { useEffect, useRef, useState } from 'react';
import ShareSheet from '@/components/ShareSheet';
import type { Player } from '@/lib/auth';
import { shareSuDo } from '@/lib/ctCard';
import type { Meta } from '@/lib/game/types';
import type { ShareOut } from '@/lib/shareCard';
import { metaWritable } from '@/lib/storage';
import { suClaim, suInfo, suTitle, type SuInfo } from '@/lib/suDo';
import { track } from '@/lib/track';
import { tr } from '@/lib/i18n';

const DAY = 86400000;

export default function SuDoPanel({ user, meta, onGain }: { user: Player | null; meta: Meta; onGain: (n: number) => Promise<void> }) {
  const [info, setInfo] = useState<SuInfo | null>(null);
  const [gain, setGain] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [out, setOut] = useState<ShareOut | null>(null);
  const asked = useRef<string | null>(null);

  useEffect(() => {
    if (!user || asked.current === user.username) return;
    asked.current = user.username;
    // không hủy khi unmount: lệnh nhận thưởng đã gửi thì phải cộng xong vào hồ sơ
    (async () => {
      const x = await suInfo(user);
      if (!x) return;
      setInfo(x);
      // chỉ nhận khi hồ sơ ghi được lên máy chủ, nếu không phúc duyên vừa nhận sẽ mất
      if (x.cho_nhan > 0 && metaWritable()) {
        const n = await suClaim(user);
        if (n > 0) {
          await onGain(n);
          track('su_done', { n });
          setGain(n);
          setInfo({ ...x, cho_nhan: 0 });
        }
      }
    })().catch(() => {});
  }, [user, onGain]);

  const title = info ? suTitle(info.thanh_tai_n) : null;
  const left = info?.han ? Math.ceil((Date.parse(info.han) - Date.now()) / DAY) : 0;
  return (
    <section className="panel su-do" aria-label={tr('Sư Đồ', 'Master and Disciple')}>
      <h3 className="su-h">
        {tr('Sư Đồ', 'Master and Disciple')}
        {title && <span className="su-title">{title}</span>}
      </h3>
      {gain > 0 && <p className="su-gain">{tr(`+${gain} phúc duyên từ Sư Đồ`, `+${gain} Fortune from Master and Disciple`)}</p>}
      {info && (
        <dl className="su-rows">
          {info.su && (
            <>
              <dt>{tr('Sư phụ', 'Master')}</dt>
              <dd>
                {info.su.phap_danh ? `${info.su.phap_danh} ` : ''}
                <small>@{info.su.ten}</small>
                <br />
                <small>
                  {info.thanh_tai
                    ? tr('Ngươi đã thành tài.', 'You have graduated.')
                    : left > 0
                      ? tr(`${Math.min(info.kiep, 10)}/10 kiếp, còn ${left} ngày`, `${Math.min(info.kiep, 10)}/10 lives, ${left} day${left === 1 ? '' : 's'} left`)
                      : tr(`${Math.min(info.kiep, 10)}/10 kiếp, đã hết hạn`, `${Math.min(info.kiep, 10)}/10 lives, time is up`)}
                </small>
              </dd>
            </>
          )}
          <dt>{tr('Đệ tử', 'Disciples')}</dt>
          <dd>
            {info.de_tu} <small>{tr(`(thành tài ${info.thanh_tai_n})`, `(${info.thanh_tai_n} graduated)`)}</small>
          </dd>
        </dl>
      )}
      <button
        className="btn su-invite"
        disabled={!user || drawing}
        onClick={async () => {
          if (!user) return;
          setDrawing(true);
          track('su_invite', { n: info?.de_tu ?? 0 });
          const r = await shareSuDo(meta, user.username).catch(() => null);
          setDrawing(false);
          if (r?.link) setOut(r);
        }}
      >
        {drawing ? tr('Đang vẽ thẻ...', 'Drawing your card...') : tr('Mời đệ tử', 'Invite a disciple')}
      </button>
      <small className="su-sub">
        {user
          ? tr('Bạn mới vào bằng link của ngươi và chơi xong 10 kiếp trong 7 ngày: mỗi người +20 phúc duyên.', 'A new player who joins through your link and finishes 10 lives in 7 days: you each get +20 Fortune.')
          : tr('Đăng nhập để có link mời', 'Log in to get an invite link')}
      </small>
      {out && <ShareSheet out={out} kind="life" onClose={() => setOut(null)} />}
    </section>
  );
}
