# SoCal Mesh website

The website for SoCal Mesh, the Meshtastic community building an open source LoRa network in
Southern California. It is a static site built with Astro and published by GitHub Pages from this
repository, `socalmesh/website`.

**Live at:** https://socalmesh.github.io/website/ (it will move to https://socalmesh.org once the
domain is pointed at GitHub Pages).

**Changes are made through Claude Code. See [CLAUDE.md](CLAUDE.md).** Volunteers do not hand-edit
the code: you describe the change, Claude makes it, opens a pull request, and asks you whether to
merge it. CLAUDE.md is the operator guide and the single source of truth for how work happens here.

## Where things live

| Path | What it holds |
|---|---|
| `src/config/site.ts` | site name, tagline, Discord invite, the two channels, the Start here steps, the map links, the Reddit and flasher links, the other-communities list, GitHub org |
| `src/content/help/` | help articles, one markdown file each; the filename is the web address |
| `src/content.config.ts` | the details every article must have at the top (title, description, author, date) |
| `src/pages/` | home page, the other-communities page, the help list and article pages, 404, and two files that generate `robots.txt` and the web manifest |
| `src/components/` | header, footer, hero, buttons, cards, photo grid |
| `src/layouts/` | the page frame every page sits inside |
| `src/styles/` | design tokens and global styles |
| `src/lib/url.ts` | the `url()` helper, every internal link and asset path goes through it |
| `public/` | favicon, Apple touch icon, and the social-share image |
| `public/brand/` | the two icons phones use when the site is saved to a home screen |
| `public/fonts/` | the one font the site uses, and its licence |
| `src/assets/` | the logo, and community photos in `src/assets/photos/` |
| `src/assets/photos/` | community photos (every file here appears in the home-page grid) |
| `.github/workflows/` | `ci.yml` (checks on every pull request) and `deploy.yml` (publish on merge) |
| `scripts/check-links.mjs` | internal link checker run by CI against the built site |

## Running it locally (developers)

Node.js 22 is required (see `.nvmrc`).

```
npm ci        # install dependencies
npm run dev   # local preview at http://localhost:4321 (or the address the command prints)
npm run build # production build into dist/
npm run check # astro check, types and content schema
```

CI builds under the `/website/` base path on purpose, so a bare leading-slash link such as
`href="/help/"` fails there. Use the `url()` helper in `src/lib/url.ts` for every internal href and
asset src.

## Publishing

Every merge to `main` triggers the Deploy workflow, which builds the site and publishes it to GitHub
Pages, usually live within about two minutes. The workflow resolves the site address itself: the
GitHub Pages URL above until a custom domain is set in the repository's Pages settings, then that
domain at the root. No file in this repository needs editing for that switch.

## Community

- Discord: https://discord.gg/ZF6b9nrv7n
- Live map: https://meshview.socalmesh.org
- GitHub org: https://github.com/socalmesh

## License

Everything written for this repository, the site code, the help articles and the photos, is
released under the MIT License (see `LICENSE`). Help articles still carry their author's byline;
keep it when you reuse them.

One exception: the font in `public/fonts/` is Inter, which is licensed under the SIL Open Font
License 1.1, not MIT. Its licence sits beside it in that folder and must stay with the file.
