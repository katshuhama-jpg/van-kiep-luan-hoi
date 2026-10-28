'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { Meta } from '@/lib/game/types';
import { HON_PILLS, HON_PILL_FREE, QUEST_HON, pastDanTu, honPillCost, honPillUsed, type HonPillId, CAU_HON_AT, HON_COST, HON_MAX, HON_REGEN, LH_FROM_LIFE, HON_TEXT, KS_NAME, KS_TIERS, TINH_TAM_MAX, honActive, honFullIn, honNow, honState, ksBase, ksOf, ksParts, type HonState } from '@/lib/game/luanHoi';
import { tr } from '@/lib/i18n';

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

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/** Tóm tắt một dòng cho thanh chuẩn bị */
export function luanHoiSummary(meta: Meta, drink: boolean, now: number) {
  const ks = ksOf(meta);
  const hon = honNow(meta, now);
  const st = honState(Math.min(HON_MAX, hon + (drink ? 30 : 0)));
  return { ks, ksName: KS_NAME[ks], hon: Math.round(hon), honName: HON_TEXT[honState(hon)].name, st, stName: HON_TEXT[st].name };
}

/** Kiếp Số và Hồn lực: giải thích bằng lời thường */
export function KiepSoBlock({ meta, onHoanHon }: { meta: Meta; onHoanHon?: (id: HonPillId) => void }) {
  const now = useNow();
  const base = ksBase(meta);
  const ks = ksOf(meta);
  const active = honActive(meta);
  const hon = honNow(meta, now);
  const parts = ksParts(meta);
  const tiers = KS_TIERS.filter((t) => t.lv <= ks);
  return (
    <div className="lh-card">
      <div className="lh-ks">
        <span className="lh-seal" aria-hidden="true">
          {ks}
        </span>
        <span>
          <small>{tr("Kiếp Số ", "Calamity Count ")}{ks} · {KS_NAME[ks]}</small>
          <b>{ks === 0 ? tr('Chưa bị làm khó, chưa có thưởng thêm', "No extra difficulty, no extra rewards yet") : tr(`Khó hơn ${ks} bậc, bù lại phúc +${ks * 5}%, đồ rơi +${ks * 3}%`, `${ks} levels harder, but Fortune +${ks * 5}%, drops +${ks * 3}%`)}</b>
          <em className="lh-why">{tr("Bạn tu càng giỏi qua nhiều kiếp, Thiên đạo càng làm khó nhưng thưởng càng nhiều.", "The better you cultivate across lives, the harder the Heavenly Yao makes it - and the bigger the rewards.")}</em>
          {(meta.tinhTam ?? 0) > 0 && <small className="lh-tt">{tr("Đã uống canh giảm ", "Soup lowered it by ")}{base - ks}{tr(" bậc (gốc là ", " levels (base ")}{base})</small>}
        </span>
      </div>
      <details className="lh-more">
        <summary>{tr("Xem đang bị làm khó những gì", "See what's making it harder")}</summary>
        {tiers.length ? (
          <ul>
            {tiers.map((t) => (
              <li key={t.lv}>
                <b>{t.lv}.</b> {t.hard}
              </li>
            ))}
          </ul>
        ) : (
          <p className="note">{tr("Chưa có kiếp nạn nào.", "No calamities yet.")}</p>
        )}
        <p className="note">{tr("Kiếp Số tăng từ những việc sau:", "Calamity Count rises from the following:")}</p>
        <ul className="lh-parts">
          {parts.map((p) => (
            <li key={p.label} className={p.pts >= p.max ? 'full' : ''}>
              {p.label}: <b>{p.pts}</b>/{p.max}
            </li>
          ))}
        </ul>
        <p className="note">{tr("Kiếp Số 5 trở lên mà phi thăng mở kết cục Nghịch Thiên Hành Đạo. Kiếp Số 10 mà Chứng Đạo mở Vạn Kiếp Bất Diệt.", "Ascend with Calamity Count 5+ to unlock the Defy Heaven ending. Attain the Yao at Calamity Count 10 to unlock Ten Thousand Lives Undying.")}</p>
      </details>
      {active && (
        <div className="lh-hon">
          <small className="lh-h">
            
            {tr("Hồn lực ", "Soul Power ")}{Math.round(hon)}/{HON_MAX} · {HON_TEXT[honState(hon)].name}
          </small>
          <span className="lh-bar" aria-hidden="true">
            <i style={{ width: `${hon}%` }} className={`hb-${honState(hon)}`} />
          </span>
          <small className="note">
            
            {tr("Mỗi lần đầu thai tốn ", "Each rebirth costs ")}{HON_COST}{tr(", tự hồi ", ", regenerates ")}{HON_REGEN}{tr(" mỗi giờ", " per hour")}{hon < HON_MAX ? tr(` (đầy sau ${honFullIn(hon)} giờ)`, ` (full in ${honFullIn(hon)} h)`) : ''}{tr(". Đầu thai liên tục làm hồn mòn, kiếp sau sinh ra yếu hơn. Mỗi nhiệm vụ ngày xong hồi thêm ", ". Rebirthing back to back wears down your soul, and your next life is born weaker. Each daily quest completed restores another ")}{QUEST_HON}.
          </small>
          {onHoanHon && hon < HON_MAX && <HonPills meta={meta} now={now} onPick={onHoanHon} />}
        </div>
      )}
    </div>
  );
}

