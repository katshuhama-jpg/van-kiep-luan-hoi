'use client';

import { useState, type CSSProperties } from 'react';
import Sprite from './Sprite';
import { ELEMENTS, ELEMENT_IDS, elementOf } from '@/lib/game/nguhanh';
import {
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

export type NhdView = 'rules' | 'prep' | 'result';

const DEST_NAME = { tien: 'Tiên giới', ma: 'Ma giới', hu: 'Thái Hư' } as const;
const pct = (x: number) => `${x >= 1 ? '+' : ''}${Math.round((x - 1) * 100)}%`;
const REL_TXT = { khac: 'Bạn khắc bóng', bi_khac: 'Bóng khắc bạn', sinh: 'Bạn sinh bóng', duoc_sinh: 'Bóng sinh bạn', dong: 'Cùng mệnh' } as const;

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
    <svg className="nhd-wheel" viewBox="0 0 160 160" role="img" aria-label="Vòng ngũ hành: vòng ngoài tương sinh, ngôi sao trong tương khắc">
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
  const label = w ? `Đủ cấp phi thăng, còn ${w} năm tới ${ASCEND_MIN_AGE} tuổi. Chạm xem nên chuẩn bị gì` : `Ngũ Hành Đài: ấn ${ELEMENTS[k].name} ${anOf(c, k)}/${AN_MAX}, phù ${c.phu ?? 0}/3`;
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
          <h2 id="nhd-title">{end === 'done' ? 'Ngũ hành viên mãn' : end === 'next' ? `Gương vỡ · ${st.won}/${NHD_ROUNDS}` : end === 'dead' ? 'Thân tử đạo tiêu' : 'Bị hất khỏi đài'}</h2>
          <p>{msg}</p>
          <button className="btn btn-red btn-big" onClick={onNext}>
            {end === 'done' ? 'Đón thiên kiếp' : end === 'next' ? 'Tới gương tiếp theo' : 'Tiếp tục'}
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
            <p className="nhd-kick">Trước cửa trời</p>
            <h2 id="nhd-title">Luật Ngũ Hành Đài</h2>
            {preview && waiting(c) > 0 && (
              <div className="nhd-wait">
                <b>Bạn đã đủ cấp phi thăng, còn {waiting(c)} năm nữa mới tới {ASCEND_MIN_AGE} tuổi.</b>
                <p>Tu vi đã đầy, không tăng thêm. Quãng chờ này dành để chuẩn bị cho Ngũ Hành Đài:</p>
                <ul className="nhd-list">
                  <li>
                    Săn quái hệ <Chip e={lastKey} small /> (Vừa sức trở lên) để đủ {AN_MAX} ấn: gương cuối hết khắc được bạn. Đang có {anOf(c, lastKey)}/{AN_MAX}.
                  </li>
                  <li>Kiếm tiền mua Ngũ Hành Phù ({sectSide(c) === 'trung' ? PHU_PRICE / 2 : PHU_PRICE} linh thạch một tấm, tối đa 3). Dùng phù ở gương cuối là cách lật thế mạnh nhất.</li>
                  <li>Hạ tâm ma (Thanh Tâm Đan, bế quan) để bóng yếu đi, giữ đạo tâm thật vững.</li>
                  <li>Để ý thọ nguyên: thọ sắp hết thì uống Diên Thọ Đan.</li>
                </ul>
              </div>
            )}
            <p>Muốn phi thăng phải hạ đủ {NHD_ROUNDS} bóng của chính mình. Bóng giống hệt bạn (cấp, chỉ số, trang bị), chỉ khác bản mệnh, và mỗi vòng một mạnh hơn. Bóng cuối mạnh hơn chính bạn.</p>
            <Wheel me={me} />
            <p className="nhd-legend">
              <span className="s">→ sinh</span> <span className="k">⇢ khắc</span> · Bị khắc: đòn bạn -30%, đòn bóng +50%
            </p>
            <h3>Năm tấm gương (bạn mệnh {ELEMENTS[me].name})</h3>
            <ol className="nhd-order">
              {order.map((e, i) => (
                <li key={i} className={i < st.won ? 'done' : i === 4 ? 'boss' : ''}>
                  <Chip e={e} small /> {ROUND_NAME[i]}
                  {i < st.won ? ' · đã vỡ' : i === 4 ? ' · khó nhất' : ''}
                </li>
              ))}
            </ol>
            <h3>Bốn cách lật thế</h3>
            <ul className="nhd-list">
              <li>
                <b>Ngũ Hành Ấn.</b> Diệt quái có hệ (không quá yếu) có 20% nhận 1 ấn hệ đó, tối đa {AN_MAX} ấn mỗi hệ. Khi bị khắc, mỗi ấn của hệ khắc được bóng gỡ 20% phần thiệt. Bóng cuối cần ấn <Chip e={lastKey} small />: bạn có {anOf(c, lastKey)}/{AN_MAX}.
              </li>
              <li>
                <b>Thế trận.</b> Trước mỗi vòng rút một lá bùa: Công (đòn +25%), Thủ (nhận -35%), Hóa (xóa khắc chế, đòn -10%). Thủ chặn Công, Hóa phá Thủ, Công thắng Hóa: rút đúng lá khắc thế của bóng thì thêm 15% lợi thế. Bóng lộ dáng trước khi ra tay, nhưng 3 lần trong 10 là đòn nhử.
              </li>
              <li>
                <b>Ngũ Hành Phù.</b> Đổi bản mệnh của bạn sang hệ khắc bóng trong một vòng. Rơi từ quái có hệ Lv16 trở lên, hoặc mua của sứ giả Thiên Cơ Các ngay trên đài. Mang tối đa 3 tấm, bạn có {c.phu ?? 0}.
              </li>
              <li>
                <b>Tâm cảnh.</b> Tâm ma cao thì bóng mạnh thêm, tối đa 20%. Đạo tâm vững (rất chính hoặc rất tà) thì bóng yếu đi 5-10%. Hiện tại: {mind.text}.
              </li>
            </ul>
            <h3>Thắng và thua</h3>
            <ul className="nhd-list">
              <li>Chỉ được lên đài khi đủ Độ Kiếp hậu kỳ và từ {ASCEND_MIN_AGE} tuổi trở lên.</li>
              <li>Vỡ đủ {NHD_ROUNDS} gương: được độ kiếp phi thăng, tỉ lệ vượt kiếp +10%.</li>
              <li>
                Thua một vòng: {Math.round(deathChance(0) * 100)}% thân tử đạo tiêu (gương cuối {Math.round(deathChance(4) * 100)}%). Sống sót thì mất 15% tu vi, tâm ma +6, {NHD_DELAY} năm sau mới được lên đài lại. Gương đã vỡ không lành lại.
              </li>
              <li>Thua gương cuối quá {GUONG_LOSSES - 1} lần thì... không ai biết điều gì xảy ra.</li>
            </ul>
          </div>
          <i className="rod bot" aria-hidden="true" />
          <div className="nhd-scroll-acts">
            {preview ? (
              <button className="btn btn-red btn-big" onClick={onLeave}>
                Đã hiểu
              </button>
            ) : (
              <>
                <button className="btn btn-red btn-big" onClick={onRules}>
                  Đã hiểu, lên đài
                </button>
                <button className="btn btn-dark" onClick={onLeave}>
                  Chưa sẵn sàng
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
        <span>Ngũ Hành Đài · cửa {DEST_NAME[destOf(c)]}</span>
        <b id="nhd-title">
          Gương {round + 1}/{NHD_ROUNDS} · {ROUND_NAME[round]}
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
        <span>Bóng {ELEMENTS[foeEl].name} lộ dáng:</span> {STANCES[tell].tell}
      </p>
      <div className={`nhd-clash ${ep.rel}`}>
        <Chip e={ep.myEl} />
        <span className="arr">{ep.rel === 'khac' ? '▶' : ep.rel === 'bi_khac' ? '◀' : '⇄'}</span>
        <Chip e={foeEl} />
        <span className="mul">
          {REL_TXT[ep.rel]} · đòn bạn <b>{pct(ep.pMul)}</b> · đòn bóng <b>{pct(ep.fMul)}</b>
        </span>
        {ep.notes.length > 0 && <small>{ep.notes.join('. ')}.</small>}
      </div>
      <section className="nhd-table" aria-label="Bàn chuẩn bị">
        <p className="nhd-sec">Rút một lá bùa thế trận</p>
        <div className="nhd-buas">
          {(Object.keys(STANCES) as Stance[]).map((s) => (
            <button key={s} className={`nhd-bua ${s} ${pick === s ? 'on' : ''}`} aria-pressed={pick === s} onClick={() => setPick(s)}>
              <b>{STANCES[s].name}</b>
              <small>{STANCES[s].desc}</small>
              <em>khắc {STANCES[BEATS[s]].name}</em>
            </button>
          ))}
        </div>
        <div className="nhd-row">
          <button
            className={`nhd-phu ${phu ? 'on' : ''}`}
            disabled={!(c.phu ?? 0)}
            aria-pressed={phu}
            onClick={() => setPhu(!phu)}
            title="Ngũ Hành Phù: đổi bản mệnh sang hệ khắc bóng trong vòng này"
          >
            <b>Phù</b>
            <small>{c.phu ?? 0}/3</small>
          </button>
          <div className="nhd-phu-txt">
            {phu ? `Dùng phù: bạn mang mệnh ${ELEMENTS[khacBy(foeEl)].name} vòng này.` : (c.phu ?? 0) ? 'Chạm lá phù để dùng trong vòng này.' : 'Chưa có Ngũ Hành Phù.'}
            <button className="nhd-buy" disabled={c.linhThach < price || (c.phu ?? 0) >= 3} onClick={onBuyPhu}>
              Mua của sứ giả Thiên Cơ · {price}
              {sectSide(c) === 'trung' ? ' (đồng môn)' : ''}
            </button>
          </div>
        </div>
        <p className="nhd-sec">Ngũ Hành Ấn</p>
        <div className="nhd-seals">
          {ELEMENT_IDS.map((e) => (
            <div key={e} className={`nhd-seal ${e === lastKey ? 'key' : ''}`} style={{ ['--el' as string]: ELEMENTS[e].color } as CSSProperties}>
              <b>{ELEMENTS[e].name}</b>
              <span className="dots">
                {Array.from({ length: AN_MAX }, (_, i) => (
                  <i key={i} className={i < anOf(c, e) ? 'on' : ''} />
                ))}
              </span>
              {e === lastKey && <small>gương cuối</small>}
            </div>
          ))}
        </div>
        <p className="nhd-mind">Tâm cảnh: {mind.text}.</p>
      </section>
      <footer className="nhd-foot">
        <button className="btn btn-red btn-big" disabled={!pick} onClick={() => pick && onFight(pick, phu)}>
          {pick ? `Lên đài với lá ${STANCES[pick].name}` : 'Chọn một lá bùa'}
        </button>
        <div>
          <button className="btn btn-dark" onClick={onRules}>
            Luật
          </button>
          <button className="btn btn-dark" onClick={onLeave}>
            Rời đài
          </button>
        </div>
      </footer>
    </div>
  );
}
