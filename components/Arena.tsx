'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import Sprite from '@/components/Sprite';
import Podium from '@/components/Podium';
import type { Player } from '@/lib/auth';
import { foeChar, simulateDuel } from '@/lib/game/duel';
import type { RivalChar } from '@/lib/game/types';
import { ARENA_TURNS, arenaFight, arenaState, playerBest, type ArenaState } from '@/lib/social';

type Bout = { opp: string; me: RivalChar; foe: RivalChar; win: boolean; hpMe: number; hpFoe: number; rounds: number; delta?: number; shown: boolean };

const rank = (elo: number) => (elo >= 1300 ? 'Lôi Đài Tông Sư' : elo >= 1150 ? 'Lôi Đài Cao Thủ' : elo >= 1050 ? 'Lôi Đài Hảo Thủ' : elo >= 950 ? 'Lôi Đài Tân Tú' : 'Lôi Đài Học Đồ');

/**
 * Lôi đài hằng ngày: mỗi ngày 3 trận, đánh với bóng nhân vật mạnh nhất của người chơi có điểm gần mình.
 * Không cần ai trả lời, không mất đồ, không chết. Mỗi thứ Hai trao danh hiệu và kéo điểm về gần mốc.
 */
export default function Arena({ user }: { user: Player | null }) {
  const [st, setSt] = useState<ArenaState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [bout, setBout] = useState<Bout | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => {
    arenaState(user)
      .then(setSt)
      .catch(() => setSt(null));
  }, [user]);
  useEffect(() => {
    load();
  }, [load]);

  async function fight(opp: string) {
    if (!user || busy) return;
    setBusy(opp);
    setErr(null);
    const [me, foe] = await Promise.all([playerBest(user.username), playerBest(opp)]);
    if (!me || !foe) {
      setBusy(null);
      setErr(me ? 'Không tìm thấy bóng của đối thủ.' : 'Bạn cần ít nhất một kiếp đã sống để lên lôi đài.');
      return;
    }
    const r = simulateDuel(me, foe, Math.random);
    const win = r.result === 'win' || (r.result === 'draw' && r.hpMe >= r.hpFoe);
    const b: Bout = { opp, me, foe, win, hpMe: r.hpMe, hpFoe: r.hpFoe, rounds: r.rounds, shown: false };
    setBout(b);
    const detail = `${me.name} ${win ? 'thắng' : 'thua'} ${foe.name} sau ${r.rounds} hiệp.`;
    const res = await arenaFight(user, opp, win, detail);
    setBusy(null);
    if (!res || res.error) {
      setErr(res?.error === 'NO_TURNS' ? 'Hôm nay đã hết lượt lôi đài.' : 'Lôi đài đang đông, thử lại sau.');
      return;
    }
    setBout({ ...b, delta: res.delta });
    // chờ hiệu ứng đánh xong rồi mới tải lại đối thủ mới
    setTimeout(() => {
      setBout((x) => (x ? { ...x, shown: true } : x));
      load();
    }, 1800);
  }

  if (!st) return <p>Đang dựng lôi đài...</p>;
  const left = st.me ? Math.max(0, ARENA_TURNS - st.me.used) : 0;
  return (
    <section className="arena">
      <Podium top={st.top} me={user?.username} />
      {st.me ? (
        <div className="ar-me">
          <span className="ar-elo">
            <small>{rank(st.me.elo)}</small>
            <b>{st.me.elo}</b>
          </span>
          <span className="ar-info">
            Tuần này {st.me.wins} thắng · {st.me.losses} thua
            <br />
            Hôm nay còn <b>{left}</b>/{ARENA_TURNS} lượt
          </span>
        </div>
      ) : (
        <p className="note">
          <Link href="/dang-nhap">Đăng nhập</Link> để lên lôi đài.
        </p>
      )}
      <p className="note ar-rule">Đánh với bóng nhân vật mạnh nhất của người chơi có điểm gần bạn. Không mất đồ, không chết. Thắng 3 trận mở mảnh XV Thiên thư. Mỗi thứ Hai trao danh hiệu Bá Chủ, Á Chủ, Tam Kiệt.</p>

      {bout && (
        <div className={`ar-bout ${bout.shown ? 'done' : 'live'}`} aria-live="polite">
          <div className="ar-side">
            <Sprite c={foeChar(bout.me)} size={72} anim="slash" dir={3} />
            <span className="ar-hp">
              <i style={{ width: `${bout.shown ? bout.hpMe : 100}%` }} />
            </span>
            <small>{bout.me.name}</small>
          </div>
          <b className="ar-vs">{bout.shown ? (bout.win ? 'THẮNG' : 'THUA') : '⚔'}</b>
          <div className="ar-side">
            <Sprite c={foeChar(bout.foe)} size={72} anim="slash" dir={1} />
            <span className="ar-hp">
              <i style={{ width: `${bout.shown ? bout.hpFoe : 100}%` }} />
            </span>
            <small>
              {bout.foe.name} · @{bout.opp}
            </small>
          </div>
          {bout.shown && (
            <p className="ar-res">
              Sau {bout.rounds} hiệp, {bout.win ? 'bạn đánh văng bóng của' : 'bạn bị bóng của'} @{bout.opp} {bout.win ? 'khỏi lôi đài' : 'đánh văng khỏi lôi đài'}.{' '}
              {typeof bout.delta === 'number' && <b className={bout.delta >= 0 ? 'up' : 'down'}>{bout.delta >= 0 ? `+${bout.delta}` : bout.delta} điểm</b>}
            </p>
          )}
        </div>
      )}
      {err && <p className="note ar-err">{err}</p>}

      {st.me && left > 0 && (
        <>
          <h3 className="gh-h">Đối thủ hôm nay</h3>
          <ul className="ar-opps">
            {st.opps.map((o) => (
              <li key={o.username}>
                <span>
                  <b>@{o.username}</b>
                  <small>
                    {rank(o.elo)} · {o.elo} điểm
                  </small>
                </span>
                <button className="btn btn-red" disabled={!!busy} onClick={() => fight(o.username)}>
                  {busy === o.username ? 'Đang đấu...' : 'Khiêu chiến'}
                </button>
              </li>
            ))}
            {!st.opps.length && <li className="note">Chưa tìm được đối thủ, quay lại sau.</li>}
          </ul>
        </>
      )}
      {st.me && left === 0 && <p className="note">Hôm nay đã đánh đủ {ARENA_TURNS} trận. Mai lôi đài lại mở.</p>}

      {st.champs.length > 0 && (
        <>
          <h3 className="gh-h">Bá chủ tuần trước</h3>
          <ol className="ar-champs">
            {st.champs.map((c) => (
              <li key={c.rank}>
                <b>{['Lôi Đài Bá Chủ', 'Lôi Đài Á Chủ', 'Lôi Đài Tam Kiệt'][c.rank - 1]}</b> @{c.username} · {c.elo}
              </li>
            ))}
          </ol>
        </>
      )}
      {st.top.length > 3 && (
        <>
          <h3 className="gh-h">Hạng 4 trở xuống</h3>
          <ol className="gh-board ar-top">
            {st.top.slice(3).map((t, i) => (
              <li key={t.username} className={t.username === user?.username ? 'me' : ''}>
                <span className="gh-poster" aria-hidden="true">
                  {i + 4}
                </span>
                <span>
                  <b>@{t.username}</b>
                  <small>
                    {rank(t.elo)} · {t.wins} thắng, {t.losses} thua
                  </small>
                </span>
                <b className="gh-gold">{t.elo}</b>
              </li>
            ))}
          </ol>
        </>
      )}
      {!st.top.length && <p className="note">Chưa ai lên lôi đài tuần này. Long ỷ còn trống, hãy là người đầu tiên.</p>}
    </section>
  );
}

