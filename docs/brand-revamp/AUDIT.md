# Company rebrand handoff audit

Reviewed 2026-09-22. Scope: all 67 supplied files under `lda/`, the existing site structure and public HTML routes. The supplied files remain unchanged. See [asset-inventory.json](asset-inventory.json) for every path, SHA-256, byte size, raster dimensions, SVG viewBox and bundle resource counts.

## Brand direction

The positioning moves from a founder portfolio to an engineering company accountable for a client's systems throughout development, deployment, hosting and management. The buyer is a company seeking a dependable technical partner. The primary conversion is **Request a proposal / Pedir proposta**. Founder visibility supports direct access and accountability; it should not turn the site back into an autobiography.

The brand is precise, steady and engineering-first. Ink dominates; Graphite structures cards; the Process section uses Paper; Green marks actions. The intersecting chevrons evoke S, D and code brackets. Keep the supplied outlined artwork, 45° geometry, butt terminals and clear space. The visual language is real software, restrained technical diagrams and real photography. The guide explicitly excludes AI-generated imagery, stock business metaphors, glowing effects and floating-device mockups.

| Element | Direction |
| --- | --- |
| Name and voice | Sousa Dev, company “we”, direct and specific, no hype or emoji |
| Location | Ponta Delgada, Azores; working globally |
| Display / body / labels | Space Grotesk / IBM Plex Sans / IBM Plex Mono |
| Surfaces | Ink `#0A1014`, Graphite `#111A1E`, Panel `#0E1519`, Paper `#F6F8F7` |
| Accents | Green `#0FA347`, Forest `#08662F` on Paper, Signal `#37D97A` on Ink |
| Texture | 45° repeating lines on hero at .05 and CTA at .08 only |
| Logo sizes | Mark ≥16px; horizontal ≥96px; stacked ≥64px; clear space one 16u stroke |
| Photography | Real people/workspace, available light, cool/desaturated, about image 4:3 |
| Non-web use | Mono Ink lockup for financial documents; stacked for square formats; supplied circular avatars |

## What each part contains

| Source | Contents and implementation use |
| --- | --- |
| `lda/README.md`, `lda/CLAUDE.md` | Overview, scope, behavior, quality bar and standing handoff instructions |
| `lda/design/homepage-desktop.html` | Complete homepage reference with EN/PT toggle, placeholder imagery and animated ProjectFlow |
| `lda/design/homepage-mobile.html` | Two phone-framed EN examples: hero/services and process/products/CTA. Not a complete mobile site or PT design |
| `lda/design/developer-spec.html` | Nine spec sections: scope, stack, tokens, layout, components, section order, i18n, quality, delivery |
| `lda/design/brand-guidelines.html` | Logo, downloads, colors, typography, imagery, voice and business applications |
| `lda/_src/*.dc.html` | Four readable/editable source documents. Visible text matches the bundled references in this audit |
| `lda/_src/support.js` | Design preview runtime using external React/ReactDOM/Babel resources. Do not ship it |
| `lda/_src/ios-frame.jsx` | Device frame/presentation component for mobile design inspection; not a site dependency |
| `lda/tokens/tokens.css`, `tokens.json` | 74 matching web tokens, including layout, motion, colors and typography |
| `lda/content/i18n/en.json`, `pt.json` | Matching homepage string shapes; not all strings for all future routes or interaction states |
| `lda/content/services.json` | Four bilingual services with stable slugs, numbers and tags. Duplicated homepage service copy currently agrees with both locales |
| `lda/content/products.json` | Six bilingual product descriptions, URLs/domains and status values. No image paths or alt text yet |
| `lda/brand-kit/logo/` | 22 outlined SVGs: five marks, four horizontal, four stacked, four wordmarks, five app icons/avatars |
| `lda/brand-kit/logo/mark/png/` | Six raster exports: light/dark two-tone and mono Ink at 256 and 1024px |
| `lda/brand-kit/favicon/` | 12 PNGs: Green and Ink at 16/32/48/180/192/512px. No ICO or manifest supplied |
| `lda/brand-kit/loader/` | Transparent 120u SVG with two SMIL path animations, 1.8s loop, two-surface embed example and README |
| `lda/brand-kit/email/` | Henrique's signature HTML, embedded raster mark plus separate 88px PNG, installation notes. Non-site collateral |
| `lda/brand-kit/tokens.css` | Smaller brand color/font subset using `--sd-*`, not a superset of the web sheet despite the handoff wording |
| `lda/brand-kit/Sousa Dev Brand Guidelines.html` | Alternate bundle of the guidelines; asset base is `logo/` instead of `brand-kit/logo/`. Use actual files rather than relying on download tiles |

