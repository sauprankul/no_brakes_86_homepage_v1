export function visibleCategories(categories, includeDrafts) {
  return includeDrafts ? categories : categories.filter((category) => category.count > 0 || category.published === true);
}

export function visibleEntries(nodes, includeDrafts) {
  return nodes.filter(({ config, parent }) => parent && (includeDrafts || config.published === true));
}
