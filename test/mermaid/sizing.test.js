import { initBrowsersPath, getHeadlessShellPath } from '../../src/browsers-path.js';
initBrowsersPath();

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderMermaid } from '../../src/pdf.js';
import { contentSize, MAX_DIAGRAM_HEIGHT_RATIO, MAX_WIDTH_RATIO, WHOLE_PAGE_RATIO, LEGIBILITY_SCALE_FLOOR } from '../../src/layout.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MERMAID_DIST = path.resolve(__dirname, '..', '..', 'node_modules', 'mermaid', 'dist', 'mermaid.min.js');

const { widthPx: CONTENT_WIDTH, heightPx: PAGE_HEIGHT } = contentSize('A4');
const MAX_DIAGRAM_HEIGHT = Math.round(PAGE_HEIGHT * MAX_DIAGRAM_HEIGHT_RATIO);
const WHOLE_PAGE_HEIGHT = Math.round(PAGE_HEIGHT * WHOLE_PAGE_RATIO);
const MAX_WIDTH = Math.round(CONTENT_WIDTH * MAX_WIDTH_RATIO);

const CSS = `
  <style>
    .mermaid { margin: 1.4em auto; max-width: 100%; text-align: center; break-inside: avoid; break-before: avoid; }
    .mermaid svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }
    h1, h2, h3, h4, h5, h6 { break-after: avoid; }
  </style>`;

function wrapHtml(body) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${CSS}</head><body>${body}</body></html>`;
}

async function launch() {
  const executablePath = getHeadlessShellPath();
  if (!executablePath || !existsSync(executablePath)) {
    throw new Error('Chromium headless-shell not found. Run `npm run install-chromium` first.');
  }
  const browser = await chromium.launch({ executablePath });
  const page = await browser.newPage();
  return { browser, page };
}

function dims(page) {
  return page.evaluate(() => {
    const svg = document.querySelector('.mermaid svg');
    const rect = svg.getBoundingClientRect();
    return { width: rect.width, height: rect.height, styleWidth: svg.style.width, styleHeight: svg.style.height };
  });
}

function contentDims(page) {
  return page.evaluate(() => {
    const svg = document.querySelector('.mermaid svg');
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const srect = svg.getBoundingClientRect();
    let outside = 0;
    const kids = svg.querySelectorAll('path,rect,ellipse,circle,text,polygon,polyline,line,use,image,foreignObject');
    for (const k of kids) {
      const r = k.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.left < srect.left - 0.5 || r.top < srect.top - 0.5 || r.right > srect.right + 0.5 || r.bottom > srect.bottom + 0.5) outside++;
    }
    return {
      boxW: rect.width,
      boxH: rect.height,
      viewBoxW: vb.width,
      viewBoxH: vb.height,
      childrenOutside: outside,
    };
  });
}

function containerDims(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.mermaid');
    const svg = el.querySelector('svg');
    const e = el.getBoundingClientRect();
    const s = svg.getBoundingClientRect();
    return { containerH: e.height, svgH: s.height, containerW: e.width, svgW: s.width };
  });
}

test('wide diagram (gantt) is capped at 0.98 content width', { timeout: 60000 }, async () => {
  const { browser, page } = await launch();
  try {
    const gantt = [
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
    await page.setContent(wrapHtml(`<div class="mermaid">${escapeHtml(gantt)}</div>`), { waitUntil: 'domcontentloaded' });
    await renderMermaid(page, 'terminal', { maxWidth: MAX_WIDTH, maxHeight: MAX_DIAGRAM_HEIGHT });
    const d = await dims(page);
    assert.ok(d.width <= MAX_WIDTH + 1, `gantt width ${d.width} exceeds 0.98 cap ${MAX_WIDTH}`);
    assert.ok(d.styleWidth, 'explicit width style should be set for scaled diagrams');
  } finally {
    await browser.close();
  }
});

test('landscape: wide diagram uses the full landscape content width, escaping the portrait column cap', { timeout: 60000 }, async () => {
  const { browser, page } = await launch();
  try {
    const landscape = contentSize('A4', undefined, 'landscape');
    const landscapeMaxWidth = Math.round(landscape.widthPx * MAX_WIDTH_RATIO);
    const landscapeMaxHeight = Math.round(landscape.heightPx * MAX_DIAGRAM_HEIGHT_RATIO);

    const gantt = [
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

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      main { max-width: 720px; margin: 0 auto; }
      .mermaid { margin: 1.4em auto; max-width: 100%; text-align: center; break-inside: avoid; break-before: avoid; }
      .mermaid svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }
      body[data-orientation="landscape"] .mermaid { max-width: none; }
      body[data-orientation="landscape"] .mermaid svg { max-width: none; }
    </style></head><body data-orientation="landscape"><main>
      <div class="mermaid">${escapeHtml(gantt)}</div>
    </main></body></html>`;

    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await renderMermaid(page, 'terminal', { maxWidth: landscapeMaxWidth, maxHeight: landscapeMaxHeight });
    const d = await dims(page);

    assert.ok(d.width > 720, `landscape diagram ${d.width}px should escape the 720px portrait column cap`);
    assert.ok(d.width <= landscapeMaxWidth + 1, `landscape diagram ${d.width}px exceeds cap ${landscapeMaxWidth}`);
    assert.ok(d.width > CONTENT_WIDTH * MAX_WIDTH_RATIO, `landscape diagram ${d.width}px should exceed the portrait max width ${Math.round(CONTENT_WIDTH * MAX_WIDTH_RATIO)}px`);
  } finally {
    await browser.close();
  }
});

