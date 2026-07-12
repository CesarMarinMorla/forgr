import { chromium } from 'playwright-core';
import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { rm } from 'fs/promises';
import fs from 'fs-extra';
import path from 'path';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { platform } from 'os';
import { BROWSERS_PATH } from './browsers-path.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MERMAID_DIST = path.resolve(__dirname, '..', 'node_modules', 'mermaid', 'dist', 'mermaid.min.js');

const PRESET_MERMAID_THEMES = {
  terminal: {
    theme: 'base',
    themeVariables: {
      primaryColor: '#2DD4BF',
      lineColor: '#0F766E',
      textColor: '#1C2128',
      mainBkg: '#ECFDFB',
      nodeBorder: '#0F766E',
    },
  },
  minimal: {
    theme: 'base',
    themeVariables: {
      primaryColor: '#666666',
      lineColor: '#111111',
      textColor: '#111111',
      mainBkg: '#FAFAFA',
      nodeBorder: '#111111',
    },
  },
  technical: {
    theme: 'base',
    themeVariables: {
      primaryColor: '#C2410C',
      lineColor: '#7C2D12',
      textColor: '#1F1B16',
      mainBkg: '#FFF7ED',
      nodeBorder: '#7C2D12',
    },
  },
  academic: {
    theme: 'base',
    themeVariables: {
      primaryColor: '#2E4F6B',
      lineColor: '#1B3349',
      textColor: '#1A1714',
      mainBkg: '#FFFFFF',
      nodeBorder: '#2E4F6B',
    },
  },
};

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
    throw new Error('failed to download Chromium. Try running: npm run install-chromium');
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

export async function generatePdf(html, outputPath, { captureHeadings, preset } = {}) {
  const outputDir = path.dirname(outputPath);
  try {
    await fs.access(outputDir, fs.constants.W_OK);
  } catch {
    throw new Error(`output directory is not writable: ${outputDir}`);
  }

  await ensureChromium();

  const executablePath = getHeadlessShellPath();

  let browser;
  try {
    browser = await chromium.launch({ executablePath });
  } catch (err) {
    throw new Error(`failed to launch Chromium: ${err.message}. Try running: npm run install-chromium`);
  }

  const page = await browser.newPage();

  try {
    if (captureHeadings) {
      // Match the body max-width used by presets so on-screen and print
      // layouts align closely for heading-position calculations
      await page.setViewportSize({ width: 720, height: 720 });
    }

    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const hasMermaid = await page.evaluate(() => document.querySelector('.mermaid') !== null);
    if (hasMermaid) {
      await page.addScriptTag({ path: MERMAID_DIST });

      const mermaidConfig = PRESET_MERMAID_THEMES[preset] || PRESET_MERMAID_THEMES.terminal;
      await page.evaluate((config) => {
        mermaid.initialize(config);
      }, mermaidConfig);

      const errors = await page.evaluate(async () => {
        const errorMessages = [];
        const els = document.querySelectorAll('.mermaid');
        for (const el of els) {
          try {
            const { svg } = await mermaid.render('mermaid_' + Math.random().toString(36).slice(2, 8), el.textContent.trim());
            el.innerHTML = svg;
          } catch (e) {
            errorMessages.push(e.message || String(e));
          }
        }
        return errorMessages;
      });

      if (errors.length > 0) {
        throw new Error(`mermaid: ${errors.length} diagram(s) failed to render: ${errors.join('; ')}`);
      }
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
    throw new Error(`failed to generate PDF: ${err.message}`);
  } finally {
    await browser.close();
  }
}
