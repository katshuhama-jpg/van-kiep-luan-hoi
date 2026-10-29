'use client';

/**
 * Trang đầu "giang hồ đang sống" (học từ 1in8b): bộ đếm đạo hữu đang luân hồi, dòng tin vừa xảy ra,
 * thiên tượng hôm nay, ba bia mới nhất có thắp hương, và thanh "Tiếp tục" ghim dưới đáy.
 */
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { loadAll, thapHuong } from '@/lib/storage';
import { omenToday } from '@/lib/game/hook';
import { realmLabel } from '@/lib/game/data';
import { toRival } from '@/lib/social';
import { foeChar } from '@/lib/game/duel';
import Sprite from './Sprite';
import type { Player } from '@/lib/auth';
import type { Character } from '@/lib/game/types';
import { tr } from '@/lib/i18n';

type Life = { id: number; player_name: string; char_name: string; life_no: number; age: number; realm: string; realm_no: number | null; layer_no: number | null; ascended: boolean; cause: string | null; epitaph: string | null; incense: number; created_at: string; look: Record<string, unknown> | null };

const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return tr('vừa xong', 'just now');
  if (m < 60) return tr(`${m} phút trước`, `${m} min ago`);
  const h = Math.round(m / 60);
  return h < 24 ? tr(`${h} giờ trước`, `${h} h ago`) : tr(`${Math.round(h / 24)} ngày trước`, `${Math.round(h / 24)} d ago`);
};
const isTest = (n: string) => /^(test|ui)_/.test(n) || n === 'Khách' || n === 'Guest';

function lineOf(l: Life): string {
  const who = `${l.char_name} (@${l.player_name})`;
  if (l.ascended) return tr(`${who} đã phi thăng ở kiếp thứ ${l.life_no}.`, `${who} ascended in life #${l.life_no}.`);
  const realm = l.realm_no ? realmLabel(l.realm_no, l.layer_no ?? 1) : tr('phàm nhân', 'a mortal');
  return tr(`${who} vừa khép lại một kiếp, ${l.age} tuổi, ${realm}.`, `${who} ended a life at ${l.age}, ${realm}.`);
}

export type LiveData = { online: number | null; total: number | null; today: number | null; lives: Life[] };

/** Số liệu giang hồ cho trang đầu: tải một lần, làm mới mỗi phút */
export function useLive(): LiveData {
  const [online, setOnline] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [today, setToday] = useState<number | null>(null);
  const [lives, setLives] = useState<Life[]>([]);
  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    let live = true;
    const load = () => {
      sb.rpc('vkl_online_now').then(({ data }) => live && typeof data === 'number' && setOnline(data));
      // số luôn tăng (tổng kiếp) làm số lớn, thay cho số người đang chơi có lúc bằng 0
      sb.from('vkl_lives')
        .select('id', { count: 'exact', head: true })
        .then(({ count }) => live && count !== null && setTotal(count));
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      sb.from('vkl_lives')
        .select('player_name')
        .gte('created_at', midnight.toISOString())
        .limit(2000)
        .then(({ data }) => live && data && setToday(new Set((data as { player_name: string }[]).map((r) => r.player_name).filter((n) => !isTest(n))).size));
      sb.from('vkl_lives')
        .select('id, player_name, char_name, life_no, age, realm, realm_no, layer_no, ascended, cause, epitaph, incense, created_at, look')
        .order('created_at', { ascending: false })
        .limit(30)
        .then(({ data }) => live && setLives(((data as Life[] | null) ?? []).filter((l) => !isTest(l.player_name))));
    };
    load();
    const t = setInterval(load, 60000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);
  return { online, total, today, lives };
}

/** Dòng đếm: tổng kiếp (luôn tăng), số đạo hữu hôm nay, người đang chơi khi từ 2 người */
export function LiveCount({ d }: { d: LiveData }) {
  return (
    <div className="lw-count">
      <b>{d.total !== null ? d.total.toLocaleString(tr('vi-VN', 'en-US')) : '…'}</b>
      <span>{tr('kiếp đã luân hồi trong giang hồ', 'lives lived in the jianghu so far')}</span>
      <small>
        {d.today ? tr(`${d.today} đạo hữu đã tu luyện hôm nay`, `${d.today} Daoists cultivated today`) : tr('Hôm nay chưa ai khép lại kiếp nào, đạo hữu mở hàng đi', 'No life has ended yet today - be the first')}
        {d.online !== null && d.online >= 2 ? tr(` · ${d.online} người đang chơi`, ` · ${d.online} playing now`) : ''}
      </small>
    </div>
  );
}

/** Thiên tượng hôm nay gọn một dòng */
export function OmenLine() {
  const omen = useMemo(() => omenToday(), []);
  return (
    <div className="lw-omen" title={tr('Mọi kiếp đầu thai hôm nay đều chịu thiên tượng này.', 'Every life born today lives under this omen.')}>
      <span className="lw-omen-ic" aria-hidden="true">
        {omen.icon}
      </span>
      <p>
        <small>{tr('Thiên tượng hôm nay', "Today's omen")}</small>
        <b>{omen.name}</b> {omen.desc}
      </p>
    </div>
  );
}