The 67 files comprise 5 Markdown, 11 HTML, 1 JSX, 1 JS, 19 PNG, 23 SVG, 2 CSS and 5 JSON files. Bundles carry embedded preview resources; do not mistake bundled font resources for a licensed, production-ready self-hosted font setup.

### Content inventory

| Service slug | EN title | PT title |
| --- | --- | --- |
| `custom-software` | Custom Software Solutions | Custom Software Solutions |
| `it-consulting` | IT Consulting | Consultoria Informática |
| `systems-architecture` | Systems Architecture | Arquitetura de Sistemas |
| `website-development` | Website Development | Desenvolvimento de Websites |

| Product | Domain | Supplied status |
| --- | --- | --- |
| São Miguel Bus | saomiguelbus.com | live |
| Your GenLab | yourgenlab.com | live |
| djast.dev | djast.dev | live |
| Bluesky Copilot | bskycopilot.com | live |
| Kunopilot | kunopilot.com | in-development |
| AIssue | aissue.yourgenlab.com | in-development |

Statuses and product claims above describe the handoff data, not independently verified product availability. Preserve the supplied names and URLs; confirm claims before publication.

### Layout and interaction map

Homepage order: Nav → Hero/ProjectFlow → conditional LogoRow → Services → Process on Paper → Products → About → CTABlock → Footer.

| Width | Layout |
| --- | --- |
| ≥1024 | 1200px container, 32px gutters; hero 7:5; services/process 4 columns; products 3; footer 2:1:1:1 |
| 640–1023 | 24px gutters; hero stacked; services/process/products 2 columns; footer 2×2; collapsed nav |
| <640 | 20px gutters; single column, product scroll-snap, 40px hero title, full-width ≥48px buttons, 56px nav |

Desktop nav is 72px and sticky. Desktop section padding is 104px; mobile reference often uses 40px while the spec says 48px. Preserve reference-specific geometry where it exists, document the exceptions in production tokens, and use the spec to fill missing mobile/tablet sections. The mobile board uses a 393px device frame; the production acceptance viewport is 390px. Do not reproduce the outer device chrome.

ProjectFlow has four steps, 1.8s progression plus one final beat, 400ms transitions and hover pause specified. Reduced motion should show all steps complete. The logo hover is 180° with chevron color exchange over 600ms. Product hover scales previews 1.02; reduced motion disables scaling. Forms need idle, invalid, pending, success and failure states. The design form itself is nonfunctional.

## Conflicts and working resolutions

These are implementation guardrails, not edits to the original design. Factual accuracy, usability and the handoff's explicit accessibility requirements take priority over copying an inconsistency. Record visual deviations during implementation.

