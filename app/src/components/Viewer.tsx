import { useCallback, useEffect, useRef, useState } from "react";
import type { Action, Prototype, Selections } from "../types";
import {
  MODE_WIDTH,
  WIDTH_VIEWPORTS,
  allGroups,
  deviceOf,
  frameSrc,
  fullState,
  galleryHref,
  isSameOrigin,
  matchScreen,
  homeMode,
  normalize,
  parseMode,
  readSelections,
  scaleLabel,
  screenById,
  viewerHref,
  type FrameMode,
  type ViewerMode,
} from "../lib/protos";
import { navigate, useLocation } from "../lib/router";
import { PHONE_QUERY, useElementSize, useMediaQuery, useShortcuts } from "../lib/hooks";
import { clearOriginStorage, readPref, writePref } from "../lib/prefs";
import { useToast } from "./Bits";
import { ControlsPanel } from "./ControlsPanel";
import { RequestPanel } from "./RequestPanel";
import { TopBar } from "./TopBar";
import { ArrowLeft, Collapse, Pencil, ResetIcon, Sliders } from "./Icons";

/*
 * The URL is the source of truth for mode, screen and selections, so a
 * copied link reopens exactly this. The iframe's src is deliberately *not*
 * derived from the URL on every render: the prototype navigates itself, and
 * re-deriving src would yank it back to the screen it started on. Instead
 * the frame is (re)loaded only when the screen or selections in the URL
 * change for a reason other than the frame reporting where it already is —
 * `applied` holds what the frame is known to be showing, and any URL change
 * that matches it is a no-op.
 */

/*
 * The framed modes' cases. A phone and a tablet get a bezel; a desktop
 * width is a plain rounded window, since a 1440px laptop drawn round it
 * would only shrink the page further.
 */
const BEZELS: Record<FrameMode, number> = { phone: 12, tablet: 14, desktop: 0 };
const STAGE_PAD = 32;
const HELPER_SESSION_KEY = "protoviewer:state";

