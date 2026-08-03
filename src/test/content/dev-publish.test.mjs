import assert from 'node:assert/strict';
import { mkdtemp, readFile, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import YAML from 'yaml';
import { togglePublication, togglePublishedEntry } from '../../scripts/dev-publish.mjs';

test('publishing writes an immutable first publish date and an updated timestamp', () => {
  const first = togglePublication({ id: 'entry', published: false, published_at: null }, '2026-08-03T18:20:00.000Z');
  assert.equal(first.published, true);
  assert.match(first.published_at, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(first.updated_at, '2026-08-03T18:20:00.000Z');
  const removed = togglePublication(first, '2026-08-04T18:20:00.000Z');
  assert.equal(removed.published, false);
  assert.equal(removed.published_at, first.published_at);
});

test('the local dev publisher changes only the matching config file', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'no-brakes-publish-'));
  const entry = path.join(root, 'entry');
  await mkdir(entry);
  await writeFile(path.join(entry, 'config.yaml'), 'id: local-entry\npublished: false\npublished_at: null\nupdated_at: null\n');
  const next = await togglePublishedEntry('local-entry', root);
  const saved = YAML.parse(await readFile(path.join(entry, 'config.yaml'), 'utf8'));
  assert.equal(next.published, true);
  assert.equal(saved.published, true);
  assert.equal(saved.published_at, next.published_at);
});
