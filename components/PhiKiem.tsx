'use client';

import { useEffect, useRef, useState } from 'react';
import Sprite from '@/components/Sprite';
import { foeChar } from '@/lib/game/duel';
import { PK_COOLDOWN, PK_HIT_DEG, PK_PER_LAYER, PK_SECONDS, powerOf, ringSpeed } from '@/lib/game/phiKiem';
import type { RivalChar } from '@/lib/game/types';

// Hình đều lấy từ bộ 496 pixel art icons (Henrique Lazarini, CC0), không tự vẽ.
// Canvas theo điểm CSS, nhân với dpr nguyên và tắt làm mịn: mỗi điểm của icon thành ô vuông sắc nét.
const W = 360;
const H = 440;
const CX = W / 2;
const CY = 176;
const R = 104; // bán kính vòng hộ thể
const K = 2; // mọi icon phóng đúng 2 lần, giữ ô vuông đều
const IS = 32 * K;
const LAUNCH_Y = H - 10;
const FLY_MS = 95;
const SWORD = '/icons/g_long_tuyen_kiem.png';
const OBST = '/icons/g_huyet_anh_dao.png';
const PHU = '/icons/g_kiem_y_phu.png';
/** Linh châu xen giữa các lá phù, mỗi tầng một màu */
const CHAU = ['/icons/g_thuy_linh_chau.png', '/icons/g_hon_nguyen_chau.png', '/icons/g_hoa_linh_chau.png', '/icons/g_huyet_ngoc.png'];
const LAYER_COL = ['#6ab0ff', '#8af0c8', '#ff9a4a', '#ff5a5a'];
// mũi kiếm trong icon 32x32 nằm ở (26,5), thân chạy chéo xuống trái: hướng mũi khoảng -50 độ
const TIP_X = 26;
const TIP_Y = 5;
const ICON_ANG = (-50 * Math.PI) / 180;

type Stuck = { a: number; obst?: boolean };
type Loose = { x: number; y: number; vx: number; vy: number; ang: number; va: number; t0: number; obst?: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; t0: number; col: string; life: number };

const norm = (a: number) => ((a % 360) + 360) % 360;
const angDiff = (a: number, b: number) => {
  const d = Math.abs(norm(a) - norm(b));
  return d > 180 ? 360 - d : d;
};

type Imgs = { sword: HTMLImageElement; obst: HTMLImageElement; phu: HTMLImageElement; chau: HTMLImageElement[] };
function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(im);
    im.src = src;
  });
}

/** Đặt một icon kiếm sao cho mũi nằm ở (tx,ty) và chĩa theo góc ang (radian) */
function putSword(g: CanvasRenderingContext2D, im: HTMLImageElement, tx: number, ty: number, ang: number, alpha = 1) {
  g.save();
  g.globalAlpha = alpha;
  g.translate(Math.round(tx), Math.round(ty));
  g.rotate(ang - ICON_ANG);
  g.drawImage(im, -TIP_X * K, -TIP_Y * K, IS, IS);
  g.restore();
}

/**
 * Phi kiếm phá hộ thể: vòng hộ thể xoay quanh bóng đối thủ, chạm để phóng kiếm từ dưới lên.
 * Trúng chỗ trống thì cắm vào, trúng kiếm đã cắm là Phản phệ. Đủ 10 kiếm vỡ một tầng, tầng sau xoay thất thường hơn.
 */
