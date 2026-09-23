# sousadev.com — agent instructions

Read `README.md` fully, then open `design/developer-spec.html` in a browser and read every section before writing code. The design references in `design/` are the source of truth for layout and copy; `content/` holds the strings and data; `tokens/tokens.css` holds every colour, size and radius you may use.

## Hard rules
- Astro 4 static, plain scoped CSS, custom properties from `tokens/tokens.css`. No Tailwind, no component library, no client framework.
- Do not invent colours, sizes or fonts. If a value isn't in tokens.css, take it from the design file and add it to tokens.css first.
- Fonts self-hosted woff2; never load Google Fonts at runtime.
- No em dashes (—) in any copy. No response-time claims. No team-size claims. "Working globally." Always name development, deployment, hosting and management together.
- EN at `/`, PT at `/pt/`, same components, strings from `content/i18n/`. Language switch links to the same route.
- Every page ends with the CTABlock. Hide LogoRow until real logos exist; never ship placeholders.
- Respect `prefers-reduced-motion` on every animation (logo hover, ProjectFlow, loader, card hover).
- Homepage JS budget < 15 KB. Lighthouse mobile ≥ 95 on all categories before you call anything done.

## Workflow
1. Scaffold project, tokens, Base layout, Nav (including mobile panel), Footer, CTABlock.
2. Homepage sections in the order in README "Homepage sections". Compare against `design/homepage-desktop.html` at 1440 and 1024, `homepage-mobile.html` at 390.
3. Secondary pages composed from the same components.
4. i18n: PT mirror of every route, hreflang, localised meta.
5. SEO/meta, OG template, JSON-LD, sitemap, robots, 404.
6. Run Lighthouse + axe; grep for `—`, `48h`, `team`; attach reports to the final PR.

## Ask Henrique for (do not fabricate)
Client logo SVGs, product screenshots (880×640), team/workspace photo, NIF, privacy policy text, form endpoint credentials.
