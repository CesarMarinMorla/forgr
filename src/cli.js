import { createRequire } from 'module';
import { Command } from 'commander';
import { run } from './pipeline.js';
import { runUninstall } from './uninstall.js';
import { buildWriteKeys, printOutputMsg, handleCliError } from './utils.js';

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
  .option('--write', 'Save CLI settings into the file\'s front-matter')
  .action(async (input, options) => {
    const cliOptions = {
      preset: options.preset,
      output: options.output,
      toc: options.toc,
    };

    const writeKeys = buildWriteKeys(options);

    const outputPath = await run(input, cliOptions, {
      write: options.write,
      writeKeys: options.write ? writeKeys : undefined,
    });
    printOutputMsg(outputPath);
  });

program.parseAsync(process.argv).catch(handleCliError);
