'use client';
import { tr } from '@/lib/i18n';

/** Lời viếng có sẵn: bấm một lần là gửi, khỏi phải gõ */
const PRESETS = [
  tr('Một đời tu hành, an nghỉ nhé đạo hữu.', "A lifetime of cultivation. Rest well, fellow Daoist."),
  tr('Kiếp sau gặp lại, ta mời đạo hữu chén rượu.', "We'll meet again next life, and I'll buy you a drink."),
  tr('Đạo hữu đi trước, ta còn đi tiếp con đường này.', "You go on ahead, fellow Daoist. I'll keep walking this road."),
  tr('Mong kiếp sau đạo hữu được sống bình an.', "May your next life be a peaceful one, fellow Daoist."),
  tr('Thiên đạo vô tình, nhân gian còn nhớ.', "The Heavenly Dao is heartless, but the mortal world remembers."),
  tr('Một nén hương tiễn anh hùng.', "A stick of incense to send off a hero."),
  tr('Đường tu dài, nghỉ chân một chút cũng được.', "The road of cultivation is long. It's fine to rest a while."),
  tr('Giang hồ còn đó, chỉ thiếu một người.', "The jianghu is still here, just one person short."),
];

export function condoPick(seed: number | string, n = 3): string[] {
  const k = Math.abs(Number(String(seed).replace(/\D/g, '').slice(-6)) || 7);
  return Array.from({ length: n }, (_, i) => PRESETS[(k + i * 3) % PRESETS.length]);
}

export default function CondoPresets({ seed, onPick }: { seed: number | string; onPick: (body: string) => void }) {
  return (
    <span className="condo-presets" role="group" aria-label={tr("Lời viếng có sẵn", "Preset condolences")}>
      {condoPick(seed).map((t) => (
        <button key={t} type="button" className="condo-chip" onClick={() => onPick(t)}>
          {t}
        </button>
      ))}
    </span>
  );
}
