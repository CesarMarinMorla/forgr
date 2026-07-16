import { homedir } from 'os';
import { join } from 'path';
import { readdirSync } from 'fs';
import { rm } from 'fs/promises';

export const BROWSERS_PATH = join(homedir(), '.forgr', 'browsers');

export const CHROMIUM_INSTALL_CMD = 'npx playwright-core install chromium-headless-shell';

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
