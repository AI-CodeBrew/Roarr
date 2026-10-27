import { useId } from "react";

/**
 * Swept mane: 14 locks that curve the same way around the face, centred on (60, 60).
 * Each lock rises from a valley, bends to a sharp tip and drops straight back down.
 */
const MANE_PATH = (() => {
  const locks = 14;
  const tipRadius = 55;
  const valleyRadius = 44;
  const step = (Math.PI * 2) / locks;
  const at = (radius, angle) =>
    `${(60 + radius * Math.cos(angle)).toFixed(1)} ${(60 + radius * Math.sin(angle)).toFixed(1)}`;
  const start = -Math.PI / 2 - step / 2;
  let d = `M${at(valleyRadius, start)}`;
  for (let i = 0; i < locks; i += 1) {
    const valley = start + i * step;
    d += `Q${at(tipRadius - 1, valley + step * 0.12)} ${at(tipRadius, valley + step * 0.78)}`;
    d += `L${at(valleyRadius, valley + step)}`;
  }
  return `${d}Z`;
})();

/** Line-art strokes, drawn in this order by the splash animation (see `root.jsx`). */
const LION_PATHS = [
  // Mane
  MANE_PATH,
  // Face
  "M60 31C75 31 84 42 84 56C84 74 73 88 60 94C47 88 36 74 36 56C36 42 45 31 60 31Z",
  // Nose bridge
  "M60 42V67",
  // Eyes
  "M45 56L55 58.5",
  "M75 56L65 58.5",
  // Nose
  "M54 67.5H66L60 74.5Z",
  // Mouth
  "M60 74.5V79M52 80.5Q56 85.5 60 79Q64 85.5 68 80.5",
];

/**
 * Roarr brand mark: a line-drawn lion face with the blue → violet theme gradient.
 * Use a heavier `strokeWidth` (viewBox units) at small sizes so the lines stay visible.
 */
export default function RoarrLionMark({ size = 24, strokeWidth = 3.2, className = "", title }) {
  const gradientId = `roarr-lion-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`roarr-lion ${className}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="120" y2="120">
          <stop offset="0" stopColor="#1e40af" />
          <stop offset="0.55" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <g
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {LION_PATHS.map((d) => (
          <path key={d} d={d} pathLength="100" />
        ))}
      </g>
    </svg>
  );
}