export default function PhiKiem({ foe, base, onDone }: { foe: RivalChar; base: number; onDone: (swords: number, best: number) => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [hud, setHud] = useState({ swords: 0, combo: 0, layer: 0, left: PK_SECONDS, started: false });
  const [msg, setMsg] = useState<{ id: number; text: string; cls: string } | null>(null);
  const S = useRef({
    rot: 0,
    dir: 1,
    dirT: 1, // hướng đích, đổi bất chợt ở tầng 2 trở đi
    nextFlip: 0,
    phase: Math.random() * 6,
    layer: 0,
    stuck: [] as Stuck[],
    inLayer: 0,
    fly: null as null | { t0: number },
    loose: [] as Loose[],
    sparks: [] as Spark[],
    shakeTo: 0,
    flashTo: 0,
    stopTo: 0,
    swords: 0,
    combo: 0,
    best: 0,
    t0: 0, // lúc bắt đầu tính giờ
    born: 0,
    last: 0,
    lastThrow: 0,
    ended: false,
    hudAt: 0,
  });
  const imgs = useRef<Imgs | null>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  function say(text: string, cls: string) {
    setMsg({ id: Date.now() + Math.random(), text, cls });
  }

  function newLayer(now: number) {
    const s = S.current;
    s.layer += 1;
    s.inLayer = 0;
    // kiếm cũ rơi khỏi vòng vỡ
    for (const k of s.stuck) {
      const wa = ((k.a + s.rot) * Math.PI) / 180;
      s.loose.push({ x: CX + Math.cos(wa) * R, y: CY + Math.sin(wa) * R, vx: Math.cos(wa) * 120, vy: Math.sin(wa) * 120 - 60, ang: k.a + s.rot + 180, va: (Math.random() - 0.5) * 900, t0: now, obst: k.obst });
    }
    // mảnh vòng hộ thể bắn ra
    const col = LAYER_COL[Math.min(LAYER_COL.length - 1, s.layer - 1)];
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 90 + Math.random() * 160;
      s.sparks.push({ x: CX + Math.cos(a) * R, y: CY + Math.sin(a) * R, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t0: now, col, life: 600 });
    }
    // cấm chế: kiếm đỏ cắm sẵn ở tầng mới
    const n = Math.min(4, s.layer + 1);
    s.stuck = [];
    for (let i = 0; i < n; i++) s.stuck.push({ a: norm(Math.random() * 360), obst: true });
    s.dir = s.dirT = Math.random() < 0.5 ? 1 : -1;
    s.nextFlip = now + 1200 + Math.random() * 1200;
    s.stopTo = now + 170;
    s.flashTo = now + 140;
    say(`Phá tầng hộ thể thứ ${s.layer}!`, 'brk');
    try {
      navigator.vibrate?.([30, 40, 60]);
    } catch {}
  }

  function fire() {
    const s = S.current;
    const now = performance.now();
    if (s.ended || s.fly || now - s.lastThrow < PK_COOLDOWN || now < s.stopTo) return;
    if (!s.t0) s.t0 = now;
    s.lastThrow = now;
    s.fly = { t0: now };
  }

  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
    c.width = W * dpr;
    c.height = H * dpr;
    Promise.all([loadImg(SWORD), loadImg(OBST), loadImg(PHU), ...CHAU.map(loadImg)]).then(([sword, obst, phu, ...chau]) => {
      imgs.current = { sword, obst, phu, chau };
    });
    const g = c.getContext('2d')!;
    const s = S.current;
    s.born = s.last = performance.now();
    s.nextFlip = s.born + 2000;
    let raf = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - s.last) / 1000);
      s.last = now;
      // tự bắt đầu tính giờ sau 2 giây nếu chưa chạm
      if (!s.t0 && now - s.born > 2000) s.t0 = now;
      const frozen = now < s.stopTo;
      if (!frozen) {
        // tốc độ vòng: tầng đầu đều, các tầng sau nhanh chậm thất thường và đổi chiều
        let v = ringSpeed(s.layer, base);
        if (s.layer >= 1) {
          v *= 0.5 + 0.75 * (0.5 + 0.5 * Math.sin(now / 520 + s.phase));
          if (s.layer >= 2 && now > s.nextFlip) {
            s.dirT = -s.dirT;
            s.nextFlip = now + 1100 + Math.random() * 1500;
          }
        }
        s.dir += (s.dirT - s.dir) * Math.min(1, dt * 6);
        s.rot = norm(s.rot + v * s.dir * dt);

        // kiếm đang bay
        if (s.fly) {
          const k = (now - s.fly.t0) / FLY_MS;
          if (k >= 1) {
            s.fly = null;
            const rel = norm(90 - s.rot);
            const hit = s.stuck.some((x) => angDiff(x.a, rel) < PK_HIT_DEG);
            if (hit) {
              s.loose.push({ x: CX, y: CY + R - 22, vx: (Math.random() < 0.5 ? -1 : 1) * (80 + Math.random() * 60), vy: 160, ang: -90, va: 1100, t0: now });
              s.combo = 0;
              s.shakeTo = now + 260;
              say('Phản phệ!', 'bad');
              try {
                navigator.vibrate?.(90);
              } catch {}
            } else {
              s.stuck.push({ a: rel });
              s.swords += 1;
              s.inLayer += 1;
              s.combo += 1;
              s.best = Math.max(s.best, s.combo);
              const col = LAYER_COL[Math.min(LAYER_COL.length - 1, s.layer)];
              for (let i = 0; i < 8; i++) {
                const a = Math.PI / 2 + (Math.random() - 0.5) * 2.2;
                const sp = 60 + Math.random() * 90;
                s.sparks.push({ x: CX, y: CY + R - 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t0: now, col: i % 2 ? '#fff8dc' : col, life: 320 });
              }
              if (s.combo >= 3 && s.combo % 3 === 0) say(`Liên kích x${s.combo}`, 'good');
              if (s.inLayer >= PK_PER_LAYER) newLayer(now);
            }
          }
        }
      }

      // hết giờ
      if (s.t0 && !s.ended && now - s.t0 >= PK_SECONDS * 1000) {
        s.ended = true;
        s.fly = null;
        say(`Thu kiếm! ${s.swords} phi kiếm`, 'end');
        setTimeout(() => doneRef.current(s.swords, s.best), 900);
      }

      // vẽ
      const im = imgs.current;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.imageSmoothingEnabled = false;
      g.clearRect(0, 0, W, H);
      const sh = now < s.shakeTo ? Math.round((Math.random() - 0.5) * 6) : 0;
      g.translate(sh, Math.round(sh * 0.5));
      if (im) {
        const chau = im.chau[Math.min(im.chau.length - 1, s.layer)];
        // vòng hộ thể: 4 lá phù xen 4 viên linh châu, đứng hướng ra ngoài, xoay theo rot
        for (let i = 0; i < 8; i++) {
          const a = ((i * 45 + s.rot) * Math.PI) / 180;
          g.save();
          g.translate(Math.round(CX + Math.cos(a) * R), Math.round(CY + Math.sin(a) * R));
          g.rotate(a + Math.PI / 2);
          g.drawImage(i % 2 ? chau : im.phu, -IS / 2, -IS / 2, IS, IS);
          g.restore();
        }
        // kiếm đã cắm: mũi đâm vào vòng, chuôi chĩa ra ngoài
        for (const k of s.stuck) {
          const a = ((k.a + s.rot) * Math.PI) / 180;
          putSword(g, k.obst ? im.obst : im.sword, CX + Math.cos(a) * (R - 22), CY + Math.sin(a) * (R - 22), a + Math.PI);
        }
        // kiếm đang bay và kiếm chờ phóng: mũi hướng lên
        const ready = !s.ended && !s.fly && now - s.lastThrow >= PK_COOLDOWN;
        const tipEnd = CY + R - 22;
        const tipY = s.fly ? LAUNCH_Y - 64 - (LAUNCH_Y - 64 - tipEnd) * Math.min(1, (now - s.fly.t0) / FLY_MS) : LAUNCH_Y - 64;
        if (s.fly || ready) putSword(g, im.sword, CX, tipY, -Math.PI / 2);
        // kiếm rơi: lộn nhào
        s.loose = s.loose.filter((l) => now - l.t0 < 700);
        for (const l of s.loose) {
          const t = (now - l.t0) / 1000;
          putSword(g, l.obst ? im.obst : im.sword, l.x + l.vx * t, l.y + l.vy * t + 500 * t * t, ((l.ang + l.va * t) * Math.PI) / 180, Math.max(0, 1 - t / 0.7));
        }
      }
      // tia sáng khi kiếm cắm và khi vỡ tầng
      s.sparks = s.sparks.filter((p) => now - p.t0 < p.life);
      for (const p of s.sparks) {
        const t = (now - p.t0) / 1000;
        g.globalAlpha = (now - p.t0) / p.life < 0.5 ? 1 : 0.5;
        g.fillStyle = p.col;
        g.fillRect(Math.round(p.x + p.vx * t) - 2, Math.round(p.y + p.vy * t) - 2, 4, 4);
      }
      g.globalAlpha = 1;
      if (now < s.flashTo) {
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.fillStyle = 'rgba(255,255,255,0.75)';
        g.fillRect(0, 0, W, H);
      }

      // bảng số liệu, khoảng 10 lần mỗi giây
      if (now - s.hudAt > 90) {
        s.hudAt = now;
        const left = s.t0 ? Math.max(0, PK_SECONDS - (now - s.t0) / 1000) : PK_SECONDS;
        setHud((h) => (h.swords === s.swords && h.combo === s.combo && h.layer === s.layer && Math.abs(h.left - left) < 0.05 && h.started === !!s.t0 ? h : { swords: s.swords, combo: s.combo, layer: s.layer, left, started: !!s.t0 }));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const key = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        fire();
      }
    };
    window.addEventListener('keydown', key);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pw = Math.round(powerOf(hud.swords) * 100);
  return (
    <div
      className="pk"
      ref={wrap}
      onPointerDown={(e) => {
        e.preventDefault();
        fire();
      }}
      role="button"
      aria-label="Chạm để phóng phi kiếm"
    >
      <div className="pk-hud">
        <span className="pk-time" aria-label={`Còn ${Math.ceil(hud.left)} giây`}>
          <i style={{ width: `${(hud.left / PK_SECONDS) * 100}%` }} className={hud.left < 3 ? 'low' : ''} />
        </span>
        <span className="pk-stats">
          <b>{hud.swords}</b> kiếm · sức mạnh <b className={pw >= 100 ? 'up' : 'down'}>{pw}%</b>
        </span>
      </div>
      <div className="pk-stage">
        <span className="pk-foe">
          <Sprite c={foeChar(foe)} size={104} anim="idle" dir={2} />
        </span>
        <canvas ref={cv} style={{ width: W, height: H }} />
        {hud.combo >= 2 && (
          <span className="pk-combo" key={hud.combo}>
            Liên kích <b>x{hud.combo}</b>
          </span>
        )}
        {msg && (
          <span key={msg.id} className={`pk-msg ${msg.cls}`}>
            {msg.text}
          </span>
        )}
      </div>
      <p className="pk-hint">{hud.started ? 'Tránh đâm vào kiếm đã cắm' : 'Chạm để phóng kiếm!'}</p>
    </div>
  );
}
