import assert from 'node:assert/strict';
import test from 'node:test';
import { filterCollection, filtersAreActive } from '../../../scripts/collection-filter.mjs';
import { descendants, direct } from '../../testdata/collection-fixture.mjs';

const defaults = () => ({ text: '', articlesOnly: '', includeTags: [], excludeTags: [], after: '', before: '', order: 'new' });
const ids = (entries) => entries.map((entry) => entry.id);

test('an untouched index collection lists direct children only', () => {
  assert.equal(filtersAreActive(defaults()), false);
  assert.deepEqual(ids(filterCollection({ direct, descendants, filters: defaults() })), ['index-direct', 'article-direct']);
});

test('an active query expands candidates to direct and indirect entries', () => {
  const filters = { ...defaults(), text: 'setup' };
  assert.equal(filtersAreActive(filters), true);
  assert.deepEqual(ids(filterCollection({ direct, descendants, filters })), ['article-nested', 'index-direct', 'draft-nested']);
});

test('articles-only yes and no use public language while filtering both entry forms', () => {
  assert.deepEqual(ids(filterCollection({ direct, descendants, filters: { ...defaults(), articlesOnly: 'yes' } })), ['article-nested', 'draft-nested', 'article-direct']);
  assert.deepEqual(ids(filterCollection({ direct, descendants, filters: { ...defaults(), articlesOnly: 'no' } })), ['index-direct']);
});

test('include/exclude tags, date bounds, and each order are applied together', () => {
  assert.deepEqual(ids(filterCollection({ direct, descendants, filters: { ...defaults(), includeTags: ['setup'], excludeTags: ['alignment'], after: '2026-02-01', before: '2026-04-02', order: 'old' } })), ['index-direct', 'article-nested']);
  assert.deepEqual(ids(filterCollection({ direct, descendants, filters: { ...defaults(), includeTags: ['setup'], order: 'title' } })), ['index-direct', 'article-nested', 'draft-nested']);
});

test('published entries take precedence for every selected sort', () => {
  for (const order of ['new', 'old', 'title']) {
    const sorted = filterCollection({ direct: descendants, descendants, filters: { ...defaults(), order } });
    const firstDraft = sorted.findIndex((entry) => entry.published !== true);
    const lastPublished = sorted.findLastIndex((entry) => entry.published === true);
    assert.ok(lastPublished < firstDraft, `${order} keeps published entries ahead of drafts`);
  }
});

test('date rejection and missing draft dates are covered deliberately', () => {
  assert.deepEqual(ids(filterCollection({ direct, descendants, filters: { ...defaults(), after: '2026-03-05' } })), ['article-nested']);
  assert.deepEqual(ids(filterCollection({ direct, descendants, filters: { ...defaults(), before: '2026-03-01' } })), ['index-direct']);
  const undated = [{ id: 'a', title: 'A', subtitle: '', type: 'Article', tags: [], hasArticle: true }, { id: 'b', title: 'B', subtitle: '', type: 'Article', tags: [], date: '2026-01-01', hasArticle: true }, { id: 'c', title: 'C', subtitle: '', type: 'Article', tags: [], updatedAt: '2026-02-01T00:00:00Z', hasArticle: true }];
  assert.deepEqual(ids(filterCollection({ direct: undated, descendants: undated, filters: defaults() })), ['c', 'b', 'a']);
});
