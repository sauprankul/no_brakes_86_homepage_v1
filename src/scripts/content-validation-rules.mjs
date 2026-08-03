export function configuredThumbnailError(configured, resolved) {
  if (typeof configured !== 'string' || !configured.trim()) return '';
  return typeof resolved === 'string' && resolved.trim() ? '' : `configured thumbnail "${configured}" does not resolve to public media.`;
}
