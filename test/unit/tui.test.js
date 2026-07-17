import { test } from 'node:test';
import assert from 'node:assert/strict';
import { launchTui, classifyPreset } from '../../src/tui.js';

const presets = [{ name: 'terminal', description: 'd', source: 'builtin' }];

test('launchTui rejects when stdin is not a TTY', async () => {
  const original = process.stdin.isTTY;
  process.stdin.isTTY = false;
  try {
    await assert.rejects(() => launchTui(presets), /terminal/);
  } finally {
    process.stdin.isTTY = original;
  }
});

test('classifyPreset aborts when no preset is chosen', () => {
  assert.deepEqual(classifyPreset(null), { action: 'abort' });
  assert.deepEqual(classifyPreset(undefined), { action: 'abort' });
});

test('classifyPreset renders a built-in preset', () => {
  assert.deepEqual(classifyPreset({ name: 'terminal', source: 'builtin' }), {
    action: 'render',
    name: 'terminal',
  });
});

test('classifyPreset defers user presets to Milestone 5', () => {
  assert.deepEqual(classifyPreset({ name: 'brand', source: 'user' }), {
    action: 'unsupported-user',
    name: 'brand',
  });
});
