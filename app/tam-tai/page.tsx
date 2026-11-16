'use client';

/**
 * Tab Tam Tài (16/11, Tyler yêu cầu): tách khỏi trang đầu (thẻ đen chân thân) và trang Nhân vật.
 * Trên: sân khấu nền đen cùng cỡ với tab Nhân vật, chân thân với các chấm huyệt vàng. Dưới: cách khai huyệt và bảng Tam Tài.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import BackButton from '@/components/BackButton';
import { TamTaiReview } from '@/components/ChanThan';
import { HuyetBar, HuyetBody, TamTaiBoard, useCtExt } from '@/components/TamTai';
import { CHAN_THAN_ON, TAB_ON } from '@/lib/flags';
import { TabBar, TopMenu } from '@/components/TabBar';
import { huyetCount, huyetGiftsNow, nextHuyet, tamTaiCount } from '@/lib/game/khaiMach';
import type { Meta } from '@/lib/game/types';
import { loadAll } from '@/lib/storage';
import { useAuth } from '@/lib/useAuth';
import { track } from '@/lib/track';
import { tr } from '@/lib/i18n';

export default function TamTaiPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [help, setHelp] = useState(false);
  const ext = useCtExt(user, CHAN_THAN_ON);
  const viewed = useRef(false);
  useEffect(() => {
    if (!CHAN_THAN_ON) router.replace('/');
  }, [router]);
  useEffect(() => {
    if (!CHAN_THAN_ON || !ready) return;
    loadAll(user)
      .then(({ meta: m }) => setMeta(m))
      .catch(() => {});
  }, [ready, user]);
  useEffect(() => {
    if (meta?.chanThan && !viewed.current) {
      viewed.current = true;
      track('huyet_view', { from: 'tam_tai', n: huyetCount(meta) });
    }
  }, [meta]);
  if (!CHAN_THAN_ON) return null;
  const ct = meta?.chanThan ?? null;
  const h = meta ? nextHuyet(meta) : null;
  const n = meta ? huyetCount(meta) : 0;
  const gifts = meta ? huyetGiftsNow(meta) : '';
  // vẽ chân thân không mang đồ để chấm huyệt không bị vũ khí, cánh che
  const bare = ct ? { ...ct, gear: undefined } : null;
  return (
    <main className={`app ct-page${TAB_ON ? ' has-tabs' : ''}`}>
      {TAB_ON && <TopMenu at="tt" />}
      <header className="topbar">
        <div className="topbar-row">
          <BackButton />
          <span className="age-big" style={{ fontSize: 26 }}>
            {tr('Tam Tài', 'Three Treasures')}
          </span>
          <button className="icon-btn" aria-label={tr('Xem lại Tam Tài Đồ', 'Review the Three Treasures')} onClick={() => (track('huyet_intro_open', { from: 'tam_tai' }), setHelp(true))}>
            ?
          </button>
        </div>
      </header>
      {!meta && <p>{tr('Đang tìm chân thân...', 'Looking for your true self...')}</p>}
      {meta && !ct && (
        <section className="panel">
          <p>{tr('Ngươi chưa nhớ lại chân thân. Hãy khép lại một giấc mộng trước đã.', 'You have not yet remembered your true self. Let one dream end first.')}</p>
          <Link href="/choi" className="btn" style={{ display: 'block', textDecoration: 'none' }}>
            {tr('Vào luân hồi', 'Enter the cycle')}
          </Link>
        </section>
      )}
      {meta && ct && (
        <>
          <section className="panel ct-dark nv-panel">
            <div className="nv-stage tt">
              <span className="nv-name">{ct.name}</span>
              <span className="tt-count">{tr(`Tam Tài ${tamTaiCount(meta, ext)}/42`, `Treasures ${tamTaiCount(meta, ext)}/42`)}</span>
              <div className="nv-me">
                <HuyetBody ct={bare!} open={n} size={170} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 2px' }}>
              <HuyetBar n={n} />
            </div>
            <p style={{ textAlign: 'center', margin: '4px 0' }}>{tr(`Thân: ${n}/10 huyệt`, `Body: ${n}/10 points`)}</p>
            <p className="tt-gift">{gifts ? tr(`Đang hưởng: ${gifts}`, `Enjoying: ${gifts}`) : tr('Chưa khai huyệt nào', 'No point open yet')}</p>
            {h && (
              <div className="ct-how">
                <p className="ct-how-h">{tr('Khai huyệt chơi thế nào?', 'How do points open?')}</p>
                <ol className="ct-how-steps">
                  <li>{tr('Vào một kiếp mới, chơi như mọi khi.', 'Start a new life and play as usual.')}</li>
                  <li>{tr(`Kiếp nào ${h.task}, lúc kiếp đó kết thúc thì huyệt ${h.name} sáng.`, `In any life where you ${h.task}, the ${h.name} point lights up when that life ends.`)}</li>
                  <li>{tr('Huyệt đã sáng giúp mọi kiếp sau mạnh hơn một chút. Mỗi kiếp sáng tối đa một huyệt.', 'Lit points make every later life a little stronger. At most one point per life.')}</li>
                </ol>
                <Link href="/choi" className="btn" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }} onClick={() => track('huyet_go_play', { from: 'tam_tai', n })}>
                  {tr('Vào kiếp mới', 'Start a new life')}
                </Link>
              </div>
            )}
          </section>
          <section className="panel ct-dark">
            <TamTaiBoard meta={meta} ext={ext} onHelp={() => (track('huyet_intro_open', { from: 'bang' }), setHelp(true))} />
          </section>
        </>
      )}
      {help && meta && <TamTaiReview meta={meta} from="tam_tai" onClose={() => setHelp(false)} />}
      {TAB_ON && <TabBar cur="tt" />}
    </main>
  );
}
