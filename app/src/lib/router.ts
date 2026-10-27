import { useEffect, useState } from "react";

// A router in twenty lines: the tool has three page shapes and no nesting,
// so history.pushState plus a popstate listener is all it needs. Production
// serves every path the SPA shell via public/.htaccess.

export type Route =
  | { page: "landing" }
  | { page: "viewer"; slug: string }
  | { page: "gallery"; slug: string };

export function parseRoute(pathname: string): Route {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "prototypes" || parts.length === 1) return { page: "landing" };
  if (parts[2] === "gallery") return { page: "gallery", slug: decodeURIComponent(parts[1]) };
  return { page: "viewer", slug: decodeURIComponent(parts[1]) };
}

const listeners = new Set<() => void>();

export function navigate(to: string, { replace = false } = {}) {
  if (to === location.pathname + location.search) return;
  history[replace ? "replaceState" : "pushState"](null, "", to);
  listeners.forEach((l) => l());
}

/** Re-renders on navigate() and back/forward; returns the current location. */
export function useLocation() {
  const [, force] = useState(0);
  useEffect(() => {
    const update = () => force((n) => n + 1);
    listeners.add(update);
    window.addEventListener("popstate", update);
    return () => {
      listeners.delete(update);
      window.removeEventListener("popstate", update);
    };
  }, []);
  return { pathname: location.pathname, search: location.search };
}

/** For <a href> that should route client-side but still open in a new tab. */
export function linkHandler(to: string) {
  return (event: React.MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  };
}
