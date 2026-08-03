import assert from 'node:assert/strict';
import test from 'node:test';
import { analyticsEnabled, applyAnalyticsPreference, createAnalyticsTracker, normalizeSearchTerm } from '../scripts/analytics.mjs';

function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

test('analytics is off without an endpoint, during development, or after a device opt-out', () => {
  const local = storage();
  assert.equal(analyticsEnabled({ endpoint: '', storage: local }), false);
  assert.equal(analyticsEnabled({ endpoint: 'https://metrics.example', isDevelopment: true, storage: local }), false);
  applyAnalyticsPreference('?analytics=off', local);
  assert.equal(analyticsEnabled({ endpoint: 'https://metrics.example', storage: local }), false);
  applyAnalyticsPreference('?analytics=on', local);
  assert.equal(analyticsEnabled({ endpoint: 'https://metrics.example', storage: local }), true);
});

test('only safe, normalized search terms are eligible for aggregate search metrics', () => {
  assert.equal(normalizeSearchTerm('  GR86   tire-pressure  '), 'gr86 tire-pressure');
  assert.equal(normalizeSearchTerm('reader@example.com'), '');
  assert.equal(normalizeSearchTerm('https://private.example'), '');
  assert.equal(normalizeSearchTerm('(555) 123-4567'), '');
});

test('tracker batches bounded events and records engagement only after one active second', () => {
  let tick = 0;
  const sent = [];
  const local = storage();
  const tracker = createAnalyticsTracker({ endpoint: 'https://metrics.example', storage: local, now: () => tick, transport: (_endpoint, payload) => sent.push(payload), documentRef: null, windowRef: null });
  tracker.startPage({ routeKind: 'article', contentId: 'round-1' });
  tracker.trackSearch('Thunderhill east', 3);
  tracker.trackScrollDepth(0.78);
  tick = 1_500;
  tracker.stopPage();
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0].events.map((event) => event.name), ['page_view', 'search', 'scroll_depth', 'page_engagement']);
  assert.equal(sent[0].events[1].query, 'thunderhill east');
  assert.equal(sent[0].events[2].value, 75);
  assert.equal(sent[0].events[3].durationSeconds, 2);
});
