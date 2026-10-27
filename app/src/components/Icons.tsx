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