test('gantt with past dates does not balloon to a thumbnail from the off-chart today marker', { timeout: 60000 }, async () => {
  const { browser, page } = await launch();
  try {
    const gantt = [
      'gantt',
      '    title Past schedule',
      '    dateFormat YYYY-MM-DD',
      '    section Writing',
      '    Lead story :w1, 2024-11-01, 5d',
      '    Sidebar   :w2, after w1, 3d',
      '    section Production',
      '    Layout  :p1, after w2, 3d',
      '    Ship    :crit, s1, after p1, 1d',
    ].join('\n');
    await page.setContent(wrapHtml(`<div class="mermaid">${escapeHtml(gantt)}</div>`), { waitUntil: 'domcontentloaded' });
    await renderMermaid(page, 'terminal', { maxWidth: MAX_WIDTH, maxHeight: MAX_DIAGRAM_HEIGHT });
    const d = await dims(page);
    const c = await contentDims(page);
    const ratio = c.viewBoxW / d.width;
    assert.ok(ratio < 5, `past-date gantt viewBox ${c.viewBoxW}px over ${d.width}px box (ratio ${ratio.toFixed(1)}) inflated by off-chart today marker`);
    assert.ok(d.width > MAX_WIDTH * 0.5, `past-date gantt collapsed to ${d.width}px thumbnail`);
    assert.ok(d.width <= MAX_WIDTH + 1, `gantt width ${d.width} exceeds 0.98 cap ${MAX_WIDTH}`);
  } finally {
    await browser.close();
  }
});

test('.mermaid container has no phantom height: container matches svg box exactly', { timeout: 60000 }, async () => {
  const { browser, page } = await launch();
  try {
    const flow = 'flowchart LR; A-->B; B-->C; C-->D';
    await page.setContent(wrapHtml(`<div class="mermaid">${escapeHtml(flow)}</div>`), { waitUntil: 'domcontentloaded' });
    await renderMermaid(page, 'terminal', { maxWidth: MAX_WIDTH, maxHeight: MAX_DIAGRAM_HEIGHT });
    const d = await containerDims(page);
    assert.ok(Math.abs(d.containerH - d.svgH) <= 0.5, `container ${d.containerH}px exceeds svg ${d.svgH}px (inline baseline phantom)`);
  } finally {
    await browser.close();
  }
});

test('tall diagram (vertical flowchart) is capped at max height', { timeout: 60000 }, async () => {
  const { browser, page } = await launch();
  try {
    const nodes = [];
    for (let i = 1; i <= 40; i++) nodes.push(`N${i}`);
    const edges = [];
    for (let i = 1; i < 40; i++) edges.push(`N${i}-->N${i + 1}`);
    const flow = `flowchart TD;\n    ${nodes.join(' & ')}\n    ${edges.join('\n    ')}`;
    await page.setContent(wrapHtml(`<div class="mermaid">${escapeHtml(flow)}</div>`), { waitUntil: 'domcontentloaded' });
    await renderMermaid(page, 'terminal', { maxWidth: MAX_WIDTH, maxHeight: MAX_DIAGRAM_HEIGHT });
    const d = await dims(page);
    assert.ok(d.height <= MAX_DIAGRAM_HEIGHT + 1, `tall diagram height ${d.height} exceeds max ${MAX_DIAGRAM_HEIGHT}`);
  } finally {
    await browser.close();
  }
});

