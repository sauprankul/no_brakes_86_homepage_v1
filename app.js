/*
  Prototype content deliberately contains navigation metadata and the requester's
  example titles only. Article copy is intentionally left as an author-owned prompt.
*/
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

// `npm run dev` regenerates /content-index.json from the author-owned Content folder.
// The hard-coded set remains only as a visual fallback while every starter node is a draft.
let categories = fallbackCategories;
let articles = fallbackArticles;

const app = document.querySelector('#app-shell');
const main = document.querySelector('#main-content');
const navTree = document.querySelector('#nav-tree');
const breadcrumb = document.querySelector('#breadcrumb');
const dialog = document.querySelector('#search-dialog');
const dialogInput = document.querySelector('#dialog-search-input');
const dialogResults = document.querySelector('#dialog-results');
const globalInput = document.querySelector('#global-search-input');
const globalSuggestions = document.querySelector('#global-search-suggestions');

const state = { route: 'home', category: null, article: null };
const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

function categoryById(id) { return categories.find((item) => item.id === id); }
function articleById(id) { return articles.find((item) => item.id === id); }
function formatDate(date) { return dateFormatter.format(new Date(`${date}T12:00:00Z`)); }
function esc(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }

function thumb(article) {
  return `<div class="thumb" aria-hidden="true"><span class="thumb__label">${esc(article.media)}</span><span class="thumb__line thumb__line--one"></span><span class="thumb__line thumb__line--two"></span><span class="thumb__corner"></span></div>`;
}

function tags(tags) { return `<div class="tags">${tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join('')}</div>`; }

function articleRow(article, expanded = false) {
  const dateLabel = article.date ? formatDate(article.date) : 'Draft';
  const updated = article.updatedAt && article.updatedAt !== article.date ? `<span>Updated ${formatDate(article.updatedAt)}</span>` : '';
  return `
    <article class="article-row article-row--clickable" data-article="${article.id}" tabindex="0" aria-label="Open ${esc(article.title)}">
      ${thumb(article)}
      <div class="article-row__body">
        <p class="article-row__meta"><span>${esc(article.type)}</span><span>${dateLabel}</span>${updated}</p>
        <a class="article-row__title" href="#article/${article.id}" data-article="${article.id}">${esc(article.title)}</a>
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

function nodePathIncludes(id) {
  let current = state.article || state.category;
  while (current) {
    if (current === id) return true;
    const node = articleById(current);
    current = node?.parent || (node ? node.category : null);
  }
  return false;
}

function renderTreeItems(parentId, depth = 0) {
  return directChildren(parentId).map((node) => {
    const children = directChildren(node.id);
    const open = nodePathIncludes(node.id);
    const href = node.hasArticle === false ? `#category/${node.id}` : `#article/${node.id}`;
    return `<div class="tree__node" style="--tree-depth:${depth}"><a class="tree__article ${nodePathIncludes(node.id) ? 'is-active' : ''}" href="${href}">${esc(node.title)}</a>${children.length ? `<div class="tree__items" ${open ? '' : 'hidden'}>${renderTreeItems(node.id, depth + 1)}</div>` : ''}</div>`;
  }).join('');
}

function renderTree() {
  navTree.innerHTML = categories.map((category) => {
    const children = renderTreeItems(category.id);
    const open = nodePathIncludes(category.id);
    return `
      <section class="tree__section">
        <div class="tree__category-row">
          <button class="tree__collapse" type="button" data-tree-category="${category.id}" aria-label="Toggle ${esc(category.short)}" aria-expanded="${open}"><span class="tree__caret" aria-hidden="true">⌄</span></button>
          <a class="tree__category ${state.category === category.id ? 'is-active' : ''}" href="#category/${category.id}" ${state.category === category.id ? 'aria-current="page"' : ''}>
            <span class="tree__folder" aria-hidden="true">□</span><span>${esc(category.short)}</span><span class="tree__count">${category.count}</span>
          </a>
        </div>
        <div class="tree__items" ${open ? '' : 'hidden'}>${children}</div>
      </section>`;
  }).join('');
}

