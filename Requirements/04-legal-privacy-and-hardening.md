# Legal, privacy and hardening requirements

This is a product requirement checklist, not legal advice. Get counsel for jurisdiction-specific privacy, copyright, sponsorship, competition and motorsport liability questions before public launch.

## Regional launch scope, privacy and retention

This is a temporary **US-only MVP**. The production edge must block every request whose country is not `US`, including unknown country values. Use the zone-wide Cloudflare WAF rule documented in the production guide; do not add Pages middleware or a Worker for geo-blocking. Do not remove the WAF rule until the applicable regional launch checklist below has been approved and tested against both the custom domain and the `pages.dev` URL. Country is an imperfect network-location signal, not proof of residence or a substitute for legal analysis.

- Default posture: do not intentionally collect visitor data. The MVP has no accounts, user profiles, marketing pixels, behavioral advertising, analytics client, analytics collector, cookies, device identifiers, or application database.
- All analytics-specific legal, notification, consent, opt-out, collection, retention, provider, and regional-policy requirements are deferred until after MVP. Analytics must remain absent—not merely disabled by configuration—until a new reviewed proposal explicitly supersedes this requirement.
- Do not promise that the site is “globally compliant” or that network requests are “anonymous.” Cloudflare and other infrastructure providers may process request metadata needed to deliver and secure the site even though the application intentionally stores no visitor telemetry.
- Keep any provider operational logs only as long as required for delivery, abuse prevention, or incident investigation. Restrict account access to the owner and use the shortest practical retention available on the selected free plan.

### United States — allowed for the MVP

- No analytics consent banner, analytics opt-out, or analytics settings UI is required while analytics is absent. Do not sell, share, profile, or target advertising to readers, and do not condition ordinary articles on visitor-data collection.
- Before launch and annually thereafter, document whether the operator meets the then-current thresholds of California and other applicable US state privacy laws. If a law applies to the site or a future feature begins collecting covered information, implement the required notices and rights processes before that feature launches. [California Attorney General CCPA guidance](https://oag.ca.gov/privacy/ccpa)
- Do not knowingly collect from children or build a child-directed experience without a separate COPPA review.

### Canada — deferred and blocked

- Canadian (`CA`) requests are blocked for this rollout. Do not claim that blocking alone resolves every Canadian obligation; reassess CDN/provider processing and applicable federal/provincial law before launch there.
- Any later Canadian analytics proposal remains part of the post-MVP analytics project and requires a current PIPEDA/provincial-law assessment before collection begins. [Office of the Privacy Commissioner of Canada](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/p_principle/principles/p_consent/)

### Mexico — deferred and blocked

- Mexican (`MX`) requests are blocked for this rollout.
- Before a Mexican release, obtain Mexico-specific advice on the current Federal Law on Protection of Personal Data Held by Private Parties, publish the required Spanish privacy notice identifying controller, purposes, transfers and retention, and provide a process for ARCO rights (access, rectification, cancellation and opposition) and any required consent/objection choice. [Current federal law text](https://www.diputados.gob.mx/LeyesBiblio/ref/lfpdppp.htm)

### European Union and United Kingdom — deferred and blocked

- EU/EEA and UK requests are blocked for this rollout.
- Before enabling either region, complete a jurisdiction-specific ePrivacy/GDPR or PECR/UK GDPR review. Any later analytics proposal remains part of the post-MVP analytics project and must define notice, consent/refusal, withdrawal, collection, and retention behavior before implementation. [CNIL audience-measurement guidance](https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience) and [GDPR transparency/minimisation rules](https://eur-lex.europa.eu/eli/reg/2016/679/oj) are baseline references.

### All other countries — deferred and blocked

- Treat every non-US country not named above as deferred: access is blocked and no market-specific claim is made. A future regional release requires a current review before loosening the US-only WAF rule.
- Do not put personal contact details, exact private addresses, keys, credentials, license plates, event attendee information or unpublished telemetry in public source files, images or downloadable data.
- Add a concise privacy notice before production launch; publish a contact path for privacy requests.

## Copyright, attribution and disclosures

- License repository software under MIT while reserving all rights in the authored `Content/` tree. Keep the root `LICENSE`, `Content/COPYRIGHT`, README licensing summary, and package metadata consistent. Do not imply that the MIT software license grants permission to reuse prose, images, video, audio, data, or downloads.
- Publish only material you own or are licensed to use: photos, telemetry, onboard video, music, logos, event timing data and third-party diagrams included.
- Credit authors and retain source/license information with every external asset. Do not assume social-media repost permission.
- Display an affiliate/sponsor disclosure close to any compensated link, product or service relationship. Separate personal opinion from supplied equipment and paid work.
- Link to official results rather than copying protected tables where practical.
- Do not provide instructions that bypass emissions, safety or road-use laws. Track-oriented information must say where its constraints apply.

## Security controls

- Deploy as static files on Cloudflare Pages Free behind the Cloudflare Free CDN/WAF. There is no public database, login, Pages Function, Worker, or server-rendered user input path in v1.
- Enable Bot Fight Mode, a WAF custom rule that blocks non-US traffic for the MVP, and the available Free-plan rate-limit rule. Do not add runtime code merely for these controls.
- Enforce HTTPS and canonical hostname. Enable HSTS only after confirming all subdomains support HTTPS.
- Begin with a restrictive Content Security Policy, `frame-ancestors 'none'`, `nosniff`, Referrer-Policy and a narrow Permissions-Policy. The prototype includes `src/public/_headers`; amend CSP only for intentional embeds.
- Limit embeds to documented allowlisted origins; favor click-to-load YouTube privacy-enhanced embeds. No arbitrary third-party scripts.
- Keep the source repository private if it contains unpublished media, drafts or anything sensitive. Enable MFA, least privilege, branch protection and dependency-update review.
- Run dependency and secret scanning in CI. Reject leaked tokens at commit time. Rotate any credential that is ever exposed.
- Validate build-time frontmatter and outbound URLs; escape user-controlled strings if comments or forms ever become a feature.

## Abuse resistance

- Static public pages do not need an application rate limiter. Enable CDN/WAF baseline DDoS protection, Bot Fight Mode, country blocking, and the one available edge rate-limit rule. Cache public assets aggressively.
- If a contact form or newsletter is introduced, protect it with server-side validation, per-IP rate limits, bot challenge/honeypot, mail abuse controls and no durable submission storage unless necessary.
- Do not add comments in v1. Comments create moderation, spam, privacy and retention obligations that cut against the project’s goals.

## Cost controls and recovery

- The MVP hosting/CDN variable-spend budget is **$0 USD/month**. Cloudflare Pages Free serves the static application and committed low-resolution media; the domain registration is a separate fixed cost. Do not enable usage-priced Cloudflare products or another delivery provider without an explicit approved change.
- Full-resolution originals stay local in ignored `Media/`. The pre-commit/CI media gate allows only committed `SizedMedia/` output below the 25 MiB Cloudflare Pages asset cap, with images capped to 1080px on the smaller dimension and videos capped to 480px/30fps/30 seconds. [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- Back up the Git repository, media originals and published build artifacts on a scheduled basis. Practice restoring a deploy and a deleted article.
- Maintain a plain incident runbook: who revokes tokens, who changes DNS, where backups are, how to place a maintenance page, and how to notify readers if a data or privacy issue occurs.
