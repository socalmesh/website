#!/usr/bin/env node
/**
 * Internal link checker for the built site. No dependencies.
 *
 *   node scripts/check-links.mjs --dist dist --base /website/
 *
 * Walks every .html file in dist/, pulls out href= and src= values, and for each
 * internal one checks that the target exists in dist/ (as a file, or as a folder
 * with an index.html). External links are never fetched. Exits 1 with a list if
 * anything is missing.
 *
 * This exists because the site is served from a sub-folder on GitHub Pages: a link
 * written as "/help/" instead of url('/help/') works locally and 404s in production.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, posix } from 'node:path';

function parseArgs(argv) {
  const args = { dist: 'dist', base: '/' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dist') args.dist = argv[++i];
    else if (argv[i] === '--base') args.base = argv[++i];
  }
  if (!args.base.startsWith('/')) args.base = '/' + args.base;
  if (!args.base.endsWith('/')) args.base += '/';
  return args;
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

/** Every href="..." / src="..." value in the document (single or double quoted). */
function extractLinks(html) {
  const links = [];
  const re = /(?:href|src)\s*=\s*("([^"]*)"|'([^']*)')/gi;
  let m;
  while ((m = re.exec(html)) !== null) links.push((m[2] ?? m[3] ?? '').trim());
  return links;
}

const SKIP = /^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i;

function main() {
  const { dist, base } = parseArgs(process.argv.slice(2));
  const distRoot = resolve(dist);

  if (!existsSync(distRoot)) {
    console.error(`check-links: no such directory: ${distRoot}`);
    process.exit(1);
  }

  const files = walk(distRoot);
  const misses = [];
  let checked = 0;

  for (const file of files) {
    // URL path of the page itself, used to resolve relative links.
    const relPage = file.slice(distRoot.length).replace(/\\/g, '/');
    const pageUrl = posix.join(base, relPage.replace(/^\//, ''));
    const pageDir = posix.dirname(pageUrl);

    const html = readFileSync(file, 'utf8');

    for (const raw of extractLinks(html)) {
      if (!raw || SKIP.test(raw)) continue;

      // Drop query strings and fragments.
      const clean = raw.split('#')[0].split('?')[0];
      if (!clean) continue;

      const abs = clean.startsWith('/') ? clean : posix.join(pageDir, clean);

      if (!abs.startsWith(base)) {
        misses.push({ file: relPage, link: raw, why: `does not start with base "${base}"` });
        continue;
      }

      const rel = decodeURIComponent(abs.slice(base.length));
      const target = resolve(distRoot, rel);
      checked++;

      // A page is a real file (an image, robots.txt, and 404.html, which Astro
      // emits with its extension rather than as a folder), or a folder with an
      // index.html inside it.
      const ok =
        (existsSync(target) && statSync(target).isFile()) ||
        existsSync(join(target, 'index.html')) ||
        existsSync(target + '.html');

      if (!ok) misses.push({ file: relPage, link: raw, why: 'not found in dist' });
    }
  }

  console.log(
    `check-links: ${files.length} pages, ${checked} internal links, base "${base}"`,
  );

  if (misses.length > 0) {
    console.error(`\ncheck-links: ${misses.length} broken internal link(s):\n`);
    for (const miss of misses) {
      console.error(`  ${miss.file}\n    ${miss.link}  : ${miss.why}`);
    }
    process.exit(1);
  }

  console.log('check-links: all internal links resolve.');
}

main();
