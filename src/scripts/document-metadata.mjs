export const SITE_URL = 'https://nobrakes86.com';

const SITE_NAME = 'No Brakes 86';
const HOME_DESCRIPTION = "No Brakes 86 is Saurabh Kulkarni's repository of knowledge. He's built it through years of competing and winning in 86 Challenge, one of the most competitive, data-driven time trials in California.";

const absoluteUrl = (route = '/') => new URL(route, `${SITE_URL}/`).href;
const firstParagraph = (entry) => entry?.searchSections?.find((section) => section.kind === 'p')?.text ?? '';

function concise(value, maximum = 200) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= maximum) return text;
  const shortened = text.slice(0, maximum + 1).replace(/\s+\S*$/, '').trim();
  return `${shortened || text.slice(0, maximum).trim()}…`;
}

export function descriptionFor(entry, fallback = HOME_DESCRIPTION) {
  return concise(entry?.subtitle || entry?.intro || firstParagraph(entry) || fallback);
}

export function routeMetadata(kind, entry, about, pathname = '/') {
  const route = kind === 'home' ? '/' : kind === 'about' ? '/about' : entry?.path || pathname;
  const url = absoluteUrl(route);
  const title = kind === 'home' ? SITE_NAME : kind === 'not-found' ? `Page not found | ${SITE_NAME}` : `${entry?.title || about?.title || 'About'} | ${SITE_NAME}`;
  const description = kind === 'home' ? HOME_DESCRIPTION : kind === 'about' ? descriptionFor(about) : descriptionFor(entry);
  const image = kind === 'home' ? `${SITE_URL}/logo.jpg` : entry?.thumbnail ? absoluteUrl(entry.thumbnail) : `${SITE_URL}/banner.jpg`;
  return {
    route,
    url,
    title,
    description,
    image,
    type: kind === 'article' ? 'article' : 'website',
    robots: kind === 'not-found' ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
    ...(kind === 'home' ? { imageWidth: '1000', imageHeight: '665' } : {}),
  };
}

function metaElement(documentObject, attribute, key) {
  let element = documentObject.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = documentObject.createElement('meta');
    element.setAttribute(attribute, key);
    documentObject.head.append(element);
  }
  return element;
}

function setMeta(documentObject, attribute, key, value) {
  metaElement(documentObject, attribute, key).setAttribute('content', value);
}

export function syncDocumentMetadata(documentObject, metadata) {
  documentObject.title = metadata.title;
  setMeta(documentObject, 'name', 'description', metadata.description);
  setMeta(documentObject, 'name', 'robots', metadata.robots);
  setMeta(documentObject, 'property', 'og:site_name', SITE_NAME);
  setMeta(documentObject, 'property', 'og:type', metadata.type);
  setMeta(documentObject, 'property', 'og:title', metadata.title);
  setMeta(documentObject, 'property', 'og:description', metadata.description);
  setMeta(documentObject, 'property', 'og:url', metadata.url);
  setMeta(documentObject, 'property', 'og:image', metadata.image);
  setMeta(documentObject, 'property', 'og:image:type', 'image/jpeg');
  setMeta(documentObject, 'name', 'twitter:card', 'summary_large_image');
  setMeta(documentObject, 'name', 'twitter:title', metadata.title);
  setMeta(documentObject, 'name', 'twitter:description', metadata.description);
  setMeta(documentObject, 'name', 'twitter:image', metadata.image);

  let canonical = documentObject.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = documentObject.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    documentObject.head.append(canonical);
  }
  canonical.setAttribute('href', metadata.url);

  for (const [property, value] of [['og:image:width', metadata.imageWidth], ['og:image:height', metadata.imageHeight]]) {
    const existing = documentObject.querySelector(`meta[property="${property}"]`);
    if (value) setMeta(documentObject, 'property', property, value);
    else existing?.remove();
  }
}
