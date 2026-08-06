import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { templateContext } from '../../src/pipeline.js';

// Inline the path resolution logic from pipeline.js so we can test it
// without spinning up Playwright. If the logic moves, update here too.
function resolveOutputPath(inputPath, outputOption) {
  if (outputOption) return path.resolve(outputOption);
  return path.join(
    path.dirname(path.resolve(inputPath)),
    `${path.basename(inputPath, path.extname(inputPath))}.pdf`
  );
}

test('default output path: same dir, .pdf extension', () => {
  const result = resolveOutputPath('/docs/report.md', undefined);
  assert.equal(result, '/docs/report.pdf');
});

test('default output path: strips existing extension correctly', () => {
  const result = resolveOutputPath('/docs/notes.md', undefined);
  assert.equal(result, '/docs/notes.pdf');
});

test('--output option overrides default', () => {
  const result = resolveOutputPath('/docs/report.md', '/tmp/out.pdf');
  assert.equal(result, '/tmp/out.pdf');
});

test('--output resolves relative paths to absolute', () => {
  const result = resolveOutputPath('/docs/report.md', 'out.pdf');
  assert.equal(result, path.resolve('out.pdf'));
});

test('templateContext exposes the raw front-matter data for templates', () => {
  const config = {
    preset: 'technical',
    meta: { title: 'Ops Guide', date: undefined, author: undefined },
    data: { title: 'Ops Guide', tags: ['infra'], forgr: { preset: 'technical' } },
  };
  const ctx = templateContext('<p>body</p>', config);
  assert.equal(ctx.preset, 'technical');
  assert.deepEqual(ctx.data, config.data);
  assert.equal(ctx.data.tags[0], 'infra');
});

test('templateContext keeps data undefined when absent', () => {
  const ctx = templateContext('<p>body</p>', { preset: 'terminal', meta: {} });
  assert.equal(ctx.data, undefined);
});
