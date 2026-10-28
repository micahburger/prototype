# Notes

Working notes for extending this hub and rebuilding Corner Bodega
(cornerbodega.pub). Read this first. Each fact is marked **verified** (seen
directly: in the code, in hPanel, or from a live DNS/HTTP check on the date
given) or **not verified** (inferred, or not checked).

> **This file is public.** Hostinger serves the whole repo root, so
> `https://prototypes.micahburger.com/NOTES.md` returns this file (verified:
> `/CLAUDE.md` and `/app/src/prototypes.config.ts` both return 200). Keep
> passwords, SSH usernames, tokens and local paths out of it.

---

## Step 1 — 2026-10-27

### How the hub works

All verified, from the code at commit `e548d06`.

- **Stack.** Vite 5, React 18, TypeScript. No other runtime dependencies.
  Source is in `app/`. The dev server runs on port 4177 (`strictPort`).
- **Registering a project.** Add one entry to `app/src/prototypes.config.ts`
  (typed by `app/src/types.ts`). Each entry has: `slug`, `title`, `description`,
  `status`, `updated`, `entry` (a full URL, or a path on this site), `device`
  (phone or desktop), and optionally `thumbnail`, `storageKeys`, `liveStates`,
  `states`, `actions` and `screens`. `lib/protos.ts` sorts entries newest
  first and does all the lookups.
- **Page/screen registry.** It's the `screens` array on each prototype:
  `{ id, title, path, section?, states?, actions?, preset? }`. `path` is
  relative to the entry's origin. A `#hash` in the path makes matching
  hash-specific. `section` groups the gallery cards. The same `path` can appear
  several times with different `preset`s, and each one becomes its own card.
  `matchScreen()` maps a path the frame reports back to a screen.
- **Viewer** (`/prototypes/:slug`). `components/Viewer.tsx`. The URL is the
  source of truth for `mode` (phone or full), `screen` and `state.*`. The
  iframe's `src` is deliberately *not* rebuilt from the URL on every render.
  The `applied` ref records what the frame is already showing. Inside the
  frame, the `protostate.js` helper reports navigation, which keeps the panel
  and URL in sync. Reset clears storage, posts `prototype:reset` and reloads
  at `entry`. Shortcuts: G, F, S, R, Esc.
- **Gallery** (`/prototypes/:slug/gallery`). `components/Gallery.tsx` shows
  one card per screen. `components/LiveFrame.tsx` lays each iframe out at the
  real viewport (390×844 or 1440×900), shrinks it with a transform, and mounts
  it lazily with an IntersectionObserver. No more than 30 frames stay live at
  once. Today there is a skeleton while a frame loads, but no error state and
  no retry.
- **State helpers.** The `app/public/helper/protostate.js` and
  `useProtoState.ts` helpers, served at `/helper/`. Selections travel in the
  URL as `?state.<group>=<option>`, with defaults omitted. Reloads are the
  default way a change is applied, and `liveStates: true` switches to
  postMessage instead. `lib/prefs.ts` stores the tool's own choices under
  `protoviewer:`.
- **Routing.** `lib/router.ts` is a tiny pushState router. Anything outside
  `/prototypes…` redirects to `/prototypes`. In production, `.htaccess`
  rewrites unknown paths to `index.html`.
- **Build.** `npm --prefix app run build` runs `tsc -b && vite build`. There
  are no tests and no linter. `./deploy.sh` builds and then copies
  `app/dist/.` to the repo root.
- **Deploy.** Pushing to `main` on GitHub `micahburger/prototype` deploys.
  Hostinger Git auto-deploy for `prototypes.micahburger.com` is connected to
  that repo and branch, with root directory `public_html` (verified in
  hPanel; last deploy was `e548d066` at 2026-10-27 20:05). The repo root is
  what gets served, so built output is committed alongside source. Pushes run
  from Micah's own terminal, because the keychain token isn't available to the
  sandbox (from memory, not verified this session).

### Hostinger account

- **Plan.** Premium Web Hosting, expires 2029-10-16. 5 of 25 websites used,
  3.77 GB of 25 GB disk. — verified (hPanel)
