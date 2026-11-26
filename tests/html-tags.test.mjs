/** Tests for scripts/html-tags.mjs, the small HTML reader the check scripts share. */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readTags, attribute, decodeEntities } from '../scripts/html-tags.mjs';

const names = (html) => [...readTags(html)].map((tag) => (tag.closing ? '/' : '') + tag.name);

describe('scripts/html-tags.mjs', () => {
  it('hands back every tag in order, lower case', () => {
    assert.deepEqual(names('<P>one <B>two</B></P>'), ['p', 'b', '/b', '/p']);
  });

  it('steps over comments, including one that is never closed', () => {
    assert.deepEqual(names('<p>a</p><!-- <h1>no</h1> --><i>b</i>'), ['p', '/p', 'i', '/i']);
    assert.deepEqual(names('<p>a</p><!-- <h1>never closed'), ['p', '/p']);
  });

  it('does not read what is inside a script or a style as tags', () => {
    const html = '<script>if (a < b) write("<h1>x</h1>")</script><style>a > b {} /* <h1> */</style><h2>real</h2>';
    assert.deepEqual(names(html), ['script', '/script', 'style', '/style', 'h2', '/h2']);
  });

  it('gives the text inside a script, a style and a title', () => {
    const tags = [...readTags('<title>Help &amp; more</title><script>let a = 1;</script>')];
    assert.equal(tags[0].inner, 'Help &amp; more');
    assert.equal(tags[2].inner, 'let a = 1;');
  });

  it('does not put a script tag together out of pieces', () => {
    const found = names('<scr<!-- -->ipt>alert(1)</scr<!-- -->ipt><h1>x</h1>');
    assert.equal(found.includes('script'), false);
    assert.deepEqual(found.slice(-2), ['h1', '/h1']);
  });

  it('copes with an end tag written the long way', () => {
    assert.deepEqual(names('<script>var a;</script\t\n bar><h1>x</h1>'), ['script', '/script', 'h1', '/h1']);
  });

  it('reads attributes however they are quoted', () => {
    const [tag] = [...readTags(`<a href="/a?x=1&amp;y=2" class='big' data-n=3 title="a > b">`)];
    assert.equal(attribute(tag.attributes, 'href'), '/a?x=1&y=2');
    assert.equal(attribute(tag.attributes, 'class'), 'big');
    assert.equal(attribute(tag.attributes, 'data-n'), '3');
    assert.equal(attribute(tag.attributes, 'title'), 'a > b');
    assert.equal(attribute(tag.attributes, 'missing'), undefined);
  });

  it('decodes an entity once, not twice', () => {
    assert.equal(decodeEntities('&amp;lt;b&amp;gt; &lt;i&gt; &#65;&#x42;'), '&lt;b&gt; <i> AB');
  });
});
