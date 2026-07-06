import MarkdownIt from 'markdown-it';
import markdownItHighlightjs from 'markdown-it-highlightjs';
import { full as markdownItEmoji } from 'markdown-it-emoji';
import markdownItSub from 'markdown-it-sub';
import markdownItSup from 'markdown-it-sup';

const md = new MarkdownIt({ html: true, linkify: true, typographer: false });

md.use(markdownItHighlightjs, { auto: false, code: true });
md.use(markdownItEmoji);
md.use(markdownItSub);
md.use(markdownItSup);

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
md.core.ruler.push('strip_h2_leading_number', (state) => {
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

export function renderMarkdown(source) {
  return md.render(source);
}
