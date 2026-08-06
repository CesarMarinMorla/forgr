import { test } from 'node:test';
import assert from 'node:assert/strict';
import { launchTui, classifyPreset, settingsFromFrontMatter } from '../../src/tui.js';

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

test('settingsFromFrontMatter: empty front-matter keeps defaults', () => {
  assert.deepEqual(settingsFromFrontMatter({}), {
    toc: 'auto',
    docMeta: true,
    dateFormat: 'iso',
    footer: 'page-numbers',
    cover: false,
    coverTitle: '',
    coverAuthor: '',
    coverDate: 'auto',
    coverDateText: '',
    sectionNumbering: false,
  });
});

test('settingsFromFrontMatter: present keys override defaults, rest fall back', () => {
  const result = settingsFromFrontMatter({ toc: false, footer: 'none', cover: true, sectionNumbering: true });
  assert.equal(result.toc, false);
  assert.equal(result.footer, 'none');
  assert.equal(result.cover, true);
  assert.equal(result.sectionNumbering, true);
  assert.equal(result.docMeta, true);
  assert.equal(result.dateFormat, 'iso');
});

test('settingsFromFrontMatter: cover text fields are picked up', () => {
  const result = settingsFromFrontMatter({ cover: true, coverTitle: 'Draft', coverAuthor: 'Ada', coverDate: 'custom', coverDateText: 'Q3 2026' });
  assert.equal(result.coverTitle, 'Draft');
  assert.equal(result.coverAuthor, 'Ada');
  assert.equal(result.coverDate, 'custom');
  assert.equal(result.coverDateText, 'Q3 2026');
});

test('settingsFromFrontMatter: unknown keys are ignored', () => {
  const result = settingsFromFrontMatter({ tags: ['a'], random: 1 });
  assert.deepEqual(result, settingsFromFrontMatter({}));
});
