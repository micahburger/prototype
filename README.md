# Prototypes

A small personal viewer for my prototypes: browse them, open one in a phone
frame or full screen, flip a screen between its states, reset it, and see
every screen at once in a gallery.

Lives at https://prototypes.micahburger.com/prototypes (noindex).

```sh
npm --prefix app install
npm --prefix app run dev     # http://localhost:4177/prototypes
./deploy.sh                  # build + copy to repo root; pushing main deploys
```

| URL | What |
|---|---|
| `/prototypes` | every prototype, newest first, with search |
| `/prototypes/:slug?mode=phone\|tablet\|desktop\|full&screen=:id&state.<group>=<option>` | the viewer, at 390 / 768 / 1440 or full screen |
| `/prototypes/:slug/gallery?width=390\|768\|1440&size=s\|m\|l&state.<group>=<option>` | review board: every page at one width |
| `/prototypes/:slug/gallery?board=widths&screen=:id` | review board: one page at all three widths |

Older `gallery?device=phone|desktop` links still work (read as 390 / 1440).

Shortcuts: **G** View/Review · **F** full screen · **S** controls · **C** request a
change · **R** reset · **Esc** exit full screen / close drawer. They work while focus is on the
viewer's own chrome. Once you've clicked into a prototype, its frame has the
keyboard.

With no `mode` in the URL, the viewer opens at the prototype's `device`: a
phone frame for phone prototypes, full screen for desktop ones. The States
button, panel and **S** shortcut only appear for prototypes that declare
states or actions.

## Local shortcuts

Copy local path and Copy Claude Code command read `app/hub.local.json`
(gitignored; copy `app/hub.local.example.json`). It is only read by the dev
server, so these two buttons never appear on the live site.

```json
{ "projects": { "lattice": { "path": "/Users/me/Projects/lattice-site" } } }
```

## Adding a prototype

Add one entry to [`app/src/prototypes.config.ts`](app/src/prototypes.config.ts).
That's it for a prototype with no states. If it has states, also adopt the
helper (below).

### Prototype fields

| Field | |
|---|---|
| `slug` | URL id, unique |
| `title`, `description` | description is one line |
| `status` | `"concept"` \| `"in progress"` \| `"done"` |
| `updated` | ISO date (`2026-10-27`) or date-time. Sorts the index. |
| `entry` | start screen: a full URL, or a path on this site (`/demo/index.html`) |
| `device` | `"phone"` (default) or `"desktop"`: the preview frame on the index, and the gallery's default |
| `repo` | repository URL; shows an Open repo button |
| `thumbnail` | image path. Omit it and the card shows a live preview of `entry`. |
| `storageKeys` | localStorage/sessionStorage key **prefixes** this prototype writes, cleared by Reset |
| `liveStates` | `true` if the prototype applies state changes without a reload (posts instead of reloading) |
| `states` | prototype-wide state groups (e.g. which persona is viewing) |
| `actions` | prototype-wide one-off buttons (e.g. "Jump ahead five days") |
| `screens` | the screen list, below |

### Screen fields

| Field | |
|---|---|
| `id`, `title` | id unique within the prototype |
| `path` | relative to `entry`'s origin, or a full URL. A `#hash` makes the match hash-specific. |
| `section` | the page's group: a heading on the review board, "This group" in a change request |
| `cover` | image shown while the live preview loads, or if it fails |
| `states`, `actions` | groups and buttons that only show on this screen |
| `preset` | `{ groupId: optionId }` this entry opens with |

The same `path` can appear several times with different presets. Each one is
its own gallery card ("Applications, empty", "Applications, just invited").

A **state group** is `{ id, label, options: [{ id, label }] }`, and its first
option is the default. Group ids are unique within a prototype. An
**action** is `{ id, label }`.

## The state helper

[`app/public/helper/protostate.js`](app/public/helper/protostate.js) is the
only thing that couples a prototype to the viewer. It has no dependencies and
does nothing outside the viewer.

```html
<script src="https://prototypes.micahburger.com/helper/protostate.js"></script>
<script>
  const stage = protostate.getState("stage", "some");    // read a selection
  protostate.onStateChange(render);                      // live changes (liveStates: true)
  protostate.onAction("jump-five-days", () => { ... });  // an action button
  protostate.onReset(() => { ... });                     // drop in-memory data
  protostate.reportScreen("decision");                   // optional: name the screen
</script>
```

In React, copy `protostate.js` and
[`useProtoState.ts`](app/public/helper/useProtoState.ts) into the project and
use `useProtoState(group, default)`, `useProtoAction(id, cb)` and
`useReportScreen(id)`.

How it works:

- Selections ride on the iframe's URL as `?state.<group>=<option>`. Defaults
  are left out. A multi-page prototype keeps them across its own links
  (sessionStorage, under `protoviewer:state`).
- By default the viewer applies a change by **reloading** the frame with new
  params. With `liveStates: true` it posts
  `{ type: "prototype:set-state", state }` instead.
- Actions post `{ type: "prototype:action", id }`. Reset posts
  `{ type: "prototype:reset", storageKeys }`, and the helper clears the
  storage for its own origin.
- The helper reports every route change (history and hash), so the controls
  panel follows navigation inside a single-page app.

[`app/public/demo/index.html`](app/public/demo/index.html) uses all of the
above, and it's the example to copy.

### Same site vs. another site

The viewer can see inside a prototype only when both are on the same site
(origin). Every live site in the manifest is on its own subdomain, so for
them:

| Without the helper | With the helper |
|---|---|
| Shows and reloads, previews work | All of that, plus: |
| Reset reloads at the start and resets states | Reset also clears the prototype's storage and in-memory data |
| Panel stays on the screen that was opened | Panel follows navigation |
| States can't do anything | States and actions work |

The full-screen pill wakes up on pointer movement. Over a cross-origin frame
that movement only arrives through the helper, so without it, hover the
bottom-right corner to bring the pill back.

## Reset

1. Remove localStorage/sessionStorage keys matching `storageKeys`. With
   none declared, clear the origin's storage except keys starting
   `protoviewer:`, which is where the tool keeps its own preferences.
2. Post `prototype:reset`, so the helper can do the same on another site.
3. Return every state to its default and reload at `entry`.
