'use client';

/**
 * Ngày 38 (lên 21/11, góp ý #302): kênh chat Thế giới. Tấm trượt từ dưới lên, dùng chung khung chat với Truyền âm
 * (components/chat/ChatPane.tsx), không phải hệ chat thứ hai. Gọi máy chủ và nhịp hỏi tin: lib/theGioi.ts.
 * Ai đăng nhập cũng đọc được. Gửi và báo xấu: có chân thân và đã liên kết Google; chưa đủ thì thay ô nhập bằng lý do.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import { PATHS } from '@/lib/game/data';
import { ctTitle } from '@/lib/game/chanThan';
import type { PathId } from '@/lib/game/types';
import { WC_DONG_MS, WC_MAX, WC_MO_MS, WcErr, wcLastSeen, wcList, wcLoi, wcN, wcOff, wcReport, wcSeen, wcSend, type WcLy, type WcTin } from '@/lib/theGioi';
import { ChatPane, type ChatNut } from './chat/ChatPane';
import { Sheet } from './Panels';
import Link from 'next/link';
import { realApi, type SmApi, type SmState } from '@/lib/sonmon/api';
import { SmChat, lastSeenChat } from './sonmon/SmChat';
import type { SmCtx } from './sonmon/ui';
import { hhmm } from './sonmon/ui';
import './sonmon/sonmon.css';


const code = (e: unknown) => (e instanceof WcErr ? e.code : 'WC_NET');

/** giờ VN dạng 21:30 ngày 21/11 */
function luc(iso: string) {
  const d = new Date(new Date(iso).getTime() + 7 * 3600e3);
  return `${hhmm(iso)} ${tr('ngày', 'on')} ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

/** chấm đỏ ở nút Thế giới: đếm tin mới 90 giây một lần khi tấm đóng và tab đang hiện; tab ẩn thì dừng */
export function useWcMoi(on: boolean, open: boolean): [number, () => void] {
  const [n, setN] = useState(0);
  const last = useRef(0);
  useEffect(() => {
    if (!open) return;
    setN(0); // mở tấm là đọc hết: tắt chấm ngay (tấm đã ghi số tin mới lúc mở cho wc_open)
    return () => {
      last.current = Date.now(); // vừa đóng tấm thì đã đọc hết, 90 giây sau mới đếm lại
    };
  }, [open]);
  useEffect(() => {
    if (!on || open) return;
    let live = true;
    const hoi = () => {
      if (document.hidden || wcOff()) return;
      last.current = Date.now();
      wcN(wcLastSeen()).then((x) => live && setN(x), () => {});
    };
    if (Date.now() - last.current >= WC_DONG_MS) hoi();
    const id = setInterval(hoi, WC_DONG_MS);
    const vis = () => {
      if (!document.hidden && Date.now() - last.current >= WC_DONG_MS) hoi();
    };
    document.addEventListener('visibilitychange', vis);
    return () => {
      live = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', vis);
    };
  }, [on, open]);
  return [n, () => setN(0)];
}

function WcPane({ onLink, moi }: { onLink: () => void; moi: number }) {
  const [tin, setTin] = useState<WcTin[] | null>(null);
  const [gui, setGui] = useState(false);
  const [ly, setLy] = useState<WcLy | null>(null);
  const [toi, setToi] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const cuoi = useRef(0);

  const them = useCallback((x: WcTin[]) => {
    if (!x.length) return;
    setTin((old) => {
      const all = [...(old ?? []), ...x.filter((t) => !(old ?? []).some((o) => o.id === t.id))].sort((a, b) => a.id - b.id).slice(-150);
      cuoi.current = all[all.length - 1]?.id ?? cuoi.current;
      wcSeen(cuoi.current);
      return all;
    });
  }, []);

  useEffect(() => {
    let live = true;
    let last = Date.now();
    const quyen = (x: { gui: boolean; ly: WcLy | null; toi: string | null }) => {
      setGui(x.gui);
      setLy(x.ly);
      setToi(x.toi);
    };
    wcList(0).then(
      (x) => {
        if (!live) return;
        setTin(x.tin);
        cuoi.current = x.tin[x.tin.length - 1]?.id ?? 0;
        wcSeen(cuoi.current);
        quyen(x);
        track('wc_open', { moi, gui: x.gui, ly: x.ly ?? undefined });
      },
      (e) => {
        if (!live) return;
        setTin([]);
        setErr(wcLoi(code(e)));
        track('wc_open', { moi, loi: code(e) });
      },
    );
    const hoi = () => {
      if (document.hidden) return;
      last = Date.now();
      wcList(cuoi.current).then((x) => live && (them(x.tin), quyen(x)), () => {});
    };
    const id = setInterval(hoi, WC_MO_MS);
    const vis = () => {
      if (!document.hidden && Date.now() - last >= WC_MO_MS) hoi();
    };
    document.addEventListener('visibilitychange', vis);
    return () => {
      live = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', vis);
    };
    // moi chỉ dùng để ghi sự kiện lúc mở
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [them]);

  const send = async (t: string) => {
    setErr(null);
    setOk(null);
    try {
      const x = await wcSend(t);
      them([x]);
      track('wc_send', { len: t.length });
      return true;
    } catch (e) {
      const c = code(e);
      if (c === 'WC_CAM' || c === 'WC_NO_GG' || c === 'WC_NO_CT') {
        setGui(false);
        setLy(c);
      }
      setErr(wcLoi(c));
      track('wc_send', { loi: c });
      return false;
    }
  };
  const bao = async (x: WcTin) => {
    try {
      const r = await wcReport(x.id);
      if (r.an) setTin((old) => (old ?? []).filter((t) => t.id !== x.id));
      setErr(null);
      setOk(tr('Đã báo. Đủ 3 người báo thì tin tự ẩn.', 'Reported. Three reports hide the message.'));
      track('wc_report', { an: r.an, cam: r.cam || undefined });
    } catch (e) {
      setOk(null);
      setErr(wcLoi(code(e)));
    }
  };
  const nut = (x: WcTin): ChatNut[] => (!x.ta && gui ? [{ nhan: tr('Báo xấu', 'Report'), chay: () => bao(x) }] : []);

  let khoa: ReactNode = null;
  if (tin !== null && !gui && ly) {
    khoa =
      ly === 'WC_NO_GG' || ly === 'WC_AUTH' ? (
        <div className="wc-khoa" role="note">
          <p className="wc-khoa-ly">{tr('Liên kết tài khoản để nói chuyện với thiên hạ.', 'Link your account to talk with the world.')}</p>
          <p className="sm-note">{tr('Bạn vẫn đọc được mọi tin. Liên kết Google xong là gửi được ngay.', 'You can still read everything. Link Google and you can post right away.')}</p>
          <button className="sm-btn main wide" onClick={onLink}>
            {tr('Liên kết Google', 'Link Google')}
          </button>
        </div>
      ) : ly === 'WC_NO_CT' ? (
        <div className="wc-khoa" role="note">
          <p className="wc-khoa-ly">{tr('Nhớ lại chân thân rồi mới nói chuyện được với thiên hạ.', 'Remember your true self first, then you can talk with the world.')}</p>
          <p className="sm-note">{tr('Khép lại một kiếp là nhớ lại chân thân. Trong lúc chờ, bạn vẫn đọc được mọi tin.', 'End one life to remember your true self. Until then you can still read everything.')}</p>
        </div>
      ) : (
        <div className="wc-khoa" role="note">
          <p className="wc-khoa-ly">
            {toi
              ? tr(`Bạn bị khóa chat tới ${luc(toi)}.`, `You are muted until ${luc(toi)}.`)
              : tr('Bạn đang bị khóa chat.', 'You are muted for now.')}
          </p>
          <p className="sm-note">{tr('Nhiều tin của bạn bị đạo hữu báo xấu nên tự ẩn. Hết giờ khóa là nói chuyện lại được.', 'Several of your messages were reported and hidden. You can talk again when the mute ends.')}</p>
        </div>
      );
  }

  return (
    <div className="sm wc">
        <ChatPane
          inputId="wc-in"
          tin={tin}
          head={<p className="sm-note sm-chat-head">{tr('Mọi đạo hữu trong thiên hạ đều đọc được kênh này.', 'Everyone in the world can read this channel.')}</p>}
          ai={(x) => {
            const phu = [x.p && PATHS[x.p as PathId] ? PATHS[x.p as PathId].name : null, x.mon || null].filter(Boolean).join(' · ');
            return (
              <>
                <span className="sm-tin-ai">
                  <b>{x.ta ? tr('Ta', 'Me') : x.ten}</b>
                  <i>{ctTitle()}</i>
                </span>
                {phu && <span className="wc-tin-phu">{phu}</span>}
              </>
            );
          }}
          ten={(x) => x.ten ?? ''}
          nut={nut}
          nhanh={[]}
          onSend={send}
          maxLen={WC_MAX}
          multiline
          demTu={-1}
          label={tr('Viết cho cả thiên hạ', 'Write to everyone')}
          placeholder={tr('Nói gì đó với thiên hạ...', 'Say something to the world...')}
          note={tr('Link và số điện thoại tự ẩn, lời tục bị che. Chạm tin của người khác để báo xấu.', 'Links and phone numbers are hidden, swearing is masked. Tap a message to report it.')}
          khoa={khoa}
          err={err}
          ok={ok}
          dangTai={tr('Đang nghe thiên hạ...', 'Loading...')}
          rong={tr('Thiên hạ còn im ắng. Chào một câu đi.', 'The world is quiet. Say hello.')}
          logLabel={tr('Tin kênh Thế giới', 'World chat messages')}
        />
      </div>
  );
}

/** nút Thế giới: bong bóng lời nói vẽ từng ô vuông (pixel), màu theo chữ của nút */
export function WcIcon() {
  return (
    <svg viewBox="0 0 9 9" width="15" height="15" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="1" y="0" width="7" height="1" fill="currentColor" />
      <rect x="0" y="1" width="9" height="5" fill="currentColor" />
      <rect x="1" y="6" width="7" height="1" fill="currentColor" />
      <rect x="1" y="7" width="2" height="1" fill="currentColor" />
      <rect x="1" y="8" width="1" height="1" fill="currentColor" />
      <rect x="2" y="3" width="1" height="1" fill="#1f160d" />
      <rect x="4" y="3" width="1" height="1" fill="#1f160d" />
      <rect x="6" y="3" width="1" height="1" fill="#1f160d" />
    </svg>
  );
}

/**
 * 21/11 (Tyler): tấm chat full màn, 2 tab tách bạch.
 * - Thế giới: mọi người đọc được, không có tin Sơn Môn (đã tắt trigger đẩy tin môn sang Thế giới).
 * - Sơn Môn: Truyền âm của môn mình, chỉ người trong môn đọc được (dùng lại SmChat).
 * Nhớ tab lần trước; chấm số tin mới trên từng tab.
 */
type ChatTab = 'tg' | 'sm';
const TAB_KEY = 'vkl.chatTab';

export function WcSheet({ onClose, onLink, moi, dau }: { onClose: () => void; onLink: () => void; moi: number; dau?: ChatTab }) {
  const [tab, setTab] = useState<ChatTab>(() => {
    if (dau) return dau;
    try {
      return localStorage.getItem(TAB_KEY) === 'sm' ? 'sm' : 'tg';
    } catch {
      return 'tg';
    }
  });
  const [sm, setSm] = useState<{ api: SmApi; st: SmState | null } | null>(null);
  const [smMoi, setSmMoi] = useState(0);
  useEffect(() => {
    const api = realApi();
    if (!api.linked) return setSm({ api, st: null });
    api.state().then(
      (st) => {
        setSm({ api, st });
        if (st?.mon) api.chatN(lastSeenChat()).then((n) => setSmMoi(n), () => {});
      },
      () => setSm({ api, st: null }),
    );
  }, []);
  const chon = (t: ChatTab) => {
    setTab(t);
    if (t === 'sm') setSmMoi(0);
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch {}
    track('chat_tab', { tab: t });
  };
  const nutTab = (t: ChatTab, vi: string, en: string, n: number) => (
    <button role="tab" aria-selected={tab === t} className={`chat-tab${tab === t ? ' on' : ''}`} onClick={() => chon(t)}>
      <span>{tr(vi, en)}</span>
      {n > 0 && tab !== t && <i className="chat-tab-n">{n > 99 ? '99+' : n}</i>}
    </button>
  );
  return (
    <Sheet
      title={tr('Kênh chat', 'Chat')}
      onClose={onClose}
      full
      head={
        <div className="chat-tabs" role="tablist" aria-label={tr('Kênh chat', 'Chat channels')}>
          {nutTab('tg', 'Thế giới', 'World', tab === 'tg' ? 0 : moi)}
          {nutTab('sm', 'Sơn Môn', 'Sect', smMoi)}
        </div>
      }
    >
      {tab === 'tg' ? (
        <WcPane onLink={onLink} moi={moi} />
      ) : !sm ? (
        <p className="sm-note">{tr('Đang mở Truyền âm...', 'Opening sect chat...')}</p>
      ) : sm.st?.mon ? (
        <div className="sm wc">
          <SmChat c={{ api: sm.api, st: sm.st } as unknown as SmCtx} />
        </div>
      ) : (
        <div className="wc-khoa" role="note">
          <p className="wc-khoa-ly">{tr('Bạn chưa vào sơn môn nào.', 'You are not in a sect yet.')}</p>
          <p className="sm-note">{tr('Vào một sơn môn là có kênh Truyền âm riêng, chỉ người trong môn đọc được.', 'Join a sect to get its private chat, only members can read it.')}</p>
          <Link href="/son-mon" className="sm-btn main wide" onClick={onClose}>
            {tr('Tìm sơn môn', 'Find a sect')}
          </Link>
        </div>
      )}
    </Sheet>
  );
}
