import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

async function exists(file) {
  return access(file).then(() => true).catch(() => false);
}

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(fullPath) : [fullPath];
  }));
  return nested.flat();
}

export async function publishedMarkdownFiles(contentRoot) {
  if (!await exists(contentRoot)) return [];
  const configFiles = (await filesIn(contentRoot)).filter((file) => path.basename(file) === 'config.yaml');
  const articles = [];
  for (const configFile of configFiles) {
    const config = YAML.parse(await readFile(configFile, 'utf8')) ?? {};
    if (config.published !== true) continue;
    const articleFile = path.join(path.dirname(configFile), 'article.md');
    if (await exists(articleFile)) articles.push(articleFile);
  }
  return articles.sort((left, right) => left.localeCompare(right));
}
