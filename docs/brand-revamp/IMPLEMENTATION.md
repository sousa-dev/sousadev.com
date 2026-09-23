# Implementation plan

Status: P1 to P4 and P6 are implemented; P5 is implemented in code and unproven in delivery; P7 has been run locally and is not complete for launch. Task statuses and the evidence behind them are in the table below. Follow [AGENTS.md](../../AGENTS.md), read the full supplied developer spec, and consult [AUDIT.md](AUDIT.md) before taking a task. This plan turns the supplied design into reviewable work without treating missing launch inputs as a reason to stop all development.

## Task order and completion evidence

| Task | Depends on | Scope | Done when |
| --- | --- | --- | --- |
| P0 / Handoff preparation | None | Project instructions, complete inventory, conflict register, implementation and launch plan | Documents and repeatable handoff check exist; original site/designs preserved. **Complete** |
| P1 / Foundation | P0 | Astro static scaffold, compatible pinned dependencies/lockfile, content contracts, tokens, fonts, Base layout, route helpers and application checks | **Complete.** `npm install` is clean with 0 advisories, `npm run verify` passes, both locale shells render, fonts are self-hosted WOFF2 under `public/fonts/`, only selected assets are copied to `public/`, README commands updated. Astro 7 was installed instead of the specified Astro 4; see the version note below |
| P2 / Shared shell | P1 | Button, Eyebrow, SectionHead, Nav, LangSwitch, Footer, CTABlock/ProposalForm structure | **Complete.** Both locales; mobile menu is a native `<details>` panel with Esc, focus move and focus return; the language switch resolves the equivalent route on every page; contact runs CTABlock in form mode at every width; no placeholder legal identity in the footer |
| P3 / Homepage | P2 | Hero, ProjectFlow, conditional logos, four services, four process steps, six products, About | **Complete.** All sections at 1440/1024/768/390 in EN and PT; ProjectFlow pauses on hover, focus and an accessible control, and renders all steps complete without JS or under reduced motion; the hero stat is derived from product data; LogoRow is absent; the About photo slot is deferred and recorded below |
| P4 / Secondary routes | P3 | Services, Process/FAQ, Products/filter, About, Contact, Privacy shells, Blog collection/index/article and bilingual 404 | **Complete.** Shared components and equal locale keys; the blog collection is empty with an honest empty state; the privacy page carries an explicit interim notice instead of invented legal text; FAQ answers are limited to what the handoff and repository establish |
| P5 / Proposal delivery | P2 plus provider choice | `/api/proposal` or configured provider, server validation, rate limit, honeypot, localized states | **Code complete, delivery unproven.** Handler, Cloudflare and Vercel adapters, server validation, honeypot, rate limit and localized states exist; invalid, failure and unconfigured paths are covered by browser checks. No provider is configured, so no staging delivery has been proven. Remains a launch blocker |
| P6 / SEO and assets | P4 plus supplied media/legal content | Real screenshots/photo/logos, favicon ICO/manifest, metadata, social images, JSON-LD, sitemap/robots, old-route preservation | **Complete except for supplied media.** ICO, manifest, 16 social images, per-page localized metadata, canonical/hreflang/x-default, Organization, Article and SoftwareApplication JSON-LD, sitemap and robots are in place, and the four legacy legal URLs are preserved in `dist/`. Screenshots, photography and client logos are still missing |
| P7 / Release verification | P3-P6 | Visual, accessibility, performance, content and cutover checks | **Run locally, not satisfied for launch.** 33 functional browser checks, axe across 40 page states with no violations, Lighthouse at or above 95 in all four categories on four pages, byte budgets measured. The launch checklist is not satisfied, and no cutover has been prepared |

The Astro files were scaffolded alongside the existing site. Root `index.html`, `assets/` and `vendor/` are untouched, and the build writes only to `dist/`. The production host should serve the built output, not the repository root, and the originals stay until the migration is verified.

### Dependency version note

