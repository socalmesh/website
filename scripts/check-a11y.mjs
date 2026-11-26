#!/usr/bin/env node
/**
 * The accessibility scan. Opens every finished page in a real browser and fails
 * if it finds a problem that keeps people from using the page: text with too
 * little contrast, a picture with no description, a link or button with no name,
 * headings out of order, and so on.
 *
 *   node scripts/check-a11y.mjs --dist dist --base /website/
 *
 * The rules come from axe-core, the open source engine most accessibility tools
 * are built on. It is the one library this check needs (a "devDependency": used
 * while checking, never sent to visitors). The browser is whatever Chrome,
 * Chromium or Edge is already installed. Nothing is downloaded.
 *
 * Each page is checked twice, at a desktop width and at a phone width, because
 * the layout changes and so can the problems.
 *
 * The browser is not allowed to reach the internet while it does this. The pages
 * come from a tiny server on this computer, and every other address is blocked.
 * That keeps the result the same from one run to the next, and it means the
 * Discord member list embedded on the home page is not part of the scan: it is
 * Discord's page, not ours.
 *
 * If no browser is installed, the scan says so and steps aside. In the checks on
 * a pull request there always is one, and there a missing browser is a failure.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve, extname, delimiter, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

/** The two screen sizes every page is checked at. */
const VIEWS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'phone', width: 390, height: 844 },
];

/** How long to wait for the browser to start, and for one page to load. */
const START_TIMEOUT_MS = 30_000;
const PAGE_TIMEOUT_MS = 30_000;

/**
 * Finds a browser to use, or returns undefined. Set CHROME_PATH to pick one
 * yourself. `exists` is only passed in by the tests.
 */
