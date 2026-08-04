import { access, copyFile, mkdir, readFile, readdir, rm, watch, writeFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { renderArticleMarkdown } from './content-compiler.mjs';
import { directCategoryChildren, rootCategoryId } from './content-hierarchy.mjs';
import { contentPath } from './content-routes.mjs';
import { authorFingerprint, authorFingerprints, changedAuthorDirectories, changedSources, contentChangeLog, contentSnapshot, watchedSourceKind } from './content-watch.mjs';
import { visibleCategories, visibleEntries } from './content-index-visibility.mjs';
import { generateSizedMedia, IMAGE_EXTENSIONS, publicMediaPath, sizedMediaRelativePath } from './media-pipeline.mjs';
import { contentRoot as defaultContentRoot, publicRoot } from './project-paths.mjs';

const contentRoot = process.env.NO_BRAKES_CONTENT_DIR ? path.resolve(process.env.NO_BRAKES_CONTENT_DIR) : defaultContentRoot;
const outputRoot = process.env.NO_BRAKES_PUBLIC_DIR ? path.resolve(process.env.NO_BRAKES_PUBLIC_DIR) : publicRoot;
const outputFile = path.join(outputRoot, 'content-index.json');
const isWatchMode = process.argv.includes('--watch');
const includeDrafts = process.argv.includes('--include-drafts');
const touchUpdates = process.argv.includes('--touch-updates');
const requestedUpdateInterval = Number(process.env.NO_BRAKES_UPDATE_INTERVAL_MS ?? 60_000);
const updateIntervalMs = Number.isFinite(requestedUpdateInterval) && requestedUpdateInterval > 0 ? requestedUpdateInterval : 60_000;

const now = () => new Date().toISOString();
const legacyDateTimestamp = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') ? `${value}T00:00:00.000Z` : value;
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

async function articleData(directory, nodeId, entryPath) {
  const articleFile = path.join(directory, 'article.md');
  try {
    const markdown = await readFile(articleFile, 'utf8');
    return { hasArticle: true, ...renderArticleMarkdown(markdown, nodeId, entryPath) };
  } catch {
    return { hasArticle: false, html: '', headings: [], searchSections: [] };
  }
}

async function copyDownloads(directory, entryPath) {
  const downloadsDirectory = path.join(directory, 'Downloads');
  if (!await exists(downloadsDirectory)) return;
  const files = await filesIn(downloadsDirectory);
  await Promise.all(files.map(async (file) => {
    const destination = path.join(outputRoot, entryPath.replace(/^\/+/, ''), 'downloads', path.relative(downloadsDirectory, file));
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(file, destination);
  }));
}

async function copySizedMedia(directory, nodeId) {
  const sizedDirectory = path.join(directory, 'SizedMedia');
  if (!await exists(sizedDirectory)) return;
  const files = await filesIn(sizedDirectory);
  await Promise.all(files.filter((file) => path.basename(file) !== '.media-manifest.json').map(async (file) => {
    const destination = path.join(outputRoot, 'media', nodeId, path.relative(sizedDirectory, file));
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(file, destination);
  }));
}

async function writeYaml(file, value) {
  await writeFile(file, YAML.stringify(value), 'utf8');
}

async function normaliseArticle(configFile, config) {
  let changed = false;
  if (legacyDateTimestamp(config.published_at) !== config.published_at) {
    config.published_at = legacyDateTimestamp(config.published_at);
    changed = true;
  } else if (config.published === true && !config.published_at) {
    config.published_at = now();
    changed = true;
  }
  if (config.published === true && !config.updated_at) {
    config.updated_at = config.published_at;
    changed = true;
  }
  if (changed) await writeYaml(configFile, config);
  return config;
}

function slugFrom(file) {
  return path.relative(contentRoot, path.dirname(file)).replaceAll(path.sep, '/').replace(/\/(config|_node)$/i, '');
}

async function build({ prepareMedia = false } = {}) {
  if (prepareMedia) {
    try {
      await generateSizedMedia(contentRoot);
    } catch (error) {
      console.error(`Media resizing failed: ${error.message}`);
    }
  }
  if (!isWatchMode) {
    await Promise.all(['downloads', 'media'].map((directory) => rm(path.join(outputRoot, directory), { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })));
  }
  const configs = (await filesIn(contentRoot)).filter((file) => path.basename(file) === 'config.yaml');
  const entries = await Promise.all(configs.map(async (file) => ({ file, config: await normaliseArticle(file, await readYaml(file)) })));
  const nodeShells = await Promise.all(entries.map(async ({ file, config }) => {
    const id = config.id ?? slugFrom(file);
    const directory = path.dirname(file);
    return { file, config, id, parent: config.parent ?? null, thumbnail: await findThumbnail(directory, id, config.thumbnail), directory };
  }));
  const nodes = await Promise.all(nodeShells.map(async (node) => ({
    ...node,
    ...(await articleData(node.directory, node.id, contentPath(nodeShells, node))),
  })));
  let categories = nodes
    .filter(({ parent }) => !parent)
    .sort((a, b) => (a.config.order ?? 999) - (b.config.order ?? 999))
    .map((node) => ({
      id: node.id,
      path: contentPath(nodes, node),
      title: node.config.title,
      name: node.config.title,
      short: node.config.short_title ?? node.config.title,
      published: node.config.published === true,
      count: 0,
      intro: node.config.description ?? '',
      children: [],
      parent: null,
      category: node.id,
      hasArticle: node.hasArticle,
      subtitle: node.config.subtitle ?? '',
      date: node.config.published_at,
      updatedAt: node.config.updated_at,
      tags: (node.config.tags ?? []).map(String),
      media: node.config.media_label ?? 'NOTE',
      thumbnail: node.thumbnail,
      featured: node.config.featured ?? '',
      type: node.config.content_type ?? (node.hasArticle ? 'Article' : 'Index'),
      html: node.html,
      headings: node.headings,
      searchSections: node.searchSections,
    }));
  const articles = visibleEntries(nodes, includeDrafts)
    .map(({ config, id, parent, thumbnail, hasArticle, html, headings, searchSections }) => ({
      id,
      path: contentPath(nodes, { config, id, parent }),
      category: rootCategoryId(nodes, { id, parent }),
      parent,
      children: [],
      hasArticle,
      title: config.title,
      subtitle: config.subtitle ?? '',
      date: config.published_at,
      updatedAt: config.updated_at,
      tags: (config.tags ?? []).map(String),
      media: config.media_label ?? 'NOTE',
      thumbnail,
      featured: config.featured ?? '',
      type: config.content_type ?? (hasArticle ? 'Article' : 'Index'),
      html,
      headings,
      searchSections,
      published: config.published === true,
    }))
    .sort((a, b) => sortableDate(b).localeCompare(sortableDate(a)));
  for (const category of categories) {
    category.children = directCategoryChildren(articles, category.id);
    category.count = category.children.length;
  }
  for (const node of articles) {
    node.children = articles.filter((article) => article.parent === node.id).map((article) => article.id);
  }
  categories = visibleCategories(categories, includeDrafts);
  await Promise.all(nodes.filter((node) => includeDrafts || node.config.published === true).map(async (node) => {
    await copyDownloads(node.directory, contentPath(nodes, node));
    await copySizedMedia(node.directory, node.id);
  }));
  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, `${JSON.stringify({ generated_at: new Date().toISOString(), categories, articles }, null, 2)}\n`, 'utf8');
  console.log(`Content index built: ${articles.length} ${includeDrafts ? 'preview' : 'published'} node(s).`);
}

