import { useEffect } from "react";
import { getPrototype } from "./lib/protos";
import { linkHandler, navigate, parseRoute, useLocation } from "./lib/router";
import { Gallery } from "./components/Gallery";
import { Landing } from "./components/Landing";
import { Viewer } from "./components/Viewer";

export function App() {
  const { pathname } = useLocation();
  const route = parseRoute(pathname);

  // The tool owns its whole subdomain; anything that isn't /prototypes/...
  // lands on the index.
  useEffect(() => {
    if (!pathname.startsWith("/prototypes")) navigate("/prototypes", { replace: true });
  }, [pathname]);

  useEffect(() => {
    const current = parseRoute(pathname);
    const proto = current.page === "landing" ? undefined : getPrototype(current.slug);
    document.title = proto ? `${proto.title} — Prototypes` : "Prototypes — Micah Lindenberger";
  }, [pathname]);

  // .pv scopes every style the tool ships; see styles.css.
  let page: React.ReactNode;
  if (route.page === "landing") page = <Landing />;
  else {
    const proto = getPrototype(route.slug);
    if (!proto) {
      page = (
        <div className="pv-landing">
          <p className="pv-empty">
            No prototype called “{route.slug}”.{" "}
            <a href="/prototypes" onClick={linkHandler("/prototypes")}>
              See them all
            </a>
            .
          </p>
        </div>
      );
    } else if (route.page === "gallery") page = <Gallery key={proto.slug} proto={proto} />;
    else page = <Viewer key={proto.slug} proto={proto} />;
  }
  return <div className="pv">{page}</div>;
}
