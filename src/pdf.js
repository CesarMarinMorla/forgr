import { chromium } from 'playwright-core';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { BROWSERS_PATH, getChromiumInstallCmd, getHeadlessShellPath, removeFfmpeg } from './browsers-path.js';
import { DEFAULTS } from './config.js';
import { PRESET_MERMAID_THEMES } from './themes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MERMAID_DIST = path.resolve(__dirname, '..', 'node_modules', 'mermaid', 'dist', 'mermaid.min.js');

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
    execSync(getChromiumInstallCmd(), {
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

export function assertWritableDir(dirPath) {
  try {
    fs.accessSync(dirPath, fs.constants.W_OK);
  } catch {
    throw new Error(`output directory is not writable: ${dirPath}`);
  }
}

export async function launchBrowser(executablePath) {
  try {
    return await chromium.launch({ executablePath });
  } catch (err) {
    throw new Error(`failed to launch Chromium: ${err.message}. Try running: npm run install-chromium`);
  }
}

export async function hasMermaidDiagrams(page) {
  return page.evaluate(() => document.querySelector('.mermaid') !== null);
}

export async function renderMermaid(page, preset) {
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

export async function computeHeadingPages(page) {
  return page.evaluate((pageHeight) => {
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

export function generatePdfOptions(paperFormat, margins, _pdf) {
  return {
    format: paperFormat,
    printBackground: _pdf.printBackground,
    margin: margins,
    displayHeaderFooter: _pdf.displayHeaderFooter,
    headerTemplate: _pdf.headerTemplate,
    footerTemplate: _pdf.footerTemplate,
  };
}

// The content height of an A4 page with 2cm margins, in CSS pixels at 96dpi:
// 297mm - 40mm = 257mm, at 96/25.4 px/mm ≈ 971px
const A4_CONTENT_HEIGHT = 971;

export async function generatePdf(html, outputPath, opts = {}) {
  const { captureHeadings, preset, paperFormat, margins } = opts;
  const _pdf = DEFAULTS._pdf;

  assertWritableDir(path.dirname(outputPath));
  await ensureChromium();

  let browser;
  try {
    browser = await launchBrowser(getHeadlessShellPath());
    const page = await browser.newPage();

    if (captureHeadings) {
      await page.setViewportSize(_pdf.viewport);
    }

    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    if (await hasMermaidDiagrams(page)) {
      await renderMermaid(page, preset);
    }

    await page.evaluate(() => document.fonts.ready);

    const headingPages = captureHeadings ? await computeHeadingPages(page) : [];
    const pdfBuffer = await page.pdf(generatePdfOptions(paperFormat, margins, _pdf));
    const pageCount = countPdfPages(pdfBuffer);
    await fs.writeFile(outputPath, pdfBuffer);

    return { pageCount, headingPages };
  } catch (err) {
    await fs.remove(outputPath).catch(() => {});
    throw new Error(`failed to generate PDF: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }
}
