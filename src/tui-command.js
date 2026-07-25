import { Command } from 'commander';
import { listPresets } from './presets.js';
import { launchTui } from './tui.js';
import { handleCliError } from './utils.js';

const program = new Command();

program
  .name('forgr-tui')
  .description('Launch an interactive preset picker, then convert Markdown to PDF')
  .argument('<input>', 'Markdown file to convert')
  .option('-o, --output <path>', 'Output PDF path (default: same directory as input)')
  .option('--toc', 'Force generate table of contents')
  .option('--no-toc', 'Skip table of contents')
  .action(async (input, options) => {
    const presets = listPresets();

    try {
      await launchTui(presets, input, { output: options.output, toc: options.toc });
    } catch (err) {
      console.error(`\u2717 Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parseAsync(process.argv).catch(handleCliError);
