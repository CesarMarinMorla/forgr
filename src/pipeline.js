import path from 'path';
import fs from 'fs-extra';
import { initBrowsersPath } from './browsers-path.js';
initBrowsersPath();
import { parseFrontMatter, writeForgrFrontMatter } from './frontmatter.js';
import { renderMarkdown } from './markdown.js';
import { renderTemplate } from './template.js';
import { generatePdf } from './pdf.js';
import { DEFAULTS } from './config.js';
import { BUILTIN_PRESETS } from './presets.js';
import { warnUnimplemented } from './unimplemented.js';
import { PresetNotFoundError } from './errors.js';

function wordCount(str) {
  return str.split(/\s+/).filter(Boolean).length;
}

function resolveToc(config, wordCount) {
  if (config.toc === true) return true;
  if (config.toc === false) return false;
  return wordCount >= config.tocWordThreshold;
}

function buildConfig(cliOptions, frontMatter) {
  return {
    preset: cliOptions.preset ?? frontMatter.preset ?? DEFAULTS.preset,
    toc: cliOptions.toc ?? frontMatter.toc ?? DEFAULTS.toc,
    tocTitle: frontMatter.tocTitle ?? DEFAULTS.tocTitle,
    tocWordThreshold: DEFAULTS.tocWordThreshold,
    minPagesForToc: DEFAULTS.minPagesForToc,
    docMeta: frontMatter.docMeta ?? DEFAULTS.docMeta,
    dateFormat: frontMatter.dateFormat ?? DEFAULTS.dateFormat,
    dateLocale: frontMatter.dateLocale ?? DEFAULTS.dateLocale,
    cover: frontMatter.cover ?? DEFAULTS.cover,
    coverTitle: frontMatter.coverTitle ?? DEFAULTS.coverTitle,
    coverAuthor: frontMatter.coverAuthor ?? DEFAULTS.coverAuthor,
    coverDate: frontMatter.coverDate ?? DEFAULTS.coverDate,
    footer: frontMatter.footer ?? DEFAULTS.footer,
    sectionNumbering: frontMatter.sectionNumbering ?? DEFAULTS.sectionNumbering,
    paperFormat: frontMatter.paperFormat ?? DEFAULTS.paperFormat,
    margins: frontMatter.margins ?? DEFAULTS.margins,
    outputPath: cliOptions.outputPath ?? '',
    meta: {
      title: frontMatter.title,
      date: frontMatter.date,
      author: frontMatter.author,
    },
  };
}

function formatDate(dateStr, format) {
  if (dateStr) return dateStr;
  return new Date().toISOString().slice(0, 10);
}

function templateContext(body, config) {
  return {
    body,
    preset: config.preset,
    timestamp: formatDate(config.meta.date, config.dateFormat),
    title: config.meta.title || null,
    author: config.meta.author || null,
  };
}

async function renderStage(markdownBody, config, absInput, outputPath, withToc, headingPages, onProgress) {
  const baseDir = path.dirname(absInput);
  if (onProgress) onProgress('Rendering markdown...');
  const { body, tocHtml } = renderMarkdown(markdownBody, { toc: withToc, headingPages, baseDir });
  if (onProgress) onProgress('Rendering template...');
  const html = await renderTemplate(templateContext(tocHtml + body, config));
  return generatePdf(html, outputPath, { captureHeadings: !withToc, onProgress, ...config });
}

export async function run(inputPath, cliOptions = {}, { write, writeKeys, onProgress } = {}) {
  const absInput = path.resolve(inputPath);

  if (onProgress) onProgress('Reading file...');
  if (!await fs.pathExists(absInput)) {
    throw new Error(`file not found: ${absInput}`);
  }

  let outputPath = cliOptions.output
    ? path.resolve(cliOptions.output)
    : path.join(path.dirname(absInput), `${path.basename(absInput, path.extname(absInput))}.pdf`);

  let markdown;
  try {
    markdown = await fs.readFile(absInput, 'utf8');
  } catch (err) {
    throw new Error(`could not read ${absInput}: ${err.message}`);
  }

  if (onProgress) onProgress('Parsing front-matter...');
  const { frontMatter, rawData, body: markdownBody } = parseFrontMatter(markdown);
  const config = buildConfig(cliOptions, frontMatter);
  config.outputPath = outputPath;

  if (!BUILTIN_PRESETS.some(p => p.name === config.preset)) {
    throw new PresetNotFoundError(config.preset, BUILTIN_PRESETS.map(p => p.name));
  }

  warnUnimplemented(config);

  if (write && writeKeys) {
    const updated = writeForgrFrontMatter(markdownBody, rawData, writeKeys);
    await fs.writeFile(absInput, updated, 'utf8');
  }

  const needsTocByLength = resolveToc(config, wordCount(markdownBody));

  if (onProgress) onProgress('Rendering...');
  let result;
  try {
    result = await renderStage(markdownBody, config, absInput, outputPath, false, null, onProgress);
  } catch (err) {
    throw new Error(`render failed: ${err.message}`);
  }

  const { pageCount, headingPages } = result;

  const needsToc = needsTocByLength && pageCount >= config.minPagesForToc;

  if (needsToc) {
    try {
      result = await renderStage(markdownBody, config, absInput, outputPath, true, headingPages, onProgress);
    } catch (err) {
      throw new Error(`render failed: ${err.message}`);
    }
  }

  return { outputPath, pageCount, preset: config.preset };
}
