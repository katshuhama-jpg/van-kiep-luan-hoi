'use client';

import { useEffect, useState, type CSSProperties } from 'react';

/**
 * Dị tượng vẽ kiểu pixel cho khớp với nhân vật LPC.
 * Mỗi hiệu ứng là hàm sinh SVG ở độ phân giải thấp (1 đơn vị = 1 điểm ảnh của nhân vật),
 * được vẽ lên canvas, làm sắc mép (bỏ bán trong suốt), thêm viền tối 1px như LPC,
 * ghép thành dải khung hình rồi phóng to bằng image-rendering: pixelated và chạy theo steps().
 */

export interface FxSpec {
  key: string; // khóa bộ nhớ đệm
  w: number; // kích thước khung (điểm ảnh nhân vật)
  h: number;
  frames: number;
  /** nội dung SVG của khung thứ i (p = i / frames) */
  draw: (p: number, i: number) => string;
  outline?: string; // màu viền 1px quanh hình
  soft?: boolean; // giữ 2 mức trong suốt (khói), không làm sắc hẳn
}

const CACHE = new Map<string, Promise<string>>();

function render(spec: FxSpec): Promise<string> {
  const hit = CACHE.get(spec.key);
  if (hit) return hit;
  const job = (async () => {
    const { w, h, frames } = spec;
    const cv = document.createElement('canvas');
    cv.width = w * frames;
    cv.height = h;
    const ctx = cv.getContext('2d')!;
    for (let i = 0; i < frames; i++) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${spec.draw(i / frames, i)}</svg>`;
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      await img.decode();
      ctx.drawImage(img, i * w, 0);
    }
    const data = ctx.getImageData(0, 0, cv.width, h);
    const px = data.data;
    // làm sắc mép: mỗi điểm hoặc đặc hoặc trong suốt (khói thì thêm mức nửa trong suốt)
    for (let k = 0; k < px.length; k += 4) {
      const a = px[k + 3];
      px[k + 3] = spec.soft ? (a > 170 ? 255 : a > 60 ? 150 : 0) : a > 100 ? 255 : 0;
    }
    if (spec.outline) {
      const W = cv.width;
      const [r, g, b] = hex(spec.outline);
      // chỉ xét điểm cùng khung, tránh viền tràn sang khung bên cạnh
      const solid = (x: number, y: number, fr: number) => x >= 0 && y >= 0 && x < W && y < h && Math.floor(x / w) === fr && px[(y * W + x) * 4 + 3] === 255;
      const mark: number[] = [];
      for (let y = 0; y < h; y++)
        for (let x = 0; x < W; x++) {
          const k = (y * W + x) * 4;
          if (px[k + 3] !== 0) continue;
          const fr = Math.floor(x / w);
          if (solid(x - 1, y, fr) || solid(x + 1, y, fr) || solid(x, y - 1, fr) || solid(x, y + 1, fr)) mark.push(k);
        }
      for (const k of mark) {
        px[k] = r;
        px[k + 1] = g;
        px[k + 2] = b;
        px[k + 3] = 255;
      }
    }
    ctx.putImageData(data, 0, 0);
    return cv.toDataURL();
  })();
  CACHE.set(spec.key, job);
  return job;
}

function hex(c: string): [number, number, number] {
  const m = c.replace('#', '');
  const v =
    m.length === 3
      ? m
          .split('')
          .map((x) => x + x)
          .join('')
      : m;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

/** Hiện một hiệu ứng pixel. scale = số px màn hình cho 1 điểm ảnh nhân vật. */
export function PixelFx({ spec, scale, dur, className, style }: { spec: FxSpec; scale: number; dur: number; className?: string; style?: CSSProperties }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    render(spec).then((u) => live && setUrl(u));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.key]);
  if (!url) return null;
  const W = spec.w * scale;
  const H = spec.h * scale;
  return (
    <span
      className={`pfx ${className ?? ''}`}
      aria-hidden="true"
      style={{
        ...style,
        width: W,
        height: H,
        backgroundImage: `url(${url})`,
        backgroundSize: `${W * spec.frames}px ${H}px`,
        ['--pfx-end' as string]: `-${W * spec.frames}px`,
        animation: spec.frames > 1 ? `pfx-play ${dur}s steps(${spec.frames}) infinite` : undefined,
      }}
    />
  );
}

// ---------------- Các hiệu ứng ----------------
const r1 = (x: number) => Math.round(x * 10) / 10;
const TAU = Math.PI * 2;

/** Kiếm luân: n thanh phi kiếm xoay quanh lưng */
export function fxKiem(n: number, color: string): FxSpec {
  const S = 60;
  const c = S / 2;
  return {
    key: `kiem${n}${color}`,
    w: S,
    h: S,
    frames: 8,
    outline: '#1a2438',
    draw: (p) => {
      let out = '';
      for (let i = 0; i < n; i++) {
        const a = (360 / n) * (i + p);
        out += `<g transform="translate(${c} ${c}) rotate(${r1(a)}) translate(0 -${S * 0.36})">
          <rect x="-1" y="-9" width="2" height="15" fill="#eef4ff"/><rect x="0" y="-9" width="1" height="15" fill="#b8c8e8"/>
          <rect x="-3" y="6" width="6" height="1.6" fill="${color}"/><rect x="-1" y="7.6" width="2" height="4" fill="#8a5a2a"/></g>`;
      }
      return out;
    },
  };
}

/** Phật quang: vầng sáng có tia, xoay chậm */
export function fxPhatQuang(): FxSpec {
  const S = 40;
  const c = S / 2;
  return {
    key: 'phatquang',
    w: S,
    h: S,
    frames: 6,
    outline: '#b07a1a',
    draw: (p) => {
      let out = `<circle cx="${c}" cy="${c}" r="${S * 0.33}" fill="none" stroke="#ffe27a" stroke-width="2"/>`;
      for (let i = 0; i < 24; i++) {
        const a = i * 15 + p * 15;
        out += `<rect x="${c - 0.75}" y="1" width="1.5" height="${i % 2 ? 3 : 5}" fill="#ffe9a0" transform="rotate(${r1(a)} ${c} ${c})"/>`;
      }
      return out;
    },
  };
}

/** Đài sen dưới chân */
export function fxSen(): FxSpec {
  return {
    key: 'sen',
    w: 40,
    h: 12,
    frames: 1,
    outline: '#6a1e3a',
    draw: () => {
      let out = '<rect x="2" y="9" width="36" height="3" fill="#4a9a5a"/><rect x="2" y="9" width="36" height="1" fill="#7ac87a"/>';
      [6, 11, 16, 20, 24, 29, 34].forEach((x, i) => {
        const hgt = i === 3 ? 9 : i % 3 === 0 ? 6 : 8;
        out += `<path d="M${x - 2.5} 10 L${x} ${10 - hgt} L${x + 2.5} 10Z" fill="${i % 2 ? '#ff8ab4' : '#ffc4d8'}"/>`;
      });
      return out;
    },
  };
}

/** Bát quái đồ nằm dưới chân (ép dẹt), xoay */
export function fxBatQuai(color: string): FxSpec {
  const W = 56;
  const H = 22;
  const tri = ['111', '110', '101', '100', '011', '010', '001', '000'];
  return {
    key: `batquai${color}`,
    w: W,
    h: H,
    frames: 16,
    outline: '#1f160d',
    draw: (p) => {
      let g = `<circle r="26" fill="none" stroke="${color}" stroke-width="1.6"/><circle r="17" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="2 2"/>`;
      tri.forEach((t, i) => {
        g += `<g transform="rotate(${i * 45}) translate(0 -22)">`;
        t.split('').forEach((b, j) => {
          const y = -3 + j * 2.4;
          g +=
            b === '1'
              ? `<rect x="-4.5" y="${y}" width="9" height="1.6" fill="${color}"/>`
              : `<rect x="-4.5" y="${y}" width="3.6" height="1.6" fill="${color}"/><rect x="0.9" y="${y}" width="3.6" height="1.6" fill="${color}"/>`;
        });
        g += '</g>';
      });
      g += `<circle r="7" fill="#f6f0e0"/><path d="M0 -7 A7 7 0 0 1 0 7 A3.5 3.5 0 0 1 0 0 A3.5 3.5 0 0 0 0 -7Z" fill="#1f160d"/>`;
      return `<g transform="translate(${W / 2} ${H / 2}) scale(1 0.38) rotate(${r1(p * 360)})">${g}</g>`;
    },
  };
}

/** Tam muội chân hỏa: n ngọn lửa lập lòe */
export function fxLua(n: number): FxSpec {
  const W = 34;
  const H = 16;
  return {
    key: `lua${n}`,
    w: W,
    h: H,
    frames: 4,
    outline: '#6a1408',
    draw: (_p, f) => {
      let out = '';
      for (let i = 0; i < n; i++) {
        const x = 3 + (i * (W - 6)) / Math.max(1, n - 1);
        const hh = 8 + ((i * 7 + f * 5) % 6);
        const sway = ((i + f) % 3) - 1;
        out += `<path d="M${x - 3} ${H} Q${x - 3.5} ${H - hh * 0.5} ${x + sway} ${H - hh} Q${x + 3.5} ${H - hh * 0.5} ${x + 3} ${H}Z" fill="#e8401a"/>`;
        out += `<path d="M${x - 1.8} ${H} Q${x - 2} ${H - hh * 0.4} ${x + sway * 0.5} ${H - hh * 0.7} Q${x + 2} ${H - hh * 0.4} ${x + 1.8} ${H}Z" fill="#ffb02a"/>`;
        out += `<rect x="${x - 0.8}" y="${H - hh * 0.35}" width="1.6" height="${hh * 0.35}" fill="#fff6b0"/>`;
      }
      return out;
    },
  };
}

/** Đan hoàn: 3 viên đan bay quanh người theo vòng elip */
export function fxDanHoan(): FxSpec {
  const W = 46;
  const H = 18;
  return {
    key: 'danhoan',
    w: W,
    h: H,
    frames: 12,
    outline: '#6a3a08',
    draw: (p) => {
      let out = '';
      for (let k = 0; k < 3; k++) {
        const a = TAU * (p + k / 3);
        const x = W / 2 + Math.cos(a) * (W / 2 - 4);
        const y = H / 2 + Math.sin(a) * (H / 2 - 4);
        out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="2.6" fill="#ffcf3e"/><rect x="${Math.round(x - 1.5)}" y="${Math.round(y - 1.5)}" width="1" height="1" fill="#fff"/>`;
      }
      return out;
    },
  };
}

