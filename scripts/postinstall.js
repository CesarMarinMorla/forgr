import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { homedir } from 'os';
import { join } from 'path';

const BROWSERS_PATH = join(homedir(), '.forgr', 'browsers');

async function main() {
  let playwright;
  try {
    playwright = await import('playwright-core');
  } catch {
    console.error('');
    console.error('  Error: playwright dependency is missing.');
    console.error('  Run: npm install');
    process.exit(1);
  }

  // Check if headless shell already exists in our isolated directory
  const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: BROWSERS_PATH };
  const execPath = playwright.chromium.executablePath();

  // executablePath() reads PLAYWRIGHT_BROWSERS_PATH at call time — set it first
  process.env.PLAYWRIGHT_BROWSERS_PATH = BROWSERS_PATH;
  const isolatedExecPath = playwright.chromium.executablePath();

  if (existsSync(isolatedExecPath)) {
    console.log('');
    console.log('  ✓ Chromium already installed, skipping download.');
    console.log('');
    return;
  }

  console.log('');
  console.log('  Downloading Chromium for PDF rendering (one-time, ~200MB)...');
  console.log(`  Installing to: ${BROWSERS_PATH}`);
  console.log('');

  try {
    execSync('npx playwright install chromium-headless-shell', {
      stdio: 'inherit',
      env,
    });
    console.log('');
    console.log('  ✓ Chromium downloaded successfully.');
    console.log('');
  } catch {
    console.error('');
    console.error('  Failed to download Chromium.');
    console.error('');
    console.error('  Try running manually:');
    console.error('    PLAYWRIGHT_BROWSERS_PATH=~/.forgr/browsers npx playwright install chromium-headless-shell');
    console.error('');
    process.exit(1);
  }
}

main();
