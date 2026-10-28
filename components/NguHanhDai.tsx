'use client';

import { useState, type CSSProperties } from 'react';
import Sprite from './Sprite';
import { ELEMENTS, ELEMENT_IDS, elementOf } from '@/lib/game/nguhanh';
import {
  AN_CHANCE,
  AN_MAX,
  ASCEND_MIN_AGE,
  BEATS,
  GUONG_LOSSES,
  NHD_DELAY,
  NHD_ROUNDS,
  PHU_PRICE,
  ROUND_NAME,
  STANCES,
  anOf,
  arenaBg,
  destOf,
  deathChance,
  elemPart,
  khacBy,
  mirrorChar,
  mirrorMind,
  nhdOf,
  nhdOrder,
  type Stance,
} from '@/lib/game/nguHanhDai';
import { sectSide } from '@/lib/game/sect';
import type { Character, Element } from '@/lib/game/types';
import { needFor } from '@/lib/game/helpers';
import { tr } from '@/lib/i18n';

export type NhdView = 'rules' | 'prep' | 'result';

const DEST_NAME = { tien: tr('Tiên giới', "Immortal Realm"), ma: tr('Ma giới', "Demon Realm"), hu: tr('Thái Hư', "Taixu") } as const;
const pct = (x: number) => `${x >= 1 ? '+' : ''}${Math.round((x - 1) * 100)}%`;
const REL_TXT = { khac: tr('Bạn khắc bóng', "You overcome the shadow"), bi_khac: tr('Bóng khắc bạn', "The shadow overcomes you"), sinh: tr('Bạn sinh bóng', "You feed the shadow"), duoc_sinh: tr('Bóng sinh bạn', "The shadow feeds you"), dong: tr('Cùng mệnh', "Same element") } as const;

function Chip({ e, small }: { e: Element; small?: boolean }) {
  return (
    <span className={`nhd-chip ${small ? 'sm' : ''}`} style={{ background: ELEMENTS[e].color }}>
      {ELEMENTS[e].name}
    </span>
  );
}

