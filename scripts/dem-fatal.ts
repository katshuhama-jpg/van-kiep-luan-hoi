/** Đếm sự kiện phàm giới có lựa chọn gọi fatal (hoặc gamble) mà chưa có trần cảnh giới (maxRealm) hay ngưỡng phàm tục (pham). 4.1.0 Q2.
 * Chạy: npx tsx scripts/dem-fatal.ts [all] */
import { EVENTS } from '../lib/game/events';
const all = process.argv[2] === 'all';
const rows: string[] = [];
for (const e of EVENTS) {
  if (e.cosmos) continue;
  const src = e.choices.toString();
  if (!/(fatal|gamble)\)?\(/.test(src)) continue;
  if (!all && (e.maxRealm !== undefined || e.pham !== undefined)) continue;
  const m = [...src.matchAll(/(?:fatal|gamble)\)?\([^,]+,[^,]+,\s*([^,]+),/g)].map((x) => x[1].trim().slice(0, 30));
  rows.push(`${e.id.padEnd(22)} r${e.minRealm ?? 0}-${e.maxRealm ?? '∞'} pham=${e.pham ?? '-'} ${e.title.slice(0, 32).padEnd(32)} ${m.join(' | ')}`);
}
console.log(rows.length);
console.log(rows.join('\n'));
