import { Command } from 'commander';
import { run } from './pipeline.js';

const program = new Command();

program
  .name('forgr')
  .description('Convert Markdown files into polished PDFs')
  .version('0.1.0')
  .argument('<input>', 'Markdown file to convert')
  .option('-o, --output <path>', 'Output PDF path (default: same directory as input)')
  .action(async (input, options) => {
    await run(input, options);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