| ID | Evidence in supplied files | Handling |
| --- | --- | --- |
| D01 | Desktop/mobile hero says six products in production; JSON and desktop product logic say four live, two in development | Derive a live count from `status`, or omit the unverified stat. Do not change product status to make the mockup true |
| D02 | “Never below 12px” conflicts with 9–11.5px labels in mockups, component specs and `text-label-sm: 11px` | Enforce 12px minimum in production; record necessary wrapping/spacing changes |
| D03 | Font list specifies Space Grotesk 500/700; card/step titles use 600 and the design font request includes it | Include licensed 600 in production for fidelity and document it as a web-specific addition; do not silently synthesize a missing weight |
| D04 | Brand guide bans rotation/color exchange; website explicitly specifies both on logo hover | Keep canonical static logo; allow only the specified nav/footer interaction, disabled under reduced motion |
| D05 | Brand guide contains example SLA, uptime and case-study numbers; website forbids response-time promises and requires defensible figures | Examples are not company claims. Never carry them into published marketing copy |
| D06 | JSON duplicates service records inside both locale files | On migration, keep service records in `src/content/services.json`; locales retain section headings. Render both home and services page from the same records |
| D07 | Locale files omit form errors/success/pending, menu labels, product statuses/filter labels, secondary page copy, FAQ, SEO, 404 and blog content | Add equal EN/PT keys during the relevant task. Source status labels from desktop logic: LIVE/ATIVO and IN DEVELOPMENT/EM DESENVOLVIMENTO. Do not hardcode English UI |
| D08 | Mobile shortens hero/step/service copy, shows only two services/products and omits About/Footer; README calls it full homepage | Use it for compact composition, not a content omission mandate. Keep all four services, six products and all required sections. Put any adopted short copy in both locale files |
| D09 | Mobile CTABlock replaces its form with a `/contact` link; every page uses CTABlock | Explicit form mode on contact routes at all widths; prevent a self-link loop and duplicated forms |
| D10 | README says token pairs already pass; `--green-ink` on `--green` is approximately 4.08:1; footer Slate on Ink is approximately 3.64:1 | Both are below the handoff's 4.5:1 normal-text target. Use Ink on Green (approximately 5.79:1) and label-dark on Ink (approximately 7.27:1). Check actual composed surfaces, hover and focus states |
| D11 | ProjectFlow upcoming text is faded to 45%; code lacks hover pause and sets reduced-motion last step active instead of all complete; loader has no motion fallback | Maintain readable text contrast; dim decorative indicators if needed. Implement real pause/resume, keyboard-accessible pause and static reduced-motion output. Disable SMIL explicitly or render static SVG; CSS transition rules alone do not stop it |
| D12 | General “design wins” rule coexists with mock placeholder logos, NIF, screenshots, typed wordmark and unlabeled form inputs | Use real outlined assets, associated labels and verified data. Hide unavailable logo row. Missing media/legal details are launch dependencies, not license to fabricate |
| D13 | “Twelve components” list actually names 13; “Seven pages” sitemap lists eight base routes | Implement the listed components/routes, including privacy; headings are informal counts |
| D14 | Static output plus `/api/proposal`; only a narrow list of JS behaviors, but products filters/dots also specified | Use a separate host function or configured form provider for delivery. Prefer native interactions; any minimal filter/dot JS counts toward the total budget |
| D15 | Website rules restrict texture to hero/CTA; OG recipe requests a textured social image | Treat OG as a separate brand application. Do not copy the About photo placeholder's pattern into the site |
| D16 | Supplied horizontal SVG lockups include a vertical separator and outlined wordmark; mockups use a separate mark and typed name | Use the supplied lockup geometry, including its separator. Adapt the inline SVG deliberately for the mark-only hover rather than reconstructing the wordmark or rotating the whole lockup |

The PT toggle also leaves some inline text in English, including “End to end” and the About location/global-work line. These are missing locale keys to address under D07, not an instruction to leave the finished PT page partly English.

No hosting, email or analytics provider has been chosen. The Astro 4 specification is retained as the handoff target, not a claim about the current supported release. Verify the chosen version and platform APIs when implementing the foundation.

## Existing-site migration implications

The current site is a single root `index.html` using Bootstrap, jQuery, Owl and other template scripts. It loads Google Analytics and third-party fonts, uses DOM-based `data-en`/`data-pt` switching with automatic browser detection, and contains a long first-person founder story. A proposal form points at `formsubmit.co/info@sousadev.com`; the new design requests `hello@sousadev.com` through a new delivery setup. Legacy scripts, form action, tracking and founder copy should not become the new implementation defaults.

Existing partner raster images and `assets/images/sousadev-photo.jpeg` are candidates for owner review, not automatically approved rebrand assets. `waitiist.com` appears in the old footer but is absent from the new product dataset. Do not silently merge old and new product catalogs.

Four public legal documents exist. The Cloud Identifier pair describes a separate product, so those routes must survive independently of the new company's `/privacy` page. `CNAME` exists, but deployment settings are not in this repository; the actual hosting arrangement must be verified before cutover. See [LAUNCH.md](LAUNCH.md).

