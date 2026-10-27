import type { Action, Selections, StateGroup } from "../types";
import { defaultOf } from "../lib/protos";
import { Chevron, Close } from "./Icons";

/*
 * The controls panel has three bodies and one set of contents:
 *   docked  — a 280px left sidebar beside the phone frame, collapsible to a rail
 *   drawer  — the same, laid over a full-screen prototype
 *   sheet   — a bottom sheet on phone-sized windows
 * Which one is chosen by the page; this only renders it.
 */

interface Section {
  title?: string;
  groups: StateGroup[];
  actions: Action[];
}

interface ControlsPanelProps {
  variant: "docked" | "drawer" | "sheet";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: Section[];
  selections: Selections;
  onSelect: (groupId: string, optionId: string) => void;
  onAction?: (action: Action) => void;
  onResetStates: () => void;
  emptyNote: string;
}

export function ControlsPanel({
  variant,
  open,
  onOpenChange,
  sections,
  selections,
  onSelect,
  onAction,
  onResetStates,
  emptyNote,
}: ControlsPanelProps) {
  const visible = sections.filter((s) => s.groups.length || s.actions.length);
  const isEmpty = visible.length === 0;

  if (variant === "docked" && !open) {
    return (
      <aside className="pv-panel pv-panel--rail">
        <button type="button" className="pv-iconbtn" onClick={() => onOpenChange(true)} aria-label="Show controls" title="Show controls (S)">
          <Chevron dir="right" />
        </button>
      </aside>
    );
  }
  if (variant !== "docked" && !open) return null;

  const body = (
    <aside
      className={`pv-panel pv-panel--${variant}`}
      aria-label="Controls"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="pv-panel__head">
        <h2 className="pv-panel__title">Controls</h2>
        {!isEmpty && (
          <button type="button" className="pv-textbtn" onClick={onResetStates}>
            Reset states
          </button>
        )}
        <button
          type="button"
          className="pv-iconbtn"
          onClick={() => onOpenChange(false)}
          aria-label="Hide controls"
          title="Hide controls (S)"
        >
          {variant === "docked" ? <Chevron /> : variant === "sheet" ? <Chevron dir="down" /> : <Close />}
        </button>
      </div>

      <div className="pv-panel__body">
        {isEmpty && <p className="pv-panel__note">{emptyNote}</p>}
        {visible.map((section, i) => (
          <section key={i} className="pv-panel__section">
            {section.title && <h3 className="pv-panel__subtitle">{section.title}</h3>}
            {section.groups.map((group) => {
              const selected = selections[group.id] ?? defaultOf(group);
              return (
                <div key={group.id} className="pv-group" role="radiogroup" aria-label={group.label}>
                  <div className="pv-group__label">{group.label}</div>
                  {group.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={option.id === selected}
                      className="pv-option"
                      onClick={() => onSelect(group.id, option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              );
            })}
            {section.actions.length > 0 && onAction && (
              <div className="pv-actions">
                {section.actions.map((action) => (
                  <button key={action.id} type="button" className="pv-btn pv-btn--outline" onClick={() => onAction(action)}>
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </aside>
  );

  if (variant === "docked") return body;
  return (
    <div className={`pv-scrim pv-scrim--${variant}`} onClick={() => onOpenChange(false)}>
      {body}
    </div>
  );
}
