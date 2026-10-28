import type { Prototype, Screen, Selections } from "../types";
import { WIDTHS, groupOf, routesOf, selectionLabels } from "./protos";

/*
 * The text a change request copies: everything a Claude Code session needs
 * to make the change without opening the hub — which project and folder,
 * which routes the scope covers, and exactly what was on screen when it was
 * asked for. Plain text, so it pastes the same into a terminal or a chat.
 */

export type Scope = "site" | "group" | "page";
export type AppliesTo = "all" | "this";

export interface RequestInput {
  proto: Prototype;
  /** Local source folder, when hub.local.json has one. */
  sourcePath?: string;
  scope: Scope;
  appliesTo: AppliesTo;
  screen: Screen;
  /** The width the page was seen at. */
  width: number;
  /** Extra words for the width, e.g. "full screen". */
  widthNote?: string;
  selections: Selections;
  previewUrl: string;
  note: string;
}

/** The pages a scope covers, in registry order. */
export function scopedScreens(proto: Prototype, scope: Scope, screen: Screen): Screen[] {
  if (scope === "page") return [screen];
  if (scope === "group") return proto.screens.filter((s) => groupOf(s) === groupOf(screen));
  return proto.screens;
}

export function buildRequest(input: RequestInput) {
  const { proto, scope, screen, selections } = input;
  const routes = routesOf(proto, scopedScreens(proto, scope, screen));
  const list = routes.map((r) => `  - ${r}`).join("\n");
  const count = `${routes.length} ${routes.length === 1 ? "route" : "routes"}`;

  const scopeLine =
    scope === "page"
      ? `Scope: This page — “${screen.title}” (${routes[0]})`
      : scope === "group"
        ? `Scope: This group — “${groupOf(screen)}”, ${count}:\n${list}`
        : `Scope: Whole site — every registered page, ${count}:\n${list}`;

  const widthText = `${input.width}px${input.widthNote ? ` (${input.widthNote})` : ""}`;
  const appliesLine =
    input.appliesTo === "all"
      ? `Applies to: All widths (${WIDTHS.map((w) => `${w}`).join(", ")})`
      : `Applies to: This width only — ${widthText}`;

  const labels = selectionLabels(proto, selections);
  const state = labels.length ? labels.map((l) => `${l.group}: ${l.option}`).join(", ") : "default";

  const source = input.sourcePath
    ? `Source folder: ${input.sourcePath}`
    : proto.repo
      ? `Source: ${proto.repo} (no local folder set in hub.local.json)`
      : "Source folder: not set (add it to app/hub.local.json in the prototypes hub)";

  return [
    `Change request: ${proto.title} (${proto.slug})`,
    source,
    "",
    scopeLine,
    appliesLine,
    "",
    "Seen at:",
    `  Preview: ${input.previewUrl}`,
    `  Width: ${widthText}`,
    `  State: ${state}`,
    "",
    "Request:",
    input.note.trim() || "(no note yet)",
    "",
    "Make this change at the shared-style, template, or page level that matches this scope.",
    "Then check the affected pages and a couple of unaffected ones at all three widths.",
  ].join("\n");
}
