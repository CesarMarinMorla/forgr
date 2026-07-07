import { chromium } from 'playwright-core';
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
    execSync('npx playwright-core install chromium-headless-shell', {
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

function countPdfPages(buffer) {
  const text = buffer.toString();
  const matches = text.match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : 0;
}

// The content height of an A4 page with 2cm margins, in CSS pixels at 96dpi:
// 297mm - 40mm = 257mm, at 96/25.4 px/mm ≈ 971px
const A4_CONTENT_HEIGHT = 971;

export async function generatePdf(html, outputPath, { captureHeadings } = {}) {
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
    if (captureHeadings) {
      // Match the body max-width used by presets so on-screen and print
      // layouts align closely for heading-position calculations
      await page.setViewportSize({ width: 720, height: 720 });
    }

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

    // Capture heading positions before generating PDF so we can determine
    // which page each heading lands on for the table of contents
    let headingPages = [];
    if (captureHeadings) {
      headingPages = await page.evaluate((pageHeight) => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6[id]');
        const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
        return Array.from(headings).map(h => {
          const rect = h.getBoundingClientRect();
          const y = rect.top + scrollTop;
          return {
            id: h.id,
            page: Math.floor(y / pageHeight) + 1,
          };
        });
      }, A4_CONTENT_HEIGHT);
    }

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: '<div style="width:100%; font-family:Menlo,monospace; font-size:7px; color:#666; text-align:center; padding:0 2cm;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    });

    const pageCount = countPdfPages(pdfBuffer);
    await fs.writeFile(outputPath, pdfBuffer);
    return { pageCount, headingPages };
  } catch (err) {
    await fs.remove(outputPath).catch(() => {});
    console.error(`Error generating PDF: ${err.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}
