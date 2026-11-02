"use client";
/**
 * 4.2.0: hiệu ứng chiêu thức công pháp trong trận, vẽ pixel (PixelFx làm sắc mép, thêm viền như LPC).
 * Thay quả cầu chưởng gradient cũ. mode: fly (bay từ người ra đòn tới đối thủ), foe (nổ trên đối thủ), self (trên người ra đòn).
 */
import type { CSSProperties } from "react";
import {
  PixelFx,
  fxBatQuai,
  fxChuongVang,
  fxCuuVi,
  fxDanHoan,
  fxHuStars,
  fxHuyetNguyet,
  fxKiem,
  fxLua,
  fxMaHoa,
  fxMaKhi,
  fxMotes,
  fxNguSacVan,
  fxPhatQuang,
  fxPillar,
  fxRays,
  fxRing,
  type FxSpec,
} from "./PixelFx";

const TAU = Math.PI * 2;
const rnd1 = (i: number, f: number) =>
  ((i * 9301 + f * 49297) % 233280) / 233280;

function kiemKhi(a: string, b: string, core: string, edge: string): FxSpec {
  return {
    key: `cpkk${a}${b}`,
    w: 30,
    h: 26,
    frames: 4,
    outline: edge,
    draw: (_p, f) => {
      let o = "";
      for (let i = 0; i < 7; i++) {
        const x = 2 + i * 2.2 + rnd1(i, f) * 2;
        const y = 5 + rnd1(i + 3, f) * 16;
        const s = 1 + (i % 3);
        o += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${s}" height="${s}" fill="${i % 2 ? a : b}"/>`;
      }
      o += `<path d="M16 1 A12 12 0 0 1 16 25 A15 15 0 0 0 16 1Z" fill="${a}"/>`;
      o += `<path d="M18 3 A10 10 0 0 1 18 23 A13 13 0 0 0 18 3Z" fill="${b}"/>`;
      o += `<path d="M21 6 A7 7 0 0 1 21 20 A10 10 0 0 0 21 6Z" fill="${core}"/>`;
      return o;
    },
  };
}
function kimXa(): FxSpec {
  return {
    key: "cpkimxa",
    w: 52,
    h: 22,
    frames: 6,
    outline: "#3a2408",
    draw: (p) => {
      let o = "";
      for (let j = 0; j <= 11; j++) {
        const x = 3 + j * 3.6;
        const y = 11 + Math.sin(j * 0.75 - p * TAU) * (j === 11 ? 2 : 5);
        const r = j === 11 ? 4.2 : 1.6 + j * 0.13;
        o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${j % 2 ? "#ffcf3e" : "#d9822b"}"/>`;
        if (j === 11)
          o += `<rect x="${(x + 1).toFixed(1)}" y="${(y - 2).toFixed(1)}" width="1.6" height="1.6" fill="#e0202e"/>`;
      }
      return o;
    },
  };
}
function vuot(a: string, b: string): FxSpec {
  return {
    key: `cpvuot${a}`,
    w: 30,
    h: 30,
    frames: 5,
    draw: (_p, f) => {
      const k = Math.min(1, (f + 1) / 3);
      let o = "";
      for (let i = 0; i < 3; i++) {
        const x0 = 6 + i * 7;
        o += `<line x1="${x0}" y1="4" x2="${(x0 + 10 * k).toFixed(1)}" y2="${(4 + 22 * k).toFixed(1)}" stroke="${a}" stroke-width="${f > 3 ? 2 : 4}"/>`;
        o += `<line x1="${x0}" y1="4" x2="${(x0 + 10 * k).toFixed(1)}" y2="${(4 + 22 * k).toFixed(1)}" stroke="${b}" stroke-width="${f > 3 ? 1 : 2}"/>`;
      }
      return o;
    },
  };
}
function no(color: string): FxSpec {
  return {
    key: `cpno${color}`,
    w: 36,
    h: 36,
    frames: 6,
    draw: (p) => {
      const c = 18;
      let o = "";
      const s = 12 * (1 - p);
      if (s > 1)
        o += `<polygon points="${c},${c - s} ${c + s * 0.25},${c - s * 0.25} ${c + s},${c} ${c + s * 0.25},${c + s * 0.25} ${c},${c + s} ${c - s * 0.25},${c + s * 0.25} ${c - s},${c} ${c - s * 0.25},${c - s * 0.25}" fill="#ffffff"/>`;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU + 0.3;
        const r = 3 + p * 15;
        const z = p < 0.7 ? 3 : 2;
        o += `<rect x="${(c + Math.cos(a) * r - z / 2).toFixed(1)}" y="${(c + Math.sin(a) * r - z / 2).toFixed(1)}" width="${z}" height="${z}" fill="${i % 2 ? color : "#fff6b0"}"/>`;
      }
      return o;
    },
  };
}
/** Bàn tay chưởng pixel */
function tay(a: string, b: string, edge: string): FxSpec {
  return {
    key: `cptay${a}`,
    w: 24,
    h: 26,
    frames: 3,
    outline: edge,
    draw: (_p, f) => {
      let o = `<rect x="5" y="11" width="14" height="12" fill="${a}"/>`;
      [6, 9.5, 13, 16.5].forEach(
        (x, i) =>
          (o += `<rect x="${x}" y="${3 + (i === 0 || i === 3 ? 3 : 0)}" width="3" height="10" fill="${a}"/>`),
      );
      o += `<rect x="1" y="13" width="5" height="4" fill="${a}"/>`;
      o += `<rect x="8" y="14" width="8" height="6" fill="${b}"/>`;
      for (let i = 0; i < 4; i++)
        o += `<rect x="${20 + rnd1(i, f) * 3}" y="${4 + i * 5}" width="2" height="2" fill="${b}"/>`;
      return o;
    },
  };
}
function cau(a: string, b: string, edge: string): FxSpec {
  return {
    key: `cpcau${a}`,
    w: 22,
    h: 22,
    frames: 3,
    outline: edge,
    draw: (_p, f) =>
      `<circle cx="11" cy="11" r="${8 + (f % 2)}" fill="${a}"/><circle cx="11" cy="11" r="5" fill="${b}"/><rect x="9" y="8" width="3" height="3" fill="#ffffff"/>`,
  };
}
function doc(): FxSpec {
  return {
    key: "cpdoc",
    w: 30,
    h: 26,
    frames: 4,
    outline: "#0c2a10",
    draw: (_p, i) =>
      `<circle cx="9" cy="${15 - (i % 2)}" r="7" fill="#5aa03a"/><circle cx="19" cy="${13 + (i % 2)}" r="8" fill="#7ad04a"/><circle cx="15" cy="20" r="5" fill="#4a8a2a"/><rect x="13" y="10" width="2" height="2" fill="#1a1a1a"/><rect x="19" y="10" width="2" height="2" fill="#1a1a1a"/><rect x="14" y="15" width="6" height="1" fill="#1a1a1a"/>`,
  };
}
function tim(): FxSpec {
  return {
    key: "cptim",
    w: 24,
    h: 24,
    frames: 4,
    outline: "#0c2a10",
    draw: (_p, i) =>
      `<path d="M12 21 L3 11 Q1 4 7 4 Q11 4 12 8 Q13 4 17 4 Q23 4 21 11Z" fill="${i % 2 ? "#7ad04a" : "#5fbf4a"}"/><rect x="11" y="9" width="2" height="7" fill="#ffffff"/><rect x="8" y="11" width="8" height="2" fill="#ffffff"/>`,
  };
}
function taiji(): FxSpec {
  return {
    key: "cptaiji",
    w: 24,
    h: 24,
    frames: 8,
    outline: "#0a1420",
    draw: (p) =>
      `<g transform="rotate(${p * 360} 12 12)"><circle cx="12" cy="12" r="10" fill="#e8f0ff"/><path d="M12 2 A10 10 0 0 1 12 22 A5 5 0 0 1 12 12 A5 5 0 0 0 12 2Z" fill="#3d6fb0"/><circle cx="12" cy="7" r="1.6" fill="#3d6fb0"/><circle cx="12" cy="17" r="1.6" fill="#e8f0ff"/></g>`,
  };
}
function hoaXa(): FxSpec {
  return {
    key: "cphoaxa",
    w: 100,
    h: 44,
    frames: 8,
    outline: "#5a1408",
    draw: (p, f) => {
      let o = "";
      for (let j = 0; j <= 16; j++) {
        const x = 4 + j * 5.4;
        const y = 22 + Math.sin(j * 0.55 - p * TAU) * (j === 16 ? 3 : 10);
        const r = j === 16 ? 9 : 3 + j * 0.3;
        o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 2).toFixed(1)}" fill="#e8401a"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${j % 3 ? "#ffb02a" : "#ffd36b"}"/>`;
        if (j % 2 === 0)
          o += `<rect x="${(x - 1).toFixed(1)}" y="${(y - r - 4 - rnd1(j, f) * 4).toFixed(1)}" width="2" height="3" fill="#ffb02a"/>`;
      }
      return o;
    },
  };
}

