#!/usr/bin/env node
/**
 * The page-weight budget. Fails if the finished site got heavier than we meant it
 * to, so a huge photo or a big script cannot slip in unnoticed. No dependencies.
 *
 *   node scripts/check-weight.mjs --dist dist --base /website/
 *
 * It checks three things, against the limits in BUDGET just below:
 *
 *   1. No single file is over the limit for its kind (a picture, a script, ...).
 *   2. No page needs more than `pageBeforePictures` to show its text: the page
 *      itself plus its stylesheets, scripts and fonts. Pictures are not counted
 *      here, because they load afterwards and each has its own limit in 1.
 *   3. No page carries more than `pageScripts` of JavaScript.
 *
 * If this fails on something you meant to add, make the file smaller first. Raise
 * a limit only on purpose, in a pull request that says why.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, posix, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readTags, attribute } from './html-tags.mjs';

/**
 * Every limit, in kilobytes (KB). When this was written the biggest picture was
 * 246 KB, the heaviest page needed 91 KB before pictures, and no page had more
 * than 1 KB of JavaScript.
 */
export const BUDGET = {
  file: {
    picture: 350,
    script: 30,
    stylesheet: 50,
    font: 100,
    page: 100,
    other: 350,
  },
  pageBeforePictures: 150,
  pageScripts: 30,
};

const KINDS = {
  picture: ['.webp', '.png', '.jpg', '.jpeg', '.avif', '.gif', '.svg', '.ico'],
  script: ['.js', '.mjs'],
  stylesheet: ['.css'],
  font: ['.woff2', '.woff', '.ttf', '.otf'],
  page: ['.html'],
};

/** What to call a file of each kind in a message. */
const KIND_NAMES = {
  picture: 'A picture',
  script: 'A script',
  stylesheet: 'A stylesheet',
  font: 'A font',
  page: 'A page',
  other: 'A file',
};

/** "picture", "script", "stylesheet", "font", "page" or "other", from the file name. */
export function kindOf(fileName) {
  const ext = extname(fileName).toLowerCase();
  for (const [kind, extensions] of Object.entries(KINDS)) {
    if (extensions.includes(ext)) return kind;
  }
  return 'other';
}

const kb = (bytes) => Math.round(bytes / 1024);

/**
 * What one finished page pulls in before any picture: the local stylesheets,
 * scripts and fonts it names, and how much JavaScript is written into the page.
 */
