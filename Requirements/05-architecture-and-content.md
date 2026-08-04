# Architecture and content requirements

## Launch architecture

Launch as a Vite-built static site on **Cloudflare Pages Free**. Use GitHub as the source of truth and Cloudflare Pages Git integration as the only production deployment path. The app must not require a server, database, Pages Function, Worker, R2 bucket, Cloudflare Images, Cloudflare Stream, Bunny, or another runtime CDN service.

Cloudflare Pages serves the generated `dist/` directory as globally cached static assets. Static delivery is deliberately simple: a published site must not invoke server code for page rendering, media selection, geo blocking, search, or analytics. Cloudflare Free WAF custom rules, Bot Fight Mode, and the one available rate-limit rule provide the MVP edge protection.

Cloudflare Pages and GitHub Actions must use Node.js 22.12 or newer. The Pages configuration must pin `NODE_VERSION=22.12.0`; it must set `SKIP_DEPENDENCY_INSTALL=1` and use `npm ci` in the build command so production builds are reproducible from `package-lock.json`.

The website remains portable: static HTML, CSS, JavaScript, Markdown, YAML, and generated public media must be sufficient to rebuild it elsewhere.

The repository root must remain author-focused. `Content/`, `Documentation/`, `Requirements/`, `README.md`, `LICENSE`, `agent.md`, hidden repository configuration, and one `src/` application directory are the only intended root entries. Application HTML/CSS/JS, package manifests, build configuration, public assets, scripts, tests, fixtures, dependency installs, coverage output, and build output live under `src/`. Cloudflare Pages uses `src` as its Root directory and `dist` as its Build output directory. Static host files such as `_headers`, `robots.txt`, `sitemap.xml`, and the web manifest live in `src/public/`; they do not belong at repository root.

## Node authoring model

The production build assembles generated media and the production-only content index in a temporary public-asset staging directory. It never mutates the draft-inclusive `public/` directory used by an active authoring preview, so local authoring and a production build can run at the same time without file locks or mixed draft assets.

Everything is an entry in the archive. Every entry directory contains exactly one `config.yaml`; no `_node.yaml`, category-specific metadata file, or separate metadata convention is allowed. `article.md` is optional:

- no `article.md`: render the entry title/subtitle and a preview list of direct children;
- `article.md`: render authored Markdown as article content;
- both article and child folders: render the article first and show the child-search controls beneath it.

`npm run dev` is the local VS Code authoring loop. It includes every entry regardless of publication state, gives every unpublished navigation entry a red draft highlight, rebuilds the content index, refreshes the browser, and updates edited entry timestamps once per minute. Its local-only Vite middleware may toggle any current entry’s `published` value and persist the required timestamps; it also atomically patches that exact entry in the generated browser index before responding so nested entries cannot remain visually stale. It is bound to local development and is absent from the static build. The production build includes only `published: true` entries. If zero entries are published, the generated index and rendered public UI are empty rather than substituting prototype data.

During `npm run dev`, application console output, warnings, errors, uncaught browser exceptions, and unhandled promise rejections must be mirrored to the same authoring terminal with a browser-source prefix. Browser-only failures must never be discoverable solely through developer tools. The log bridge and its local endpoint are development-only and are absent from production behavior.

The generated index assigns every entry a title-derived path built from its complete parent hierarchy. The browser independently derives the same path from entry titles and parent relationships when a generated path is absent, so a stale local index cannot turn a hierarchy link into an unmatched flat URL. The browser router resolves that path to one entry and chooses article or preview-list rendering solely from the generated `hasArticle` value, which itself comes only from the presence of `article.md`. Cloudflare Pages' SPA fallback serves `index.html` for direct requests to these hierarchy paths.

## Media contract

Each entry may contain these sibling directories:

```text
entry/
  config.yaml
  article.md
  Media/                     # local, full-resolution author originals; Git-ignored
  SizedMedia/                # generated public derivatives; committed
    .media-manifest.json
  Downloads/                 # intentional public documents, governed separately
```

`Media/` is the only source directory for photo/video originals. It is intentionally excluded from Git. `SizedMedia/` is deterministic build input and must be committed so a Cloudflare Pages Git build can deploy the same media the author reviewed locally.

The media generator accepts only `.jpg`, `.jpeg`, `.png`, `.heic`, `.heif`, `.mov`, `.mp4`, `.m4v`, and `.webm` source files. It generates:

