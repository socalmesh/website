/**
 * `npm run links` — the check that catches a link written as "/help/" instead of
 * going through the url() helper in src/lib/url.ts.
 *
 * That mistake is invisible when the site is built for a domain root, because a
 * bare "/help/" is correct there. It only shows up under a sub-folder address,
 * which is how the site is published today. So this builds the site the way it is
 * actually published, then checks every internal link against that.
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

const check = run('node', ['scripts/check-links.mjs', '--dist', 'dist', '--base', BASE]);
process.exit(check.status ?? 1);
