import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const app = await readFile(path.join(process.cwd(), 'app.js'), 'utf8');
const stylesheet = await readFile(path.join(process.cwd(), 'styles.css'), 'utf8');

test('desktop collection controls reserve five lowercase tag rows and one compact filter row', () => {
  assert.match(app, /while \(rows\.length < 5\)/);
  assert.match(app, /tag\.toLowerCase\(\)/);
  assert.match(stylesheet, /\.filter-panel \{[^}]*grid-template-columns: minmax\(400px, 1\.45fr\) minmax\(280px, \.85fr\)/);
  assert.match(stylesheet, /\.filter-row \{[^}]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(stylesheet, /\.tag-slot \{[^}]*height: 32px;[^}]*text-transform: none/);
});

test('tag suggestions open on focus and close after focus leaves the tag table', () => {
  assert.match(app, /addEventListener\('focusin'/);
  assert.match(app, /paintOptions\(kind, event\.target\)/);
  assert.match(app, /addEventListener\('focusout'/);
  assert.match(app, /!filter\.contains\(document\.activeElement\)/);
});

test('mobile collection controls use an apply-or-cancel modal with backdrop apply', () => {
  assert.match(app, /data-mobile-filter-open/);
  assert.match(app, /dialog\.showModal\(\)/);
  assert.match(app, /dialog\.close\('apply'\)/);
  assert.match(app, /dialog\.close\('cancel'\)/);
  assert.match(app, /event\.target === dialog/);
  assert.match(stylesheet, /@media \(max-width: 800px\)[\s\S]*?\.mobile-filter-open \{ display: block/);
  assert.match(stylesheet, /\.filter-panel-host > \.filter-panel \{ display: none; \}/);
});

test('article tags stay inline with their label', () => {
  assert.match(app, /return `<span class="tags">/);
  assert.match(stylesheet, /\.article-info > span \{ display: inline-flex; align-items: center; gap: 7px; \}/);
});

test('global suggestions and the modal share full-text ranking while body matches retain subtitles', () => {
  assert.equal((app.match(/await fullSearchResults\(/g) ?? []).length, 2);
  assert.match(app, /class="result-subtitle"/);
  assert.match(app, /class="result-context"/);
  assert.match(app, /highlightedSearchText\(entry\.title, term\)/);
  assert.match(stylesheet, /\.search-match \{[^}]*background: var\(--yellow\)/);
});