- **Websites in the account:** five PHP/HTML sites
  (`prototypes.micahburger.com`, `ds.micahburger.com`,
  `2026folio.micahburger.com`, `applicants.micahburger.com` and
  `lattice2026.micahburger.com`) and two WordPress sites (`cornerbodega.pub`
  and `micahburger.com`). — verified (hPanel website list)
- **Domains.** Every domain is an "external domain": registered at another
  registrar but connected to Hostinger, and hPanel offers "Transfer" for
  `cornerbodega.pub` and `micahburger.com`. — verified. *Which* registrar it
  is — not verified (whois for `.pub` returned no registrar).

### prototypes.micahburger.com

- Hosted as its own PHP/HTML website on this plan, created 2026-10-27, with
  Git auto-deploy from `micahburger/prototype` `main` into `public_html`.
  — verified
- Served by LiteSpeed. `A 82.29.87.167`, plus an AAAA record. Hostinger's CDN
  is **off** for this site (hPanel suggests enabling it). — verified
- Because the repo root is the web root, every committed file is public,
  including source, README and CLAUDE.md. — verified

### cornerbodega.pub

- **In this account:** yes, as a WordPress website created 2025-07-19 on the
  same Premium plan. — verified
- **WordPress setup.** WordPress 7.1.3, PHP 8.2, theme "Semplice v7 7.1.6".
  hPanel reports **2 plugin updates and 2 vulnerabilities, "Action needed"**.
  Uses LiteSpeed cache. Backups run weekly. — verified (hPanel site health).
  The live HTML confirms Semplice (`semplice-*` assets and the generator tag).
  — verified
- **Website folder.** Probably `public_html` for that site
  (`domains/cornerbodega.pub/public_html` under the account home), but I
  didn't open File Manager. — **not verified**
- **SSL.** A Let's Encrypt certificate (issuer YE1) covering `cornerbodega.pub`
  and `www.cornerbodega.pub`, expiring 2026-12-15. hPanel shows SSL on.
  — verified. Presumably it auto-renews — not verified.
- **SSH.** Active, port 65002, on the shared IP `82.29.87.167`. One SSH key is
  already added ("Default-1"). The username and host fingerprints are in
  hPanel → cornerbodega.pub → Advanced → SSH Access, and are deliberately
  left out of this public file. SSH is account-wide, so the same login
  reaches every site on the plan — not verified.
- **Git deployment.** Available, but **not connected**. Advanced → GIT shows
  "Continue with GitHub / Connect with GitLab". — verified
- **CDN.** Off. — verified

#### www and https

- `http://cornerbodega.pub` → 301 → `https://cornerbodega.pub/`. — verified
- `http://www.cornerbodega.pub` → 301 → `https://www.cornerbodega.pub/` →
  301 → `https://cornerbodega.pub/`. — verified
- The canonical address is the **bare domain over https** (`https://cornerbodega.pub/`).
  The http→https redirect comes from LiteSpeed/hPanel. The www→bare redirect
  comes from WordPress, because that hop carries `x-powered-by: PHP`. —
  verified that both hops happen; which layer issues each one is **not
  verified**. A static rebuild has to recreate the www→bare redirect itself,
  in `.htaccess`, because WordPress will no longer be doing it.

#### DNS

- **Managed at Hostinger.** Nameservers are `ns1/ns2.dns-parking.com`, and
  the zone is editable in hPanel → cornerbodega.pub → Advanced → DNS Zone
  Editor. — verified
- Records, as shown in hPanel and matching public `dig` output:

| Type | Name | Value | TTL | |
|---|---|---|---|---|
| A | @ | 82.29.87.167 | 1800 | website |
| AAAA | @ | 2a02:4780:b:630:0:cc6:42e8:4 | 1800 | website |
| CNAME | www | cornerbodega.pub | 14400 | website |
| A | ftp | 82.29.87.167 | 1800 | FTP |
| MX | @ | mx1.hostinger.com (priority 5) | 14400 | **MUST PRESERVE** (email) |
| MX | @ | mx2.hostinger.com (priority 10) | 14400 | **MUST PRESERVE** (email) |
| TXT | @ | `v=spf1 include:_spf.mail.hostinger.com ~all` | 14400 | **MUST PRESERVE** (SPF) |
| CNAME | autodiscover | autodiscover.mail.hostinger.com | 300 | **MUST PRESERVE** (mail CNAME) |
| CNAME | autoconfig | autoconfig.mail.hostinger.com | 300 | **MUST PRESERVE** (mail CNAME) |

