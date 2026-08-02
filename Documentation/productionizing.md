# Productionizing No Brakes

This is the operating guide for the site. It is intentionally separate from the product requirements: requirements describe the product; this document describes how code and content safely reach production.

## Chosen stack

- **GitHub** is the source of truth and review gate.
- **Cloudflare Pages** hosts the built static site on its CDN.
- **Cloudflare Stream** serves the short looping video clips with adaptive bitrate playback. Do not self-host multiple video renditions or use YouTube for these clips.
- **Cloudflare Images backed by R2** serves responsive thumbnails/photos. R2 also stores downloadable source data and originals; it is not the video transcoder.

This keeps the site static, avoids a server/database, and concentrates billing in one provider. R2 Standard is currently $0.015/GB-month with no egress charge, and its first 10 GB-month is included. Cloudflare Images' free tier includes 5,000 unique transformations per month. Stream is metered by stored and delivered minutes, so it needs an explicit budget ceiling. See [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [Images pricing](https://developers.cloudflare.com/images/pricing/), and [Cloudflare billing](https://developers.cloudflare.com/billing/understand/how-billing-works/).

## One-time account setup

1. Create a Cloudflare account with a payment method and add the production domain there. Enable MFA and keep recovery codes outside the repository.
2. Create a Pages project named `no-brakes` (or choose another stable name). The workflow deploys the generated `dist/` directory using `wrangler pages deploy`, the documented static deploy command. Do not connect Pages' own Git integration; GitHub Actions is the one deployment authority. [Pages deploy command](https://developers.cloudflare.com/workers/wrangler/commands/pages/)
3. Create an R2 bucket named `no-brakes-media` for original photos, thumbnails, and downloads. Use a custom public media hostname only for approved derived public assets; keep originals private.
4. Enable Cloudflare Images with R2 as the source for public images. Store a single decent-quality original and request responsive variants at delivery time.
5. Enable Stream. Upload each <30-second clip to Stream and place its Stream UID in the node config. The site player should loop, expose native pause/scrub controls, and use Stream's HLS adaptive playback.
6. In Cloudflare Billing, set a **$50/month** budget ceiling. Create notifications at **$25, $40, and $50**. Also set product-specific Stream usage notifications below the $50 limit because usage-based charges bill after the measured period.

## GitHub protection and release flow

1. Push this workflow once. On GitHub, open **Settings → Rules → Rulesets**, target `main`, and require pull requests.
2. Require the `quality` status check, require the branch to be up to date, require resolved conversations, block force pushes and deletion, and restrict direct pushes. GitHub requires successful checks before a protected branch can merge. [GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
3. As a solo maintainer, do **not** require an approving review: GitHub cannot self-approve it. Keep an intentional administrator bypass for emergencies, but use it sparingly.
4. Add a GitHub Environment named `production`. Require a manual approval there if you want a deliberate release pause; otherwise leave it unrestricted for automatic deployment after a merge.
5. Create a Cloudflare API token scoped only to the Pages project (and, once media synchronization is enabled, the specific R2 bucket / Stream account). Store it as `CLOUDFLARE_API_TOKEN`; add `CLOUDFLARE_ACCOUNT_ID` as a secret and `CLOUDFLARE_PAGES_PROJECT` as an environment variable. Never commit credentials or `.dev.vars`.

The committed workflow runs `npm ci`, content validation, JS/TS linting, Markdown linting, type-checking, and the production build for every PR to `main`. A successful push to `main` reruns the same checks, then deploys `dist/` to Pages. The `quality` check should be the required GitHub status check. Required checks must pass on the current PR commit. [GitHub status checks](https://docs.github.com/en/enterprise-cloud@latest/pull-requests/reference/status-checks)

## Content contract and local workflow

Run `npm run dev` while editing. It rebuilds the local index and Vite refreshes the browser; it never publishes anything. Before opening a PR, run `npm run check` and `npm run build`.

The validator rejects duplicate/missing IDs, missing parents, incomplete published-node metadata, invalid dates, missing local thumbnail files, and article nodes that have children but do not link to each child. A published node needs `title`, `subtitle`, `thumbnail`, `published_at`, `updated_at`, and valid tags. The initial `published_at` stays immutable; later edits change only `updated_at`.

## Media release discipline

The deploy workflow uploads approved `Content/**/media/**` and `Content/**/data/**` files to R2 before it deploys Pages. Enable it by setting the `CLOUDFLARE_R2_BUCKET` GitHub Environment variable and the two R2 access-key secrets. It only uploads; it never deletes remote media. Before the first public video/image release:

- Put photos/thumbnails in a node's `media/` folder, upload only the approved derivative to R2/Images, and write its public URL/ID back into `config.yaml`.
- Upload video clips to Stream, wait for ready status, then commit the returned Stream UID in the node config. Do not merge an unpublished Stream UID.
- Keep raw GoPro footage and large working files out of Git; retain them locally and/or private R2.
- Keep only approved derivatives in those `media/` and `data/` folders. This prevents CI from blindly publishing raw footage.

## Routine operations

- Open a branch, edit content/code, run `npm run check`, then open a PR to `main`.
- Review the Pages deploy preview or local production build.
- Merge only after `quality` is green. The production job publishes the static site.
- Check Cloudflare billing monthly and after a video-heavy event. Reduce Stream clips/bitrate or pull a clip if usage approaches $40.
- Back up the repository and private R2 originals periodically. The site remains rebuildable from Git plus private media.
