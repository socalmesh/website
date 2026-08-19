/**
 * robots.txt — generated at build time so the sitemap link always points at the
 * address the site was actually built for.
 */
import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/url';

export const GET: APIRoute = ({ site }) => {
  const sitemap = site ? absoluteUrl('sitemap-index.xml', site) : null;

  const body = [
    'User-agent: *',
    'Allow: /',
    ...(sitemap ? ['', `Sitemap: ${sitemap}`] : []),
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
