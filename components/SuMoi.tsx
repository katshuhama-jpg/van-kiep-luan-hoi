'use client';

/**
 * 18/11 (Tyler yêu cầu): Sư Đồ hai chiều.
 * SuHopList: lời mời / lời xin đang chờ gửi tới ta, bấm Nhận hoặc Từ chối.
 * SuTimDeSheet: sư phụ tìm người mới theo tên rồi bấm Mời (người kia phải nhận).
 * Máy chủ: supabase/su_moi_2026_11_18.sql.
 */
import { useEffect, useState } from 'react';
import type { Player } from '@/lib/auth';
import { suGui, suHop, suTimDe, suTra, type SuDeUng, type SuHop, type SuThu } from '@/lib/suDo';
import { track } from '@/lib/track';
import { tr } from '@/lib/i18n';

const HOUR = 3600000;
export function suLuc(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - Date.parse(iso);
  if (ms < HOUR) return tr('vừa chơi', 'just played');
  if (ms < 24 * HOUR) return tr(`chơi ${Math.floor(ms / HOUR)} giờ trước`, `played ${Math.floor(ms / HOUR)}h ago`);
  return tr(`chơi ${Math.floor(ms / (24 * HOUR))} ngày trước`, `played ${Math.floor(ms / (24 * HOUR))}d ago`);
}

export const SU_LOI: Record<string, string> = {
  SU_DONE: tr('Người này (hoặc ngươi) đã có sư phụ rồi.', 'This player (or you) already has a master.'),
  SU_OLD: tr('Chỉ tài khoản mới (dưới 8 ngày, chưa quá 5 kiếp) mới bái sư được.', 'Only new accounts (under 8 days, at most 5 lives) can take a master.'),
  SU_SU: tr('Sư phụ cần chơi từ 20 kiếp và có chân thân.', 'A master needs 20+ lives and a True Body.'),
  SU_SELF: tr('Không bái người này được.', 'Not possible with this player.'),
  SU_NONE: tr('Không tìm thấy người này.', 'This player was not found.'),
  SU_DA_GUI: tr('Đã gửi rồi, đang chờ người kia trả lời.', 'Already sent, waiting for a reply.'),
  SU_NHIEU: tr('Mỗi ngày gửi tối đa 10 lời mời hoặc lời xin. Mai gửi tiếp nhé.', 'At most 10 invites or requests a day. Try again tomorrow.'),
  SU_HET: tr('Lời này đã hết hạn hoặc đã được trả lời.', 'This has expired or was already answered.'),
  SU_AUTH: tr('Phiên đăng nhập đã hết, hãy đăng nhập lại.', 'Your session ended, please log in again.'),
  SU_NET: tr('Mạng chập chờn, thử lại sau.', 'Network trouble, try again later.'),
};

