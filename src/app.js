import { filterCollection, filtersAreActive, tagOptions, tagSuggestions } from './scripts/collection-filter.mjs';
import { articleHeaderMarkup } from './scripts/article-view.mjs';
import { installClientLogBridge } from './scripts/client-log-bridge.mjs';
import { selectContentIndex } from './scripts/content-index-client.mjs';
import { entryRoutePath, normalizeRoutePath, resolveContentRoute } from './scripts/content-routes.mjs';
import { devPublicationControlMarkup } from './scripts/dev-publish-view.mjs';
import { hierarchyPath, navigationEntryClasses, parentFocus, rootIdForEntry, sidebarContext } from './scripts/sidebar-navigation.mjs';
import { clickAction, isWidescreen, navigationChildren, shouldDismissSidebar, shouldInterceptInternalLink } from './scripts/navigation-policy.mjs';
import { notFoundMarkup } from './scripts/not-found-view.mjs';
import { previewPublicationBadge, previewPublicationDate } from './scripts/preview-status.mjs';
import { searchPagefindEntryIds } from './scripts/pagefind-client.mjs';
import { rankFullSearchResults } from './scripts/search-ranking.mjs';
import { highlightedSearchText } from './scripts/search-view.mjs';

if (import.meta.env.DEV) installClientLogBridge({
  consoleObject: console,
  windowObject: window,
  send: (record) => fetch('/__dev/client-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
    keepalive: true,
  }),
});

