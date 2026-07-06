import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, '../src/assets/fonts');

async function b64(file) {
  const buf = await readFile(path.join(FONTS_DIR, file)).catch(() => null);
  return buf ? buf.toString('base64') : null;
}

const [plexSans, plexMono400, plexMono600, jetbrainsMono, urbanist] = await Promise.all([
  b64('IBMPlexSans-Variable.woff2'),
  b64('IBMPlexMono-400.woff2'),
  b64('IBMPlexMono-600.woff2'),
  b64('JetBrainsMono-Regular.woff2'),
  b64('Urbanist-Variable.woff2'),
]);

const numbers = '01';
const words = 'EXECUTIVE SUMMARY';

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @font-face { font-family: 'IBM Plex Sans'; src: url('data:font/woff2;base64,${plexSans}') format('woff2'); font-weight: 100 700; }
  @font-face { font-family: 'IBM Plex Mono'; src: url('data:font/woff2;base64,${plexMono400}') format('woff2'); font-weight: 400; }
  @font-face { font-family: 'IBM Plex Mono'; src: url('data:font/woff2;base64,${plexMono600}') format('woff2'); font-weight: 600; }
  @font-face { font-family: 'JetBrains Mono'; src: url('data:font/woff2;base64,${jetbrainsMono}') format('woff2'); font-weight: 400; }
  @font-face { font-family: 'Urbanist'; src: url('data:font/woff2;base64,${urbanist}') format('woff2'); font-weight: 100 900; }

  body { font-size: 14px; padding: 40px; background: #fff; color: #1C2128; line-height: 1.8; }
  .row { margin-bottom: 28px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
  .label { font-family: sans-serif; font-size: 10px; color: #999; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
  .heading { display: flex; align-items: baseline; gap: 10px; font-size: 18px; }
  .num { color: #1C756E; }
  .txt { text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; }
</style>
</head>
<body>

  <div class="row">
    <div class="label">num: JetBrains Mono 400 / text: IBM Plex Sans 700</div>
    <div class="heading">
      <span class="num" style="font-family:'JetBrains Mono',monospace;font-weight:400">${numbers}</span>
      <span class="txt" style="font-family:'IBM Plex Sans',sans-serif">${words}</span>
    </div>
  </div>

  <div class="row">
    <div class="label">num: JetBrains Mono 400 / text: Urbanist 700</div>
    <div class="heading">
      <span class="num" style="font-family:'JetBrains Mono',monospace;font-weight:400">${numbers}</span>
      <span class="txt" style="font-family:'Urbanist',sans-serif">${words}</span>
    </div>
  </div>

  <div class="row">
    <div class="label">num: IBM Plex Mono 400 / text: Urbanist 700</div>
    <div class="heading">
      <span class="num" style="font-family:'IBM Plex Mono',monospace;font-weight:400">${numbers}</span>
      <span class="txt" style="font-family:'Urbanist',sans-serif">${words}</span>
    </div>
  </div>

  <div class="row">
    <div class="label">num: IBM Plex Mono 600 / text: Urbanist 700</div>
    <div class="heading">
      <span class="num" style="font-family:'IBM Plex Mono',monospace;font-weight:600">${numbers}</span>
      <span class="txt" style="font-family:'Urbanist',sans-serif">${words}</span>
    </div>
  </div>

  <div class="row">
    <div class="label">num: IBM Plex Mono 400 / text: IBM Plex Sans 700</div>
    <div class="heading">
      <span class="num" style="font-family:'IBM Plex Mono',monospace;font-weight:400">${numbers}</span>
      <span class="txt" style="font-family:'IBM Plex Sans',sans-serif">${words}</span>
    </div>
  </div>

  <div class="row">
    <div class="label">num: JetBrains Mono 400 / text: JetBrains Mono 400 uppercase (all mono)</div>
    <div class="heading">
      <span class="num" style="font-family:'JetBrains Mono',monospace;font-weight:400">${numbers}</span>
      <span class="txt" style="font-family:'JetBrains Mono',monospace;font-weight:400">${words}</span>
    </div>
  </div>

  <div class="row">
    <div class="label">num: IBM Plex Mono 400 / text: IBM Plex Mono 400 uppercase (all mono)</div>
    <div class="heading">
      <span class="num" style="font-family:'IBM Plex Mono',monospace;font-weight:400">${numbers}</span>
      <span class="txt" style="font-family:'IBM Plex Mono',monospace;font-weight:400">${words}</span>
    </div>
  </div>

</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'domcontentloaded' });
await page.pdf({
  path: 'test/fixtures/font-diagnostic.pdf',
  format: 'A4',
  printBackground: true,
  margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' },
});
await browser.close();
console.log('Written: test/fixtures/font-diagnostic.pdf');
