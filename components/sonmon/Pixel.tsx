/**
 * 4.6.0 Sơn Môn: hình pixel vẽ bằng lưới ô vuông (SVG rect, crispEdges) - không emoji, không gradient.
 * 30 huy hiệu = khiên 16x16 (6 màu) + biểu tượng 8x8 (5 hình). 10 chính điện 16x16.
 * Chỉ để nhận diện, không cộng gì.
 */
import { HUY_HINH, HUY_MAU } from '@/lib/sonmon/data';

type Pal = Record<string, string>;

/** Gộp các ô cùng màu liền nhau trên một hàng thành một rect cho nhẹ. */
function Grid({ rows, pal, size, w = 16, h = 16, label, x: px, y: py }: { rows: string[]; pal: Pal; size: number; w?: number; h?: number; label?: string; x?: number; y?: number }) {
  const rects: React.ReactNode[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < w) {
      const c = row[x] ?? '.';
      let e = x + 1;
      while (e < w && (row[e] ?? '.') === c) e++;
      if (c !== '.' && pal[c]) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={e - x} height={1} fill={pal[c]} />);
      x = e;
    }
  });
  return (
    <svg
      x={px}
      y={py}
      width={size}
      height={(size * h) / w}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated', display: 'block', flex: 'none' }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {rects}
    </svg>
  );
}