/*
  Prototype content deliberately contains navigation metadata and the requester's
  example titles only. Article copy is intentionally left as an author-owned prompt.

const fallbackCategories = [
  { id: 'blog', name: 'Blog', short: 'Blog', count: 4, intro: 'Random musings about cars, tracks and the work around them.', children: ['ca-tire-efficiency-regulation', 'dailying-200tw-tires', 'why-go-to-the-track', 'before-buying-an-86-brz'] },
  { id: 'engine-rebuild', name: 'Engine Rebuild', short: 'Engine Rebuild', count: 3, intro: 'A start-to-finish record of the engine rebuild. Each entry can hold the episode, the supporting evidence, parts, photos and data.', children: ['gr86-engine-blew', 'why-engine-blew', 'long-block-install'] },
  { id: 'track-guides', name: 'Track Guides', short: 'Track Guides', count: 2, intro: 'Practical track notes: video, line references, data downloads and the conditions that give those references context.', children: ['thunderhill-east', 'thunderhill-west'] },
  { id: '86-challenge', name: '86 Challenge', short: '86 Challenge', count: 4, intro: 'Weekend records should be durable: onboard, official result, context, setup and data in one place.', children: ['2026-thunderhill', '2026-laguna', '2025-season'] },
  { id: 'mods', name: 'Mods', short: 'Mods', count: 2, intro: 'Install documentation and long-term reviews. Include part numbers, torque specs, compatibility notes and real track consequences.', children: ['oil-cooler', 'bilstein-b6'] },
  { id: 'repairs', name: 'Repairs', short: 'Repairs', count: 3, intro: 'Symptoms, diagnosis, repair, and the follow-up that says whether it really worked.', children: ['random-misfire', 'transmission-leak', 'paint-correction'] },
  { id: 'driving-technique', name: 'Driving Technique', short: 'Driving Technique', count: 3, intro: 'Driver-development concepts anchored in onboard examples, data overlays and clear caveats.', children: ['slide-canceling', 'brake-aggression', 'neutral-steering'] },
  { id: 'setup-tips', name: 'Setup Tips', short: 'Setup Tips', count: 2, intro: 'Small setup changes get treated as testable hypotheses, with context instead of universal claims.', children: ['sway-bar-bushings', 'tire-pressures'] },
  { id: 'test-drives', name: 'Test Drives', short: 'Test Drives', count: 2, intro: 'Notes from other cars, with the driver, setup and intended use made clear.', children: ['nc-miata', 'street-gr86'] },
  { id: 'tools', name: 'Tools', short: 'Tools', count: 3, intro: 'Useful hardware and analysis tools, documented with their limitations and the problem they solve.', children: ['jack-roller', 'gopro-mount', 'obd-analyzer'] },
];

const fallbackArticles = [
  { id: 'ca-tire-efficiency-regulation', category: 'blog', title: 'CA Tire Efficiency Regulation', subtitle: 'Author-owned article slot.', date: '2026-07-31', tags: ['california', 'tires'], media: 'BLOG', featured: '', type: 'Blog' },
  { id: 'dailying-200tw-tires', category: 'blog', title: 'Dailying 200tw tires', subtitle: 'Author-owned article slot.', date: '2026-07-30', tags: ['daily', 'tires', '200tw'], media: 'BLOG', featured: '', type: 'Blog' },
  { id: 'why-go-to-the-track', category: 'blog', title: 'Why should I go to the track?', subtitle: 'Author-owned article slot.', date: '2026-07-27', tags: ['track', 'beginner'], media: 'BLOG', featured: '', type: 'Blog' },
  { id: 'before-buying-an-86-brz', category: 'blog', title: 'What do I need to know before buying an 86/BRZ?', subtitle: 'Author-owned article slot.', date: '2026-07-26', tags: ['buying', '86', 'brz'], media: 'BLOG', featured: '', type: 'Blog' },
  { id: 'gr86-engine-blew', category: 'engine-rebuild', title: 'Ep 1: My GR86 Engine Blew. Now what?', subtitle: 'Add the opening incident, timeline and your plan for the rebuild here.', date: '2026-07-24', tags: ['engine', 'rebuild', 'gr86'], media: 'EP 01', featured: 'new', type: 'Series' },
  { id: 'why-engine-blew', category: 'engine-rebuild', title: 'Ep 2: Why did my engine blow?', subtitle: 'Add your findings, measurements and supporting evidence here.', date: '2026-07-23', tags: ['engine', 'diagnosis', 'rebuild'], media: 'EP 02', featured: 'hot', type: 'Series' },
  { id: 'long-block-install', category: 'engine-rebuild', title: 'Ep 3: The Long Block Install', subtitle: 'Add your parts list, process, torque values and lessons learned here.', date: '2026-07-22', tags: ['engine', 'install', 'rebuild'], media: 'EP 03', featured: 'new', type: 'Series' },
  { id: 'thunderhill-east', category: 'track-guides', title: 'Thunderhill East', subtitle: 'Onboard, annotated line references and downloadable data belong here.', date: '2026-07-17', tags: ['track guide', 'thunderhill', 'data'], media: 'TRACK', featured: 'hot', type: 'Track Guide' },
  { id: 'thunderhill-west', category: 'track-guides', title: 'Thunderhill West', subtitle: 'Add a guide that states configuration, conditions and data context.', date: '2026-05-14', tags: ['track guide', 'thunderhill', 'data'], media: 'TRACK', featured: '', type: 'Track Guide' },
  { id: '2026-thunderhill', category: '86-challenge', title: '2026 Rd 1: Thunderhill East Cyclone', subtitle: 'Oversteer City', date: '2026-03-02', tags: ['86 challenge', '2026', 'thunderhill'], media: 'RACE', featured: 'hot', type: 'Event' },
  { id: '2026-laguna', category: '86-challenge', title: '2026 Rd 2: Laguna Seca', subtitle: 'Smelling blood', date: '2026-04-06', tags: ['86 challenge', '2026', 'laguna seca'], media: 'RACE', featured: 'new', type: 'Event' },
  { id: '2025-season', category: '86-challenge', title: '2025 86 Challenge Season', subtitle: 'Add a season index with every round, result and reference link.', date: '2025-11-15', tags: ['86 challenge', '2025', 'season'], media: 'RACE', featured: '', type: 'Index' },
  { id: 'oil-cooler', category: 'mods', title: 'Color Fittings Oil Cooler', subtitle: 'Document the install, part numbers, routing and long-term review here.', date: '2026-06-12', tags: ['mods', 'cooling', 'engine'], media: 'MOD', featured: 'new', type: 'Install' },
  { id: 'bilstein-b6', category: 'mods', title: 'Bilstein B6 Dampers', subtitle: 'Add install notes plus honest driving and track impressions.', date: '2026-02-20', tags: ['mods', 'suspension', 'review'], media: 'MOD', featured: '', type: 'Review' },
  { id: 'random-misfire', category: 'repairs', title: 'Random Misfire', subtitle: 'Record the symptoms, diagnostic route, fix and verification.', date: '2026-06-05', tags: ['repair', 'engine', 'diagnosis'], media: 'FIX', featured: 'hot', type: 'Repair' },
  { id: 'transmission-leak', category: 'repairs', title: 'Transmission Leak', subtitle: 'Add pictures, source of leak, remedy and required supplies.', date: '2026-01-28', tags: ['repair', 'drivetrain'], media: 'FIX', featured: '', type: 'Repair' },
  { id: 'paint-correction', category: 'repairs', title: 'Paint Correction', subtitle: 'Add product notes, process photos and condition-specific results.', date: '2025-10-07', tags: ['repair', 'paint', 'cosmetic'], media: 'FIX', featured: '', type: 'Repair' },
  { id: 'slide-canceling', category: 'driving-technique', title: 'Slide Canceling', subtitle: 'Add an onboard example and data-backed explanation of the technique.', date: '2026-05-03', tags: ['driving', 'technique', 'data'], media: 'DRIVE', featured: 'hot', type: 'Technique' },
  { id: 'brake-aggression', category: 'driving-technique', title: 'Brake Aggression', subtitle: 'Add a practical explanation with a specific reference lap.', date: '2026-04-17', tags: ['driving', 'braking', 'technique'], media: 'DRIVE', featured: '', type: 'Technique' },
  { id: 'neutral-steering', category: 'driving-technique', title: 'Neutral Steering', subtitle: 'Add your own definition, examples and limitations here.', date: '2026-03-16', tags: ['driving', 'balance', 'technique'], media: 'DRIVE', featured: '', type: 'Technique' },
  { id: 'sway-bar-bushings', category: 'setup-tips', title: 'Are your sway bar bushings too sticky?', subtitle: 'I suffered through terrible understeer for a year. If only I knew I was $12 away from a solution.', date: '2026-07-29', tags: ['setup', 'suspension', 'understeer'], media: 'SETUP', featured: 'new', type: 'Setup' },
  { id: 'tire-pressures', category: 'setup-tips', title: 'How to set tire pressures', subtitle: 'Add the procedure, target conditions and limits of your approach.', date: '2026-07-12', tags: ['setup', 'tires', 'data'], media: 'SETUP', featured: 'hot', type: 'Setup' },
  { id: 'nc-miata', category: 'test-drives', title: 'Joey’s NC Miata', subtitle: 'Add the car’s context, setup and your test-drive notes.', date: '2026-06-29', tags: ['test drive', 'miata'], media: 'TEST', featured: '', type: 'Test Drive' },
  { id: 'street-gr86', category: 'test-drives', title: 'Warren’s Street Class GR86', subtitle: 'Add the setup and what it taught you about the platform.', date: '2026-05-28', tags: ['test drive', 'gr86', 'street class'], media: 'TEST', featured: '', type: 'Test Drive' },
  { id: 'jack-roller', category: 'tools', title: 'Harbor Freight Jack Roller', subtitle: 'Document the build, hardware and the problem it solves.', date: '2026-07-08', tags: ['tools', 'garage', 'diy'], media: 'TOOL', featured: '', type: 'Tool' },
  { id: 'gopro-mount', category: 'tools', title: 'GoPro Tripod Mount', subtitle: 'Add the mounting approach, print/build details and footage examples.', date: '2026-04-28', tags: ['tools', 'video', 'diy'], media: 'TOOL', featured: '', type: 'Tool' },
  { id: 'obd-analyzer', category: 'tools', title: 'OBD2 Data Analyzer', subtitle: 'Add a clear workflow from raw logging to a useful conclusion.', date: '2026-03-09', tags: ['tools', 'data', 'obd2'], media: 'TOOL', featured: 'hot', type: 'Tool' },
];

*/
// A static site always renders from the generated content index. An empty index is
// the correct public result when every entry is a draft.
const initialContent = selectContentIndex(null);
let categories = initialContent.categories;
let articles = initialContent.articles;

