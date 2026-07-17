import { test } from 'node:test';
import path from 'path';
import { fileURLToPath } from 'url';
import { run } from '../../src/pipeline.js';
import { assertValidPdf } from './helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
const COMPREHENSIVE_MD = path.join(FIXTURES_DIR, 'comprehensive.md');

const PRESETS = ['terminal', 'minimal', 'technical', 'academic', 'newsletter'];

const PRESET_HAS_IBMPLEX = { terminal: true, technical: true, academic: true, newsletter: true };

for (const preset of PRESETS) {
  test(`comprehensive [${preset}]: renders all document features`, { timeout: 60000 }, async () => {
    const output = path.join(FIXTURES_DIR, `comprehensive-${preset}.pdf`);
    await run(COMPREHENSIVE_MD, { output, preset });
    await assertValidPdf(output, preset, {
      minSize: 80000,
      minPages: 4,
      ...(PRESET_HAS_IBMPLEX[preset] ? { fontName: 'IBMPlex' } : {}),
    });
  });
}