test('viewBox is trimmed to full content extent: sequence diagram renders complete and unclipped', { timeout: 60000 }, async () => {
  const { browser, page } = await launch();
  try {
    const seq = [
      'sequenceDiagram',
      '  participant C as Client',
      '  participant G as Auth Gateway',
      '  participant I as IdP',
      '  C->>G: POST /login (credentials)',
      '  G->>I: verify(credentials)',
      '  I-->>G: token',
      '  G-->>C: set-cookie(session)',
      '  C->>S: GET /resource (session)',
      '  S-->>C: 200 OK (payload)',
    ].join('\n');
    await page.setContent(wrapHtml(`<div class="mermaid">${escapeHtml(seq)}</div>`), { waitUntil: 'domcontentloaded' });
    await renderMermaid(page, 'terminal', { maxWidth: MAX_WIDTH, maxHeight: MAX_DIAGRAM_HEIGHT });
    const c = await contentDims(page);
    assert.equal(c.childrenOutside, 0, 'sequence diagram content is clipped');
    assert.ok(c.viewBoxW > CONTENT_WIDTH * 0.5, `viewBox ${c.viewBoxW}px collapsed to a single participant box`);
    assert.ok(c.boxW <= MAX_WIDTH + 1, `box ${c.boxW}px exceeds 0.98 cap`);
  } finally {
    await browser.close();
  }
});

test('right edge keeps safety slack: content never touches the page margin', { timeout: 60000 }, async () => {
  const { browser, page } = await launch();
  try {
    const flow = [
      'flowchart LR',
      '  A[Client] --> B{Auth Gateway}',
      '  B -->|valid| C[API Server]',
      '  B -->|rejected| Z[401 Response]',
      '  C --> D[Domain Service]',
      '  D --> E[(PostgreSQL)]',
      '  D --> F[Cache]',
      '  C --> G[Response]',
    ].join('\n');
    await page.setContent(wrapHtml(`<div class="mermaid">${escapeHtml(flow)}</div>`), { waitUntil: 'domcontentloaded' });
    await renderMermaid(page, 'academic', { maxWidth: MAX_WIDTH, maxHeight: MAX_DIAGRAM_HEIGHT });
    const d = await dims(page);
    assert.ok(d.width <= MAX_WIDTH + 1, `box ${d.width}px exceeds 0.98 cap ${MAX_WIDTH}`);
    assert.ok(CONTENT_WIDTH - d.width >= 6, `right slack ${CONTENT_WIDTH - d.width}px too small`);
  } finally {
    await browser.close();
  }
});

