export const WRITEABLE_KEYS = ['preset', 'toc'];

export function buildWriteKeys(options) {
  const keys = {};
  for (const key of WRITEABLE_KEYS) {
    if (options[key] !== undefined) {
      keys[key] = options[key];
    }
  }
  return keys;
}

export function printOutputMsg(outputPath) {
  console.log(`Written: ${outputPath}`);
}

export function handleCliError(err) {
  console.error(err.message);
  process.exit(1);
}
