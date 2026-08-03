# Functional product requirements

## Information model

Everything in the archive is a **node**. Every node folder has exactly one `config.yaml`. The presence of `article.md` is the default rendering switch:

- no `article.md` → render the node title/description and a preview list of direct child entries;
- `article.md` → render the authored Markdown as the article body;
- both → the node is simultaneously an article and a folder.

This permits the requested Confluence-like hierarchy without inventing two incompatible content types. A folder-only node renders its child previews; an article node renders its content first and child previews below it.

Required initial top-level nodes:

- Engine Rebuild
- Track Guides
- 86 Challenge
- Mods
- Repairs
- Driving Technique
- Setup Tips
- Test Drives
- Tools

## Required article fields

Every node has a colocated `config.yaml`. Published articles must validate `title`, `subtitle`, `parent`, `published`, `published_at`, `updated_at`, `tags`, `content_type`, `featured`, `thumbnail`, `thumbnail_alt`, and `summary`.

`published_at` is written once, on the first transition to `published: true`, and must survive an unpublish, move or later edit. `updated_at` records the latest local edit. The article byline shows “Updated” only if its calendar date is different from “Published”.

While `npm run dev` is active, every editable entry is visible regardless of `published`. The regular production build respects `published: true`. The local watcher batches edited entries and writes an ISO `updated_at` timestamp to each affected `config.yaml` once per minute; draft lists sort by that timestamp when they have no publish date.

Optional fields: gallery items, official results URL, setup sheet, downloadable files, car configuration, circuit configuration, tire, weather, best lap, part numbers, affiliate disclosure and related articles. Public image/video files are generated from the entry-local `Media/` source directory into committed `SizedMedia/`; raw media is not deployed.

Do not publish an article with a missing thumbnail alt text, empty title or unvalidated external URL.

## Navigation

- Render the entire node hierarchy in a left-side tree at all times on desktop.
- A user can collapse any branch independently; the system must preserve collapse state locally.
- The selected node and all ancestor branches are visually clear.
- Breadcrumbs link back through the hierarchy.
- Each category page has no category selector filter. Entering a category is the category filter.

## Feeds

- `New`: default sort is `publishedAt` descending. Configuration controls number of items and whether an update changes a node’s position.
- `Hot`: a manually editorialized list using `featuredRank`, not page views alone. This makes the best entry points intentional and prevents popularity feedback loops.
- Both feeds must use the standard article preview component and thumbnails.

## Search and filtering

### Phase 1: static, free, client-side

- The global search matches title, subtitle, category, tags and, in production, full body text.
- Search is case-insensitive, debounced and keyboard accessible.
- Every page that has direct children exposes the search/filter tool. Index pages place it above the preview list; article pages place it below the Markdown body.
- An index page initially lists direct children only. Once the visitor changes any query or filter, matching direct and indirect descendants become candidates.
- An article with children initially lists no children and shows only the faint hint “Search for something under this article.” Once the visitor changes any query or filter, matching direct and indirect descendants appear.
- Filtering includes text match, an “Articles only?” choice (`Any`, `Yes`, or `No`), multiple include tags, multiple exclude tags, publication date, and ordering. The public interface must use “entries” or “articles”, never the technical word “node”.
- Include/exclude tags are typeahead text fields: show up to five matching suggestions and represent selected tags as removable chips.
- Display active filters and result count only after a filter is active. A clear-all action is required when filters are active.
- The direct-child/default and active-filter/recursive candidate rules are covered with 100% line, function, and branch coverage against synthetic fixtures, never against author content.

### Phase 2: full-text without an API

