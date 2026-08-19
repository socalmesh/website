/**
 * Base-aware URL helper.
 *
 * The site is built twice: once for a real domain (served at `/`) and once for the
 * GitHub Pages preview (served at `/website/`). Astro puts the current prefix in
 * `import.meta.env.BASE_URL`, so EVERY internal href/src must go through `url()`.
 * A bare "/help/" link would 404 on the preview build.
 *
 *   url('/help/')            -> '/help/'          or '/website/help/'
 *   url('photos/one.jpg')    -> '/photos/one.jpg'  or '/website/photos/one.jpg'
 *   url('https://x.example') -> unchanged
 */
export function url(path: string): string {
  if (
    /^[a-z][a-z0-9+.-]*:/i.test(path) ||
    path.startsWith('//') ||
    path.startsWith('#')
  ) {
    return path;
  }

  const base = import.meta.env.BASE_URL || '/';
  const joined = `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  return joined.replace(/\/{2,}/g, '/') || '/';
}

/**
 * Full https:// address for a page or asset. Used for share previews and robots.txt.
 * `siteUrl` is Astro.site, which comes from SITE_URL in astro.config.mjs.
 */
export function absoluteUrl(path: string, siteUrl?: URL | string): string {
  const rel = url(path);
  if (/^https?:/i.test(rel)) return rel;
  if (!siteUrl) return rel;
  return new URL(rel, siteUrl).href;
}

/** Byline / article dates, always rendered the same way: "August 18, 2026". */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Machine-readable date for <time datetime="...">, "2026-08-18". */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
