import assert from 'node:assert/strict';
import test from 'node:test';
import { renderSeoPages, robotsText, sitemapXml } from '../../scripts/seo-pages.mjs';

const template = '<!doctype html><html lang="en"><head><meta name="description" content="old" /><title>Old</title></head><body><main id="main-content" tabindex="-1"></main></body></html>';
const index = {
  generated_at: '2026-10-05T20:00:00.000Z',
  categories: [{ id: 'racing', path: '/racing', title: 'Racing', name: 'Racing', intro: 'Race reports.', parent: null }],
  articles: [
    { id: 'round-1', path: '/racing/round-1', title: 'Round 1', subtitle: 'Fast lap.', type: 'Event', parent: 'racing', published: true, hasArticle: true, date: '2026-02-15T04:00:00.000Z', updatedAt: '2026-02-15T04:00:00.000Z', thumbnail: '/media/round-1/thumbnail.jpg', html: '<p>Authored evidence.</p>', searchSections: [] },
    { id: 'draft', path: '/racing/draft', title: 'Draft', parent: 'racing', published: false, hasArticle: true, html: '<p>Private draft.</p>' },
  ],
  about: { title: 'About', html: '<p>About the author.</p>', searchSections: [{ kind: 'p', text: 'About the author.' }] },
};

test('renders published routes as crawlable HTML with canonical metadata and Article structured data', () => {
  const pages = renderSeoPages(index, template);
  const article = pages.find((page) => page.route === '/racing/round-1');
  assert.ok(article);
  assert.match(article.html, /<link rel="canonical" href="https:\/\/nobrakes86\.com\/racing\/round-1"/);
  assert.match(article.html, /"@type":"Article"/);
  assert.match(article.html, /<p>Authored evidence\.<\/p>/);
  assert.match(article.html, /property="og:image" content="https:\/\/nobrakes86\.com\/media\/round-1\/thumbnail\.jpg"/);
  assert.equal(pages.some((page) => page.route === '/racing/draft'), false);
});

test('renders the site logo as the home sharing image', () => {
  const home = renderSeoPages(index, template).find((page) => page.route === '/');
  assert.match(home.html, /property="og:image" content="https:\/\/nobrakes86\.com\/logo\.jpg"/);
  assert.match(home.html, /property="og:image:width" content="1000"/);
  assert.match(home.html, /property="og:image:height" content="665"/);
});

test('generates crawler policy and a published-route sitemap on the production domain', () => {
  const robots = robotsText();
  const sitemap = sitemapXml(index);
  assert.match(robots, /User-agent: Google-Extended[\s\S]*Allow: \//);
  assert.match(robots, /User-agent: OAI-SearchBot[\s\S]*Allow: \//);
  assert.match(robots, /User-agent: Claude-SearchBot[\s\S]*Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/nobrakes86\.com\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/nobrakes86\.com\/racing\/round-1<\/loc>/);
  assert.match(sitemap, /<lastmod>2026-02-15<\/lastmod>/);
  assert.doesNotMatch(sitemap, /YOUR-DOMAIN|\/racing\/draft/);
});
