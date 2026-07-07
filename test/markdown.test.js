import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../src/markdown.js';

function body(source, options) {
  return renderMarkdown(source, options).body;
}

test('renders a basic paragraph', () => {
  const html = body('Hello world');
  assert.match(html, /<p>Hello world<\/p>/);
});

test('renders a heading', () => {
  const html = body('## Section One');
  assert.match(html, /<h2[^>]*>Section One<\/h2>/);
});

test('renders fenced mermaid block as .mermaid div', () => {
  const src = '```mermaid\ngraph TD; A-->B;\n```';
  const html = body(src);
  assert.match(html, /<div class="mermaid">/);
  assert.match(html, /graph TD/);
  // must NOT be wrapped in <pre><code>
  assert.doesNotMatch(html, /<pre>/);
});

test('renders non-mermaid fenced code with highlight.js wrapper', () => {
  const src = '```js\nconst x = 1;\n```';
  const html = body(src);
  assert.match(html, /<pre>/);
  assert.match(html, /<code/);
});

test('renders inline code', () => {
  const html = body('Use `forgr file.md` to convert');
  assert.match(html, /<code>forgr file\.md<\/code>/);
});

test('renders blockquote', () => {
  const html = body('> This is a note');
  assert.match(html, /<blockquote>/);
});

test('renders a table', () => {
  const src = '| A | B |\n|---|---|\n| 1 | 2 |';
  const html = body(src);
  assert.match(html, /<table>/);
  assert.match(html, /<th>A<\/th>/);
  assert.match(html, /<span class="num">1<\/span>/);
});

test('sub and sup plugins render correctly', () => {
  assert.match(body('H~2~O'), /<sub>2<\/sub>/);
  assert.match(body('x^2^'), /<sup>2<\/sup>/);
});

test('strips leading "N." number prefix from h2 headings', () => {
  const html = body('## 4. Component Stylings');
  assert.match(html, /<h2[^>]*>Component Stylings<\/h2>/);
  assert.doesNotMatch(html, /4\./);
});

test('strips leading "N)" number prefix from h2 headings', () => {
  const html = body('## 2) Overview');
  assert.match(html, /<h2[^>]*>Overview<\/h2>/);
});

test('does not strip leading numbers from h3 headings', () => {
  const html = body('### 4.1 Details');
  assert.match(html, /4\.1 Details/);
});

function tocSource() {
  const head = '# Top\n\n## Sub\n\n### Deep\n\n# Another\n\n';
  const body = 'One two three four five six seven eight nine ten.\n\n'.repeat(5);
  return head + body;
}

test('tocHtml is empty by default (toc option not passed)', () => {
  const { tocHtml } = renderMarkdown('# One\n\n# Two');
  assert.equal(tocHtml, '');
});

test('tocHtml is empty when toc is false', () => {
  const { tocHtml } = renderMarkdown(tocSource(), { toc: false });
  assert.equal(tocHtml, '');
});

test('tocHtml is generated when toc is true', () => {
  const { tocHtml } = renderMarkdown(tocSource(), { toc: true });
  assert.match(tocHtml, /<nav class="toc"/);
  assert.match(tocHtml, /Contents/);
  assert.match(tocHtml, /toc__item--h1/);
});

test('tocHtml generates nested level indentation classes', () => {
  const src = '# Top\n\n## Sub\n\n### Deep\n\n# More\n\n' + 'Padding text.\n\n'.repeat(3);
  const { tocHtml } = renderMarkdown(src, { toc: true });
  assert.match(tocHtml, /toc__item--h1/);
  assert.match(tocHtml, /toc__item--h2/);
  assert.match(tocHtml, /toc__item--h3/);
});

test('headings get id attributes via anchor plugin', () => {
  const html = body('## My Heading');
  assert.match(html, /<h2 id="my-heading"/);
});

test('h2 number stripping runs before slug generation', () => {
  const html = body('## 4. Component Stylings');
  assert.match(html, /<h2 id="component-stylings"/);
});
