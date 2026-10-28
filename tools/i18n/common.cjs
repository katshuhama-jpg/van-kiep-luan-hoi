// Dùng chung cho extract và apply: tìm các đơn vị chữ tiếng Việt cần dịch trong mã nguồn
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const VN = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹĂÂĐÊÔƠƯÀÁẠẢÃẰẮẶẲẴẦẤẬẨẪÈÉẸẺẼỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕỒỐỘỔỖỜỚỢỞỠÙÚỤỦŨỪỨỰỬỮỲÝỴỶỸ]/;
const SKIP_CALLS = new Set(['includes', 'startsWith', 'endsWith', 'indexOf', 'lastIndexOf', 'replace', 'replaceAll', 'split', 'match', 'test', 'getItem', 'setItem', 'removeItem', 'rpc', 'eq', 'track', 'querySelector', 'RegExp', 'require', 'tr', 'localeCompare']);
const SKIP_FILES = [/\/tools\//, /\.d\.ts$/, /lib\/i18n\.ts$/];

function listFiles() {
  const out = [];
  const walk = (d) => {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(f) && !SKIP_FILES.some((r) => r.test(p))) out.push(p);
    }
  };
  for (const d of ['app', 'components', 'lib']) walk(path.join(ROOT, d));
  return out.sort();
}

/** Lý do bỏ qua một chuỗi (dùng để so sánh, làm khóa...), hoặc null nếu cần dịch */
function skipReason(node) {
  const p = node.parent;
  if (!p) return 'root';
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p)) return 'import';
  if ((ts.isPropertyAssignment(p) || ts.isPropertyDeclaration(p) || ts.isMethodDeclaration(p) || ts.isPropertySignature(p) || ts.isEnumMember(p)) && p.name === node) return 'key';
  if (ts.isComputedPropertyName(p)) return 'key';
  if (ts.isLiteralTypeNode(p)) return 'type';
  if (ts.isElementAccessExpression(p) && p.argumentExpression === node) return 'index';
  if (ts.isCaseClause(p)) return 'case';
  if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.InKeyword].includes(p.operatorToken.kind)) return 'compare';
  if (ts.isCallExpression(p) || ts.isNewExpression(p)) {
    const e = p.expression;
    const name = ts.isPropertyAccessExpression(e) ? e.name.text : ts.isIdentifier(e) ? e.text : '';
    // replace(chuỗi cần tìm, chuỗi thay vào): chỉ giữ nguyên chuỗi cần tìm
    if ((name === 'replace' || name === 'replaceAll') && ts.isCallExpression(p) && p.arguments[0] !== node) return null;
    if (SKIP_CALLS.has(name)) return 'call:' + name;
    if (ts.isPropertyAccessExpression(e) && ts.isIdentifier(e.expression) && e.expression.text === 'console') return 'console';
  }
  return null;
}

// chữ tiếng Việt không dấu vẫn hiện ra màn hình (rà bằng tay), theo từng file
const FORCE = {
  'components/ArenaMatch.tsx': ['Kim', 'thua', 'THUA'],
  'components/GiangHo.tsx': [' thua, '],
  'components/Panels.tsx': ['Tu vi', 'Ma'],
  'lib/game/arenaFight.ts': ['Kim'],
  'lib/game/combat.ts': ['Tinh Anh '],
  'lib/game/cosmosEvents.ts': ['tu vi'],
  'lib/game/data.ts': ['Ma tu', 'Thanh Sam'],
  'lib/game/events2.ts': ['tu vi'],
  'lib/game/events3.ts': ['Linh chi', 'tu vi'],
  'lib/game/forge.ts': ['Kim'],
  'lib/game/gacha.ts': ['Linh', 'Tham lam'],
  'lib/game/gear.ts': ['Kinh Kim Cang'],
  'lib/game/nguhanh.ts': ['Kim'],
  'lib/game/pets.ts': ['kim phong'],
  'lib/game/sectEvents.ts': ['tu vi'],
  'lib/game/sectEvents2.ts': ['tu vi'],
  'lib/game/wuxiaChat.ts': ['Kim'],
  'lib/shareCard.ts': ['thua'],
  'lib/lifeCard.ts': ['LINH'],
  'components/Extras.tsx': ['Khung'],
  'components/LifeStory.tsx': ['tam'],
};
let curFile = '';
const forced = (t) => (FORCE[curFile] || []).includes(t) || (FORCE[curFile] || []).includes(t.trim());

function isUnitNode(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return VN.test(node.text) || forced(node.text);
  if (ts.isTemplateExpression(node)) return VN.test(node.head.text) || node.templateSpans.some((s) => VN.test(s.literal.text));
  if (ts.isJsxText(node)) return VN.test(node.text) || forced(node.text);
  return false;
}

/** Chữ hiển thị của JSXText theo luật JSX (bỏ khoảng trắng đầu cuối các dòng) */
function jsxVisible(raw) {
  if (!/\n/.test(raw)) return { text: raw, lead: '', trail: '' };
  const lines = raw.split(/\r?\n/);
  const kept = lines.map((l, i) => {
    let s = l.replace(/\t/g, ' ');
    if (i > 0) s = s.replace(/^\s+/, '');
    if (i < lines.length - 1) s = s.replace(/\s+$/, '');
    return s;
  }).filter((s) => s.length);
  const lead = raw.match(/^\s*/)[0];
  const trail = raw.match(/\s*$/)[0];
  // khoảng trắng không có xuống dòng thì đã nằm trong chữ hiển thị
  return { text: kept.join(' '), lead: lead.includes('\n') ? lead : '', trail: trail.includes('\n') ? trail : '' };
}

/** Văn bản tiếng Việt của một đơn vị, placeholder {0} {1} cho biểu thức */
function unitText(node, sf) {
  if (ts.isJsxText(node)) return { vi: jsxVisible(node.text).text, ph: [] };
  if (ts.isTemplateExpression(node)) {
    let s = node.head.text;
    const ph = [];
    node.templateSpans.forEach((sp, i) => {
      s += `{${i}}` + sp.literal.text;
      ph.push(sp.expression.getText(sf));
    });
    return { vi: s, ph };
  }
  return { vi: node.text, ph: [] };
}

function scan(file) {
  curFile = path.relative(ROOT, file).replace(/^.*?(app|components|lib)\//, '$1/');
  const src = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const units = [];
  const skipped = [];
  const visit = (node) => {
    if (isUnitNode(node)) {
      const why = ts.isJsxText(node) ? null : skipReason(node);
      const { vi, ph } = unitText(node, sf);
      const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
      if (why) skipped.push({ line, why, vi });
      else if (vi.trim()) units.push({ node, vi, ph, line, kind: ts.isJsxText(node) ? 'jsx' : ts.isJsxAttribute(node.parent) ? 'attr' : 'str' });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { sf, src, units, skipped };
}

module.exports = { ts, fs, path, ROOT, VN, listFiles, scan, jsxVisible };
