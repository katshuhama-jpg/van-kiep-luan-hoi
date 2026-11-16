'use client';

/**
 * 16/11 tối (Tyler yêu cầu): người mới tự tìm sư phụ, không cần link mời.
 * SuTimSheet: danh sách tối đa 8 sư phụ đang chơi (máy chủ chọn), bấm Bái sư. Khách: nhớ lựa chọn, đăng ký xong tự bái.
 * SuDoHome: khối quảng bá Sư Đồ ở tab Mộng (người cũ: mời đệ tử; người mới: tìm sư phụ).
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Player } from '@/lib/auth';
import { SU_DO_ON } from '@/lib/flags';
import { suChon, suInfo, suTim, type SuTim } from '@/lib/suDo';
import { loadAll } from '@/lib/storage';
import { track } from '@/lib/track';
import { tr } from '@/lib/i18n';

const HOUR = 3600000;
function luc(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - Date.parse(iso);
  if (ms < HOUR) return tr('vừa chơi', 'just played');
  if (ms < 24 * HOUR) return tr(`chơi ${Math.floor(ms / HOUR)} giờ trước`, `played ${Math.floor(ms / HOUR)}h ago`);
  return tr(`chơi ${Math.floor(ms / (24 * HOUR))} ngày trước`, `played ${Math.floor(ms / (24 * HOUR))}d ago`);
}
const LOI: Record<string, string> = {
  SU_DONE: tr('Ngươi đã có sư phụ rồi.', 'You already have a master.'),
  SU_OLD: tr('Chỉ tài khoản mới (dưới 8 ngày, chưa quá 5 kiếp) mới bái sư được.', 'Only new accounts (under 8 days, at most 5 lives) can take a master.'),
  SU_SELF: tr('Không bái người này được.', 'You cannot take this master.'),
  SU_NONE: tr('Không tìm thấy người này.', 'This player was not found.'),
  SU_AUTH: tr('Phiên đăng nhập đã hết, hãy đăng nhập lại.', 'Your session ended, please log in again.'),
  SU_NET: tr('Mạng chập chờn, thử lại sau.', 'Network trouble, try again later.'),
};

export function SuTimSheet({ user, onClose, onDone }: { user: Player | null; onClose: () => void; onDone?: (ten: string) => void }) {
  const [d, setD] = useState<SuTim | null | 'loi'>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [guest, setGuest] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    suTim(user).then((x) => live && setD(x ?? 'loi'));
    track('su_tim_open', { guest: !user });
    return () => {
      live = false;
    };
  }, [user]);
  const pick = async (ten: string) => {
    setBusy(ten);
    const r = await suChon(user, ten);
    setBusy(null);
    if (r === 'GUEST') return setGuest(ten);
    if (r === 'OK') {
      onDone?.(ten);
      return onClose();
    }
    setMsg(LOI[r] ?? LOI.SU_NET);
  };
  return (
    <div className="drawer-bg su-tim-bg" onClick={onClose}>
      <section className="su-tim" role="dialog" aria-modal="true" aria-label={tr('Tìm sư phụ', 'Find a master')} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <b>{tr('Tìm sư phụ', 'Find a master')}</b>
          <button className="btn drawer-x" aria-label={tr('Đóng', 'Close')} onClick={onClose}>
            ×
          </button>
        </div>
        <div className="su-tim-body">
          <p className="su-tim-lead">{tr('Bái một đạo hữu đã chơi lâu làm sư phụ. Chơi xong 10 kiếp (sống tới 16 tuổi) trong 7 ngày là thành tài: ngươi và sư phụ mỗi người +20 phúc duyên.', 'Take a seasoned player as your master. Finish 10 lives (reaching age 16) within 7 days to graduate: you and your master each get +20 Fortune.')}</p>
          {d === null && <p>{tr('Đang tìm...', 'Searching...')}</p>}
          {d === 'loi' && <p>{tr('Chưa tải được danh sách. Thử lại sau.', 'Could not load the list. Try again later.')}</p>}
          {d && d !== 'loi' && user && !d.can && <p className="su-tim-warn">{LOI.SU_OLD} {tr('Nếu đã có sư phụ, xem ở tab Nhân vật.', 'If you already have one, see the Character tab.')}</p>}
          {guest && (
            <div className="su-tim-guest" role="status">
              <p>{tr(`Đã chọn ${guest}. Tạo tài khoản (miễn phí) để bái sư; xong là tự bái, không cần làm lại.`, `You chose ${guest}. Create a free account to take them as master; it happens automatically.`)}</p>
              <Link href="/dang-nhap" className="btn btn-dark" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
                {tr('Đăng ký / Đăng nhập', 'Sign up / Log in')}
              </Link>
            </div>
          )}
          {msg && (
            <p className="su-tim-warn" role="alert">
              {msg}
            </p>
          )}
          {d && d !== 'loi' && d.ds.length === 0 && <p>{tr('Lúc này chưa có sư phụ nào đang rảnh. Quay lại sau nhé.', 'No master is free right now. Come back later.')}</p>}
          {d && d !== 'loi' && (
            <ul className="su-tim-list">
              {d.ds.map((x) => (
                <li key={x.ten} className="su-item">
                  <span className="su-item-h">
                    <b>{x.phap_danh ?? x.ten}</b>
                    <small>@{x.ten}</small>
                  </span>
                  <span className="su-item-s">
                    {tr(`${x.kiep} kiếp · ${x.huyet}/10 huyệt · ${x.tai} đệ tử thành tài · ${luc(x.choi_luc)}`, `${x.kiep} lives · ${x.huyet}/10 points · ${x.tai} graduated · ${luc(x.choi_luc)}`)}
                  </span>
                  <button className="btn su-tim-go" disabled={!!busy || (!!user && !d.can)} onClick={() => pick(x.ten)}>
                    {busy === x.ten ? '...' : tr('Bái sư', 'Take as master')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

/**
 * Khối Sư Đồ ở tab Mộng. Người đã chơi từ 20 kiếp và có chân thân: mời đệ tử. Người mới (chưa quá 5 kiếp, chưa có sư phụ): tìm sư phụ.
 * Người ở giữa hoặc đã có sư phụ: không hiện gì, để trang đầu gọn.
 */
