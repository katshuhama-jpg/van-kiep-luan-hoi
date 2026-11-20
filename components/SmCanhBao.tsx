'use client';

/**
 * 20/11 12h (Tyler): đợt yêu thú 12:00 không ai sang giữ ô vì người chơi không mở bản đồ. Dải cảnh báo nằm ngay trên thanh tab,
 * hiện ở mọi trang (trừ tab Sơn Môn, ở đó trang môn đã có thẻ cảnh báo) khi ô của môn mình sắp bị đánh: yêu thú hoặc môn khác.
 * Gọi vkl_sm_canh lúc mở trang và mỗi 3 phút khi trang đang hiện; nhớ kết quả 90 giây trong sessionStorage để đổi tab
 * không gọi lại. Bấm "Sang giữ" mở Chiến sự; bấm x thì ẩn đòn đó.
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import { SON_MON_ON } from '@/lib/flags';

export type SmCanh = { k: 'yeu' | 'mon'; id: number; o: string; toi: string; luc?: number; trieu?: boolean; tu?: string };
const CACHE = 'vkl.sm.canh';
const AN = 'vkl.sm.canhAn';

const gio = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function useSmCanh(): SmCanh[] {
  const { user } = useAuth();
  const token = user?.token;
  const [ds, setDs] = useState<SmCanh[]>([]);
  useEffect(() => {
    if (!SON_MON_ON || !token) return;
    let live = true;
    const load = async (force = false) => {
      try {
        const c = JSON.parse(sessionStorage.getItem(CACHE) ?? 'null') as { t: number; ds: SmCanh[] } | null;
        if (!force && c && Date.now() - c.t < 90_000) {
          if (live) setDs(c.ds);
          return;
        }
      } catch {}
      const sb = supabase();
      if (!sb) return;
      try {
        const r = await sb.rpc('vkl_sm_canh', { p_token: token });
        if (r.error || !live) return;
        const v = ((r.data ?? []) as SmCanh[]).filter((x) => new Date(x.toi).getTime() > Date.now());
        setDs(v);
        try {
          sessionStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), ds: v }));
        } catch {}
      } catch {}
    };
    load();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') load(true);
    }, 180_000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [token]);
  return ds.filter((x) => new Date(x.toi).getTime() > Date.now());
}

export function SmCanhBao({ ds }: { ds: SmCanh[] }) {
  const [an, setAn] = useState<string[]>([]);
  useEffect(() => {
    try {
      setAn(JSON.parse(localStorage.getItem(AN) ?? '[]'));
    } catch {}
  }, []);
  const x = ds.find((d) => !an.includes(`${d.k}${d.id}`));
  useEffect(() => {
    if (x) track('sm_canh_hien', { k: x.k });
  }, [x?.k, x?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!x) return null;
  const tat = () => {
    const v = [...an, `${x.k}${x.id}`].slice(-30);
    setAn(v);
    try {
      localStorage.setItem(AN, JSON.stringify(v));
    } catch {}
    track('sm_canh_tat', { k: x.k });
  };
  const ai = x.k === 'yeu' ? (x.trieu ? tr('Thú triều', 'Beast tide') : tr('Yêu thú', 'Beasts')) : x.tu ?? tr('Môn khác', 'A sect');
  return (
    <div className="sm-cb" role="alert">
      <span className="sm-cb-dau" aria-hidden="true">!</span>
      <p>
        <b>{tr(`${ai} sắp đánh ${x.o}`, `${ai} will hit ${x.o}`)}</b>
        <small>{tr(`lúc ${gio(x.toi)} · sang đứng giữ ô`, `at ${gio(x.toi)} · go guard it`)}</small>
      </p>
      <Link href="/son-mon?m=chien-su" className="sm-cb-di" onClick={() => track('sm_canh_bam', { k: x.k })}>
        {tr('Sang giữ', 'Guard')}
      </Link>
      <button className="sm-cb-x" onClick={tat} aria-label={tr('Ẩn cảnh báo này', 'Hide this alert')}>
        ×
      </button>
    </div>
  );
}
