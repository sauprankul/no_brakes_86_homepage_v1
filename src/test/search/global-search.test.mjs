import assert from 'node:assert/strict';
import test from 'node:test';
import { bodyContext, rankFullSearchResults, rankMetadataResults } from '../../scripts/search-ranking.mjs';

const entries = [
  { id: 'exact', title: '2026 Thunderhill notes', subtitle: 'Season opener', type: 'Article', tags: [], searchSections: [] },
  { id: 'reordered', title: 'Thunderhill notes from 2026', subtitle: 'Season opener', type: 'Article', tags: [], searchSections: [] },
];

test('multi-word metadata search matches any word order while prioritizing the exact phrase', () => {
  const category = () => '86 Challenge';
  assert.deepEqual(rankMetadataResults(entries, category, '2026 Thunderhill').map(({ entry }) => entry.id), ['exact', 'reordered']);
  assert.deepEqual(new Set(rankMetadataResults(entries, category, 'Thunderhill 2026').map(({ entry }) => entry.id)), new Set(['exact', 'reordered']));
});

test('body-only matches return the matching element with at most five surrounding words', () => {
  const paragraph = { id: 'body', title: 'Unrelated title', subtitle: 'Unrelated subtitle', tags: [], searchSections: [{ kind: 'p', text: 'zero one two three four five cyclone seven eight nine ten eleven twelve thirteen' }] };
  const context = bodyContext(paragraph, 'cyclone');
  assert.equal(context.kind, 'p');
  assert.ok(context.text.replaceAll('…', '').trim().split(/\s+/).length <= 11);
  assert.match(context.text, /cyclone/);
  const heading = bodyContext({ ...paragraph, searchSections: [{ kind: 'heading', text: 'Thunderhill Cyclone Setup' }] }, 'cyclone');
  assert.deepEqual(heading, { kind: 'heading', text: 'Thunderhill Cyclone Setup', score: 480 });
});

test('full search deduplicates metadata and Pagefind body matches by entry', () => {
  const entry = { id: 'one', title: 'Thunderhill 2026', subtitle: '', tags: [], searchSections: [{ kind: 'p', text: 'Thunderhill in 2026.' }] };
  const results = rankFullSearchResults([entry], () => '86 Challenge', '2026 Thunderhill', ['one', 'one']);
  assert.equal(results.length, 1);
  assert.equal(results[0].entry.id, 'one');
  assert.equal(results[0].bodyContext, null);
});
