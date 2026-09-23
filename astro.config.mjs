// @ts-check
import { defineConfig } from 'astro/config';

// sousadev.com, static output. See docs/brand-revamp/IMPLEMENTATION.md.
// Trailing-slash policy: never, except the site root. Used consistently by
// src/lib/routes.ts for links, canonicals, hreflang and the sitemap.
export default defineConfig({
  site: 'https://sousadev.com',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'directory',
    // One HTML request, no render-blocking stylesheet round trip. The whole
    // sheet is about 8 KB compressed, so inlining beats caching it separately.
    inlineStylesheets: 'always',
  },
  compressHTML: true,
  devToolbar: { enabled: false },
  prefetch: false,
  image: {
    // No remote images: every image is a local, reviewed asset.
    remotePatterns: [],
  },
  vite: {
    build: {
      // Keep the small per-component scripts inline-free so the byte budget in
      // scripts/check-output.mjs can measure real transferred JS.
      assetsInlineLimit: 0,
    },
  },
});