## Implementation record

The site in `src/` was built from this audit. How each conflict was handled in code:

| ID | Resolution in the build |
| --- | --- |
| D01 | The hero stat is derived from `productCounts.live` in `src/content/products.json` and rendered as a floor, currently "4+", under the label "products in production". The owner confirmed more runs in production than the six products catalogued here, so an exact figure would either understate it or state something the data cannot support. The catalogue's own counts on `/products` stay exact (6 products, 4 live, 2 in development). No count is hardcoded in copy anywhere |
| D02 | `--text-label-sm` is 12px in the production sheet and `scripts/check-tokens.mjs` fails on any text token below 12px. The wider labels wrap the ProjectFlow chips onto two rows and stack the mobile hero stat labels; both are accepted |
| D03 | Space Grotesk 600 is included and self-hosted, and `scripts/sync-fonts.mjs` records why. Card, step and ProjectFlow titles use it |
| D04 | The canonical lockup is static everywhere. Only the nav and footer logo rotates the mark and exchanges the chevron colours, on hover and on keyboard focus, and both are switched off under `prefers-reduced-motion` |
| D05 | No SLA, uptime or case-study figure from the brand guide appears in any page copy |
| D06 | Service records live only in `src/content/services.json`; the locale files keep the section headings. `scripts/check-content.mjs` fails if `services.items` reappears in a dictionary |
| D07 | Both dictionaries gained menu labels, form states and errors, status and filter labels, secondary page copy, FAQ, SEO metadata, 404 and blog strings, with identical key shapes. Status labels are LIVE/ATIVO and IN DEVELOPMENT/EM DESENVOLVIMENTO. The reference's untranslated "End to end" and "WORKING GLOBALLY" are now `hero.stat3Value` and `about.meta` in both languages |
| D08 | The mobile layout keeps all four services, all six products and every section. The compact composition, the scroll-snap product row and the mobile process layout follow the mobile board |
| D09 | `CTABlock` takes an explicit mode. `/contact` and `/pt/contact` force the form at every width and render no link variant, so the mobile contact page cannot link to itself. Every other page shows the form above 640px and the contact link below it. There is never a second form on a page |
| D10 | Text on green is `--text-on-green` (Ink), and the footer legal line uses `--label-dark` instead of Slate. axe reports no contrast violation across 40 page states |
| D11 | Upcoming ProjectFlow steps keep full text contrast; only the rail dot and connector are dimmed. The sequence pauses on hover and on focus, stops when the tab is hidden, and renders statically with all four steps complete under reduced motion and with no JavaScript. The pause control is present and labelled with `aria-pressed`, but carries no visual weight: see the note on it below |
| D12 | Real outlined assets only. No client logos, no mock browser previews, no placeholder NIF, no placeholder photo labels, and every form control has an associated label |
| D13 | All listed components and all eight base routes exist, privacy included, in both languages |
| D14 | Delivery is a separate function outside the static build, with adapters for Cloudflare Pages and Vercel. The product filter and the mobile position dots are counted in the JS budget |
| D15 | The 45 degree texture appears only on hero sections and the CTA block. The generated social images use it deliberately as a separate brand application |
| D16 | `src/lib/logo.ts` inlines the supplied lockup, separator included, and only wraps the mark in its own group and moves its stroke colours to custom properties. The wordmark is never retyped |

### Added after the first implementation pass

