'use client';

/**
 * 19/11 (Tyler: "Mời người chưa có môn" phải mời trong game như mời Sư Đồ).
 * SmMoiSheet: người trong môn tìm người chưa có môn theo tên rồi bấm Mời. Người kia thấy lời mời ở tab Sơn Môn và trong Thư.
 * SmMoiThuCard: người chưa có môn thấy lời mời vào môn, bấm Nhận là vào ngay (lời mời thay cho duyệt đơn) hoặc Từ chối.
 * Máy chủ: supabase/son_mon_moi_2026_11_19.sql.
 */
import { useEffect, useState } from 'react';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import { smLoi, type SmMoiThu, type SmMoiTim } from '@/lib/sonmon/api';
import { HuyHieu } from './Pixel';
import { fmtN, Msg, truoc, type SmCtx } from './ui';

export function SmMoiSheet({ c, onClose }: { c: SmCtx; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [d, setD] = useState<SmMoiTim | null | 'loi'>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  useEffect(() => {
    track('sm_moi_open');
  }, []);
  useEffect(() => {
    let live = true;
    const id = setTimeout(
      () =>
        c.api.moiTim(q.trim()).then(
          (x) => live && setD(x),
          (e) => {
            if (!live) return;
            setD('loi');
            setErr(smLoi(e));
          },
        ),
      q ? 300 : 0,
    );
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [c.api, q]);

  const moi = async (ten: string, ten2: string) => {
    setBusy(ten);
    setErr(null);
    setOk(null);
    try {
      const r = await c.api.act({ fn: 'moi_gui', ten });
      track('sm_moi_gui', { vao: !!r.vao });
      if (r.vao) {
        setOk(tr(`${ten2} đã xin vào môn từ trước, nay vào môn luôn.`, `${ten2} had applied and has now joined.`));
        c.reload(['members', 'state']);
      } else setOk(tr(`Đã gửi lời mời tới ${ten2}. Người đó bấm Nhận là vào môn.`, `Invite sent to ${ten2}. They join once they accept.`));
      if (d && d !== 'loi') setD({ ...d, ds: d.ds.map((x) => (x.ten === ten ? { ...x, da_moi: true } : x)) });
    } catch (e) {
      track('sm_moi_gui', { loi: String((e as { code?: string })?.code ?? 'SM_NET') });
      setErr(smLoi(e));
    } finally {
      setBusy(null);
    }
  };

  const ds = d && d !== 'loi' ? d.ds : [];
  return (
    <div className="sm-sheet" role="dialog" aria-modal="true" aria-label={tr('Mời người chưa có môn', 'Invite players without a sect')} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ maxHeight: '88vh' }}>
        <h2>{tr('Mời người chưa có môn', 'Invite players without a sect')}</h2>
        <p className="sm-note">{tr('Người có chân thân, chơi trong 7 ngày qua, chưa vào môn nào. Bấm Mời, người đó thấy lời mời ở tab Sơn Môn và trong Thư, bấm Nhận là vào môn.', 'Players with a True Body, active in the last 7 days, in no sect. Tap Invite; they see it in the Sects tab and in Mail.')}</p>
        <form className="sm-chat-form" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="sm-moi-q">{tr('Tìm theo tên', 'Search by name')}</label>
          <input id="sm-moi-q" type="search" value={q} maxLength={30} autoComplete="off" placeholder={tr('Pháp danh hoặc tên đăng nhập', 'True name or username')} onChange={(e) => setQ(e.target.value)} />
        </form>
        <Msg err={err} ok={ok} />
        {d && d !== 'loi' && d.day && <p className="sm-why">{tr('Môn đã đủ 15 người, chưa mời thêm được.', 'The sect is full.')}</p>}
        <div className="sm-cuon sm-moi-ds">
          {d === null && <p className="sm-note">{tr('Đang tìm...', 'Searching...')}</p>}
          {d !== null && d !== 'loi' && ds.length === 0 && <p className="sm-note">{q ? tr('Không có ai chưa có môn khớp tên này.', 'Nobody without a sect matches that name.') : tr('Lúc này chưa thấy ai chưa có môn đang chơi.', 'No one without a sect is playing right now.')}</p>}
          {ds.map((x) => {
            const ten2 = x.phap_danh ?? x.ten;
            return (
              <div key={x.ten} className="sm-moi-row">
                <div className="sm-grow">
                  <b className="sm-clip" style={{ display: 'block' }}>
                    {ten2} <small className="sm-note">@{x.ten}</small>
                  </b>
                  <span className="sm-note">
                    {tr(`${fmtN(x.kiep)} kiếp · Lực chiến ${fmtN(x.lc)}`, `${fmtN(x.kiep)} lives · power ${fmtN(x.lc)}`)}
                    {x.choi_luc ? tr(` · chơi ${truoc(x.choi_luc)}`, ` · played ${truoc(x.choi_luc)}`) : ''}
                  </span>
                  {!x.du_dk && <span className="sm-why" style={{ display: 'block' }}>{tr('Chưa đủ điều kiện vào môn ta (kiếp hoặc ngày chơi).', 'Does not meet our entry requirements yet.')}</span>}
                </div>
                <button className="sm-btn small dark" disabled={!!busy || x.da_moi || (d !== 'loi' && !!d?.day)} onClick={() => moi(x.ten, ten2)}>
                  {busy === x.ten ? '...' : x.da_moi ? tr('Đã mời', 'Invited') : tr('Mời', 'Invite')}
                </button>
              </div>
            );
          })}
        </div>
        <p className="sm-note">{tr('Mỗi người gửi tối đa 10 lời mời mỗi ngày. Lời mời không ai trả lời sau 3 ngày thì tự hết hạn.', 'Up to 10 invites a day each. Unanswered invites expire after 3 days.')}</p>
        <button className="sm-btn sm-ghost wide" onClick={onClose}>
          {tr('Đóng', 'Close')}
        </button>
      </div>
    </div>
  );
}

