import { originAllowed, validEvents } from './collector.mjs';

const cors = (origin) => ({ 'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', vary: 'Origin' });

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN ?? '';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(allowedOrigin) });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors(allowedOrigin) });
    if (!originAllowed(request, allowedOrigin)) return new Response('Origin not allowed', { status: 403, headers: cors(allowedOrigin) });
    let payload;
    try { payload = await request.json(); } catch { return new Response('Invalid JSON', { status: 400, headers: cors(allowedOrigin) }); }
    validEvents(payload).forEach((event) => env.ANALYTICS.writeDataPoint({
      blobs: [event.name, event.routeKind, event.contentId, event.sectionId, event.query],
      doubles: [event.durationSeconds, event.resultCount, event.value],
      indexes: [],
    }));
    return new Response(null, { status: 204, headers: cors(allowedOrigin) });
  },
};
