const sortableDate = (entry) => entry.date ?? entry.updatedAt ?? '';

export function filtersAreActive(filters) {
  return Boolean(filters.text || filters.articlesOnly || filters.includeTags.length || filters.excludeTags.length || filters.after || filters.before || filters.order !== 'new');
}

export function tagOptions(entries) {
  const counts = new Map();
  for (const tag of entries.flatMap((entry) => entry.tags ?? []).map((value) => String(value).toLowerCase())) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts].sort(([leftTag, leftCount], [rightTag, rightCount]) => rightCount - leftCount || leftTag.localeCompare(rightTag)).map(([tag]) => tag);
}

export function tagSuggestions({ options, includeTags, excludeTags, selectedKind, query = '', limit = 5 }) {
  const selected = selectedKind === 'include' ? includeTags : excludeTags;
  if (selected.length >= limit) return [];
  const unavailable = new Set([...includeTags, ...excludeTags].map((tag) => String(tag).toLowerCase()));
  const term = query.trim().toLowerCase();
  return options.filter((tag) => !unavailable.has(tag) && (!term || tag.includes(term))).slice(0, limit);
}

export function filterCollection({ direct, descendants, filters }) {
  const candidates = filtersAreActive(filters) ? descendants : direct;
  const filtered = candidates.filter((entry) => {
    const entryTags = (entry.tags ?? []).map((tag) => String(tag).toLowerCase());
    const haystack = [entry.title, entry.subtitle, entry.type, ...entryTags].join(' ').toLowerCase();
    const isArticle = entry.hasArticle !== false;
    if (filters.text && !haystack.includes(filters.text.toLowerCase())) return false;
    if (filters.articlesOnly === 'yes' && !isArticle) return false;
    if (filters.articlesOnly === 'no' && isArticle) return false;
    if (!filters.includeTags.every((tag) => entryTags.includes(tag))) return false;
    if (filters.excludeTags.some((tag) => entryTags.includes(tag))) return false;
    if (filters.after && (!entry.date || entry.date < filters.after)) return false;
    if (filters.before && (!entry.date || entry.date > filters.before)) return false;
    return true;
  });
  return filtered.sort((a, b) => {
    const publicationOrder = Number(b.published === true) - Number(a.published === true);
    if (publicationOrder) return publicationOrder;
    if (filters.order === 'title') return a.title.localeCompare(b.title);
    if (filters.order === 'old') return sortableDate(a).localeCompare(sortableDate(b));
    return sortableDate(b).localeCompare(sortableDate(a));
  });
}