/** Huyết nguyệt sau đầu, to hơn đầu để lộ ra viền trăng */
export function fxHuyetNguyet(): FxSpec {
  return {
    key: 'huyetnguyet2',
    w: 36,
    h: 36,
    frames: 1,
    outline: '#3a0610',
    draw: () =>
      `<circle cx="18" cy="18" r="16" fill="#a01424"/><circle cx="16" cy="16" r="12" fill="#d8303a"/><circle cx="21" cy="12" r="3" fill="#b01828"/><rect x="9" y="20" width="4" height="3" fill="#8a1020"/><rect x="24" y="22" width="3" height="2" fill="#8a1020"/><rect x="5" y="12" width="2" height="4" fill="#ff6a5a"/>`,
  };
}

/** Ma khí: các cụm khói đen tím bốc lên hai bên người */
export function fxMaKhi(n: number): FxSpec {
  const W = 56;
  const H = 50;
  return {
    key: `makhi2${n}`,
    w: W,
    h: H,
    frames: 12,
    outline: '#12020a',
    draw: (p) => {
      let out = '';
      for (let i = 0; i < n; i++) {
        const q = (p + i / n) % 1;
        // hai bên người: trái rồi phải xen kẽ
        const side = i % 2 ? 1 : -1;
        const x = W / 2 + side * (14 + ((i * 5) % 9));
        const y = H - 5 - q * (H - 12);
        const r = 2.5 + Math.sin(q * Math.PI) * 3.5;
        out += `<circle cx="${r1(x + Math.sin(q * 6 + i) * 2)}" cy="${r1(y)}" r="${r1(r)}" fill="#3a0a2a"/><circle cx="${r1(x - 1)}" cy="${r1(y - 1)}" r="${r1(r * 0.45)}" fill="#7a1a4a"/>`;
      }
      return out;
    },
  };
}

