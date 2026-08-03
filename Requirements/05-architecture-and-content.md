# Architecture and content requirements

## Launch architecture

Launch as a Vite-built static site on **Cloudflare Pages Free**. Use GitHub as the source of truth and Cloudflare Pages Git integration as the only production deployment path. The app must not require a server, database, Pages Function, Worker, R2 bucket, Cloudflare Images, Cloudflare Stream, Bunny, or another runtime CDN service.

Cloudflare Pages serves the generated `dist/` directory as globally cached static assets. Static delivery is deliberately simple: a published site must not invoke server code for page rendering, media selection, geo blocking, search, or analytics. Cloudflare Free WAF custom rules, Bot Fight Mode, and the one available rate-limit rule provide the MVP edge protection.

Cloudflare Pages and GitHub Actions must use Node.js 22.12 or newer. The Pages configuration must pin `NODE_VERSION=22.12.0`; it must set `SKIP_DEPENDENCY_INSTALL=1` and use `npm ci` in the build command so production builds are reproducible from `package-lock.json`.

The website remains portable: static HTML, CSS, JavaScript, Markdown, YAML, and generated public media must be sufficient to rebuild it elsewhere.

The repository root must remain author-focused. `Content/`, `Documentation/`, `Requirements/`, `README.md`, `LICENSE`, `agent.md`, hidden repository configuration, and one `src/` application directory are the only intended root entries. Application HTML/CSS/JS, package manifests, build configuration, public assets, scripts, tests, fixtures, dependency installs, coverage output, and build output live under `src/`. Cloudflare Pages uses `src` as its Root directory and `dist` as its Build output directory. Static host files such as `_headers`, `robots.txt`, `sitemap.xml`, and the web manifest live in `src/public/`; they do not belong at repository root.

## Node authoring model

Everything is an entry in the archive. Every entry directory contains exactly one `config.yaml`; no `_node.yaml`, category-specific metadata file, or separate metadata convention is allowed. `article.md` is optional:

- no `article.md`: render the entry title/subtitle and a preview list of direct children;
- `article.md`: render authored Markdown as article content;
- both article and child folders: render the article first and show the child-search controls beneath it.

`npm run dev` is the local VS Code authoring loop. It includes drafts, rebuilds the content index, refreshes the browser, and updates edited entry timestamps once per minute. It never publishes. The production build includes only `published: true` entries.

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

The repository Git pre-commit hook runs the generator and stages only generated `SizedMedia/` files. CI validates committed `SizedMedia/` without needing the ignored source originals. `npm run media:prepare` performs generation; `npm run media:validate` validates generated output.

Markdown may reference an original using `./Media/<file>`. The Markdown compiler must render the matching deployed `/media/<entry-id>/<generated-file>` URL. Generated HTML must never reference a local `Media/` path. A `Media/thumbnail.*` source generates `SizedMedia/thumbnail.jpg`, which is the default preview and banner image for that entry.

Short clips use native `<video>` playback with visible pause/scrub controls, `playsinline`, `preload="metadata"`, and an accessible text alternative. Autoplay, mute, and loop are opt-in per clip. There is one static rendition for MVP; adaptive delivery is explicitly deferred until its quality benefit warrants a revised cost model.

## Content validation and tests

Published entries must validate title, subtitle, parent, publication state, immutable `published_at`, `updated_at`, tags, thumbnail, thumbnail alt text, and child links from an article to each direct child. A published thumbnail must resolve to generated public media or an intentionally approved external asset.

The required quality gate runs content validation, generated-media validation, JS/TS linting, published-article Markdown linting, type-checking, unit tests, full collection-filter coverage, and a production build. Synthetic fixtures belong in `src/test/testdata/`; feature tests must not depend on production content. The media suite must cover source-to-output mapping, image conversion/resizing, manifest generation, generated-output validation, and Markdown media URL rewriting. A repository-boundary test must enforce both the clean root allowlist and the absence of analytics runtime, collector, middleware, endpoint, CSP allowance, and deployment configuration during MVP.

## Search and information architecture

Search/filter remains static, client-side, and free. Untouched non-article entry pages list direct children. Once a user changes a query or filter, direct and indirect descendants become candidates. Article entries with children show a faint search hint below the article until a criterion becomes active, then show matching direct and indirect descendants.

The public UI uses “entries” and “articles,” never “nodes.” Filters include text, Articles only? (`Any`, `Yes`, `No`), multiple include/exclude tag chips, publication dates, and ordering. The direct-child/default and recursive/active-filter rules retain 100% statement, branch, function, and line coverage against synthetic fixtures.

## Deployment

GitHub Actions is the pull-request quality gate only. It must not hold Cloudflare deployment, R2, analytics, or media-upload credentials. Its npm steps run from `src/`. Cloudflare Pages connects to GitHub, uses `src` as the project root, and builds `main` with:

```text
npm ci && npm run check && npm run build
```

The Pages output directory is `dist`. A merge to `main` creates the production deployment; branches may create preview deployments. The production build respects `published: true`; local authoring preview includes drafts.
