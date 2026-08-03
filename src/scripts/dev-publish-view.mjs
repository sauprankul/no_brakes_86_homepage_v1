export function devPublicationControlMarkup(entry, isDevelopment) {
  if (!isDevelopment) return '';
  return `<div class="dev-publish" data-dev-publish-control><span>Local preview</span><button type="button" data-dev-publish="${entry.id}">${entry.published === true ? 'Unpublish locally' : 'Publish locally'}</button></div>`;
}
