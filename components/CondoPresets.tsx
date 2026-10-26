'use client';

/** Lời viếng có sẵn: bấm một lần là gửi, khỏi phải gõ */
const PRESETS = [
  'Một đời tu hành, an nghỉ nhé đạo hữu.',
  'Kiếp sau gặp lại, ta mời đạo hữu chén rượu.',
  'Đạo hữu đi trước, ta còn đi tiếp con đường này.',
  'Mong kiếp sau đạo hữu được sống bình an.',
  'Thiên đạo vô tình, nhân gian còn nhớ.',
  'Một nén hương tiễn anh hùng.',
  'Đường tu dài, nghỉ chân một chút cũng được.',
  'Giang hồ còn đó, chỉ thiếu một người.',
];

export function condoPick(seed: number | string, n = 3): string[] {
  const k = Math.abs(Number(String(seed).replace(/\D/g, '').slice(-6)) || 7);
  return Array.from({ length: n }, (_, i) => PRESETS[(k + i * 3) % PRESETS.length]);
}

export default function CondoPresets({ seed, onPick }: { seed: number | string; onPick: (body: string) => void }) {
  return (
    <span className="condo-presets" role="group" aria-label="Lời viếng có sẵn">
      {condoPick(seed).map((t) => (
        <button key={t} type="button" className="condo-chip" onClick={() => onPick(t)}>
          {t}
        </button>
      ))}
    </span>
  );
}
