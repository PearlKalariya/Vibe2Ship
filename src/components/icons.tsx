// Inline stroke icons (Lucide-style, 1.75 stroke) — no emoji, no deps, theming via currentColor.
type P = { size?: number; className?: string };
const base = (size = 18, className = "") => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true,
});

export const Bolt = ({ size, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </svg>
);
export const Tool = ({ size, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-2.4 2.6-2.8Z" />
  </svg>
);
export const Calendar = ({ size, className }: P) => (
  <svg {...base(size, className)}>
    <rect x="3" y="4.5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
  </svg>
);
export const Mail = ({ size, className }: P) => (
  <svg {...base(size, className)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6.5 8.5 6 8.5-6" />
  </svg>
);
export const Bell = ({ size, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);
export const Check = ({ size, className }: P) => (
  <svg {...base(size, className)}>
    <path d="m20 6-11 11-5-5" />
  </svg>
);
export const ListTodo = ({ size, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M3 5.5h2v2H3zM3 11h2v2H3zM3 16.5h2v2H3zM8 6.5h13M8 12h13M8 17.5h13" />
  </svg>
);
export const Send = ({ size, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M21 3 3 10.5l7 2.5 2.5 7L21 3Z" />
    <path d="M10 13.5 21 3" />
  </svg>
);
export const Refresh = ({ size, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
  </svg>
);
export const Sparkle = ({ size, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
  </svg>
);
export const Clock = ({ size, className }: P) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
