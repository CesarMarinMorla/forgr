import { chromium } from 'playwright-core';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { BROWSERS_PATH, getChromiumInstallCmd, getHeadlessShellPath, removeFfmpeg } from './browsers-path.js';
import { PRESET_MERMAID_THEMES } from './themes/index.js';
import { ChromiumNotFoundError } from './errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MERMAID_DIST = path.resolve(__dirname, '..', 'node_modules', 'mermaid', 'dist', 'mermaid.min.js');

const RENDER_DEFAULTS = {
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: '<div style="width:100%; font-family:Menlo,monospace; font-size:7px; color:#666; text-align:center; padding:0 2cm;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  viewport: { width: 720, height: 720 },
};

async function ensureChromium({ onProgress } = {}) {
  const execPath = getHeadlessShellPath();
  if (execPath && existsSync(execPath)) return;

  if (onProgress) {
    onProgress('Downloading Chromium (one-time, ~100MB)...');
  } else {
    console.log('');
    console.log('  Downloading Chromium for PDF rendering (one-time, ~100MB)...');
    console.log('');
  }

  try {
    execSync(getChromiumInstallCmd(), {
      stdio: onProgress ? 'pipe' : 'inherit',
      env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: BROWSERS_PATH },
    });
    await removeFfmpeg();
    if (onProgress) {
      onProgress('Downloaded Chromium');
    } else {
      console.log('');
      console.log('  \u2713 Chromium downloaded successfully.');
      console.log('');
    }
   } catch {
    throw new ChromiumNotFoundError();
  }
}

export function countPdfPages(buffer) {
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

export function contentHeight(paperFormat) {
  const mm = paperFormat === 'Letter' ? 279 : 297;
  return Math.round((mm - 40) * (96 / 25.4));
}

export async function computeHeadingPages(page, paperFormat) {
  const pageHeight = contentHeight(paperFormat);
  return page.evaluate((h) => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6[id]');
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    return Array.from(headings).map(el => {
      const rect = el.getBoundingClientRect();
      const y = rect.top + scrollTop;
      return {
        id: el.id,
        page: Math.floor(y / h) + 1,
      };
    });
  }, pageHeight);
}

export function buildFooterTemplates(footer, render) {
  const displayHeaderFooter = footer !== 'none';
  let footerTemplate = '';
  if (footer === 'page-x-of-y') {
    footerTemplate = '<div style="width:100%; font-family:Menlo,monospace; font-size:7px; color:#666; text-align:center; padding:0 2cm;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>';
  } else if (footer === 'page-numbers') {
    footerTemplate = '<div style="width:100%; font-family:Menlo,monospace; font-size:7px; color:#666; text-align:center; padding:0 2cm;"><span class="pageNumber"></span></div>';
  }
  return { displayHeaderFooter, headerTemplate: render.headerTemplate, footerTemplate };
}

export function generatePdfOptions(paperFormat, margins, render) {
  return {
    format: paperFormat,
    printBackground: render.printBackground,
    margin: margins,
    displayHeaderFooter: render.displayHeaderFooter,
    headerTemplate: render.headerTemplate,
    footerTemplate: render.footerTemplate,
  };
}

export async function generatePdf(html, outputPath, opts = {}) {
  const { captureHeadings, preset, paperFormat, margins, footer, onProgress } = opts;

  assertWritableDir(path.dirname(outputPath));
  await ensureChromium({ onProgress });

  let browser;
  try {
    if (onProgress) onProgress('Launching browser...');
    browser = await launchBrowser(getHeadlessShellPath());
    const page = await browser.newPage();

    if (captureHeadings) {
      await page.setViewportSize(RENDER_DEFAULTS.viewport);
    }

    if (onProgress) onProgress('Rendering page...');
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    if (await hasMermaidDiagrams(page)) {
      if (onProgress) onProgress('Rendering mermaid diagrams...');
      await renderMermaid(page, preset);
    }

    if (onProgress) onProgress('Waiting for fonts...');
    await page.evaluate(() => document.fonts.ready);

    const headingPages = captureHeadings ? await computeHeadingPages(page, paperFormat) : [];
    if (onProgress) onProgress('Generating PDF...');
    const renderOpts = footer
      ? { ...RENDER_DEFAULTS, ...buildFooterTemplates(footer, RENDER_DEFAULTS) }
      : RENDER_DEFAULTS;
    const pdfBuffer = await page.pdf(generatePdfOptions(paperFormat, margins, renderOpts));
    const pageCount = countPdfPages(pdfBuffer);
    if (onProgress) onProgress('Writing file...');
    await fs.writeFile(outputPath, pdfBuffer);

    return { pageCount, headingPages };
  } catch (err) {
    await fs.remove(outputPath).catch(() => {});
    throw new Error(`failed to generate PDF: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }
}
