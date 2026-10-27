import { useCallback } from "react";

/**
 * Maximum CSS transform scale for the desktop preview frame (UI “100%”).
 * Matches the historical 0.75 transform at full zoom.
 */
export const MAX_DESKTOP_PREVIEW_ZOOM = 0.75;

/** Fixed zoom labels in the UI; 100% maps to {@link MAX_DESKTOP_PREVIEW_ZOOM}. */
export const ZOOM_DISPLAY_PERCENTS = [50, 60, 70, 80, 90, 100];

const ZOOM_LEVELS = ZOOM_DISPLAY_PERCENTS.map(
  (p) => (p / 100) * MAX_DESKTOP_PREVIEW_ZOOM,
);

function nearestZoomIndex(scale) {
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < ZOOM_LEVELS.length; i++) {
    const d = Math.abs(ZOOM_LEVELS[i] - scale);
    if (d < bestDiff) {
      bestDiff = d;
      best = i;
    }
  }
  return best;
}

/** Default zoom: **80%** in the fixed step list (CSS scale 0.8 × max). */
export const DEFAULT_PREVIEW_ZOOM = (80 / 100) * MAX_DESKTOP_PREVIEW_ZOOM;

/**
 * Compact − / % / + control matching the pill style of the desktop/mobile preview toggle.
 */
export default function PreviewZoomControls({ scale, onScaleChange }) {
  const zoomOut = useCallback(() => {
    const i = nearestZoomIndex(scale);
    if (i > 0) onScaleChange(ZOOM_LEVELS[i - 1]);
  }, [scale, onScaleChange]);

  const zoomIn = useCallback(() => {
    const i = nearestZoomIndex(scale);
    if (i < ZOOM_LEVELS.length - 1) onScaleChange(ZOOM_LEVELS[i + 1]);
  }, [scale, onScaleChange]);

  const i = nearestZoomIndex(scale);
  const atMin = i <= 0;
  const atMax = i >= ZOOM_LEVELS.length - 1;

  return (
    <div
      className="flex items-center gap-0.5 rounded-full bg-white px-0.5 py-0.5 shadow-sm ring-1 ring-slate-200"
      role="group"
      aria-label="Preview zoom"
    >
      <button
        type="button"
        onClick={zoomOut}
        disabled={atMin}
        className={`flex h-7 min-w-[1.75rem] items-center justify-center rounded-full text-sm font-medium transition-colors ${
          atMin
            ? "text-slate-300 cursor-not-allowed"
            : "text-slate-600 hover:bg-blue-50 hover:text-[#1e3a8a]"
        }`}
        aria-label="Zoom out preview"
      >
        −
      </button>
      <span
        className="tabular-nums text-[11px] font-medium text-slate-600 min-w-[2.75rem] text-center select-none"
        title="Preview zoom"
      >
        {ZOOM_DISPLAY_PERCENTS[i]}%
      </span>
      <button
        type="button"
        onClick={zoomIn}
        disabled={atMax}
        className={`flex h-7 min-w-[1.75rem] items-center justify-center rounded-full text-sm font-medium transition-colors ${
          atMax
            ? "text-slate-300 cursor-not-allowed"
            : "text-slate-600 hover:bg-blue-50 hover:text-[#1e3a8a]"
        }`}
        aria-label="Zoom in preview"
      >
        +
      </button>
    </div>
  );
}
