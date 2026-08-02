# Functional product requirements

## Information model

Everything in the archive is a **node**. Every node folder has exactly one `config.yaml`. The presence of `article.md` is the default rendering switch:

- no `article.md` → render the node title/description and a preview list of child nodes;
- `article.md` → render the authored article, followed by any child previews;
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

`published_at` is written once, on the first transition to `published: true`, and must survive an unpublish, move or later edit. `updated_at` changes when the author saves an edited published Markdown file. The article byline shows “Updated” only if it is different from “Published”.

Optional fields: YouTube URL, Stream video UID, gallery items, official results URL, setup sheet, downloadable files, car configuration, circuit configuration, tire, weather, best lap, part numbers, affiliate disclosure and related articles.

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
- Category list filtering includes text match, include-tag, exclude-tag and publication date/order.
- Display active filters and result count. A clear-all action is required when filters are active.

### Phase 2: full-text without an API

Use Pagefind after the static build. It creates a static, chunked full-text index and supports metadata filters; its documentation says a 10,000-page site can search with a total network payload below 300 kB. This gives the archive real full-text search with no search server or AI request. [Pagefind overview](https://pagefind.app/) and [indexing controls](https://pagefind.app/docs/indexing/) are the reference implementation.

Index author article content only: mark the article body with `data-pagefind-body` and add category/tag/date metadata. Never index private drafts, admin screens, search UI or raw data that should remain unlisted.

## Article experience

- Support YouTube video embeds with a privacy-enhanced domain (`youtube-nocookie.com`) and a click-to-load thumbnail, not an eager iframe.
- Support responsive author photos, captions, lightbox controls, part-number callouts, warnings, callouts, tables, figures, source links and downloadable data.
- Data downloads must include file type, size, created date, checksum when meaningful and an accessibility-friendly label.
- Event pages have links to official results; track guides state the exact layout/configuration; data comparisons declare their variables.
- Author can draft locally, preview before publish, and save a node folder as a standalone Codex project context.
- Node pages must never infer “article” from a filename convention such as `_node.yaml` or from a metadata type field. `config.yaml` plus the presence of `article.md` is the source of truth.
- Short clips use native `<video>` playback: muted/autoplay/loop only where intentional, with visible pause and scrub controls, `playsinline`, a poster image and an accessible text alternative. Do not replace controls with a non-scrubbable decorative animation.

## SEO requirements

- One stable canonical URL per article; preserve it indefinitely and 301 redirect any renamed slug.
- Generate `sitemap.xml`, `robots.txt`, canonical metadata, Open Graph image, `Article` / `VideoObject` / `HowTo` schema only when valid for that article.
- Use descriptive URL paths based on the node path. Do not use dated URLs unless date is a primary part of the content.
- Add internal links between related articles where the author chooses them; do not create fake “related” content.
