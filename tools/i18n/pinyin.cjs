// Đổi tên Hán Việt trong phần tiếng Anh của mọi tr(vi, en) sang pinyin (chạy bằng tsx)
const { ts, fs, listFiles } = require('./common.cjs');
const { pinyinize } = require('../../lib/hanviet');
const PROTECT = new Set(['Phổ Đà Sơn', 'Kiếm Cốc', 'Vạn Độc Môn', 'Yêu Thần Điện']);
let n = 0;
for (const f of listFiles()) {
  if (/lib\/hanviet\.ts$/.test(f)) continue;
  let src = fs.readFileSync(f, 'utf8');
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const edits = [];
  const lit = (node) => {
    // các đoạn chữ thô của chuỗi / template, không đụng biểu thức
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [[node.getStart(sf) + 1, node.end - 1]];
    if (ts.isTemplateExpression(node)) {
      const r = [[node.head.getStart(sf) + 1, node.head.end - 2]];
      node.templateSpans.forEach((sp, i) => { const l = sp.literal; const last = i === node.templateSpans.length - 1; r.push([l.getStart(sf) + 1, l.end - (last ? 1 : 2)]); });
      return r;
    }
    return [];
  };
  const v = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'tr' && node.arguments.length === 2) {
      const [a, b] = node.arguments;
      const viText = ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a) ? a.text : null;
      if (!(viText && PROTECT.has(viText))) {
        for (const [s, e] of lit(b)) {
          const raw = src.slice(s, e);
          const conv = pinyinize(raw);
          if (conv !== raw) edits.push([s, e, conv]);
        }
      }
    }
    ts.forEachChild(node, v);
  };
  v(sf);
  if (!edits.length) continue;
  edits.sort((x, y) => y[0] - x[0]).forEach(([s, e, r]) => (src = src.slice(0, s) + r + src.slice(e)));
  fs.writeFileSync(f, src);
  n += edits.length;
}
console.log('đổi', n, 'đoạn');
