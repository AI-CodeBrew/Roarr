import { Check, CircleCheck, ExternalLink, LoaderCircle, Rocket, X } from "lucide-react";
import { Panel, StepFrame } from "./RoarrUI.jsx";

function PublishStepIcon({ status, disabled, number }) {
  if (disabled) {
    return (
      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/70 text-[11px] font-semibold text-slate-400 ring-1 ring-inset ring-slate-200">
        {number}
      </span>
    );
  }
  if (status === "done") {
    return (
      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#1e3a8a] text-white">
        <Check size={13} strokeWidth={3} />
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white text-[#4f46e5] ring-1 ring-inset ring-indigo-200">
        <LoaderCircle size={14} className="animate-spin" />
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white text-[11px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
      {number}
    </span>
  );
}

function PublishIllustration({ isPublishing, isDone }) {
  if (isDone) {
    return (
      <div className="flex flex-col items-center gap-3">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_16px_36px_-12px_rgba(5,150,105,0.65)]">
          <Check size={46} className="text-white" strokeWidth={3} />
        </span>
        <p className="m-0 text-base font-semibold text-slate-900">Published!</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="relative flex h-24 w-24 items-center justify-center">
        {isPublishing ? (
          <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-indigo-300/40" />
        ) : null}
        <span
          className={`relative flex h-24 w-24 items-center justify-center rounded-full shadow-lg ${
            isPublishing
              ? "bg-gradient-to-br from-[#1e40af] via-[#4f46e5] to-[#7c3aed]"
              : "bg-gradient-to-br from-slate-300 to-slate-400"
          }`}
        >
          <Rocket size={42} className={`text-white ${isPublishing ? "animate-bounce" : ""}`} />
        </span>
      </span>
      <p className="m-0 text-base font-semibold text-slate-900">
        {isPublishing ? "Pushing..." : "Ready to Push"}
      </p>
    </div>
  );
}

/**
 * Shared "Publish to Shopify" body for the store and product flows. Purely presentational:
 * each flow owns the publish call, step timer and the bottom action buttons.
 */
export default function PublishProgressView({
  title,
  description,
  hint = null,
  beforeProgress = null,
  steps,
  statusForIndex,
  isPublishing,
  isDone,
  successMessage,
  successLink = null,
  infoTitle,
  infoItems,
  error,
  errorTitle,
  onDismissError,
}) {
  const isIdle = !isPublishing && !isDone;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#1e3a8a] text-sm font-semibold text-white shadow-sm">
          {isDone ? <Check size={16} strokeWidth={3} /> : 4}
        </span>
        <div className="min-w-0">
          <h2 className="m-0 text-lg font-bold leading-tight tracking-tight text-slate-900">{title}</h2>
          <p className="m-0 mt-0.5 text-[13px] text-slate-500">{description}</p>
        </div>
      </div>

      {hint ? (
        <p className="m-0 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900 ring-1 ring-inset ring-amber-200">
          {hint}
        </p>
      ) : null}

      {beforeProgress}

      <StepFrame>
        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Pushing to Shopify Progress
        </p>
        <div className="mt-4 grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <ol className="m-0 list-none space-y-2.5 p-0">
            {steps.map((label, index) => {
              const status = statusForIndex(index);
              return (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <PublishStepIcon status={status} disabled={isIdle} number={index + 1} />
                  <span
                    className={
                      isIdle || status === "todo"
                        ? "text-slate-400"
                        : status === "active"
                          ? "font-semibold text-slate-900"
                          : "text-slate-700"
                    }
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="hidden h-full min-h-[200px] items-center justify-center rounded-2xl bg-white/70 ring-1 ring-inset ring-blue-100 lg:flex">
            <PublishIllustration isPublishing={isPublishing} isDone={isDone} />
          </div>
        </div>
      </StepFrame>

      {isDone ? (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-inset ring-emerald-200">
            <CircleCheck size={20} className="mt-0.5 flex-none text-emerald-600" aria-hidden />
            <div>
              <p className="m-0 text-sm font-semibold text-emerald-900">Pushed to Shopify Successfully!</p>
              <p className="m-0 mt-0.5 text-[13px] text-emerald-800">{successMessage}</p>
            </div>
          </div>
          {successLink ? (
            <a
              href={successLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a8a] px-5 py-2.5 text-sm font-semibold text-white no-underline shadow-[0_10px_24px_-10px_rgba(30,58,138,0.7)] transition hover:bg-[#172554] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2"
            >
              {successLink.label}
              <ExternalLink size={15} aria-hidden />
            </a>
          ) : null}
        </div>
      ) : null}

      <Panel title={infoTitle}>
        <ul className="m-0 list-none space-y-2 p-0">
          {infoItems.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[13px] leading-relaxed text-slate-600">
              <Check size={14} strokeWidth={3} className="mt-1 flex-none text-[#4f46e5]" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </Panel>

      {error ? (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3 ring-1 ring-inset ring-red-200"
        >
          <div className="min-w-0">
            <p className="m-0 text-sm font-semibold text-red-900">{errorTitle}</p>
            <p className="m-0 mt-0.5 text-[13px] text-red-800">{error}</p>
          </div>
          <button
            type="button"
            onClick={onDismissError}
            className="inline-flex flex-none items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-semibold text-red-800 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <X size={14} aria-hidden />
            Dismiss
          </button>
        </div>
      ) : null}
    </div>
  );
}
