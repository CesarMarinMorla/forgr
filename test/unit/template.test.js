import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { renderTemplate } from '../../src/template.js';
import { PresetNotFoundError } from '../../src/errors.js';

test('renderTemplate embeds the built-in preset CSS', async () => {
  const html = await renderTemplate({ preset: 'terminal' });
  assert.ok(html.includes('<style>'));
  assert.ok(html.includes('terminal'));
});

test('renderTemplate uses the user preset css_file', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'forgr-template-'));
  try {
    writeFileSync(join(dir, 'brand.json'), JSON.stringify({ name: 'brand', description: 'Brand guide', css_file: 'brand.css' }));
    writeFileSync(join(dir, 'brand.css'), '/* brand */ .brand-accent { color: #123456; }');
    const html = await renderTemplate({ preset: 'brand' }, { userPresetsDir: dir });
    assert.ok(html.includes('.brand-accent'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('renderTemplate throws PresetNotFoundError for an unknown preset', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'forgr-template-'));
  try {
    await assert.rejects(
      () => renderTemplate({ preset: 'nope' }, { userPresetsDir: dir }),
      (err) => err instanceof PresetNotFoundError && err.available.length === 5
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
