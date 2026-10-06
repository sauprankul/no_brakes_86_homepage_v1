import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { routeMetadata, SITE_URL } from './document-metadata.mjs';

const SITE_NAME = 'No Brakes 86';
const AUTHOR_NAME = 'Saurabh Kulkarni';
const HOME_DESCRIPTION = "No Brakes 86 is Saurabh Kulkarni's repository of knowledge. He's built it through years of competing and winning in 86 Challenge, one of the most competitive, data-driven time trials in California.";
const SOCIAL_PROFILES = [
  'https://www.reddit.com/user/404-no-brkz/',
  'https://www.youtube.com/@404nobrakes',
  'https://www.instagram.com/oldmansaurabh/',
];

const htmlEscape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

const xmlEscape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
}[character]));

const absoluteUrl = (route = '/') => new URL(route, `${SITE_URL}/`).href;
const jsonLd = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');
const normalizedPath = (value) => value === '/' ? '/' : `/${String(value ?? '').replace(/^\/+|\/+$/g, '')}`;

function directChildren(index, id) {
  return [...index.categories, ...index.articles].filter((entry) => entry.parent === id);
}

function breadcrumbEntries(index, entry) {
  const entries = [...index.categories, ...index.articles];
  const byId = new Map(entries.map((candidate) => [candidate.id, candidate]));
  const chain = [];
  const visited = new Set();
  let current = entry;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    chain.unshift(current);
    current = current.parent ? byId.get(current.parent) : null;
  }
  return chain;
}

function breadcrumbData(index, entry) {
  const items = [{ name: 'Home', url: absoluteUrl('/') }, ...breadcrumbEntries(index, entry).map((item) => ({
    name: item.name || item.title,
    url: absoluteUrl(item.path),
  }))];
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, position) => ({
      '@type': 'ListItem', position: position + 1, name: item.name, item: item.url,
    })),
  };
}

function personData() {
  return { '@type': 'Person', '@id': `${SITE_URL}/#saurabh-kulkarni`, name: AUTHOR_NAME, url: `${SITE_URL}/about`, sameAs: SOCIAL_PROFILES };
}

function websiteData() {
  return { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: SITE_NAME, url: `${SITE_URL}/`, description: HOME_DESCRIPTION, author: { '@id': `${SITE_URL}/#saurabh-kulkarni` } };
}

function pageMetadata(index, kind, entry) {
  const metadata = routeMetadata(kind, entry, index.about);
  const { url, description, image } = metadata;
  const graph = [websiteData(), personData()];

  if (kind === 'article') {
    graph.push({
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: entry.title,
      description,
      url,
      mainEntityOfPage: url,
      ...(entry.date ? { datePublished: entry.date } : {}),
      ...(entry.updatedAt ? { dateModified: entry.updatedAt } : {}),
      ...(entry.thumbnail ? { image: [image] } : {}),
      author: { '@id': `${SITE_URL}/#saurabh-kulkarni` },
      isPartOf: { '@id': `${SITE_URL}/#website` },
    }, breadcrumbData(index, entry));
  } else if (kind === 'category') {
    graph.push({ '@type': 'CollectionPage', '@id': `${url}#webpage`, name: entry.title, description, url, isPartOf: { '@id': `${SITE_URL}/#website` } }, breadcrumbData(index, entry));
  } else if (kind === 'about') {
    graph.push({ '@type': 'AboutPage', '@id': `${url}#webpage`, name: 'About', description, url, mainEntity: { '@id': `${SITE_URL}/#saurabh-kulkarni` }, isPartOf: { '@id': `${SITE_URL}/#website` } });
  }

  return { ...metadata, graph };
}

function articleList(entries) {
  if (!entries.length) return '';
  return `<ul>${entries.map((entry) => `<li><a href="${htmlEscape(entry.path)}">${htmlEscape(entry.title)}</a>${entry.subtitle ? ` — ${htmlEscape(entry.subtitle)}` : ''}</li>`).join('')}</ul>`;
}