- **No DKIM and no DMARC record** exist in the zone. — verified (neither
  appears in hPanel, and `_dmarc` returns nothing in public DNS)
- **Is email actually in use?** Unclear. The MX records point at Hostinger
  Mail, but hPanel's Emails page shows only "Claim your free email", with no
  mailbox listed, and the site dashboard offers "Set up free email". It looks
  like Hostinger's default mail records, not a configured mailbox. **Not
  verified**: ask Micah whether anyone receives mail at @cornerbodega.pub.
  Leave all of these records in place either way.

### micahburger.com subdomains (to copy for cornerbodega.micahburger.com)

- `micahburger.com` DNS is at Hostinger (`dns-parking.com`). — verified
- **Pattern.** Each subdomain is added as its **own website** in hPanel
  (Websites → Create site / add website on the existing Premium plan), as a
  PHP/HTML site with Git auto-deploy from its own GitHub repo's `main` into
  `public_html`. — verified for `prototypes`. That the others were set up
  the same way is not verified.
- **DNS gets created automatically** in the `micahburger.com` zone when the
  site is added. For example, `prototypes` has A, AAAA, `www.prototypes`
  CNAME and `ftp.prototypes` A records; `lattice2026` has A and AAAA. —
  verified (seen in the zone). That Hostinger creates them, rather than
  Micah by hand, is from memory and not verified.
- Subdomains with **CDN on** carry an ALIAS to `<sub>.cdn.hstgr.net` instead
  (for example `applicants`). `2026folio` and `ds` resolve to CDN IPs and
  don't appear as editable rows in the parent zone. — verified (zone and
  `dig`)
- SSL on these subdomains is Hostinger's automatic certificate. — not verified
  per site, but they all serve over https.
- `micahburger.com`'s own email is Titan (`mx1/mx2.titan.email`, SPF
  `spf.titan.email`, plus a DMARC record). Adding a subdomain site doesn't
  touch those, but don't use "Reset DNS records" on that zone. — verified
  (records)
- `cornerbodega.micahburger.com` doesn't exist yet (no DNS). — verified

### What blocks later steps

1. **cornerbodega.pub's Git deploy isn't connected.** Connecting it (and
   choosing which repo deploys there) is a change Micah makes in hPanel.
2. **Swapping WordPress for a static build** means emptying or replacing that
   site's `public_html`, which is destructive. Take a full backup first
   (hPanel offers weekly backups plus on-demand ones). The WordPress database
   can stay until the new site is live.
3. **Email intent is unknown.** Confirm whether anyone uses
   @cornerbodega.pub mail before touching DNS. The plan is to change no
   records at all, because the new site can live on the same hosting and IP.
4. **The hub repo is public on the web**, every file of it. Anything local,
   such as `hub.local.json`, must stay gitignored, or it will be served.
5. **WordPress has 2 known vulnerabilities and pending plugin updates.**
   That isn't a blocker for the rebuild, but the live site is exposed until
   it's replaced.

---

## Step 2 — 2026-10-27: shortcuts, review board, change requests

Not committed or pushed. `./deploy.sh` has been run, so the root build
output matches the source.

### What changed

