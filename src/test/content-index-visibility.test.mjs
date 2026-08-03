import assert from 'node:assert/strict';
import test from 'node:test';
import { visibleCategories, visibleEntries } from '../scripts/content-index-visibility.mjs';

test('production hides empty structural categories while dev retains draft authoring context', () => {
  const categories = [{ id: 'published', count: 1 }, { id: 'draft-only', count: 0 }];
  assert.deepEqual(visibleCategories(categories, false).map((category) => category.id), ['published']);
  assert.deepEqual(visibleCategories(categories, true).map((category) => category.id), ['published', 'draft-only']);
});

test('dev includes every child entry regardless of publication status', () => {
  const nodes = [
    { id: 'root', parent: null, config: { published: false } },
    { id: 'published', parent: 'root', config: { published: true } },
    { id: 'draft', parent: 'root', config: { published: false } },
  ];
  assert.deepEqual(visibleEntries(nodes, true).map((node) => node.id), ['published', 'draft']);
  assert.deepEqual(visibleEntries(nodes, false).map((node) => node.id), ['published']);
});
