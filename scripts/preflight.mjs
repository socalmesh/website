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
 * Then it weighs the site against the budget in scripts/check-weight.mjs, so a
 * huge photo or a big script is caught here and not by a reader on a slow phone.
 *
 * Last, it opens every page in a browser and scans it for accessibility problems
 * (scripts/check-a11y.mjs). That one needs Chrome, Chromium or Edge installed. If
 * none is, it says so and is skipped here; the checks on a pull request still run it.
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

// Every check runs even if an earlier one fails, so one run reports everything.
let failed = false;
for (const script of [
  'scripts/check-links.mjs',
  'scripts/check-pages.mjs',
  'scripts/check-weight.mjs',
  'scripts/check-a11y.mjs',
]) {
  const check = run('node', [script, '--dist', 'dist', '--base', BASE]);
  if (check.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
