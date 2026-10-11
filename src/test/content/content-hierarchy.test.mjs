import assert from 'node:assert/strict';
import test from 'node:test';
import { directCategoryChildren, rootCategoryId } from '../../scripts/content-hierarchy.mjs';

const nodes = [
  { id: 'race', parent: null },
  { id: '2026', parent: 'race' },
  { id: 'round-1', parent: '2026' },
  { id: 'cyclone', parent: 'round-1' },
];

test('nested entries retain their top-level category and direct category children stay direct', () => {
  assert.equal(rootCategoryId(nodes, nodes[1]), 'race');
  assert.equal(rootCategoryId(nodes, nodes[3]), 'race');
  const entries = [
    { id: '2026', parent: 'race' },
    { id: 'round-1', parent: '2026' },
  ];
  assert.deepEqual(directCategoryChildren(entries, 'race'), ['2026']);
});

test('nested path keys retain the top-level category', () => {
  const keyedNodes = [
    { id: 'race', key: 'archive', parent: null },
    { id: '2026', key: 'archive/season', parent: 'archive' },
    { id: 'round-1', key: 'archive/season/round-1', parent: 'archive/season' },
  ];
  assert.equal(rootCategoryId(keyedNodes, keyedNodes[2]), 'archive');
});
