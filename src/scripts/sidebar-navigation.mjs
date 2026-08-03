function entryById(entries, id) {
  return entries.find((entry) => entry.id === id);
}

function parentId(entry) {
  return entry.parent ?? entry.category ?? null;
}

export function navigationEntryClasses(entry, { active = false, previewMode = false } = {}) {
  return ['tree__article', active && 'is-active', previewMode && entry.published !== true && 'is-unpublished'].filter(Boolean).join(' ');
}

export function rootIdForEntry(entries, id) {
  const seen = new Set();
  let current = entryById(entries, id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = parentId(current);
    const parentEntry = entryById(entries, parent);
    if (!parentEntry) return parent;
    current = parentEntry;
  }
  return null;
}

export function sidebarContext({ categories, entries, rootId, focusId }) {
  const root = categories.find((category) => category.id === rootId);
  if (!root) return null;

  const path = [];
  const seen = new Set();
  let current = focusId && entryById(entries, focusId);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current);
    const parent = parentId(current);
    if (parent === rootId) break;
    current = entryById(entries, parent);
  }

  const focused = path.length && parentId(path[0]) === rootId ? path.at(-1) : null;
  const containerId = focused?.id ?? rootId;
  return {
    root,
    focus: focused,
    path,
    children: entries.filter((entry) => parentId(entry) === containerId),
  };
}

export function parentFocus(entries, rootId, focusId) {
  const focus = entryById(entries, focusId);
  const parent = focus && parentId(focus);
  return parent && parent !== rootId ? parent : null;
}
