'use client';

/**
 * 4.6.0 Sơn Môn Tranh Bá: điểm vào chính (trang /son-mon và nội dung tab Sơn Môn).
 * Giấu sau cờ SON_MON_ON: cờ tắt thì chỉ hiện màn chờ, không gọi máy chủ, không lộ nội dung môn.
 * Màn: ?m=list|lap|chon-o|mon|ban-do|xuat-chinh|chien-su|thanh-vien|ky|luc-chien (hoặc state nội bộ khi nhúng trong tab).
 * Dữ liệu giả `?demo=<vai>` chỉ có khi chạy dev (xem lib/sonmon/demo.ts).
 */
import './sonmon.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BackButton from '@/components/BackButton';
import { SON_MON_ON } from '@/lib/flags';
import { SmWait } from './SmWait';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import { realApi, SmErr, smLoi, type SmAct, type SmApi, type SmMap, type SmMembers, type SmMonRow, type SmRankRow, type SmState, type SmDai } from '@/lib/sonmon/api';
import { smNgay } from '@/lib/sonmon/data';
import { SmLuat } from './SmLuat';
import { lastSeenChat, SmChat } from './SmChat';
import { SM_VIEWS, type SmCtx, type SmDraft, type SmView } from './ui';
import { SmChuaMo, SmGuest, SmNoCt } from './SmEntry';
import { SmList } from './SmList';
import { SmChonO, SmLap } from './SmFound';
import { SmMonNha } from './SmMonNha';
import { SmBanDo } from './SmMap';
import { SmChienSu, SmXuatChinh } from './SmWar';
import { SmThanhVien } from './SmMembers';
import { SmKy, SmLucChien } from './SmKy';
import { SmThuong } from './SmThuong';
import { khaiDuoc } from './SmMap';
import { VIEC_KEY, VIEC_SEEN } from '@/components/TabBar';

const IN_MON: SmView[] = ['mon', 'chat', 'ban-do', 'chien-su', 'thanh-vien', 'ky'];
const NAV: { v: SmView; vi: string; en: string }[] = [
  { v: 'mon', vi: 'Môn', en: 'Sect' },
  // 17/11: Truyền âm thay chỗ Kỷ trên thanh mục (giữ 5 mục); Kỷ mở từ thẻ môn ở màn Môn và từ màn Luật
  { v: 'chat', vi: 'Truyền âm', en: 'Chat' },
  { v: 'ban-do', vi: 'Bản đồ', en: 'Map' },
  { v: 'chien-su', vi: 'Chiến sự', en: 'War' },
  { v: 'thanh-vien', vi: 'Thành viên', en: 'Members' },
];

function readParam(k: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(location.search).get(k);
  } catch {
    return null;
  }
}

function useSmApi(): SmApi | null {
  const [api, setApi] = useState<SmApi | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const vai = readParam('demo');
      if (vai) {
        import('@/lib/sonmon/demo').then((m) => setApi(m.demoApi(vai)));
        return;
      }
    }
    setApi(realApi());
  }, []);
  return api;
}

export function SonMonHome({ embedded = false }: { embedded?: boolean }) {
  if (!SON_MON_ON) return <SmWait embedded={embedded} />;
  return <SonMonInner embedded={embedded} />;
}
export default SonMonHome;