function setBreadcrumb(parts) {
  breadcrumb.innerHTML = parts.map((part, index) => {
    const item = part.href ? `<a href="${part.href}">${esc(part.label)}</a>` : `<span>${esc(part.label)}</span>`;
    return `${index ? '<span class="crumb-separator" aria-hidden="true">/</span>' : ''}${item}`;
  }).join('');
}

function renderHome() {
  const newItems = [...articles].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')).slice(0, 5);
  const hotItems = articles.filter((article) => article.featured === 'hot').slice(0, 5);
  state.category = null;
  state.article = null;
  setBreadcrumb([{ label: 'Archive' }, { label: 'Home' }]);
  main.innerHTML = `
    <section class="hero">
      <div>
        <p class="eyebrow">86 / BRZ PERFORMANCE REFERENCE</p>
        <h1>Every lap, repair<br />and bad idea—<em>kept useful.</em></h1>
        <div class="hero__rule"></div>
      </div>
      <div>
        <p class="hero__copy">A searchable, long-form record for the work behind 86 Challenge. Video lives on YouTube; the evidence, context and notes live here.</p>
        <div class="hero__note"><strong>${articles.length}</strong><span>starter entries in the archive prototype</span></div>
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

function getTagOptions(items) {
  return [...new Set(items.flatMap((article) => article.tags))].sort((a, b) => a.localeCompare(b));
}

function collectionMarkup(id, articleMode) {
  const placement = articleMode ? 'collection-controls--article' : 'collection-controls--index';
  return `<section class="collection-controls ${placement}" id="collection-${id}" aria-label="Search entries below this page">
    <div class="filters">
      <label><span>Search</span><input data-filter="text" type="search" placeholder="Search title, subtitle or tags…" /></label>
      <label><span>Articles only?</span><select data-filter="articles-only"><option value="">Any</option><option value="yes">Yes</option><option value="no">No</option></select></label>
      <label class="tag-filter"><span>Include tags</span><div class="tag-filter__box" data-tag-box="include"><div class="tag-chips" data-tag-chips="include"></div><input data-tag-input="include" type="search" autocomplete="off" placeholder="Type a tag" /></div><div class="tag-options" data-tag-options="include" hidden></div></label>
      <label class="tag-filter"><span>Exclude tags</span><div class="tag-filter__box" data-tag-box="exclude"><div class="tag-chips" data-tag-chips="exclude"></div><input data-tag-input="exclude" type="search" autocomplete="off" placeholder="Type a tag" /></div><div class="tag-options" data-tag-options="exclude" hidden></div></label>
      <label><span>Published after</span><input data-filter="after" type="date" /></label>
      <label><span>Published before</span><input data-filter="before" type="date" /></label>
      <label><span>Order</span><select data-filter="order"><option value="new">Newest first</option><option value="old">Oldest first</option><option value="title">Title A–Z</option></select></label>
    </div>
    <div class="collection-status"><p class="collection-hint" data-collection-hint ${articleMode ? '' : 'hidden'}>Search for something under this article.</p><button class="clear-filters" type="button" data-clear-filters hidden>Clear filters</button></div>
    <p class="filter-count" data-filter-count ${articleMode ? 'hidden' : ''}></p>
  </section>`;
}

function mountCollection(id, articleMode) {
  const root = document.querySelector(`#collection-${id}`);
  const results = document.querySelector('#category-results');
  const direct = directChildren(id);
  const all = descendantEntries(id);
  const tagsAvailable = getTagOptions(all);
  const selected = { include: [], exclude: [] };
  const input = (name) => root.querySelector(`[data-filter="${name}"]`);
  const hasCriteria = () => Boolean(input('text').value.trim() || input('articles-only').value || input('after').value || input('before').value || input('order').value !== 'new' || selected.include.length || selected.exclude.length);
  const paintChips = (kind) => {
    root.querySelector(`[data-tag-chips="${kind}"]`).innerHTML = selected[kind].map((tag) => `<span class="tag-chip">${esc(tag)}<button type="button" data-remove-tag="${kind}" data-tag="${esc(tag)}" aria-label="Remove ${esc(tag)}">×</button></span>`).join('');
  };
  const paintOptions = (kind) => {
    const field = root.querySelector(`[data-tag-input="${kind}"]`);
    const options = root.querySelector(`[data-tag-options="${kind}"]`);
    const term = field.value.trim().toLowerCase();
    const matches = tagsAvailable.filter((tag) => !selected[kind].includes(tag) && (!term || tag.toLowerCase().includes(term))).slice(0, 5);
    options.hidden = matches.length === 0;
    options.innerHTML = matches.map((tag) => `<button type="button" data-add-tag="${kind}" data-tag="${esc(tag)}">${esc(tag)}</button>`).join('');
  };
  const update = () => {
    const active = hasCriteria();
    const term = input('text').value.trim().toLowerCase();
    const articlesOnly = input('articles-only').value;
    const after = input('after').value;
    const before = input('before').value;
    const order = input('order').value;
    const filtered = (active ? all : direct).filter((entry) => {
      const haystack = [entry.title, entry.subtitle, entry.type, ...entry.tags].join(' ').toLowerCase();
      const isArticle = entry.hasArticle !== false;
      return (!term || haystack.includes(term)) && (!articlesOnly || (articlesOnly === 'yes' ? isArticle : !isArticle)) && selected.include.every((tag) => entry.tags.includes(tag)) && !selected.exclude.some((tag) => entry.tags.includes(tag)) && (!after || !entry.date || entry.date >= after) && (!before || !entry.date || entry.date <= before);
    }).sort((a, b) => order === 'title' ? a.title.localeCompare(b.title) : order === 'old' ? (a.date ?? '').localeCompare(b.date ?? '') : (b.date ?? '').localeCompare(a.date ?? ''));
    root.querySelector('[data-collection-hint]').hidden = !articleMode || active;
    root.querySelector('[data-filter-count]').hidden = articleMode && !active;
    root.querySelector('[data-clear-filters]').hidden = !active;
    root.querySelector('[data-filter-count]').textContent = `${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'} shown`;
    results.innerHTML = articleMode && !active ? '' : (filtered.length ? filtered.map((entry) => articleRow(entry, true)).join('') : '<div class="empty-state"><strong>No matching entries.</strong>Try removing a filter or searching a different term.</div>');
  };
  root.addEventListener('input', (event) => {
    const kind = event.target.dataset.tagInput;
    if (kind) paintOptions(kind);
    update();
  });
  root.addEventListener('change', update);
  root.addEventListener('click', (event) => {
    const add = event.target.closest('[data-add-tag]');
    const remove = event.target.closest('[data-remove-tag]');
    if (add && !selected[add.dataset.addTag].includes(add.dataset.tag)) {
      selected[add.dataset.addTag].push(add.dataset.tag);
      root.querySelector(`[data-tag-input="${add.dataset.addTag}"]`).value = '';
      paintChips(add.dataset.addTag); paintOptions(add.dataset.addTag); update();
    }
    if (remove) {
      selected[remove.dataset.removeTag] = selected[remove.dataset.removeTag].filter((tag) => tag !== remove.dataset.tag);
      paintChips(remove.dataset.removeTag); paintOptions(remove.dataset.removeTag); update();
    }
    if (event.target.closest('[data-clear-filters]')) {
      root.querySelectorAll('[data-filter]').forEach((control) => { control.value = control.dataset.filter === 'order' ? 'new' : ''; });
      selected.include = []; selected.exclude = [];
      paintChips('include'); paintChips('exclude'); paintOptions('include'); paintOptions('exclude'); update();
    }
  });
  update();
}