const app = document.querySelector('#app-shell');
const main = document.querySelector('#main-content');
const navTree = document.querySelector('#nav-tree');
const breadcrumb = document.querySelector('#breadcrumb');
const dialog = document.querySelector('#search-dialog');
const dialogInput = document.querySelector('#dialog-search-input');
const dialogResults = document.querySelector('#dialog-results');
const globalInput = document.querySelector('#global-search-input');
const globalSuggestions = document.querySelector('#global-search-suggestions');

const state = { route: 'home', category: null, article: null, treeRoot: null, treeFocus: null };
const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function categoryById(id) { return categories.find((item) => item.id === id); }
function articleById(id) { return articles.find((item) => item.id === id); }
function sameTimestamp(left, right) { return left && right && Date.parse(left) === Date.parse(right); }
function formatDate(date) { return dateFormatter.format(new Date(date)); }
function esc(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }

function syncSidebarLayout() {
  const wide = isWidescreen(window.innerWidth, window.innerHeight);
  app.classList.toggle('sidebar-collapsible', !wide);
  if (wide) app.classList.remove('sidebar-open');
}

syncSidebarLayout();

function thumb(article) {
  if (article.thumbnail) return `<div class="thumb thumb--image"><img src="${esc(article.thumbnail)}" alt="" loading="lazy" decoding="async" /></div>`;
  return `<div class="thumb" aria-hidden="true"><span class="thumb__label">${esc(article.media)}</span><span class="thumb__line thumb__line--one"></span><span class="thumb__line thumb__line--two"></span><span class="thumb__corner"></span></div>`;
}

function tags(tags) { return `<span class="tags">${tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join('')}</span>`; }

function articleRow(article, expanded = false) {
  const dateLabel = previewPublicationDate(article, formatDate);
  const publicationDate = dateLabel ? `<span>${dateLabel}</span>` : '';
  const updated = article.updatedAt && !sameTimestamp(article.updatedAt, article.date) ? `<span>Updated ${formatDate(article.updatedAt)}</span>` : '';
  const publication = previewPublicationBadge(article);
  return `
    <article class="article-row article-row--clickable" data-article="${article.id}" tabindex="0" aria-label="Open ${esc(article.title)}">
      ${thumb(article)}
      <div class="article-row__body">
        <p class="article-row__meta"><span>${esc(article.type)}</span>${publication}${publicationDate}${updated}</p>
        <a class="article-row__title" href="${esc(entryHref(article))}" data-article="${article.id}">${esc(article.title)}</a>
        <p class="article-row__summary">${esc(article.subtitle)}</p>
        ${tags(expanded ? article.tags : article.tags.slice(0, 3))}
      </div>
    </article>`;
}

function directChildren(id) {
  const node = categoryById(id) || articleById(id);
  const declared = (node?.children ?? []).map(articleById).filter(Boolean);
  const nested = articles.filter((article) => article.parent === id);
  const rootEntries = categoryById(id) ? articles.filter((article) => article.category === id && !article.parent) : [];
  return [...new Map([...declared, ...nested, ...rootEntries].map((item) => [item.id, item])).values()];
}

function descendantEntries(id) {
  const found = [];
  const visit = (nodeId) => directChildren(nodeId).forEach((child) => {
    if (found.some((item) => item.id === child.id)) return;
    found.push(child);
    visit(child.id);
  });
  visit(id);
  return found;
}

function syncTreeToCurrentEntry() {
  const currentId = state.article || state.category;
  const rootId = currentId && (categoryById(currentId) ? currentId : rootIdForEntry(articles, currentId));
  if (!rootId) return;
  state.treeRoot = rootId;
  state.treeFocus = currentId && !categoryById(currentId) ? parentFocus(articles, rootId, currentId) : null;
}

function entryHref(entry) {
  return entryRoutePath(categories, articles, entry);
}

