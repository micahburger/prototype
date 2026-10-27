// The shape of prototypes.config.ts. See the README for what each field does.

export type Status = "concept" | "in progress" | "done";
export type Device = "phone" | "desktop";

export interface StateOption {
  id: string;
  label: string;
}

/** A single-select group. Its first option is the default. */
export interface StateGroup {
  id: string;
  label: string;
  options: StateOption[];
}

/** A one-off button, posted to the prototype as { type: "prototype:action", id }. */
export interface Action {
  id: string;
  label: string;
}

/** { groupId: optionId } */
export type Selections = Record<string, string>;

export interface Screen {
  id: string;
  title: string;
  /** Relative to the prototype's entry origin, or an absolute URL. */
  path: string;
  section?: string;
  states?: StateGroup[];
  actions?: Action[];
  preset?: Selections;
}

export interface Prototype {
  slug: string;
  title: string;
  description: string;
  status: Status;
  /** ISO date or date-time. */
  updated: string;
  /** Path or URL of the start screen. */
  entry: string;
  device?: Device;
  thumbnail?: string;
  storageKeys?: string[];
  liveStates?: boolean;
  states?: StateGroup[];
  actions?: Action[];
  screens: Screen[];
}