type Mode = "fly" | "foe" | "self";
interface FxDef {
  spec: () => FxSpec;
  mode: Mode;
  scale?: number;
  dur?: number;
  boom?: string; // màu nổ khi trúng
  extra?: () => FxSpec; // hiệu ứng phụ trên đối thủ
}
const PATH_COL: Record<string, [string, string, string, string]> = {
  kiem: ["#7ab8ff", "#d8ecff", "#ffffff", "#0a2a5a"],
  dan: ["#e8401a", "#ffb02a", "#fff6b0", "#5a1408"],
  tran: ["#9fd8ff", "#e8f6ff", "#ffffff", "#0a2a4a"],
  phat: ["#d9a020", "#ffe27a", "#fff6d0", "#5a3a08"],
  ma: ["#a01828", "#ff4a5a", "#ffd0d0", "#2a0408"],
  yeu: ["#7ad04a", "#d8f8a0", "#ffffff", "#14300c"],
  chung: ["#c8b8a0", "#f0e8d8", "#ffffff", "#3a2a1a"],
};
export function fxDef(fx: string, path = "chung"): FxDef {
  const [a, b, core, edge] = PATH_COL[path] ?? PATH_COL.chung;
  switch (fx) {
    case "liet":
      return {
        spec: () => kiemKhi("#e8401a", "#ffb02a", "#fff6b0", "#5a1408"),
        mode: "fly",
        boom: "#ff6a2a",
        extra: () => fxLua(5),
      };
    case "kimxa":
      return { spec: kimXa, mode: "fly", boom: "#ffcf3e" };
    case "taiji":
      return { spec: taiji, mode: "self", scale: 3, boom: "#9fd8ff" };
    case "vankiem":
      return {
        spec: () => fxKiem(7, "#d8ecff"),
        mode: "foe",
        scale: 3,
        boom: "#9fd8ff",
      };
    case "danbao":
      return { spec: fxDanHoan, mode: "fly", boom: "#ff6a2a" };
    case "doc":
      return { spec: doc, mode: "foe", boom: "#7ad04a" };
    case "hoi":
      return { spec: tim, mode: "self", scale: 3 };
    case "lo":
      return {
        spec: () => fxLua(7),
        mode: "foe",
        scale: 4,
        boom: "#ff6a2a",
        extra: doc,
      };
    case "kimquang":
      return {
        spec: () => fxRing("#ffd36b", 30, true),
        mode: "self",
        scale: 3,
      };
    case "loi":
      return {
        spec: () => fxPillar("#c9b8ff"),
        mode: "foe",
        scale: 3,
        boom: "#c9b8ff",
      };
    case "khon":
      return { spec: () => fxBatQuai("#3d6fb0"), mode: "foe", scale: 3 };
    case "tinhdau":
      return {
        spec: () => fxHuStars(14),
        mode: "foe",
        scale: 4,
        boom: "#ffd36b",
        extra: () => fxPillar("#ffd36b"),
      };
    case "chuong":
      return {
        spec: () => tay("#ffcf3e", "#fff6b0", "#5a3a08"),
        mode: "fly",
        boom: "#ffd36b",
      };
    case "chuong_vang":
      return { spec: fxChuongVang, mode: "self", scale: 3 };
    case "hong":
      return {
        spec: () => fxRing("#ffcf3e", 30, false),
        mode: "foe",
        scale: 4,
      };
    case "nhulai":
      return {
        spec: () => tay("#ffcf3e", "#fff6b0", "#5a3a08"),
        mode: "fly",
        scale: 6,
        boom: "#ffd36b",
        extra: () => fxRays("#ffd36b"),
      };
    case "huyettrao":
      return {
        spec: () => vuot("#7a0a14", "#ff4a5a"),
        mode: "foe",
        boom: "#e0202e",
      };
    case "thonphe":
      return { spec: () => fxMaKhi(6), mode: "foe", scale: 3, boom: "#a01828" };
    case "cuongma":
      return { spec: fxMaHoa, mode: "self", scale: 3 };
    case "huyette":
      return { spec: fxHuyetNguyet, mode: "foe", scale: 4, boom: "#e0202e" };
    case "cuuvi":
      return { spec: () => fxCuuVi(9), mode: "self", scale: 3 };
    case "mvuot":
      return { spec: () => vuot("#e8e0d0", "#ffffff"), mode: "foe", scale: 2 };
    case "vuot":
      return {
        spec: () => vuot("#b0201a", "#ffffff"),
        mode: "foe",
        boom: "#ffffff",
      };
    case "hoahinh":
      return { spec: fxNguSacVan, mode: "self", scale: 3 };
    case "chanthan":
      return { spec: hoaXa, mode: "fly", scale: 3, boom: "#ffb02a" };
    case "quyen":
      return {
        spec: () => cau("#c8b8a0", "#f0e8d8", "#3a2a1a"),
        mode: "fly",
        scale: 2,
        boom: "#ffffff",
      };
    case "chuong_cat":
      return {
        spec: () => tay("#a88a5a", "#e8d7ad", "#3a2a1a"),
        mode: "fly",
        boom: "#e8d7ad",
      };
    default:
      // đòn thường: kiếm khí nhỏ theo màu đạo
      return {
        spec: () => kiemKhi(a, b, core, edge),
        mode: "fly",
        scale: 2,
        boom: a,
      };
  }
}
const SPECS = new Map<string, FxSpec>();
const specOf = (k: string, f: () => FxSpec) => {
  let s = SPECS.get(k);
  if (!s) SPECS.set(k, (s = f()));
  return s;
};

