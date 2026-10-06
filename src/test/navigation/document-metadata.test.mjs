import assert from 'node:assert/strict';
import test from 'node:test';
import { routeMetadata, syncDocumentMetadata } from '../../scripts/document-metadata.mjs';

function fakeDocument() {
  const elements = [];
  const documentObject = {
    title: '',
    head: { append: (element) => elements.push(element) },
    createElement: (tagName) => ({
      tagName,
      attributes: new Map(),
      setAttribute(name, value) { this.attributes.set(name, value); },
      remove() { elements.splice(elements.indexOf(this), 1); },
    }),
    querySelector: (selector) => {
      const match = selector.match(/^(\w+)\[(\w+)="([^"]+)"\]$/);
      return elements.find((element) => element.tagName === match?.[1] && element.attributes.get(match?.[2]) === match?.[3]) ?? null;
    },
  };
  return documentObject;
}

test('home sharing uses the site logo with its real dimensions', () => {
  const metadata = routeMetadata('home', null, null);
  assert.equal(metadata.url, 'https://nobrakes86.com/');
  assert.equal(metadata.image, 'https://nobrakes86.com/logo.jpg');
  assert.equal(metadata.imageWidth, '1000');
  assert.equal(metadata.imageHeight, '665');
});

test('article navigation updates sharing metadata to the complete article URL', () => {
  const article = { path: '/86-challenge/2026-season/round-1', title: 'Round 1', subtitle: 'Fast lap.', thumbnail: '/media/round-1/thumbnail.jpg' };
  const metadata = routeMetadata('article', article, null);
  assert.equal(metadata.url, 'https://nobrakes86.com/86-challenge/2026-season/round-1');
  assert.equal(metadata.title, 'Round 1 | No Brakes 86');
  assert.equal(metadata.image, 'https://nobrakes86.com/media/round-1/thumbnail.jpg');
});

test('client-side navigation replaces canonical and social sharing URLs', () => {
  const documentObject = fakeDocument();
  const metadata = routeMetadata('article', { path: '/blog/article', title: 'Article', subtitle: 'Summary' }, null);
  syncDocumentMetadata(documentObject, metadata);
  assert.equal(documentObject.title, 'Article | No Brakes 86');
  assert.equal(documentObject.querySelector('link[rel="canonical"]').attributes.get('href'), 'https://nobrakes86.com/blog/article');
  assert.equal(documentObject.querySelector('meta[property="og:url"]').attributes.get('content'), 'https://nobrakes86.com/blog/article');
});