export function scanPage(html) {
  const assets = new Set();
  let inlineScriptBytes = 0;

  const isBeforePictures = (address) =>
    ['script', 'stylesheet', 'font'].includes(kindOf(address.split(/[?#]/)[0]));

  for (const tag of readTags(html)) {
    if (tag.closing) continue;

    if (tag.name === 'link' || tag.name === 'script') {
      const address = (attribute(tag.attributes, 'href') ?? attribute(tag.attributes, 'src') ?? '').trim();
      if (address && isBeforePictures(address)) assets.add(address);
    }

    if (tag.name === 'script') {
      // Data written into the page as JSON is not a program, so it is not counted.
      const type = (attribute(tag.attributes, 'type') ?? '').toLowerCase();
      if (!/^application\/(ld\+)?json/.test(type)) inlineScriptBytes += Buffer.byteLength(tag.inner, 'utf8');
    }

    if (tag.name === 'style') {
      // Fonts are usually named inside a <style> block, not by a tag of their own.
      const fontUrl = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
      let u;
      while ((u = fontUrl.exec(tag.inner)) !== null) {
        if (kindOf(u[1].split(/[?#]/)[0]) === 'font') assets.add(u[1].trim());
      }
    }
  }

  return { assets: [...assets], inlineScriptBytes };
}

const EXTERNAL = /^([a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * Checks a whole site against the budget.
 *
 * `files` maps each file's path inside dist ("help/index.html") to its size in
 * bytes. `pages` maps each page's path to what scanPage() found on it. Returns
 * the list of things over budget (empty if all is well) and a line per page.
 */
export function findOverweight(files, pages, base = '/', budget = BUDGET) {
  const problems = [];
  const report = [];

  for (const [path, bytes] of files) {
    const kind = kindOf(path);
    const limit = budget.file[kind];
    if (bytes > limit * 1024) {
      const advice =
        kind === 'picture'
          ? 'Resize it so the long edge is 1600 pixels or less and save it again.'
          : 'Make it smaller.';
      problems.push({
        where: path,
        what: `is ${kb(bytes)} KB. ${KIND_NAMES[kind]} may be at most ${limit} KB. ${advice}`,
      });
    }
  }

  for (const [pagePath, page] of pages) {
    const address = posix.join(base, pagePath);
    const folder = posix.dirname(address) + '/';

    let before = files.get(pagePath) ?? 0;
    let scripts = page.inlineScriptBytes;

    for (const asset of page.assets) {
      if (EXTERNAL.test(asset)) continue;
      const clean = asset.split(/[?#]/)[0];
      const absolute = clean.startsWith('/') ? clean : posix.join(folder, clean);
      if (!absolute.startsWith(base)) continue;
      let rel = absolute.slice(base.length);
      try {
        rel = decodeURIComponent(rel);
      } catch {
        // Leave it as written.
      }
      const bytes = files.get(rel);
      if (bytes === undefined) continue; // A missing file is check-links's job.
      before += bytes;
      if (kindOf(rel) === 'script') scripts += bytes;
    }

    report.push({ page: address.replace(/(^|\/)index\.html$/, '$1'), before, scripts });

    if (before > budget.pageBeforePictures * 1024) {
      problems.push({
        where: pagePath,
        what: `needs ${kb(before)} KB before any picture loads (the page, its stylesheets, scripts and fonts). The limit is ${budget.pageBeforePictures} KB.`,
      });
    }
    if (scripts > budget.pageScripts * 1024) {
      problems.push({
        where: pagePath,
        what: `carries ${kb(scripts)} KB of JavaScript. The limit is ${budget.pageScripts} KB.`,
      });
    }
  }

  return { problems, report };
}

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
    else out.push(full);
  }
  return out;
}

function main() {
  const { dist, base } = parseArgs(process.argv.slice(2));
  const distRoot = resolve(dist);

  if (!existsSync(distRoot)) {
    console.error(`check-weight: no such directory: ${distRoot}`);
    process.exit(1);
  }

  const files = new Map();
  const pages = new Map();
  let total = 0;
  for (const file of walk(distRoot)) {
    const rel = file.slice(distRoot.length).replace(/\\/g, '/').replace(/^\//, '');
    let bytes;
    if (rel.endsWith('.html')) {
      // Read a page once and weigh what was read, so its size and its contents
      // can never be two different versions of the file.
      const content = readFileSync(file);
      bytes = content.length;
      pages.set(rel, scanPage(content.toString('utf8')));
    } else {
      bytes = statSync(file).size;
    }
    files.set(rel, bytes);
    total += bytes;
  }

  const { problems, report } = findOverweight(files, pages, base);

  console.log(`check-weight: ${pages.size} pages, ${files.size} files, ${kb(total)} KB in all`);
  for (const line of report.sort((a, b) => b.before - a.before)) {
    console.log(
      `  ${String(kb(line.before)).padStart(4)} KB before pictures, ${kb(line.scripts)} KB of scripts  ${line.page}`,
    );
  }
  const biggest = [...files].filter(([path]) => kindOf(path) === 'picture').sort((a, b) => b[1] - a[1])[0];
  if (biggest) {
    console.log(`  biggest picture: ${kb(biggest[1])} KB (limit ${BUDGET.file.picture} KB), ${biggest[0]}`);
  }

  if (problems.length > 0) {
    console.error(`\ncheck-weight: ${problems.length} thing(s) over the budget:\n`);
    for (const problem of problems) console.error(`  ${problem.where}\n    ${problem.what}`);
    console.error('\nThe limits are at the top of scripts/check-weight.mjs. Raise one only on purpose.');
    process.exit(1);
  }

  console.log(
    `check-weight: inside the budget (${BUDGET.pageBeforePictures} KB per page before pictures, ${BUDGET.pageScripts} KB of scripts per page).`,
  );
}

// Only run when started as a command. Importing this file (the tests do) runs nothing.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
