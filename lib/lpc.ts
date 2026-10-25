'use client';

/**
 * Ghép nhân vật LPC (Liberated Pixel Cup) từ nhiều lớp ảnh trong /public/lpc,
 * nhuộm màu tóc và áo ngay trên trình duyệt, trả về một dải khung hình.
 * Ảnh gốc: Universal LPC Spritesheet Character Generator (CC-BY-SA 3.0 / GPL 3.0, xem /tac-gia).
 */

export type Anim = 'walk' | 'idle' | 'slash' | 'spellcast' | 'hurt';

/** Số khung mỗi động tác, hàng hướng (0 lên, 1 trái, 2 xuống, 3 phải; hurt chỉ có 1 hàng) */
export const ANIM: Record<Anim, { frames: number; rows: number; fps: number; from?: number }> = {
  walk: { frames: 8, rows: 4, fps: 9, from: 1 },
  idle: { frames: 2, rows: 4, fps: 2 },
  slash: { frames: 6, rows: 4, fps: 12 },
  spellcast: { frames: 7, rows: 4, fps: 5 },
  hurt: { frames: 6, rows: 1, fps: 8 },
};


export interface Layer {
  key: string; // thư mục trong /public/lpc
  tint?: string; // màu nhuộm #rrggbb
  dy?: number; // dịch xuống (px trong khung 64), dùng cho vũ khí khi cầm ở dáng trẻ con
}

const imgCache = new Map<string, Promise<HTMLImageElement | null>>();
function loadImg(src: string): Promise<HTMLImageElement | null> {
  let p = imgCache.get(src);
  if (!p) {
    p = new Promise((res) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });
    imgCache.set(src, p);
  }
  return p;
}

function hexRgb(h: string): [number, number, number] {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Nhuộm theo độ sáng: giữ nét viền tối, vùng sáng nhận màu mới */
function tintCanvas(cv: HTMLCanvasElement, hex: string) {
  const ctx = cv.getContext('2d')!;
  const d = ctx.getImageData(0, 0, cv.width, cv.height);
  const px = d.data;
  // "*#rrggbb": nhân màu (giữ nguyên sắc độ gốc), dùng cho màu da
  if (hex.startsWith('*')) {
    const [mr, mg, mb] = hexRgb(hex.slice(1));
    for (let i = 0; i < px.length; i += 4) {
      if (!px[i + 3]) continue;
      px[i] = Math.min(255, (px[i] * mr) / 235);
      px[i + 1] = Math.min(255, (px[i + 1] * mg) / 235);
      px[i + 2] = Math.min(255, (px[i + 2] * mb) / 235);
    }
    ctx.putImageData(d, 0, 0);
    return;
  }
  const [tr, tg, tb] = hexRgb(hex);
  for (let i = 0; i < px.length; i += 4) {
    if (!px[i + 3]) continue;
    const l = (0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2]) / 255;
    const f = l < 0.36 ? l * 0.9 : 0.42 + l * 0.72;
    px[i] = Math.min(255, tr * f);
    px[i + 1] = Math.min(255, tg * f);
    px[i + 2] = Math.min(255, tb * f);
  }
  ctx.putImageData(d, 0, 0);
}

/** Lấy 1 hàng hướng của động tác, chuẩn hóa về khung 128x128 (người nằm giữa) */
async function rowOf(key: string, anim: Anim, dir: number, dy = 0): Promise<HTMLCanvasElement | null> {
  const meta = ANIM[anim];
  // vũ khí chỉ có dáng đi (riêng kiếm có cả chém); động tác khác dùng tạm dáng đi khung đầu
  let src = anim;
  const im0 = await loadImg(`/lpc/${key}/${anim}.png`);
  let im = im0;
  if (!im) {
    if (anim === 'walk') return null;
    im = await loadImg(`/lpc/${key}/walk.png`);
    src = 'walk';
    if (!im) return null;
  }
  const rows = src === 'hurt' ? 1 : 4;
  // cỡ khung suy từ chiều cao ảnh: người 64px, vũ khí to 128px
  const cell = Math.round(im.height / rows);
  const row = rows === 1 ? 0 : dir;
  const n = meta.frames;
  const from = src === anim ? meta.from ?? 0 : 0;
  const cv = document.createElement('canvas');
  cv.width = n * 128;
  cv.height = 128;
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const avail = Math.floor(im.width / cell);
  for (let i = 0; i < n; i++) {
    const col = src === anim ? Math.min(avail - 1, from + i) : 0;
    const off = (128 - cell) / 2;
    ctx.drawImage(im, col * cell, row * cell, cell, cell, i * 128 + off, off + dy, cell, cell);
  }
  return cv;
}

const sheetCache = new Map<string, Promise<string>>();
const ready = new Map<string, string>();

/** Dải đã ghép xong (đồng bộ), để khỏi nháy hình khi gắn lại component */
export function readyStrip(layers: Layer[], anim: Anim, dir: number): string | undefined {
  return ready.get(JSON.stringify([layers, anim, dir]));
}

/** Ghép các lớp thành dải khung (mỗi khung 128x128), trả về dataURL */
export function composeStrip(layers: Layer[], anim: Anim, dir: number): Promise<string> {
  const id = JSON.stringify([layers, anim, dir]);
  let p = sheetCache.get(id);
  if (!p) {
    p = (async () => {
      const n = ANIM[anim].frames;
      const out = document.createElement('canvas');
      out.width = n * 128;
      out.height = 128;
      const ctx = out.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      const parts = await Promise.all(layers.map((l) => rowOf(l.key, anim, dir, l.dy)));
      parts.forEach((cv, i) => {
        if (!cv) return;
        const t = layers[i].tint;
        if (t) tintCanvas(cv, t);
        ctx.drawImage(cv, 0, 0);
      });
      const url = out.toDataURL();
      ready.set(id, url);
      return url;
    })();
    sheetCache.set(id, p);
    if (sheetCache.size > 80) sheetCache.delete(sheetCache.keys().next().value as string);
  }
  return p;
}

/** Một khung tĩnh dạng ảnh (dùng cho thẻ chia sẻ) */
export async function composeFrame(layers: Layer[], anim: Anim = 'walk', dir = 2, frame = 0): Promise<HTMLImageElement> {
  const url = await composeStrip(layers, anim, dir);
  const im = await loadImg(url);
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 128;
  if (im) cv.getContext('2d')!.drawImage(im, frame * 128, 0, 128, 128, 0, 0, 128, 128);
  const out = new Image();
  out.src = cv.toDataURL();
  await out.decode();
  return out;
}