function pageBody(index, kind, entry) {
  if (kind === 'home') {
    const latest = [...index.articles].filter((article) => article.published === true).sort((left, right) => (right.date ?? right.updatedAt ?? '').localeCompare(left.date ?? left.updatedAt ?? '')).slice(0, 5);
    return `<section class="hero"><div><h1>Have an 86? Want to drive fast?<br><em>You're in the right place.</em></h1><div class="hero__rule"></div></div><div><p class="hero__copy">In 4 years, I've broken almost every single part of this car - the engine, the transmission, the steering rack, the brakes, the suspension. Uncountable sets of tires. I've done a lot of dumb, expensive stuff, but I've also won TTs, set records and generally gotten pretty good at driving.<br><br>I was tired of how inaccessible good information was online, so I built this website to help other Toyobaru owners get up to speed the easy way. No AI content, no paywalls, no ads, no dropshipped merch, no paid courses. Just sauce.</p><a class="hero__about" href="/about">More about why I made this <span aria-hidden="true">↗</span></a></div></section><section class="feed" aria-label="New"><div class="feed-head"><h2>New</h2></div>${articleList(latest)}</section>`;
  }
  if (kind === 'about') return `<header class="article-header"><h1>${htmlEscape(index.about?.title || 'About')}</h1></header><div class="article-layout"><article class="article-body article-markdown" data-pagefind-body>${index.about?.html ?? ''}</article></div>`;
  if (kind === 'article') return `<header class="article-header">${entry.type ? `<p class="eyebrow">${htmlEscape(entry.type)}</p>` : ''}<h1>${htmlEscape(entry.title)}</h1>${entry.subtitle ? `<p class="article-header__subtitle">${htmlEscape(entry.subtitle)}</p>` : ''}</header><div class="article-layout"><article class="article-body article-markdown" data-pagefind-body>${entry.html ?? ''}</article></div>`;
  const children = directChildren(index, entry.id).filter((child) => !('published' in child) || child.published === true);
  return `<header class="page-header"><h1>${htmlEscape(entry.name || entry.title)}</h1>${entry.intro || entry.subtitle ? `<p>${htmlEscape(entry.intro || entry.subtitle)}</p>` : ''}</header><section aria-label="${htmlEscape(entry.name || entry.title)} entries">${articleList(children)}</section>`;
}

function renderDocument(template, metadata, body) {
  const extraHead = `
    <!-- seo:start -->
    <meta name="robots" content="${metadata.robots}" />
    <link rel="canonical" href="${htmlEscape(metadata.url)}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:type" content="${metadata.type}" />
    <meta property="og:title" content="${htmlEscape(metadata.title)}" />
    <meta property="og:description" content="${htmlEscape(metadata.description)}" />
    <meta property="og:url" content="${htmlEscape(metadata.url)}" />
    <meta property="og:image" content="${htmlEscape(metadata.image)}" />
    <meta property="og:image:type" content="image/jpeg" />${metadata.imageWidth ? `
    <meta property="og:image:width" content="${metadata.imageWidth}" />
    <meta property="og:image:height" content="${metadata.imageHeight}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${htmlEscape(metadata.title)}" />
    <meta name="twitter:description" content="${htmlEscape(metadata.description)}" />
    <meta name="twitter:image" content="${htmlEscape(metadata.image)}" />
    <script type="application/ld+json">${jsonLd({ '@context': 'https://schema.org', '@graph': metadata.graph })}</script>
    <!-- seo:end -->`;
  return template
    .replace(/<title>[^<]*<\/title>/i, `<title>${htmlEscape(metadata.title)}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/i, `<meta name="description" content="${htmlEscape(metadata.description)}" />`)
    .replace('</head>', `${extraHead}\n  </head>`)
    .replace(/<main\s+id="main-content"\s+tabindex="-1"\s*>[\s\S]*?<\/main>/i, `<main id="main-content" tabindex="-1">${body}</main>`);
}

export function renderSeoPages(index, template) {
  const pages = [];
  const add = (kind, entry) => {
    const metadata = pageMetadata(index, kind, entry);
    pages.push({ route: metadata.route, html: renderDocument(template, metadata, pageBody(index, kind, entry)) });
  };
  add('home');
  if (index.about) add('about');
  for (const category of index.categories ?? []) add('category', category);
  for (const article of (index.articles ?? []).filter((entry) => entry.published === true)) add(article.hasArticle === true ? 'article' : 'category', article);
  return pages;
}

export function robotsText() {
  return `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: ClaudeBot
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

export function sitemapXml(index) {
  const contentDates = [...(index.categories ?? []), ...(index.articles ?? [])].map((entry) => entry.updatedAt || entry.date).filter(Boolean).sort();
  const records = [{ path: '/', lastmod: contentDates.at(-1) }, { path: '/about' }];
  for (const category of index.categories ?? []) records.push({ path: category.path, lastmod: category.updatedAt || category.date });
  for (const article of (index.articles ?? []).filter((entry) => entry.published === true)) records.push({ path: article.path, lastmod: article.updatedAt || article.date });
  const unique = [...new Map(records.map((record) => [normalizedPath(record.path), record])).values()];
  const urls = unique.map((record) => `  <url>\n    <loc>${xmlEscape(absoluteUrl(record.path))}</loc>${record.lastmod ? `\n    <lastmod>${xmlEscape(String(record.lastmod).slice(0, 10))}</lastmod>` : ''}\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export async function writeSeoPages(index, template, outputRoot) {
  const pages = renderSeoPages(index, template);
  for (const page of pages) {
    const destination = page.route === '/' ? path.join(outputRoot, 'index.html') : path.join(outputRoot, page.route.replace(/^\//, ''), 'index.html');
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, page.html, 'utf8');
  }
  await writeFile(path.join(outputRoot, 'robots.txt'), robotsText(), 'utf8');
  await writeFile(path.join(outputRoot, 'sitemap.xml'), sitemapXml(index), 'utf8');
  return pages.length;
}
