import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

const contentRoot = path.join(process.cwd(), 'Content');
const errors = [];
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
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

const configFiles = (await filesIn(contentRoot)).filter((file) => path.basename(file) === 'config.yaml');
const nodes = await Promise.all(configFiles.map(async (file) => ({
  file,
  dir: path.dirname(file),
  config: YAML.parse(await readFile(file, 'utf8')) ?? {},
})));
const nodeById = new Map();

for (const node of nodes) {
  const { config, file } = node;
  const label = path.relative(process.cwd(), file);
  if (!isNonEmptyString(config.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.id)) errors.push(`${label}: id must be lowercase kebab-case.`);
  if (!isNonEmptyString(config.title)) errors.push(`${label}: title must be a non-empty string.`);
  if (config.id && nodeById.has(config.id)) errors.push(`${label}: duplicate id "${config.id}" (also in ${path.relative(process.cwd(), nodeById.get(config.id).file)}).`);
  else if (config.id) nodeById.set(config.id, node);
}

for (const node of nodes) {
  const { config, file, dir } = node;
  const label = path.relative(process.cwd(), file);
  if (config.parent && !nodeById.has(config.parent)) errors.push(`${label}: parent "${config.parent}" does not exist.`);
  if (config.published !== true) continue;

  if (!config.parent) errors.push(`${label}: root nodes are structural and must not be published.`);
  if (!isNonEmptyString(config.subtitle)) errors.push(`${label}: published nodes need a non-empty subtitle.`);
  if (!isNonEmptyString(config.thumbnail)) errors.push(`${label}: published nodes need a non-empty thumbnail.`);
  if (!isDate(config.published_at)) errors.push(`${label}: published_at must be YYYY-MM-DD for a published node.`);
  if (!isDate(config.updated_at)) errors.push(`${label}: updated_at must be YYYY-MM-DD for a published node.`);
  if (isDate(config.published_at) && isDate(config.updated_at) && config.updated_at < config.published_at) errors.push(`${label}: updated_at cannot be before published_at.`);
  if (!Array.isArray(config.tags) || config.tags.some((tag) => !isNonEmptyString(tag))) errors.push(`${label}: tags must be an array of non-empty strings.`);
  if (isNonEmptyString(config.thumbnail) && !/^(https?:\/\/|\/)/.test(config.thumbnail)) {
    const thumbnailFile = path.resolve(dir, config.thumbnail);
    if (!await exists(thumbnailFile)) errors.push(`${label}: thumbnail "${config.thumbnail}" does not exist.`);
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
    if (!linked) errors.push(`${path.relative(process.cwd(), articleFile)}: article with child nodes must link to "${child.config.id}".`);
  }
}

if (errors.length) {
  console.error(`Content validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Content validation passed: ${nodes.length} node(s) checked.`);
}
