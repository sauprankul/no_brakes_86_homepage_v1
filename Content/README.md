# Content authoring

Every navigable entry gets its own folder. Its `config.yaml` is canonical metadata; `article.md` is only the author's writing. This keeps an entry self-contained so its folder can be opened in VS Code or Codex as a focused project.

## Daily writing loop

1. In VS Code, run **No Brakes: live authoring preview** from `.vscode/tasks.json`.
2. Open the localhost address printed in the terminal on the second monitor.
3. Write in `article.md` and save. The preview refreshes; no deploy is involved.
4. Set `published: true` in an entry's `config.yaml` when it is ready. The watcher writes `published_at` once, if empty, and preserves it forever. It also creates `updated_at`.
5. Any later saved `.md` change to a published article updates `updated_at`. The public template shows it only when it differs from `published_at`.
6. Commit and push. Cloudflare Pages builds and publishes the static site from Git. The public site does not update merely because VS Code saved a local file.

## Media workflow

Put full-resolution originals in the entry's ignored `Media/` folder. Before committing, run `npm run media:prepare` from `src/` (the pre-commit hook also does this). It creates a committed `SizedMedia/` folder containing only public JPEG/MP4 derivatives that Cloudflare Pages deploys.

Reference the original path in Markdown, for example `![Apex](./Media/apex.heic)` or `<source src="./Media/lap.mov">`. The rendered site automatically uses the corresponding `SizedMedia/` asset. Use `Media/thumbnail.<extension>` for the preview/banner image. Never hand-edit `SizedMedia/`; edit the original and regenerate it instead.

## Rules

- Do not manually overwrite `published_at` after the first publish unless correcting an actual mistake.
- `published: false` unpublishes the entry without erasing either date.
- `updated_at` is automatic in the local watcher; use it as the actual last-modified date, not a marketing bump.
- Keep full-resolution photo/video originals under `Media/`, generated public derivatives under `SizedMedia/`, and intentionally public documents under `Downloads/`.
- `article.md` remains author-owned. This scaffolding provides no generated article copy.

Every entry uses `config.yaml`; `_node.yaml` is not used. A folder without `article.md` renders as a preview list, while a folder with `article.md` renders its authored article.