/** Cửu vĩ: n đuôi cáo xòe sau lưng, đung đưa */
export function fxCuuVi(n: number): FxSpec {
  const W = 64;
  const H = 40;
  return {
    key: `cuuvi${n}`,
    w: W,
    h: H,
    frames: 8,
    outline: '#5a1e04',
    draw: (p) => {
      let out = '';
      for (let i = 0; i < n; i++) {
        const base = n === 1 ? 0 : -70 + (140 / (n - 1)) * i;
        const a = base + Math.sin(TAU * p + i * 0.8) * 7;
        out += `<g transform="translate(${W / 2} ${H - 4}) rotate(${r1(a)})">
          <path d="M-2 0 C-7 -9 4 -18 -1 -30 C7 -21 8 -9 2 0Z" fill="#ff8a2a"/>
          <path d="M0 -4 C-3 -10 3 -16 0 -24 C4 -17 4 -10 1 -4Z" fill="#ffb060"/>
          <path d="M-1 -30 C2 -27 4 -25 3 -22 C1 -24 0 -26 -1 -30Z" fill="#fff4e0"/></g>`;
      }
      return out;
    },
  };
}

/** Dải lụa tiên vắt sau vai */
export function fxLuaTien(color: string): FxSpec {
  const W = 60;
  const H = 30;
  return {
    key: `luatien${color}`,
    w: W,
    h: H,
    frames: 8,
    outline: '#1f2a3a',
    draw: (p) => {
      const d1 = Math.sin(TAU * p) * 3;
      const d2 = Math.sin(TAU * p + 1.5) * 3;
      const path = `M3 ${24 + d1} C8 ${8 + d2} 18 ${3 + d1 * 0.5} 30 6 C42 ${3 - d2 * 0.5} 52 ${8 - d1} 57 ${24 - d2}`;
      return `<path d="${path}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/><path d="${path}" fill="none" stroke="#fff8e6" stroke-width="1" stroke-linecap="round" transform="translate(0 -1)"/>`;
    },
  };
}