function renderTree() {
  navTree.innerHTML = categories.map((category) => {
    const open = state.treeRoot === category.id;
    const context = open ? sidebarContext({ categories, entries: articles, rootId: category.id, focusId: state.treeFocus }) : null;
    const contextEntry = context?.focus;
    const contextHref = contextEntry ? entryHref(contextEntry) : entryHref(category);
    const label = category.short;
    const children = context?.children ?? [];
    const limited = navigationChildren(children);
    const contextRows = (context?.path ?? []).map((entry, index) => {
      const active = state.article === entry.id || state.category === entry.id;
      const count = directChildren(entry.id).length;
      return `<a class="${navigationEntryClasses(entry, { active, baseClass: 'tree__context', previewMode: import.meta.env.DEV })}" data-tree-context="${entry.id}" data-tree-root="${category.id}" href="${entryHref(entry)}" style="--tree-depth:${index + 1}" ${active ? 'aria-current="page"' : ''}><span class="tree__folder" aria-hidden="true">□</span><span class="tree__label">${esc(entry.title)}</span><span class="tree__count">${count}</span></a>`;
    }).join('');
    const entries = limited.visible.map((entry) => {
      const active = state.article === entry.id || state.category === entry.id;
      return `<a class="${navigationEntryClasses(entry, { active, previewMode: import.meta.env.DEV })}" data-tree-entry="${entry.id}" href="${entryHref(entry)}" ${active ? 'aria-current="page"' : ''}>${esc(entry.title)}</a>`;
    }).join('');
    const back = contextEntry ? `<button class="tree__back" type="button" data-tree-back="${category.id}">^ Collapse</button>` : '';
    const seeAll = limited.hasMore ? `<a class="tree__see-all" href="${contextHref}">See all ${children.length} entries →</a>` : '';
    return `
      <section class="tree__section">
        <a class="${navigationEntryClasses(category, { active: state.category === category.id, baseClass: 'tree__category', previewMode: import.meta.env.DEV })}" data-tree-context="${category.id}" data-tree-root="${category.id}" href="${esc(entryHref(category))}" ${state.category === category.id ? 'aria-current="page"' : ''}>
          <span class="tree__folder" aria-hidden="true">□</span><span class="tree__label">${esc(label)}</span><span class="tree__count">${category.count}</span>
        </a>
        <div class="tree__items" ${open ? '' : 'hidden'}>${contextRows}${back}${entries}${seeAll}</div>
      </section>`;
  }).join('');
}

function breadcrumbParts(id) {
  const path = hierarchyPath(categories, articles, id);
  return [{ label: 'Home', href: '/' }, ...path.map((entry, index) => {
    const final = index === path.length - 1;
    return { label: entry.name ?? entry.title, href: final ? undefined : entryHref(entry) };
  })];
}

function setBreadcrumb(parts) {
  breadcrumb.innerHTML = parts.map((part, index) => {
    const item = part.href ? `<a href="${part.href}">${esc(part.label)}</a>` : `<span>${esc(part.label)}</span>`;
    return `${index ? '<span class="crumb-separator" aria-hidden="true">/</span>' : ''}${item}`;
  }).join('');
}

function renderHome() {
  const newItems = [...articles].sort((a, b) => (b.date ?? b.updatedAt ?? '').localeCompare(a.date ?? a.updatedAt ?? '')).slice(0, 5);
  const hotItems = articles.filter((article) => article.featured === 'hot').slice(0, 5);
  state.category = null;
  state.article = null;
  state.treeRoot = null;
  state.treeFocus = null;
  setBreadcrumb([]);
  main.innerHTML = `
    <section class="hero">
      <div>
        <p class="eyebrow">86 / BRZ PERFORMANCE REFERENCE</p>
        <h1>Every lap, repair<br />and bad idea—<em>kept useful.</em></h1>
        <div class="hero__rule"></div>
      </div>
      <div>
        <p class="hero__copy">A searchable, long-form record for the work behind 86 Challenge. Video lives on YouTube; the evidence, context and notes live here.</p>
        <div class="hero__note"><strong>${articles.length}</strong><span>${import.meta.env.DEV ? 'entries in local preview' : 'published entries'}</span></div>
      </div>
    </section>

    <section class="feed-grid" aria-label="Article feeds">
      <section class="feed">
        <div class="feed-head"><h2>New</h2><span>Latest published notes</span></div>
        <div class="article-list">${newItems.map((article) => articleRow(article)).join('')}</div>
      </section>
      <section class="feed">
        <div class="feed-head"><h2>Hot</h2><span>Start here</span></div>
        <div class="article-list">${hotItems.map((article) => articleRow(article)).join('')}</div>
      </section>
    </section>

    <section class="quick-browse" aria-labelledby="browse-title">
      <div class="section-head"><h2 id="browse-title">Browse the archive</h2><span class="quiet-link">Select a discipline</span></div>
      <div class="category-cards">
        ${categories.map((category, index) => `<button class="category-card" type="button" data-category="${category.id}"><span class="category-card__number">0${index + 1}</span><span class="category-card__name">${esc(category.name)}</span><span class="category-card__count">${category.count} starter entries</span></button>`).join('')}
      </div>
    </section>`;
  renderTree();
}

function tagTableMarkup(kind, label) {
  return `<section class="tag-filter" data-tag-filter="${kind}" aria-label="${label}">
    <span class="filter-label">${label}</span>
    <div class="tag-filter__table" data-tag-rows="${kind}"></div>
    <div class="tag-options" data-tag-options="${kind}" hidden></div>
  </section>`;
}

function filterPanelMarkup() {
  return `<div class="filter-panel" data-filter-panel>
    <div class="filter-primary">
      <label class="filter-search"><span>Search</span><input data-filter="text" type="search" placeholder="Search title, subtitle or tags…" /></label>
      <div class="filter-row">
        <label><span>Published before</span><input data-filter="before" type="date" /></label>
        <label><span>Published after</span><input data-filter="after" type="date" /></label>
        <label><span>Order</span><select data-filter="order"><option value="new">Newest first</option><option value="old">Oldest first</option><option value="title">Title A–Z</option></select></label>
        <label><span>Articles only?</span><select data-filter="articles-only"><option value="">Any</option><option value="yes">Yes</option><option value="no">No</option></select></label>
      </div>
    </div>
    <div class="tag-tables">${tagTableMarkup('include', 'Include tags')}${tagTableMarkup('exclude', 'Exclude tags')}</div>
  </div>`;
}