Use Pagefind after the static build. It creates a static, chunked full-text index and supports metadata filters; its documentation says a 10,000-page site can search with a total network payload below 300 kB. This gives the archive real full-text search with no search server or AI request. [Pagefind overview](https://pagefind.app/) and [indexing controls](https://pagefind.app/docs/indexing/) are the reference implementation.

Index author article content only: mark the article body with `data-pagefind-body` and add category/tag/date metadata. Never index private drafts, admin screens, search UI or raw data that should remain unlisted.

## Article experience

- Convert each `article.md` directly to sanitized HTML at build time. Do not insert hardcoded gallery, author-note, download, or section placeholder blocks into authored articles.
- Render an article page’s H1 title and optional subtitle from its `config.yaml`; authors do not need to repeat either in `article.md`.
- Generate the “On this page” box from the article’s level-two and level-three Markdown headings. Hide it if none exist.
- A Markdown link to `./Downloads/<file>` renders as an accessible download button and is copied to the built site. The article folder’s `Downloads/` directory contains only intentionally public attachments.
- `Downloads/` and `Media/` are intentionally Git-ignored author workspaces. `SizedMedia/` is generated, validated, and committed. Each entry’s preview/banner thumbnail is generated from `Media/thumbnail.<extension>` as `SizedMedia/thumbnail.jpg`.
- Support static, directly served native video from `SizedMedia/`: H.264/AAC MP4, smaller dimension at most 480px, at most 30fps, at most 30 seconds, controls enabled, and no automatic high-resolution variant. YouTube embeds remain supported only when the author intentionally chooses an external video.
- Support responsive author photos, captions, lightbox controls, part-number callouts, warnings, callouts, tables, figures, source links and downloadable data.
- Data downloads must include file type, size, created date, checksum when meaningful and an accessibility-friendly label.
- Event pages have links to official results; track guides state the exact layout/configuration; data comparisons declare their variables.
- Author can draft locally, preview before publish, and save a node folder as a standalone Codex project context.
- Node pages must never infer “article” from a filename convention such as `_node.yaml` or from a metadata type field. `config.yaml` plus the presence of `article.md` is the source of truth.
- Short clips use native `<video>` playback: muted/autoplay/loop only where intentional, with visible pause and scrub controls, `playsinline`, a poster image and an accessible text alternative. Do not replace controls with a non-scrubbable decorative animation.

## Privacy-respecting analytics

- Analytics is optional and must fail closed: production sends nothing until a first-party HTTPS collector endpoint is configured; `npm run dev` and every other development build send nothing.
- Track only useful aggregate product signals: page views, active page-engagement time, active engagement time per visible H2/H3 article section, maximum scroll-depth bucket, submitted archive searches and result counts, outbound-link/download clicks, and native short-video start/progress/completion. Do not attempt playback telemetry for a third-party YouTube embed without an explicit later decision.
- “Time spent” means active, visible time only. Pause timing while the tab is hidden, when the page is unloaded, or when a different article section becomes active. Do not infer attention from an open but background tab.
- Search popularity may retain a normalized term only when it is short and uses ordinary letters, numbers, spaces, `/`, `+`, or `-`; reject emails, URLs, phone-like strings and other unusual input. Dashboards must suppress a search term until it has at least five recorded searches in the reporting window.
- Never collect names, email addresses, IP addresses, full referrers, cookies, ad IDs, device fingerprints, stable visitor IDs, MAC addresses, precise location, form input, raw user agent, or cross-site activity. The site must not attempt to read a MAC address: browsers do not expose it and it is not an appropriate web-analytics identifier.
- Personal-device exclusion is a persistent local browser preference, not an identifier list. Visiting `/?analytics=off` sets it; `/?analytics=on` clears it. This setting is per browser/device, has no server round-trip, and the UI must not send an opt-out event. Document it in the site privacy notice before enabling analytics.
- The analytics client must be deferred, independent of rendering, batched at most every 15 seconds/on page hide, cap itself at 50 events per page session, and sample any future performance metrics. It must not block navigation, article rendering, search, video controls, or content refresh.
- Report only aggregate trends: popular paths/content, entry and exit distribution, active reading completion and section drop-off, successful vs. zero-result searches, popular safe search terms, download/outbound-link use, native-video completion, and coarse page-performance buckets. Use these signals to improve content and navigation, never to profile readers.

## SEO requirements

- One stable canonical URL per article; preserve it indefinitely and 301 redirect any renamed slug.
- Generate `sitemap.xml`, `robots.txt`, canonical metadata, Open Graph image, `Article` / `VideoObject` / `HowTo` schema only when valid for that article.
- Use descriptive URL paths based on the node path. Do not use dated URLs unless date is a primary part of the content.
- Add internal links between related articles where the author chooses them; do not create fake “related” content.
