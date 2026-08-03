import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { contentRoot } from './project-paths.mjs';

function losAngelesDate() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const date = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${date.year}-${date.month}-${date.day}`;
}

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
  if (published && !next.published_at) next.published_at = losAngelesDate();
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