await build({ prepareMedia: isWatchMode && includeDrafts });

if (isWatchMode) {
  console.log('Watching Content for authoring updates...');
  let buildTimer;
  let sourceSnapshot = await contentSnapshot(contentRoot);
  const timestampFingerprints = authorFingerprints(sourceSnapshot);
  const changedNodes = new Set();
  const selfWrites = new Map();
  let work = Promise.resolve();
  const enqueue = (task) => {
    work = work.then(task).catch((error) => console.error(error));
  };
  const refresh = () => {
    clearTimeout(buildTimer);
    buildTimer = setTimeout(() => enqueue(async () => {
      const nextSnapshot = await contentSnapshot(contentRoot, sourceSnapshot);
      const changes = changedSources(sourceSnapshot, nextSnapshot);
      if (!changes.length) return;
      sourceSnapshot = nextSnapshot;
      for (const directory of changedAuthorDirectories(changes)) changedNodes.add(directory);
      console.log(`Content changes detected; rebuilding:\n${contentChangeLog(changes)}`);
      await build({ prepareMedia: changes.some((change) => change.kind === 'media') });
    }), 150);
  };
  const flushUpdates = async () => {
    if (!touchUpdates || changedNodes.size === 0) return;
    const directories = [...changedNodes].filter((directory) => authorFingerprint(sourceSnapshot, directory) !== timestampFingerprints.get(directory));
    changedNodes.clear();
    if (!directories.length) return;
    await Promise.all(directories.map(async (directory) => {
      const configFile = path.join(contentRoot, directory, 'config.yaml');
      const config = await readYaml(configFile);
      config.updated_at = now();
      selfWrites.set(path.resolve(configFile).toLowerCase(), Date.now() + 5_000);
      await writeYaml(configFile, config);
      timestampFingerprints.set(directory, authorFingerprint(sourceSnapshot, directory));
    }));
    console.log(`Authored content timestamps updated; rebuilding:\n${directories.map((directory) => `  - Content/${directory ? `${directory}/` : ''}config.yaml`).join('\n')}`);
    const timestampConfigPaths = new Set(directories.map((directory) => `${directory ? `${directory}/` : ''}config.yaml`.toLowerCase()));
    const nextSnapshot = await contentSnapshot(contentRoot, sourceSnapshot);
    const concurrentChanges = changedSources(sourceSnapshot, nextSnapshot).filter((change) => !timestampConfigPaths.has(change.path.toLowerCase()));
    sourceSnapshot = nextSnapshot;
    for (const directory of changedAuthorDirectories(concurrentChanges)) changedNodes.add(directory);
    if (concurrentChanges.length) console.log(`Content changes detected; rebuilding:\n${contentChangeLog(concurrentChanges)}`);
    await build({ prepareMedia: concurrentChanges.some((change) => change.kind === 'media') });
  };
  const updateTimer = setInterval(() => enqueue(flushUpdates), updateIntervalMs);
  process.once('SIGINT', () => clearInterval(updateTimer));
  process.once('SIGTERM', () => clearInterval(updateTimer));
  const watcher = watch(contentRoot, { recursive: true });
  for await (const event of watcher) {
    const file = path.join(contentRoot, String(event.filename));
    if ((selfWrites.get(path.resolve(file).toLowerCase()) ?? 0) > Date.now()) continue;
    if (event.filename && !watchedSourceKind(path.relative(contentRoot, file))) continue;
    refresh();
  }
}