const KHIEN = [
  'kkkkkkkkkkkkkkkk',
  'kggggggggggggggk',
  'kghffffffffffsgk',
  'kghffffffffffsgk',
  'kghffffffffffsgk',
  'kghffffffffffsgk',
  'kghffffffffffsgk',
  'kghffffffffffsgk',
  'kghffffffffffsgk',
  '.kghffffffffsgk.',
  '..kghffffffsgk..',
  '...kghffffsgk...',
  '....kgffffgk....',
  '.....kgffgk.....',
  '......kggk......',
  '.......kk.......',
];
/** biểu tượng 8x8 theo thứ tự HUY_HINH: kiếm, sen, trăng, rồng, núi */
const BIEU: string[][] = [
  ['...ww...', '...ww...', '...ww...', '...ww...', '...ww...', '.wwwwww.', '...ww...', '...ww...'],
  ['...ww...', '..wwww..', 'w.wwww.w', 'ww.ww.ww', '.wwwwww.', '..wwww..', '...ww...', '...ww...'],
  ['..wwww..', '.www....', 'www.....', 'www.....', 'www.....', 'www.....', '.www....', '..wwww..'],
  ['..w..w..', '..wwwww.', '.ww.wwww', 'wwwwwwww', 'www.....', 'wwwwww..', '.wwww...', '..ww....'],
  ['........', '...w....', '..www...', '..www.w.', '.wwwwwww', '.wwwwwww', 'wwwwwwww', '........'],
];
const mix = (hex: string, to: number, t: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.round(((n >> s) & 255) * (1 - t) + to * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};

export function HuyHieu({ id, size = 32, label, x, y }: { id: number; size?: number; label?: string; x?: number; y?: number }) {
  const i = Math.max(0, Math.min(29, Math.floor(id) || 0));
  const mau = HUY_MAU[Math.floor(i / 5) % 6];
  const hinh = i % 5;
  const rows = KHIEN.map((r) => r.split(''));
  BIEU[hinh].forEach((r, y) => r.split('').forEach((c, x) => c !== '.' && (rows[y + 2][x + 4] = c)));
  const dark = mau.id === 'huyen';
  const pal: Pal = {
    k: '#1f160d',
    g: dark ? '#b9a06a' : '#e8c35a',
    f: mau.hex,
    h: mix(mau.hex, 255, 0.3),
    s: mix(mau.hex, 0, 0.3),
    w: '#fff3dc',
  };
  return <Grid rows={rows.map((r) => r.join(''))} pal={pal} size={size} x={x} y={y} label={label === '' ? undefined : label ?? `${mau.name} · ${HUY_HINH[hinh].name}`} />;
}

const CD_PAL: Pal = {
  k: '#1f160d', r: '#a8303a', R: '#6e1f26', w: '#f3e6c4', b: '#8a5a2e', d: '#3b2a1a', g: '#e8c35a',
  s: '#a19e93', S: '#66635a', c: '#fffaf0', l: '#9fc4e0', p: '#e89ab0', G: '#4f8a4a', y: '#d6b264', Y: '#8f6d30',
};
const CD: string[][] = [
  // 0 Điện mái cong
  ['', '.......gg.......', 'k....rrrrrr....k', 'rk.rrrrrrrrrr.kr', '.rrrrrrrrrrrrrr.', 'RRRRRRRRRRRRRRRR', '..bwwwwwwwwwwb..', '..bwddwwwwddwb..',
    '..bwddwwwwddwb..', '..bwwwwddwwwwb..', '..bwwwwddwwwwb..', '..bwwwwddwwwwb..', '.ssssssssssssss.', 'ssssssssssssssss'],
  // 1 Lầu ba tầng
  ['.......gg.......', '.....rrrrrr.....', '....RRRRRRRR....', '.....bwwwwb.....', '....rrrrrrrr....', '...RRRRRRRRRR...', '....bwwddwwb....', '...rrrrrrrrrr...',
    '..RRRRRRRRRRRR..', '...bwwwwwwwwb...', '...bwwwddwwwb...', '...bwwwddwwwb...', '..ssssssssssss..', '.ssssssssssssss.'],
  // 2 Tháp đá
  ['.......gg.......', '.......ss.......', '......ssss......', '......sSSs......', '.....ssssss.....', '......sddS......', '....ssssssss....', '.....ssddsS.....',
    '...ssssssssss...', '....sssddssS....', '..ssssssssssss..', '...ssssddsssS...', '...ssssddsssS...', '.SSSSSSSSSSSSSS.'],
  // 3 Am tranh
  ['', '', '', '.......YY.......', '.....yyyyyy.....', '...yyyyyyyyyy...', '.yyyyyyyyyyyyyy.', 'YYYYYYYYYYYYYYYY', '..bwwwwwwwwwwb..',
    '..bwddwwwwwwwb..', '..bwddwwwddwwb..', '..bwwwwwwddwwb..', '..bwwwwwwddwwb..', 'GGGGGGGGGGGGGGGG'],
  // 4 Cung trên mây
  ['.......gg.......', '......rrrr......', '....rrrrrrrr....', '...RRRRRRRRRR...', '....bwwwwwwb....', '....bwwddwwb....', '..rrrrrrrrrrrr..', '.RRRRRRRRRRRRRR.',
    '..bwwwwwwwwwwb..', '..bwwwwddwwwwb..', '.cccc.bwwb.cccc.', 'cccccccccccccccc', '.cccllcccccllcc.', '..cccc....cccc..'],
  // 5 Động đá
  ['', '', '......SSSS......', '....SSssssSS....', '...SssssssssS...', '..SssssssssssS..', '.SssssddddssssS.', '.SsssddddddsssS.',
    'SssssddddddssssS', 'SssssddddddssssS', 'SsssGddddddGsssS', 'GGGGGddddddGGGGG', 'GGGGGGGGGGGGGGGG'],
  // 6 Đài sen
  ['', '.......pp.......', '......pppp......', '...p..pppp..p...', '...pp.pppp.pp...', '....pppppppp....', '.....pppppp.....', '...GGGGGGGGGG...',
    '..ssssssssssss..', '..sSSSSSSSSSSs..', '.ssssssssssssss.', '.sSSSSSSSSSSSSs.', 'ssssssssssssssss', 'SSSSSSSSSSSSSSSS'],
  // 7 Thành gỗ
  ['', '..g..........g..', '..rr.........rr.', '..b..........b..', 'b.b.b.b.b.b.b.b.', 'bbbbbbbbbbbbbbbb', 'bYbbYbbYbbYbbYbb', 'bbbbbbbbbbbbbbbb',
    'bbbbbbddddbbbbbb', 'bYbbYbddddbYbbYb', 'bbbbbbddddbbbbbb', 'bbbbbbddddbbbbbb', 'GGGGGGGGGGGGGGGG'],
  // 8 Miếu cổ
  ['', '', '', '.......gg.......', '....rrrrrrrr....', '..rrrrrrrrrrrr..', '.RRRRRRRRRRRRRR.', '...s.wwwwww.s...',
    '...s.wwggww.s...', '...s.wwggww.s...', '...s.wwwwww.s...', '..ssssssssssss..', '.SSSSSSSSSSSSSS.'],
  // 9 Lầu bát giác
  ['.......gg.......', '......rrrr......', '.....rrrrrr.....', '....rrrrrrrr....', '...rrrrrrrrrr...', '..RRRRRRRRRRRR..', '...b..b..b..b...', '...b..b..b..b...',
    '...b..b..b..b...', '...b..b..b..b...', '..ssssssssssss..', '.SSSSSSSSSSSSSS.', 'll.llll..llll.ll'],
];

export function ChinhDien({ id, size = 48, label }: { id: number; size?: number; label?: string }) {
  const rows = CD[Math.max(0, Math.min(9, Math.floor(id) || 0))];
  // dồn hình xuống đáy khung 16 hàng
  const pad = Array.from({ length: Math.max(0, 16 - rows.length) }, () => '');
  return <Grid rows={[...pad, ...rows]} pal={CD_PAL} size={size} label={label} />;
}

/** ô vuông pixel cho chuỗi điểm danh 7 ngày */
export function ChuoiO({ n, of = 7 }: { n: number; of?: number }) {
  return (
    <svg width={of * 14} height={12} viewBox={`0 0 ${of * 7} 6`} shapeRendering="crispEdges" style={{ imageRendering: 'pixelated', display: 'block' }} aria-hidden>
      {Array.from({ length: of }, (_, i) => (
        <g key={i}>
          <rect x={i * 7} y={0} width={6} height={6} fill="#1f160d" />
          <rect x={i * 7 + 1} y={1} width={4} height={4} fill={i < n ? '#e8c35a' : '#e8d7ad'} />
        </g>
      ))}
    </svg>
  );
}
