'use client';

import { useState } from 'react';
import type { QuizRun } from '@/lib/game/quiz';

/** Tàng Kinh Các khảo thí: 3 câu hỏi kiếm hiệp, bắt buộc trả lời, không đóng được */
export default function QuizOverlay({ run, onDone }: { run: QuizRun; onDone: (right: number) => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const q = run.qs[i];
  const last = i === run.qs.length - 1;

  const pick = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    if (k === q.ok) setRight((r) => r + 1);
  };
  const next = () => {
    if (last) {
      onDone(right);
      return;
    }
    setI(i + 1);
    setPicked(null);
  };

  return (
    <div className="quiz-wrap" role="dialog" aria-modal="true" aria-labelledby="quiz-title">
      <div className="quiz panel">
        <div className="quiz-head">
          <h2 id="quiz-title">Tàng Kinh Các khảo thí</h2>
          <span className="quiz-step">
            Câu {i + 1}/{run.qs.length}
          </span>
        </div>
        {i === 0 && picked === null && <p className="note quiz-intro">Trưởng lão chặn bạn lại: &quot;Người tu đạo phải thông kim bác cổ. Trả lời ta ba câu!&quot;</p>}
        <p className="quiz-q">{q.q}</p>
        <div className="quiz-opts">
          {q.opts.map((o, k) => {
            const cls = picked === null ? '' : k === q.ok ? 'ok' : k === picked ? 'bad' : 'dim';
            return (
              <button key={k} className={`btn quiz-opt ${cls}`} onClick={() => pick(k)} disabled={picked !== null}>
                {o}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <div className={`quiz-note ${picked === q.ok ? 'ok' : 'bad'}`} aria-live="polite">
            <b>{picked === q.ok ? 'Đúng rồi!' : 'Sai rồi.'}</b> {q.note}
          </div>
        )}
        {picked !== null && (
          <button className="btn btn-red btn-big quiz-next" onClick={next}>
            {last ? `Xong (${right}/${run.qs.length} đúng)` : 'Câu tiếp'}
          </button>
        )}
      </div>
    </div>
  );
}
