import { useEffect, useState } from "react";

/*
 * Machine-specific settings — where each project's source lives on this
 * Mac — read from app/hub.local.json, which is gitignored.
 *
 * Hostinger serves this whole repo, so nothing local may reach a build. The
 * glob below is only evaluated under `import.meta.env.DEV`, which Vite
 * replaces with `false` in a production build; the branch, the dynamic
 * import and the JSON chunk it would have pulled in are all dropped. (Check:
 * after `npm run build`, grep app/dist for a path from the file — nothing.)
 * A glob rather than a plain import so a missing file is just an empty
 * match, not a build error: no file, no local shortcuts.
 *
 * Shape (see hub.local.example.json):
 *   { "projects": { "<slug>": { "path": "/abs/path", "claude"?: "command" } } }
 */

export interface LocalProject {
  /** Absolute path to the project's source folder. */
  path: string;
  /** Overrides the default `cd '<path>' && claude`. */
  claude?: string;
}

interface LocalConfig {
  projects?: Record<string, LocalProject>;
}

let pending: Promise<LocalConfig> | undefined;

function loadLocal(): Promise<LocalConfig> {
  if (!import.meta.env.DEV) return Promise.resolve({});
  if (!pending) {
    const match = import.meta.glob<LocalConfig>("../../hub.local.json", { import: "default" });
    const load = Object.values(match)[0];
    pending = load ? load().catch(() => ({})) : Promise.resolve({});
  }
  return pending;
}

/** This project's local settings, or null — always null on the live site. */
export function useLocalProject(slug: string): LocalProject | null {
  const [project, setProject] = useState<LocalProject | null>(null);
  useEffect(() => {
    let live = true;
    loadLocal().then((config) => {
      const entry = config.projects?.[slug];
      if (live) setProject(entry?.path ? entry : null);
    });
    return () => {
      live = false;
    };
  }, [slug]);
  return project;
}

/** Single-quoted for zsh/bash, so spaces and parentheses in paths survive. */
const shellQuote = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

export const claudeCommand = (project: LocalProject) => project.claude ?? `cd ${shellQuote(project.path)} && claude`;
