// Kiểm tra bản dịch: node tools/i18n/check.cjs [file.json ...] (không truyền thì kiểm tất cả)
const fs = require('fs'), path = require('path');
const DATA = path.join(__dirname, 'data');
const all = [];
const walk = (d) => fs.readdirSync(d).forEach((f) => { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.json') && all.push(p); });
walk(DATA);
const files = process.argv.slice(2).length ? process.argv.slice(2).map((f) => path.resolve(f)) : all;
let bad = 0, empty = 0, n = 0;
for (const f of files) {
  let list;
  try { list = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.log('JSON LỖI', f, e.message); bad++; continue; }
  list.forEach((u, i) => {
    n++;
    const where = `${path.relative(DATA, f)} #${i}`;
    if (!u.en || !u.en.trim()) { empty++; return; }
    const need = (u.vi.match(/\{\d+\}/g) || []).sort().join();
    const got = (u.en.match(/\{\d+\}/g) || []).sort().join();
    if (need !== got) { bad++; console.log(`PLACEHOLDER ${where}: vi=${need} en=${got} :: ${u.en.slice(0, 80)}`); }
    if (/^\s/.test(u.vi) !== /^\s/.test(u.en) || /\s$/.test(u.vi) !== /\s$/.test(u.en)) { bad++; console.log(`KHOẢNG TRẮNG ${where}: [${u.vi}] -> [${u.en}]`); }
    if (u.en.includes('—')) { bad++; console.log(`EM DASH ${where}`); }
  });
}
console.log({ items: n, empty, problems: bad });
process.exit(bad ? 1 : 0);
