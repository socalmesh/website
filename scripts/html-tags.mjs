/**
 * A small reader for the finished HTML pages, shared by the check scripts. No
 * dependencies.
 *
 * readTags() walks a page from start to end and hands back each tag it meets.
 * Comments are skipped, and so is everything written inside <script>, <style>
 * and <title>, because text in there only looks like tags.
 *
 * This is a reader for pages this site built itself, so the checks can count
 * things in them. It is not a cleaner: never use it to make HTML from somewhere
 * else safe to show.
 */

/** One tag, starting exactly where the search is told to look. */
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/y;

/** Elements whose contents are plain text, whatever they look like. */
const TEXT_ONLY = new Set(['script', 'style', 'title']);

/**
 * Yields { name, closing, attributes, inner } for every tag in the page, in order.
 * `name` is lower case. `attributes` is the raw text between the name and the ">".
 * `inner` is the text inside a <script>, <style> or <title>, and '' for anything else.
 */
export function* readTags(html) {
  const lower = html.toLowerCase();
  let at = 0;

  while (at < html.length) {
    const open = html.indexOf('<', at);
    if (open === -1) return;

    if (html.startsWith('<!--', open)) {
      const close = html.indexOf('-->', open + 4);
      at = close === -1 ? html.length : close + 3;
      continue;
    }

    TAG.lastIndex = open;
    const m = TAG.exec(html);
    if (!m) {
      at = open + 1;
      continue;
    }

    const closing = m[1] === '/';
    const name = m[2].toLowerCase();
    const end = TAG.lastIndex;
    let inner = '';
    at = end;

    if (!closing && TEXT_ONLY.has(name)) {
      // Jump straight to the matching end tag, so nothing in between is read as a tag.
      const close = lower.indexOf(`</${name}`, end);
      at = close === -1 ? html.length : close;
      inner = html.slice(end, at);
    }

    yield { name, closing, attributes: m[3], inner };
  }
}

/** Turns &amp; and friends back into the characters they stand for. */
export function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** The value of one attribute in a tag's attribute text, or undefined if it is not there. */
export function attribute(attributes, name) {
  const re = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i');
  const m = re.exec(attributes);
  if (!m) return undefined;
  return decodeEntities(m[1] ?? m[2] ?? m[3] ?? '');
}
