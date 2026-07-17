import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontMatter, writeForgrFrontMatter } from '../../src/frontmatter.js';
import { DEFAULTS } from '../../src/config.js';

// ---------------------------------------------------------------------------
// parseFrontMatter()
// ---------------------------------------------------------------------------

test('parseFrontMatter: no front-matter returns empty object', () => {
  const { frontMatter, rawData, body } = parseFrontMatter('# Hello\n\nBody text.');
  assert.deepEqual(frontMatter, {});
  assert.deepEqual(rawData, {});
  assert.equal(body, '# Hello\n\nBody text.');
});

test('parseFrontMatter: empty front-matter returns empty object', () => {
  const src = '---\n---\n# Hello\n\nBody.';
  const { frontMatter, rawData, body } = parseFrontMatter(src);
  assert.deepEqual(frontMatter, {});
  assert.deepEqual(rawData, {});
  assert.equal(body, '# Hello\n\nBody.');
});

test('parseFrontMatter: top-level keys only (no forgr namespace)', () => {
  const src = [
    '---',
    'preset: academic',
    'toc: true',
    'title: My Doc',
    'date: 2024-01-01',
    'author: Alice',
    '---',
    '# Body',
  ].join('\n');
  const { frontMatter } = parseFrontMatter(src);
  assert.equal(frontMatter.preset, 'academic');
  assert.equal(frontMatter.toc, 'on');
  assert.equal(frontMatter.title, 'My Doc');
  assert.equal(frontMatter.date, '2024-01-01');
  assert.equal(frontMatter.author, 'Alice');
});

test('parseFrontMatter: forgr namespace overrides top-level shared keys', () => {
  const src = [
    '---',
    'forgr:',
    '  preset: minimal',
    '  toc: false',
    '  title: Override',
    'preset: academic',
    'toc: true',
    'title: Ignored',
    '---',
    '# Body',
  ].join('\n');
  const { frontMatter } = parseFrontMatter(src);
  assert.equal(frontMatter.preset, 'minimal');
  assert.equal(frontMatter.toc, 'off');
  assert.equal(frontMatter.title, 'Override');
});

test('parseFrontMatter: forgr-only keys read from forgr namespace', () => {
  const src = [
    '---',
    'forgr:',
    '  tocTitle: Index',
    '  docMeta: false',
    '  dateFormat: long',
    '  cover: true',
    '  sectionNumbering: true',
    '  footer: none',
    '  paperFormat: Letter',
    '  margins:',
    '    top: 1in',
    '    bottom: 1in',
    '    left: 1.5in',
    '    right: 1.5in',
    '---',
    '# Body',
  ].join('\n');
  const { frontMatter } = parseFrontMatter(src);
  assert.equal(frontMatter.tocTitle, 'Index');
  assert.equal(frontMatter.docMeta, false);
  assert.equal(frontMatter.dateFormat, 'long');
  assert.equal(frontMatter.cover, true);
  assert.equal(frontMatter.sectionNumbering, true);
  assert.equal(frontMatter.footer, 'none');
  assert.equal(frontMatter.paperFormat, 'Letter');
  assert.deepEqual(frontMatter.margins, { top: '1in', bottom: '1in', left: '1.5in', right: '1.5in' });
});

test('parseFrontMatter: forgr-only keys ignored at top level', () => {
  const src = [
    '---',
    'tocTitle: Index',
    'docMeta: false',
    'dateFormat: long',
    'cover: true',
    'footer: none',
    'paperFormat: Letter',
    'margins:',
    '  top: 1in',
    '---',
    '# Body',
  ].join('\n');
  const { frontMatter } = parseFrontMatter(src);
  assert.equal(frontMatter.tocTitle, undefined);
  assert.equal(frontMatter.docMeta, undefined);
  assert.equal(frontMatter.dateFormat, undefined);
  assert.equal(frontMatter.cover, undefined);
  assert.equal(frontMatter.footer, undefined);
  assert.equal(frontMatter.paperFormat, undefined);
  assert.equal(frontMatter.margins, undefined);
});

test('parseFrontMatter: preset falls back to layout', () => {
  const src = '---\nlayout: academic\n---\n# Body';
  const { frontMatter } = parseFrontMatter(src);
  assert.equal(frontMatter.preset, 'academic');
});

test('parseFrontMatter: forgr.preset overrides layout', () => {
  const src = '---\nforgr:\n  preset: minimal\nlayout: academic\n---\n# Body';
  const { frontMatter } = parseFrontMatter(src);
  assert.equal(frontMatter.preset, 'minimal');
});

test('parseFrontMatter: toc normalization — truthy variants map to "on"', () => {
  for (const val of ['true', 'on', 'yes']) {
    const src = `---\nforgr:\n  toc: ${val}\n---\n# Body`;
    const { frontMatter } = parseFrontMatter(src);
    assert.equal(frontMatter.toc, 'on', `toc: ${val} should normalize to 'on'`);
  }
});