function collectionMarkup(id, articleMode) {
  const placement = articleMode ? 'collection-controls--article' : 'collection-controls--index';
  return `<section class="collection-controls ${placement}" id="collection-${id}" aria-label="Search entries below this page">
    <button class="mobile-filter-open" type="button" data-mobile-filter-open>Search / Filter / Sort</button>
    <div class="filter-panel-host" data-filter-panel-host>${filterPanelMarkup()}</div>
    <dialog class="collection-filter-dialog" data-filter-dialog aria-label="Search, filter and sort entries">
      <div class="collection-filter-dialog__surface" data-filter-dialog-surface><div data-filter-dialog-mount></div><div class="collection-filter-dialog__actions"><button class="filter-cancel" type="button" data-filter-cancel>Cancel</button><button class="filter-apply" type="button" data-filter-apply>Apply</button></div></div>
    </dialog>
    <div class="collection-status"><p class="collection-hint" data-collection-hint ${articleMode ? '' : 'hidden'}>Search for something under this article.</p><button class="clear-filters" type="button" data-clear-filters hidden>Clear filters</button></div>
    <p class="filter-count" data-filter-count ${articleMode ? 'hidden' : ''}></p>
  </section>`;
}

function mountCollection(id, articleMode) {
  const root = document.querySelector(`#collection-${id}`);
  const results = document.querySelector('#category-results');
  const direct = directChildren(id);
  const all = descendantEntries(id);
  const tagsAvailable = tagOptions(all);
  const selected = { include: [], exclude: [] };
  const input = (name) => root.querySelector(`[data-filter="${name}"]`);
  const paintTagRows = (kind) => {
    const rows = selected[kind].map((tag) => `<div class="tag-slot tag-slot--selected"><span>${esc(tag.toLowerCase())}</span><button type="button" data-remove-tag="${kind}" data-tag="${esc(tag)}" aria-label="Remove ${esc(tag)}">×</button></div>`);
    while (rows.length < 5) rows.push(`<div class="tag-slot tag-slot--empty"><input data-tag-input="${kind}" type="search" autocomplete="off" aria-label="Add ${kind} tag" placeholder="${rows.length === selected[kind].length ? 'Add tag' : ''}" /></div>`);
    root.querySelector(`[data-tag-rows="${kind}"]`).innerHTML = rows.join('');
  };
  const hideOptions = (kind) => { root.querySelector(`[data-tag-options="${kind}"]`).hidden = true; };
  const paintOptions = (kind, field = root.querySelector(`[data-tag-input="${kind}"]`)) => {
    const options = root.querySelector(`[data-tag-options="${kind}"]`);
    const term = field?.value.trim().toLowerCase() ?? '';
    const matches = tagSuggestions({ options: tagsAvailable, includeTags: selected.include, excludeTags: selected.exclude, selectedKind: kind, query: term });
    options.hidden = matches.length === 0;
    options.innerHTML = matches.map((tag) => `<button type="button" data-add-tag="${kind}" data-tag="${esc(tag)}">${esc(tag)}</button>`).join('');
  };
  const readFilters = () => ({ text: input('text').value.trim(), articlesOnly: input('articles-only').value, includeTags: [...selected.include], excludeTags: [...selected.exclude], after: input('after').value, before: input('before').value, order: input('order').value });
  const update = () => {
    const filters = readFilters();
    const active = filtersAreActive(filters);
    const filtered = filterCollection({ direct, descendants: all, filters });
    root.querySelector('[data-collection-hint]').hidden = !articleMode || active;
    root.querySelector('[data-filter-count]').hidden = articleMode && !active;
    root.querySelector('[data-clear-filters]').hidden = !active;
    root.querySelector('[data-filter-count]').textContent = `${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'} shown`;
    results.innerHTML = articleMode && !active ? '' : (filtered.length ? filtered.map((entry) => articleRow(entry, true)).join('') : '<div class="empty-state"><strong>No matching entries.</strong>Try removing a filter or searching a different term.</div>');
  };
  root.addEventListener('input', (event) => {
    const kind = event.target.dataset.tagInput;
    if (kind) paintOptions(kind, event.target);
    else update();
  });
  root.addEventListener('change', update);
  root.addEventListener('focusin', (event) => {
    const kind = event.target.dataset.tagInput;
    if (kind) paintOptions(kind, event.target);
  });
  root.addEventListener('focusout', (event) => {
    const filter = event.target.closest('[data-tag-filter]');
    if (filter) setTimeout(() => { if (!filter.contains(document.activeElement)) hideOptions(filter.dataset.tagFilter); }, 0);
  });
  root.addEventListener('click', (event) => {
    const add = event.target.closest('[data-add-tag]');
    const remove = event.target.closest('[data-remove-tag]');
    if (add && selected[add.dataset.addTag].length < 5 && !selected.include.includes(add.dataset.tag) && !selected.exclude.includes(add.dataset.tag)) {
      const kind = add.dataset.addTag;
      selected[kind].push(add.dataset.tag.toLowerCase());
      paintTagRows(kind); hideOptions(kind); update();
      root.querySelector(`[data-tag-input="${kind}"]`)?.focus();
    }
    if (remove) {
      selected[remove.dataset.removeTag] = selected[remove.dataset.removeTag].filter((tag) => tag !== remove.dataset.tag);
      paintTagRows(remove.dataset.removeTag); hideOptions(remove.dataset.removeTag); update();
    }
    if (event.target.closest('[data-clear-filters]')) {
      root.querySelectorAll('[data-filter]').forEach((control) => { control.value = control.dataset.filter === 'order' ? 'new' : ''; });
      selected.include = []; selected.exclude = [];
      paintTagRows('include'); paintTagRows('exclude'); hideOptions('include'); hideOptions('exclude'); update();
    }
  });
  const panel = root.querySelector('[data-filter-panel]');
  const panelHost = root.querySelector('[data-filter-panel-host]');
  const dialog = root.querySelector('[data-filter-dialog]');
  const dialogMount = root.querySelector('[data-filter-dialog-mount]');
  let mobileBackup;
  const restore = (snapshot) => {
    for (const [name, value] of Object.entries(snapshot.controls)) input(name).value = value;
    selected.include = [...snapshot.include]; selected.exclude = [...snapshot.exclude];
    paintTagRows('include'); paintTagRows('exclude'); update();
  };
  root.querySelector('[data-mobile-filter-open]').addEventListener('click', () => {
    mobileBackup = { controls: { text: input('text').value, before: input('before').value, after: input('after').value, order: input('order').value, 'articles-only': input('articles-only').value }, include: [...selected.include], exclude: [...selected.exclude] };
    dialogMount.append(panel);
    dialog.showModal();
  });
  root.querySelector('[data-filter-apply]').addEventListener('click', () => dialog.close('apply'));
  root.querySelector('[data-filter-cancel]').addEventListener('click', () => dialog.close('cancel'));
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); dialog.close('cancel'); });
  dialog.addEventListener('click', (event) => {
    const bounds = root.querySelector('[data-filter-dialog-surface]').getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close('apply');
  });
  dialog.addEventListener('close', () => {
    panelHost.append(panel);
    if (dialog.returnValue === 'cancel' && mobileBackup) restore(mobileBackup);
    mobileBackup = null;
  });
  paintTagRows('include'); paintTagRows('exclude');
  update();
}

