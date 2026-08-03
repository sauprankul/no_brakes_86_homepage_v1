import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { publishedMarkdownFiles } from '../scripts/published-markdown-files.mjs';

test('published Markdown selection excludes draft articles and nodes without article.md', async () => {
  const root = path.join(process.cwd(), 'test', 'testdata', 'published-markdown');
  const files = await publishedMarkdownFiles(root);
  assert.deepEqual(files, [path.join(root, 'published', 'article.md')]);
});

test('published Markdown selection returns an empty list for a missing content root', async () => {
  assert.deepEqual(await publishedMarkdownFiles(path.join(process.cwd(), 'test', 'testdata', 'does-not-exist')), []);
});
