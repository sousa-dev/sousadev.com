import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Blog articles. One Markdown file per article, per language.
 *
 * Adding an article means adding one file under src/content/blog/ with
 * `locale`, `translationKey`, `title`, `description` and `pubDate`. Two files
 * sharing a `translationKey` are treated as translations of each other, which
 * is what the language switch and hreflang output use.
 *
 * `ogImage` is optional and almost always left out: `npm run og` generates a
 * branded social card per article from its title, and the article page falls
 * back to that. Set it only to point at a real image of your own, already
 * present under public/.
 *
 * The collection is intentionally empty: no articles have been supplied, and
 * the index renders an honest empty state rather than invented posts.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    locale: z.enum(['en', 'pt']),
    translationKey: z.string().min(1),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    /** Absolute path under public/, for example `/images/blog/my-post.png`. */
    ogImage: z
      .string()
      .regex(/^\/[^\s]+\.(png|jpe?g|webp)$/, 'ogImage must be an absolute path under public/ to a png, jpg or webp')
      .optional(),
  }),
});

export const collections = { blog };