export function SuDoHome({ user, ready }: { user: Player | null; ready: boolean }) {
  const [mode, setMode] = useState<'moi' | 'tim' | null>(null);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  useEffect(() => {
    if (!SU_DO_ON || !ready) return;
    let live = true;
    (async () => {
      const { meta } = await loadAll(user).catch(() => ({ meta: null }));
      if (!live || !meta) return;
      const lives = meta.lives ?? 0;
      if (lives >= 20 && meta.chanThan) return user ? setMode('moi') : undefined;
      if (lives > 5) return;
      if (user) {
        const info = await suInfo(user);
        if (!live || info?.su) return;
      }
      // máy chủ chưa có danh sách (hoặc lỗi mạng) thì không quảng bá phần tìm
      const t = await suTim(user);
      if (!live || !t || (user && !t.can)) return;
      setMode('tim');
    })();
    return () => {
      live = false;
    };
  }, [user, ready]);
  if (!mode) return null;
  return (
    <section className="su-home" aria-label={tr('Sư Đồ', 'Master and Disciple')}>
      <span className="su-home-ic" aria-hidden="true" />
      <span className="su-home-t">
        <b>{mode === 'moi' ? tr('Thu nhận đệ tử', 'Take disciples') : done ? tr(`Đã bái ${done} làm sư phụ`, `${done} is now your master`) : tr('Bái sư học đạo', 'Find a master')}</b>
        <small>
          {mode === 'moi'
            ? tr('Mời bạn bè chơi bằng link của ngươi. Đệ tử chơi đủ 10 kiếp trong 7 ngày: thầy trò mỗi người +20 phúc duyên.', 'Invite friends with your link. When a disciple finishes 10 lives in 7 days, you both get +20 Fortune.')
            : tr('Người mới chọn một sư phụ đang chơi. Đủ 10 kiếp trong 7 ngày: thầy trò mỗi người +20 phúc duyên.', 'New players pick an active master. Finish 10 lives in 7 days: you both get +20 Fortune.')}
        </small>
      </span>
      {mode === 'moi' ? (
        <Link href="/chan-than#su-do" className="btn su-home-go" onClick={() => track('su_home_tap', { mode })}>
          {tr('Mời đệ tử', 'Invite')}
        </Link>
      ) : (
        !done && (
          <button className="btn su-home-go" onClick={() => (setOpen(true), track('su_home_tap', { mode }))}>
            {tr('Tìm sư phụ', 'Find master')}
          </button>
        )
      )}
      {open && <SuTimSheet user={user} onClose={() => setOpen(false)} onDone={setDone} />}
    </section>
  );
}
