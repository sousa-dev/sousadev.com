# Launch inputs and migration checklist

These dependencies come from the handoff and repository audit. The website itself is built and verified locally; everything below is what still stands between it and a launch. Do not fabricate missing inputs, and do not mark an affected production feature complete until it has real data and evidence.

## Inputs and decisions still needed

| Input | Status / owner | Required handling |
| --- | --- | --- |
| Legal company name and real NIF | Not supplied; Henrique | Do not infer legal identity from the folder name `lda`. Replace mock NIF only with verified details |
| Client SVGs and permission to present relationship | Not supplied; Henrique | Hide LogoRow until ≥4 approved logos. Old partner raster files do not automatically satisfy this |
| Product screenshots | **Resolved.** All six are captured from the products' own live landing pages by `npm run shots`, at 880x416, with bilingual alt text in `src/content/products.json` | Confirm the owner is happy with each captured frame, and re-run `npm run shots` whenever a product's landing page is redesigned. The card falls back to a brand plate if an `image` is ever set back to null |
| Founder/workspace photo | New approved 4:3 photo not supplied; Henrique | The About section on the homepage and the About page currently run as text layouts. Existing founder JPEG is a candidate requiring selection; use real photography, not generated imagery |
| Product status and claims | Data supplied, not externally verified; Henrique | Confirm four live/two in development and specific claims before launch; derive counts |
| Privacy copy EN/PT | New policy not supplied; Henrique | `/privacy` and `/pt/privacy` carry an explicit interim notice, a factual description of what the site does today and links to the preserved legacy documents. Replace `privacy.*` in both dictionaries with the reviewed policy, and name the processors once they are chosen |
| Secondary copy, FAQ and articles | Only homepage copy supplied | Draft from known facts; flag factual gaps. No invented testimonials, delivery commitments or blog posts |
| Hosting | **Live, self-hosted since 2026-09-24.** Caddy and a systemd service on one Ubuntu machine; DNS for `sousadev.com` and `www` points at it and Let's Encrypt certificates are issued. See Deployment in the README | The Cloudflare Pages and Vercel adapters are unused and can be deleted. Remove the custom domain from the repository's GitHub Pages settings |
| Email delivery | **Live.** Credentials in `/etc/sousadev/proposal.env` on the server, sender `noreply@sousadev.com`, `sousadev.com` verified in Resend. One production delivery proven with test data on 2026-09-24 | None |
| Analytics | Plausible or Umami suggested, no choice recorded | Optional integration until selected; avoid bringing forward Google Analytics. Privacy wording must match actual configuration |
| Production fonts/licenses | **Resolved for development, confirm before launch.** Space Grotesk and IBM Plex are both SIL Open Font License 1.1. The WOFF2 files are taken from the `@fontsource` packages by `npm run fonts`, latin and latin-ext, Space Grotesk 500/600/700 and IBM Plex Sans 400/500/600 and Mono 400/500, with each licence copied to `public/fonts/*-LICENSE.txt` | Confirm the owner is content to use the OFL builds rather than a purchased package, and keep the licence files in the deploy |
| OG images, ICO and web manifest | **Resolved.** `public/favicon.ico` is built from the supplied 16/32/48 PNGs, `public/site.webmanifest` exists, and `npm run og` generates 16 social images at 1200x630 from brand assets and page headings | Regenerate the social images with `npm run og` after any heading change |
| Public company contact/social links | Design supplies hello email, founder LinkedIn and company GitHub | Confirm intended identities. Do not assume the signature's henrique email or brand guide's brand email is the proposal recipient |

The supplied email signature is separate collateral. It includes an HTTP booking URL; verify the HTTPS destination before publishing a refreshed signature. Do not send email or change external profiles merely because signature files are present.

### New dependencies found during implementation

