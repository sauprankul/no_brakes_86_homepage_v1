import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { configuredThumbnailError, publishedDescriptionError, validTags } from './content-validation-rules.mjs';
import { IMAGE_EXTENSIONS, mediaTypeFor, sizedMediaRelativePath } from './media-pipeline.mjs';
import { contentRoot, repositoryRelative } from './project-paths.mjs';

const errors = [];
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isTimestamp = (value) => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  && !Number.isNaN(Date.parse(value));
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(fullPath) : [fullPath];
  }));
  return nested.flat();
}

async function exists(file) {
  return access(file).then(() => true).catch(() => false);
}

async function thumbnailFor(directory, configured) {
  if (await exists(path.join(directory, 'SizedMedia', 'thumbnail.jpg'))) return './SizedMedia/thumbnail.jpg';
  if (/^\.\/Media\//i.test(configured ?? '')) {
    const source = configured.replace(/^\.\/Media\//i, '');
    if (!IMAGE_EXTENSIONS.has(path.extname(source).toLowerCase())) return '';
    const generated = sizedMediaRelativePath(source, 'image');
    return await exists(path.join(directory, 'SizedMedia', generated)) ? `./SizedMedia/${generated}` : '';
  }
  return configured ?? '';
}

const configFiles = (await filesIn(contentRoot)).filter((file) => path.basename(file) === 'config.yaml');
const nodes = await Promise.all(configFiles.map(async (file) => ({
  file,
  dir: path.dirname(file),
  config: YAML.parse(await readFile(file, 'utf8')) ?? {},
})));
const nodeById = new Map();

for (const node of nodes) {
  const { config, file } = node;
  const label = repositoryRelative(file);
  if (!isNonEmptyString(config.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.id)) errors.push(`${label}: id must be lowercase kebab-case.`);
  if (!isNonEmptyString(config.title)) errors.push(`${label}: title must be a non-empty string.`);
  if (config.id && nodeById.has(config.id)) errors.push(`${label}: duplicate id "${config.id}" (also in ${repositoryRelative(nodeById.get(config.id).file)}).`);
  else if (config.id) nodeById.set(config.id, node);
}

for (const node of nodes) {
  const { config, file, dir } = node;
  const label = repositoryRelative(file);
  if (config.parent && !nodeById.has(config.parent)) errors.push(`${label}: parent "${config.parent}" does not exist.`);
  if (config.published_at != null && !isTimestamp(config.published_at)) errors.push(`${label}: published_at must be an ISO 8601 timestamp when present.`);
  if (config.updated_at != null && !isTimestamp(config.updated_at)) errors.push(`${label}: updated_at must be an ISO 8601 timestamp when present.`);
  if (config.published !== true) continue;
  const thumbnail = await thumbnailFor(dir, config.thumbnail);

  const descriptionError = publishedDescriptionError({ hasArticle: await exists(path.join(dir, 'article.md')), subtitle: config.subtitle, description: config.description });
  if (descriptionError) errors.push(`${label}: ${descriptionError}`);
  const thumbnailError = configuredThumbnailError(config.thumbnail, thumbnail);
  if (thumbnailError) errors.push(`${label}: ${thumbnailError}`);
  if (config.published_at == null) errors.push(`${label}: published_at is required for a published node.`);
  if (config.updated_at == null) errors.push(`${label}: updated_at is required for a published node.`);
  if (isTimestamp(config.published_at) && isTimestamp(config.updated_at) && Date.parse(config.updated_at) < Date.parse(config.published_at)) errors.push(`${label}: updated_at cannot be before published_at.`);
  if (!validTags(config.tags)) errors.push(`${label}: tags must be an array of non-empty strings or finite numbers.`);
  if (isNonEmptyString(thumbnail) && !/^(https?:\/\/|\/|\.\/SizedMedia\/)/.test(thumbnail)) {
    const thumbnailFile = path.resolve(dir, thumbnail);
    if (!await exists(thumbnailFile)) errors.push(`${label}: thumbnail "${thumbnail}" does not exist.`);
  }
}

for (const node of nodes) {
  const children = nodes.filter((candidate) => candidate.config.parent === node.config.id);
  const articleFile = path.join(node.dir, 'article.md');
  if (!children.length || !await exists(articleFile)) continue;
  const article = await readFile(articleFile, 'utf8');
  for (const child of children) {
    const id = escapeRegExp(child.config.id);
    const linked = new RegExp(`\\]\\([^)]*${id}[^)]*\\)|\\[\\[${id}(?:\\|[^\\]]+)?\\]\\]`, 'i').test(article);
    if (!linked) errors.push(`${repositoryRelative(articleFile)}: article with child nodes must link to "${child.config.id}".`);
  }
  if (node.config.published !== true) continue;
  for (const match of article.matchAll(/(?:\]\(|(?:src|href)\s*=\s*["'])\.\/Media\/([^\s)"']+)/gi)) {
    const source = match[1];
    try {
      const generated = sizedMediaRelativePath(source, mediaTypeFor(source));
      if (!await exists(path.join(node.dir, 'SizedMedia', generated))) {
        errors.push(`${repositoryRelative(articleFile)}: Media/${source} needs generated SizedMedia/${generated}. Run npm run media:prepare locally.`);
      }
    } catch (error) {
      errors.push(`${repositoryRelative(articleFile)}: Media/${source} is not a supported publishable media reference (${error.message}).`);
    }
  }
}

if (errors.length) {
  console.error(`Content validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Content validation passed: ${nodes.length} node(s) checked.`);
}
