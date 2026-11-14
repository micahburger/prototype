import type { Prototype } from "./types";

// The only file to edit when adding a prototype. Field reference is in the
// README; the short version: slug/title/description/status/updated/entry, a
// list of screens, and optionally repo, states, actions and storageKeys.
// Local source folders are not here — this file ships to the live site —
// but in app/hub.local.json (gitignored, read only by the dev server).
//
// Every live site here is on its own origin, which shapes what the viewer can
// do with it. Until a site loads /helper/protostate.js the viewer can show
// and reload it but can't see which page it's on, clear its storage or drive
// its states — those groups are left out below rather than declared and
// doing nothing. The same-origin demo at /demo/index.html still uses the
// helper and exercises the whole contract; it just no longer has a card.

const prototypes: Prototype[] = [
  {
    slug: "corner-bodega",
    title: "Corner Bodega",
    description: "A static rebuild of cornerbodega.pub — the zine shop, six artist pages and a 404.",
    status: "in progress",
    updated: "2026-10-27T23:30:00-04:00",
    // The preview subdomain the rebuild deploys to (NOTES.md). Until it's set
    // up these frames show the board's error + Retry; locally, run the site
    // with `npm --prefix ../corner-bodega run dev` and open it on :8080.
    entry: "https://cornerbodega.micahburger.com/",
    device: "desktop",
    // Paths are the old site's URLs, kept as-is by the rebuild.
    screens: [
      { id: "home", title: "Home", path: "/", section: "Home" },
      { id: "abbeyluck", title: "Abbey Luck — Crumble Cave", path: "/project/abbeyluck", section: "Artist pages" },
      { id: "diego", title: "Diego Rioja — From Above", path: "/project/diego", section: "Artist pages" },
      { id: "badrul", title: "Badrul Rupak — NYSoM, The Love Bug", path: "/project/badrul", section: "Artist pages" },
      { id: "mrtaylor", title: "Matt Taylor — Passengers", path: "/project/mrtaylor", section: "Artist pages" },
      { id: "yusuf", title: "Yusuf Lateef — New Mythology", path: "/project/yusuf", section: "Artist pages" },
      { id: "jered", title: "Jered Snyder — Peculiar Notion", path: "/project/jered", section: "Artist pages" },
      // Any missing URL shows the 404; this one is just guaranteed missing.
      { id: "not-found", title: "Page not found (404)", path: "/this-page-does-not-exist", section: "Errors" },
    ],
  },
  {
    slug: "2026folio",
    title: "2026 portfolio",
    description: "Four product chapters and a resume — a slide deck on desktop, a scroll on mobile.",
    status: "done",
    updated: "2026-09-19T22:18:34-04:00",
    entry: "https://2026folio.micahburger.com/",
    repo: "https://github.com/micahburger/2026folio",
    device: "desktop",
    // Path routes, one per chapter (PortfolioShell.tsx in ../2026folio-site).
    screens: [
      { id: "overview", title: "Overview", path: "/overview" },
      { id: "applicant-experience", title: "Applicant experience", path: "/applicant-experience", section: "Chapters" },
      { id: "requesting-an-application", title: "Requesting an application", path: "/requesting-an-application", section: "Chapters" },
      { id: "messaging", title: "Messaging", path: "/messaging", section: "Chapters" },
      { id: "ai-assistant", title: "Rental Assistant", path: "/ai-assistant", section: "Chapters" },
      { id: "resume", title: "Resume", path: "/resume", section: "Chapters" },
    ],
  },
  {
    slug: "applicants",
    title: "Rental application redesign",
    description: "RentSpree applicant case study, from the first form field through payment.",
    status: "done",
    updated: "2026-11-11T22:09:53-05:00",
    // Moved into v2 on 2026-11-11 (it was applicants.micahburger.com, which
    // now redirects here), and v2 became micahburger.com on 2026-11-13.
    // Paths are full because a leading "/" resolves against the site's
    // root, not the page's folder.
    entry: "https://micahburger.com/project/applicant-experience/",
    repo: "https://github.com/micahburger/v2",
    device: "desktop",
    screens: [
      { id: "case-study", title: "Case study", path: "/project/applicant-experience/" },
      { id: "screens", title: "Screens", path: "/project/applicant-experience/screens/" },
      { id: "styleguide", title: "Styleguide", path: "/project/applicant-experience/styleguide/" },
    ],
  },
  {
    slug: "lattice",
    title: "Lattice",
    description: "An editorial design explorer — mix type, colour, layout and spacing into a live page.",
    status: "done",
    updated: "2026-08-19T12:46:33-04:00",
    entry: "https://lattice2026.micahburger.com/",
    repo: "https://github.com/micahburger/Lattice2.0",
    device: "desktop",
    // The intro's "seen" flag (app.js), cleared through the helper on Reset.
    storageKeys: ["latticeIntroSeen"],
    // js/protostate-adapter.js in ../lattice-site maps these onto Lattice's
    // own `state` without a reload. Option ids are Lattice's own values
    // (data.js), first one being its default.
    liveStates: true,
    states: [
      {
        id: "typography",
        label: "Type",
        options: [
          { id: "editorial", label: "Editorial" },
          { id: "contemporary", label: "Contemporary" },
          { id: "fashion", label: "Fashion" },
          { id: "luxury", label: "Luxury" },
          { id: "mono", label: "Mono" },
        ],
      },
      {
        id: "colorStory",
        label: "Color",
        options: [
          { id: "museum", label: "Museum Paper" },
          { id: "graphite", label: "Graphite Night" },
          { id: "signal", label: "Signal Red" },
          { id: "forest", label: "Deep Forest" },
          { id: "electric", label: "Electric Blue" },
          { id: "midnight", label: "Midnight" },
          { id: "clay", label: "Soft Clay" },
        ],
      },
      {
        id: "layout",
        label: "Layout",
        options: [
          { id: "magazine", label: "Magazine" },
          { id: "minimal", label: "Minimal" },
          { id: "grid", label: "Grid" },
          { id: "feature", label: "Feature" },
        ],
      },
      {
        id: "spacing",
        label: "Spacing",
        options: [
          { id: "generous", label: "Generous" },
          { id: "compact", label: "Compact" },
          { id: "rhythmic", label: "Rhythmic" },
        ],
      },
      {
        id: "contentFocus",
        label: "Content",
        options: [
          { id: "editorial", label: "Editorial" },
          { id: "portfolio", label: "Portfolio" },
          { id: "brand", label: "Brand" },
          { id: "product", label: "Product" },
        ],
      },
      {
        id: "sidebar",
        label: "Sidebar",
        options: [
          { id: "closed", label: "Closed" },
          { id: "controls", label: "Design controls" },
          { id: "guide", label: "Creative guide" },
        ],
      },
      {
        // "Like a real visit" honours the stored flag; the other two override
        // it without writing it, so the gallery can hide the intro for good.
        id: "intro",
        label: "Intro",
        options: [
          { id: "stored", label: "Like a real visit" },
          { id: "show", label: "Always show" },
          { id: "hide", label: "Never show" },
        ],
      },
    ],
    // One page, so every screen is the same path with a different preset.
    // The gallery cards hide the intro, or every one would open behind it.
    screens: [
      { id: "explorer", title: "Explorer", path: "/" },
      { id: "intro", title: "First-visit intro", path: "/", preset: { intro: "show" } },
      { id: "controls", title: "Design controls open", path: "/", section: "Sidebar", preset: { sidebar: "controls", intro: "hide" } },
      { id: "guide", title: "Creative guide open", path: "/", section: "Sidebar", preset: { sidebar: "guide", intro: "hide" } },
      { id: "graphite-luxury", title: "Graphite Night, luxury feature", path: "/", section: "Mixes", preset: { colorStory: "graphite", typography: "luxury", layout: "feature", intro: "hide" } },
      { id: "signal-grid", title: "Signal Red, contemporary grid", path: "/", section: "Mixes", preset: { colorStory: "signal", typography: "contemporary", layout: "grid", spacing: "compact", intro: "hide" } },
      { id: "forest-portfolio", title: "Deep Forest, fashion portfolio", path: "/", section: "Mixes", preset: { colorStory: "forest", typography: "fashion", layout: "minimal", contentFocus: "portfolio", intro: "hide" } },
      { id: "clay-product", title: "Soft Clay, product", path: "/", section: "Mixes", preset: { colorStory: "clay", contentFocus: "product", spacing: "rhythmic", intro: "hide" } },
    ],
  },
  {
    slug: "design-system",
    title: "Design system",
    description: "The reference for building my portfolios, case studies and prototypes.",
    status: "in progress",
    updated: "2026-10-22",
    entry: "https://ds.micahburger.com/",
    device: "desktop",
    screens: [{ id: "home", title: "Home", path: "/" }],
  },
  {
    slug: "micahburger",
    title: "micahburger.com",
    description: "The homepage, rebuilt from Semplice: clients, work history and featured projects, linking to every case study below.",
    status: "done",
    // v2 replaced the WordPress site on 2026-11-13 (v2.micahburger.com now
    // 301s here). Each case study also has its own card; this one keeps the
    // whole site on one review board.
    updated: "2026-11-13T19:03:45-05:00",
    entry: "https://micahburger.com/",
    repo: "https://github.com/micahburger/v2",
    device: "desktop",
    // View-only until v2 loads /helper/protostate.js. Paths are v2's routes
    // (sitemap.xml).
    screens: [
      { id: "home", title: "Home", path: "/" },
      { id: "rentspree", title: "RentSpree", path: "/project/rentspree", section: "Case studies" },
      { id: "applicant-experience", title: "Applicant experience", path: "/project/applicant-experience/", section: "Case studies" },
      { id: "opendoor", title: "Opendoor", path: "/project/opendoor", section: "Case studies" },
      { id: "lincoln", title: "Lincoln", path: "/project/lincoln", section: "Case studies" },
      { id: "infinity", title: "Infinity", path: "/project/infinity", section: "Case studies" },
      { id: "archive", title: "Archive", path: "/project/archive", section: "Case studies" },
    ],
  },
  {
    slug: "rentspree",
    title: "RentSpree",
    description: "The 2026 portfolio’s four chapters as one case study: applicant experience, requesting an application, messaging and the Rental Assistant.",
    status: "done",
    updated: "2026-11-10T21:02:14-05:00",
    entry: "https://micahburger.com/project/rentspree",
    repo: "https://github.com/micahburger/v2",
    device: "desktop",
    screens: [
      { id: "case-study", title: "Case study", path: "/project/rentspree" },
    ],
  },
  {
    slug: "opendoor",
    title: "Opendoor",
    description: "Redesign of Opendoor’s seller experience: compare the two ways to sell, understand the offer, know what happens next.",
    status: "done",
    updated: "2026-11-10",
    entry: "https://micahburger.com/project/opendoor",
    repo: "https://github.com/micahburger/v2",
    device: "desktop",
    screens: [
      { id: "case-study", title: "Case study", path: "/project/opendoor" },
    ],
  },
  {
    slug: "lincoln",
    title: "Lincoln",
    description: "Redesign of Lincoln’s Build and Price: configure and price a Lincoln on any screen.",
    status: "done",
    updated: "2026-11-11T16:58:52-05:00",
    entry: "https://micahburger.com/project/lincoln",
    repo: "https://github.com/micahburger/v2",
    device: "desktop",
    screens: [
      { id: "case-study", title: "Case study", path: "/project/lincoln" },
    ],
  },
  {
    slug: "infinity",
    title: "Infinity",
    description: "Redesign of Carrier’s Infinity thermostat and app, designed together for homeowners.",
    status: "done",
    updated: "2026-11-11T16:58:52-05:00",
    entry: "https://micahburger.com/project/infinity",
    repo: "https://github.com/micahburger/v2",
    device: "desktop",
    screens: [
      { id: "case-study", title: "Case study", path: "/project/infinity" },
    ],
  },
  {
    slug: "archive",
    title: "Archive",
    description: "Earlier work in one long read: Collins Aerospace, WWE, the American Bar Association, BBC News and Rockwell Group.",
    status: "done",
    updated: "2026-11-11T21:43:27-05:00",
    entry: "https://micahburger.com/project/archive",
    repo: "https://github.com/micahburger/v2",
    device: "desktop",
    // The old /project/wwe, /bbc, /rockwell, /aba and /fpo pages 301 to these
    // anchors.
    screens: [
      { id: "archive", title: "Archive", path: "/project/archive" },
      { id: "fpo", title: "Collins Aerospace", path: "/project/archive#fpo", section: "Projects" },
      { id: "wwe", title: "WWE", path: "/project/archive#wwe", section: "Projects" },
      { id: "aba", title: "American Bar Association", path: "/project/archive#aba", section: "Projects" },
      { id: "bbc", title: "BBC News", path: "/project/archive#bbc", section: "Projects" },
      { id: "rockwell", title: "Rockwell Group", path: "/project/archive#rockwell", section: "Projects" },
    ],
  },
];

export default prototypes;
