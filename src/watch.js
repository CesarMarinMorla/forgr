import path from 'path';
import { watch, statSync } from 'node:fs';

const DEFAULT_DEBOUNCE_MS = 300;

function snapshot(statResult) {
  return { mtimeMs: statResult.mtimeMs, size: statResult.size };
}

function readSnapshot(filePath) {
  try {
    return snapshot(statSync(filePath));
  } catch {
    return null;
  }
}

function changed(a, b) {
  if (a === null || b === null) return a !== b;
  return a.mtimeMs !== b.mtimeMs || a.size !== b.size;
}

export function watchFile(filePath, onChange, { debounceMs = DEFAULT_DEBOUNCE_MS } = {}) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  let timer = null;
  let closed = false;
  let last = readSnapshot(filePath);

  const schedule = () => {
    if (closed) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      timer = null;
      if (closed) return;
      try {
        await onChange();
        last = readSnapshot(filePath);
      } catch (err) {
        console.error(`watch: ${err.message}`);
      }
    }, debounceMs);
  };

  const watcher = watch(dir, (eventType, filename) => {
    if (filename !== null && filename !== base) return;
    const current = readSnapshot(filePath);
    if (!changed(current, last)) return;
    last = current;
    schedule();
  });

  return {
    close() {
      closed = true;
      if (timer) clearTimeout(timer);
      timer = null;
      watcher.close();
    },
  };
}
