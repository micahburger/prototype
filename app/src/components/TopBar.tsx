import type { Prototype } from "../types";
import { linkHandler, navigate } from "../lib/router";
import { Segmented, StatusTag, Updated } from "./Bits";
import { ArrowLeft, ResetIcon, Sliders } from "./Icons";

interface TopBarProps {
  proto: Prototype;
  view: "view" | "gallery";
  viewHref: string;
  galleryHref: string;
  /** Viewer only: the Phone | Full screen toggle. */
  mode?: { value: "phone" | "full"; onChange: (mode: "phone" | "full") => void };
  panelOpen: boolean;
  onTogglePanel: () => void;
  onReset?: () => void;
  resetTitle?: string;
}

export function TopBar({ proto, view, viewHref, galleryHref, mode, panelOpen, onTogglePanel, onReset, resetTitle }: TopBarProps) {
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
      </div>

      <div className="pv-topbar__controls">
        <Segmented
          label="View"
          value={view}
          onChange={(v) => navigate(v === "view" ? viewHref : galleryHref)}
          options={[
            { value: "view", label: "View", title: "View (G)" },
            { value: "gallery", label: `Gallery (${proto.screens.length})`, title: "Gallery (G)" },
          ]}
        />
        {mode && (
          <Segmented
            label="Mode"
            value={mode.value}
            onChange={mode.onChange}
            options={[
              { value: "phone", label: "Phone", title: "Phone (F)" },
              { value: "full", label: "Full screen", title: "Full screen (F)" },
            ]}
          />
        )}
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
        {onReset && (
          <button type="button" className="pv-btn" onClick={onReset} title={resetTitle}>
            <ResetIcon />
            Reset
          </button>
        )}
      </div>
    </header>
  );
}
