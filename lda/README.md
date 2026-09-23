# Handoff: sousadev.com — company website

Design handoff package for building the new Sousa Dev website. Written so an autonomous coding agent (Claude Code or similar) can implement it without the designer in the loop.

## Overview

Sousa Dev is a software engineering company (custom software, IT consulting, systems architecture, website development) founded by Henrique Sousa, based in Ponta Delgada, Azores, working globally. The site's single job is to make corporate buyers trust the company enough to **request a proposal**. Tone: precise, steady, engineering-first. Dark-first (Ink) with one light (Paper) section.

## About the design files

Everything in `design/` is a **design reference built in HTML**, not production code. Do not ship those files. Recreate them in the target stack described below, using the tokens, content and rules in this package. Where a design file and this README disagree, **the design file wins**; where the design is silent, the README and `developer-spec.html` win.

- `design/homepage-desktop.html` — hi-fi homepage at ≥1024px. Has a live EN/PT toggle in the nav; both languages must be inspected.
- `design/homepage-mobile.html` — two phone screens covering the full homepage at 390px.
- `design/developer-spec.html` — the full developer spec: sitemap, Astro structure, tokens, breakpoints, 12 component specs with states, build order, i18n rules, acceptance criteria, handoff checklist. **Read it in full before writing code.**
- `design/brand-guidelines.html` — brand rules (logo, colour, type, imagery, voice). Logo download tiles won't resolve in the bundled copy; use `brand-kit/logo/` directly.

## Fidelity

**High-fidelity.** Recreate the homepage pixel-close (within 4px at 1440 / 1024 / 768 / 390). Secondary pages have no mockups: compose them from the same components, following the section recipes in the spec.

## Target stack

- **Astro 4, `output: 'static'`**, plain scoped CSS with custom properties. No Tailwind, no UI framework. No client JS except: mobile nav panel, FAQ accordion (native `<details>`), the ProjectFlow stepper, form submit. Budget: < 15 KB JS on the homepage.
- **Fonts self-hosted** as woff2 (latin + latin-ext): Space Grotesk 500/700, IBM Plex Sans 400/500/600, IBM Plex Mono 400/500. `font-display: swap`; preload display + body. No runtime Google Fonts (RGPD).
- **Deploy**: Cloudflare Pages or Vercel. Form → serverless endpoint → email to hello@sousadev.com (Resend or Formspree). Honeypot + rate limit.
- **Analytics**: Plausible or Umami (cookie-less, no banner).

## Sitemap

```
/            Home (designed)
/services    4 services, one full section each (expand the 4 ServiceCards)
/process     4 steps + FAQ accordion
/products    6 ProductCards with Live / In development filter
/about       Founder, location, how we work with clients
/insights    Blog index (content collection)  ·  /insights/[slug]
/contact     Proposal form (same CTABlock as home)
/privacy     RGPD legal
/pt/…        mirror of every route, PT copy
```
Every page ends with the CTABlock. Out of scope v1: case studies, careers, client portal, theme toggle.

## Content (ready to use)

- `content/i18n/en.json`, `content/i18n/pt.json` — every UI string on the homepage, keyed exactly as the design's logic uses them (`nav`, `cta`, `hero`, `logos`, `services`, `process`, `products`, `about`, `contact`, `footer`). Lift verbatim.
- `content/products.json` — 6 products with status and bilingual descriptions.
- `content/services.json` — 4 services with slugs, tags and bilingual copy.

### Copy rules (non-negotiable, all pages, both languages)
1. **No em dashes** (—) anywhere. Use a comma, full stop or slash. Section eyebrows are `01 / Services`.
2. **No response-time promises** (no "48h", no "within X hours"). The claim is *direct contact with the lead engineer*.
3. **Never state team size** or describe "the team". Emphasise direct relationship with the people behind the project, starting with the founder and lead engineer.
4. **"Working globally"**, never a region.
5. Every page makes clear Sousa Dev handles **development, deployment, hosting and management** end to end.
6. "Sousa Dev" is always two words. Product names and URLs are never translated. "We", never "I".

