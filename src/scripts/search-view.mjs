import { searchTokens } from './search-ranking.mjs';

const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function highlightedSearchText(value, query) {
  const tokens = searchTokens(query).sort((left, right) => right.length - left.length);
  if (!tokens.length) return esc(value);
  const matcher = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  return String(value ?? '').split(matcher).map((part, index) => index % 2 ? `<mark class="search-match">${esc(part)}</mark>` : esc(part)).join('');
}
