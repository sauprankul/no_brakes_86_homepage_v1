export function rootCategoryId(nodes, node) {
  const nodeKey = (candidate) => candidate.key ?? candidate.id;
  const byId = new Map(nodes.map((candidate) => [nodeKey(candidate), candidate]));
  const visited = new Set();
  let parent = node.parent;
  while (parent && !visited.has(parent)) {
    visited.add(parent);
    const parentNode = byId.get(parent);
    if (!parentNode) return parent;
    if (!parentNode.parent) return nodeKey(parentNode);
    parent = parentNode.parent;
  }
  return parent ?? null;
}

export function directCategoryChildren(entries, categoryId) {
  return entries.filter((entry) => entry.parent === categoryId).map((entry) => entry.id);
}