/** Tường vân dưới chân */
export function fxTuongVan(): FxSpec {
  return {
    key: 'tuongvan',
    w: 58,
    h: 16,
    frames: 1,
    outline: '#5a78b0',
    draw: () => {
      let out = '';
      [
        [13, 9],
        [29, 6],
        [45, 9],
      ].forEach(([x, y]) => {
        out += `<g transform="translate(${x} ${y})"><path d="M-11 4 Q-13 -1 -8 -2 Q-7 -7 -1 -6 Q3 -9 7 -5 Q13 -5 11 1 Q14 4 9 5Z" fill="#f6f8ff"/><path d="M-4 1 q2 -3 4 -1 q1 2 -1 2" fill="none" stroke="#9ab4e0" stroke-width="1"/></g>`;
      });
      return out;
    },
  };
}

// ---------------- Hào quang chung theo cảnh giới ----------------
/** Vòng pháp trận dưới chân (elip dẹt), vạch đứt chạy vòng */
export function fxRing(color: string, w: number, dashed: boolean): FxSpec {
  const h = Math.round(w * 0.32);
  return {
    key: `ring${color}${w}${dashed}`,
    w: w + 2,
    h: h + 2,
    frames: dashed ? 8 : 1,
    draw: (p) => {
      const rx = w / 2 - 1;
      const ry = h / 2 - 1;
      const C = Math.PI * (rx + ry);
      const dash = dashed ? `stroke-dasharray="3 2" stroke-dashoffset="${r1(-p * 5)}"` : '';
      return `<ellipse cx="${w / 2 + 1}" cy="${h / 2 + 1}" rx="${rx}" ry="${ry}" fill="none" stroke="${color}" stroke-width="1.2" ${dash} pathLength="${Math.round(C)}"/>
        <ellipse cx="${w / 2 + 1}" cy="${h / 2 + 1}" rx="${rx - 3}" ry="${Math.max(1, ry - 1.5)}" fill="none" stroke="${color}" stroke-width="1" opacity="0.6" stroke-dasharray="1 3"/>`;
    },
  };
}

