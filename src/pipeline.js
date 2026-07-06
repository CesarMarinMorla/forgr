import path from 'path';
import fs from 'fs-extra';
import './browsers-path.js';
import { renderMarkdown } from './markdown.js';
import { renderTemplate } from './template.js';
import { generatePdf } from './pdf.js';

export async function run(inputPath, options = {}) {
  // Resolve input path
  const absInput = path.resolve(inputPath);

  if (!await fs.pathExists(absInput)) {
    console.error(`Error: file not found: ${absInput}`);
    process.exit(1);
  }

  // Resolve output path
  const outputPath = options.output
    ? path.resolve(options.output)
    : path.join(path.dirname(absInput), `${path.basename(absInput, path.extname(absInput))}.pdf`);

  // Read markdown
  let markdown;
  try {
    markdown = await fs.readFile(absInput, 'utf8');
  } catch (err) {
    console.error(`Error reading ${absInput}: ${err.message}`);
    process.exit(1);
  }

  // Markdown -> HTML body
  const body = renderMarkdown(markdown);

  // Assemble full HTML via template
  const html = await renderTemplate({
    body,
    preset: options.preset || 'systems-log',
    label: `forgr / ${options.preset || 'systems-log'} / ${path.basename(absInput)}`,
    timestamp: new Date().toISOString(),
  });

  // Render PDF
  await generatePdf(html, outputPath);

  console.log(`Written: ${outputPath}`);
}
