import { marked, Renderer } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { publicMediaPath } from './media-pipeline.mjs';

function slugify(value) {
  return value.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
}

function uniqueSlug(value, used) {
  const base = slugify(value);
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count ? `${base}-${count + 1}` : base;
}

function downloadMarkup(url, label) {
  return `<a class="download-link" href="${url}" download><span class="download-link__icon" aria-hidden="true">↓</span><span><strong>${label}</strong><small>Download</small></span></a>`;
}

function sizedMediaMarkup(html, nodeId) {
  return html.replace(/\b(src|href)="\.\/Media\/([^"?#]+)([?#][^"]*)?"/gi, (_match, attribute, source, suffix = '') => {
    try {
      return `${attribute}="${publicMediaPath(nodeId, `./Media/${source}`)}${suffix}"`;
    } catch {
      return `${attribute}="./Media/${source}${suffix}"`;
    }
  });
}

export function renderArticleMarkdown(markdown, nodeId) {
  const headings = [];
  const usedIds = new Map();
  const renderer = new Renderer();
  renderer.heading = function heading({ depth, tokens }) {
    const html = this.parser.parseInline(tokens);
    const text = html.replace(/<[^>]*>/g, '');
    const id = uniqueSlug(text, usedIds);
    if (depth >= 2 && depth <= 3) headings.push({ id, text, depth });
    return `<h${depth} id="${id}">${html}</h${depth}>\n`;
  };
  const unsafeHtml = marked.parse(markdown, { renderer, gfm: true });
  const safeHtml = sanitizeHtml(unsafeHtml, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'h1', 'h2', 'h3', 'iframe', 'source', 'track', 'video'],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['class', 'id'],
      a: ['href', 'title', 'class', 'download'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
      iframe: ['src', 'title', 'loading', 'allow', 'allowfullscreen', 'referrerpolicy'],
      source: ['src', 'type'],
      track: ['src', 'kind', 'srclang', 'label', 'default'],
      video: ['src', 'poster', 'controls', 'loop', 'muted', 'autoplay', 'playsinline', 'preload', 'width', 'height'],
    },
  });
  const html = sizedMediaMarkup(safeHtml.replace(/<a href="\.\/Downloads\/([^"?#]+)">([^<]+)<\/a>/g, (_match, file, label) => downloadMarkup(`/downloads/${nodeId}/${encodeURIComponent(file)}`, label)), nodeId);
  return { html, headings };
}