export function Viewer({ proto }: { proto: Prototype }) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const isPhoneWindow = useMediaQuery(PHONE_QUERY);
  const sameOrigin = isSameOrigin(proto);

  const modeParam = parseMode(params.get("mode"));
  // With no mode in the URL, open at the prototype's own size: a desktop
  // site in a phone frame is a squeeze you'd switch out of every time. A
  // phone-sized window is full screen regardless — there's no room for a frame.
  const mode: ViewerMode = modeParam ?? (isPhoneWindow || deviceOf(proto) === "desktop" ? "full" : "phone");
  // Where leaving full screen goes back to: the last framed width seen,
  // else the prototype's own.
  const lastFrame = useRef<FrameMode>(mode === "full" ? homeMode(proto) : mode);
  if (mode !== "full") lastFrame.current = mode;
  const selections = normalize(proto, readSelections(params));
  const selKey = stableKey(selections);
  const entryScreen = matchScreen(proto, proto.entry) ?? proto.screens[0];
  const screen = screenById(proto, params.get("screen")) ?? entryScreen;

  // Reads the live URL rather than this render's copy: it's also called from
  // listeners attached inside the frame, which outlive the render that
  // attached them, and a stale copy would drop selections made since.
  const replaceUrl = useCallback(
    (next: { mode?: ViewerMode | null; screen?: string | null; selections?: Selections }) => {
      const live = new URLSearchParams(location.search);
      const m = next.mode === undefined ? live.get("mode") : next.mode;
      const s = next.screen === undefined ? live.get("screen") : next.screen;
      navigate(
        viewerHref(proto.slug, {
          mode: (m as ViewerMode) ?? undefined,
          screen: s ?? undefined,
          selections: next.selections ?? normalize(proto, readSelections(live)),
        }),
        { replace: true },
      );
    },
    [proto],
  );

  // ---- the frame ---------------------------------------------------------

  const frameRef = useRef<HTMLIFrameElement>(null);
  const knownPath = useRef(screen.path);
  const applied = useRef({ screen: screen.id, sel: selKey });
  const helperReady = useRef(false);
  const pendingReset = useRef<(() => void) | null>(null);
  const [frame, setFrame] = useState(() => ({ src: frameSrc(proto, screen.path, selections), key: 0 }));

  const load = useCallback(
    (path: string, sel: Selections) => {
      // Same-origin prototypes share our sessionStorage, where the helper
      // mirrors states for multi-page navigation. A viewer-initiated load
      // must start from the URL alone.
      if (sameOrigin) sessionStorage.removeItem(HELPER_SESSION_KEY);
      helperReady.current = false;
      knownPath.current = path;
      setFrame((f) => ({ src: frameSrc(proto, path, sel), key: f.key + 1 }));
    },
    [proto, sameOrigin],
  );

  const post = useCallback((message: object) => {
    frameRef.current?.contentWindow?.postMessage(message, "*");
  }, []);

  useEffect(() => {
    if (applied.current.screen === screen.id && applied.current.sel === selKey) return;
    const screenChanged = applied.current.screen !== screen.id;
    applied.current = { screen: screen.id, sel: selKey };
    if (!screenChanged && proto.liveStates && helperReady.current) {
      post({ type: "prototype:set-state", state: fullState(proto, selections) });
      return;
    }
    load(screenChanged ? screen.path : knownPath.current, selections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen.id, selKey]);

  // The frame tells us where it went; follow it in the panel and the URL.
  const followPath = useCallback(
    (path: string, screenId?: string) => {
      knownPath.current = path;
      const match = screenById(proto, screenId) ?? matchScreen(proto, path, applied.current.screen);
      if (!match || match.id === applied.current.screen) return;
      applied.current = { ...applied.current, screen: match.id };
      replaceUrl({ screen: match.id === entryScreen.id ? null : match.id });
    },
    [proto, replaceUrl, entryScreen.id],
  );

  const [toastNode, toast] = useToast();
  const [awake, setAwake] = useState(true);
  const wake = useRef<() => void>(() => {});

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!frameRef.current || event.source !== frameRef.current.contentWindow) return;
      const data = event.data;
      if (!data || typeof data.type !== "string") return;
      switch (data.type) {
        case "prototype:ready":
          helperReady.current = true;
          followPath(data.path);
          break;
        case "prototype:navigate":
          followPath(data.path);
          break;
        case "prototype:screen":
          followPath(data.path ?? knownPath.current, data.screenId);
          break;
        case "prototype:reset-done":
          pendingReset.current?.();
          break;
        case "prototype:activity":
          wake.current();
          break;
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [followPath]);

  // Same-origin prototypes without the helper can still be followed: read
  // the frame's location directly, and listen for its own route events.
  const onFrameLoad = () => {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    try {
      const here = () => win.location.pathname + win.location.search + win.location.hash;
      followPath(here());
      win.addEventListener("hashchange", () => followPath(here()));
      win.addEventListener("popstate", () => followPath(here()));
    } catch {
      // Cross-origin: only the helper can tell us anything.
    }
  };

  // ---- actions -----------------------------------------------------------

  const setSelection = (groupId: string, optionId: string) =>
    replaceUrl({ selections: normalize(proto, { ...selections, [groupId]: optionId }) });

  const resetStates = () => replaceUrl({ selections: {} });

  const fireAction = (action: Action) => {
    post({ type: "prototype:action", id: action.id });
    toast(action.label);
  };

  const reset = () => {
    if (sameOrigin) clearOriginStorage(proto.storageKeys);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      pendingReset.current = null;
      applied.current = { screen: entryScreen.id, sel: stableKey({}) };
      load(proto.entry, {});
      replaceUrl({ screen: null, selections: {} });
      toast("Reset to start");
    };
    // Give a prototype with the helper a moment to clear its own storage and
    // in-memory data and confirm; anything else just reloads.
    pendingReset.current = finish;
    post({ type: "prototype:reset", storageKeys: proto.storageKeys ?? [] });
    window.setTimeout(finish, helperReady.current ? 600 : 0);
  };

  const resetTitle = sameOrigin
    ? "Clear stored data, reset states and reload at the start (R)"
    : "Reset states and reload at the start (R). This prototype is on another site, so its stored data clears only if it uses the state helper.";

  // ---- panel -------------------------------------------------------------

  const groups = allGroups(proto);
  const hasAnyStates = groups.size > 0 || !!proto.actions?.length || proto.screens.some((s) => s.actions?.length);
  const [dockedOpen, setDockedOpen] = useState(() => (hasAnyStates ? readPref("panel", true) : false));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const panelVariant = isPhoneWindow ? "sheet" : mode === "full" ? "drawer" : "docked";
  const panelOpen = panelVariant === "docked" ? dockedOpen : drawerOpen;
  const setPanelOpen = (open: boolean) => {
    if (panelVariant === "docked") {
      setDockedOpen(open);
      writePref("panel", open);
    } else setDrawerOpen(open);
  };

  const sections = [
    { title: "States of this screen", groups: screen.states ?? [], actions: screen.actions ?? [] },
    { title: "Whole prototype", groups: proto.states ?? [], actions: proto.actions ?? [] },
  ];

  // A prototype with nothing to control gets no States button, pill button,
  // shortcut or panel at all — an empty drawer that says so is just noise.
  const panel = hasAnyStates && (
    <ControlsPanel
      variant={panelVariant}
      open={panelOpen}
      onOpenChange={setPanelOpen}
      sections={sections}
      selections={selections}
      onSelect={setSelection}
      onAction={fireAction}
      onResetStates={resetStates}
      emptyNote="This screen has no states of its own."
    />
  );

  // ---- mode, shortcuts ---------------------------------------------------

  const setMode = (next: ViewerMode) => {
    setDrawerOpen(false);
    replaceUrl({ mode: next });
  };
  const view = viewerHref(proto.slug, { mode: modeParam, screen: params.get("screen") ?? undefined, selections });
  const gallery = galleryHref(proto.slug, { selections: pickGlobal(proto, selections) });

  // ---- request a change --------------------------------------------------

  const [requestOpen, setRequestOpen] = useState(false);
  // Where the frame actually is, not where it was opened: knownPath follows
  // the prototype's own navigation.
  const previewUrl = () => frameSrc(proto, knownPath.current, selections);
  const full = mode === "full";
  const requestPanel = requestOpen && (
    <RequestPanel
      proto={proto}
      variant={isPhoneWindow ? "sheet" : full ? "drawer" : "docked"}
      context={{
        screen,
        width: full ? window.innerWidth : MODE_WIDTH[mode],
        widthNote: full ? "full screen" : undefined,
        selections,
        previewUrl: previewUrl(),
      }}
      onClose={() => setRequestOpen(false)}
    />
  );

  useShortcuts({
    g: () => navigate(gallery),
    f: () => setMode(mode === "full" ? lastFrame.current : "full"),
    ...(hasAnyStates && { s: () => setPanelOpen(!panelOpen) }),
    c: () => setRequestOpen(!requestOpen),
    r: reset,
    Escape: () => {
      if (panelVariant !== "docked" && drawerOpen) setDrawerOpen(false);
      else if (requestOpen) setRequestOpen(false);
      else if (mode === "full") setMode(lastFrame.current);
    },
  });

  // Full screen's floating pill sleeps after 2s of stillness. Movement over
  // the prototype only reaches us through the helper's activity pings.
  useEffect(() => {
    if (mode !== "full") return;
    let timer = 0;
    const nudge = () => {
      setAwake(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setAwake(false), 2000);
    };
    wake.current = nudge;
    nudge();
    window.addEventListener("pointermove", nudge);
    window.addEventListener("keydown", nudge);
    return () => {
      wake.current = () => {};
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", nudge);
      window.removeEventListener("keydown", nudge);
    };
  }, [mode]);

  const iframe = (
    <iframe
      key={frame.key}
      ref={frameRef}
      src={frame.src}
      title={proto.title}
      className="pv-frame"
      onLoad={onFrameLoad}
      allow="clipboard-write; fullscreen"
    />
  );

  // One tree for both modes. A live prototype's frame holds every change
  // made since it loaded, and none of it is in frame.src — so the iframe
  // must never remount on a mode switch, or it reloads to its first state.
  // Every node above it keeps its type and position in both modes (the
  // `&&` slots hold their place when false); CSS does the rearranging.
  return (
    <div className={`pv-viewer${full ? " pv-viewer--full" : ""}`}>
      {!full && (
        <TopBar
          proto={proto}
          view="view"
          viewHref={view}
          galleryHref={gallery}
          mode={{ value: mode, onChange: setMode }}
          panelOpen={panelOpen}
          onTogglePanel={hasAnyStates ? () => setPanelOpen(!panelOpen) : undefined}
          onReset={reset}
          resetTitle={resetTitle}
          previewUrl={previewUrl}
          requestOpen={requestOpen}
          onToggleRequest={() => setRequestOpen(!requestOpen)}
        />
      )}
      <div className="pv-workspace">
        {panelVariant === "docked" && panel}
        <DeviceStage mode={full ? lastFrame.current : mode} full={full}>
          {iframe}
        </DeviceStage>
        {!full && !isPhoneWindow && requestPanel}
      </div>
      {panelVariant !== "docked" && panel}
      {(full || isPhoneWindow) && requestPanel}
      {full && (
        // The dock is two layers in one spot: the full pill, and a small
        // handle that stands in for it while it sleeps. Only the handle (and
        // the awake pill) take pointer events, so a sleeping dock blocks a
        // thumb-sized strip of the prototype instead of the pill's whole width.
        <div className={`pv-dock${awake || drawerOpen ? "" : " is-asleep"}`}>
          <button
            type="button"
            className="pv-dock__handle"
            aria-label="Show viewer controls"
            onPointerEnter={() => wake.current()}
            onClick={() => wake.current()}
          />
          <div className="pv-pill" onPointerEnter={() => wake.current()}>
          <button type="button" className="pv-pill__btn" onClick={() => navigate("/prototypes")} title="All prototypes">
            <ArrowLeft />
            <span>Back</span>
          </button>
          {hasAnyStates && (
            <button type="button" className="pv-pill__btn" aria-pressed={drawerOpen} onClick={() => setPanelOpen(!panelOpen)} title="Controls (S)">
              <Sliders />
              <span>States</span>
            </button>
          )}
          <button type="button" className="pv-pill__btn" onClick={reset} title={resetTitle}>
            <ResetIcon />
            <span>Reset</span>
          </button>
          <button type="button" className="pv-pill__btn" aria-pressed={requestOpen} onClick={() => setRequestOpen(!requestOpen)} title="Request a change (C)">
            <Pencil />
            <span>Request</span>
          </button>
          <button type="button" className="pv-pill__btn" onClick={() => setMode(lastFrame.current)} title="Exit full screen (F or Esc)">
            <Collapse />
            <span>Exit full screen</span>
          </button>
          </div>
        </div>
      )}
      {toastNode}
    </div>
  );
}

