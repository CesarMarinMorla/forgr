import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WRITEABLE_KEYS, buildWriteKeys, printOutputMsg,
  printResult, formatElapsed, formatFileSize, handleCliError,
} from '../../src/utils.js';
import { ChromiumNotFoundError, PresetNotFoundError } from '../../src/errors.js';

test('WRITEABLE_KEYS includes all render options', () => {
  assert.deepEqual(WRITEABLE_KEYS, ['preset', 'toc', 'docMeta', 'dateFormat', 'dateLocale', 'cover', 'coverTitle', 'coverAuthor', 'coverDate', 'coverDateText', 'footer', 'sectionNumbering']);
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
    assert.match(logs[0], /Written/);
    assert.match(logs[0], /\/tmp\/test\.pdf/);
  } finally {
    console.log = orig;
  }
});

test('formatElapsed: under 1s returns ms', () => {
  assert.equal(formatElapsed(0), '0ms');
  assert.equal(formatElapsed(340), '340ms');
  assert.equal(formatElapsed(999), '999ms');
});

test('formatElapsed: over 1s returns seconds', () => {
  assert.equal(formatElapsed(1000), '1.0s');
  assert.equal(formatElapsed(1500), '1.5s');
  assert.equal(formatElapsed(12345), '12.3s');
});

test('formatFileSize: bytes', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(1023), '1023 B');
});

test('formatFileSize: KB', () => {
  assert.equal(formatFileSize(1024), '1 KB');
  assert.equal(formatFileSize(15360), '15 KB');
  assert.equal(formatFileSize(1048575), '1024 KB');
});

test('formatFileSize: MB', () => {
  assert.equal(formatFileSize(1048576), '1.0 MB');
  assert.equal(formatFileSize(1572864), '1.5 MB');
});

test('printResult logs formatted result', () => {
  const logs = [];
  const orig = console.log;
  console.log = (msg) => logs.push(msg);
  try {
    printResult({
      outputPath: '/tmp/test.pdf',
      pageCount: 3,
      preset: 'terminal',
      elapsed: 1800,
      fileSize: 142000,
    });
    assert.equal(logs.length, 2);
    assert.match(logs[0], /\/tmp\/test\.pdf/);
    assert.match(logs[1], /3 pages/);
    assert.match(logs[1], /terminal/);
    assert.match(logs[1], /1\.8s/);
  } finally {
    console.log = orig;
  }
});

test('printResult: omits pageCount when falsy', () => {
  const logs = [];
  const orig = console.log;
  console.log = (msg) => logs.push(msg);
  try {
    printResult({
      outputPath: '/tmp/test.pdf',
      pageCount: 0,
      preset: 'terminal',
      elapsed: 500,
      fileSize: 1000,
    });
    assert.equal(logs.length, 2);
    assert.doesNotMatch(logs[1], /pages/);
  } finally {
    console.log = orig;
  }
});

test('handleCliError: ChromiumNotFoundError logs message and exits', () => {
  const logs = [];
  let exitCode = null;
  const origErr = console.error;
  const origExit = process.exit;
  console.error = (msg) => logs.push(msg);
  process.exit = (code) => { exitCode = code; throw new Error(`exit ${code}`); };
  try {
    assert.throws(() => handleCliError(new ChromiumNotFoundError()), /exit 1/);
    assert.equal(logs.length, 1);
    assert.match(logs[0], /Chromium/);
    assert.equal(exitCode, 1);
  } finally {
    console.error = origErr;
    process.exit = origExit;
  }
});

test('handleCliError: PresetNotFoundError logs message and exits', () => {
  const logs = [];
  let exitCode = null;
  const origErr = console.error;
  const origExit = process.exit;
  console.error = (msg) => logs.push(msg);
  process.exit = (code) => { exitCode = code; throw new Error(`exit ${code}`); };
  try {
    assert.throws(() => handleCliError(new PresetNotFoundError('foo', ['a', 'b'])), /exit 1/);
    assert.equal(logs.length, 1);
    assert.match(logs[0], /foo/);
    assert.match(logs[0], /a, b/);
    assert.equal(exitCode, 1);
  } finally {
    console.error = origErr;
    process.exit = origExit;
  }
});

test('handleCliError: generic Error logs message and exits', () => {
  const logs = [];
  let exitCode = null;
  const origErr = console.error;
  const origExit = process.exit;
  console.error = (msg) => logs.push(msg);
  process.exit = (code) => { exitCode = code; throw new Error(`exit ${code}`); };
  try {
    assert.throws(() => handleCliError(new Error('boom')), /exit 1/);
    assert.equal(logs.length, 1);
    assert.match(logs[0], /boom/);
    assert.equal(exitCode, 1);
  } finally {
    console.error = origErr;
    process.exit = origExit;
  }
});
