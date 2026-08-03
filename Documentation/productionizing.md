# Productionizing No Brakes: zero-variable-spend MVP

This is the operating guide for the site's first public release. It is deliberately stricter than a $50 alert budget: production must have **zero ability to create an unapproved usage charge**. Running out of the free allowance may take the site offline; it must never result in an overage invoice.

This guide is authoritative for launch hosting and replaces the earlier Cloudflare Pages/R2/Images/Stream recommendation. Requirements describe the product; this document describes how code and content safely reach production.

## Decision

Host the static site on **Netlify Free**, using a new, dedicated Netlify team that contains only this site. The Free plan has 300 monthly credits, does not offer auto-recharge, and pauses a project that reaches its credit hard limit instead of charging overage. Netlify currently prices a production deployment at 15 credits, bandwidth at 20 credits per GB, and web requests at 2 credits per 10,000. See [Netlify pricing](https://www.netlify.com/pricing/) and its [credit-limit policy](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/).

This is the only launch design that satisfies the hard constraint. Its downside is intentional: a bot attack can exhaust free credits and leave the site paused until the next monthly reset. It can cause an outage, but cannot create an unbounded bill.

Do not use Cloudflare's metered R2, Images, Stream, Workers, or paid Pages-adjacent products for this launch. Usage notifications are not spending caps. Do not use Vercel Hobby for this site: it is restricted to non-commercial personal use, which is an unnecessary constraint for a personal brand. Do not use GitHub Pages as the public host: its bandwidth limit is a soft limit, not a hard spending control.

## Non-negotiable guardrails

1. Create a **new Netlify team** solely for `no-brakes`. Never put another site in it: exhausting the allowance pauses every project in that team.
2. Keep the team on **Free**. Do not add a payment method, paid credit pack, add-on, or auto-recharge mechanism. Recheck this before every provider-account change.
3. Treat the monthly production hosting budget as **$0 variable spend**, not $50. A custom domain registration is a separate fixed renewal cost and should be managed at the registrar, not through a usage-priced hosting service.
4. Enable Netlify's included firewall traffic rules and basic rate limiting. Block obvious abusive traffic before it consumes credits.
5. Enforce the existing MVP legal boundary at the edge: serve only requests whose country is `US`; return an access-denied response everywhere else. Netlify Edge Functions expose `context.geo.country.code` for this purpose. [Edge Functions API](https://docs.netlify.com/build/edge-functions/api/)
6. Keep the geo-block function tiny, deterministic, and free of external calls. It runs on requests and therefore consumes the same capped allowance; that is acceptable because the cap is hard.
7. Do not enable custom analytics, a metered analytics backend, or Cloudflare Analytics Engine for the zero-spend MVP. Development must never emit analytics. Revisit analytics only with an explicitly approved fixed-cost plan and updated privacy requirements.

## Media policy: choose zero spend over native adaptive video

The previous requirement for directly served, adaptive, looping short clips is not compatible with a guaranteed-zero-spend public launch. Direct video delivery is bandwidth usage, and a metered video CDN reintroduces billing risk; storing the renditions on Netlify can simply exhaust the capped allowance quickly.

- Embed public video from YouTube, including short clips. It keeps delivery outside the site's hosting allowance and avoids a media-CDN account. Use the existing Markdown embed syntax rather than uploading clips to the deployment.
- Keep repository-hosted images modest and optimized. Thumbnails are the priority; reject raw GoPro footage, originals, and large galleries from the production build.
- Keep downloads to small documents/data files only. A large download can consume the same allowance as an attack.
- Do not configure R2, Cloudflare Images, Cloudflare Stream, or a media synchronization job. Preserve source footage locally or in a separately approved private archive; it is not production infrastructure.

If native adaptive video becomes essential, the constraint must change first: choose a provider with a pre-funded, fixed-price contract whose maximum liability is explicitly acceptable. Do not solve that later with billing alerts.

## One-time account and deployment setup

1. Create the isolated Netlify team, choose the Free plan, enable MFA, and save recovery codes outside the repository.
2. Confirm its billing screen shows the 300-credit hard limit and no payment/auto-recharge path. Record a monthly calendar reminder to confirm this remains true after Netlify account changes.
3. Connect the GitHub repository with the Netlify GitHub App. Set `main` as the production branch and enable Git-based production deploys only from that branch. Netlify deploys the configured production branch after each merge. [Netlify Git deployment configuration](https://docs.netlify.com/manage/sites/how-to/create-deploys/#deploy-with-git)
4. Configure the build command as `npm ci && npm run check && npm run build`; publish directory is `dist`. A failed check must prevent deployment.
5. Add the US-only Edge Function and route it to `/*` before sharing the production URL. Verify a US request succeeds and a non-US request receives the configured denial response. Also test production previews: no environment may bypass the launch geo policy accidentally.
6. Add firewall rules and rate limits before launch. Start conservatively, test normal browsing/search, then tighten rules based on logs and the site's low expected request rate.
7. Point the custom domain at Netlify only after the production build and US-only checks pass. Netlify provides managed TLS for the connected domain.

GitHub Actions remains the review and quality authority; Netlify is the deployment executor. Do not store a deployment token in GitHub Actions for this MVP. GitHub's pull-request workflow validates the proposed commit, and the Netlify Git integration deploys only the merge to `main`.

## GitHub protection and release flow

1. In GitHub **Settings -> Rules -> Rulesets**, protect `main`: require a pull request, require the `quality` check, require the branch to be up to date, require resolved conversations, block force pushes and deletion, and restrict direct pushes. [GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
2. As a solo maintainer, do not require an approving review: GitHub cannot self-approve it. Keep an intentional administrator bypass for emergencies, but use it sparingly.
3. Make the GitHub `quality` workflow the only required check. It must run `npm ci`, `npm run check`, and `npm run build` for every PR to `main`.
4. Remove the former Cloudflare deploy and media-upload jobs/secrets before enabling Netlify production. A merge to `main` must have exactly one deployment path: Netlify's Git integration.
5. Limit production merges. Each production deployment costs 15 credits, so the empty-site allowance permits at most 20 deployments per month before traffic and requests. Squash coherent changes, avoid cosmetic production deploys, and do not enable public preview URLs unless they are also protected by the same access policy.

The release sequence is: branch -> PR -> required `quality` passes -> merge to `main` -> Netlify build/check -> Netlify production deploy. A Netlify build failure leaves the prior deployment live; it must be repaired through another validated merge.

## Content contract and local workflow

Run `npm run dev` while editing. It rebuilds the local index and Vite refreshes the browser; it never publishes anything. Before opening a PR, run `npm run check` and `npm run build`.

The validator rejects duplicate/missing IDs, missing parents, incomplete published-node metadata, invalid dates, missing local thumbnail files, and article nodes that have children but do not link to each child. A published node needs `title`, `subtitle`, `thumbnail`, `published_at`, `updated_at`, and valid tags. The initial `published_at` stays immutable; later edits change only `updated_at`.

## Operations and incident response

- Watch Netlify credit consumption and deployment count, but treat the dashboard as availability monitoring, not billing protection. Suggested notices: 50%, 75%, and 90% of credits used.
- If credits are low, pause nonessential merges, remove unusually heavy static assets, and tighten firewall/rate-limit rules. Do not add payment details to restore service.
- If the hard limit is reached, the correct outcome is a paused site until the allowance resets. Document the incident, identify traffic/assets responsible, and fix them before reopening.
- Keep the repository backed up. The public site must remain rebuildable from Git plus locally retained source media.
- Re-evaluate the architecture before changing any Free-plan assumption, adding media delivery, enabling analytics, expanding beyond the US, or accepting a paid plan. Each of those changes can invalidate the zero-variable-spend guarantee.
