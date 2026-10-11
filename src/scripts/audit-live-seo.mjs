import sharp from 'sharp';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { contentRoot } from './project-paths.mjs';
import { contentPath } from './content-routes.mjs';

const origin = process.env.SEO_AUDIT_ORIGIN || 'https://nobrakes86.com';
const canonicalOrigin = 'https://nobrakes86.com';
const get = (route) => fetch(new URL(route, origin));
const index = await (await get('/content-index.json')).json();
const sitemap = await (await get('/sitemap.xml')).text();
const feed = await (await get('/feed.xml')).text();
for (const entry of index.articles.filter((entry) => entry.hasArticle)) {
  const response = await get(entry.path);
  const html = await response.text();
  const imageResponse = entry.thumbnail ? await get(entry.thumbnail) : null;
  const image = imageResponse?.ok ? await sharp(Buffer.from(await imageResponse.arrayBuffer())).metadata() : null;
  console.log(JSON.stringify({ path: entry.path, status: response.status, finalUrl: response.url,
    canonical: html.match(/<link rel="canonical" href="([^"]+)"/)?.[1],
    robots: html.match(/<meta name="robots" content="([^"]+)"/)?.[1],
    articleSchema: html.includes('"@type":"Article"'),
    sitemap: sitemap.includes(`${canonicalOrigin}${entry.path}</loc>`), feed: feed.includes(`${canonicalOrigin}${entry.path}</link>`),
    thumbnail: entry.thumbnail, dimensions: image ? `${image.width}x${image.height}` : null,
    largeImage: image ? image.width >= 1200 : false,
  }));
}
const files = await readdir(contentRoot, { recursive: true });
const nodes = await Promise.all(files.filter((file) => path.basename(file) === 'config.yaml').map(async (file) => {
  const config = YAML.parse(await readFile(path.join(contentRoot, file), 'utf8'));
  const id = path.dirname(file).split(path.sep).join('/');
  const parent = path.posix.dirname(id);
  return { id, slug: config.id, parent: parent === '.' ? null : parent };
}));
const publicPaths = new Set([...index.categories, ...index.articles].map((entry) => entry.path));
const excludedPaths = nodes.map((node) => contentPath(nodes, node)).filter((route) => !publicPaths.has(route));
for (const route of new Set(['/about', '/engine-rebuild-series', '/__seo-audit-missing', ...excludedPaths])) {
  const response = await get(route);
  const html = await response.text();
  console.log(JSON.stringify({ path: route, status: response.status, finalUrl: response.url,
    robots: html.match(/<meta name="robots" content="([^"]+)"/)?.[1],
    canonical: html.match(/<link rel="canonical" href="([^"]+)"/)?.[1],
    sitemap: sitemap.includes(`${canonicalOrigin}${route}</loc>`),
  }));
}
