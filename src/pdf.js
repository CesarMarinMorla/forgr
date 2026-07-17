import { chromium } from 'playwright-core';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { BROWSERS_PATH, getChromiumInstallCmd, getHeadlessShellPath, removeFfmpeg } from './browsers-path.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MERMAID_DIST = path.resolve(__dirname, '..', 'node_modules', 'mermaid', 'dist', 'mermaid.min.js');

export const PRESET_MERMAID_THEMES = {
  newsletter: {
    theme: 'base',
    themeVariables: {
      primaryColor: '#FAD9D0',
      primaryTextColor: '#2D2A24',
      primaryBorderColor: '#C85A48',
      lineColor: '#8C3D2F',
      secondaryColor: '#F8C4B8',
      tertiaryColor: '#F4A89A',
      textColor: '#2D2A24',
      mainBkg: '#FDF1EE',
      background: '#FFFFFF',
      nodeBorder: '#C85A48',
      actorBkg: '#FDF1EE',
      actorTextColor: '#2D2A24',
      actorBorder: '#C85A48',
      signalColor: '#8C3D2F',
      signalTextColor: '#2D2A24',
      labelBoxBkgColor: '#F8C4B8',
      labelBoxBorderColor: '#C85A48',
      labelTextColor: '#2D2A24',
      loopTextColor: '#8C3D2F',
      activationBorderColor: '#C85A48',
      activationBkgColor: '#FCE4DE',
      sequenceNumberColor: '#2D2A24',
      taskBkgColor: '#F8C4B8',
      taskBorderColor: '#C85A48',
      grid: '#F3D9D2',
      sectionBkgColor: '#FDF1EE',
      classText: '#2D2A24',
      attributeBackgroundColor: '#FDF1EE',
      commitLabelColor: '#2D2A24',
      pieSectionTextColor: '#2D2A24',
      pieStrokeColor: '#C85A48',
      pieLegendTextColor: '#2D2A24',
      pieTitleTextColor: '#2D2A24',
      pie1: '#FAD9D0',
      pie2: '#F8C4B8',
      pie3: '#F4A89A',
      pie4: '#EFA089',
      pie5: '#E98E7C',
      cScale0: '#F8C4B8',
      cScale1: '#F8C4B8',
      cScale2: '#F8C4B8',
      cScale3: '#F8C4B8',
      cScale4: '#F8C4B8',
      cScale5: '#F8C4B8',
      cScale6: '#F8C4B8',
      cScale7: '#F8C4B8',
      cScale8: '#F8C4B8',
      cScale9: '#F8C4B8',
      cScale10: '#F8C4B8',
      cScale11: '#F8C4B8',
      cScaleLabel0: '#2D2A24',
      cScaleLabel1: '#2D2A24',
      cScaleLabel2: '#2D2A24',
      cScaleLabel3: '#2D2A24',
      cScaleLabel4: '#2D2A24',
      cScaleLabel5: '#2D2A24',
      cScaleLabel6: '#2D2A24',
      cScaleLabel7: '#2D2A24',
      cScaleLabel8: '#2D2A24',
      cScaleLabel9: '#2D2A24',
      cScaleLabel10: '#2D2A24',
      cScaleLabel11: '#2D2A24',
    },
  },
  terminal: {
    theme: 'base',
    themeVariables: {
      primaryColor: '#2DD4BF',
      primaryTextColor: '#1C2128',
      primaryBorderColor: '#0F766E',
      lineColor: '#0F766E',
      secondaryColor: '#99F6E4',
      tertiaryColor: '#5EEAD4',
      textColor: '#1C2128',
      mainBkg: '#ECFDFB',
      background: '#FFFFFF',
      nodeBorder: '#0F766E',
      actorBkg: '#ECFDFB',
      actorTextColor: '#1C2128',
      actorBorder: '#0F766E',
      signalColor: '#0F766E',
      signalTextColor: '#1C2128',
      labelBoxBkgColor: '#99F6E4',
      labelBoxBorderColor: '#0F766E',
      labelTextColor: '#1C2128',
      loopTextColor: '#0F766E',
      activationBorderColor: '#0F766E',
      activationBkgColor: '#CCFBF1',
      sequenceNumberColor: '#1C2128',
      taskBkgColor: '#99F6E4',
      taskBorderColor: '#5EEAD4',
      grid: '#CBD5E1',
      sectionBkgColor: '#ECFDFB',
      classText: '#1C2128',
      attributeBackgroundColor: '#ECFDFB',
      commitLabelColor: '#1C2128',
      pieSectionTextColor: '#1C2128',
      pieStrokeColor: '#0F766E',
      pieLegendTextColor: '#1C2128',
      pieTitleTextColor: '#1C2128',
       pie1: '#2DD4BF',
       pie2: '#0F766E',
       pie3: '#5EEAD4',
       pie4: '#1C2128',
       pie5: '#99F6E4',
      cScale0: '#99F6E4',
      cScale1: '#99F6E4',
      cScale2: '#99F6E4',
      cScale3: '#99F6E4',
      cScale4: '#99F6E4',
      cScale5: '#99F6E4',
      cScale6: '#99F6E4',
      cScale7: '#99F6E4',
      cScale8: '#99F6E4',
      cScale9: '#99F6E4',
      cScale10: '#99F6E4',
      cScale11: '#99F6E4',
      cScaleLabel0: '#1C2128',
      cScaleLabel1: '#1C2128',
      cScaleLabel2: '#1C2128',
      cScaleLabel3: '#1C2128',
      cScaleLabel4: '#1C2128',
      cScaleLabel5: '#1C2128',
      cScaleLabel6: '#1C2128',
      cScaleLabel7: '#1C2128',
      cScaleLabel8: '#1C2128',
      cScaleLabel9: '#1C2128',
      cScaleLabel10: '#1C2128',
      cScaleLabel11: '#1C2128',
    },
  },
  minimal: {
    theme: 'base',
    themeVariables: {
      primaryColor: '#FAFAFA',
      primaryTextColor: '#111111',
      primaryBorderColor: '#111111',
      lineColor: '#111111',
      secondaryColor: '#E5E5E5',
      tertiaryColor: '#BFBFBF',
      textColor: '#111111',
      mainBkg: '#FAFAFA',
      background: '#FFFFFF',
      nodeBorder: '#111111',
      actorBkg: '#FAFAFA',
      actorTextColor: '#111111',
      actorBorder: '#111111',
      signalColor: '#111111',
      signalTextColor: '#111111',
      labelBoxBkgColor: '#F0F0F0',
      labelBoxBorderColor: '#111111',
      labelTextColor: '#111111',
      loopTextColor: '#111111',
      activationBorderColor: '#111111',
      activationBkgColor: '#F5F5F5',
      sequenceNumberColor: '#111111',
      taskBkgColor: '#E5E5E5',
      taskBorderColor: '#111111',
      grid: '#E0E0E0',
      sectionBkgColor: '#F5F5F5',
      classText: '#111111',
      attributeBackgroundColor: '#FAFAFA',
      commitLabelColor: '#111111',
      pieSectionTextColor: '#111111',
      pieStrokeColor: '#111111',
      pieLegendTextColor: '#111111',
      pieTitleTextColor: '#111111',
      pie1: '#E5E5E5',
      pie2: '#CFCFCF',
      pie3: '#B8B8B8',
      pie4: '#A3A3A3',
      pie5: '#8F8F8F',
      cScale0: '#E5E5E5',
      cScale1: '#E5E5E5',
      cScale2: '#E5E5E5',
      cScale3: '#E5E5E5',
      cScale4: '#E5E5E5',
      cScale5: '#E5E5E5',
      cScale6: '#E5E5E5',
      cScale7: '#E5E5E5',
      cScale8: '#E5E5E5',
      cScale9: '#E5E5E5',
      cScale10: '#E5E5E5',
      cScale11: '#E5E5E5',
      cScaleLabel0: '#111111',
      cScaleLabel1: '#111111',
      cScaleLabel2: '#111111',
      cScaleLabel3: '#111111',
      cScaleLabel4: '#111111',
      cScaleLabel5: '#111111',
      cScaleLabel6: '#111111',
      cScaleLabel7: '#111111',
      cScaleLabel8: '#111111',
      cScaleLabel9: '#111111',
      cScaleLabel10: '#111111',
      cScaleLabel11: '#111111',
    },
  },
  technical: {
    theme: 'base',
    themeVariables: {
      primaryColor: '#FDBA74',
      primaryTextColor: '#1F1B16',
      primaryBorderColor: '#C2410C',
      lineColor: '#C2410C',
      secondaryColor: '#FED7AA',
      tertiaryColor: '#FB923C',
      textColor: '#1F1B16',
      mainBkg: '#FFF7ED',
      background: '#FFFFFF',
      nodeBorder: '#C2410C',
      actorBkg: '#FFF7ED',
      actorTextColor: '#1F1B16',
      actorBorder: '#C2410C',
      signalColor: '#C2410C',
      signalTextColor: '#1F1B16',
      labelBoxBkgColor: '#FED7AA',
      labelBoxBorderColor: '#C2410C',
      labelTextColor: '#1F1B16',
      loopTextColor: '#C2410C',
      activationBorderColor: '#C2410C',
      activationBkgColor: '#FFEDD5',
      sequenceNumberColor: '#1F1B16',
      taskBkgColor: '#FED7AA',
      taskBorderColor: '#C2410C',
      grid: '#F3D9C0',
      sectionBkgColor: '#FFF7ED',
      classText: '#1F1B16',
      attributeBackgroundColor: '#FFF7ED',
      commitLabelColor: '#1F1B16',
      pieSectionTextColor: '#1F1B16',
      pieStrokeColor: '#C2410C',
      pieLegendTextColor: '#1F1B16',
      pieTitleTextColor: '#1F1B16',
      pie1: '#FDBA74',
      pie2: '#FED7AA',
      pie3: '#FB923C',
      pie4: '#F97316',
      pie5: '#FBBF24',
      cScale0: '#FED7AA',
      cScale1: '#FED7AA',
      cScale2: '#FED7AA',
      cScale3: '#FED7AA',
      cScale4: '#FED7AA',
      cScale5: '#FED7AA',
      cScale6: '#FED7AA',
      cScale7: '#FED7AA',
      cScale8: '#FED7AA',
      cScale9: '#FED7AA',
      cScale10: '#FED7AA',
      cScale11: '#FED7AA',
      cScaleLabel0: '#1F1B16',
      cScaleLabel1: '#1F1B16',
      cScaleLabel2: '#1F1B16',
      cScaleLabel3: '#1F1B16',
      cScaleLabel4: '#1F1B16',
      cScaleLabel5: '#1F1B16',
      cScaleLabel6: '#1F1B16',
      cScaleLabel7: '#1F1B16',
      cScaleLabel8: '#1F1B16',
      cScaleLabel9: '#1F1B16',
      cScaleLabel10: '#1F1B16',
      cScaleLabel11: '#1F1B16',
    },
  },
  academic: {
    theme: 'base',
    themeVariables: {
      primaryColor: '#DCEBE3',
      primaryTextColor: '#1A1A1A',
      primaryBorderColor: '#3D6B55',
      lineColor: '#1B4A36',
      secondaryColor: '#BFE0D0',
      tertiaryColor: '#A7D3BD',
      textColor: '#1A1A1A',
      mainBkg: '#EEF3F0',
      background: '#FFFFFF',
      nodeBorder: '#3D6B55',
      actorBkg: '#EEF3F0',
      actorTextColor: '#1A1A1A',
      actorBorder: '#3D6B55',
      signalColor: '#3D6B55',
      signalTextColor: '#1A1A1A',
      labelBoxBkgColor: '#CFE3D8',
      labelBoxBorderColor: '#3D6B55',
      labelTextColor: '#1A1A1A',
      loopTextColor: '#3D6B55',
      activationBorderColor: '#3D6B55',
      activationBkgColor: '#E2EFE9',
      sequenceNumberColor: '#1A1A1A',
      taskBkgColor: '#CFE3D8',
      taskBorderColor: '#3D6B55',
      grid: '#D3E2DB',
      sectionBkgColor: '#EEF3F0',
      classText: '#1A1A1A',
      attributeBackgroundColor: '#EEF3F0',
      commitLabelColor: '#1A1A1A',
      pieSectionTextColor: '#1A1A1A',
      pieStrokeColor: '#3D6B55',
      pieLegendTextColor: '#1A1A1A',
      pieTitleTextColor: '#1A1A1A',
      pie1: '#CFE3D8',
      pie2: '#BFE0D0',
      pie3: '#A7D3BD',
      pie4: '#8FC9A8',
      pie5: '#7BBD97',
      cScale0: '#BFE0D0',
      cScale1: '#BFE0D0',
      cScale2: '#BFE0D0',
      cScale3: '#BFE0D0',
      cScale4: '#BFE0D0',
      cScale5: '#BFE0D0',
      cScale6: '#BFE0D0',
      cScale7: '#BFE0D0',
      cScale8: '#BFE0D0',
      cScale9: '#BFE0D0',
      cScale10: '#BFE0D0',
      cScale11: '#BFE0D0',
      cScaleLabel0: '#1A1A1A',
      cScaleLabel1: '#1A1A1A',
      cScaleLabel2: '#1A1A1A',
      cScaleLabel3: '#1A1A1A',
      cScaleLabel4: '#1A1A1A',
      cScaleLabel5: '#1A1A1A',
      cScaleLabel6: '#1A1A1A',
      cScaleLabel7: '#1A1A1A',
      cScaleLabel8: '#1A1A1A',
      cScaleLabel9: '#1A1A1A',
      cScaleLabel10: '#1A1A1A',
      cScaleLabel11: '#1A1A1A',
    },
  },
};

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

// The content height of an A4 page with 2cm margins, in CSS pixels at 96dpi:
// 297mm - 40mm = 257mm, at 96/25.4 px/mm ≈ 971px
const A4_CONTENT_HEIGHT = 971;

export async function generatePdf(html, outputPath, opts = {}) {
  const { captureHeadings, preset, paperFormat, margins, _pdf } = opts;
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
      await page.setViewportSize(_pdf.viewport);
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
      format: paperFormat,
      printBackground: _pdf.printBackground,
      margin: margins,
      displayHeaderFooter: _pdf.displayHeaderFooter,
      headerTemplate: _pdf.headerTemplate,
      footerTemplate: _pdf.footerTemplate,
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
