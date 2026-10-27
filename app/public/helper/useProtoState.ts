// React hooks over protostate.js. Copy both files into a React prototype,
// side by side, and import from here. The tool itself never imports this —
// it lives in public/ only so there's one folder to copy (or link to).
import { useEffect, useState } from "react";
import "./protostate.js";

interface ProtoState {
  getState(groupId: string, defaultId: string): string;
  onStateChange(cb: (state: Record<string, string>) => void): () => void;
  onAction(actionId: string, cb: () => void): () => void;
  onReset(cb: () => void): () => void;
  reportScreen(screenId: string): void;
}

declare global {
  interface Window {
    protostate: ProtoState;
  }
}

export const protostate = window.protostate;

/** The selected option for a group; re-renders on live state changes. */
export function useProtoState(groupId: string, defaultId: string): string {
  const [value, setValue] = useState(() => protostate.getState(groupId, defaultId));
  useEffect(
    () => protostate.onStateChange(() => setValue(protostate.getState(groupId, defaultId))),
    [groupId, defaultId],
  );
  return value;
}

/** Runs cb each time the viewer fires this action. Keep cb stable or cheap. */
export function useProtoAction(actionId: string, cb: () => void) {
  useEffect(() => protostate.onAction(actionId, cb), [actionId, cb]);
}

/** Tell the viewer which manifest screen is showing, whenever it changes. */
export function useReportScreen(screenId: string) {
  useEffect(() => protostate.reportScreen(screenId), [screenId]);
}
