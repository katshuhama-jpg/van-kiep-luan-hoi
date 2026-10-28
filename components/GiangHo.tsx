'use client';

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
import { tr } from '@/lib/i18n';

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
  if (m < 1) return tr('vừa xong', "just now");
  if (m < 60) return tr(`${m} phút trước`, `${m} min ago`);
  const h = Math.round(m / 60);
  if (h < 24) return tr(`${h} giờ trước`, `${h}h ago`);
  return tr(`${Math.round(h / 24)} ngày trước`, `${Math.round(h / 24)}d ago`);
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
  NO_PLAYER: tr('Không tìm thấy người này.', "Couldn't find this person."),
  BAD_AMOUNT: tr('Số linh thạch không hợp lệ.', "Invalid amount of spirit stones."),
  TOO_MANY: tr('Bạn làm việc này quá nhiều, đợi một lúc nữa.', "You're doing this too often - wait a while."),
  PENDING: tr('Bạn đã gửi chiến thư cho người này rồi, đợi họ trả lời.', "You've already challenged this person. Wait for their reply."),
  ALREADY: tr('Hai người đã là huynh đệ.', "You two are already sworn brothers."),
  NO_REQUEST: tr('Lời mời không còn nữa.', "This invitation no longer exists."),
  ERROR: tr('Mạng chập chờn, thử lại sau.', "Connection is shaky, try again later."),
  NO_USER: tr('Cần đăng nhập.', "Login required."),
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
    if (note.trim()) sendMail(api.user, who, 'hoi_am', tr(`@${api.user.username} hồi âm: "${note.trim()}"`, `@${api.user.username} replies: "${note.trim()}"`)).catch(() => {});
  };
  const run = async (k: RelAction, ok: string) => {
    setBusy(true);
    const r = await relSet(api.user, who, k);
    setBusy(false);
    if (r === 'OK' || r === 'NGHIA') {
      say();
      if (k === 'thu') api.foe(who);
      if (k === 'hoa') api.peace(who);
      onDone(r === 'NGHIA' ? tr(`Hai người cùng mời nhau, nay đã thành huynh đệ kết nghĩa với @${who}.`, `You both invited each other - you are now sworn brothers with @${who}.`) : ok);
    } else onDone(MSG[r] ?? tr('Không làm được.', "Couldn't do that."));
  };
  const money = api.money;
  return (
    <div className="gh-acts">
      <input value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} placeholder={tr("Nhắn kèm (không bắt buộc): vd Lần sau gặp lại, ta không nương tay", "Attach a note (optional): e.g. Next time we meet, I won't hold back")} />
      <div className="gh-group">
        <b>{tr("Kết thân", "Befriend")}</b>
        {!sworn && (
          <button
            className="chip-btn"
            disabled={busy || sentReq}
            onClick={() => run('nghia_req', tr(`Đã gửi lời kết nghĩa tới @${who}. Họ nhận lời thì hai người thành huynh đệ.`, `Sworn-brother invite sent to @${who}. If they accept, you become sworn brothers.`))}
            title={tr("Gặp nhau thì trà luôn thật, hay ra tay trợ giúp khi bị đánh úp, hôm nào cùng chơi tu luyện thêm 5%", "Their tea is always real when you meet, they often help when you're ambushed, and on days you both play you cultivate 5% faster")}
          >
            {sentReq ? tr('Đã mời kết nghĩa', "Invite sent") : tr('Kết nghĩa', "Become sworn brothers")}
          </button>
        )}
        <button className="chip-btn" disabled={busy} onClick={() => run('hoa', tr(`Đã gửi lời hòa giải. Ân oán với @${who} xóa bỏ, đạo tâm bạn sáng thêm.`, `Peace offering sent. Your grudge with @${who} is erased, and your Dao Heart grows brighter.`))}>
          
          {tr("Hòa giải", "Make peace")}
        </button>
        {!note.trim() ? null : (
          <button
            className="chip-btn"
            onClick={() => {
              say();
              onDone(tr('Đã gửi hồi âm.', "Reply sent."));
            }}
          >
            
            {tr("Chỉ gửi lời", "Just send words")}
          </button>
        )}
      </div>
      <div className="gh-group">
        <b>{tr("Kết oán", "Make an enemy")}</b>
        <button className="chip-btn" disabled={busy || isFoe} onClick={() => run('thu', tr(`Đã ghi thù @${who}. Lần tới gặp trong giang hồ có thể báo thù.`, `Marked @${who} as an enemy. Next time you meet in the jianghu, you can take revenge.`))}>
          {isFoe ? tr('Đã ghi thù', "Marked as enemy") : tr('Ghi thù', "Mark as enemy")}
        </button>
        <button className="chip-btn" disabled={busy} onClick={() => run('khieu', tr(`Đã gửi thư khiêu khích. Lần tới chạm mặt @${who}, thắng thua đều gấp rưỡi.`, `Taunt sent. Next time you face @${who}, wins and losses both count one and a half times.`))}>
          
          {tr("Khiêu khích", "Taunt")}
        </button>
        <button className={`chip-btn ${mode === 'bounty' ? 'on' : ''}`} onClick={() => setMode(mode === 'bounty' ? null : 'bounty')}>
          
          {tr("Treo thưởng", "Bounty")}
        </button>
        <button className={`chip-btn ${mode === 'chien' ? 'on' : ''}`} onClick={() => setMode(mode === 'chien' ? null : 'chien')}>
          
          {tr("Chiến thư", "Challenges")}
        </button>
      </div>
      {mode && (
        <div className="gh-stake">
          <small>{mode === 'bounty' ? tr('Treo thưởng lấy đầu, ai hạ được bóng của họ sẽ lĩnh hết:', "Put a price on their head - whoever defeats their shadow claims it all:") : tr('Hẹn đấu có cược. Họ nhận lời thì hai bóng tự đấu, kẻ thắng lấy cả hai phần cược:', "A duel with stakes. If they accept, your two shadows fight it out and the winner takes both stakes:")}</small>
          {money === null ? (
            <small className="gh-warn">{tr("Cần một nhân vật đang sống để bỏ linh thạch.", "You need a living character to put up spirit stones.")}</small>
          ) : (
            <span>
              {(mode === 'bounty' ? BOUNTY_STEPS : [0, 100, 300]).map((n) => (
                <button
                  key={n}
                  className="chip-btn"
                  disabled={busy || money < n}
                  onClick={async () => {
                    if (!api.spend(n, mode === 'bounty' ? tr(`Treo thưởng lấy đầu @${who}`, `Put a bounty on @${who}'s head`) : tr(`Đặt cược chiến thư với @${who}`, `Stake a challenge against @${who}`))) return;
                    setBusy(true);
                    const r = mode === 'bounty' ? await bountyPost(api.user, who, n) : await challengeSend(api.user, who, n);
                    setBusy(false);
                    if (r !== 'OK') {
                      api.gain(n, tr('Hoàn lại linh thạch', "Refund spirit stones"));
                      onDone(MSG[r] ?? tr('Không làm được.', "Couldn't do that."));
                      return;
                    }
                    say();
                    onDone(mode === 'bounty' ? tr(`Đã treo ${n} linh thạch lấy đầu @${who} trên Bảng truy nã.`, `Posted a ${n} spirit stone bounty on @${who}'s head on the Wanted Board.`) : tr(`Đã gửi chiến thư${n ? tr(`, cược ${n} linh thạch`, `, staking ${n} spirit stones`) : ''}. Chờ @${who} trả lời.`, `Challenge sent${n ? tr(`, cược ${n} linh thạch`, `, staking ${n} spirit stones`) : ''}. Waiting for @${who} to reply.`));
                    if (mode === 'bounty') onTab?.('truy');
                  }}
                >
                  {n ? tr(`${n} linh thạch`, `${n} spirit stones`) : tr('Không cược', "No stake")}
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
                setDone(r === 'OK' || r === 'NGHIA' ? tr(`Đã kết nghĩa kim lan với @${from}.`, `You are now sworn brothers with @${from}.`) : (MSG[r] ?? tr('Không làm được.', "Couldn't do that.")));
              }}
            >
              
              {tr("Nhận lời kết nghĩa", "Accept the oath")}
            </button>
            <button
              className="chip-btn"
              onClick={async () => {
                await relSet(api.user, from, 'nghia_decline');
                setDone(tr('Đã từ chối.', "Declined."));
              }}
            >
              
              {tr("Từ chối", "Decline")}
            </button>
          </span>
        )}
        {from && !req && !done && (
          <span className="mail-acts">
            {m.kind === 'chien_thu' && (
              <button className="chip-btn on" onClick={() => onTab('rel')}>
                
                {tr("Xem chiến thư", "View challenge")}
              </button>
            )}
            {duelMail && m.kind !== 'chien_thu' && (
              <button className={`chip-btn ${open === 'chien' ? 'on' : ''}`} onClick={() => setOpen(open === 'chien' ? false : 'chien')}>
                
                {tr("📜 Gửi chiến thư", "📜 Send a challenge")}
              </button>
            )}
            <button className={`chip-btn ${open === 'reply' ? 'on' : ''}`} onClick={() => setOpen(open === 'reply' ? false : 'reply')}>
              
              {tr("Hồi âm ▾", "Reply ▾")}
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
        ? tr('đang chờ trả lời', "awaiting reply")
        : ch.status === 'tu_choi'
          ? mine
            ? tr('bị từ chối, đã hoàn cược', "declined, stake refunded")
            : tr('bạn đã từ chối', "you declined")
          : ch.winner === 'hoa'
            ? tr('hòa, hoàn cược', "draw, stake refunded")
            : ch.winner === api.user.username
              ? tr(`bạn thắng${ch.stake ? tr(`, +${ch.stake * 2} linh thạch`, `, +${ch.stake * 2} spirit stones`) : ''}`, `you won${ch.stake ? tr(`, +${ch.stake * 2} linh thạch`, `, +${ch.stake * 2} spirit stones`) : ''}`)
              : tr('bạn thua', "you lost");
    return (
      <li className="gh-row">
        <span>
          📜 {mine ? tr(`Gửi @${other}`, `To @${other}`) : tr(`Từ @${other}`, `From @${other}`)}
          {ch.stake ? tr(` · cược ${ch.stake}`, ` · stake ${ch.stake}`) : ''} · <b>{res}</b>
          {ch.detail && <small>{ch.detail}</small>}
        </span>
      </li>
    );
  }
  const accept = async () => {
    const me = api.me();
    if (!me) return setMsg(tr('Cần một nhân vật đang sống để nhận chiến thư.', "You need a living character to accept a challenge."));
    if (ch.stake && !api.spend(ch.stake, tr(`Đặt cược chiến thư với @${other}`, `Stake a challenge against @${other}`))) return setMsg(tr(`Không đủ ${ch.stake} linh thạch để theo cược.`, `Not enough spirit stones to match the ${ch.stake} stake.`));
    setBusy(true);
    const foe = await playerBest(other);
    if (!foe) {
      if (ch.stake) api.gain(ch.stake, tr('Hoàn lại linh thạch', "Refund spirit stones"));
      setBusy(false);
      return setMsg(tr('Không tìm thấy bóng của đối thủ.', "Couldn't find your opponent's shadow."));
    }
    const sim = simulateDuel(me, foe, Math.random);
    const winner = sim.result === 'win' ? api.user.username : sim.result === 'lose' ? other : 'hoa';
    const detail =
      sim.result === 'draw'
        ? tr(`${me.name} và ${foe.name} đấu ${sim.rounds} hiệp, bất phân thắng bại.`, `${me.name} and ${foe.name} fought ${sim.rounds} rounds with no victor.`)
        : tr(`${sim.result === 'win' ? me.name : foe.name} (@${winner}) thắng sau ${sim.rounds} hiệp, còn ${sim.result === 'win' ? sim.hpMe : sim.hpFoe}% sinh lực.`, `${sim.result === 'win' ? me.name : foe.name} (@${winner}) wins after ${sim.rounds} rounds with ${sim.result === 'win' ? sim.hpMe : sim.hpFoe}% HP left.`);
    const r = await challengeAnswer(api.user, ch.id, true, winner, detail);
    if (r !== 'OK') {
      if (ch.stake) api.gain(ch.stake, tr('Hoàn lại linh thạch', "Refund spirit stones"));
      setBusy(false);
      return setMsg(MSG[r] ?? tr('Chiến thư không còn hiệu lực.', "This challenge is no longer valid."));
    }
    const pays = await payoutClaim(api.user);
    pays.forEach((p) => api.gain(p.amount, p.note));
    setBusy(false);
    setMsg(`${detail}${sim.result === 'win' && ch.stake ? tr(` Bạn lấy ${ch.stake * 2} linh thạch.`, ` You take ${ch.stake * 2} spirit stones.`) : ''}`);
    onChanged();
  };
  return (
    <li className="gh-row hot">
      <span>
        📜 <b>@{other}</b>{tr(" gửi chiến thư", " sends you a challenge")}{ch.stake ? tr(`, cược ${ch.stake} linh thạch`, `, staking ${ch.stake} spirit stones`) : ''}.<small>{tr("Nhận lời thì bóng hai bên tự đấu 5 hiệp. Từ chối thì bị gắn tiếng \"Kẻ né chiến\" một ngày.", "Accept and both shadows fight 5 rounds on their own. Decline and you're branded \"Duel Dodger\" for a day.")}</small>
        {msg ? (
          <small className="mail-done">{msg}</small>
        ) : (
          <span className="mail-acts">
            <button className="chip-btn on" disabled={busy} onClick={accept}>
              
              {tr("Nhận lời", "Accept")}{ch.stake ? ` (${ch.stake})` : ''}
            </button>
            <button
              className="chip-btn"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await challengeAnswer(api.user, ch.id, false, null, '');
                setBusy(false);
                setMsg(tr('Bạn đã từ chối. Giang hồ gọi bạn là kẻ né chiến trong một ngày.', "You declined. The jianghu calls you a duel dodger for a day."));
                onChanged();
              }}
            >
              
              {tr("Từ chối", "Decline")}
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
        {lives >= 3 && <span className="rel-chip r-feud">{tr("Báo thù ", "Revenge across ")}{lives}{tr(" đời", " lives")}</span>}
        {sub && <small>{sub}</small>}
        <span className="mail-acts">
          {children}
          <button className={`chip-btn ${open ? 'on' : ''}`} onClick={() => setOpen(!open)}>
            
            {tr("Khác ▾", "More ▾")}
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
    if (api.money === null) return setMsg(tr('Cần một nhân vật đang sống để truy sát.', "You need a living character to hunt someone down."));
    if (api.money < HUNT_COST) return setMsg(tr(`Cần ${HUNT_COST} linh thạch để thuê người dò tung tích.`, `You need ${HUNT_COST} spirit stones to hire a tracker.`));
    const rival = await playerBest(who);
    if (!rival) return setMsg(tr(`Không dò ra tung tích của @${who}.`, `Couldn't pick up @${who}'s trail.`));
    if (!api.spend(HUNT_COST, tr(`Thuê người dò tung tích @${who}`, `Hire a tracker for @${who}`))) return;
    api.hunt(rival);
    setMsg(tr(`Người dò tin đã lên đường. Trong vòng một năm, bạn sẽ chạm mặt ${rival.name} (@${who}). Thắng được thưởng gấp đôi và lấy lại đồ bị cướp.`, `The tracker is on the move. Within a year you will cross paths with ${rival.name} (@${who}). Win for a double reward and get back what was stolen.`));
  };
  return (
    <Sheet title={tr("Giang hồ", "Jianghu")} onClose={onClose}>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'thu'} className={tab === 'thu' ? 'on' : ''} onClick={() => setTab('thu')}>
          
          {tr("Thư", "Letters")}
        </button>
        <button role="tab" aria-selected={tab === 'rel'} className={tab === 'rel' ? 'on' : ''} onClick={() => setTab('rel')}>
          
          {tr("Ân oán", "Grudges")}{waiting + s.swornReq.length ? ` (${waiting + s.swornReq.length})` : ''}
        </button>
        <button role="tab" aria-selected={tab === 'truy'} className={tab === 'truy' ? 'on' : ''} onClick={() => setTab('truy')}>
          
          {tr("Truy nã", "Wanted")}
        </button>
      </div>
      {msg && (
        <p className="note gh-msg" role="status">
          {msg}
        </p>
      )}

      {tab === 'thu' &&
        (!mail.length ? (
          <p className="note">{tr("Giang hồ yên ắng, chưa ai nhắc tới bạn.", "The jianghu is quiet. No one has mentioned you yet.")}</p>
        ) : (
          <>
            <p className="note" style={{ marginTop: 0 }}>
              
              {tr("Lúc bạn vắng mặt, bóng nhân vật của bạn vẫn lang bạt giang hồ. Bấm Hồi âm để kết thân hay kết oán.", "While you're away, your character's shadow still roams the jianghu. Tap Reply to make friends or enemies.")}
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
              <b>{tr("☠ Đầu bạn đang bị treo ", "☠ There's a bounty on your head: ")}{myBounty}{tr(" linh thạch.", " spirit stones.")}</b>
              <small>{tr("Ai hạ được bóng của bạn sẽ lĩnh thưởng. Bỏ ra đúng số đó để chuộc lệnh truy nã.", "Whoever defeats your shadow claims the reward. Pay the same amount to buy off the warrant.")}</small>
              <button
                className="btn"
                disabled={api.money === null || api.money < myBounty}
                onClick={async () => {
                  if (!api.spend(myBounty, tr('Chuộc lệnh truy nã', "Buy off the warrant"))) return;
                  await bountyClear(api.user);
                  setMsg(tr('Lệnh truy nã trên đầu bạn đã được gỡ.', "The warrant on your head has been lifted."));
                  refresh();
                }}
              >
                
                {tr("Chuộc lệnh (", "Buy off (")}{myBounty}{tr(" linh thạch)", " spirit stones)")}
              </button>
            </div>
          )}
          {chs.length > 0 && (
            <>
              <h3 className="gh-h">{tr("Chiến thư", "Challenges")}</h3>
              <ul className="mail-list">
                {chs.map((c) => (
                  <ChallengeItem key={c.id} ch={c} api={api} onChanged={refresh} />
                ))}
              </ul>
            </>
          )}
          {s.swornReq.length > 0 && (
            <>
              <h3 className="gh-h">{tr("Lời mời kết nghĩa", "Sworn-brother invites")}</h3>
              <ul className="mail-list">
                {s.swornReq.map((p) => (
                  <li key={p} className="gh-row hot">
                    <span>
                      🤝 <b>@{p}</b>{tr(" muốn kết nghĩa kim lan với bạn.", " wants to become your sworn brother.")}
                      <span className="mail-acts">
                        <button
                          className="chip-btn on"
                          onClick={async () => {
                            await relSet(api.user, p, 'nghia_accept');
                            setMsg(tr(`Đã kết nghĩa với @${p}. Từ nay có phúc cùng hưởng, có họa cùng chịu.`, `Sworn brothers with @${p}. From now on, you share fortune and misfortune alike.`));
                            refresh();
                          }}
                        >
                          
                          {tr("Nhận lời", "Accept")}
                        </button>
                        <button
                          className="chip-btn"
                          onClick={async () => {
                            await relSet(api.user, p, 'nghia_decline');
                            refresh();
                          }}
                        >
                          
                          {tr("Từ chối", "Decline")}
                        </button>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h3 className="gh-h">{tr("Huynh đệ kết nghĩa", "Sworn brothers")}</h3>
          {!s.sworn.length ? (
            <p className="note">{tr("Chưa kết nghĩa với ai. Huynh đệ gặp nhau thì trà luôn là trà thật, hay ra tay trợ giúp khi bạn bị đánh úp, và hôm nào cùng vào chơi thì tu luyện nhanh thêm 5%.", "No sworn brothers yet. Their tea is always real when you meet, they often help when you're ambushed, and on days you both play you cultivate 5% faster.")}</p>
          ) : (
            <ul className="mail-list">
              {s.sworn.map((p) => (
                <PersonRow key={p} api={api} who={p} sub={s.swornToday.includes(p) ? tr('Hôm nay có vào chơi: bạn tu luyện nhanh thêm 5%', "Played today: you cultivate 5% faster") : tr('Hôm nay chưa thấy mặt', "Not seen today")}>
                  <button
                    className="chip-btn"
                    onClick={async () => {
                      await relSet(api.user, p, 'nghia_break');
                      setMsg(tr(`Đã cắt nghĩa với @${p}.`, `Cut ties with @${p}.`));
                      refresh();
                    }}
                  >
                    
                    {tr("Cắt nghĩa", "Cut ties")}
                  </button>
                </PersonRow>
              ))}
            </ul>
          )}
          <h3 className="gh-h">{tr("Sổ thù", "Grudge book")}</h3>
          {!foes.length ? (
            <p className="note">{tr("Sổ thù trống. Ai hại bạn sẽ được ghi vào đây.", "Your grudge book is empty. Anyone who wrongs you will be written here.")}</p>
          ) : (
            <ul className="mail-list">
              {foes.map((p) => (
                <PersonRow key={p} api={api} who={p} sub={api.hunting === p ? tr('Người dò tin đang lần theo dấu, sắp chạm mặt', "The tracker is on their trail - you'll cross paths soon") : undefined}>
                  <button className="chip-btn on" disabled={!!api.hunting} onClick={() => hunt(p)} title={tr("Bỏ linh thạch thuê người dò tung tích, năm sau chắc chắn chạm mặt", "Spend spirit stones on a tracker, guaranteed to meet them next year")}>
                    
                    {tr("Truy sát (", "Hunt down (")}{HUNT_COST})
                  </button>
                </PersonRow>
              ))}
            </ul>
          )}
          {s.hatedBy.length > 0 && (
            <>
              <h3 className="gh-h">{tr("Kẻ đang thù bạn", "Holding a grudge against you")}</h3>
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
          <h3 className="gh-h">{tr("Bảng truy nã", "Wanted Board")}</h3>
          {!board.length ? (
            <p className="note">{tr("Chưa ai bị treo thưởng. Mở thư hoặc sổ thù, chọn Treo thưởng để treo đầu kẻ thù.", "No bounties yet. Open a letter or your grudge book and choose Bounty to put a price on an enemy's head.")}</p>
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
                      {b.n}{tr(" lệnh · treo bởi ", " warrants · posted by ")}{b.posters.map((p) => '@' + p).join(', ')} · {ago(b.latest)}
                    </small>
                  </span>
                  <b className="gh-gold">{b.total}</b>
                </li>
              ))}
            </ol>
          )}
          <p className="note">{tr("Gặp kẻ bị truy nã trong giang hồ và hạ được bóng của họ, bạn lĩnh toàn bộ tiền thưởng.", "Meet a wanted cultivator in the jianghu and defeat their shadow to claim the entire bounty.")}</p>
          <h3 className="gh-h">{tr("Oan gia", "Nemeses")}</h3>
          {!pairs.length ? (
            <p className="note">{tr("Chưa có cặp oan gia nào.", "No sworn rivals yet.")}</p>
          ) : (
            <ol className="gh-board">
              {pairs.map((p) => (
                <li key={p.p1 + p.p2} className={p.p1 === me || p.p2 === me ? 'me' : ''}>
                  <span className="gh-poster" aria-hidden="true">
                    ⚔
                  </span>
                  <span>
                    <b>@{p.p1}</b>{tr(" và ", " and ")}<b>@{p.p2}</b>
                    <small>
                      {p.fights}{tr(" trận · ", " fights · ")}{p.w1}{tr(" thắng, ", " wins, ")}{p.w2}{tr(" thua, ", " losses, ")}{p.fights - p.w1 - p.w2}{tr(" hòa", " draws")}
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
