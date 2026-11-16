'use client';

/**
 * 4.6.0 Ngày 5: tab Sơn Môn. Cờ SON_MON_ON tắt (trước 18/11): chỉ màn chờ "Mở cửa 5:00 sáng 18/11", đo `sm_teaser`.
 * Cờ bật: nội dung Sơn Môn thật (components/sonmon/SonMonHome.tsx) kèm thanh tab.
 */
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SmWait } from './sonmon/SmWait';
import { TabBar, TopMenu } from './TabBar';
import { SON_MON_ON, TAB_ON } from '@/lib/flags';
import { track } from '@/lib/track';

// 16/11: bộ Sơn Môn đầy đủ chỉ tải khi cờ bật, màn chờ nhẹ không kéo theo cả bộ
const SonMonHome = dynamic(() => import('./sonmon/SonMonHome').then((m) => m.SonMonHome));

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
      <SmWait embedded />
      <TabBar cur="sm" />
    </main>
  );
}
