"use client";
/**
 * 4.2.0 Tàng Kinh Các: vòng chiêu quanh người đang tọa thiền (kiểu Mộng Ảo Tu Tiên), danh sách công pháp để nâng tầng,
 * mang/tháo, dung hợp ra tuyệt kỹ, sổ công pháp và chọn bộ truyền thừa cho kiếp sau.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Character } from "@/lib/game/types";
import {
  CP,
  FUSE_CHANCE,
  FUSE_COST,
  GAUGE_NAME,
  PATH_IDEA,
  PHAM_NAME,
  SLOT_REALM,
  canFuse,
  canUpgrade,
  cpOf,
  cpOfPath,
  heirChoices,
  owned,
  slotOpen,
  tuyetOf,
  type CpDef,
} from "@/lib/game/congPhap";
import { PATHS, REALMS } from "@/lib/game/data";
import { tr } from "@/lib/i18n";
import Sprite from "./Sprite";
import { PixelFx, fxBatQuai, fxSen } from "./PixelFx";
import { orbSpec } from "./CpFx";

const PHAM_CLS = ["p0", "p1", "p2", "p3"];
const realmShort = (r: number) => REALMS[r]?.name ?? "";

function Orb({
  d,
  size,
  dark,
  lock,
}: {
  d: CpDef | null;
  size: number;
  dark?: boolean;
  lock?: string;
}) {
  if (!d)
    return (
      <span className="tk-orb lock" style={{ width: size, height: size }}>
        <span className="tk-orb-in">
          <small>{tr("Mở khi", "Opens at")}</small>
          <b>{lock}</b>
        </span>
      </span>
    );
  const sp = orbSpec(d.id, d.fx, d.path, d.kind);
  const k = (size * 0.78) / Math.max(sp.w, sp.h);
  return (
    <span
      className={`tk-orb ${PHAM_CLS[d.pham]} ${dark ? "dark" : ""}`}
      style={{ width: size, height: size }}
    >
      <span className="tk-orb-in">
        <PixelFx spec={sp} scale={k} dur={0.6} />
      </span>
    </span>
  );
}

const short = (n: string) =>
  n.replace(/ (Kiếm )?(Quyết|Pháp|Tâm Quyết|Ma Công|Thuật)$/, "");

export interface TangKinhProps {
  c: Character;
  onClose: () => void;
  onEquip: (id: string) => void;
  onUnequip: (id: string) => void;
  onUpgrade: (id: string) => void;
  onFuse: () => { ok: boolean; text: string } | null;
  onHeir: (id: string) => void;
  book: string[];
}

export function TangKinhCac({
  c,
  onClose,
  onEquip,
  onUnequip,
  onUpgrade,
  onFuse,
  onHeir,
  book,
}: TangKinhProps) {
  const [tab, setTab] = useState<"luyen" | "dung" | "so">("luyen");
  const [fuseSt, setFuseSt] = useState<
    "idle" | "fuse" | { ok: boolean; text: string }
  >("idle");
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  const path = c.path ?? "chung";
  const s = c.cp ?? { own: [], eq: [] };
  const eq = s.eq;
  // công pháp hiện ra trong danh sách: đã có + của đạo mình (chưa có thì tối) + chung
  const list = CP.filter((d) => d.kind !== "tuyet" || owned(c, d.id)).filter(
    (d) => owned(c, d.id) || d.path === path || d.path === "chung",
  );
  list.sort(
    (a, b) =>
      Number(!!owned(c, b.id)) - Number(!!owned(c, a.id)) ||
      Number(b.path === path) - Number(a.path === path) ||
      ["tuyet", "tam", "chieu"].indexOf(a.kind) -
        ["tuyet", "tam", "chieu"].indexOf(b.kind),
  );
  const [sel, setSel] = useState<string>(eq[1] || eq[0] || list[0]?.id || "");
  const tu = tuyetOf(c);
  const tuOwned = s.tuyet ? cpOf(s.tuyet) : undefined;
  const seats: {
    label: string;
    id?: string;
    lock?: string;
    x: number;
    y: number;
  }[] = [
    { label: tr("Tâm pháp", "Heart art"), id: eq[0], x: 50, y: 26 },
    { label: tr("Chiêu 1", "Move 1"), id: eq[1] || undefined, x: 15, y: 62 },
    {
      label: tr("Chiêu 2", "Move 2"),
      id: slotOpen(c, 2) ? eq[2] || undefined : undefined,
      lock: slotOpen(c, 2) ? undefined : realmShort(SLOT_REALM[2]),
      x: 85,
      y: 62,
    },
    {
      label: tr("Chiêu 3", "Move 3"),
      id: slotOpen(c, 3) ? eq[3] || undefined : undefined,
      lock: slotOpen(c, 3) ? undefined : realmShort(SLOT_REALM[3]),
      x: 13,
      y: 168,
    },
    {
      label: tr("Tuyệt kỹ", "Ultimate"),
      id: tuOwned?.id,
      lock: tuOwned ? undefined : tr("Dung hợp", "Fusion"),
      x: 87,
      y: 168,
    },
  ];
  const cdText = (d: CpDef) =>
    d.kind === "tam"
      ? tr("Bị động", "Passive")
      : d.kind === "tuyet"
        ? tr(`${GAUGE_NAME[d.path]} đầy`, `${GAUGE_NAME[d.path]} full`)
        : tr(`Hồi ${d.cd ?? 3} lượt`, `${d.cd ?? 3}-turn cooldown`);
  const unlockText = (d: CpDef) => {
    const i = cpOfPath(d.path)
      .filter((x) => x.kind === "chieu")
      .indexOf(d);
    if (d.kind === "tam")
      return tr("Có khi nhập đạo", "Granted on entering the path");
    if (d.path === "chung")
      return tr(`Có khi vào ${realmShort(1)}`, `Granted at ${realmShort(1)}`);
    return i <= 0
      ? tr("Có khi nhập đạo", "Granted on entering the path")
      : i === 1
        ? tr(`Có khi vào ${realmShort(2)}`, `Granted at ${realmShort(2)}`)
        : tr(`Có khi vào ${realmShort(4)}`, `Granted at ${realmShort(4)}`);
  };
  const nine = c.path
    ? cpOfPath(c.path).filter(
        (x) => x.kind === "chieu" && (owned(c, x.id)?.tang ?? 0) >= 9,
      )
    : [];
  const heirs = heirChoices(c);
  const heir = heirs.find((d) => d.id === c.cpHeirPick) ?? heirs[0];
  const seen = new Set([...book, ...s.own.map((o) => o.id)]);
  return (
    <div
      className="forge-wrap tk-wrap"
      role="dialog"
      aria-modal="true"
      aria-label={tr("Tàng Kinh Các", "Scripture Pavilion")}
    >
      <div className="forge-scene">
        <div className="fs-head">
          <b>{tr("Tàng Kinh Các", "Scripture Pavilion")}</b>
          <span
            className="fs-tinh tk-tq"
            title={tr("Tàn quyển", "Manual fragments")}
          >
            <img
              src="/icons/g_kinh_thu_tan_quyen.png"
              width={20}
              height={20}
              alt=""
              className="px-icon"
            />
            {c.tanQuyen ?? 0}
          </span>
          <button
            className="ss-x"
            onClick={onClose}
            aria-label={tr("Đóng", "Close")}
          >
            ✕
          </button>
        </div>
        <div
          className="tk-stage"
          style={{
            backgroundImage: `url(/bg/tu_luyen-${Math.min(3, Math.max(0, Math.floor(c.realm / 2)))}.png)`,
          }}
        >
          <span className="tk-title">
            {c.path ? PATHS[c.path].name : tr("Chưa nhập đạo", "No path yet")}
          </span>
          <div className="tk-floor">
            <PixelFx
              spec={fxBatQuai(c.path ? PATHS[c.path].aura : "#9ff0c8")}
              scale={3}
              dur={2.4}
            />
          </div>
          <div className="tk-me">
            <Sprite c={c} size={132} anim="spellcast" dir={2} />
          </div>
          <div className="tk-sen">
            <PixelFx spec={fxSen()} scale={3} dur={1} />
          </div>
          <span className="tk-qi" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <i
                key={i}
                style={
                  {
                    left: `${38 + i * 5}%`,
                    animationDelay: `${i * 0.4}s`,
                    background: c.path ? PATHS[c.path].aura : undefined,
                  } as CSSProperties
                }
              />
            ))}
          </span>
          {seats.map((st, i) => {
            const d = st.id ? (cpOf(st.id) ?? null) : null;
            return (
              <button
                key={i}
                className={`tk-seat ${d && sel === d.id ? "sel" : ""}`}
                style={{ left: `${st.x}%`, top: st.y }}
                onClick={() => d && (setSel(d.id), setTab("luyen"))}
                aria-label={
                  d ? d.name : `${st.label}: ${st.lock ?? tr("trống", "empty")}`
                }
              >
                <Orb d={d} size={54} lock={st.lock ?? tr("Trống", "Empty")} />
                <small>{d ? short(d.name) : st.label}</small>
              </button>
            );
          })}
        </div>
        <div className="fs-info">
          <div className="tk-idea">
            <b>
              {c.path ? PATHS[c.path].name : tr("Quyền cước", "Fists")} ·{" "}
              {tr("thanh", "gauge")} <i>{GAUGE_NAME[path]}</i>
            </b>
            <span>{PATH_IDEA[path]}</span>
            {tu && (
              <small>
                {tr(`Tuyệt kỹ: ${tu.name}`, `Ultimate: ${tu.name}`)}
              </small>
            )}
          </div>
          <div className="chips">
            <button
              className={`chip-btn ${tab === "luyen" ? "on" : ""}`}
              onClick={() => setTab("luyen")}
            >
              {tr("Đang luyện", "Training")}
            </button>
            <button
              className={`chip-btn ${tab === "dung" ? "on" : ""}`}
              onClick={() => setTab("dung")}
            >
              {tr("Dung hợp", "Fusion")}
            </button>
            <button
              className={`chip-btn ${tab === "so" ? "on" : ""}`}
              onClick={() => setTab("so")}
            >
              {tr("Sổ", "Book")} {seen.size}/{CP.length}
            </button>
          </div>

          {tab === "luyen" && (
            <div className="tk-list">
              {list.map((d) => {
                const o = owned(c, d.id);
                const on = eq.includes(d.id) || s.tuyet === d.id;
                const up = canUpgrade(c, d.id);
                const needTq = !!o && o.tang >= 3 && o.tang < 9;
                return (
                  <div
                    key={d.id}
                    className={`tk-cp ${PHAM_CLS[d.pham]} ${sel === d.id ? "sel" : ""} ${o ? "" : "lock"}`}
                    onClick={() => setSel(d.id)}
                  >
                    {on && (
                      <span className="tk-ribbon">
                        {tr("Đang mang", "Equipped")}
                      </span>
                    )}
                    <Orb d={d} size={46} dark={!o} />
                    <span className="tk-cp-body">
                      <b className="tk-cp-name">
                        {d.name}{" "}
                        <i className={`tk-pham ${PHAM_CLS[d.pham]}`}>
                          {PHAM_NAME[d.pham]}
                        </i>
                        {o && <em>{tr(`T${o.tang}`, `S${o.tang}`)}</em>}
                      </b>
                      <span className="tk-cp-desc">{d.main}</span>
                      {o && o.tang < 9 && (
                        <span className="tk-tang">
                          <span className="tk-tang-n">
                            {tr("Thục luyện", "Mastery")}
                          </span>
                          <span className="tk-prog">
                            <span style={{ width: `${o.exp}%` }} />
                          </span>
                        </span>
                      )}
                      {!o && (
                        <span className="tk-cp-desc tk-how">
                          {unlockText(d)}
                        </span>
                      )}
                    </span>
                    {o && (
                      <span className="tk-cp-side">
                        {needTq && (
                          <span className="tk-cost">
                            <img
                              src="/icons/g_kinh_thu_tan_quyen.png"
                              width={18}
                              height={18}
                              alt={tr("Tàn quyển", "Fragment")}
                              className="px-icon"
                            />
                            {Math.min(c.tanQuyen ?? 0, 1)}/1
                          </span>
                        )}
                        <button
                          className={`tk-up ${o.tang >= 9 ? "max" : ""}`}
                          disabled={!up}
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpgrade(d.id);
                          }}
                        >
                          {o.tang >= 9
                            ? tr("Viên mãn", "Perfected")
                            : o.exp < 100
                              ? tr("Đang luyện", "Training")
                              : up
                                ? tr("Nâng tầng", "Raise")
                                : tr("Thiếu quyển", "Need fragment")}
                        </button>
                        <small>{cdText(d)}</small>
                        {d.kind !== "tuyet" && !(d.kind === "tam" && on) && (
                          <button
                            className="tk-eq"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (on) onUnequip(d.id);
                              else onEquip(d.id);
                            }}
                          >
                            {on ? tr("Tháo", "Remove") : tr("Mang", "Equip")}
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
              <p className="note">
                {tr(
                  "Đang mang thì thục luyện tự tăng mỗi năm và mỗi lần ra chiêu. Tầng 1-3 tự lên, từ tầng 4 cần 1 tàn quyển. Tàn quyển rơi khi trảm yêu, thắng chặn đường và đấu người.",
                  "Equipped techniques gain mastery every year and every time they are used. Stages 1-3 rise on their own; from stage 4 you need 1 manual fragment. Fragments drop from slaying demons, winning ambushes and duels.",
                )}
              </p>
            </div>
          )}

          {tab === "dung" && (
            <>
              {!c.path ? (
                <p className="note">
                  {tr(
                    "Chưa nhập đạo thì chưa có tuyệt kỹ để lĩnh ngộ.",
                    "Without a path there is no ultimate to comprehend.",
                  )}
                </p>
              ) : tuOwned ? (
                <>
                  {typeof fuseSt === "object" && fuseSt.ok && (
                    <p className="fs-res ok">{fuseSt.text}</p>
                  )}
                  <div className="tk-heir">
                    <Orb d={tuOwned} size={52} />
                    <div>
                      <small>{tr("Đã lĩnh ngộ", "Comprehended")}</small>
                      <b>{tuOwned.name}</b>
                      <span>{tuOwned.main}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`tk-fuse ${typeof fuseSt === "object" ? (fuseSt.ok ? "ok" : "fail") : fuseSt}`}
                    style={{ backgroundImage: "url(/bg/luyen_dan-2.png)" }}
                  >
                    {cpOfPath(c.path)
                      .filter((x) => x.kind === "chieu")
                      .slice(0, 2)
                      .map((x, i) => (
                        <span key={x.id} className="tk-fuse-in">
                          {i > 0 && <i className="tk-fuse-x">+</i>}
                          <Orb
                            d={x}
                            size={52}
                            dark={(owned(c, x.id)?.tang ?? 0) < 9}
                          />
                          <small>
                            {short(x.name)} · {owned(c, x.id)?.tang ?? 0}/9
                          </small>
                        </span>
                      ))}
                    {fuseSt === "fuse" && (
                      <span className="mg-smoke tk-smoke" aria-hidden="true">
                        {Array.from({ length: 6 }, (_, i) => (
                          <i
                            key={i}
                            style={{ ["--i" as string]: i } as CSSProperties}
                          />
                        ))}
                      </span>
                    )}
                    {typeof fuseSt === "object" && (
                      <span className={`fs-stamp ${fuseSt.ok ? "ok" : "fail"}`}>
                        {fuseSt.ok
                          ? tr("Lĩnh ngộ!", "Comprehended!")
                          : tr("Tan rồi", "Scattered")}
                      </span>
                    )}
                  </div>
                  {typeof fuseSt === "object" && (
                    <p className={`fs-res ${fuseSt.ok ? "ok" : "fail"}`}>
                      {fuseSt.text}
                    </p>
                  )}
                  <dl className="fs-odds">
                    <dt>{tr("Cần", "Needs")}</dt>
                    <dd className={nine.length >= 2 ? "" : "bad"}>
                      {tr(
                        `2 chiêu của đạo đạt tầng 9 (có ${nine.length})`,
                        `2 path moves at stage 9 (you have ${nine.length})`,
                      )}
                    </dd>
                    <dt>{tr("Tốn", "Cost")}</dt>
                    <dd className={(c.tanQuyen ?? 0) >= FUSE_COST ? "" : "bad"}>
                      {tr(
                        `${FUSE_COST} tàn quyển (có ${c.tanQuyen ?? 0})`,
                        `${FUSE_COST} fragments (you have ${c.tanQuyen ?? 0})`,
                      )}
                    </dd>
                    <dt>{tr("Thành", "Success")}</dt>
                    <dd>{Math.round(FUSE_CHANCE * 100)}%</dd>
                    <dt>{tr("Hỏng", "Failure")}</dt>
                    <dd>
                      {tr(
                        "mất tàn quyển, hai chiêu giữ nguyên",
                        "fragments lost, both moves kept",
                      )}
                    </dd>
                    <dt>{tr("Ra", "Result")}</dt>
                    <dd>{tu ? tu.name : "???"}</dd>
                  </dl>
                  <button
                    className="btn btn-red btn-big"
                    disabled={!canFuse(c) || fuseSt === "fuse"}
                    onClick={() => {
                      setFuseSt("fuse");
                      t.current = setTimeout(
                        () => setFuseSt(onFuse() ?? "idle"),
                        1400,
                      );
                    }}
                  >
                    {fuseSt === "fuse"
                      ? tr("Đang dung hợp...", "Fusing...")
                      : tr("☯ Dung hợp", "☯ Fuse")}
                  </button>
                </>
              )}
              <p className="note">
                {tr(
                  "Tuyệt kỹ tự ra khi thanh của đạo đầy. Chưa có tuyệt kỹ thì thanh đầy sẽ bộc phát chiêu mạnh nhất.",
                  "The ultimate fires on its own when your path gauge is full. Without one, a full gauge bursts your strongest move.",
                )}
              </p>
            </>
          )}

          {tab === "so" && (
            <>
              {heir ? (
                <>
                  <div className="tk-heir">
                    <Orb d={heir} size={48} />
                    <div>
                      <small>
                        {tr(
                          "Truyền thừa kiếp sau",
                          "Inheritance for next life",
                        )}
                      </small>
                      <b>{heir.name}</b>
                      <span>
                        {tr(
                          "Kiếp sau sinh ra đã biết bộ này, từ tầng 1.",
                          "Next life you are born knowing this, from stage 1.",
                        )}
                      </span>
                    </div>
                  </div>
                  {heirs.length > 1 && (
                    <div className="chips scroll">
                      {heirs.map((x) => (
                        <button
                          key={x.id}
                          className={`chip-btn ${heir.id === x.id ? "on" : ""}`}
                          onClick={() => onHeir(x.id)}
                        >
                          {x.name}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="note">
                  {tr(
                    "Có chiêu viên mãn tầng 9 thì chọn được 1 bộ truyền cho kiếp sau.",
                    "Perfect a move to stage 9 to pass one on to your next life.",
                  )}
                </p>
              )}
              <div className="tk-book">
                {CP.map((d) => (
                  <span
                    key={d.id}
                    className={`tk-book-i ${seen.has(d.id) ? "" : "unseen"}`}
                    title={seen.has(d.id) ? d.name : "???"}
                  >
                    <Orb d={d} size={40} dark={!seen.has(d.id)} />
                    <small>{seen.has(d.id) ? short(d.name) : "???"}</small>
                  </span>
                ))}
              </div>
              <p className="note">
                {tr(
                  `Đã gặp ${seen.size}/${CP.length} bộ qua các kiếp. Mỗi đạo một bộ riêng, tuyệt kỹ chỉ ra từ dung hợp.`,
                  `Seen ${seen.size}/${CP.length} across lives. Each path has its own set; ultimates only come from fusion.`,
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