/** Vòng ngũ hành: vòng ngoài là tương sinh, ngôi sao bên trong là tương khắc */
function Wheel({ me }: { me: Element }) {
  // thứ tự theo vòng sinh: Mộc -> Hỏa -> Thổ -> Kim -> Thủy
  const ring: Element[] = ['moc', 'hoa', 'tho', 'kim', 'thuy'];
  const P = ring.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return [80 + 58 * Math.cos(a), 80 + 58 * Math.sin(a)] as const;
  });
  const arrow = (i: number, j: number, color: string, dash?: string) => {
    const [x1, y1] = P[i];
    const [x2, y2] = P[j];
    const k = 17 / Math.hypot(x2 - x1, y2 - y1);
    return (
      <line
        key={`${i}-${j}-${color}`}
        x1={x1 + (x2 - x1) * k}
        y1={y1 + (y2 - y1) * k}
        x2={x2 - (x2 - x1) * k}
        y2={y2 - (y2 - y1) * k}
        stroke={color}
        strokeWidth={2}
        strokeDasharray={dash}
        markerEnd={`url(#nhd-${color === '#ff7a5a' ? 'k' : 's'})`}
      />
    );
  };
  return (
    <svg className="nhd-wheel" viewBox="0 0 160 160" role="img" aria-label={tr("Vòng ngũ hành: vòng ngoài tương sinh, ngôi sao trong tương khắc", "Five Elements wheel: outer ring generates, inner star overcomes")}>
      <defs>
        <marker id="nhd-s" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill="#8af09a" />
        </marker>
        <marker id="nhd-k" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill="#ff7a5a" />
        </marker>
      </defs>
      {ring.map((_, i) => arrow(i, (i + 1) % 5, '#8af09a'))}
      {ring.map((_, i) => arrow(i, (i + 2) % 5, '#ff7a5a', '3 2'))}
      {ring.map((e, i) => (
        <g key={e}>
          <rect x={P[i][0] - 16} y={P[i][1] - 10} width={32} height={20} fill={ELEMENTS[e].color} stroke={e === me ? '#fff3dc' : '#1f160d'} strokeWidth={e === me ? 3 : 2} />
          <text x={P[i][0]} y={P[i][1] + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1f160d">
            {ELEMENTS[e].name}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** số năm còn phải chờ khi đã đủ cấp phi thăng mà chưa đủ tuổi (0 nếu không chờ) */
export function waiting(c: Character): number {
  const ready = !c.cosmos && c.realm === 7 && c.layer >= 3 && c.cultivation >= needFor(c);
  return ready ? Math.max(0, Math.ceil(ASCEND_MIN_AGE - c.age)) : 0;
}

/** Huy hiệu gương ở góc sân khấu: mờ từ Hóa Thần, sáng khi đủ cấp mà chưa đủ tuổi */
export function NhdMirror({ c, onOpen }: { c: Character; onOpen: () => void }) {
  if (c.cosmos || c.realm < 5 || c.nhd?.done || c.dead) return null;
  const k = khacBy(nhdOrder(elementOf(c))[4]);
  const w = waiting(c);
  const label = w ? tr(`Đủ cấp phi thăng, còn ${w} năm tới ${ASCEND_MIN_AGE} tuổi. Chạm xem nên chuẩn bị gì`, `Ready to ascend - ${w} years until age ${ASCEND_MIN_AGE}. Tap to see how to prepare`) : tr(`Ngũ Hành Đài: ấn ${ELEMENTS[k].name} ${anOf(c, k)}/${AN_MAX}, phù ${c.phu ?? 0}/3`, `Five Elements Platform: ${ELEMENTS[k].name} seals ${anOf(c, k)}/${AN_MAX}, talismans ${c.phu ?? 0}/3`);
  return (
    <button className={`nhd-badge ${w ? 'wait' : ''}`} onClick={onOpen} aria-label={label} title={label} style={{ ['--el' as string]: ELEMENTS[k].color } as CSSProperties}>
      <i aria-hidden="true" />
      <small>{w ? `${w}n` : `${anOf(c, k)}/${AN_MAX}`}</small>
    </button>
  );
}

export default function NguHanhDai({
  c,
  view,
  tell,
  msg,
  end,
  onFight,
  onBuyPhu,
  onLeave,
  onNext,
  onRules,
  preview,
}: {
  preview?: boolean; // chỉ xem luật từ dải thông báo, chưa lên đài
  c: Character;
  view: NhdView;
  tell: Stance;
  msg?: string;
  end?: 'next' | 'done' | 'lose' | 'dead';
  onFight: (my: Stance, phu: boolean) => void;
  onBuyPhu: () => void;
  onLeave: () => void;
  onNext: () => void;
  onRules: () => void;
}) {
  const [phu, setPhu] = useState(false);
  const [pick, setPick] = useState<Stance | null>(null);
  const me = elementOf(c);
  const order = nhdOrder(me);
  const st = nhdOf(c);
  const round = Math.min(st.won, NHD_ROUNDS - 1);
  const mind = mirrorMind(c);
  const price = sectSide(c) === 'trung' ? PHU_PRICE / 2 : PHU_PRICE;
  const lastKey = khacBy(order[4]);

  if (view === 'result')
    return (
      <div className={`nhd nhd-result ${end}`} role="dialog" aria-modal="true" aria-labelledby="nhd-title">
        <div className="nhd-res-box">
          <div className={`nhd-res-mirror ${end === 'next' || end === 'done' ? 'shatter' : 'dark'}`} aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <h2 id="nhd-title">{end === 'done' ? tr('Ngũ hành viên mãn', "Five Elements perfected") : end === 'next' ? tr(`Gương vỡ · ${st.won}/${NHD_ROUNDS}`, `Mirror shattered · ${st.won}/${NHD_ROUNDS}`) : end === 'dead' ? tr('Thân tử đạo tiêu', "Body and Dao destroyed") : tr('Bị hất khỏi đài', "Thrown off the platform")}</h2>
          <p>{msg}</p>
          <button className="btn btn-red btn-big" onClick={onNext}>
            {end === 'done' ? tr('Đón thiên kiếp', "Face the tribulation") : end === 'next' ? tr('Tới gương tiếp theo', "On to the next mirror") : tr('Tiếp tục', "Continue")}
          </button>
        </div>
      </div>
    );

  if (view === 'rules')
    return (
      <div className="nhd nhd-rules-wrap" role="dialog" aria-modal="true" aria-labelledby="nhd-title">
        <div className="nhd-scroll">
          <i className="rod top" aria-hidden="true" />
          <div className="nhd-scroll-body">
            <p className="nhd-kick">{tr("Trước cửa trời", "Before the gate of heaven")}</p>
            <h2 id="nhd-title">{tr("Luật Ngũ Hành Đài", "Five Elements Platform rules")}</h2>
            {preview && waiting(c) > 0 && (
              <div className="nhd-wait">
                <b>{tr("Bạn đã đủ cấp phi thăng, còn ", "You are ready to ascend, but there are still ")}{waiting(c)}{tr(" năm nữa mới tới ", " years until you are ")}{ASCEND_MIN_AGE}{tr(" tuổi.", " years old.")}</b>
                <p>{tr("Tu vi đã đầy, không tăng thêm. Quãng chờ này dành để chuẩn bị cho Ngũ Hành Đài:", "Your cultivation is full and won't grow further. Use this wait to prepare for the Five Elements Platform:")}</p>
                <ul className="nhd-list">
                  <li>
                    
                    {tr("Săn quái hệ ", "Hunt ")}<Chip e={lastKey} small />{tr(" (Vừa sức trở lên) để đủ ", " monsters (Even match or harder) to collect ")}{AN_MAX}{tr(" ấn: gương cuối hết khắc được bạn. Đang có ", " seals: then the last mirror can no longer overcome you. You have ")}{anOf(c, lastKey)}/{AN_MAX}.
                  </li>
                  <li>{tr("Kiếm tiền mua Ngũ Hành Phù (", "Earn money to buy Five Elements Talismans (")}{sectSide(c) === 'trung' ? PHU_PRICE / 2 : PHU_PRICE}{tr(" linh thạch một tấm, tối đa 3). Dùng phù ở gương cuối là cách lật thế mạnh nhất.", " spirit stones each, max 3). A talisman at the last mirror is the strongest way to turn the tide.")}</li>
                  <li>{tr("Hạ tâm ma (Thanh Tâm Đan, bế quan) để bóng yếu đi, giữ đạo tâm thật vững.", "Lower your heart demon (Clear Heart Pill, Seclusion) to weaken the shadows, and keep your Dao Heart steady.")}</li>
                  <li>{tr("Để ý thọ nguyên: thọ sắp hết thì uống Diên Thọ Đan.", "Watch your lifespan: if it's running out, take a Longevity Pill.")}</li>
                </ul>
              </div>
            )}
            <p>{tr("Muốn phi thăng phải hạ đủ ", "To ascend you must defeat ")}{NHD_ROUNDS}{tr(" bóng của chính mình. Bóng giống hệt bạn (cấp, chỉ số, trang bị), chỉ khác bản mệnh, và mỗi vòng một mạnh hơn. Bóng cuối mạnh hơn chính bạn.", " shadows of yourself. Each shadow is your exact copy (level, stats, gear), differing only in natal element, and each round's is stronger. The last one is stronger than you.")}</p>
            <Wheel me={me} />
            <p className="nhd-legend">
              <span className="s">{tr("→ sinh", "→ generates")}</span> <span className="k">{tr("⇢ khắc", "⇢ overcomes")}</span>{tr(" · Bị khắc: đòn bạn -30%, đòn bóng +50%", " · Overcome: your hits -30%, shadow's hits +50%")}
            </p>
            <h3>{tr("Năm tấm gương (bạn mệnh ", "Five mirrors (your element: ")}{ELEMENTS[me].name})</h3>
            <ol className="nhd-order">
              {order.map((e, i) => (
                <li key={i} className={i < st.won ? 'done' : i === 4 ? 'boss' : ''}>
                  <Chip e={e} small /> {ROUND_NAME[i]}
                  {i < st.won ? tr(' · đã vỡ', " · shattered") : i === 4 ? tr(' · khó nhất', " · hardest") : ''}
                </li>
              ))}
            </ol>
            <h3>{tr("Bốn cách lật thế", "Four ways to turn the tide")}</h3>
            <ul className="nhd-list">
              <li>
                <b>{tr("Ngũ Hành Ấn.", "Five Elements Seal.")}</b>{tr(" Diệt quái có hệ (không quá yếu) có ", " Slaying an elemental monster (not too weak) gives a ")}{Math.round(AN_CHANCE * 100)}{tr("% nhận 1 ấn hệ đó, tối đa ", "% chance of 1 seal of that element, up to ")}{AN_MAX}{tr(" ấn mỗi hệ. Khi bị khắc, mỗi ấn của hệ khắc được bóng gỡ 20% phần thiệt. Bóng cuối cần ấn ", " seals per element. When overcome, each seal of the element that overcomes the shadow cancels 20% of the penalty. The last shadow needs seals of ")}<Chip e={lastKey} small />{tr(": bạn có ", ": you have ")}{anOf(c, lastKey)}/{AN_MAX}.
              </li>
              <li>
                <b>{tr("Thế trận.", "Stance.")}</b>{tr(" Trước mỗi vòng rút một lá bùa: Công (đòn +25%), Thủ (nhận -35%), Hóa (xóa khắc chế, đòn -10%). Thủ chặn Công, Hóa phá Thủ, Công thắng Hóa: rút đúng lá khắc thế của bóng thì thêm 15% lợi thế. Bóng lộ dáng trước khi ra tay, nhưng 3 lần trong 10 là đòn nhử.", " Before each round, draw a charm: Attack (hits +25%), Guard (damage taken -35%), Merge (cancels element counters, hits -10%). Guard blocks Attack, Merge breaks Guard, Attack beats Merge: draw the charm that counters the shadow's stance for an extra 15% edge. The shadow shows its stance before striking, but 3 times in 10 it's a feint.")}
              </li>
              <li>
                <b>{tr("Ngũ Hành Phù.", "Five Elements Talisman.")}</b>{tr(" Đổi bản mệnh của bạn sang hệ khắc bóng trong một vòng. Rơi từ quái có hệ Lv16 trở lên, hoặc mua của sứ giả Thiên Cơ Các ngay trên đài. Mang tối đa 3 tấm, bạn có ", " Switches your natal element to the one that overcomes the shadow for one round. Dropped by elemental monsters Lv16 and up, or sold by the Tianji Pavilion envoy right on the platform. Carry up to 3; you have ")}{c.phu ?? 0}.
              </li>
              <li>
                <b>{tr("Tâm cảnh.", "State of mind.")}</b>{tr(" Tâm ma cao thì bóng mạnh thêm, tối đa 20%. Đạo tâm vững (rất chính hoặc rất tà) thì bóng yếu đi 5-10%. Hiện tại: ", " A high heart demon makes the shadows up to 20% stronger. A steady Dao Heart (very Righteous or very Evil) weakens them by 5-10%. Currently: ")}{mind.text}.
              </li>
            </ul>
            <h3>{tr("Thắng và thua", "Winning and losing")}</h3>
            <ul className="nhd-list">
              <li>{tr("Chỉ được lên đài khi đủ Độ Kiếp hậu kỳ và từ ", "You may only step onto the platform at Tribulation Late and age ")}{ASCEND_MIN_AGE}{tr(" tuổi trở lên.", " or older.")}</li>
              <li>{tr("Vỡ đủ ", "Shatter all ")}{NHD_ROUNDS}{tr(" gương: được độ kiếp phi thăng, tỉ lệ vượt kiếp +10%.", " mirrors: you may face the tribulation and ascend, with +10% chance to survive it.")}</li>
              <li>
                
                {tr("Thua một vòng: ", "Lose a round: ")}{Math.round(deathChance(0) * 100)}{tr("% thân tử đạo tiêu (gương cuối ", "% chance your body and Dao are destroyed (last mirror ")}{Math.round(deathChance(4) * 100)}{tr("%). Sống sót thì mất 15% tu vi, tâm ma +6, ", "%). If you survive, you lose 15% cultivation, heart demon +6, and must wait ")}{NHD_DELAY}{tr(" năm sau mới được lên đài lại. Gương đã vỡ không lành lại.", " years before returning. Shattered mirrors stay shattered.")}
              </li>
              <li>{tr("Thua gương cuối quá ", "Lose to the last mirror more than ")}{GUONG_LOSSES - 1}{tr(" lần thì... không ai biết điều gì xảy ra.", " times and... no one knows what happens.")}</li>
            </ul>
          </div>
          <i className="rod bot" aria-hidden="true" />
          <div className="nhd-scroll-acts">
            {preview ? (
              <button className="btn btn-red btn-big" onClick={onLeave}>
                
                {tr("Đã hiểu", "Got it")}
              </button>
            ) : (
              <>
                <button className="btn btn-red btn-big" onClick={onRules}>
                  
                  {tr("Đã hiểu, lên đài", "Got it, step up")}
                </button>
                <button className="btn btn-dark" onClick={onLeave}>
                  
                  {tr("Chưa sẵn sàng", "Not ready")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );

  const foeEl = order[round];
  const ep = elemPart(c, round, phu);
  const fc = mirrorChar(c, round);
  return (
    <div
      className="nhd nhd-stage"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nhd-title"
      style={{ backgroundImage: `linear-gradient(rgba(10, 7, 16, 0.55), rgba(10, 7, 16, 0.9) 45%), url(${arenaBg(c, round)})` }}
    >
      <header className="nhd-head">
        <span>{tr("Ngũ Hành Đài · cửa ", "Five Elements Platform · gate to ")}{DEST_NAME[destOf(c)]}</span>
        <b id="nhd-title">
          
          {tr("Gương ", "Mirror ")}{round + 1}/{NHD_ROUNDS} · {ROUND_NAME[round]}
        </b>
      </header>
      <div className="nhd-mirrors">
        {order.map((e, i) => (
          <div key={i} className={`nhd-mirror ${i < st.won ? 'broken' : i === round ? 'cur' : 'wait'}`} style={{ ['--el' as string]: ELEMENTS[e].color } as CSSProperties}>
            <div className="glass">{i === round ? <Sprite c={fc} size={96} /> : i < st.won ? <span className="crack" /> : <span className="q">?</span>}</div>
            <small>{ELEMENTS[e].name}</small>
          </div>
        ))}
      </div>
      <p className="nhd-whisper">
        <span>{tr("Bóng ", "The ")}{ELEMENTS[foeEl].name}{tr(" lộ dáng:", " shadow reveals itself:")}</span> {STANCES[tell].tell}
      </p>
      <div className={`nhd-clash ${ep.rel}`}>
        <Chip e={ep.myEl} />
        <span className="arr">{ep.rel === 'khac' ? '▶' : ep.rel === 'bi_khac' ? '◀' : '⇄'}</span>
        <Chip e={foeEl} />
        <span className="mul">
          {REL_TXT[ep.rel]}{tr(" · đòn bạn ", " · your hits ")}<b>{pct(ep.pMul)}</b>{tr(" · đòn bóng ", " · shadow's hits ")}<b>{pct(ep.fMul)}</b>
        </span>
        {ep.notes.length > 0 && <small>{ep.notes.join('. ')}.</small>}
      </div>
      <section className="nhd-table" aria-label={tr("Bàn chuẩn bị", "Preparation table")}>
        <p className="nhd-sec">{tr("Rút một lá bùa thế trận", "Draw a stance charm")}</p>
        <div className="nhd-buas">
          {(Object.keys(STANCES) as Stance[]).map((s) => (
            <button key={s} className={`nhd-bua ${s} ${pick === s ? 'on' : ''}`} aria-pressed={pick === s} onClick={() => setPick(s)}>
              <b>{STANCES[s].name}</b>
              <small>{STANCES[s].desc}</small>
              <em>{tr("khắc ", "beats ")}{STANCES[BEATS[s]].name}</em>
            </button>
          ))}
        </div>
        <div className="nhd-row">
          <button
            className={`nhd-phu ${phu ? 'on' : ''}`}
            disabled={!(c.phu ?? 0)}
            aria-pressed={phu}
            onClick={() => setPhu(!phu)}
            title={tr("Ngũ Hành Phù: đổi bản mệnh sang hệ khắc bóng trong vòng này", "Five Elements Talisman: switch your natal element to one that overcomes the shadow this round")}
          >
            <b>{tr("Phù", "Talisman")}</b>
            <small>{c.phu ?? 0}/3</small>
          </button>
          <div className="nhd-phu-txt">
            {phu ? tr(`Dùng phù: bạn mang mệnh ${ELEMENTS[khacBy(foeEl)].name} vòng này.`, `Talisman used: you carry the ${ELEMENTS[khacBy(foeEl)].name} element this round.`) : (c.phu ?? 0) ? tr('Chạm lá phù để dùng trong vòng này.', "Tap the talisman to use it this round.") : tr('Chưa có Ngũ Hành Phù.', "No Five Elements Talisman yet.")}
            <button className="nhd-buy" disabled={c.linhThach < price || (c.phu ?? 0) >= 3} onClick={onBuyPhu}>
              
              {tr("Mua của sứ giả Thiên Cơ · ", "Buy from the Tianji envoy · ")}{price}
              {sectSide(c) === 'trung' ? tr(' (đồng môn)', " (sect ally)") : ''}
            </button>
          </div>
        </div>
        <p className="nhd-sec">{tr("Ngũ Hành Ấn", "Five Elements Seals")}</p>
        <div className="nhd-seals">
          {ELEMENT_IDS.map((e) => (
            <div key={e} className={`nhd-seal ${e === lastKey ? 'key' : ''}`} style={{ ['--el' as string]: ELEMENTS[e].color } as CSSProperties}>
              <b>{ELEMENTS[e].name}</b>
              <span className="dots">
                {Array.from({ length: AN_MAX }, (_, i) => (
                  <i key={i} className={i < anOf(c, e) ? 'on' : ''} />
                ))}
              </span>
              {e === lastKey && <small>{tr("gương cuối", "last mirror")}</small>}
            </div>
          ))}
        </div>
        <p className="nhd-mind">{tr("Tâm cảnh: ", "State of mind: ")}{mind.text}.</p>
      </section>
      <footer className="nhd-foot">
        <button className="btn btn-red btn-big" disabled={!pick} onClick={() => pick && onFight(pick, phu)}>
          {pick ? tr(`Lên đài với lá ${STANCES[pick].name}`, `Step up with ${STANCES[pick].name}`) : tr('Chọn một lá bùa', "Pick a charm")}
        </button>
        <div>
          <button className="btn btn-dark" onClick={onRules}>
            
            {tr("Luật", "Rules")}
          </button>
          <button className="btn btn-dark" onClick={onLeave}>
            
            {tr("Rời đài", "Leave the platform")}
          </button>
        </div>
      </footer>
    </div>
  );
}