## Homepage sections (build order)

| # | Section | Notes |
|---|---------|-------|
| 01 | Nav | Sticky 72px (56 mobile), blur backdrop. Logo hover: mark rotates 180° and chevrons swap colours (see Interactions). Mobile: full-screen Ink panel with links 24px, LangSwitch and CTA pinned bottom. |
| 02 | Hero | 7:5 grid, 112px top padding, 45° green texture at .05. Left: eyebrow, H1 (last two words green), lead, two buttons, stats row (`6 / PRODUCTS IN PRODUCTION`, `PT · Global / BASED · WORKING`, `End to end / OWNERSHIP`). Right: **ProjectFlow** panel. |
| 03 | LogoRow | 1px rules, "TRUSTED BY", monochrome SVG logos h28. **Hide the section until ≥4 real logos exist.** |
| 04 | Services | SectionHead + 4 ServiceCards in a 1px-gap grid. |
| 05 | Process | **Paper surface.** SectionHead + 4 ProcessSteps. No timeline/duration labels. Step 4 = "Run" (deploy, host, manage). |
| 06 | Products | SectionHead + 6 ProductCards, Live first. Mobile: horizontal scroll-snap row with dots. |
| 07 | About | Photo 4:3 (desaturated, cool grade) left, text right, mono meta line `PONTA DELGADA · AZORES / WORKING GLOBALLY / EN · PT`. |
| 08 | CTABlock | Green block, 7:5, form card on the right. Note reads `DIRECT LINE TO THE LEAD ENGINEER · NDA ON REQUEST`. |
| 09 | Footer | 2:1:1:1. Legal line needs real NIF before launch. |

## Components (summary; exact values in `developer-spec.html` §05)

Button, Eyebrow, SectionHead, Nav, LangSwitch, LogoRow, ServiceCard, ProcessStep, ProductCard, **ProjectFlow**, CTABlock, Footer.

**ProjectFlow** (hero right panel): Graphite card, padding 28. Header `HOW A PROJECT RUNS` + counter `0n / 04` in Signal. Vertical stepper of 4 steps (Meet and analyse / Propose solutions / Build / Deliver end to end), each: 12px dot + 2px connector in a 28px left column; title 17px 600, tag mono 10px, desc 14px. Footer: 4 pill chips `DEVELOPMENT · DEPLOYMENT · HOSTING · MANAGEMENT`. Auto-advances every **1.8s**, loops with one extra beat at the end. Done = dot + connector Green; active = title/tag Signal, hollow green dot; upcoming = 45% opacity. Transitions .4s. Pause on hover. Reduced-motion: static, all steps done.

## Interactions & behaviour

