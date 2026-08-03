import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { configuredThumbnailError } from '../../scripts/content-validation-rules.mjs';

test('published content may omit a thumbnail but an explicitly configured thumbnail must resolve', () => {
  assert.equal(configuredThumbnailError('', ''), '');
  assert.equal(configuredThumbnailError(undefined, ''), '');
  assert.match(configuredThumbnailError('./Media/missing.png', ''), /does not resolve/);
  assert.equal(configuredThumbnailError('./Media/preview.png', './SizedMedia/preview.jpg'), '');
});

test('content validation permits a published root and never requires an optional thumbnail', async () => {
  const validator = await readFile(path.join(process.cwd(), 'scripts', 'validate-content.mjs'), 'utf8');
  assert.doesNotMatch(validator, /root nodes are structural and must not be published/);
  assert.doesNotMatch(validator, /published nodes need a generated SizedMedia thumbnail/);
});
