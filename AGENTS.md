# Working on Sousa Dev

## Project intent and current state

Sousa Dev is a **company**, not a freelancer portfolio. Build trust with corporate buyers and make requesting a proposal the primary action. Henrique Sousa is the founder and lead engineer. Location: Ponta Delgada, Azores; working globally. Do not invent a legal company name, NIF, headcount, client relationship or performance claim.

The root HTML/assets/vendor directories are the existing site, still in place and still what the domain serves. `lda/` is the original design handoff, not the application. The Astro application now exists in `src/`, `public/`, `server/`, `functions/`, `api/` and `scripts/`. Read `README.md`, `docs/brand-revamp/AUDIT.md`, including its implementation record, and the task you are taking in `docs/brand-revamp/IMPLEMENTATION.md` before editing.

## Sources and conflicts

1. Current user instructions take priority.
2. Follow the explicit production guardrails here and the documented conflict handling in `docs/brand-revamp/AUDIT.md`.
3. `lda/design/homepage-desktop.html` and `homepage-mobile.html` govern visual layout. Inspect desktop in both languages. Read all of `lda/design/developer-spec.html` before application implementation.
4. `lda/README.md`, `lda/CLAUDE.md`, and the developer spec supply behavior where visuals are silent. `lda/design/brand-guidelines.html` governs brand usage.
5. `lda/content/` and `lda/tokens/` are the starting structured data and web tokens. `lda/_src/` is a readable design source, not production code. `lda/brand-kit/tokens.css` is a separate prefixed brand subset, not a replacement web token sheet.

Preserve the supplied `lda/` files during implementation. Copy the selected assets/content to their production locations once, then use the production copies as the editing source. Do not maintain two live content stores. If the handoff itself is intentionally revised, update the audit and inventory. Do not silently resolve a factual contradiction by copying a mockup.

## Brand and content rules

- Use “Sousa Dev”, two words, and company voice (“we”). No freelancer language, first-person founder autobiography, team-size claims or response-time promises.
- No em dashes in published copy. Section labels use `01 / Services`. Documentation and original references may contain them.
- Communicate development, deployment, hosting and management on every marketing page. Use “working globally”; location is context, not a service-region restriction.
- Preserve product names and domains. Translate service titles and other user-facing copy in Portuguese, including “Custom Software Solutions” as “Soluções de Software à Medida”. Never translate URLs or guess new product statuses.
- Never publish placeholder client logos, fake screenshots, placeholder NIF or illustrative brand-guide metrics. LogoRow shows every image in `src/assets/companies/`, generated from the originals in `assets/companies/` by `npm run logos`, and hides itself below four. Only add a logo for a real, owner-approved relationship, and keep the label at "partners and collaborations": the set includes research partners, conferences and a supplier, so it must never be presented as a client list.
- The handoff contains six products, four marked `live`. Derive any live count from data; omit an unverified claim rather than asserting six live products.
- References include customer “team” language. Do not ban that word indiscriminately; the restriction is on claims about Sousa Dev's size or staffing.

## Implementation guardrails

- Architecture: `output: 'static'`, scoped vanilla CSS and custom properties. No Tailwind, UI kit, React/Vue or copied design runtime. The handoff specifies Astro 4; the project runs Astro 7 because Astro 4 is end of life and carries unpatched advisories, and the reason is recorded in `docs/brand-revamp/IMPLEMENTATION.md`. Verify compatibility and security against official documentation before changing a dependency, and keep `npm audit` clean.
- Self-host licensed WOFF2 fonts, including Portuguese glyph coverage. No runtime Google Fonts. Retain font license files.
- Use supplied outlined SVG lockups; do not retype the wordmark. Dark surfaces use Paper + Green; documents use mono Ink. The specified nav/footer hover is a narrow exception to the general no-rotation/no-colour-swap logo rule.
- Use web tokens; introduce missing values deliberately in the production token sheet and keep its machine-readable counterpart in sync. Use at least 12px for production text despite smaller mockup labels. Resolve font weight and contrast conflicts as described in the audit.
- Every page needs a social image that exists. Adding a blog article means running `npm run build && npm run og` and committing the generated card in `public/og/`; `npm run check:output` fails while it is missing. Set an article's `ogImage` only to point at a real image already in `public/`.
- EN at `/`, PT at `/pt/`, shared components and localized strings. Use real links to equivalent routes, with localized metadata, `lang` and `hreflang`; no browser-language replacement of an otherwise single-language page. The only browser-language behaviour is the EN to PT redirect in `src/layouts/Base.astro`, which targets a real PT route, respects the visitor's stored switch choice and must never run on PT pages.
- Every marketing page ends with CTABlock. `/contact` and `/pt/contact` must show the actual form at every width; other pages may show the mobile link variant. Avoid a mobile contact page linking to itself instead of displaying the form.
- Native `<details>` for FAQ. Minimal JS for navigation, ProjectFlow and form state; any filter or carousel enhancement must be accessible and included in budgets. All content and primary links should remain usable without JS.
- Respect reduced motion for all transitions and animations, including SVG SMIL. ProjectFlow must be readable without animation and have an accessible pause mechanism. Do not copy the mockup's incomplete motion implementation.
- Keep serverless form delivery separate from static rendering. Never embed credentials, log message bodies or fake a successful delivery. Real server validation, honeypot and rate limiting are required before launch.
- Keep the current site available until the replacement is ready. Preserve existing legal routes, especially both Cloud Identifier documents, per `docs/brand-revamp/LAUNCH.md`. Do not make a blanket redirect to `/privacy`.

## Working and verifying

Use `npm run verify` for the application (tokens, content, copy rules, types, build, output), `npm run test:browser`, `npm run test:a11y` and `npm run test:lighthouse` for the browser-based checks, and `npm run check:handoff` for the original package in `lda/`. `npm run dev` serves the new site; `python3 -m http.server 8000 --bind 127.0.0.1` still serves the legacy site and the bundled design references. Every command is listed in `README.md`.

Take one bounded task from the implementation plan and state its scope. Keep shared tokens, route helpers, content schemas and package configuration coordinated if work is assigned to multiple agents. Missing launch inputs block dependent launch work, not unrelated development. Record decisions and outstanding dependencies in the existing documents instead of proliferating competing plans.

For UI work, compare at 1440/1024/768/390px in EN/PT and record documented accessibility/content deviations. Verify keyboard navigation, form errors, mobile navigation, reduced motion, language links and no-JS behavior. The target is Lighthouse mobile ≥95 in all categories, LCP <1.8s, CLS <0.05, INP <200ms, homepage JS <15 KB and CSS <30 KB. Report how bytes and performance were measured; do not claim INP from a noninteractive page load or claim visual/a11y checks that were not run.

Preparation-only changes need handoff validation, link checks and `git diff --check`, not a fictional application build. Report changes, actual checks and unresolved inputs. Do not deploy or alter DNS as an incidental part of preparation.
