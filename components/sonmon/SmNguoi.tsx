"use client";

/**
 * 18/11 (Tyler: danh sách người trong môn nhàm, muốn bấm xem chân thân, xem vào môn lúc nào).
 * NguoiList: thẻ người có hình chân thân, khung theo chức, thanh Lực chiến so với người mạnh nhất môn, vào môn lúc nào.
 * NguoiSheet: chạm một người xem chân thân lớn và từng chỉ số.
 */
import { LpcFigure } from "@/components/ChanThan";
import { ctLayers } from "@/lib/game/chanThan";
import type { ChanThanLook } from "@/lib/game/types";
import { tr } from "@/lib/i18n";
import type { SmMonNguoi } from "@/lib/sonmon/api";
import { chucTen, fmtN, mocGio, truoc } from "./ui";

function Hinh({ x, size }: { x: SmMonNguoi; size: number }) {
  if (!x.ct)
    return (
      <span
        className="sm-ng-trong"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  return (
    <LpcFigure
      layers={ctLayers(
        x.ct as Pick<
          ChanThanLook,
          "gender" | "skin" | "hair" | "hairColor" | "outfit"
        > & { gear?: ChanThanLook["gear"] },
      )}
      size={size}
    />
  );
}

export function NguoiList({
  ds,
  onPick,
  extra,
}: {
  ds: SmMonNguoi[];
  onPick: (x: SmMonNguoi) => void;
  extra?: (x: SmMonNguoi) => React.ReactNode;
}) {
  const max = Math.max(1, ...ds.map((x) => x.lc));
  const now = Date.now();
  return (
    <ul className="sm-ng-list">
      {ds.map((x, i) => (
        <li key={x.tk ?? `${x.ten}-${i}`}>
          <button
            className={`sm-ng sm-ng-${x.chuc}${x.ta ? " ta" : ""}`}
            onClick={() => onPick(x)}
            aria-label={tr(`Xem chân thân ${x.ten}`, `View ${x.ten}`)}
          >
            <span className="sm-ng-av">
              <Hinh x={x} size={56} />
            </span>
            <span className="sm-ng-t">
              <span className="sm-ng-h">
                <b>{x.ten}</b>
                <span className={`sm-ng-chuc c-${x.chuc}`}>
                  {chucTen(x.chuc)}
                </span>
                {x.ta && (
                  <span className="sm-ng-chuc c-ta">{tr("ngươi", "you")}</span>
                )}
              </span>
              <span className="sm-ng-lc">
                <span className="sm-ng-bar" aria-hidden="true">
                  <i
                    style={{
                      width: `${Math.max(4, Math.round((x.lc / max) * 100))}%`,
                    }}
                  />
                </span>
                <span className="sm-ng-n">{fmtN(x.lc)}</span>
              </span>
              <span className="sm-ng-s">
                {x.vao_luc
                  ? tr(
                      `Vào môn ${mocGio(x.vao_luc, now, true)}`,
                      `Joined ${mocGio(x.vao_luc, now, true)}`,
                    )
                  : ""}
                {x.kiep
                  ? tr(` · ${fmtN(x.kiep)} kiếp`, ` · ${fmtN(x.kiep)} lives`)
                  : ""}
              </span>
              {extra?.(x)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function NguoiSheet({
  x,
  mon,
  onClose,
  children,
}: {
  x: SmMonNguoi;
  mon: string;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const p = x.phan ?? {};
  const now = Date.now();
  const o: [string, string][] = [
    [tr("Lực chiến", "Power"), fmtN(x.lc)],
    [tr("Kiếp đã sống", "Lives"), fmtN(x.kiep ?? p.kiep ?? 0)],
    [tr("Huyệt đã khai", "Points opened"), `${p.huyet ?? 0}/10`],
    [tr("Hành viên mãn", "Full elements"), `${p.vien_man ?? 0}/5`],
    [
      tr("Cảnh giới cao nhất", "Highest realm"),
      tr(`bậc ${p.canh ?? 0}`, `tier ${p.canh ?? 0}`),
    ],
    [tr("Kết cục đã mở", "Endings"), fmtN(p.ket_cuc ?? 0)],
    [tr("Vào môn", "Joined"), x.vao_luc ? mocGio(x.vao_luc, now) : "-"],
    [
      tr("Chơi gần nhất", "Last played"),
      x.choi_luc ? truoc(x.choi_luc, now) : "-",
    ],
  ];
  return (
    <div
      className="sm-sheet"
      role="dialog"
      aria-modal="true"
      aria-label={tr(`Chân thân ${x.ten}`, `${x.ten}`)}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className={`sm-ng-san c-${x.chuc}`}>
          <span className="sm-ng-san-fig">
            <Hinh x={x} size={128} />
          </span>
          <b className="sm-ng-san-ten">{x.ten}</b>
          <span className="sm-ng-san-sub">
            {chucTen(x.chuc)} · {mon}
          </span>
        </div>
        <dl className="sm-ng-o">
          {o.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        {children}
        <button className="sm-btn sm-ghost wide" onClick={onClose}>
          {tr("Đóng", "Close")}
        </button>
      </div>
    </div>
  );
}