| Change | Detail |
| --- | --- |
| Mobile footer grid | 2026-09-23. The owner requested two columns on phones, overriding the handoff's single-column footer rule. At widths below 640px the brand spans both columns, Company and Products sit side by side, Contact spans both columns so the email address has room, and the legal line follows the links. The desktop four-column and tablet two-column layouts remain. EN/PT screenshots at 1440/1024/768/390/320px showed no footer clipping or page-level horizontal overflow. |
| Product screenshots | `npm run shots` captures each product's own landing page at 1375x1000 and writes an 880x416 WebP to `public/images/products/`. These are real screenshots of live Sousa Dev products taken from the URLs in the data file, not mock-ups. The handoff asks for 880x640; the card preview strip renders at roughly 370x131 CSS pixels, so a 640px-tall source shipped about 2.7x the usable pixels and pushed the `/products` LCP to 2.5s. The source stays narrower in aspect (2.11) than the widest card box (about 2.65 at 390px) so `object-fit: cover` only ever trims the bottom, never the sides of a layout. The first card on `/products` is eager-loaded with `fetchpriority="high"` |
| djast.dev description | 2026-09-23. The owner corrected the production copy: djast.dev is a paid agentic boilerplate for developers, not free developer utilities. The EN and PT descriptions in `src/content/products.json` now state this. The supplied `lda/` data remains unchanged; product name, URL and status were not changed. `npm run verify` passed; a 390px Chromium check confirmed both descriptions on the home and product routes, with no clipped text or page-level horizontal scroll |
| Equal card sizing | The product grids use `grid-auto-rows: 1fr` and the card fills its row, so all six cards are the same size regardless of description length |
| First-visit proposal loader | `src/components/PageLoader.astro` shows the brand loader full screen for one 1.8s loop the first time a "Request a proposal" link is clicked in a browser session, then navigates to `/contact`. Held in `sessionStorage`, so it does not repeat; skipped entirely under `prefers-reduced-motion`, and the links stay ordinary anchors with JavaScript off |
| Blog naming and placement | The handoff calls the blog "Insights" and puts it in the main nav. The owner found the name unclear, so the route, the collection, the components and both dictionaries use "Blog" (`/blog`, `/pt/blog`). It is linked from the footer's company column and from the 404 recovery list, and is deliberately absent from the top bar, which keeps the main nav on what a buyer is choosing between. `NAV_KEYS` and `FOOTER_KEYS` in `src/lib/routes.ts` hold the two lists |
| Hidden pause control | The ProjectFlow pause control is no longer a visible chip. The owner found it noise beside the four coverage chips, and the panel already pauses on hover and on focus. It stays in the markup and the tab order and becomes visible on focus, because WCAG 2.2 SC 2.2.2 requires a mechanism to stop content that auto-advances for more than five seconds, and the handoff sets WCAG 2.2 AA as an acceptance criterion. Removing it outright would fail both |
| Browser-language redirect | 2026-09-22. A visitor whose browser lists any Portuguese language (`pt`, `pt-PT`, `pt-BR`) who opens an EN page is sent, before paint, to the equivalent PT page by an inline script in `src/layouts/Base.astro`. It only ever runs EN to PT, only towards a PT route that exists (an untranslated article and both 404 pages carry no target), and it keeps the URL hash. Choosing a language with the switch is stored in `localStorage` under `sd-lang` and wins over the browser setting, so a visitor who picks EN is not bounced again. PT pages never redirect away, so shared `/pt/` links and crawlers, which do not announce Portuguese, always get the page they asked for. With JavaScript off the page requested is served unchanged. This is not the guardrail's "browser-language replacement of a single-language page": both routes remain real, canonical and hreflang-linked. Eleven browser checks cover it, and the privacy summary in both languages names the stored preference |
| Wider desktop container | 2026-09-22. `--container` is 1320px in the production token sheet instead of the handoff's 1200px. With the 32px gutters inside the box, the handoff value left only 1136px of content at desktop widths, which the owner found too restrictive. Content is now 1256px wide from 1320px viewports up, with 60px of margin each side at 1440px; tablet and mobile gutters are unchanged. `lda/tokens/` keeps the original value. The services intro in `src/components/pages/Services.astro` had a stray `max-width: 100%` that overrode the container and left its heading flush with the viewport edge while every other intro was contained; removed at the same time |
| Company logo row | 2026-09-22. LogoRow renders every image in `src/assets/companies/`, collected at build time by `src/lib/logos.ts` and passed through Astro's image pipeline, and stays hidden below four. The eight logos are the real ones the current live site already publishes, copied from `assets/images/partners/`, so nothing placeholder or invented ships. The set mixes research partners (ATNOG, Instituto de Telecomunicacoes), conferences the company published at (IoT 2022, ABB 2024), a hosting supplier (Webtuga), an integration (Aveiro Tech City Living Lab) and client work (Tecnovia Acores, e-rocks). The label was first written as "partners and collaborations" for that reason; the owner reviewed it and chose the reference's "Trusted by" / "Confiam em nos" on 2026-09-22, removing their own product (Sao Miguel Bus) from the set at the same time. The relationship behind each logo stays recorded in `src/content/client-logos.json` so the set can be re-reviewed against that label; e-rocks has no relationship recorded yet. `src/content/client-logos.json` records the name and the nature of each relationship, keyed by the generated file name. Ordering is the directory's own alphabetical order, chosen by the owner on 2026-09-22 over a natural-numeric sort, so a numeric prefix controls the strip order and prefixes past nine need padding, and `scripts/normalize-logos.mjs` slugifies output names and deletes any output whose source has gone. It runs as part of `npm run build`, so editing `assets/companies/` is enough to change the site. The supplied artwork mixes transparent and white-backed images in several inks, which on Ink read as white boxes beside nearly invisible dark-ink marks, so `scripts/normalize-logos.mjs` reduces each one to a single Paper silhouette: it flattens the file, derives an alpha channel from luminance so the background falls away, inverts first where the corners show a dark plate, trims and bounds the result. The shapes are unchanged; only the ink is. The strip scrolls continuously to the left, five repeats of the set sliding by exactly one copy so the loop is seamless on displays past 4K, masked to a fade at both edges. It pauses on hover and on focus, stops entirely under `prefers-reduced-motion` with the logos still readable, and carries the same hidden-until-focused pause control as ProjectFlow, for WCAG 2.2 SC 2.2.2. Only the first copy is exposed to assistive technology; the repeats carry `aria-hidden` and empty alt text. Owner approval for presenting each relationship is assumed from their presence on the live site and should be confirmed before launch. The files live under `src/` rather than `public/` because the originals are 450 to 934px wide and, served unprocessed, were the three heaviest requests on the homepage and dropped Lighthouse mobile performance to 90 on `/pt`; through the image pipeline the largest drops from 62 KB to 5 KB and performance returns to 99 |
| Hero screenshot social images | 2026-09-22. The two home social images are a real screenshot of the site's own hero, one per language, captured from `dist/` at a 1500px viewport and 0.8 scale and cropped to 1200x630, so a shared link previews the actual page. Reduced motion is forced for the capture, which is the ProjectFlow state showing all four steps complete. The other route cards stay typeset from the dictionaries. `npm run og` now needs a build first |
| Logo strip hover pause | 2026-09-23. Hovering the label previously left the strip running because only the logo viewport paused. The whole section now pauses at the current frame. With JavaScript, `LogoRow` pauses and resumes the CSS animation object, retaining its timeline position; without JavaScript, a CSS hover rule holds the current frame. The manual pause button still works. `npm run verify`, 65 browser checks, axe across 40 states, and Lighthouse mobile all passed. Browser offsets were checked for EN/PT at 1440/1024/768/390px with and without JavaScript. Homepage JS is 7.1 KB raw / 3.1 KB gzip and CSS 38.3 KB raw / 6.6 KB gzip. Lighthouse scores were 98–100 performance and 100 in the other categories; local LCP was 1.864s on `/`, 1.607s on `/pt`, 2.143s on `/products` and 1.523s on `/contact`, so `/` and `/products` remain above the separate 1.8s LCP target. Page-load runs did not measure INP |
| Article social images | 2026-09-22. `npm run og` generates a branded card per published article from its title, at `public/og/<locale>-article-<slug>.png`. `src/lib/og.ts` prefers an article's own `ogImage` frontmatter, then that card, then the blog index card, so a page never advertises an image that does not exist. `scripts/check-output.mjs` verifies that every `og:image` in the output is a real file, and separately that every article without its own `ogImage` has its generated card, reading the frontmatter rather than inferring from the rendered tag. An agent that adds an article and forgets `npm run og` gets a named failure in CI. `scripts/article-frontmatter.mjs` is the one article list both scripts read |
| Mobile menu containing block | 2026-09-23. The open mobile menu showed only its first link, with the page visible below it. `.menu__panel` is `position: fixed` with `inset: var(--nav-h-mobile) 0 0 0`, and `backdrop-filter` on `.nav` made the header a containing block for its fixed descendants, so that inset resolved against the 56px header rather than the viewport and the panel collapsed to its own 80px of padding, clipping everything after the first link. The blur now sits on a `.nav::before` pseudo-element, which looks identical and leaves the viewport as the panel's containing block. Three browser checks were added, because the existing ones asserted the panel was visible and counted its links, both of which stayed true while it was clipped: the panel must fill the viewport below the header, its last control must sit inside it, and its background must be opaque |
| Loader asset correction | The handoff's `loader/sousadev-loader.svg` is a static export with no `<animate>` elements, despite its README describing it as SMIL-animated. The working animated markup exists only inline in `loader/embed-example.html`, so `scripts/sync-assets.mjs` takes it from there. The shipped loader therefore animates as the package documents |

