# Legal, privacy and hardening requirements

This is a product requirement checklist, not legal advice. Get counsel for jurisdiction-specific privacy, copyright, sponsorship, competition and motorsport liability questions before public launch.

## Regional launch scope, privacy and retention

This is a temporary **US-only MVP**. The production edge must block every request whose country is not `US`, including unknown country values. Use a zone-wide Cloudflare WAF custom rule with expression `(ip.src.country ne "US")` and action **Block**; Pages middleware is a second, fail-closed layer and returns HTTP 451. The analytics collector independently accepts only `US`. Do not remove either layer until the applicable regional launch checklist below has been approved and tested against the custom domain and the `pages.dev` URL. Country is an imperfect network-location signal, not proof of residence or a substitute for legal analysis.

- Default posture: do not collect personal data. A static site requires no accounts, user profiles, marketing pixels or behavioral advertising. Analytics is disabled until a named owner approves a release record.
- Do not promise or represent the site as “globally compliant” or analytics as “anonymous.” A browser request and a search term can be personal data even when no identifier is intentionally persisted. The approved implementation is first-party, cookieless, single-site aggregate measurement only; it must never collect or persist a MAC address, request IP address, cookie, fingerprint, stable visitor identifier, or cross-site activity.
- Before enabling analytics, create and retain a release record: jurisdictions and audience in scope; controller contact; exact event fields; purpose; Cloudflare’s processor/sub-processor and data-location terms; retention; legal basis; any required notice, objection or consent path; and the decision-maker/date. Re-evaluate it after any new event field, provider, retention change, advertising integration, or cross-site feature. This is an engineering gate, not legal advice.
- Retain Analytics Engine aggregate rows for no more than its three-month window; do not export raw event rows to another store. Keep operational request logs for at most 30 days and security-investigation material for at most 90 days unless a documented legal need requires more. Restrict analytics/dashboard access to the owner, review retention quarterly, and delete any optional export on schedule.
- Maintain a simple rights and incident path: a public contact address when a notice is required; a documented process to assess access/erasure/objection requests despite the non-identifying design; and a breach runbook that evaluates notification duties before notifying anyone.

### United States — allowed for the MVP

- No analytics consent banner, public analytics opt-out, or public analytics settings UI is required by this product baseline. Do not sell, share, target advertising with, or profile analytics data; never condition ordinary articles on analytics. The owner-only local exclusion is not a substitute for any legally required right.
- Before launch and annually thereafter, document whether the operator meets the then-current thresholds of California and other applicable US state privacy laws. If a law applies or the telemetry becomes personal information under that law, add the required notice at collection, privacy-policy disclosures, verified rights-request method, retention disclosure, and any mandated opt-out/GPC handling before collecting. California-covered businesses must provide notices and honor rights including access/deletion/correction and opt-out of sale or sharing; the current personal-site design is expressly not allowed to sell or share data. [California Attorney General CCPA guidance](https://oag.ca.gov/privacy/ccpa)
- Apply data minimisation, purpose limitation, least-privilege dashboard access and the retention limits above even where a state statute does not apply. Do not knowingly collect from children or build a child-directed experience without a separate COPPA review.

### Canada — deferred and blocked

- Canadian (`CA`) requests are blocked and no site or analytics data is intentionally persisted for this rollout. Do not claim that blocking alone resolves every Canadian obligation; reassess CDN/provider processing before launch.
- Before a Canadian release, map federal PIPEDA and applicable provincial law (including Québec), publish an accessible privacy notice, define a contact/rights route, and obtain meaningful consent for non-essential personal-data analytics. Provide a real withdrawal/objection path where required; do not bundle analytics into access to the articles. PIPEDA generally requires meaningful consent, a clear explanation of collection/purpose/sharing, and a choice for non-integral collection. [Office of the Privacy Commissioner of Canada](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/p_principle/principles/p_consent/)

### Mexico — deferred and blocked

- Mexican (`MX`) requests are blocked and no site or analytics data is intentionally persisted for this rollout.
- Before a Mexican release, obtain Mexico-specific advice on the current Federal Law on Protection of Personal Data Held by Private Parties, publish the required Spanish privacy notice identifying controller, purposes, transfers and retention, and provide a process for ARCO rights (access, rectification, cancellation and opposition) and any required consent/objection choice. [Current federal law text](https://www.diputados.gob.mx/LeyesBiblio/ref/lfpdppp.htm)

### European Union and United Kingdom — deferred and blocked

- EU/EEA and UK requests are blocked and no site or analytics data is intentionally persisted for this rollout.
- Before enabling either region, complete a jurisdiction-specific ePrivacy/GDPR or PECR/UK GDPR review. Default to prior consent for non-essential tracking or terminal storage/access, show a clear notice and an equally easy refusal/withdrawal route, and do not load analytics before consent. The narrow CNIL audience-measurement exemption is not a blanket approval: it is limited to single-editor audience/performance measurement producing anonymous statistics, with no cross-site tracking or third-party reuse, and CNIL still recommends informing users. [CNIL audience-measurement guidance](https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience) and [GDPR transparency/minimisation rules](https://eur-lex.europa.eu/eli/reg/2016/679/oj) are the baseline references.

### All other countries — deferred and blocked

- Treat every non-US country not named above as deferred: access is blocked, analytics collection is blocked, and no market-specific claim is made. A future regional release requires the same written release record and counsel review before loosening the US-only WAF/middleware rule.
- Do not put personal contact details, exact private addresses, keys, credentials, license plates, event attendee information or unpublished telemetry in public source files, images or downloadable data.
- Add a concise privacy notice before production launch; publish a contact path for privacy requests.

## Copyright, attribution and disclosures

- Publish only material you own or are licensed to use: photos, telemetry, onboard video, music, logos, event timing data and third-party diagrams included.
- Credit authors and retain source/license information with every external asset. Do not assume social-media repost permission.
- Display an affiliate/sponsor disclosure close to any compensated link, product or service relationship. Separate personal opinion from supplied equipment and paid work.
- Link to official results rather than copying protected tables where practical.
- Do not provide instructions that bypass emissions, safety or road-use laws. Track-oriented information must say where its constraints apply.

## Security controls

- Deploy as static files on Cloudflare Pages Free behind the Cloudflare Free CDN/WAF. There is no public database, login, Pages Function, Worker, or server-rendered user input path in v1.
- Enable Bot Fight Mode, a WAF custom rule that blocks non-US traffic for the MVP, and the available Free-plan rate-limit rule. Do not add runtime code merely for these controls.
- Enforce HTTPS and canonical hostname. Enable HSTS only after confirming all subdomains support HTTPS.
- Begin with a restrictive Content Security Policy, `frame-ancestors 'none'`, `nosniff`, Referrer-Policy and a narrow Permissions-Policy. The prototype includes a starter `_headers` file; amend CSP only for intentional embeds.
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
