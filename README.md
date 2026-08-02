# No Brakes — homepage prototype

This is a static prototype with a local content-authoring workflow.

For the live VS Code writing loop, install dependencies once and run:

```powershell
npm install
npm run dev
```

Open the localhost address printed by Vite on the second monitor. Save a `Content/**/article.md` file and the preview will refresh. See [Content/README.md](Content/README.md).

## What this prototype establishes

- Dark, graphite and sunflower-yellow visual system.
- A persistent, collapsible navigation tree.
- Responsive New and Hot feeds.
- Search and category filters that work entirely in the browser, without an API.
- Article shells that deliberately contain no AI-written technical content.
- Local Markdown + per-node YAML metadata, including preserved publish and updated dates.
- Baseline static-host security headers in `_headers`.

## Production direction

The production project should move the metadata currently at the top of `app.js` into local Markdown/MDX content collections in Astro. See [Requirements/05-architecture-and-content.md](Requirements/05-architecture-and-content.md) for the recommended folder and frontmatter model.

Before publishing, replace both `YOUR-DOMAIN.example` entries, add an icon, and test the final CSP against the actual YouTube and analytics domains in use.
