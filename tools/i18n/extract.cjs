// Tách chữ tiếng Việt ra tools/i18n/data/<file>.json để dịch; giữ bản dịch cũ nếu đã có
const { fs, path, ROOT, listFiles, scan } = require('./common.cjs');
const OUT = path.join(ROOT, 'tools/i18n/data');
let total = 0, chars = 0, files = 0;
const skipRep = [];
for (const f of listFiles()) {
  const { units, skipped } = scan(f);
  const rel = path.relative(ROOT, f);
  skipped.forEach((s) => skipRep.push(`${rel}:${s.line} [${s.why}] ${s.vi.slice(0, 90)}`));
  if (!units.length) continue;
  const jf = path.join(OUT, rel + '.json');
  const old = fs.existsSync(jf) ? JSON.parse(fs.readFileSync(jf, 'utf8')) : [];
  const oldMap = new Map(old.map((u) => [u.vi, u.en]));
  // gộp chuỗi trùng trong cùng file
  const seen = new Map();
  for (const u of units) {
    if (!seen.has(u.vi)) seen.set(u.vi, { vi: u.vi, ph: u.ph.length ? u.ph : undefined, en: oldMap.get(u.vi) ?? '' });
  }
  const list = [...seen.values()];
  fs.mkdirSync(path.dirname(jf), { recursive: true });
  fs.writeFileSync(jf, JSON.stringify(list, null, 1));
  total += list.length; chars += list.reduce((s, u) => s + u.vi.length, 0); files++;
}
fs.writeFileSync(path.join(ROOT, 'tools/i18n/skipped.txt'), skipRep.join('\n'));
console.log({ files, units: total, chars, skipped: skipRep.length });
