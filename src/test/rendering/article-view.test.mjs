import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
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

test('article and list headers have one post-subtitle divider and matching subtitle sizing', async () => {
  const stylesheet = await readFile(path.join(process.cwd(), 'styles.css'), 'utf8');
  assert.match(stylesheet, /\.article-layout \{[^}]*border-top: 1px solid var\(--line\)/);
  assert.doesNotMatch(stylesheet, /\.page-header \{[^}]*border-bottom/);
  assert.match(stylesheet, /\.page-header p:not\(\.eyebrow\) \{[^}]*font-size: clamp\(1\.12rem, 1\.8vw, 1\.38rem\)/);
});

test('the local publication toggle floats without taking document layout space', async () => {
  const stylesheet = await readFile(path.join(process.cwd(), 'styles.css'), 'utf8');
  assert.match(stylesheet, /\.dev-publish \{[^}]*position: fixed;[^}]*top: 92px;[^}]*right: clamp\(24px, 5vw, 66px\)/);
  assert.match(stylesheet, /\.dev-publish__toggle\.is-unpublished \{[^}]*background: #9d2630/);
  assert.match(stylesheet, /\.dev-publish__toggle\.is-published \{[^}]*background: #2f8f5b/);
});
