import type { ImageMetadata } from 'astro';
import metadata from '../content/client-logos.json';

export interface CompanyLogo {
  /** File name inside src/assets/companies/. */
  file: string;
  /** Company name, used as the accessible name of the logo. */
  name: string;
  /** Imported image, optimized by Astro at build time. */
  image: ImageMetadata;
}

interface LogoMeta {
  name: string;
  /**
   * What the relationship actually is. Kept beside the logo so nobody has to
   * guess, and so the set can be reviewed against the label above it.
   */
  relationship?: { en: string; pt: string };
}

const meta = metadata as Record<string, LogoMeta>;

/**
 * Every image in src/assets/companies/ becomes a logo in the strip. Those files
 * are generated from the originals in assets/companies/ by
 * scripts/normalize-logos.mjs, which runs as part of the build, so adding,
 * renaming or deleting an original is all it takes to change the strip.
 *
 * Order is the directory's own alphabetical order, which is what makes a
 * numeric prefix work: `1-acme.png` comes before `2-globex.png`, and files with
 * no prefix sort after the numbered ones. The JSON beside this file supplies the company name and
 * the nature of the relationship; a file with no entry falls back to a name
 * derived from its file name, so a logo can never render without an accessible
 * name.
 *
 * The directory is under src/ rather than public/ so Astro's image pipeline
 * converts each file to WebP at the size the row actually renders. The
 * originals are several hundred pixels wide and, served as-is, were the three
 * heaviest requests on the homepage.
 */
const files = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/companies/*.{png,jpg,jpeg,webp,avif,gif}',
  { eager: true },
);

export const logos: CompanyLogo[] = Object.entries(files)
  .map(([filePath, module]) => {
    const file = filePath.split('/').pop() ?? filePath;
    return {
      file,
      name:
        meta[file]?.name ??
        // Drop the ordering prefix before falling back to the file name.
        file
          .replace(/\.[^.]+$/, '')
          .replace(/^\d+[-_]/, '')
          .replace(/[-_]+/g, ' '),
      image: module.default,
    };
  })
  // Plain alphabetical by file name, which is the order the directory listing
  // shows. Note that this is a string sort, so a two digit prefix sorts next to
  // its first digit: `10-` lands between `1-` and `2-`. Pad to `01-`, `02-` if
  // you ever get past nine logos and want them in counting order.
  .sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));

/**
 * The row stays hidden below this many logos: a row of one or two reads as a
 * gap rather than as evidence.
 */
export const companyLogoMinimum = 4;
export const showLogoRow = logos.length >= companyLogoMinimum;
