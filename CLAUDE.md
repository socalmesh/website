# CLAUDE.md: running the SoCal Mesh website

**Who this file is for.** Two readers share it.

- **You**, a SoCal Mesh volunteer. You do not need to write code, and you do not need to know git.
  You change the site by talking to Claude Code in plain English. Read sections 1, 3, 4, 5 and 8.
- **Claude**, the assistant doing the work. Sections 2, 6 and 9 are instructions to Claude, and
  Claude follows them on every change, every time.

## Words you will see

| Word | What it means here |
|---|---|
| repository ("repo") | the folder holding the whole website, kept on GitHub so every version is saved forever |
| branch | a separate copy of the site to work on, so the live site is untouched while the work happens |
| commit | a saved snapshot of a change, with a short note saying what it was |
| pull request ("PR") | a proposed change that gets its own page on GitHub, so it can be looked at and undone later |
| merge | put the change into the live site |
| CI | the automatic checks that run on every change (does the site still build? do the links work?) |
| deploy | the automatic step that publishes the site to the web after a merge |
| markdown | plain text with simple formatting marks, `#` starts a heading, `-` starts a list item |

---

## 1. What this is

This is the website for SoCal Mesh, the Meshtastic radio community in Southern California. It is a
static site (plain pages built once, with nothing running on a server) made with Astro, a tool that
turns markdown and templates into those pages. GitHub Pages publishes it.

It publishes to **https://socalmesh.github.io/website/** (live once the repository is public and
GitHub Pages is switched on), and will move to **https://socalmesh.org** once the domain is
pointed at it.

Claude makes the changes. A volunteer approves them. Everything in this repo is public, assume
anything you put here can be read by anyone, forever.

---

## 2. How Claude works in this repo

*This section is addressed to Claude. Claude: these are rules, not suggestions.*

### 2.1 Every change goes through a pull request

Never commit directly to `main` (the live copy of the site). Every change, even a one-word typo,
goes on its own branch and through its own pull request. That is what makes each change visible,
reviewable, and reversible later.

The steps Claude always takes, in this order:

1. Make sure `main` is current: `git checkout main && git pull`.
2. Create a branch named for the change: `git checkout -b add-article-<slug>`, or
   `fix-typo-<page>`, or `update-discord-link`. Lowercase, hyphens, no spaces.
3. Make the change, only the files the request actually needs.
4. Run the checks. First time in a fresh copy of the repo: `npm ci` (installs the build tools).
   Then, every time: `npm run build` and `npm run check`. Both must pass before anything is pushed.
5. Commit with a plain-English message a non-programmer would understand, "Add help article on
   uplinking to MQTT", not "feat(content): add mqtt doc".
6. Push the branch: `git push -u origin <branch-name>`.
7. Open the pull request with `gh pr create`, filling in the template
   (`.github/PULL_REQUEST_TEMPLATE.md`) in plain language. Give the volunteer the PR link.

### 2.2 Then ALWAYS offer to merge, as a question, never automatically

Once the pull request is open and CI is green (`gh pr checks` shows all checks passing), Claude asks
the volunteer, in these words or very close to them:

> **"Want me to merge this now so it goes live? (yes / not yet)"**

That is one question, asked once. Wait for the answer.

- **On "yes"**, merge it: `gh pr merge --squash --delete-branch`. (If GitHub refuses because a
  review is required, say so plainly and name who can approve it, do not work around it.) Then
  tell them:
  - it will be live in about two minutes;
  - the URL to look at (for example `https://socalmesh.github.io/website/help/<slug>/`);
  - how to see the publishing finish, the **Actions** tab on GitHub, or `gh run list --limit 3`,
    where the "Deploy" run should end in a green check.
- **On "not yet"**, leave the pull request open, and say how to come back to it: "It's waiting at
  <PR link>. Say *merge the article PR* whenever you're ready, and I'll merge it then."

**Never merge without that yes.** Not "they'll obviously want this", not "it's only a typo". Pull
requests exist so there is history and an undo button; the single question exists so that shipping
a change is painless. Both, always.

