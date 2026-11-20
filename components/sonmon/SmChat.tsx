'use client';

/**
 * 17/11 (Tyler: "Làm chat tự do trong Sơn môn cho xôm"): Truyền âm - chat trong môn.
 * Máy chủ: supabase/son_mon_chat_2026_11_18.sql (chỉ người trong môn đọc/gửi; che từ tục, ẩn link và số điện thoại,
 * 1 tin mỗi 3 giây, 15 tin mỗi phút; ẩn tin; báo xấu 3 lần thì tự ẩn).
 * Không dùng kênh realtime: hỏi tin mới 5 giây một lần khi màn đang mở và tab đang hiện (đủ cho môn 15 người, rẻ, không đổi cấu hình).
 * UI (uiux-pro-max): nhãn nhìn thấy cho ô nhập, chữ 16px (iOS không tự phóng to), nút 48px, vùng tin role=log, tin mình bên phải.
 * 20/11 Ngày 38: phần vẽ dời sang components/chat/ChatPane.tsx, dùng chung với kênh Thế giới.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import { SmErr, type SmChat as Tin } from '@/lib/sonmon/api';
import { SM_LOI } from '@/lib/sonmon/data';
import { ChatPane, type ChatNut } from '@/components/chat/ChatPane';
import { chucTen, hhmm, type SmCtx } from './ui';

export const CHAT_SEEN = 'vkl.sm.chatSeen';

export function seenChat(id: number) {
  try {
    if (id > Number(localStorage.getItem(CHAT_SEEN) ?? 0)) localStorage.setItem(CHAT_SEEN, String(id));
  } catch {}
}
export function lastSeenChat(): number {
  try {
    return Number(localStorage.getItem(CHAT_SEEN) ?? 0) || 0;
  } catch {
    return 0;
  }
}

const loi = (e: unknown) => SM_LOI[e instanceof SmErr ? e.code : 'SM_NET'] ?? tr('Chưa gửi được, thử lại sau.', 'Could not send, try again.');

export function SmChat({ c }: { c: SmCtx }) {
  const m = c.st.mon!;
  const [tin, setTin] = useState<Tin[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const cuoi = useRef(0);

  const them = useCallback((x: Tin[]) => {
    if (!x.length) return;
    setTin((old) => {
      const all = [...(old ?? []), ...x.filter((t) => !(old ?? []).some((o) => o.id === t.id))].sort((a, b) => a.id - b.id).slice(-120);
      cuoi.current = all[all.length - 1]?.id ?? cuoi.current;
      seenChat(cuoi.current);
      return all;
    });
  }, []);

  useEffect(() => {
    let live = true;
    c.api.chatList(0).then(
      (x) => {
        if (!live) return;
        setTin(x);
        cuoi.current = x[x.length - 1]?.id ?? 0;
        seenChat(cuoi.current);
      },
      (e) => live && (setTin([]), setErr(loi(e))),
    );
    const id = setInterval(() => {
      if (document.hidden) return;
      c.api.chatList(cuoi.current).then((x) => live && them(x), () => {});
    }, 5000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [c.api, them]);

  const send = async (t: string) => {
    setErr(null);
    try {
      const x = await c.api.chatSend(t);
      them([x]);
      track('sm_chat', { len: t.length });
      return true;
    } catch (e) {
      setErr(loi(e));
      return false;
    }
  };
  const an = async (x: Tin) => {
    try {
      await c.api.chatHide(x.id);
      setTin((old) => (old ?? []).filter((t) => t.id !== x.id));
      track('sm_chat_an', { ta: x.ta });
    } catch (e) {
      setErr(loi(e));
    }
  };
  const bao = async (x: Tin) => {
    try {
      const r = await c.api.chatReport(x.id);
      if (r.an) setTin((old) => (old ?? []).filter((t) => t.id !== x.id));
      setErr(null);
      track('sm_chat_bao', { an: r.an });
      setOk(tr('Đã báo. Đủ 3 người báo thì tin tự ẩn.', 'Reported. Three reports hide the message.'));
    } catch (e) {
      setErr(loi(e));
    }
  };
  const quyen = m.chuc === 'chu' || m.chuc === 'lao';
  const nut = (x: Tin): ChatNut[] => [
    ...(x.ta || quyen ? [{ nhan: x.ta ? tr('Xóa tin', 'Delete') : tr('Ẩn tin', 'Hide'), chay: () => an(x) }] : []),
    ...(!x.ta ? [{ nhan: tr('Báo xấu', 'Report'), chay: () => bao(x) }] : []),
  ];

  return (
    <ChatPane
      inputId="sm-chat-in"
      tin={tin}
      head={<p className="sm-note sm-chat-head">{tr(`Truyền âm: chỉ người trong ${m.ten} đọc được.`, `Sect chat: only members of ${m.ten} can read this.`)}</p>}
      ai={(x) => (
        <span className="sm-tin-ai">
          <b>{x.ta ? tr('Ta', 'Me') : x.ten}</b>
          {x.chuc && x.chuc !== 'de' && <i>{chucTen(x.chuc)}</i>}
          <small>{hhmm(x.luc)}</small>
        </span>
      )}
      nut={nut}
      nhanh={[]}
      onSend={send}
      maxLen={200}
      demTu={150}
      label={tr('Viết cho cả môn', 'Write to your sect')}
      placeholder={tr('Ví dụ: tối nay ai giữ Lạc Hà?', 'e.g. who guards tonight?')}
      note={tr('Link và số điện thoại tự ẩn, lời tục bị che. Chạm một tin để ẩn hoặc báo xấu.', 'Links and phone numbers are hidden, swearing is masked. Tap a message to hide or report it.')}
      err={err}
      ok={ok}
      dangTai={tr('Đang nghe truyền âm...', 'Loading...')}
      rong={tr('Chưa ai truyền âm. Chào cả môn một câu đi.', 'No messages yet. Say hello to your sect.')}
      logLabel={tr('Tin truyền âm', 'Chat messages')}
    />
  );
}
