export function visibleCategories(categories, includeDrafts) {
  return includeDrafts ? categories : categories.filter((category) => category.count > 0);
}
