import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { devPublicationControlMarkup } from '../../scripts/dev-publish-view.mjs';

test('local publishing controls render for unpublished article and list entries', () => {
  const article = devPublicationControlMarkup({ id: 'article', published: false }, true);
  const list = devPublicationControlMarkup({ id: 'list-entry', published: false }, true);
  const published = devPublicationControlMarkup({ id: 'published-entry', published: true }, true);
  assert.match(article, /data-dev-publish="article"/);
  assert.match(list, /data-dev-publish="list-entry"/);
  assert.match(article, /role="switch" aria-checked="false"/);
  assert.match(article, /Unpublished/);
  assert.match(published, /role="switch" aria-checked="true"/);
  assert.match(published, /Published/);
  assert.doesNotMatch(article, /Local preview|Publish locally/);
  assert.equal(devPublicationControlMarkup({ id: 'production-entry', published: false }, false), '');
});

test('article and list renderers use the same local publish control', async () => {
  const app = await readFile(path.join(process.cwd(), 'app.js'), 'utf8');
  assert.match(app, /function renderListPage[\s\S]*devPublicationControlMarkup\(category, import\.meta\.env\.DEV\)/);
  assert.match(app, /function renderArticle[\s\S]*devPublicationControlMarkup\(article, import\.meta\.env\.DEV\)/);
});