test('parseFrontMatter: toc normalization — falsy variants map to "off"', () => {
  for (const val of ['false', 'off', 'no']) {
    const src = `---\nforgr:\n  toc: ${val}\n---\n# Body`;
    const { frontMatter } = parseFrontMatter(src);
    assert.equal(frontMatter.toc, 'off', `toc: ${val} should normalize to 'off'`);
  }
});

test('parseFrontMatter: toc normalization — auto stays auto', () => {
  const src = '---\nforgr:\n  toc: auto\n---\n# Body';
  const { frontMatter } = parseFrontMatter(src);
  assert.equal(frontMatter.toc, 'auto');
});

test('parseFrontMatter: boolean forgr-only keys parsed correctly', () => {
  const src = [
    '---',
    'forgr:',
    '  docMeta: false',
    '  cover: true',
    '  sectionNumbering: false',
    '---',
    '# Body',
  ].join('\n');
  const { frontMatter } = parseFrontMatter(src);
  assert.equal(frontMatter.docMeta, false);
  assert.equal(frontMatter.cover, true);
  assert.equal(frontMatter.sectionNumbering, false);
});

test('parseFrontMatter: rawData contains all original YAML data', () => {
  const src = [
    '---',
    'forgr:',
    '  preset: minimal',
    '  tocTitle: Index',
    'title: My Doc',
    'tags:',
    '  - a',
    '  - b',
    '---',
    '# Body',
  ].join('\n');
  const { rawData } = parseFrontMatter(src);
  assert.equal(rawData.forgr.preset, 'minimal');
  assert.equal(rawData.title, 'My Doc');
  assert.deepEqual(rawData.tags, ['a', 'b']);
});

// ---------------------------------------------------------------------------
// writeForgrFrontMatter()
// ---------------------------------------------------------------------------

test('writeForgrFrontMatter: writes non-default value to forgr namespace', () => {
  const result = writeForgrFrontMatter('# Hello', {}, { tocTitle: 'Index' });
  assert.match(result, /forgr:\n\s+tocTitle: Index/);
  assert.match(result, /# Hello/);
});

test('writeForgrFrontMatter: omits key equal to DEFAULTS', () => {
  const result = writeForgrFrontMatter('# Hello', {}, { tocTitle: DEFAULTS.tocTitle });
  assert.doesNotMatch(result, /forgr:/);
  assert.match(result, /# Hello/);
});

test('writeForgrFrontMatter: preserves non-forgr keys in existing data', () => {
  const existing = { tags: ['docs'], author: 'Alice' };
  const result = writeForgrFrontMatter('# Hello', existing, { tocTitle: 'Index' });
  assert.match(result, /tags:\n\s+- docs/);
  assert.match(result, /author: Alice/);
  assert.match(result, /forgr:\n\s+tocTitle: Index/);
});

test('writeForgrFrontMatter: shallow merge preserves existing forgr keys not in writeKeys', () => {
  const existing = { forgr: { tocTitle: 'Old', cover: true } };
  const result = writeForgrFrontMatter('# Hello', existing, { tocTitle: 'New' });
  assert.match(result, /cover: true/);
  assert.match(result, /tocTitle: New/);
  assert.doesNotMatch(result, /tocTitle: Old/);
});

test('writeForgrFrontMatter: removes forgr namespace when all keys match defaults', () => {
  const existing = { forgr: { tocTitle: DEFAULTS.tocTitle } };
  const result = writeForgrFrontMatter('# Hello', existing, { tocTitle: DEFAULTS.tocTitle });
  assert.doesNotMatch(result, /forgr:/);
});

test('writeForgrFrontMatter: null/undefined values in writeKeys are skipped', () => {
  const result = writeForgrFrontMatter('# Hello', {}, { tocTitle: null, cover: undefined });
  assert.doesNotMatch(result, /forgr:/);
});

test('writeForgrFrontMatter: object values (margins) are written', () => {
  const margins = { top: '1in', bottom: '1in', left: '1.5in', right: '1.5in' };
  const result = writeForgrFrontMatter('# Hello', {}, { margins });
  assert.match(result, /forgr:/);
  assert.match(result, /top: 1in/);
  assert.match(result, /bottom: 1in/);
  assert.match(result, /left: 1.5in/);
  assert.match(result, /right: 1.5in/);
});

test('writeForgrFrontMatter: multiple keys written at once', () => {
  const result = writeForgrFrontMatter('# Hello', {}, { tocTitle: 'Index', cover: true, footer: 'none' });
  assert.match(result, /tocTitle: Index/);
  assert.match(result, /cover: true/);
  assert.match(result, /footer: none/);
});


