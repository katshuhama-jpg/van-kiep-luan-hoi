'use client';

/**
 * Khung chat dùng chung cho Truyền âm (components/sonmon/SmChat.tsx) và kênh Thế giới (components/WcSheet.tsx).
 * 20/11 Ngày 38: tách phần vẽ ra khỏi SmChat để kênh Thế giới không phải làm một hệ chat thứ hai. Dữ liệu, gọi máy chủ
 * và luật vẫn nằm ở từng nơi dùng; khung này chỉ lo: vùng tin role=log tự cuộn khi đang ở cuối, chạm tin để hiện nút,
 * tin hệ thống một dòng riêng, câu nhanh, ô nhập (một dòng hoặc nhiều dòng có đếm ký tự), hoặc dòng lý do khi bị khóa.
 * Lớp CSS giữ nguyên của Truyền âm (components/sonmon/sonmon.css) để hai nơi trông như một.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { tr } from '@/lib/i18n';
import { hhmm, Msg } from '@/components/sonmon/ui';

export type ChatTin = { id: number; luc: string; nd: string; ta?: boolean; he?: boolean; nd_en?: string | null };
export type ChatNut = { nhan: string; chay: () => void };

type Props<T extends ChatTin> = {
  /** id của ô nhập (nhãn trỏ vào) */
  inputId: string;
  tin: T[] | null;
  /** tên người gửi và dòng phụ trong bong bóng tin */
  ai: (x: T) => ReactNode;
  /** các nút hiện khi chạm vào một tin (rỗng thì chạm không mở gì) */
  nut: (x: T) => ChatNut[];
  nhanh: readonly (readonly [string, string])[];
  /** trả true khi đã gửi xong (xóa ô nhập) */
  onSend: (text: string) => Promise<boolean>;
  maxLen: number;
  multiline?: boolean;
  /** hiện "x/maxLen" khi độ dài vượt mốc này (-1: luôn hiện) */
  demTu?: number;
  label: string;
  placeholder: string;
  note: ReactNode;
  head?: ReactNode;
  /** có thì thay câu nhanh và ô nhập bằng nội dung này (lý do ghi ngay tại chỗ) */
  khoa?: ReactNode;
  err?: string | null;
  ok?: string | null;
  dangTai: string;
  rong: string;
  logLabel: string;
  className?: string;
};

export function ChatPane<T extends ChatTin>(p: Props<T>) {
  const [nd, setNd] = useState('');
  const [gui, setGui] = useState(false);
  const [mo, setMo] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const sat = useRef(true); // đang ở cuối danh sách thì tin mới tự cuộn xuống

  useEffect(() => {
    const el = box.current;
    if (el && sat.current) el.scrollTop = el.scrollHeight;
  }, [p.tin]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || gui) return;
    setGui(true);
    try {
      sat.current = true;
      if (await p.onSend(t)) setNd((cur) => (cur.trim() === t ? '' : cur));
    } finally {
      setGui(false);
    }
  };
  const bam = (x: T, n: ChatNut) => {
    setMo(null);
    n.chay();
  };
  const dem = p.demTu ?? Math.floor(p.maxLen * 0.75);

  return (
    <div className={`sm-chat${p.className ? ' ' + p.className : ''}`}>
      {p.head}
      <div
        ref={box}
        className="sm-chat-log"
        role="log"
        aria-live="polite"
        aria-label={p.logLabel}
        onScroll={(e) => {
          const el = e.currentTarget;
          sat.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        }}
      >
        {p.tin === null && <p className="sm-note">{p.dangTai}</p>}
        {p.tin !== null && p.tin.length === 0 && <p className="sm-chat-empty">{p.rong}</p>}
        {(p.tin ?? []).map((x) => {
          if (x.he)
            return (
              <p key={x.id} className="sm-tin-he">
                {tr(x.nd, x.nd_en || x.nd)} <small>{hhmm(x.luc)}</small>
              </p>
            );
          const nut = p.nut(x);
          return (
            <div key={x.id} className={`sm-tin${x.ta ? ' ta' : ''}`}>
              <button className="sm-tin-b" aria-expanded={nut.length ? mo === x.id : undefined} onClick={() => nut.length && setMo(mo === x.id ? null : x.id)}>
                {p.ai(x)}
                <span className="sm-tin-nd">{x.nd}</span>
              </button>
              {mo === x.id && nut.length > 0 && (
                <span className="sm-tin-act">
                  {nut.map((n) => (
                    <button key={n.nhan} className="sm-btn small" onClick={() => bam(x, n)}>
                      {n.nhan}
                    </button>
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {p.khoa ? (
        <>
          <Msg err={p.err} ok={p.err ? null : p.ok} />
          {p.khoa}
        </>
      ) : (
        <>
          <div className="sm-chat-nhanh" role="group" aria-label={tr('Câu nhanh', 'Quick lines')}>
            {p.nhanh.map(([vi, en]) => (
              <button key={vi} className="sm-chip" disabled={gui} onClick={() => send(tr(vi, en))}>
                {tr(vi, en)}
              </button>
            ))}
          </div>
          <Msg err={p.err} ok={p.err ? null : p.ok} />
          <form
            className="sm-chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              send(nd);
            }}
          >
            <label htmlFor={p.inputId}>{p.label}</label>
            <div className="sm-row">
              {p.multiline ? (
                <textarea
                  id={p.inputId}
                  className="sm-grow"
                  value={nd}
                  maxLength={p.maxLen}
                  rows={nd.includes('\n') || nd.length > 60 ? 3 : 1}
                  enterKeyHint="send"
                  autoComplete="off"
                  onChange={(e) => setNd(e.target.value)}
                  onKeyDown={(e) => {
                    // máy có chuột: Enter gửi, Shift+Enter xuống dòng. Điện thoại: Enter xuống dòng, gửi bằng nút.
                    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
                    if (typeof matchMedia === 'function' && !matchMedia('(pointer: fine)').matches) return;
                    e.preventDefault();
                    send(nd);
                  }}
                  placeholder={p.placeholder}
                />
              ) : (
                <input
                  id={p.inputId}
                  className="sm-grow"
                  value={nd}
                  maxLength={p.maxLen}
                  enterKeyHint="send"
                  autoComplete="off"
                  onChange={(e) => setNd(e.target.value)}
                  placeholder={p.placeholder}
                />
              )}
              <button className="sm-btn main" type="submit" disabled={gui || !nd.trim()}>
                {tr('Gửi', 'Send')}
              </button>
            </div>
            <small className="sm-note">
              {nd.length > dem ? <span className="sm-chat-dem">{tr(`${nd.length}/${p.maxLen} chữ. `, `${nd.length}/${p.maxLen}. `)}</span> : ''}
              {p.note}
            </small>
          </form>
        </>
      )}
    </div>
  );
}
