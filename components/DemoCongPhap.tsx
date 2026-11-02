'use client';
/**
 * DEMO giao diện công pháp và linh thú (chưa nối logic game). Dùng thẳng Scene, Sprite, Panels thật.
 * Chỉ để xem trước trên điện thoại, không link từ đâu, noindex.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Scene from './Scene';
import Sprite from './Sprite';
import { EventCard, FocusGrid, LogPanel, OverworkBar, StageStrip } from './Panels';
import type { BattleView } from './Battle';
import { MONSTERS } from '@/lib/game/combat';
import { emptyMeta, newCharacter } from '@/lib/game/engine';
import { PETS, PET_IDS } from '@/lib/game/pets';
import type { Character, Fx, LogEntry, PendingEvent } from '@/lib/game/types';

type Scr = 'choi' | 'kinh' | 'thu' | 'dau';

/* ---------- dữ liệu mẫu ---------- */
const PHAM = ['Hoàng', 'Huyền', 'Địa', 'Thiên'];
const PHAM_CLS = ['p0', 'p1', 'p2', 'p3'];
interface CP {
  id: string;
  name: string;
  icon: string;
  kind: 'tam' | 'chieu';
  pham: number;
  tang: number;
  exp: number;
  main: string;
  sub: string[];
  he: string;
}
const CPS: CP[] = [
  { id: 'thanh_lien', name: 'Thanh Liên Kiếm Tâm Quyết', icon: 'g_thanh_phong_kiem_pho', kind: 'tam', pham: 1, tang: 6, exp: 40, main: 'Tu vi +15% mỗi năm', sub: ['Thọ nguyên +8'], he: 'Kiếm' },
  { id: 'liet_hoa', name: 'Liệt Hỏa Kiếm Quyết', icon: 'g_kiem_pho_tan_thien', kind: 'chieu', pham: 1, tang: 9, exp: 100, main: 'Công +12%, 25% thiêu đốt 2 hiệp', sub: ['Đánh kẻ hơn cảnh giới +8%'], he: 'Kiếm' },
  { id: 'kim_xa', name: 'Kim Xà Kiếm Pháp', icon: 'g_doc_co_kiem_pho', kind: 'chieu', pham: 0, tang: 9, exp: 100, main: '20% hút máu bằng 30% sát thương', sub: ['Né +3%', 'Bạo kích +4%'], he: 'Kiếm' },
  { id: 'thai_cuc', name: 'Thái Cực Kiếm', icon: 'g_ho_tam_kinh', kind: 'chieu', pham: 2, tang: 3, exp: 25, main: 'Phản 15% sát thương nhận vào', sub: ['Tâm cảnh +4'], he: 'Kiếm' },
  { id: 'doc_co', name: 'Độc Cô Cửu Kiếm (tàn quyển 2/3)', icon: 'g_kinh_thu_tan_quyen', kind: 'chieu', pham: 3, tang: 0, exp: 0, main: 'Gom đủ 3 tàn quyển để luyện', sub: [], he: 'Kiếm' },
];
const FUSED: CP = { id: 'hoa_xa', name: 'Hỏa Xà Phần Thiên Kiếm', icon: 'g_thien_cuong_kiem', kind: 'chieu', pham: 2, tang: 1, exp: 0, main: 'Thiêu đốt kèm hút máu, mỗi hiệp cháy hồi 10 máu', sub: ['Công +10%'], he: 'Kiếm' };
const BOOK_ICONS = ['g_thanh_phong_kiem_pho', 'g_kiem_pho_tan_thien', 'g_doc_co_kiem_pho', 'g_ho_tam_kinh', 'g_kinh_thu_tan_quyen', 'g_bach_thao_kinh', 'g_bat_quai_kinh', 'g_huyet_than_kinh', 'g_kinh_kim_cang', 'g_thai_thuong_dan_kinh', 'g_con_lon_kinh', 'g_tam_kinh_ngoc_gian', 'g_ky_mon_don_giap_thu', 'g_lac_thu', 'g_dai_bi_chu', 'g_thien_cuong_kiem'];
const PET_EVO = ['soi_con', 'xich_lang', 'bach_lang'];
const PET_EVO_NAME = ['Sói con', 'Xích Lang', 'Thiên Lang'];
const PET_SEEN = ['soi_con', 'xich_lang', 'tuyet_ho', 'ho_ly', 'cho_vang', 'nam_linh', 'dai_bang', 'slime', 'ong_vang'];

