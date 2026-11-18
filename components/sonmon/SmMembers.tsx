'use client';

/** 4.6.0 Sơn Môn M8 thành viên: bảng người, đơn xin vào, mời người, sửa điều kiện vào, luật rời/đuổi. */
import { useEffect, useState } from 'react';
import { tr } from '@/lib/i18n';
import { track } from '@/lib/track';
import type { SmMember, SmMonNguoi } from '@/lib/sonmon/api';
import { hexDist, oToiDa, SM_CFG } from '@/lib/sonmon/data';
import { DkForm } from './SmFound';
import { NguoiList, NguoiSheet } from './SmNguoi';
import { chucTen, fmtN, hhmm, Msg, type SmCtx, type SmDraft } from './ui';

export function SmThanhVien({ c }: { c: SmCtx }) {
  const { st, members } = c;
  const m = st.mon!;
  const quyen = m.chuc === 'chu' || m.chuc === 'lao';
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [sua, setSua] = useState(false);
  const [dk, setDk] = useState<Pick<SmDraft, 'dkKiep' | 'dkNgay' | 'moCua'>>({ dkKiep: m.dk_kiep, dkNgay: m.dk_tuoi_dao, moCua: m.mo_cua });
  const [ai, setAi] = useState<SmMember | null>(null);
  // 18/11: hình chân thân, vào môn lúc nào, từng chỉ số (vkl_sm_mon_ds), ghép theo tên đăng nhập
  const [chiTiet, setChiTiet] = useState<Record<string, SmMonNguoi>>({});
  const [xem, setXem] = useState<SmMonNguoi | null>(null);
  useEffect(() => {
    let live = true;
    c.api.monDs(m.id).then(
      (ds) => live && setChiTiet(Object.fromEntries(ds.filter((x) => x.tk).map((x) => [x.tk as string, x]))),
      () => {},
    );
    return () => {
      live = false;
    };
  }, [c.api, m.id, members]);
  const [roi, setRoi] = useState(false);
  const toi = c.api.username;
  const tenO = (x: SmMember) => {
    if (x.nghi) return tr('đang nghỉ', 'resting');
    const cd = m.tiles.find((t) => t.cd);
    const d = x.dung ?? (cd ? [cd.q, cd.r] : null);
    const t = d && m.tiles.find((t) => t.q === d[0] && t.r === d[1]);
    if (t && x.di_toi && new Date(x.di_toi).getTime() > Date.now()) return tr(`đang đi tới ${t.ten} (tới ${hhmm(x.di_toi)})`, `walking to ${t.ten} (${hhmm(x.di_toi)})`);
    return t ? tr(`giữ ${t.ten}`, `guards ${t.ten}`) : '-';
  };
  // 18/11: môn chủ xếp được mọi người; trưởng lão xếp được đệ tử và chính mình
  const xepDuoc = (mb: SmMember) => m.chuc === 'chu' || (m.chuc === 'lao' && (mb.chuc === 'de' || mb.tk === toi));
  const xep = async (mb: SmMember, q: number, r: number, ten: string) => {
    const e = await c.run({ fn: 'xep', tk: mb.tk, q, r }, () => track('sm_xep', { la_ta: mb.tk === toi }));
    setXem(null);
    sau(e, tr(`${mb.ten} lên đường sang giữ ${ten}.`, `${mb.ten} is heading to ${ten}.`));
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
          <NguoiList
            ds={members.ds.map((x) => ({ ...(chiTiet[x.tk] ?? {}), ten: x.ten, chuc: x.chuc, lc: x.lc, tk: x.tk, ta: x.tk === toi }))}
            onPick={(x) => setXem(x)}
            extra={(x) => {
              const mb = members.ds.find((y) => y.tk === x.tk);
              return mb ? <span className="sm-ng-s">{tr(`Góp ${mb.kv} Khí vận hôm nay · ${tenO(mb)}`, `Gave ${mb.kv} fortune today · ${tenO(mb)}`)}</span> : null;
            }}
          />
        )}
        <p className="sm-note" style={{ padding: '4px 4px 0' }}>
          {tr('"Góp" là Khí vận góp hôm nay.', '"Gave" is fortune given today.')}
          {tr(' Chạm một người để xem chân thân', ' Tap someone to see their true self')}{quyen ? tr(', xếp vào ô, đổi chức hoặc đuổi.', ', assign a tile, change rank or expel.') : '.'}
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
        <p style={{ fontSize: 15 }}>{tr('Tự rời môn đã cắm cờ thì chờ 12 giờ mới vào môn khác, 24 giờ mới lập môn mới. Bị đuổi thì vào môn khác được ngay.', 'Leave a flagged sect yourself and you wait 12 hours to join another and 24 hours to found one. If expelled, you can join another at once.')}</p>
        <button className="sm-btn wide" onClick={() => setRoi(true)}>
          {tr('Rời môn', 'Leave the sect')}
        </button>
      </section>

      {xem && (
        <NguoiSheet x={xem} mon={m.ten} onClose={() => setXem(null)}>
          {(() => {
            const mb = members?.ds.find((y) => y.tk === xem.tk);
            const bam = !!mb && mb.tk !== toi && (m.chuc === 'chu' || (m.chuc === 'lao' && mb.chuc === 'de'));
            const cd = m.tiles.find((t) => t.cd) ?? m.tiles[0];
            const tu = mb ? (mb.dung ?? (cd ? [cd.q, cd.r] : null)) : null;
            return (
              <>
                {mb && xepDuoc(mb) && m.tiles.length > 0 && (
                  <section className="sm-xep" aria-label={tr('Xếp vào ô', 'Assign to a tile')}>
                    <h3>{tr(`Xếp ${mb.ten} giữ ô`, `Assign ${mb.ten} to a tile`)}</h3>
                    <p className="sm-note">{tr(`Đang ${tenO(mb)}. Sang ô khác mất ${SM_CFG.gio.diPhut} phút mỗi ô đường đi, trong lúc đi không giữ ô nào.`, `Now: ${tenO(mb)}. Moving takes ${SM_CFG.gio.diPhut} min per tile; nothing is guarded on the way.`)}</p>
                    <div className="sm-xep-o">
                      {m.tiles.map((t) => {
                        const o = tu && tu[0] === t.q && tu[1] === t.r;
                        const ph = tu ? SM_CFG.gio.diPhut * Math.max(1, hexDist({ q: tu[0], r: tu[1] }, t)) : SM_CFG.gio.diPhut;
                        const n = members?.ds.filter((y) => !y.nghi && (y.dung ? y.dung[0] === t.q && y.dung[1] === t.r : t.cd)).length ?? 0;
                        return (
                          <button key={`${t.q},${t.r}`} className={`sm-btn small${o ? ' dark' : ''}`} disabled={c.busy || !!o || mb.nghi} onClick={() => xep(mb, t.q, t.r, t.ten)}>
                            <span>
                              {t.ten}
                              {t.cd ? tr(' (chính điện)', ' (hall)') : ''}
                              <small>{o ? tr('đang ở đây', 'here') : tr(`${n} người · đi ${ph} phút`, `${n} here · ${ph} min`)}</small>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}
                {bam && (
                  <button className="sm-btn dark wide" onClick={() => (setXem(null), setAi(mb!))}>
                    {m.chuc === 'chu' ? tr('Đổi chức hoặc đuổi', 'Change rank or expel') : tr('Đuổi khỏi môn', 'Expel')}
                  </button>
                )}
              </>
            );
          })()}
        </NguoiSheet>
      )}
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
                ? tr('Môn đã cắm cờ: rời xong ngươi phải chờ 12 giờ mới vào môn khác, 24 giờ mới lập môn mới.', 'The sect has a flag: after leaving you wait 12 hours to join another and 24 hours to found one.')
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
