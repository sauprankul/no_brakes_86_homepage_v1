const OPT_OUT_KEY = 'no-brakes:analytics-opt-out';
const EVENT_NAMES = new Set(['page_view', 'page_engagement', 'section_engagement', 'search', 'scroll_depth', 'outbound_click', 'download_click', 'media_progress']);

function finite(value, maximum = 1_000_000) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.min(number, maximum) : 0;
}

export function normalizeSearchTerm(value) {
  const term = String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 80);
  if (!term || /@|https?:|www\.|\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/i.test(term)) return '';
  return /^[\p{L}\p{N}\s/+-]+$/u.test(term) ? term : '';
}

export function applyAnalyticsPreference(search, storage = globalThis.localStorage) {
  const preference = new URLSearchParams(search).get('analytics');
  if (preference === 'off') storage?.setItem(OPT_OUT_KEY, 'true');
  if (preference === 'on') storage?.removeItem(OPT_OUT_KEY);
  return preference;
}

export function analyticsEnabled({ endpoint, isDevelopment = false, storage = globalThis.localStorage } = {}) {
  return Boolean(endpoint) && !isDevelopment && storage?.getItem(OPT_OUT_KEY) !== 'true';
}

function sendPayload(endpoint, payload) {
  const body = JSON.stringify(payload);
  if (globalThis.navigator?.sendBeacon) return globalThis.navigator.sendBeacon(endpoint, new Blob([body], { type: 'text/plain;charset=UTF-8' }));
  return globalThis.fetch?.(endpoint, { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body });
}

export function createAnalyticsTracker({ endpoint = '', isDevelopment = false, storage, now = () => Date.now(), transport = sendPayload, documentRef = globalThis.document, windowRef = globalThis.window } = {}) {
  const enabled = analyticsEnabled({ endpoint, isDevelopment, storage });
  const state = { queue: [], page: null, section: null, observer: null, timer: null, visible: documentRef?.visibilityState !== 'hidden', scrollBucket: 0, mediaCleanup: [] };
  const elapsed = (started) => Math.max(0, now() - started);
  const queue = (name, data = {}) => {
    if (!enabled || !EVENT_NAMES.has(name) || state.queue.length >= 50) return false;
    state.queue.push({ name, routeKind: String(data.routeKind ?? 'unknown').slice(0, 20), contentId: String(data.contentId ?? '').slice(0, 100), sectionId: String(data.sectionId ?? '').slice(0, 100), query: name === 'search' ? normalizeSearchTerm(data.query) : '', durationSeconds: Math.round(finite(data.durationMs, 86_400_000) / 1000), resultCount: finite(data.resultCount, 10_000), value: finite(data.value) });
    if (!state.timer) state.timer = globalThis.setTimeout?.(() => flush(), 15_000);
    return true;
  };
  const finishSection = () => {
    if (!state.section) return;
    const durationMs = (state.section.elapsedMs ?? 0) + (state.section.started ? elapsed(state.section.started) : 0);
    if (durationMs >= 1_000) queue('section_engagement', { ...state.page, sectionId: state.section.id, durationMs });
    state.section = null;
  };
  const pause = () => {
    if (!state.visible) return;
    if (Number.isFinite(state.page?.activeSince)) state.page.activeMs += elapsed(state.page.activeSince);
    if (state.section?.started) {
      state.section.elapsedMs = (state.section.elapsedMs ?? 0) + elapsed(state.section.started);
      state.section.started = 0;
    }
    state.visible = false;
  };
  const resume = () => {
    if (state.visible) return;
    if (state.page) state.page.activeSince = now();
    if (state.section) state.section.started = now();
    state.visible = true;
  };
  const flush = () => {
    if (state.timer) globalThis.clearTimeout?.(state.timer);
    state.timer = null;
    if (!enabled || !state.queue.length) return false;
    const events = state.queue.splice(0, state.queue.length);
    transport(endpoint, { events });
    return true;
  };
  const stopPage = () => {
    if (!state.page) return;
    pause();
    finishSection();
    if (state.page.activeMs >= 1_000) queue('page_engagement', { ...state.page, durationMs: state.page.activeMs });
    state.page = null;
    flush();
  };
  const startPage = ({ routeKind = 'unknown', contentId = '' } = {}) => {
    stopPage();
    state.scrollBucket = 0;
    state.page = { routeKind, contentId, activeSince: state.visible ? now() : 0, activeMs: 0 };
    queue('page_view', state.page);
  };
  const observeSections = (root) => {
    state.observer?.disconnect();
    state.observer = null;
    if (!enabled || !globalThis.IntersectionObserver || !root) return;
    const headings = [...root.querySelectorAll('h2[id], h3[id]')];
    if (!headings.length) return;
    state.observer = new globalThis.IntersectionObserver((entries) => {
      const next = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!next || state.section?.id === next.target.id) return;
      finishSection();
      state.section = { id: next.target.id, started: state.visible ? now() : 0, elapsedMs: 0 };
    }, { threshold: 0.6 });
    headings.forEach((heading) => state.observer.observe(heading));
  };
  const trackSearch = (query, resultCount) => {
    const normalized = normalizeSearchTerm(query);
    if (normalized) queue('search', { ...state.page, query: normalized, resultCount });
  };
  const trackInteraction = (kind, value = 1) => queue(kind, { ...state.page, value });
  const trackScrollDepth = (ratio) => {
    const bucket = Math.min(100, Math.max(0, Math.floor(ratio * 4) * 25));
    if (!state.page || bucket <= state.scrollBucket) return;
    state.scrollBucket = bucket;
    queue('scroll_depth', { ...state.page, value: bucket });
  };
  const observeMedia = (root) => {
    state.mediaCleanup.forEach((cleanup) => cleanup());
    state.mediaCleanup = [];
    if (!enabled || !root) return;
    [...root.querySelectorAll('video')].forEach((video, index) => {
      let bucket = -1;
      const progress = () => {
        const next = video.duration ? Math.min(100, Math.floor((video.currentTime / video.duration) * 4) * 25) : 0;
        if (next > bucket) { bucket = next; queue('media_progress', { ...state.page, sectionId: video.dataset.analyticsMedia ?? `video-${index + 1}`, value: next }); }
      };
      video.addEventListener('play', progress);
      video.addEventListener('timeupdate', progress);
      video.addEventListener('ended', progress);
      state.mediaCleanup.push(() => ['play', 'timeupdate', 'ended'].forEach((name) => video.removeEventListener(name, progress)));
    });
  };
  const onVisibility = () => {
    if (documentRef?.visibilityState === 'hidden') { pause(); flush(); } else resume();
  };
  documentRef?.addEventListener?.('visibilitychange', onVisibility);
  windowRef?.addEventListener?.('pagehide', stopPage);
  return { enabled, flush, startPage, stopPage, observeSections, observeMedia, trackSearch, trackInteraction, trackScrollDepth, destroy() { state.observer?.disconnect(); state.mediaCleanup.forEach((cleanup) => cleanup()); documentRef?.removeEventListener?.('visibilitychange', onVisibility); windowRef?.removeEventListener?.('pagehide', stopPage); stopPage(); } };
}
