import { homedir } from 'os';
import { join } from 'path';

export const BROWSERS_PATH = join(homedir(), '.forgr', 'browsers');

// Must be set before playwright is imported anywhere in the process.
// Importing this module early (bin/forgr, pipeline.js) ensures the env var
// is in place before playwright-core resolves its executable path.
process.env.PLAYWRIGHT_BROWSERS_PATH = BROWSERS_PATH;