function makeChar(): Character {
  const c = newCharacter(emptyMeta());
  c.age = 58;
  c.realm = 3;
  c.layer = 2;
  c.path = 'kiem';
  c.focus = 'tu_luyen';
  c.pet = true;
  c.petKind = 'xich_lang';
  c.lifeNo = 12;
  c.lifespan = 180;
  c.linhThach = 12450;
  c.cultivation = Math.round(c.cultivation + 200);
  c.equipped = { ...c.equipped, vu_khi: 'thanh_phong' };
  c.stats = { ...c.stats, sucKhoe: 82, tamCanh: 64, ngoTinh: 71, khiVan: 48, tamMa: 12 };
  c.log = [
    { age: 55, tone: 'normal', text: 'Bạn ngồi thiền dưới thác, kiếm ý thêm một phần sắc bén.' },
    { age: 56, tone: 'good', text: 'Liệt Hỏa Kiếm Quyết đạt tầng 9. Lưỡi kiếm tỏa hơi nóng như lò rèn.' },
    { age: 57, tone: 'normal', text: 'Xích Lang tha về một gốc linh thảo, vẫy đuôi chờ khen.' },
    { age: 58, tone: 'good', text: 'Kim Xà Kiếm Pháp đạt tầng 9. Hai bộ kiếm pháp trong người bắt đầu cộng hưởng.' },
  ];
  return c;
}

/* ---------- linh thú: cắt khung từ sprite thật ---------- */
function PetAnim({ id, scale, dir = 1, still, dark, cls, style }: { id: string; scale: number; dir?: 0 | 1; still?: boolean; dark?: boolean; cls?: string; style?: CSSProperties }) {
  const p = PETS[id];
  const w = p.w * scale;
  const h = p.h * scale;
  return (
    <span
      className={`dm-pet ${cls ?? ''}`}
      style={{
        width: w,
        height: h,
        backgroundImage: `url(/lpc/pets/${id}.png)`,
        backgroundSize: `${p.n * w}px ${2 * h}px`,
        backgroundPositionY: dir ? -h : 0,
        ['--lpc-end' as string]: `-${p.n * w}px`,
        animation: still ? 'none' : `lpc-play ${p.n / p.fps}s steps(${p.n}) infinite`,
        filter: dark ? 'brightness(0) opacity(0.35)' : p.filter,
        ...style,
      } as CSSProperties}
      aria-hidden="true"
    />
  );
}

function Icon({ src, size = 40, dark }: { src: string; size?: number; dark?: boolean }) {
  return <img src={`/icons/${src}.png`} width={size} height={size} alt="" className={`px-icon ${dark ? 'dm-dark' : ''}`} />;
}

