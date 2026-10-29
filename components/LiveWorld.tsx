'use client';

/**
 * Trang đầu "giang hồ đang sống" (học từ 1in8b): bộ đếm đạo hữu đang luân hồi, dòng tin vừa xảy ra,
 * thiên tượng hôm nay, ba bia mới nhất có thắp hương, và thanh "Tiếp tục" ghim dưới đáy.
 */
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { loadAll, thapHuong } from '@/lib/storage';
import { omenToday } from '@/lib/game/hook';
import { realmLabel, realmName } from '@/lib/game/data';
import { ENDINGS } from '@/lib/game/endings';
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

export type FeedItem = { k: 'play' | 'born' | 'up' | 'end1' | 'vandao' | 'arena'; who: string; at: string; name?: string; age?: number; realm?: number; layer?: number; cosmos?: string | null; life?: number; ids?: string; foe?: string; win?: boolean };
export type LiveData = { online: number | null; total: number | null; today: number | null; lives: Life[]; feed: FeedItem[] };

/** Số liệu giang hồ cho trang đầu: tải một lần, làm mới mỗi phút */
export function useLive(): LiveData {
  const [online, setOnline] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [today, setToday] = useState<number | null>(null);
  const [lives, setLives] = useState<Life[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    let live = true;
    const load = () => {
      sb.rpc('vkl_online_now').then(({ data }) => live && typeof data === 'number' && setOnline(data));
      sb.rpc('vkl_live_feed').then(({ data }) => live && Array.isArray(data) && setFeed(data as FeedItem[]));
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
    const t = setInterval(load, 45000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);
  return { online, total, today, lives, feed };
}

/** Dải giang hồ gọn hai dòng: tổng kiếp (luôn tăng), đạo hữu hôm nay, người đang chơi; thiên tượng hôm nay */
export function LiveStrip({ d }: { d: LiveData }) {
  const omen = useMemo(() => omenToday(), []);
  return (
    <div className="lw-strip">
      <p className="lw-strip-count">
        <b>{d.total !== null ? d.total.toLocaleString(tr('vi-VN', 'en-US')) : '…'}</b> {tr('kiếp đã luân hồi', 'lives lived')}
        <small>
          {' · '}
          {d.today ? tr(`${d.today} đạo hữu hôm nay`, `${d.today} Daoists today`) : tr('hôm nay chưa ai, đạo hữu mở hàng đi', 'be the first today')}
          {d.online !== null && d.online >= 2 ? tr(` · ${d.online} đang chơi`, ` · ${d.online} playing`) : ''}
        </small>
      </p>
      <p className="lw-strip-omen" title={omen.desc}>
        <span aria-hidden="true">{omen.icon}</span> {tr('Thiên tượng: ', 'Omen: ')}
        <b>{omen.name}</b> - {omen.desc}
      </p>
    </div>
  );
}

const realmOf = (realm?: number, layer?: number, cosmos?: string | null) => (!realm ? tr('phàm nhân', 'a mortal') : realmLabel(realm, layer ?? 1, (cosmos as 'tien' | 'ma' | 'hu' | null) ?? null));

function feedOk(f: FeedItem): boolean {
  if (!f.who || isTest(f.who)) return false;
  if (f.k === 'play') return !!f.name && f.age != null && f.life != null;
  if (f.k === 'born') return f.life != null;
  if (f.k === 'arena') return !!f.foe;
  return true;
}

function feedLine(f: FeedItem): string {
  const who = `@${f.who}`;
  switch (f.k) {
    case 'play':
      return tr(`${who} đang tu: ${f.name}, ${f.age} tuổi, ${realmOf(f.realm, f.layer, f.cosmos)} (kiếp ${f.life})`, `${who} is cultivating: ${f.name}, age ${f.age}, ${realmOf(f.realm, f.layer, f.cosmos)} (life ${f.life})`);
    case 'born':
      return tr(`${who} vừa đầu thai kiếp thứ ${f.life}`, `${who} was just reborn into life #${f.life}`);
    case 'up':
      return tr(`${who} vừa đột phá ${realmName(f.realm ?? 1, (f.cosmos as 'tien' | 'ma' | 'hu' | null) ?? null)}`, `${who} just broke through to ${realmName(f.realm ?? 1, (f.cosmos as 'tien' | 'ma' | 'hu' | null) ?? null)}`);
    case 'end1': {
      const names = (f.ids ?? '').split(',').map((id) => ENDINGS.find((e) => e.id === id)?.name).filter(Boolean).join(', ');
      return tr(`${who} vừa mở kết cục mới: ${names}`, `${who} unlocked a new ending: ${names}`);
    }
    case 'vandao':
      return tr(`${who} đang bước lên đỉnh lôi, vấn đạo Chứng Đạo`, `${who} is climbing the thunder peak to attain the Dao`);
    case 'arena':
      return f.win ? tr(`${who} vừa hạ @${f.foe} trên lôi đài`, `${who} just beat @${f.foe} in the arena`) : tr(`@${f.foe} vừa đánh bại ${who} trên lôi đài`, `@${f.foe} just beat ${who} in the arena`);
  }
}

type Toast = { id: string; at: string; text: string; now?: boolean };

/**
 * Tin giang hồ hiện ra rồi tắt, nổi ngay trên thanh Đầu thai: ai đang tu, ai vừa đầu thai, đột phá,
 * mở kết cục, thắng lôi đài, khép lại một kiếp. Tin trong 2 giờ, thiếu thì lấy kiếp đã hết trong 24 giờ.
 * Mỗi tin 4,5 giây, nghỉ 2,5 giây.
 */
export function NewsToast({ d }: { d: LiveData }) {
  const items = useMemo<Toast[]>(() => {
    const now = Date.now();
    const deaths: Toast[] = d.lives.map((l) => ({ id: `l${l.id}`, at: l.created_at, text: lineOf(l) }));
    // bản lưu giữa hai kiếp (chưa đầu thai) không có nhân vật: bỏ, khỏi hiện null
    const feed: Toast[] = d.feed.filter(feedOk).map((f, k) => ({ id: `f${k}-${f.k}-${f.who}-${f.at}`, at: f.at, text: feedLine(f), now: f.k === "play" }));
    const fresh = [...feed, ...deaths.filter((x) => now - new Date(x.at).getTime() < 2 * 3600_000)];
    const list = fresh.length >= 3 ? fresh : [...fresh, ...deaths.filter((x) => now - new Date(x.at).getTime() < 86400_000)];
    // gộp trùng, mới trước, xen kẽ người đang chơi với tin vừa xảy ra
    const seen = new Set<string>();
    const uniq = list.filter((x) => (seen.has(x.text) ? false : (seen.add(x.text), true))).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    const playing = uniq.filter((x) => x.now);
    const happened = uniq.filter((x) => !x.now);
    const out: Toast[] = [];
    for (let k = 0; out.length < 16 && (k < playing.length || k < happened.length); k++) {
      if (happened[k]) out.push(happened[k]);
      if (playing[k]) out.push(playing[k]);
    }
    return out;
  }, [d.lives, d.feed]);
  const [i, setI] = useState(-1);
  const kRef = useRef(0); // giữ vị trí khi dữ liệu làm mới, không quay lại tin đầu
  useEffect(() => {
    if (!items.length) return;
    let shown = false;
    let t: ReturnType<typeof setTimeout>;
    const step = () => {
      shown = !shown;
      if (shown) {
        setI(kRef.current % items.length);
        kRef.current++;
        t = setTimeout(step, 4500);
      } else {
        setI(-1);
        t = setTimeout(step, 2500);
      }
    };
    t = setTimeout(step, 2000);
    return () => clearTimeout(t);
  }, [items]);
  const n = i >= 0 ? items[i] : null;
  if (!n) return null;
  return (
    <p key={n.id} className="lw-toast" role="status">
      <i aria-hidden="true" className={n.now ? 'live' : ''} />
      <small>{n.now ? tr('đang chơi', 'playing now') : ago(n.at)}</small> {n.text}
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
              <div className="lw-grave-pic">{r && <Sprite c={foeChar(r) as Character} size={48} anim="idle" dir={2} />}</div>
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