/** Một đòn chiêu thức: side p = bạn đánh (từ trái sang phải), m = đối thủ đánh lại */
export function CpHit({
  fx,
  path,
  side,
  big,
  late,
}: {
  fx: string;
  path: string;
  side: "p" | "m";
  big?: boolean;
  late?: boolean;
}) {
  const d = fxDef(fx, path);
  const spec = specOf(`${fx}|${path}`, d.spec);
  const sc = (d.scale ?? 3) * (big ? 1.4 : 1);
  const cls = `cpf cpf-${d.mode} cpf-${side} ${late ? "cpf-late" : ""}`;
  return (
    <span className={cls} aria-hidden="true">
      <span
        className="cpf-main"
        style={
          { ["--cpf-flip" as string]: side === "m" ? -1 : 1 } as CSSProperties
        }
      >
        <PixelFx spec={spec} scale={sc} dur={0.36} />
      </span>
      {d.extra && (
        <span className="cpf-extra">
          <PixelFx spec={specOf(`${fx}|x`, d.extra)} scale={3} dur={0.5} />
        </span>
      )}
      {d.boom && (
        <span className="cpf-boom">
          <PixelFx
            spec={specOf(`boom${d.boom}`, () => no(d.boom!))}
            scale={big ? 5 : 3}
            dur={0.36}
          />
        </span>
      )}
    </span>
  );
}

