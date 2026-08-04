# Design requirements

## Product position

No Brakes is a durable personal knowledge base for a driver who works on, tests and competes in Toyota 86 / Subaru BRZ platforms. It is not a social feed and it should not look like a generic automotive blog. Its authority comes from primary evidence: the author’s own notes, photos, video, data and links to results.

The audience has two entry points:

1. A returning reader wants the newest published record quickly.
2. A new reader wants a fast, credible route to the strongest and most useful work.

The homepage must therefore provide equal visual weight to `New` and `Hot`, side by side on wide screens and vertically stacked on compact screens.

## Visual direction

- **Ground:** graphite-black (`#121315`), with a deeper black for contrast. It will hold up around video, onboard imagery and technical plots better than pure black.
- **Text:** cool off-white, never bright white at body sizes; subdued steel grays for metadata.
- **Accent:** sunflower yellow (`#F5C748`). Use it for focus, active states, tags only when needed, and primary actions. It references the California plate without turning the site into a yellow-and-black race livery.
- **Typography:** system sans stack in v1. It is fast, legible and avoids third-party font calls. Add a self-hosted typeface only after the visual brand calls for it.
- **Shape:** sharp to modest 6px corners, thin dividers and exposed spacing. Avoid glass-card overload, gradients with no information value, fake gauges, carbon fiber, flames and “speed” effects.

## Layout requirements

- At a viewport aspect ratio of 16:9 or wider, the left navigation is permanently visible: it has no hamburger control or close control. On narrower screens it is hideable, uses a left-chevron close control, and closes when the reader taps or clicks outside it.
- The left navigation supports unlimited archive depth through a compact drill-in view without widening. It uses text-only labels—no preview thumbnails or decorative folder tiles. Only one top-level branch is open. A first click on an entry with children expands that context; a later click on the already-expanded context opens its page. A leaf opens immediately. Keep each expanded path entry as its own parent-styled, indented row; never concatenate path labels or truncate row text. A `^ Collapse` action sits beneath the current expanded entry. Show at most five children and end longer lists with a “See all” link to the parent page.
- The top bar is always visible and contains the global search field and a bright Search action. At 320px wide, the action and its suggestion dropdown remain legible and usable rather than collapsing into a few-character field.
- Desktop layouts must remain calm up to a 32:9 ultrawide viewport: cap reading lines and keep the page centered rather than stretching article prose.
- Article page: a wide, readable main column and a short on-page navigation rail. The rail moves above content on mobile.
- Category page: show the long category title, a category description, filters, then dense visual preview rows.
- List-page subtitles use the same larger type scale as article subtitles. There is a single divider beneath the subtitle before the entry controls or preview list; never stack a header divider and collection divider together.
- Each preview row needs type/date when available, long title, subtitle and right-aligned tag chips. A thumbnail is optional; when present, it must carry meaningful alt text in production. An unpublished preview uses the single red `Unpublished` status and must not repeat the same state as a separate `Draft` date label.
- Markdown tables use a responsive horizontal-scroll container, a thin yellow outer border, thin gray cell dividers, centered cell content, generous cell padding, and a sunflower-yellow header with dark text.
- Empty state is intentional. No fabricated “sample lap analysis” or invented mechanical conclusions are allowed.

## Interaction requirements

- Desktop target: keyboard and pointer navigation; mobile target: a one-handed sidebar toggle and touch targets at least 44 × 44 CSS pixels.
- Keyboard: visible focus indicator, Skip to content link, `Ctrl/Cmd + K` opens search, Escape closes dialogs.
- Motion must be understated and respect `prefers-reduced-motion` when production motion is added.
- Hover is optional enhancement only; never conceal an action behind hover.
- During local development only, the publication control is a compact, pinned top-right toggle that overlays the page without shifting its content. It is red and labeled `Unpublished` when off, green and labeled `Published` when on, and has no separate local-preview status label.
- Breadcrumbs are absent on Home and otherwise show `Home` followed by the complete archive hierarchy. Do not repeat that hierarchy as a separate eyebrow above the page title.

## Content integrity requirement

The UI may provide templates, labels and organizational hints. It must never generate or imply technical findings, repair instructions, lap-time claims, setup recommendations or quotes on the author’s behalf. Every published article body is author-owned source material.
