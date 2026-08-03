import { normalizeSearchTerm } from '../../scripts/analytics.mjs';

export const ALLOWED_EVENT_NAMES = new Set(['page_view', 'page_engagement', 'section_engagement', 'search', 'scroll_depth', 'outbound_click', 'download_click', 'media_progress']);
const EEA_UK_CH = new Set('AT BE BG CH CY CZ DE DK EE ES FI FR GB GR HR HU IE IS IT LI LT LU LV MT NL NO PL PT RO SE SI SK'.split(' '));

const text = (value, limit) => String(value ?? '').replace(/[^a-z0-9-]/gi, '').slice(0, limit);
const number = (value, limit) => Math.min(limit, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0));

export function validEvents(payload) {
  if (!Array.isArray(payload?.events)) return [];
  return payload.events.slice(0, 25).flatMap((event) => {
    if (!ALLOWED_EVENT_NAMES.has(event?.name)) return [];
    const query = event.name === 'search' ? normalizeSearchTerm(event.query) : '';
    return [{ name: event.name, routeKind: text(event.routeKind, 20), contentId: text(event.contentId, 100), sectionId: text(event.sectionId, 100), query, durationSeconds: number(event.durationSeconds, 86_400), resultCount: number(event.resultCount, 10_000), value: number(event.value, 1_000_000) }];
  });
}

export function originAllowed(request, allowedOrigin) {
  const origin = request.headers.get('origin');
  return Boolean(allowedOrigin) && origin === allowedOrigin;
}

export function analyticsCollectionAllowed(request, blockedCountries = EEA_UK_CH) {
  return !blockedCountries.has(request.cf?.country);
}
