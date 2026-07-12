import '../src/browsers-path.js';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { existsSync, readdirSync } from 'fs';
import path from 'path';
import { join } from 'path';
import { platform } from 'os';
import { fileURLToPath } from 'url';
import { BROWSERS_PATH } from '../src/browsers-path.js';
import { PRESET_MERMAID_THEMES } from '../src/pdf.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MERMAID_DIST = path.resolve(__dirname, '..', 'node_modules', 'mermaid', 'dist', 'mermaid.min.js');

function getHeadlessShellPath() {
  let entries;
  try {
    entries = readdirSync(BROWSERS_PATH).filter((e) => e.startsWith('chromium_headless_shell-'));
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

// Five slices so all of pie1..pie5 (and the white-label bug) are exercised.
const PIE = `pie title Preset Usage
  "Terminal" : 40
  "Minimal" : 20
  "Technical" : 25
  "Academic" : 10
  "Newsletter" : 5`;

function relativeLuminance(rgb) {
  const nums = rgb.match(/\d+/g);
  if (!nums) return 1;
  const [r, g, b] = nums.slice(0, 3).map(Number).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

test('terminal preset pie labels are dark, not white', { timeout: 30000 }, async () => {
  const executablePath = getHeadlessShellPath();
  if (!executablePath || !existsSync(executablePath)) {
    throw new Error('Chromium headless-shell not found. Run `npm run install-chromium` first.');
  }

  const browser = await chromium.launch({ executablePath });
  const page = await browser.newPage();

  const html =
    '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' +
    `<div class="mermaid">${PIE}</div>` +
    '</body></html>';

  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ path: MERMAID_DIST });
  await page.evaluate((cfg) => mermaid.initialize({ startOnLoad: false, ...cfg }), PRESET_MERMAID_THEMES.terminal);

  const labelFills = await page.evaluate(async () => {
    const el = document.querySelector('.mermaid');
    const { svg } = await mermaid.render('pie_' + Math.random().toString(36).slice(2, 8), el.textContent.trim());
    el.innerHTML = svg;
    return [...el.querySelectorAll('text')].map((t) => getComputedStyle(t).fill);
  });

  assert.ok(labelFills.length > 0, 'expected pie label text elements');

  for (const fill of labelFills) {
    const lum = relativeLuminance(fill);
    assert.ok(lum < 0.85, `pie label fill ${fill} is near-white (luminance ${lum.toFixed(2)}); terminal labels must be dark`);
  }

  await browser.close();
});
