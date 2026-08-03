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

Cloudflare Pages deploys the static `dist/` output from GitHub. No Worker, R2 bucket, image CDN, or video CDN is required for the MVP. See [Productionizing No Brakes](Documentation/productionizing.md) for the exact Cloudflare dashboard steps and [architecture requirements](Requirements/05-architecture-and-content.md) for the generated-media contract.
