import { useEffect, useRef, useState } from "react";
import type { Prototype, Screen, Selections } from "../types";
import { copyText } from "../lib/clipboard";
import { groupOf } from "../lib/protos";
import { useLocalProject } from "../lib/local";
import { buildRequest, scopedScreens, type AppliesTo, type Scope } from "../lib/request";
import { Segmented } from "./Bits";
import { Close } from "./Icons";

/*
 * Request a change: a note about what's on screen, turned into a prompt to
 * paste into Claude Code. The page, width and state come from whatever the
 * viewer or review board is showing; scope and width-applicability are the
 * two decisions that matter most to *where* the change gets made, so they're
 * asked first.
 *
 * The prompt preview is editable. Once edited by hand it stops following the
 * fields — rebuilding would throw the edit away — until "Rebuild from fields".
 *
 * Variants follow the controls panel: docked beside the stage (here on the
 * right, so both panels can be open), a drawer over full screen, a sheet on
 * a phone-sized window.
 */

export interface RequestContext {
  screen: Screen;
  width: number;
  widthNote?: string;
  selections: Selections;
  previewUrl: string;
  /** How to change what the request is about, where that isn't obvious. */
  hint?: string;
}

interface RequestPanelProps {
  proto: Prototype;
  variant: "docked" | "drawer" | "sheet";
  context: RequestContext;
  onClose: () => void;
}

export function RequestPanel({ proto, variant, context, onClose }: RequestPanelProps) {
  const local = useLocalProject(proto.slug);
  const hasGroup = !!groupOf(context.screen);
  const [scope, setScope] = useState<Scope>("page");
  const [appliesTo, setAppliesTo] = useState<AppliesTo>("all");
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // A page with no group can't be scoped to one; fall back rather than
  // generate a prompt about "group undefined".
  const effectiveScope: Scope = scope === "group" && !hasGroup ? "page" : scope;

  const generated = buildRequest({
    proto,
    sourcePath: local?.path,
    scope: effectiveScope,
    appliesTo,
    note,
    screen: context.screen,
    width: context.width,
    widthNote: context.widthNote,
    selections: context.selections,
    previewUrl: context.previewUrl,
  });
  const prompt = draft ?? generated;

  useEffect(() => setCopyState("idle"), [prompt]);

  const copy = async () => {
    if (await copyText(prompt)) {
      setCopyState("copied");
      return;
    }
    // Leave it ready for ⌘C instead.
    setCopyState("failed");
    promptRef.current?.focus();
    promptRef.current?.select();
  };

  const covered = scopedScreens(proto, effectiveScope, context.screen).length;

  const body = (
    <aside className={`pv-panel pv-panel--${variant} pv-request`} aria-label="Request a change" onClick={(e) => e.stopPropagation()}>
      <div className="pv-panel__head">
        <h2 className="pv-panel__title">Request a change</h2>
        <button type="button" className="pv-iconbtn" onClick={onClose} aria-label="Close" title="Close (C)">
          <Close />
        </button>
      </div>

      <div className="pv-panel__body pv-request__body">
        <p className="pv-request__context">
          <strong>{context.screen.title}</strong>
          {hasGroup && groupOf(context.screen) !== context.screen.title && <span> · {groupOf(context.screen)}</span>}
          <span>
            {" "}
            · {context.width}px{context.widthNote ? ` (${context.widthNote})` : ""}
          </span>
        </p>
        {context.hint && <p className="pv-request__hint">{context.hint}</p>}

        <div className="pv-group">
          <div className="pv-group__label">Scope</div>
          <Segmented
            label="Scope"
            value={effectiveScope}
            onChange={setScope}
            options={[
              { value: "site", label: "Whole site" },
              ...(hasGroup ? [{ value: "group" as const, label: "This group" }] : []),
              { value: "page", label: "This page" },
            ]}
          />
          <p className="pv-request__hint">
            {covered} {covered === 1 ? "page" : "pages"}
            {!hasGroup && " · this page has no group"}
          </p>
        </div>

        <div className="pv-group">
          <div className="pv-group__label">Applies to</div>
          <Segmented
            label="Applies to"
            value={appliesTo}
            onChange={setAppliesTo}
            options={[
              { value: "all", label: "All widths" },
              { value: "this", label: `This width (${context.width}px)` },
            ]}
          />
        </div>

        <label className="pv-group pv-request__field">
          <span className="pv-group__label">Note</span>
          <textarea
            className="pv-input"
            rows={4}
            value={note}
            placeholder="What should change?"
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <label className="pv-group pv-request__field">
          <span className="pv-group__label">
            Prompt
            {draft !== null && (
              <button type="button" className="pv-textbtn pv-request__rebuild" onClick={() => setDraft(null)}>
                Edited · rebuild from fields
              </button>
            )}
          </span>
          <textarea
            ref={promptRef}
            className="pv-input pv-input--mono"
            rows={14}
            value={prompt}
            spellCheck={false}
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
      </div>

      <div className="pv-request__foot">
        <p className="pv-request__status" role="status">
          {copyState === "copied" && "Copied — paste it into Claude Code."}
          {copyState === "failed" && "Couldn't copy automatically. The prompt is selected — press ⌘C."}
        </p>
        <button type="button" className="pv-btn pv-btn--solid" onClick={copy}>
          {copyState === "copied" ? "Copied" : "Copy prompt"}
        </button>
      </div>
    </aside>
  );

  if (variant === "docked") return body;
  return (
    <div className={`pv-scrim pv-scrim--${variant}`} onClick={onClose}>
      {body}
    </div>
  );
}