/** Ba phẩm đan hồi hồn, mua bằng phúc duyên */
function HonPills({ meta, now, onPick, compact }: { meta: Meta; now: number; onPick: (id: HonPillId) => void; compact?: boolean }) {
  const used = honPillUsed(meta, now);
  const hon = honNow(meta, now);
  const dan = pastDanTu(meta);
  return (
    <div className={`hon-pills ${compact ? 'compact' : ''}`}>
      <small className="hp-head">
        {dan ? tr('Kiếp trước là Đan tu, đan rẻ hơn 30% · ', "Past life was an Alchemist, pills 30% cheaper · ") : ''}
        {used < HON_PILL_FREE
          ? tr(`Đan hồi hồn · hôm nay còn ${HON_PILL_FREE - used} viên giá gốc, sau đó mỗi viên đắt thêm 50% · có ${meta.phucDuyen} phúc`, `Soul pills · ${HON_PILL_FREE - used} left at base price today, then each costs 50% more · ${meta.phucDuyen} Fortune`)
          : tr(`Đan hồi hồn · đã dùng ${used} viên hôm nay, giá đang tăng · có ${meta.phucDuyen} phúc`, `Soul pills · ${used} used today, price rising · ${meta.phucDuyen} Fortune`)}
      </small>
      <div className="hp-row">
        {HON_PILLS.map((p) => {
          const real = Math.min(p.gain, Math.round(HON_MAX - hon));
          const cost = honPillCost(p.cost, used, dan);
          return (
            <button key={p.id} className={`btn hp ${cost > p.cost ? 'up' : ''}`} disabled={meta.phucDuyen < cost || real <= 0} onClick={() => onPick(p.id)} title={tr(`${p.name} (${p.grade}): hồi ${p.gain} Hồn lực`, `${p.name} (${p.grade}): restores ${p.gain} Soul Power`)}>
              <img src={`/icons/${p.icon}.png`} width={24} height={24} alt="" className="px-icon" />
              <b>{p.name}</b>
              <small>
                +{p.gain === 100 ? tr('đầy', "full") : p.gain}{tr(" hồn · ", " soul · ")}{cost}{tr(" phúc", " Fortune")}
              </small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Bước 2: Cầu Nại Hà. Chọn uống hay hất chén canh Mạnh Bà, chọn xong là đầu thai luôn */
export function ManhBaBridge({ meta, who, onPick, onBack, busy, onHoanHon }: { meta: Meta; who: ReactNode; onPick: (drink: boolean) => void; onBack: () => void; busy?: boolean; onHoanHon?: (id: HonPillId) => void }) {
  const now = useNow();
  const base = ksBase(meta);
  const nd = meta.noDrink ?? 0;
  const hon = honNow(meta, now);
  const stD = honState(Math.min(HON_MAX, hon + 30));
  const stN = honState(hon);
  const honLine = (st: HonState) => (
    <span className="mb-hon">
      
      {tr("Hồn khi sinh: ", "Soul at birth: ")}<b className={`hs-${st}`}>{HON_TEXT[st].name}</b>
      {st !== 'ven' ? ` (${HON_TEXT[st].fx})` : ''}
    </span>
  );
  const danger = nd + 1 >= CAU_HON_AT;
  return (
    <div className="mb-bridge" role="dialog" aria-modal="true" aria-label={tr("Cầu Nại Hà", "Naihe Bridge")}>
      <div className="mb-inner">
        <div className="mb-top">
          <button className="mb-back" onClick={onBack} disabled={busy}>
            
            {tr("‹ Lá số", "‹ Fate chart")}
          </button>
          <span className="mb-steps">
            <i>{tr("1 Lá số", "1 Fate chart")}</i> <i className="on">{tr("2 Cầu Nại Hà", "2 Naihe Bridge")}</i>
          </span>
        </div>
        <div className="mb-scene">
          <NaiHa />
          <div className="mb-who">{who}</div>
        </div>
        <h2 className="mb-title">{tr("Cầu Nại Hà", "Naihe Bridge")}</h2>
        <p className="mb-say">
          
          {tr("Mạnh Bà múc một chén canh, khói xanh bốc lên: ", "Meng Po ladles out a bowl of soup, green vapor rising: ")}<i>{tr("&ldquo;Uống đi, quên hết mà đi cho nhẹ.&rdquo;", "&ldquo;Drink, forget it all, and go on lighter.&rdquo;")}</i>
        </p>
        {onHoanHon && honActive(meta) && hon < HON_MAX - 10 && (
          <div className="mb-hoan">
            <small>
              
              {tr("Hồn lực ", "Soul Power ")}{Math.round(hon)}/{HON_MAX} · {HON_TEXT[stN].name}
            </small>
            <HonPills meta={meta} now={now} onPick={onHoanHon} compact />
          </div>
        )}
        <div className="mb-opts">
          <button className="mb-opt drink" onClick={() => onPick(true)} disabled={busy}>
            <b>{tr("Uống canh", "Drink the soup")}</b>
            <span className="lh-gain">{tr("Được: khí vận +15, phúc +20%, hồi 30 Hồn lực", "Gain: Luck +15, Fortune +20%, restore 30 Soul Power")}{(meta.tinhTam ?? 0) < TINH_TAM_MAX && base > 0 ? tr(', Kiếp Số giảm 1', ", Calamity Count -1") : ''}</span>
            <span className="lh-loss">{tr("Mất: thần binh truyền kiếp và rương kiếp trước", "Lose: inherited divine weapon and past-life chest")}</span>
            {honLine(stD)}
            <span className="mb-go">{tr("Uống rồi đầu thai ▶", "Drink and be reborn ▶")}</span>
          </button>
          <button className={`mb-opt spill ${danger ? 'danger' : ''}`} onClick={() => onPick(false)} disabled={busy}>
            <b>{tr("Hất chén, không quên", "Toss the bowl, don't forget")}</b>
            <span className="lh-gain">{tr("Được: giữ thần binh và rương kiếp trước", "Gain: keep divine weapon and past-life chest")}</span>
            <span className="lh-loss">{danger ? tr('Mất: lần này Câu hồn sứ giả sẽ tới bắt hồn bạn!', "Lose: this time the Soul-Hooking Envoy will come for your soul!") : tr(`Mất: không được thưởng. Hất ${CAU_HON_AT} lần liền thì Câu hồn sứ giả tới bắt (đang ${nd}/${CAU_HON_AT})`, `Lose: no rewards. Toss it ${CAU_HON_AT} times in a row and the Soul-Hooking Envoy comes for you (now ${nd}/${CAU_HON_AT})`)}</span>
            {honLine(stN)}
            <span className="mb-go">{tr("Hất chén rồi đầu thai ▶", "Toss and be reborn ▶")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export { useNow, LH_FROM_LIFE as LH_FROM };
