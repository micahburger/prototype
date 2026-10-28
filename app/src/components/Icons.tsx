// Stroke icons, 16px, currentColor. Inline so the tool ships no icon font.
const base = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const ArrowLeft = () => (
  <svg {...base}><path d="M13 8H3M7 4 3 8l4 4" /></svg>
);
export const Chevron = ({ dir = "left" }: { dir?: "left" | "right" | "down" }) => (
  <svg {...base} style={{ transform: dir === "right" ? "rotate(180deg)" : dir === "down" ? "rotate(-90deg)" : undefined }}>
    <path d="M10 3.5 5.5 8l4.5 4.5" />
  </svg>
);
export const Sliders = () => (
  <svg {...base}><path d="M2.5 4.5h6M11.5 4.5h2M2.5 11.5h2M7.5 11.5h6" /><circle cx="10" cy="4.5" r="1.5" /><circle cx="6" cy="11.5" r="1.5" /></svg>
);
export const ResetIcon = () => (
  <svg {...base}><path d="M2.75 8a5.25 5.25 0 1 0 1.6-3.77" /><path d="M2.5 2.5v3h3" /></svg>
);
export const Expand = () => (
  <svg {...base}><path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5 9 7M2.5 13.5 7 9" /></svg>
);
export const Collapse = () => (
  <svg {...base}><path d="M13.5 6.5h-4v-4M2.5 9.5h4v4M9.5 6.5l4-4M6.5 9.5l-4 4" /></svg>
);
export const Close = () => (
  <svg {...base}><path d="m4 4 8 8M12 4l-8 8" /></svg>
);
export const Search = () => (
  <svg {...base}><circle cx="7" cy="7" r="4.25" /><path d="m10.25 10.25 3.25 3.25" /></svg>
);
export const External = () => (
  <svg {...base}><path d="M9.5 2.5h4v4M13.5 2.5 7.5 8.5M11.5 9.5v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3" /></svg>
);
export const Branch = () => (
  <svg {...base}><circle cx="4.5" cy="3.5" r="1.5" /><circle cx="4.5" cy="12.5" r="1.5" /><circle cx="11.5" cy="5" r="1.5" /><path d="M4.5 5v6M11.5 6.5c0 2.5-3 2.5-5.5 4.5" /></svg>
);
export const Folder = () => (
  <svg {...base}><path d="M2 4.5a1 1 0 0 1 1-1h3.25l1.5 1.5H13a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" /></svg>
);
export const Terminal = () => (
  <svg {...base}><rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1.5" /><path d="m4.5 6.5 2 1.5-2 1.5M8.5 10h3" /></svg>
);
export const Pencil = () => (
  <svg {...base}><path d="M10.5 2.75 13.25 5.5 6 12.75H3.25V10z" /><path d="m9 4.25 2.75 2.75" /></svg>
);
