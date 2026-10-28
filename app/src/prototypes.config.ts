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
// doing nothing. The demo at the bottom is same-origin and uses the helper,
// so it exercises the whole contract.

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
    updated: "2026-08-21T23:25:17-04:00",
    entry: "https://applicants.micahburger.com/",
    repo: "https://github.com/micahburger/Applicants",
    device: "desktop",
    screens: [
      { id: "case-study", title: "Case study", path: "/" },
      { id: "screens", title: "Screens", path: "/screens/" },
      { id: "styleguide", title: "Styleguide", path: "/styleguide/" },
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
    description: "The main portfolio — Semplice on WordPress.",
    status: "done",
    updated: "2025-07-15",
    entry: "https://micahburger.com/",
    device: "desktop",
    // WordPress is view-only here: there's no page to add the helper to short
    // of a Semplice custom-code block.
    screens: [
      { id: "home", title: "Home", path: "/" },
      { id: "opendoor", title: "Opendoor", path: "/project/opendoor", section: "Projects" },
      { id: "aba", title: "ABA", path: "/project/aba", section: "Projects" },
      { id: "bbc", title: "BBC", path: "/project/bbc", section: "Projects" },
      { id: "infinity", title: "Infinity", path: "/project/infinity", section: "Projects" },
      { id: "lincoln", title: "Lincoln", path: "/project/lincoln", section: "Projects" },
      { id: "rockwell", title: "Rockwell", path: "/project/rockwell", section: "Projects" },
      { id: "wwe", title: "WWE", path: "/project/wwe", section: "Projects" },
    ],
  },
  {
    slug: "helper-demo",
    title: "State helper demo",
    description: "A tiny leasing inbox that wires up every part of the state helper. Delete freely.",
    status: "concept",
    updated: "2026-10-27",
    entry: "/demo/index.html",
    repo: "https://github.com/micahburger/prototype",
    device: "phone",
    storageKeys: ["demo:"],
    liveStates: true,
    states: [
      {
        id: "viewer",
        label: "Viewer",
        options: [
          { id: "agent", label: "Agent" },
          { id: "landlord", label: "Landlord" },
          { id: "renter", label: "Renter" },
        ],
      },
    ],
    actions: [{ id: "jump-five-days", label: "Jump ahead five days" }],
    screens: [
      {
        id: "applications",
        title: "Applications",
        path: "/demo/index.html#applications",
        section: "Applications",
        states: [
          {
            id: "stage",
            label: "Stage",
            options: [
              { id: "some", label: "A few in progress" },
              { id: "empty", label: "Empty" },
              { id: "just-invited", label: "Just invited" },
            ],
          },
        ],
        actions: [{ id: "add-application", label: "Add an application" }],
      },
      { id: "applications-empty", title: "Applications, empty", path: "/demo/index.html#applications", section: "Applications", preset: { stage: "empty" } },
      { id: "applications-invited", title: "Applications, just invited", path: "/demo/index.html#applications", section: "Applications", preset: { stage: "just-invited" } },
      {
        id: "decision",
        title: "Decision",
        path: "/demo/index.html#decision",
        section: "Decision",
        states: [
          {
            id: "outcome",
            label: "Outcome",
            options: [
              { id: "pending", label: "Pending" },
              { id: "approved", label: "Approved" },
              { id: "declined", label: "Declined" },
              { id: "error", label: "Failed to load" },
            ],
          },
        ],
      },
      { id: "decision-approved", title: "Decision, approved", path: "/demo/index.html#decision", section: "Decision", preset: { outcome: "approved" } },
      { id: "decision-error", title: "Decision, error", path: "/demo/index.html#decision", section: "Decision", preset: { outcome: "error" } },
    ],
  },
];

export default prototypes;
