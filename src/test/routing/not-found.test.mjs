import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { notFoundMarkup } from '../../scripts/not-found-view.mjs';

test('unknown URLs render a five-second 404 countdown before replacing the URL with home', async () => {
  const app = await readFile(path.join(process.cwd(), 'app.js'), 'utf8');
  assert.match(notFoundMarkup('/missing?<bad>', 5), /404 · NOT FOUND/);
  assert.match(notFoundMarkup('/missing?<bad>', 5), /\/missing\?&lt;bad&gt;/);
  assert.match(app, /let seconds = 5/);
  assert.match(app, /navigateTo\('\/', \{ replace: true \}\)/);
  assert.match(app, /else renderNotFound\(\)/);
});
