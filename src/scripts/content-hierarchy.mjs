export function rootCategoryId(nodes, node) {
  const byId = new Map(nodes.map((candidate) => [candidate.id, candidate]));
  const visited = new Set();
  let parent = node.parent;
  while (parent && !visited.has(parent)) {
    visited.add(parent);
    const parentNode = byId.get(parent);
    if (!parentNode) return parent;
    if (!parentNode.parent) return parentNode.id;
    parent = parentNode.parent;
  }
  return parent ?? null;
}

export function directCategoryChildren(entries, categoryId) {
  return entries.filter((entry) => entry.parent === categoryId).map((entry) => entry.id);
}
