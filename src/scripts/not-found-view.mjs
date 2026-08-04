const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

export function notFoundMarkup(pathname, seconds) {
  return `<section class="not-found" aria-labelledby="not-found-title"><p class="eyebrow">404 · NOT FOUND</p><h1 id="not-found-title">That page isn't here.</h1><p><code>${esc(pathname)}</code> does not match a page or downloadable file.</p><p>Returning home in <strong data-not-found-countdown>${seconds}</strong> second${seconds === 1 ? '' : 's'}.</p><a class="not-found__home" href="/">Go home now</a></section>`;
}
