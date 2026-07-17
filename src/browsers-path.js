import { homedir, platform } from 'os';
import { join, dirname } from 'path';
import { existsSync, readdirSync } from 'fs';
import { rm } from 'fs/promises';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);

export const BROWSERS_PATH = join(homedir(), '.forgr', 'browsers');

export function initBrowsersPath() {
  process.env.PLAYWRIGHT_BROWSERS_PATH = BROWSERS_PATH;
}

let _installCmd = null;
export function getChromiumInstallCmd() {
  if (!_installCmd) {
    const pkgPath = _require.resolve('playwright-core/package.json');
    const cliPath = join(dirname(pkgPath), 'cli.js');
    _installCmd = `node "${cliPath}" install chromium-headless-shell`;
  }
  return _installCmd;
}

export async function removeFfmpeg() {
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

export function getHeadlessShellPath() {
  let entries;
  try {
    entries = readdirSync(BROWSERS_PATH).filter(e => e.startsWith('chromium_headless_shell-'));
  } catch {
    return null;
  }
  if (!entries.length) return null;

  const base = join(BROWSERS_PATH, entries[0]);
  const binaryName = platform() === 'win32'
    ? 'chrome-headless-shell.exe'
    : 'chrome-headless-shell';

  try {
    for (const entry of readdirSync(base)) {
      const candidate = join(base, entry, binaryName);
      if (existsSync(candidate)) return candidate;
    }
  } catch {
    return null;
  }

  const flat = join(base, binaryName);
  if (existsSync(flat)) return flat;

  return null;
}
