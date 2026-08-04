import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { contentRoot } from './project-paths.mjs';

const legacyDateTimestamp = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') ? `${value}T00:00:00.000Z` : value;

async function configFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return configFiles(file);
    return entry.name === 'config.yaml' ? [file] : [];
  }));
  return nested.flat();
}

export function togglePublication(config, timestamp = new Date().toISOString()) {
  const published = config.published !== true;
  const next = { ...config, published, updated_at: timestamp };
  if (published) next.published_at = legacyDateTimestamp(next.published_at) || timestamp;
  return next;
}

export async function togglePublishedEntry(id, root = contentRoot) {
  const configs = await configFiles(root);
  for (const file of configs) {
    const config = YAML.parse(await readFile(file, 'utf8')) ?? {};
    if (config.id !== id) continue;
    const next = togglePublication(config);
    await writeFile(file, YAML.stringify(next), 'utf8');
    return next;
  }
  throw new Error(`No entry with id "${id}" exists in Content.`);
}