### 2.3 What Claude may do alone, and what needs a second pair of eyes

| Claude may do this alone (open the PR, then ask the merge question) | Needs a second pair of eyes (open the PR, then stop) |
|---|---|
| Add, edit, unpublish or remove a help article in `src/content/help/` | Anything under `.github/`, the workflows that build and publish the site |
| Fix typos and reword page text | `astro.config.mjs` |
| Change links in `src/config/site.ts` (Discord, maps, Reddit, flasher, other communities) | `package.json`, `package-lock.json`, and any dependency update |
| Add or replace photos in `src/assets/photos/` | `src/layouts/`, `src/components/`, `src/styles/`, design and layout changes |
| Update the site name, tagline, or the Start here steps in `src/config/site.ts` | Deleting or renaming a page in `src/pages/` (help articles are not pages, see the left column) |
| | The channel numbers in `src/config/site.ts`, preset, slot, frequency. A wrong number sends people to a channel nobody is listening on, so confirm it with someone who runs a node |
| | Anything touching the domain or the GitHub Pages settings |

For anything in the right-hand column: do the work, run the checks, open the pull request, and
then **do not** ask the merge question. Say instead: "This one changes how the site is built (or
how it looks), so it should get a second pair of eyes before it goes live. A maintainer of
`socalmesh/website` needs to review and merge it. The PR is at <link>."

### 2.4 Never

- Never force-push, rewrite history, or use `git push --force` or `git rebase` on shared branches.
- Never delete a branch somebody else made.
- Never edit `main` directly.
- Never add analytics, trackers, or any third-party script. We set no cookies of our own. (The one
  third-party embed already here is the Discord member list on the home page, which the community
  asked for; the footer says so. Do not add another without asking.)
- Never add secrets, passwords, API keys or tokens to the repo, it is public. (The one
  exception already in the repo: the MQTT help article prints the *public* community broker
  credentials, which Meshtastic publishes too. Those are meant to be shared. Anything that is
  genuinely private never goes in.)
- Never add personal information about members: full names, home addresses, phone numbers, email
  addresses, or precise home locations. Handles are fine; that is how the community works.
- Never invent an author for an article. If you do not know who wrote it, ask.
- Never change the Meshtastic trademark lines in the footer. They are required, word for word.

### 2.5 Before pushing anything, Claude checks

1. `npm run build` passes.
2. `npm run check` passes.
3. `npm run links` passes. This one rebuilds the site at the address it is really published from
   and then checks every internal link, which is what catches a link written as `/help/` instead of
   going through the `url()` helper. It takes a little longer than the other two because of the
   rebuild.
4. `git status` shows only the files this task needed, nothing stray, no `node_modules`, no
   scratch files, no `dist/`.
5. No secrets, passwords, keys, or personal information anywhere in the change.

If a check fails, fix it, or stop and explain the failure in plain English. Never push a red build.

### 2.6 After merging

The Deploy workflow runs automatically on every merge to `main`, and takes about two minutes.

- Watch it: the **Actions** tab on GitHub, or `gh run list --limit 3` / `gh run watch`.
- When it is green, open the page. If it still looks old, hard-refresh, **Ctrl+Shift+R** on
  Windows and Linux, **Cmd+Shift+R** on a Mac, because the browser keeps a copy of the old page.
- If the deploy is red, say so plainly, and go to section 4 ("the site is broken after a merge").
- One exception, only ever on the **very first** publish: GitHub sometimes reports "Not Found" on
  that first run because the site it just created has not finished being set up. Re-run the Deploy
  workflow once; nothing needs editing. If it fails a second time, treat it as a real failure.

---

## 3. Things you can ask Claude to do

*This section is for you.* Say it in your own words, the example sentences are only a shape.

### The whole flow once, start to finish: adding an article

**You type:**

> "Coopersmith wrote a guide on picking a first antenna. Here's the text, can you add it?"

**Claude does:**

