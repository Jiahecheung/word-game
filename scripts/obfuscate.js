/* ─────────────────────────────────────────────────────────────────────
   scripts/obfuscate.js
   读取  public/neshama.html (源码,你可读可编辑)
   输出  public/neshama.html  本身被替换为混淆版,但源码会先备份到
         public/neshama.source.html (gitignore 进去更稳)

   构建流程: next build 之前会先跑这个脚本。
   本地开发想看效果: npm run obf 然后用浏览器打开 public/neshama.html。
   恢复源码: 把 neshama.source.html 复制回 neshama.html 即可。
   ───────────────────────────────────────────────────────────────────── */

const fs = require('fs');
const path = require('path');
const JO = require('javascript-obfuscator');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const TARGET     = path.join(PUBLIC_DIR, 'neshama.html');
const SOURCE     = path.join(PUBLIC_DIR, 'neshama.source.html');

// ── 第一步: 准备源码 ─────────────────────────────────────────────────
// 如果还没有 .source.html 备份,把当前 neshama.html 当作源码备份一份。
// 如果已经有 .source.html,说明上次混淆过,这次以 .source.html 为准。
if (!fs.existsSync(SOURCE)) {
  if (!fs.existsSync(TARGET)) {
    console.error('✗ public/neshama.html 不存在,跳过混淆');
    process.exit(0);
  }
  fs.copyFileSync(TARGET, SOURCE);
  console.log('• 首次运行,已把 neshama.html 备份为 neshama.source.html');
}

// 永远从 SOURCE 读,避免反复混淆已混淆的代码
let html = fs.readFileSync(SOURCE, 'utf8');

// ── 第二步: 抓出所有 <script>...</script> 块,逐块判断是否混淆 ────────
let count = 0;
html = html.replace(/<script>([\s\S]*?)<\/script>/g, (m, code) => {
  // 太短的脚本(比如域名锁)不混淆,本身就要让它早早执行
  if (code.length < 500) return m;

  // 已带标记的(意外情况)跳过
  if (code.indexOf('__OBF__') !== -1) return m;

  let out;
  try {
    out = JO.obfuscate(code, {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.6,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.3,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayThreshold: 0.75,
      splitStrings: true,
      splitStringsChunkLength: 8,
      identifierNamesGenerator: 'mangled-shuffled',
      selfDefending: true,
      transformObjectKeys: true,
      numbersToExpressions: true,
      simplify: true,
      renameGlobals: false, // 不要碰全局变量,会把 DOM API 搞坏
      reservedNames: [],
      target: 'browser',
    }).getObfuscatedCode();
  } catch (e) {
    console.error('✗ 某段 script 混淆失败,保留原文:', e.message);
    return m;
  }

  count++;
  return '<script>/*__OBF__*/' + out + '</script>';
});

// ── 第三步: 写回 neshama.html ───────────────────────────────────────
fs.writeFileSync(TARGET, html, 'utf8');
console.log(`✓ 混淆完成,共处理 ${count} 段 <script>。已写入 public/neshama.html`);
console.log('  源码原样保存在 public/neshama.source.html');
