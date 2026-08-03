import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequest } from '../functions/_middleware.js';

const context = (country) => ({ request: { cf: country ? { country } : undefined }, next: () => new Response('allowed') });

test('US-only Pages middleware allows US traffic', async () => {
  const response = await onRequest(context('US'));
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'allowed');
});

test('US-only Pages middleware blocks foreign and unknown traffic', async () => {
  for (const country of ['CA', 'MX', 'GB', 'FR', undefined]) {
    const response = await onRequest(context(country));
    assert.equal(response.status, 451);
  }
});
