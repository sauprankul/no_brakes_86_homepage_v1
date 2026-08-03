# Repository agent guidance

## Scope

This repository is a static, Markdown-authored personal archive. Preserve the `Content/` source-of-truth model, keep `config.yaml` as the metadata contract for every entry, and keep production builds publish-gated. `Media/` holds ignored author originals; its deterministic, committed `SizedMedia/` counterpart is the only media that production serves. Do not commit author workspaces such as `Downloads/` or `Media/`.

Repository software is MIT-licensed. Authored material under `Content/` is all-rights-reserved under `Content/COPYRIGHT`; never treat that material as covered by the software license.

## Assumption and scope discipline

Before acting on a user request, stop and explicitly push back when the request appears to rest on a factual misunderstanding, contradicts an earlier requirement without acknowledging the tradeoff, or materially expands cost, complexity, security, privacy, or operational risk. Explain the concrete conflict, correct the misunderstanding with evidence where possible, and ask for direction before changing the repository. Do not silently implement a risky or expensive interpretation just because it is technically possible.

## Verification before handoff

Run commands from `src/`. Run the relevant quality gates before handing off implementation work. For content, rendering, or UI changes, run `npm run check` and `npm run build`. If the change affects authoring latency, run `npm run benchmark:refresh`. Preserve unrelated author edits and call them out rather than overwriting them.

## PR format rules

Every pull request from a development branch into `main` must follow these rules:

1. The title starts with a semantic tag such as `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, or `perf:`.
2. The remainder of the title is impact-driven: describe the user, authoring, reliability, performance, or deployment outcome. Prefer `feat(content): make authored Markdown render in production` to an implementation-only title such as `Add compiler.js`.
3. The description is a net snapshot of the proposed end state. It must not narrate the winding path taken on the branch, list abandoned approaches, or describe intermediate failures.
4. The description must contain a complete changelog of the final diff, grouped by user-visible behavior, authoring/content model, validation/testing, operations/deployment, and documentation/requirements as applicable.
5. Include verification commands and their results, plus any explicit follow-up configuration that cannot be completed from the repository alone.
6. Do not claim that a PR is ready if required checks are failing, the branch is dirty, or unrelated author edits are silently included.

## PR description template

```markdown
## Outcome

<One paragraph describing the impact of the final state.>

## Changelog

### User-visible behavior
- ...

### Authoring/content
- ...

### Validation/testing
- ...

### Operations/deployment
- ...

### Documentation/requirements
- ...

## Verification

- `npm run check` — pass
- `npm run build` — pass

## Follow-up

- <Only external setup or intentionally deferred work.>
```
