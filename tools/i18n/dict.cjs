// Dựng từ điển hai chiều từ mọi tr(vi, en) trong mã: dùng để dịch lại chữ đã lưu (gia phả...) khi đổi ngôn ngữ
const { ts, fs, path, listFiles } = require('./common.cjs');
const out = new Map();
const tpl = (node, sf, names) => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    let s = node.head.text;
    node.templateSpans.forEach((sp) => {
      const k = sp.expression.getText(sf);
      let i = names.indexOf(k);
      if (i < 0) { names.push(k); i = names.length - 1; }
      s += `{${i}}` + sp.literal.text;
    });
    return s;
  }
  return null;
};
for (const f of listFiles()) {
  const src = fs.readFileSync(f, 'utf8');
  if (!src.includes('tr(')) continue;
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const v = (n) => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'tr' && n.arguments.length === 2) {
      const names = [];
      const a = tpl(n.arguments[0], sf, names);
      const nA = names.length;
      const b = tpl(n.arguments[1], sf, names);
      // bỏ cặp có biểu thức chỉ một bên có (không ghép được) và cặp giống hệt
      if (a && b && a !== b && names.length === nA && a.trim() && b.trim()) out.set(a + '\u0000' + b, [a, b]);
    }
    ts.forEachChild(n, v);
  };
  v(sf);
}
const list = [...out.values()];
fs.mkdirSync(path.join(__dirname, '../../public'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../../public/i18n-dict.json'), JSON.stringify(list));
console.log('cặp', list.length, 'KB', Math.round(JSON.stringify(list).length / 1024));
