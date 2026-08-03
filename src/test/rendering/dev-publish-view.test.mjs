import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { devPublicationControlMarkup } from '../../scripts/dev-publish-view.mjs';

test('local publishing controls render for unpublished article and list entries', () => {
  assert.match(devPublicationControlMarkup({ id: 'article', published: false }, true), /data-dev-publish="article"/);
  assert.match(devPublicationControlMarkup({ id: 'list-entry', published: false }, true), /data-dev-publish="list-entry"/);
  assert.match(devPublicationControlMarkup({ id: 'published-entry', published: true }, true), /Unpublish locally/);
  assert.equal(devPublicationControlMarkup({ id: 'production-entry', published: false }, false), '');
});

test('article and list renderers use the same local publish control', async () => {
  const app = await readFile(path.join(process.cwd(), 'app.js'), 'utf8');
  assert.match(app, /function renderListPage[\s\S]*devPublicationControlMarkup\(category, import\.meta\.env\.DEV\)/);
  assert.match(app, /function renderArticle[\s\S]*devPublicationControlMarkup\(article, import\.meta\.env\.DEV\)/);
});
