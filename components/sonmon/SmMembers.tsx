'use client';

/** 4.6.0 Sơn Môn M8 thành viên: bảng người, đơn xin vào, mời người, sửa điều kiện vào, luật rời/đuổi. */
import { useState } from 'react';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import type { SmMember } from '@/lib/sonmon/api';
import { oToiDa, SM_CFG } from '@/lib/sonmon/data';
import { DkForm } from './SmFound';
import { chucTen, fmtN, Msg, ngayThang, type SmCtx, type SmDraft } from './ui';

export function SmThanhVien({ c }: { c: SmCtx }) {
  const { st, members } = c;
  const m = st.mon!;
  const quyen = m.chuc === 'chu' || m.chuc === 'lao';
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [sua, setSua] = useState(false);
  const [dk, setDk] = useState<Pick<SmDraft, 'dkKiep' | 'dkNgay' | 'moCua'>>({ dkKiep: m.dk_kiep, dkNgay: m.dk_tuoi_dao, moCua: m.mo_cua });
  const [ai, setAi] = useState<SmMember | null>(null);
  const [roi, setRoi] = useState(false);
  const toi = c.api.username;
  const tenO = (x: SmMember) => {
    if (x.nghi) return tr('đang nghỉ', 'resting');
    const cd = m.tiles.find((t) => t.cd);
    const d = x.dung ?? (cd ? [cd.q, cd.r] : null);
    const t = d && m.tiles.find((t) => t.q === d[0] && t.r === d[1]);
    return t ? t.ten : '-';
  };
  const sau = (r: string | null, msg: string) => {
    setErr(r);
    if (!r) setOk(msg);
    c.reload(['members']);
  };
  const moi = async () => {
    const url = `${location.origin}/?su=${encodeURIComponent(toi ?? '')}`;
    const text = tr(`Vào ${m.ten} cùng ta trong Vạn Kiếp Luân Hồi`, `Join ${m.ten} with me in Ten Thousand Rebirths`);
    track('sm_invite', { n: m.n });
    try {
      if (navigator.share) {
        await navigator.share({ text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}: ${url}`);
      setOk(tr('Đã chép link mời. Dán gửi đạo hữu chưa có môn.', 'Invite link copied.'));
    } catch {
      setOk(tr(`Link mời: ${url}`, `Invite link: ${url}`));
    }
  };
  const can = 3 * m.o_max - m.n;

  return (
    <>
      <section className="sm-card">
        <div className="sm-between">
          <b>{tr(`${m.n}/${SM_CFG.mon.toiDa} người`, `${m.n}/${SM_CFG.mon.toiDa} members`)}</b>
          <span className="sm-note">{tr('mỗi 3 người thêm 1 ô', '+1 tile per 3 members')}</span>
        </div>
        <p className="sm-note">
          {tr(`Giữ tối đa ${oToiDa(m.n)} ô`, `Up to ${oToiDa(m.n)} tiles`)}
          {can > 0 && m.n < SM_CFG.mon.toiDa ? tr(`, thêm ${can} người nữa thì được ${m.o_max + 1} ô.`, `, ${can} more members for ${m.o_max + 1}.`) : '.'}
          {tr(` Vào: ${m.mo_cua ? 'mở cửa' : 'duyệt đơn'}`, ` Entry: ${m.mo_cua ? 'open' : 'review'}`)}
          {m.dk_kiep > 0 ? tr(`, từ ${m.dk_kiep} kiếp`, `, ${m.dk_kiep}+ lives`) : ''}
          {m.dk_tuoi_dao > 0 ? tr(`, ${m.dk_tuoi_dao} ngày chơi`, `, ${m.dk_tuoi_dao}+ days`) : ''}.
        </p>
        <button className="sm-btn main wide" onClick={moi} disabled={m.n >= SM_CFG.mon.toiDa}>
          {tr('Mời người chưa có môn', 'Invite someone without a sect')}
        </button>
        {m.n >= SM_CFG.mon.toiDa && <p className="sm-why">{tr('Môn đã đủ 15 người.', 'The sect is full.')}</p>}
      </section>
      <Msg err={err} ok={ok} />

      <section className="sm-card" style={{ padding: '8px 6px' }}>
        {!members ? (
          <p className="sm-note">{tr('Đang xem thành viên...', 'Loading members...')}</p>
        ) : (
          <table className="sm-table">
            <colgroup>
              <col style={{ width: '42%' }} />
              <col style={{ width: '19%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '27%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>{tr('Tên · chức', 'Name · rank')}</th>
                <th className="num">{tr('Lực chiến', 'Power')}</th>
                <th className="num">{tr('Góp', 'Gave')}</th>
                <th>{tr('Đứng ở', 'Guards')}</th>
              </tr>
            </thead>
            <tbody>
              {members.ds.map((x) => {
                const la = x.tk === toi;
                const bam = !la && (m.chuc === 'chu' || (m.chuc === 'lao' && x.chuc === 'de'));
                return (
                  <tr key={x.tk} className={`${la ? 'me' : ''} ${bam ? 'tap' : ''}`} onClick={bam ? () => setAi(x) : undefined}>
                    <td>
                      {bam ? (
                        <button style={{ all: 'unset', cursor: 'pointer', display: 'block', minHeight: 32, overflow: 'hidden', textOverflow: 'ellipsis' }} aria-label={tr(`Việc với ${x.ten}`, `Actions for ${x.ten}`)}>
                          {x.ten}
                        </button>
                      ) : (
                        <span>{x.ten}</span>
                      )}
                      <div className="sm-note" style={{ fontSize: 13 }}>
                        {chucTen(x.chuc)}
                        {la ? tr(' · ngươi', ' · you') : ''}
                      </div>
                    </td>
                    <td className="num">{fmtN(x.lc)}</td>
                    <td className="num">{x.kv}</td>
                    <td style={{ fontSize: 14 }}>{tenO(x)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <p className="sm-note" style={{ padding: '4px 4px 0' }}>
          {tr('"Góp" là Khí vận góp hôm nay.', '"Gave" is fortune given today.')}
          {quyen ? tr(' Chạm tên để đổi chức hoặc đuổi.', ' Tap a name to change rank or expel.') : ''}
        </p>
      </section>

      {quyen && members?.don && (
        <section className="sm-card">
          <h3>{tr(`Đơn xin vào (${members.don.length})`, `Applications (${members.don.length})`)}</h3>
          {members.don.length === 0 && <p className="sm-note">{tr('Chưa có đơn nào.', 'No applications.')}</p>}
          {members.don.map((d) => (
            <div key={d.id} className="sm-row" style={{ borderTop: '1px solid #d9c493', paddingTop: 6 }}>
              <div className="sm-grow">
                <b className="sm-clip" style={{ display: 'block' }}>
                  {d.ten}
                </b>
                <span className="sm-note">{tr(`Lực chiến ${fmtN(d.lc)}`, `Power ${fmtN(d.lc)}`)}</span>
              </div>
              <button className="sm-btn small dark" disabled={c.busy || m.n >= SM_CFG.mon.toiDa} onClick={async () => sau(await c.run({ fn: 'accept', don: d.id, nhan: true }, () => track('sm_accept', { nhan: true })), tr(`Đã nhận ${d.ten}.`, `${d.ten} accepted.`))}>
                {tr('Nhận', 'Accept')}
              </button>
              <button className="sm-btn small" disabled={c.busy} onClick={async () => sau(await c.run({ fn: 'accept', don: d.id, nhan: false }, () => track('sm_accept', { nhan: false })), tr(`Đã từ chối ${d.ten}.`, `${d.ten} declined.`))}>
                {tr('Từ chối', 'Decline')}
              </button>
            </div>
          ))}
        </section>
      )}

      <section className="sm-card">
        <div className="sm-row">
          <h3 className="sm-grow">{tr('Điều kiện vào môn', 'Entry requirements')}</h3>
          <button className="sm-btn small" disabled={m.chuc !== 'chu'} aria-expanded={sua} onClick={() => setSua(!sua)}>
            {sua ? tr('Đóng', 'Close') : tr('Sửa điều kiện vào', 'Edit')}
          </button>
        </div>
        {m.chuc !== 'chu' && <p className="sm-why">{tr('Chỉ môn chủ sửa được điều kiện vào.', 'Only the master can edit this.')}</p>}
        {sua && (
          <>
            <DkForm d={dk} set={(p) => setDk((x) => ({ ...x, ...p }))} />
            <button
              className="sm-btn dark wide"
              disabled={c.busy}
              onClick={async () => {
                const e = await c.run({ fn: 'set_dk', ...dk }, () => track('sm_set_dk', dk));
                setErr(e);
                if (!e) {
                  setOk(tr('Đã lưu điều kiện vào.', 'Saved.'));
                  setSua(false);
                }
              }}
            >
              {tr('Lưu điều kiện', 'Save')}
            </button>
          </>
        )}
      </section>

      <section className="sm-card warn">
        <p style={{ fontSize: 15 }}>{tr('Môn chủ và trưởng lão nhận người, phát lệnh xuất chinh. Đệ tử điểm danh, làm nhiệm vụ, theo đánh và giữ ô.', 'The master and elders recruit and order marches. Disciples check in, do tasks, march and guard.')}</p>
        <p style={{ fontSize: 15 }}>{tr('Tự rời môn đã cắm cờ thì chờ hết Kỷ mới vào môn khác. Bị đuổi thì vào môn khác được ngay.', 'Leave a flagged sect yourself and you wait until the era ends. If expelled, you can join another at once.')}</p>
        <button className="sm-btn wide" onClick={() => setRoi(true)}>
          {tr('Rời môn', 'Leave the sect')}
        </button>
      </section>

      {ai && (
        <div className="sm-sheet" role="dialog" aria-modal="true" aria-label={ai.ten} onClick={() => setAi(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <h2 className="sm-clip">{ai.ten}</h2>
            <p className="sm-note">
              {chucTen(ai.chuc)} · {tr('Lực chiến', 'Power')} {fmtN(ai.lc)}
            </p>
            {m.chuc === 'chu' && (
              <button
                className="sm-btn dark wide"
                disabled={c.busy}
                onClick={async () => {
                  const chuc = ai.chuc === 'lao' ? 'de' : 'lao';
                  const r = await c.run({ fn: 'role', tk: ai.tk, chuc }, () => track('sm_role', { chuc }));
                  setAi(null);
                  sau(r, chuc === 'lao' ? tr(`${ai.ten} thành trưởng lão.`, `${ai.ten} is now an elder.`) : tr(`${ai.ten} về làm đệ tử.`, `${ai.ten} is now a disciple.`));
                }}
              >
                {ai.chuc === 'lao' ? tr('Về đệ tử', 'Make disciple') : tr(`Phong trưởng lão (tối đa ${SM_CFG.mon.lao})`, `Make elder (max ${SM_CFG.mon.lao})`)}
              </button>
            )}
            <p className="sm-note">{tr('Bị đuổi thì người đó vào môn khác được ngay, không bị khóa.', 'An expelled member can join another sect at once.')}</p>
            <button
              className="sm-btn wide"
              style={{ background: 'var(--red-d)', color: '#fff3dc' }}
              disabled={c.busy}
              onClick={async () => {
                const r = await c.run({ fn: 'kick', tk: ai.tk }, () => track('sm_kick'));
                setAi(null);
                sau(r, tr(`Đã đuổi ${ai.ten}.`, `${ai.ten} expelled.`));
              }}
            >
              {tr('Đuổi khỏi môn', 'Expel')}
            </button>
            <button className="sm-btn sm-ghost wide" onClick={() => setAi(null)}>
              {tr('Thôi', 'Cancel')}
            </button>
          </div>
        </div>
      )}
      {roi && (
        <div className="sm-sheet" role="dialog" aria-modal="true" aria-label={tr('Rời môn', 'Leave')} onClick={() => setRoi(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <h2>{tr(`Rời ${m.ten}?`, `Leave ${m.ten}?`)}</h2>
            <p className="sm-card warn" style={{ fontSize: 15 }}>
              {m.cam_co
                ? tr(`Môn đã cắm cờ: rời xong ngươi phải chờ hết Kỷ ${st.ky?.id ?? ''} (${st.ky ? ngayThang(st.ky.ket_thuc) : ''}) mới vào môn khác.`, `The sect has a flag: you must wait until era ${st.ky?.id ?? ''} ends to join another.`)
                : tr('Môn chưa cắm cờ nên rời xong vào môn khác được ngay.', 'No flag yet, so you can join another sect at once.')}
              {m.chuc === 'chu' ? tr(' Ngươi là môn chủ: trưởng lão Lực chiến cao nhất sẽ lên thay.', ' You are the master: the strongest elder takes over.') : ''}
            </p>
            <button
              className="sm-btn wide"
              style={{ background: 'var(--red-d)', color: '#fff3dc' }}
              disabled={c.busy}
              onClick={async () => {
                const r = await c.run({ fn: 'leave' }, () => track('sm_leave', { cam_co: m.cam_co }));
                setRoi(false);
                if (r) setErr(r);
                else c.go('list');
              }}
            >
              {tr('Rời môn', 'Leave')}
            </button>
            <button className="sm-btn sm-ghost wide" onClick={() => setRoi(false)}>
              {tr('Ở lại', 'Stay')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
