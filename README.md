# Sousa Dev

Sousa Dev is a software engineering company founded by Henrique Sousa in Ponta Delgada, Azores, working globally. We deliver development, deployment, hosting and management with direct access to the lead engineer.

This repository holds the rebuilt company website: an Astro static site in `src/` and `public/`, rendered in English at `/` and Portuguese at `/pt/`. The legacy site (`index.html`, `assets/`, `vendor/`) is still in place at the repository root and is still what the current host serves. Nothing has been deployed or cut over.

## Start here

1. [AGENTS.md](AGENTS.md) for project rules and source precedence.
2. The [handoff audit](docs/brand-revamp/AUDIT.md) for the brand direction, the asset map, the conflicts found in the supplied package and how each one was resolved in the build.
3. The [implementation plan](docs/brand-revamp/IMPLEMENTATION.md) for task status, component contracts and acceptance checks.
4. The [launch checklist](docs/brand-revamp/LAUNCH.md) for what is still missing before this can go live.

## Commands

Node 20.3+ (developed and verified on Node 22). Install once with `npm install`.

| Command | What it does |
| --- | --- |
| `npm run dev` | Astro dev server on <http://localhost:4321> |
| `npm run build` | Copies fonts, builds to `dist/`, preserves the legacy legal URLs |
| `npm run preview` | Serves the built `dist/` |
| `npm run check` | `astro check`: types, props and content collections |
| `npm run check:tokens` | Regenerates `src/styles/tokens.json` from the CSS sheet, enforces the 12px text floor and catches undefined custom properties |
| `npm run check:content` | EN/PT dictionary parity, service and product contracts, product data against the handoff |
| `npm run check:copy` | Copy rules: no em dashes, no response-time or team-size claims, no placeholder identity or media |
| `npm run logos` | Normalises `assets/companies/` into the Paper silhouettes in `src/assets/companies/` used by the logo strip |
| `npm run check:output` | Post-build: routes, one h1, canonical/hreflang, JSON-LD, CTA on every page, preserved legal URLs, social images, byte budgets |
| `npm run check:handoff` | `python3 scripts/audit_handoff.py`, validates the original package in `lda/` |
| `npm run test:server` | Unit tests for the proposal endpoint: validation, honeypot, rate limit, unconfigured provider, no-JS HTML answer, escaping |
| `npm run verify` | Tokens, content, copy, types, endpoint tests, build and output checks in one pass |
| `npm run test:browser` | Functional checks in Chromium: mobile nav, language switch, ProjectFlow, filters, form states, no-JS behaviour, responsive overflow |
| `npm run test:a11y` | axe-core across every route, both languages, at 1440 and 390, plus interaction states. Writes `reports/axe.json` |
| `npm run test:lighthouse` | Lighthouse mobile on four pages against the built output. Writes `reports/lighthouse-*.json` |
| `npm run fonts` | Copies the licensed WOFF2 files into `public/fonts/` and regenerates `src/styles/fonts.css` (also runs as part of `build`) |
| `npm run og` | Regenerates the social images in `public/og/` |
| `npm run shots` | Re-captures each product's landing page into `public/images/products/` |

The browser-based commands need Chromium. `npx playwright install chromium` provides it; on a machine without the system libraries, point `EXTRA_LIB_PATH` at a directory containing them.

## Editing content

No component changes are needed for routine content work.

- **Products**: `src/content/products.json`. Name, URL, domain, `status` (`live` or `in-development`) and a description per language. Every product count on the site is derived from this file. The `image` and `alt` fields point at the card screenshot; `npm run shots` re-captures all six from the live URLs in this file.
- **Services**: `src/content/services.json`. One record per service, used by both the homepage cards and the expanded `/services` sections.
- **Blog articles**: copy `src/content/blog/_example.md` to `src/content/blog/en/<slug>.md` (or `pt/`), fill in the frontmatter and write. Two files sharing a `translationKey` become translations of each other; an article with no translation does not advertise a language it does not have. The blog lives at `/blog` and `/pt/blog`, linked from the footer, and shows an empty state until the first article exists. **After adding an article, run `npm run build && npm run og`, then rebuild, and commit the new image in `public/og/`.** The generator draws a branded card from the article title; `npm run check:output` fails while that card is missing. Only set `ogImage` in the frontmatter to use a real image of your own, already in `public/`.
- **UI strings**: `src/i18n/en.json` and `src/i18n/pt.json`. Both files must keep the same key shape, which `npm run check:content` enforces.
- **Language detection**: EN lives at `/`, PT at `/pt/`. A browser that prefers Portuguese is redirected from an EN page to its PT equivalent by a small inline script in `src/layouts/Base.astro`; a choice made with the language switch is remembered in `localStorage` (`sd-lang`) and overrides it. PT pages never redirect, and nothing redirects without JavaScript.
- **Company logos**: drop the original artwork into `assets/companies/` and it appears in the strip under the hero; delete it and it goes. The build regenerates the strip, so no extra command is needed, though `npm run logos` refreshes it without a full build. The strip follows the directory's own alphabetical order, so prefix file names with a number to control it (`1-acme.png` before `2-globex.png`) and unprefixed files sort after the numbered ones. That is a string sort, so past nine logos pad the prefix (`01-`, `02-`), or `10-` lands between `1-` and `2-`. Give each file a display name in `src/content/client-logos.json`, keyed by the generated name, which is the original file name slugified (`My Logo.JPG` becomes `my-logo.png`). The script reduces each logo to a single Paper-coloured silhouette in `src/assets/companies/`, which is what makes a set of mixed transparent and white-backed artwork read as one row on the dark background, and Astro then converts those to WebP at the size the strip renders. Both directories are committed. `src/content/client-logos.json` maps a file name to the company name and to what the relationship actually is, and a file with no entry falls back to a name derived from its file name. The row is hidden entirely below four logos, and its label says "partners and collaborations", not "trusted by", because the set is a mix of research partners, conferences, a hosting supplier and client work.

## Repository map

| Path | Purpose |
| --- | --- |
| `src/` | Astro application: pages, components, layouts, content, i18n, styles, route helpers |
| `public/` | Production assets: logos, favicons, loader, social images, fonts (generated) |
| `server/`, `functions/`, `api/` | Proposal form endpoint and its Cloudflare Pages and Vercel adapters. Not part of the static build |
| `scripts/` | Build helpers and the repeatable checks listed above |
| `index.html`, `assets/`, `vendor/` | Existing legacy site, still in place until cutover |
| `*-policy.html`, `terms-and-conditions.html`, `cloud-identifier-*.html` | Existing public legal documents, copied into `dist/` at the same URLs |
| `lda/` | Original company design handoff, unchanged |
| `docs/brand-revamp/` | Audit, implementation plan, launch dependencies, asset inventory |

## The proposal form

The site is static; delivery is a separate function in `server/proposal-handler.mjs`, adapted for Cloudflare Pages (`functions/api/proposal.js`) or Vercel (`api/proposal.mjs`). It validates the same contract the browser validates, checks a honeypot, rate limits per client, and sends through Resend when `RESEND_API_KEY`, `PROPOSAL_TO` and `PROPOSAL_FROM` are set. With no provider configured it answers 503 and the form says nothing was sent. It never reports a delivery it cannot prove, and it never logs message bodies. See `.env.example`.

## Status

The site is built and verified locally, and it is not ready to launch. Real product screenshots, approved photography, client logos, the final privacy text, verified legal identity, a hosting choice and email credentials are still outstanding. [LAUNCH.md](docs/brand-revamp/LAUNCH.md) tracks all of them.
