import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const HEART_PATH =
  "M12 20.5s-8-4.9-8-10.7C4 6.9 6 5 8.3 5c1.6 0 3 .9 3.7 2.2C12.7 5.9 14.1 5 15.7 5 18 5 20 6.9 20 9.8c0 5.8-8 10.7-8 10.7z";

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...strokeProps} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5L21 21" />
    </svg>
  );
}

export function HeartFillIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}>
      <path d={HEART_PATH} />
    </svg>
  );
}

export function HeartLineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...strokeProps} {...props}>
      <path d={HEART_PATH} />
    </svg>
  );
}

export function ChevronIcon({
  direction,
  ...props
}: IconProps & { direction: "up" | "down" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...strokeProps} {...props}>
      <path d={direction === "up" ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...strokeProps} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function BookEmptyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" {...props}>
      <circle cx="40" cy="40" r="40" fill="#86C5CC" />
      <rect x="29" y="22" width="29" height="38" rx="3" fill="#F9D56E" />
      <rect x="22" y="22" width="9" height="38" rx="2" fill="#32495E" />
      <rect x="37" y="31" width="14" height="3" rx="1.5" fill="#E5B84A" />
      <rect x="37" y="38" width="10" height="3" rx="1.5" fill="#E5B84A" />
    </svg>
  );
}