function renderListPage(id) {
  const category = categoryById(id) || articleById(id);
  if (!category) return renderHome();
  state.category = id;
  state.article = null;
  syncTreeToCurrentEntry();
  const immediateChildren = directChildren(id);
  const categoryName = category.name || category.title;
  setBreadcrumb(breadcrumbParts(id));
  const devPublishControl = devPublicationControlMarkup(category, import.meta.env.DEV);
  main.innerHTML = `<header class="page-header"><h1>${esc(categoryName)}</h1><p>${esc(category.intro || category.subtitle || 'Preview the entries in this part of the archive.')}</p></header>${devPublishControl}<section aria-label="${esc(categoryName)} entries">${immediateChildren.length ? collectionMarkup(id, false) : ''}<div class="category-results" id="category-results"></div></section>`;
  if (immediateChildren.length) mountCollection(id, false);
  else document.querySelector('#category-results').innerHTML = '<div class="empty-state"><strong>No child entries yet.</strong>This page will stay clean until it has something to preview.</div>';
  renderTree();
}

function renderArticle(id) {
  const article = articleById(id) || categoryById(id);
  if (!article) return renderHome();
  // A node without article.md is an index page: show its child previews by default.
  if (article.hasArticle === false) return renderListPage(article.id);
  const category = categoryById(article.category);
  if (!category) return renderListPage(article.id);
  state.category = category.id;
  state.article = article.id;
  syncTreeToCurrentEntry();
  const hasChildren = directChildren(article.id).length > 0;
  const toc = article.headings?.length ? `<aside class="article-aside"><h2>On this page</h2><ul>${article.headings.map((heading) => `<li class="article-aside__level-${heading.depth}"><a href="#${esc(heading.id)}">${esc(heading.text)}</a></li>`).join('')}</ul></aside>` : '';
  setBreadcrumb(breadcrumbParts(article.id));
  const details = `${article.date ? `<span>Published <b>${formatDate(article.date)}</b></span>` : ''}${article.updatedAt && !sameTimestamp(article.updatedAt, article.date) ? `<span>Updated <b>${formatDate(article.updatedAt)}</b></span>` : ''}${article.tags.length ? `<span>Tags ${tags(article.tags)}</span>` : ''}`;
  const devPublishControl = devPublicationControlMarkup(article, import.meta.env.DEV);
  main.innerHTML = `
    ${articleHeaderMarkup(article, details)}
    ${devPublishControl}
    <div class="article-layout">
      <article class="article-body article-markdown" data-pagefind-body>${article.html || ''}</article>
      ${toc}
    </div>
    ${hasChildren ? `<section class="article-children" aria-label="Entries below ${esc(article.title)}">${collectionMarkup(article.id, true)}<div class="category-results" id="category-results"></div></section>` : ''}`;
  if (hasChildren) mountCollection(article.id, true);
  renderTree();
}