export function findBrowser(env = process.env, platform = process.platform, exists = existsSync) {
  if (env.CHROME_PATH) return exists(env.CHROME_PATH) ? env.CHROME_PATH : undefined;

  let candidates = [];
  if (platform === 'win32') {
    const roots = [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter(Boolean);
    for (const app of [
      ['Google', 'Chrome', 'Application', 'chrome.exe'],
      ['Microsoft', 'Edge', 'Application', 'msedge.exe'],
      ['Chromium', 'Application', 'chrome.exe'],
    ]) {
      for (const root of roots) candidates.push(join(root, ...app));
    }
  } else if (platform === 'darwin') {
    const apps = [
      'Google Chrome.app/Contents/MacOS/Google Chrome',
      'Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      'Chromium.app/Contents/MacOS/Chromium',
    ];
    for (const app of apps) {
      candidates.push(`/Applications/${app}`);
      if (env.HOME) candidates.push(`${env.HOME}/Applications/${app}`);
    }
  } else {
    const names = [
      'google-chrome',
      'google-chrome-stable',
      'chromium',
      'chromium-browser',
      'microsoft-edge',
      'microsoft-edge-stable',
    ];
    const folders = (env.PATH || '').split(delimiter).filter(Boolean);
    for (const name of names) for (const folder of folders) candidates.push(join(folder, name));
  }

  return candidates.find((candidate) => exists(candidate));
}

/** True for a page that only forwards the reader somewhere else, like /discord/. */
export function isRedirectPage(html) {
  return /<meta\b[^>]*http-equiv\s*=\s*["']?refresh/i.test(html.replace(/<!--[\s\S]*?-->/g, ''));
}

/**
 * Folds the raw findings into one entry per problem, so a problem seen at both
 * screen sizes is reported once and says so.
 */
export function mergeFindings(findings) {
  const merged = new Map();
  for (const finding of findings) {
    const key = `${finding.page}\n${finding.rule}\n${finding.target}`;
    const seen = merged.get(key);
    if (seen) {
      if (!seen.views.includes(finding.view)) seen.views.push(finding.view);
    } else {
      merged.set(key, { ...finding, views: [finding.view] });
    }
  }
  return [...merged.values()];
}

function parseArgs(argv) {
  const args = { dist: 'dist', base: '/' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dist') args.dist = argv[++i];
    else if (argv[i] === '--base') args.base = argv[++i];
  }
  if (!args.base.startsWith('/')) args.base = '/' + args.base;
  if (!args.base.endsWith('/')) args.base += '/';
  return args;
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

/** Serves the built site from this computer only, under the same address prefix it is published with. */
function serve(distRoot, base) {
  const server = createServer((request, response) => {
    let path;
    try {
      path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    } catch {
      path = '';
    }
    let file = path.startsWith(base) ? resolve(distRoot, path.slice(base.length)) : null;
    // Never serve anything from outside the built site.
    if (file && file !== distRoot && !file.startsWith(distRoot + sep)) file = null;
    if (file && existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!file || !existsSync(file)) {
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('Not found');
      return;
    }
    response.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream' });
    response.end(readFileSync(file));
  });
  return new Promise((done) => server.listen(0, '127.0.0.1', () => done(server)));
}

/** Starts the browser with no window and returns a way to give it commands. */
async function startBrowser(executable, sandbox) {
  const profile = mkdtempSync(join(tmpdir(), 'socalmesh-a11y-'));
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    // Only this computer can be reached. Every other address fails to look up.
    '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1',
    'about:blank',
  ];
  if (!sandbox) args.unshift('--no-sandbox');

  const child = spawn(executable, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  const stop = () => {
    child.kill();
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      // A leftover temporary folder is not worth failing over.
    }
  };

  let address;
  try {
    address = await new Promise((found, failed) => {
      let output = '';
      const timer = setTimeout(() => failed(new Error('it did not start within 30 seconds')), START_TIMEOUT_MS);
      child.stderr.on('data', (chunk) => {
        output += chunk;
        const m = /DevTools listening on (ws:\/\/\S+)/.exec(output);
        if (m) {
          clearTimeout(timer);
          found(m[1]);
        }
      });
      child.on('error', (error) => {
        clearTimeout(timer);
        failed(error);
      });
      child.on('exit', (code) => {
        clearTimeout(timer);
        failed(new Error(`it stopped straight away (exit code ${code}). ${output.trim().split('\n').slice(-3).join(' ')}`));
      });
    });
  } catch (error) {
    stop();
    throw error;
  }

  const http = address.replace(/^ws:/, 'http:').replace(/\/devtools\/.*$/, '');
  const targets = await (await fetch(`${http}/json/list`)).json();
  const version = await (await fetch(`${http}/json/version`)).json();
  const socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((opened, failed) => {
    socket.onopen = opened;
    socket.onerror = () => failed(new Error('could not connect to it'));
  });

  let nextId = 0;
  const waiting = new Map();
  const listeners = new Set();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id !== undefined) {
      waiting.get(message.id)?.(message);
      waiting.delete(message.id);
    } else {
      for (const listener of listeners) listener(message);
    }
  };

  const send = (method, params = {}) =>
    new Promise((answered, failed) => {
      const id = ++nextId;
      waiting.set(id, (message) =>
        message.error ? failed(new Error(`${method}: ${message.error.message}`)) : answered(message.result),
      );
      socket.send(JSON.stringify({ id, method, params }));
    });

  /** Resolves when the browser reports the named event, or fails after a while. */
  const waitFor = (eventName, ms) =>
    new Promise((happened, failed) => {
      const timer = setTimeout(() => {
        listeners.delete(listener);
        failed(new Error(`the page did not finish loading within ${ms / 1000} seconds`));
      }, ms);
      const listener = (message) => {
        if (message.method !== eventName) return;
        clearTimeout(timer);
        listeners.delete(listener);
        happened();
      };
      listeners.add(listener);
    });

  /** Runs a piece of JavaScript in the page and returns what it produced. */
  const run = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    }
    return result.result.value;
  };

  return {
    name: version.Browser,
    send,
    waitFor,
    run,
    close: () => {
      socket.close();
      stop();
    },
  };
}

