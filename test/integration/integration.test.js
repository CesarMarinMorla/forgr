import { test, before } from 'node:test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { readdir } from 'node:fs/promises';
import { run } from '../../src/pipeline.js';
import { assertValidPdf } from './helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

const PRESET = process.env.FORGR_PRESET || 'terminal';
const VALID_PRESETS = ['terminal', 'minimal', 'technical', 'academic', 'newsletter'];
if (!VALID_PRESETS.includes(PRESET)) {
  throw new Error(`FORGR_PRESET must be one of: ${VALID_PRESETS.join(', ')} (got "${PRESET}")`);
}

const FIXTURE_ASSERTIONS = {
  'basic.md': { minSize: 10000, minPages: 1 },
  'code.md': { minSize: 20000, minPages: 1 },
  'comprehensive.md': { minSize: 80000, minPages: 4 },
  'converter_features.md': { minSize: 20000, minPages: 2 },
  'formatting.md': { minSize: 20000, minPages: 1 },
  'lists.md': { minSize: 10000, minPages: 1 },
  'namespace-test.md': { minSize: 30000, minPages: 2 },
  'shared-test.md': { minSize: 30000, minPages: 2 },
  'tables.md': { minSize: 10000, minPages: 1 },
};

// Presets that embed IBMPlex fonts. Minimal uses Helvetica fallback.
const PRESET_HAS_IBMPLEX = { terminal: true, technical: true, academic: true, newsletter: true };

async function getFixtures() {
  const entries = await readdir(FIXTURES_DIR);
  return entries
    .filter(f => f.endsWith('.md'))
    .map(f => ({
      name: f,
      input: path.join(FIXTURES_DIR, f),
      output: path.join(FIXTURES_DIR, f.replace(/\.md$/, '.pdf')),
      opts: {
        ...(FIXTURE_ASSERTIONS[f] || { minSize: 1024, minPages: 1 }),
        ...(PRESET_HAS_IBMPLEX[PRESET] ? { fontName: 'IBMPlex' } : {}),
      },
    }));
}

before(async () => {
  const fixtures = await getFixtures();
  await Promise.all(fixtures.map(f => fs.remove(f.output)));
});

const fixtures = await getFixtures();

for (const fixture of fixtures) {
  test(`integration [${PRESET}]: converts ${fixture.name} to a PDF file`, { timeout: 60000 }, async () => {
    await run(fixture.input, { output: fixture.output, preset: PRESET });
    await assertValidPdf(fixture.output, fixture.name, fixture.opts);
  });
}
