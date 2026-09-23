# Sousa Dev loader (transparent, no dependencies)
sousadev-loader.svg — inline it (or use <img>/<object>) anywhere. Animation is built into the SVG (SMIL), loops every 1.8s, background fully transparent.
Colours: set CSS vars on any ancestor when inlined — --sd-loader-ink (S chevron, default #F6F8F7 for dark UIs; use #0A1014 on light) and --sd-loader-green (default #0FA347).
Via <img> the vars can't be read, so it renders with the defaults (dark-UI colours). If you inline it more than once on a page, give each <mask> a unique id.
See embed-example.html.