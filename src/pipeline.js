import path from 'path';
import fs from 'fs-extra';
import './browsers-path.js';
import { renderMarkdown } from './markdown.js';
import { renderTemplate } from './template.js';
import { generatePdf } from './pdf.js';

const LONG_DOC_WORDS = 8000;
const MIN_PAGES_FOR_TOC = 3;

function wordCount(str) {
  return str.split(/\s+/).filter(Boolean).length;
}

function templateContext(body, options, absInput) {
  return {
    body,
    preset: options.preset || 'terminal',
    label: `forgr / ${options.preset || 'terminal'} / ${path.basename(absInput)}`,
    timestamp: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
  };
}

export async function run(inputPath, options = {}) {
  const absInput = path.resolve(inputPath);

  if (!await fs.pathExists(absInput)) {
    console.error(`Error: file not found: ${absInput}`);
    process.exit(1);
  }

  const outputPath = options.output
    ? path.resolve(options.output)
    : path.join(path.dirname(absInput), `${path.basename(absInput, path.extname(absInput))}.pdf`);

  let markdown;
  try {
    markdown = await fs.readFile(absInput, 'utf8');
  } catch (err) {
    console.error(`Error reading ${absInput}: ${err.message}`);
    process.exit(1);
  }

  // TOC decision: --toc / --no-toc win; otherwise auto-detect
  let toc = options.toc;
  if (toc === undefined) {
    toc = wordCount(markdown) >= LONG_DOC_WORDS;
  }

  // First render: without TOC, always capture heading pages for later use
  const { body, tocHtml } = renderMarkdown(markdown, { toc: false });
  const html = await renderTemplate(templateContext(body, options, absInput));
  const { pageCount, headingPages } = await generatePdf(html, outputPath, { captureHeadings: true });

  // Decide if TOC should be included
  const needsToc = toc === true || (toc === false && options.toc === undefined && pageCount >= MIN_PAGES_FOR_TOC);

  if (needsToc) {
    const { body: body2, tocHtml: tocHtml2 } = renderMarkdown(markdown, { toc: true, headingPages });
    const html2 = await renderTemplate(templateContext(tocHtml2 + body2, options, absInput));
    await generatePdf(html2, outputPath);
  }

  console.log(`Written: ${outputPath}`);
}