- JPEG images, preserving orientation and aspect ratio, with the smaller dimension at most 1080px. PNG, HEIC, and HEIF are converted to JPEG; JPEG sources are recompressed to the same public format.
- H.264/AAC MP4 videos, preserving orientation and aspect ratio, with the smaller dimension at most 480px and frame rate at most 30fps. H.265/HEVC is not a launch target because broad browser support is less reliable.
- Output files with the same relative basename as the source, but `.jpg` or `.mp4` extension, plus a generated manifest that records source/output mapping and source hash.

The generator must reject unsupported input, name collisions after conversion, unconvertible media, video longer than 30 seconds, image/video dimensions above the generated limits, frame rate above 30fps, or any output above Cloudflare Pages' 25 MiB file limit. It must never silently truncate, discard, or publish a source file.

During `npm run dev`, the content watcher runs the generator before rebuilding the rendered index so new or changed originals become available in the live authoring preview. The watch build updates generated media and downloads incrementally and must never delete the complete live `public/media` tree before rebuilding the index; Windows file contention must not abort the index refresh or leave stale publication state. Missing optional source directories are ignored, but real scan/copy failures are propagated to the authoring terminal. A production build continues to use an isolated clean staging tree. The repository Git pre-commit hook also runs the generator and stages only missing or changed generated `SizedMedia/` files. CI validates committed `SizedMedia/` without needing the ignored source originals. `npm run media:prepare` performs generation; `npm run media:validate` validates generated output.

Markdown may reference an original using `./Media/<file>`. The Markdown compiler must render the matching deployed `/media/<entry-id>/<generated-file>` URL. Generated HTML must never reference a local `Media/` path. A `Media/thumbnail.*` source generates `SizedMedia/thumbnail.jpg`, which is used as that entry’s optional preview and banner image.

Short clips use native `<video>` playback with visible pause/scrub controls, `playsinline`, `preload="metadata"`, and an accessible text alternative. Autoplay, mute, and loop are opt-in per clip. There is one static rendition for MVP; adaptive delivery is explicitly deferred until its quality benefit warrants a revised cost model.

## Content validation

Published articles must validate title and subtitle; a published index entry validates title plus either subtitle or description. Published entries also validate parent when present, publication state, immutable `published_at`, `updated_at`, optional tags, and child links from an article to each direct child. A numeric YAML tag such as `2026` is valid and is normalized to display/search text. Every non-null `published_at` and `updated_at`, including a retained timestamp on an unpublished entry, must be a complete ISO 8601 timestamp with a `Z` or numeric offset. A thumbnail is optional; when configured, it must resolve to generated public media or an intentionally approved external asset and include appropriate alt text.

The pull-request quality gate validates published content and generated media, lints the application and published Markdown, type-checks, and produces a production build.

## Search and information architecture

Search/filter remains static, client-side, and free. Untouched non-article entry pages render every direct child as a preview row. Once a user changes a query or filter, direct and indirect descendants become candidates. Published entries take precedence within every selected sort; an unpublished preview shows a red `Unpublished` tag. Article entries with children show a faint search hint below the article until a criterion becomes active, then show matching direct and indirect descendants.

The content compiler extracts searchable text by rendered element (`h1`–`h6`, paragraph, list item, blockquote, caption, and table cell) on every authoring index refresh. The production pipeline creates Pagefind input documents from published article HTML at each entry's canonical hierarchical URL after Vite emits `dist/`, writes the static Pagefind bundle into `dist/pagefind/`, and ships no search server. The client loads that bundle lazily only for a full production search. Pagefind's required WebAssembly and worker directives must remain in the production CSP.

The sidebar is a compact, one-branch-at-a-time drill-in navigator. It lists only direct children of the current sidebar context, supports unlimited entry depth, wraps each path entry in its own indented row, and offers an explicit Collapse action. Opening a different top-level branch collapses the previously opened one.

The public UI uses “entries” and “articles,” never “nodes.” Filters include text, Articles only? (`Any`, `Yes`, `No`), multiple include/exclude tag chips, publication dates, and ordering.

## Deployment

GitHub Actions is the pull-request quality gate only. It must not hold Cloudflare deployment, R2, analytics, or media-upload credentials. Its npm steps run from `src/`. Cloudflare Pages connects to GitHub, uses `src` as the project root, and builds `main` with:

```text
npm ci && npm run check && npm run build
```

The Pages output directory is `dist`. A merge to `main` creates the production deployment; branches may create preview deployments. The production build respects `published: true`, rebuilds Pagefind from only that published snapshot, and local authoring preview includes drafts.
