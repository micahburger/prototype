import manifest from "../prototypes.config";
import type { Device, Prototype, Screen, Selections, StateGroup } from "../types";

export const VIEWPORTS: Record<Device, { width: number; height: number }> = {
  phone: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 },
};

/**
 * The three widths every page is reviewed at. Each one is a real viewport:
 * a frame is laid out at this size and then scaled, never squeezed, so the
 * prototype runs the breakpoint it would on that device.
 */
export const WIDTHS = [390, 768, 1440] as const;
export type Width = (typeof WIDTHS)[number];

export const WIDTH_VIEWPORTS: Record<Width, { width: number; height: number }> = {
  390: VIEWPORTS.phone,
  768: { width: 768, height: 1024 },
  1440: VIEWPORTS.desktop,
};

export const WIDTH_NAMES: Record<Width, string> = { 390: "Mobile", 768: "Tablet", 1440: "Desktop" };

export function parseWidth(value: string | null | undefined): Width | undefined {
  const n = Number(value);
  return (WIDTHS as readonly number[]).includes(n) ? (n as Width) : undefined;
}

export const widthOfDevice = (device: Device): Width => (device === "phone" ? 390 : 1440);

/** "1440px · shown at 25%" — every scaled preview says what it really is. */
export function scaleLabel(width: number, scale: number) {
  return `${width}px · shown at ${Math.round(scale * 100)}%`;
}

const PARAM = "state.";

export const prototypes = [...manifest].sort(
  (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime(),
);

export function getPrototype(slug: string) {
  return prototypes.find((p) => p.slug === slug);
}

export const deviceOf = (proto: Prototype): Device => proto.device ?? "phone";

/** Every group the prototype declares, prototype-wide first, by id. */
export function allGroups(proto: Prototype): Map<string, StateGroup> {
  const groups = new Map<string, StateGroup>();
  for (const g of proto.states ?? []) groups.set(g.id, g);
  for (const s of proto.screens) for (const g of s.states ?? []) if (!groups.has(g.id)) groups.set(g.id, g);
  return groups;
}

export const defaultOf = (group: StateGroup) => group.options[0]?.id;

/**
 * Selections are always stored sparse: only groups set away from their
 * default, and only ids the manifest still knows. That keeps every URL built
 * from them clean, and a stale bookmark can't push an unknown option into a
 * prototype.
 */
export function normalize(proto: Prototype, selections: Selections): Selections {
  const groups = allGroups(proto);
  const out: Selections = {};
  for (const [groupId, optionId] of Object.entries(selections)) {
    const group = groups.get(groupId);
    if (!group || optionId === defaultOf(group)) continue;
    if (group.options.some((o) => o.id === optionId)) out[groupId] = optionId;
  }
  return out;
}

export function readSelections(search: string | URLSearchParams): Selections {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const out: Selections = {};
  params.forEach((value, key) => {
    if (key.startsWith(PARAM)) out[key.slice(PARAM.length)] = value;
  });
  return out;
}

export function writeSelections(params: URLSearchParams, selections: Selections) {
  for (const key of [...params.keys()]) if (key.startsWith(PARAM)) params.delete(key);
  for (const [g, o] of Object.entries(selections)) params.set(PARAM + g, o);
}

/** Every group with a value, defaults filled in — what a live prototype gets. */
export function fullState(proto: Prototype, selections: Selections): Selections {
  const out: Selections = {};
  for (const [id, group] of allGroups(proto)) out[id] = selections[id] ?? defaultOf(group);
  return out;
}

export function entryUrl(proto: Prototype) {
  return new URL(proto.entry, location.origin);
}

export function resolveUrl(proto: Prototype, path: string) {
  return new URL(path, entryUrl(proto));
}

export function isSameOrigin(proto: Prototype) {
  return entryUrl(proto).origin === location.origin;
}

/** The iframe src: the screen's URL with non-default selections as params. */
export function frameSrc(proto: Prototype, path: string, selections: Selections) {
  const url = resolveUrl(proto, path);
  writeSelections(url.searchParams, normalize(proto, selections));
  return url.toString();
}

/** A frame-reported path, relative to the entry origin when it's on it. */
export function displayPath(proto: Prototype, path: string) {
  const url = resolveUrl(proto, path);
  const entry = entryUrl(proto);
  writeSelections(url.searchParams, {});
  const local = url.pathname + url.search + url.hash;
  return url.origin === entry.origin ? local : url.toString();
}

const trimSlash = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);

