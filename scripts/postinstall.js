import { existsSync } from 'fs';
import { execSync } from 'child_process';

async function main() {
  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    console.error('');
    console.error('  Error: playwright dependency is missing.');
    console.error('  Run: npm install');
    process.exit(1);
  }

  const execPath = playwright.chromium.executablePath();

  if (existsSync(execPath)) {
    console.log('✓ Chromium already installed, skipping download.');
    return;
  }

  console.log('');
  console.log('  Downloading Chromium for PDF rendering (one-time, ~130MB)...');
  console.log('');

  try {
    execSync('npx playwright install chromium', { stdio: 'inherit' });
    console.log('✓ Chromium downloaded successfully.');
  } catch (err) {
    console.error('');
    console.error('  Failed to download Chromium.');
    console.error('');
    console.error('  Try running manually:');
    console.error('    npx playwright install chromium');
    console.error('');
    process.exit(1);
  }
}

main();