The handoff specifies Astro 4. Astro 4 is now published under the `legacy` dist-tag and a fresh `astro@4.16.19` install reports 4 advisories, including a critical one, with every fix landing in 7.2.8 or later. Several of them apply to a static build rather than only to the dev server. Astro 7.3.4 was installed instead, on Node 22, and `npm audit` reports 0 vulnerabilities. The architecture the handoff asked for is unchanged: `output: 'static'`, plain scoped CSS with custom properties, no Tailwind, no UI kit, no client framework. The version-specific differences absorbed by this decision are the content-collection loader API (`glob()` in `src/content.config.ts`) and `render(entry)` in place of `entry.render()`.

If tasks are assigned to multiple agents, give each a named component/route boundary. P1 owns package configuration, content contracts, route helpers and tokens; later tasks coordinate changes to those files. P4 and P5 can proceed independently after their prerequisites. A task is not complete just because another task owns the remaining integration.

## Application structure as built

```text
src/
  layouts/Base.astro                 head, metadata, JSON-LD, nav, footer
  components/
    Button.astro  Eyebrow.astro  SectionHead.astro  Logo.astro
    Nav.astro  LangSwitch.astro  Footer.astro
    ServiceCard.astro  ProcessStep.astro  ProductCard.astro  ProductGrid.astro
    LogoRow.astro  ProjectFlow.astro  Hero.astro
    CTABlock.astro  ProposalForm.astro
    pages/                           one shared body per route, used by both locales
      Home  Services  Process  Products  About  Blog  Article  Contact  Privacy  NotFound
  content/
    products.json  services.json  client-logos.json
    blog/_example.md             template; en/ and pt/ hold real articles
  content.config.ts                  blog collection, glob loader and schema
  i18n/en.json  i18n/pt.json
  lib/i18n.ts  routes.ts  products.ts  services.ts  logos.ts  blog.ts  logo.ts
  pages/
    index  services  process  products  about  contact  privacy  404
    blog/index  blog/[slug]
    sitemap.xml.ts  robots.txt.ts
    pt/...                           the same route set, shared components
  styles/tokens.css  tokens.json  fonts.css (generated)  global.css
public/
  logo/  favicon/  loader/  og/  fonts/ (generated)
server/proposal-handler.mjs          runtime-agnostic form delivery
functions/api/proposal.js            Cloudflare Pages adapter
api/proposal.mjs                     Vercel adapter
scripts/                             fonts, assets, social images, checks
```

`npm run fonts` and `npm run og` regenerate `public/fonts/` and `public/og/`. Fonts are rebuilt as part of `npm run build` and are not committed; the social images are committed so a deploy does not need a browser.

Service and product records are plain JSON imported through `src/lib/`, so they stay out of the content collection. Product and founder imagery is still missing, so no image pipeline is wired yet: `ProductCard` renders a brand plate when `image` is null and switches to the real screenshot when one is supplied. No legacy asset was copied into `public/`.

The commands, the `package-lock.json`, the generated-file ignores and the GitHub Actions workflow in `.github/workflows/ci.yml` are in place. Every script the workflow runs is installed in the project.

## Shared contracts

| Contract | Responsibilities |
| --- | --- |
| Locale | `en` or `pt`; same nested keys and value types in both dictionaries; never silently fall back for missing production UI. A browser preferring Portuguese is redirected EN to PT only, towards an existing route, unless the visitor chose EN on the switch (`localStorage` `sd-lang`) |
| Route helper | Locale + stable route key → `/services` or `/pt/services`, preserving valid service hashes. Define one trailing-slash policy and use it consistently in links, canonicals and sitemap |
| Article locales | Explicit locale and translation identity; switch to the translated article when present. For an untranslated article, show an honest alternative and only emit existing `hreflang` routes |
| Base | `lang`, title, description, canonical path, social image, optional structured data; shared nav/footer, skip link, one main landmark; page owns its single h1 |
| Service | Existing `slug`, `num`, bilingual `title`, `description`, `tags`. Stable IDs shared between cards and expanded service sections. PT service titles use the owner-approved translations recorded in AUDIT.md |
| Product | Existing `name`, `url`, `domain`, `status` (`live` / `in-development`), bilingual `description`; add validated image metadata and bilingual alt text when supplied |
| Product order/count | Stable ordering with live first. Count comes from validated status data; no separate hardcoded hero number |
| CTABlock | `lang` plus an explicit form/link mode. Contact always forces form mode; other mobile pages may link to localized contact |
| ProposalForm | Named fields `name`, `email`, `message`, locale, honeypot; associated labels, autocomplete, localized feedback, pending protection. Server validates the same contract |
| LogoRow | Real approved logo records with company name/alt and source. Entire section absent below four entries |
| ProjectFlow | Four localized steps; readable ordered content before JS; timer lifecycle, pause state, all-complete reduced-motion mode and accessible controls |

