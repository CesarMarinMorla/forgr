import { createRequire } from 'module';
import { Command } from 'commander';
import { existsSync, rmSync } from 'fs';
import { dirname } from 'path';
import { run } from './pipeline.js';
import { BROWSERS_PATH } from './browsers-path.js';
import { printOutputMsg, handleCliError } from './utils.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const FORGR_DIR = dirname(BROWSERS_PATH);

const program = new Command();

program
  .name('forgr')
  .description('Convert Markdown files into polished PDFs')
  .version(version);

program
  .command('uninstall')
  .description('Remove the Chromium cache (~/.forgr/browsers)')
  .action(() => {
    if (!existsSync(BROWSERS_PATH)) {
      console.log('');
      console.log('  Nothing to remove — Chromium cache not found.');
      console.log('');
      console.log('  To fully uninstall forgr: npm uninstall -g forgr');
      console.log('');
      process.exit(0);
    }

    console.log('');
    console.log('  Removing Chromium cache...');
    console.log(`  Location: ${BROWSERS_PATH}`);
    console.log('');

    try {
      rmSync(BROWSERS_PATH, { recursive: true, force: true });

      // Remove ~/.forgr itself if now empty
      try {
        rmSync(FORGR_DIR);
      } catch {
        // not empty, leave it
      }

      console.log('  Chromium cache removed.');
      console.log('');
      console.log('  To fully uninstall forgr: npm uninstall -g forgr');
      console.log('');
    } catch (err) {
      console.error(`  Failed to remove cache: ${err.message}`);
      console.error(`  Remove manually: rm -rf "${BROWSERS_PATH}"`);
      console.error('');
      process.exit(1);
    }
  });

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
  .action(async (input, options) => {
    const cliOptions = {
      preset: options.preset,
      output: options.output,
      toc: options.toc === true ? 'on' : options.toc === false ? 'off' : undefined,
    };
    const outputPath = await run(input, cliOptions);
    printOutputMsg(outputPath);
  });

program.parseAsync(process.argv).catch(handleCliError);
