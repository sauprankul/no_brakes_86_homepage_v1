import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { renderArticleMarkdown } from '../scripts/content-compiler.mjs';

const execFileAsync = promisify(execFile);

test('renders authored Markdown, a table of contents, and download links', () => {
  const rendered = renderArticleMarkdown('# Race report\n\nThe **actual words** belong here.\n\n## Downloads\n\n[Setup notes](./Downloads/setup-notes.txt)', 'round-1');
  assert.match(rendered.html, /<strong>actual words<\/strong>/);
  assert.deepEqual(rendered.headings, [{ id: 'downloads', text: 'Downloads', depth: 2 }]);
  assert.match(rendered.html, /class="download-link"/);
  assert.match(rendered.html, /href="\/downloads\/round-1\/setup-notes.txt"/);
});

test('removes unsafe HTML from authored Markdown', () => {
  const rendered = renderArticleMarkdown('<script>alert("no")</script>\n\n## Safe heading', 'safe');
  assert.doesNotMatch(rendered.html, /script/i);
  assert.deepEqual(rendered.headings, [{ id: 'safe-heading', text: 'Safe heading', depth: 2 }]);
});

test('the local content build puts article.md HTML into the preview index', async () => {
  const root = path.resolve(import.meta.dirname, '..');
  await execFileAsync(process.execPath, ['scripts/build-content-index.mjs', '--include-drafts'], { cwd: root });
  const index = JSON.parse(await readFile(path.join(root, 'public', 'content-index.json'), 'utf8'));
  const article = index.articles.find((entry) => entry.id === '2026-thunderhill-east-cyclone');
  assert.equal(article.hasArticle, true);
  assert.match(article.html, /After the Sonoma round\./);
  assert.match(article.html, /class="download-link"/);
});
