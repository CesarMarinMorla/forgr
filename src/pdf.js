import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { rm } from 'fs/promises';
import fs from 'fs-extra';
import path from 'path';
import { join } from 'path';
import { platform } from 'os';
import { BROWSERS_PATH } from './browsers-path.js';

function getHeadlessShellPath() {
  let entries;
  try {
    entries = readdirSync(BROWSERS_PATH).filter(e => e.startsWith('chromium_headless_shell-'));
  } catch {
    return null;
  }
  if (!entries.length) return null;

  const base = join(BROWSERS_PATH, entries[0]);
  switch (platform()) {
    case 'darwin':
      return join(base, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell');
    case 'linux':
      return join(base, 'chrome-headless-shell-linux-x64', 'chrome-headless-shell');
    case 'win32':
      return join(base, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe');
    default:
      return null;
  }
}

async function removeFfmpeg() {
  let entries;
  try {
    entries = readdirSync(BROWSERS_PATH);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.startsWith('ffmpeg-')) {
      await rm(join(BROWSERS_PATH, entry), { recursive: true, force: true });
    }
  }
}

let chromiumChecked = false;

async function ensureChromium() {
  if (chromiumChecked) return;
  chromiumChecked = true;

  const execPath = getHeadlessShellPath();
  if (execPath && existsSync(execPath)) return;

  console.log('');
  console.log('  Downloading Chromium for PDF rendering (one-time, ~100MB)...');
  console.log('');

  try {
    execSync('npx playwright install chromium-headless-shell', {
      stdio: 'inherit',
      env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: BROWSERS_PATH },
    });
    // Playwright unconditionally downloads FFmpeg alongside any browser install.
    // forgr never uses FFmpeg — remove it to keep the install footprint minimal.
    await removeFfmpeg();
    console.log('');
    console.log('  ✓ Chromium downloaded successfully.');
    console.log('');
  } catch {
    console.error('');
    console.error('  Failed to download Chromium.');
    console.error('');
    console.error('  Try running: npm run install-chromium');
    console.error('');
    process.exit(1);
  }
}

export async function generatePdf(html, outputPath) {
  const outputDir = path.dirname(outputPath);
  try {
    await fs.access(outputDir, fs.constants.W_OK);
  } catch {
    console.error(`Error: output directory is not writable: ${outputDir}`);
    process.exit(1);
  }

  await ensureChromium();

  const executablePath = getHeadlessShellPath();

  let browser;
  try {
    browser = await chromium.launch({ executablePath });
  } catch (err) {
    console.error('');
    console.error(`  Failed to launch Chromium: ${err.message}`);
    console.error('');
    console.error('  Try running: npm run install-chromium');
    console.error('');
    process.exit(1);
  }

  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    // Run mermaid unconditionally — resolves immediately when no .mermaid divs are present
    await page.evaluate(async () => {
      if (typeof mermaid === 'undefined') return;
      window.mermaidReady = false;
      await mermaid.run({ querySelector: '.mermaid' });
      window.mermaidReady = true;
    });

    if (await page.evaluate(() => typeof mermaid !== 'undefined')) {
      await page.waitForFunction(() => window.mermaidReady === true, { timeout: 15000 });
    }

    await page.evaluate(() => document.fonts.ready);

    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' },
    });
  } catch (err) {
    await fs.remove(outputPath).catch(() => {});
    console.error(`Error generating PDF: ${err.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}
