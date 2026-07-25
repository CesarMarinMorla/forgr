import { ChromiumNotFoundError, PresetNotFoundError } from './errors.js';

const G = '\x1b[32m';
const R = '\x1b[31m';
const C = '\x1b[36m';
const D = '\x1b[2m';
const N = '\x1b[0m';

export const WRITEABLE_KEYS = ['preset', 'toc', 'docMeta', 'dateFormat', 'dateLocale', 'cover', 'coverTitle', 'coverAuthor', 'coverDate', 'footer', 'sectionNumbering'];

export function buildWriteKeys(options) {
  const keys = {};
  for (const key of WRITEABLE_KEYS) {
    if (options[key] !== undefined) {
      keys[key] = options[key];
    }
  }
  return keys;
}

export function formatElapsed(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function printResult({ outputPath, pageCount, preset, elapsed, fileSize }) {
  console.log(`  ${G}\u2713${N} Written: ${outputPath}`);
  const details = [
    pageCount ? `${pageCount} pages` : null,
    fileSize ? formatFileSize(fileSize) : null,
    preset,
    elapsed != null ? formatElapsed(elapsed) : null,
  ].filter(Boolean);
  console.log(`  ${D}${details.join(' \u00B7 ')}${N}`);
}

export function printOutputMsg(outputPath) {
  console.log(`  ${G}\u2713${N} Written: ${outputPath}`);
}

export function handleCliError(err) {
  if (err instanceof ChromiumNotFoundError) {
    console.error(`  ${R}\u2717${N} ${err.message}`);
  } else if (err instanceof PresetNotFoundError) {
    console.error(`  ${R}\u2717${N} ${err.message}`);
  } else {
    console.error(`  ${R}\u2717${N} ${err.message}`);
  }
  process.exit(1);
}
