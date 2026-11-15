'use client';

/**
 * Sư Đồ, trang quản trị (/quan-tri/su-do): số tổng, danh sách mọi cặp thầy trò kèm tiến độ, đánh dấu nghi gian lận.
 * Lọc theo trạng thái và tìm theo tên. Dữ liệu chỉ có khi máy chủ xác nhận tên đăng nhập là quản trị viên.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import BackButton from './BackButton';
import { useAuth } from '@/lib/useAuth';
import { suAdmin, suState, type SuAdmin } from '@/lib/suDo';
import { tr } from '@/lib/i18n';

type Loc = 'all' | 'tu' | 'tai' | 'het';
const HOUR = 3600000;
const ngayGio = (iso: string) => {
  const d = new Date(Date.parse(iso) + 7 * HOUR);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};
const LOAI: Record<string, [string, string]> = {
  su_cung_may: ['Đệ tử dùng chung máy với sư phụ hoặc đệ tử khác', 'Disciple shares a device with the master or another disciple'],
  su_cung_gio: ['Nhiều đệ tử của một sư phụ thành tài trong cùng một giờ', 'Several disciples of one master graduated within an hour'],
};

export default function SuDoAdmin() {
  const { user, ready } = useAuth();
  const [d, setD] = useState<SuAdmin | 'quyen' | 'loi' | null>(null);
  const [loc, setLoc] = useState<Loc>('all');
  const [q, setQ] = useState('');
  useEffect(() => {
    if (!ready) return;
    suAdmin(user).then(setD);
  }, [ready, user]);
  const rows = useMemo(() => {
    if (!d || typeof d === 'string') return [];
    const s = q.trim().toLowerCase();
    return d.cap.filter((c) => {
      const st = c.thanh_tai_luc ? 'tai' : c.het_han ? 'het' : 'tu';
      if (loc !== 'all' && st !== loc) return false;
      return !s || [c.su, c.de, c.su_pd ?? '', c.de_pd ?? ''].some((x) => x.toLowerCase().includes(s));
    });
  }, [d, loc, q]);

  return (
    <main className="app su-admin">
      <header className="topbar">
        <div className="topbar-row">
          <BackButton fallback="/" />
          <span className="age-big" style={{ fontSize: 24 }}>
            {tr('Quản trị Sư Đồ', 'Master and Disciple admin')}
          </span>
        </div>
      </header>
      {!ready || d === null ? (
        <p>{tr('Đang tải...', 'Loading...')}</p>
      ) : d === 'quyen' ? (
        <section className="panel">
          <p>{tr('Trang này chỉ dành cho quản trị viên. Đăng nhập bằng tài khoản quản trị để xem.', 'This page is for admins only. Log in with an admin account to view it.')}</p>
          <Link href="/dang-nhap" className="btn" style={{ display: 'block', textDecoration: 'none', minHeight: 44 }}>
            {tr('Đăng nhập', 'Log in')}
          </Link>
        </section>
      ) : d === 'loi' ? (
        <section className="panel">
          <p>{tr('Không tải được, thử lại sau.', 'Could not load, try again later.')}</p>
          <button className="btn" onClick={() => (setD(null), suAdmin(user).then(setD))}>
            {tr('Thử lại', 'Retry')}
          </button>
        </section>
      ) : (
        <>
          <section className="panel su-adm-tong">
            <div><b>{d.tong.cap}</b><small>{tr('cặp thầy trò', 'pairs')}</small></div>
            <div><b>{d.tong.su_phu}</b><small>{tr('sư phụ', 'masters')}</small></div>
            <div><b>{d.tong.dang_tu}</b><small>{tr('đang tu', 'training')}</small></div>
            <div><b>{d.tong.thanh_tai}</b><small>{tr('thành tài', 'graduated')}</small></div>
            <div><b>{d.tong.het_han}</b><small>{tr('hết hạn', 'time up')}</small></div>
            <div><b>{d.tong.bai_24h}</b><small>{tr('bái sư 24 giờ qua', 'joined in 24h')}</small></div>
          </section>
          <section className="panel">
            <div className="su-adm-loc" role="radiogroup" aria-label={tr('Lọc', 'Filter')}>
              {(
                [
                  ['all', tr('Tất cả', 'All')],
                  ['tu', tr('Đang tu', 'Training')],
                  ['tai', tr('Thành tài', 'Graduated')],
                  ['het', tr('Hết hạn', 'Time up')],
                ] as [Loc, string][]
              ).map(([k, l]) => (
                <button key={k} role="radio" aria-checked={loc === k} className={`btn${loc === k ? ' on' : ''}`} onClick={() => setLoc(k)}>
                  {l}
                </button>
              ))}
            </div>
            <label className="su-adm-tim">
              {tr('Tìm theo tên', 'Search by name')}
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr('tên tài khoản hoặc pháp danh', 'account or Dao name')} />
            </label>
            {rows.length === 0 ? (
              <p>{tr('Chưa có cặp thầy trò nào.', 'No master-disciple pairs yet.')}</p>
            ) : (
              <ul className="su-list">
                {rows.map((c) => {
                  const st = suState({ thanh_tai_luc: c.thanh_tai_luc, han: c.het_han ? new Date(0).toISOString() : new Date(Date.now() + 1e9).toISOString() });
                  return (
                    <li key={c.de} className={`su-item su-${st}`}>
                      <div className="su-item-h">
                        <span>
                          {tr('Thầy', 'Master')} <b>{c.su_pd ?? c.su}</b> <small>@{c.su}</small>
                        </span>
                        <span className={`su-chip su-chip-${st}`}>{st === 'tai' ? tr('Thành tài', 'Graduated') : st === 'tu' ? tr('Đang tu', 'Training') : tr('Hết hạn', 'Time up')}</span>
                      </div>
                      <div className="su-item-h">
                        <span>
                          {tr('Trò', 'Disciple')} <b>{c.de_pd ?? c.de}</b> <small>@{c.de}</small>
                        </span>
                      </div>
                      <span className={`su-bar su-bar-${st}`} role="img" aria-label={tr(`${c.kiep}/10 kiếp`, `${c.kiep}/10 lives`)}>
                        {Array.from({ length: 10 }, (_, i) => (
                          <i key={i} className={i < c.kiep ? 'on' : ''} />
                        ))}
                      </span>
                      <small className="su-item-s">
                        {tr(`${c.kiep}/10 kiếp · bái ${ngayGio(c.bai_luc)}`, `${c.kiep}/10 lives · joined ${ngayGio(c.bai_luc)}`)}
                        {c.thanh_tai_luc ? tr(` · thành tài ${ngayGio(c.thanh_tai_luc)}`, ` · graduated ${ngayGio(c.thanh_tai_luc)}`) : ''}
                        {c.thanh_tai_luc
                          ? tr(
                              ` · thưởng thầy: ${c.thuong_su ? (c.su_nhan ? 'đã nhận' : 'chờ nhận') : 'quá trần 5/tuần'}, trò: ${c.de_nhan ? 'đã nhận' : 'chờ nhận'}`,
                              ` · master reward: ${c.thuong_su ? (c.su_nhan ? 'claimed' : 'waiting') : 'over the 5/week cap'}, disciple: ${c.de_nhan ? 'claimed' : 'waiting'}`,
                            )
                          : ''}
                      </small>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          <section className="panel">
            <h3 style={{ margin: '0 0 6px' }}>{tr('Đánh dấu nghi gian lận', 'Suspicious activity')}</h3>
            {d.co.length === 0 ? (
              <p style={{ margin: 0 }}>{tr('Chưa có.', 'None yet.')}</p>
            ) : (
              <ul className="su-list">
                {d.co.map((c, i) => (
                  <li key={i} className="su-item">
                    <small className="su-item-s">
                      {ngayGio(c.luc)} · {LOAI[c.loai] ? tr(LOAI[c.loai][0], LOAI[c.loai][1]) : c.loai}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
