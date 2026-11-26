/**
 * `npm run links`, the check that catches a link written as "/help/" instead of
 * going through the url() helper in src/lib/url.ts.
 *
 * That mistake is invisible when the site is built for a domain root, because a
 * bare "/help/" is correct there. It only shows up under a sub-folder address,
 * which is how the checks build it. So this builds the site that way, then checks
 * every internal link against the result.
 *
 * It then reads the finished pages themselves (scripts/check-pages.mjs): one title
 * and one main heading each, no id used twice, and every link to a section landing
 * on a section that exists.
 *
 * Plain Node so it works the same on Windows, macOS and Linux.
 */
import { spawnSync } from 'node:child_process';

const BASE = '/website';
const SITE = 'https://socalmesh.github.io';

const run = (cmd, args, env) =>
  spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...env } });

console.log(`Building the site the way it is published (${SITE}${BASE}/) ...`);
const build = run('npx', ['astro', 'build'], { SITE_URL: SITE, BASE_PATH: BASE });
if (build.status !== 0) process.exit(build.status ?? 1);

// Both checks run even if the first one fails, so one run reports everything.
let failed = false;
for (const script of ['scripts/check-links.mjs', 'scripts/check-pages.mjs']) {
  const check = run('node', [script, '--dist', 'dist', '--base', BASE]);
  if (check.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
