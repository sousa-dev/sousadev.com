/**
 * Reads just enough of the blog frontmatter for the build scripts: which
 * articles are published, and whether each brings its own social image.
 *
 * The Markdown body is irrelevant here, and the schema in
 * src/content.config.ts is what actually validates an article. This exists so
 * the social image generator and the output check agree on one list.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export function frontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z][\w]*):\s*(.*)$/);
    if (!field) continue;
    let value = field[2].trim();
    if (value.startsWith('#') || value === '') continue;
    value = value.replace(/\s+#.*$/, '').trim();
    if (/^".*"$/.test(value) || /^'.*'$/.test(value)) value = value.slice(1, -1);
    data[field[1]] = value === 'true' ? true : value === 'false' ? false : value;
  }
  return data;
}

/** Published articles per language, mirroring src/lib/blog.ts. */
export async function readArticles(root) {
  const base = path.join(root, 'src', 'content', 'blog');
  const found = [];
  for (const locale of ['en', 'pt']) {
    let files = [];
    try {
      files = await readdir(path.join(base, locale));
    } catch {
      continue;
    }
    for (const file of files) {
      if (!file.endsWith('.md') || file.startsWith('_')) continue;
      const data = frontmatter(await readFile(path.join(base, locale, file), 'utf8'));
      if (data.draft === true) continue;
      found.push({
        locale,
        slug: file.replace(/\.md$/, ''),
        title: data.title ?? file,
        ogImage: data.ogImage,
      });
    }
  }
  return found;
}
