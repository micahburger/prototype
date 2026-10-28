import type { Prototype } from "../types";
import { copyText } from "../lib/clipboard";
import { claudeCommand, useLocalProject } from "../lib/local";
import { useToast } from "./Bits";
import { Branch, External, Folder, Terminal } from "./Icons";

/*
 * Four icon buttons for getting from the hub to the project itself.
 *
 *   Open preview          always — the page and state on show, in a new tab
 *   Open repo             only when the manifest gives a `repo`
 *   Copy local path       only with hub.local.json, i.e. only on Micah's Mac
 *   Copy Claude command   ditto
 *
 * No editor or app deep links (vscode://, claude://): none has been checked
 * to open the right folder, and a link that silently does nothing is worse
 * than a command to paste.
 */

export function ProjectShortcuts({ proto, previewUrl }: { proto: Prototype; previewUrl: () => string }) {
  const local = useLocalProject(proto.slug);
  const [toastNode, toast] = useToast();

  const copy = async (text: string, what: string) => {
    toast((await copyText(text)) ? `Copied ${what}` : `Couldn't copy — ${text}`);
  };

  return (
    <div className="pv-shortcuts" role="group" aria-label="Project shortcuts">
      <a
        className="pv-iconbtn"
        // Built on click: the frame may have navigated since this rendered.
        href={proto.entry}
        onClick={(e) => {
          e.preventDefault();
          window.open(previewUrl(), "_blank", "noopener");
        }}
        title="Open preview in a new tab"
        aria-label="Open preview in a new tab"
      >
        <External />
      </a>
      {proto.repo && (
        <a className="pv-iconbtn" href={proto.repo} target="_blank" rel="noopener noreferrer" title="Open repo" aria-label="Open repo">
          <Branch />
        </a>
      )}
      {local && (
        <>
          <button
            type="button"
            className="pv-iconbtn"
            onClick={() => copy(local.path, "local path")}
            title={`Copy local path\n${local.path}`}
            aria-label="Copy local path"
          >
            <Folder />
          </button>
          <button
            type="button"
            className="pv-iconbtn"
            onClick={() => copy(claudeCommand(local), "Claude Code command")}
            title={`Copy Claude Code command\n${claudeCommand(local)}`}
            aria-label="Copy Claude Code command"
          >
            <Terminal />
          </button>
        </>
      )}
      {toastNode}
    </div>
  );
}
