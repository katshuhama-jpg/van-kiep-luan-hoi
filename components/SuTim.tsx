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
import { SU_BOUND_EV, suGui, suHop, suInfo, suTim, suTimSu, type SuHop, type SuSuUng } from '@/lib/suDo';
import { SU_LOI, SuHopList, SuTimDeSheet, SuTimO, suLuc, useTim } from './SuMoi';
import { loadAll } from '@/lib/storage';
import { track } from '@/lib/track';
import { tr } from '@/lib/i18n';

/**
 * 18/11: tìm theo tên trong toàn bộ danh sách sư phụ, bấm "Xin bái sư" gửi lời xin; sư phụ nhận mới thành thầy trò.
 * Lời mời của sư phụ gửi tới ngươi hiện ở đầu (Nhận / Từ chối). Khách: mời đăng ký trước.
 */
export function SuTimSheet({ user, onClose, onDone }: { user: Player | null; onClose: () => void; onDone?: (ten: string) => void }) {
  const { q, setQ, d, setD } = useTim((s) => suTimSu(user, s), [user]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [guest, setGuest] = useState(false);
  const [hop, setHop] = useState<SuHop | null>(null);
  useEffect(() => {
    track('su_tim_open', { guest: !user });
    suHop(user).then(setHop);
  }, [user]);
  const xin = async (x: SuSuUng) => {
    if (!user) return setGuest(true);
    setBusy(x.ten);
    const r = await suGui(user, x.ten, 'xin');
    setBusy(null);
    if (r === 'OK' || r === 'SU_DA_GUI') {
      // sư phụ đã mời mình trước đó thì máy chủ nhận luôn
      const info = await suInfo(user);
      if (info?.su) {
        try {
          window.dispatchEvent(new CustomEvent(SU_BOUND_EV, { detail: info.su.ten }));
        } catch {}
        onDone?.(info.su.ten);
        return onClose();
      }
      setMsg(tr(`Đã gửi lời xin tới ${x.phap_danh ?? x.ten}. Sư phụ nhận là thành thầy trò.`, `Request sent to ${x.phap_danh ?? x.ten}. Once accepted, they are your master.`));
      if (d && d !== 'loi') setD({ ...d, ds: d.ds.map((y) => (y.ten === x.ten ? { ...y, da_xin: true } : y)) });
    } else setMsg(SU_LOI[r] ?? SU_LOI.SU_NET);
  };
  const moi = hop ? { den: hop.den.filter((t) => t.loai === 'moi'), di: [] } : null;
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
          {moi && moi.den.length > 0 && (
            <>
              <h4 className="su-hop-h">{tr('Sư phụ mời ngươi', 'Masters inviting you')}</h4>
              <SuHopList
                user={user}
                hop={moi}
                onChange={(ten) => {
                  if (ten) {
                    onDone?.(ten);
                    return onClose();
                  }
                  suHop(user).then(setHop);
                }}
              />
            </>
          )}
          <p className="su-tim-lead">{tr('Bái một đạo hữu đã chơi lâu làm sư phụ. Bấm Xin bái sư, sư phụ nhận là thành thầy trò. Chơi xong 10 kiếp (sống tới 16 tuổi) trong 7 ngày là thành tài: ngươi và sư phụ mỗi người +20 phúc duyên.', 'Take a seasoned player as your master. Send a request; once they accept, you are master and disciple. Finish 10 lives (reaching age 16) within 7 days to graduate: you both get +20 Fortune.')}</p>
          <SuTimO q={q} setQ={setQ} label={tr('Tìm sư phụ theo tên', 'Search masters by name')} />
          {d === null && <p>{tr('Đang tìm...', 'Searching...')}</p>}
          {d === 'loi' && <p>{tr('Chưa tải được danh sách. Thử lại sau.', 'Could not load the list. Try again later.')}</p>}
          {d && d !== 'loi' && user && !d.can && <p className="su-tim-warn">{SU_LOI.SU_OLD} {tr('Nếu đã có sư phụ, xem ở tab Nhân vật.', 'If you already have one, see the Character tab.')}</p>}
          {guest && (
            <div className="su-tim-guest" role="status">
              <p>{tr('Tạo tài khoản (miễn phí) để gửi lời xin bái sư.', 'Create a free account to send a request.')}</p>
              <Link href="/dang-nhap" className="btn btn-dark" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
                {tr('Đăng ký / Đăng nhập', 'Sign up / Log in')}
              </Link>
            </div>
          )}
          {msg && (
            <p className="su-tim-warn" role="status">
              {msg}
            </p>
          )}
          {d && d !== 'loi' && d.ds.length === 0 && <p>{q ? tr('Không có sư phụ nào khớp tên này.', 'No master matches that name.') : tr('Lúc này chưa có sư phụ nào đang rảnh. Quay lại sau nhé.', 'No master is free right now. Come back later.')}</p>}
          {d && d !== 'loi' && (
            <ul className="su-tim-list">
              {d.ds.map((x) => (
                <li key={x.ten} className="su-item">
                  <span className="su-item-h">
                    <b>{x.phap_danh ?? x.ten}</b>
                    <small>@{x.ten}</small>
                  </span>
                  <span className="su-item-s">
                    {tr(`${x.kiep} kiếp · ${x.huyet}/10 huyệt · ${x.tai} đệ tử thành tài · ${suLuc(x.choi_luc)}`, `${x.kiep} lives · ${x.huyet}/10 points · ${x.tai} graduated · ${suLuc(x.choi_luc)}`)}
                  </span>
                  <button className="btn su-tim-go" disabled={!!busy || (!!user && !d.can) || x.da_xin} onClick={() => xin(x)}>
                    {busy === x.ten ? '...' : x.da_xin ? tr('Đã xin', 'Requested') : tr('Xin bái sư', 'Ask')}
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
  // 18/11: số lời mời (người mới) / lời xin bái sư (sư phụ) đang chờ
  const [nCho, setNCho] = useState(0);
  const [timDe, setTimDe] = useState(false);
  useEffect(() => {
    if (!mode || !user) return;
    let live = true;
    suHop(user).then((h) => live && h && setNCho(h.den.filter((t) => t.loai === (mode === 'tim' ? 'moi' : 'xin')).length));
    return () => {
      live = false;
    };
  }, [mode, user, open, timDe]);
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
        <b>
          {mode === 'moi'
            ? nCho > 0
              ? tr(`${nCho} người xin bái ngươi làm sư phụ`, `${nCho} want you as their master`)
              : tr('Thu nhận đệ tử', 'Take disciples')
            : done
              ? tr(`Đã bái ${done} làm sư phụ`, `${done} is now your master`)
              : nCho > 0
                ? tr(`${nCho} sư phụ mời ngươi làm đệ tử`, `${nCho} masters invite you`)
                : tr('Bái sư học đạo', 'Find a master')}
        </b>
        <small>
          {mode === 'moi'
            ? tr('Tìm người mới theo tên rồi bấm Mời, hoặc gửi link cho bạn bè. Đệ tử chơi đủ 10 kiếp trong 7 ngày: thầy trò mỗi người +20 phúc duyên.', 'Search new players and invite them, or send your link. When a disciple finishes 10 lives in 7 days, you both get +20 Fortune.')
            : tr('Người mới chọn một sư phụ đang chơi. Đủ 10 kiếp trong 7 ngày: thầy trò mỗi người +20 phúc duyên.', 'New players pick an active master. Finish 10 lives in 7 days: you both get +20 Fortune.')}
        </small>
      </span>
      {mode === 'moi' ? (
        <button className="btn su-home-go" onClick={() => (setTimDe(true), track('su_home_tap', { mode, cho: nCho }))}>
          {nCho > 0 ? tr('Xem', 'View') : tr('Tìm đệ tử', 'Find')}
        </button>
      ) : (
        !done && (
          <button className="btn su-home-go" onClick={() => (setOpen(true), track('su_home_tap', { mode }))}>
            {nCho > 0 ? tr('Xem lời mời', 'View') : tr('Tìm sư phụ', 'Find master')}
          </button>
        )
      )}
      {open && <SuTimSheet user={user} onClose={() => setOpen(false)} onDone={setDone} />}
      {timDe && <SuTimDeSheet user={user} onClose={() => setTimDe(false)} />}
    </section>
  );
}
