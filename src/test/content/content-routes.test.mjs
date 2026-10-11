import assert from 'node:assert/strict';
import test from 'node:test';
import { contentPath, entryRoutePath, normalizeRoutePath, resolveContentRoute, routeSegment } from '../../scripts/content-routes.mjs';

const nodes = [
  { id: 'race', parent: null, config: { title: '86 Challenge' } },
  { id: 'season', parent: 'race', config: { title: '2026 86 Challenge Season' } },
  { id: 'round-1', parent: 'season', config: { title: '2026 Rd 1: Thunderhill East Cyclone' } },
];

test('content paths are ID-based and purely hierarchical', () => {
  assert.equal(routeSegment('2026 Rd 1: Thunderhill East Cyclone'), '2026-rd-1-thunderhill-east-cyclone');
  assert.equal(contentPath(nodes, nodes[0]), '/race');
  assert.equal(contentPath(nodes, nodes[1]), '/race/season');
  assert.equal(contentPath(nodes, nodes[2]), '/race/season/round-1');
  assert.equal(normalizeRoutePath('/race/'), '/race');
});

test('article.md presence alone selects article versus preview-list rendering', () => {
  const roots = [{ id: 'race', path: '/outdated-title-route', hasArticle: false }];
  const entries = [
    { id: 'season', parent: 'race', path: '/outdated-title-route/season', hasArticle: false },
    { id: 'round-1', parent: 'season', path: '/outdated-title-route/season/round-1', hasArticle: true },
  ];
  assert.equal(resolveContentRoute(roots, entries, '/race').type, 'list');
  assert.equal(resolveContentRoute(roots, entries, '/race/season').type, 'list');
  assert.equal(resolveContentRoute(roots, entries, '/race/season/round-1').type, 'article');
  assert.equal(resolveContentRoute(roots, entries, '/missing').type, 'not-found');
});

test('hierarchical routing ignores generated path fields and uses IDs', () => {
  const roots = [{ id: 'race', name: '86 Challenge', hasArticle: false }];
  const entries = [
    { id: 'season', parent: 'race', title: '2026 86 Challenge Season', hasArticle: false },
    { id: 'round-1', parent: 'season', title: 'Round 1', hasArticle: true },
  ];
  assert.equal(entryRoutePath(roots, entries, entries[0]), '/race/season');
  assert.equal(resolveContentRoute(roots, entries, '/race/season').entry.id, 'season');
  assert.equal(resolveContentRoute(roots, entries, '/race/season/round-1').entry.id, 'round-1');
});
