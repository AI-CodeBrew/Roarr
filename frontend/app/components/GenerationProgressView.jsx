import { Check, ListChecks, LoaderCircle, Sparkles } from "lucide-react";
import { PrimaryButton, StepFrame } from "./RoarrUI.jsx";
import ProductPagePreview from "./ProductPagePreview.jsx";

function PipelineNode({ status }) {
  if (status === "done") {
    return (
      <span className="relative z-10 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#1e3a8a] text-white">
        <Check size={13} strokeWidth={3} />
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="relative z-10 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white text-[#4f46e5] ring-2 ring-[#4f46e5]">
        <LoaderCircle size={14} className="animate-spin" />
      </span>
    );
  }
  return (
    <span className="relative z-10 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white ring-1 ring-inset ring-slate-200">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
    </span>
  );
}

/** Vertical timeline of every phase, with full labels and the live phase highlighted. */
function PipelineCard({ steps, statusForIndex, doneCount }) {
  return (
    <section className="flex-1 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ListChecks size={16} className="text-[#1e40af]" aria-hidden />
          Build pipeline
        </p>
        <span className="rounded-full bg-[#eef3ff] px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-[#1e40af]">
          {doneCount}/{steps.length}
        </span>
      </div>
      <ol
        className="m-0 mt-4 grid list-none gap-x-6 gap-y-3 p-0 sm:grid-flow-col sm:grid-cols-2 sm:[grid-template-rows:repeat(var(--rows),auto)]"
        style={{ "--rows": Math.ceil(steps.length / 2) }}
      >
        {steps.map((step, index) => {
          const status = statusForIndex(index);
          return (
            <li
              key={step.label}
              aria-current={status === "active" ? "step" : undefined}
              className="flex items-start gap-3"
            >
              <PipelineNode status={status} />
              <span
                className={`pt-0.5 text-[13px] leading-snug ${
                  status === "active"
                    ? "font-semibold text-slate-900"
                    : status === "done"
                      ? "text-slate-700"
                      : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * Shared "AI is generating" screen for the store and product flows. Purely presentational:
 * each flow owns its steps, thresholds and tip state and passes them in.
 */
export default function GenerationProgressView({
  steps,
  statusForIndex,
  progress,
  isComplete,
  showError,
  errorMessage,
  onRetry,
  retryDisabled,
  notice = null,
}) {
  const activeIndex = steps.findIndex((_, index) => statusForIndex(index) === "active");
  const activeLabel = activeIndex >= 0 ? steps[activeIndex].label : steps[0]?.label;
  const doneCount = steps.filter((_, index) => statusForIndex(index) === "done").length;
  const currentStepNumber = isComplete ? steps.length : Math.max(activeIndex + 1, 1);

  return (
    <div className="space-y-4">
      {showError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3 ring-1 ring-inset ring-red-200"
        >
          <div className="min-w-0">
            <p className="m-0 text-sm font-semibold text-red-900">API Error</p>
            <p className="m-0 mt-0.5 text-[13px] text-red-800">{errorMessage}</p>
          </div>
          {onRetry ? (
            <PrimaryButton size="sm" onClick={() => onRetry()} disabled={retryDisabled}>
              Retry
            </PrimaryButton>
          ) : null}
        </div>
      ) : null}

      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <StepFrame compact>
            {notice ? (
              <div className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900 ring-1 ring-inset ring-amber-200">
                <Sparkles size={15} className="mt-0.5 flex-none text-amber-600" aria-hidden />
                <div>{notice}</div>
              </div>
            ) : null}
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3">
                <p
                  className="m-0 flex min-w-0 items-center gap-2 text-lg font-bold leading-snug tracking-tight text-slate-900"
                  aria-live="polite"
                >
                  {isComplete ? (
                    "All done!"
                  ) : (
                    <>
                      <Sparkles size={17} className="flex-none animate-pulse text-[#4f46e5]" aria-hidden />
                      <span className="truncate">{activeLabel}…</span>
                    </>
                  )}
                </p>
                <p className="m-0 flex-none text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  {isComplete ? "Finished" : `Step ${currentStepNumber} of ${steps.length}`}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full bg-white ring-1 ring-inset ring-blue-100"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Generation progress"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#1e40af] via-[#4f46e5] to-[#7c3aed] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="w-10 flex-none text-right text-sm font-semibold tabular-nums text-slate-900">
                  {progress}%
                </span>
              </div>
            </div>
          </StepFrame>

          <PipelineCard steps={steps} statusForIndex={statusForIndex} doneCount={doneCount} />
        </div>

        <aside className="hidden lg:block">
          <ProductPagePreview progress={progress} isComplete={isComplete} />
        </aside>
      </div>
    </div>
  );
}
