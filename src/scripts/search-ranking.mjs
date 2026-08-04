export function normalizeSearchText(value) {
  return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function searchTokens(query) {
  return [...new Set(normalizeSearchText(query).split(/\s+/).filter(Boolean))];
}

function containsEvery(value, tokens) {
  const words = normalizeSearchText(value).split(/\s+/);
  return tokens.every((token) => words.some((word) => word.includes(token)));
}

function preservesOrder(value, tokens) {
  const words = normalizeSearchText(value).split(/\s+/);
  let cursor = -1;
  return tokens.every((token) => {
    cursor = words.findIndex((word, index) => index > cursor && word.includes(token));
    return cursor >= 0;
  });
}

export function metadataScore(entry, categoryName, query) {
  const phrase = normalizeSearchText(query);
  const tokens = searchTokens(query);
  if (!tokens.length) return 0;
  const title = normalizeSearchText(entry.title);
  const subtitle = normalizeSearchText(entry.subtitle);
  const fields = [entry.title, entry.subtitle, entry.type, categoryName, ...(entry.tags ?? [])];
  const combined = fields.join(' ');
  if (!containsEvery(combined, tokens)) return 0;
  if (title.includes(phrase)) return 1200;
  if (containsEvery(title, tokens)) return 1000 + (preservesOrder(title, tokens) ? 80 : 0);
  if (subtitle.includes(phrase)) return 900;
  if (containsEvery(subtitle, tokens)) return 800 + (preservesOrder(subtitle, tokens) ? 60 : 0);
  return 650 + (preservesOrder(combined, tokens) ? 40 : 0);
}

export function bodyContext(entry, query, radius = 5) {
  const tokens = searchTokens(query);
  const sections = entry.searchSections ?? [];
  if (!tokens.length || !containsEvery(sections.map((section) => section.text).join(' '), tokens)) return null;
  const ranked = sections.map((section, index) => {
    const normalized = normalizeSearchText(section.text);
    const hits = tokens.filter((token) => normalized.split(/\s+/).some((word) => word.includes(token))).length;
    return { section, index, hits, exact: normalized.includes(normalizeSearchText(query)) };
  }).filter(({ hits }) => hits > 0).sort((a, b) => Number(b.exact) - Number(a.exact) || b.hits - a.hits || a.index - b.index);
  const selected = ranked[0];
  if (!selected) return null;
  if (selected.section.kind === 'heading') return { kind: 'heading', text: selected.section.text, score: selected.exact ? 480 : 420 };
  const words = selected.section.text.trim().split(/\s+/);
  const firstMatch = words.findIndex((word) => tokens.some((token) => normalizeSearchText(word).includes(token)));
  const start = Math.max(0, firstMatch - radius);
  const end = Math.min(words.length, firstMatch + radius + 1);
  const text = `${start ? '…' : ''}${words.slice(start, end).join(' ')}${end < words.length ? '…' : ''}`;
  return { kind: selected.section.kind, text, score: selected.exact ? 460 : 400 };
}

export function rankMetadataResults(entries, categoryNameFor, query) {
  return entries.map((entry) => ({ entry, score: metadataScore(entry, categoryNameFor(entry), query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || String(a.entry.title).localeCompare(String(b.entry.title)));
}

export function rankFullSearchResults(entries, categoryNameFor, query, bodyEntryIds = null) {
  const pagefindRank = bodyEntryIds ? new Map(bodyEntryIds.map((id, index) => [id, index])) : null;
  return entries.map((entry) => {
    const metadata = metadataScore(entry, categoryNameFor(entry), query);
    const body = pagefindRank ? (pagefindRank.has(entry.id) ? bodyContext(entry, query) : null) : bodyContext(entry, query);
    const pagefindScore = pagefindRank?.has(entry.id) ? Math.max(1, 500 - pagefindRank.get(entry.id)) : 0;
    return { entry, metadataMatched: metadata > 0, bodyContext: metadata > 0 ? null : body, score: Math.max(metadata, pagefindScore, body?.score ?? 0) };
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score || String(a.entry.title).localeCompare(String(b.entry.title)));
}
