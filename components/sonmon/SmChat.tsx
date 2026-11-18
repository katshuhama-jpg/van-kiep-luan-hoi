'use client';

/**
 * 17/11 (Tyler: "Làm chat tự do trong Sơn môn cho xôm"): Truyền âm - chat trong môn.
 * Máy chủ: supabase/son_mon_chat_2026_11_18.sql (chỉ người trong môn đọc/gửi; che từ tục, ẩn link và số điện thoại,
 * 1 tin mỗi 3 giây, 15 tin mỗi phút; ẩn tin; báo xấu 3 lần thì tự ẩn).
 * Không dùng kênh realtime: hỏi tin mới 5 giây một lần khi màn đang mở và tab đang hiện (đủ cho môn 15 người, rẻ, không đổi cấu hình).
 * UI (uiux-pro-max): nhãn nhìn thấy cho ô nhập, chữ 16px (iOS không tự phóng to), nút 48px, vùng tin role=log, tin mình bên phải.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import { SmErr, type SmChat as Tin } from '@/lib/sonmon/api';
import { SM_LOI } from '@/lib/sonmon/data';
import { chucTen, hhmm, Msg, type SmCtx } from './ui';

export const CHAT_SEEN = 'vkl.sm.chatSeen';
const NHANH = [
  ['Chào cả môn!', 'Hello, everyone!'],
  ['Đã điểm danh.', 'Checked in.'],
  ['Ai rảnh sang giữ ô với!', 'Anyone free to help guard?'],
  ['Tối nay đánh ô nào?', 'Which tile tonight?'],
] as const;

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
  const [nd, setNd] = useState('');
  const [gui, setGui] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mo, setMo] = useState<number | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const cuoi = useRef(0);
  const sat = useRef(true); // đang ở cuối danh sách thì tin mới tự cuộn xuống

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

  useEffect(() => {
    const el = box.current;
    if (el && sat.current) el.scrollTop = el.scrollHeight;
  }, [tin]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || gui) return;
    setGui(true);
    setErr(null);
    try {
      const x = await c.api.chatSend(t);
      sat.current = true;
      them([x]);
      setNd('');
      track('sm_chat', { len: t.length, nhanh: NHANH.some(([vi, en]) => vi === t || en === t) || undefined });
    } catch (e) {
      setErr(loi(e));
    } finally {
      setGui(false);
    }
  };
  const an = async (x: Tin) => {
    setMo(null);
    try {
      await c.api.chatHide(x.id);
      setTin((old) => (old ?? []).filter((t) => t.id !== x.id));
      track('sm_chat_an', { ta: x.ta });
    } catch (e) {
      setErr(loi(e));
    }
  };
  const bao = async (x: Tin) => {
    setMo(null);
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

  return (
    <div className="sm-chat">
      <p className="sm-note sm-chat-head">{tr(`Truyền âm: chỉ người trong ${m.ten} đọc được.`, `Sect chat: only members of ${m.ten} can read this.`)}</p>

      <div ref={box} className="sm-chat-log" role="log" aria-live="polite" aria-label={tr('Tin truyền âm', 'Chat messages')} onScroll={(e) => {
        const el = e.currentTarget;
        sat.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      }}>
        {tin === null && <p className="sm-note">{tr('Đang nghe truyền âm...', 'Loading...')}</p>}
        {tin !== null && tin.length === 0 && <p className="sm-chat-empty">{tr('Chưa ai truyền âm. Chào cả môn một câu đi.', 'No messages yet. Say hello to your sect.')}</p>}
        {(tin ?? []).map((x) =>
          x.he ? (
            <p key={x.id} className="sm-tin-he">
              {tr(x.nd, x.nd_en || x.nd)} <small>{hhmm(x.luc)}</small>
            </p>
          ) : (
          <div key={x.id} className={`sm-tin${x.ta ? ' ta' : ''}`}>
            <button className="sm-tin-b" aria-expanded={mo === x.id} onClick={() => setMo(mo === x.id ? null : x.id)}>
              <span className="sm-tin-ai">
                <b>{x.ta ? tr('Ta', 'Me') : x.ten}</b>
                {x.chuc && x.chuc !== 'de' && <i>{chucTen(x.chuc)}</i>}
                <small>{hhmm(x.luc)}</small>
              </span>
              <span className="sm-tin-nd">{x.nd}</span>
            </button>
            {mo === x.id && (
              <span className="sm-tin-act">
                {(x.ta || quyen) && (
                  <button className="sm-btn small" onClick={() => an(x)}>
                    {x.ta ? tr('Xóa tin', 'Delete') : tr('Ẩn tin', 'Hide')}
                  </button>
                )}
                {!x.ta && (
                  <button className="sm-btn small" onClick={() => bao(x)}>
                    {tr('Báo xấu', 'Report')}
                  </button>
                )}
              </span>
            )}
          </div>
          ),
        )}
      </div>

      <div className="sm-chat-nhanh" role="group" aria-label={tr('Câu nhanh', 'Quick lines')}>
        {NHANH.map(([vi, en]) => (
          <button key={vi} className="sm-chip" disabled={gui} onClick={() => send(tr(vi, en))}>
            {tr(vi, en)}
          </button>
        ))}
      </div>
      <Msg err={err} ok={err ? null : ok} />
      <form
        className="sm-chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          send(nd);
        }}
      >
        <label htmlFor="sm-chat-in">{tr('Viết cho cả môn', 'Write to your sect')}</label>
        <div className="sm-row">
          <input
            id="sm-chat-in"
            className="sm-grow"
            value={nd}
            maxLength={200}
            enterKeyHint="send"
            autoComplete="off"
            onChange={(e) => setNd(e.target.value)}
            placeholder={tr('Ví dụ: tối nay ai giữ Lạc Hà?', 'e.g. who guards tonight?')}
          />
          <button className="sm-btn main" type="submit" disabled={gui || !nd.trim()}>
            {tr('Gửi', 'Send')}
          </button>
        </div>
        <small className="sm-note">
          {nd.length > 150 ? tr(`${nd.length}/200 chữ. `, `${nd.length}/200. `) : ''}
          {tr('Link và số điện thoại tự ẩn, lời tục bị che. Chạm một tin để ẩn hoặc báo xấu.', 'Links and phone numbers are hidden, swearing is masked. Tap a message to hide or report it.')}
        </small>
      </form>
    </div>
  );
}
