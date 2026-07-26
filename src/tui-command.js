import { Command } from 'commander';
import { listPresets } from './presets.js';
import { launchTui } from './tui.js';
import { handleCliError } from './utils.js';

const program = new Command();

program
  .name('forgr-tui')
  .description('Interactive preset picker and batch converter')
  .argument('[file]', 'markdown file to process (default: scan current directory)')
  .action(async (file) => {
    const presets = listPresets();

    try {
      await launchTui(presets, file);
    } catch (err) {
      console.error(`\u2717 Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parseAsync(process.argv).catch(handleCliError);
