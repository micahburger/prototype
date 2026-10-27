import { useState } from "react";
import type { Device, Prototype, Screen, Selections } from "../types";
import {
  VIEWPORTS,
  deviceOf,
  displayPath,
  frameSrc,
  galleryHref,
  normalize,
  readSelections,
  selectionLabels,
  viewerHref,
  type Size,
} from "../lib/protos";
import { navigate, useLocation } from "../lib/router";
import { PHONE_QUERY, useElementSize, useMediaQuery, useShortcuts } from "../lib/hooks";
import { readPref, writePref } from "../lib/prefs";
import { Segmented } from "./Bits";
import { ControlsPanel } from "./ControlsPanel";
import { LiveFrame } from "./LiveFrame";
import { TopBar } from "./TopBar";

const CARD_WIDTHS: Record<Device, Record<Size, number>> = {
  phone: { s: 180, m: 260, l: 340 },
  desktop: { s: 320, m: 480, l: 720 },
};

/*
 * Every screen entry is one card, rendered with prototype-wide selections
 * from the URL underneath and the card's own preset on top — so switching
 * Viewer to "Landlord" shows every screen as the landlord, while "Decision,
 * approved" stays approved.
 */
export function Gallery({ proto }: { proto: Prototype }) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const isPhoneWindow = useMediaQuery(PHONE_QUERY);

  // URL first (a shared link), then the last choice for this prototype.
  const saved = readPref<{ device?: Device; size?: Size }>(`gallery:${proto.slug}`, {});
  const deviceParam = params.get("device");
  const sizeParam = params.get("size");
  const device: Device = deviceParam === "phone" || deviceParam === "desktop" ? deviceParam : saved.device ?? deviceOf(proto);
  const size: Size = sizeParam === "s" || sizeParam === "m" || sizeParam === "l" ? sizeParam : saved.size ?? "m";

  const globalIds = new Set((proto.states ?? []).map((g) => g.id));
  // Only prototype-wide groups apply across cards, so with none there's
  // nothing for a panel here to do (same rule as the viewer).
  const hasGlobals = globalIds.size > 0;
  const globals = Object.fromEntries(
    Object.entries(normalize(proto, readSelections(params))).filter(([g]) => globalIds.has(g)),
  );

  const update = (next: { device?: Device; size?: Size; selections?: Selections }) => {
    const choice = { device: next.device ?? device, size: next.size ?? size };
    writePref(`gallery:${proto.slug}`, choice);
    navigate(galleryHref(proto.slug, { ...choice, selections: next.selections ?? globals }), { replace: true });
  };

  const [panelOpen, setPanelOpenState] = useState(() =>
    isPhoneWindow ? false : globalIds.size > 0 && readPref("panel", true),
  );
  const setPanelOpen = (open: boolean) => {
    setPanelOpenState(open);
    if (!isPhoneWindow) writePref("panel", open);
  };

  const view = viewerHref(proto.slug, { selections: globals });
  useShortcuts({
    g: () => navigate(view),
    ...(hasGlobals && { s: () => setPanelOpen(!panelOpen) }),
    Escape: () => isPhoneWindow && setPanelOpen(false),
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
  const viewport = VIEWPORTS[device];
  const cardWidth = Math.max(120, Math.min(CARD_WIDTHS[device][size], mainWidth || Infinity));

  return (
    <div className="pv-viewer">
      <TopBar
        proto={proto}
        view="gallery"
        viewHref={view}
        galleryHref={galleryHref(proto.slug, { selections: globals })}
        panelOpen={panelOpen}
        onTogglePanel={hasGlobals ? () => setPanelOpen(!panelOpen) : undefined}
      />
      <div className="pv-workspace">
        {hasGlobals && !isPhoneWindow && (
          <ControlsPanel
            variant="docked"
            open={panelOpen}
            onOpenChange={setPanelOpen}
            sections={[{ groups: proto.states ?? [], actions: [] }]}
            selections={globals}
            onSelect={(g, o) => update({ selections: normalize(proto, { ...globals, [g]: o }) })}
            onResetStates={() => update({ selections: {} })}
            emptyNote="No prototype-wide states to apply across screens."
          />
        )}
        <main className="pv-gallery">
          <div ref={mainRef} className="pv-gallery__measure" />
          <div className="pv-gallery__head">
            <p className="pv-gallery__count">
              {proto.screens.length} {proto.screens.length === 1 ? "screen" : "screens"}
            </p>
            <Segmented
              label="Device"
              value={device}
              onChange={(d) => update({ device: d })}
              options={[
                { value: "phone", label: "Phone" },
                { value: "desktop", label: "Desktop" },
              ]}
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
          </div>

          {groups.map((group, i) => (
            <section key={group.section ?? `_${i}`} className="pv-gallery__section">
              {group.section && <h2 className="pv-gallery__heading">{group.section}</h2>}
              <ul className="pv-gallery__grid" style={{ "--card-w": `${cardWidth}px` } as React.CSSProperties}>
                {group.screens.map((screen) => {
                  const selections = normalize(proto, { ...globals, ...screen.preset });
                  const href = viewerHref(proto.slug, {
                    mode: device === "phone" ? "phone" : "full",
                    screen: screen.id,
                    selections,
                  });
                  const path = displayPath(proto, screen.path);
                  return (
                    <li key={screen.id} className={`pv-shot pv-shot--${device}`} style={{ width: cardWidth }}>
                      <a
                        href={href}
                        className="pv-shot__link"
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                          e.preventDefault();
                          navigate(href);
                        }}
                      >
                        <LiveFrame
                          src={frameSrc(proto, screen.path, selections)}
                          viewport={viewport}
                          width={cardWidth}
                          title={screen.title}
                        />
                        <span className="pv-shot__title">{screen.title}</span>
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
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </main>
      </div>
      {hasGlobals && isPhoneWindow && (
        <ControlsPanel
          variant="sheet"
          open={panelOpen}
          onOpenChange={setPanelOpen}
          sections={[{ groups: proto.states ?? [], actions: [] }]}
          selections={globals}
          onSelect={(g, o) => update({ selections: normalize(proto, { ...globals, [g]: o }) })}
          onResetStates={() => update({ selections: {} })}
          emptyNote="No prototype-wide states to apply across screens."
        />
      )}
    </div>
  );
}
