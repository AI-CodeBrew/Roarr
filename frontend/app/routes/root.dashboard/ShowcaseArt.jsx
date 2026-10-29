import { Sparkles } from "lucide-react";
import { useFlowTemplate } from "../../lib/useFlowTemplate";

/*
 * Decorative storefront mock-ups for the dashboard (pure SVG/CSS, no image assets).
 * Everything here is aria-hidden; it only illustrates what Roarr builds.
 */

export function Armchair({ fabric = "#a8a29e", shade = "#8f8984", seat = "#c4bfba", className = "" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <ellipse cx="50" cy="94" rx="34" ry="3" fill="#000" opacity=".08" />
      <path d="M30 80 26 94M70 80l4 14" stroke="#6b5444" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 32C24 17 34 10 50 10s26 7 26 22l2 36H22z" fill={fabric} />
      <rect x="26" y="60" width="48" height="20" rx="7" fill={seat} />
      <rect x="13" y="44" width="18" height="38" rx="9" fill={shade} />
      <rect x="69" y="44" width="18" height="38" rx="9" fill={shade} />
    </svg>
  );
}

export function FloorLamp({ className = "" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <ellipse cx="44" cy="94" rx="16" ry="2.5" fill="#000" opacity=".08" />
      <rect x="34" y="89" width="20" height="4" rx="2" fill="#27272a" />
      <path d="M44 89V30c0-12 8-18 20-18" stroke="#27272a" strokeWidth="2" fill="none" />
      <path d="M58 14h16l7 18H51z" fill="#27272a" />
      <ellipse cx="66" cy="33" rx="13" ry="2" fill="#fde68a" opacity=".7" />
    </svg>
  );
}

export function Plant({ pot = "#ece7df", className = "" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <g fill="#3f7d4e">
        <ellipse cx="50" cy="38" rx="6" ry="24" />
        <ellipse cx="37" cy="47" rx="5" ry="19" transform="rotate(-32 37 47)" />
        <ellipse cx="63" cy="47" rx="5" ry="19" transform="rotate(32 63 47)" />
      </g>
      <g fill="#5d9c6c">
        <ellipse cx="28" cy="58" rx="4" ry="14" transform="rotate(-58 28 58)" />
        <ellipse cx="72" cy="58" rx="4" ry="14" transform="rotate(58 72 58)" />
        <ellipse cx="44" cy="30" rx="3.5" ry="15" transform="rotate(-12 44 30)" />
      </g>
      <path d="M34 68h32l-4 26H38z" fill={pot} />
      <rect x="32" y="66" width="36" height="5" rx="2" fill={pot} />
    </svg>
  );
}

/** Rounded grey text placeholder line. */
export function Line({ className = "" }) {
  return <span className={`block h-1 rounded-full bg-slate-200 ${className}`} />;
}

/** Illustrated storefront body (placeholder lines, hero copy, products). */
function HeroMockBody() {
  return (
    <>
      <div className="flex items-center justify-between px-3 py-2">
        <Line className="w-10" />
        <div className="flex gap-1.5">
          <Line className="w-5" />
          <Line className="w-5" />
          <Line className="w-5" />
        </div>
      </div>
      <div className="grid grid-cols-[1fr_96px] items-center bg-[#f4f2ef]">
        <div className="px-3 py-4">
          <p className="text-[12px] font-semibold leading-tight text-slate-800">
            Modern Design
            <br />
            for Modern Living
          </p>
          <span className="mt-2 block h-3 w-12 rounded-full bg-[#1e3a8a]" />
        </div>
        <div className="h-[76px] bg-gradient-to-br from-[#ebe7e1] to-[#dcd6ce] p-2">
          <Armchair className="h-full w-full" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 p-3">
        <div className="h-11 rounded-md bg-[#f4f2ef] p-1">
          <Armchair fabric="#e5d9c6" shade="#d9cab3" seat="#efe6d8" className="h-full w-full" />
        </div>
        <div className="h-11 rounded-md bg-[#f4f2ef] p-1">
          <FloorLamp className="h-full w-full" />
        </div>
        <div className="h-11 rounded-md bg-[#f4f2ef] p-1">
          <Plant className="h-full w-full" />
        </div>
      </div>
      <div className="space-y-1.5 px-3 pb-3">
        <Line className="w-3/4" />
        <Line className="w-1/2" />
      </div>
    </>
  );
}

/** A store screenshot filling the window; hovering the banner scrolls down the full page. */
function HeroImageBody({ src }) {
  return (
    <div
      className="h-[176px] bg-[#f4f2ef] bg-no-repeat [background-position:50%_0%] [background-size:100%_auto] [transition:background-position_0.8s_ease] group-hover/hero:[background-position:50%_100%] group-hover/hero:[transition:background-position_14s_linear] motion-reduce:[transition:none]"
      style={{ backgroundImage: `url("${src}")` }}
    />
  );
}

/**
 * Hero illustration: tilted storefront window on a card. With `image` the window shows
 * that screenshot instead of the illustrated storefront.
 */
export function HeroShowcase({ image }) {
  return (
    <div aria-hidden className="group/hero relative mx-auto h-[230px] w-full max-w-[330px] select-none">
      <div className="absolute left-0 top-[52px] flex h-[130px] w-[80px] -rotate-[14deg] items-start justify-center rounded-2xl bg-gradient-to-br from-blue-300 to-[#1e3a8a] pt-5 opacity-80 shadow-xl">
        <Sparkles size={22} className="text-white/90" />
      </div>

      <div className="absolute left-2 top-2 w-[230px] -rotate-[3deg] overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center gap-1 bg-slate-700 px-2.5 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
        </div>
        {image ? <HeroImageBody src={image} /> : <HeroMockBody />}
      </div>
    </div>
  );
}

/**
 * Build-flow card illustration: the flow's real template filling the whole box (stretches to fill
 * its column). It shows the top of the page; hovering scrolls through the full-page screenshot.
 * The picture is a pre-downscaled copy (`cardUrl`) when there is one, so the page stays crisp at
 * this size instead of being squeezed from 1280px by the browser.
 * @param {{ kind: "product" | "store", className?: string }} props
 */
export function FlowTemplateShowcase({ kind, className = "" }) {
  const template = useFlowTemplate(kind);
  return (
    <div
      aria-hidden
      className={`group relative h-full min-h-[150px] select-none overflow-hidden rounded-xl ${className}`}
    >
      {template ? (
        <div
          className="absolute inset-0 bg-white bg-no-repeat [background-position:50%_0%] [background-size:100%_auto] [transition:background-position_0.8s_ease] group-hover:[background-position:50%_100%] group-hover:[transition:background-position_12s_linear] motion-reduce:[transition:none]"
          style={{
            // Full-page screenshot on top; the lighter card picture shows while it loads.
            backgroundImage: `url("${template.cardUrl || template.hoverImageUrl}"), url("${template.thumbUrl}")`,
          }}
        />
      ) : (
        <div className="absolute inset-0 animate-pulse" />
      )}
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10" />
    </div>
  );
}
