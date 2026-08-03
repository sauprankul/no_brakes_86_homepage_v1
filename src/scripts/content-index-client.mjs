// This module keeps the browser's content-index selection testable without a DOM.
// A valid empty index is an intentional production state: it means no entries are
// published, not that the client may substitute fixture or draft data.
export function selectContentIndex(index) {
  if (!Array.isArray(index?.categories) || !Array.isArray(index?.articles)) {
    return { categories: [], articles: [] };
  }
  return { categories: index.categories, articles: index.articles };
}
