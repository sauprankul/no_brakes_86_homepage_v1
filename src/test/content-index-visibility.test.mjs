import assert from 'node:assert/strict';
import test from 'node:test';
import { visibleCategories } from '../scripts/content-index-visibility.mjs';

test('production hides empty structural categories while dev retains draft authoring context', () => {
  const categories = [{ id: 'published', count: 1 }, { id: 'draft-only', count: 0 }];
  assert.deepEqual(visibleCategories(categories, false).map((category) => category.id), ['published']);
  assert.deepEqual(visibleCategories(categories, true).map((category) => category.id), ['published', 'draft-only']);
});