Do not copy runtime `t.products.items` logic from the design into locale JSON. Build the view from `products.json` and translated status labels. Likewise, migrate service items once, removing their duplicate locale arrays from the production copy. This keeps the one-file editing workflow promised by the spec.

## Route recipes

| EN route | PT route | Content |
| --- | --- | --- |
| `/` | `/pt/` | Designed homepage |
| `/services` | `/pt/services` | Four expanded service sections with the supplied slugs |
| `/process` | `/pt/process` | Discovery / Architecture / Build / Run, then native FAQ; FAQ answers need supplied facts |
| `/products` | `/pt/products` | All six records with accessible Live / In development filtering |
| `/about` | `/pt/about` | Company context, founder, global work, real image, how the direct relationship works |
| `/blog` | `/pt/blog` | Content collection index; honest localized empty state until articles exist. Linked from the footer, not the top bar |
| `/blog/[slug]` | `/pt/blog/[slug]` | Article content, metadata and translation mapping |
| `/contact` | `/pt/contact` | Proposal form at every width; no second duplicate CTA form |
| `/privacy` | `/pt/privacy` | Owner-supplied legal text reflecting selected processors and handling |
| 404 | localized 404 | Locale-appropriate recovery links; verify how the chosen static host selects error pages |

Every marketing page ends in the shared proposal CTA. Preserve historical product legal documents without injecting unrelated marketing copy into them. Case studies, careers, client portal and theme switching remain outside v1 scope.

## Validation and review handoff

For each task, report changed paths, checks actually run, relevant screenshots, deliberate departures from references and remaining dependencies. What has been run so far, and with what result, is recorded in [AUDIT.md](AUDIT.md) under "Implementation record". Keep these checks focused on the functionality being introduced:

- Foundation: clean install, type/content validation, static build, generated-route inspection, token parity, no third-party font requests, no preview runtime bundled.
- Navigation/i18n: keyboard open/close/Esc/focus return, background focus containment, route-change close, same-route language switching, long PT labels at all widths, no-JS navigation.
- Homepage: complete content without JS; ProjectFlow pause/resume/reduced motion; products reachable by keyboard/touch; no clipped headings or hidden service/product records.
- Form: required/invalid fields, server validation, pending state, success announced after delivery confirmation, recoverable error preserving input, honeypot/rate limits; no real customer data in tests.
- SEO/migration: one h1 per marketing page, localized title/description, canonical/hreflang, correct Organization/Article/SoftwareApplication data, sitemap/robots, all four legacy legal URLs, 404 routing.
- Visual/a11y: 1440/1024/768/390px, EN/PT, default/hover/focus/error states, manual keyboard and reduced-motion checks plus axe. The handoff asks for ≤4px fidelity; list accessibility/data exceptions instead of silently failing either requirement.
- Release performance: Lighthouse mobile ≥95 in all four categories; LCP <1.8s, CLS <.05, INP <200ms with interaction measurements. Homepage JS <15 KB; CSS <30 KB. The handoff does not define compression accounting: report both raw and transferred sizes, plus tool/version/device/throttling used.

Scope copy checks to authored production text. A blanket grep across `lda/`, old legal documents, dependencies and documentation will find intentional examples and produce misleading failures. Check forbidden promises and claims in both languages, and review semantics rather than banning every occurrence of “team”.