### Portuguese copy pass, 2026-09-22

The production PT dictionary is written for Portuguese readers rather than translated line by line: the company appears as "A Equipa Sousa Dev", "end to end" is rendered as "do início ao fim" or spelled out as the four services, and the handoff's "de ponta a ponta" is not used. The handoff's own `lda/content/i18n/pt.json` keeps the original wording, as required. Deployment is named "implementação" consistently in labels and headings (the website service keeps "publicação" for publishing a site), and the contact heading and message error use natural "de que precisa" / "o que pretende" forms.

2026-09-23: The owner asked for all Portuguese-facing copy to be translated, overriding the handoff rule that kept "Custom Software Solutions" in English. The production service title is now "Soluções de Software à Medida"; "Desenvolvimento de Websites" is now "Desenvolvimento de Sites". The source handoff and its inventory stay unchanged. The Portuguese language-switch label, blog label, common English terms in service/product/privacy copy, and the installable web manifest were localized too. Product names, domains, URLs and technical acronyms remain as identifiers. `scripts/check-content.mjs` checks the approved PT service titles, and `scripts/check-output.mjs` checks that PT pages link the PT manifest.

Verification for that copy pass: `npm run verify` passed, followed by `npm run og`, `npm run build` and `npm run check:output`; `npm run check:handoff` and `git diff --check` passed too. The browser suite passed 63/63 checks; axe found no violations across 40 states. Browser geometry for `/services` and `/pt/services` at 1440/1024/768/390px showed both titles within the viewport and no page-level horizontal scroll; the 390px PT services screenshot was visually reviewed. Lighthouse 13.5 local mobile runs scored 98–100 performance and 100 in the other three categories. LCP was 1.816s on `/`, 2.275s on `/pt`, 2.191s on `/products`, and 1.510s on `/contact`; the first three exceed the separate 1.8s target. CLS and TBT were zero. The output checker measured homepage JS at 6.7 KB raw / 3.0 KB gzip and CSS at 38.3 KB raw / 6.6 KB gzip, so raw CSS remains above the 30 KB target. These page-load measurements do not establish INP.

