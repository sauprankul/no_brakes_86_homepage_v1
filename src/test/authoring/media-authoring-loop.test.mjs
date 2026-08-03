import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

test('authoring and pre-commit regenerate media when it is missing or stale', async () => {
  const sourceRoot = process.cwd();
  const builder = await readFile(path.join(sourceRoot, 'scripts', 'build-content-index.mjs'), 'utf8');
  const hook = await readFile(path.join(sourceRoot, '..', '.githooks', 'pre-commit'), 'utf8');
  assert.match(builder, /generateSizedMedia\(contentRoot\)/);
  assert.match(builder, /if \(isWatchMode && includeDrafts\)/);
  assert.match(hook, /generate-sized-media\.mjs --stage/);
  assert.match(await readFile(path.join(sourceRoot, 'scripts', 'media-pipeline.mjs'), 'utf8'), /convertHeifFallback\(source, destination, error\)/);
});
