# Productionizing No Brakes: static Cloudflare Pages MVP

This is the launch operating guide for `nobrakes86.com`. It deliberately uses no server, database, Pages Function, R2 bucket, image-transformation service, or video CDN. Cloudflare Pages is still a global CDN: it serves the already-built static site and committed, low-resolution media from its edge network.

The site is premium where readers notice it—fast static pages, responsive layout, accessible native video controls, search, and carefully prepared media—not where a small archive gains little from dynamic infrastructure.

## The decision and its boundaries

- **Cloudflare Pages Free** hosts `dist/` directly from GitHub. Static-asset requests are free and unlimited. [Pages pricing](https://developers.cloudflare.com/pages/functions/pricing/)
- **Cloudflare Free zone** for `nobrakes86.com` provides DNS, TLS, CDN, DDoS protection, Bot Fight Mode, one rate-limit rule, and WAF custom rules. Cloudflare provides unmetered DDoS protection on every plan. [DDoS protection](https://developers.cloudflare.com/ddos-protection/about/)
- `Media/` contains full-resolution local originals and is Git-ignored. `SizedMedia/` contains generated, versioned public derivatives and is committed to Git.
- Images are generated as JPEG with the smallest dimension no larger than 1080px. Videos are generated as H.264/AAC MP4 with the smallest dimension no larger than 480px, at no more than 30fps and no more than 30 seconds long.
- Every deployed static asset must be at or below Cloudflare Pages' 25 MiB per-file limit. [Pages limits](https://developers.cloudflare.com/pages/platform/limits/)

This avoids an attack-driven usage invoice because there are no usage-priced services in the request path. The remaining money is the fixed domain renewal you already chose at Cloudflare Registrar. Do not enable R2, Images Paid, Stream, Argo, Cache Reserve, Workers Paid, or any other usage-priced add-on without revising this guide and the requirements first.

## What not to create in Cloudflare

You do **not** need to create a Worker. A Worker is server-side JavaScript that runs for a request; this site is static and does not need it.

The correct dashboard path is:

1. Open **Compute -> Workers & Pages**.
2. Select **Create application**.
3. Select **Pages**, not Workers.
4. Select **Connect to Git**.

Cloudflare's Pages Git integration documentation uses exactly this path. It connects the repository and performs the Pages build/deploy after a Git push; it does not require a Worker. [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)

## One-time repository setup

Run the following once from the repository root:

```powershell
npm install
```

`npm install` configures this repository's Git hook path. Verify it with:

```powershell
git config --get core.hooksPath
# Expected: .githooks
```

The committed repository layout for a media-bearing entry is:

```text
Content/
  86-challenge/
    2026/
      round-1-thunderhill-east-cyclone/
        config.yaml
        article.md
        Media/                 # full-resolution local originals; ignored by Git
          thumbnail.heic
          lap-01.mov
        SizedMedia/            # generated public derivatives; committed to Git
          .media-manifest.json
          thumbnail.jpg
          lap-01.mp4
```

Use `Media/` only for these author-owned source extensions: `.jpg`, `.jpeg`, `.png`, `.heic`, `.heif`, `.mov`, `.mp4`, `.m4v`, and `.webm`. Do not put sidecars, raw telemetry, or arbitrary working files there.

On every commit, the pre-commit hook:

1. Scans every local `Content/**/Media/` directory.
2. Generates or refreshes its `SizedMedia/` counterpart.
3. Rejects an unsupported or failed conversion.
4. Rejects output over 25 MiB, image output whose smallest dimension exceeds 1080px, video output whose smallest dimension exceeds 480px, video above 30fps, or video longer than 30 seconds.
5. Stages only generated `SizedMedia/` files and their manifest.

The hook never stages the ignored source originals. Run the same operation manually at any time:

```powershell
npm run media:prepare
npm run media:validate
```

`media:prepare` generates current derivatives. `media:validate` validates only committed-style `SizedMedia/` output, so it also works in GitHub Actions and Cloudflare Pages, where local originals do not exist.

## Authoring media

Put the original asset in the node's `Media/` directory, then reference that source path in authored Markdown. The renderer replaces it with its generated public equivalent:

```markdown
![Brake trace at turn-in](./Media/brake-trace.heif)

<video controls loop muted playsinline preload="metadata">
  <source src="./Media/lap-01.mov" type="video/quicktime">
  Your browser does not support this video.
</video>
```

The produced HTML refers to `/media/<node-id>/brake-trace.jpg` and `/media/<node-id>/lap-01.mp4`, never to `Media/`. Use H.264/AAC MP4—not H.265/HEVC—for the generated video: H.264/AAC in MP4 is the practical compatibility target for broad browser playback, while HEVC has material support gaps outside Apple platforms. [MDN codec selection](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API/Codec_selection)

For a preview/banner image, name the original `Media/thumbnail.<extension>`. The generated `SizedMedia/thumbnail.jpg` is automatically used for the preview and article-banner asset. A config may explicitly state the original source for clarity:

```yaml
thumbnail: ./Media/thumbnail.heic
```

Do not hand-edit `SizedMedia/` or its `.media-manifest.json`. Change the source in `Media/`, run `npm run media:prepare`, and commit the generated result. `git status` should show `SizedMedia/` changes but never a `Media/` original.

## Cloudflare Pages deployment: click-by-click

1. Sign in to the Cloudflare account that owns `nobrakes86.com`.
2. Open **Compute -> Workers & Pages -> Create application -> Pages -> Connect to Git**.
3. Choose GitHub, select **Install & Authorize**, and grant the Cloudflare Workers and Pages GitHub App access only to `sauprankul/no_brakes_86_homepage_v1`.
4. Select that repository. Use a project name such as `no-brakes-86` and set **Production branch** to `main`.
5. In build configuration, select **None** for the framework preset. Set:

   | Setting | Value |
   | --- | --- |
   | Build command | `npm ci && npm run check && npm run build` |
   | Build output directory | `dist` |
   | Root directory | leave blank |
   | Node.js version | `22` |

6. Select **Save and Deploy**. Cloudflare reads the repository, runs the build, and publishes the contents of `dist/` to a temporary `*.pages.dev` URL.
7. Open the deployment log. Do not proceed until `npm run check` and `npm run build` both pass there.
8. In the Pages project, open **Custom domains -> Set up a custom domain**. Add `nobrakes86.com`, then add `www.nobrakes86.com` if you want it. Because the domain is registered and DNS-hosted at Cloudflare, accept the record change offered by the dashboard.
9. Choose one canonical hostname (recommend `https://nobrakes86.com`) and configure the other to redirect to it. Verify HTTPS before enabling HSTS.
10. In **Settings -> Builds**, leave `main` as the production branch. Pull requests may receive isolated Pages preview deployments; they still run the production publish gate, so drafts remain absent.

Cloudflare Pages will deploy every merge to `main` through its Git integration. GitHub Actions does not hold a Cloudflare token and does not deploy. This keeps one authoritative deployment path.

## Cloudflare Free security setup

Perform these steps on the `nobrakes86.com` zone, not inside a Worker:

1. Under **Security -> Bots**, enable **Bot Fight Mode** and block AI bots. Bot Fight Mode is available on the Free plan and challenges known simple bots. [Free bot controls](https://developers.cloudflare.com/bots/plans/free/)
2. Under **Security -> WAF -> Custom rules**, create a rule named `MVP: US-only`. Match `not ip.src.country in {"US"}` and choose **Block**. Cloudflare documents this country-allowlist pattern for custom rules. [Country allowlist example](https://developers.cloudflare.com/waf/custom-rules/use-cases/allow-traffic-from-specific-countries/)
3. Under **Security -> WAF -> Rate limiting rules**, use the one Free-plan rule to protect availability. Start with all paths, 100 requests per 10 seconds per IP, and a Managed Challenge. Test normal browsing, then tune only if legitimate readers are challenged. The Free plan has one per-IP rule and a 10-second period. [Rate-limit availability](https://developers.cloudflare.com/waf/rate-limiting-rules/)
4. Keep the site entirely static. Do not add a Pages Function merely to implement geo blocking or analytics; that would make every request consume a Worker quota.

## GitHub quality gate

The committed GitHub Action runs for pull requests to `main` and for pushes to `main`. It runs `npm ci`, content validation, `SizedMedia` validation, JS/TS/Markdown linting, type-checking, tests, coverage, and the production build.

In GitHub, protect `main` with the `quality` status check, current-commit requirement, resolved conversations, blocked force pushes, blocked deletion, and no direct pushes. As the solo owner, do not require a separate approval you cannot grant yourself. GitHub's protected-branch documentation covers the required-check workflow. [Protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

Remove any old Cloudflare API, R2, Pages-project, or R2-access-key secrets/variables from GitHub once the Git-integrated Pages project is proven. They are not needed for this launch architecture.

## Normal release flow

1. Write `article.md` and add full-resolution originals under the entry's ignored `Media/` folder.
2. Run `npm run dev` for the local second-monitor preview. Local preview includes drafts and never publishes.
3. Run `npm run media:prepare`, inspect the low-resolution `SizedMedia/` output, and update the source if it is not good enough.
4. Run `npm run check` and `npm run build`.
5. Commit. The hook regenerates and stages derived media once more as a safety check.
6. Push a branch, open a PR to `main`, and wait for the required `quality` check.
7. Merge to `main`. Cloudflare Pages builds and deploys the exact commit from Git.
8. Check the Pages deployment URL, custom domain, and Security Events after the first deployment.

## Recovery and change control

- A broken Pages deployment leaves the previous production deployment available for rollback in the Pages dashboard.
- Keep original media backed up outside the repository. Git contains only portable public derivatives.
- Revisit this architecture before adding longer/higher-resolution video, runtime image resizing, a contact form, comments, server-side search, analytics collection, or worldwide access. Each changes cost, privacy, or attack-surface assumptions.
- Do not upgrade a plan or turn on a metered service as an emergency reaction. First identify why static Pages Free is insufficient, state the fixed ceiling you accept, and update the requirements and this guide.