The 390px copy review also exposed a page-level horizontal scroll on both homepages under reduced motion. The visually hidden external-link text in the mobile product row had no positioned card ancestor, so its absolute box extended the document even though the row was scrollable. `ProductCard` now positions each card, keeping that text inside its clipped box. The responsive browser check now uses an instant scroll probe; its previous probe could report zero while smooth scrolling had not moved yet. Both locales now have a 390px document width and zero horizontal page scroll with and without reduced motion. The final build, output check, 63 browser checks and 40-state axe run passed after this correction; the Lighthouse run above preceded this one-line layout correction.

### Documented visual deviations

P4 follow-up, 2026-09-22: corrected the About page's missing space between the
full-width Paper section and the inset proposal block. A wrapper in
`src/components/pages/About.astro` applies the existing section padding tokens:
104px at desktop/tablet widths and 48px on mobile. Both locales share the fix;
the shared CTA and other routes are unchanged. No new content or accessibility
deviations were introduced; the previously documented photography dependency remains.

Verification: `npm run verify`, all 41 `npm run test:browser` checks and
`npm run test:a11y` (40 states, zero violations) passed. About screenshots were
visually reviewed in EN/PT at 1440/1024/768/390px and saved under
`reports/about-padding/`. Browser geometry confirmed the 104/48px gaps with no
horizontal overflow. Both About routes also retained usable mobile navigation
and localized contact links with JavaScript disabled. The browser suite checked
keyboard navigation, form errors, language links and reduced motion.

