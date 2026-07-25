import { createRequire } from 'module';
import { Command } from 'commander';
import fs from 'fs-extra';
import ora from 'ora';
import { run } from './pipeline.js';
import { runUninstall } from './uninstall.js';
import { buildWriteKeys, printResult, handleCliError } from './utils.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

program
  .name('forgr')
  .description('Convert Markdown files into polished PDFs')
  .version(version);

program
  .command('uninstall')
  .description('Remove the Chromium cache (~/.forgr/browsers)')
  .action(runUninstall);

program
  .command('doctor')
  .description('Diagnose installation and fix common issues')
  .option('-f, --fix', 'Auto-fix detected issues where possible')
  .option('-v, --verbose', 'Show full paths, file sizes, and timestamps')
  .action(async (options) => {
    const { runDoctor } = await import('./doctor.js');
    const exitCode = await runDoctor(options);
    process.exit(exitCode);
  });

program
  .command('convert', { isDefault: true })
  .description('Convert a Markdown file to PDF')
  .argument('<input>', 'Markdown file to convert')
  .option('-o, --output <path>', 'Output PDF path (default: same directory as input)')
  .option('-p, --preset <name>', 'Preset to use')
  .option('--toc', 'Force generate table of contents')
  .option('--no-toc', 'Skip table of contents')
  .option('--cover', 'Add a cover page')
  .option('--cover-title <text>', 'Cover page title (default: document title)')
  .option('--cover-author <text>', 'Cover page author (default: document author)')
  .option('--cover-date <text>', 'Cover page date (default: document date)')
  .option('--section-numbering', 'Enable section numbering on headings')
  .option('--no-section-numbering', 'Disable section numbering')
  .option('--date-format <format>', 'Date format: iso | locale')
  .option('--date-locale <locale>', 'Locale for date formatting (e.g. en-US, es-ES)')
  .option('--doc-meta', 'Show document meta header (title, date, author)')
  .option('--no-doc-meta', 'Skip document meta header')
  .option('--footer <style>', 'Footer style: page-numbers | page-x-of-y | none')
  .option('--write', 'Save CLI settings into the file\'s front-matter')
  .action(async (input, options) => {
    const cliOptions = {
      preset: options.preset,
      output: options.output,
      toc: options.toc,
      dateFormat: options.dateFormat,
      dateLocale: options.dateLocale,
      docMeta: options.docMeta,
      cover: options.cover,
      coverTitle: options.coverTitle,
      coverAuthor: options.coverAuthor,
      coverDate: options.coverDate,
      sectionNumbering: options.sectionNumbering,
      footer: options.footer,
    };

    const writeKeys = buildWriteKeys(options);

    const spinner = ora('Reading file...').start();
    const startTime = Date.now();

    try {
      const result = await run(input, cliOptions, {
        write: options.write,
        writeKeys: options.write ? writeKeys : undefined,
        onProgress: (stage) => { spinner.text = stage; },
      });

      const elapsed = Date.now() - startTime;
      let fileSize;
      try {
        fileSize = (await fs.stat(result.outputPath)).size;
      } catch {}

      spinner.succeed();
      printResult({
        outputPath: result.outputPath,
        pageCount: result.pageCount,
        preset: result.preset,
        elapsed: elapsed,
        fileSize,
      });
    } catch (err) {
      spinner.fail();
      handleCliError(err);
    }
  });

program.parseAsync(process.argv).catch(handleCliError);
