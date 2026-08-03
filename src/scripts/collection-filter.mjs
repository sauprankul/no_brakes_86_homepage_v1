const sortableDate = (entry) => entry.date ?? entry.updatedAt ?? '';

export function filtersAreActive(filters) {
  return Boolean(filters.text || filters.articlesOnly || filters.includeTags.length || filters.excludeTags.length || filters.after || filters.before || filters.order !== 'new');
}

export function filterCollection({ direct, descendants, filters }) {
  const candidates = filtersAreActive(filters) ? descendants : direct;
  const filtered = candidates.filter((entry) => {
    const haystack = [entry.title, entry.subtitle, entry.type, ...entry.tags].join(' ').toLowerCase();
    const isArticle = entry.hasArticle !== false;
    if (filters.text && !haystack.includes(filters.text.toLowerCase())) return false;
    if (filters.articlesOnly === 'yes' && !isArticle) return false;
    if (filters.articlesOnly === 'no' && isArticle) return false;
    if (!filters.includeTags.every((tag) => entry.tags.includes(tag))) return false;
    if (filters.excludeTags.some((tag) => entry.tags.includes(tag))) return false;
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
