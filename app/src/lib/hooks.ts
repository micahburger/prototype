import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** Content-box size of an element, kept current with a ResizeObserver. */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);
  return matches;
}

/** Phone-sized window: the viewer opens full screen, the panel is a sheet. */
export const PHONE_QUERY = "(max-width: 640px)";

/**
 * Single-key shortcuts, skipped while typing in a field. The prototype's
 * iframe swallows keys while it has focus — a cross-origin frame can't be
 * listened to — so these work once focus is back on the tool's chrome.
 */
export function useShortcuts(map: Record<string, () => void>) {
  const latest = useRef(map);
  latest.current = map;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      const key = event.key === "Escape" ? "Escape" : event.key.toLowerCase();
      const run = latest.current[key];
      if (run) {
        event.preventDefault();
        run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
