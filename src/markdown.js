import { readFileSync, existsSync } from 'fs';
import path from 'path';
import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItHighlightjs from 'markdown-it-highlightjs';
import { full as markdownItEmoji } from 'markdown-it-emoji';
import markdownItSub from 'markdown-it-sub';
import markdownItSup from 'markdown-it-sup';
import matter from 'gray-matter';
import { DEFAULTS } from './config.js';
import hljs from './highlighter.js';


const FORGR_ONLY_KEYS = [
  'tocTitle', 'docMeta', 'dateFormat', 'dateLocale',
  'cover', 'coverTitle', 'coverAuthor', 'coverDate',
  'footer', 'sectionNumbering', 'paperFormat', 'margins',
];

function normalizeTocFromYaml(val) {
  if (val === true || val === 'on' || val === 'yes') return 'on';
  if (val === false || val === 'off' || val === 'no') return 'off';
  return 'auto';
}

function pickForgr(data, key) {
  const f = data.forgr || {};
  if (f[key] !== undefined) return { value: f[key], source: 'forgr' };
  if (data[key] !== undefined) return { value: data[key], source: 'shared' };
  return { value: undefined, source: null };
}

export function parseFrontMatter(source) {
  const { data, content, isEmpty } = matter(source);
  const frontMatter = {};
  if (!isEmpty) {
    const f = data.forgr || {};

    // preset: forgr > top-level > layout
    {
      const { value } = pickForgr(data, 'preset');
      if (value) frontMatter.preset = String(value);
      else if (data.layout) frontMatter.preset = String(data.layout);
    }

    // toc: forgr > top-level
    {
      const { value } = pickForgr(data, 'toc');
      if (value !== undefined) frontMatter.toc = normalizeTocFromYaml(value);
    }

    // title, date, author (shared keys with forgr override)
    for (const key of ['title', 'date', 'author']) {
      const { value } = pickForgr(data, key);
      if (value !== undefined) {
        frontMatter[key] = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
      }
    }

    // forgr-only keys
    FORGR_ONLY_KEYS.forEach((key) => {
      if (f[key] !== undefined) {
        const def = DEFAULTS[key];
        frontMatter[key] = typeof def === 'boolean' ? Boolean(f[key]) : f[key];
      }
    });
  }
  return { frontMatter, rawData: data, body: content };
}

export function writeForgrFrontMatter(body, existingData, writeKeys) {
  const data = { ...existingData };
  const f = { ...(data.forgr || {}) };

  for (const [key, value] of Object.entries(writeKeys)) {
    if (value !== undefined && value !== null) {
      if (value !== DEFAULTS[key]) {
        f[key] = typeof value === 'object' ? { ...value } : value;
      } else {
        delete f[key];
      }
    }
  }

  if (Object.keys(f).length === 0) {
    delete data.forgr;
  } else {
    data.forgr = f;
  }

  return matter.stringify(body, data);
}

function slugify(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const md = new MarkdownIt({ html: true, linkify: true, typographer: false });

md.use(markdownItHighlightjs, { auto: false, code: true, hljs });
md.use(markdownItEmoji);
md.use(markdownItSub);
md.use(markdownItSup);
md.use(markdownItAnchor, { slugify });

const IMAGE_MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const srcIndex = token.attrIndex('src');
  if (srcIndex < 0) return self.renderToken(tokens, idx, options);

  const src = token.attrs[srcIndex][1];
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return self.renderToken(tokens, idx, options);
  }

  const baseDir = env.baseDir;
  if (!baseDir) {
    throw new Error('image inlining requires baseDir in render env');
  }

  const resolvedPath = path.resolve(baseDir, src);
  if (!existsSync(resolvedPath)) {
    throw new Error(`image not found: ${resolvedPath}`);
  }

  const ext = path.extname(src).toLowerCase();
  const mime = IMAGE_MIME[ext];
  if (!mime) {
    throw new Error(`unsupported image format: ${ext} (${resolvedPath})`);
  }

  const data = readFileSync(resolvedPath);
  token.attrs[srcIndex][1] = `data:${mime};base64,${data.toString('base64')}`;
  return self.renderToken(tokens, idx, options);
};

// Render fenced mermaid blocks as <div class="mermaid"> for in-browser rendering.
// This replaces the default fence renderer only for the "mermaid" language token —
// all other languages fall through to the highlight.js renderer as normal.
const defaultFence = md.renderer.rules.fence?.bind(md.renderer) ?? ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  if (token.info.trim() === 'mermaid') {
    return `<div class="mermaid">${md.utils.escapeHtml(token.content)}</div>\n`;
  }
  return defaultFence(tokens, idx, options, env, self);
};

// Strip leading "N." or "N)" prefixes from h2 headings so CSS counters
// don't double-number headings that already include their own numbering
// (e.g. "## 4. Component Stylings" -> "## Component Stylings").
// Only h2 is affected — h3+ intentionally left alone.
// Must run BEFORE the anchor plugin so slugify gets cleaned text.
md.core.ruler.before('anchor', 'strip_h2_leading_number', (state) => {
  for (let i = 0; i < state.tokens.length; i++) {
    const token = state.tokens[i];
    if (token.type !== 'heading_open' || token.tag !== 'h2') continue;
    const inline = state.tokens[i + 1];
    if (!inline || inline.type !== 'inline') continue;
    inline.children = inline.children.map((child) => {
      if (child.type === 'text') {
        child.content = child.content.replace(/^\s*\d+[.)]\s*/, '');
      }
      return child;
    });
  }
});

function wrapTableNumbers(html) {
  return html.replace(/(<td[^>]*>)([\s\S]*?)(<\/td>)/g, (match, open, content, close) => {
    const wrapped = content.replace(/(?<=^|[>\s])(-?\d+(?:\.\d+)?)(?=[\s,;<]|$)/g, '<span class="num">$1</span>');
    return open + wrapped + close;
  });
}

function buildTocHtml(tokens, headingPages) {
  const headings = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type !== 'heading_open') continue;
    const level = parseInt(token.tag[1]);
    const id = token.attrs?.find(a => a[0] === 'id')?.[1];
    if (!id) continue;
    const inlineToken = tokens[i + 1];
    let text = '';
    if (inlineToken && inlineToken.type === 'inline') {
      text = inlineToken.children
        .filter(c => c.type === 'text' || c.type === 'code_inline')
        .map(c => c.content)
        .join('');
    }
    headings.push({ level, id, text });
  }

  if (headings.length === 0) return '';

  let html = '<nav class="toc" role="navigation">\n';
  html += `  <div class="toc__title">${DEFAULTS.tocTitle}</div>\n`;
  html += '  <ul class="toc__list">\n';
  for (const h of headings) {
    const escaped = h.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const pageInfo = headingPages?.find(p => p.id === h.id);
    const pageStr = pageInfo
      ? ` <span class="toc__page">${pageInfo.page}</span>`
      : '';
    html += `    <li class="toc__item toc__item--h${h.level}"><a href="#${h.id}">${escaped}</a>${pageStr}</li>\n`;
  }
  html += '  </ul>\n';
  html += '</nav>\n';

  return html;
}

export function renderMarkdown(source, { toc, headingPages, baseDir } = {}) {
  const tokens = md.parse(source, {});

  let tocHtml = '';
  if (toc) {
    tocHtml = buildTocHtml(tokens, headingPages);
  }

  const body = wrapTableNumbers(md.renderer.render(tokens, md.options, { baseDir }));
  return { body, tocHtml };
}
