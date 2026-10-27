import { useMemo, useState } from "react";
import type { Prototype } from "../types";
import { VIEWPORTS, deviceOf, entryUrl, galleryHref, prototypes, viewerHref } from "../lib/protos";
import { linkHandler } from "../lib/router";
import { useElementSize } from "../lib/hooks";
import { StatusTag, Updated } from "./Bits";
import { Search } from "./Icons";
import { LiveFrame } from "./LiveFrame";

export function Landing() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return prototypes;
    return prototypes.filter((p) => `${p.title} ${p.description}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="pv-landing">
      <header className="pv-hero">
        <p className="pv-eyebrow">Micah Lindenberger</p>
        <h1 className="pv-display">Prototypes.</h1>
        <p className="pv-count">
          {prototypes.length} {prototypes.length === 1 ? "prototype" : "prototypes"}
        </p>
      </header>

      {prototypes.length === 0 ? (
        <p className="pv-empty">
          Nothing here yet. Add an entry to <code>app/src/prototypes.config.ts</code> to see it.
        </p>
      ) : (
        <>
          <label className="pv-search">
            <Search />
            <input
              type="search"
              placeholder="Search prototypes"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            />
          </label>
          {filtered.length === 0 ? (
            <p className="pv-empty">No prototype matches “{query}”.</p>
          ) : (
            <ul className="pv-cards">
              {filtered.map((p) => (
                <ProtoCard key={p.slug} proto={p} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function ProtoCard({ proto }: { proto: Prototype }) {
  const view = viewerHref(proto.slug);
  const gallery = galleryHref(proto.slug);
  const screens = proto.screens.length;
  return (
    <li className="pv-card">
      <CardPreview proto={proto} />
      <div className="pv-card__meta">
        <div className="pv-card__row">
          <h2 className="pv-card__title">
            {/* Stretched over the whole card by CSS; the Gallery link sits above it. */}
            <a href={view} className="pv-card__link" onClick={linkHandler(view)}>
              {proto.title}
            </a>
          </h2>
          <StatusTag status={proto.status} />
        </div>
        <p className="pv-card__desc">{proto.description}</p>
        <div className="pv-card__row pv-card__foot">
          <span>
            {screens} {screens === 1 ? "screen" : "screens"} · <Updated iso={proto.updated} />
          </span>
          <a href={gallery} className="pv-card__gallery" onClick={linkHandler(gallery)}>
            Gallery
          </a>
        </div>
      </div>
    </li>
  );
}

const PREVIEW_HEIGHT = 300;

function CardPreview({ proto }: { proto: Prototype }) {
  const [ref, { width }] = useElementSize<HTMLDivElement>();
  const device = deviceOf(proto);
  const viewport = VIEWPORTS[device];
  const src = entryUrl(proto).toString();

  let frame: React.ReactNode = null;
  if (width > 0) {
    if (proto.thumbnail) {
      frame = <img className="pv-card__thumb" src={proto.thumbnail} alt="" loading="lazy" />;
    } else if (device === "phone") {
      // Fit the whole phone into the preview's height, leaving room for the
      // bezel and a little air above and below.
      const screenHeight = PREVIEW_HEIGHT - 40;
      const screenWidth = (screenHeight * viewport.width) / viewport.height;
      frame = (
        <div className="pv-mini-phone">
          <LiveFrame src={src} viewport={viewport} width={screenWidth} title={proto.title} />
        </div>
      );
    } else {
      // A browser window as wide as the card, cropped to the preview's
      // height: the top of a desktop page is what reads at this size.
      const frameWidth = width - 48;
      frame = (
        <div className="pv-mini-browser" style={{ width: frameWidth }}>
          <div className="pv-mini-browser__bar">
            <i /><i /><i />
            <span>{entryUrl(proto).host || "localhost"}</span>
          </div>
          <LiveFrame src={src} viewport={viewport} width={frameWidth} height={PREVIEW_HEIGHT - 64} title={proto.title} />
        </div>
      );
    }
  }

  return (
    <div ref={ref} className={`pv-card__preview pv-card__preview--${device}`} style={{ height: PREVIEW_HEIGHT }}>
      {frame}
    </div>
  );
}
