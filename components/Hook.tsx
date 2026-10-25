"use client";

import { useState } from "react";
import { Sheet } from "./Panels";
import {
  QUEST_BONUS,
  QUEST_REWARD,
  dailyOf,
  omenToday,
  questName,
  streakGift,
} from "@/lib/game/hook";
import type { Meta } from "@/lib/game/types";
import { sendMail, type Mail } from "@/lib/storage";
import type { Player } from "@/lib/auth";

const KIND_ICON: Record<string, string> = {
  thang: "⚔",
  thua: "☠",
  hoa: "☯",
  doc: "☠",
  tra: "🍵",
  huong: "🕯",
  hoi_am: "💬",
  thach: "⚔",
};

function ago(iso: string): string {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.round(h / 24)} ngày trước`;
}

/** Hộp thư giang hồ: chuyện người khác làm với bóng nhân vật của bạn khi bạn vắng mặt */
function MailItem({
  m,
  user,
  onChallenge,
}: {
  m: Mail;
  user: Player | null;
  onChallenge?: (player: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const from = m.from_player;
  return (
    <li className={`mail ${m.read ? "" : "new"} k-${m.kind}`}>
      <span className="mail-ic" aria-hidden="true">
        {KIND_ICON[m.kind] ?? "✉"}
      </span>
      <span className="mail-body">
        {m.body}
        <small>{ago(m.created_at)}</small>
        {from && user && !done && (
          <span className="mail-acts">
            <button className="chip-btn" onClick={() => setOpen(!open)}>
              Hồi âm
            </button>
            {onChallenge && (
              <button
                className="chip-btn"
                onClick={() => {
                  onChallenge(from);
                  sendMail(
                    user,
                    from,
                    "thach",
                    `@${user.username} đã ghi tên bạn vào sổ thù. Giang hồ rộng lớn, hẹn ngày gặp lại.`,
                  ).catch(() => {});
                  setDone(
                    `Đã ghi thù @${from}. Lần tới gặp trong giang hồ có thể báo thù.`,
                  );
                }}
              >
                Ghi thù
              </button>
            )}
          </span>
        )}
        {open && !done && user && from && (
          <span className="mail-reply">
            <input
              value={text}
              maxLength={120}
              onChange={(e) => setText(e.target.value)}
              placeholder="vd: Lần sau gặp lại, ta không nương tay"
            />
            <button
              className="btn"
              disabled={!text.trim()}
              onClick={() => {
                sendMail(
                  user,
                  from,
                  "hoi_am",
                  `@${user.username} hồi âm: "${text.trim()}"`,
                ).catch(() => {});
                setDone("Đã gửi hồi âm.");
              }}
            >
              Gửi
            </button>
          </span>
        )}
        {done && <small className="mail-done">{done}</small>}
      </span>
    </li>
  );
}

export function MailSheet({
  mail,
  onClose,
  user = null,
  onChallenge,
}: {
  mail: Mail[];
  onClose: () => void;
  user?: Player | null;
  onChallenge?: (player: string) => void;
}) {
  return (
    <Sheet title="Thư giang hồ" onClose={onClose}>
      {!mail.length ? (
        <p className="note">Giang hồ yên ắng, chưa ai nhắc tới bạn.</p>
      ) : (
        <>
          <p className="note" style={{ marginTop: 0 }}>
            Lúc bạn vắng mặt, bóng nhân vật của bạn vẫn lang bạt giang hồ:
          </p>
          <ul className="mail-list">
            {mail.map((m) => (
              <MailItem
                key={m.id}
                m={m}
                user={user}
                onChallenge={onChallenge}
              />
            ))}
          </ul>
        </>
      )}
    </Sheet>
  );
}

/** Thẻ "Hôm nay": thiên tượng, chuỗi ngày, nhiệm vụ ngày */
/** Riêng dải thiên tượng hôm nay (đặt trên cùng màn đầu thai) */
export function OmenStrip() {
  const o = omenToday();
  return (
    <section className="today omen-strip">
      <div className="today-omen">
        <span className="today-ic" aria-hidden="true">
          {o.icon}
        </span>
        <span>
          <b>Thiên tượng hôm nay: {o.name}</b>
          <small>{o.desc}</small>
        </span>
      </div>
    </section>
  );
}

export function TodayCard({
  meta,
  compact,
  noOmen,
}: {
  meta: Meta;
  compact?: boolean;
  noOmen?: boolean;
}) {
  const o = omenToday();
  const d = dailyOf(meta);
  const n = meta.streak?.n ?? 1;
  const next = streakGift(n + 1);
  return (
    <section className={`today ${compact ? "compact" : ""}`}>
      {!noOmen && (
        <div className="today-omen">
          <span className="today-ic" aria-hidden="true">
            {o.icon}
          </span>
          <span>
            <b>Thiên tượng hôm nay: {o.name}</b>
            <small>{o.desc}</small>
          </span>
        </div>
      )}
      <div className="today-streak">
        Chuỗi tu luyện <b>{n} ngày</b>
        <small>
          {next
            ? ` · Mai quay lại: ${next.text.replace(/^Chuỗi tu luyện \d+ ngày: /, "")}`
            : " · Quay lại ngày mai để nhận quà khởi đầu kiếp mới"}
        </small>
      </div>
      <div className="today-quests">
        <b>Nhiệm vụ hôm nay</b>
        <small>
          {" "}
          (mỗi việc +{QUEST_REWARD} phúc duyên, xong cả 3 thêm +{QUEST_BONUS},
          chấm khi một đời kết thúc)
        </small>
        <ul>
          {d.quests.map((id) => (
            <li key={id} className={d.done.includes(id) ? "done" : ""}>
              <span aria-hidden="true">{d.done.includes(id) ? "☑" : "☐"}</span>{" "}
              {questName(id)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HookSheet({
  meta,
  onClose,
}: {
  meta: Meta;
  onClose: () => void;
}) {
  return (
    <Sheet title="Hôm nay" onClose={onClose}>
      <TodayCard meta={meta} />
    </Sheet>
  );
}

/** Danh hiệu tuần trên đầu nhân vật */
export function TitleBadge({ title }: { title?: string | null }) {
  if (!title) return null;
  const tone = title.includes("Ma Đầu")
    ? "ta"
    : title.includes("Minh Chủ")
      ? "chinh"
      : "gold";
  return <span className={`title-badge ${tone}`}>{title}</span>;
}
