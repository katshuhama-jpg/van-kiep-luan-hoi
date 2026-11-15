'use client';

/**
 * 4.6.0 Ngày 5: tab Sơn Môn. Cờ SON_MON_ON tắt (trước 18/11): chỉ màn chờ "Mở cửa 5:00 sáng 18/11", đo `sm_teaser`.
 * Cờ bật: nội dung Sơn Môn thật (components/sonmon/SonMonHome.tsx) kèm thanh tab.
 */
import { useEffect } from 'react';
import { SonMonHome } from './sonmon/SonMonHome';
import { TabBar, TopMenu } from './TabBar';
import { SON_MON_ON, TAB_ON } from '@/lib/flags';
import { track } from '@/lib/track';

export default function SonMonTab() {
  useEffect(() => {
    if (!SON_MON_ON) track('sm_teaser');
  }, []);
  if (SON_MON_ON) {
    return (
      <div className={TAB_ON ? 'has-tabs-wrap' : undefined}>
        <SonMonHome />
        {TAB_ON && <TabBar cur="sm" />}
      </div>
    );
  }
  return (
    <main className="app has-tabs">
      <TopMenu at="sm" />
      <SonMonHome embedded />
      <TabBar cur="sm" />
    </main>
  );
}
