// The tool's own remembered choices. Every key is "protoviewer:"-prefixed:
// a Reset with no storageKeys clears the whole origin *except* these, and
// the demo prototype shares this origin.

const PREFIX = "protoviewer:";

export function readPref<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writePref(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Private mode or storage off — the choice just won't be remembered.
  }
}

/** Same-origin Reset: remove matching keys, or everything but our own. */
export function clearOriginStorage(prefixes: string[] | undefined) {
  for (const store of [localStorage, sessionStorage]) {
    try {
      const keys = Array.from({ length: store.length }, (_, i) => store.key(i)!);
      for (const key of keys) {
        if (key.startsWith(PREFIX)) continue;
        if (!prefixes?.length || prefixes.some((p) => key.startsWith(p))) store.removeItem(key);
      }
    } catch {
      // Ignore; nothing we can do about blocked storage.
    }
  }
}