function renderAbout() {
  state.category = null;
  state.article = null;
  state.treeRoot = null;
  state.treeFocus = null;
  setBreadcrumb([{ label: 'Home', href: '/' }, { label: 'About' }]);
  main.innerHTML = `
    <section class="about">
      <p class="eyebrow">ABOUT THIS PROJECT</p>
      <h1>Notes have more value when they still make sense next season.</h1>
      <p>This is the home for an 86/BRZ driver’s own record of track work, repairs, installs and development. It favors traceability over noise: every article is an authored primary record, with video and data as supporting evidence.</p>
      <div class="principles"><div class="principle"><strong>Author first</strong><span>No AI-generated technical articles. The site helps structure and find your work; it does not invent it.</span></div><div class="principle"><strong>Context attached</strong><span>Track state, date, setup and sources stay with the claim—not in a fleeting caption.</span></div><div class="principle"><strong>Built to last</strong><span>Local Markdown, static HTML and portable data files keep the archive under your control.</span></div></div>
    </section>`;
  renderTree();
}

let notFoundTimer;
function renderNotFound() {
  state.category = null;
  state.article = null;
  state.treeRoot = null;
  state.treeFocus = null;
  setBreadcrumb([{ label: 'Home', href: '/' }, { label: '404' }]);
  let seconds = 5;
  main.innerHTML = notFoundMarkup(window.location.pathname, seconds);
  renderTree();
  notFoundTimer = window.setInterval(() => {
    seconds -= 1;
    if (seconds <= 0) {
      window.clearInterval(notFoundTimer);
      navigateTo('/', { replace: true });
      return;
    }
    const countdown = document.querySelector('[data-not-found-countdown]');
    if (countdown) countdown.textContent = String(seconds);
  }, 1000);
}

function route(resetScroll = true) {
  window.clearInterval(notFoundTimer);
  if (dialog.open) dialog.close();
  const target = resolveContentRoute(categories, articles, window.location.pathname);
  if (target.type === 'list') renderListPage(target.entry.id);
  else if (target.type === 'article') renderArticle(target.entry.id);
  else if (target.type === 'about') renderAbout();
  else if (target.type === 'home') renderHome();
  else renderNotFound();
  if (resetScroll) window.scrollTo({ top: 0, behavior: 'instant' });
}

function navigateTo(path, { replace = false } = {}) {
  const target = normalizeRoutePath(path);
  window.history[replace ? 'replaceState' : 'pushState']({}, '', target);
  app.classList.remove('sidebar-open');
  route();
}

