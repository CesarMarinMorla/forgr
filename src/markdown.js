import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItHighlightjs from 'markdown-it-highlightjs';
import { full as markdownItEmoji } from 'markdown-it-emoji';
import markdownItSub from 'markdown-it-sub';
import markdownItSup from 'markdown-it-sup';
import hljs from 'highlight.js/lib/core';

// Web / scripting
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import ruby from 'highlight.js/lib/languages/ruby';
import php from 'highlight.js/lib/languages/php';
import lua from 'highlight.js/lib/languages/lua';
import r from 'highlight.js/lib/languages/r';

// Systems
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import rust from 'highlight.js/lib/languages/rust';
import go from 'highlight.js/lib/languages/go';
import swift from 'highlight.js/lib/languages/swift';

// JVM
import java from 'highlight.js/lib/languages/java';
import kotlin from 'highlight.js/lib/languages/kotlin';
import scala from 'highlight.js/lib/languages/scala';
import csharp from 'highlight.js/lib/languages/csharp';

// Shell / scripting
import bash from 'highlight.js/lib/languages/bash';
import shell from 'highlight.js/lib/languages/shell';
import powershell from 'highlight.js/lib/languages/powershell';
import vbscript from 'highlight.js/lib/languages/vbscript';
import nix from 'highlight.js/lib/languages/nix';

// Data / config
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import xml from 'highlight.js/lib/languages/xml';
import ini from 'highlight.js/lib/languages/ini';
import diff from 'highlight.js/lib/languages/diff';

// Web / markup
import css from 'highlight.js/lib/languages/css';
import markdown from 'highlight.js/lib/languages/markdown';
import plaintext from 'highlight.js/lib/languages/plaintext';

// Infrastructure / ops
import sql from 'highlight.js/lib/languages/sql';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import nginx from 'highlight.js/lib/languages/nginx';
import apache from 'highlight.js/lib/languages/apache';
import makefile from 'highlight.js/lib/languages/makefile';

// API / protocols
import graphql from 'highlight.js/lib/languages/graphql';
import protobuf from 'highlight.js/lib/languages/protobuf';

// Web / scripting
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('rb', ruby);
hljs.registerLanguage('php', php);
hljs.registerLanguage('lua', lua);
hljs.registerLanguage('r', r);

// Systems
hljs.registerLanguage('c', c);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('go', go);
hljs.registerLanguage('swift', swift);

// JVM
hljs.registerLanguage('java', java);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('scala', scala);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cs', csharp);

// Shell / scripting
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('powershell', powershell);
hljs.registerLanguage('ps1', powershell);
hljs.registerLanguage('vbscript', vbscript);
hljs.registerLanguage('nix', nix);

// Data / config
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('ini', ini);
hljs.registerLanguage('toml', ini);
hljs.registerLanguage('diff', diff);
hljs.registerLanguage('patch', diff);

// Web / markup
hljs.registerLanguage('css', css);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('plaintext', plaintext);
hljs.registerLanguage('text', plaintext);

// Infrastructure / ops
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('nginx', nginx);
hljs.registerLanguage('apache', apache);
hljs.registerLanguage('makefile', makefile);
hljs.registerLanguage('make', makefile);

// API / protocols
hljs.registerLanguage('graphql', graphql);
hljs.registerLanguage('gql', graphql);
hljs.registerLanguage('protobuf', protobuf);
hljs.registerLanguage('proto', protobuf);

// To add a language not in this list:
// 1. Import it: import foo from 'highlight.js/lib/languages/foo';
// 2. Register it: hljs.registerLanguage('foo', foo);
// Full language list: https://github.com/highlightjs/highlight.js/tree/main/src/languages



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

function buildTocHtml(tokens) {
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
  html += '  <div class="toc__title">Contents</div>\n';
  html += '  <ul class="toc__list">\n';
  for (const h of headings) {
    const escaped = h.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    html += `    <li class="toc__item toc__item--h${h.level}"><a href="#${h.id}">${escaped}</a></li>\n`;
  }
  html += '  </ul>\n';
  html += '</nav>\n';

  return html;
}

export function renderMarkdown(source, { toc } = {}) {
  const tokens = md.parse(source, {});

  let tocHtml = '';
  if (toc) {
    tocHtml = buildTocHtml(tokens);
  }

  const body = wrapTableNumbers(md.renderer.render(tokens, md.options, {}));
  return { body, tocHtml };
}
