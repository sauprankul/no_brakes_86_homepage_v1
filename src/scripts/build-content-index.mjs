import { access, copyFile, mkdir, readFile, readdir, rm, watch, writeFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { renderArticleMarkdown } from './content-compiler.mjs';
import { visibleCategories, visibleEntries } from './content-index-visibility.mjs';
import { IMAGE_EXTENSIONS, publicMediaPath, sizedMediaRelativePath } from './media-pipeline.mjs';
import { contentRoot, publicRoot } from './project-paths.mjs';

const outputFile = path.join(publicRoot, 'content-index.json');
const isWatchMode = process.argv.includes('--watch');
const includeDrafts = process.argv.includes('--include-drafts');
const touchUpdates = process.argv.includes('--touch-updates');

const today = () => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const value = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
};
const now = () => new Date().toISOString();
const sortableDate = (entry) => entry.date ?? entry.updatedAt ?? '';

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(fullPath) : [fullPath];
  }));
  return nested.flat();
}

async function readYaml(file) {
  return YAML.parse(await readFile(file, 'utf8')) ?? {};
}

async function exists(file) {
  return access(file).then(() => true).catch(() => false);
}

async function findThumbnail(directory, nodeId, configured) {
  if (await exists(path.join(directory, 'SizedMedia', 'thumbnail.jpg'))) return `/media/${encodeURIComponent(nodeId)}/thumbnail.jpg`;
  if (/^\.\/Media\//i.test(configured ?? '')) {
    try {
      const source = configured.replace(/^\.\/Media\//i, '');
      if (!IMAGE_EXTENSIONS.has(path.extname(source).toLowerCase())) return '';
      const generated = sizedMediaRelativePath(source, 'image');
      if (await exists(path.join(directory, 'SizedMedia', generated))) return publicMediaPath(nodeId, configured);
      return '';
    } catch {
      return '';
    }
  }
  return configured ?? '';
}

async function articleData(directory, nodeId) {
  const articleFile = path.join(directory, 'article.md');
  try {
    const markdown = await readFile(articleFile, 'utf8');
    return { hasArticle: true, ...renderArticleMarkdown(markdown, nodeId) };
  } catch {
    return { hasArticle: false, html: '', headings: [] };
  }
}

async function copyDownloads(directory, nodeId) {
  const downloadsDirectory = path.join(directory, 'Downloads');
  try {
    const files = await filesIn(downloadsDirectory);
    await Promise.all(files.map(async (file) => {
      const destination = path.join(publicRoot, 'downloads', nodeId, path.relative(downloadsDirectory, file));
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(file, destination);
    }));
  } catch {
    // A Downloads folder is optional.
  }
}

async function copySizedMedia(directory, nodeId) {
  const sizedDirectory = path.join(directory, 'SizedMedia');
  try {
    const files = await filesIn(sizedDirectory);
    await Promise.all(files.filter((file) => path.basename(file) !== '.media-manifest.json').map(async (file) => {
      const destination = path.join(publicRoot, 'media', nodeId, path.relative(sizedDirectory, file));
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(file, destination);
    }));
  } catch {
    // A node only needs SizedMedia when it references authored media.
  }
}

async function writeYaml(file, value) {
  await writeFile(file, YAML.stringify(value), 'utf8');
}

async function normaliseArticle(configFile, config) {
  if (config.published !== true) return config;
  let changed = false;
  const date = today();
  if (!config.published_at) {
    config.published_at = date;
    changed = true;
  }
  if (!config.updated_at) {
    config.updated_at = config.published_at;
    changed = true;
  }
  if (changed) await writeYaml(configFile, config);
  return config;
}

function slugFrom(file) {
  return path.relative(contentRoot, path.dirname(file)).replaceAll(path.sep, '/').replace(/\/(config|_node)$/i, '');
}

async function build() {
  await rm(path.join(publicRoot, 'media'), { recursive: true, force: true });
  const configs = (await filesIn(contentRoot)).filter((file) => path.basename(file) === 'config.yaml');
  const entries = await Promise.all(configs.map(async (file) => ({ file, config: await normaliseArticle(file, await readYaml(file)) })));
  const nodes = await Promise.all(entries.map(async ({ file, config }) => {
    const id = config.id ?? slugFrom(file);
    const directory = path.dirname(file);
    return { file, config, id, parent: config.parent ?? null, thumbnail: await findThumbnail(directory, id, config.thumbnail), ...(await articleData(directory, id)), directory };
  }));
  let categories = nodes
    .filter(({ parent }) => !parent)
    .sort((a, b) => (a.config.order ?? 999) - (b.config.order ?? 999))
    .map(({ file, config }) => ({
      id: config.id ?? slugFrom(file),
      name: config.title,
      short: config.short_title ?? config.title,
      count: 0,
      intro: config.description ?? '',
      children: [],
    }));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const articles = visibleEntries(nodes, includeDrafts)
    .map(({ config, id, parent, thumbnail, hasArticle, html, headings }) => ({
      id,
      category: config.parent,
      parent,
      children: [],
      hasArticle,
      title: config.title,
      subtitle: config.subtitle ?? '',
      date: config.published_at,
      updatedAt: config.updated_at,
      tags: config.tags ?? [],
      media: config.media_label ?? 'NOTE',
      thumbnail,
      featured: config.featured ?? '',
      type: config.content_type ?? (hasArticle ? 'Article' : 'Index'),
      html,
      headings,
      published: config.published === true,
    }))
    .sort((a, b) => sortableDate(b).localeCompare(sortableDate(a)));
  for (const article of articles) {
    const category = categoryMap.get(article.category);
    if (category) {
      category.children.push(article.id);
      category.count += 1;
    }
  }
  for (const node of articles) {
    node.children = articles.filter((article) => article.parent === node.id).map((article) => article.id);
  }
  categories = visibleCategories(categories, includeDrafts);
  await Promise.all(nodes.filter((node) => includeDrafts || node.config.published === true).map(async (node) => {
    await copyDownloads(node.directory, node.id);
    await copySizedMedia(node.directory, node.id);
  }));
  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, `${JSON.stringify({ generated_at: new Date().toISOString(), categories, articles }, null, 2)}\n`, 'utf8');
  console.log(`Content index built: ${articles.length} ${includeDrafts ? 'preview' : 'published'} node(s).`);
}

