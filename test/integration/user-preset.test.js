import { test, before, after } from 'node:test';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import fs from 'fs-extra';
import { run } from '../../src/pipeline.js';
import { assertValidPdf } from './helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
const INPUT = path.join(FIXTURES_DIR, 'basic.md');

let presetDir;
let output;

before(async () => {
  presetDir = mkdtempSync(path.join(tmpdir(), 'forgr-user-preset-'));
  output = path.join(presetDir, 'out.pdf');
  writeFileSync(path.join(presetDir, 'brand.json'), JSON.stringify({ name: 'brand', description: 'Brand guide', css_file: 'brand.css' }));
  writeFileSync(path.join(presetDir, 'brand.css'), 'body { color: #123456; }');
});

after(() => {
  rmSync(presetDir, { recursive: true, force: true });
});

test('integration: renders a PDF using a user preset css_file', { timeout: 60000 }, async () => {
  await run(INPUT, { output, preset: 'brand' }, { userPresetsDir: presetDir });
  await assertValidPdf(output, 'user-preset', { minSize: 10000, minPages: 1 });
});
