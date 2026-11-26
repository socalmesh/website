/**
 * Tests for the parts of scripts/check-a11y.mjs that do not need a browser:
 * finding one, spotting a redirect page, and folding findings together.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { findBrowser, isRedirectPage, mergeFindings } from '../scripts/check-a11y.mjs';

describe('scripts/check-a11y.mjs', () => {
  describe('findBrowser', () => {
    it('uses CHROME_PATH when it points at something', () => {
      assert.equal(findBrowser({ CHROME_PATH: '/opt/my/chrome' }, 'linux', () => true), '/opt/my/chrome');
    });

    it('does not fall back to another browser when CHROME_PATH is wrong', () => {
      const onlyChromium = (path) => path === '/usr/bin/chromium';
      assert.equal(findBrowser({ CHROME_PATH: '/nope', PATH: '/usr/bin' }, 'linux', onlyChromium), undefined);
    });

    it('looks along PATH on Linux', () => {
      const onlyChromium = (path) => path === '/usr/bin/chromium';
      assert.equal(findBrowser({ PATH: '/usr/local/bin:/usr/bin' }, 'linux', onlyChromium), '/usr/bin/chromium');
    });

    it('looks in Applications on a Mac', () => {
      const edge = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
      assert.equal(findBrowser({}, 'darwin', (path) => path === edge), edge);
    });

    it('finds Edge on Windows, which every Windows computer has', () => {
      const found = findBrowser({ 'PROGRAMFILES(X86)': 'C:\\Program Files (x86)' }, 'win32', (path) => /msedge\.exe$/.test(path));
      assert.match(found, /Microsoft.Edge.Application.msedge\.exe$/);
    });

    it('says so when there is no browser', () => {
      assert.equal(findBrowser({ PATH: '/usr/bin' }, 'linux', () => false), undefined);
    });
  });

  describe('isRedirectPage', () => {
    it('spots a page that only forwards somewhere else', () => {
      assert.equal(isRedirectPage('<head><meta http-equiv="refresh" content="0; url=https://x.example"></head>'), true);
    });

    it('does not mistake an ordinary page, or a comment, for one', () => {
      assert.equal(isRedirectPage('<head><meta charset="utf-8"><title>Help</title></head>'), false);
      assert.equal(isRedirectPage('<head><!-- <meta http-equiv="refresh" content="0"> --></head>'), false);
    });
  });

  describe('mergeFindings', () => {
    const finding = (view, target = '.caption') => ({ page: '/', rule: 'color-contrast', target, view });

    it('reports a problem seen at both screen sizes once', () => {
      const merged = mergeFindings([finding('desktop'), finding('phone')]);
      assert.equal(merged.length, 1);
      assert.deepEqual(merged[0].views, ['desktop', 'phone']);
    });

    it('keeps different problems apart', () => {
      assert.equal(mergeFindings([finding('desktop'), finding('desktop', '.other')]).length, 2);
    });
  });
});
