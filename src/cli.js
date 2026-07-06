import { Command } from 'commander';
import { existsSync, rmSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { run } from './pipeline.js';

const FORGR_DIR = join(homedir(), '.forgr');
const BROWSERS_PATH = join(FORGR_DIR, 'browsers');

const program = new Command();

program
  .name('forgr')
  .description('Convert Markdown files into polished PDFs')
  .version('0.1.0');

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
  .command('convert', { isDefault: true })
  .description('Convert a Markdown file to PDF')
  .argument('<input>', 'Markdown file to convert')
  .option('-o, --output <path>', 'Output PDF path (default: same directory as input)')
  .option('-p, --preset <name>', 'Preset to use (systems-log, anthropic, minimal, technical, academic)', 'systems-log')
  .action(async (input, options) => {
    await run(input, options);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
