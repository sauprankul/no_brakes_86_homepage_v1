# Architecture and content requirements

## Recommendation

Use **Astro in static-output mode** for the production build, with local Markdown/MDX content and a small amount of vanilla TypeScript for navigation/filter interactions. Astro is the best fit here because the website is content-heavy, public, mostly static and needs almost no client-side application state. It does not require React: the public article path can compile to static HTML and only interactive islands ship JavaScript.

Astro’s content collections support local structured content, schema validation and static route generation, making it a natural migration from this prototype’s metadata. [Astro’s content collection documentation](https://docs.astro.build/en/guides/content-collections/) recommends build-time collections for performance-critical, relatively static content and documents local Markdown/MDX loaders.

Do not use a traditional CMS or database at launch. Git + local authoring files are cheaper, versioned, portable and let each subcategory be opened as its own fully contextualized Codex project.

## Authoring layout now

The current scaffold uses the `Content/` tree as the source of truth and a tiny Vite dev server for the second-monitor writing loop. Vite is only the local preview/build tool for the current static prototype; it is not a client framework. The source tree is intentionally portable to Astro when the production shell replaces this prototype.

Everything is a node. Every node directory has exactly one `config.yaml`; there is no `_node.yaml`, `_index.md`, or separate category metadata convention. A node without `article.md` renders as a preview/index page showing its child previews. A node with `article.md` renders the authored article, followed by child previews when present. A node may have both. The presence of `article.md`, not a metadata type field, is the default article switch.

```text
homepage_v1/
├─ Content/
│  ├─ blog/
│  │  ├─ config.yaml
│  │  └─ why-go-to-the-track/
│  │     ├─ config.yaml
│  │     ├─ article.md
│  │     ├─ media/
│  │     └─ data/
│  ├─ engine-rebuild/
│  │  ├─ config.yaml
│  │  └─ gr86-engine-blew/
│  └─ README.md
├─ scripts/
│  ├─ build-content-index.mjs     # creates public/content-index.json
│  └─ dev.mjs                     # runs the content watcher + Vite
├─ .vscode/tasks.json
```

Run `npm install` once, then `npm run dev` (or VS Code task **No Brakes: live authoring preview**). Save Markdown in VS Code and the browser preview refreshes. Saving locally never changes the public site: the production update is an automatic static deployment after commit/push to the connected Git repository.

## Recommended production repository layout

```text
no-brakes/
├─ src/
│  ├─ components/                 # Visual components only
│  ├─ layouts/                    # Base, article and collection layouts
│  ├─ pages/
│  │  ├─ index.astro
│  │  ├─ search.astro
│  │  └─ [...slug].astro          # Node/article resolver
│  ├─ content/
│  │  └─ archive/
│  │     ├─ engine-rebuild/
│  │     │  ├─ config.yaml
│  │     │  └─ gr86-engine-blew/
│  │     │     ├─ config.yaml
│  │     │     ├─ article.md
│  │     │     ├─ media/
│  │     │     └─ data/
│  │     └─ track-guides/
│  ├─ content.config.ts
│  └─ styles/
├─ public/
│  ├─ _headers
│  ├─ robots.txt
│  └─ favicon.svg
├─ Requirements/
└─ scripts/                       # validation, image manifest, link checks
```

Every directory is a node. `config.yaml` describes it; `article.md` is optional authored prose. Any directory can hold both its article and child folders, satisfying the “category and article” requirement.

## Node config contract

```yaml
node_type: article
id: gr86-engine-blew
parent: "engine-rebuild"
published: false
published_at: null # filled once when published becomes true
updated_at: null # maintained by the local content watcher
content_type: series
tags: [engine, rebuild, gr86]
featured: hot # omitted when not Hot
thumbnail: ./media/thumbnail.jpg
thumbnail_alt: "Author-written description of the image"
stream_uid: "optional-managed-video-id"
downloads:
  - label: "Data log"
    file: ./data/example.csv
    mime: text/csv
    published_at: 2026-07-24
```

Schema validation must reject unrecognized tags only if the tag taxonomy is intentionally closed. Otherwise, allow new tags but lint case and duplicates.

## Search design

- Search at build time with Pagefind after `astro build`; no API, vector store or AI provider.
- Put `data-pagefind-body` on article prose and expose date/type/tag as structured filters.
- The project’s own documents explain that Pagefind produces a static search bundle for any static HTML output and supports custom metadata sorting/filtering. [Pagefind search API](https://pagefind.app/docs/api/)
- Ship a lightweight fallback of title/subtitle/tag matching for situations where the index has not loaded.
- A search query can have no personal-data logging at all. If logging is later desired, count normalized query terms only after evaluating privacy impact.

## Short video delivery

For clips below 30 seconds, use **Cloudflare Stream**, not YouTube embeds and not a hand-built CDN/transcoding pipeline. Upload through its dashboard, use its HLS/DASH stream in a native or thin custom player, and it handles encoding, adaptive bitrate and edge delivery. Cloudflare documents 360p–1080p automatic adaptive playback, so a mobile device can receive an appropriate rendition without you exporting a separate asset manually. [Cloudflare Stream overview](https://developers.cloudflare.com/stream/) and [video delivery guide](https://developers.cloudflare.com/use-cases/media-streaming/video-delivery/) describe this managed path.

At current published pricing, Stream storage is bought in $5 increments per 1,000 stored minutes and delivery is $1 per 1,000 delivered minutes; ingress and encoding are included. This is comfortably compatible with a $50 monthly ceiling for a modest personal archive, provided usage alerts are configured. [Cloudflare Stream pricing](https://developers.cloudflare.com/stream/pricing/)

R2 is viable for original files and CSV/AIM downloads: it includes 10 GB-month storage and 10 million Class B reads per month, with no egress charge, but it does **not** do adaptive video encoding by itself. Use R2 + Cloudflare Images for photographs; Images can optimize responsive image variants without storing manual copies. [R2 pricing](https://developers.cloudflare.com/r2/pricing/) and [Cloudflare Images overview](https://developers.cloudflare.com/images/) document the current limits and behavior.

## Operational guide

The release process, provider setup, budget controls and branch protection live in [Productionizing No Brakes](../Documentation/productionizing.md). They are operational choices, not product requirements.
