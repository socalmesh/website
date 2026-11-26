#!/usr/bin/env node
/**
 * Checks the finished pages, not the source they were built from. No dependencies.
 *
 *   node scripts/check-pages.mjs --dist dist --base /website/
 *
 * Reads every .html file in dist/ and fails if:
 *
 *   - a page does not have exactly one <title>, or the title is empty;
 *   - a page does not have exactly one main heading (<h1>);
 *   - an id is used twice on the same page;
 *   - a link to a section, like "#maps" or "/help/#setup", points at a section
 *     that is not on the page it leads to.
 *
 * These are the mistakes the other checks cannot see. The source can be valid, the
 * build can pass and every link can lead to a real page, and the page a reader gets
 * still has two main headings or a menu link that jumps nowhere.
 *
 * A redirect page (one that only forwards the reader somewhere else, like /discord/)
 * has no heading of its own, so the main heading rule skips it.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, posix } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readTags, attribute, decodeEntities } from './html-tags.mjs';

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

/** Reads one finished page and reports what the checks need to know about it. */
export function scanPage(html) {
  const page = { titles: [], h1: 0, ids: [], anchors: [], links: [], redirect: false };

  // A drawing (<svg>) may carry a <title> of its own. That is a label for the
  // drawing, not the page title, so titles are only counted outside drawings.
  let svgDepth = 0;

  for (const tag of readTags(html)) {
    if (tag.name === 'svg') {
      const selfClosing = tag.attributes.trimEnd().endsWith('/');
      svgDepth = Math.max(0, svgDepth + (tag.closing ? -1 : selfClosing ? 0 : 1));
    }
    if (tag.closing) continue;

    const id = attribute(tag.attributes, 'id');
    if (id !== undefined && id !== '') page.ids.push(id);

    if (tag.name === 'title' && svgDepth === 0) {
      page.titles.push(decodeEntities(tag.inner).trim());
    } else if (tag.name === 'h1') {
      page.h1++;
    } else if (tag.name === 'a' || tag.name === 'area') {
      const anchorName = attribute(tag.attributes, 'name');
      if (anchorName) page.anchors.push(anchorName);
      const href = attribute(tag.attributes, 'href');
      if (href !== undefined) page.links.push(href.trim());
    } else if (tag.name === 'meta') {
      const equiv = attribute(tag.attributes, 'http-equiv') ?? '';
      if (equiv.toLowerCase() === 'refresh') page.redirect = true;
    }
  }

  return page;
}

const EXTERNAL = /^([a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * Checks a whole site. `pages` maps each page's address (like "/website/help/")
 * to what scanPage() found on it. Returns a list of problems, empty if all is well.
 */
export function findProblems(pages, base = '/') {
  const problems = [];
  const lookup = (address) =>
    pages.get(address) ??
    pages.get(address.endsWith('/') ? address + 'index.html' : address + '/index.html') ??
    pages.get(address + '.html');

  for (const [address, page] of pages) {
    const add = (what) => problems.push({ page: address, what });

    if (page.titles.length === 0) add('has no <title>');
    else if (page.titles.length > 1) add(`has ${page.titles.length} <title> tags, a page needs exactly one`);
    else if (page.titles[0] === '') add('has an empty <title>');

    if (!page.redirect) {
      if (page.h1 === 0) add('has no main heading (<h1>)');
      else if (page.h1 > 1) add(`has ${page.h1} main headings (<h1>), a page needs exactly one`);
    }

    const seen = new Set();
    const reported = new Set();
    for (const id of page.ids) {
      if (seen.has(id) && !reported.has(id)) {
        add(`uses the id "${id}" more than once`);
        reported.add(id);
      }
      seen.add(id);
    }

    for (const href of page.links) {
      const hash = href.indexOf('#');
      if (hash === -1 || EXTERNAL.test(href)) continue;

      let fragment = href.slice(hash + 1);
      try {
        fragment = decodeURIComponent(fragment);
      } catch {
        // Leave it as written; it will simply not match anything.
      }
      // "#" and "#top" always mean the top of the page, with or without a matching id.
      if (fragment === '' || fragment.toLowerCase() === 'top') continue;

      const path = href.slice(0, hash).split('?')[0];
      let target = page;
      if (path !== '') {
        // A page served as "/help/" is its own folder; "/404.html" sits in its parent.
        const folder = address.endsWith('/') ? address : posix.dirname(address) + '/';
        const targetAddress = path.startsWith('/') ? path : posix.join(folder, path);
        if (!targetAddress.startsWith(base)) continue; // check-links reports this one.
        target = lookup(targetAddress);
        if (!target) continue; // A missing page is check-links's job to report.
      }

      if (!target.ids.includes(fragment) && !target.anchors.includes(fragment)) {
        add(
          path === ''
            ? `links to "#${fragment}", and nothing on this page has that id`
            : `links to "${href}", and nothing on that page has the id "${fragment}"`,
        );
      }
    }
  }

  return problems;
}

function main() {
  const { dist, base } = parseArgs(process.argv.slice(2));
  const distRoot = resolve(dist);

  if (!existsSync(distRoot)) {
    console.error(`check-pages: no such directory: ${distRoot}`);
    process.exit(1);
  }

  const pages = new Map();
  for (const file of walk(distRoot)) {
    const rel = file.slice(distRoot.length).replace(/\\/g, '/').replace(/^\//, '');
    // "help/index.html" is served as "/website/help/"; "404.html" keeps its name.
    const address = posix.join(base, rel).replace(/(^|\/)index\.html$/, '$1');
    pages.set(address, scanPage(readFileSync(file, 'utf8')));
  }

  const problems = findProblems(pages, base);

  let ids = 0;
  let sectionLinks = 0;
  for (const page of pages.values()) {
    ids += page.ids.length;
    sectionLinks += page.links.filter((href) => href.includes('#') && !EXTERNAL.test(href)).length;
  }
  console.log(
    `check-pages: ${pages.size} pages, ${ids} ids, ${sectionLinks} links to sections, base "${base}"`,
  );

  if (problems.length > 0) {
    console.error(`\ncheck-pages: ${problems.length} problem(s) in the finished pages:\n`);
    for (const problem of problems) console.error(`  ${problem.page}\n    ${problem.what}`);
    process.exit(1);
  }

  console.log('check-pages: every page has one title and one main heading, no id is repeated, and every section link lands.');
}

// Only run when started as a command. Importing this file (the tests do) runs nothing.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
