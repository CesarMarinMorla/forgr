import { existsSync, rmSync } from 'fs';
import { dirname } from 'path';
import { BROWSERS_PATH } from './browsers-path.js';

const FORGR_DIR = dirname(BROWSERS_PATH);

export function runUninstall() {
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
}