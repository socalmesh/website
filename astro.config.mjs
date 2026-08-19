// @ts-check
/*
 * Note: `||` and not `??` on purpose. A GitHub Actions expression that resolves to
 * nothing sets the variable to an empty string rather than leaving it unset, and
 * `'' ?? fallback` is `''` — which would silently build every link for the wrong
 * address. `||` treats empty as missing.
 */
/**
 * Astro build settings.
 *
 * Two environment variables decide where the site thinks it lives:
 *
 *   SITE_URL   the full address, e.g. https://socalmesh.org
 *   BASE_PATH  the folder it is served from: / for a real domain, /website/ on GitHub Pages
 *
 * You never set these by hand. The deploy workflow (.github/workflows/deploy.yml) asks
 * GitHub whether a custom domain is configured, and fills them in:
 *
 *   custom domain set  ->  SITE_URL=https://socalmesh.org        BASE_PATH=/
 *   not set yet        ->  SITE_URL=https://socalmesh.github.io  BASE_PATH=/website/
 *
 * That is the whole cutover: someone sets the custom domain in the repo's Pages settings
 * and re-runs Deploy. No file in this repo has to change.
 *
 * Running `npm run dev` on your own computer uses the defaults below and serves at /.
 */
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL || 'https://socalmesh.org',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [sitemap()],
});
