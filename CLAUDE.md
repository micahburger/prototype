# prototypes

Micah Lindenberger's personal prototype viewer: an index, a viewer (phone
frame / full screen) with a states panel, and a per-prototype gallery. Vite +
React 18 + TypeScript, no other runtime dependencies. The README explains the
manifest and the state helper, so read it first.

Micah is a product designer: explain in plain language and give exact
copy-paste commands for anything they must run.

## Deploy

Same setup as ../2026folio-site. **Hostinger auto-deploys `main`, serving the
repo root.** Root `index.html`, `assets/`, `helper/`, `demo/` etc. are
committed build output, and source lives in `app/`. Run `./deploy.sh`
(build + copy) and commit the output with any `app/` change. Never commit
source without its rebuilt output.

## Where things are

```
app/src/prototypes.config.ts   the manifest — the only file edited to add a prototype
app/src/lib/protos.ts          manifest lookups, URL/state building, screen matching
app/src/components/Viewer.tsx  frame lifecycle, postMessage protocol, Reset, full screen
app/src/components/Gallery.tsx screen cards; LiveFrame.tsx does lazy mount + the 30-frame budget
app/public/helper/             protostate.js + useProtoState.ts — what prototypes adopt
app/public/demo/               same-origin demo that exercises the whole contract
```

## Things that will bite you

- **Every real prototype is cross-origin.** The viewer can't read the
  frame's location or storage. Navigation following, storage reset and states
  all depend on the prototype loading `protostate.js`. Test against the demo,
  which is same-origin and uses the helper.
- **The frame's src is not derived from the URL each render.** See the
  comment at the top of Viewer.tsx. `applied` is what the frame is known to
  show. Changing that logic risks the frame snapping back to its first
  screen whenever the prototype navigates.
- **Anything called from inside the frame must read live state, not a render
  closure.** Listeners attached to a same-origin frame outlive the render
  that attached them. `replaceUrl` reads `location.search` for that reason.
- **Preview frames don't mount while the browser pane is hidden.**
  IntersectionObserver doesn't fire on a background page. That's the
  environment, not a bug.
- Prototypes are only touched to adopt the helper, and only after asking.
  ../2026folio-site, ../applicants-site and ../lattice-site are their own
  repos and auto-deploy too.
