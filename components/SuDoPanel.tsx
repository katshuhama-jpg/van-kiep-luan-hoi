'use client';

/**
 * 4.6.0 Sư Đồ: khối nhỏ ở màn Chân thân. Sư phụ của ngươi và tiến độ thành tài, số đệ tử, danh hiệu sư phụ,
 * nút Mời đệ tử (thẻ chia sẻ có hình chân thân), nhận phúc duyên thưởng khi có đệ tử thành tài.
 */
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import ShareSheet from '@/components/ShareSheet';
import type { Player } from '@/lib/auth';
import { shareSuDo } from '@/lib/ctCard';
import type { Meta } from '@/lib/game/types';
import type { ShareOut } from '@/lib/shareCard';
import { SON_MON_ON } from '@/lib/flags';
import { realApi } from '@/lib/sonmon/api';
import { metaWritable } from '@/lib/storage';
import { suAnSet, suClaim, suHop, suInfo, suList, suState, suTim, suTitle, type SuDe, type SuHop, type SuInfo, type SuTim } from '@/lib/suDo';
import { SuTimSheet } from './SuTim';
import { SuHopList, SuTimDeSheet } from './SuMoi';
import { track } from '@/lib/track';
import { tr } from '@/lib/i18n';

const DAY = 86400000;
const HOUR = 3600000;

/** thanh 10 ô: số kiếp đã tính tới thành tài */
function SuBar({ n, st }: { n: number; st: 'tai' | 'tu' | 'het' }) {
  return (
    <span className={`su-bar su-bar-${st}`} role="img" aria-label={tr(`${n}/10 kiếp`, `${n}/10 lives`)}>
      {Array.from({ length: 10 }, (_, i) => (
        <i key={i} className={i < n ? 'on' : ''} />
      ))}
    </span>
  );
}

const ngay = (iso: string) => {
  const d = new Date(Date.parse(iso) + 7 * HOUR);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
};
function truoc(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - Date.parse(iso);
  if (ms < HOUR) return tr('vừa chơi', 'just played');
  if (ms < DAY) return tr(`chơi ${Math.floor(ms / HOUR)} giờ trước`, `played ${Math.floor(ms / HOUR)}h ago`);
  return tr(`chơi ${Math.floor(ms / DAY)} ngày trước`, `played ${Math.floor(ms / DAY)}d ago`);
}

/** một dòng tiến độ (dùng cho cả sư phụ của ngươi và từng đệ tử) */
function suLine(kiep: number, han: string | null, thanhTai: string | null): string {
  const st = suState({ thanh_tai_luc: thanhTai, han });
  if (st === 'tai') return tr(`Thành tài ngày ${ngay(thanhTai!)}`, `Graduated on ${ngay(thanhTai!)}`);
  if (st === 'het') return tr(`${kiep}/10 kiếp, đã hết hạn 7 ngày`, `${kiep}/10 lives, the 7 days are over`);
  const left = Math.max(1, Math.ceil((Date.parse(han!) - Date.now()) / DAY));
  return tr(`${kiep}/10 kiếp, còn ${left} ngày`, `${kiep}/10 lives, ${left} day${left === 1 ? '' : 's'} left`);
}

