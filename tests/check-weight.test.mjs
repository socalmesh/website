/** Tests for scripts/check-weight.mjs, the page-weight budget. */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { kindOf, scanPage, findOverweight } from '../scripts/check-weight.mjs';

const KB = 1024;
const budget = {
  file: { picture: 350, script: 30, stylesheet: 50, font: 100, page: 100, other: 350 },
  pageBeforePictures: 150,
  pageScripts: 30,
};

const html = (head = '', body = '') => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;

/** Runs the budget on a made-up site: file sizes in KB, and the HTML of each page. */
function check(sizesInKb, pageHtml, base = '/') {
  const files = new Map(Object.entries(sizesInKb).map(([path, size]) => [path, size * KB]));
  const pages = new Map(Object.entries(pageHtml).map(([path, text]) => [path, scanPage(text)]));
  return findOverweight(files, pages, base, budget);
}

describe('scripts/check-weight.mjs', () => {
  it('knows what kind of file it is looking at', () => {
    assert.equal(kindOf('photos/one.WEBP'), 'picture');
    assert.equal(kindOf('_astro/app.js'), 'script');
    assert.equal(kindOf('_astro/site.css'), 'stylesheet');
    assert.equal(kindOf('fonts/inter.woff2'), 'font');
    assert.equal(kindOf('help/index.html'), 'page');
    assert.equal(kindOf('robots.txt'), 'other');
  });

  it('is happy with a light site', () => {
    const { problems, report } = check(
      { 'index.html': 30, 'a.css': 10, 'font.woff2': 47, 'photo.webp': 246 },
      { 'index.html': html('<link rel="stylesheet" href="/a.css"><link rel="preload" href="/font.woff2">') },
    );
    assert.deepEqual(problems, []);
    assert.equal(report[0].before, 87 * KB);
  });

  it('reports a picture that is too big, and says how to fix it', () => {
    const { problems } = check({ 'index.html': 5, 'huge.jpg': 600 }, { 'index.html': html() });
    assert.equal(problems.length, 1);
    assert.match(problems[0].what, /is 600 KB\. A picture may be at most 350 KB\. Resize it/);
  });

  it('does not count pictures towards what a page needs before pictures', () => {
    const { problems, report } = check(
      { 'index.html': 20, 'one.webp': 300, 'two.webp': 300 },
      { 'index.html': html('', '<img src="/one.webp"><img src="/two.webp">') },
    );
    assert.deepEqual(problems, []);
    assert.equal(report[0].before, 20 * KB);
  });

  it('reports a page that needs too much before pictures', () => {
    const { problems } = check(
      { 'index.html': 90, 'a.css': 45, 'font.woff2': 90 },
      { 'index.html': html('<link rel="stylesheet" href="/a.css"><style>@font-face { src: url("/font.woff2"); }</style>') },
    );
    assert.equal(problems.length, 1);
    assert.match(problems[0].what, /needs 225 KB before any picture loads/);
  });

  it('adds up script files and scripts written into the page', () => {
    const inline = 'x'.repeat(10 * KB);
    const { problems } = check(
      { 'index.html': 15, 'a.js': 25 },
      { 'index.html': html(`<script src="/a.js"></script><script>${inline}</script>`) },
    );
    assert.equal(problems.length, 1);
    assert.match(problems[0].what, /carries 35 KB of JavaScript/);
  });

  it('does not count data written into the page as a script', () => {
    const data = `{"a":"${'x'.repeat(40 * KB)}"}`;
    const { problems } = check(
      { 'index.html': 45 },
      { 'index.html': html(`<script type="application/ld+json">${data}</script>`) },
    );
    assert.deepEqual(problems, []);
  });

  it('finds a page\'s files under a sub-folder address, and ignores other websites', () => {
    const { report } = check(
      { 'help/index.html': 10, '_astro/a.css': 5, 'help/local.css': 2 },
      {
        'help/index.html': html(
          '<link rel="stylesheet" href="/website/_astro/a.css"><link rel="stylesheet" href="local.css"><link rel="stylesheet" href="https://x.example/big.css">',
        ),
      },
      '/website/',
    );
    assert.equal(report[0].before, 17 * KB);
    assert.equal(report[0].page, '/website/help/');
  });
});
