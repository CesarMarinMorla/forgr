import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { watchFile } from '../../src/watch.js';

function makeTempFile(name = 'note.md') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'forgr-watch-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, 'hello');
  return { dir, file };
}

function withTimeout(promise, ms = 5000, label = 'callback') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out waiting for ${label}`)), ms)),
  ]);
}

test('watchFile fires onChange when the file changes', async () => {
  const { dir, file } = makeTempFile();
  let fired = 0;
  let resolveFired;
  const firedPromise = new Promise((res) => { resolveFired = res; });
  const w = watchFile(file, () => { fired++; resolveFired(); });

  try {
    fs.writeFileSync(file, 'hello world');
    await withTimeout(firedPromise, 5000, 'change callback');
    assert.equal(fired, 1);
  } finally {
    w.close();
    fs.removeSync(dir);
  }
});

test('watchFile debounces rapid consecutive changes into one callback', async () => {
  const { dir, file } = makeTempFile();
  let fired = 0;
  let resolveFired;
  const firedOnce = new Promise((res) => { resolveFired = res; });
  const w = watchFile(file, () => { fired++; resolveFired(); }, { debounceMs: 200 });

  try {
    fs.writeFileSync(file, 'one');
    fs.writeFileSync(file, 'two');
    fs.writeFileSync(file, 'three');
    await withTimeout(firedOnce, 5000, 'debounced callback');
    await new Promise((r) => setTimeout(r, 500));
    assert.equal(fired, 1);
  } finally {
    w.close();
    fs.removeSync(dir);
  }
});

test('watchFile ignores changes to other files in the same directory', async () => {
  const { dir, file } = makeTempFile();
  const other = path.join(dir, 'other.md');
  fs.writeFileSync(other, 'other');
  let fired = 0;
  const w = watchFile(file, () => { fired++; });

  try {
    fs.writeFileSync(other, 'other content');
    await new Promise((r) => setTimeout(r, 700));
    assert.equal(fired, 0);
  } finally {
    w.close();
    fs.removeSync(dir);
  }
});

test('watchFile continues watching after the file is deleted and recreated', async () => {
  const { dir, file } = makeTempFile();
  let fired = 0;
  let resolveFired;
  const firedPromise = new Promise((res) => { resolveFired = res; });
  const w = watchFile(file, () => { fired++; resolveFired(); });

  try {
    fs.removeSync(file);
    fs.writeFileSync(file, 'recreated');
    await withTimeout(firedPromise, 5000, 'recreate callback');
    assert.ok(fired >= 1);
  } finally {
    w.close();
    fs.removeSync(dir);
  }
});

test('close() stops the watcher', async () => {
  const { dir, file } = makeTempFile();
  let fired = 0;
  const w = watchFile(file, () => { fired++; });
  w.close();

  try {
    fs.writeFileSync(file, 'changed');
    await new Promise((r) => setTimeout(r, 700));
    assert.equal(fired, 0);
  } finally {
    w.close();
    fs.removeSync(dir);
  }
});