/** Linh quang: đốm sáng vuông bốc lên quanh người */
export function fxMotes(n: number, color: string): FxSpec {
  const W = 36;
  const H = 44;
  return {
    key: `motes${n}${color}`,
    w: W,
    h: H,
    frames: 12,
    draw: (p) => {
      let out = '';
      for (let i = 0; i < n; i++) {
        const q = (p * (1 + (i % 3) * 0.0) + i / n) % 1;
        const x = 3 + ((i * 11) % (W - 6));
        const y = H - 2 - q * (H - 6);
        const s = i % 3 === 0 ? 2 : 1;
        if (q > 0.9) continue;
        out += `<rect x="${x}" y="${Math.round(y)}" width="${s}" height="${s}" fill="${i % 2 ? '#ffffff' : color}"/>`;
      }
      return out;
    },
  };
}

/** Cột sáng: các vạch sáng chạy dọc lên */
export function fxPillar(color: string): FxSpec {
  const W = 22;
  const H = 60;
  return {
    key: `pillar2${color}`,
    w: W,
    h: H,
    frames: 8,
    draw: (p) => {
      // chỉ các vệt sáng chạy lên, không tô nền (nền mờ trông như khối xám)
      let out = '';
      for (let i = 0; i < 8; i++) {
        const x = 3 + ((i * 7) % (W - 6));
        const y = H - ((p + i / 8) % 1) * (H + 8);
        out += `<rect x="${x}" y="${Math.round(y)}" width="1" height="${i % 2 ? 5 : 8}" fill="${i % 3 ? color : '#ffffff'}"/>`;
      }
      return out;
    },
  };
}

/** Hai đốm sáng bay vòng quanh người */
export function fxOrbit(color: string): FxSpec {
  const W = 50;
  const H = 40;
  return {
    key: `orbit${color}`,
    w: W,
    h: H,
    frames: 16,
    outline: color,
    draw: (p) => {
      let out = '';
      for (let k = 0; k < 2; k++) {
        const a = TAU * (k ? -p : p) + k * 2;
        const x = W / 2 + Math.cos(a) * (W / 2 - 4);
        const y = (k ? 14 : 24) + Math.sin(a) * 5;
        out += `<rect x="${Math.round(x) - 1}" y="${Math.round(y) - 1}" width="2" height="2" fill="#ffffff"/>`;
      }
      return out;
    },
  };
}

/** Vầng tia sáng lớn sau lưng (Độ Kiếp) */
export function fxRays(color: string): FxSpec {
  const S = 70;
  const c = S / 2;
  return {
    key: `rays${color}`,
    w: S,
    h: S,
    frames: 6,
    soft: true,
    draw: (p) => {
      let out = '';
      for (let i = 0; i < 16; i++) {
        const a = i * 22.5 + p * 22.5;
        out += `<rect x="${c - 1}" y="2" width="2" height="${i % 2 ? 12 : 20}" fill="${color}" opacity="${i % 2 ? 0.5 : 0.85}" transform="rotate(${r1(a)} ${c} ${c})"/>`;
      }
      return out;
    },
  };
}

// ---------------- Hào quang sau phi thăng: Tiên giới, Ma giới, Thái Hư giới ----------------
/** Tiên giới: vầng tiên quang tròn sau đầu, vành vàng có tia ngắn */
export function fxTienHalo(): FxSpec {
  const S = 40;
  const c = S / 2;
  return {
    key: 'tienhalo2',
    w: S,
    h: S,
    frames: 8,
    outline: '#a8782a',
    draw: (p) => {
      let out = `<circle cx="${c}" cy="${c}" r="14" fill="none" stroke="#ffe27a" stroke-width="2"/><circle cx="${c}" cy="${c}" r="11" fill="none" stroke="#fff8dc" stroke-width="1"/>`;
      for (let i = 0; i < 16; i++) {
        const a = i * 22.5 + p * 22.5;
        out += `<rect x="${c - 0.5}" y="0" width="1" height="${i % 2 ? 3 : 5}" fill="${i % 2 ? '#fff8dc' : '#ffe27a'}" transform="rotate(${r1(a)} ${c} ${c})"/>`;
      }
      return out;
    },
  };
}