async function main() {
  const { dist, base } = parseArgs(process.argv.slice(2));
  const distRoot = resolve(dist);
  const strict = Boolean(process.env.CI);

  if (!existsSync(distRoot)) {
    console.error(`check-a11y: no such directory: ${distRoot}`);
    process.exit(1);
  }

  const require = createRequire(import.meta.url);
  let axeSource;
  let axeVersion;
  try {
    axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
    axeVersion = require('axe-core/package.json').version;
  } catch {
    console.error('check-a11y: axe-core is not installed. Run "npm ci" first.');
    process.exit(1);
  }

  /** Stops with a failure in the checks, and steps aside with a note on a volunteer's computer. */
  const cannotRun = (why) => {
    if (strict) {
      console.error(`check-a11y: ${why}`);
      process.exit(1);
    }
    console.log(`check-a11y: SKIPPED. ${why}`);
    console.log('check-a11y: the scan still runs in the checks on every pull request, so nothing is lost by this.');
    process.exit(0);
  };

  const executable = findBrowser();
  if (!executable) {
    cannotRun(
      process.env.CHROME_PATH
        ? `CHROME_PATH points at ${process.env.CHROME_PATH}, and there is no browser there.`
        : 'No Chrome, Chromium or Edge was found on this computer, and the scan needs one. Install one, or set CHROME_PATH to where yours is.',
    );
  }

  const pages = [];
  const skipped = [];
  for (const file of walk(distRoot).sort()) {
    const rel = file.slice(distRoot.length).replace(/\\/g, '/').replace(/^\//, '');
    const address = base + rel.replace(/(^|\/)index\.html$/, '$1');
    if (isRedirectPage(readFileSync(file, 'utf8'))) skipped.push(address);
    else pages.push(address);
  }

  const server = await serve(distRoot, base);
  const origin = `http://127.0.0.1:${server.address().port}`;

  let browser;
  try {
    browser = await startBrowser(executable, true);
  } catch (first) {
    // Some computers, and the machines that run the checks, do not let a browser
    // use its sandbox. The pages here are our own and the internet is blocked, so
    // running without it is safe for this one job.
    try {
      browser = await startBrowser(executable, false);
    } catch (second) {
      server.close();
      cannotRun(`The browser at ${executable} would not start: ${second.message || first.message}`);
    }
  }

  const findings = [];
  try {
    await browser.send('Page.enable');
    await browser.send('Runtime.enable');

    for (const view of VIEWS) {
      await browser.send('Emulation.setDeviceMetricsOverride', {
        width: view.width,
        height: view.height,
        deviceScaleFactor: 1,
        mobile: view.width < 600,
      });

      for (const page of pages) {
        const loaded = browser.waitFor('Page.loadEventFired', PAGE_TIMEOUT_MS);
        const navigation = await browser.send('Page.navigate', { url: origin + page });
        if (navigation.errorText) throw new Error(`${page} would not open: ${navigation.errorText}`);
        await loaded;
        await browser.run('document.fonts.ready.then(() => true)');
        await browser.run(axeSource + '\n;true');
        const violations = await browser.run(`
          axe.run(document, { resultTypes: ['violations'] }).then((results) =>
            results.violations.flatMap((violation) =>
              violation.nodes.map((node) => ({
                rule: violation.id,
                impact: violation.impact,
                help: violation.help,
                more: violation.helpUrl,
                target: node.target.flat().join(' '),
                html: node.html.length > 160 ? node.html.slice(0, 157) + '...' : node.html,
                why: (node.any[0] || node.all[0] || node.none[0] || {}).message || '',
              })),
            ),
          )`);
        for (const violation of violations) findings.push({ page, view: view.name, ...violation });
      }
    }
  } catch (error) {
    browser.close();
    server.close();
    console.error(`check-a11y: the scan could not finish. ${error.message}`);
    process.exit(1);
  }

  browser.close();
  server.close();

  const sizes = VIEWS.map((view) => `${view.name} ${view.width}`).join(', ');
  console.log(`check-a11y: ${pages.length} pages at 2 widths (${sizes}), axe-core ${axeVersion}, ${browser.name}`);
  for (const address of skipped) console.log(`  skipped ${address}, it only forwards to another address`);

  const problems = mergeFindings(findings);
  if (problems.length > 0) {
    console.error(`\ncheck-a11y: ${problems.length} accessibility problem(s):\n`);
    for (const problem of problems) {
      console.error(`  ${problem.page}  (${problem.views.join(' and ')})`);
      console.error(`    ${problem.help}  [${problem.rule}, ${problem.impact}]`);
      console.error(`      where: ${problem.target}`);
      console.error(`             ${problem.html.replace(/\s+/g, ' ')}`);
      if (problem.why) console.error(`      why:   ${problem.why.replace(/\s+/g, ' ')}`);
      console.error(`      more:  ${problem.more.split('?')[0]}\n`);
    }
    process.exit(1);
  }

  console.log('check-a11y: no accessibility problems found.');
  process.exit(0);
}

// Only run when started as a command. Importing this file (the tests do) runs nothing.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