1. Updates `main`, then makes a branch called `add-article-choosing-your-first-antenna`.
2. Creates `src/content/help/choosing-your-first-antenna.md` with the details at the top of the
   file (title, one-sentence description, `author: "Coopersmith"`, today's date) and the text below
   them. (A new file, never an existing article's name, or it would overwrite what is there.)
3. Runs `npm run build`, `npm run check` and `npm run links`. All pass.
4. Commits, pushes, and opens a pull request titled "Add help article: Choosing your first
   antenna", with the template filled in.
5. Waits for CI to go green, then asks: **"Want me to merge this now so it goes live? (yes / not
   yet)"**

**You say "yes".** Claude merges, and tells you: "Merged. It will be live in about two minutes at
https://socalmesh.github.io/website/help/choosing-your-first-antenna/, I'll tell you when the
deploy finishes." Two minutes later you open the link and the article is there, with the byline
**"By Coopersmith · <today's date>"** under the title.

**You check:** the page loads, the byline is right, the links in it work, and it is listed at
`/help/`.

### Add a help article

**Say:** "Add a help article called *Choosing your first radio*, written by SUSHI, here's the text."

**Claude will:**

1. Create `src/content/help/choosing-your-first-radio.md`. The filename becomes the web address, so
   it is lowercase with hyphens and no spaces: this one lands at `/help/choosing-your-first-radio/`.
2. Put a small block of details at the very top of the file, between two `---` lines:

   | Field | What it is |
   |---|---|
   | `title` | the headline, in quotes |
   | `description` | one sentence, it shows in the article list and in search results |
   | `author` | the **handle of the person who actually wrote it** |
   | `date` | the day it is published, written as `2026-08-18` |
   | `updated` | optional, the day it was last revised; shows as "· Updated <date>" |
   | `tags` | optional list, like `["mqtt", "getting-started"]` |
   | `draft` | optional, `draft: true` hides the article completely until that line is removed |

3. Write the body in markdown: `##` for section headings, `-` for bullet points,
   `[text](https://example.com)` for links, and images from `src/assets/photos/` (written as a
   relative path, e.g. `![what is in it](../../assets/photos/meetup.jpg)`, so the site can resize them).
4. Run the checks, open the pull request, and ask the merge question.

**A note on bylines:** the author is whoever *wrote* the article, not whoever asked for it to be
posted. If you are posting on someone else's behalf, tell Claude their handle and that is what goes
in the byline. Claude will never make one up.

**Check afterwards:** the article appears at `/help/`, the byline reads "By SUSHI · August 18,
2026", and every link in it works.

### Fix a typo or change wording on a page

**Say:** "On the home page, 'recieve' should be 'receive'." Or: "Change the tagline to say Southern
California instead of SoCal."

**Claude will:** find the text and fix it in the right place:

- home page text: `src/pages/index.astro`
- help articles: `src/content/help/`, one file per article, named after the article
- site name and tagline: `src/config/site.ts`

then run the checks, open the pull request, and ask the merge question.

**Check afterwards:** load the page and read the sentence.

### Change the Discord link (or add another link)

**Say:** "Our Discord invite changed, the new one is <link>."

**Claude will:** update it in `src/config/site.ts`, which is the single place every Discord link on
the site comes from, hero button, Discord section, and footer all change at once. Then the checks,
the pull request, and the merge question.

**Check this one first, though:** the Discord invite is the main thing this website exists to do.
Open the new link in a private or incognito window *before* merging, and make sure it really joins
the server and has not expired.

### Update the map links

**Say:** "Add a new map link", or "our meshview URL moved".

**Claude will:** edit the map list in `src/config/site.ts`. **Order matters**, the community's own
map, `https://meshview.socalmesh.org`, always comes first, because it is ours (the hero's "See the
live map" button and the footer link both read the first entry); then `https://meshview.world/`;
then `https://meshmap.net`; then `https://meshtastic.liamcottle.net/`. Then the checks, the pull
request, and the merge question.

**These four are not the same data source, and the blurbs say so on purpose.** Ours is an instance
of meshview that we run. Anyone who uplinks to our MQTT server also appears on meshmap.net and
Liam's map, because we share to both of those, meshmap is the more reliable of the two and covers
other regions as well, while Liam's may show a smaller subset. `meshview.world` is a different
thing: a map of all the meshview instances, not another view of our traffic. Do not flatten those
distinctions into "the maps", and do not write that uplinking puts you on all four.

**And every map understates the network.** A node only shows up if its owner enabled **OK to
MQTT**, so there are always more nodes on the air than the maps display. If you touch the maps
section, keep that caveat with it.

**Check afterwards:** the maps section lists them in that order, and each link opens.

### Change the channel settings we recommend

The home page shows the two channels this mesh runs on, **LF20** (LongFast, frequency slot 20)
and **MF45** (MediumFast, slot 45), with the frequency each one lands on. These are the numbers
newcomers copy onto their radio, so they matter more than anything else on the page.

**LF20 is the recommended one, and MF45 is the alternate.** LongFast slot 20 is where many of this
community actually are. MediumFast slot 45 is faster on the air and plenty of people here use it,
but it is not always strong and whether it works depends on the area, so the page tells people to
try it if they can connect, and to check the live map for MF45 nodes near them first. Do not
re-flip that emphasis without asking someone who runs a node.

**Say:** "We moved to MediumSlow", or "the slot 45 frequency is wrong, it should be X".

**Claude will:** edit the `channels` list in `src/config/site.ts`. Each channel has a short name
(`LF20`), the preset name, the slot number, the frequency, and a sentence of explanation. The one
with `recommended: true` gets the highlighted "Set this one" card, and the recommended one is
listed first because the cards render in array order. Claude will also check the explanation
paragraphs underneath still make sense, they sit in `src/pages/index.astro` in the section marked
`id="channels"`, along with the sources paragraph that cites where the numbers come from.

**Please double-check this one before merging.** A wrong frequency or slot number sends people to a
channel nobody is listening on. Confirm the numbers with someone who runs a node.

### Change the "Start here" steps

**Say:** "Add a step about joining the Discord first", or "the flasher link changed".

**Claude will:** edit the `startHere` list in `src/config/site.ts`. Each step has a title, a
sentence or two, and optionally one link. Steps are numbered automatically in the order they appear
in that list, to reorder them, move the blocks.

### Add another mesh community to the links page

The `/links/` page lists other mesh communities, split under two headings: **Meshtastic** (the same
technology we run) and **MeshCore** (a different one, those radios cannot talk to ours).

**Say:** "Add the Austin mesh community to the links page."

**Claude will:** add a name, address and one-line description to `meshLinks` in
`src/config/site.ts`, under `meshtastic` or `meshcore`. The page builds itself from that list.

**Check afterwards:** open the link and make sure it is the community you meant and the site is
still up.

### Add a photo

**Say:** "Add these photos from the Saturday meetup to the gallery."

**Claude will:**

1. Put the image in `src/assets/photos/`, with a lowercase-hyphenated filename.
2. Resize it so the long edge is at most 1600 pixels and the file is under about 300 KB. The site
   makes smaller phone-sized copies automatically when it builds.
3. Give it meaningful alt text, a short description of what is actually in the picture, for people
   using a screen reader. That description goes in the list at the top of
   `src/components/PhotoGrid.astro`, keyed by the file name. Adding a line to that list counts as
   adding a photo, not as a design change, so Claude may do it alone.
4. The photo grid on the home page picks up every file in that folder by itself, no code change.
   Then the checks, the pull request, and the question.

**Please do not** post photos showing faces, license plates, house numbers, or a home address
without asking the people in them first. Public forever, remember.

### Update or unpublish an article

**Say:** "That MQTT article is out of date, take it down for now." Or: "Update it with this new
section."

**Claude will:** edit the text and set an `updated` date; or add `draft: true` at the top, which
hides the article from the site while keeping the file; or delete the file entirely if you want it
gone. All three are undoable, nothing is ever lost. Then the checks, the PR, and the question.

**Check afterwards:** the article is (or is no longer) listed at `/help/`.

If you remove the *last* remaining article, the build prints a warning saying it found no
matching files. That is expected and harmless, the help pages simply say "No articles yet."

### See what changed recently, and who changed what

**Say:** "What's changed on the site this month?"

**Claude will:** read the history with `git log` and list the merged pull requests
(`gh pr list --state merged`) in plain English, what changed, who did it, and when. Every change
has a name and a date attached to it. No pull request needed; asking changes nothing.

### Update the site's dependencies

**Say:** "Can you update the site's software libraries?"

**Claude will:** update them, run the checks, open a pull request, and then **stop**, because this
is a second pair of eyes task. A maintainer reviews it and merges it.

### A pull request appeared that nobody opened

Some pull requests are opened by robots, and that is normal. Two of them run on this repo:

- **Dependabot**, GitHub's update robot. Once a month it opens a pull request saying "these
  software libraries the site is built with have newer versions". It also opens one straight away
  if a library it knows about has a security problem. These are **second pair of eyes** changes:
  ask Claude to check that CI is green and to summarize what changed, then a maintainer merges it.
  You can safely leave one sitting for a while; the site keeps working.
- **CodeQL**, GitHub's free security scanner. It does not open pull requests. It reads the code on
  every change and posts anything suspicious on the repository's **Security** tab. Nothing is
  blocked by it. If something shows up there, ask a maintainer to look.

**Say:** "What is this Dependabot pull request, and is it safe?" and Claude will read it and explain
it in plain language.

---

## 4. How to undo something

Nothing here is ever really lost. Every version of every file is kept, forever, including files that
were deleted. If something goes wrong it can be put back. Take a breath, and ask Claude.

### "I merged it and I don't like it."

Say: "Undo the last change." Claude opens a **revert** pull request, a change that exactly undoes a
previous one, line for line, runs the checks, and asks the merge question. Say yes, and about two
minutes later the site is back to how it was. The original change stays in the history, so it can be
put back again if you change your mind.

### "I want an old version of an article back."

Say: "Bring back the version of the MQTT article from before last Tuesday." Claude finds it in the
history, restores that file, and opens a pull request with it. You can also ask just to *see* an old
version first, without changing anything.

### "The pull request isn't merged yet, and I want to drop it."

Say: "Forget that change." Claude closes the pull request and deletes that one branch, only that
one. Nothing live is affected, because an unmerged pull request never touched the live site.

### "The site is broken after a merge."

Revert first, investigate second. Say: "The site is broken, undo the last merge." Claude opens the
revert pull request straight away, gets the site working again, and only then works out what went
wrong. Never leave a broken site up while somebody debugs it.

### "I deleted something I shouldn't have."

It is still in the history. Tell Claude roughly what it was and roughly when, and Claude will find
it and restore it.

---

## 5. Getting set up (one time, per volunteer)

You need these once. Ask in Discord if you get stuck on any of them, this is the fiddly part, and
you never have to do it twice.

1. **A GitHub account**, with write access to `socalmesh/website`. A maintainer grants that; ask in
   Discord and give them your GitHub username.
2. **Git**, install it from the official Git site, git-scm.com.
3. **GitHub CLI**, install it from cli.github.com. Then open a terminal (Terminal on a Mac,
   Command Prompt or PowerShell on Windows), type `gh auth login`, press Enter, and follow the
   prompts. This is how Claude opens and merges pull requests as you.
4. **Node.js 22**, install it from nodejs.org. This is what builds the site.
5. **Claude Code**, install it from Anthropic's Claude Code page, and sign in.

Then get your own copy of the site. In that same terminal, type these two lines, one at a time,
pressing Enter after each:

```
git clone https://github.com/socalmesh/website.git
cd website
```

Open Claude Code in that `website` folder and say hello, "Hi, I'd like to add a help article."
Claude reads this file automatically and knows the rest.

---

## 6. How the site is built and published

*For the curious, and for Claude.*

### Where things live

| Path | What it holds |
|---|---|
| `src/config/site.ts` | site name, tagline, Discord invite, the two channels, the Start here steps, the map links, the Reddit and flasher links, the other-communities list, GitHub org, one place for all of them |
| `src/content/help/` | the help articles, one markdown file each; the filename is the web address |
| `src/content.config.ts` | the list of details every article must have at the top (the fields in section 3) |
| `src/pages/` | the pages: home (`index.astro`), the other-communities page (`links.astro`), the help list and article pages, the 404 page, and two files that generate `robots.txt` and the web manifest |
| `src/components/` | the reusable pieces, header, footer, hero, buttons, cards, the photo grid, the channel cards, the Start here steps, the map list and the Discord section |
| `src/layouts/` | the page frame that every page sits inside |
| `src/styles/` | colors, spacing and type, `tokens.css` and `global.css` |
| `src/lib/url.ts` | the `url()` helper that builds every internal link (see the gotcha below) |
| `public/` | the favicon, the Apple touch icon and `og-image.png` (the picture shown when the site is shared) |
| `public/brand/` | the two app icons used by phones when the site is saved to a home screen |
| `public/fonts/` | the one font the site uses, and its licence |
| `src/assets/socalmesh-logo.png` | the circle logo |
| `src/assets/photos/` | the community photos; every file here appears in the home-page photo grid |
| `.github/workflows/ci.yml` | the checks that run on every pull request |
| `.github/workflows/deploy.yml` | the publish step that runs on every merge to `main` |
| `.github/workflows/codeql.yml` | the free security scanner (see section 3) |
| `.github/dependabot.yml` | the settings for the update robot (see section 3) |
| `scripts/check-links.mjs` | the internal link checker that CI runs against the built site |

### What CI checks

CI runs on every pull request (and again when a change lands on `main`). It shows up as a single
check called **Checks**, open its log to see which step failed. The steps, in order:

1. **Types and content**, runs `astro check`, which catches broken templates and article details
   that do not match the fields listed in section 3.
2. **Build**, builds the whole site under the `/website/` address, exactly as it is published.
3. **Internal links**, walks every internal link in the built site and fails if one points at a
   page that does not exist. External links are not fetched.
4. **Upload the built site**, attaches the finished site to the pull request as a download, so
   someone can look at a change before it goes live. It is kept for seven days.

On your own machine those first three are `npm run check`, `npm run build` and `npm run links`.

Two more automatic things run alongside CI, and neither of them can block a change:
**CodeQL** (a security scanner, results appear on the repository's Security tab) and
**Dependabot** (an update robot, see "A pull request appeared that nobody opened" in section 3).
Both are free because this repository is public.

### What Deploy does

On every merge to `main`, the Deploy workflow builds the site and publishes it to GitHub Pages,
usually within about two minutes. It works out the site's address by itself: until a custom domain
is set in the repo's Pages settings it publishes to `https://socalmesh.github.io/website/`, and once
a domain is set it publishes to that domain at the root instead. No file in the repo has to be
edited for that switch.

### The one gotcha

Because the site lives under `/website/` today and will live at the root of a domain later, **every
internal link and asset path must go through the `url()` helper in `src/lib/url.ts`**.

- Right: `<a href={url('/help/')}>`
- Wrong: `<a href="/help/">`, that link breaks on the published site.

CI builds under `/website/` on purpose, so a bare leading-slash link gets caught before it ships.

---

## 7. Moving the site to socalmesh.org

*Maintainer and domain owner only. This is not something a volunteer's Claude should do, it is a
one-time act by whoever controls the socalmesh.org domain, and it changes where the whole site
lives.*

0. First time only, if it has never been done: **Settings → Pages → Build and deployment →
   Source**, choose **GitHub Actions**. Publishing does not work until that is set, and the
   Deploy workflow deliberately does not try to set it itself.
1. On GitHub: **Settings → Pages → Custom domain**, enter `socalmesh.org`, and save.
2. At the domain registrar, point DNS at GitHub Pages, the `A` and `AAAA` records for the apex
   domain and a `CNAME` record for `www`, as listed in GitHub's own guide, "Managing a custom domain
   for your GitHub Pages site".
3. **Re-run the Deploy workflow straight away**, from the Actions tab. Until it finishes, the site
   that is published is still the one built for the old address, so pages on the new domain will
   look broken. This step is not optional and it is not last.
4. Wait for DNS to propagate, then tick **Enforce HTTPS** in the same Pages settings once GitHub
   offers it.
5. Verify: load `https://socalmesh.org`, click through to a help article and a photo, and confirm
   nothing is missing.

---

## 8. Content rules

- **Voice:** casual, direct, second person, short sentences. Answer first, explain after. "If you're
  unsure, use this." No marketing fluff, no hype.
- **Never use em dashes.** Not in articles, not in page text, not in code comments, not in this
  file. Use a comma, a colon, brackets, or start a new sentence. En dashes go too, so write a
  range as "3600 to 7200" rather than putting a dash between the two numbers. This is the single
  most common giveaway that a machine wrote something, and it gets asked for again every time it
  slips through.
- **It should not read like it was written by an AI.** That is a real requirement, not a nice to
  have. This is a volunteer community's own voice, and text that reads as generated makes the whole
  site look like it was phoned in. What gives it away, in rough order of how badly:
  - em dashes, as above;
  - the "it's not X, it's Y" and "X isn't just Y, it's Z" shapes;
  - everything arriving in threes, with every sentence balanced against itself;
  - words doing no work: *genuinely, actually, simply, truly, crucial, robust, seamless, leverage,
    delve, it's worth noting, that said, in today's world*;
  - hedging on every claim until nothing is actually said;
  - a closing paragraph that restates what was just said.
  Write the way you would explain it to someone standing next to you. Use contractions. Let
  sentences be different lengths. Say the plain thing and move on. Short and a bit blunt beats
  smooth and padded every time.
- **Bylines are real handles.** The author of an article is the person who wrote it. Never invent
  one, never guess.
- **The Meshtastic trademark lines in the footer stay exactly as they are**, word for word. We use
  the word "Meshtastic" descriptively, "a Meshtastic community", and we do not use the Meshtastic
  logo. This site is not affiliated with or endorsed by the Meshtastic project.
- **Do not republish text from other repos** unless it carries a license that allows it. Link to
  it instead. This came up for real with the community's own `socalmesh/best-practices` guide,
  which carried **no license at all**, so the article that replaced it,
  `src/content/help/best-practices.md`, restates its settings and numbers (plain facts, free to
  restate) in this site's own words, and **credits `@Coopersmith` by name** for the field-craft
  advice rather than reproducing his paragraphs. Do the same with anything else you carry across:
  take the facts, write the prose yourself, credit the author.
- **No personal information** about members: no full names, home addresses, phone numbers, or
  precise home locations. Handles only.
- **Everything here is public, forever.** Once it is merged it stays in the history even if it is
  deleted later. Write accordingly, and never paste anything private into a file.

---

## 9. If Claude is unsure

*Claude:* do not guess. Ask a short question with clear options, then wait. For example: "Two ways
to read this, should I (a) hide the article with `draft: true` so it can come back later, or (b)
delete the file? I'd suggest (a)."

Specifically:

- **A missing fact**, an author's handle, which page a change belongs on, whether a link is the
  real one: ask.
- **Design, layout, workflows, dependencies, deletions, or anything in the second pair of eyes
  column in section 2.3:** do the work, open the pull request, and stop. Do not ask the merge
  question; say who should look at it instead.
- **Anything that would break a rule in section 2.4:** stop, and say why in one plain sentence.

Asking a volunteer a ten-second question is always cheaper than making a change nobody wanted.