/** Tiên giới: cánh hoa và đốm sáng rơi chậm quanh người */
export function fxTienPetals(n: number): FxSpec {
  const W = 50;
  const H = 56;
  return {
    key: `tienpetal${n}`,
    w: W,
    h: H,
    frames: 12,
    draw: (p) => {
      let out = '';
      for (let i = 0; i < n; i++) {
        const q = (p + i / n) % 1;
        const x = 4 + ((i * 13) % (W - 8)) + Math.sin(q * TAU + i) * 3;
        const y = 2 + q * (H - 6);
        if (q > 0.92) continue;
        out += i % 3 ? `<rect x="${Math.round(x)}" y="${Math.round(y)}" width="2" height="1" fill="${i % 2 ? '#ffc8dc' : '#ffffff'}"/>` : `<rect x="${Math.round(x)}" y="${Math.round(y)}" width="1" height="1" fill="#ffe27a"/>`;
      }
      return out;
    },
  };
}

/** Tiên giới: mây ngũ sắc dưới chân */
export function fxNguSacVan(): FxSpec {
  const cols = ['#ffd0e0', '#fff4b0', '#c8f0d0', '#c8e0ff', '#e8d0ff'];
  return {
    key: 'ngusacvan',
    w: 64,
    h: 16,
    frames: 4,
    outline: '#8a78b0',
    draw: (p) => {
      let out = '';
      [8, 20, 32, 44, 56].forEach((x, i) => {
        const y = 9 + Math.round(Math.sin(TAU * p + i) * 1);
        out += `<g transform="translate(${x} ${y})"><path d="M-8 3 Q-9 -1 -5 -2 Q-4 -6 1 -5 Q4 -7 7 -3 Q10 -2 8 2 Q9 4 6 4Z" fill="${cols[i]}"/></g>`;
      });
      return out;
    },
  };
}

/** Ma giới: tro tàn và đom lửa bốc lên */
export function fxEmbers(n: number): FxSpec {
  const W = 50;
  const H = 58;
  return {
    key: `embers${n}`,
    w: W,
    h: H,
    frames: 12,
    draw: (p) => {
      let out = '';
      for (let i = 0; i < n; i++) {
        const q = (p + i / n) % 1;
        const x = 4 + ((i * 11) % (W - 8)) + Math.sin(q * 9 + i) * 2;
        const y = H - 3 - q * (H - 6);
        if (q > 0.9) continue;
        out += `<rect x="${Math.round(x)}" y="${Math.round(y)}" width="${i % 4 ? 1 : 2}" height="${i % 4 ? 1 : 2}" fill="${i % 3 ? '#ff6a2a' : i % 2 ? '#ffd060' : '#5a5050'}"/>`;
      }
      return out;
    },
  };
}

/** Ma giới: lửa ma đỏ đen bốc dưới chân */
export function fxMaHoa(): FxSpec {
  const W = 48;
  const H = 22;
  return {
    key: 'mahoa',
    w: W,
    h: H,
    frames: 6,
    outline: '#1a0206',
    draw: (p, i) => {
      let out = '';
      for (let k = 0; k < 7; k++) {
        const x = 5 + k * 6.3;
        const hh = 8 + ((k * 5 + i * 3) % 7) + Math.sin(TAU * p + k) * 2;
        out += `<path d="M${r1(x - 3)} ${H} Q${r1(x - 2)} ${r1(H - hh * 0.6)} ${r1(x)} ${r1(H - hh)} Q${r1(x + 2)} ${r1(H - hh * 0.6)} ${r1(x + 3)} ${H}Z" fill="${k % 2 ? '#a01020' : '#5a0a20'}"/><path d="M${r1(x - 1)} ${H} Q${r1(x)} ${r1(H - hh * 0.5)} ${r1(x + 1)} ${H}Z" fill="#ff5a2a"/>`;
      }
      return out;
    },
  };
}