test('oversized diagram is re-rendered with reduced font', { timeout: 60000 }, async () => {
  const { browser, page } = await launch();
  try {
    const gantt = [
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
    const narrowMax = Math.round(CONTENT_WIDTH * 0.25);
    await page.setContent(wrapHtml(`<div class="mermaid">${escapeHtml(gantt)}</div>`), { waitUntil: 'domcontentloaded' });
    await page.addScriptTag({ path: MERMAID_DIST });
    await page.evaluate(() => {
      const orig = mermaid.render.bind(mermaid);
      window.__renderCount = 0;
      mermaid.render = (...args) => {
        window.__renderCount++;
        return orig(...args);
      };
    });
    await renderMermaid(page, 'terminal', { maxWidth: narrowMax, maxHeight: MAX_DIAGRAM_HEIGHT });
    const count = await page.evaluate(() => window.__renderCount);
    assert.ok(count >= 2, `expected re-render for oversized diagram, got ${count} render(s)`);
    const d = await dims(page);
    assert.ok(d.width <= narrowMax + 1, `width ${d.width} exceeds reduced max ${narrowMax}`);
  } finally {
    await browser.close();
  }
});

test('placement relies on native fragmentation: headings keep break-after avoid and diagrams break-inside avoid', { timeout: 60000 }, async () => {
  const { browser, page } = await launch();
  try {
    const pageHeight = 320;
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
    await renderMermaid(page, 'terminal', { maxWidth: CONTENT_WIDTH, maxHeight: MAX_DIAGRAM_HEIGHT });

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

test('first diagram is clamped to the page-1 space left below its heading chain', { timeout: 60000 }, async () => {
  const { browser, page } = await launch();
  try {
    const flow = [
      'flowchart TD',
      '  Question([Research question]) --> Review[Literature review]',
      '  Review --> Hypothesis[Form hypothesis]',
      '  Hypothesis --> Design[Design study]',
      '  Design --> Collect[Collect data]',
      '  Collect --> Analyze[Analyze results]',
      '  Analyze --> Significant{Significant?}',
      '  Significant -->|Yes| Publish([Manuscript])',
      '  Significant -->|No| Null[Null result]',
      '  Null --> Publish',
    ].join('\n');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      .mermaid { margin: 1.4em auto; max-width: 100%; text-align: center; break-inside: avoid; break-before: avoid; }
      .mermaid svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }
      h1, h2, h3, h4, h5, h6 { break-after: avoid; }
      .doc-meta { font-size: 12px; padding-bottom: 8px; margin-bottom: 28px; }
      h1 { font-size: 26px; margin: 40px 0 12px; }
      h2 { font-size: 18px; margin: 36px 0 14px; }
    </style></head><body>
      <header class="doc-meta"><span>Mermaid Diagrams - Academic</span></header>
      <h1>Research Study</h1>
      <h2>Flowchart</h2>
      <div class="mermaid">${escapeHtml(flow)}</div>
    </body></html>`;
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await renderMermaid(page, 'academic', {
      maxWidth: MAX_WIDTH, maxHeight: MAX_DIAGRAM_HEIGHT, pageHeight: PAGE_HEIGHT,
    });

    const r = await page.evaluate(({ pageH, maxH }) => {
      const el = document.querySelector('.mermaid');
      const svg = el.querySelector('svg');
      const rect = el.getBoundingClientRect();
      const srect = svg.getBoundingClientRect();
      const marginBottom = parseFloat(getComputedStyle(el).marginBottom) || 0;
      return {
        top: rect.top,
        svgH: srect.height,
        marginBottom,
        fitsPage: rect.top + srect.height + marginBottom <= pageH,
        clamped: srect.height < maxH,
      };
    }, { pageH: PAGE_HEIGHT, maxH: MAX_DIAGRAM_HEIGHT });

    assert.ok(r.clamped, `first diagram should be clamped below max height ${MAX_DIAGRAM_HEIGHT}, got ${r.svgH}px`);
    assert.ok(r.fitsPage, `title+heading+diagram chain must stay on page 1 (top ${r.top} + svg ${r.svgH} + margin ${r.marginBottom} > ${PAGE_HEIGHT})`);
  } finally {
    await browser.close();
  }
});

test('tall diagram gets whole-page treatment when allowed', { timeout: 90000 }, async () => {
  const { browser, page } = await launch();
  try {
    const nodes = [];
    for (let i = 1; i <= 60; i++) nodes.push(`N${i}`);
    const edges = [];
    for (let i = 1; i < 60; i++) edges.push(`N${i}-->N${i + 1}`);
    const flow = `flowchart TD;\n    ${nodes.join(' & ')}\n    ${edges.join('\n    ')}`;
    await page.setContent(wrapHtml(`<div class="mermaid">${escapeHtml(flow)}</div>`), { waitUntil: 'domcontentloaded' });
    await renderMermaid(page, 'terminal', {
      maxWidth: MAX_WIDTH, maxHeight: MAX_DIAGRAM_HEIGHT,
      wholePageHeight: WHOLE_PAGE_HEIGHT, allowWholePage: true,
    });
    const d = await dims(page);
    const isWholePage = await page.evaluate(() =>
      document.querySelector('.mermaid').classList.contains('mermaid--whole-page')
    );
    assert.ok(isWholePage, 'tall diagram should have mermaid--whole-page class');
    assert.ok(d.height > MAX_DIAGRAM_HEIGHT, `box ${d.height}px should exceed content-box cap ${MAX_DIAGRAM_HEIGHT}`);
    assert.ok(d.height <= WHOLE_PAGE_HEIGHT + 1, `box ${d.height}px exceeds whole-page cap ${WHOLE_PAGE_HEIGHT}`);
  } finally {
    await browser.close();
  }
});

test('XL diagram (extremely tall) gets whole-page with accepted scale', { timeout: 120000 }, async () => {
  const { browser, page } = await launch();
  try {
    const nodes = [];
    for (let i = 1; i <= 150; i++) nodes.push(`N${i}`);
    const edges = [];
    for (let i = 1; i < 150; i++) edges.push(`N${i}-->N${i + 1}`);
    const flow = `flowchart TD;\n    ${nodes.join(' & ')}\n    ${edges.join('\n    ')}`;
    await page.setContent(wrapHtml(`<div class="mermaid">${escapeHtml(flow)}</div>`), { waitUntil: 'domcontentloaded' });
    await renderMermaid(page, 'terminal', {
      maxWidth: MAX_WIDTH, maxHeight: MAX_DIAGRAM_HEIGHT,
      wholePageHeight: WHOLE_PAGE_HEIGHT, allowWholePage: true,
    });
    const d = await dims(page);
    const isWholePage = await page.evaluate(() =>
      document.querySelector('.mermaid').classList.contains('mermaid--whole-page')
    );
    assert.ok(isWholePage, 'XL diagram should have mermaid--whole-page class');
    assert.ok(d.height <= WHOLE_PAGE_HEIGHT + 1, `box ${d.height}px exceeds whole-page cap`);
  } finally {
    await browser.close();
  }
});

test('wide gantt does not get whole-page even when allowed', { timeout: 60000 }, async () => {
  const { browser, page } = await launch();
  try {
    const gantt = [
      'gantt', '    title Wide schedule', '    dateFormat YYYY-MM-DD',
      '    section Planning', '    Write proposal        :a1, 2026-01-01, 30d',
      '    Gather requirements   :a2, 2026-02-01, 45d',
      '    Design architecture   :a3, 2026-03-15, 60d',
      '    section Development', '    Implement core module :d1, 2026-05-15, 90d',
      '    Implement second part :d2, 2026-08-15, 75d',
      '    Implement third part  :d3, 2026-11-01, 60d',
      '    section Testing', '    Unit and integration  :t1, 2027-01-01, 60d',
      '    Load and stress tests :t2, 2027-03-01, 45d',
      '    User acceptance       :t3, 2027-04-15, 30d',
      '    section Release', '    Package and document  :r1, 2027-05-15, 20d',
      '    Deploy and monitor    :r2, 2027-06-01, 15d',
    ].join('\n');
    await page.setContent(wrapHtml(`<div class="mermaid">${escapeHtml(gantt)}</div>`), { waitUntil: 'domcontentloaded' });
    await renderMermaid(page, 'terminal', {
      maxWidth: MAX_WIDTH, maxHeight: MAX_DIAGRAM_HEIGHT,
      wholePageHeight: WHOLE_PAGE_HEIGHT, allowWholePage: true,
    });
    const isWholePage = await page.evaluate(() =>
      document.querySelector('.mermaid').classList.contains('mermaid--whole-page')
    );
    assert.ok(!isWholePage, 'wide gantt should not get whole-page treatment');
    const d = await dims(page);
    assert.ok(d.height <= MAX_DIAGRAM_HEIGHT + 1, `wide gantt ${d.height}px should stay within content-box cap`);
  } finally {
    await browser.close();
  }
});

test('whole-page is disabled when mermaidMaxHeight is set', { timeout: 90000 }, async () => {
  const { browser, page } = await launch();
  try {
    const nodes = [];
    for (let i = 1; i <= 60; i++) nodes.push(`N${i}`);
    const edges = [];
    for (let i = 1; i < 60; i++) edges.push(`N${i}-->N${i + 1}`);
    const flow = `flowchart TD;\n    ${nodes.join(' & ')}\n    ${edges.join('\n    ')}`;
    await page.setContent(wrapHtml(`<div class="mermaid">${escapeHtml(flow)}</div>`), { waitUntil: 'domcontentloaded' });
    await renderMermaid(page, 'terminal', {
      maxWidth: MAX_WIDTH, maxHeight: MAX_DIAGRAM_HEIGHT,
      wholePageHeight: WHOLE_PAGE_HEIGHT, allowWholePage: false,
    });
    const isWholePage = await page.evaluate(() =>
      document.querySelector('.mermaid').classList.contains('mermaid--whole-page')
    );
    assert.ok(!isWholePage, 'should not be whole-page when allowWholePage is false');
    const d = await dims(page);
    assert.ok(d.height <= MAX_DIAGRAM_HEIGHT + 1, `box ${d.height}px should stay within content-box cap`);
  } finally {
    await browser.close();
  }
});

test('legibility floor threshold is above 0.5', () => {
  assert.ok(LEGIBILITY_SCALE_FLOOR > 0.5, 'floor should only trigger for clearly tiny text');
});

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
