import { useState } from "react";
import { MagicIcon, PublishIcon, SelectIcon } from "./SvgIcons.jsx";
import { GradientText } from "./RoarrUI.jsx";

const STEP_ICONS = { select: SelectIcon, magic: MagicIcon, publish: PublishIcon };

const PRODUCT_STEPS = [
  {
    title: "Choose your product",
    description: "Pick a catalog item and the page style that fits your brand.",
    iconKey: "select",
  },
  {
    title: "Generate copy & layout",
    description: "AI drafts headings, sections, and visuals tuned for conversion.",
    iconKey: "magic",
  },
  {
    title: "Preview & publish",
    description: "Review in the editor, then push a polished page live.",
    iconKey: "publish",
  },
];

const STORE_STEPS = [
  {
    title: "Plan your pages",
    description: "Choose which store pages to build and set the look and feel.",
    iconKey: "select",
  },
  {
    title: "AI builds the experience",
    description: "Cohesive layouts and copy across home, product, and more.",
    iconKey: "magic",
  },
  {
    title: "Review & go live",
    description: "Fine-tune previews, then publish your full store experience.",
    iconKey: "publish",
  },
];

const COPY = {
  product: {
    eyebrow: "AI product page builder",
    titleLead: "Build Product Pages",
    titleAccent: "That Sell",
    subline:
      "A few steps to a high-converting product page with AI copy, layout, and images.",
    primaryLabel: "Create Product Page",
  },
  store: {
    eyebrow: "AI store builder",
    titleLead: "Give Your Store a",
    titleAccent: "Complete Makeover",
    subline:
      "A few steps to a cohesive, AI-built store across the pages that matter.",
    primaryLabel: "Redesign Entire Store",
  },
};

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4 10h11m0 0-4.5-4.5M15 10l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The hub's template in a browser frame (desktop only). Hovering scrolls through the full-page
 * screenshot, which loads on first hover; a soft placeholder holds the frame until the card loads.
 */
function HeroTemplatePreview({ variant, template }) {
  const isStore = variant === "store";
  const [imageReady, setImageReady] = useState(false);
  const [wantsFullPage, setWantsFullPage] = useState(false);

  return (
    <figure
      className="group relative m-0 mx-auto hidden w-full max-w-[360px] md:block"
      onMouseEnter={() => setWantsFullPage(true)}
    >
      {isStore ? (
        <div
          aria-hidden
          className="absolute -right-3 top-6 h-full w-full rotate-[4deg] rounded-2xl bg-blue-100/60 ring-1 ring-blue-200"
        />
      ) : null}
      <div className="relative rotate-[-2deg] rounded-2xl bg-white p-2.5 shadow-[0_24px_48px_-20px_rgba(30,58,138,0.35)] ring-1 ring-slate-200 transition-transform duration-300 group-hover:rotate-0">
        <div aria-hidden className="flex items-center gap-1.5 px-0.5 pb-2">
          <span className="h-2 w-2 rounded-full bg-red-300" />
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          <span className="ml-2 h-2 flex-1 rounded-full bg-slate-100" />
        </div>
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-slate-100">
          {template ? (
            <img
              src={template.thumbUrl}
              alt={`${template.name} template`}
              onLoad={() => setImageReady(true)}
              className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${
                imageReady ? "opacity-100" : "opacity-0"
              }`}
            />
          ) : null}
          {template?.hoverImageUrl && wantsFullPage ? (
            <div
              aria-hidden
              className="absolute inset-0 bg-no-repeat opacity-0 [background-position:50%_0%] [background-size:100%_auto] [transition:opacity_0.3s,background-position_0.8s_ease] group-hover:opacity-100 group-hover:[background-position:50%_100%] group-hover:[transition:opacity_0.3s,background-position_10s_linear] motion-reduce:hidden"
              style={{ backgroundImage: `url("${template.hoverImageUrl}")` }}
            />
          ) : null}
          {!imageReady ? (
            <div
              aria-hidden
              className="absolute inset-0 animate-pulse bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-100"
            />
          ) : null}
        </div>
      </div>
      {template ? (
        <figcaption className="absolute -left-5 bottom-5 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-lg ring-1 ring-black/5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#4f46e5]" />
          {template.name} template
          <span className="text-slate-400">· hover to explore</span>
        </figcaption>
      ) : null}
    </figure>
  );
}

/**
 * Hero for product page / entire store hubs (above {@link PagesTable}).
 * `template` is the flow's template shown on the right: `{ name, thumbUrl, hoverImageUrl }`,
 * or null while it loads.
 * @param {{ variant: "product" | "store"; template?: object | null; onStart: () => void }} props
 */
export default function PagesHubWelcome({ variant, template = null, onStart }) {
  const steps = variant === "store" ? STORE_STEPS : PRODUCT_STEPS;
  const copy = variant === "store" ? COPY.store : COPY.product;

  return (
    <section className="relative w-full min-w-0 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-blue-100/60 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-indigo-50 blur-3xl"
      />

      <div className="relative grid items-center gap-8 p-6 sm:p-8 md:grid-cols-[1.25fr_1fr] md:p-10">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1e40af] ring-1 ring-inset ring-blue-200">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M10 1.5l1.9 5.2 5.6.3-4.4 3.5 1.5 5.4L10 12.8 5.4 15.9l1.5-5.4L2.5 7l5.6-.3L10 1.5z" />
            </svg>
            {copy.eyebrow}
          </span>
          <h1
            className="mt-4 font-bold leading-[1.15] tracking-tight text-slate-900"
            style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.35rem)" }}
          >
            {copy.titleLead} <GradientText>{copy.titleAccent}</GradientText>
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-600">
            {copy.subline}
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a8a] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(30,58,138,0.7)] transition hover:bg-[#172554] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2 sm:w-auto"
            >
              {copy.primaryLabel}
              <ArrowRightIcon />
            </button>
          </div>
        </div>

        <HeroTemplatePreview variant={variant} template={template} />
      </div>

      <ol className="relative m-0 grid list-none gap-2 border-t border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-3 sm:gap-4 sm:p-5 md:px-10">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[step.iconKey] || SelectIcon;
          return (
            <li key={step.title} className="flex min-w-0 items-start gap-3 rounded-2xl p-2">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-blue-100">
                <Icon size={22} color="#1e40af" />
              </span>
              <div className="min-w-0">
                <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-[#4f46e5]">
                  Step {index + 1}
                </p>
                <p className="m-0 text-sm font-semibold text-slate-900">{step.title}</p>
                <p className="m-0 mt-0.5 text-xs leading-relaxed text-slate-500">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