function SuDeList({ ds }: { ds: SuDe[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? ds : ds.slice(0, 5);
  return (
    <>
      <ul className="su-list">
        {shown.map((d) => {
          const st = suState(d);
          const seen = st === 'tu' ? truoc(d.choi_luc) : null;
          return (
            <li key={d.ten} className={`su-item su-${st}`}>
              <div className="su-item-h">
                <b>{d.phap_danh ?? d.ten}</b> <small>@{d.ten}</small>
                <span className={`su-chip su-chip-${st}`}>{st === 'tai' ? tr('Thành tài', 'Graduated') : st === 'tu' ? tr('Đang tu', 'Training') : tr('Hết hạn', 'Time up')}</span>
              </div>
              <SuBar n={d.kiep} st={st} />
              <small className="su-item-s">
                {suLine(d.kiep, d.han, d.thanh_tai_luc)}
                {seen ? ` · ${seen}` : ''}
              </small>
            </li>
          );
        })}
      </ul>
      {ds.length > 5 && (
        <button className="btn su-more" onClick={() => setAll(!all)}>
          {all ? tr('Thu gọn', 'Show less') : tr(`Xem cả ${ds.length} đệ tử`, `See all ${ds.length} disciples`)}
        </button>
      )}
    </>
  );
}

export default function SuDoPanel({ user, meta, onGain }: { user: Player | null; meta: Meta; onGain: (n: number) => Promise<void> }) {
  const [info, setInfo] = useState<SuInfo | null>(null);
  // Ngày 7: sư phụ đã vào sơn môn thì có nút sang môn đó (môn sư phụ đứng đầu danh sách ở tab Sơn Môn)
  const [suMon, setSuMon] = useState(false);
  const coSu = !!info?.su;
  useEffect(() => {
    if (!SON_MON_ON || !coSu) return;
    let live = true;
    realApi()
      .suMon()
      .then((x) => live && setSuMon(x != null), () => {});
    return () => {
      live = false;
    };
  }, [coSu]);
  const [ds, setDs] = useState<SuDe[] | null>(null);
  const [gain, setGain] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [out, setOut] = useState<ShareOut | null>(null);
  const asked = useRef<string | null>(null);
  const [tim, setTim] = useState<SuTim | null>(null);
  const [find, setFind] = useState(false);
  // 18/11: lời mời / lời xin đang chờ, và sư phụ tìm người mới để mời
  const [hop, setHop] = useState<SuHop | null>(null);
  const [timDe, setTimDe] = useState(false);
  const laSu = (meta.lives ?? 0) >= 20 && !!meta.chanThan;
  useEffect(() => {
    let live = true;
    suHop(user).then((x) => live && setHop(x));
    return () => {
      live = false;
    };
  }, [user, timDe, find]);
  useEffect(() => {
    let live = true;
    suTim(user).then((x) => live && setTim(x));
    return () => {
      live = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || asked.current === user.username) return;
    asked.current = user.username;
    // không hủy khi unmount: lệnh nhận thưởng đã gửi thì phải cộng xong vào hồ sơ
    (async () => {
      const x = await suInfo(user);
      if (!x) return;
      setInfo(x);
      if (x.de_tu > 0) suList(user).then((l) => l && setDs(l)).catch(() => {});
      // chỉ nhận khi hồ sơ ghi được lên máy chủ, nếu không phúc duyên vừa nhận sẽ mất
      if (x.cho_nhan > 0 && metaWritable()) {
        const n = await suClaim(user);
        if (n > 0) {
          await onGain(n);
          track('su_done', { n });
          setGain(n);
          setInfo({ ...x, cho_nhan: 0 });
        }
      }
    })().catch(() => {});
  }, [user, onGain]);

  const title = info ? suTitle(info.thanh_tai_n) : null;
  return (
    <section id="su-do" className="panel su-do" aria-label={tr('Sư Đồ', 'Master and Disciple')}>
      <h3 className="su-h">
        {tr('Sư Đồ', 'Master and Disciple')}
        {title && <span className="su-title">{title}</span>}
      </h3>
      {gain > 0 && <p className="su-gain">{tr(`+${gain} phúc duyên từ Sư Đồ`, `+${gain} Fortune from Master and Disciple`)}</p>}
      {info && (
        <dl className="su-rows">
          {info.su && (
            <>
              <dt>{tr('Sư phụ', 'Master')}</dt>
              <dd>
                {info.su.phap_danh ? `${info.su.phap_danh} ` : ''}
                <small>@{info.su.ten}</small>
                <br />
                <SuBar n={Math.min(info.kiep, 10)} st={suState({ thanh_tai_luc: info.thanh_tai ? new Date().toISOString() : null, han: info.han })} />
                <small>{info.thanh_tai ? tr('Ngươi đã thành tài.', 'You have graduated.') : suLine(Math.min(info.kiep, 10), info.han, null)}</small>
                {SON_MON_ON && suMon && (
                  <Link className="btn su-mon" href="/son-mon" onClick={() => track('su_mon_open')}>
                    {tr('Vào môn của sư phụ', "Go to master's sect")}
                  </Link>
                )}
              </dd>
            </>
          )}
          <dt>{tr('Đệ tử', 'Disciples')}</dt>
          <dd>
            {info.de_tu} <small>{tr(`(thành tài ${info.thanh_tai_n})`, `(${info.thanh_tai_n} graduated)`)}</small>
          </dd>
        </dl>
      )}
      {hop && hop.den.length > 0 && (
        <>
          <h4 className="su-hop-h">{tr('Đang chờ ngươi trả lời', 'Waiting for your answer')}</h4>
          <SuHopList
            user={user}
            hop={hop}
            onChange={() => {
              suHop(user).then(setHop);
              suInfo(user).then((x) => x && setInfo(x));
              suList(user).then((l) => l && setDs(l));
            }}
          />
        </>
      )}
      {ds && ds.length > 0 && <SuDeList ds={ds} />}
      {user && laSu && (
        <button className="btn su-invite" style={{ marginBottom: 8 }} onClick={() => setTimDe(true)}>
          {tr('Tìm người mới để mời', 'Find new players to invite')}
        </button>
      )}
      <button
        className="btn su-invite"
        disabled={!user || drawing}
        onClick={async () => {
          if (!user) return;
          setDrawing(true);
          track('su_invite', { n: info?.de_tu ?? 0 });
          const r = await shareSuDo(meta, user.username).catch(() => null);
          setDrawing(false);
          if (r?.link) setOut(r);
        }}
      >
        {drawing ? tr('Đang vẽ thẻ...', 'Drawing your card...') : tr('Gửi link mời', 'Share invite link')}
      </button>
      <small className="su-sub">
        {user
          ? tr('Người mới vào bằng link của ngươi, chơi xong 10 kiếp trong 7 ngày: thầy trò mỗi người +20 phúc duyên.', 'A new player who joins through your link and finishes 10 lives in 7 days: you each get +20 Fortune.')
          : tr('Đăng nhập để có link mời', 'Log in to get an invite link')}
      </small>
      {/* 16/11 tối: người mới chưa có sư phụ thì tìm; người chơi lâu chọn có hiện tên trong danh sách Tìm sư phụ không */}
      {tim?.can && !info?.su && (
        <button className="btn su-invite" style={{ marginTop: 8 }} onClick={() => (setFind(true), track('su_tim_open_panel'))}>
          {tr('Tìm sư phụ', 'Find a master')}
        </button>
      )}
      {tim && user && (meta.lives ?? 0) >= 20 && (
        <label className="su-an">
          <input
            type="checkbox"
            checked={!tim.an}
            onChange={async (e) => {
              const r = await suAnSet(user, !e.target.checked);
              if (r !== null) setTim({ ...tim, an: r });
            }}
          />
          {tr('Hiện tên ta trong danh sách Tìm sư phụ của người mới', 'Show me in the Find a master list for new players')}
        </label>
      )}
      {timDe && <SuTimDeSheet user={user} onClose={() => setTimDe(false)} />}
      {find && <SuTimSheet user={user} onClose={() => setFind(false)} onDone={() => suInfo(user).then((x) => x && setInfo(x))} />}
      {out && <ShareSheet out={out} kind="life" onClose={() => setOut(null)} />}
    </section>
  );
}
