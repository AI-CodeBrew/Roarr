import { useId } from "react";

/**
 * Mane: layered strands that sweep clockwise around the head, inside the round emblem. The bottom
 * (chin) is left open, and back strands sit behind shorter front strands, so it reads as flowing
 * hair. The emblem's outline is a clean circle, which keeps the mark recognisable at small sizes.
 */
function strandPath(angle, baseRadius, tipRadius, width, sweep) {
  const cx = 60;
  const cy = 61;
  const at = (r, a) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  const a0 = angle - width / 2;
  const a1 = angle + width / 2;
  const tip = angle + sweep;
  return (
    `M${at(baseRadius, a0)}` +
    `Q${at((baseRadius + tipRadius) / 2 + 3, a0 + sweep * 0.25)} ${at(tipRadius, tip)}` +
    `Q${at((baseRadius + tipRadius) / 2 - 1, a1 + sweep * 0.55)} ${at(baseRadius, a1)}Z`
  );
}

const deg = (d) => (d * Math.PI) / 180;

/** Strand angles in degrees (90 = straight down); the chin (roughly 55°–125°) stays open. */
const ANGLES = (from, to, count) =>
  Array.from({ length: count }, (_, i) => from + ((to - from) * i) / (count - 1));

/** Back strands: longest, faint. */
const BACK_STRANDS = ANGLES(140, 400, 13).map((a, i) =>
  strandPath(deg(a), 26, 51 + (i % 3) * 1.8, deg(17), deg(30)),
);
/** Middle strands: offset half a step. */
const MID_STRANDS = ANGLES(150, 390, 12).map((a, i) =>
  strandPath(deg(a), 26, 46 + ((i + 1) % 3) * 1.6, deg(16), deg(26)),
);
/** Front strands: short and bright, framing the face. */
const FRONT_STRANDS = ANGLES(160, 380, 11).map((a, i) =>
  strandPath(deg(a), 26, 40 + ((i + 2) % 3) * 1.4, deg(15), deg(22)),
);

const MANE_LAYERS = [
  { strands: BACK_STRANDS, opacity: 0.22, offset: 0 },
  { strands: MID_STRANDS, opacity: 0.45, offset: 13 },
  { strands: FRONT_STRANDS, opacity: 0.85, offset: 25 },
];

const FACE =
  "M60 33C69 33 77 36.5 81 43.5L84.5 55C86 63 83.5 69.5 78.5 74.5L70 85.5C66.5 91 63.5 94 60 94C56.5 94 53.5 91 50 85.5L41.5 74.5C36.5 69.5 34 63 35.5 55L39 43.5C43 36.5 51 33 60 33Z";

const EYES = ["M43.5 53.8L53.8 52.6L55.6 57.2L46 57.6Z", "M76.5 53.8L66.2 52.6L64.4 57.2L74 57.6Z"];

/**
 * ROARR emblem: a geometric lion head on a blue → violet disc, with a swept, layered mane and a
 * faceted white face. Small "spark" node in the mane is the AI detail.
 *
 * `animated` adds the hidden parts the splash animates (glowing eyes, open mouth). Each part also
 * carries an `rlm-*` class, and mane strands carry `--i` (their order) for staggered animation.
 */
export default function RoarrLogoMark({ size = 40, className = "", title, animated = false }) {
  const uid = useId().replace(/:/g, "");
  const disc = `rlm-disc-${uid}`;
  const shine = `rlm-shine-${uid}`;
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`roarr-logo-mark ${className}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={disc} x1="14" y1="8" x2="106" y2="114" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4338FF" />
          <stop offset="0.55" stopColor="#5B3BF5" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <radialGradient id={shine} cx="36" cy="26" r="70" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className="rlm-disc">
        <circle cx="60" cy="60" r="57" fill={`url(#${disc})`} />
        <circle cx="60" cy="60" r="57" fill={`url(#${shine})`} />
      </g>

      <g className="rlm-mane" fill="#fff">
        {MANE_LAYERS.map(({ strands, opacity, offset }) =>
          strands.map((d, i) => (
            <path key={d} d={d} fillOpacity={opacity} className="rlm-strand" style={{ "--i": offset + i }} />
          )),
        )}
      </g>

      <g className="rlm-face">
        {/* Face with soft lavender facets for geometric depth */}
        <path d={FACE} fill="#fff" />
        <path d="M60 36L66.5 48.5L60 61L53.5 48.5Z" fill="#E8E9FF" />
        <path d="M37.5 57L47 61L52.5 70.5L42.5 74Z" fill="#E8E9FF" />
        <path d="M82.5 57L73 61L67.5 70.5L77.5 74Z" fill="#E8E9FF" />

        {/* Features */}
        <g className="rlm-eyes" fill="#171A65">
          {EYES.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        {animated && (
          <g className="rlm-eyeglow" fill="#8F7CFF" opacity="0">
            {EYES.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        )}
        {animated && (
          <g className="rlm-roar" transform="scale(1 0)">
            <path d="M53.6 76.2Q60 74.4 66.4 76.2L64.2 85Q60 88.6 55.8 85Z" fill="#171A65" />
            <path d="M56.6 83.4Q60 81.2 63.4 83.4Q60 87 56.6 83.4Z" fill="#7C3AED" />
          </g>
        )}
        <path d="M53 66.5H67L63.6 72.4L60 73.6L56.4 72.4Z" fill="#171A65" />
        <path
          d="M60 73.6V78.4M52.6 80.6C56 84.6 60 82 60 78.4C60 82 64 84.6 67.4 80.6"
          fill="none"
          stroke="#171A65"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M56.2 58.4L54.6 66.5M63.8 58.4L65.4 66.5" stroke="#171A65" strokeOpacity="0.28" strokeWidth="1.4" strokeLinecap="round" />
      </g>

      {/* AI detail: a small spark node on the mane */}
      <path
        className="rlm-spark"
        d="M91 20.5L92.6 25.4L97.5 27L92.6 28.6L91 33.5L89.4 28.6L84.5 27L89.4 25.4Z"
        fill="#fff"
      />
    </svg>
  );
}
