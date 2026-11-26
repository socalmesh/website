/**
 * Tests for src/lib/url.ts, the helper every internal link goes through.
 *
 *   npm test
 *
 * These use Node's built-in test runner, so there is nothing to install. The
 * helper is a TypeScript file, which Node can read directly from version 22.18
 * on. On an older Node the tests are skipped with a note instead of failing.
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

const canReadTypeScript = Boolean(process.features.typescript);
const skip = canReadTypeScript ? false : 'needs Node 22.18 or newer, which can read .ts files';

describe('src/lib/url.ts', { skip }, () => {
  let lib;
  before(async () => {
    lib = await import('../src/lib/url.ts');
  });

  describe('withBase, the site at the top of a domain', () => {
    it('leaves a path alone', () => {
      assert.equal(lib.withBase('/', '/help/'), '/help/');
      assert.equal(lib.withBase('/', '/'), '/');
    });

    it('adds the leading slash when it is missing', () => {
      assert.equal(lib.withBase('/', 'photos/one.jpg'), '/photos/one.jpg');
    });
  });

  describe('withBase, the site in a sub-folder', () => {
    it('puts the folder in front', () => {
      assert.equal(lib.withBase('/website/', '/help/'), '/website/help/');
      assert.equal(lib.withBase('/website/', 'photos/one.jpg'), '/website/photos/one.jpg');
    });

    it('sends the home page to the folder itself', () => {
      assert.equal(lib.withBase('/website/', '/'), '/website/');
    });

    it('works whether or not the folder ends in a slash', () => {
      assert.equal(lib.withBase('/website', '/help/'), '/website/help/');
    });

    it('never doubles a slash', () => {
      assert.equal(lib.withBase('/website/', '/help//setup/'), '/website/help/setup/');
    });

    it('keeps a jump to a section on another page', () => {
      assert.equal(lib.withBase('/website/', '/#channels'), '/website/#channels');
    });
  });

  describe('withBase, things that are not internal paths', () => {
    it('leaves a full address alone', () => {
      assert.equal(lib.withBase('/website/', 'https://x.example/a'), 'https://x.example/a');
      assert.equal(lib.withBase('/website/', 'mailto:someone@x.example'), 'mailto:someone@x.example');
    });

    it('leaves an address that starts with two slashes alone', () => {
      assert.equal(lib.withBase('/website/', '//cdn.x.example/a.js'), '//cdn.x.example/a.js');
    });

    it('leaves a jump within the same page alone', () => {
      assert.equal(lib.withBase('/website/', '#maps'), '#maps');
    });
  });

  describe('url', () => {
    it('treats the site as living at "/" outside Astro', () => {
      assert.equal(lib.url('/help/'), '/help/');
      assert.equal(lib.url('https://x.example'), 'https://x.example');
    });
  });

  describe('absoluteUrl', () => {
    it('makes a full address from a path and the site address', () => {
      assert.equal(lib.absoluteUrl('/help/', 'https://socalmesh.org'), 'https://socalmesh.org/help/');
      assert.equal(lib.absoluteUrl('/help/', new URL('https://socalmesh.org')), 'https://socalmesh.org/help/');
    });

    it('leaves an address that is already full alone', () => {
      assert.equal(lib.absoluteUrl('https://x.example/a', 'https://socalmesh.org'), 'https://x.example/a');
    });

    it('gives back the path when it is not told the site address', () => {
      assert.equal(lib.absoluteUrl('/help/'), '/help/');
    });
  });

  describe('dates', () => {
    it('writes a byline date the long way', () => {
      assert.equal(lib.formatDate(new Date('2026-08-18T00:00:00Z')), 'August 18, 2026');
    });

    it('does not slip to the next or previous day near midnight', () => {
      assert.equal(lib.formatDate(new Date('2026-08-18T23:59:00Z')), 'August 18, 2026');
      assert.equal(lib.formatDate(new Date('2026-08-18T00:01:00Z')), 'August 18, 2026');
    });

    it('writes the machine-readable date as year-month-day', () => {
      assert.equal(lib.isoDate(new Date('2026-08-18T23:59:00Z')), '2026-08-18');
    });
  });
});
