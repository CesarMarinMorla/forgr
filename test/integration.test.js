import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { open } from 'node:fs/promises';
import { run } from '../src/pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_MD = path.join(__dirname, 'fixtures', 'basic.md');
const OUTPUT_PDF = path.join(__dirname, 'fixtures', 'basic.pdf');

before(async () => {
  await fs.remove(OUTPUT_PDF);
});

after(async () => {
  await fs.remove(OUTPUT_PDF);
});

test('integration: converts basic.md to a PDF file', { timeout: 60000 }, async () => {
  await run(FIXTURE_MD, { output: OUTPUT_PDF });

  const exists = await fs.pathExists(OUTPUT_PDF);
  assert.ok(exists, 'PDF file was not created');

  const stats = await fs.stat(OUTPUT_PDF);
  assert.ok(stats.size > 1024, `PDF is suspiciously small: ${stats.size} bytes`);

  // Verify PDF magic bytes (%PDF-)
  const buf = Buffer.alloc(5);
  const handle = await open(OUTPUT_PDF, 'r');
  await handle.read(buf, 0, 5, 0);
  await handle.close();
  assert.equal(buf.toString('ascii'), '%PDF-', 'Output does not start with PDF magic bytes');
});
