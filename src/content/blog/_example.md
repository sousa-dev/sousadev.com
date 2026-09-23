---
# Copy this file to blog/en/<slug>.md (or blog/pt/<slug>.md), remove the
# leading underscore from the file name and fill it in. Files whose name starts
# with an underscore are ignored, so this template never publishes.
#
# locale:          en or pt. It decides which language index the article shows in.
# translationKey:  shared by an article and its translation. When both languages
#                  exist, the language switch moves between them; when only one
#                  exists, the other language is not advertised at all.
# draft:           true keeps it out of the build (visible in `npm run dev`).
# ogImage:         optional, and normally left out. `npm run og` generates a
#                  branded social card from the title of every article that has
#                  no ogImage, and `npm run check:output` fails if that card is
#                  missing, so run `npm run og` after adding an article. Set
#                  ogImage only to point at a real image of your own that is
#                  already in public/, for example /images/blog/my-post.png.
title: "Article title"
description: "One sentence shown on the index and used as the meta description."
locale: en
translationKey: article-slug
pubDate: 2026-01-01
draft: true
---

Opening paragraph.

## A section heading

Body copy, `inline code`, [links](https://sousadev.com) and lists all render.
