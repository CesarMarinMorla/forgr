import { Command } from 'commander';
import { listPresets } from './presets.js';
import { launchTui } from './tui.js';
import { handleCliError } from './utils.js';

const program = new Command();

program
  .name('forgr-tui')
  .description('Interactive preset picker and batch converter')
  .action(async () => {
    const presets = listPresets();

    try {
      await launchTui(presets);
    } catch (err) {
      console.error(`\u2717 Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parseAsync(process.argv).catch(handleCliError);
