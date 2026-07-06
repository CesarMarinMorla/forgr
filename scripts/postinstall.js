import { existsSync, readdirSync } from 'fs';
import { rm } from 'fs/promises';
import { execSync } from 'child_process';
import { homedir } from 'os';
import { join } from 'path';

const BROWSERS_PATH = join(homedir(), '.forgr', 'browsers');

async function removeFfmpeg() {
  let entries;
  try {
    entries = readdirSync(BROWSERS_PATH);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.startsWith('ffmpeg-')) {
      await rm(join(BROWSERS_PATH, entry), { recursive: true, force: true });
    }
  }
}

async function main() {
  process.env.PLAYWRIGHT_BROWSERS_PATH = BROWSERS_PATH;

  let playwright;
  try {
    playwright = await import('playwright-core');
  } catch {
    console.error('');
    console.error('  Error: playwright-core dependency is missing.');
    console.error('  Run: npm install');
    process.exit(1);
  }

  const isolatedExecPath = playwright.chromium.executablePath();

  if (existsSync(isolatedExecPath)) {
    console.log('');
    console.log('  ✓ Chromium already installed, skipping download.');
    console.log('');
    return;
  }

  console.log('');
  console.log('  Downloading Chromium for PDF rendering (one-time, ~100MB)...');
  console.log(`  Installing to: ${BROWSERS_PATH}`);
  console.log('');

  const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: BROWSERS_PATH };

  try {
    execSync('npx playwright-core install chromium-headless-shell', {
      stdio: 'inherit',
      env,
    });
    // Playwright unconditionally downloads FFmpeg alongside any browser install.
    // forgr never uses FFmpeg — remove it to keep the install footprint minimal.
    await removeFfmpeg();
    console.log('');
    console.log('  ✓ Chromium downloaded successfully.');
    console.log('');
  } catch {
    console.error('');
    console.error('  Failed to download Chromium.');
    console.error('');
    console.error('  Try running manually:');
    console.error('    PLAYWRIGHT_BROWSERS_PATH=~/.forgr/browsers npx playwright-core install chromium-headless-shell');
    console.error('');
    process.exit(1);
  }
}

main();