await build();

if (isWatchMode) {
  console.log('Watching Content for authoring updates…');
  let buildTimer;
  const changedNodes = new Set();
  const selfWrites = new Map();
  const refresh = () => {
    clearTimeout(buildTimer);
    buildTimer = setTimeout(() => build().catch((error) => console.error(error)), 150);
  };
  const nodeDirectoryFor = async (file) => {
    let directory = path.dirname(file);
    while (directory.startsWith(contentRoot)) {
      if (await exists(path.join(directory, 'config.yaml'))) return directory;
      const parent = path.dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
    return null;
  };
  const flushUpdates = async () => {
    if (!touchUpdates || changedNodes.size === 0) return;
    const directories = [...changedNodes];
    changedNodes.clear();
    await Promise.all(directories.map(async (directory) => {
      const configFile = path.join(directory, 'config.yaml');
      const config = await readYaml(configFile);
      config.updated_at = now();
      selfWrites.set(configFile, Date.now() + 5_000);
      await writeYaml(configFile, config);
    }));
    refresh();
  };
  const updateTimer = setInterval(() => flushUpdates().catch((error) => console.error(error)), 60_000);
  process.once('SIGINT', () => clearInterval(updateTimer));
  process.once('SIGTERM', () => clearInterval(updateTimer));
  const watcher = watch(contentRoot, { recursive: true });
  for await (const event of watcher) {
    const file = path.join(contentRoot, String(event.filename));
    if ((selfWrites.get(file) ?? 0) > Date.now()) continue;
    const directory = await nodeDirectoryFor(file);
    if (directory) changedNodes.add(directory);
    refresh();
  }
}