/** lời gửi tới ta: người mới thấy lời mời của sư phụ, sư phụ thấy lời xin bái sư */
export function SuHopList({ user, hop, onChange }: { user: Player | null; hop: SuHop | null; onChange: (boundTo?: string) => void }) {
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  if (!hop || hop.den.length === 0) return null;
  const tra = async (t: SuThu, nhan: boolean) => {
    setBusy(t.id);
    const r = await suTra(user, t, nhan);
    setBusy(null);
    if (r !== 'OK') setMsg(SU_LOI[r] ?? SU_LOI.SU_NET);
    else setMsg(nhan ? (t.loai === 'moi' ? tr(`Đã bái ${t.phap_danh ?? t.ten} làm sư phụ.`, `${t.phap_danh ?? t.ten} is now your master.`) : tr(`Đã nhận ${t.phap_danh ?? t.ten} làm đệ tử.`, `${t.phap_danh ?? t.ten} is now your disciple.`)) : null);
    onChange(r === 'OK' && nhan && t.loai === 'moi' ? t.ten : undefined);
  };
  return (
    <div className="su-hop" role="region" aria-label={tr('Lời mời và lời xin', 'Invites and requests')}>
      {msg && (
        <p className="su-tim-warn" role="status">
          {msg}
        </p>
      )}
      <ul className="su-tim-list">
        {hop.den.map((t) => (
          <li key={t.id} className="su-item su-hop-item">
            <span className="su-item-h">
              <b>{t.phap_danh ?? t.ten}</b>
              <small>@{t.ten}</small>
            </span>
            <span className="su-item-s">
              {t.loai === 'moi'
                ? tr(`mời ngươi làm đệ tử · ${t.kiep ?? 0} kiếp`, `invites you as a disciple · ${t.kiep ?? 0} lives`)
                : tr(`xin bái ngươi làm sư phụ · mới chơi ${t.kiep ?? 0} kiếp`, `asks you to be their master · ${t.kiep ?? 0} lives so far`)}
            </span>
            <span className="su-hop-act">
              <button className="btn su-tim-go" disabled={busy !== null} onClick={() => tra(t, true)}>
                {busy === t.id ? '...' : tr('Nhận', 'Accept')}
              </button>
              <button className="btn su-hop-no" disabled={busy !== null} onClick={() => tra(t, false)}>
                {tr('Từ chối', 'Decline')}
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** ô tìm theo tên, chờ người gõ xong 300ms mới hỏi máy chủ */
export function useTim<T>(fn: (q: string) => Promise<T | null>, deps: unknown[]) {
  const [q, setQ] = useState('');
  const [d, setD] = useState<T | null | 'loi'>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    const id = setTimeout(() => fn(q.trim()).then((x) => live && setD(x ?? 'loi')), q ? 300 : 0);
    return () => {
      live = false;
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, n, ...deps]);
  return { q, setQ, d, setD, reload: () => setN((x) => x + 1) };
}

export function SuTimO({ q, setQ, label }: { q: string; setQ: (s: string) => void; label: string }) {
  return (
    <label className="su-tim-o">
      <span>{label}</span>
      <input type="search" value={q} maxLength={30} autoComplete="off" placeholder={tr('Pháp danh hoặc tên đăng nhập', 'True name or username')} onChange={(e) => setQ(e.target.value)} />
    </label>
  );
}

/** Sư phụ tìm người mới để mời làm đệ tử */
export function SuTimDeSheet({ user, onClose }: { user: Player | null; onClose: () => void }) {
  const { q, setQ, d, setD } = useTim((s) => suTimDe(user, s), [user]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [hop, setHop] = useState<SuHop | null>(null);
  useEffect(() => {
    track('su_tim_de_open');
    suHop(user).then(setHop);
  }, [user]);
  const moi = async (x: SuDeUng) => {
    setBusy(x.ten);
    const r = await suGui(user, x.ten, 'moi');
    setBusy(null);
    if (r === 'OK' || r === 'SU_DA_GUI') {
      setMsg(tr(`Đã gửi lời mời tới ${x.phap_danh ?? x.ten}. Người đó nhận là thành thầy trò.`, `Invite sent to ${x.phap_danh ?? x.ten}. Once accepted, you are master and disciple.`));
      if (d && d !== 'loi') setD({ ...d, ds: d.ds.map((y) => (y.ten === x.ten ? { ...y, da_moi: true } : y)) });
    } else setMsg(SU_LOI[r] ?? SU_LOI.SU_NET);
  };
  return (
    <div className="drawer-bg su-tim-bg" onClick={onClose}>
      <section className="su-tim" role="dialog" aria-modal="true" aria-label={tr('Tìm đệ tử', 'Find disciples')} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <b>{tr('Tìm đệ tử', 'Find disciples')}</b>
          <button className="btn drawer-x" aria-label={tr('Đóng', 'Close')} onClick={onClose}>
            ×
          </button>
        </div>
        <div className="su-tim-body">
          <p className="su-tim-lead">
            {tr('Người mới (dưới 8 ngày, chưa quá 5 kiếp) chưa có sư phụ. Bấm Mời, người đó nhận là thành thầy trò. Đệ tử chơi xong 10 kiếp trong 7 ngày: mỗi người +20 phúc duyên.', 'New players (under 8 days, at most 5 lives) without a master. Tap Invite; once they accept you are master and disciple. When they finish 10 lives in 7 days, you each get +20 Fortune.')}
          </p>
          {hop && hop.den.some((t) => t.loai === 'xin') && (
            <>
              <h4 className="su-hop-h">{tr('Lời xin bái sư gửi ngươi', 'Requests to you')}</h4>
              <SuHopList user={user} hop={{ den: hop.den.filter((t) => t.loai === 'xin'), di: [] }} onChange={() => suHop(user).then(setHop)} />
            </>
          )}
          <SuTimO q={q} setQ={setQ} label={tr('Tìm người mới', 'Search new players')} />
          {msg && (
            <p className="su-tim-warn" role="status">
              {msg}
            </p>
          )}
          {d === null && <p>{tr('Đang tìm...', 'Searching...')}</p>}
          {d === 'loi' && <p>{tr('Chưa tải được danh sách. Thử lại sau.', 'Could not load the list. Try again later.')}</p>}
          {d && d !== 'loi' && !d.can && <p className="su-tim-warn">{SU_LOI.SU_SU}</p>}
          {d && d !== 'loi' && d.ds.length === 0 && <p>{q ? tr('Không có người mới nào khớp tên này.', 'No new player matches that name.') : tr('Lúc này chưa có người mới nào đang chơi.', 'No new players right now.')}</p>}
          {d && d !== 'loi' && (
            <ul className="su-tim-list">
              {d.ds.map((x) => (
                <li key={x.ten} className="su-item">
                  <span className="su-item-h">
                    <b>{x.phap_danh ?? x.ten}</b>
                    <small>@{x.ten}</small>
                  </span>
                  <span className="su-item-s">{tr(`${x.kiep} kiếp · ${suLuc(x.choi_luc)}`, `${x.kiep} lives · ${suLuc(x.choi_luc)}`)}</span>
                  <button className="btn su-tim-go" disabled={!!busy || !d.can || x.da_moi} onClick={() => moi(x)}>
                    {busy === x.ten ? '...' : x.da_moi ? tr('Đã mời', 'Invited') : tr('Mời', 'Invite')}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="su-tim-lead" style={{ marginTop: 8 }}>
            {tr('Mỗi ngày gửi tối đa 10 lời mời. Lời mời không ai trả lời sau 3 ngày thì tự hết hạn.', 'Up to 10 invites a day. Unanswered invites expire after 3 days.')}
          </p>
        </div>
      </section>
    </div>
  );
}
