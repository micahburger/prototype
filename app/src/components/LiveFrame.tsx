import { useEffect, useRef, useState } from "react";

/*
 * A non-interactive, scaled-down live preview. The iframe is laid out at the
 * device's real viewport (390×844, 1440×900) and shrunk with a transform, so
 * the prototype sees a real phone- or desktop-width window and runs its own
 * responsive layout — shrinking the iframe itself would show a squashed
 * desktop page, or trip the site's mobile breakpoint on a desktop card.
 *
 * Mounting is lazy, and capped. Each card mounts its iframe once it comes
 * within NEAR of the viewport. Past BUDGET mounted frames, any that have
 * drifted further than FAR away get unmounted again, so a 50-screen gallery
 * holds ~30 live documents at most instead of all of them.
 */

const NEAR = "400px";
const FAR = 1600;
const BUDGET = 30;

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
}

export function LiveFrame({ src, viewport, width, height, title }: LiveFrameProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(false);
  const [loaded, setLoaded] = useState(false);
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
  useEffect(() => setLoaded(false), [src, shouldMount]);

  return (
    <div
      ref={ref}
      className={`pv-live${loaded ? " is-loaded" : ""}`}
      style={{ width, height: boxHeight }}
      aria-hidden="true"
    >
      <div className="pv-live__skeleton" />
      {shouldMount && (
        <iframe
          src={src}
          title={title}
          tabIndex={-1}
          // Previews must not navigate the tool, open popups or grab focus.
          sandbox="allow-scripts allow-same-origin allow-forms"
          onLoad={() => setLoaded(true)}
          style={{
            width: viewport.width,
            height: viewport.height,
            transform: `scale(${scale})`,
          }}
        />
      )}
    </div>
  );
}
