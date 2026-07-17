import { initBrowsersPath, getHeadlessShellPath } from '../../src/browsers-path.js';
initBrowsersPath();

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MERMAID_DIST = path.resolve(__dirname, '..', '..', 'node_modules', 'mermaid', 'dist', 'mermaid.min.js');

test('renders mermaid diagrams to SVGs', { timeout: 30000 }, async () => {
  const executablePath = getHeadlessShellPath();
  if (!executablePath || !existsSync(executablePath)) {
    throw new Error('Chromium headless-shell not found. Run `npm run install-chromium` first.');
  }

  const browser = await chromium.launch({ executablePath });
  const page = await browser.newPage();

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body>
  <div class="mermaid">flowchart TD; Start-->End;</div>
  <div class="mermaid">sequenceDiagram; A->>B: hello; B-->>A: world;</div>
</body></html>`;

  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ path: MERMAID_DIST });
  await page.evaluate(() => mermaid.initialize({ startOnLoad: false, theme: 'base' }));

  const errors = await page.evaluate(async () => {
    const errorMessages = [];
    const els = document.querySelectorAll('.mermaid');
    for (const el of els) {
      try {
        const { svg } = await mermaid.render('m_' + Math.random().toString(36).slice(2, 8), el.textContent.trim());
        el.innerHTML = svg;
      } catch (e) {
        errorMessages.push(e.message || String(e));
      }
    }
    return errorMessages;
  });

  assert.equal(errors.length, 0, `mermaid rendering errors: ${errors.join('; ')}`);

  const svgCount = await page.evaluate(() => document.querySelectorAll('.mermaid svg').length);
  assert.equal(svgCount, 2, 'expected 2 .mermaid divs to contain an <svg>');

  await browser.close();
});
