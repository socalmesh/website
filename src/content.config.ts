/**
 * The "help" collection — every markdown file in src/content/help/ becomes a help article.
 *
 * The block at the top of each file (between the --- lines) must contain:
 *
 *   title        The article headline. Shows as the page title and in the list.
 *   description  One sentence. Shows under the title in the list, and in Google results.
 *   author       Who wrote it, e.g. "SUSHI". Shows in the byline — use a real handle.
 *   date         Published date, written as 2026-08-18. Sets the byline and the sort order.
 *   updated      Optional. Add when you revise an article:  updated: 2026-09-01
 *   tags         Optional list, e.g. ["mqtt", "getting-started"].
 *   draft        Optional.  draft: true  keeps the article off the site entirely.
 *
 * The file name is the web address:
 *   how-do-i-uplink-to-mqtt.md  ->  /help/how-do-i-uplink-to-mqtt/
 * Use lowercase letters and hyphens only — no spaces, no capitals.
 */
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const help = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/help' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { help };
