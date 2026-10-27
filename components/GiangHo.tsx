'use client';

import Link from 'next/link';

import { useEffect, useState } from 'react';
import { Sheet } from './Panels';
import { sendMail, type Mail } from '@/lib/storage';
import type { Player } from '@/lib/auth';
import { BOUNTY_STEPS, HUNT_COST, SOCIAL, relTags, type SocialState } from '@/lib/game/social';
import { simulateDuel } from '@/lib/game/duel';
import type { RivalChar } from '@/lib/game/types';
import {
  bountyBoard,
  bountyClear,
  bountyPost,
  challengeAnswer,
  challengeList,
  challengeSend,
  loadSocial,
  oanGia,
  payoutClaim,
  playerBest,
  relSet,
  type BountyRow,
  type ChallengeRow,
  type OanGia,
  type RelAction,
} from '@/lib/social';

/**
 * Giang hồ: thư từ, quan hệ với người chơi khác (huynh đệ, kẻ thù, chiến thư), bảng truy nã và oan gia.
 */

export interface GiangHoApi {
  user: Player;
  money: number | null; // null nếu chưa có nhân vật đang sống
  spend: (n: number, why: string) => boolean;
  gain: (n: number, why: string) => void;
  foe: (player: string) => void; // ghi thù vào nhân vật hoặc hồ sơ
  peace: (player: string) => void; // hòa giải: xóa thù, thêm đạo tâm
  hunt: (rival: RivalChar) => void;
  hunting: string | null;
  me: () => RivalChar | null;
  feud: Record<string, number[]>;
  vendettas: string[];
}

const KIND_ICON: Record<string, string> = {
  thang: '⚔',
  thua: '☠',
  hoa: '☯',
  doc: '☠',
  tra: '🍵',
  huong: '🕯',
  hoi_am: '💬',
  thach: '⚔',
  khieu: '🔥',
  nghia: '🤝',
  nghia_req: '🤝',
  hoa_giai: '☯',
  truy_na: '☠',
  chien_thu: '📜',
  loi_dai: '🏯',
  vieng: '🕯',
  thien_dao: '✦',
  truyen_cong: '☯',
};

