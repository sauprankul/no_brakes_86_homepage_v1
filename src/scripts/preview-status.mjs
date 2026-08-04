export function previewPublicationBadge(entry) {
  return entry.published === true ? '' : '<span class="preview-status preview-status--unpublished">Unpublished</span>';
}

export function previewPublicationDate(entry, formatter) {
  return entry.date ? formatter(entry.date) : '';
}
