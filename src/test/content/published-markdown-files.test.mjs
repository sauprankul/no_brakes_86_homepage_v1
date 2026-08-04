import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { publishedMarkdownFiles } from '../../scripts/published-markdown-files.mjs';

test('published Markdown selection excludes draft articles and nodes without article.md', async () => {
  const root = path.join(process.cwd(), 'test', 'testdata', 'published-markdown');
  const files = await publishedMarkdownFiles(root);
  assert.deepEqual(files, [path.join(root, 'published', 'article.md')]);
});

test('published Markdown selection returns an empty list for a missing content root', async () => {
  assert.deepEqual(await publishedMarkdownFiles(path.join(process.cwd(), 'test', 'testdata', 'does-not-exist')), []);
});

test('the published Markdown linter launches its module through the active Node runtime', async () => {
  const source = await readFile(path.join(process.cwd(), 'scripts', 'lint-published-markdown.mjs'), 'utf8');
  assert.match(source, /spawnSync\(process\.execPath, \[cli, '--no-globs', \.\.\.files\]/);
  assert.doesNotMatch(source, /markdownlint-cli2\.cmd/);
  assert.match(source, /result\.error/);
});
