import assert from 'node:assert/strict';
import test from 'node:test';
import { articleHeaderMarkup } from '../../scripts/article-view.mjs';

test('renders title and subtitle from config data, not article Markdown', () => {
  const html = articleHeaderMarkup({ title: 'Config title', subtitle: 'Config subtitle', type: 'Event' }, '<span>Published</span>');
  assert.match(html, /<h1>Config title<\/h1>/);
  assert.match(html, /Config subtitle/);
  assert.match(html, /<p class="eyebrow">Event<\/p>/);
});

test('omits an empty config subtitle', () => {
  const html = articleHeaderMarkup({ title: 'Only title', subtitle: '', type: 'Article' }, '');
  assert.doesNotMatch(html, /article-header__subtitle/);
});