- **Logo hover (Nav + Footer)**: `transform: rotate(180deg)` and S chevron → Green, D chevron → Paper. `.6s cubic-bezier(.65,0,.35,1)`. Off under `prefers-reduced-motion`.
- **Buttons**: primary hover → bg Signal; secondary hover → border Green. Focus ring `2px solid Signal`, offset 2px, everywhere.
- **ServiceCard hover** → bg Graphite. **ProductCard hover** → border Green, image scale 1.02 (200ms).
- **CTABlock form**: focus → border Green; submitting → "Sending…"; success replaces the form with the mark + "Received. It went straight to the lead engineer."; error → Amber note under the button. Mobile: the form is replaced by one primary button linking to `/contact`.
- **LangSwitch** links to the *same route* in the other language.
- **Loader** (`brand-kit/loader/sousadev-loader.svg`): inline for page transitions / form pending; set `--sd-loader-ink` (#F6F8F7 on dark, #0A1014 on light). Disable loop under reduced-motion.

## Breakpoints

- **≥1024**: container 1200, gutter 32. Hero 7:5, Services 4 cols, Process 4, Products 3, Footer 2:1:1:1.
- **640–1023**: gutter 24. Hero stacks (panel below text). Services 2×2, Process 2×2, Products 2, Footer 2×2. Nav collapses.
- **<640**: gutter 20. Single column. Products scroll-snap row. Buttons full width, min-height 48. Display type 40px. Nav 56px.

## Design tokens

Full list in `tokens/tokens.css` (copy into `src/styles/`) and `tokens/tokens.json`. Key pairs:

- Surfaces: Ink `#0A1014` (page), Graphite `#111A1E` (cards), Panel `#0E1519`, Paper `#F6F8F7` (Process section, documents), Mist `#E8EDEB`.
- Borders: `#1E272C` default, `#2A3439` strong, `#1A2227` hairline rules, `#DDE4E2` on Paper.
- Green: `#0FA347` primary (D chevron, primary button, eyebrows on Ink), `#08662F` Forest (green text on Paper), `#37D97A` Signal (green text on Ink, 15px+), `#08361C` text on green fills. **Text on green is never white.**
- Text on Ink: `#F6F8F7` headings, `#AFBDBE` body, `#8FA3A8` labels. Text on Paper: `#0A1014`, `#3D4A4F` body, `#5C6F77` labels.
- Functional only: Amber `#C4881B`, Steel `#1F7FC2`.
- Type: display `clamp(44px,5.4vw,76px)` / H2 `clamp(32px,4vw,48px)` / H3 24 / lead 20 / body 17 / UI 15 / small 14 / label 12. Display & H2 Space Grotesk 500, tracking −0.025em, line-height 1.0–1.05. Labels mono uppercase tracking .14–.16em. Never below 12px.
- Space: 4 8 12 16 20 24 32 48 64 104. Radius: 6 8 14 16 20. Section padding 104 desktop / 48 mobile.
- The 45° texture: `repeating-linear-gradient(45deg, #0FA347 0 2px, transparent 2px 14px)` at .05 (hero) — with `#0A1014` at .08 on the CTA block. Nowhere else.

## Assets (`brand-kit/`)

- `logo/mark|horizontal|stacked|wordmark|app-icon/*.svg` — all outlined, no font dependency. Use `horizontal-two-tone-on-dark.svg` in the nav, `horizontal-mono-ink.svg` on documents.
- `favicon/` — green and Ink tiles 16–512 PNG. Generate `.ico` from the 16/32/48.
- `loader/sousadev-loader.svg` — animated, transparent, CSS-variable coloured.
- `email/` — signature (not needed for the site).
- `tokens.css` — original brand tokens (superset of the web tokens).

**Still to be supplied by Sousa Dev before launch**: client logo SVGs (≥4), product screenshots at 880×640, one team/workspace photo, real NIF, OG image template renders, privacy policy text.

## Acceptance criteria (definition of done)

- Lighthouse mobile ≥ 95 in all four categories; LCP < 1.8s, CLS < .05, INP < 200ms on 4G.
- WCAG 2.2 AA: contrast (token pairs already pass), keyboard nav, visible focus, one `h1` per page, landmarks, alt text, reduced-motion respected.
- SEO: per-page title/description/canonical, `hreflang` en/pt/x-default, OG 1200×630, JSON-LD (`Organization` everywhere, `Article` on insights, `SoftwareApplication` on products), sitemap, robots, bilingual 404.
- Homepage matches `design/homepage-desktop.html` and `homepage-mobile.html` within 4px at 1440/1024/768/390.
- Henrique can add a product, service or blog post by editing one JSON/Markdown file.
- Zero em dashes, zero response-time claims, zero team-size claims (grep before every deploy).

## Files in this package

```
README.md                      this file
CLAUDE.md                      short standing instructions for the coding agent
design/                        bundled HTML design references (open in a browser)
content/i18n/{en,pt}.json      all homepage strings
content/products.json          6 products
content/services.json          4 services
tokens/tokens.css              web design tokens (custom properties)
tokens/tokens.json             same, machine-readable
brand-kit/                     logos, favicons, loader, brand tokens
_src/                          editable source of the design references (needs support.js; not for production)
```
