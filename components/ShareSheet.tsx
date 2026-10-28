'use client';

import { useState } from 'react';
import { copyText, shareTargets, type ShareOut } from '@/lib/shareCard';
import { track } from '@/lib/track';
import { tr } from '@/lib/i18n';

/**
 * Bảng khoe trong game: nút đi thẳng Threads, Facebook, Messenger, chép link (dán Zalo),
 * và "Cách khác" mở bảng chia sẻ của máy. Link /k/<mã> dán lên mạng sẽ hiện hình nhân vật.
 */
export default function ShareSheet({ out, kind, onClose }: { out: ShareOut; kind: 'life' | 'match'; onClose: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  if (!out.link) return null;
  const link = out.link;
  const t = shareTargets(link, out.text);
  const go = (to: string) => track('share_to', { kind, to });
  async function copy() {
    go('copy');
    setMsg((await copyText(`${out.text}\n${link}`)) ? tr('Đã chép chữ kèm link. Dán vào Zalo hay nhóm chat là hiện hình nhân vật.', "Text and link copied. Paste it into Zalo or a group chat and your character's portrait shows up.") : tr('Máy không cho chép, giữ ngón tay lên link bên dưới để chép.', "Your device won't allow copying - long-press the link below to copy it."));
  }
  async function more() {
    go('native');
    try {
      await navigator.share({ title: out.title, text: out.text, url: link });
    } catch {}
  }
  return (
    <div className="ss-wrap" role="dialog" aria-modal="true" aria-label={tr("Khoe lên mạng", "Show off online")} onClick={onClose}>
      <div className="ss-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ss-head">
          <b>{tr("Khoe lên mạng", "Show off online")}</b>
          <button className="ss-x" onClick={onClose} aria-label={tr("Đóng", "Close")}>
            ✕
          </button>
        </div>
        <p className="ss-title">{out.title}</p>
        <div className="ss-grid">
          <a className="ss-btn threads" href={t.threads} target="_blank" rel="noopener noreferrer" onClick={() => go('threads')}>
            Threads
          </a>
          <a className="ss-btn facebook" href={t.facebook} target="_blank" rel="noopener noreferrer" onClick={() => go('facebook')}>
            Facebook
          </a>
          <a className="ss-btn messenger" href={t.messenger} onClick={() => go('messenger')}>
            Messenger
          </a>
          <button className="ss-btn copy" onClick={copy}>
            
            {tr("Chép link (Zalo)", "Copy link (Zalo)")}
          </button>
        </div>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button className="ss-more" onClick={more}>
            
            {tr("Cách khác...", "Other ways...")}
          </button>
        )}
        <code className="ss-link">{link}</code>
        {msg && <small className="note">{msg}</small>}
      </div>
    </div>
  );
}
