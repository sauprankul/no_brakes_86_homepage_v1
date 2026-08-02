import assert from 'node:assert/strict';
import test from 'node:test';
import { renderArticleMarkdown } from '../scripts/content-compiler.mjs';


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
