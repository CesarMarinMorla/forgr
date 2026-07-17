import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WRITEABLE_KEYS, buildWriteKeys, printOutputMsg, handleCliError } from '../../src/utils.js';

test('WRITEABLE_KEYS is preset and toc', () => {
  assert.deepEqual(WRITEABLE_KEYS, ['preset', 'toc']);
});

test('buildWriteKeys: returns empty object when no keys match', () => {
  assert.deepEqual(buildWriteKeys({ color: 'red' }), {});
});

test('buildWriteKeys: returns matching keys from options', () => {
  assert.deepEqual(buildWriteKeys({ preset: 'academic' }), { preset: 'academic' });
});

test('buildWriteKeys: returns multiple matching keys', () => {
  assert.deepEqual(buildWriteKeys({ preset: 'minimal', toc: true }), { preset: 'minimal', toc: true });
});

test('buildWriteKeys: skips undefined values', () => {
  assert.deepEqual(buildWriteKeys({ preset: 'terminal', toc: undefined }), { preset: 'terminal' });
});

test('buildWriteKeys: skips falsy but defined values', () => {
  assert.deepEqual(buildWriteKeys({ preset: undefined, toc: false }), { toc: false });
});

test('printOutputMsg logs the correct message', () => {
  const logs = [];
  const orig = console.log;
  console.log = (msg) => logs.push(msg);
  try {
    printOutputMsg('/tmp/test.pdf');
    assert.equal(logs.length, 1);
    assert.match(logs[0], /\/tmp\/test\.pdf/);
  } finally {
    console.log = orig;
  }
});

test('handleCliError logs the error message and exits', () => {
  const logs = [];
  let exitCode = null;
  const origLog = console.error;
  const origExit = process.exit;
  console.error = (msg) => logs.push(msg);
  process.exit = (code) => { exitCode = code; throw new Error(`exit ${code}`); };
  try {
    assert.throws(() => handleCliError(new Error('boom')), /exit 1/);
    assert.equal(logs.length, 1);
    assert.match(logs[0], /boom/);
    assert.equal(exitCode, 1);
  } finally {
    console.error = origLog;
    process.exit = origExit;
  }
});