/* ---------- Tàng Kinh Các ---------- */
function KinhScene({ c, onClose }: { c: Character; onClose: () => void }) {
  const [tab, setTab] = useState<'luyen' | 'dung' | 'so'>('luyen');
  const [eq, setEq] = useState<string[]>(['thanh_lien', 'liet_hoa', 'kim_xa']);
  const [fuse, setFuse] = useState<'idle' | 'fuse' | 'ok'>('idle');
  const [heir, setHeir] = useState('liet_hoa');
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  const all = fuse === 'ok' ? [...CPS, FUSED] : CPS;
  const get = (id: string) => all.find((x) => x.id === id)!;
  const slots: { label: string; id?: string }[] = [
    { label: 'Tâm pháp', id: eq[0] },
    { label: 'Chiêu 1', id: eq[1] },
    { label: 'Chiêu 2', id: eq[2] },
  ];
  function toggle(cp: CP) {
    if (cp.tang === 0) return;
    if (cp.kind === 'tam') return setEq([cp.id, eq[1], eq[2]]);
    if (eq.includes(cp.id)) return setEq(eq.map((x) => (x === cp.id ? '' : x)));
    const k = !eq[1] ? 1 : !eq[2] ? 2 : 2;
    const n = [...eq];
    n[k] = cp.id;
    setEq(n);
  }
  return (
    <div className="forge-wrap dm-wrap" role="dialog" aria-modal="true" aria-label="Tàng Kinh Các">
      <div className="forge-scene">
        <div className="fs-head">
          <b>Tàng Kinh Các</b>
          <span className="fs-tinh">Kiếm tu · Kim Đan</span>
          <button className="ss-x" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        <div className="dm-kinh-stage" style={{ backgroundImage: 'url(/bg/tu_luyen-1.png)' }}>
          <div className="dm-slots">
            {slots.map((s, i) => {
              const cp = s.id ? get(s.id) : null;
              return (
                <div key={i} className={`dm-slot ${cp ? PHAM_CLS[cp.pham] : 'empty'}`}>
                  <small>{s.label}</small>
                  {cp ? <Icon src={cp.icon} size={40} /> : <span className="dm-plus">+</span>}
                  {cp && <b>Tầng {cp.tang}</b>}
                </div>
              );
            })}
          </div>
          <div className="dm-kinh-me">
            <Sprite c={c} size={120} anim="spellcast" dir={2} />
          </div>
          <span className="dm-qi" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <i key={i} style={{ left: `${36 + i * 5}%`, animationDelay: `${i * 0.4}s` }} />
            ))}
          </span>
        </div>
        <div className="fs-info">
          <div className="chips">
            <button className={`chip-btn ${tab === 'luyen' ? 'on' : ''}`} onClick={() => setTab('luyen')}>
              Đang luyện
            </button>
            <button className={`chip-btn ${tab === 'dung' ? 'on' : ''}`} onClick={() => setTab('dung')}>
              Dung hợp
            </button>
            <button className={`chip-btn ${tab === 'so' ? 'on' : ''}`} onClick={() => setTab('so')}>
              Sổ {fuse === 'ok' ? 15 : 14}/120
            </button>
          </div>

          {tab === 'luyen' && (
            <div className="dm-list">
              <p className="note">Thục luyện tự tăng theo năm. Chạm để mang hoặc tháo.</p>
              {all.map((cp) => {
                const on = eq.includes(cp.id);
                return (
                  <button key={cp.id} className={`dm-cp ${PHAM_CLS[cp.pham]} ${on ? 'on' : ''} ${cp.tang === 0 ? 'lock' : ''}`} onClick={() => toggle(cp)}>
                    <Icon src={cp.icon} size={44} dark={cp.tang === 0} />
                    <span className="dm-cp-body">
                      <span className="dm-cp-top">
                        <b>{cp.name}</b>
                      </span>
                      <span className="dm-tags">
                        <i className={`dm-pham ${PHAM_CLS[cp.pham]}`}>{PHAM[cp.pham]} phẩm</i>
                        <i>{cp.kind === 'tam' ? 'Tâm pháp' : 'Chiêu thức'}</i>
                        <i>{cp.he}</i>
                        {on && <i className="dm-on">Đang mang</i>}
                      </span>
                      <span className="dm-main">{cp.main}</span>
                      {cp.sub.map((s) => (
                        <span key={s} className="dm-sub">
                          + {s}
                        </span>
                      ))}
                      {cp.tang > 0 && (
                        <span className="dm-tang">
                          <span className="dm-tang-n">Tầng {cp.tang}/9</span>
                          <span className="dm-prog">
                            <span style={{ width: `${cp.tang === 9 ? 100 : cp.exp}%` }} />
                          </span>
                          {cp.tang === 9 && <span className="dm-max">Viên mãn</span>}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'dung' && (
            <>
              <div className={`dm-fuse ${fuse}`} style={{ backgroundImage: 'url(/bg/luyen_dan-2.png)' }}>
                <div className="dm-fuse-in">
                  <Icon src="g_kiem_pho_tan_thien" size={48} />
                  <small>Liệt Hỏa · 9</small>
                </div>
                <span className="dm-fuse-x">+</span>
                <div className="dm-fuse-in">
                  <Icon src="g_doc_co_kiem_pho" size={48} />
                  <small>Kim Xà · 9</small>
                </div>
                {fuse === 'fuse' && (
                  <span className="mg-smoke dm-smoke" aria-hidden="true">
                    {Array.from({ length: 6 }, (_, i) => (
                      <i key={i} style={{ ['--i' as string]: i } as CSSProperties} />
                    ))}
                  </span>
                )}
                {fuse === 'ok' && (
                  <span className="mg-out ok dm-fuse-out">
                    <Icon src={FUSED.icon} size={56} />
                  </span>
                )}
                {fuse === 'ok' && <span className="fs-stamp ok">Lĩnh ngộ!</span>}
              </div>
              {fuse === 'ok' ? (
                <p className="fs-res ok">
                  Hai luồng kiếm ý hòa làm một. Bạn lĩnh ngộ <b>{FUSED.name}</b> (Địa phẩm). Công thức đã ghi vào sổ.
                </p>
              ) : (
                <p className="note">Hai chiêu cùng hệ đều viên mãn tầng 9 thì có thể thử dung hợp. Ra chiêu gì thì phải thử mới biết.</p>
              )}
              <dl className="fs-odds">
                <dt>Kết quả</dt>
                <dd>{fuse === 'ok' ? FUSED.name : '??? (chưa ai trong sổ của bạn ra chiêu này)'}</dd>
                <dt>Thành</dt>
                <dd>60%</dd>
                <dt>Hỏng</dt>
                <dd className="bad">hai chiêu tụt về tầng 6, không mất</dd>
                <dt>Tốn</dt>
                <dd>10 năm bế quan</dd>
              </dl>
              <button
                className="btn btn-red btn-big"
                disabled={fuse !== 'idle'}
                onClick={() => {
                  setFuse('fuse');
                  t.current = setTimeout(() => setFuse('ok'), 1600);
                }}
              >
                {fuse === 'fuse' ? 'Đang dung hợp...' : fuse === 'ok' ? 'Đã lĩnh ngộ' : '☯ Dung hợp'}
              </button>
              {fuse === 'ok' && (
                <button className="btn" onClick={() => setFuse('idle')}>
                  Xem lại
                </button>
              )}
            </>
          )}

          {tab === 'so' && (
            <>
              <div className="dm-heir">
                <Icon src={get(heir).icon} size={44} />
                <div>
                  <small>Truyền thừa kiếp sau</small>
                  <b>{get(heir).name}</b>
                  <span>Kiếp 13 sinh ra đã biết bộ này, từ tầng 1.</span>
                </div>
              </div>
              <div className="chips scroll">
                {all
                  .filter((x) => x.tang === 9)
                  .map((x) => (
                    <button key={x.id} className={`chip-btn ${heir === x.id ? 'on' : ''}`} onClick={() => setHeir(x.id)}>
                      {x.name}
                    </button>
                  ))}
              </div>
              <p className="note">Chỉ công pháp viên mãn mới truyền được. Mỗi kiếp chọn 1 bộ.</p>
              <div className="dm-book">
                {BOOK_ICONS.map((s, i) => (
                  <span key={s} className={`dm-book-i ${i < 5 || (i === 15 && fuse === 'ok') ? '' : 'unseen'}`}>
                    <Icon src={s} size={36} dark={!(i < 5 || (i === 15 && fuse === 'ok'))} />
                  </span>
                ))}
                {Array.from({ length: 12 }, (_, i) => (
                  <span key={`q${i}`} className="dm-book-i unseen">
                    ?
                  </span>
                ))}
              </div>
              <p className="note">Đã gặp qua 12 kiếp. Còn 105 bộ chưa thấy, có bộ chỉ ra từ dung hợp.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Linh thú ---------- */
function ThuScene({ onClose }: { onClose: () => void }) {
  const [evo, setEvo] = useState(1);
  return (
    <div className="forge-wrap dm-wrap" role="dialog" aria-modal="true" aria-label="Linh thú">
      <div className="forge-scene">
        <div className="fs-head">
          <b>Linh thú</b>
          <span className="fs-tinh">Sổ {PET_SEEN.length}/{PET_IDS.length}</span>
          <button className="ss-x" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        <div className="dm-thu-stage" style={{ backgroundImage: 'url(/bg/du_ngoan-1.png)' }}>
          <span className="dm-thu-name">
            <b>{PET_EVO_NAME[evo]}</b>
            <small>Bậc {evo + 1}/3 · Lv {evo === 2 ? 20 : 14}</small>
          </span>
          <div className={`dm-thu-big b${evo}`} key={evo}>
            <PetAnim id={PET_EVO[evo]} scale={evo === 2 ? 3.6 : 3.2} dir={1} />
          </div>
          {evo === 2 && (
            <span className="dm-evo-rays" aria-hidden="true">
              {Array.from({ length: 10 }, (_, i) => (
                <i key={i} style={{ left: `${24 + ((i * 29) % 52)}%`, top: `${22 + ((i * 17) % 50)}%`, animationDelay: `${i * 0.25}s` }} />
              ))}
            </span>
          )}
        </div>
        <div className="fs-info">
          <div className="dm-evo">
            {PET_EVO.map((id, i) => (
              <button key={id} className={`dm-evo-n ${i === evo ? 'on' : ''} ${i < 1 ? 'done' : ''}`} onClick={() => setEvo(i)}>
                <span className="dm-evo-pic">
                  <PetAnim id={id} scale={1} dir={1} still dark={i === 2 && evo !== 2} />
                </span>
                <small>{i === 2 && evo !== 2 ? '???' : PET_EVO_NAME[i]}</small>
              </button>
            ))}
          </div>
          <p className="note">Chạm từng bậc để xem trước. Bậc 3 thật thì khóa tới khi đủ điều kiện.</p>

          <div className="dm-box">
            <div className="dm-row">
              <span>Thân thiết</span>
              <b>Lv 14/20</b>
            </div>
            <span className="dm-prog wide">
              <span style={{ width: '70%' }} />
            </span>
            <small>Đi cùng bạn 23 năm. Mỗi năm bên nhau +1, cùng đánh trận +2.</small>
          </div>

          <div className="dm-box">
            <b className="dm-h">Tác dụng</b>
            <span className="dm-eff">
              <i>Hộ chủ</i> Bị chặn đường thì 30% lao lên cắn một đòn
            </span>
            <span className="dm-eff">
              <i>Bậc 2</i> Công +8% khi trừ yêu
            </span>
            <span className={`dm-eff ${evo === 2 ? '' : 'lock'}`}>
              <i>Bậc 3</i> {evo === 2 ? 'Tru Nguyệt: mỗi trận 1 lần chặn đòn chí mạng' : 'Mở khi tiến hóa'}
            </span>
          </div>

          <div className="dm-box">
            <b className="dm-h">Tiến hóa lên Thiên Lang</b>
            <span className="dm-need ok">✓ Đã qua bậc 2</span>
            <span className="dm-need">✗ Thân thiết Lv 20 (đang 14)</span>
            <span className="dm-need">✗ Chủ đạt Nguyên Anh (đang Kim Đan 2)</span>
            <button className="btn btn-jade" disabled>
              Tiến hóa
            </button>
          </div>

          <div className="dm-box">
            <b className="dm-h">Huyết mạch</b>
            <div className="dm-blood">
              <span className="dm-blood-s">
                <span className="dm-evo-pic">
                  <PetAnim id="tuyet_ho" scale={0.75} dir={1} still />
                </span>
                <span>
                  <b>Tuyết Hồ</b>
                  <small>từ kiếp 7 · +5 phúc duyên mỗi 10 năm</small>
                </span>
              </span>
              <span className="dm-blood-s empty">
                <span className="dm-plus">+</span>
                <span>
                  <b>Ô trống</b>
                  <small>Mở khi Xích Lang lên bậc 3</small>
                </span>
              </span>
            </div>
            <small>Thú bậc 3 khi mất sẽ để lại một giọt huyết mạch cho kiếp sau. Hai huyết mạch khác loài có 15% ra biến dị.</small>
          </div>

          <b className="dm-h">Sổ linh thú</b>
          <div className="dm-petbook">
            {PET_IDS.map((id) => (
              <span key={id} className="dm-petbook-i">
                <PetAnim id={id} scale={id === 'thu_vuong' ? 0.5 : PETS[id].w <= 32 ? 1 : 0.62} dir={1} still dark={!PET_SEEN.includes(id)} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Đánh nhau ---------- */
type Step = { side: 'p' | 'm' | 'pet'; dmg: number; skill?: string; chip?: number; text?: string; tag?: string; log: string; heal?: number; crit?: boolean };
const SCRIPT: Step[] = [
  { side: 'p', dmg: 86, skill: 'Liệt Hỏa Kiếm Quyết', chip: 1, tag: 'Thiêu đốt!', log: 'Liệt Hỏa Kiếm Quyết! Hỏa Kỳ Lân bị thiêu đốt 2 hiệp.' },
  { side: 'm', dmg: 44, log: 'Hỏa Kỳ Lân phun lửa, bạn mất 44 máu.' },
  { side: 'pet', dmg: 31, tag: 'Xích Lang cắn!', chip: 3, log: 'Hộ chủ: Xích Lang lao lên cắn vào chân sau, -31.' },
  { side: 'p', dmg: 18, text: '-18', tag: 'cháy', log: 'Lửa còn bám trên lớp vảy, -18.' },
  { side: 'p', dmg: 64, skill: 'Kim Xà Kiếm Pháp', chip: 2, heal: 19, crit: true, log: 'Kim Xà Kiếm Pháp bạo kích, hút lại 19 máu.' },
  { side: 'm', dmg: 38, log: 'Kỳ Lân húc tới, bạn lùi ba bước, -38.' },
  { side: 'p', dmg: 92, skill: 'Liệt Hỏa Kiếm Quyết', chip: 1, log: 'Liệt Hỏa Kiếm Quyết lần nữa, kiếm quang đỏ rực cả sườn núi.' },
];

function useBattle(c: Character | null) {
  const m = MONSTERS.find((x) => x.id === 'ky_lan') ?? MONSTERS[0];
  const MAX_M = 360;
  const MAX_P = 300;
  const [b, setB] = useState<BattleView | null>(null);
  const [chip, setChip] = useState<number | null>(null);
  const [petHit, setPetHit] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  useEffect(() => {
    if (!c) return;
    let k = 0;
    let id = 1;
    let mHp = MAX_M;
    let pHp = 248;
    let hist: BattleView['last'] = [];
    let lines: LogEntry[] = [{ age: 58, tone: 'normal', text: 'Trừ yêu ở Hỏa Diệm Sơn. Hỏa Kỳ Lân Lv25 chặn đường.' }];
    const base = { m, name: m.name, lv: 25, tier: 0, pMax: MAX_P, mMax: MAX_M, kills: 3, melem: { me: 'kim', foe: 'hoa', rel: 'bi_khac' } } as const;
    setB({ ...base, pHp, mHp, phase: 'fight', last: [] } as unknown as BattleView);
    setLog(lines);
    const tick = setInterval(() => {
      if (k >= SCRIPT.length) {
        if (k === SCRIPT.length) {
          lines = [...lines, { age: 58, tone: 'good', text: 'Hỏa Kỳ Lân ngã xuống. Liệt Hỏa Kiếm Quyết thục luyện +3, Xích Lang thân thiết +2.' }];
          setLog(lines);
          setB((o) => (o ? { ...o, mHp: 0, phase: 'rest', outcome: 'win' } : o));
          setChip(null);
        }
        k++;
        if (k > SCRIPT.length + 3) {
          k = 0;
          mHp = MAX_M;
          pHp = 248;
          hist = [];
          lines = [lines[0]];
          setLog(lines);
          setB({ ...base, pHp, mHp, phase: 'fight', last: [] } as unknown as BattleView);
        }
        return;
      }
      const s = SCRIPT[k++];
      if (s.side === 'm') pHp = Math.max(1, pHp - s.dmg);
      else mHp = Math.max(1, mHp - s.dmg);
      if (s.heal) pHp = Math.min(MAX_P, pHp + s.heal);
      hist = [...hist.slice(-3), { id: id++, side: s.side === 'm' ? 'm' : 'p', dmg: s.dmg, crit: !!s.crit, skill: s.skill, text: s.text ?? (s.heal ? `-${s.dmg} · +${s.heal}` : undefined), tag: s.tag }];
      lines = [...lines, { age: 58, tone: s.side === 'm' ? 'bad' : s.chip ? 'good' : 'normal', text: s.log }];
      setLog(lines);
      setChip(s.chip ?? null);
      if (s.side === 'pet') setPetHit((x) => x + 1);
      setB({ ...base, pHp, mHp, phase: 'fight', last: hist } as unknown as BattleView);
    }, 1300);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c]);
  return { b, chip, petHit, log };
}

/* ---------- App ---------- */
const KY_NGO: PendingEvent = {
  id: 'demo_bi_kip',
  title: 'Kỳ ngộ · Hang đá sau thác',
  text: 'Xích Lang sủa vào vách đá. Sau lớp rêu là một hộp gỗ mục, bên trong có cuộn lụa cháy sém mép: "Liệt Hỏa Kiếm Quyết". Chữ còn đọc được.',
  choices: [
    { label: 'Ngồi xuống luyện ngay', hint: 'học công pháp Huyền phẩm', lean: 'chinh' },
    { label: 'Mang ra phường thị bán', hint: '+1.800 linh thạch', lean: 'trung' },
  ],
};

export default function DemoApp() {
  const [c, setC] = useState<Character | null>(null);
  const [scr, setScr] = useState<Scr>('choi');
  const [pending, setPending] = useState<PendingEvent | null>(KY_NGO);
  const [fx, setFx] = useState<Fx[]>([]);
  useEffect(() => setC(makeChar()), []);
  const fight = useBattle(scr === 'dau' ? c : null);
  if (!c) return <main className="game" />;
  const inFight = scr === 'dau';
  return (
    <div className="dm-root">
      <nav className="dm-bar" aria-label="Chọn màn demo">
        <b>DEMO</b>
        {(
          [
            ['choi', 'Màn chơi'],
            ['kinh', 'Công pháp'],
            ['thu', 'Linh thú'],
            ['dau', 'Đánh nhau'],
          ] as const
        ).map(([k, n]) => (
          <button key={k} className={scr === k ? 'on' : ''} onClick={() => setScr(k)}>
            {n}
          </button>
        ))}
      </nav>
      <main className={`game dm-game ${pending && scr === 'choi' ? 'has-event' : ''}`}>
        <header className="topbar">
          <div className="topbar-row">
            <span className="age-big">{c.age}</span>
            <span className="meta">
              tuổi · Hạ · Kiếp {c.lifeNo}
              <br />
              <b>12.450</b> linh thạch · Khá giả
            </span>
            <div className="top-icons">
              <button className="icon-btn menu-btn" aria-label="Menu">
                ≡
              </button>
            </div>
          </div>
          <div className="year-bar" aria-hidden="true">
            <div style={{ width: '40%' }} />
          </div>
          <div className="speeds">
            <button className="play">❚❚</button>
            {[1, 2, 4, 8, 16].map((s) => (
              <button key={s} className={s === 2 ? 'on' : ''}>
                {s}×
              </button>
            ))}
            <button className="next">»</button>
          </div>
        </header>

        <section className="stage">
          <Scene c={inFight ? { ...c, pet: false, focus: 'tru_yeu' } : c} fx={fx} paused={false} season={1} battle={inFight ? fight.b : null} />
          {!inFight && (
            <button className="dm-petbadge" onClick={() => setScr('thu')} aria-label="Xem linh thú Xích Lang">
              <span className="dm-petbadge-pic">
                <PetAnim id="xich_lang" scale={0.62} dir={1} still />
              </span>
              <span>
                <b>Xích Lang</b>
                <small>Lv 14</small>
              </span>
            </button>
          )}
          {inFight && (
            <span className={`dm-fight-pet ${fight.petHit % 2 ? 'hit-a' : fight.petHit ? 'hit-b' : ''}`} key={fight.petHit}>
              <PetAnim id="xich_lang" scale={1.15} dir={1} />
            </span>
          )}
          <button className="strip-btn" aria-label="Chỉ số">
            <StageStrip c={c} compact={(!!pending && scr === 'choi') || inFight} />
          </button>
        </section>

        <div className="game-scroll">
          <LogPanel log={inFight ? fight.log : c.log} />
        </div>

        <footer className="game-bottom">
          {inFight ? (
            <div className="dock-inner dm-fightbar">
              <b className="dm-h">Đang mang</b>
              <div className="dm-fight-cps">
                {[CPS[1], CPS[2]].map((cp, i) => (
                  <span key={cp.id} className={`dm-fcp ${PHAM_CLS[cp.pham]} ${fight.chip === i + 1 ? 'fire' : ''}`}>
                    <Icon src={cp.icon} size={36} />
                    <span>
                      <b>{cp.name}</b>
                      <small>Tầng {cp.tang} · {i === 0 ? '25% thiêu đốt' : '20% hút máu'}</small>
                    </span>
                  </span>
                ))}
                <span className={`dm-fcp pet ${fight.chip === 3 ? 'fire' : ''}`}>
                  <span className="dm-evo-pic sm">
                    <PetAnim id="xich_lang" scale={0.62} dir={1} still />
                  </span>
                  <span>
                    <b>Xích Lang</b>
                    <small>Hộ chủ 30%</small>
                  </span>
                </span>
              </div>
              <div className="dock-actions">
                <button className="btn btn-dark">Bỏ chạy</button>
                <button className="btn btn-dark" onClick={() => setScr('kinh')}>
                  Công pháp
                </button>
              </div>
            </div>
          ) : pending ? (
            <EventCard
              p={pending}
              onChoose={(i) => {
                setPending(null);
                if (i === 0) {
                  setFx([{ id: Date.now(), kind: 'layer', label: 'Lĩnh ngộ: Liệt Hỏa Kiếm Quyết' }]);
                  setTimeout(() => setFx([]), 2400);
                }
              }}
            />
          ) : (
            <div className="dock-inner">
              <OverworkBar c={c} />
              <FocusGrid c={c} onPick={() => {}} />
              <div className="dock-actions dm-four">
                <button className="btn btn-dark">Phường thị</button>
                <button className="btn btn-dark">Túi đồ</button>
                <button className="btn btn-dark dm-new" onClick={() => setScr('kinh')}>
                  Công pháp
                </button>
                <button className="btn btn-jade">Bế quan</button>
              </div>
              <button className="btn dm-again" onClick={() => setPending(KY_NGO)}>
                Xem lại kỳ ngộ nhặt bí kíp
              </button>
            </div>
          )}
        </footer>
      </main>
      {scr === 'kinh' && <KinhScene c={c} onClose={() => setScr('choi')} />}
      {scr === 'thu' && <ThuScene onClose={() => setScr('choi')} />}
    </div>
  );
}
