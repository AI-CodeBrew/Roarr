import { useCallback, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";

const LS_DISMISSED = "kluck_setup_guide_dismissed";

/** @returns {boolean} */
function readFlag(key) {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function setFlag(key) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

const primaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1e3a8a] px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#172554] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2";
const secondaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]";

/**
 * One-row "next step" banner shown while setup is unfinished.
 * @param {{
 *   isEmbedEnabled: boolean | null,
 *   pageCount: number,
 *   onOpenThemeAppEmbeds: () => void,
 *   onRecheck: () => void,
 *   onCreateProductPage: () => void,
 *   onRevampEntireStore: () => void,
 * }} props
 */
export default function DashboardSetupGuide({
  isEmbedEnabled,
  pageCount,
  onOpenThemeAppEmbeds,
  onRecheck,
  onCreateProductPage,
  onRevampEntireStore,
}) {
  const [dismissed, setDismissed] = useState(() => readFlag(LS_DISMISSED));

  const embedDone = isEmbedEnabled === true;
  const pagesDone = pageCount > 0;
  const completedCount = Number(embedDone) + Number(pagesDone);
  const totalSteps = 2;

  const dismissGuide = useCallback(() => {
    setFlag(LS_DISMISSED);
    setDismissed(true);
  }, []);

  if (dismissed || completedCount === totalSteps) {
    return null;
  }

  const step = !embedDone
    ? {
        title: "Turn on Roarr in your theme",
        hint: (
          <>
            Open the theme editor, switch on <strong>Roarr Theme Extension</strong>, then click{" "}
            <strong>Save</strong>.
          </>
        ),
        actions: (
          <>
            <button type="button" className={primaryButtonClass} onClick={onOpenThemeAppEmbeds}>
              Open theme editor
              <ArrowUpRight size={15} />
            </button>
            <button type="button" className={secondaryButtonClass} onClick={onRecheck}>
              I&apos;ve saved it — recheck
            </button>
          </>
        ),
      }
    : {
        title: "Build your first Roarr page",
        hint: "Create one product page, or redesign your whole store.",
        actions: (
          <>
            <button type="button" className={primaryButtonClass} onClick={onCreateProductPage}>
              Create Product Page
            </button>
            <button type="button" className={secondaryButtonClass} onClick={onRevampEntireStore}>
              Redesign Entire Store
            </button>
          </>
        ),
      };

  return (
    <section className="relative flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl bg-white py-3 pl-4 pr-12 shadow-sm ring-1 ring-slate-200/70">
      <span
        className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[11px] font-semibold text-[#1e3a8a] ring-2 ring-inset ring-blue-200"
        title={`${completedCount} of ${totalSteps} setup steps done`}
      >
        {completedCount}/{totalSteps}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">
          <span className="font-medium text-slate-500">Next step: </span>
          {step.title}
        </p>
        <p className="text-xs text-slate-500">{step.hint}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">{step.actions}</div>
      <button
        type="button"
        onClick={dismissGuide}
        aria-label="Dismiss setup guide"
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 sm:top-1/2 sm:-translate-y-1/2 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]"
      >
        <X size={16} />
      </button>
    </section>
  );
}
