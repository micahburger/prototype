import manifest from "../prototypes.config";
import type { Device, Prototype, Screen, Selections, StateGroup } from "../types";

export const VIEWPORTS: Record<Device, { width: number; height: number }> = {
  phone: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 },
};

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

export type ViewerMode = "phone" | "full";
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

export function galleryHref(
  slug: string,
  opts: { device?: Device; size?: Size; selections?: Selections } = {},
) {
  const params = new URLSearchParams();
  if (opts.device) params.set("device", opts.device);
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