/**
 * Which manifest screen a frame path belongs to. Matches on pathname, and on
 * the hash too when the screen's own path carries one (hash-routed SPAs).
 * The same path can appear several times with different presets; `hint`
 * (the screen already showing, or the one asked for) wins among those, then
 * the entry without a preset, then manifest order.
 */
export function matchScreen(proto: Prototype, path: string, hint?: string): Screen | undefined {
  let target: URL;
  try {
    target = resolveUrl(proto, path);
  } catch {
    return undefined;
  }
  const matches = proto.screens.filter((screen) => {
    const url = resolveUrl(proto, screen.path);
    if (url.origin !== target.origin || trimSlash(url.pathname) !== trimSlash(target.pathname)) return false;
    return !url.hash || url.hash === target.hash;
  });
  // Prefer the most specific path: a "#decision" screen over a bare one.
  matches.sort((a, b) => Number(resolveUrl(proto, b.path).hash !== "") - Number(resolveUrl(proto, a.path).hash !== ""));
  return (
    matches.find((s) => s.id === hint) ??
    matches.find((s) => !s.preset) ??
    matches[0]
  );
}

export function screenById(proto: Prototype, id: string | null | undefined) {
  return id ? proto.screens.find((s) => s.id === id) : undefined;
}

/**
 * The viewer's frame modes. phone / tablet / desktop lay the frame out at
 * 390 / 768 / 1440 and scale it to fit; full hands it the whole window.
 * "phone" and "full" predate the other two and old links still use them.
 */
export type ViewerMode = "phone" | "tablet" | "desktop" | "full";
export const FRAME_MODES = ["phone", "tablet", "desktop"] as const;
export type FrameMode = (typeof FRAME_MODES)[number];

export const MODE_WIDTH: Record<FrameMode, Width> = { phone: 390, tablet: 768, desktop: 1440 };
export const WIDTH_MODE: Record<Width, FrameMode> = { 390: "phone", 768: "tablet", 1440: "desktop" };

export function parseMode(value: string | null): ViewerMode | undefined {
  return value === "full" || (FRAME_MODES as readonly string[]).includes(value ?? "") ? (value as ViewerMode) : undefined;
}

/** The framed mode a prototype opens at, and returns to from full screen. */
export const homeMode = (proto: Prototype): FrameMode => (deviceOf(proto) === "phone" ? "phone" : "desktop");
export type Size = "s" | "m" | "l";

export function viewerHref(
  slug: string,
  opts: { mode?: ViewerMode; screen?: string; selections?: Selections } = {},
) {
  const params = new URLSearchParams();
  if (opts.mode) params.set("mode", opts.mode);
  if (opts.screen) params.set("screen", opts.screen);
  writeSelections(params, opts.selections ?? {});
  const qs = params.toString();
  return `/prototypes/${encodeURIComponent(slug)}${qs ? `?${qs}` : ""}`;
}

export type BoardView = "pages" | "widths";

/**
 * The review board. `device=phone|desktop` from before it had three widths
 * is still read (as 390 / 1440) but never written.
 */
export function galleryHref(
  slug: string,
  opts: { board?: BoardView; screen?: string; width?: Width; size?: Size; selections?: Selections } = {},
) {
  const params = new URLSearchParams();
  if (opts.board === "widths") params.set("board", "widths");
  if (opts.board === "widths" && opts.screen) params.set("screen", opts.screen);
  if (opts.width && opts.board !== "widths") params.set("width", String(opts.width));
  if (opts.size) params.set("size", opts.size);
  writeSelections(params, opts.selections ?? {});
  const qs = params.toString();
  return `/prototypes/${encodeURIComponent(slug)}/gallery${qs ? `?${qs}` : ""}`;
}

export function selectionLabels(proto: Prototype, selections: Selections) {
  const groups = allGroups(proto);
  return Object.entries(normalize(proto, selections)).map(([g, o]) => {
    const group = groups.get(g)!;
    return { group: group.label, option: group.options.find((x) => x.id === o)!.label };
  });
}

/** A page's group, as a change request names it. */
export const groupOf = (screen: Screen) => screen.section;

/**
 * The distinct routes a set of pages covers. Several registry entries can
 * share a route with different presets ("Decision", "Decision, approved"),
 * and a change request should name the route once.
 */
export function routesOf(proto: Prototype, screens: Screen[]) {
  return [...new Set(screens.map((s) => displayPath(proto, s.path)))];
}