The build's output checker measured homepage JS at 5.0 KB raw / 2.7 KB gzip and
CSS at 36.3 KB raw / 6.3 KB gzip. The existing raw CSS total exceeds the 30 KB
target; this About-only fix adds no homepage styles.

`npm run test:lighthouse` also passed its category threshold: Lighthouse 13.5
mobile emulation against compressed local build output scored 98–100 performance
and 100 in the other categories across `/`, `/pt`, `/products` and `/contact`.
LCP ranged from 1.515s to 2.196s; `/pt` (1.810s) and `/products` (2.196s) exceeded
the separate 1.8s target. CLS and TBT were zero. These are local page-load
measurements, do not measure INP, and do not include an About Lighthouse run.

| Where | Deviation | Why |
| --- | --- | --- |
| About section and About page | No 4:3 photo; the section runs as a text layout | No approved company photography has been supplied, and a labelled placeholder plate must not ship |
| Product cards | Real landing-page screenshots at 880x416, not the reference's mock browser window | The mock window would be a fabricated screenshot. The card still falls back to a brand plate for any product whose `image` is null |
| Client logo row | Absent | Fewer than four approved client logos exist |
| ProjectFlow chips and mobile hero stats | Wrap onto two rows or two lines | The 12px production floor (D02) |
| Proposal form | Visible field labels above the inputs | The reference uses placeholders only, which leaves the controls unlabelled |
| Footer legal line | `(c) 2026 Sousa Dev` with no NIF | The legal identity is unverified |
| Services, Process, Products, About, Blog, Contact, Privacy and 404 | Composed from the same components with no mockup to match | The handoff supplies no design for these routes |

### Checks run against the build

Recorded so the next person knows what is proven and what is not:

- `npm run verify`: tokens, content contracts, copy rules, `astro check`, build, output checks. Passes.
- `scripts/browser-checks.mjs`: 33 checks in Chromium, all passing, covering mobile navigation and its keyboard behaviour, same-route language switching across every route in both directions, ProjectFlow progression, pause and reduced motion, the logo hover and its reduced-motion behaviour, product filtering against the data counts, form validation, delivery failure and input preservation, the contact form at 390px, no-JS rendering of every homepage section, and horizontal overflow at 1440/1024/768/390.
- `scripts/a11y-check.mjs`: axe-core with the WCAG 2.0, 2.1, 2.2 AA and best-practice rule sets across 40 page states. No violations. Saved to `reports/axe.json`.
- `scripts/lighthouse-check.mjs`: Lighthouse 13.5 mobile emulation against the built output served locally with compression. Performance 99 to 100, accessibility 100, best practices 100, SEO 100. LCP 1.51s to 1.97s, CLS 0, TBT 0ms. Saved to `reports/`.
- Byte budgets on the homepage: JS 4.5 KB raw, 2.3 KB gzip; CSS 35.6 KB raw, 6.1 KB gzip, inlined into the HTML.

Limits worth stating: Lighthouse ran on a local machine against a local server, so it is not evidence about production latency; `/products` measured 1.97s LCP, above the 1.8s target, in that environment. INP is not measured by a page load, and nothing here proves real form delivery, external product availability or final legal wording.

## Review evidence and limits

All JSON and CSS tokens were read; all SVGs parsed with no live `<text>` elements; PNG dimensions and checksums were inspected; every bundled HTML manifest/template was examined alongside readable sources. A contact sheet of all SVG/PNG assets was visually inspected. Desktop was rendered in Chromium and its language toggle exercised. Both mobile phone frames were scrolled, and developer spec and brand guideline bundles were opened for inspection. The handoff validator passed, including negative checks for token drift, locale mismatch, corrupt PNG data and inventory drift in a temporary copy. Documentation links and whitespace checks passed. These checks analyze the handoff, not the future site's performance or accessibility compliance. External product availability, company registration, final legal wording and production delivery have not been verified.
