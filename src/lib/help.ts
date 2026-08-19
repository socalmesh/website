/**
 * One definition of "which help articles are published, and in what order".
 *
 * Every page that lists articles uses this, so the home page, the help index and
 * the article routes can never disagree about what is published.
 * Articles marked `draft: true` are left out entirely; newest first.
 */
import { getCollection } from 'astro:content';

export async function publishedArticles() {
  const articles = await getCollection('help', ({ data }) => !data.draft);
  return articles.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
