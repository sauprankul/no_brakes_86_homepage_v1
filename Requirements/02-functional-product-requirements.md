# Functional product requirements

## Information model

Everything in the archive is a **node**. Every node folder has exactly one `config.yaml`. The presence of `article.md` is the default rendering switch:

- no `article.md` → render the node title/description and a preview list of direct child entries;
- `article.md` → render the authored Markdown as the article body;
- both → the node is simultaneously an article and a folder.

This permits the requested Confluence-like hierarchy without inventing two incompatible content types. A folder-only node renders its child previews; an article node renders its content first and child previews below it.

Every public route is the entry's title-derived hierarchical path, for example `/86-challenge/2026-86-challenge-season`. URLs never encode implementation types such as `category`, `article`, or hash routes. The presence of `article.md` alone selects article rendering; its absence selects preview-list rendering at the same kind of URL.

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

Every node has a colocated `config.yaml`. Published articles require a non-empty `title` and `subtitle`; a published index entry requires a non-empty `title` plus either `subtitle` or `description`. Published entries also validate `parent` when present, `published`, `published_at`, `updated_at`, `tags`, `content_type`, `featured`, and `summary`. Tags may be non-empty strings or numeric values such as a YAML year, and an omitted tag list is empty. Thumbnail metadata is optional; when configured, it must resolve to an allowed public asset.

`published_at` is a complete ISO 8601 timestamp with an explicit UTC offset. It is written once, at the actual instant of the first transition to `published: true`, and must survive an unpublish, move or later edit. A legacy date-only value is migrated deterministically to midnight UTC because its original time cannot be recovered. `updated_at` is also a complete ISO 8601 timestamp and records the latest local edit. Reader-facing dates and times use the reader's browser locale and time zone. The article byline shows “Updated” whenever the two stored instants differ.

While `npm run dev` is active, every editable entry is visible regardless of `published`. Every entry page, whether it renders an article or a child preview list at any hierarchy depth, shows a local-only publication toggle that writes only the matching entry’s `config.yaml`, preserves an existing `published_at`, and updates `updated_at`. The response must immediately update the draft-inclusive browser index so the toggle and navigation state remain correct after live refresh or a manual refresh; rebuilding media must not leave the browser on a stale content index. The control is fixed near the top-right of the viewport so it does not alter document layout, reads `Unpublished` in red when off and `Published` in green when on, and has no separate local-preview label. It must not exist in a production build. The regular production build includes only `published: true` entries; an empty published index is a valid public state and must never fall back to fixture, sample, or draft data. The local watcher batches edited entries and writes an ISO `updated_at` timestamp to each affected `config.yaml` once per minute; draft lists sort by that timestamp when they have no publish date.

Every unpublished entry, including a top-level entry, has an unmistakable red draft highlight in local development navigation. Production navigation never applies this draft treatment.

Optional fields: gallery items, official results URL, setup sheet, downloadable files, car configuration, circuit configuration, tire, weather, best lap, part numbers, affiliate disclosure and related articles. Public image/video files are generated from the entry-local `Media/` source directory into committed `SizedMedia/`; raw media is not deployed.

Do not publish an article with an empty title or unvalidated external URL. If it has a thumbnail, validate its alt text and public asset.

## Navigation

- Support every depth of the archive in the left-side navigation without increasing its width. At most one top-level branch is expanded at a time; opening another closes the prior branch.
- A first click on a branch expands it in place; clicking its already-expanded context opens that context’s page. A leaf opens immediately. Drilling keeps every entry in the active path visible as its own, indented parent-styled row; row labels wrap instead of truncating. A `^ Collapse` control under the active entry moves up one level. This single-path model applies recursively with no depth limit.
- Show no more than five children for an expanded context. When more exist, a “See all” link opens the context page and its article or preview list.
- The selected entry and its current navigation path are visually clear. Route changes open the selected entry’s parent context.
- Breadcrumbs link back through the complete hierarchy, starting with `Home`; Home itself shows no breadcrumb.
- Each category page has no category selector filter. Entering a category is the category filter.

## Feeds

- `New`: default sort is `publishedAt` descending. Configuration controls number of items and whether an update changes a node’s position.
- `Hot`: a manually editorialized list using `featuredRank`, not page views alone. This makes the best entry points intentional and prevents popularity feedback loops.
- Both feeds must use the standard article preview component; thumbnails are optional.

## Search and filtering

### Phase 1: static, free, client-side

- The global search matches title, subtitle, category, tags and, in production, full body text.
- Unquoted multi-word queries match all query words regardless of order. An exact phrase and the original word order rank ahead of reordered matches. Search must deduplicate entries that match through both metadata and body text; do not generate factorial query permutations when the search engine already provides order-independent matching.
- Search is case-insensitive, debounced and keyboard accessible.
- The five-result header dropdown remains a compact metadata suggestion list. Body excerpts appear only in the full search dialog.
- Every page that has direct children exposes the search/filter tool. Index pages place it above the preview list; article pages place it below the Markdown body.
- An index page initially lists direct children only. Once the visitor changes any query or filter, matching direct and indirect descendants become candidates.
- Every direct child of a list page renders as a preview row, whether it is an article or another list page. Within every selected order, published entries sort ahead of unpublished entries. Each unpublished preview displays one red `Unpublished` status tag; it does not also display `Draft` as a substitute publication date.
- An article with children initially lists no children and shows only the faint hint “Search for something under this article.” Once the visitor changes any query or filter, matching direct and indirect descendants appear.
- Filtering includes text match, an “Articles only?” choice (`Any`, `Yes`, or `No`), multiple include tags, multiple exclude tags, publication date, and ordering. The public interface must use “entries” or “articles”, never the technical word “node”.
- Include/exclude tags are typeahead text fields: show up to five matching suggestions and represent selected tags as removable chips.
- Display active filters and result count only after a filter is active. A clear-all action is required when filters are active.

