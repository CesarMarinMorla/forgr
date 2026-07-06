import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { open, readdir } from 'node:fs/promises';
import { run } from '../src/pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// PDFs are kept after the test run for visual review.
// They are gitignored via test/fixtures/*.pdf.

async function getFixtures() {
  const entries = await readdir(FIXTURES_DIR);
  return entries
    .filter(f => f.endsWith('.md'))
    .map(f => ({
      name: f,
      input: path.join(FIXTURES_DIR, f),
      output: path.join(FIXTURES_DIR, f.replace(/\.md$/, '.pdf')),
    }));
}

before(async () => {
  const fixtures = await getFixtures();
  await Promise.all(fixtures.map(f => fs.remove(f.output)));
});

async function assertValidPdf(outputPath, label) {
  const exists = await fs.pathExists(outputPath);
  assert.ok(exists, `${label}: PDF file was not created`);

  const stats = await fs.stat(outputPath);
  assert.ok(stats.size > 1024, `${label}: PDF is suspiciously small (${stats.size} bytes)`);

  const buf = Buffer.alloc(5);
  const handle = await open(outputPath, 'r');
  await handle.read(buf, 0, 5, 0);
  await handle.close();
  assert.equal(buf.toString('ascii'), '%PDF-', `${label}: output does not start with PDF magic bytes`);
}

const fixtures = await getFixtures();

for (const fixture of fixtures) {
  test(`integration: converts ${fixture.name} to a PDF file`, { timeout: 60000 }, async () => {
    await run(fixture.input, { output: fixture.output });
    await assertValidPdf(fixture.output, fixture.name);
  });
}
