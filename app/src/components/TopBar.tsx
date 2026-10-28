import type { Prototype } from "../types";
import type { ViewerMode } from "../lib/protos";
import { linkHandler, navigate } from "../lib/router";
import { Segmented, StatusTag, Updated } from "./Bits";
import { ArrowLeft, Pencil, ResetIcon, Sliders } from "./Icons";
import { ProjectShortcuts } from "./ProjectShortcuts";

interface TopBarProps {
  proto: Prototype;
  view: "view" | "gallery";
  viewHref: string;
  galleryHref: string;
  /** Viewer only: the Mobile | Tablet | Desktop | Full screen toggle. */
  mode?: { value: ViewerMode; onChange: (mode: ViewerMode) => void };
  panelOpen: boolean;
  /** Omitted when there's nothing to control: no States button at all. */
  onTogglePanel?: () => void;
  onReset?: () => void;
  resetTitle?: string;
  /** The page and state on show, as a standalone URL (Open preview). */
  previewUrl: () => string;
  requestOpen: boolean;
  onToggleRequest: () => void;
}

export function TopBar({
  proto,
  view,
  viewHref,
  galleryHref,
  mode,
  panelOpen,
  onTogglePanel,
  onReset,
  resetTitle,
  previewUrl,
  requestOpen,
  onToggleRequest,
}: TopBarProps) {
  return (
    <header className="pv-topbar">
      <a href="/prototypes" className="pv-back" onClick={linkHandler("/prototypes")}>
        <ArrowLeft />
        <span>All prototypes</span>
      </a>

      <div className="pv-topbar__title">
        <h1>{proto.title}</h1>
        <StatusTag status={proto.status} />
        <Updated iso={proto.updated} />
        <ProjectShortcuts proto={proto} previewUrl={previewUrl} />
      </div>

      <div className="pv-topbar__controls">
        <Segmented
          label="View"
          value={view}
          onChange={(v) => navigate(v === "view" ? viewHref : galleryHref)}
          options={[
            { value: "view", label: "View", title: "View (G)" },
            { value: "gallery", label: `Review (${proto.screens.length})`, title: "Review board (G)" },
          ]}
        />
        {mode && (
          <Segmented
            label="Mode"
            value={mode.value}
            onChange={mode.onChange}
            options={[
              { value: "phone", label: "Mobile", title: "Mobile, 390px" },
              { value: "tablet", label: "Tablet", title: "Tablet, 768px" },
              { value: "desktop", label: "Desktop", title: "Desktop, 1440px" },
              { value: "full", label: "Full screen", title: "Full screen (F)" },
            ]}
          />
        )}
        {onTogglePanel && (
          <button
            type="button"
            className="pv-btn"
            aria-pressed={panelOpen}
            onClick={onTogglePanel}
            title="Controls (S)"
          >
            <Sliders />
            States
          </button>
        )}
        {onReset && (
          <button type="button" className="pv-btn" onClick={onReset} title={resetTitle}>
            <ResetIcon />
            Reset
          </button>
        )}
        <button type="button" className="pv-btn" aria-pressed={requestOpen} onClick={onToggleRequest} title="Request a change (C)">
          <Pencil />
          Request
        </button>
      </div>
    </header>
  );
}
