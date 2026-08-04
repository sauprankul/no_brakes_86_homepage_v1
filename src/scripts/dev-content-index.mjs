import { readFile, writeFile } from 'node:fs/promises';

export function patchPublicationState(index, entry, generatedAt = new Date().toISOString()) {
  const update = (candidate) => candidate.id === entry.id ? {
    ...candidate,
    published: entry.published === true,
    date: entry.published_at ?? candidate.date,
    updatedAt: entry.updated_at ?? candidate.updatedAt,
  } : candidate;
  return {
    ...index,
    generated_at: generatedAt,
    categories: Array.isArray(index.categories) ? index.categories.map(update) : [],
    articles: Array.isArray(index.articles) ? index.articles.map(update) : [],
  };
}

export async function updateDevIndexPublication(indexFile, entry) {
  const index = JSON.parse(await readFile(indexFile, 'utf8'));
  const next = patchPublicationState(index, entry);
  await writeFile(indexFile, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return next;
}