/** Ma giới: xích ma khí quấn vòng quanh người */
export function fxMaXich(): FxSpec {
  const W = 56;
  const H = 40;
  return {
    key: 'maxich',
    w: W,
    h: H,
    frames: 12,
    outline: '#12020a',
    draw: (p) => {
      let out = '';
      for (let i = 0; i < 14; i++) {
        const a = TAU * (p + i / 14);
        const x = W / 2 + Math.cos(a) * (W / 2 - 4);
        const y = H / 2 + Math.sin(a) * 7 + (i % 2 ? 0 : 1);
        const front = Math.sin(a) > 0;
        out += `<rect x="${Math.round(x) - 1}" y="${Math.round(y) - 1}" width="3" height="2" fill="${front ? '#8a8a96' : '#4a4a56'}"/><rect x="${Math.round(x)}" y="${Math.round(y) - 1}" width="1" height="1" fill="#2a2a32"/>`;
      }
      return out;
    },
  };
}

/** Thái Hư: vòng xoáy hư không sau lưng */
export function fxHuVortex(): FxSpec {
  const S = 66;
  const c = S / 2;
  return {
    key: 'huvortex2',
    w: S,
    h: S,
    frames: 12,
    soft: true,
    draw: (p) => {
      let out = `<circle cx="${c}" cy="${c}" r="12" fill="#05030e" opacity="0.8"/>`;
      for (let arm = 0; arm < 4; arm++)
        for (let k = 0; k < 14; k++) {
          const a = TAU * (p + arm / 4) + k * 0.38;
          const r = 12 + k * 1.45;
          out += `<rect x="${r1(c + Math.cos(a) * r - 1)}" y="${r1(c + Math.sin(a) * r - 1)}" width="2" height="2" fill="${k % 3 ? '#8a6ae0' : '#9fe8ff'}" opacity="${1 - k / 16}"/>`;
        }
      return out;
    },
  };
}

/** Thái Hư: tinh tú bay vòng quanh người */
export function fxHuStars(n: number): FxSpec {
  const W = 56;
  const H = 46;
  return {
    key: `hustars${n}`,
    w: W,
    h: H,
    frames: 16,
    draw: (p) => {
      let out = '';
      for (let i = 0; i < n; i++) {
        const a = TAU * (p * (i % 2 ? -1 : 1) + i / n);
        const rx = W / 2 - 3 - (i % 3) * 4;
        const x = W / 2 + Math.cos(a) * rx;
        const y = 10 + (i % 4) * 8 + Math.sin(a) * 4;
        out += i % 3 === 0 ? `<rect x="${Math.round(x) - 1}" y="${Math.round(y)}" width="3" height="1" fill="#ffffff"/><rect x="${Math.round(x)}" y="${Math.round(y) - 1}" width="1" height="3" fill="#ffffff"/>` : `<rect x="${Math.round(x)}" y="${Math.round(y)}" width="1" height="1" fill="${i % 2 ? '#9fe8ff' : '#c8b8ff'}"/>`;
      }
      return out;
    },
  };
}

/** Chuông vàng Vạn Kiếp Quy Nhất: quả chuông nhỏ lơ lửng bên vai, đung đưa và tỏa gợn sóng */
export function fxChuongVang(): FxSpec {
  const W = 20;
  const H = 24;
  return {
    key: 'chuongvang1',
    w: W,
    h: H,
    frames: 12,
    outline: '#7a5418',
    draw: (p) => {
      const a = Math.sin(p * TAU) * 14;
      const cx = W / 2;
      let out = `<g transform="rotate(${r1(a)} ${cx} 3)">`;
      out += `<rect x="${cx - 1}" y="2" width="2" height="2" fill="#c89632"/>`;
      out += `<path d="M${cx - 4} 13 Q${cx - 4} 4 ${cx} 4 Q${cx + 4} 4 ${cx + 4} 13 L${cx + 6} 15 L${cx - 6} 15 Z" fill="#ffd34d"/>`;
      out += `<rect x="${cx - 2}" y="6" width="1" height="5" fill="#fff4c0"/>`;
      out += `<rect x="${cx - 5}" y="12" width="10" height="1" fill="#c89632"/>`;
      out += `<rect x="${cx - 1}" y="15" width="2" height="2" fill="#c89632"/>`;
      out += '</g>';
      // gợn sóng tiếng chuông
      const r = 4 + p * 6;
      if (p > 0.15)
        out += `<path d="M${cx - r} ${17 + r * 0.5} Q${cx} ${17 + r} ${cx + r} ${17 + r * 0.5}" fill="none" stroke="#ffe27a" stroke-width="1"/>`;
      return out;
    },
  };
}
