import { homedir } from 'os';
import { join, dirname } from 'path';
import { readdirSync } from 'fs';
import { rm } from 'fs/promises';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);

export const BROWSERS_PATH = join(homedir(), '.forgr', 'browsers');

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

// Must be set before playwright is imported anywhere in the process.
// Importing this module early (bin/forgr, pipeline.js) ensures the env var
// is in place before playwright-core resolves its executable path.
process.env.PLAYWRIGHT_BROWSERS_PATH = BROWSERS_PATH;
