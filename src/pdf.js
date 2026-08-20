import { chromium } from 'playwright-core';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import fs from 'fs-extra';
import path from 'path';
import { createRequire } from 'module';
import { BROWSERS_PATH, getChromiumInstallCmd, getHeadlessShellPath, removeFfmpeg } from './browsers-path.js';
import { PRESET_MERMAID_THEMES } from './themes/index.js';
import { ChromiumNotFoundError } from './errors.js';
import {
  contentHeight,
  contentSize,
  toPx,
  MAX_DIAGRAM_HEIGHT_RATIO,
  WHOLE_PAGE_RATIO,
  MAX_WIDTH_RATIO,
  LEGIBILITY_SCALE_FLOOR,
  DIAGRAM_FONT_REDUCTION,
  MIN_DIAGRAM_FONT,
  MIN_READABLE_TEXT,
} from './layout.js';

const _require = createRequire(import.meta.url);
const MERMAID_DIST = _require.resolve('mermaid/dist/mermaid.min.js');

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

export async function renderMermaid(page, preset, { maxWidth, maxHeight, wholePageHeight, allowWholePage, pageHeight } = {}) {
  const hasMermaidLib = await page.evaluate(() => typeof window.mermaid !== 'undefined');
  if (!hasMermaidLib) {
    await page.addScriptTag({ path: MERMAID_DIST });
  }

  const mermaidConfig = PRESET_MERMAID_THEMES[preset] || PRESET_MERMAID_THEMES.terminal;
  await page.evaluate((config) => {
    mermaid.initialize({ startOnLoad: false, ...config });
  }, mermaidConfig);

  const result = await page.evaluate(async (opts) => {
    const { theme, maxWidth, maxHeight, wholePageHeight, allowWholePage, scaleFloor, fontReduction, minFont, minReadable, pageHeight } = opts;
    const baseFont = theme.themeVariables?.fontSize ?? 16;
    const contentBBox = (svg) => {
      const vb = svg.viewBox.baseVal;
      const srect = svg.getBoundingClientRect();
      if (!vb || vb.width <= 0 || vb.height <= 0 || srect.width <= 0 || srect.height <= 0) {
        return vb && vb.width > 0 && vb.height > 0
          ? { x: vb.x, y: vb.y, width: vb.width, height: vb.height }
          : null;
      }
      const scaleX = srect.width / vb.width;
      const scaleY = srect.height / vb.height;
      let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
      const kids = svg.querySelectorAll(
        'path,rect,ellipse,circle,text,polygon,polyline,line,use,image,foreignObject'
      );
      for (const k of kids) {
        const r = k.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        const ux = (r.left - srect.left) / scaleX + vb.x;
        const uy = (r.top - srect.top) / scaleY + vb.y;
        const uw = r.width / scaleX;
        const uh = r.height / scaleY;
        x1 = Math.min(x1, ux);
        y1 = Math.min(y1, uy);
        x2 = Math.max(x2, ux + uw);
        y2 = Math.max(y2, uy + uh);
      }
      if (!isFinite(x1)) {
        return { x: vb.x, y: vb.y, width: vb.width, height: vb.height };
      }
      x1 = Math.max(x1, vb.x);
      y1 = Math.max(y1, vb.y);
      x2 = Math.min(x2, vb.x + vb.width);
      y2 = Math.min(y2, vb.y + vb.height);
      const pad = Math.max(2, (x2 - x1) * 0.01);
      return { x: x1 - pad, y: y1 - pad, width: x2 - x1 + pad * 2, height: y2 - y1 + pad * 2 };
    };
    const applySizing = (svg, dims, mw, mh) => {
      const scale = dims
        ? Math.min(1, mw / dims.width, mh / dims.height)
        : 1;
      if (dims) {
        svg.setAttribute('viewBox', `${dims.x} ${dims.y} ${dims.width} ${dims.height}`);
      }
      svg.style.width = `${Math.round(dims ? dims.width * scale : 0)}px`;
      svg.style.height = `${Math.round(dims ? dims.height * scale : 0)}px`;
      return scale;
    };
    const diagramSizing = (w, h) => {
      if (!w || !h) return { target: 'content', scale: 1, mode: 'natural' };
      const boxScale = Math.min(1, maxWidth / w, maxHeight / h);
      if (boxScale >= 1) return { target: 'content', scale: 1, mode: 'natural' };
      const heightScale = maxHeight / h;
      if (heightScale >= scaleFloor) return { target: 'content', scale: boxScale, mode: 'fit' };
      const pageScale = Math.min(1, maxWidth / w, wholePageHeight / h);
      return {
        target: 'page',
        scale: pageScale,
        mode: pageScale >= scaleFloor ? 'whole-page' : 'xl',
      };
    };
    const errorMessages = [];
    const warningMessages = [];
    const els = document.querySelectorAll('.mermaid');
    const firstEl = els.length > 0 ? els[0] : null;
    for (const el of els) {
      const source = el.textContent.trim();
      if (!source) continue;
      const isFirst = el === firstEl;
      const renderId = () => 'mermaid_' + Math.random().toString(36).slice(2, 8);
      try {
        let result = await mermaid.render(renderId(), source);
        el.innerHTML = result.svg;
        let svg = el.querySelector('svg');
        let dims = svg ? contentBBox(svg) : null;
        const sizing = dims
          ? diagramSizing(dims.width, dims.height)
          : { target: 'content', scale: 1, mode: 'natural' };
        let scale = 1;

        if (sizing.target === 'page' && allowWholePage) {
          let font = baseFont;
          while (true) {
            mermaid.initialize({
              ...theme,
              startOnLoad: false,
              themeVariables: { ...(theme.themeVariables || {}), fontSize: font },
            });
            result = await mermaid.render(renderId(), source);
            el.innerHTML = result.svg;
            svg = el.querySelector('svg');
            dims = svg ? contentBBox(svg) : null;
            if (!dims) break;
            const ps = Math.min(1, maxWidth / dims.width, wholePageHeight / dims.height);
            if (ps >= 1) break;
            const next = Math.max(minFont, Math.round(font * fontReduction));
            if (next >= font) break;
            font = next;
          }
          if (svg && dims) {
            scale = applySizing(svg, dims, maxWidth, wholePageHeight);
            el.classList.add('mermaid--whole-page');
            if (scale < scaleFloor) {
              const displayed = font * scale;
              if (displayed < minReadable) {
                warningMessages.push(
                  `mermaid: diagram text at ${Math.round(displayed)}px below readability threshold; consider splitting in source`
                );
              }
            }
          }
          mermaid.initialize(theme);
        } else if (sizing.mode === 'fit' && sizing.scale < scaleFloor) {
          const fontSize = Math.max(minFont, Math.round(baseFont * fontReduction));
          mermaid.initialize({
            ...theme,
            startOnLoad: false,
            themeVariables: { ...(theme.themeVariables || {}), fontSize },
          });
          result = await mermaid.render(renderId(), source);
          el.innerHTML = result.svg;
          svg = el.querySelector('svg');
          dims = svg ? contentBBox(svg) : null;
          if (svg && dims) scale = applySizing(svg, dims, maxWidth, maxHeight);
          mermaid.initialize(theme);
        } else {
          if (svg && dims) scale = applySizing(svg, dims, maxWidth, maxHeight);
        }

        if (isFirst && svg && dims && pageHeight && !el.classList.contains('mermaid--whole-page')) {
          const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
          const top = el.getBoundingClientRect().top + scrollTop;
          const marginBottom = parseFloat(getComputedStyle(el).marginBottom) || 0;
          const available = pageHeight - top - marginBottom;
          if (available < maxHeight && available / dims.height >= scaleFloor) {
            scale = applySizing(svg, dims, maxWidth, available);
          }
        }
      } catch (e) {
        errorMessages.push(e.message || String(e));
      }
    }
    return { errors: errorMessages, warnings: warningMessages };
  }, {
    theme: mermaidConfig,
    maxWidth,
    maxHeight,
    wholePageHeight,
    allowWholePage,
    scaleFloor: LEGIBILITY_SCALE_FLOOR,
    fontReduction: DIAGRAM_FONT_REDUCTION,
    minFont: MIN_DIAGRAM_FONT,
    minReadable: MIN_READABLE_TEXT,
    pageHeight,
  });

  for (const w of result.warnings) {
    console.warn(`  ⚠ ${w}`);
  }
  if (result.errors.length > 0) {
    throw new Error(`mermaid: ${result.errors.length} diagram(s) failed to render: ${result.errors.join('; ')}`);
  }
}