function SonMonInner({ embedded }: { embedded: boolean }) {
  const api = useSmApi();
  const [view, setView] = useState<SmView>(() => {
    const m = readParam('m') as SmView | null;
    return m && SM_VIEWS.includes(m) ? m : 'mon';
  });
  const [target, setTarget] = useState<[number, number] | null>(null);
  const [draft, setDraft] = useState<SmDraft | null>(null);
  const [st, setSt] = useState<SmState | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [list, setList] = useState<SmMonRow[] | null>(null);
  const [map, setMap] = useState<SmMap | null>(null);
  const [members, setMembers] = useState<SmMembers | null>(null);
  const [rank, setRank] = useState<SmRankRow[] | null>(null);
  const [dai, setDai] = useState<SmDai | null>(null);
  const [busy, setBusy] = useState(false);
  const [chatMoi, setChatMoi] = useState(0);
  const opened = useRef(false);

  const loadState = useCallback(async () => {
    if (!api) return;
    if (!api.linked) return setErr('SM_AUTH');
    try {
      const s = await api.state();
      setSt(s);
      setErr(null);
    } catch (e) {
      setErr(e instanceof SmErr ? e.code : 'SM_NET');
    }
  }, [api]);

  const reload = useCallback(
    (what: ('state' | 'list' | 'map' | 'members' | 'rank')[] = ['state']) => {
      if (!api || !api.linked) return;
      if (what.includes('state')) loadState();
      if (what.includes('list')) api.list().then(setList, () => setList((x) => x ?? []));
      if (what.includes('map')) {
        api.map().then(setMap, () => {});
        api.dai?.().then(setDai, () => {});
      }
      if (what.includes('members')) api.members().then(setMembers, () => {});
      if (what.includes('rank')) api.rank().then(setRank, () => setRank((x) => x ?? []));
    },
    [api, loadState],
  );

  useEffect(() => {
    if (!api) return;
    if (!api.linked) setErr('SM_AUTH');
    else reload(['state']);
  }, [api, reload]);

  // màn hiện tại theo trạng thái (chưa có môn thì không vào được các màn trong môn)
  const coMon = !!st?.mon;
  const v: SmView = useMemo(() => {
    if (!st) return view;
    if (!coMon) return ['lap', 'chon-o', 'ky', 'luc-chien', 'luat', 'ban-do', 'thuong'].includes(view) ? view : 'list'; // 18/11: chưa có môn vẫn xem được bản đồ (chỉ xem)
    if (view === 'list' || view === 'lap') return 'mon';
    if (view === 'chon-o' && (st.mon!.cam_co || st.mon!.chuc === 'de')) return 'mon';
    return view;
  }, [st, coMon, view]);

  // nạp dữ liệu phụ theo màn
  useEffect(() => {
    if (!st || !st.ky) return;
    const need: ('list' | 'map' | 'members' | 'rank')[] = [];
    if ((v === 'list' || (v === 'ban-do' && !coMon)) && !list) need.push('list');
    if (['chon-o', 'ban-do', 'xuat-chinh', 'chien-su', 'mon'].includes(v) && !map) need.push('map');
    if (['thanh-vien', 'chien-su', 'xuat-chinh', 'ban-do'].includes(v) && coMon && !members) need.push('members');
    if (['ky', 'mon'].includes(v) && !rank) need.push('rank');
    if (need.length) reload(need);
  }, [v, st, coMon, list, map, members, rank, reload]);

  // làm mới 60 giây một lần khi tab trình duyệt đang hiện; dừng khi ẩn
  useEffect(() => {
    if (!api || !api.linked) return;
    const extra = (): ('state' | 'map' | 'members' | 'list')[] =>
      v === 'list' ? ['state', 'list'] : ['ban-do', 'xuat-chinh', 'chon-o'].includes(v) ? ['state', 'map'] : v === 'chien-su' ? ['state', 'members'] : ['state'];
    const id = setInterval(() => {
      if (!document.hidden) reload(extra());
    }, 60_000);
    const onVis = () => {
      if (!document.hidden) reload(extra());
    };
    document.addEventListener('visibilitychange', onVis);
    // 18/11: có mạng lại thì tự tải lại (trước phải bấm Thử lại)
    window.addEventListener('online', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', onVis);
    };
  }, [api, v, reload]);

  // 17/11 Truyền âm: đếm tin mới của người khác (chấm ở mục Truyền âm); 60 giây một lần, không hỏi khi đang ở màn chat
  useEffect(() => {
    if (!api || !api.linked || !coMon) return;
    if (v === 'chat') return setChatMoi(0);
    const hoi = () => {
      if (!document.hidden) api.chatN(lastSeenChat()).then(setChatMoi, () => {});
    };
    hoi();
    const id = setInterval(hoi, 60_000);
    return () => clearInterval(id);
  }, [api, coMon, v]);

  // đo: mở màn Sơn Môn (một lần mỗi lần vào)
  useEffect(() => {
    if (!api || opened.current || (!st && !err)) return;
    opened.current = true;
    track('sm_open', { v, mon: !!st?.mon, err: err ?? undefined, demo: api.demo || undefined, embedded: embedded || undefined });
  }, [api, st, err, v, embedded]);

  // đo: nhiệm vụ ngày vừa xong (trigger máy chủ đánh dấu, máy khách thấy khi làm mới) và trận vừa xong
  useEffect(() => {
    if (!st?.mon) return;
    try {
      const day = smNgay();
      const k = `vkl.sm.nv.${day}`;
      const seen: boolean[] = JSON.parse(localStorage.getItem(k) ?? '[false,false,false]');
      const xong = st.nv?.xong ?? [false, false, false];
      xong.forEach((x, i) => {
        if (x && !seen[i]) track('sm_nv_done', { i, bac: st.nv?.bac });
      });
      localStorage.setItem(k, JSON.stringify(xong.map((x, i) => x || seen[i])));
      const last = Number(localStorage.getItem('vkl.sm.bao') ?? '0');
      const moi = (st.bao ?? []).filter((b) => b.id > last && b.loai === 'tran');
      if (last > 0)
        moi.forEach((b) => {
          const danh = b.a === st.mon!.id;
          const thang = danh ? b.nd?.kq === 'thang' : b.nd?.kq === 'thua';
          track('sm_battle', { kq: thang ? 'thang' : 'thua', ben: danh ? 'danh' : 'giu' });
        });
      const maxId = Math.max(last, ...(st.bao ?? []).map((b) => b.id));
      if (maxId > 0) localStorage.setItem('vkl.sm.bao', String(maxId));
    } catch {}
  }, [st]);

  // Ngày 8: ghi việc cho chấm đỏ tab Sơn Môn (đất trống kề lãnh thổ, môn đang bị đánh). Mở bản đồ là đã xem đất hiện có.
  useEffect(() => {
    if (!st?.mon) return;
    try {
      const kh = st.mon.cam_co && st.mon.o < st.mon.o_max && map ? [...khaiDuoc(st, map)].sort().join(';') : '';
      const sig = kh ? `${st.mon.id}|${kh}` : '';
      localStorage.setItem(VIEC_KEY, JSON.stringify({ sig, bi: (st.bi_danh?.length ?? 0) > 0, t: Date.now() }));
      if (v === 'ban-do' && sig) {
        if (localStorage.getItem(VIEC_SEEN) !== sig) track('sm_dot_dat', {});
        localStorage.setItem(VIEC_SEEN, sig);
      }
    } catch {}
  }, [st, map, v]);

  const go = useCallback(
    (nv: SmView, o?: { target?: [number, number] }) => {
      if (o?.target) setTarget(o.target);
      setView(nv);
      if (!embedded) {
        try {
          const sp = new URLSearchParams(location.search);
          sp.set('m', nv);
          history.replaceState(null, '', `${location.pathname}?${sp.toString()}`);
        } catch {}
      }
      if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
    },
    [embedded],
  );

  const run = useCallback(
    async (a: SmAct, after?: (r: Record<string, unknown>) => void) => {
      if (!api) return smLoi(null);
      setBusy(true);
      try {
        const r = await api.act(a);
        after?.(r);
        await loadState();
        return null;
      } catch (e) {
        return smLoi(e);
      } finally {
        setBusy(false);
      }
    },
    [api, loadState],
  );

  let body: React.ReactNode;
  if (!api || (!st && !err)) body = <p className="sm-note">{tr('Đang mở sơn môn...', 'Opening the sects...')}</p>;
  else if (err === 'SM_AUTH') body = <SmGuest />;
  else if (err === 'SM_NO_CT') body = <SmNoCt />;
  else if (err || !st)
    body = (
      <section className="sm-card">
        <p className="sm-err">{smLoi(new SmErr(err ?? 'SM_NET'))}</p>
        <button className="sm-btn wide" onClick={() => reload(['state'])}>
          {tr('Thử lại', 'Try again')}
        </button>
      </section>
    );
  else if (!st.ky || !st.ky_chay) body = <SmChuaMo st={st} />;
  else {
    const ctx: SmCtx = { api, st, list, map, members, rank, dai, go, target, draft, setDraft, run, busy, reload };
    body = (
      <>
        {coMon && IN_MON.includes(v) && <SmNav v={v} go={go} st={st} chatMoi={chatMoi} />}
        {v === 'list' && <SmList c={ctx} />}
        {v === 'lap' && <SmLap c={ctx} />}
        {v === 'chon-o' && <SmChonO c={ctx} />}
        {v === 'mon' && <SmMonNha c={ctx} />}
        {v === 'ban-do' && <SmBanDo c={ctx} />}
        {v === 'xuat-chinh' && <SmXuatChinh c={ctx} />}
        {v === 'chien-su' && <SmChienSu c={ctx} />}
        {v === 'thanh-vien' && <SmThanhVien c={ctx} />}
        {v === 'ky' && <SmKy c={ctx} />}
        {v === 'luc-chien' && <SmLucChien c={ctx} />}
        {v === 'luat' && <SmLuat c={ctx} />}
        {v === 'chat' && <SmChat c={ctx} />}
        {v === 'thuong' && <SmThuong c={ctx} />}
      </>
    );
  }

  if (embedded) return <div className="sm">{body}</div>;
  return (
    <main className="app sm">
      <header className="topbar">
        <div className="topbar-row sm-top">
          {/* Ngày 7: màn lập môn và chọn ô chỉ còn một nút quay lại (trước có hai), quay về bước trước trong Sơn Môn */}
          {v === 'lap' || v === 'chon-o' ? (
            <button className="icon-btn" aria-label={tr('Quay lại', 'Back')} onClick={() => go(v === 'lap' ? 'list' : coMon ? 'mon' : 'lap')}>
              ‹
            </button>
          ) : (
            <BackButton fallback="/choi" />
          )}
          <span className="sm-title">
            {tr('Sơn Môn', 'Sects')}
            {st?.ky ? tr(` · Kỷ ${st.ky.id}`, ` · Era ${st.ky.id}`) : ''}
          </span>
          {api?.demo && <span className="sm-note" style={{ color: '#d9c69a' }}>demo</span>}
        </div>
      </header>
      {body}
    </main>
  );
}

function SmNav({ v, go, st, chatMoi }: { v: SmView; go: SmCtx['go']; st: SmState; chatMoi: number }) {
  const biDanh = (st.bi_danh?.length ?? 0) > 0;
  const donCho = (st.mon?.don_cho ?? 0) > 0;
  return (
    <nav className="sm-nav" aria-label={tr('Mục Sơn Môn', 'Sect sections')}>
      {NAV.map((n) => (
        <button key={n.v} aria-current={v === n.v ? 'page' : undefined} onClick={() => go(n.v)}>
          {tr(n.vi, n.en)}
          {((n.v === 'chien-su' && biDanh) || (n.v === 'thanh-vien' && donCho) || (n.v === 'chat' && chatMoi > 0)) && <span className="sm-dot" aria-label={tr('có việc mới', 'new')} />}
        </button>
      ))}
    </nav>
  );
}
