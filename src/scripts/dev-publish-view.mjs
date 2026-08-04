export function devPublicationControlMarkup(entry, isDevelopment) {
  if (!isDevelopment) return '';
  const published = entry.published === true;
  const label = published ? 'Unpublish this entry locally' : 'Publish this entry locally';
  return `<div class="dev-publish" data-dev-publish-control><button class="dev-publish__toggle ${published ? 'is-published' : 'is-unpublished'}" type="button" role="switch" aria-checked="${published}" aria-label="${label}" data-dev-publish="${entry.id}">${published ? 'Published' : 'Unpublished'}</button></div>`;
}
