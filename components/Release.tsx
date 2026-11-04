'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CURRENT_VERSION, RELEASES, markSeenLocal, seenLocal, type Release } from '@/lib/releases';
import { tr } from '@/lib/i18n';
import Sprite from './Sprite';
import { PixelFx, fxKiem } from './PixelFx';
import { demoChar } from '@/lib/game/demo';

const HERO_KIEM = demoChar({ path: 'kiem', age: 28, realm: 5, equipped: { ao: 'thanh_sam', vu_khi: 'thanh_phong' } });
let heroSpec: ReturnType<typeof fxKiem> | null = null;

/** Tranh mở đầu cho bản lớn: cảnh pixel động, không gradient */
const HERO_BG: Record<NonNullable<Release['hero']>['scene'], string> = { congphap: 'tu_luyen-2', kiepsau: 'dia-phu', linhthu: 'du_ngoan-1' };
function ReleaseHero({ hero }: { hero: NonNullable<Release['hero']> }) {
  if (!heroSpec) heroSpec = fxKiem(7, '#d8ecff');
  return (
    <div className={`rel-hero ${hero.scene}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="rel-hero-bg" src={`/bg/${HERO_BG[hero.scene]}.png`} alt="" />
      {hero.scene === 'congphap' && (
        <span className="rel-hero-fx">
          <PixelFx spec={heroSpec} scale={3} dur={1.2} />
        </span>
      )}
      <span className="rel-hero-hero">
        <Sprite c={HERO_KIEM} size={120} anim={hero.scene === 'congphap' ? 'spellcast' : 'idle'} dir={3} />
      </span>
      <b className="rel-hero-cap">{hero.caption}</b>
    </div>
  );
}

function ReleaseFeatures({ r }: { r: Release }) {
  if (!r.features) return null;
  return (
    <ul className="rel-feats">
      {r.features.map((f) => (
        <li key={f.h}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/icons/${f.icon}.png`} width={40} height={40} alt="" />
          <span>
            <b>{f.h}</b>
            <small>{f.t}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Nội dung một bản cập nhật, dùng cho cáo thị và trang lịch sử */
export function ReleaseBody({ r }: { r: Release }) {
  return (
    <>
      <p className="rel-intro">{r.lead}</p>
      {r.asked && (
        <div className="rel-group hot">
          <h3>{tr('Theo góp ý của đạo hữu', 'From your feedback')}</h3>
          <ul className="rel-items">
            {r.asked.map((a) => (
              <li key={a.text}>
                <b className="rel-who">{a.who}</b> {a.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      {r.stats && (
        <div className="rel-stats">
          {r.stats.map((s) => (
            <div key={s.label}>
              <b>{s.n}</b>
              <small>{s.label}</small>
            </div>
          ))}
        </div>
      )}
      {r.groups.map((g) => (
        <div key={g.h} className={`rel-group ${g.hot ? 'hot' : ''}`}>
          <h3>{g.h}</h3>
          <ul className="rel-items">
            {g.items.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

export { markSeenLocal };
/** Người vào game lần đầu trên máy này: chưa từng xem cáo thị, chưa đăng nhập, chưa chơi thử */
export function firstVisit(): boolean {
  try {
    return !seenLocal() && !localStorage.getItem('vkl.session') && !localStorage.getItem('vkl.meta');
  } catch {
    return false;
  }
}

/** Người chơi chưa xem cáo thị bản mới nhất (xét cả bản lưu trên tài khoản và trên máy) */
export function needNotice(seen?: string | null): boolean {
  return seen !== CURRENT_VERSION && seenLocal() !== CURRENT_VERSION;
}

/** Cáo thị giang hồ: hiện một lần cho mỗi bản mới, đóng thì ghi nhận đã xem */
export default function ReleaseNotice({ onClose, onGo }: { onClose: (v: string) => void; onGo?: (go: NonNullable<Release['cta']>['go']) => void }) {
  const r = RELEASES[0];
  // bảng tóm tắt trước: ý người chơi yêu cầu lên đầu, bấm mới mở chi tiết
  const [full, setFull] = useState(!r.asked && !r.more);
  const close = () => {
    markSeenLocal();
    onClose(CURRENT_VERSION);
  };
  return (
    <div className="rel-wrap" role="dialog" aria-modal="true" aria-labelledby="rel-title">
      <div className="rel-scroll">
        <i className="rod" aria-hidden="true" />
        <div className="rel-body">
          <span className="rel-seal" aria-hidden="true">
            {r.v}
          </span>
          <p className="rel-kick">{tr("Cáo thị giang hồ · ", "Jianghu Proclamation · ")}{r.date}</p>
          <h2 id="rel-title">{r.title}</h2>
          {r.hero && <ReleaseHero hero={r.hero} />}
          {full ? (
            <ReleaseBody r={r} />
          ) : (
            <div className="rel-sum">
              {r.features && (
                <>
                  <p className="rel-intro">{r.lead}</p>
                  <ReleaseFeatures r={r} />
                </>
              )}
              {r.asked && (
                <>
                  <h3>{tr('Đạo hữu yêu cầu, Thiên Đạo đã làm', 'You asked, the Heavenly Dao delivered')}</h3>
                  <ul>
                    {r.asked.map((a) => (
                      <li key={a.text}>
                        <span>{a.short}</span>
                        <b>{a.who}</b>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {r.more && !r.features && (
                <>
                  <h3>{tr('Còn có', 'Also new')}</h3>
                  <div className="rel-chips">
                    {r.more.map((m) => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <div className="rel-acts">
            {r.cta && onGo && (
              <button
                className="btn btn-red btn-big"
                onClick={() => {
                  close();
                  onGo(r.cta!.go);
                }}
              >
                {r.cta.label}
              </button>
            )}
            <button className={`btn btn-big ${r.cta && onGo ? '' : 'btn-red'}`} onClick={close}>
              {tr('Chơi tiếp', 'Keep playing')}
            </button>
            {!full && (
              <button className="btn btn-big rel-more" onClick={() => setFull(true)}>
                {tr('Xem chi tiết', 'See details')}
              </button>
            )}
            <Link href="/cap-nhat" className="rel-link" onClick={close}>
              {tr("Xem lịch sử cập nhật", "View update history")}
            </Link>
          </div>
        </div>
        <i className="rod" aria-hidden="true" />
      </div>
    </div>
  );
}

/** Thông báo một lần về lúc cổng đóng sáng 1/11/2026 (Vercel tạm dừng vì vượt hạn mức). Hết hạn sau 4/11. */
const DOWN_KEY = 'vkl.notice.down1101';
const DOWN_UNTIL = Date.UTC(2026, 10, 4, 17); // hết ngày 4/11 giờ Việt Nam
export function needDownNotice(): boolean {
  try {
    return Date.now() < DOWN_UNTIL && !localStorage.getItem(DOWN_KEY);
  } catch {
    return false;
  }
}
export function DownNotice({ onClose }: { onClose: () => void }) {
  const close = () => {
    try {
      localStorage.setItem(DOWN_KEY, '1');
    } catch {}
    onClose();
  };
  return (
    <div className="rel-wrap" role="dialog" aria-modal="true" aria-labelledby="down-title">
      <div className="rel-scroll">
        <i className="rod" aria-hidden="true" />
        <div className="rel-body">
          <p className="rel-kick">{tr('Thiên Đạo cáo lỗi · 01/11', 'The Heavens apologize · 01/11')}</p>
          <h2 id="down-title">{tr('Cổng Vạn Kiếp đóng gần 5 tiếng', 'The Gate Was Closed for Nearly 5 Hours')}</h2>
          <p className="rel-intro">
            {tr(
              'Sáng 1/11, từ 2h20 tới 7h13, cổng Vạn Kiếp đóng. Thiên Đạo xin lỗi chư vị đạo hữu.',
              'On the morning of 1/11, from 2:20 to 7:13 (Vietnam time), the gate was closed. The Heavens apologize to every fellow cultivator.',
            )}
          </p>
          <ul className="rel-items">
            <li>
              {tr(
                'Nguyên do: đạo hữu tới đông hơn sức một động phủ miễn phí gánh nổi, máy chủ quá hạn mức nên bị tạm khóa.',
                'The cause: more of you came than a free cave abode could bear, the server went over its limit and was paused.',
              )}
            </li>
            <li>
              {tr(
                'Thiên Đạo đã dời sang động phủ lớn hơn, lại dặn trình duyệt giữ sẵn hình ảnh để vào game nhẹ và nhanh hơn.',
                'The Heavens have moved to a larger abode, and your browser now keeps the images so the game loads lighter and faster.',
              )}
            </li>
            <li>
              {tr(
                'Tiến trình tu luyện cất ở nơi khác nên không mất gì. Ai đang chơi dở lúc cổng đóng thì vào lại là chơi tiếp được.',
                'Your progress is stored elsewhere, so nothing was lost. If you were mid-life when the gate closed, just come back and carry on.',
              )}
            </li>
          </ul>
          <div className="rel-acts">
            <button className="btn btn-red btn-big" onClick={close}>
              {tr('Chơi tiếp', 'Keep playing')}
            </button>
          </div>
        </div>
        <i className="rod" aria-hidden="true" />
      </div>
    </div>
  );
}

/** Quà Thiên Đạo (phúc duyên) vừa lĩnh: hiện một lần ngay khi nhận */
export function GiftNotice({ gifts, onClose }: { gifts: { amount: number; note: string }[]; onClose: () => void }) {
  const total = gifts.reduce((a, g) => a + g.amount, 0);
  return (
    <div className="rel-wrap" role="dialog" aria-modal="true" aria-labelledby="gift-title">
      <div className="rel-scroll">
        <i className="rod" aria-hidden="true" />
        <div className="rel-body gift-body">
          <span className="rel-seal" aria-hidden="true">
            
            {tr("Phúc", "Fortune")}
          </span>
          <p className="rel-kick">{tr("Phúc duyên tìm đến", "Fortune finds you")}</p>
          <h2 id="gift-title">+{total}{tr(" phúc duyên", " Fortune")}</h2>
          {gifts.map((g, i) => (
            <p key={i} className="rel-intro">
              {g.note}
            </p>
          ))}
          <p className="gift-hint">{tr("Phúc duyên theo bạn qua mọi kiếp, dùng để chọn thiên phú khi đầu thai. Xem thư trong Hộp thư giang hồ.", "Fortune follows you through every life and is spent on talents when you are reborn. Check the letter in your Jianghu Mailbox.")}</p>
          <div className="rel-acts">
            <button className="btn btn-red btn-big" onClick={onClose}>
              
              {tr("Đa tạ", "Many thanks")}
            </button>
          </div>
        </div>
        <i className="rod" aria-hidden="true" />
      </div>
    </div>
  );
}
