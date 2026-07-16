import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, statSync, openSync, readSync, closeSync } from 'fs';
import { run } from '../src/pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const COMPREHENSIVE_MD = path.join(FIXTURES_DIR, 'comprehensive.md');

const PRESETS = ['terminal', 'minimal', 'technical', 'academic', 'newsletter'];

function assertValidPdf(outputPath, label) {
  assert.ok(existsSync(outputPath), `${label}: PDF file was not created`);

  const stats = statSync(outputPath);
  assert.ok(stats.size > 1024, `${label}: PDF is suspiciously small (${stats.size} bytes)`);

  const buf = Buffer.alloc(5);
  const fd = openSync(outputPath, 'r');
  readSync(fd, buf, 0, 5, 0);
  closeSync(fd);
  assert.equal(buf.toString('ascii'), '%PDF-', `${label}: output does not start with PDF magic bytes`);
}

for (const preset of PRESETS) {
  test(`comprehensive [${preset}]: renders all document features`, { timeout: 60000 }, async () => {
    const output = path.join(FIXTURES_DIR, `comprehensive-${preset}.pdf`);
    await run(COMPREHENSIVE_MD, { output, preset });
    assertValidPdf(output, preset);
  });
}
