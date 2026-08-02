import { copyFile, mkdir, readFile, readdir, watch, writeFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { renderArticleMarkdown } from './content-compiler.mjs';

const root = process.cwd();
const contentRoot = path.join(root, 'Content');
const outputFile = path.join(root, 'public', 'content-index.json');
const isWatchMode = process.argv.includes('--watch');
const includeDrafts = process.argv.includes('--include-drafts');

const today = () => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const value = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
};

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
      const destination = path.join(root, 'public', 'downloads', nodeId, path.relative(downloadsDirectory, file));
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(file, destination);
    }));
  } catch {
    // A Downloads folder is optional.
  }
}

async function writeYaml(file, value) {
  await writeFile(file, YAML.stringify(value), 'utf8');
}

async function normaliseArticle(configFile, config, changedFile) {
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
  if (changedFile && path.dirname(changedFile) === path.dirname(configFile) && changedFile.endsWith('.md') && config.updated_at !== date) {
    config.updated_at = date;
    changed = true;
  }
  if (changed) await writeYaml(configFile, config);
  return config;
}

function slugFrom(file) {
  return path.relative(contentRoot, path.dirname(file)).replaceAll(path.sep, '/').replace(/\/(config|_node)$/i, '');
}

async function build(changedFile = '') {
  const configs = (await filesIn(contentRoot)).filter((file) => path.basename(file) === 'config.yaml');
  const entries = await Promise.all(configs.map(async (file) => ({ file, config: await normaliseArticle(file, await readYaml(file), changedFile) })));
  const nodes = await Promise.all(entries.map(async ({ file, config }) => {
    const id = config.id ?? slugFrom(file);
    const directory = path.dirname(file);
    return { file, config, id, parent: config.parent ?? null, ...(await articleData(directory, id)), directory };
  }));
  const categories = nodes
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
  const articles = nodes
    .filter(({ config, parent }) => parent && (includeDrafts || config.published === true))
    .map(({ config, id, parent, hasArticle, html, headings }) => ({
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
      thumbnail: config.thumbnail ?? '',
      featured: config.featured ?? '',
      type: config.content_type ?? (hasArticle ? 'Article' : 'Index'),
      html,
      headings,
    }))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
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
  await Promise.all(nodes.filter((node) => includeDrafts || node.config.published === true).map((node) => copyDownloads(node.directory, node.id)));
  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, `${JSON.stringify({ generated_at: new Date().toISOString(), categories, articles }, null, 2)}\n`, 'utf8');
  console.log(`Content index built: ${articles.length} ${includeDrafts ? 'preview' : 'published'} node(s).`);
}

await build();

if (isWatchMode) {
  console.log('Watching Content for authoring updates…');
  let timer;
  const refresh = (filename) => {
    clearTimeout(timer);
    timer = setTimeout(() => build(filename ? path.join(contentRoot, filename) : '').catch((error) => console.error(error)), 150);
  };
  const watcher = watch(contentRoot, { recursive: true });
  for await (const event of watcher) refresh(event.filename);
}
