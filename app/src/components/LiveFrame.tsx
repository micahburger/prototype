import { useEffect, useRef, useState } from "react";

/*
 * A non-interactive, scaled-down live preview. The iframe is laid out at the
 * device's real viewport (390×844, 768×1024, 1440×900) and shrunk with a
 * transform, so the prototype sees a real phone-, tablet- or desktop-width
 * window and runs its own responsive layout — shrinking the iframe itself
 * would show a squashed desktop page, or trip the site's mobile breakpoint
 * on a desktop card.
 *
 * Mounting is lazy, and capped. Each card mounts its iframe once it comes
 * within NEAR of the viewport. Past BUDGET mounted frames, any that have
 * drifted further than FAR away get unmounted again, so a 50-screen gallery
 * holds ~30 live documents at most instead of all of them.
 *
 * A frame is never left blank: it shows the cover (or a shimmer) and
 * "Loading…" until it loads, and an error with Retry if it doesn't. Every
 * prototype but the demo is cross-origin, and an iframe reports no errors
 * for those, so failure is inferred two ways: a HEAD probe that rejects on
 * network failure (DNS, offline, refused) or, same-origin only, returns a
 * bad status; and a timeout for a frame that never fires load. A page that
 * loads but refuses framing (X-Frame-Options) still fires load and can't be
 * told apart — it shows the browser's own refusal page.
 */

const NEAR = "400px";
const FAR = 1600;
const BUDGET = 30;
const TIMEOUT_MS = 20000;

const mounted = new Set<{ el: HTMLElement; unmount: () => void }>();

function evictFarthest() {
  if (mounted.size <= BUDGET) return;
  const vh = window.innerHeight;
  const far = [...mounted]
    .map((m) => {
      const r = m.el.getBoundingClientRect();
      const distance = r.bottom < 0 ? -r.bottom : r.top > vh ? r.top - vh : 0;
      return { m, distance };
    })
    .filter((x) => x.distance > FAR)
    .sort((a, b) => b.distance - a.distance);
  for (const { m } of far.slice(0, mounted.size - BUDGET)) m.unmount();
}

interface LiveFrameProps {
  src: string;
  viewport: { width: number; height: number };
  /** Rendered width in px; height follows the viewport's aspect. */
  width: number;
  title: string;
  /** Fit the viewport's top portion into this height instead (browser previews). */
  height?: number;
  /** Shown under the loading shimmer and behind an error, when there is one. */
  cover?: string;
}

type Status = { kind: "loading" } | { kind: "loaded" } | { kind: "error"; message: string };

export function LiveFrame({ src, viewport, width, height, title, cover }: LiveFrameProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  // Bumped by Retry: a new key is a new iframe, so a fresh request.
  const [attempt, setAttempt] = useState(0);
  // The probe's verdict outranks load: a same-origin 404 page still loads.
  const broken = useRef(false);
  const scale = width / viewport.width;
  const boxHeight = height ?? viewport.height * scale;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShouldMount(true);
      },
      { rootMargin: NEAR },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldMount || !ref.current) return;
    const entry = { el: ref.current, unmount: () => setShouldMount(false) };
    mounted.add(entry);
    evictFarthest();
    return () => {
      mounted.delete(entry);
    };
  }, [shouldMount]);

  // A new src (a state change in the gallery) is a fresh load: back to the
  // skeleton until it lands, rather than leaving the stale frame showing.
  useEffect(() => {
    setStatus({ kind: "loading" });
    broken.current = false;
    if (!shouldMount) return;
    let live = true;
    const timer = window.setTimeout(() => {
      if (live) setStatus((s) => (s.kind === "loading" ? { kind: "error", message: `Didn't load within ${TIMEOUT_MS / 1000}s.` } : s));
    }, TIMEOUT_MS);
    const fail = (message: string) => {
      if (!live) return;
      broken.current = true;
      setStatus({ kind: "error", message });
    };
    const sameOrigin = new URL(src, location.href).origin === location.origin;
    // Only a same-origin response has a readable status; a no-cors one is
    // opaque, and reaching the server at all is the only signal.
    fetch(src, { method: "HEAD", mode: sameOrigin ? "same-origin" : "no-cors", cache: "no-store" })
      .then((res) => {
        if (sameOrigin && !res.ok) fail(`The page returned ${res.status}.`);
      })
      .catch(() => fail("Couldn't reach the page."));
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [src, shouldMount, attempt]);

  return (
    <div ref={ref} className={`pv-live is-${status.kind}`} style={{ width, height: boxHeight }}>
      {cover && <img className="pv-live__cover" src={cover} alt="" loading="lazy" />}
      <div className="pv-live__skeleton" aria-hidden="true" />
      {shouldMount && (
        <iframe
          key={attempt}
          src={src}
          title={title}
          tabIndex={-1}
          aria-hidden="true"
          // Previews must not navigate the tool, open popups or grab focus.
          sandbox="allow-scripts allow-same-origin allow-forms"
          onLoad={() => {
            if (!broken.current) setStatus({ kind: "loaded" });
          }}
          style={{
            width: viewport.width,
            height: viewport.height,
            transform: `scale(${scale})`,
          }}
        />
      )}
      {status.kind === "loading" && (
        <span className="pv-live__status" role="status">
          Loading…
        </span>
      )}
      {status.kind === "error" && (
        <div className="pv-live__error" role="alert">
          <p>{status.message}</p>
          <button
            type="button"
            className="pv-btn"
            onClick={(e) => {
              // Some cards sit inside links to the viewer; Retry mustn't follow them.
              e.preventDefault();
              e.stopPropagation();
              setAttempt((n) => n + 1);
            }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
