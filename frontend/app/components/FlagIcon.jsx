import { useState } from "react";
import { Globe } from "lucide-react";

/**
 * Flag emoji → lowercase ISO alpha-2 code ("🇬🇧" → "gb"), or null when it isn't a country flag.
 * Windows has no flag emoji glyphs (they show up as letter pairs like "GB"), so flags are drawn as images.
 */
export function flagEmojiToCode(flag) {
  const points = [...(flag || "")].map((ch) => ch.codePointAt(0));
  if (points.length !== 2 || !points.every((p) => p >= 0x1f1e6 && p <= 0x1f1ff)) return null;
  return String.fromCharCode(...points.map((p) => p - 0x1f1e6 + 97));
}

/** The image itself. Keyed by country in {@link FlagIcon}, so each flag gets a fresh element. */
function FlagImage({ iso, width, height, className }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-hidden
        className={`inline-flex flex-none items-center justify-center rounded-[3px] bg-slate-100 text-slate-500 ${className}`}
        style={{ width, height }}
      >
        <Globe size={Math.round(height * 0.75)} />
      </span>
    );
  }
  return (
    <img
      aria-hidden
      alt=""
      width={width}
      height={height}
      src={`/flags/${iso}.svg`}
      onError={() => setFailed(true)}
      className={`flex-none rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(15,23,42,0.14)] ${className}`}
      style={{ width, height }}
    />
  );
}

/**
 * Country flag from the SVGs in `public/flags/` (3:2, one file per ISO code). Falls back to a globe
 * when the flag is missing. Decorative: the country name is always shown next to it.
 */
export default function FlagIcon({ flag, code, width = 24, className = "" }) {
  const iso = (code || flagEmojiToCode(flag) || "").toLowerCase();
  const height = Math.round(width * 0.67);

  if (!iso) {
    return (
      <span
        aria-hidden
        className={`inline-flex flex-none items-center justify-center rounded-[3px] bg-slate-100 text-slate-500 ${className}`}
        style={{ width, height }}
      >
        <Globe size={Math.round(height * 0.75)} />
      </span>
    );
  }
  return <FlagImage key={iso} iso={iso} width={width} height={height} className={className} />;
}