| Item | Status | Required handling |
| --- | --- | --- |
| Rate limiting durability | In-memory per isolate in `server/proposal-handler.mjs` | Back it with the host's KV or a durable counter before launch. The current limiter slows a single client but is not a cluster-wide guarantee |
| Portuguese 404 routing | **Handled in `deploy/Caddyfile`**: unknown paths under `/pt/` get `/pt/404` | Verify after cutover |
| Trailing slash policy | **Handled in `deploy/Caddyfile`**: `/x/` and `/x/index.html` redirect (308) to `/x` | Verify after cutover |
| Article language pairing | Articles pair through `translationKey` | Publishing an article in one language only is supported and is handled honestly, but check the language switch on each new article |
| Social image refresh | `public/og/` is generated and committed | Run `npm run og` whenever a page heading changes, and after real photography arrives if the template gains imagery |
| Performance evidence | Lighthouse has only been run locally | Re-run against the preview deployment before launch, including a real INP measurement from interaction, and save the reports |

## Existing public routes

The following map is based on files in this repository, not on production access logs. Expand it with actual deployed URLs before cutover.

| Existing URL | Migration handling |
| --- | --- |
| `/` | Replace with new EN home when ready |
| `/index.html` | Permanent redirect to `/` in `deploy/Caddyfile` |
| `/privacy-policy.html` | Preserve initially; redirect to `/privacy` only when the new company policy is complete and the replacement is appropriate |
| `/terms-and-conditions.html` | Preserve this URL/content until a reviewed replacement and destination are defined; no new `/terms` route was specified |
| `/cloud-identifier-privacy-policy.html` | Preserve URL and Cloud Identifier-specific document; do not redirect to company privacy |
| `/cloud-identifier-tos.html` | Preserve URL and Cloud Identifier-specific document, including its privacy link |
| `/app-ads.txt` | Preserve: AdMob app-ads verification. Copied into `dist/` and checked by `npm run check:output` |

When the host switches to `dist/`, files remaining at the repository root will not automatically be served. Explicitly include the retained legal documents in the build/public assets or create equivalent routes. Verify all four with HTTP checks against the preview deployment.

Legacy homepage section IDs include `top`, `services`, `free-quote`, `about`, `portfolio` and `contact`. Keep useful anchors or map them to the new hero/services/contact/products sections. Fragments are not sent to the server, so an HTTP redirect rule cannot detect `#portfolio`; use a matching anchor or deliberate client handling. The new page should not reproduce the old duplicate IDs.

## Readiness checklist

- [x] Foundation, all routes and both locales built successfully.
- [x] Live product count is derived from the data and agrees with it. The hero shows it as a floor ("4+") because more runs in production than this site catalogues. External verification of the individual product statuses is still outstanding.
- [x] No fake logos, screenshots, placeholder photo labels, placeholder NIF or design-only copy; enforced by `npm run check:copy` and `npm run check:output`.
- [ ] Final EN/PT policy and verified legal identity supplied.
- [x] Product screenshots captured from the live products and shown on every card.
- [x] Real form delivery tested in production with test data on 2026-09-24; server validation, rate limits, honeypot, body size limit and failure recovery checked through the Caddy proxy.
- [x] Missing form configuration cannot simulate success in production: without credentials the endpoint answers 503 (checked through the proxy).
- [x] Desktop and mobile comparisons made at 1440/1024/768/390 in both languages; deviations recorded in AUDIT.md. An owner review of those deviations is still outstanding.
- [x] Keyboard, focus, contrast and reduced motion checked; axe report saved to `reports/axe.json` with no violations. A manual screen reader pass has not been done.
- [x] Byte budgets measured and Lighthouse reports saved locally, environment recorded in AUDIT.md. Re-run against the preview deployment before launch.
- [x] Localized metadata, social images, structured data, sitemap and robots checked in the build. 404 behaviour still depends on host configuration.
- [x] All four legal documents and `app-ads.txt` are copied into `dist/` at their original URLs and verified by `npm run check:output`. `CNAME` was removed with the move off GitHub Pages.
- [x] Only selected production assets ship; the output check fails on any handoff bundle, preview runtime, third-party font request, analytics script or legacy template script.
- [x] Actual deployment source and custom-domain settings confirmed: self-hosted, DNS A records for `@` and `www` point at the machine.
- [x] DNS/HTTPS and www-to-apex behavior verified on the live host. There was no separate preview deployment.
- [x] Rollback procedure recorded: `scripts/deploy.sh rollback` switches to the previous release.
- [ ] Domain and favicon cache behavior verified after an authorized release.

The new site is live on the self-hosted machine and deploys automatically from `main` (see Deployment in the README). The legacy site files are still in the repository root but are no longer served.