### Phase 2: full-text without an API

Use Pagefind after the static build. It creates a static, chunked full-text index and supports metadata filters; its documentation says a 10,000-page site can search with a total network payload below 300 kB. Pagefind's native unquoted multi-word behavior supplies all-words/any-order matching; quoted search remains the exact-phrase mechanism. This gives the archive real full-text search with no search server, AI request, or custom permutation explosion. [Pagefind overview](https://pagefind.app/), [search behavior](https://pagefind.app/docs/multilingual/), and [indexing controls](https://pagefind.app/docs/indexing/) are the reference implementation.

Index author article content only: mark the article body with `data-pagefind-body` and add stable entry ID, title, subtitle, category/tag/date, and optional image metadata. Never index private drafts, admin screens, search UI or raw data that should remain unlisted. A production build regenerates the index from the published rendered HTML. Authoring mode regenerates an equivalent lightweight element-level body index on every content refresh, so Markdown changes become searchable with the same near-real-time refresh as the rendered article rather than waiting ten minutes or for pre-commit.

When a full-dialog result is present only because its article body matched, show context from the best matching rendered element. A heading match shows the full heading. A paragraph, list item, table cell, blockquote, or caption shows at most five words before and five words after the first matching word, with ellipses when clipped. If title, subtitle, category, or tags matched, retain the existing title/subtitle result presentation.

## Article experience

- Convert each `article.md` directly to sanitized HTML at build time. Do not insert hardcoded gallery, author-note, download, or section placeholder blocks into authored articles.
- Render every Markdown table in a responsive scroll container with a thin yellow perimeter, thin gray cell rules, centered content, generous padding, and a yellow header with dark text.
- Resolve every article’s top-level category through its full parent chain so nested articles always render their authored Markdown rather than an empty child-preview page.
- Render an article page’s H1 title and optional subtitle from its `config.yaml`; authors do not need to repeat either in `article.md`.
- Generate the “On this page” box from the article’s level-two and level-three Markdown headings. Hide it if none exist.
- A Markdown link to `./Downloads/<file>` renders as an accessible download button at the entry's hierarchical URL (`/<entry-path>/downloads/<file>`), bypasses client-side routing, and is copied to the local built site. The article folder’s `Downloads/` directory contains only intentionally public attachments. Production publication of ignored downloads requires a separately approved committed-public-artifact workflow; a Git build cannot upload files that never enter Git.
- `Downloads/` and `Media/` are intentionally Git-ignored author workspaces. `SizedMedia/` is generated, validated, and committed. When an author supplies `Media/thumbnail.<extension>`, it is generated as `SizedMedia/thumbnail.jpg` for optional preview/banner use.
- Support static, directly served native video from `SizedMedia/`: H.264/AAC MP4, smaller dimension at most 480px, at most 30fps, at most 30 seconds, controls enabled, and no automatic high-resolution variant. YouTube embeds remain supported only when the author intentionally chooses an external video.
- Support responsive author photos, captions, lightbox controls, part-number callouts, warnings, callouts, tables, figures, source links and downloadable data.
- Data downloads must include file type, size, created date, checksum when meaningful and an accessibility-friendly label.
- Event pages have links to official results; track guides state the exact layout/configuration; data comparisons declare their variables.
- Author can draft locally, preview before publish, and save a node folder as a standalone Codex project context.
- Node pages must never infer “article” from a filename convention such as `_node.yaml` or from a metadata type field. `config.yaml` plus the presence of `article.md` is the source of truth.
- Short clips use native `<video>` playback: muted/autoplay/loop only where intentional, with visible pause and scrub controls, `playsinline`, a poster image and an accessible text alternative. Do not replace controls with a non-scrubbable decorative animation.

## Missing routes

An unmatched page or attachment URL renders an explicit 404 state that preserves and displays the requested path, counts down visibly for five seconds, then replaces browser history with `/`. A direct “Go home now” link remains available during the countdown.

## Analytics — deferred until after MVP

- MVP production and development builds must contain no analytics client, collector endpoint, tracking script, cookie, identifier, telemetry transport, Analytics Engine binding, or analytics deployment job.
- All analytics product, privacy, consent, retention, regional-policy, owner-device-exclusion, provider, event-schema, performance-budget, and reporting decisions are deferred until the MVP is complete.
- Any future analytics proposal is a new scoped feature. It must begin with current legal/provider/cost research, explicit owner approval, updated requirements, synthetic tests, and a deliberately chosen activation mechanism. No pre-MVP analytics design is authoritative merely because it remains in Git history.

## SEO requirements

- One stable canonical URL per article; preserve it indefinitely and 301 redirect any renamed slug.
- Generate `sitemap.xml`, `robots.txt`, canonical metadata, Open Graph image, `Article` / `VideoObject` / `HowTo` schema only when valid for that article.
- Use descriptive, title-derived URL segments in the full entry hierarchy. Do not add route-type prefixes or use dated URLs unless date is a primary part of the content.
- Add internal links between related articles where the author chooses them; do not create fake “related” content.