export function computeHeadingPages(page, paperFormat, margins) {
  const pageHeight = contentHeight(paperFormat, margins);
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
  const {
    captureHeadings, preset, paperFormat, margins, footer, onProgress,
    mermaidMaxWidth, mermaidMaxHeight,
  } = opts;

  assertWritableDir(path.dirname(outputPath));
  await ensureChromium({ onProgress });

  const { widthPx: contentWidth, heightPx: pageHeight } = contentSize(paperFormat, margins);
  const diagramMaxWidth = mermaidMaxWidth != null
    ? toPx(mermaidMaxWidth)
    : Math.round(contentWidth * MAX_WIDTH_RATIO);
  const diagramMaxHeight = mermaidMaxHeight != null
    ? toPx(mermaidMaxHeight)
    : Math.round(pageHeight * MAX_DIAGRAM_HEIGHT_RATIO);
  const wholePageHeight = Math.round(pageHeight * WHOLE_PAGE_RATIO);
  const allowWholePage = mermaidMaxHeight == null;

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

    const hasMermaid = await hasMermaidDiagrams(page);
    if (hasMermaid) {
      if (onProgress) onProgress('Rendering mermaid diagrams...');
      await renderMermaid(page, preset, {
        maxWidth: diagramMaxWidth,
        maxHeight: diagramMaxHeight,
        wholePageHeight,
        allowWholePage,
        pageHeight,
      });
    }

    if (onProgress) onProgress('Waiting for fonts...');
    await page.evaluate(() => document.fonts.ready);

    const headingPages = captureHeadings ? await computeHeadingPages(page, paperFormat, margins) : [];
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
