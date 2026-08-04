import assert from 'node:assert/strict';
import test from 'node:test';
import { patchPublicationState } from '../../scripts/dev-content-index.mjs';

test('nested list and article publication changes immediately update the browser index', () => {
  const index = {
    generated_at: 'before',
    categories: [{ id: '86-challenge', published: true }],
    articles: [
      { id: '2026-season', parent: '86-challenge', published: false },
      { id: 'round-1', parent: '2026-season', published: false },
    ],
  };
  const season = patchPublicationState(index, { id: '2026-season', published: true, published_at: '2026-08-04T01:00:00.000Z', updated_at: '2026-08-04T01:00:00.000Z' }, 'season-refresh');
  const article = patchPublicationState(season, { id: 'round-1', published: true, published_at: '2026-08-04T01:01:00.000Z', updated_at: '2026-08-04T01:01:00.000Z' }, 'article-refresh');
  assert.equal(article.articles.find((entry) => entry.id === '2026-season').published, true);
  assert.equal(article.articles.find((entry) => entry.id === 'round-1').published, true);
  assert.equal(article.articles.find((entry) => entry.id === 'round-1').date, '2026-08-04T01:01:00.000Z');
  assert.equal(article.generated_at, 'article-refresh');
});