function renderCategory(id) {
  const category = categoryById(id) || articleById(id);
  if (!category) return renderHome();
  state.category = id;
  state.article = null;
  const immediateChildren = directChildren(id);
  const categoryName = category.name || category.title;
  const categoryShort = category.short || categoryName;
  setBreadcrumb([{ label: 'Archive', href: '#home' }, { label: categoryName }]);
  main.innerHTML = `<header class="page-header"><p class="eyebrow">ARCHIVE / ${esc(categoryShort)}</p><h1>${esc(categoryName)}</h1><p>${esc(category.intro || category.subtitle || 'Preview the entries in this part of the archive.')}</p></header><section aria-label="${esc(categoryName)} entries">${immediateChildren.length ? collectionMarkup(id, false) : ''}<div class="category-results" id="category-results"></div></section>`;
  if (immediateChildren.length) mountCollection(id, false);
  else document.querySelector('#category-results').innerHTML = '<div class="empty-state"><strong>No child entries yet.</strong>This page will stay clean until it has something to preview.</div>';
  renderTree();
}

function renderArticle(id) {
  const article = articleById(id);
  if (!article) return renderHome();
  // A node without article.md is an index page: show its child previews by default.
  if (article.hasArticle === false) return renderCategory(article.id);
  const category = categoryById(article.category);
  if (!category) return renderCategory(article.id);
  state.category = category.id;
  state.article = article.id;
  const hasChildren = directChildren(article.id).length > 0;
  const toc = article.headings?.length ? `<aside class="article-aside"><h2>On this page</h2><ul>${article.headings.map((heading) => `<li class="article-aside__level-${heading.depth}"><a href="#${esc(heading.id)}">${esc(heading.text)}</a></li>`).join('')}</ul></aside>` : '';
  setBreadcrumb([{ label: 'Archive', href: '#home' }, { label: category.name, href: `#category/${category.id}` }, { label: article.title }]);
  main.innerHTML = `
    <div class="article-info article-info--standalone"><span>${esc(article.type)}</span>${article.date ? `<span>Published <b>${formatDate(article.date)}</b></span>` : ''}${article.updatedAt && article.updatedAt !== article.date ? `<span>Updated <b>${formatDate(article.updatedAt)}</b></span>` : ''}${article.tags.length ? `<span>Tags ${tags(article.tags)}</span>` : ''}</div>
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
  setBreadcrumb([{ label: 'Archive', href: '#home' }, { label: 'About' }]);
  main.innerHTML = `
    <section class="about">
      <p class="eyebrow">ABOUT THIS PROJECT</p>
      <h1>Notes have more value when they still make sense next season.</h1>
      <p>This is the home for an 86/BRZ driver’s own record of track work, repairs, installs and development. It favors traceability over noise: every article is an authored primary record, with video and data as supporting evidence.</p>
      <div class="principles"><div class="principle"><strong>Author first</strong><span>No AI-generated technical articles. The site helps structure and find your work; it does not invent it.</span></div><div class="principle"><strong>Context attached</strong><span>Track state, date, setup and sources stay with the claim—not in a fleeting caption.</span></div><div class="principle"><strong>Built to last</strong><span>Local Markdown, static HTML and portable data files keep the archive under your control.</span></div></div>
    </section>`;
  renderTree();
}

function route() {
  if (dialog.open) dialog.close();
  const hash = window.location.hash.replace(/^#/, '') || 'home';
  const [kind, id] = hash.split('/');
  if (kind === 'category') renderCategory(id);
  else if (kind === 'article') renderArticle(id);
  else if (kind === 'about') renderAbout();
  else renderHome();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function searchableEntries(query) {
  const term = query.trim().toLowerCase();
  return term ? articles.filter((article) => [article.title, article.subtitle, article.type, categoryById(article.category)?.name ?? '', ...article.tags].join(' ').toLowerCase().includes(term)) : [];
}

function search(query) {
  const term = query.trim().toLowerCase();
  const matches = searchableEntries(query);
  dialogResults.innerHTML = term
    ? (matches.length ? matches.map((article) => `<div class="dialog-result"><button type="button" data-search-result="${article.id}">${thumb(article)}<span class="result-meta">${esc(categoryById(article.category)?.short ?? 'Archive')} · ${article.date ? formatDate(article.date) : 'Draft'}</span><strong>${esc(article.title)}</strong><p>${esc(article.subtitle)}</p></button></div>`).join('') : '<div class="empty-state"><strong>No result yet.</strong>Try a track, part, technique or repair.</div>')
    : '<div class="empty-state"><strong>Search the archive.</strong>Results will include titles, subtitles, categories and tags.</div>';
}

let suggestionTimer;
function updateGlobalSuggestions() {
  const matches = searchableEntries(globalInput.value).slice(0, 5);
  globalSuggestions.hidden = matches.length === 0;
  globalInput.setAttribute('aria-expanded', String(matches.length > 0));
  globalSuggestions.innerHTML = matches.map((article) => `<button class="search-suggestion" type="button" data-suggestion="${article.id}" role="option">${esc(article.title)}</button>`).join('');
}

function openSearch(initial = '') {
  if (!dialog.open) dialog.showModal();
  dialogInput.value = initial;
  search(initial);
  requestAnimationFrame(() => dialogInput.focus());
}

document.addEventListener('click', (event) => {
  const categoryButton = event.target.closest('[data-category]');
  const treeCategory = event.target.closest('[data-tree-category]');
  const articleTarget = event.target.closest('[data-article]');
  const routeTarget = event.target.closest('[data-route]');
  const searchResult = event.target.closest('[data-search-result]');
  const suggestion = event.target.closest('[data-suggestion]');
  const scrollTarget = event.target.closest('[data-scroll]');
  if (categoryButton) { window.location.hash = `category/${categoryButton.dataset.category}`; }
  if (treeCategory) {
    const children = treeCategory.parentElement.nextElementSibling;
    const open = treeCategory.getAttribute('aria-expanded') === 'true';
    treeCategory.setAttribute('aria-expanded', String(!open));
    children.hidden = open;
  }
  if (articleTarget && !event.target.closest('a')) { window.location.hash = `article/${articleTarget.dataset.article}`; }
  if (routeTarget) { window.location.hash = routeTarget.dataset.route; }
  if (searchResult) { dialog.close(); window.location.hash = `article/${searchResult.dataset.searchResult}`; }
  if (suggestion) { globalSuggestions.hidden = true; globalInput.setAttribute('aria-expanded', 'false'); window.location.hash = `article/${suggestion.dataset.suggestion}`; }
  if (scrollTarget) { document.querySelector(scrollTarget.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
});

document.addEventListener('keydown', (event) => {
  const row = event.target.closest?.('.article-row--clickable');
  if (row && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); window.location.hash = `article/${row.dataset.article}`; }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(globalInput.value); }
});

document.querySelector('#global-search').addEventListener('submit', (event) => { event.preventDefault(); openSearch(globalInput.value); });
globalInput.addEventListener('input', () => {
  clearTimeout(suggestionTimer);
  suggestionTimer = setTimeout(updateGlobalSuggestions, 500);
});
globalInput.addEventListener('blur', () => setTimeout(() => { globalSuggestions.hidden = true; globalInput.setAttribute('aria-expanded', 'false'); }, 150));
document.querySelector('#dialog-search-form').addEventListener('submit', (event) => { event.preventDefault(); search(dialogInput.value); });
dialogInput.addEventListener('input', () => search(dialogInput.value));
document.querySelector('#search-dialog-close').addEventListener('click', () => dialog.close());
document.querySelector('#sidebar-open').addEventListener('click', () => app.classList.add('sidebar-open'));
document.querySelector('#sidebar-close').addEventListener('click', () => app.classList.remove('sidebar-open'));
window.addEventListener('hashchange', () => { app.classList.remove('sidebar-open'); route(); });

async function loadPublishedContent() {
  try {
    const response = await fetch('/content-index.json', { cache: 'no-store' });
    if (!response.ok) return;
    const content = await response.json();
    if (Array.isArray(content.categories) && Array.isArray(content.articles) && content.articles.length) {
      categories = content.categories;
      articles = content.articles;
    }
  } catch {
    // Opening the static prototype directly from disk has no fetch server; use the fallback.
  }
}

loadPublishedContent().finally(route);
