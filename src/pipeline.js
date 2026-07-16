import path from 'path';
import fs from 'fs-extra';
import './browsers-path.js';
import { renderMarkdown } from './markdown.js';
import { renderTemplate } from './template.js';
import { generatePdf } from './pdf.js';
import { DEFAULTS } from './config.js';

function wordCount(str) {
  return str.split(/\s+/).filter(Boolean).length;
}

function templateContext(body, options) {
  const preset = options.preset || DEFAULTS.preset;
  return {
    body,
    preset,
    timestamp: new Date().toISOString().slice(0, 10),
  };
}

async function renderStage(markdown, options, absInput, outputPath, withToc, headingPages) {
  const baseDir = path.dirname(absInput);
  const { body, tocHtml } = renderMarkdown(markdown, { toc: withToc, headingPages, baseDir });
  const html = await renderTemplate(templateContext(tocHtml + body, options));
  return generatePdf(html, outputPath, { captureHeadings: !withToc, preset: options.preset || DEFAULTS.preset });
}

export async function run(inputPath, options = {}) {
  const absInput = path.resolve(inputPath);

  if (!await fs.pathExists(absInput)) {
    throw new Error(`file not found: ${absInput}`);
  }

  const outputPath = options.output
    ? path.resolve(options.output)
    : path.join(path.dirname(absInput), `${path.basename(absInput, path.extname(absInput))}.pdf`);

  let markdown;
  try {
    markdown = await fs.readFile(absInput, 'utf8');
  } catch (err) {
    throw new Error(`could not read ${absInput}: ${err.message}`);
  }

  // TOC decision: --toc / --no-toc win; otherwise auto-detect
  let toc = options.toc;
  if (toc === undefined) {
    toc = wordCount(markdown) >= DEFAULTS.toc.longDocWords;
  }

  let result;
  try {
    result = await renderStage(markdown, options, absInput, outputPath, false);
  } catch (err) {
    throw new Error(`render failed: ${err.message}`);
  }

  const { pageCount, headingPages } = result;

  // Decide if TOC should be included
  const needsToc = toc === true || (toc === false && options.toc === undefined && pageCount >= DEFAULTS.toc.minPages);

  if (needsToc) {
    try {
      await renderStage(markdown, options, absInput, outputPath, true, headingPages);
    } catch (err) {
      throw new Error(`render failed: ${err.message}`);
    }
  }

  return outputPath;
}
