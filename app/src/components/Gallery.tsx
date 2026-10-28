import { useState } from "react";
import type { Prototype, Screen, Selections } from "../types";
import {
  WIDTHS,
  WIDTH_MODE,
  WIDTH_NAMES,
  WIDTH_VIEWPORTS,
  deviceOf,
  displayPath,
  frameSrc,
  galleryHref,
  normalize,
  parseWidth,
  readSelections,
  scaleLabel,
  screenById,
  selectionLabels,
  viewerHref,
  widthOfDevice,
  type BoardView,
  type Size,
  type Width,
} from "../lib/protos";
import { navigate, useLocation } from "../lib/router";
import { PHONE_QUERY, useElementSize, useMediaQuery, useShortcuts } from "../lib/hooks";
import { readPref, writePref } from "../lib/prefs";
import { Segmented } from "./Bits";
import { ControlsPanel } from "./ControlsPanel";
import { LiveFrame } from "./LiveFrame";
import { RequestPanel } from "./RequestPanel";
import { TopBar } from "./TopBar";

const CARD_WIDTHS: Record<Width, Record<Size, number>> = {
  390: { s: 180, m: 260, l: 340 },
  768: { s: 240, m: 340, l: 480 },
  1440: { s: 320, m: 480, l: 720 },
};

const ROW_GAP = 24;
/** Below this the three widths stop sharing a row and a scale. */
const ROW_MIN = 900;

/*
 * The review board, at /prototypes/:slug/gallery. Two views of the same
 * page registry (the prototype's `screens`):
 *
 *   pages   every page at one width (390 / 768 / 1440), grouped by section
 *   widths  one page at all three widths side by side
 *
 * Every page entry is rendered with prototype-wide selections from the URL
 * underneath and the entry's own preset on top — so switching Viewer to
 * "Landlord" shows every page as the landlord, while "Decision, approved"
 * stays approved.
 *
 * Each preview lays out at its real width and is scaled to fit, and its
 * label says both ("1440px · shown at 25%"). Clicking one opens the viewer
 * at the same page, width and state — except while the request panel is
 * open, when a click picks that preview as what the request is about.
 */
