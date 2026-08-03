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

- The left navigation is persistent on desktop and hideable on small screens. It supports unlimited archive depth through a compact drill-in view: only one top-level branch is open, drilling into a child replaces the visible list with that child’s entries, and the label shows the current `Parent / Child` path without widening the sidebar.
- The top bar is always visible and contains the global search field and a bright search action.
- Desktop layouts must remain calm up to a 32:9 ultrawide viewport: cap reading lines and keep the page centered rather than stretching article prose.
- Article page: a wide, readable main column and a short on-page navigation rail. The rail moves above content on mobile.
- Category page: show the long category title, a category description, filters, then dense visual preview rows.
- Each preview row needs a thumbnail, type/date, long title, subtitle and right-aligned tag chips. Thumbnail images must carry meaningful alt text in production.
- Empty state is intentional. No fabricated “sample lap analysis” or invented mechanical conclusions are allowed.

## Interaction requirements

- Desktop target: keyboard and pointer navigation; mobile target: a one-handed sidebar toggle and touch targets at least 44 × 44 CSS pixels.
- Keyboard: visible focus indicator, Skip to content link, `Ctrl/Cmd + K` opens search, Escape closes dialogs.
- Motion must be understated and respect `prefers-reduced-motion` when production motion is added.
- Hover is optional enhancement only; never conceal an action behind hover.

## Content integrity requirement

The UI may provide templates, labels and organizational hints. It must never generate or imply technical findings, repair instructions, lap-time claims, setup recommendations or quotes on the author’s behalf. Every published article body is author-owned source material.
