import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import fs from 'fs-extra';
import path from 'path';
import { BROWSERS_PATH } from './browsers-path.js';

let chromiumChecked = false;

function ensureChromium() {
  if (chromiumChecked) return;
  chromiumChecked = true;

  const execPath = chromium.executablePath();
  if (existsSync(execPath)) return;

  console.log('');
  console.log('  Downloading Chromium for PDF rendering (one-time, ~200MB)...');
  console.log('');

  try {
    execSync('npx playwright install chromium-headless-shell', {
      stdio: 'inherit',
      env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: BROWSERS_PATH },
    });
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
  // Verify output directory exists and is writable before launching the browser
  const outputDir = path.dirname(outputPath);
  try {
    await fs.access(outputDir, fs.constants.W_OK);
  } catch {
    console.error(`Error: output directory is not writable: ${outputDir}`);
    process.exit(1);
  }

  ensureChromium();

  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    console.error('');
    console.error(`  Failed to launch Chromium: ${err.message}`);
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

    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' },
    });
  } catch (err) {
    // Clean up any partial output before exiting
    await fs.remove(outputPath).catch(() => {});
    console.error(`Error generating PDF: ${err.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}
