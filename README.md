# No Brakes — homepage prototype

This is a static prototype with a local content-authoring workflow.

For the live VS Code writing loop, install dependencies once and run:

```powershell
cd src
npm install
npm run dev
```

Open the localhost address printed by Vite on the second monitor. Save a `Content/**/article.md` file and the preview will refresh. See [Content/README.md](Content/README.md).

Use Node.js 22.12.0 or newer (the project pins it in `.nvmrc`). In VS Code, task labels appear under `Ctrl+Shift+P` → **Tasks: Run Task** after opening the `homepage_v1` folder itself.

## What this prototype establishes

- Dark, graphite and sunflower-yellow visual system.
- A persistent, collapsible navigation tree.
- Responsive New and Hot feeds.
- Search and category filters that work entirely in the browser, without an API.
- Article shells that deliberately contain no AI-written technical content.
- Local Markdown + per-node YAML metadata, including preserved publish and updated dates.
- Baseline static-host security headers in `src/public/_headers`.

## Production direction

Cloudflare Pages uses `src/` as the project root and deploys its static `dist/` output from GitHub. No Worker, R2 bucket, image CDN, video CDN, or analytics service is required for the MVP. See [Productionizing No Brakes](Documentation/productionizing.md) for the exact Cloudflare dashboard steps and [architecture requirements](Requirements/05-architecture-and-content.md) for the generated-media contract.

## Licensing

Repository software is available under the [MIT License](LICENSE). Authored website material under `Content/` is separately protected by [Content/COPYRIGHT](Content/COPYRIGHT) and is not licensed for reuse.