export function Gallery({ proto }: { proto: Prototype }) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const isPhoneWindow = useMediaQuery(PHONE_QUERY);

  // URL first (a shared link), then the last choice for this prototype.
  // Links and prefs from before the three widths say device=phone|desktop.
  const saved = readPref<{ width?: number; device?: "phone" | "desktop"; size?: Size }>(`gallery:${proto.slug}`, {});
  const legacyDevice = params.get("device");
  const width: Width =
    parseWidth(params.get("width")) ??
    (legacyDevice === "phone" || legacyDevice === "desktop" ? widthOfDevice(legacyDevice) : undefined) ??
    parseWidth(String(saved.width)) ??
    widthOfDevice(saved.device ?? deviceOf(proto));
  const sizeParam = params.get("size");
  const size: Size = sizeParam === "s" || sizeParam === "m" || sizeParam === "l" ? sizeParam : saved.size ?? "m";
  const board: BoardView = params.get("board") === "widths" ? "widths" : "pages";
  const focus = screenById(proto, params.get("screen")) ?? proto.screens[0];

  const globalIds = new Set((proto.states ?? []).map((g) => g.id));
  // Only prototype-wide groups apply across cards, so with none there's
  // nothing for a panel here to do (same rule as the viewer).
  const hasGlobals = globalIds.size > 0;
  const globals = Object.fromEntries(
    Object.entries(normalize(proto, readSelections(params))).filter(([g]) => globalIds.has(g)),
  );

  const update = (next: { board?: BoardView; screen?: string; width?: Width; size?: Size; selections?: Selections }) => {
    const choice = { width: next.width ?? width, size: next.size ?? size };
    writePref(`gallery:${proto.slug}`, choice);
    navigate(
      galleryHref(proto.slug, {
        ...choice,
        board: next.board ?? board,
        screen: next.screen ?? focus.id,
        selections: next.selections ?? globals,
      }),
      { replace: true },
    );
  };

  const [panelOpen, setPanelOpenState] = useState(() =>
    isPhoneWindow ? false : globalIds.size > 0 && readPref("panel", true),
  );
  const setPanelOpen = (open: boolean) => {
    setPanelOpenState(open);
    if (!isPhoneWindow) writePref("panel", open);
  };

  const view = viewerHref(proto.slug, { selections: globals });
  const selectionsOf = (screen: Screen) => normalize(proto, { ...globals, ...screen.preset });

  // ---- request a change --------------------------------------------------

  // What a request is about: the preview last clicked while the panel was
  // open. Until then, the page in focus at the board's width (Desktop in the
  // widths view). A pick only counts in the view it was made in.
  const [requestOpen, setRequestOpen] = useState(false);
  const [picked, setPicked] = useState<{ board: BoardView; screen: string; width: Width } | null>(null);
  const pick = picked?.board === board ? picked : null;
  const requestScreen = screenById(proto, pick?.screen) ?? focus;
  const requestWidth: Width = pick?.width ?? (board === "widths" ? 1440 : width);
  const requestSelections = selectionsOf(requestScreen);
  const requestPreview = () => frameSrc(proto, requestScreen.path, requestSelections);
  const isPicked = (screen: Screen, w: Width) => requestOpen && screen.id === requestScreen.id && w === requestWidth;

  useShortcuts({
    g: () => navigate(view),
    ...(hasGlobals && { s: () => setPanelOpen(!panelOpen) }),
    c: () => setRequestOpen(!requestOpen),
    Escape: () => {
      if (requestOpen) setRequestOpen(false);
      else if (isPhoneWindow) setPanelOpen(false);
    },
  });

  // Sections in order of first appearance; unsectioned screens get no heading.
  const groups: { section?: string; screens: Screen[] }[] = [];
  for (const screen of proto.screens) {
    let group = groups.find((g) => g.section === screen.section);
    if (!group) groups.push((group = { section: screen.section, screens: [] }));
    group.screens.push(screen);
  }

  // A size that's wider than the window (L desktop on a laptop with the
  // panel open, anything on a phone) clamps to the column instead.
  const [mainRef, { width: mainWidth }] = useElementSize<HTMLDivElement>();
  const cardWidth = Math.max(120, Math.min(CARD_WIDTHS[width][size], mainWidth || Infinity));

  // The widths view shares one scale across all three when they fit in a
  // row, so their relative sizes are honest; stacked, each fits the column.
  const total = WIDTHS.reduce((sum, w) => sum + w, 0);
  const rowScale = mainWidth >= ROW_MIN ? Math.min(1, (mainWidth - ROW_GAP * (WIDTHS.length - 1)) / total) : 0;
  const widthsCardWidth = (w: Width) => Math.floor(rowScale ? w * rowScale : Math.min(w, mainWidth || w));

  const card = (screen: Screen, w: Width, renderWidth: number, showDetails: boolean) => {
    const selections = selectionsOf(screen);
    const viewport = WIDTH_VIEWPORTS[w];
    const href = viewerHref(proto.slug, { mode: WIDTH_MODE[w], screen: screen.id, selections });
    const path = displayPath(proto, screen.path);
    const open = (e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      navigate(href);
    };
    const openOrPick = (e: React.MouseEvent) => {
      if (!requestOpen) return open(e);
      e.preventDefault();
      setPicked({ board, screen: screen.id, width: w });
    };
    return (
      <li
        key={`${screen.id}:${w}`}
        className={`pv-shot pv-shot--w${w}${isPicked(screen, w) ? " is-picked" : ""}`}
        style={{ width: renderWidth }}
      >
        {/* The link is a sibling overlay rather than a wrapper, so the
            frame's Retry button isn't nested inside a link. */}
        <div className="pv-shot__frame">
          <LiveFrame
            src={frameSrc(proto, screen.path, selections)}
            viewport={viewport}
            width={renderWidth}
            title={screen.title}
            cover={screen.cover}
          />
          <a
            href={href}
            className="pv-shot__hit"
            onClick={openOrPick}
            aria-label={requestOpen ? `Request a change to ${screen.title} at ${w}px` : `Open ${screen.title} at ${w}px in the viewer`}
          />
        </div>
        <p className="pv-shot__scale">{scaleLabel(w, renderWidth / viewport.width)}</p>
        {showDetails && (
          <>
            <a href={href} className="pv-shot__title" onClick={open}>
              {screen.title}
            </a>
            {Object.keys(selections).length > 0 && (
              <div className="pv-chips">
                {selectionLabels(proto, selections).map((c) => (
                  <span key={c.group} className="pv-chip" title={c.group}>
                    {c.option}
                  </span>
                ))}
              </div>
            )}
            <code className="pv-shot__path" title={path}>
              {path}
            </code>
          </>
        )}
      </li>
    );
  };

  const statesPanel = (variant: "docked" | "sheet") => (
    <ControlsPanel
      variant={variant}
      open={panelOpen}
      onOpenChange={setPanelOpen}
      sections={[{ groups: proto.states ?? [], actions: [] }]}
      selections={globals}
      onSelect={(g, o) => update({ selections: normalize(proto, { ...globals, [g]: o }) })}
      onResetStates={() => update({ selections: {} })}
      emptyNote="No prototype-wide states to apply across screens."
    />
  );

  const requestPanel = requestOpen && (
    <RequestPanel
      proto={proto}
      variant={isPhoneWindow ? "sheet" : "docked"}
      context={{
        screen: requestScreen,
        width: requestWidth,
        selections: requestSelections,
        previewUrl: requestPreview(),
        hint: "Click a preview to pick the page and width.",
      }}
      onClose={() => setRequestOpen(false)}
    />
  );

  return (
    <div className="pv-viewer">
      <TopBar
        proto={proto}
        view="gallery"
        viewHref={view}
        galleryHref={galleryHref(proto.slug, { selections: globals })}
        panelOpen={panelOpen}
        onTogglePanel={hasGlobals ? () => setPanelOpen(!panelOpen) : undefined}
        previewUrl={requestPreview}
        requestOpen={requestOpen}
        onToggleRequest={() => setRequestOpen(!requestOpen)}
      />
      <div className="pv-workspace">
        {hasGlobals && !isPhoneWindow && statesPanel("docked")}
        <main className={`pv-gallery${requestOpen ? " is-picking" : ""}`}>
          <div ref={mainRef} className="pv-gallery__measure" />
          <div className="pv-gallery__head">
            <p className="pv-gallery__count">
              {board === "widths" ? focus.title : `${proto.screens.length} ${proto.screens.length === 1 ? "page" : "pages"}`}
            </p>
            <Segmented
              label="Board"
              value={board}
              onChange={(b) => update({ board: b })}
              options={[
                { value: "pages", label: "All pages", title: "Every page at one width" },
                { value: "widths", label: "One page", title: "One page at all three widths" },
              ]}
            />
            {board === "pages" ? (
              <>
                <Segmented
                  label="Width"
                  value={String(width)}
                  onChange={(w) => update({ width: parseWidth(w) })}
                  options={WIDTHS.map((w) => ({ value: String(w), label: `${WIDTH_NAMES[w]} ${w}` }))}
                />
                <Segmented
                  label="Size"
                  value={size}
                  onChange={(s) => update({ size: s })}
                  options={[
                    { value: "s", label: "S", title: "Small" },
                    { value: "m", label: "M", title: "Medium" },
                    { value: "l", label: "L", title: "Large" },
                  ]}
                />
              </>
            ) : (
              <select className="pv-select" aria-label="Page" value={focus.id} onChange={(e) => update({ screen: e.target.value })}>
                {groups.map((group, i) =>
                  group.section ? (
                    <optgroup key={group.section} label={group.section}>
                      {group.screens.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </optgroup>
                  ) : (
                    group.screens.map((s) => (
                      <option key={`${i}:${s.id}`} value={s.id}>
                        {s.title}
                      </option>
                    ))
                  ),
                )}
              </select>
            )}
          </div>

          {board === "pages" ? (
            groups.map((group, i) => (
              <section key={group.section ?? `_${i}`} className="pv-gallery__section">
                {group.section && <h2 className="pv-gallery__heading">{group.section}</h2>}
                <ul className="pv-gallery__grid">{group.screens.map((screen) => card(screen, width, cardWidth, true))}</ul>
              </section>
            ))
          ) : (
            <section className="pv-gallery__section">
              <p className="pv-gallery__heading">
                {focus.section ? `${focus.section} · ` : ""}
                <code>{displayPath(proto, focus.path)}</code>
              </p>
              <ul className="pv-gallery__grid pv-gallery__grid--widths">
                {WIDTHS.map((w) => card(focus, w, widthsCardWidth(w), false))}
              </ul>
            </section>
          )}
        </main>
        {!isPhoneWindow && requestPanel}
      </div>
      {hasGlobals && isPhoneWindow && statesPanel("sheet")}
      {isPhoneWindow && requestPanel}
    </div>
  );
}