/** Ấn ký nhỏ cho tâm pháp (bị động) */
function glyph(kind: "la" | "sao" | "nanh" | "sen"): FxSpec {
  const D: Record<string, { o: string; f: (p: number, i: number) => string }> =
    {
      la: {
        o: "#14300c",
        f: (_p, i) =>
          `<path d="M4 20 Q4 4 20 4 Q20 20 4 20Z" fill="#5fbf4a"/><path d="M6 18 Q10 12 17 7" stroke="#d8f8a0" stroke-width="1.5" fill="none"/><rect x="${3 + i}" y="3" width="2" height="2" fill="#d8f8a0"/>`,
      },
      sao: {
        o: "#0a1430",
        f: (_p, i) => {
          const P = [
            [3, 6],
            [7, 4],
            [11, 6],
            [14, 9],
            [18, 8],
            [20, 13],
            [17, 17],
          ];
          let o = `<polyline points="${P.map((x) => x.join(",")).join(" ")}" stroke="#5a7ab0" stroke-width="1" fill="none"/>`;
          P.forEach(
            ([x, y], k) =>
              (o += `<rect x="${x - 1}" y="${y - 1}" width="${k === i % 7 ? 3 : 2}" height="${k === i % 7 ? 3 : 2}" fill="${k === i % 7 ? "#ffffff" : "#ffd36b"}"/>`),
          );
          return o;
        },
      },
      nanh: {
        o: "#2a1004",
        f: (_p, i) =>
          `<path d="M3 6 Q12 ${2 + (i % 2)} 21 6 L19 10 Q12 8 5 10Z" fill="#c8602a"/><polygon points="7,9 10,9 8.5,${18 + (i % 2)}" fill="#fff6e0"/><polygon points="14,9 17,9 15.5,${18 + (i % 2)}" fill="#fff6e0"/><path d="M3 18 Q12 ${22 - (i % 2)} 21 18 L19 15 Q12 17 5 15Z" fill="#c8602a"/>`,
      },
      sen: {
        o: "#2a1430",
        f: (_p, f) => {
          let o = "";
          for (let i = 0; i < 8; i++)
            o += `<ellipse cx="12" cy="6" rx="3" ry="6" fill="${i % 2 ? "#9fd0ff" : "#e0f0ff"}" transform="rotate(${(i / 8) * 360 + f * 6} 12 12)"/>`;
          return (
            o +
            `<circle cx="12" cy="12" r="4" fill="#ffd36b"/><rect x="11" y="11" width="2" height="2" fill="#fff"/>`
          );
        },
      },
    };
  const d = D[kind];
  return {
    key: `cpg${kind}`,
    w: 24,
    h: 24,
    frames: 4,
    outline: d.o,
    draw: d.f,
  };
}
/** Hình trong ô chiêu (bát giác) ở Tàng Kinh Các */
export function orbSpec(
  id: string,
  fx: string,
  path: string,
  kind: string,
): FxSpec {
  if (kind === "tam") {
    const k = `orb|${id}`;
    const f: Record<string, () => FxSpec> = {
      kiem: () => glyph("sen"),
      dan: () => glyph("la"),
      tran: () => glyph("sao"),
      phat: fxPhatQuang,
      ma: fxHuyetNguyet,
      yeu: () => glyph("nanh"),
    };
    return specOf(k, f[path] ?? (() => fxMotes(8, "#9ff0c8")));
  }
  if (fx === "thonphe") return specOf("orb|thonphe", () => fxMaKhi(6));
  const d = fxDef(fx, path);
  return specOf(`${fx}|${path}`, d.spec);
}
