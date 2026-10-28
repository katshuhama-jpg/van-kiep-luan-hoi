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

export function LiveWorld({ user }: { user: Player | null }) {
  const [online, setOnline] = useState<number | null>(null);
  const [hour, setHour] = useState<number | null>(null);
  const [lives, setLives] = useState<Life[]>([]);
  const [tick, setTick] = useState(0);
  const [burnt, setBurnt] = useState<Record<number, number>>({});
  const omen = useMemo(() => omenToday(), []);

  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    let live = true;
    const load = () => {
      sb.rpc('vkl_online_now').then(({ data }) => live && typeof data === 'number' && setOnline(data));
      sb.from('vkl_lives')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', new Date(Date.now() - 3600_000).toISOString())
        .then(({ count }) => live && setHour(count ?? 0));
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
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 3500);
    return () => clearInterval(t);
  }, []);

  // ba bia mới nhất, ưu tiên bia có câu khắc
  const graves = useMemo(() => {
    const withWords = lives.filter((l) => l.epitaph && l.epitaph.trim());
    return [...withWords, ...lives.filter((l) => !withWords.includes(l))].slice(0, 3);
  }, [lives]);
  const news = lives.length ? lives[tick % Math.min(lives.length, 12)] : null;

  const burn = async (l: Life) => {
    if (!user || burnt[l.id] !== undefined) return;
    const n = await thapHuong(user, l.id);
    if (n !== null) setBurnt((b) => ({ ...b, [l.id]: n }));
  };

  return (
    <section className="lw" aria-label={tr('Giang hồ lúc này', 'The world right now')}>
      <div className="lw-count">
        <b>{online ?? '…'}</b>
        <span>{tr('đạo hữu đang luân hồi lúc này', 'fellow Daoists in the cycle right now')}</span>
        {hour !== null && <small>{tr(`${hour} kiếp đã khép lại trong một giờ qua`, `${hour} lives ended in the past hour`)}</small>}
      </div>
      {news && (
        <p key={news.id + '-' + tick} className="lw-news">
          <i aria-hidden="true" />
          <small>{ago(news.created_at)}</small> {lineOf(news)}
        </p>
      )}
      <div className="lw-omen">
        <span className="lw-omen-ic" aria-hidden="true">
          {omen.icon}
        </span>
        <div>
          <small>{tr('Thiên tượng hôm nay', "Today's omen")}</small>
          <b>{omen.name}</b>
          <span>{omen.desc}</span>
          <em>{tr('Mọi kiếp đầu thai hôm nay đều chịu thiên tượng này.', 'Every life born today lives under this omen.')}</em>
        </div>
      </div>
      {graves.length > 0 && (
        <>
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
        </>
      )}
    </section>
  );
}

/** Thanh ghim dưới đáy: tiếp tục kiếp đang dở hoặc đầu thai ngay, một chạm */
export function ContinueBar({ user, ready }: { user: Player | null; ready: boolean }) {
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
          tr('Đầu thai ngay', 'Be reborn now')
        )}
      </Link>
    </div>
  );
}