- **Registry** (`types.ts`). Still one registry: `screens`. Each entry
  already had `title`, `path` (its route), `section` (its group) and
  `preset` (its state params). It gains an optional `cover` image, which is
  shown while the preview loads and behind an error. Prototypes gain an
  optional `repo`. 2026folio, applicants, lattice and helper-demo have repo
  URLs (taken from each local checkout's `origin`). Design system and
  micahburger.com have none.
- **A. Shortcuts** (`ProjectShortcuts.tsx`, in the top bar next to the title).
  Open preview is always there. Open repo appears only when there's a `repo`.
  Copy local path and Copy Claude Code command come from `app/hub.local.json`.
  That file is gitignored and read only when `import.meta.env.DEV`, so the
  live site never has it. No editor or app deep links.
  - verified: with the file present, four buttons show. With it moved away
    and the dev server restarted, only Open preview and Open repo show.
  - verified: `npm run build` with the file present, then grep of `app/dist`
    and the root output for `/Users/` → nothing. The bundle has no dynamic
    import for it.
- **B. Review board** (`Gallery.tsx`, still at `/prototypes/:slug/gallery`,
  now labelled "Review" in the top bar). It has two views. **All pages**
  shows every page at Mobile 390, Tablet 768 or Desktop 1440. **One page**
  (`?board=widths&screen=<id>`) shows one page at all three widths, sharing
  one scale when they fit in a row. Each card is labelled
  "1440px · shown at 33%". Clicking a card opens the viewer at the same page,
  width (`mode=phone|tablet|desktop`) and state.
  - The viewer gained **Tablet** and **Desktop** frame modes, each laid out
    at its real width and scaled to fit, with the same caption underneath.
    F and Esc now return from full screen to the last framed mode.
  - Old links still work: `?device=phone|desktop` maps to 390 or 1440, and
    `mode=phone|full` is unchanged. verified for lattice, 2026folio,
    applicants, design-system and micahburger.
  - **Loading, error, Retry** (`LiveFrame.tsx`, shared with the index cards).
    A frame shows "Loading…" over a shimmer or cover, then the page. On
    failure it shows a message and Retry. Cross-origin frames report no
    errors, so failure is inferred from a HEAD probe (network failure, or a
    bad status when same-origin) plus a 20s timeout.
    - verified with a temporary page at `https://does-not-exist.invalid/`:
      "Couldn't reach the page." and Retry. Retry stays on the board, mounts
      a fresh iframe and goes back to Loading.
    - Limit: a page that refuses framing (X-Frame-Options) still "loads" and
      shows the browser's refusal page. — not detectable
- **C. Request a change** (`RequestPanel.tsx` + `lib/request.ts`). The
  Request button (or **C**) opens a panel: docked on the right, a drawer in
  full screen, a sheet on a phone. It has these fields: Scope (Whole site /
  This group / This page; "This group" is hidden for a page with no
  `section`), Applies to (All widths / This width), a Note, then an editable
  prompt preview, then Copy. Once the prompt has been hand-edited it stops
  following the fields until "Rebuild from fields". On the board, while the
  panel is open, clicking a preview *picks* it (it gets a ring) instead of
  opening it.
  - verified: the prompt contains project + source folder, the scope with
    the routes it covers, Applies to, the preview URL with state params,
    width, state labels, the note and the two required lines.
  - verified: on success the panel says "Copied — paste it into Claude
    Code." When copying fails (the in-app browser blocks the clipboard) the
    prompt textarea is focused with all its text selected, and the panel
    says to press ⌘C.

### Not verified

- **How it looks at real sizes.** The test browser pane was hidden for most
  of the run, which stops ResizeObserver and IntersectionObserver.
  - Frame scales in the viewer read 100% there, because the stage size never
    arrived; it's the same maths the phone frame already used.
  - The error/Retry test used a stubbed IntersectionObserver to make the
    frames mount.
  - Worth a look in a real window: the top bar's wrapping, and the One page
    row at a laptop width.
- Mobile (≤640px) layouts of the request sheet and the board's new controls.
- The real clipboard success path. It was simulated with a stub, because
  the pane always blocks the clipboard.

---

## Step 3 — 2026-10-27: Corner Bodega inventory

- **Project:** `../corner-bodega/` (sibling of this repo, its own git repo,
  `main`, nothing committed yet, no remote). Not part of the hub.
- **Read `../corner-bodega/INVENTORY.md` before building anything.** It
  lists every page, product, Etsy link, stockist, image and old URL, plus
  content problems that shouldn't be ported as they are.
- `_import/` holds the untouched WordPress export and is gitignored.
  `assets/uploads/YYYY/MM/` has the 156 original media files (160 MB), with
  filenames kept; `assets/image-map.csv` maps every old upload URL to one.
- Headlines (all verified):
  - The site is 8 pages: home plus 7 Semplice "projects" (six artist pages
    and "Site of the day").
  - Products: 18, all sold on Etsy.
  - The Etsy shop has been on a break since 2025-12-16.
  - There are no forms, search or feeds to replace.
- **`../corner-bodega/DECISIONS.md`** settles the content problems with
  first calls. It is the copy the rebuild uses; INVENTORY.md is the record
  of the old site. The main calls:
  - Desktop text wins.
  - Etsy wins on price and name.
  - Stockists are the union of every list (9 shops).
  - The pencil links to the Etsy shop.
  - Matt's Add to Cart goes to Passengers.
  - The dead Prone Studio link is removed, keeping the name.

---

## Step 4 — 2026-10-27: Corner Bodega home and artist page

- `../corner-bodega` is an **Eleventy 3** site: JSON content in
  `src/_data/`, Nunjucks templates, and plain static output in `_site/`.
  Its README covers the commands and layout.
- The build setting is `SITE_MODE`, preview by default — verified:
  - Preview gives `noindex` on every page, a disallow-all robots.txt, an
    `X-Robots-Tag` header in `.htaccess`, and no sitemap.
  - Production gives canonical URLs on https://cornerbodega.pub, a
    `sitemap.xml` and a normal robots.txt.
- Built so far: `/` and `/project/abbeyluck`. The other menu links point at
  pages that don't exist yet.
- Hub: registered as `corner-bodega`, with screens Home (group "Home") and
  Abbey Luck (group "Artist pages"). The entry is
  https://cornerbodega.micahburger.com/, which **isn't set up yet**, so its
  hub frames show error + Retry until the preview is deployed.
- Dev server: `corner-bodega-dev` (port 8080) in this session's
  launch.json, plus `npm --prefix ../corner-bodega run dev`.
- Comparisons: run `node tools/screenshots.mjs` and then
  `python3 tools/compare.py` in corner-bodega. They write
  `shots/compare-*.jpg` (gitignored).

---

## Step 5 — 2026-10-27: every public page migrated

- **Pages built**, all verified at 390/768/1440: `/`, the six artist pages
  `/project/{abbeyluck,diego,badrul,mrtaylor,yusuf,jered}`, and a 404
  (`404.html`, wired up through `ErrorDocument`, with real 404 status).
  - Artist copy was converted from the export's Semplice JSON, with the
    DECISIONS.md fixes applied.
  - Every image has hand-written alt text.
- **Site of the day dropped** at Micah's request (DECISIONS.md §7). It's
  gone from the menu, and `/project/sod` 404s until the redirects step
  sends it to `/`.
- **Not migrated** (WordPress leftovers, for redirects): `/hello-world`,
  `/category/uncategorized`, `/author/micahmicahdesign`, the feeds and
  sitemaps, and attachment pages.
- **Hub:** corner-bodega has 8 screens: Home ("Home"), six artists
  ("Artist pages"), and the 404 ("Errors"). Each is still waiting on the
  preview subdomain.
- **Checks** — `node tools/check.mjs`, verified with no problems:
  - every page at all three widths: no horizontal overflow, every image
    loads (lazy gallery slides forced), alt text on all;
  - zero requests outside the site and none to `wp-content`;
  - 877 local file references in `_site/` all exist;
  - keyboard: every tab stop shows focus, from the skip link to the footer;
  - the menu opens with 6 links and Esc closes it;
  - all 5 home-page galleries page forward and back;
  - every internal link returns 200;
  - 18 distinct Etsy URLs: 17 listings plus the shop. The shop URL is in
    every footer and is also the pencils' link. Each one maps to its
    product, and each artist's Add to Cart goes to that artist's own zine.
- Etsy listings themselves were opened in Chrome during Step 3 (same day,
  same URLs) and not re-opened here. The shop is still on its break.

---

## Step 6 — 2026-10-28: production prep and the preview deploy

### Production prep (code, in ../corner-bodega) — verified locally

- **Meta:** every page has a title, a description, Open Graph tags, a
  `twitter:card`, and a 1200×630 social image.
  - Artist pages use their hero image, cropped. Home and the 404 use the
    logo GIF, letterboxed.
  - Image URLs are absolute on whichever domain the build is for.
- **`.htaccess`** is generated from `src/htaccess.njk` +
  `src/_data/redirects.json`:
  - **Production:** http and www go to `https://cornerbodega.pub` in one
    hop, which matches the live site. Framing is `frame-ancestors 'self'`.
  - **Preview:** https is forced. `X-Robots-Tag: noindex, nofollow`, and
    `frame-ancestors 'self' https://prototypes.micahburger.com
    http://localhost:4177`, with any `X-Frame-Options` removed so the hub
    can frame pages.
  - **Both:** 301s for every changed old URL —
    - 20 hand-listed (Hello world, archives, feeds, sitemaps, Site of the
      day, old project slugs, WordPress's `-duplicate` slugs);
    - `?p=` / `?page_id=` / `?s=`;
    - all 156 attachment pages → `/uploads/<original>`;
    - `/wp-content/uploads/…`, including resized copies → `/uploads/<original>`;
    - plus trailing slash → slashless, extensionless pages, and the
      ErrorDocument 404.
- **Builds:**
  - `npm run build` → `_site/` (PREVIEW, 114 MB): all 8 HTML pages carry
    noindex, robots.txt disallows everything, and there's no sitemap.
  - `npm run build:production` → `_production/` (306 MB, because it carries
    all 156 originals so old image URLs land on real files): grep finds
    **no noindex anywhere**, 7 canonical URLs, a 7-URL sitemap and a
    normal robots.txt. The 404 has no noindex — its 404 status is enough.

### Preview deploy — done, verified

- **Site created in hPanel** (approved): Websites → Create site → PHP/HTML
  website → `cornerbodega.micahburger.com` ("Use it") → Next. It's on the
  same Premium plan as the other subdomains.
  - Hostinger added DNS itself in the micahburger.com zone: A
    82.29.87.167 and AAAA 2a02:4780:b:630:0:cc6:42e8:8. No "Connect
    domain" step was needed.
  - Folder: `~/domains/cornerbodega.micahburger.com/public_html/`.
  - Nothing on cornerbodega.pub, its DNS or WordPress was touched.
- **SSL:** a Let's Encrypt certificate (YE1) for
  cornerbodega.micahburger.com, issued automatically about a minute after
  creation, valid until 2027-01-26.
- **SSH works from this Mac**, key only, no password:
  - key `~/.ssh/hostinger_micahburger`, port 65002;
  - the username is in hPanel → SSH Access (it's in
    `tools/deploy-preview.sh`, not here, because this file is public);
  - host key ED25519 `SHA256:I6WhBXa9cABfrCnoD+oX/m+GAYoW9A7YkURr4KKrMJg`,
    which matches hPanel.
  - So deploys use **rsync over SSH**, not a zip through File Manager.
- **On the real server**, verified with curl:
  - all 7 pages return 200, a trailing slash 301s, unknown URLs get the
    styled 404 with status 404, and http 301s to https;
  - the noindex and frame-ancestors headers are present;
  - every redirect type was tested and 301s to the right place.
  - (The `/uploads/` originals and `sitemap.xml` 404 on the preview by
    design; production carries them.)
- `node tools/check.mjs https://cornerbodega.micahburger.com` → **no
  problems** at 390/768/1440: every image loads from the new site, there
  are zero requests to WordPress, and focus, the menu, galleries and links
  all pass.
- **Etsy spot-check** in Chrome, clicked from the live preview:
  - Found Objects card → "Found Objects - Illustration zine";
  - Matt's Add to Cart → "Passengers - Illustration zine";
  - Badrul's → "New York State of Mind - B/W Photography zine".
  - The shop is still on its break.
- **Hub:** the corner-bodega entry is `https://cornerbodega.micahburger.com/`.
  On the local hub (localhost:4177) all 7 page frames load with no framing
  refusals. **The live hub won't show it until the prototypes-site changes
  from Steps 4–6 are committed and pushed.**

### How to update the preview (repeatable)

```sh
cd "/Users/_Micah/_2026/Claude Prototypes/corner-bodega"
./tools/deploy-preview.sh
```

The script does four things:
1. Builds PREVIEW into `_site/`.
2. Refuses to continue if any page lacks noindex.
3. Shows what would change on the server.
4. Asks, then runs `rsync -rlzc --delete` into the subdomain's
   `public_html` only. `--yes` skips the question.

Then run `node tools/check.mjs https://cornerbodega.micahburger.com`.

If the key ever stops working, there's a manual fallback:
1. `npm run build`.
2. Zip the *contents* of `_site/`, hidden `.htaccess` included:
   `cd _site && zip -r ../preview.zip . && cd ..`
3. hPanel → cornerbodega.micahburger.com → File manager → `public_html` →
   delete the old files → Upload `preview.zip` → Extract here → delete
   the zip.
