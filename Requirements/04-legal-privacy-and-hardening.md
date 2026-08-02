# Legal, privacy and hardening requirements

This is a product requirement checklist, not legal advice. Get counsel for jurisdiction-specific privacy, copyright, sponsorship, competition and motorsport liability questions before public launch.

## Privacy and data retention

- Default posture: do not collect personal data. A static site requires no accounts, user profiles, marketing pixels or behavioral advertising.
- Use privacy-preserving, cookieless aggregate analytics only if metrics are genuinely useful. Document provider, fields collected, retention, data location, sub-processors and opt-out method before enabling it.
- Prefer server-side aggregate logs with short retention (30 days operational, 90 days security investigation unless legal need requires longer). Restrict access to the owner and delete on schedule.
- Do not put personal contact details, exact private addresses, keys, credentials, license plates, event attendee information or unpublished telemetry in public source files, images or downloadable data.
- Add a concise privacy notice before production launch; publish a contact path for privacy requests.

## Copyright, attribution and disclosures

- Publish only material you own or are licensed to use: photos, telemetry, onboard video, music, logos, event timing data and third-party diagrams included.
- Credit authors and retain source/license information with every external asset. Do not assume social-media repost permission.
- Display an affiliate/sponsor disclosure close to any compensated link, product or service relationship. Separate personal opinion from supplied equipment and paid work.
- Link to official results rather than copying protected tables where practical.
- Do not provide instructions that bypass emissions, safety or road-use laws. Track-oriented information must say where its constraints apply.

## Security controls

- Deploy as static files behind a reputable CDN/WAF. There is no public database, login or server-rendered user input path in v1.
- Enforce HTTPS and canonical hostname. Enable HSTS only after confirming all subdomains support HTTPS.
- Begin with a restrictive Content Security Policy, `frame-ancestors 'none'`, `nosniff`, Referrer-Policy and a narrow Permissions-Policy. The prototype includes a starter `_headers` file; amend CSP only for intentional embeds.
- Limit embeds to documented allowlisted origins; favor click-to-load YouTube privacy-enhanced embeds. No arbitrary third-party scripts.
- Keep the source repository private if it contains unpublished media, drafts or anything sensitive. Enable MFA, least privilege, branch protection and dependency-update review.
- Run dependency and secret scanning in CI. Reject leaked tokens at commit time. Rotate any credential that is ever exposed.
- Validate build-time frontmatter and outbound URLs; escape user-controlled strings if comments or forms ever become a feature.

## Abuse resistance

- Static public pages do not need an application rate limiter. Enable CDN/WAF baseline DDoS protection and cache public assets aggressively.
- If a contact form or newsletter is introduced, protect it with server-side validation, per-IP rate limits, bot challenge/honeypot, mail abuse controls and no durable submission storage unless necessary.
- Do not add comments in v1. Comments create moderation, spam, privacy and retention obligations that cut against the project’s goals.

## Cost controls and recovery

- The public site has a hard planning budget of **$50 USD/month**. Keep full videos on YouTube and use a managed video service only for short clips where adaptive playback materially improves the article.
- Configure billing alerts at **$25**, **$40** and **$50**. Use a separate project/account tag for this site, review usage monthly, and treat the $50 alert as a stop-and-investigate signal before enabling any new paid media feature.
- Cloudflare Pages’ published free-plan documentation currently lists limits such as 500 builds/month, 20,000 files/site and a 25 MiB per-file asset cap; recheck before committing to a host. [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- Back up the Git repository, media originals and published build artifacts on a scheduled basis. Practice restoring a deploy and a deleted article.
- Maintain a plain incident runbook: who revokes tokens, who changes DNS, where backups are, how to place a maintenance page, and how to notify readers if a data or privacy issue occurs.
