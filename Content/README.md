# Content authoring

Every navigable node gets its own folder. Its `config.yaml` is the canonical metadata; its `article.md` is only the author’s writing. This keeps a node self-contained so its folder can be opened in VS Code or Codex as a focused project.

## Daily writing loop

1. In VS Code, run **No Brakes: live authoring preview** from `.vscode/tasks.json`.
2. Open the localhost address printed in the terminal on the second monitor.
3. Write in `article.md` and save. The preview refreshes; no deploy is involved.
4. Set `published: true` in a node’s `config.yaml` when it is ready. The watcher writes `published_at` once, if empty, and preserves it forever. It also creates `updated_at`.
5. Any later saved `.md` change to a published article updates `updated_at`. The public template only shows it when it differs from `published_at`.
6. Commit and push. The production host’s Git deployment hook builds and publishes the static site. The public site does not update merely because VS Code saved a local file.

## Rules

- Do not manually overwrite `published_at` after the first publish unless correcting an actual mistake.
- `published: false` unpublishes the node without erasing either date.
- `updated_at` is automatic in the local watcher; use it as the actual last modified date, not a marketing “bump.”
- Keep media in the same node folder under `media/`, and data in `data/`.
- `article.md` remains author-owned. This scaffolding provides no generated article copy.

Every node uses `config.yaml`; `_node.yaml` is not used. A node without `article.md` renders as a preview list, while a node with `article.md` renders its authored article.
