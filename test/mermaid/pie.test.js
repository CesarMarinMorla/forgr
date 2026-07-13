import '../../src/browsers-path.js';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';
import { join } from 'path';
import { platform } from 'os';
import { fileURLToPath } from 'url';
import { BROWSERS_PATH } from '../../src/browsers-path.js';
import { PRESET_MERMAID_THEMES } from '../../src/pdf.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MERMAID_DIST = path.resolve(__dirname, '..', '..', 'node_modules', 'mermaid', 'dist', 'mermaid.min.js');

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

// Five slices so all of pie1..pie5 are exercised per preset.
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

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

test('every preset renders dark, readable pie labels', { timeout: 60000 }, async () => {
  const executablePath = getHeadlessShellPath();
  if (!executablePath || !existsSync(executablePath)) {
    throw new Error('Chromium headless-shell not found. Run `npm run install-chromium` first.');
  }

  const browser = await chromium.launch({ executablePath });

  for (const [name, config] of Object.entries(PRESET_MERMAID_THEMES)) {
    const page = await browser.newPage();
    const html =
      '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' +
      `<div class="mermaid">${escapeHtml(PIE)}</div>` +
      '</body></html>';
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.addScriptTag({ path: MERMAID_DIST });
    await page.evaluate((cfg) => mermaid.initialize({ startOnLoad: false, ...cfg }), config);

    const labelFills = await page.evaluate(async () => {
      const el = document.querySelector('.mermaid');
      const { svg } = await mermaid.render('pie_' + Math.random().toString(36).slice(2, 8), el.textContent.trim());
      el.innerHTML = svg;
      return [...el.querySelectorAll('text')].map((t) => getComputedStyle(t).fill);
    });

    assert.ok(labelFills.length > 0, `preset "${name}": expected pie label text elements`);

    for (const fill of labelFills) {
      const lum = relativeLuminance(fill);
      assert.ok(
        lum < 0.85,
        `preset "${name}": pie label fill ${fill} is near-white (luminance ${lum.toFixed(2)}); labels must be dark`
      );
    }

    await page.close();
  }

  await browser.close();
});

// Every diagram type in each preset's fixture renders without mermaid errors
// (catches invalid theme variables or broken mermaid syntax).
const PRESET_NAMES = ['newsletter', 'terminal', 'minimal', 'technical', 'academic'];

for (const preset of PRESET_NAMES) {
  test(`preset "${preset}": all fixture diagrams render without errors`, { timeout: 30000 }, async () => {
    const executablePath = getHeadlessShellPath();
    if (!executablePath || !existsSync(executablePath)) {
      throw new Error('Chromium headless-shell not found. Run `npm run install-chromium` first.');
    }

    const fixturePath = path.join(__dirname, 'fixtures', `${preset}.md`);
    const content = readFileSync(fixturePath, 'utf8');
    const diagrams = [...content.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1].trim());

    const html =
      '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' +
      diagrams.map((d) => `<div class="mermaid">${escapeHtml(d)}</div>`).join('\n') +
      '</body></html>';

    const browser = await chromium.launch({ executablePath });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.addScriptTag({ path: MERMAID_DIST });

    const errors = await page.evaluate((config) => {
      mermaid.initialize({ startOnLoad: false, ...config });
      const errorMessages = [];
      const els = document.querySelectorAll('.mermaid');
      for (const el of els) {
        try {
          const { svg } = mermaid.render('m_' + Math.random().toString(36).slice(2, 8), el.textContent.trim());
          el.innerHTML = svg;
        } catch (e) {
          errorMessages.push(e.message || String(e));
        }
      }
      return errorMessages;
    }, PRESET_MERMAID_THEMES[preset]);

    assert.equal(errors.length, 0, `preset "${preset}": ${errors.length} diagram(s) failed: ${errors.join('; ')}`);

    await browser.close();
  });
}
