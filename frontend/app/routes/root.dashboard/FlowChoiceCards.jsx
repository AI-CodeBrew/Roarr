import { ArrowRight, Check } from "lucide-react";
import { FLOW_CHOICE_OPTIONS } from "./flowChoiceOptions.js";
import { FlowTemplateShowcase } from "./ShowcaseArt.jsx";

const CARD_STYLE = {
  product: {
    cta: "Create Product Page",
    tag: "bg-blue-50 text-[#1e40af] ring-blue-200",
    button: "bg-[#1e3a8a] hover:bg-[#172554] focus-visible:ring-[#1e3a8a]",
    showcase: "bg-blue-50",
  },
  store: {
    cta: "Redesign Entire Store",
    tag: "bg-blue-50 text-[#1e40af] ring-blue-200",
    button: "bg-[#1e3a8a] hover:bg-[#172554] focus-visible:ring-[#1e3a8a]",
    showcase: "bg-blue-50",
  },
};

/**
 * Product vs store flow cards, shared by the dashboard home and the onboarding build-type step.
 * `compact` tightens the card padding so the dashboard fits one screen.
 */
export default function FlowChoiceCards({ onChooseType, compact = false }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {FLOW_CHOICE_OPTIONS.map((option) => {
        const style = CARD_STYLE[option.id] || CARD_STYLE.product;
        return (
          <article
            key={option.id}
            className={`grid gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] ${compact ? "sm:p-4" : "sm:p-5"}`}
          >
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <h3 className="text-lg font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                    {option.title}
                  </h3>
                  {option.pillLabel ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${style.tag}`}
                    >
                      {option.pillLabel}
                    </span>
                  ) : null}
                  {option.titleBadge ? (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/25">
                      {option.titleBadge}
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-slate-600">
                {option.description}
              </p>

              <ul className="mt-3 flex flex-col gap-1.5">
                {option.featurePills.map((pill) => (
                  <li key={pill} className="flex items-start gap-2 text-[12.5px] leading-snug text-slate-700">
                    <Check aria-hidden size={14} strokeWidth={3} className="mt-[2px] flex-none text-emerald-600" />
                    {pill}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-3.5">
                <button
                  type="button"
                  onClick={() => onChooseType(option.id)}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto ${style.button}`}
                >
                  {style.cta || option.cta}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="hidden sm:block">
              <FlowTemplateShowcase
                kind={option.id === "store" ? "store" : "product"}
                className={style.showcase}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
