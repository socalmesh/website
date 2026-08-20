/** Web app manifest, icon paths follow the base path the site is built for. */
import type { APIRoute } from 'astro';
import { site } from '../config/site';
import { url } from '../lib/url';

export const GET: APIRoute = () => {
  const manifest = {
    name: site.name,
    short_name: site.name,
    description: site.shortDescription,
    start_url: url('/'),
    scope: url('/'),
    display: 'standalone',
    background_color: site.themeColor,
    theme_color: site.themeColor,
    icons: [
      { src: url('brand/icon-192.png'), sizes: '192x192', type: 'image/png' },
      { src: url('brand/icon-512.png'), sizes: '512x512', type: 'image/png' },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
