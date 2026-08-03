import assert from 'node:assert/strict';
import test from 'node:test';
import { contentPath, normalizeRoutePath, resolveContentRoute, routeSegment } from '../../scripts/content-routes.mjs';

const nodes = [
  { id: 'race', parent: null, config: { title: '86 Challenge' } },
  { id: 'season', parent: 'race', config: { title: '2026 86 Challenge Season' } },
  { id: 'round-1', parent: 'season', config: { title: '2026 Rd 1: Thunderhill East Cyclone' } },
];

test('content paths are title-based and purely hierarchical', () => {
  assert.equal(routeSegment('2026 Rd 1: Thunderhill East Cyclone'), '2026-rd-1-thunderhill-east-cyclone');
  assert.equal(contentPath(nodes, nodes[0]), '/86-challenge');
  assert.equal(contentPath(nodes, nodes[1]), '/86-challenge/2026-86-challenge-season');
  assert.equal(contentPath(nodes, nodes[2]), '/86-challenge/2026-86-challenge-season/2026-rd-1-thunderhill-east-cyclone');
  assert.equal(normalizeRoutePath('/86-challenge/'), '/86-challenge');
});

test('article.md presence alone selects article versus preview-list rendering', () => {
  const roots = [{ id: 'race', path: '/86-challenge', hasArticle: false }];
  const entries = [
    { id: 'season', path: '/86-challenge/2026-86-challenge-season', hasArticle: false },
    { id: 'round-1', path: '/86-challenge/2026-86-challenge-season/round-1', hasArticle: true },
  ];
  assert.equal(resolveContentRoute(roots, entries, '/86-challenge').type, 'list');
  assert.equal(resolveContentRoute(roots, entries, '/86-challenge/2026-86-challenge-season').type, 'list');
  assert.equal(resolveContentRoute(roots, entries, '/86-challenge/2026-86-challenge-season/round-1').type, 'article');
  assert.equal(resolveContentRoute(roots, entries, '/missing').type, 'not-found');
});
