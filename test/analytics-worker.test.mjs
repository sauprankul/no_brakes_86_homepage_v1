import assert from 'node:assert/strict';
import test from 'node:test';
import { originAllowed, validEvents } from '../analytics-worker/src/collector.mjs';

test('collector accepts only bounded, schema-valid aggregate events', () => {
  const events = validEvents({ events: [
    { name: 'page_view', routeKind: 'article', contentId: 'round-1' },
    { name: 'search', query: '200tw tires', resultCount: 8 },
    { name: 'search', query: 'reader@example.com' },
    { name: 'unknown', value: 5 },
  ] });
  assert.deepEqual(events.map((event) => event.name), ['page_view', 'search', 'search']);
  assert.equal(events[1].query, '200tw tires');
  assert.equal(events[2].query, '');
});

test('collector only permits the configured public origin when an Origin is supplied', () => {
  const request = (origin) => new Request('https://analytics.example/collect', { headers: origin ? { origin } : {} });
  assert.equal(originAllowed(request('https://no-brakes.example'), 'https://no-brakes.example'), true);
  assert.equal(originAllowed(request('https://other.example'), 'https://no-brakes.example'), false);
  assert.equal(originAllowed(request(), 'https://no-brakes.example'), true);
});
