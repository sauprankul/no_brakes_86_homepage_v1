export function routeSegment(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'entry';
}

export function contentPath(nodes, node) {
  const byId = new Map(nodes.map((candidate) => [candidate.id, candidate]));
  const segments = [];
  const visited = new Set();
  let current = node;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    segments.unshift(routeSegment(current.config?.slug ?? current.config?.title ?? current.title ?? current.name ?? current.id));
    current = current.parent ? byId.get(current.parent) : null;
  }

  return `/${segments.join('/')}`;
}

export function normalizeRoutePath(value) {
  const path = String(value || '/').split(/[?#]/, 1)[0].replace(/\/{2,}/g, '/');
  return path.length > 1 ? path.replace(/\/+$/, '') : '/';
}

export function resolveContentRoute(roots, entries, pathname) {
  const path = normalizeRoutePath(pathname);
  if (path === '/') return { type: 'home', entry: null };
  if (path === '/about') return { type: 'about', entry: null };
  const entry = [...roots, ...entries].find((candidate) => normalizeRoutePath(candidate.path) === path);
  if (!entry) return { type: 'not-found', entry: null };
  return { type: entry.hasArticle === true ? 'article' : 'list', entry };
}
