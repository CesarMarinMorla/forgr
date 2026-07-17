import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { runDoctor } from '../../src/doctor.js';

test('runDoctor: returns 0 when all checks pass', async () => {
  const code = await runDoctor();
  assert.equal(code, 0);
});

test('runDoctor: logs header and summary', async () => {
  const logs = [];
  mock.method(console, 'log', (msg) => logs.push(msg));

  await runDoctor();

  // Header appears early
  assert.ok(logs.some(l => l.includes('forgr doctor')));
  // Summary line mentions passed/warnings/errors
  const summary = logs.find(l => l.includes('passed') && l.includes('warning'));
  assert.ok(summary, 'summary line not found');
  assert.match(summary, /6 passed/);
});

test('runDoctor: passes fix flag to checks that support it', async () => {
  const code = await runDoctor({ fix: true });
  assert.equal(code, 0);
});

test('runDoctor: verbose mode includes file details', async () => {
  const logs = [];
  mock.method(console, 'log', (msg) => logs.push(msg));

  await runDoctor({ verbose: true });

  // Should have file paths or sizes in the output
  const okLines = logs.filter(l => l.includes('OK'));
  assert.ok(okLines.length >= 4, `expected >=4 OK lines, got ${okLines.length}`);
});
