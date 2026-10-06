import assert from 'node:assert/strict';
import test from 'node:test';
import { selectContentIndex } from '../../scripts/content-index-client.mjs';

test('an empty production index stays empty instead of revealing fallback entries', () => {
  const index = { categories: [], articles: [], about: null };
  const fallback = { categories: [{ id: 'prototype' }], articles: [{ id: 'draft-leak' }] };

  assert.deepEqual(selectContentIndex(index, fallback), index);
});

test('an unavailable content index is empty rather than a prototype fallback', () => {
  assert.deepEqual(selectContentIndex(null), { categories: [], articles: [], about: null });
});

test('the authored About page is retained outside the navigation collections', () => {
  const about = { title: 'About', html: '<h2>Author</h2>', headings: [] };
  assert.deepEqual(selectContentIndex({ categories: [], articles: [], about }), { categories: [], articles: [], about });
});
