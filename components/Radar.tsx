'use client';

export interface RadarAxis {
  label: string;
  value: number; // 0-100
  base?: number; // giá trị gốc để so sánh (0-100)
}

/** Biểu đồ mạng nhện chỉ số, phong cách pixel */
export default function Radar({ axes, size = 220, color = '#b8432f' }: { axes: RadarAxis[]; size?: number; color?: string }) {
  const n = axes.length;
  const cx = 60;
  const cy = 58;
  const R = 38;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const r = (Math.max(0, Math.min(140, v)) / 100) * R;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).map((x) => x.toFixed(1)).join(',')).join(' ');
  const hasBase = axes.some((a) => a.base !== undefined);
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className="radar" role="img" aria-label={'Biểu đồ chỉ số: ' + axes.map((a) => `${a.label} ${Math.round(a.value)}`).join(', ')}>
      {[25, 50, 75, 100].map((lv) => (
        <polygon key={lv} points={poly(axes.map(() => lv))} fill={lv === 100 ? '#fbf3dc' : 'none'} stroke="#c9b48a" strokeWidth={lv === 100 ? 1.2 : 0.6} strokeDasharray={lv === 100 ? undefined : '2 1.5'} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#c9b48a" strokeWidth={0.6} />;
      })}
      {hasBase && <polygon points={poly(axes.map((a) => a.base ?? a.value))} fill="#8a7a66" fillOpacity={0.18} stroke="#8a7a66" strokeWidth={0.8} strokeDasharray="2 1.5" />}
      <polygon className="radar-shape" points={poly(axes.map((a) => a.value))} fill={color} fillOpacity={0.32} stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
      {axes.map((a, i) => {
        const [x, y] = pt(i, a.value);
        return <rect key={'d' + i} x={x - 1.6} y={y - 1.6} width={3.2} height={3.2} fill={color} />;
      })}
      {axes.map((a, i) => {
        const [x, y] = pt(i, 140);
        const d = a.base !== undefined ? Math.round(a.value - a.base) : 0;
        return (
          <text key={'t' + i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="#3b2a1a" fontFamily="VT323, monospace">
            {a.label} {Math.round(a.value)}
            {d !== 0 && (
              <tspan fill={d > 0 ? '#2f6b5a' : '#a8303a'}>
                {' '}
                {d > 0 ? '+' : ''}
                {d}
              </tspan>
            )}
          </text>
        );
      })}
    </svg>
  );
}

/** Điểm giàu sang 0-100 theo thang log: 0 linh thạch = 0, khoảng 20.000 = 100 */
export function wealthScore(money: number, income = 0): number {
  const w = Math.max(0, money + income * 10);
  return Math.max(0, Math.min(100, (Math.log10(w + 1) / Math.log10(20000)) * 100));
}

type S = { sucKhoe: number; tamCanh: number; ngoTinh: number; khiVan: number; tamMa: number };

/** Trục chỉ số chuẩn cho một nhân vật */
export function charAxes(s: S, life: number, wealth: number, base?: { s: S; life: number; wealth: number }): RadarAxis[] {
  // thọ: số năm sống được so với mức tối đa 150
  const lifeV = (l: number) => Math.max(0, Math.min(100, (l / 150) * 100));
  return [
    { label: 'Khỏe', value: s.sucKhoe, base: base?.s.sucKhoe },
    { label: 'Tâm', value: s.tamCanh, base: base?.s.tamCanh },
    { label: 'Ngộ', value: s.ngoTinh, base: base?.s.ngoTinh },
    { label: 'May mắn', value: s.khiVan, base: base?.s.khiVan },
    { label: 'Giàu sang', value: wealth, base: base?.wealth },
    { label: 'Định', value: 100 - s.tamMa, base: base ? 100 - base.s.tamMa : undefined },
    { label: 'Thọ', value: lifeV(life), base: base ? lifeV(base.life) : undefined },
  ];
}
