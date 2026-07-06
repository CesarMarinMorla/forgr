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

export function renderMarkdown(source) {
  return md.render(source);
}
