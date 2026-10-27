import type { Prototype } from "./types";

// The only file to edit when adding a prototype. Field reference is in the
// README; the short version: slug/title/description/status/updated/entry, a
// list of screens, and optionally states, actions and storageKeys.
//
// Every live site here is on its own origin, which shapes what the viewer can
// do with it. Until a site loads /helper/protostate.js the viewer can show
// and reload it but can't see which page it's on, clear its storage or drive
// its states — those groups are left out below rather than declared and
// doing nothing. The demo at the bottom is same-origin and uses the helper,
// so it exercises the whole contract.

const prototypes: Prototype[] = [
  {
    slug: "2026folio",
    title: "2026 portfolio",
    description: "Four product chapters and a resume — a slide deck on desktop, a scroll on mobile.",
    status: "done",
    updated: "2026-09-19T22:18:34-04:00",
    entry: "https://2026folio.micahburger.com/",
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
    device: "desktop",
    // The intro's "seen" flag (app.js). Cross-origin, so Reset can only clear
    // it once Lattice loads the helper.
    storageKeys: ["latticeIntroSeen"],
    screens: [{ id: "explorer", title: "Explorer", path: "/" }],
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
