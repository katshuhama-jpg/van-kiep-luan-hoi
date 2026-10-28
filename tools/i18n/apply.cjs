// Gắn bản dịch vào mã nguồn: chuỗi tiếng Việt thành tr('vi', 'en'). Chạy được nhiều lần (chuỗi đã bọc tr thì bỏ qua).
// node tools/i18n/apply.cjs [--root DIR]
const { ts, fs, path, listFiles, scan, jsxVisible } = require('./common.cjs');
const argRoot = process.argv.indexOf('--root');
const ROOT = argRoot > 0 ? path.resolve(process.argv[argRoot + 1]) : path.resolve(__dirname, '../..');
const DATA = path.join(__dirname, 'data');
let nFiles = 0, nUnits = 0, nMissing = 0;

const escTpl = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

for (const abs0 of listFiles()) {
  const rel = path.relative(path.resolve(__dirname, '../..'), abs0);
  const abs = path.join(ROOT, rel);
  const jf = path.join(DATA, rel + '.json');
  if (!fs.existsSync(jf)) continue;
  const dict = new Map(JSON.parse(fs.readFileSync(jf, 'utf8')).map((u) => [u.vi, u.en]));
  const { sf, src, units } = scan(abs);
  // bỏ chuỗi đã nằm trong tr(...)
  const live = units.filter((u) => {
    const p = u.node.parent;
    return !(p && ts.isCallExpression(p) && ts.isIdentifier(p.expression) && p.expression.text === 'tr');
  });
  if (!live.length) continue;
  const start = (n) => n.getStart(sf);
  // đơn vị nằm trong đơn vị khác được xử lý khi dựng đơn vị ngoài
  const inside = (a, b) => start(a) >= start(b) && a.end <= b.end && a !== b;
  const top = (list0, lo, hi, ex) => { const list = list0.filter((u) => u !== ex); return list.filter((u) => start(u.node) >= lo && u.node.end <= hi && !list.some((o) => o !== u && start(o.node) >= lo && o.node.end <= hi && inside(u.node, o.node))); };
  const renderRange = (lo, hi, ex) => {
    let out = '';
    let pos = lo;
    for (const u of top(live, lo, hi, ex).sort((a, b) => start(a.node) - start(b.node))) {
      out += src.slice(pos, start(u.node)) + rep(u);
      pos = u.node.end;
    }
    return out + src.slice(pos, hi);
  };
  function rep(u) {
    nUnits++;
    let en = dict.get(u.vi);
    if (!en) { nMissing++; en = u.vi; }
    const n = u.node;
    if (u.kind === 'jsx') {
      const { lead, trail } = jsxVisible(n.text);
      const multi = /\n/.test(n.text);
      const call = `{tr(${JSON.stringify(u.vi)}, ${JSON.stringify(en)})}`;
      return multi ? lead + call + trail : call;
    }
    let viCode, enCode;
    if (ts.isTemplateExpression(n)) {
      viCode = renderRange(start(n), n.end, u);
      const exprs = n.templateSpans.map((sp) => renderRange(start(sp.expression), sp.expression.end));
      enCode = '`' + en.split(/(\{\d+\})/).map((part) => {
        const m = part.match(/^\{(\d+)\}$/);
        return m && exprs[+m[1]] !== undefined ? '${' + exprs[+m[1]] + '}' : escTpl(part);
      }).join('') + '`';
    } else {
      viCode = src.slice(start(n), n.end);
      enCode = JSON.stringify(en);
    }
    const call = `tr(${viCode}, ${enCode})`;
    return u.kind === 'attr' ? `{${call}}` : call;
  }
  let out = renderRange(0, src.length);
  // thêm import tr
  if (!/import \{[^}]*\btr\b[^}]*\} from '[^']*i18n'/.test(out)) {
    const spec = rel.startsWith('lib/') ? (path.relative(path.dirname(rel), 'lib/i18n').replace(/\\/g, '/').replace(/^(?!\.)/, './')) : '@/lib/i18n';
    const imp = `import { tr } from '${spec}';\n`;
    const sf2 = ts.createSourceFile(abs, out, ts.ScriptTarget.Latest, true, abs.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const imports = sf2.statements.filter((s) => ts.isImportDeclaration(s));
    let at = 0;
    if (imports.length) at = imports[imports.length - 1].end + 1;
    else {
      const dir = sf2.statements.find((s) => ts.isExpressionStatement(s) && ts.isStringLiteral(s.expression));
      if (dir) at = dir.end + 1;
    }
    out = out.slice(0, at) + (at && out[at - 1] !== '\n' ? '\n' : '') + imp + out.slice(at);
  }
  fs.writeFileSync(abs, out);
  nFiles++;
}
console.log({ files: nFiles, units: nUnits, missingEn: nMissing });
