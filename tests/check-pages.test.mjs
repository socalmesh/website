/** Tests for scripts/check-pages.mjs, the check that reads the finished pages. */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scanPage, findProblems } from '../scripts/check-pages.mjs';

const page = (body, head = '<title>A page</title>') =>
  `<!doctype html><html lang="en"><head>${head}</head><body>${body}</body></html>`;

/** Runs the check on a small made-up site and returns what it complained about. */
function problems(site, base = '/') {
  const pages = new Map(Object.entries(site).map(([address, html]) => [address, scanPage(html)]));
  return findProblems(pages, base).map((p) => `${p.page}: ${p.what}`);
}

describe('scripts/check-pages.mjs', () => {
  it('is happy with a normal page', () => {
    assert.deepEqual(problems({ '/': page('<h1>Hello</h1><h2 id="maps">Maps</h2><a href="#maps">Maps</a>') }), []);
  });

  it('wants exactly one title', () => {
    assert.match(problems({ '/': page('<h1>x</h1>', '') })[0], /has no <title>/);
    assert.match(problems({ '/': page('<h1>x</h1>', '<title>a</title><title>b</title>') })[0], /has 2 <title> tags/);
    assert.match(problems({ '/': page('<h1>x</h1>', '<title>  </title>') })[0], /empty <title>/);
  });

  it('does not count the title of a drawing as a page title', () => {
    assert.deepEqual(problems({ '/': page('<h1>x</h1><svg><title>An icon</title></svg>') }), []);
  });

  it('wants exactly one main heading', () => {
    assert.match(problems({ '/': page('<h2>x</h2>') })[0], /no main heading/);
    assert.match(problems({ '/': page('<h1>a</h1><h1>b</h1>') })[0], /2 main headings/);
  });

  it('does not ask a redirect page for a main heading', () => {
    const head = '<title>Going to Discord</title><meta http-equiv="refresh" content="0; url=https://x.example">';
    assert.deepEqual(problems({ '/discord/': page('<p>One moment.</p>', head) }), []);
  });

  it('ignores headings inside comments and scripts', () => {
    const body = '<h1>x</h1><!-- <h1>old</h1> --><script>const s = "<h1>no</h1>";</script>';
    assert.deepEqual(problems({ '/': page(body) }), []);
  });

  it('reports an id that is used twice, once', () => {
    const found = problems({ '/': page('<h1 id="a">x</h1><p id="a">y</p><p id="a">z</p>') });
    assert.equal(found.length, 1);
    assert.match(found[0], /uses the id "a" more than once/);
  });

  it('reports a link to a section that is not on the page', () => {
    assert.match(problems({ '/': page('<h1>x</h1><a href="#nowhere">go</a>') })[0], /links to "#nowhere"/);
  });

  it('follows a section link to another page, however it is written', () => {
    const site = {
      '/website/': page('<h1>Home</h1><h2 id="maps">Maps</h2>'),
      '/website/help/': page(
        '<h1>Help</h1><a href="/website/#maps">ok</a><a href="../#maps">ok</a><a href="/website/#gone">bad</a><a href="../#lost">bad</a>',
      ),
    };
    const found = problems(site, '/website/');
    assert.equal(found.length, 2);
    assert.match(found[0], /"\/website\/#gone"/);
    assert.match(found[1], /"\.\.\/#lost"/);
  });

  it('accepts the links that always work', () => {
    const body = '<h1>x</h1><a href="#">top</a><a href="#top">top</a><a href="https://x.example/#there">out</a>';
    assert.deepEqual(problems({ '/': page(body) }), []);
  });

  it('accepts an old-style named anchor as a section', () => {
    assert.deepEqual(problems({ '/': page('<h1>x</h1><a name="old"></a><a href="#old">go</a>') }), []);
  });
});