/**
 * Centres the frame at its mode's real viewport (390×844, 768×1024,
 * 1440×900) in the space left, shrinking it (never growing) to fit, and
 * says so underneath. In full screen the same nodes stay put and just stop
 * being a device — see the note on the Viewer's return for why they can't
 * be swapped out.
 */
function DeviceStage({ mode, full, children }: { mode: FrameMode; full: boolean; children: React.ReactNode }) {
  const [ref, { width, height }] = useElementSize<HTMLDivElement>();
  const { width: vw, height: vh } = WIDTH_VIEWPORTS[MODE_WIDTH[mode]];
  const bezel = BEZELS[mode];
  const outerW = vw + bezel * 2;
  const outerH = vh + bezel * 2;
  const scale = width && height ? Math.min(1, (height - STAGE_PAD * 2) / outerH, (width - STAGE_PAD * 2) / outerW) : 1;
  return (
    <div ref={ref} className={`pv-stage${full ? " pv-stage--full" : ""}`}>
      {/* The layout box is the scaled size, so centring works on what's seen. */}
      <div className="pv-stage__box" style={full ? undefined : { width: outerW * scale, height: outerH * scale }}>
        <div
          className={`pv-phone pv-phone--${mode}${full ? " pv-phone--full" : ""}`}
          style={full ? undefined : { width: outerW, height: outerH, padding: bezel, transform: `scale(${scale})` }}
        >
          <div className="pv-phone__screen">{children}</div>
        </div>
        {!full && <p className="pv-stage__caption">{scaleLabel(vw, scale)}</p>}
      </div>
    </div>
  );
}

function pickGlobal(proto: Prototype, selections: Selections) {
  const ids = new Set((proto.states ?? []).map((g) => g.id));
  return Object.fromEntries(Object.entries(selections).filter(([g]) => ids.has(g)));
}

function stableKey(selections: Selections) {
  return JSON.stringify(Object.entries(selections).sort(([a], [b]) => a.localeCompare(b)));
}
