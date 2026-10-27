import { useCallback, useEffect, useRef, useState } from "react";
import type { Status } from "../types";
import { formatUpdated } from "../lib/dates";

export function StatusTag({ status }: { status: Status }) {
  return <span className={`pv-tag pv-tag--${status.replace(" ", "-")}`}>{status}</span>;
}

export function Updated({ iso }: { iso: string }) {
  return (
    <time className="pv-updated" dateTime={iso} title={new Date(iso).toLocaleString()}>
      {formatUpdated(iso)}
    </time>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: React.ReactNode; title?: string }[];
  onChange: (value: T) => void;
}

/** Pill toggle with a solid dark active segment. */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="pv-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className="pv-seg__opt"
          title={o.title}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * One toast at a time; a new one replaces the old rather than stacking —
 * they only ever confirm the click just made.
 */
export function useToast() {
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const timer = useRef<number>();
  const show = useCallback((text: string) => {
    window.clearTimeout(timer.current);
    setToast({ text, id: Date.now() });
    timer.current = window.setTimeout(() => setToast(null), 1800);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const node = toast ? (
    <div className="pv-toast" role="status" key={toast.id}>
      {toast.text}
    </div>
  ) : null;
  return [node, show] as const;
}
