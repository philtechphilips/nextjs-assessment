import type { ReactNode } from "react";

/** Icons are decorative: each sits next to text or inside a labelled control. */
function createIcon(paths: ReactNode) {
  return function Icon({ className = "size-4" }: { className?: string }) {
    return (
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`shrink-0 ${className}`}
      >
        {paths}
      </svg>
    );
  };
}

export const AlertIcon = createIcon(
  <>
    <path d="M10 3.5 2.5 16.5h15L10 3.5Z" />
    <path d="M10 8.5V12M10 14.25v.01" />
  </>,
);
export const ArrowDownIcon = createIcon(
  <path d="M10 4v12m-4.5-4.5L10 16l4.5-4.5" />,
);
export const ArrowUpIcon = createIcon(
  <path d="M10 16V4M5.5 8.5 10 4l4.5 4.5" />,
);
export const BuildingIcon = createIcon(
  <path d="M4.5 17V4.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1V17m0-8.5h2a1 1 0 0 1 1 1V17M3 17h14M7.5 7h2m-2 3h2m-2 3h2" />,
);
export const ChevronLeftIcon = createIcon(<path d="m12 5-5 5 5 5" />);
export const ChevronRightIcon = createIcon(<path d="m8 5 5 5-5 5" />);
export const CloseIcon = createIcon(<path d="m5 5 10 10M15 5 5 15" />);
export const PlusIcon = createIcon(<path d="M10 4.5v11M4.5 10h11" />);
export const SearchIcon = createIcon(
  <>
    <circle cx="9" cy="9" r="5.5" />
    <path d="m13.25 13.25 3.25 3.25" />
  </>,
);
export const SortableIcon = createIcon(
  <path d="M6.5 8 10 4.5 13.5 8m-7 4 3.5 3.5 3.5-3.5" />,
);
