const esc = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

export function articleHeaderMarkup(article, details) {
  return `<header class="article-header"><p class="eyebrow">${esc(article.type)}</p><h1>${esc(article.title)}</h1>${article.subtitle ? `<p class="article-header__subtitle">${esc(article.subtitle)}</p>` : ''}<div class="article-info">${details}</div></header>`;
}
