export function configuredThumbnailError(configured, resolved) {
  if (typeof configured !== 'string' || !configured.trim()) return '';
  return typeof resolved === 'string' && resolved.trim() ? '' : `configured thumbnail "${configured}" does not resolve to public media.`;
}

export function validTags(tags) {
  return tags == null || (Array.isArray(tags) && tags.every((tag) => (
    (typeof tag === 'string' && tag.trim().length > 0)
    || (typeof tag === 'number' && Number.isFinite(tag))
  )));
}

export function publishedDescriptionError({ hasArticle, subtitle, description }) {
  if (typeof subtitle === 'string' && subtitle.trim()) return '';
  if (!hasArticle && typeof description === 'string' && description.trim()) return '';
  return hasArticle ? 'published articles need a non-empty subtitle.' : 'published index entries need a non-empty subtitle or description.';
}
