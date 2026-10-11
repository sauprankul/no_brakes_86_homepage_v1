export function routeSegment(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'entry';
}

export function contentPath(nodes, node) {
  const nodeKey = (candidate) => candidate.key ?? candidate.id;
  const byKey = new Map(nodes.map((candidate) => [nodeKey(candidate), candidate]));
  const segments = [];
  const visited = new Set();
  let current = node;

  while (current && !visited.has(nodeKey(current))) {
    visited.add(nodeKey(current));
    segments.unshift(current.slug ?? current.config?.id ?? current.id);
    current = current.parent ? byKey.get(current.parent) : null;
  }

  return `/${segments.join('/')}`;
}

export function normalizeRoutePath(value) {
  const path = String(value || '/').split(/[?#]/, 1)[0].replace(/\/{2,}/g, '/');
  return path.length > 1 ? path.replace(/\/+$/, '') : '/';
}

export function entryRoutePath(roots, entries, entry) {
  return contentPath([...roots, ...entries], entry);
}

export function resolveContentRoute(roots, entries, pathname) {
  const path = normalizeRoutePath(pathname);
  if (path === '/') return { type: 'home', entry: null };
  if (path === '/about') return { type: 'about', entry: null };
  const entry = [...roots, ...entries].find((candidate) => entryRoutePath(roots, entries, candidate) === path);
  if (!entry) return { type: 'not-found', entry: null };
  return { type: entry.hasArticle === true ? 'article' : 'list', entry };
}
