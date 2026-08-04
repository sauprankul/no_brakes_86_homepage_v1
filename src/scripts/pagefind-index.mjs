import { rm } from 'node:fs/promises';
import * as pagefind from 'pagefind';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

export function pagefindDocument(entry) {
  const imageMeta = entry.thumbnail ? `<meta data-pagefind-meta="image[content]" content="${esc(entry.thumbnail)}">` : '';
  const categoryMeta = entry.category ? `<meta data-pagefind-meta="category[content]" content="${esc(entry.category)}">` : '';
  const dateMeta = entry.date ? `<meta data-pagefind-meta="date[content]" content="${esc(entry.date)}">` : '';
  const tagMeta = (entry.tags ?? []).map((tag) => `<meta data-pagefind-meta="tag[content]" content="${esc(tag)}">`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta data-pagefind-meta="entry_id[content]" content="${esc(entry.id)}">${imageMeta}${categoryMeta}${dateMeta}${tagMeta}</head><body><main data-pagefind-body><h1 data-pagefind-meta="title">${esc(entry.title)}</h1><p data-pagefind-meta="subtitle">${esc(entry.subtitle)}</p>${entry.html ?? ''}</main></body></html>`;
}

export async function buildPagefindIndex(entries, outputPath) {
  await rm(outputPath, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  const { index, errors: creationErrors } = await pagefind.createIndex({ forceLanguage: 'en', writePlayground: false });
  if (!index || creationErrors?.length) throw new Error(`Pagefind could not start: ${(creationErrors ?? []).join('; ')}`);
  try {
    let count = 0;
    for (const entry of entries.filter((candidate) => candidate.hasArticle === true)) {
      const { errors } = await index.addHTMLFile({ url: entry.path, content: pagefindDocument(entry) });
      if (errors?.length) throw new Error(`Pagefind could not index ${entry.id}: ${errors.join('; ')}`);
      count += 1;
    }
    const { errors } = await index.writeFiles({ outputPath });
    if (errors?.length) throw new Error(`Pagefind could not write its bundle: ${errors.join('; ')}`);
    return count;
  } finally {
    await index.deleteIndex();
    await pagefind.close();
  }
}