/**
 * Tin giang hồ hiện ra rồi tắt: mỗi tin 5 giây, nghỉ 4 giây, nổi ngay trên thanh Đầu thai.
 * Chỉ lấy tin trong 24 giờ, không che nội dung, không bấm được.
 */
export function NewsToast({ d }: { d: LiveData }) {
  const recent = useMemo(() => d.lives.filter((l) => Date.now() - new Date(l.created_at).getTime() < 86400_000).slice(0, 12), [d.lives]);
  const [i, setI] = useState(-1);
  useEffect(() => {
    if (!recent.length) return;
    let k = 0;
    let shown = false;
    let t: ReturnType<typeof setTimeout>;
    const step = () => {
      shown = !shown;
      if (shown) {
        setI(k % recent.length);
        k++;
        t = setTimeout(step, 5000);
      } else {
        setI(-1);
        t = setTimeout(step, 4000);
      }
    };
    t = setTimeout(step, 2500);
    return () => clearTimeout(t);
  }, [recent]);
  const n = i >= 0 ? recent[i] : null;
  if (!n) return null;
  return (
    <p key={n.id} className="lw-toast" role="status">
      <i aria-hidden="true" />
      <small>{ago(n.created_at)}</small> {lineOf(n)}
    </p>
  );
}

/** Ba bia mới nhất, ưu tiên bia có câu khắc, có thắp hương */
export function NewGraves({ d, user }: { d: LiveData; user: Player | null }) {
  const [burnt, setBurnt] = useState<Record<number, number>>({});
  const graves = useMemo(() => {
    const withWords = d.lives.filter((l) => l.epitaph && l.epitaph.trim());
    return [...withWords, ...d.lives.filter((l) => !withWords.includes(l))].slice(0, 3);
  }, [d.lives]);
  const burn = async (l: Life) => {
    if (!user || burnt[l.id] !== undefined) return;
    const n = await thapHuong(user, l.id);
    if (n !== null) setBurnt((b) => ({ ...b, [l.id]: n }));
  };
  if (!graves.length) return null;
  return (
    <section className="lw">
      <h3 className="lw-h">
        {tr('Bia mới dựng', 'Newest tombstones')}
        <Link href="/nghia-trang">{tr('Xem nghĩa trang ›', 'Cemetery ›')}</Link>
      </h3>
      <div className="lw-graves">
        {graves.map((l) => {
          const r = toRival(l.player_name, { ...(l.look ?? {}), name: l.char_name, age: l.age, realm: l.realm_no ?? 0, layer: l.layer_no ?? 1, lifeNo: l.life_no, alive: false });
          const n = burnt[l.id] ?? l.incense;
          return (
            <div key={l.id} className="lw-grave">
              <div className="lw-grave-pic">{r && <Sprite c={foeChar(r) as Character} size={56} anim="idle" dir={2} />}</div>
              <b>{l.char_name}</b>
              <small>
                @{l.player_name} · {l.age}
                {tr(' tuổi', ' y/o')}
              </small>
              <p>“{(l.epitaph && l.epitaph.trim()) || l.cause}”</p>
              {user ? (
                <button className="btn lw-burn" onClick={() => burn(l)} disabled={burnt[l.id] !== undefined}>
                  {burnt[l.id] !== undefined ? tr(`Đã thắp · ${n}`, `Lit · ${n}`) : tr(`Thắp hương · ${n}`, `Burn incense · ${n}`)}
                </button>
              ) : (
                <small className="lw-inc">{tr(`${n} nén hương`, `${n} incense`)}</small>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Thanh ghim dưới đáy: tiếp tục kiếp đang dở hoặc đầu thai ngay, một chạm */
export function ContinueBar({ user, ready, guest }: { user: Player | null; ready: boolean; guest?: boolean }) {
  const [cur, setCur] = useState<Character | null | undefined>(undefined);
  useEffect(() => {
    if (!ready) return;
    loadAll(user)
      .then(({ save }) => setCur(save?.char && !save.char.dead ? save.char : null))
      .catch(() => setCur(null));
  }, [ready, user]);
  return (
    <div className="lw-bar">
      <Link href="/choi" className="btn btn-red btn-big lw-bar-go">
        {cur ? (
          <>
            {tr('Tiếp tục', 'Continue')}
            <small>
              {cur.name} · {Math.floor(cur.age)}
              {tr(' tuổi', ' y/o')} · {cur.realm === 0 ? tr('Phàm nhân', 'Mortal') : realmLabel(cur.realm, cur.layer, cur.cosmos)}
            </small>
          </>
        ) : (
          <>
            {tr('Đầu thai ngay', 'Be reborn now')}
            {guest && <small>{tr('Chơi ngay, chưa cần tài khoản', 'Play now, no account needed')}</small>}
          </>
        )}
      </Link>
    </div>
  );
}
