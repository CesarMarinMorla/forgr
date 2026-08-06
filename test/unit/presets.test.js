import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { BUILTIN_PRESETS, PRESET_COLORS, scanUserPresets, listPresets, findUserPreset } from '../../src/presets.js';

test('BUILTIN_PRESETS lists the five shipped presets', () => {
  const names = BUILTIN_PRESETS.map((p) => p.name);
  assert.deepEqual(names, ['terminal', 'minimal', 'technical', 'academic', 'newsletter']);
  for (const p of BUILTIN_PRESETS) {
    assert.equal(p.source, 'builtin');
    assert.equal(typeof p.description, 'string');
    assert.ok(p.description.length > 0);
  }
});

test('PRESET_COLORS has an entry for every built-in preset', () => {
  for (const p of BUILTIN_PRESETS) {
    assert.ok(PRESET_COLORS[p.name], `missing color for ${p.name}`);
    assert.match(PRESET_COLORS[p.name], /^#[0-9A-Fa-f]{6}$/);
  }
});

test('scanUserPresets returns [] when the directory is absent', () => {
  const dir = join(tmpdir(), `forgr-nonexistent-${Date.now()}`);
  assert.deepEqual(scanUserPresets(dir), []);
});

test('scanUserPresets discovers valid user presets', () => {
  const dir = mkdtempSync(join(tmpdir(), 'forgr-presets-'));
  try {
    writeFileSync(join(dir, 'custom.json'), JSON.stringify({ name: 'custom', description: 'My custom look' }));
    const presets = scanUserPresets(dir);
    assert.equal(presets.length, 1);
    assert.equal(presets[0].name, 'custom');
    assert.equal(presets[0].source, 'user');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('scanUserPresets skips malformed and incomplete presets', () => {
  const dir = mkdtempSync(join(tmpdir(), 'forgr-presets-'));
  try {
    writeFileSync(join(dir, 'broken.json'), '{ not valid json');
    writeFileSync(join(dir, 'incomplete.json'), JSON.stringify({ name: 'no-desc' }));
    const presets = scanUserPresets(dir);
    assert.deepEqual(presets, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('listPresets merges built-ins with user presets', () => {
  const dir = mkdtempSync(join(tmpdir(), 'forgr-presets-'));
  try {
    writeFileSync(join(dir, 'brand.json'), JSON.stringify({ name: 'brand', description: 'Brand guide' }));
    const presets = listPresets(dir);
    const names = presets.map((p) => p.name);
    assert.ok(names.includes('terminal'));
    assert.ok(names.includes('brand'));
    assert.equal(presets.filter((p) => p.name === 'brand')[0].source, 'user');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('scanUserPresets returns css_file and a resolved cssPath', () => {
  const dir = mkdtempSync(join(tmpdir(), 'forgr-presets-'));
  try {
    writeFileSync(join(dir, 'brand.json'), JSON.stringify({ name: 'brand', description: 'Brand guide', css_file: 'brand.css' }));
    const presets = scanUserPresets(dir);
    assert.equal(presets[0].css_file, 'brand.css');
    assert.equal(presets[0].cssPath, join(dir, 'brand.css'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('scanUserPresets omits css fields when css_file is absent', () => {
  const dir = mkdtempSync(join(tmpdir(), 'forgr-presets-'));
  try {
    writeFileSync(join(dir, 'custom.json'), JSON.stringify({ name: 'custom', description: 'No css' }));
    const presets = scanUserPresets(dir);
    assert.equal(presets[0].css_file, undefined);
    assert.equal(presets[0].cssPath, undefined);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('findUserPreset returns the matching preset or undefined', () => {
  const dir = mkdtempSync(join(tmpdir(), 'forgr-presets-'));
  try {
    writeFileSync(join(dir, 'brand.json'), JSON.stringify({ name: 'brand', description: 'Brand guide' }));
    const found = findUserPreset('brand', dir);
    assert.equal(found.name, 'brand');
    assert.equal(findUserPreset('nope', dir), undefined);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
