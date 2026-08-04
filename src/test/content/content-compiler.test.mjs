import assert from 'node:assert/strict';
import test from 'node:test';
import { renderArticleMarkdown } from '../../scripts/content-compiler.mjs';


test('renders authored Markdown, a table of contents, and hierarchical download links', () => {
  const rendered = renderArticleMarkdown('# Race report\n\nThe **actual words** belong here.\n\n## Downloads\n\n[Setup notes](./Downloads/setup-notes.txt)', 'round-1', '/86-challenge/2026-season/round-1');
  assert.match(rendered.html, /<strong>actual words<\/strong>/);
  assert.deepEqual(rendered.headings, [{ id: 'downloads', text: 'Downloads', depth: 2 }]);
  assert.match(rendered.html, /class="download-link"/);
  assert.match(rendered.html, /href="\/86-challenge\/2026-season\/round-1\/downloads\/setup-notes.txt"/);
  assert.deepEqual(rendered.searchSections.slice(0, 3), [
    { kind: 'heading', text: 'Race report' },
    { kind: 'p', text: 'The actual words belong here.' },
    { kind: 'heading', text: 'Downloads' },
  ]);
});

test('removes unsafe HTML from authored Markdown', () => {
  const rendered = renderArticleMarkdown('<script>alert("no")</script>\n\n## Safe heading', 'safe');
  assert.doesNotMatch(rendered.html, /script/i);
  assert.deepEqual(rendered.headings, [{ id: 'safe-heading', text: 'Safe heading', depth: 2 }]);
});

test('preserves an approved privacy-enhanced YouTube embed', () => {
  const rendered = renderArticleMarkdown('<iframe src="https://www.youtube-nocookie.com/embed/5UwIX1HKLgU" title="Recap" loading="lazy" allowfullscreen></iframe>', 'recap');
  assert.match(rendered.html, /youtube-nocookie\.com\/embed\/5UwIX1HKLgU/);
  assert.match(rendered.html, /allowfullscreen/);
});

test('maps authored Media image and video references to committed SizedMedia files', () => {
  const rendered = renderArticleMarkdown('![Corner entry](./Media/corner-entry.heic)\n\n<video controls loop playsinline><source src="./Media/lap.mov" type="video/quicktime"></video>', 'round-1');
  assert.match(rendered.html, /src="\/media\/round-1\/corner-entry\.jpg"/);
  assert.match(rendered.html, /src="\/media\/round-1\/lap\.mp4"/);
  assert.match(rendered.html, /<video controls loop playsinline>/);
});

test('wraps every authored Markdown table for the shared responsive table presentation', () => {
  const rendered = renderArticleMarkdown('| Pos. | Driver |\n| --- | --- |\n| 1 | Ivan Larionov |', 'results');
  assert.match(rendered.html, /<div class="article-table-scroll"><table>/);
  assert.match(rendered.html, /<th>Pos\.<\/th>/);
  assert.match(rendered.html, /<td>Ivan Larionov<\/td>/);
});
