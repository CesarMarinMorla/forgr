import { initBrowsersPath, getHeadlessShellPath } from '../../src/browsers-path.js';
initBrowsersPath();

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderMermaid } from '../../src/pdf.js';
import { contentSize } from '../../src/layout.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { widthPx: CONTENT_WIDTH } = contentSize('A4');
const { widthPx: LANDSCAPE_WIDTH } = contentSize('A4', undefined, 'landscape');

const CSS = `
  <style>
    body { margin: 0; }
    .mermaid { margin: 1.4em auto; max-width: 100%; text-align: center; break-inside: avoid; break-before: avoid; }
    .mermaid svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }
    h1, h2, h3, h4, h5, h6 { break-after: avoid; }
  </style>`;

function wrapHtml(body) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${CSS}</head><body>${body}</body></html>`;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function launch(viewport) {
  const executablePath = getHeadlessShellPath();
  if (!executablePath || !existsSync(executablePath)) {
    throw new Error('Chromium headless-shell not found. Run `npm run install-chromium` first.');
  }
  const browser = await chromium.launch({ executablePath });
  const page = await browser.newPage();
  if (viewport) await page.setViewportSize(viewport);
  return { browser, page };
}

const GANTT = [
  'gantt',
  '    title Wide schedule',
  '    dateFormat YYYY-MM-DD',
  '    section Planning',
  '    Write proposal        :a1, 2026-01-01, 30d',
  '    Gather requirements   :a2, 2026-02-01, 45d',
  '    Design architecture   :a3, 2026-03-15, 60d',
  '    section Development',
  '    Implement core module :d1, 2026-05-15, 90d',
  '    Implement second part :d2, 2026-08-15, 75d',
  '    Implement third part  :d3, 2026-11-01, 60d',
  '    section Testing',
  '    Unit and integration  :t1, 2027-01-01, 60d',
  '    Load and stress tests :t2, 2027-03-01, 45d',
  '    User acceptance       :t3, 2027-04-15, 30d',
  '    section Release',
  '    Package and document  :r1, 2027-05-15, 20d',
  '    Deploy and monitor    :r2, 2027-06-01, 15d',
].join('\n');

test('renders mermaid diagrams to SVGs', { timeout: 60000 }, async () => {
  const { browser, page } = await launch();
  try {
    await page.setContent(wrapHtml(`
      <div class="mermaid">flowchart TD; Start-->End;</div>
      <div class="mermaid">sequenceDiagram; A->>B: hello; B-->>A: world;</div>
    `), { waitUntil: 'domcontentloaded' });

    await renderMermaid(page, 'terminal');

    const svgCount = await page.evaluate(() => document.querySelectorAll('.mermaid svg').length);
    assert.equal(svgCount, 2, 'expected 2 .mermaid divs to contain an <svg>');
  } finally {
    await browser.close();
  }
});

test('mermaid source that fails to parse reports the error', { timeout: 60000 }, async () => {
  const { browser, page } = await launch();
  try {
    await page.setContent(wrapHtml('<div class="mermaid">not-a-diagram at all</div>'), { waitUntil: 'domcontentloaded' });
    await assert.rejects(() => renderMermaid(page, 'terminal'), /diagram\(s\) failed to render/);
  } finally {
    await browser.close();
  }
});

test('.mermaid container has no phantom height: container matches svg box exactly', { timeout: 60000 }, async () => {
  const { browser, page } = await launch();
  try {
    const flow = 'flowchart LR; A-->B; B-->C; C-->D';
    await page.setContent(wrapHtml(`<div class="mermaid">${escapeHtml(flow)}</div>`), { waitUntil: 'domcontentloaded' });
    await renderMermaid(page, 'terminal');

    const d = await page.evaluate(() => {
      const el = document.querySelector('.mermaid');
      const svg = el.querySelector('svg');
      return {
        containerH: el.getBoundingClientRect().height,
        svgH: svg.getBoundingClientRect().height,
      };
    });
    assert.ok(Math.abs(d.containerH - d.svgH) <= 0.5, `container ${d.containerH}px exceeds svg ${d.svgH}px (inline baseline phantom)`);
  } finally {
    await browser.close();
  }
});

test('placement relies on native fragmentation: headings keep break-after avoid and diagrams break-inside avoid', { timeout: 60000 }, async () => {
  const { browser, page } = await launch();
  try {
    const flow = 'flowchart LR; A-->B; B-->C; C-->D';
    let body = '';
    for (let i = 1; i <= 8; i++) {
      body += `<h2 id="section-${i}">Section ${i}</h2>\n`;
      for (let j = 0; j < 3; j++) {
        body += `<p>Paragraph ${i}.${j} with enough text to push the following diagram toward page boundaries. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.</p>\n`;
      }
      body += `<div class="mermaid">${escapeHtml(flow)}</div>\n`;
    }
    await page.setContent(wrapHtml(body), { waitUntil: 'domcontentloaded' });
    await renderMermaid(page, 'terminal');

    const contract = await page.evaluate(() => {
      const heading = getComputedStyle(document.querySelector('h2'));
      const diagram = getComputedStyle(document.querySelector('.mermaid'));
      return { headingBreakAfter: heading.breakAfter, diagramBreakInside: diagram.breakInside };
    });

    assert.equal(contract.headingBreakAfter, 'avoid', 'headings must keep break-after avoid so they stay attached to their diagram');
    assert.equal(contract.diagramBreakInside, 'avoid', 'diagrams must keep break-inside avoid so they never split across pages');
  } finally {
    await browser.close();
  }
});

test('landscape: wide diagram escapes the portrait column cap and still fits the page', { timeout: 60000 }, async () => {
  const { browser, page } = await launch({ width: LANDSCAPE_WIDTH, height: 800 });
  try {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body { margin: 0; max-width: 720px; }
      .mermaid { margin: 1.4em auto; max-width: 100%; text-align: center; break-inside: avoid; break-before: avoid; }
      .mermaid svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }
      body[data-orientation="landscape"] { max-width: none; }
    </style></head><body data-orientation="landscape">
      <div class="mermaid">${escapeHtml(GANTT)}</div>
    </body></html>`;

    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await renderMermaid(page, 'terminal');

    const width = await page.evaluate(() => document.querySelector('.mermaid svg').getBoundingClientRect().width);
    assert.ok(width > 720, `landscape diagram ${width}px should escape the 720px portrait column cap`);
    assert.ok(width <= LANDSCAPE_WIDTH + 1, `landscape diagram ${width}px exceeds landscape content width ${LANDSCAPE_WIDTH}`);
    assert.ok(width > CONTENT_WIDTH, `landscape diagram ${width}px should use more than the portrait content width ${CONTENT_WIDTH}`);
  } finally {
    await browser.close();
  }
});
