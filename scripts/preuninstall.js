import { existsSync, readFileSync, readdirSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import { homedir, platform } from 'os';
import { join, dirname } from 'path';

function getPlaywrightCacheDir() {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) {
    return process.env.PLAYWRIGHT_BROWSERS_PATH;
  }
  const home = homedir();
  switch (platform()) {
    case 'darwin': return join(home, 'Library', 'Caches', 'ms-playwright');
    case 'linux': return join(home, '.cache', 'ms-playwright');
    case 'win32': return join(process.env.USERPROFILE, 'AppData', 'Local', 'ms-playwright');
    default: return null;
  }
}

function getGlobalNodeModules() {
  try {
    return execSync('npm root -g', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function hasOtherConsumers() {
  const cacheDir = getPlaywrightCacheDir();
  if (!cacheDir || !existsSync(cacheDir)) return false;

  const linksDir = join(cacheDir, '.links');
  if (!existsSync(linksDir)) return false;

  const globalModules = getGlobalNodeModules();
  const forgrDir = dirname(dirname(new URL(import.meta.url).pathname));

  try {
    const entries = readdirSync(linksDir);
    for (const entry of entries) {
      const linkFile = join(linksDir, entry);
      const target = readFileSync(linkFile, 'utf8').trim();
      if (!target) continue;

      if (!target.startsWith(forgrDir)) return true;

      if (globalModules && target.startsWith(globalModules)) {
        const pkgPath = dirname(dirname(target));
        if (pkgPath !== forgrDir && existsSync(join(pkgPath, 'package.json'))) {
          return true;
        }
      }
    }
  } catch {
    return true;
  }

  return false;
}

function removeChromiumCache() {
  const cacheDir = getPlaywrightCacheDir();
  if (!cacheDir || !existsSync(cacheDir)) return;

  const chromiumDir = join(cacheDir, 'chromium-1228');
  if (!existsSync(chromiumDir)) return;

  if (hasOtherConsumers()) {
    console.log('');
    console.log('  Chromium cache is shared by other packages — keeping it.');
    console.log(`  Location: ${chromiumDir}`);
    console.log('');
    return;
  }

  console.log('');
  console.log('  Removing orphaned Chromium cache...');
  console.log('');

  try {
    rmSync(chromiumDir, { recursive: true, force: true });
    console.log('  ✓ Removed Chromium cache.');
    console.log('');

    const headlessShellDir = join(cacheDir, 'chromium_headless_shell-1228');
    if (existsSync(headlessShellDir)) {
      rmSync(headlessShellDir, { recursive: true, force: true });
    }

    const remaining = readdirSync(cacheDir).filter(e => e !== '.links' && e !== '.' && e !== '..');
    if (remaining.length === 0) {
      rmSync(join(cacheDir, '.links'), { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`  Failed to remove Chromium cache: ${err.message}`);
    console.error(`  Remove manually: rm -rf "${chromiumDir}"`);
    console.error('');
  }
}

removeChromiumCache();