/** Lời mời vào môn gửi tới ta (người chưa có môn). Không có lời mời thì không hiện gì. */
export function SmMoiThuCard({ c }: { c: SmCtx }) {
  const [ds, setDs] = useState<SmMoiThu[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    c.api.moiDs().then((x) => live && setDs(x), () => {});
    return () => {
      live = false;
    };
  }, [c.api]);
  if (ds.length === 0 && !err) return null;
  const tra = async (t: SmMoiThu, nhan: boolean) => {
    setBusy(t.id);
    setErr(null);
    try {
      await c.api.act({ fn: 'moi_tra', id: t.id, nhan });
      track('sm_moi_tra', { nhan });
      if (nhan) {
        c.reload(['state', 'list', 'members']);
        c.go('mon');
        return;
      }
      setDs((a) => a.filter((x) => x.id !== t.id));
    } catch (e) {
      track('sm_moi_tra', { nhan, loi: String((e as { code?: string })?.code ?? 'SM_NET') });
      setErr(smLoi(e));
    } finally {
      setBusy(null);
    }
  };
  return (
    <section className="sm-card sm-moi-thu" aria-label={tr('Lời mời vào môn', 'Sect invites')}>
      <h3>{tr(`Lời mời vào môn (${ds.length})`, `Sect invites (${ds.length})`)}</h3>
      <Msg err={err} ok={null} />
      {ds.map((t) => (
        <div key={t.id} className="sm-moi-row">
          <HuyHieu id={t.huy_hieu} size={36} />
          <div className="sm-grow">
            <b className="sm-clip" style={{ display: 'block' }}>
              {t.ten_mon}
            </b>
            <span className="sm-note">{tr(`${t.phap_danh ?? t.nguoi} mời ngươi · ${t.n}/15 người · ${truoc(t.luc)}`, `${t.phap_danh ?? t.nguoi} invited you · ${t.n}/15 · ${truoc(t.luc)}`)}</span>
            {!t.du_dk && <span className="sm-why" style={{ display: 'block' }}>{tr(`Môn này cần từ ${t.dk_kiep} kiếp và ${t.dk_ngay} ngày chơi.`, `Needs ${t.dk_kiep}+ lives and ${t.dk_ngay}+ days.`)}</span>}
          </div>
          <div className="sm-moi-act">
            <button className="sm-btn small dark" disabled={busy !== null || !t.du_dk} onClick={() => tra(t, true)}>
              {busy === t.id ? '...' : tr('Nhận', 'Accept')}
            </button>
            <button className="sm-btn small" disabled={busy !== null} onClick={() => tra(t, false)}>
              {tr('Từ chối', 'Decline')}
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
