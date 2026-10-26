'use client';

import { useEffect, useState } from 'react';
import type { Meta } from '@/lib/game/types';
import { CAU_HON_AT, HON_COST, HON_MAX, HON_TEXT, KS_NAME, KS_TIERS, TINH_TAM_MAX, honActive, honFullIn, honNow, honState, ksBase, ksOf, ksParts } from '@/lib/game/luanHoi';

/** Cầu Nại Hà vẽ pixel: Mạnh Bà bên nồi canh */
function NaiHa() {
  return (
    <svg className="naiha" viewBox="0 0 64 28" shapeRendering="crispEdges" aria-hidden="true">
      <rect width="64" height="28" fill="#1c1426" />
      <rect y="20" width="64" height="8" fill="#5a1420" />
      <rect y="22" width="64" height="1" fill="#8a2030" />
      <rect y="25" width="64" height="1" fill="#7a1828" />
      {/* cầu */}
      <rect x="4" y="15" width="56" height="2" fill="#6a5a4a" />
      <rect x="2" y="17" width="4" height="5" fill="#4a3a2e" />
      <rect x="58" y="17" width="4" height="5" fill="#4a3a2e" />
      <rect x="6" y="11" width="1" height="4" fill="#8a7a62" />
      <rect x="18" y="11" width="1" height="4" fill="#8a7a62" />
      <rect x="30" y="11" width="1" height="4" fill="#8a7a62" />
      <rect x="42" y="11" width="1" height="4" fill="#8a7a62" />
      <rect x="54" y="11" width="1" height="4" fill="#8a7a62" />
      <rect x="6" y="11" width="49" height="1" fill="#8a7a62" />
      {/* Mạnh Bà */}
      <rect x="34" y="6" width="4" height="4" fill="#d8c8b0" />
      <rect x="33" y="5" width="6" height="2" fill="#e8e0d0" />
      <rect x="32" y="10" width="8" height="5" fill="#3a2a40" />
      <rect x="31" y="11" width="2" height="3" fill="#3a2a40" />
      {/* nồi canh và chén */}
      <rect x="22" y="10" width="8" height="5" fill="#2a2a2a" />
      <rect x="23" y="9" width="6" height="1" fill="#6ac0a0" />
      <rect x="24" y="6" width="1" height="2" fill="#a0d8c8" opacity="0.7" />
      <rect x="27" y="5" width="1" height="3" fill="#a0d8c8" opacity="0.6" />
      <rect x="40" y="9" width="3" height="2" fill="#c8b890" />
      <rect x="41" y="8" width="1" height="1" fill="#6ac0a0" />
      {/* hoa bỉ ngạn */}
      <rect x="10" y="19" width="1" height="2" fill="#2a6a2a" />
      <rect x="9" y="18" width="3" height="1" fill="#e02030" />
      <rect x="50" y="19" width="1" height="2" fill="#2a6a2a" />
      <rect x="49" y="18" width="3" height="1" fill="#e02030" />
      <rect x="15" y="20" width="1" height="1" fill="#e02030" />
      <rect x="46" y="21" width="1" height="1" fill="#e02030" />
    </svg>
  );
}

/** Bảng Luân Hồi Đạo ở màn đầu thai: Kiếp Số, Hồn lực, chén canh Mạnh Bà */
export default function LuanHoiCard({ meta, drink, onDrink }: { meta: Meta; drink: boolean; onDrink: (d: boolean) => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const base = ksBase(meta);
  const ks = ksOf(meta);
  const active = honActive(meta);
  const hon = honNow(meta, now);
  const after = Math.max(0, Math.min(HON_MAX, hon + (drink ? 30 : 0)) - HON_COST);
  const st = honState(Math.min(HON_MAX, hon + (drink ? 30 : 0)));
  const nd = meta.noDrink ?? 0;
  const parts = ksParts(meta);
  const tiers = KS_TIERS.filter((t) => t.lv <= ks);
  if (base === 0 && !active) return null;
  return (
    <section className="lh-card">
      <div className="lh-ks">
        <span className="lh-seal" aria-hidden="true">
          {ks}
        </span>
        <span>
          <small>Kiếp Số · {KS_NAME[ks]}</small>
          <b>{ks === 0 ? 'Thiên đạo chưa để mắt tới bạn' : `Thiên đạo áp ${ks} tầng kiếp nạn, thưởng phúc +${ks * 5}%, đồ rơi +${ks * 3}%`}</b>
          {(meta.tinhTam ?? 0) > 0 && <small className="lh-tt">Tĩnh tâm {meta.tinhTam}: Kiếp Số gốc {base}, đã giảm {base - ks}</small>}
        </span>
      </div>
      <details className="lh-more">
        <summary>Kiếp nạn đang chịu và cách tăng Kiếp Số</summary>
        {tiers.length ? (
          <ul>
            {tiers.map((t) => (
              <li key={t.lv}>
                <b>{t.lv}.</b> {t.hard}
              </li>
            ))}
          </ul>
        ) : (
          <p className="note">Chưa có kiếp nạn nào.</p>
        )}
        <ul className="lh-parts">
          {parts.map((p) => (
            <li key={p.label} className={p.pts >= p.max ? 'full' : ''}>
              {p.label}: <b>{p.pts}</b>/{p.max}
            </li>
          ))}
        </ul>
        <p className="note">Kiếp Số 5 trở lên mà phi thăng mở kết cục Nghịch Thiên Hành Đạo. Kiếp Số 10 mà Chứng Đạo mở Vạn Kiếp Bất Diệt.</p>
      </details>
      {active && (
        <>
          <div className="lh-hon">
            <small>
              Hồn lực · {HON_TEXT[honState(hon)].name}
              {hon < HON_MAX ? ` · hồi đầy sau ${honFullIn(hon)} giờ` : ''}
            </small>
            <span className="lh-bar" aria-hidden="true">
              <i style={{ width: `${hon}%` }} className={`hb-${honState(hon)}`} />
            </span>
            <small className="note">
              Đầu thai lần này: {HON_TEXT[st].name} ({HON_TEXT[st].fx}). Sau đó còn {Math.round(after)} Hồn lực.
            </small>
          </div>
          <div className="lh-mb">
            <NaiHa />
            <p>
              Cầu Nại Hà. Mạnh Bà múc một chén canh, khói xanh bốc lên: <i>&ldquo;Uống đi, quên hết mà đi cho nhẹ.&rdquo;</i>
            </p>
            <div className="lh-choice" role="radiogroup" aria-label="Chén canh Mạnh Bà">
              <button role="radio" aria-checked={drink} className={drink ? 'on' : ''} onClick={() => onDrink(true)}>
                <b>Uống canh</b>
                <small>
                  Mất thần binh truyền kiếp và rương kiếp trước. Được tĩnh tâm (Kiếp Số -1, tối đa {TINH_TAM_MAX}), +30 Hồn lực, kiếp này khí vận +15, phúc +20%.
                </small>
              </button>
              <button role="radio" aria-checked={!drink} className={!drink ? 'on' : ''} onClick={() => onDrink(false)}>
                <b>Hất chén, không quên</b>
                <small>
                  Giữ mọi thứ. Đã {nd} lần liền không uống
                  {nd + 1 >= CAU_HON_AT ? '. Lần này Câu hồn sứ giả sẽ tìm tới!' : `, tới lần thứ ${CAU_HON_AT} Câu hồn sứ giả sẽ tìm tới.`}
                </small>
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
