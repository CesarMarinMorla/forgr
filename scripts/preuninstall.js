import { existsSync, rmSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// Hardcoded — can't import from src/browsers-path.js because npm removes
// node_modules before this preuninstall script runs.
const BROWSERS_PATH = join(homedir(), '.forgr', 'browsers');

if (!existsSync(BROWSERS_PATH)) {
  process.exit(0);
}

console.log('');
console.log('  Removing Chromium cache...');
console.log(`  Location: ${BROWSERS_PATH}`);
console.log('');

try {
  rmSync(BROWSERS_PATH, { recursive: true, force: true });
  console.log('  ✓ Chromium cache removed.');
  console.log('');
} catch (err) {
  console.error(`  Failed to remove Chromium cache: ${err.message}`);
  console.error(`  Remove manually: rm -rf "${BROWSERS_PATH}"`);
  console.error('');
}
