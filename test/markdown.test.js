import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../src/markdown.js';

test('renders a basic paragraph', () => {
  const html = renderMarkdown('Hello world');
  assert.match(html, /<p>Hello world<\/p>/);
});

test('renders a heading', () => {
  const html = renderMarkdown('## Section One');
  assert.match(html, /<h2>Section One<\/h2>/);
});

test('renders fenced mermaid block as .mermaid div', () => {
  const src = '```mermaid\ngraph TD; A-->B;\n```';
  const html = renderMarkdown(src);
  assert.match(html, /<div class="mermaid">/);
  assert.match(html, /graph TD/);
  // must NOT be wrapped in <pre><code>
  assert.doesNotMatch(html, /<pre>/);
});

test('renders non-mermaid fenced code with highlight.js wrapper', () => {
  const src = '```js\nconst x = 1;\n```';
  const html = renderMarkdown(src);
  assert.match(html, /<pre>/);
  assert.match(html, /<code/);
});

test('renders inline code', () => {
  const html = renderMarkdown('Use `forgr file.md` to convert');
  assert.match(html, /<code>forgr file\.md<\/code>/);
});

test('renders blockquote', () => {
  const html = renderMarkdown('> This is a note');
  assert.match(html, /<blockquote>/);
});

test('renders a table', () => {
  const src = '| A | B |\n|---|---|\n| 1 | 2 |';
  const html = renderMarkdown(src);
  assert.match(html, /<table>/);
  assert.match(html, /<th>A<\/th>/);
  assert.match(html, /<span class="num">1<\/span>/);
});

test('sub and sup plugins render correctly', () => {
  assert.match(renderMarkdown('H~2~O'), /<sub>2<\/sub>/);
  assert.match(renderMarkdown('x^2^'), /<sup>2<\/sup>/);
});

test('strips leading "N." number prefix from h2 headings', () => {
  const html = renderMarkdown('## 4. Component Stylings');
  assert.match(html, /<h2>Component Stylings<\/h2>/);
  assert.doesNotMatch(html, /4\./);
});

test('strips leading "N)" number prefix from h2 headings', () => {
  const html = renderMarkdown('## 2) Overview');
  assert.match(html, /<h2>Overview<\/h2>/);
});

test('does not strip leading numbers from h3 headings', () => {
  const html = renderMarkdown('### 4.1 Details');
  assert.match(html, /4\.1 Details/);
});