function ago(iso: string): string {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.round(h / 24)} ngày trước`;
}

/** Các nhãn quan hệ của một người chơi: Huynh đệ, Kẻ thù, Truy nã... */
export function RelChips({ player, s }: { player: string | null | undefined; s?: SocialState }) {
  const tags = relTags(player, s ?? SOCIAL.cur);
  if (!tags.length) return null;
  return (
    <span className="rel-chips">
      {tags.map((t) => (
        <span key={t.id} className={`rel-chip r-${t.id}`}>
          {t.text}
        </span>
      ))}
    </span>
  );
}

const MSG: Record<string, string> = {
  NO_PLAYER: 'Không tìm thấy người này.',
  BAD_AMOUNT: 'Số linh thạch không hợp lệ.',
  TOO_MANY: 'Bạn làm việc này quá nhiều, đợi một lúc nữa.',
  PENDING: 'Bạn đã gửi chiến thư cho người này rồi, đợi họ trả lời.',
  ALREADY: 'Hai người đã là huynh đệ.',
  NO_REQUEST: 'Lời mời không còn nữa.',
  ERROR: 'Mạng chập chờn, thử lại sau.',
  NO_USER: 'Cần đăng nhập.',
};

/** Bảng hành động với một người chơi: kết thân hay kết oán */
function Actions({ api, who, onDone, onTab, initMode = null }: { api: GiangHoApi; who: string; onDone: (t: string) => void; onTab?: (t: Tab) => void; initMode?: null | 'bounty' | 'chien' }) {
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<null | 'bounty' | 'chien'>(initMode);
  const [busy, setBusy] = useState(false);
  const S = SOCIAL.cur;
  const sworn = S.sworn.includes(who);
  const sentReq = S.swornSent.includes(who);
  const isFoe = S.foes.includes(who) || api.vendettas.includes(who);
  const say = () => {
    if (note.trim()) sendMail(api.user, who, 'hoi_am', `@${api.user.username} hồi âm: "${note.trim()}"`).catch(() => {});
  };
  const run = async (k: RelAction, ok: string) => {
    setBusy(true);
    const r = await relSet(api.user, who, k);
    setBusy(false);
    if (r === 'OK' || r === 'NGHIA') {
      say();
      if (k === 'thu') api.foe(who);
      if (k === 'hoa') api.peace(who);
      onDone(r === 'NGHIA' ? `Hai người cùng mời nhau, nay đã thành huynh đệ kết nghĩa với @${who}.` : ok);
    } else onDone(MSG[r] ?? 'Không làm được.');
  };
  const money = api.money;
  return (
    <div className="gh-acts">
      <input value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} placeholder="Nhắn kèm (không bắt buộc): vd Lần sau gặp lại, ta không nương tay" />
      <div className="gh-group">
        <b>Kết thân</b>
        {!sworn && (
          <button
            className="chip-btn"
            disabled={busy || sentReq}
            onClick={() => run('nghia_req', `Đã gửi lời kết nghĩa tới @${who}. Họ nhận lời thì hai người thành huynh đệ.`)}
            title="Gặp nhau thì trà luôn thật, hay ra tay trợ giúp khi bị đánh úp, hôm nào cùng chơi tu luyện thêm 5%"
          >
            {sentReq ? 'Đã mời kết nghĩa' : 'Kết nghĩa'}
          </button>
        )}
        <button className="chip-btn" disabled={busy} onClick={() => run('hoa', `Đã gửi lời hòa giải. Ân oán với @${who} xóa bỏ, đạo tâm bạn sáng thêm.`)}>
          Hòa giải
        </button>
        {!note.trim() ? null : (
          <button
            className="chip-btn"
            onClick={() => {
              say();
              onDone('Đã gửi hồi âm.');
            }}
          >
            Chỉ gửi lời
          </button>
        )}
      </div>
      <div className="gh-group">
        <b>Kết oán</b>
        <button className="chip-btn" disabled={busy || isFoe} onClick={() => run('thu', `Đã ghi thù @${who}. Lần tới gặp trong giang hồ có thể báo thù.`)}>
          {isFoe ? 'Đã ghi thù' : 'Ghi thù'}
        </button>
        <button className="chip-btn" disabled={busy} onClick={() => run('khieu', `Đã gửi thư khiêu khích. Lần tới chạm mặt @${who}, thắng thua đều gấp rưỡi.`)}>
          Khiêu khích
        </button>
        <button className={`chip-btn ${mode === 'bounty' ? 'on' : ''}`} onClick={() => setMode(mode === 'bounty' ? null : 'bounty')}>
          Treo thưởng
        </button>
        <Link className="chip-btn" href={`/thach-dau?u=${encodeURIComponent(who)}`}>
          ⚔ Hạ chiến thư
        </Link>
      </div>
      {mode && (
        <div className="gh-stake">
          <small>{mode === 'bounty' ? 'Treo thưởng lấy đầu, ai hạ được bóng của họ sẽ lĩnh hết:' : 'Hẹn đấu có cược. Họ nhận lời thì hai bóng tự đấu, kẻ thắng lấy cả hai phần cược:'}</small>
          {money === null ? (
            <small className="gh-warn">Cần một nhân vật đang sống để bỏ linh thạch.</small>
          ) : (
            <span>
              {(mode === 'bounty' ? BOUNTY_STEPS : [0, 100, 300]).map((n) => (
                <button
                  key={n}
                  className="chip-btn"
                  disabled={busy || money < n}
                  onClick={async () => {
                    if (!api.spend(n, mode === 'bounty' ? `Treo thưởng lấy đầu @${who}` : `Đặt cược chiến thư với @${who}`)) return;
                    setBusy(true);
                    const r = mode === 'bounty' ? await bountyPost(api.user, who, n) : await challengeSend(api.user, who, n);
                    setBusy(false);
                    if (r !== 'OK') {
                      api.gain(n, 'Hoàn lại linh thạch');
                      onDone(MSG[r] ?? 'Không làm được.');
                      return;
                    }
                    say();
                    onDone(mode === 'bounty' ? `Đã treo ${n} linh thạch lấy đầu @${who} trên Bảng truy nã.` : `Đã gửi chiến thư${n ? `, cược ${n} linh thạch` : ''}. Chờ @${who} trả lời.`);
                    if (mode === 'bounty') onTab?.('truy');
                  }}
                >
                  {n ? `${n} linh thạch` : 'Không cược'}
                </button>
              ))}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function MailItem({ m, api, onTab }: { m: Mail; api: GiangHoApi; onTab: (t: Tab) => void }) {
  const [open, setOpen] = useState<false | 'reply' | 'chien'>(false);
  const [done, setDone] = useState<string | null>(null);
  const from = m.from_player;
  // thư thắng thua, khiêu khích: mời đánh lại bằng chiến thư ngay tại chỗ
  const duelMail = ['thang', 'thua', 'khieu', 'thach', 'doc', 'loi_dai'].includes(m.kind);
  const S = SOCIAL.cur;
  const req = m.kind === 'nghia_req' && from && S.swornReq.includes(from);
  return (
    <li className={`mail ${m.read ? '' : 'new'} k-${m.kind}`}>
      <span className="mail-ic" aria-hidden="true">
        {KIND_ICON[m.kind] ?? '✉'}
      </span>
      <span className="mail-body">
        {m.body}
        <small>
          {ago(m.created_at)} <RelChips player={from} />
        </small>
        {req && !done && (
          <span className="mail-acts">
            <button
              className="chip-btn on"
              onClick={async () => {
                const r = await relSet(api.user, from, 'nghia_accept');
                setDone(r === 'OK' || r === 'NGHIA' ? `Đã kết nghĩa kim lan với @${from}.` : (MSG[r] ?? 'Không làm được.'));
              }}
            >
              Nhận lời kết nghĩa
            </button>
            <button
              className="chip-btn"
              onClick={async () => {
                await relSet(api.user, from, 'nghia_decline');
                setDone('Đã từ chối.');
              }}
            >
              Từ chối
            </button>
          </span>
        )}
        {from && !req && !done && (
          <span className="mail-acts">
            {m.kind === 'chien_thu' && (
              <button className="chip-btn on" onClick={() => onTab('rel')}>
                Xem chiến thư
              </button>
            )}
            {duelMail && m.kind !== 'chien_thu' && (
              <button className={`chip-btn ${open === 'chien' ? 'on' : ''}`} onClick={() => setOpen(open === 'chien' ? false : 'chien')}>
                📜 Gửi chiến thư
              </button>
            )}
            <button className={`chip-btn ${open === 'reply' ? 'on' : ''}`} onClick={() => setOpen(open === 'reply' ? false : 'reply')}>
              Hồi âm ▾
            </button>
          </span>
        )}
        {open && from && !done && <Actions key={open} api={api} who={from} onDone={setDone} onTab={onTab} initMode={open === 'chien' ? 'chien' : null} />}
        {done && <small className="mail-done">{done}</small>}
      </span>
    </li>
  );
}

type Tab = 'thu' | 'rel' | 'truy';

/** Một trận chiến thư: nhận lời thì hai bóng tự đấu ngay */
function ChallengeItem({ ch, api, onChanged }: { ch: ChallengeRow; api: GiangHoApi; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const mine = ch.from_player === api.user.username;
  const other = mine ? ch.to_player : ch.from_player;
  if (ch.status !== 'cho' || mine) {
    const res =
      ch.status === 'cho'
        ? 'đang chờ trả lời'
        : ch.status === 'tu_choi'
          ? mine
            ? 'bị từ chối, đã hoàn cược'
            : 'bạn đã từ chối'
          : ch.winner === 'hoa'
            ? 'hòa, hoàn cược'
            : ch.winner === api.user.username
              ? `bạn thắng${ch.stake ? `, +${ch.stake * 2} linh thạch` : ''}`
              : 'bạn thua';
    return (
      <li className="gh-row">
        <span>
          📜 {mine ? `Gửi @${other}` : `Từ @${other}`}
          {ch.stake ? ` · cược ${ch.stake}` : ''} · <b>{res}</b>
          {ch.detail && <small>{ch.detail}</small>}
        </span>
      </li>
    );
  }
  const accept = async () => {
    const me = api.me();
    if (!me) return setMsg('Cần một nhân vật đang sống để nhận chiến thư.');
    if (ch.stake && !api.spend(ch.stake, `Đặt cược chiến thư với @${other}`)) return setMsg(`Không đủ ${ch.stake} linh thạch để theo cược.`);
    setBusy(true);
    const foe = await playerBest(other);
    if (!foe) {
      if (ch.stake) api.gain(ch.stake, 'Hoàn lại linh thạch');
      setBusy(false);
      return setMsg('Không tìm thấy bóng của đối thủ.');
    }
    const sim = simulateDuel(me, foe, Math.random);
    const winner = sim.result === 'win' ? api.user.username : sim.result === 'lose' ? other : 'hoa';
    const detail =
      sim.result === 'draw'
        ? `${me.name} và ${foe.name} đấu ${sim.rounds} hiệp, bất phân thắng bại.`
        : `${sim.result === 'win' ? me.name : foe.name} (@${winner}) thắng sau ${sim.rounds} hiệp, còn ${sim.result === 'win' ? sim.hpMe : sim.hpFoe}% sinh lực.`;
    const r = await challengeAnswer(api.user, ch.id, true, winner, detail);
    if (r !== 'OK') {
      if (ch.stake) api.gain(ch.stake, 'Hoàn lại linh thạch');
      setBusy(false);
      return setMsg(MSG[r] ?? 'Chiến thư không còn hiệu lực.');
    }
    const pays = await payoutClaim(api.user);
    pays.forEach((p) => api.gain(p.amount, p.note));
    setBusy(false);
    setMsg(`${detail}${sim.result === 'win' && ch.stake ? ` Bạn lấy ${ch.stake * 2} linh thạch.` : ''}`);
    onChanged();
  };
  return (
    <li className="gh-row hot">
      <span>
        📜 <b>@{other}</b> gửi chiến thư{ch.stake ? `, cược ${ch.stake} linh thạch` : ''}.<small>Nhận lời thì bóng hai bên tự đấu 5 hiệp. Từ chối thì bị gắn tiếng "Kẻ né chiến" một ngày.</small>
        {msg ? (
          <small className="mail-done">{msg}</small>
        ) : (
          <span className="mail-acts">
            <button className="chip-btn on" disabled={busy} onClick={accept}>
              Nhận lời{ch.stake ? ` (${ch.stake})` : ''}
            </button>
            <button
              className="chip-btn"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await challengeAnswer(api.user, ch.id, false, null, '');
                setBusy(false);
                setMsg('Bạn đã từ chối. Giang hồ gọi bạn là kẻ né chiến trong một ngày.');
                onChanged();
              }}
            >
              Từ chối
            </button>
          </span>
        )}
      </span>
    </li>
  );
}

function PersonRow({ api, who, sub, children }: { api: GiangHoApi; who: string; sub?: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const lives = new Set(api.feud[who] ?? []).size;
  return (
    <li className="gh-row">
      <span>
        <b>@{who}</b> <RelChips player={who} />
        {lives >= 3 && <span className="rel-chip r-feud">Báo thù {lives} đời</span>}
        {sub && <small>{sub}</small>}
        <span className="mail-acts">
          {children}
          <button className={`chip-btn ${open ? 'on' : ''}`} onClick={() => setOpen(!open)}>
            Khác ▾
          </button>
        </span>
        {open && !done && <Actions api={api} who={who} onDone={setDone} />}
        {done && <small className="mail-done">{done}</small>}
      </span>
    </li>
  );
}

export function GiangHoSheet({ mail, api, onClose, start = 'thu' }: { mail: Mail[]; api: GiangHoApi; onClose: () => void; start?: Tab }) {
  const [tab, setTab] = useState<Tab>(start);
  const [s, setS] = useState<SocialState>(SOCIAL.cur);
  const [chs, setChs] = useState<ChallengeRow[]>([]);
  const [board, setBoard] = useState<BountyRow[]>([]);
  const [pairs, setPairs] = useState<OanGia[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  useEffect(() => {
    let off = false;
    loadSocial(api.user).then((x) => !off && setS({ ...x }));
    challengeList(api.user).then((x) => !off && setChs(x));
    bountyBoard().then((x) => !off && setBoard(x));
    oanGia().then((x) => !off && setPairs(x));
    return () => {
      off = true;
    };
  }, [api.user, tick]);
  const me = api.user.username;
  const waiting = chs.filter((c) => c.status === 'cho' && c.to_player === me).length;
  const foes = Array.from(new Set([...s.foes, ...api.vendettas])).filter((p) => p !== me);
  const myBounty = s.bounty[me] ?? 0;
  const hunt = async (who: string) => {
    if (api.money === null) return setMsg('Cần một nhân vật đang sống để truy sát.');
    if (api.money < HUNT_COST) return setMsg(`Cần ${HUNT_COST} linh thạch để thuê người dò tung tích.`);
    const rival = await playerBest(who);
    if (!rival) return setMsg(`Không dò ra tung tích của @${who}.`);
    if (!api.spend(HUNT_COST, `Thuê người dò tung tích @${who}`)) return;
    api.hunt(rival);
    setMsg(`Người dò tin đã lên đường. Trong vòng một năm, bạn sẽ chạm mặt ${rival.name} (@${who}). Thắng được thưởng gấp đôi và lấy lại đồ bị cướp.`);
  };
  return (
    <Sheet title="Giang hồ" onClose={onClose}>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'thu'} className={tab === 'thu' ? 'on' : ''} onClick={() => setTab('thu')}>
          Thư
        </button>
        <button role="tab" aria-selected={tab === 'rel'} className={tab === 'rel' ? 'on' : ''} onClick={() => setTab('rel')}>
          Ân oán{waiting + s.swornReq.length ? ` (${waiting + s.swornReq.length})` : ''}
        </button>
        <button role="tab" aria-selected={tab === 'truy'} className={tab === 'truy' ? 'on' : ''} onClick={() => setTab('truy')}>
          Truy nã
        </button>
      </div>
      {msg && (
        <p className="note gh-msg" role="status">
          {msg}
        </p>
      )}

      {tab === 'thu' &&
        (!mail.length ? (
          <p className="note">Giang hồ yên ắng, chưa ai nhắc tới bạn.</p>
        ) : (
          <>
            <p className="note" style={{ marginTop: 0 }}>
              Lúc bạn vắng mặt, bóng nhân vật của bạn vẫn lang bạt giang hồ. Bấm Hồi âm để kết thân hay kết oán.
            </p>
            <ul className="mail-list">
              {mail.map((m) => (
                <MailItem key={m.id} m={m} api={api} onTab={setTab} />
              ))}
            </ul>
          </>
        ))}

      {tab === 'rel' && (
        <div className="gh-rel">
          {myBounty > 0 && (
            <div className="gh-wanted">
              <b>☠ Đầu bạn đang bị treo {myBounty} linh thạch.</b>
              <small>Ai hạ được bóng của bạn sẽ lĩnh thưởng. Bỏ ra đúng số đó để chuộc lệnh truy nã.</small>
              <button
                className="btn"
                disabled={api.money === null || api.money < myBounty}
                onClick={async () => {
                  if (!api.spend(myBounty, 'Chuộc lệnh truy nã')) return;
                  await bountyClear(api.user);
                  setMsg('Lệnh truy nã trên đầu bạn đã được gỡ.');
                  refresh();
                }}
              >
                Chuộc lệnh ({myBounty} linh thạch)
              </button>
            </div>
          )}
          {chs.length > 0 && (
            <>
              <h3 className="gh-h">Chiến thư</h3>
              <ul className="mail-list">
                {chs.map((c) => (
                  <ChallengeItem key={c.id} ch={c} api={api} onChanged={refresh} />
                ))}
              </ul>
            </>
          )}
          {s.swornReq.length > 0 && (
            <>
              <h3 className="gh-h">Lời mời kết nghĩa</h3>
              <ul className="mail-list">
                {s.swornReq.map((p) => (
                  <li key={p} className="gh-row hot">
                    <span>
                      🤝 <b>@{p}</b> muốn kết nghĩa kim lan với bạn.
                      <span className="mail-acts">
                        <button
                          className="chip-btn on"
                          onClick={async () => {
                            await relSet(api.user, p, 'nghia_accept');
                            setMsg(`Đã kết nghĩa với @${p}. Từ nay có phúc cùng hưởng, có họa cùng chịu.`);
                            refresh();
                          }}
                        >
                          Nhận lời
                        </button>
                        <button
                          className="chip-btn"
                          onClick={async () => {
                            await relSet(api.user, p, 'nghia_decline');
                            refresh();
                          }}
                        >
                          Từ chối
                        </button>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h3 className="gh-h">Huynh đệ kết nghĩa</h3>
          {!s.sworn.length ? (
            <p className="note">Chưa kết nghĩa với ai. Huynh đệ gặp nhau thì trà luôn là trà thật, hay ra tay trợ giúp khi bạn bị đánh úp, và hôm nào cùng vào chơi thì tu luyện nhanh thêm 5%.</p>
          ) : (
            <ul className="mail-list">
              {s.sworn.map((p) => (
                <PersonRow key={p} api={api} who={p} sub={s.swornToday.includes(p) ? 'Hôm nay có vào chơi: bạn tu luyện nhanh thêm 5%' : 'Hôm nay chưa thấy mặt'}>
                  <button
                    className="chip-btn"
                    onClick={async () => {
                      await relSet(api.user, p, 'nghia_break');
                      setMsg(`Đã cắt nghĩa với @${p}.`);
                      refresh();
                    }}
                  >
                    Cắt nghĩa
                  </button>
                </PersonRow>
              ))}
            </ul>
          )}
          <h3 className="gh-h">Sổ thù</h3>
          {!foes.length ? (
            <p className="note">Sổ thù trống. Ai hại bạn sẽ được ghi vào đây.</p>
          ) : (
            <ul className="mail-list">
              {foes.map((p) => (
                <PersonRow key={p} api={api} who={p} sub={api.hunting === p ? 'Người dò tin đang lần theo dấu, sắp chạm mặt' : undefined}>
                  <button className="chip-btn on" disabled={!!api.hunting} onClick={() => hunt(p)} title="Bỏ linh thạch thuê người dò tung tích, năm sau chắc chắn chạm mặt">
                    Truy sát ({HUNT_COST})
                  </button>
                </PersonRow>
              ))}
            </ul>
          )}
          {s.hatedBy.length > 0 && (
            <>
              <h3 className="gh-h">Kẻ đang thù bạn</h3>
              <ul className="mail-list">
                {s.hatedBy.map((p) => (
                  <PersonRow key={p} api={api} who={p} />
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {tab === 'truy' && (
        <div className="gh-truy">
          <h3 className="gh-h">Bảng truy nã</h3>
          {!board.length ? (
            <p className="note">Chưa ai bị treo thưởng. Mở thư hoặc sổ thù, chọn Treo thưởng để treo đầu kẻ thù.</p>
          ) : (
            <ol className="gh-board">
              {board.map((b) => (
                <li key={b.target} className={b.target === me ? 'me' : ''}>
                  <span className="gh-poster" aria-hidden="true">
                    ☠
                  </span>
                  <span>
                    <b>@{b.target}</b> <RelChips player={b.target} s={s} />
                    <small>
                      {b.n} lệnh · treo bởi {b.posters.map((p) => '@' + p).join(', ')} · {ago(b.latest)}
                    </small>
                  </span>
                  <b className="gh-gold">{b.total}</b>
                </li>
              ))}
            </ol>
          )}
          <p className="note">Gặp kẻ bị truy nã trong giang hồ và hạ được bóng của họ, bạn lĩnh toàn bộ tiền thưởng.</p>
          <h3 className="gh-h">Oan gia</h3>
          {!pairs.length ? (
            <p className="note">Chưa có cặp oan gia nào.</p>
          ) : (
            <ol className="gh-board">
              {pairs.map((p) => (
                <li key={p.p1 + p.p2} className={p.p1 === me || p.p2 === me ? 'me' : ''}>
                  <span className="gh-poster" aria-hidden="true">
                    ⚔
                  </span>
                  <span>
                    <b>@{p.p1}</b> và <b>@{p.p2}</b>
                    <small>
                      {p.fights} trận · {p.w1} thắng, {p.w2} thua, {p.fights - p.w1 - p.w2} hòa
                    </small>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </Sheet>
  );
}