function migrateLegacyHashRoute() {
  const match = window.location.hash.match(/^#(?:category|article)\/(.+)$/);
  if (match) {
    const entry = categoryById(match[1]) || articleById(match[1]);
    if (entry) navigateTo(entryHref(entry), { replace: true });
  } else if (window.location.hash === '#home') {
    navigateTo('/', { replace: true });
  } else if (window.location.hash === '#about') {
    navigateTo('/about', { replace: true });
  }
}

async function fullSearchResults(query) {
  const pagefindIds = import.meta.env.DEV ? null : await searchPagefindEntryIds(query);
  return rankFullSearchResults(articles, (article) => categoryById(article.category)?.name ?? '', query, pagefindIds);
}

let searchRequest = 0;
async function search(query) {
  const request = ++searchRequest;
  const term = query.trim();
  if (!term) {
    dialogResults.innerHTML = '<div class="empty-state"><strong>Search the archive.</strong>Results will include titles, subtitles, categories, tags and article text.</div>';
    return;
  }
  dialogResults.innerHTML = '<div class="empty-state"><strong>Searching…</strong></div>';
  const matches = await fullSearchResults(term);
  if (request !== searchRequest) return;
  dialogResults.innerHTML = matches.length ? matches.map(({ entry, bodyContext: context }) => {
    const categoryName = categoryById(entry.category)?.short ?? 'Archive';
    const contextMarkup = context ? `<p class="result-context">${highlightedSearchText(context.text, term)}</p>` : '';
    return `<div class="dialog-result"><button type="button" data-search-result="${entry.id}">${thumb(entry)}<span class="result-meta">${highlightedSearchText(categoryName, term)} · ${esc(entry.date ? formatDate(entry.date) : 'Unpublished')}</span><strong>${highlightedSearchText(entry.title, term)}</strong><p class="result-subtitle">${highlightedSearchText(entry.subtitle, term)}</p>${contextMarkup}</button></div>`;
  }).join('') : '<div class="empty-state"><strong>No result yet.</strong>Try a track, part, technique or repair.</div>';
}

let suggestionTimer;
let suggestionRequest = 0;
async function updateGlobalSuggestions() {
  const request = ++suggestionRequest;
  const term = globalInput.value.trim();
  const matches = term ? (await fullSearchResults(term)).slice(0, 5) : [];
  if (request !== suggestionRequest) return;
  globalSuggestions.hidden = matches.length === 0;
  globalInput.setAttribute('aria-expanded', String(matches.length > 0));
  globalSuggestions.innerHTML = matches.map(({ entry }) => `<button class="search-suggestion" type="button" data-suggestion="${entry.id}" role="option">${highlightedSearchText(entry.title, term)}</button>`).join('');
}

function openSearch(initial = '') {
  if (!dialog.open) dialog.showModal();
  dialogInput.value = initial;
  search(initial);
  requestAnimationFrame(() => dialogInput.focus());
}

document.addEventListener('click', async (event) => {
  const categoryButton = event.target.closest('[data-category]');
  const treeContext = event.target.closest('[data-tree-context]');
  const treeEntry = event.target.closest('[data-tree-entry]');
  const treeBack = event.target.closest('[data-tree-back]');
  const devPublish = event.target.closest('[data-dev-publish]');
  const articleTarget = event.target.closest('[data-article]');
  const internalLink = event.target.closest('a[href^="/"]');
  const searchResult = event.target.closest('[data-search-result]');
  const suggestion = event.target.closest('[data-suggestion]');
  const scrollTarget = event.target.closest('[data-scroll]');
  const clickedInsideSidebar = Boolean(event.target.closest('#sidebar'));
  const clickedSidebarToggle = Boolean(event.target.closest('#sidebar-open'));
  if (shouldDismissSidebar({ wide: isWidescreen(window.innerWidth, window.innerHeight), clickedInsideSidebar, clickedToggle: clickedSidebarToggle })) app.classList.remove('sidebar-open');
  if (categoryButton) {
    const category = categoryById(categoryButton.dataset.category);
    if (category) navigateTo(entryHref(category));
  }
  if (treeContext) {
    event.preventDefault();
    const rootId = treeContext.dataset.treeRoot;
    const contextId = treeContext.dataset.treeContext;
    const action = clickAction({ hasChildren: directChildren(contextId).length > 0, expanded: state.treeRoot === rootId });
    if (action === 'expand') {
      state.treeRoot = rootId;
      state.treeFocus = contextId === rootId ? null : contextId;
      renderTree();
    } else {
      navigateTo(treeContext.getAttribute('href'));
    }
  }
  if (treeEntry) {
    const entry = articleById(treeEntry.dataset.treeEntry);
    if (entry && directChildren(entry.id).length) {
      event.preventDefault();
      state.treeRoot = rootIdForEntry(articles, entry.id);
      state.treeFocus = entry.id;
      renderTree();
    }
  }
  if (treeBack) {
    state.treeFocus = parentFocus(articles, treeBack.dataset.treeBack, state.treeFocus);
    renderTree();
  }
  if (devPublish) {
    devPublish.disabled = true;
    devPublish.textContent = 'Saving…';
    try {
      const response = await fetch('/__dev/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: devPublish.dataset.devPublish }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update publication state.');
      const published = result.entry.published === true;
      devPublish.classList.toggle('is-published', published);
      devPublish.classList.toggle('is-unpublished', !published);
      devPublish.setAttribute('aria-checked', String(published));
      devPublish.setAttribute('aria-label', published ? 'Unpublish this entry locally' : 'Publish this entry locally');
      devPublish.textContent = published ? 'Published' : 'Unpublished';
      devPublish.disabled = false;
    } catch (error) {
      devPublish.disabled = false;
      devPublish.textContent = 'Try again';
      window.alert(error.message);
    }
  }
  if (articleTarget && !event.target.closest('a')) {
    const article = articleById(articleTarget.dataset.article);
    if (article) navigateTo(entryHref(article));
  }
  if (searchResult) {
    const article = articleById(searchResult.dataset.searchResult);
    if (article) { dialog.close(); navigateTo(entryHref(article)); }
  }
  if (suggestion) {
    const article = articleById(suggestion.dataset.suggestion);
    if (article) { globalSuggestions.hidden = true; globalInput.setAttribute('aria-expanded', 'false'); navigateTo(entryHref(article)); }
  }
  if (scrollTarget) { document.querySelector(scrollTarget.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  if (internalLink && !event.defaultPrevented && shouldInterceptInternalLink({
    href: internalLink.getAttribute('href'),
    download: internalLink.hasAttribute('download'),
    modified: event.ctrlKey || event.metaKey || event.shiftKey || event.altKey,
  })) {
    event.preventDefault();
    navigateTo(internalLink.getAttribute('href'));
  }
});

document.addEventListener('keydown', (event) => {
  const row = event.target.closest?.('.article-row--clickable');
  if (row && (event.key === 'Enter' || event.key === ' ')) {
    const article = articleById(row.dataset.article);
    if (article) { event.preventDefault(); navigateTo(entryHref(article)); }
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(globalInput.value); }
});

document.querySelector('#global-search').addEventListener('submit', (event) => { event.preventDefault(); openSearch(globalInput.value); });
globalInput.addEventListener('input', () => {
  clearTimeout(suggestionTimer);
  suggestionRequest += 1;
  globalSuggestions.hidden = true;
  globalInput.setAttribute('aria-expanded', 'false');
  suggestionTimer = setTimeout(updateGlobalSuggestions, 500);
});
globalInput.addEventListener('blur', () => setTimeout(() => { suggestionRequest += 1; globalSuggestions.hidden = true; globalInput.setAttribute('aria-expanded', 'false'); }, 150));
document.querySelector('#dialog-search-form').addEventListener('submit', (event) => { event.preventDefault(); search(dialogInput.value); });
dialogInput.addEventListener('input', () => search(dialogInput.value));
document.querySelector('#search-dialog-close').addEventListener('click', () => dialog.close());
document.querySelector('#sidebar-open').addEventListener('click', () => app.classList.add('sidebar-open'));
document.querySelector('#sidebar-close').addEventListener('click', () => app.classList.remove('sidebar-open'));
window.addEventListener('popstate', () => { app.classList.remove('sidebar-open'); route(); });
window.addEventListener('resize', syncSidebarLayout);

let loadedContentAt = '';
async function loadPublishedContent(refresh = false) {
  try {
    const response = await fetch('/content-index.json', { cache: 'no-store' });
    if (!response.ok) return;
    const content = await response.json();
    const selected = selectContentIndex(content);
    if (content.generated_at !== loadedContentAt) {
      categories = selected.categories;
      articles = selected.articles;
      loadedContentAt = content.generated_at;
      if (refresh) route(false);
    }
  } catch {
    // A static file opened from disk has no content server. Do not expose fixture data.
  }
}

loadPublishedContent().finally(() => {
  migrateLegacyHashRoute();
  route();
});

if (import.meta.hot) import.meta.hot.on('content-index-updated', () => loadPublishedContent(true));
